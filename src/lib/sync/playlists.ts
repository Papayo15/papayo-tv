import { createClient } from '@supabase/supabase-js'
import { parseM3U, normalizeCategory } from './channels'

const SERVICE_BADGE: Record<string, string> = {
  pluto: 'pluto', samsung: 'samsung', plex: 'plex', 'iptv-org': 'iptv-org', custom: 'custom',
}

export async function syncAllPlaylists(): Promise<{ synced: number; total_channels: number; errors: string[] }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: sources } = await supabase
    .from('playlist_sources')
    .select('*')
    .eq('is_active', true)
    .order('service')

  if (!sources?.length) return { synced: 0, total_channels: 0, errors: [] }

  const errors: string[] = []
  let totalChannels = 0
  let synced = 0

  for (const source of sources) {
    try {
      const count = await syncPlaylistSource(supabase, source)
      totalChannels += count
      synced++

      await supabase
        .from('playlist_sources')
        .update({ last_synced_at: new Date().toISOString(), channel_count: count })
        .eq('id', source.id)
    } catch (e) {
      const msg = `${source.name}: ${String(e)}`
      errors.push(msg)
      await supabase
        .from('playlist_sources')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', source.id)
    }
  }

  return { synced, total_channels: totalChannels, errors }
}

async function syncPlaylistSource(
  supabase: ReturnType<typeof createClient>,
  source: { id: string; name: string; url: string; country: string; service: string }
): Promise<number> {
  const res = await fetch(source.url, {
    signal: AbortSignal.timeout(20000),
    headers: { 'User-Agent': 'Mozilla/5.0 IPTV-Player/1.0' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const text = await res.text()
  const parsed = parseM3U(text)
  if (!parsed.length) return 0

  const rows = parsed.map(ch => ({
    name: ch.name,
    url: ch.url,
    logo: ch.logo || null,
    country: source.country,
    category: normalizeCategory(ch.category, ch.name),
    language: null,
    is_active: true,
    last_synced_at: new Date().toISOString(),
    tvg_id: ch.tvg_id || null,
  }))

  // Upsert in batches of 200
  let inserted = 0
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200)
    const { error } = await supabase
      .from('channels')
      .upsert(batch, { onConflict: 'url', ignoreDuplicates: false })
    if (!error) inserted += batch.length
  }

  // Fix categories after import
  await recategorizeAfterImport(supabase, source.country)

  return inserted
}

// Quick SQL fix for common mis-categorized channels from Pluto/Samsung/Plex
async function recategorizeAfterImport(
  supabase: ReturnType<typeof createClient>,
  country: string
) {
  const fixes = [
    // Sports
    `UPDATE channels SET category='sports' WHERE country='${country}' AND category != 'sports' AND (
      name ILIKE '%sport%' OR name ILIKE '%espn%' OR name ILIKE '%fox sport%' OR
      name ILIKE '%nfl%' OR name ILIKE '%nba%' OR name ILIKE '%nhl%' OR name ILIKE '%mlb%' OR
      name ILIKE '%sky sport%' OR name ILIKE '%bein%' OR name ILIKE '%eurosport%' OR
      name ILIKE '%motorsport%' OR name ILIKE '%racing%' OR name ILIKE '%golf%' OR
      name ILIKE '%tennis%' OR name ILIKE '%wrestl%' OR name ILIKE '%fight%' OR
      name ILIKE '%ufc%' OR name ILIKE '%dazn%' OR name ILIKE '%deportes%' OR name ILIKE '%futebol%'
    )`,
    // Documentary
    `UPDATE channels SET category='documentary' WHERE country='${country}' AND category != 'documentary' AND (
      name ILIKE '%national geographic%' OR name ILIKE '%discovery%' OR name ILIKE '%history%' OR
      name ILIKE '%animal planet%' OR name ILIKE '%dmax%' OR name ILIKE '%tlc%' OR
      name ILIKE '%science%' OR name ILIKE '%smithsonian%' OR name ILIKE '%investigate%' OR
      name ILIKE '%crime%' OR name ILIKE '%true crime%' OR name ILIKE '%bbc earth%' OR
      name ILIKE '%documental%' OR name ILIKE '%documentary%' OR name ILIKE '%nature%' OR
      name ILIKE '%explore%' OR name ILIKE '%planet%'
    )`,
    // News
    `UPDATE channels SET category='news' WHERE country='${country}' AND category != 'news' AND (
      name ILIKE '%news%' OR name ILIKE '%noticias%' OR name ILIKE '%cnn%' OR
      name ILIKE '%bbc news%' OR name ILIKE '%sky news%' OR name ILIKE '%al jazeera%' OR
      name ILIKE '%fox news%' OR name ILIKE '%msnbc%' OR name ILIKE '%abc news%' OR
      name ILIKE '%euronews%' OR name ILIKE '%france 24%' OR name ILIKE '%dw news%' OR
      name ILIKE '%telesur%' OR name ILIKE '%ntv%' OR name ILIKE '%informaci%'
    )`,
    // Kids
    `UPDATE channels SET category='kids' WHERE country='${country}' AND category != 'kids' AND (
      name ILIKE '%kids%' OR name ILIKE '%cartoon%' OR name ILIKE '%nickelodeon%' OR
      name ILIKE '%disney%' OR name ILIKE '%nick jr%' OR name ILIKE '%boomerang%' OR
      name ILIKE '%toon%' OR name ILIKE '%infan%' OR name ILIKE '%junior%' OR
      name ILIKE '%baby%' OR name ILIKE '%paw patrol%' OR name ILIKE '%peppa%'
    )`,
    // Movies
    `UPDATE channels SET category='movies' WHERE country='${country}' AND category != 'movies' AND (
      name ILIKE '%movie%' OR name ILIKE '%cine%' OR name ILIKE '%film%' OR
      name ILIKE '%pelicul%' OR name ILIKE '%cinema%' OR name ILIKE '%tcm%' OR
      name ILIKE '%horror%' OR name ILIKE '%western%' OR name ILIKE '%thriller%' OR
      name ILIKE '%drama%' OR name ILIKE '%comedy%' OR name ILIKE '%action%'
    )`,
  ]
  for (const sql of fixes) {
    await supabase.rpc('exec_sql', { sql }).catch(() => null)
  }
}
