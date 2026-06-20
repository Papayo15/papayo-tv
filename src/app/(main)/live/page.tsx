'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChannelCard, type EpgProgram } from '@/components/channel/ChannelCard'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import type { Channel, ChannelStatus } from '@/types/channel'
import { Search, Tv, CalendarDays, Volume2, VolumeX } from 'lucide-react'

const COUNTRIES = [
  { code: 'all', label: 'Todos' },
  // LatAm
  { code: 'mx', label: '🇲🇽 México' },
  { code: 'ar', label: '🇦🇷 Argentina' },
  { code: 'co', label: '🇨🇴 Colombia' },
  { code: 'br', label: '🇧🇷 Brasil' },
  { code: 'cl', label: '🇨🇱 Chile' },
  { code: 'pe', label: '🇵🇪 Perú' },
  { code: 've', label: '🇻🇪 Venezuela' },
  { code: 'ec', label: '🇪🇨 Ecuador' },
  { code: 'bo', label: '🇧🇴 Bolivia' },
  { code: 'py', label: '🇵🇾 Paraguay' },
  { code: 'uy', label: '🇺🇾 Uruguay' },
  { code: 'cr', label: '🇨🇷 Costa Rica' },
  { code: 'do', label: '🇩🇴 R. Dominicana' },
  // Europa
  { code: 'es', label: '🇪🇸 España' },
  { code: 'pt', label: '🇵🇹 Portugal' },
  { code: 'gb', label: '🇬🇧 Reino Unido' },
  { code: 'it', label: '🇮🇹 Italia' },
  { code: 'fr', label: '🇫🇷 Francia' },
  { code: 'de', label: '🇩🇪 Alemania' },
  { code: 'nl', label: '🇳🇱 Holanda' },
  // Otros
  { code: 'us', label: '🇺🇸 EE.UU.' },
  { code: 'ca', label: '🇨🇦 Canadá' },
  { code: 'int', label: '🌐 Internacional' },
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
  const [audioOn, setAudioOn] = useState(false)
  const [channelStatuses, setChannelStatuses] = useState<Record<string, ChannelStatus>>({})
  const [epgData, setEpgData] = useState<Record<string, EpgProgram>>({})
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [category, setCategory] = useState('all')
  const [showOffline, setShowOffline] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase.from('channels').select('*').eq('is_active', true).order('name')
      if (country !== 'all') query = query.eq('country', country)
      if (category !== 'all') {
        const nameFilters: Record<string, string> = {
          sports: 'category.eq.sports,name.ilike.%sport%,name.ilike.%ESPN%,name.ilike.%Fox Sport%,name.ilike.%deport%,name.ilike.%beIN%,name.ilike.%TyC%,name.ilike.%DSport%,name.ilike.%Win Sport%',
          news: 'category.eq.news,name.ilike.%news%,name.ilike.%notic%,name.ilike.%CNN%,name.ilike.%BBC%,name.ilike.%24 Horas%',
          movies: 'category.eq.movies,name.ilike.%cine%,name.ilike.%movie%,name.ilike.%pelicula%,name.ilike.%film%',
          kids: 'category.eq.kids,name.ilike.%kids%,name.ilike.%niños%,name.ilike.%junior%,name.ilike.%cartoon%,name.ilike.%disney%',
          entertainment: 'category.eq.entertainment,name.ilike.%MTV%,name.ilike.%comedy%,name.ilike.%entrete%',
        }
        const filter = nameFilters[category]
        if (filter) query = query.or(filter)
        else query = query.eq('category', category)
      }
      const { data } = await query.limit(500)
      const loaded = data || []
      setChannels(loaded)
      setLoading(false)

      // Load EPG for visible channels that have a tvg_id
      const tvgIds = loaded
        .map((c: Channel & { tvg_id?: string }) => c.tvg_id)
        .filter(Boolean)
        .slice(0, 100)

      if (tvgIds.length > 0) {
        try {
          const res = await fetch(`/api/epg?ids=${tvgIds.join(',')}`)
          if (res.ok) setEpgData(await res.json())
        } catch {
          // EPG not critical
        }
      }
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

  const selectedEpg = selected
    ? epgData[(selected as Channel & { tvg_id?: string }).tvg_id || '']
    : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
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
            {selectedEpg && (
              <span className="ml-2 text-zinc-400 text-xs flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {selectedEpg.title}
              </span>
            )}
            <button
              onClick={() => setAudioOn(v => !v)}
              className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              {audioOn
                ? <><Volume2 className="h-3.5 w-3.5 text-green-400" /><span className="text-green-400">Con audio</span></>
                : <><VolumeX className="h-3.5 w-3.5 text-zinc-400" /><span className="text-zinc-400">Sin audio</span></>}
            </button>
          </div>
          <VideoPlayer
            src={selected.url}
            title={selected.name}
            className="aspect-video"
            muted={!audioOn}
            onError={() => handleChannelError(selected.id)}
            onPlay={() => handleChannelPlay(selected.id)}
          />
          {selectedEpg && (
            <div className="px-4 py-3 border-t border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="text-zinc-300 font-medium">{selectedEpg.title}</span>
                <span>
                  {new Date(selectedEpg.start_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {new Date(selectedEpg.end_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {selectedEpg.description && (
                <p className="text-zinc-500 text-xs line-clamp-2">{selectedEpg.description}</p>
              )}
              {/* Progress bar */}
              <div className="w-full h-1 bg-zinc-800 rounded-full mt-2">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((Date.now() - new Date(selectedEpg.start_time).getTime()) / (new Date(selectedEpg.end_time).getTime() - new Date(selectedEpg.start_time).getTime())) * 100))}%`
                  }}
                />
              </div>
            </div>
          )}
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
            <Skeleton key={i} className="h-28 rounded-xl bg-zinc-800" />
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
            {filtered.map(channel => {
              const ch = channel as Channel & { tvg_id?: string }
              return (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  status={channelStatuses[channel.id]}
                  isSelected={selected?.id === channel.id}
                  currentProgram={ch.tvg_id ? epgData[ch.tvg_id] : undefined}
                  onClick={() => { setSelected(channel); setAudioOn(false) }}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
