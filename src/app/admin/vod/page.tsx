'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { searchContent, tmdbImage } from '@/lib/tmdb/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Film, Search, Plus, Trash2, Link2 } from 'lucide-react'
import Image from 'next/image'

interface VodSource {
  id: string
  tmdb_id: number
  content_type: 'movie' | 'series'
  stream_url: string
  quality: string
  created_at: string
  tmdb_title?: string
  tmdb_poster?: string
}

interface SearchResult {
  id: number
  media_type: 'movie' | 'tv'
  title?: string
  name?: string
  poster_path: string | null
}

export default function AdminVodPage() {
  const supabase = createClient()
  const [vodSources, setVodSources] = useState<VodSource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [streamUrl, setStreamUrl] = useState('')
  const [quality, setQuality] = useState('HD')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadVodSources()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadVodSources() {
    setLoading(true)
    const { data } = await supabase.from('vod_sources').select('*').order('created_at', { ascending: false })
    setVodSources(data || [])
    setLoading(false)
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    const data = await searchContent(searchQuery)
    setSearchResults((data.results || []).filter((r: SearchResult) => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 8))
    setSearching(false)
  }

  async function handleSave() {
    if (!selected || !streamUrl.trim()) return
    setSaving(true)
    setMessage(null)

    const contentType = selected.media_type === 'movie' ? 'movie' : 'series'
    const { error } = await supabase.from('vod_sources').upsert({
      tmdb_id: selected.id,
      content_type: contentType,
      stream_url: streamUrl.trim(),
      quality,
    }, { onConflict: 'tmdb_id,content_type' })

    if (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: '✅ Fuente de video guardada correctamente' })
      setSelected(null)
      setStreamUrl('')
      setSearchQuery('')
      setSearchResults([])
      await loadVodSources()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta fuente de video?')) return
    await supabase.from('vod_sources').delete().eq('id', id)
    setVodSources(prev => prev.filter(v => v.id !== id))
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-white font-bold text-xl flex items-center gap-2">
        <Film className="h-5 w-5 text-yellow-400" />
        Fuentes de Video VOD
      </h1>

      {/* Add new source */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">Agregar nueva fuente</h2>

        {/* Step 1: Search */}
        <div className="space-y-2">
          <Label className="text-zinc-300">1. Buscar película o serie en TMDB</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nombre de la película o serie..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <Button onClick={handleSearch} disabled={searching} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search results */}
        {searching && (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-lg bg-zinc-800" />)}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {searchResults.map(item => {
              const title = item.title || item.name || ''
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`relative aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all ${selected?.id === item.id ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent hover:border-zinc-600'}`}
                >
                  <Image
                    src={tmdbImage(item.poster_path, 'w300')}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="15vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1">
                    <p className="text-white text-[9px] line-clamp-1 leading-tight">{title}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Selected item */}
        {selected && (
          <div className="flex items-center gap-3 bg-zinc-800 rounded-lg p-3">
            <div className="relative w-10 aspect-[2/3] rounded overflow-hidden shrink-0">
              <Image src={tmdbImage(selected.poster_path, 'w300')} alt={selected.title || selected.name || ''} fill className="object-cover" sizes="40px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{selected.title || selected.name}</p>
              <Badge variant="outline" className="text-[10px] border-zinc-600 text-zinc-400">
                {selected.media_type === 'movie' ? 'Película' : 'Serie'} · TMDB #{selected.id}
              </Badge>
            </div>
            <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* Step 2: URL */}
        <div className="space-y-2">
          <Label className="text-zinc-300">2. URL del video (.m3u8 o .mp4)</Label>
          <div className="flex gap-2 items-center">
            <Link2 className="h-4 w-4 text-zinc-500 shrink-0" />
            <Input
              placeholder="https://example.com/video.m3u8"
              value={streamUrl}
              onChange={e => setStreamUrl(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Calidad</Label>
          <div className="flex gap-2">
            {['SD', 'HD', 'FHD', '4K'].map(q => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${quality === q ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p className={`text-sm rounded px-3 py-2 ${message.type === 'success' ? 'bg-green-950/40 text-green-400' : 'bg-red-950/40 text-red-400'}`}>
            {message.text}
          </p>
        )}

        <Button
          onClick={handleSave}
          disabled={!selected || !streamUrl.trim() || saving}
          className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar fuente de video'}
        </Button>
      </div>

      {/* Existing sources */}
      <div>
        <h2 className="text-white font-semibold mb-3">Fuentes guardadas ({vodSources.length})</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 bg-zinc-800 rounded-xl" />)}
          </div>
        ) : vodSources.length === 0 ? (
          <p className="text-zinc-500 text-sm">No hay fuentes de video aún. Agrega una arriba.</p>
        ) : (
          <div className="space-y-2">
            {vodSources.map(vod => (
              <div key={vod.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <Film className="h-4 w-4 text-zinc-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                      {vod.content_type === 'movie' ? 'Película' : 'Serie'} #{vod.tmdb_id}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                      {vod.quality}
                    </Badge>
                  </div>
                  <p className="text-zinc-400 text-xs mt-1 truncate font-mono">{vod.stream_url}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(vod.id)}
                  className="text-zinc-600 hover:text-red-400 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
