import { createClient } from '@supabase/supabase-js'

// TheSportsDB league IDs → event config
const LEAGUES = [
  // ⚽ Football / Soccer
  { id: '4480', name: 'Mundial FIFA', slug: 'mundial-fifa', color: '#facc15', icon: '🌍', keywords: [
    'fox sport', 'espn', 'tdn', 'telemundo', 'univision', 'rtve', 'bbc', 'itv', 'tvn',
    'canal 5', 'canal5', 'las estrellas', 'azteca', 'azteca 7', 'canal de las estrellas',
    'vix', 'unimas', 'canal 2', 'caracol', 'rcn', 'antena 3', 'la 1',
    'canal 13', 'chilevisión', 'mega', 'tv azteca', 'multimedios',
    'canal 9', 'america tv', 'canal 4', 'willax', 'rai',
  ]},
  { id: '4418', name: 'Eurocopa UEFA', slug: 'eurocopa', color: '#2563eb', icon: '🇪🇺', keywords: [
    'espn', 'fox sport', 'rtve', 'bbc', 'sky sport', 'rai', 'tf1', 'zdf',
    'antena 3', 'la 1', 'rai sport', 'ard', 'das erste', 'france tv',
  ]},
  { id: '4439', name: 'Copa América', slug: 'copa-america', color: '#16a34a', icon: '🏆', keywords: [
    'espn', 'fox sport', 'tdn', 'telemundo', 'directv sport', 'tyc', 'win sport',
    'caracol', 'rcn', 'canal 13', 'mega', 'las estrellas', 'canal 5', 'azteca',
    'vix', 'univision', 'univision deportes',
  ]},
  { id: '4346', name: 'Champions League', slug: 'champions-league', color: '#1d4ed8', icon: '⭐', keywords: ['champions', 'fox sport', 'espn', 'tnt sport', 'movistar', 'sky sport'] },
  { id: '4335', name: 'La Liga', slug: 'la-liga', color: '#ea580c', icon: '🇪🇸', keywords: ['la liga', 'laliga', 'dazn', 'espn', 'fox sport', 'movistar', 'gol tv'] },
  { id: '4328', name: 'Premier League', slug: 'premier-league', color: '#7c3aed', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', keywords: ['premier', 'sky sport', 'espn', 'dazn', 'bbc sport', 'itv sport'] },
  { id: '4331', name: 'Bundesliga', slug: 'bundesliga', color: '#ca8a04', icon: '🇩🇪', keywords: ['bundesliga', 'espn', 'dazn', 'eurosport', 'sport1'] },
  { id: '4332', name: 'Serie A', slug: 'serie-a', color: '#0369a1', icon: '🇮🇹', keywords: ['serie a', 'calcio', 'espn', 'dazn', 'rai sport'] },
  { id: '4391', name: 'Ligue 1', slug: 'ligue-1', color: '#1d4ed8', icon: '🇫🇷', keywords: ['ligue 1', 'canal+', 'espn', 'dazn', 'bein'] },
  { id: '4424', name: 'Copa Libertadores', slug: 'copa-libertadores', color: '#ca8a04', icon: '🏅', keywords: ['libertadores', 'espn', 'conmebol', 'directv sport', 'win sport'] },
  { id: '4406', name: 'MLS', slug: 'mls', color: '#dc2626', icon: '🇺🇸', keywords: ['mls', 'espn', 'fox sport', 'apple tv'] },
  { id: '4350', name: 'Liga MX', slug: 'liga-mx', color: '#16a34a', icon: '🇲🇽', keywords: [
    'liga mx', 'tudn', 'fox sport', 'espn', 'canal 5', 'canal5', 'azteca', 'azteca 7',
    'las estrellas', 'vix', 'blim', 'multimedios', 'canal de las estrellas',
  ]},
  { id: '4397', name: 'Eredivisie', slug: 'eredivisie', color: '#f97316', icon: '🇳🇱', keywords: ['eredivisie', 'espn', 'ziggo sport'] },
  { id: '4480', name: 'Nations League', slug: 'nations-league', color: '#0284c7', icon: '🌐', keywords: ['nations league', 'espn', 'fox sport', 'sky sport'] },
  // 🏀 Basketball
  { id: '4387', name: 'NBA', slug: 'nba', color: '#c2410c', icon: '🏀', keywords: ['nba', 'espn', 'tnt', 'nbc sport', 'abc', 'nba tv'] },
  { id: '4393', name: 'EuroLeague Basketball', slug: 'euroleague', color: '#7c3aed', icon: '🏀', keywords: ['euroleague', 'espn', 'bein'] },
  // 🏈 American Football
  { id: '4391', name: 'NFL', slug: 'nfl', color: '#1d4ed8', icon: '🏈', keywords: ['nfl', 'espn', 'fox sport', 'nbc sport', 'cbs sport', 'nfl network', 'abc'] },
  // ⚾ Baseball
  { id: '4424', name: 'MLB', slug: 'mlb', color: '#1d4ed8', icon: '⚾', keywords: ['mlb', 'espn', 'fox sport', 'mlb network', 'tbs'] },
  // 🏒 Hockey
  { id: '4380', name: 'NHL', slug: 'nhl', color: '#0369a1', icon: '🏒', keywords: ['nhl', 'espn', 'abc', 'tnt', 'nhl network'] },
  // 🎾 Tennis
  { id: '4370', name: 'Wimbledon', slug: 'wimbledon', color: '#16a34a', icon: '🎾', keywords: ['wimbledon', 'tennis', 'bbc sport', 'espn', 'eurosport'] },
  { id: '4370', name: 'Roland Garros', slug: 'roland-garros', color: '#ea580c', icon: '🎾', keywords: ['roland garros', 'tennis', 'eurosport', 'espn', 'france tv'] },
  { id: '4370', name: 'US Open Tennis', slug: 'us-open-tennis', color: '#0ea5e9', icon: '🎾', keywords: ['us open', 'tennis', 'espn'] },
  // 🏎 Motor sports
  { id: '4370', name: 'Fórmula 1', slug: 'formula-1', color: '#dc2626', icon: '🏎', keywords: ['formula 1', 'formula1', 'f1', 'espn', 'fox sport', 'eurosport', 'sky sport f1', 'movistar f1'] },
  { id: '4370', name: 'MotoGP', slug: 'motogp', color: '#f97316', icon: '🏍', keywords: ['motogp', 'moto gp', 'espn', 'fox sport', 'dazn'] },
  // 🚴 Cycling
  { id: '0', name: 'Tour de France', slug: 'tour-de-france', color: '#facc15', icon: '🚴', keywords: ['tour de france', 'cycling', 'ciclismo', 'eurosport', 'france tv'] },
  // 🥊 Combat sports
  { id: '0', name: 'UFC / MMA', slug: 'ufc-mma', color: '#dc2626', icon: '🥊', keywords: ['ufc', 'mma', 'espn', 'fox sport', 'dazn', 'fight'] },
  // 🌐 Always-on network hubs
  { id: '0', name: 'ESPN', slug: 'espn-canales', color: '#dc2626', icon: '📺', keywords: ['espn'] },
  { id: '0', name: 'Fox Sports', slug: 'fox-sports', color: '#1e40af', icon: '📺', keywords: ['fox sport', 'fs1', 'fs2'] },
  { id: '0', name: 'Sky Sports', slug: 'sky-sports', color: '#0ea5e9', icon: '📺', keywords: ['sky sport'] },
  { id: '0', name: 'beIN Sports', slug: 'bein-sports', color: '#0f766e', icon: '📺', keywords: ['bein'] },
  { id: '0', name: 'Eurosport', slug: 'eurosport', color: '#f97316', icon: '📺', keywords: ['eurosport'] },
  { id: '0', name: 'DAZN', slug: 'dazn', color: '#facc15', icon: '📺', keywords: ['dazn'] },
  { id: '0', name: 'TyC / DirecTV', slug: 'tyc-directv', color: '#fbbf24', icon: '📺', keywords: ['tyc', 'directv sport', 'dsport', 'win sport', 'claro sport'] },
  { id: '0', name: 'Movistar+', slug: 'movistar', color: '#06b6d4', icon: '📺', keywords: ['movistar'] },
  { id: '0', name: 'NBC Sports', slug: 'nbc-sports', color: '#7c3aed', icon: '📺', keywords: ['nbc sport', 'peacock'] },
]

async function isLeagueActive(leagueId: string): Promise<boolean> {
  if (leagueId === '0') return true
  try {
    const next = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`, { signal: AbortSignal.timeout(6000) })
    const nd = await next.json()
    if ((nd.events?.length ?? 0) > 0) return true
    const past = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${leagueId}`, { signal: AbortSignal.timeout(6000) })
    const pd = await past.json()
    if (!pd.events) return false
    const last = pd.events[pd.events.length - 1]
    return last?.strTimestamp ? (Date.now() - new Date(last.strTimestamp).getTime()) / 86400000 < 4 : false
  } catch { return false }
}

