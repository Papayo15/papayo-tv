'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Trophy, Tv, Search, Volume2, VolumeX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import type { Channel } from '@/types/channel'

// Network groups for filter tabs
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
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Channel | null>(null)
  const [audioOn, setAudioOn] = useState(false)
  const [search, setSearch] = useState('')
  const [network, setNetwork] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      // Wide query — grab all sports channels including name-based matches
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('is_active', true)
        .or([
          'category.eq.sports',
          'name.ilike.%ESPN%',
          'name.ilike.%Fox Sport%',
          'name.ilike.%Sky Sport%',
          'name.ilike.%beIN%',
          'name.ilike.%Eurosport%',
          'name.ilike.%NBC Sport%',
          'name.ilike.%DAZN%',
          'name.ilike.%TyC%',
          'name.ilike.%Win Sport%',
          'name.ilike.%DSport%',
          'name.ilike.%DirecTV Sport%',
          'name.ilike.%Movistar%',
          'name.ilike.%Canal+ Sport%',
          'name.ilike.%TUDN%',
          'name.ilike.%Supersport%',
          'name.ilike.%BT Sport%',
          'name.ilike.%TNT Sport%',
          'name.ilike.%Eleven Sport%',
          'name.ilike.%Stadium%',
          'name.ilike.%Golf Channel%',
          'name.ilike.%Tennis Channel%',
          'name.ilike.%NFL Network%',
          'name.ilike.%NBA TV%',
          'name.ilike.%MLB Network%',
          'name.ilike.%Motorsport%',
          'name.ilike.%Formula 1%',
          'name.ilike.%NASCAR%',
          'name.ilike.%Claro Sport%',
          'name.ilike.%Flow Sport%',
          'name.ilike.%Teledeporte%',
          'name.ilike.%Sport1%',
          'name.ilike.%Polsat Sport%',
          'name.ilike.%Arena Sport%',
          'name.ilike.%Setanta%',
          'name.ilike.%Sportsnet%',
          'name.ilike.%deporte%',
          'name.ilike.%futbol%',
          'name.ilike.%fútbol%',
        ].join(','))
        .order('name')
        .limit(1000)
      setChannels(data || [])
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeNet = NETWORKS.find(n => n.id === network)
  const filtered = channels.filter(ch => {
    const n = ch.name.toLowerCase()
    if (search && !n.includes(search.toLowerCase())) return false
    if (!activeNet?.pattern) return true
    return new RegExp(activeNet.pattern, 'i').test(ch.name)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Deportes
        </h1>
        {!loading && (
          <span className="text-zinc-500 text-sm">{channels.length} canales disponibles</span>
        )}
      </div>

      {/* Player */}
      {selected && (
        <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-medium">{selected.name}</span>
            <button
              onClick={() => setAudioOn(v => !v)}
              className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              {audioOn
                ? <><Volume2 className="h-3.5 w-3.5 text-green-400" /><span className="text-green-400">Con audio</span></>
                : <><VolumeX className="h-3.5 w-3.5 text-zinc-400" /><span className="text-zinc-400">Sin audio</span></>}
            </button>
          </div>
          <VideoPlayer src={selected.url} title={selected.name} className="aspect-video" muted={!audioOn} />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Buscar canal deportivo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white"
        />
      </div>

      {/* Network filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {NETWORKS.map(n => (
          <button
            key={n.id}
            onClick={() => setNetwork(n.id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              network === n.id
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400">
            {channels.length === 0
              ? 'Sin canales de deportes. Ve a Admin → Sincronizar canales.'
              : `Sin resultados para "${search || network}"`}
          </p>
        </div>
      ) : (
        <>
          <p className="text-zinc-600 text-xs">{filtered.length} canales</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(ch => (
              <button
                key={ch.id}
                onClick={() => { setSelected(ch); setAudioOn(false) }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                  selected?.id === ch.id
                    ? 'border-red-500 bg-red-950/30'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800'
                }`}
              >
                {ch.logo ? (
                  <div className="h-10 w-full flex items-center justify-center">
                    <Image
                      src={ch.logo} alt={ch.name}
                      width={60} height={40}
                      className="object-contain max-h-10 w-auto"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                ) : (
                  <Tv className="h-9 w-9 text-zinc-600" />
                )}
                <p className="text-zinc-300 text-[11px] font-medium leading-tight line-clamp-2">{ch.name}</p>
                <span className="text-[9px] text-zinc-600 uppercase">{ch.country}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
