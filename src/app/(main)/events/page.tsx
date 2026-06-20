import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Calendar, ChevronRight, Radio } from 'lucide-react'

export const revalidate = 60

export default async function EventsPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: events } = await supabase
    .from('featured_events')
    .select('*, event_channels(count)')
    .eq('is_active', true)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('starts_at', { ascending: true })

  const live = (events || []).filter(e => {
    if (!e.starts_at) return true
    return new Date(e.starts_at) <= new Date()
  })
  const upcoming = (events || []).filter(e => {
    if (!e.starts_at) return false
    return new Date(e.starts_at) > new Date()
  })

  return (
    <div className="space-y-8">
      <h1 className="text-white font-bold text-xl flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-400" />
        Eventos Especiales
      </h1>

      {(events || []).length === 0 && (
        <div className="text-center py-24">
          <Trophy className="h-14 w-14 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No hay eventos activos en este momento</p>
          <p className="text-zinc-600 text-sm mt-1">Los eventos se agregan desde el panel de administración</p>
        </div>
      )}

      {live.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-500 animate-pulse" />
            En Vivo Ahora
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {live.map(event => <EventCard key={event.id} event={event} isLive />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            Próximamente
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map(event => <EventCard key={event.id} event={event} isLive={false} />)}
          </div>
        </section>
      )}

      {/* Quick link */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p className="text-zinc-300 text-sm font-medium">¿Eres admin?</p>
          <p className="text-zinc-600 text-xs mt-0.5">Crea y gestiona eventos desde el panel</p>
        </div>
        <Link href="/admin/events" className="flex items-center gap-1 text-red-400 text-sm hover:text-red-300 transition-colors">
          Panel admin <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

function EventCard({ event, isLive }: { event: { id: string; name: string; slug: string; description: string | null; banner_url: string | null; color: string; starts_at: string | null; event_channels: { count: number }[] }, isLive: boolean }) {
  const channelCount = event.event_channels?.[0]?.count || 0

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <div className={`relative rounded-xl overflow-hidden border transition-all group-hover:border-zinc-600 ${isLive ? 'border-red-600/60' : 'border-zinc-800'}`}>
        {/* Banner */}
        <div className="aspect-video relative bg-zinc-900" style={{ backgroundColor: event.color + '22' }}>
          {event.banner_url ? (
            <Image src={event.banner_url} alt={event.name} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" sizes="(max-width: 640px) 100vw, 33vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="h-16 w-16 opacity-20" style={{ color: event.color }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              EN VIVO
            </div>
          )}
          {!isLive && event.starts_at && (
            <div className="absolute top-3 left-3 bg-zinc-900/90 text-zinc-300 text-xs px-2 py-1 rounded-full">
              {new Date(event.starts_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 bg-zinc-900">
          <h3 className="text-white font-bold text-base group-hover:text-red-400 transition-colors">{event.name}</h3>
          {event.description && <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{event.description}</p>}
          <p className="text-zinc-600 text-xs mt-2">{channelCount} canal{channelCount !== 1 ? 'es' : ''} disponible{channelCount !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </Link>
  )
}
