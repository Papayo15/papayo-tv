import { NextResponse } from 'next/server'

// All countries to sync — grouped so we can do them in parallel batches
const COUNTRY_BATCHES = [
  // LatAm batch 1
  ['mx', 'ar', 'co', 'cl', 'br', 'pe'],
  // LatAm batch 2
  ['ve', 'ec', 'bo', 'py', 'uy', 'cr', 'pa', 'gt'],
  // LatAm batch 3
  ['hn', 'sv', 'do', 'cu', 'pr'],
  // Europe batch 1
  ['es', 'pt', 'gb', 'it', 'fr', 'de'],
  // Europe batch 2
  ['nl', 'be', 'ch', 'at', 'pl', 'ro', 'tr', 'se'],
  // Others
  ['us', 'ca', 'au', 'int'],
]

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function GET() { return run() }
export async function POST() { return run() }

async function syncCountry(country: string): Promise<number> {
  try {
    const res = await fetch(`${BASE_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country }),
      signal: AbortSignal.timeout(35000),
    })
    const data = await res.json()
    return data.inserted || 0
  } catch {
    return 0
  }
}

async function run() {
  let channelsTotal = 0

  // Sync countries in parallel batches (each batch runs in parallel, batches are sequential)
  for (const batch of COUNTRY_BATCHES) {
    const results = await Promise.all(batch.map(syncCountry))
    channelsTotal += results.reduce((a, b) => a + b, 0)
  }

  // Sync EPG
  let epgTotal = 0
  try {
    const res = await fetch(`${BASE_URL}/api/sync-epg`, { method: 'POST', signal: AbortSignal.timeout(40000) })
    const data = await res.json()
    epgTotal = data.inserted || 0
  } catch { /* not critical */ }

  // Auto-sync events
  try {
    await fetch(`${BASE_URL}/api/sync-events`, { method: 'POST', signal: AbortSignal.timeout(40000) })
  } catch { /* not critical */ }

  return NextResponse.json({
    success: true,
    channels: channelsTotal,
    epg: epgTotal,
    synced_at: new Date().toISOString(),
  })
}
