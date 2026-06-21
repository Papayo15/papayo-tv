import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

async function isAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(7000),
      headers: { 'User-Agent': 'Mozilla/5.0 IPTV/1.0' },
    })
    if (!res.ok) return false
    const text = await res.text()
    return text.toLowerCase().includes('#ext')
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const action = body.action as 'audit' | 'delete' // audit=only report, delete=remove dead

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch sports channels in batches (offset via body)
  const offset = body.offset ?? 0
  const limit = 50
  const { data: channels, error } = await supabase
    .from('channels')
    .select('id, name, url')
    .eq('category', 'sports')
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!channels?.length) return NextResponse.json({ done: true, tested: 0, dead: [] })

  // Test all concurrently
  const results = await Promise.all(
    channels.map(async (ch) => ({
      id: ch.id,
      name: ch.name,
      url: ch.url,
      alive: await isAlive(ch.url),
    }))
  )

  const dead = results.filter(r => !r.alive)
  const alive = results.filter(r => r.alive)

  if (action === 'delete' && dead.length) {
    await supabase.from('channels').delete().in('id', dead.map(d => d.id))
  }

  return NextResponse.json({
    done: channels.length < limit,
    tested: channels.length,
    alive: alive.length,
    dead: dead.length,
    deadChannels: dead.map(d => ({ id: d.id, name: d.name })),
    offset,
    nextOffset: offset + limit,
  })
}
