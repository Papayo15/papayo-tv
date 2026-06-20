'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { groupChannels, type ChannelGroup } from '@/lib/groupChannels'
import { Trophy, Tv, Search, Volume2, VolumeX, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import type { Channel } from '@/types/channel'

const NETWORKS = [
  { id: 'all',        label: 'Todos',         pattern: null },
  { id: 'espn',       label: 'ESPN',          pattern: 'espn' },
  { id: 'fox',        label: 'Fox Sports',    pattern: 'fox sport' },
  { id: 'sky',        label: 'Sky Sports',    pattern: 'sky sport' },
  { id: 'bein',       label: 'beIN Sports',   pattern: 'bein' },
  { id: 'eurosport',  label: 'Eurosport',     pattern: 'eurosport' },
  { id: 'nbc',        label: 'NBC Sports',    pattern: 'nbc sport' },
  { id: 'dazn',       label: 'DAZN',          pattern: 'dazn' },
  { id: 'tyc',        label: 'TyC / DirecTV', pattern: 'tyc|directv sport|dsport|win sport' },
  { id: 'movistar',   label: 'Movistar+',     pattern: 'movistar' },
  { id: 'tudn',       label: 'TUDN',          pattern: 'tudn' },
  { id: 'canal',      label: 'Canal+ Sport',  pattern: 'canal.*sport|sport.*canal' },
  { id: 'supersport', label: 'SuperSport',    pattern: 'supersport' },
  { id: 'bt',         label: 'TNT/BT Sport',  pattern: 'bt sport|tnt sport' },
  { id: 'eleven',     label: 'Eleven Sports', pattern: 'eleven' },
  { id: 'f1',         label: 'F1 / Moto',     pattern: 'formula|f1|moto|nascar|motorsport' },
  { id: 'nfl',        label: 'NFL / NBA',     pattern: 'nfl|nba tv|nba net|mlb|nhl' },
  { id: 'golf',       label: 'Golf / Tennis', pattern: 'golf|tennis' },
]

export default function SportsPage() {
  const supabase = createClient()
  const [raw, setRaw] = useState<Channel[]>([])
  const [groups, setGroups] = useState<ChannelGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ChannelGroup | null>(null)
  const [audioOn, setAudioOn] = useState(false)
  const [search, setSearch] = useState('')
  const [network, setNetwork] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('is_active', true)
        .or([
          'category.eq.sports',
          'name.ilike.%ESPN%', 'name.ilike.%Fox Sport%', 'name.ilike.%Sky Sport%',
          'name.ilike.%beIN%', 'name.ilike.%Eurosport%', 'name.ilike.%NBC Sport%',
          'name.ilike.%DAZN%', 'name.ilike.%TyC%', 'name.ilike.%Win Sport%',
          'name.ilike.%DSport%', 'name.ilike.%DirecTV Sport%', 'name.ilike.%Movistar%',
          'name.ilike.%Canal+ Sport%', 'name.ilike.%TUDN%', 'name.ilike.%Supersport%',
          'name.ilike.%BT Sport%', 'name.ilike.%TNT Sport%', 'name.ilike.%Eleven Sport%',
          'name.ilike.%Golf Channel%', 'name.ilike.%Tennis Channel%', 'name.ilike.%NFL Network%',
          'name.ilike.%NBA TV%', 'name.ilike.%MLB Network%', 'name.ilike.%Motorsport%',
          'name.ilike.%Formula 1%', 'name.ilike.%NASCAR%', 'name.ilike.%Claro Sport%',
          'name.ilike.%Teledeporte%', 'name.ilike.%Sport1%', 'name.ilike.%Arena Sport%',
          'name.ilike.%Setanta%', 'name.ilike.%Sportsnet%', 'name.ilike.%deporte%',
          'name.ilike.%futbol%', 'name.ilike.%fútbol%', 'name.ilike.%Telemundo%',
        ].join(','))
        .order('name')
        .limit(2000)
      const channels = data || []
      setRaw(channels)
      setGroups(groupChannels(channels))
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeNet = NETWORKS.find(n => n.id === network)
  const filtered = groups.filter(g => {
    const n = g.name.toLowerCase()
    if (search && !n.includes(search.toLowerCase())) return false
    if (!activeNet?.pattern) return true
    return new RegExp(activeNet.pattern, 'i').test(g.name)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Deportes
        </h1>
        {!loading && (
          <span className="text-zinc-500 text-sm">
            {filtered.length} canales · {raw.length} señales
          </span>
        )}
      </div>

      {selected && (() => {
        const idx = filtered.findIndex(g => g.id === selected.id)
        const prev = idx > 0 ? filtered[idx - 1] : null
        const next = idx < filtered.length - 1 ? filtered[idx + 1] : null
        return (
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
            <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2">
              {/* Prev */}
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
              {/* Audio */}
              <button
                onClick={() => setAudioOn(v => !v)}
                className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors shrink-0"
              >
                {audioOn
                  ? <><Volume2 className="h-3.5 w-3.5 text-green-400" /><span className="text-green-400 hidden sm:inline">Audio</span></>
                  : <><VolumeX className="h-3.5 w-3.5 text-zinc-400" /><span className="text-zinc-400 hidden sm:inline">Mudo</span></>}
              </button>

              {/* Next */}
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
            />

            {/* Mini next/prev labels */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-800/50 text-[10px] text-zinc-600">
              <span>{prev ? `◀ ${prev.name}` : ''}</span>
              <span className="text-zinc-700">{idx + 1} / {filtered.length}</span>
              <span>{next ? `${next.name} ▶` : ''}</span>
            </div>
          </div>
        )
      })()}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Buscar canal deportivo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {NETWORKS.map(n => (
          <button
            key={n.id}
            onClick={() => setNetwork(n.id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              network === n.id ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl bg-zinc-800" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400">
            {groups.length === 0 ? 'Sin canales. Ve a Admin → Importar lista M3U.' : `Sin resultados para "${search || network}"`}
          </p>
        </div>
      ) : (
        <>
          <p className="text-zinc-600 text-xs">{filtered.length} canales ({raw.length} señales totales)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(g => (
              <button
                key={g.id}
                onClick={() => { setSelected(g); setAudioOn(false) }}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                  selected?.id === g.id ? 'border-red-500 bg-red-950/30' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800'
                }`}
              >
                {g.count > 1 && (
                  <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] text-zinc-500 bg-zinc-800 px-1 py-0.5 rounded-full">
                    <Layers className="h-2 w-2" />{g.count}
                  </span>
                )}
                {g.logo ? (
                  <div className="h-10 w-full flex items-center justify-center">
                    <Image src={g.logo} alt={g.name} width={60} height={40}
                      className="object-contain max-h-10 w-auto"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                ) : (
                  <Tv className="h-9 w-9 text-zinc-600" />
                )}
                <p className="text-zinc-300 text-[11px] font-medium leading-tight line-clamp-2">{g.name}</p>
                <span className="text-[9px] text-zinc-600 uppercase">{g.country}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
