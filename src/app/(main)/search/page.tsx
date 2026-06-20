'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Film, Tv, Star, Radio } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { VideoPlayer } from '@/components/player/VideoPlayer'

interface Channel { id: string; name: string; url: string; logo: string | null; country: string; category: string }
interface TmdbItem { id: number; media_type: 'movie' | 'tv'; title?: string; name?: string; poster_path: string | null; vote_average?: number; release_date?: string; first_air_date?: string }

function tmdbImg(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w300${path}` : null
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [movies, setMovies] = useState<TmdbItem[]>([])
  const [series, setSeries] = useState<TmdbItem[]>([])
  const [searched, setSearched] = useState(false)
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(debounce.current)
    if (query.length < 2) {
      setChannels([]); setMovies([]); setSeries([]); setSearched(false); return
    }
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setChannels(data.channels || [])
        setMovies(data.movies || [])
        setSeries(data.series || [])
        setSearched(true)
      } catch {
        setSearched(true)
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [query])

  const total = channels.length + movies.length + series.length

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-white font-bold text-xl flex items-center gap-2">
        <Search className="h-5 w-5 text-blue-400" />
        Buscar
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Buscar canales (ESPN, TDN, Fox...), películas, series..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 h-12 text-base"
          autoFocus
        />
      </div>

      {/* Channel mini-player */}
      {activeChannel && (
        <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-medium">{activeChannel.name}</span>
            <button onClick={() => setActiveChannel(null)} className="ml-auto text-zinc-500 hover:text-white text-xs">✕ cerrar</button>
          </div>
          <VideoPlayer src={activeChannel.url} title={activeChannel.name} className="aspect-video" />
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-zinc-800" />)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-lg bg-zinc-800" />)}
          </div>
        </div>
      )}

      {!loading && searched && total === 0 && (
        <div className="text-center py-12">
          <Search className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Sin resultados para &ldquo;{query}&rdquo;</p>
          <p className="text-zinc-600 text-xs mt-1">Prueba con otro nombre o sincroniza los canales desde Admin</p>
        </div>
      )}

      {!loading && searched && total > 0 && (
        <p className="text-zinc-500 text-sm">{total} resultado{total !== 1 ? 's' : ''} para &ldquo;{query}&rdquo;</p>
      )}

      {/* Channels */}
      {!loading && channels.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-500" />
            Canales en vivo ({channels.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
            {channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(activeChannel?.id === ch.id ? null : ch)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                  activeChannel?.id === ch.id
                    ? 'border-red-500 bg-red-950/30'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800'
                }`}
              >
                {ch.logo ? (
                  <img src={ch.logo} alt={ch.name} className="h-8 w-auto object-contain max-w-full" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <Tv className="h-7 w-7 text-zinc-600" />
                )}
                <p className="text-zinc-300 text-[10px] line-clamp-2 leading-tight">{ch.name}</p>
                <span className="text-[9px] text-zinc-600 uppercase">{ch.country}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Movies */}
      {!loading && movies.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <Film className="h-4 w-4 text-blue-400" />
            Películas ({movies.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {movies.map(item => {
              const img = tmdbImg(item.poster_path)
              const year = (item.release_date || '').split('-')[0]
              return (
                <Link key={item.id} href={`/movies/${item.id}`} className="group">
                  <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-zinc-800">
                    {img ? <Image src={img} alt={item.title || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 17vw" /> : <Film className="absolute inset-0 m-auto h-10 w-10 text-zinc-700" />}
                    {item.vote_average && item.vote_average > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                          <Star className="h-2.5 w-2.5 fill-current" />{item.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-300 text-xs mt-1.5 line-clamp-2 leading-tight">{item.title}</p>
                  {year && <p className="text-zinc-600 text-xs">{year}</p>}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Series */}
      {!loading && series.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <Tv className="h-4 w-4 text-purple-400" />
            Series ({series.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {series.map(item => {
              const img = tmdbImg(item.poster_path)
              const year = (item.first_air_date || '').split('-')[0]
              return (
                <Link key={item.id} href={`/series/${item.id}`} className="group">
                  <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-zinc-800">
                    {img ? <Image src={img} alt={item.name || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 17vw" /> : <Tv className="absolute inset-0 m-auto h-10 w-10 text-zinc-700" />}
                    {item.vote_average && item.vote_average > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                          <Star className="h-2.5 w-2.5 fill-current" />{item.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-300 text-xs mt-1.5 line-clamp-2 leading-tight">{item.name}</p>
                  {year && <p className="text-zinc-600 text-xs">{year}</p>}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {!searched && !loading && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-500">Busca canales, películas o series</p>
          <p className="text-zinc-700 text-xs mt-1">ESPN, TDN, Fox, Telemundo, Estrella TV...</p>
        </div>
      )}
    </div>
  )
}
