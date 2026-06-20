import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// TheSportsDB league IDs for major competitions
const LEAGUES = [
  // Football / Soccer
  { id: '4480', name: 'Copa Mundial FIFA', slug: 'mundial-fifa', color: '#16a34a', sport: 'football', keywords: ['mundial', 'world cup', 'fifa world', 'copa mundial', 'foxsports', 'fox sport', 'espn', 'telemundo deportes'] },
  { id: '4328', name: 'Premier League', slug: 'premier-league', color: '#7c3aed', sport: 'football', keywords: ['premier', 'espn', 'sky sport'] },
  { id: '4335', name: 'La Liga', slug: 'la-liga', color: '#ea580c', sport: 'football', keywords: ['la liga', 'laliga', 'dazn', 'espn', 'fox sport'] },
  { id: '4331', name: 'Bundesliga', slug: 'bundesliga', color: '#ca8a04', sport: 'football', keywords: ['bundesliga', 'espn', 'dazn'] },
  { id: '4332', name: 'Serie A', slug: 'serie-a', color: '#0369a1', sport: 'football', keywords: ['serie a', 'espn', 'dazn'] },
  { id: '4391', name: 'Ligue 1', slug: 'ligue-1', color: '#1d4ed8', sport: 'football', keywords: ['ligue', 'espn', 'dazn'] },
  { id: '4480', name: 'Liga MX', slug: 'liga-mx', color: '#15803d', sport: 'football', keywords: ['liga mx', 'blim', 'tudn', 'azteca', 'televisa', 'izzi'] },
  { id: '4346', name: 'Champions League', slug: 'champions-league', color: '#1d4ed8', sport: 'football', keywords: ['champions', 'uefa champions', 'fox sport', 'espn', 'tnt sport'] },
  { id: '4397', name: 'Europa League', slug: 'europa-league', color: '#f97316', sport: 'football', keywords: ['europa league', 'espn', 'fox sport'] },
  { id: '4424', name: 'Copa Libertadores', slug: 'copa-libertadores', color: '#ca8a04', sport: 'football', keywords: ['libertadores', 'espn', 'conmebol'] },
  // Basketball
  { id: '4387', name: 'NBA', slug: 'nba', color: '#c2410c', sport: 'basketball', keywords: ['nba', 'espn', 'tnt', 'basketball'] },
  // Baseball
  { id: '4424', name: 'MLB', slug: 'mlb', color: '#0369a1', sport: 'baseball', keywords: ['mlb', 'baseball', 'béisbol'] },
  // American Football
  { id: '4391', name: 'NFL', slug: 'nfl', color: '#166534', sport: 'americanfootball', keywords: ['nfl', 'espn', 'fox sport', 'football americano'] },
  // Formula 1
  { id: '4370', name: 'Fórmula 1', slug: 'formula-1', color: '#dc2626', sport: 'motorsport', keywords: ['formula 1', 'formula1', 'f1', 'motorsport', 'espn', 'fox sport', 'eurosport'] },
  // Tennis
  { id: '4681', name: 'Wimbledon', slug: 'wimbledon', color: '#166534', sport: 'tennis', keywords: ['wimbledon', 'tennis', 'espn', 'eurosport'] },
  { id: '4681', name: 'Roland Garros', slug: 'roland-garros', color: '#ea580c', sport: 'tennis', keywords: ['roland garros', 'french open', 'tennis', 'espn', 'eurosport'] },
  { id: '4681', name: 'US Open Tennis', slug: 'us-open-tennis', color: '#0369a1', sport: 'tennis', keywords: ['us open', 'tennis', 'espn'] },
  // Cycling
  { id: '0', name: 'Tour de France', slug: 'tour-de-france', color: '#facc15', sport: 'cycling', keywords: ['tour de france', 'tour france', 'cycling', 'ciclismo', 'eurosport'] },
  // General sports channels (always show)
  { id: '0', name: 'ESPN', slug: 'espn-canales', color: '#dc2626', sport: 'general', keywords: ['espn'] },
  { id: '0', name: 'Fox Sports', slug: 'fox-sports', color: '#1e40af', sport: 'general', keywords: ['fox sport'] },
  { id: '0', name: 'beIN Sports', slug: 'bein-sports', color: '#0f766e', sport: 'general', keywords: ['bein'] },
  { id: '0', name: 'TyC Sports', slug: 'tyc-sports', color: '#fbbf24', sport: 'general', keywords: ['tyc', 'directv sport', 'dsport'] },
]

