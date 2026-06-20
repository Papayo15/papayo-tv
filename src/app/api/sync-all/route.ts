import { NextResponse } from 'next/server'
import { ALL_COUNTRIES, syncCountry } from '@/lib/sync/channels'

export const maxDuration = 60

// Priority countries for the cron — most important for content
const CRON_COUNTRIES = ['mx', 'ar', 'co', 'cl', 'br', 'pe', 'es', 'pt', 'gb', 'us']

export async function GET() { return run() }
export async function POST() { return run() }

async function run() {
  // Sync priority countries in parallel (fits within 60s)
  const results = await Promise.all(CRON_COUNTRIES.map(c => syncCountry(c)))
  const channelsTotal = results.reduce((a, b) => a + b, 0)

  return NextResponse.json({
    success: true,
    channels: channelsTotal,
    synced_at: new Date().toISOString(),
  })
}
