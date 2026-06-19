import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3'

// Key LatAm + Spain leagues
const LEAGUES = [
  { id: '4350', name: 'Liga MX', country: 'mx' },
  { id: '4406', name: 'Liga Profesional Argentina', country: 'ar' },
  { id: '4351', name: 'Campeonato Brasileiro', country: 'br' },
  { id: '4352', name: 'Primera División Chile', country: 'cl' },
  { id: '4353', name: 'Liga Colombiana', country: 'co' },
  { id: '4480', name: 'Copa Libertadores', country: 'latam' },
  { id: '4481', name: 'Copa Sudamericana', country: 'latam' },
  { id: '4328', name: 'La Liga', country: 'es' },
  { id: '4335', name: 'UEFA Champions League', country: 'eu' },
]

interface SportsDBEvent {
  idEvent: string
  strEvent: string
  strSport: string
  strLeague: string
  strHomeTeam?: string
  strAwayTeam?: string
  strTimestamp?: string
  strThumb?: string
  dateEvent?: string
  strTime?: string
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const allEvents: SportsDBEvent[] = []

  // Fetch upcoming events for each league
  for (const league of LEAGUES) {
    try {
      const res = await fetch(`${SPORTSDB_BASE}/eventsnextleague.php?id=${league.id}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()
      if (data.events) allEvents.push(...data.events)
    } catch {
      // Skip failed leagues
    }
  }

  // Also fetch live events
  try {
    const liveRes = await fetch(`${SPORTSDB_BASE}/liveevents.php`, {
      signal: AbortSignal.timeout(10000),
    })
    if (liveRes.ok) {
      const liveData = await liveRes.json()
      if (liveData.events) allEvents.push(...liveData.events)
    }
  } catch {
    // Skip
  }

  if (allEvents.length === 0) {
    return new Response(JSON.stringify({ success: true, inserted: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const now = new Date()

  // Deduplicate by idEvent
  const unique = [...new Map(allEvents.map(e => [e.idEvent, e])).values()]

  // Only keep events within next 7 days or that just ended
  const filtered = unique.filter(e => {
    if (!e.dateEvent) return false
    const date = new Date(`${e.dateEvent}T${e.strTime || '00:00:00'}`)
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return date >= new Date(now.getTime() - 4 * 60 * 60 * 1000) && date <= future
  })

  const rows = filtered.map(e => {
    const startsAt = e.dateEvent
      ? new Date(`${e.dateEvent}T${e.strTime || '00:00:00'}Z`).toISOString()
      : null

    const endsAt = startsAt
      ? new Date(new Date(startsAt).getTime() + 3 * 60 * 60 * 1000).toISOString()
      : null

    const isLive = startsAt
      ? new Date(startsAt) <= now && (!endsAt || new Date(endsAt) >= now)
      : false

    return {
      id: e.idEvent,
      name: e.strEvent,
      sport: e.strSport || 'Soccer',
      league: e.strLeague || 'Unknown',
      home_team: e.strHomeTeam || null,
      away_team: e.strAwayTeam || null,
      poster_url: e.strThumb || null,
      starts_at: startsAt,
      ends_at: endsAt,
      is_live: isLive,
      source: 'thesportsdb',
    }
  })

  const { error } = await supabase
    .from('sports_events')
    .upsert(rows, { onConflict: 'id' })

  // Clean up past events
  await supabase
    .from('sports_events')
    .delete()
    .lt('ends_at', new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString())

  return new Response(
    JSON.stringify({ success: !error, inserted: rows.length, error: error?.message }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