async function isLeagueActive(leagueId: string): Promise<boolean> {
  if (leagueId === '0') return true // Always-on channels
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const data = await res.json()
    if (data.events && data.events.length > 0) return true

    // Also check last 5 events
    const res2 = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${leagueId}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const data2 = await res2.json()
    if (!data2.events) return false
    const lastEvent = data2.events[data2.events.length - 1]
    if (!lastEvent?.strTimestamp) return false
    const daysSince = (Date.now() - new Date(lastEvent.strTimestamp).getTime()) / 86400000
    return daysSince < 3 // Active if last event was within 3 days
  } catch {
    return false
  }
}

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all sports channels from DB
  const { data: allChannels } = await supabase
    .from('channels')
    .select('id, name, url, logo')
    .eq('is_active', true)
    .or([
      'category.eq.sports',
      'name.ilike.%espn%',
      'name.ilike.%fox sport%',
      'name.ilike.%bein%',
      'name.ilike.%tyc%',
      'name.ilike.%dsport%',
      'name.ilike.%deport%',
      'name.ilike.%eurosport%',
      'name.ilike.%tnt sport%',
      'name.ilike.%dazn%',
      'name.ilike.%tudn%',
      'name.ilike.%win sport%',
      'name.ilike.%directv sport%',
    ].join(','))

  const channels = allChannels || []
  let processed = 0

  for (const league of LEAGUES) {
    // Find matching channels for this event/league
    const matched = channels.filter(ch =>
      league.keywords.some(kw => ch.name.toLowerCase().includes(kw.toLowerCase()))
    )
    if (matched.length === 0) continue

    // Check if this league is currently active
    const active = await isLeagueActive(league.id)

    // Upsert the event (create or update)
    const { data: existing } = await supabase
      .from('featured_events')
      .select('id')
      .eq('slug', league.slug)
      .single()

    if (existing) {
      // Update active status and refresh channels
      await supabase.from('featured_events')
        .update({ is_active: active, name: league.name, description: leagueDescription(league.name) })
        .eq('id', existing.id)

      // Refresh channels
      await supabase.from('event_channels').delete().eq('event_id', existing.id)
      if (active && matched.length > 0) {
        await supabase.from('event_channels').insert(
          matched.slice(0, 12).map((ch, i) => ({ event_id: existing.id, name: ch.name, url: ch.url, logo: ch.logo || null, sort_order: i }))
        )
      }
    } else if (active) {
      // Create new event
      const { data: newEvent } = await supabase
        .from('featured_events')
        .insert({ name: league.name, slug: league.slug, description: leagueDescription(league.name), color: league.color, is_active: true })
        .select('id')
        .single()

      if (newEvent && matched.length > 0) {
        await supabase.from('event_channels').insert(
          matched.slice(0, 12).map((ch, i) => ({ event_id: newEvent.id, name: ch.name, url: ch.url, logo: ch.logo || null, sort_order: i }))
        )
      }
    }

    processed++
  }

  return NextResponse.json({ success: true, processed })
}

export async function GET() {
  return POST()
}

function leagueDescription(name: string): string {
  const descs: Record<string, string> = {
    'Copa Mundial FIFA': 'Todos los partidos del Mundial de Fútbol en vivo',
    'Premier League': 'La liga inglesa de fútbol — velocidad y emoción',
    'La Liga': 'Primera División de España — el mejor fútbol español',
    'Bundesliga': 'La liga alemana — potencia y técnica',
    'Serie A': 'El calcio italiano — táctica y elegancia',
    'Ligue 1': 'La liga francesa de fútbol',
    'Liga MX': 'El fútbol mexicano en vivo',
    'Champions League': 'UEFA Champions League — el mejor fútbol de Europa',
    'Europa League': 'UEFA Europa League',
    'Copa Libertadores': 'El torneo más importante del fútbol sudamericano',
    'NBA': 'La mejor liga de basketball del mundo',
    'MLB': 'Major League Baseball — las Grandes Ligas',
    'NFL': 'La Liga Nacional de Fútbol Americano',
    'Fórmula 1': 'El Gran Circo — todos los Grandes Premios de F1',
    'Wimbledon': 'El torneo de tenis más prestigioso del mundo',
    'Roland Garros': 'El Abierto de Francia — tierra batida y emociones',
    'US Open Tennis': 'El US Open de tenis en Nueva York',
    'Tour de France': 'La carrera ciclista más famosa del mundo',
    'ESPN': 'Todos los canales ESPN disponibles',
    'Fox Sports': 'Los canales Fox Sports de México y Latinoamérica',
    'beIN Sports': 'Deportes internacionales en vivo',
    'TyC Sports': 'Deportes en español — TyC, DirecTV Sports y más',
  }
  return descs[name] || `${name} — transmisión en vivo`
}
