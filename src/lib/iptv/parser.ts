import type { Channel } from '@/types/channel'

interface M3UEntry {
  name: string
  url: string
  logo?: string
  country?: string
  category?: string
  language?: string
}

export function parseM3U(text: string): M3UEntry[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const entries: M3UEntry[] = []
  let current: Partial<M3UEntry> | null = null

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/)
      const logoMatch = line.match(/tvg-logo="([^"]*)"/)
      const countryMatch = line.match(/tvg-country="([^"]*)"/)
      const langMatch = line.match(/tvg-language="([^"]*)"/)
      const groupMatch = line.match(/group-title="([^"]*)"/)

      current = {
        name: nameMatch?.[1]?.trim() || 'Sin nombre',
        logo: logoMatch?.[1] || undefined,
        country: countryMatch?.[1]?.toLowerCase() || undefined,
        category: normalizeCategory(groupMatch?.[1] || ''),
        language: langMatch?.[1] || undefined,
      }
    } else if (line.startsWith('http') && current) {
      entries.push({ ...current, url: line } as M3UEntry)
      current = null
    }
  }

  return entries
}

function normalizeCategory(group: string): string {
  const lower = group.toLowerCase()
  if (lower.includes('sport') || lower.includes('deport') || lower.includes('futbol') || lower.includes('fútbol')) return 'sports'
  if (lower.includes('news') || lower.includes('notic')) return 'news'
  if (lower.includes('movie') || lower.includes('pelícu') || lower.includes('cine')) return 'movies'
  if (lower.includes('kid') || lower.includes('niño') || lower.includes('infant')) return 'kids'
  if (lower.includes('music') || lower.includes('músi')) return 'music'
  if (lower.includes('doc')) return 'documentary'
  if (lower.includes('entertain') || lower.includes('entrete')) return 'entertainment'
  return 'other'
}

export function m3uEntriesToChannels(entries: M3UEntry[], defaultCountry: string): Omit<Channel, 'id'>[] {
  return entries.map(e => ({
    name: e.name,
    url: e.url,
    logo: e.logo,
    country: e.country || defaultCountry,
    category: e.category || 'other',
    language: e.language,
    is_active: true,
  }))
}
