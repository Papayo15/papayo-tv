import type { Channel } from '@/types/channel'

export interface ChannelGroup {
  id: string
  name: string
  logo: string | null
  country: string
  category: string
  primary: string
  fallbacks: string[]
  count: number
}

const QUALITY        = /\s*[\[\(]?\s*(hd|sd|fhd|4k|uhd|hq|lq|hevc|full\s?hd|1080p?|720p?|480p?|h265|h264)\s*[\]\)]?\s*$/gi
const GENERIC_REGION = /\s*[\[\(]?\s*(latino|latina|latam|latin\s?america|america\s?latina?|internacional|international|global|world)\s*[\]\)]?\s*$/gi
const NOISE          = /\s*[\|\-]\s*(hd|sd|hq)\s*$/gi
const REPEAT         = /\s{2,}/g
const M3U_PREFIX     = /^[A-Z]{2,4}:\s*/

// Country names/codes → canonical 2-3 letter code
const COUNTRY_MAP: Record<string, string> = {
  argentina: 'arg', mexico: 'mx', méxico: 'mx', colombia: 'col',
  chile: 'cl', peru: 'pe', perú: 'pe', venezuela: 've',
  brasil: 'br', brazil: 'br', españa: 'es', spain: 'es', espana: 'es',
  'estados unidos': 'us', usa: 'us', ecuador: 'ec', bolivia: 'bo',
  paraguay: 'py', uruguay: 'uy', panama: 'pa', panamá: 'pa',
  'costa rica': 'cr', guatemala: 'gt', honduras: 'hn',
}

// Known 2-4 letter country codes that appear in channel names
const COUNTRY_CODES = new Set([
  'ar','arg','mx','mex','co','col','cl','pe','ve','br','us','es','pt',
  'ec','bo','py','uy','pa','cr','gt','hn','sv','ni','do','pr','cu',
  'uk','gb','de','fr','it','nl','be','ch','at','pl','tr','ru',
])

/**
 * Splits a channel name into [cleanName, countryCode].
 * Country extracted from the name takes priority over ch.country from DB.
 *
 * Examples:
 *   "ESPN ARG"        → ["espn",   "arg"]
 *   "ESPN Argentina"  → ["espn",   "arg"]
 *   "ESPN (ARG)"      → ["espn",   "arg"]
 *   "ESPN 2 MX"       → ["espn 2", "mx"]
 *   "ESPN"            → ["espn",   null]   ← uses ch.country from DB
 *   "Fox Sports HD"   → ["fox sports", null]
 */
function splitNameCountry(name: string): [string, string | null] {
  let s = name
    .replace(M3U_PREFIX, '')
    .replace(/\s*[\|\-\/]\s*$/, '')
    .replace(QUALITY, '')
    .replace(GENERIC_REGION, '')
    .replace(NOISE, '')
    .replace(REPEAT, ' ')
    .trim()
    .toLowerCase()

  let country: string | null = null

  // Pattern: "(ARG)entina" — code inside parens with word continuing outside
  s = s.replace(/\(([a-z]{2,4})\)[a-záéíóúñü]*/gi, (_, code) => {
    const c = code.toLowerCase()
    country = COUNTRY_MAP[c] ?? (COUNTRY_CODES.has(c) ? c : null)
    return ''
  })

  // Pattern: "(Argentina)" or "(ARG)" in parens
  s = s.replace(/\s*[\[\(]\s*([a-záéíóúñü\s]{2,})\s*[\]\)]/g, (_, inner) => {
    const key = inner.trim().toLowerCase()
    const mapped = COUNTRY_MAP[key] ?? (COUNTRY_CODES.has(key) ? key : null)
    if (mapped) { country = mapped; return '' }
    return _ // keep if not a country
  })

  // Pattern: "ESPN Argentina" — country name at end
  for (const [full, code] of Object.entries(COUNTRY_MAP)) {
    const re = new RegExp(`\\s+${full}\\s*$`, 'i')
    if (re.test(s)) { s = s.replace(re, ''); country = code; break }
  }

  // Pattern: "ESPN ARG" — country code at end (uppercase in original, lowercase after)
  if (!country) {
    s = s.replace(/\s+([a-z]{2,4})$/, (_, code) => {
      if (COUNTRY_CODES.has(code) && COUNTRY_MAP[code] !== undefined || COUNTRY_CODES.has(code)) {
        country = COUNTRY_MAP[code] ?? code
        return ''
      }
      return _
    })
  }

  s = s.replace(REPEAT, ' ').trim()
  return [s, country]
}

export function normalizeName(name: string): string {
  const [clean] = splitNameCountry(name)
  return clean
}

export function groupChannels(channels: Channel[]): ChannelGroup[] {
  const map = new Map<string, ChannelGroup>()

  for (const ch of channels) {
    const [cleanName, nameCountry] = splitNameCountry(ch.name)
    if (!cleanName) continue

    // Group key = channel name + country (from name or DB)
    const effectiveCountry = nameCountry ?? ch.country ?? 'int'
    const key = `${cleanName}::${effectiveCountry}`

    if (map.has(key)) {
      const g = map.get(key)!
      if (!g.fallbacks.includes(ch.url)) {
        g.fallbacks.push(ch.url)
        g.count++
      }
      if (!g.logo && ch.logo) g.logo = ch.logo
      // Prefer the shortest original name (fewer qualifiers = cleaner label)
      if (ch.name.length < g.name.length) g.name = ch.name
    } else {
      map.set(key, {
        id: ch.id,
        name: ch.name,
        logo: ch.logo ?? null,
        country: effectiveCountry,
        category: ch.category,
        primary: ch.url,
        fallbacks: [],
        count: 1,
      })
    }
  }

  return Array.from(map.values())
}
