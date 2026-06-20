import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseM3U, normalizeCategory } from '@/lib/sync/channels'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Strip leading junk chars (*, spaces, dashes) the user might accidentally paste
  const url = (body.url || '').replace(/^[^h]+(?=https?:\/\/)/, '').trim()
  if (!url || !url.startsWith('http')) return NextResponse.json({ error: 'URL requerida (debe empezar con http)' }, { status: 400 })

  // Fetch the M3U
  let text = ''
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(25000),
      headers: { 'User-Agent': 'Mozilla/5.0 IPTV/1.0' },
    })
    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status} al descargar la lista` }, { status: 400 })
    text = await res.text()
  } catch (e) {
    return NextResponse.json({ error: `No se pudo descargar: ${e}` }, { status: 400 })
  }

  if (!text.includes('#EXTM3U')) {
    return NextResponse.json({ error: 'El contenido no es una lista M3U válida' }, { status: 400 })
  }

  const parsed = parseM3U(text, 'int', new Map())
  if (!parsed.length) return NextResponse.json({ error: 'La lista está vacía o no tiene canales' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if tvg_id column exists
  const { error: colCheck } = await supabase.from('channels').select('tvg_id').limit(1)
  const hasTvgId = !colCheck

  const rows = parsed.map(ch => {
    const row: Record<string, unknown> = {
      name: ch.name,
      url: ch.url,
      logo: ch.logo || null,
      country: 'int',
      category: normalizeCategory(ch.category ? [ch.category] : [], ch.name),
      language: null,
      is_active: true,
      last_synced_at: new Date().toISOString(),
    }
    if (hasTvgId) row.tvg_id = ch.tvg_id || null
    return row
  })

  let inserted = 0
  const errors: string[] = []
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200)
    const { error } = await supabase.from('channels').upsert(batch, { onConflict: 'url' })
    if (error) errors.push(error.message)
    else inserted += batch.length
  }

  // Save URL as playlist_source for daily re-sync
  const sourceName = url.split('/').pop()?.split('?')[0]?.slice(0, 80) || url.slice(0, 80)
  await supabase
    .from('playlist_sources')
    .upsert(
      { name: sourceName, url, country: 'int', service: 'custom', channel_count: inserted, last_synced_at: new Date().toISOString() },
      { onConflict: 'url' }
    )

  return NextResponse.json({
    success: true,
    parsed: parsed.length,
    inserted,
    errors: errors.slice(0, 3),
  })
}
