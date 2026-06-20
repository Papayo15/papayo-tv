import { NextResponse } from 'next/server'

const COUNTRIES = ['mx', 'es', 'ar', 'us', 'co', 'cl']
const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export async function GET() {
  return run()
}

export async function POST() {
  return run()
}

async function run() {
  let channelsTotal = 0

  // Sync all countries sequentially
  for (const country of COUNTRIES) {
    try {
      const res = await fetch(`${BASE_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
        signal: AbortSignal.timeout(40000),
      })
      const data = await res.json()
      if (data.inserted) channelsTotal += data.inserted
    } catch {
      // continue with next country
    }
  }

  // Sync EPG
  let epgTotal = 0
  try {
    const res = await fetch(`${BASE_URL}/api/sync-epg`, { method: 'POST', signal: AbortSignal.timeout(40000) })
    const data = await res.json()
    epgTotal = data.inserted || 0
  } catch { /* not critical */ }

  // Auto-sync events (creates/updates event sections from channels)
  try {
    await fetch(`${BASE_URL}/api/sync-events`, { method: 'POST', signal: AbortSignal.timeout(30000) })
  } catch { /* not critical */ }

  return NextResponse.json({
    success: true,
    channels: channelsTotal,
    epg: epgTotal,
    synced_at: new Date().toISOString(),
  })
}
