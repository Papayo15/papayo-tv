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

// Remove quality/region tags that don't define the channel
const QUALITY = /\s*[\[\(]?\s*(hd|sd|fhd|4k|uhd|hq|lq|hevc|full\s?hd|1080p?|720p?|480p?|h265|h264)\s*[\]\)]?\s*$/gi
const REGION  = /\s*[\[\(]\s*(ar|arg|mx|mex|co|col|cl|pe|ve|us|br|es|pt|la|lat|latam|america latina?|latino)\s*[\]\)]\s*$/gi
const NOISE   = /\s*[\|\-]\s*(hd|sd|hq)\s*$/gi
const REPEAT  = /\s{2,}/g

export function normalizeName(name: string): string {
  return name
    .replace(QUALITY, '')
    .replace(REGION, '')
    .replace(NOISE, '')
    .replace(REPEAT, ' ')
    .trim()
    .toLowerCase()
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
        name: normalizeName(ch.name)
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        logo: ch.logo ?? null,
        country: ch.country,
        category: ch.category,
        primary: ch.url,
        fallbacks: [],
        count: 1,
      })
    }
  }

  return Array.from(map.values())
}
