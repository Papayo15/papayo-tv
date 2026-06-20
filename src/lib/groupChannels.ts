import type { Channel } from '@/types/channel'

export interface ChannelGroup {
  id: string          // primary channel id
  name: string        // display name (cleanest version)
  logo: string | null
  country: string
  category: string
  primary: string     // primary stream URL
  fallbacks: string[] // backup URLs
  count: number       // total signals
}

// Strip quality tags — never differentiate a channel
const QUALITY = /\s*[\[\(]?\s*(hd|sd|fhd|4k|uhd|hq|lq|hevc|full\s?hd|1080p?|720p?|480p?|h265|h264)\s*[\]\)]?\s*$/gi
// Strip GENERIC region labels (don't identify a specific country feed)
const GENERIC_REGION = /\s*[\[\(]?\s*(latino|latina|latam|latin america|america latina?|internacional|international|global|world|la)\s*[\]\)]?\s*$/gi
// Strip separator noise before HD/SD only
const NOISE   = /\s*[\|\-]\s*(hd|sd|hq)\s*$/gi
const REPEAT  = /\s{2,}/g

// Country name → code (so "Argentina" and "ARG" and "(ARG)" all become the same key)
const COUNTRY_MAP: Record<string, string> = {
  argentina: 'arg', argentina2: 'arg',
  mexico: 'mx', méxico: 'mx', mexicano: 'mx',
  colombia: 'col', colombiano: 'col',
  chile: 'cl', chileno: 'cl',
  peru: 'pe', perú: 'pe', peruano: 'pe',
  venezuela: 've', venezolano: 've',
  brasil: 'br', brazil: 'br', brasileño: 'br',
  españa: 'es', spain: 'es', espana: 'es',
  'estados unidos': 'us', usa: 'us',
  ecuador: 'ec', bolivia: 'bo', paraguay: 'py',
  uruguay: 'uy', panama: 'pa', panamá: 'pa',
  'costa rica': 'cr', guatemala: 'gt', honduras: 'hn',
}

function applyCountryMap(s: string): string {
  // Handle "(ARG)entina", "(MEX)ico" etc. — code inside parens + word continues outside
  s = s.replace(/\(([A-Z]{2,4})\)([a-záéíóúñü]*)/gi, (_, code) => ' ' + code.toLowerCase())
  // Replace parenthesized country refs: (Argentina) → arg, (ARG) → arg
  s = s.replace(/\s*[\[\(]\s*([a-záéíóúñü\s]+)\s*[\]\)]/gi, (_, c) => {
    const key = c.trim().toLowerCase()
    return ' ' + (COUNTRY_MAP[key] || key)
  })
  // Replace standalone country names at end: "ESPN Argentina" → "espn argentina" → "espn arg"
  for (const [full, code] of Object.entries(COUNTRY_MAP)) {
    s = s.replace(new RegExp(`\\s+${full}\\s*$`, 'i'), ` ${code}`)
  }
  return s
}

export function normalizeName(name: string): string {
  let s = name
    // Strip group-title prefixes like "LA: ", "MX: ", "ES: " from M3U files
    .replace(/^[A-Z]{2,4}:\s*/g, '')
    // Strip trailing separators left after removing region/quality
    .replace(/\s*[\|\-\/]\s*$/, '')
    .replace(QUALITY, '')
    .replace(GENERIC_REGION, '')
    .replace(NOISE, '')
    .replace(REPEAT, ' ')
    .trim()
    .toLowerCase()
  s = applyCountryMap(s)
  return s.replace(REPEAT, ' ').trim()
}

export function groupChannels(channels: Channel[]): ChannelGroup[] {
  const map = new Map<string, ChannelGroup>()

  for (const ch of channels) {
    const key = normalizeName(ch.name)
    if (!key) continue

    if (map.has(key)) {
      const g = map.get(key)!
      if (!g.fallbacks.includes(ch.url)) {
        g.fallbacks.push(ch.url)
        g.count++
      }
      // Prefer the version with a logo
      if (!g.logo && ch.logo) g.logo = ch.logo
    } else {
      map.set(key, {
        id: ch.id,
        name: ch.name,  // keep original name; prefer shortest on merge
        logo: ch.logo ?? null,
        country: ch.country,
        category: ch.category,
        primary: ch.url,
        fallbacks: [],
        count: 1,
      })
    }
    // Keep the shortest/cleanest name as display name (fewer qualifiers = cleaner)
    const g = map.get(key)!
    if (ch.name.length < g.name.length) g.name = ch.name
  }

  return Array.from(map.values())
}
