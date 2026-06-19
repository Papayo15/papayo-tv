'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { WifiOff, RefreshCw, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  src: string
  title?: string
  className?: string
  autoplay?: boolean
  onError?: () => void
  onPlay?: () => void
}

type PlayerState = 'loading' | 'playing' | 'error' | 'cors-blocked'

export function VideoPlayer({ src, title, className, autoplay = true, onError, onPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [state, setState] = useState<PlayerState>('loading')
  const errorTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setState('loading')

    // Clear error timer
    if (errorTimer.current) clearTimeout(errorTimer.current)

    // Mark as error if nothing plays in 8 seconds
    errorTimer.current = setTimeout(() => {
      if (state === 'loading') setState('error')
    }, 8000)

    function cleanup() {
      hlsRef.current?.destroy()
      hlsRef.current = null
      if (errorTimer.current) clearTimeout(errorTimer.current)
    }

    cleanup()

    const isHLS = src.includes('.m3u8') || src.includes('m3u8')

    if (isHLS && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        fragLoadingTimeOut: 10000,
        manifestLoadingTimeOut: 10000,
      })
      hlsRef.current = hls

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setState('cors-blocked')
          } else {
            setState('error')
          }
          onError?.()
        }
      })

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay) video.play().catch(() => setState('error'))
      })

      hls.loadSource(src)
      hls.attachMedia(video)
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = src
      if (autoplay) video.play().catch(() => setState('error'))
    } else {
      // Direct MP4 or other
      video.src = src
      if (autoplay) video.play().catch(() => setState('error'))
    }

    video.onplaying = () => {
      setState('playing')
      if (errorTimer.current) clearTimeout(errorTimer.current)
      onPlay?.()
    }

    video.onerror = () => {
      setState('error')
      onError?.()
    }

    return cleanup
  }, [src]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleRetry() {
    setState('loading')
    const video = videoRef.current
    if (video) {
      video.load()
      video.play().catch(() => setState('error'))
    }
  }

  function handleFullscreen() {
    videoRef.current?.requestFullscreen()
  }

  return (
    <div className={cn('relative bg-black rounded-lg overflow-hidden group', className)}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        controls={state === 'playing'}
      />

      {/* Loading */}
      {state === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
          <div className="h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Cargando señal{title ? ` — ${title}` : ''}...</p>
        </div>
      )}

      {/* Error / CORS blocked */}
      {(state === 'error' || state === 'cors-blocked') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 p-4">
          <WifiOff className="h-10 w-10 text-zinc-600" />
          <div className="text-center">
            <p className="text-white font-medium text-sm">
              {state === 'cors-blocked' ? 'Señal no disponible' : 'Error de reproducción'}
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              {state === 'cors-blocked'
                ? 'Este canal no permite reproducción desde el navegador'
                : 'No se pudo conectar a la señal'}
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </button>
        </div>
      )}

      {/* Fullscreen button overlay */}
      {state === 'playing' && (
        <button
          onClick={handleFullscreen}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
