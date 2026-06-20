import { createClient } from '@supabase/supabase-js'

const LEAGUES = [
  { id: '4346', name: 'Champions League', slug: 'champions-league', color: '#1d4ed8', keywords: ['champions', 'uefa champions', 'fox sport', 'espn', 'tnt sport', 'movistar'] },
  { id: '4335', name: 'La Liga', slug: 'la-liga', color: '#ea580c', keywords: ['la liga', 'laliga', 'dazn', 'espn', 'fox sport', 'movistar'] },
  { id: '4328', name: 'Premier League', slug: 'premier-league', color: '#7c3aed', keywords: ['premier', 'sky sport', 'espn', 'dazn'] },
  { id: '4331', name: 'Bundesliga', slug: 'bundesliga', color: '#ca8a04', keywords: ['bundesliga', 'espn', 'dazn', 'eurosport'] },
  { id: '4332', name: 'Serie A', slug: 'serie-a', color: '#0369a1', keywords: ['serie a', 'espn', 'dazn'] },
  { id: '4391', name: 'Ligue 1', slug: 'ligue-1', color: '#1d4ed8', keywords: ['ligue', 'canal+', 'espn', 'dazn'] },
  { id: '4424', name: 'Copa Libertadores', slug: 'copa-libertadores', color: '#ca8a04', keywords: ['libertadores', 'espn', 'conmebol'] },
  { id: '4387', name: 'NBA', slug: 'nba', color: '#c2410c', keywords: ['nba', 'espn', 'tnt', 'nbc sport'] },
  { id: '4370', name: 'Fórmula 1', slug: 'formula-1', color: '#dc2626', keywords: ['formula 1', 'formula1', 'f1', 'espn', 'fox sport', 'eurosport', 'sky sport f1'] },
  { id: '0', name: 'Tour de France', slug: 'tour-de-france', color: '#facc15', keywords: ['tour de france', 'cycling', 'ciclismo', 'eurosport'] },
  { id: '0', name: 'ESPN', slug: 'espn-canales', color: '#dc2626', keywords: ['espn'] },
  { id: '0', name: 'Fox Sports', slug: 'fox-sports', color: '#1e40af', keywords: ['fox sport'] },
  { id: '0', name: 'beIN Sports', slug: 'bein-sports', color: '#0f766e', keywords: ['bein'] },
  { id: '0', name: 'Eurosport', slug: 'eurosport', color: '#f97316', keywords: ['eurosport'] },
  { id: '0', name: 'Sky Sports', slug: 'sky-sports', color: '#0ea5e9', keywords: ['sky sport'] },
  { id: '0', name: 'DAZN', slug: 'dazn', color: '#facc15', keywords: ['dazn'] },
  { id: '0', name: 'TyC Sports', slug: 'tyc-sports', color: '#fbbf24', keywords: ['tyc', 'directv sport', 'dsport', 'win sport', 'claro sport'] },
  { id: '0', name: 'Movistar+', slug: 'movistar', color: '#06b6d4', keywords: ['movistar'] },
]

async function isLeagueActive(leagueId: string): Promise<boolean> {
  if (leagueId === '0') return true
  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`, { signal: AbortSignal.timeout(6000) })
    const data = await res.json()
    if (data.events?.length > 0) return true
    const res2 = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${leagueId}`, { signal: AbortSignal.timeout(6000) })
    const data2 = await res2.json()
    if (!data2.events) return false
    const last = data2.events[data2.events.length - 1]
    return last?.strTimestamp ? (Date.now() - new Date(last.strTimestamp).getTime()) / 86400000 < 3 : false
  } catch { return false }
}

const DESCRIPTIONS: Record<string, string> = {
  'Champions League': 'UEFA Champions League — el mejor fútbol de Europa',
  'La Liga': 'Primera División de España — el mejor fútbol español',
  'Premier League': 'La liga inglesa — velocidad y emoción',
  'Bundesliga': 'La liga alemana — potencia y técnica',
  'Serie A': 'El calcio italiano — táctica y elegancia',
  'Ligue 1': 'La liga francesa de fútbol',
  'Copa Libertadores': 'El torneo más importante del fútbol sudamericano',
  'NBA': 'La mejor liga de basketball del mundo',
  'Fórmula 1': 'El Gran Circo — todos los Grandes Premios de F1',
  'Tour de France': 'La carrera ciclista más famosa del mundo',
  'ESPN': 'Todos los canales ESPN disponibles',
  'Fox Sports': 'Los canales Fox Sports de México y Latinoamérica',
  'beIN Sports': 'Deportes internacionales en vivo',
  'Eurosport': 'El canal europeo de deportes',
  'Sky Sports': 'Sky Sports — fútbol y más del Reino Unido',
  'DAZN': 'DAZN — deportes en streaming',
  'TyC Sports': 'TyC Sports, DirecTV Sports, Win Sports, Claro Sports',
  'Movistar+': 'Movistar+ Deportes — Liga, Champions y más',
}

export async function syncEvents() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: allChannels } = await supabase
    .from('channels')
    .select('id, name, url, logo')
    .eq('is_active', true)
    .eq('category', 'sports')

  const channels = allChannels || []

  for (const league of LEAGUES) {
    const matched = channels.filter(ch =>
      league.keywords.some(kw => ch.name.toLowerCase().includes(kw.toLowerCase()))
    )
    if (matched.length === 0) continue

    const active = await isLeagueActive(league.id)

    const { data: existing } = await supabase.from('featured_events').select('id').eq('slug', league.slug).single()

    if (existing) {
      await supabase.from('featured_events').update({ is_active: active, name: league.name, description: DESCRIPTIONS[league.name] || '' }).eq('id', existing.id)
      await supabase.from('event_channels').delete().eq('event_id', existing.id)
      if (active) {
        await supabase.from('event_channels').insert(matched.slice(0, 12).map((ch, i) => ({ event_id: existing.id, name: ch.name, url: ch.url, logo: ch.logo || null, sort_order: i })))
      }
    } else if (active) {
      const { data: newEvent } = await supabase.from('featured_events').insert({ name: league.name, slug: league.slug, description: DESCRIPTIONS[league.name] || '', color: league.color, is_active: true }).select('id').single()
      if (newEvent) {
        await supabase.from('event_channels').insert(matched.slice(0, 12).map((ch, i) => ({ event_id: newEvent.id, name: ch.name, url: ch.url, logo: ch.logo || null, sort_order: i })))
      }
    }
  }
}
