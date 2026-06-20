import { NextResponse } from 'next/server'
import { ALL_COUNTRIES, loadChannelsMeta, syncCountry } from '@/lib/sync/channels'

// Countries in batches — each batch runs in parallel, batches are sequential
const BATCHES = [
  ['mx', 'ar', 'co', 'cl', 'br', 'pe'],
  ['ve', 'ec', 'bo', 'py', 'uy', 'cr', 'do', 'pr'],
  ['es', 'pt', 'gb', 'it', 'fr', 'de'],
  ['nl', 'be', 'at', 'se', 'no', 'dk'],
  ['us', 'ca', 'au', 'int'],
]

export async function GET() { return run() }
export async function POST() { return run() }

async function run() {
  // Load metadata once — shared across all country syncs
  const meta = await loadChannelsMeta()

  let channelsTotal = 0
  for (const batch of BATCHES) {
    const results = await Promise.all(
      batch.filter(c => ALL_COUNTRIES.includes(c)).map(c => syncCountry(c, meta))
    )
    channelsTotal += results.reduce((a, b) => a + b, 0)
  }

  // Sync EPG (best effort)
  let epgTotal = 0
  try {
    const { syncEpg } = await import('@/lib/sync/epg')
    epgTotal = await syncEpg()
  } catch { /* not critical */ }

  // Auto-sync events (best effort)
  try {
    const { syncEvents } = await import('@/lib/sync/events')
    await syncEvents()
  } catch { /* not critical */ }

  return NextResponse.json({
    success: true,
    channels: channelsTotal,
    epg: epgTotal,
    synced_at: new Date().toISOString(),
  })
}
