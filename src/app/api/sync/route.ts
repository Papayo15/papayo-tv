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
  if (/sport|deport|fútbol|futbol|bein|beinsport|espn|tyc|win sport|winsport|dsport|eurosport|nbc sport|nbcsport|sky sport|skysport|dazn|claro sport|movistar|tudn|teledeporte|arena sport|bt sport|canal\+ sport|premier sport|stadium|gol tv|golazotv|golf channel|tennis channel|fight network|boxing|wrestl|ufc|mma|nascar|f1|formula|racing|formula one|motorsport|golf tv|futv|caracol dep|antena 2|rcn dep|sport1|sport 1|sport 2|sport 3|bein 1|bein 2|bein 3|onefootball|la liga tv|premier league tv|serie a tv|bundesliga tv|conmebol|concacaf|nfl network|mlb network|nba tv|tnt sport|tntsp|max sport|nova sport|polsat sport|eleven sport|match tv|match! sport|viasat sport|canal dos sport|canal 7 dep|tv3 deport|directv sport|directvsport/i.test(n)) return 'sports'
  if (/news|notic|cnn|bbc|canal 24|24h|ntn|n24|tlc news|france 24|al jazeera|euronews|rtve|antena 3 noticias|infobae|telemundo|univision news|abc news|nbc news|fox news|telesur|hispan tv|russia today|rt en/i.test(n)) return 'news'
  if (/kids|niños|junior|cartoon|disney|nickelodeon|infantil|paka paka|clan tv|baby tv|boomerang|discovery kids|mini|tiji|gulli|boing|gloob|tv5 monde junior/i.test(n)) return 'kids'
  if (/movie|pelicul|cine|film|cinema|hollywood|tcm|amc|tnt movie|fx movie|hbo|max orig|paramount|starz|showtime|cinemax|lifetime|hallmark/i.test(n)) return 'movies'
  if (/music|mtv|vevo|hits|música|vh1|rock antena|hit music|los40|calle 13|canal fiesta/i.test(n)) return 'music'
  if (/doc|national geographic|natgeo|history|discovery|animal planet|odisea|viajar|viajes|cooking|food network|hogar|home|planet/i.test(n)) return 'documentary'
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

  // Check if tvg_id column exists (migration 003 may not have been run)
  const { error: colCheck } = await supabase.from('channels').select('tvg_id').limit(1)
  const hasTvgId = !colCheck

  let inserted = 0
  for (let i = 0; i < channels.length; i += 200) {
    const batch = channels.slice(i, i + 200).map(c => {
      const row: Record<string, unknown> = {
        name: c.name, url: c.url,
        logo: c.logo, country: c.country, category: c.category,
        language: null, is_active: true, last_synced_at: new Date().toISOString(),
      }
      if (hasTvgId) row.tvg_id = c.tvg_id
      return row
    })
    const { error } = await supabase.from('channels').upsert(batch, { onConflict: 'url' })
    if (error) return NextResponse.json({ inserted, country, parsed: channels.length, dbError: error.message })
    inserted += batch.length
  }

  return NextResponse.json({ inserted, country, parsed: channels.length })
}
