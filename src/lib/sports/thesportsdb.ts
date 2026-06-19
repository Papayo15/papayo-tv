// TheSportsDB free API - no key required for basic endpoints
const BASE = 'https://www.thesportsdb.com/api/v1/json/3'

export interface SportEvent {
  idEvent: string
  strEvent: string
  strSport: string
  strLeague: string
  strHomeTeam?: string
  strAwayTeam?: string
  strTimestamp?: string
  strThumb?: string
  strStatus?: string
  dateEvent?: string
  strTime?: string
}

export async function getLiveSportsEvents(): Promise<SportEvent[]> {
  try {
    const res = await fetch(`${BASE}/liveevents.php`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch {
    return []
  }
}

export async function getEventsForLeague(leagueId: string): Promise<SportEvent[]> {
  try {
    const res = await fetch(`${BASE}/eventsnextleague.php?id=${leagueId}`, {
      next: { revalidate: 1800 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch {
    return []
  }
}

// Key LatAm football leagues
export const LATAM_LEAGUES = [
  { id: '4350', name: 'Liga MX', country: 'México' },
  { id: '4406', name: 'Liga Profesional Argentina', country: 'Argentina' },
  { id: '4351', name: 'Campeonato Brasileiro', country: 'Brasil' },
  { id: '4352', name: 'Primera División Chile', country: 'Chile' },
  { id: '4353', name: 'Liga Colombiana', country: 'Colombia' },
  { id: '4480', name: 'Copa Libertadores', country: 'LatAm' },
  { id: '4481', name: 'Copa Sudamericana', country: 'LatAm' },
  { id: '4328', name: 'La Liga', country: 'España' },
] as const
