import { getMovieDetails, tmdbImage } from '@/lib/tmdb/api'
import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Clock, Calendar, Play, Film } from 'lucide-react'
import { formatDate, formatRuntime, scoreToPercent } from '@/lib/utils'

export const revalidate = 86400

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [movie, { data: vodSource }] = await Promise.all([
    getMovieDetails(Number(id)),
    supabase.from('vod_sources').select('stream_url, quality').eq('tmdb_id', Number(id)).eq('content_type', 'movie').single(),
  ])

  const trailer = movie.videos?.results?.find(
    (v: { type: string; site: string }) => v.type === 'Trailer' && v.site === 'YouTube'
  )

  const cast = movie.credits?.cast?.slice(0, 6) || []
  const similar = movie.similar?.results?.slice(0, 6) || []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Backdrop hero */}
      <div className="relative rounded-2xl overflow-hidden aspect-video md:aspect-[21/9]">
        <Image
          src={tmdbImage(movie.backdrop_path, 'original')}
          alt={movie.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      <div className="grid md:grid-cols-[auto_1fr] gap-6">
        {/* Poster */}
        <div className="w-32 md:w-44 shrink-0 mx-auto md:mx-0 -mt-20 md:-mt-24 relative z-10">
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden border-2 border-zinc-700 shadow-2xl">
            <Image
              src={tmdbImage(movie.poster_path, 'w500')}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="176px"
            />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-white font-bold text-2xl md:text-3xl">{movie.title}</h1>
            {movie.tagline && <p className="text-zinc-400 text-sm italic mt-1">{movie.tagline}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-yellow-400 font-bold">
              <Star className="h-4 w-4 fill-current" />
              {movie.vote_average?.toFixed(1)} ({scoreToPercent(movie.vote_average)}%)
            </span>
            {movie.runtime && (
              <span className="flex items-center gap-1 text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                {formatRuntime(movie.runtime)}
              </span>
            )}
            {movie.release_date && (
              <span className="flex items-center gap-1 text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(movie.release_date)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {movie.genres?.map((g: { id: number; name: string }) => (
              <span key={g.id} className="text-xs border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded-full">
                {g.name}
              </span>
            ))}
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed">{movie.overview}</p>

          {/* Watch / trailer buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {vodSource?.stream_url ? (
              <div className="w-full">
                <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  Reproducción disponible
                </p>
                <VideoPlayer
                  src={vodSource.stream_url}
                  title={movie.title}
                  className="w-full aspect-video max-w-2xl"
                />
              </div>
            ) : trailer ? (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                <Play className="h-4 w-4 fill-white" />
                Ver Trailer
              </a>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Film className="h-4 w-4" />
                Trailer no disponible
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cast */}
      {cast.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-lg mb-3">Reparto Principal</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {cast.map((actor: { id: number; name: string; character: string; profile_path: string | null }) => (
              <div key={actor.id} className="text-center">
                <div className="aspect-square relative rounded-full overflow-hidden bg-zinc-800 mb-1.5 mx-auto w-14">
                  <Image
                    src={actor.profile_path ? tmdbImage(actor.profile_path, 'w300') : '/placeholder-avatar.jpg'}
                    alt={actor.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <p className="text-zinc-300 text-xs font-medium line-clamp-1">{actor.name}</p>
                <p className="text-zinc-600 text-[10px] line-clamp-1">{actor.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar movies */}
      {similar.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-lg mb-3">Películas Similares</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {similar.map((m: { id: number; title: string; poster_path: string | null }) => (
              <Link key={m.id} href={`/movies/${m.id}`} className="group">
                <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-zinc-800">
                  <Image
                    src={tmdbImage(m.poster_path, 'w300')}
                    alt={m.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="15vw"
                  />
                </div>
                <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2">{m.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
