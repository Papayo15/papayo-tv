'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { WifiOff, RefreshCw, Maximize2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  src: string
  title?: string
  className?: string
  autoplay?: boolean
  muted?: boolean
  onError?: () => void
  onPlay?: () => void
}

type PlayerState = 'loading' | 'playing' | 'error' | 'blocked'

function proxyUrl(src: string) {
  return `/api/proxy/stream?url=${encodeURIComponent(src)}`
}

// Xtream-Codes URLs: http://host:port/user/pass/12345 → convert to HLS
// Pattern: ends with a numeric ID (no extension) after 3 path segments
function toHlsUrl(url: string): string {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    // /username/password/streamid — 3 parts, last is numeric
    if (parts.length === 3 && /^\d+$/.test(parts[2])) {
      return `${u.protocol}//${u.host}/live/${parts[0]}/${parts[1]}/${parts[2]}.m3u8`
    }
  } catch { /* not a valid URL */ }
  return url
}

function isHlsUrl(url: string) {
  return /\.m3u8/i.test(url) || url.includes('/api/proxy/') || url.includes('/live/')
}

export function VideoPlayer({ src, title, className, autoplay = true, muted = true, onError, onPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [state, setState] = useState<PlayerState>('loading')
  const [usingProxy, setUsingProxy] = useState(false)
  const errorTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const proxyAttempted = useRef(false)

  const loadSrc = useCallback((streamUrl: string, isProxy = false) => {
    const video = videoRef.current
    if (!video) return

    setState('loading')
    if (errorTimer.current) clearTimeout(errorTimer.current)
    hlsRef.current?.destroy()
    hlsRef.current = null

    // Timeout: 10s direct, 15s proxy
    errorTimer.current = setTimeout(() => {
      if (!isProxy && !proxyAttempted.current) {
        proxyAttempted.current = true
        setUsingProxy(true)
        loadSrc(proxyUrl(src), true)
      } else {
        setState('blocked')
        onError?.()
      }
    }, isProxy ? 15000 : 10000)

    // Convert Xtream-Codes URL to HLS format
    const effectiveUrl = isProxy ? streamUrl : toHlsUrl(streamUrl)

    if (isHlsUrl(effectiveUrl) && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        fragLoadingTimeOut: 10000,
        manifestLoadingTimeOut: 8000,
        levelLoadingTimeOut: 8000,
      })
      hlsRef.current = hls

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (!proxyAttempted.current && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            proxyAttempted.current = true
            setUsingProxy(true)
            hls.destroy()
            if (errorTimer.current) clearTimeout(errorTimer.current)
            loadSrc(proxyUrl(src), true)
          } else {
            if (errorTimer.current) clearTimeout(errorTimer.current)
            setState(data.type === Hls.ErrorTypes.NETWORK_ERROR ? 'blocked' : 'error')
            onError?.()
          }
        }
      })

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay) video.play().catch(() => {})
      })

      hls.loadSource(effectiveUrl)
      hls.attachMedia(video)
    } else {
      video.src = effectiveUrl
      if (autoplay) video.play().catch(() => {})
    }

    video.onplaying = () => {
      if (errorTimer.current) clearTimeout(errorTimer.current)
      setState('playing')
      onPlay?.()
    }

    video.onerror = () => {
      if (!proxyAttempted.current) {
        proxyAttempted.current = true
        setUsingProxy(true)
        if (errorTimer.current) clearTimeout(errorTimer.current)
        loadSrc(proxyUrl(src), true)
      } else {
        if (errorTimer.current) clearTimeout(errorTimer.current)
        setState('error')
        onError?.()
      }
    }
  }, [src, autoplay, onError, onPlay]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    proxyAttempted.current = false
    setUsingProxy(false)
    loadSrc(src, false)
    return () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
      if (errorTimer.current) clearTimeout(errorTimer.current)
    }
  }, [src]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleRetry() {
    proxyAttempted.current = false
    setUsingProxy(false)
    loadSrc(src, false)
  }

  function handleForceProxy() {
    proxyAttempted.current = true
    setUsingProxy(true)
    loadSrc(proxyUrl(src), true)
  }

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
          <p className="text-zinc-400 text-sm">
            {usingProxy ? 'Conectando via proxy...' : `Cargando señal${title ? ` — ${title}` : ''}...`}
          </p>
        </div>
      )}

      {state === 'blocked' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 p-4">
          <Shield className="h-10 w-10 text-orange-500" />
          <div className="text-center">
            <p className="text-white font-medium text-sm">Señal no disponible</p>
            <p className="text-zinc-500 text-xs mt-1">Canal caído, geo-bloqueado o credenciales expiradas</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={handleRetry} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-3 py-2 rounded-lg transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />Reintentar
            </button>
            <button onClick={handleForceProxy} className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg transition-colors">
              <Shield className="h-3.5 w-3.5" />Forzar proxy
            </button>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 p-4">
          <WifiOff className="h-10 w-10 text-zinc-600" />
          <div className="text-center">
            <p className="text-white font-medium text-sm">Señal no disponible</p>
            <p className="text-zinc-500 text-xs mt-1">El canal puede estar fuera de aire</p>
          </div>
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
          <button
            onClick={handleForceProxy}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  )
}
