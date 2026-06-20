import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Trophy, Radio } from 'lucide-react'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('featured_events')
    .select('*, event_channels(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!event) notFound()

  const channels = (event.event_channels || []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)

  const isLive = !event.starts_at || new Date(event.starts_at) <= new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${event.color}33, transparent)` }}>
        {event.banner_url && (
          <div className="absolute inset-0">
            <Image src={event.banner_url} alt={event.name} fill className="object-cover opacity-20" sizes="100vw" />
          </div>
        )}
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="h-6 w-6" style={{ color: event.color }} />
            {isLive && (
              <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <Radio className="h-3 w-3" />
                EN VIVO
              </span>
            )}
          </div>
          <h1 className="text-white font-bold text-2xl md:text-3xl">{event.name}</h1>
          {event.description && <p className="text-zinc-400 mt-2 max-w-xl">{event.description}</p>}
          {event.starts_at && (
            <p className="text-zinc-500 text-sm mt-2">
              {new Date(event.starts_at).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {/* Channels */}
      {channels.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No hay canales configurados para este evento</p>
        </div>
      ) : channels.length === 1 ? (
        // Single channel — full width player
        <div className="space-y-3">
          <h2 className="text-white font-semibold">{channels[0].name}</h2>
          <VideoPlayer src={channels[0].url} title={channels[0].name} className="aspect-video w-full rounded-xl" />
        </div>
      ) : (
        // Multiple channels — grid
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">{channels.length} señales disponibles — elige la que prefieras</p>
          <div className={`grid gap-4 ${channels.length === 2 ? 'md:grid-cols-2' : channels.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-2'}`}>
            {channels.map((ch: { id: string; name: string; url: string; logo: string | null }) => (
              <div key={ch.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                  {ch.logo && (
                    <Image src={ch.logo} alt={ch.name} width={24} height={24} className="object-contain" />
                  )}
                  <span className="text-white text-sm font-medium truncate">{ch.name}</span>
                  <span className="ml-auto h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                </div>
                <VideoPlayer src={ch.url} title={ch.name} className="aspect-video" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
