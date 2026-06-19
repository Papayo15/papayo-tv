import Link from 'next/link'
import { Tv, Film, Trophy, Clapperboard, ArrowRight } from 'lucide-react'
import { getTrendingMovies, getTrendingSeries, tmdbImage } from '@/lib/tmdb/api'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createClient()

  const [moviesData, seriesData, { data: liveChannels }, { data: sportsEvents }] =
    await Promise.allSettled([
      getTrendingMovies(),
      getTrendingSeries(),
      supabase.from('channels').select('id, name, logo, category').eq('is_active', true).limit(8),
      supabase.from('sports_events').select('*').order('starts_at', { ascending: true }).limit(6),
    ]).then(results => results.map(r => (r.status === 'fulfilled' ? r.value : { results: [], data: [] })))

  const movies = (moviesData as { results: [] })?.results?.slice(0, 6) ?? []
  const series = (seriesData as { results: [] })?.results?.slice(0, 6) ?? []

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-red-950 via-zinc-900 to-zinc-950 p-8 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Tv className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold text-white">Papayo TV</h1>
        </div>
        <p className="text-zinc-300 max-w-xl">
          TV en vivo, películas, series y deportes de México, España y toda Latinoamérica. Todo en un solo lugar, gratis.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/live"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm"
          >
            <Tv className="h-4 w-4" />
            Ver TV en Vivo
          </Link>
          <Link
            href="/movies"
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm"
          >
            <Film className="h-4 w-4" />
            Explorar Películas
          </Link>
        </div>
      </section>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Tv, label: 'Canales en Vivo', value: '8,000+', href: '/live', color: 'text-blue-400' },
          { icon: Film, label: 'Películas', value: '28,000+', href: '/movies', color: 'text-yellow-400' },
          { icon: Clapperboard, label: 'Series', value: '6,000+', href: '/series', color: 'text-green-400' },
          { icon: Trophy, label: 'Deportes', value: 'En vivo', href: '/sports', color: 'text-red-400' },
        ].map(({ icon: Icon, label, value, href, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors"
          >
            <Icon className={`h-5 w-5 ${color} mb-2`} />
            <p className="text-white font-bold text-xl">{value}</p>
            <p className="text-zinc-400 text-xs">{label}</p>
          </Link>
        ))}
      </div>

      {/* Trending movies */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Películas en Tendencia</h2>
          <Link href="/movies" className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
            Ver todo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {movies.map((movie: { id: number; title: string; poster_path: string | null; vote_average: number }) => (
            <Link key={movie.id} href={`/movies/${movie.id}`} className="group">
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-zinc-800">
                <Image
                  src={tmdbImage(movie.poster_path, 'w300')}
                  alt={movie.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 33vw, 16vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-yellow-400 text-xs font-bold">★ {movie.vote_average.toFixed(1)}</span>
                </div>
              </div>
              <p className="text-zinc-300 text-xs mt-1.5 line-clamp-2 leading-tight">{movie.title}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending series */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Series Populares</h2>
          <Link href="/series" className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
            Ver todo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {series.map((show: { id: number; name: string; poster_path: string | null; vote_average: number }) => (
            <Link key={show.id} href={`/series/${show.id}`} className="group">
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-zinc-800">
                <Image
                  src={tmdbImage(show.poster_path, 'w300')}
                  alt={show.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 33vw, 16vw"
                />
              </div>
              <p className="text-zinc-300 text-xs mt-1.5 line-clamp-2 leading-tight">{show.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Sports events */}
      {Array.isArray(sportsEvents) && sportsEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Eventos Deportivos
            </h2>
            <Link href="/sports" className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
              Ver todo <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(sportsEvents as Array<{ id: string; name: string; league: string; is_live: boolean; home_team?: string; away_team?: string }>).map(event => (
              <Link
                key={event.id}
                href="/sports"
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500">{event.league}</span>
                  {event.is_live && (
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-medium animate-pulse">
                      EN VIVO
                    </span>
                  )}
                </div>
                <p className="text-white font-medium text-sm">{event.name}</p>
                {event.home_team && event.away_team && (
                  <p className="text-zinc-400 text-xs mt-1">{event.home_team} vs {event.away_team}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