export async function syncEvents() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Include sports + entertainment (free-to-air channels like Telemundo, Canal 5, Azteca)
  const { data: allChannels } = await supabase
    .from('channels')
    .select('id, name, url, logo')
    .eq('is_active', true)
    .in('category', ['sports', 'entertainment', 'news'])

  const channels = allChannels || []

  for (const league of LEAGUES) {
    // Always create the event — even with 0 channels (matches show from TheSportsDB)
    const active = await isLeagueActive(league.id)

    const matched = channels.filter(ch =>
      league.keywords.some(kw => ch.name.toLowerCase().includes(kw.toLowerCase()))
    )

    const eventData = {
      name: league.name,
      slug: league.slug,
      description: buildDescription(league.name),
      color: league.color,
      is_active: active,
    }

    const { data: existing } = await supabase
      .from('featured_events')
      .select('id')
      .eq('slug', league.slug)
      .single()

    let eventId: string
    if (existing) {
      await supabase.from('featured_events').update(eventData).eq('id', existing.id)
      eventId = existing.id
    } else {
      const { data: created } = await supabase
        .from('featured_events')
        .insert(eventData)
        .select('id')
        .single()
      if (!created) continue
      eventId = created.id
    }

    // Update channels for this event
    if (active) {
      await supabase.from('event_channels').delete().eq('event_id', eventId)
      if (matched.length > 0) {
        await supabase.from('event_channels').insert(
          matched.slice(0, 12).map((ch, i) => ({
            event_id: eventId,
            name: ch.name,
            url: ch.url,
            logo: ch.logo || null,
            sort_order: i,
          }))
        )
      }
    }
  }
}

