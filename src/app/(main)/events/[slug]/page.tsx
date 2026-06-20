import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Trophy, Radio, Calendar, Clock, Tv } from 'lucide-react'

export const revalidate = 120

interface Match {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strThumb?: string
  dateEvent: string
  strTime?: string
  strStatus?: string
  strHomeScore?: string
  strAwayScore?: string
}

async function fetchMatches(leagueId: string): Promise<Match[]> {
  if (leagueId === '0' || !leagueId) return []
  try {
    const [nextRes, pastRes] = await Promise.allSettled([
      fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`, { signal: AbortSignal.timeout(6000), next: { revalidate: 300 } }),
      fetch(`https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${leagueId}`, { signal: AbortSignal.timeout(6000), next: { revalidate: 300 } }),
    ])
    const next: Match[] = nextRes.status === 'fulfilled' && nextRes.value.ok ? (await nextRes.value.json()).events || [] : []
    const past: Match[] = pastRes.status === 'fulfilled' && pastRes.value.ok ? (await pastRes.value.json()).events || [] : []
    // Last 3 past + all upcoming (max 15)
    return [...past.slice(-3), ...next.slice(0, 12)]
  } catch { return [] }
}

// Map slug → TheSportsDB league id (from the events lib)
const SLUG_TO_LEAGUE: Record<string, string> = {
  'mundial-fifa': '4480', 'eurocopa': '4418', 'copa-america': '4439',
  'champions-league': '4346', 'la-liga': '4335', 'premier-league': '4328',
  'bundesliga': '4331', 'serie-a': '4332', 'ligue-1': '4391',
  'copa-libertadores': '4424', 'mls': '4406', 'liga-mx': '4350',
  'nba': '4387', 'nfl': '4391', 'mlb': '4424', 'nhl': '4380',
  'formula-1': '4370', 'motogp': '4370', 'wimbledon': '4370',
  'roland-garros': '4370', 'us-open-tennis': '4370',
}

interface Props { params: Promise<{ slug: string }> }

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('featured_events')
    .select('*, event_channels(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!event) notFound()

  const channels = (event.event_channels || []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  )

  const leagueId = SLUG_TO_LEAGUE[slug] || '0'
  const matches = await fetchMatches(leagueId)

  const now = new Date()
  const upcoming = matches.filter(m => new Date(`${m.dateEvent}T${m.strTime || '00:00'}Z`) >= now)
  const recent   = matches.filter(m => new Date(`${m.dateEvent}T${m.strTime || '00:00'}Z`) < now)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{ background: `linear-gradient(135deg, ${event.color}40, ${event.color}10)` }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="h-6 w-6" style={{ color: event.color }} />
          <span className="text-white font-bold text-2xl md:text-3xl">{event.name}</span>
          {channels.length > 0 && (
            <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full ml-2">
              <Radio className="h-3 w-3" />EN VIVO
            </span>
          )}
        </div>
        {event.description && <p className="text-zinc-400 text-sm">{event.description}</p>}
      </div>

      {/* Upcoming matches */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            Próximos partidos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map(m => <MatchCard key={m.idEvent} match={m} isUpcoming />)}
          </div>
        </section>
      )}

      {/* Live channels */}
      {channels.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <Tv className="h-4 w-4 text-red-400" />
            Señales disponibles ({channels.length})
          </h2>
          <p className="text-zinc-500 text-xs mb-3">Haz clic en un canal para verlo. Activa el audio con el control del reproductor.</p>
          <div className={`grid gap-4 ${channels.length === 1 ? '' : channels.length <= 4 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {channels.map((ch: { id: string; name: string; url: string; logo: string | null }) => (
              <div key={ch.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2">
                  {ch.logo && <Image src={ch.logo} alt={ch.name} width={20} height={20} className="object-contain" />}
                  <span className="text-white text-xs font-medium truncate">{ch.name}</span>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                </div>
                <VideoPlayer src={ch.url} title={ch.name} className="aspect-video" muted />
              </div>
            ))}
          </div>
        </section>
      )}

      {channels.length === 0 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center">
          <Tv className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-400 text-sm">Canales en vivo no disponibles aún</p>
          <p className="text-zinc-600 text-xs mt-1">Sincroniza los canales desde Admin para activar la transmisión</p>
        </div>
      )}

      {/* Recent results */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            Resultados recientes
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.slice(-6).reverse().map(m => <MatchCard key={m.idEvent} match={m} isUpcoming={false} />)}
          </div>
        </section>
      )}

      {matches.length === 0 && channels.length === 0 && (
        <div className="text-center py-16">
          <Trophy className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No hay información de partidos disponible</p>
          <p className="text-zinc-600 text-xs mt-1">Los datos se actualizan automáticamente cuando hay actividad</p>
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, isUpcoming }: { match: Match; isUpcoming: boolean }) {
  const dateStr = match.dateEvent
    ? new Date(`${match.dateEvent}T${match.strTime || '12:00'}Z`).toLocaleDateString('es-MX', {
        weekday: 'short', day: 'numeric', month: 'short',
        ...(match.strTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : ''

  const hasScore = match.strHomeScore != null && match.strHomeScore !== ''

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${isUpcoming ? 'border-blue-800/50 bg-blue-950/20' : 'border-zinc-800 bg-zinc-900'}`}>
      {match.strThumb && (
        <div className="relative h-24 rounded-lg overflow-hidden">
          <Image src={match.strThumb} alt={match.strEvent} fill className="object-cover opacity-60" sizes="(max-width: 640px) 100vw, 33vw" />
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-zinc-300 text-xs font-semibold truncate flex-1 text-right">{match.strHomeTeam}</span>
        {hasScore ? (
          <span className="text-white font-bold text-sm bg-zinc-800 px-2 py-0.5 rounded shrink-0">
            {match.strHomeScore} – {match.strAwayScore}
          </span>
        ) : (
          <span className="text-zinc-600 text-xs shrink-0">vs</span>
        )}
        <span className="text-zinc-300 text-xs font-semibold truncate flex-1">{match.strAwayTeam}</span>
      </div>
      {dateStr && (
        <p className="text-zinc-500 text-[10px] text-center flex items-center justify-center gap-1">
          <Calendar className="h-2.5 w-2.5" />
          {dateStr}
        </p>
      )}
    </div>
  )
}
