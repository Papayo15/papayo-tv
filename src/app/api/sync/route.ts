import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const BASE = 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams'

const SOURCES = [
  { url: `${BASE}/mx.m3u`, country: 'mx' },
  { url: `${BASE}/es.m3u`, country: 'es' },
  { url: `${BASE}/ar.m3u`, country: 'ar' },
  { url: `${BASE}/us.m3u`, country: 'us' },
  { url: `${BASE}/co.m3u`, country: 'co' },
  { url: `${BASE}/cl.m3u`, country: 'cl' },
]

type ChannelMeta = { country: string; categories: string[]; logo: string }

async function loadChannelsMeta(): Promise<Map<string, ChannelMeta>> {
  const map = new Map<string, ChannelMeta>()
  try {
    const res = await fetch('https://iptv-org.github.io/api/channels.json', { signal: AbortSignal.timeout(15000) })
    const channels: Array<{ id: string; country: string; categories: string[]; logo?: string }> = await res.json()
    for (const c of channels) {
      map.set(c.id.toLowerCase(), { country: c.country.toLowerCase(), categories: c.categories, logo: c.logo || '' })
    }
  } catch {
    // proceed without metadata
  }
  return map
}

function normalizeCategory(cats: string[], name = ''): string {
  const n = name.toLowerCase()
  // Name-based fallback (catches channels not in the API)
  if (cats.length === 0) {
    if (/sport|deport|futbol|fútbol|bein|fox sport|espn|tyc|win sport|dsport|golazos/i.test(n)) return 'sports'
    if (/news|notic|canal 24|cnn|bbc|rtve|telediario|ntn|24h/i.test(n)) return 'news'
    if (/kids|niños|junior|cartoon|disney|nickelodeon|infantil/i.test(n)) return 'kids'
    if (/movie|pelicul|cine|film|cinema/i.test(n)) return 'movies'
    if (/music|mtv|vevo|hits|música/i.test(n)) return 'music'
    if (/doc|national geographic|history|discovery/i.test(n)) return 'documentary'
    return 'entertainment'
  }
  const c = cats[0].toLowerCase()
  if (c === 'sports') return 'sports'
  if (c === 'news') return 'news'
  if (c === 'kids') return 'kids'
  if (c === 'movies') return 'movies'
  if (c === 'music') return 'music'
  if (c === 'documentary') return 'documentary'
  if (c === 'entertainment' || c === 'general') return 'entertainment'
  return 'other'
}

function parseM3U(text: string, defaultCountry: string, meta: Map<string, ChannelMeta>) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const channels: Array<{ name: string; url: string; tvg_id: string; logo: string | null; country: string; category: string }> = []
  let current: { name: string; channelId: string; rawTvgId: string } | null = null

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const name = line.match(/,(.+)$/)?.[1]?.trim() || 'Sin nombre'
      const tvgId = line.match(/tvg-id="([^"]*)"/)?.[1] || ''
      const channelId = tvgId.split('@')[0].toLowerCase()
      current = { name, channelId, rawTvgId: tvgId }
    } else if (line.startsWith('http') && current) {
      const info = meta.get(current.channelId)
      channels.push({
        name: current.name,
        url: line,
        tvg_id: current.channelId,
        logo: info?.logo || null,
        country: info?.country || defaultCountry,
        category: normalizeCategory(info?.categories || [], current.name),
      })
      current = null
    }
  }
  return channels
}

export async function POST(req: Request) {
  const { country } = await req.json().catch(() => ({ country: 'mx' }))
  const source = SOURCES.find(s => s.country === country) || SOURCES[0]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [meta, m3uRes] = await Promise.all([
    loadChannelsMeta(),
    fetch(source.url, { signal: AbortSignal.timeout(25000) }),
  ])

  if (!m3uRes.ok) return NextResponse.json({ error: `Failed to fetch ${source.url}` }, { status: 500 })

  const text = await m3uRes.text()
  const channels = parseM3U(text, source.country, meta)

  if (channels.length === 0) return NextResponse.json({ inserted: 0 })

  let inserted = 0
  for (let i = 0; i < channels.length; i += 100) {
    const batch = channels.slice(i, i + 100).map(c => ({
      name: c.name,
      url: c.url,
      tvg_id: c.tvg_id,
      logo: c.logo,
      country: c.country,
      category: c.category,
      language: null,
      is_active: true,
      last_synced_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from('channels').upsert(batch, { onConflict: 'url' })
    if (!error) inserted += batch.length
  }

  return NextResponse.json({ success: true, inserted, country: source.country })
}
