import { NextResponse } from 'next/server'
import { ALL_COUNTRIES, syncCountry } from '@/lib/sync/channels'

export const maxDuration = 60

export async function POST(req: Request) {
  const { country } = await req.json().catch(() => ({ country: 'mx' }))
  const target = ALL_COUNTRIES.includes(country) ? country : 'mx'
  const inserted = await syncCountry(target) // no metadata needed — name-based categorization
  return NextResponse.json({ success: true, inserted, country: target })
}
