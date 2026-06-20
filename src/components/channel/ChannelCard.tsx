'use client'

import Image from 'next/image'
import { Tv, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Channel, ChannelStatus } from '@/types/channel'
import { Badge } from '@/components/ui/badge'

const CATEGORY_LABELS: Record<string, string> = {
  sports: 'Deportes',
  news: 'Noticias',
  movies: 'Películas',
  kids: 'Infantil',
  music: 'Música',
  documentary: 'Documentales',
  entertainment: 'Entretenimiento',
  other: 'General',
}

export interface EpgProgram {
  title: string
  description: string
  thumbnail: string
  start_time: string
  end_time: string
}

interface ChannelCardProps {
  channel: Channel
  status?: ChannelStatus
  isSelected?: boolean
  currentProgram?: EpgProgram
  onClick?: () => void
}

function timeProgress(start: string, end: string): number {
  const now = Date.now()
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100))
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export function ChannelCard({ channel, status = 'unknown', isSelected, currentProgram, onClick }: ChannelCardProps) {
  const isOffline = status === 'error' || status === 'cors-blocked' || status === 'offline'

  return (
    <button
      onClick={onClick}
      disabled={isOffline}
      className={cn(
        'group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-left w-full',
        isSelected
          ? 'border-red-500 bg-red-950/30'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800',
        isOffline && 'opacity-40 cursor-not-allowed'
      )}
    >
      {/* Logo */}
      <div className="relative h-10 w-full flex items-center justify-center">
        {channel.logo ? (
          <Image
            src={channel.logo}
            alt={channel.name}
            width={64}
            height={40}
            className="object-contain max-h-10 w-auto"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <Tv className="h-8 w-8 text-zinc-600" />
        )}
      </div>

      {/* Name */}
      <p className="text-zinc-300 text-xs font-medium text-center line-clamp-2 leading-tight">
        {channel.name}
      </p>

      {/* Current program */}
      {currentProgram ? (
        <div className="w-full space-y-1">
          <p className="text-[10px] text-zinc-400 line-clamp-1 text-center leading-tight">
            {currentProgram.title}
          </p>
          <p className="text-[10px] text-zinc-600 text-center">
            {formatTime(currentProgram.start_time)} – {formatTime(currentProgram.end_time)}
          </p>
          {/* Progress bar */}
          <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${timeProgress(currentProgram.start_time, currentProgram.end_time)}%` }}
            />
          </div>
        </div>
      ) : (
        <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 px-1.5 py-0">
          {CATEGORY_LABELS[channel.category] || 'General'}
        </Badge>
      )}

      {/* Status indicators */}
      {isOffline && (
        <div className="absolute top-1.5 right-1.5">
          <WifiOff className="h-3 w-3 text-zinc-600" />
        </div>
      )}
      {isSelected && !isOffline && (
        <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </button>
  )
}
