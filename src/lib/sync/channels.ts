import { createClient } from '@supabase/supabase-js'

const BASE = 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams'

export const ALL_COUNTRIES = [
  // LatAm
  'mx','ar','co','cl','br','pe','ve','ec','bo','py','uy','cr','pa','gt','hn','sv','do','cu','pr',
  // Europe
  'es','pt','gb','it','fr','de','nl','be','ch','at','pl','ro','tr','se','no','dk',
  // North America & other
  'us','ca','au',
  // International
  'int',
]

type ChannelMeta = { country: string; categories: string[]; logo: string }

export async function loadChannelsMeta(): Promise<Map<string, ChannelMeta>> {
  const map = new Map<string, ChannelMeta>()
  try {
    const res = await fetch('https://iptv-org.github.io/api/channels.json', { signal: AbortSignal.timeout(15000) })
    const channels: Array<{ id: string; country: string; categories: string[]; logo?: string }> = await res.json()
    for (const c of channels) {
      map.set(c.id.toLowerCase(), { country: c.country.toLowerCase(), categories: c.categories, logo: c.logo || '' })
    }
  } catch { /* proceed without metadata */ }
  return map
}

export function normalizeCategory(cats: string[], name = ''): string {
  const n = name.toLowerCase()
  if (cats.length === 0) {
    if (/sport|deport|futbol|fútbol|bein|fox sport|espn|tyc|win sport|dsport|eurosport|nbc sport|sky sport|dazn|claro sport|movistar/i.test(n)) return 'sports'
    if (/news|notic|cnn|bbc|canal 24|24h|telediario|ntn/i.test(n)) return 'news'
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

export function parseM3U(text: string, defaultCountry: string, meta: Map<string, ChannelMeta>) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const channels: Array<{ name: string; url: string; tvg_id: string; logo: string | null; country: string; category: string }> = []
  let current: { name: string; channelId: string } | null = null

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const name = line.match(/,(.+)$/)?.[1]?.trim() || 'Sin nombre'
      const tvgId = line.match(/tvg-id="([^"]*)"/)?.[1] || ''
      const channelId = tvgId.split('@')[0].toLowerCase()
      current = { name, channelId }
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

export async function syncCountry(country: string, meta: Map<string, ChannelMeta>): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const url = `${BASE}/${country}.m3u`
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) return 0

    const text = await res.text()
    const channels = parseM3U(text, country, meta)
    if (channels.length === 0) return 0

    let inserted = 0
    for (let i = 0; i < channels.length; i += 200) {
      const batch = channels.slice(i, i + 200).map(c => ({
        name: c.name, url: c.url, tvg_id: c.tvg_id,
        logo: c.logo, country: c.country, category: c.category,
        language: null, is_active: true,
        last_synced_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from('channels').upsert(batch, { onConflict: 'url' })
      if (!error) inserted += batch.length
    }
    return inserted
  } catch {
    return 0
  }
}
