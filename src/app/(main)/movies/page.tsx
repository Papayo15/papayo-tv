import Link from 'next/link'
import Image from 'next/image'
import { getPopularMovies, getNowPlayingMovies, getTrendingMovies, tmdbImage } from '@/lib/tmdb/api'
import { Film, Star } from 'lucide-react'

export const revalidate = 1800

export default async function MoviesPage() {
  const [trending, nowPlaying, popular] = await Promise.all([
    getTrendingMovies().then(d => d.results?.slice(0, 10) || []).catch(() => []),
    getNowPlayingMovies().then(d => d.results?.slice(0, 12) || []).catch(() => []),
    getPopularMovies().then(d => d.results?.slice(0, 20) || []).catch(() => []),
  ])

  if (trending.length === 0 && nowPlaying.length === 0 && popular.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Film className="h-5 w-5 text-yellow-400" />
          Películas
        </h1>
        <div className="text-center py-24">
          <Film className="h-14 w-14 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-300 font-semibold text-lg">API key de TMDB no configurada</p>
          <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto">
            Ve a <span className="text-zinc-300">Vercel → Settings → Environment Variables</span> y agrega{' '}
            <span className="font-mono text-yellow-400">TMDB_API_KEY</span> con tu token de themoviedb.org
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-white font-bold text-xl flex items-center gap-2">
        <Film className="h-5 w-5 text-yellow-400" />
        Películas
      </h1>

      {/* Featured hero — first trending movie */}
      {trending[0] && (
        <Link href={`/movies/${trending[0].id}`} className="group block relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[3/1]">
          <Image
            src={tmdbImage(trending[0].backdrop_path, 'original')}
            alt={trending[0].title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 max-w-md">
            <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">Tendencia esta semana</p>
            <h2 className="text-white font-bold text-2xl md:text-3xl leading-tight mb-2">{trending[0].title}</h2>
            <p className="text-zinc-300 text-sm line-clamp-2">{trending[0].overview}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                <Star className="h-3.5 w-3.5 fill-current" />
                {trending[0].vote_average.toFixed(1)}
              </span>
              <span className="text-zinc-400 text-xs">{trending[0].release_date?.split('-')[0]}</span>
            </div>
          </div>
        </Link>
      )}

      {/* Now playing */}
      <Section title="En Cines Ahora" movies={nowPlaying} />

      {/* Trending */}
      <Section title="Tendencias de la Semana" movies={trending} />

      {/* Popular */}
      <Section title="Más Populares" movies={popular} />
    </div>
  )
}

function Section({ title, movies }: { title: string; movies: Array<{ id: number; title: string; poster_path: string | null; vote_average: number; release_date: string }> }) {
  return (
    <section>
      <h2 className="text-white font-bold text-lg mb-4">{title}</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {movies.map(movie => (
          <Link key={movie.id} href={`/movies/${movie.id}`} className="group">
            <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-zinc-800">
              <Image
                src={tmdbImage(movie.poster_path, 'w300')}
                alt={movie.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  <Star className="h-2.5 w-2.5 text-yellow-400 fill-current" />
                  <span className="text-yellow-400 text-xs font-bold">{movie.vote_average.toFixed(1)}</span>
                </div>
              </div>
            </div>
            <p className="text-zinc-300 text-xs mt-1.5 line-clamp-2 leading-tight">{movie.title}</p>
            <p className="text-zinc-600 text-xs">{movie.release_date?.split('-')[0]}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
