import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SOURCES = [
  { url: 'https://iptv-org.github.io/iptv/index.country/mx.m3u', country: 'mx' },
  { url: 'https://iptv-org.github.io/iptv/index.country/es.m3u', country: 'es' },
  { url: 'https://iptv-org.github.io/iptv/index.country/ar.m3u', country: 'ar' },
  { url: 'https://iptv-org.github.io/iptv/index.country/us.m3u', country: 'us' },
  { url: 'https://iptv-org.github.io/iptv/index.country/co.m3u', country: 'co' },
  { url: 'https://iptv-org.github.io/iptv/index.country/cl.m3u', country: 'cl' },
]

function parseM3U(text: string, defaultCountry: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const channels = []
  let current: Record<string, string> | null = null

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const name = line.match(/,(.+)$/)?.[1]?.trim()
      const logo = line.match(/tvg-logo="([^"]*)"/)?.[1]
      const country = line.match(/tvg-country="([^"]*)"/)?.[1]?.toLowerCase()
      const group = line.match(/group-title="([^"]*)"/)?.[1] || ''
      const lang = line.match(/tvg-language="([^"]*)"/)?.[1]

      const cat = group.toLowerCase().includes('sport') || group.toLowerCase().includes('deport') ? 'sports'
        : group.toLowerCase().includes('news') || group.toLowerCase().includes('notic') ? 'news'
        : group.toLowerCase().includes('kid') || group.toLowerCase().includes('niño') ? 'kids'
        : group.toLowerCase().includes('movie') || group.toLowerCase().includes('pel') ? 'movies'
        : group.toLowerCase().includes('music') ? 'music'
        : 'other'

      current = { name: name || 'Sin nombre', logo: logo || '', country: country || defaultCountry, category: cat, language: lang || '' }
    } else if (line.startsWith('http') && current) {
      channels.push({ ...current, url: line })
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

  try {
    const res = await fetch(source.url, { signal: AbortSignal.timeout(25000) })
    if (!res.ok) return NextResponse.json({ error: `Failed to fetch ${source.url}` }, { status: 500 })

    const text = await res.text()
    const channels = parseM3U(text, source.country)

    if (channels.length === 0) return NextResponse.json({ inserted: 0 })

    // Insert in batches of 100
    let inserted = 0
    for (let i = 0; i < channels.length; i += 100) {
      const batch = channels.slice(i, i + 100).map(c => ({
        name: c.name,
        url: c.url,
        logo: c.logo || null,
        country: c.country,
        category: c.category,
        language: c.language || null,
        is_active: true,
        last_synced_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from('channels').upsert(batch, { onConflict: 'url' })
      if (!error) inserted += batch.length
    }

    return NextResponse.json({ success: true, inserted, country: source.country })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
