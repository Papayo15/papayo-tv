import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeCategory } from '@/lib/sync/channels'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const body = await req.json()
  const channels: { name: string; url: string; logo?: string; country?: string; category?: string }[] = body.channels || []
  if (!channels.length) return NextResponse.json({ error: 'Sin canales' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const rows = channels.map(ch => ({
    name: ch.name,
    url: ch.url,
    logo: ch.logo || null,
    country: ch.country || 'us',
    category: ch.category || normalizeCategory([], ch.name),
    is_active: true,
    last_synced_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('channels').upsert(rows, { onConflict: 'url' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, inserted: rows.length })
}
