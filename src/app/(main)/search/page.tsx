'use client'

import { useState, useTransition } from 'react'
import { searchContent, tmdbImage } from '@/lib/tmdb/api'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Film, Tv, Star } from 'lucide-react'

interface SearchResult {
  id: number
  media_type: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  poster_path: string | null
  vote_average?: number
  release_date?: string
  first_air_date?: string
  overview?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    startTransition(async () => {
      const data = await searchContent(q)
      setResults((data.results || []).filter((r: SearchResult) => r.media_type !== 'person'))
      setSearched(true)
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-white font-bold text-xl flex items-center gap-2">
        <Search className="h-5 w-5 text-blue-400" />
        Buscar
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Buscar películas, series..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 h-12 text-base"
          autoFocus
        />
      </div>

      {isPending && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-lg bg-zinc-800" />
          ))}
        </div>
      )}

      {!isPending && searched && results.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">No se encontraron resultados para &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {!isPending && results.length > 0 && (
        <>
          <p className="text-zinc-500 text-sm">{results.length} resultados para &ldquo;{query}&rdquo;</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {results.map(item => {
              const isMovie = item.media_type === 'movie'
              const href = isMovie ? `/movies/${item.id}` : `/series/${item.id}`
              const title = item.title || item.name || ''
              const year = (item.release_date || item.first_air_date || '').split('-')[0]

              return (
                <Link key={`${item.media_type}-${item.id}`} href={href} className="group">
                  <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-zinc-800">
                    <Image
                      src={tmdbImage(item.poster_path, 'w300')}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        {isMovie ? <Film className="h-2.5 w-2.5" /> : <Tv className="h-2.5 w-2.5" />}
                        {isMovie ? 'Película' : 'Serie'}
                      </span>
                    </div>
                    {item.vote_average && item.vote_average > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center gap-1">
                          <Star className="h-2.5 w-2.5 text-yellow-400 fill-current" />
                          <span className="text-yellow-400 text-xs font-bold">{item.vote_average.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-300 text-xs mt-1.5 line-clamp-2 leading-tight">{title}</p>
                  {year && <p className="text-zinc-600 text-xs">{year}</p>}
                </Link>
              )
            })}
          </div>
        </>
      )}

      {!searched && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-500">Escribe para buscar películas y series</p>
        </div>
      )}
    </div>
  )
}
