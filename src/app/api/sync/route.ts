import { NextResponse } from 'next/server'
import { ALL_COUNTRIES, loadChannelsMeta, syncCountry } from '@/lib/sync/channels'

export async function POST(req: Request) {
  const { country } = await req.json().catch(() => ({ country: 'mx' }))
  const target = ALL_COUNTRIES.includes(country) ? country : 'mx'

  const meta = await loadChannelsMeta()
  const inserted = await syncCountry(target, meta)

  return NextResponse.json({ success: true, inserted, country: target })
}
