import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const IPTV_BASE = 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams'

const SOURCES = [
  { url: `${IPTV_BASE}/mx.m3u`, country: 'mx' },
  { url: `${IPTV_BASE}/es.m3u`, country: 'es' },
  { url: `${IPTV_BASE}/us.m3u`, country: 'us' },
  { url: `${IPTV_BASE}/ar.m3u`, country: 'ar' },
  { url: `${IPTV_BASE}/co.m3u`, country: 'co' },
  { url: `${IPTV_BASE}/br.m3u`, country: 'br' },
  { url: `${IPTV_BASE}/cl.m3u`, country: 'cl' },
]

interface M3UChannel {
  name: string
  url: string
  logo?: string
  country: string
  category: string
  language?: string
}

function parseM3U(text: string, defaultCountry: string): M3UChannel[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const channels: M3UChannel[] = []
  let current: Partial<M3UChannel> | null = null

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
        country: countryMatch?.[1]?.toLowerCase() || defaultCountry,
        category: normalizeCategory(groupMatch?.[1] || ''),
        language: langMatch?.[1] || undefined,
      }
    } else if (line.startsWith('http') && current) {
      channels.push({ ...current, url: line } as M3UChannel)
      current = null
    }
  }

  return channels
}

function normalizeCategory(group: string): string {
  const l = group.toLowerCase()
  if (l.includes('sport') || l.includes('deport') || l.includes('futbol') || l.includes('fútbol')) return 'sports'
  if (l.includes('news') || l.includes('notic')) return 'news'
  if (l.includes('movie') || l.includes('pelícu') || l.includes('cine')) return 'movies'
  if (l.includes('kid') || l.includes('niño') || l.includes('infant')) return 'kids'
  if (l.includes('music') || l.includes('músi')) return 'music'
  if (l.includes('doc')) return 'documentary'
  if (l.includes('entertain') || l.includes('entrete')) return 'entertainment'
  return 'other'
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let totalInserted = 0
  const errors: string[] = []

  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, { signal: AbortSignal.timeout(30000) })
      if (!res.ok) {
        errors.push(`Failed to fetch ${source.url}: ${res.status}`)
        continue
      }

      const text = await res.text()
      const channels = parseM3U(text, source.country)

      if (channels.length === 0) continue

      // Upsert in batches of 200
      for (let i = 0; i < channels.length; i += 200) {
        const batch = channels.slice(i, i + 200).map(c => ({
          name: c.name,
          url: c.url,
          logo: c.logo || null,
          country: c.country,
          category: c.category,
          language: c.language || null,
          is_active: true,
          last_synced_at: new Date().toISOString(),
        }))

        const { error } = await supabase
          .from('channels')
          .upsert(batch, { onConflict: 'url', ignoreDuplicates: false })

        if (error) {
          errors.push(`DB upsert error: ${error.message}`)
        } else {
          totalInserted += batch.length
        }
      }
    } catch (err) {
      errors.push(`Error processing ${source.url}: ${String(err)}`)
    }
  }

  return new Response(
    JSON.stringify({ success: true, inserted: totalInserted, errors }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
