'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { BookOpen, Tv, Search, Volume2, VolumeX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import type { Channel } from '@/types/channel'

const NETWORKS = [
  { id: 'all',         label: 'Todos',            pattern: null },
  { id: 'natgeo',      label: 'Nat Geo',           pattern: 'national geographic|nat geo|natgeo' },
  { id: 'discovery',   label: 'Discovery',         pattern: 'discovery' },
  { id: 'history',     label: 'History',           pattern: 'history' },
  { id: 'animal',      label: 'Animal Planet',     pattern: 'animal planet' },
  { id: 'tlc',         label: 'TLC / A&E',         pattern: 'tlc|a&e|lifetime' },
  { id: 'dmax',        label: 'DMAX',              pattern: 'dmax' },
  { id: 'bbc',         label: 'BBC Earth',         pattern: 'bbc earth|bbc knowledge|bbc world' },
  { id: 'food',        label: 'Food / Travel',     pattern: 'food network|cooking|travel channel|viajar|viaje' },
  { id: 'science',     label: 'Science',           pattern: 'science|ciencia|smithsonian' },
  { id: 'crime',       label: 'Crime / Invest.',   pattern: 'crime|investigaci|investigation' },
  { id: 'culture',     label: 'Cultura / Arte',    pattern: 'cultura|arte|odisea|docum|biogr|explorer' },
]

export default function DocsPage() {
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
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('is_active', true)
        .or([
          'category.eq.documentary',
          'name.ilike.%National Geographic%',
          'name.ilike.%Nat Geo%',
          'name.ilike.%NatGeo%',
          'name.ilike.%Discovery%',
          'name.ilike.%History%',
          'name.ilike.%Animal Planet%',
          'name.ilike.%Odisea%',
          'name.ilike.%Viajar%',
          'name.ilike.%Viaje%',
          'name.ilike.%Food Network%',
          'name.ilike.%Cooking%',
          'name.ilike.%Travel Channel%',
          'name.ilike.%Science%',
          'name.ilike.%Ciencia%',
          'name.ilike.%Smithsonian%',
          'name.ilike.%Investigation%',
          'name.ilike.%Investigaci%',
          'name.ilike.%Crime%',
          'name.ilike.%DMAX%',
          'name.ilike.%DMax%',
          'name.ilike.%TLC%',
          'name.ilike.%A&E%',
          'name.ilike.%Lifetime%',
          'name.ilike.%BBC Earth%',
          'name.ilike.%BBC Knowledge%',
          'name.ilike.%Canal Historia%',
          'name.ilike.%Canal Cultura%',
          'name.ilike.%Cultura%',
          'name.ilike.%Biogr%',
          'name.ilike.%Docum%',
          'name.ilike.%Explorer%',
          'name.ilike.%Wild%',
          'name.ilike.%Planet%',
          'name.ilike.%Nature%',
        ].join(','))
        .order('name')
        .limit(500)
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
          <BookOpen className="h-5 w-5 text-green-400" />
          Documentales & Cultura
        </h1>
        {!loading && <span className="text-zinc-500 text-sm">{channels.length} canales</span>}
      </div>

      {/* Player */}
      {selected && (
        <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
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
          placeholder="Buscar canal de documentales..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white"
        />
      </div>

      {/* Network tabs */}
      <div className="flex flex-wrap gap-1.5">
        {NETWORKS.map(n => (
          <button
            key={n.id}
            onClick={() => setNetwork(n.id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              network === n.id
                ? 'bg-green-700 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400">
            {channels.length === 0
              ? 'Sin canales de documentales. Ve a Admin → Sincronizar canales.'
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
                    ? 'border-green-500 bg-green-950/30'
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
