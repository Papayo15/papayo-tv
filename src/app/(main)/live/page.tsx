'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { groupChannels, type ChannelGroup } from '@/lib/groupChannels'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Tv, Volume2, VolumeX, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import type { Channel } from '@/types/channel'

const COUNTRIES = [
  { code: 'all', label: 'Todos' },
  { code: 'mx', label: '🇲🇽 México' },
  { code: 'ar', label: '🇦🇷 Argentina' },
  { code: 'co', label: '🇨🇴 Colombia' },
  { code: 'br', label: '🇧🇷 Brasil' },
  { code: 'cl', label: '🇨🇱 Chile' },
  { code: 'pe', label: '🇵🇪 Perú' },
  { code: 've', label: '🇻🇪 Venezuela' },
  { code: 'ec', label: '🇪🇨 Ecuador' },
  { code: 'us', label: '🇺🇸 EE.UU.' },
  { code: 'es', label: '🇪🇸 España' },
  { code: 'gb', label: '🇬🇧 UK' },
  { code: 'fr', label: '🇫🇷 Francia' },
  { code: 'de', label: '🇩🇪 Alemania' },
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
  const [raw, setRaw] = useState<Channel[]>([])
  const [groups, setGroups] = useState<ChannelGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ChannelGroup | null>(null)
  const [audioOn, setAudioOn] = useState(false)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [category, setCategory] = useState('all')
  const [dead, setDead] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase.from('channels').select('*').eq('is_active', true).order('name')
      if (country !== 'all') query = query.eq('country', country)
      if (category !== 'all') {
        const nameFilters: Record<string, string> = {
          sports: 'category.eq.sports,name.ilike.%sport%,name.ilike.%ESPN%,name.ilike.%Fox Sport%,name.ilike.%deport%,name.ilike.%beIN%,name.ilike.%TyC%',
          news: 'category.eq.news,name.ilike.%news%,name.ilike.%notic%,name.ilike.%CNN%,name.ilike.%BBC%',
          movies: 'category.eq.movies,name.ilike.%cine%,name.ilike.%movie%,name.ilike.%pelicula%',
          kids: 'category.eq.kids,name.ilike.%kids%,name.ilike.%niños%,name.ilike.%junior%,name.ilike.%cartoon%,name.ilike.%disney%',
          entertainment: 'category.eq.entertainment,name.ilike.%MTV%,name.ilike.%comedy%,name.ilike.%entrete%',
        }
        const filter = nameFilters[category]
        if (filter) query = query.or(filter)
        else query = query.eq('category', category)
      }
      const { data } = await query.limit(2000)
      const channels = data || []
      setRaw(channels)
      setGroups(groupChannels(channels))
      setSelected(null)
      setDead(new Set())
      setLoading(false)
    }
    load()
  }, [country, category]) // eslint-disable-line react-hooks/exhaustive-deps

  function markDead(g: ChannelGroup, allFiltered: ChannelGroup[]) {
    setDead(prev => new Set([...prev, g.id]))
    const idx = allFiltered.findIndex(x => x.id === g.id)
    const next = allFiltered.slice(idx + 1).find(x => !dead.has(x.id))
      ?? allFiltered.slice(0, idx).find(x => !dead.has(x.id))
    setSelected(next ?? null)
  }

  const filtered = groups.filter(g => {
    if (dead.has(g.id)) return false
    if (search) return g.name.toLowerCase().includes(search.toLowerCase())
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Tv className="h-5 w-5 text-red-500" />
          TV en Vivo
        </h1>
        {!loading && (
          <span className="text-zinc-500 text-sm">
            {filtered.length} canales · {raw.length} señales
          </span>
        )}
      </div>

      {/* Player */}
      {selected && (() => {
        const idx = filtered.findIndex(g => g.id === selected.id)
        const prev = idx > 0 ? filtered[idx - 1] : null
        const next = idx < filtered.length - 1 ? filtered[idx + 1] : null
        return (
          <div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
            <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2">
              <button
                onClick={() => prev && setSelected(prev)}
                disabled={!prev}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                title={prev?.name}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-white text-sm font-medium truncate flex-1">{selected.name}</span>
              {selected.count > 1 && (
                <span className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full shrink-0">
                  <Layers className="h-2.5 w-2.5" />{selected.count}
                </span>
              )}
              <button
                onClick={() => setAudioOn(v => !v)}
                className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors shrink-0"
              >
                {audioOn
                  ? <><Volume2 className="h-3.5 w-3.5 text-green-400" /><span className="text-green-400 hidden sm:inline">Audio</span></>
                  : <><VolumeX className="h-3.5 w-3.5 text-zinc-400" /><span className="text-zinc-400 hidden sm:inline">Mudo</span></>}
              </button>
              <button
                onClick={() => next && setSelected(next)}
                disabled={!next}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                title={next?.name}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <VideoPlayer
              src={selected.primary}
              fallbacks={selected.fallbacks}
              title={selected.name}
              className="aspect-video"
              muted={!audioOn}
              onError={() => markDead(selected, filtered)}
            />
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-800/50 text-[10px] text-zinc-600">
              <span>{prev ? `◀ ${prev.name}` : ''}</span>
              <span className="text-zinc-700">{idx + 1} / {filtered.length}</span>
              <span>{next ? `${next.name} ▶` : ''}</span>
            </div>
          </div>
        )
      })()}

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
        <Tabs value={country} onValueChange={v => { setCountry(v); setSearch('') }}>
          <TabsList className="bg-zinc-900 h-auto flex-wrap gap-1 p-1">
            {COUNTRIES.map(c => (
              <TabsTrigger key={c.code} value={c.code} className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs value={category} onValueChange={v => { setCategory(v); setSearch('') }}>
          <TabsList className="bg-zinc-900 h-auto flex-wrap gap-1 p-1">
            {CATEGORIES.map(c => (
              <TabsTrigger key={c.code} value={c.code} className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 24 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl bg-zinc-800" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Tv className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">
            {groups.length === 0 ? 'Sin canales — ve a Admin → Importar lista M3U' : 'Sin resultados'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-zinc-500 text-xs">{filtered.length} canales ({raw.length} señales totales)</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filtered.map(g => (
              <button
                key={g.id}
                onClick={() => { setSelected(g); setAudioOn(false) }}
                className={`relative flex flex-col items-center gap-2 p-2 rounded-xl border transition-all text-center ${
                  selected?.id === g.id ? 'border-red-500 bg-red-950/30' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800'
                }`}
              >
                {g.count > 1 && (
                  <span className="absolute top-1 right-1 flex items-center gap-0.5 text-[9px] text-zinc-500 bg-zinc-800 px-1 py-0.5 rounded-full">
                    <Layers className="h-2 w-2" />{g.count}
                  </span>
                )}
                {g.logo ? (
                  <div className="h-10 w-full flex items-center justify-center">
                    <Image src={g.logo} alt={g.name} width={56} height={40}
                      className="object-contain max-h-10 w-auto"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                ) : (
                  <Tv className="h-8 w-8 text-zinc-600" />
                )}
                <p className="text-zinc-300 text-[10px] font-medium leading-tight line-clamp-2 w-full">{g.name}</p>
                <span className="text-[9px] text-zinc-600 uppercase">{g.country}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