function buildDescription(name: string): string {
  const D: Record<string, string> = {
    'Mundial FIFA': 'La Copa del Mundo — el evento deportivo más grande del planeta',
    'Eurocopa UEFA': 'El Campeonato Europeo de selecciones nacionales',
    'Copa América': 'El torneo de selecciones más antiguo del mundo',
    'Champions League': 'UEFA Champions League — la élite del fútbol europeo',
    'La Liga': 'Primera División española — el mejor fútbol del mundo',
    'Premier League': 'La liga inglesa — la más vista del planeta',
    'Bundesliga': 'La liga alemana de fútbol',
    'Serie A': 'El calcio italiano — táctica y elegancia',
    'Ligue 1': 'La liga francesa de fútbol',
    'Copa Libertadores': 'El torneo más importante del fútbol sudamericano',
    'MLS': 'Major League Soccer — fútbol en Norteamérica',
    'Liga MX': 'La liga mexicana de fútbol',
    'NBA': 'La mejor liga de basketball del mundo',
    'EuroLeague Basketball': 'La élite del basketball europeo',
    'NFL': 'National Football League — fútbol americano',
    'MLB': 'Major League Baseball',
    'NHL': 'National Hockey League',
    'Wimbledon': 'El Grand Slam de hierba más importante del tenis',
    'Roland Garros': 'El Open de Francia — el Grand Slam de arcilla',
    'US Open Tennis': 'El US Open de tenis — el Grand Slam de Nueva York',
    'Fórmula 1': 'El Gran Circo — todos los Grandes Premios de F1',
    'MotoGP': 'El campeonato mundial de motociclismo',
    'Tour de France': 'La carrera ciclista más famosa del mundo',
    'UFC / MMA': 'UFC y artes marciales mixtas',
    'ESPN': 'Todos los canales ESPN disponibles',
    'Fox Sports': 'Los canales Fox Sports globales',
    'Sky Sports': 'Sky Sports — fútbol y deportes del Reino Unido',
    'beIN Sports': 'beIN Sports — deportes internacionales',
    'Eurosport': 'Eurosport — el canal europeo de deportes',
    'DAZN': 'DAZN — deportes en streaming',
    'TyC / DirecTV': 'TyC Sports, DirecTV Sports, Win Sports, Claro Sports',
    'Movistar+': 'Movistar+ Deportes',
    'NBC Sports': 'NBC Sports y Peacock Sports',
  }
  return D[name] || `${name} — en vivo y en directo`
}
