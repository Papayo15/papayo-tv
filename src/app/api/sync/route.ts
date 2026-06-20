import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const BASE = 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams'

const ALL_COUNTRIES = [
  'mx','ar','co','cl','br','pe','ve','ec','bo','py','uy','cr','pa','gt','hn','sv','do','cu','pr',
  'es','pt','gb','it','fr','de','nl','be','ch','at','pl','ro','tr','se','no','dk',
  'us','ca','au','int',
]

function cat(name: string): string {
  const n = name.toLowerCase()
  if (/sport|deport|futbol|fútbol|bein|fox sport|espn|tyc|win sport|eurosport|nbc sport|sky sport|dazn|claro sport|movistar/i.test(n)) return 'sports'
  if (/news|notic|cnn|bbc|canal 24|24h|ntn/i.test(n)) return 'news'
  if (/kids|niños|junior|cartoon|disney|nickelodeon|infantil/i.test(n)) return 'kids'
  if (/movie|pelicul|cine|film|cinema/i.test(n)) return 'movies'
  if (/music|mtv|vevo|hits|música/i.test(n)) return 'music'
  if (/doc|national geographic|history|discovery/i.test(n)) return 'documentary'
  return 'entertainment'
}

function parseM3U(text: string, country: string) {
  const lines = text.split('\n')
  const out: Array<{ name: string; url: string; tvg_id: string | null; logo: string | null; country: string; category: string }> = []
  let pending: { name: string; tvg_id: string | null; logo: string | null; category: string } | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith('#EXTINF:')) {
      const name = line.match(/,(.+)$/)?.[1]?.trim() || 'Sin nombre'
      const tvgId = (line.match(/tvg-id="([^"]*)"/)?.[1] || '').split('@')[0].toLowerCase() || null
      const logo = line.match(/tvg-logo="([^"]+)"/)?.[1] || null
      const grp = line.match(/group-title="([^"]*)"/)?.[1] || ''
      pending = { name, tvg_id: tvgId, logo, category: grp ? cat(grp) : cat(name) }
    } else if (line.startsWith('http') && pending) {
      out.push({ ...pending, url: line, country })
      pending = null
    }
  }
  return out
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const country = (body.country && ALL_COUNTRIES.includes(body.country)) ? body.country : 'mx'

  // Fetch M3U
  let text = ''
  try {
    const res = await fetch(`${BASE}/${country}.m3u`, { signal: AbortSignal.timeout(25000) })
    if (!res.ok) return NextResponse.json({ inserted: 0, country, error: `fetch ${res.status}` })
    text = await res.text()
  } catch (e) {
    return NextResponse.json({ inserted: 0, country, error: String(e) })
  }

  const channels = parseM3U(text, country)
  if (channels.length === 0) {
    return NextResponse.json({ inserted: 0, country, error: 'parse:0', lines: text.split('\n').length })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let inserted = 0
  for (let i = 0; i < channels.length; i += 200) {
    const batch = channels.slice(i, i + 200).map(c => ({
      name: c.name, url: c.url, tvg_id: c.tvg_id,
      logo: c.logo, country: c.country, category: c.category,
      language: null, is_active: true, last_synced_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from('channels').upsert(batch, { onConflict: 'url' })
    if (error) return NextResponse.json({ inserted, country, parsed: channels.length, dbError: error.message })
    inserted += batch.length
  }

  return NextResponse.json({ inserted, country, parsed: channels.length })
}
