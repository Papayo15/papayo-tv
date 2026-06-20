import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Trophy, Clock, Radio, Tv } from 'lucide-react'
import Image from 'next/image'
import type { SportsEvent } from '@/types/content'
import type { Channel } from '@/types/channel'

export const revalidate = 300

export default async function SportsPage() {
  const supabase = await createClient()

  const [{ data: events }, { data: sportsChannels }] = await Promise.all([
    supabase
      .from('sports_events')
      .select('*')
      .order('is_live', { ascending: false })
      .order('starts_at', { ascending: true }),
    supabase
      .from('channels')
      .select('*')
      .eq('category', 'sports')
      .eq('is_active', true)
      .order('name'),
  ])

  const live = (events || []).filter((e: SportsEvent) => e.is_live)
  const upcoming = (events || []).filter((e: SportsEvent) => !e.is_live)
  const channels = (sportsChannels || []) as Channel[]

  const hasContent = live.length > 0 || upcoming.length > 0 || channels.length > 0

  return (
    <div className="space-y-8">
      <h1 className="text-white font-bold text-xl flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-400" />
        Deportes
      </h1>

      {!hasContent && (
        <div className="text-center py-20">
          <Trophy className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No hay contenido deportivo disponible</p>
          <p className="text-zinc-600 text-sm mt-1">Sincroniza los canales desde el panel de administración</p>
        </div>
      )}

      {live.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-500 animate-pulse" />
            En Vivo Ahora
          </h2>
          <div className="grid gap-4">
            {live.map((event: SportsEvent) => (
              <EventCard key={event.id} event={event} isLive />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            Próximos Partidos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((event: SportsEvent) => (
              <EventCard key={event.id} event={event} isLive={false} />
            ))}
          </div>
        </section>
      )}

      {channels.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Tv className="h-4 w-4 text-green-400" />
            Canales Deportivos ({channels.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {channels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ChannelCard({ channel }: { channel: Channel }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2 hover:border-zinc-600 transition-colors">
      <div className="flex items-center gap-2">
        {channel.logo ? (
          <div className="w-8 h-8 relative shrink-0">
            <Image src={channel.logo} alt={channel.name} fill className="object-contain" sizes="32px" />
          </div>
        ) : (
          <Tv className="h-5 w-5 text-zinc-500 shrink-0" />
        )}
        <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{channel.name}</p>
      </div>
      <VideoPlayer
        src={channel.url}
        title={channel.name}
        className="aspect-video w-full rounded-lg"
      />
    </div>
  )
}

function EventCard({ event, isLive }: { event: SportsEvent; isLive: boolean }) {
  const startsAt = event.starts_at ? new Date(event.starts_at) : null
  const timeStr = startsAt
    ? startsAt.toLocaleString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className={`bg-zinc-900 border rounded-xl overflow-hidden ${isLive ? 'border-red-600/50' : 'border-zinc-800'}`}>
      {event.poster_url && (
        <div className="relative aspect-video bg-zinc-800">
          <Image src={event.poster_url} alt={event.name} fill className="object-cover opacity-70" sizes="(max-width: 640px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent" />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-zinc-500 text-xs">{event.league} · {event.sport}</p>
            <h3 className="text-white font-semibold text-sm mt-0.5">{event.name}</h3>
            {event.home_team && event.away_team && (
              <p className="text-zinc-400 text-xs mt-1">{event.home_team} vs {event.away_team}</p>
            )}
          </div>
          {isLive && (
            <span className="shrink-0 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-medium animate-pulse">
              EN VIVO
            </span>
          )}
        </div>
        {timeStr && (
          <p className="text-zinc-500 text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeStr}
          </p>
        )}
        {isLive && event.channel_url && (
          <VideoPlayer src={event.channel_url} title={event.name} className="aspect-video w-full rounded-lg" />
        )}
      </div>
    </div>
  )
}
