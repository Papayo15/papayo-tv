'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { WifiOff, RefreshCw, Maximize2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  src: string
  fallbacks?: string[]   // backup URLs tried in order when primary fails
  title?: string
  className?: string
  autoplay?: boolean
  muted?: boolean
  onError?: () => void
  onPlay?: () => void
}

type PlayerState = 'loading' | 'playing' | 'error' | 'blocked'

function proxyUrl(u: string) {
  return `/api/proxy/stream?url=${encodeURIComponent(u)}`
}

// Xtream-Codes /user/pass/ID → /live/user/pass/ID.m3u8
function toHlsUrl(url: string): string {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length === 3 && /^\d+$/.test(parts[2])) {
      return `${u.protocol}//${u.host}/live/${parts[0]}/${parts[1]}/${parts[2]}.m3u8`
    }
  } catch { /* ignore */ }
  return url
}

function isHls(url: string) {
  return /\.m3u8/i.test(url) || url.includes('/api/proxy/') || url.includes('/live/')
}

// On HTTPS pages, HTTP streams are blocked by mixed-content — skip direct and proxy immediately
function needsProxyImmediately(url: string) {
  if (typeof window === 'undefined') return false
  return window.location.protocol === 'https:' && url.startsWith('http://')
}

export function VideoPlayer({
  src, fallbacks = [], title, className, autoplay = true, muted = true, onError, onPlay,
}: VideoPlayerProps) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const hlsRef     = useRef<Hls | null>(null)
  const [state, setState]         = useState<PlayerState>('loading')
  const [usingProxy, setUsingProxy] = useState(false)
  const [activeUrl, setActiveUrl]   = useState(src)
  const attemptRef  = useRef({ proxy: false, fallbackIdx: 0 })
  const timerRef    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current) }

  const advance = useCallback((streamUrl: string, isProxy = false) => {
    const video = videoRef.current
    if (!video) return

    setState('loading')
    clearTimer()
    hlsRef.current?.destroy()
    hlsRef.current = null

    const effective = isProxy ? streamUrl : toHlsUrl(streamUrl)

    // Timeout → try next option
    timerRef.current = setTimeout(() => {
      tryNext()
    }, isProxy ? 14000 : 9000)

    if (isHls(effective) && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        fragLoadingTimeOut: 10000,
        manifestLoadingTimeOut: 8000,
        levelLoadingTimeOut: 8000,
      })
      hlsRef.current = hls

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) { clearTimer(); tryNext() }
      })
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay) video.play().catch(() => {})
      })
      hls.loadSource(effective)
      hls.attachMedia(video)
    } else {
      video.src = effective
      if (autoplay) video.play().catch(() => {})
    }

    video.onplaying = () => {
      clearTimer()
      setState('playing')
      onPlay?.()
    }
    video.onerror = () => { clearTimer(); tryNext() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, onPlay])

  // Ordered fallback chain: direct → proxy(direct) → fallback[0] → proxy(fallback[0]) → …
  const tryNext = useCallback(() => {
    const a = attemptRef.current
    const allUrls = [src, ...fallbacks]

    // 1. Try proxy for current URL first
    if (!a.proxy) {
      a.proxy = true
      const cur = allUrls[a.fallbackIdx] ?? src
      setUsingProxy(true)
      advance(proxyUrl(cur), true)
      return
    }

    // 2. Move to next fallback URL
    a.fallbackIdx += 1
    a.proxy = false

    if (a.fallbackIdx < allUrls.length) {
      const next = allUrls[a.fallbackIdx]
      setActiveUrl(next)
      setUsingProxy(false)
      if (needsProxyImmediately(next)) {
        a.proxy = true
        setUsingProxy(true)
        advance(proxyUrl(next), true)
      } else {
        advance(next, false)
      }
      return
    }

    // 3. All options exhausted
    setState('blocked')
    onError?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, fallbacks, advance, onError])

  useEffect(() => {
    attemptRef.current = { proxy: false, fallbackIdx: 0 }
    setUsingProxy(false)
    setActiveUrl(src)
    setState('loading')

    if (needsProxyImmediately(src)) {
      attemptRef.current.proxy = true
      setUsingProxy(true)
      advance(proxyUrl(src), true)
    } else {
      advance(src, false)
    }

    return () => {
      clearTimer()
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  function handleRetry() {
    attemptRef.current = { proxy: false, fallbackIdx: 0 }
    setUsingProxy(false)
    setActiveUrl(src)
    if (needsProxyImmediately(src)) {
      attemptRef.current.proxy = true
      setUsingProxy(true)
      advance(proxyUrl(src), true)
    } else {
      advance(src, false)
    }
  }

  const fallbackCount = fallbacks.length
  const activeName = title

  return (
    <div className={cn('relative bg-black rounded-lg overflow-hidden group', className)}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted={muted}
        controls={state === 'playing'}
      />

      {state === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
          <div className="h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm text-center px-4">
            {usingProxy
              ? 'Conectando via proxy...'
              : `Cargando${activeName ? ` — ${activeName}` : ''}...`}
          </p>
          {fallbackCount > 0 && (
            <p className="text-zinc-600 text-xs">{fallbackCount} señales de respaldo disponibles</p>
          )}
        </div>
      )}

      {state === 'blocked' && !onError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 p-4">
          <Shield className="h-10 w-10 text-orange-500" />
          <div className="text-center">
            <p className="text-white font-medium text-sm">Señal no disponible</p>
            <p className="text-zinc-500 text-xs mt-1">
              {fallbackCount > 0
                ? `Se probaron ${fallbackCount + 1} señales — todas fuera de aire`
                : 'Canal caído, geo-bloqueado o credenciales expiradas'}
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />Reintentar
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 p-4">
          <WifiOff className="h-10 w-10 text-zinc-600" />
          <p className="text-white font-medium text-sm">Señal no disponible</p>
          <button onClick={handleRetry} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />Reintentar
          </button>
        </div>
      )}

      {state === 'playing' && (
        <>
          {usingProxy && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-orange-400 text-xs px-2 py-1 rounded-full">
              <Shield className="h-3 w-3" />proxy
            </div>
          )}
          {fallbackCount > 0 && (
            <div className="absolute bottom-10 right-2 bg-black/50 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {fallbackCount} respaldos
            </div>
          )}
          <button
            onClick={() => videoRef.current?.requestFullscreen()}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  )
}
