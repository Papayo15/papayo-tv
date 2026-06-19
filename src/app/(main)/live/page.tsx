'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChannelCard } from '@/components/channel/ChannelCard'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import type { Channel, ChannelStatus } from '@/types/channel'
import { Search, Tv } from 'lucide-react'

const COUNTRIES = [
  { code: 'all', label: 'Todos' },
  { code: 'mx', label: '🇲🇽 México' },
  { code: 'es', label: '🇪🇸 España' },
  { code: 'us', label: '🇺🇸 EE.UU.' },
  { code: 'ar', label: '🇦🇷 Argentina' },
  { code: 'co', label: '🇨🇴 Colombia' },
  { code: 'br', label: '🇧🇷 Brasil' },
  { code: 'cl', label: '🇨🇱 Chile' },
]

const CATEGORIES = [
  { code: 'all', label: 'Todos' },
  { code: 'sports', label: '⚽ Deportes' },
  { code: 'news', label: '📰 Noticias' },
  { code: 'movies', label: '🎬 Películas' },
  { code: 'kids', label: '🧸 Infantil' },
  { code: 'entertainment', label: '🎭 Entretenimiento' },
]

export default function LivePage() {
  const supabase = createClient()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Channel | null>(null)
  const [channelStatuses, setChannelStatuses] = useState<Record<string, ChannelStatus>>({})
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [category, setCategory] = useState('all')
  const [showOffline, setShowOffline] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase.from('channels').select('*').eq('is_active', true).order('name')

      if (country !== 'all') query = query.eq('country', country)
      if (category !== 'all') query = query.eq('category', category)

      const { data } = await query.limit(500)
      setChannels(data || [])
      setLoading(false)
    }
    load()
  }, [country, category]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChannelError = useCallback((channelId: string) => {
    setChannelStatuses(prev => ({ ...prev, [channelId]: 'cors-blocked' }))
  }, [])

  const handleChannelPlay = useCallback((channelId: string) => {
    setChannelStatuses(prev => ({ ...prev, [channelId]: 'online' }))
  }, [])

  const filtered = channels.filter(c => {
    const status = channelStatuses[c.id]
    const isOffline = status === 'cors-blocked' || status === 'offline'
    if (!showOffline && isOffline) return false
    if (search) return c.name.toLowerCase().includes(search.toLowerCase())
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Tv className="h-5 w-5 text-red-500" />
          TV en Vivo
        </h1>
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showOffline}
            onChange={e => setShowOffline(e.target.checked)}
            className="rounded"
          />
          Mostrar canales caídos
        </label>
      </div>

      {/* Player */}
      {selected && (
        <div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-medium">{selected.name}</span>
          </div>
          <VideoPlayer
            src={selected.url}
            title={selected.name}
            className="aspect-video"
            onError={() => handleChannelError(selected.id)}
            onPlay={() => handleChannelPlay(selected.id)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar canal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />
        </div>

        <Tabs value={country} onValueChange={setCountry}>
          <TabsList className="bg-zinc-900 h-auto flex-wrap gap-1 p-1">
            {COUNTRIES.map(c => (
              <TabsTrigger key={c.code} value={c.code} className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="bg-zinc-900 h-auto flex-wrap gap-1 p-1">
            {CATEGORIES.map(c => (
              <TabsTrigger key={c.code} value={c.code} className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Channel grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Tv className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No se encontraron canales</p>
          {channels.length === 0 && (
            <p className="text-zinc-600 text-xs mt-1">
              El admin debe ejecutar la sincronización de canales desde el panel
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-zinc-500 text-xs">{filtered.length} canales disponibles</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filtered.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                status={channelStatuses[channel.id]}
                isSelected={selected?.id === channel.id}
                onClick={() => setSelected(channel)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
