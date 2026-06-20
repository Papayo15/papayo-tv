import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const IPTV_CHANNELS = 'https://iptv-org.github.io/api/channels.json'
const IPTV_STREAMS  = 'https://iptv-org.github.io/api/streams.json'

// Sports network families
const SPORTS_NAME_RE = /espn|fox sport|foxsport|fs1|fs2|fs\s*one|fox dep|nbc sport|sky sport|skysport|bein|beinsport|eurosport|dazn|bt sport|tnt sport|canal\+\s*sport|movistar dep|tyc|win sport|winsport|dsport|claro sport|directv sport|teledeporte|arena sport|eleven sport|sport1|sport2|sport24|supersport|startimes sport|flow sport|sportsnet|tsn|rds sport|golf channel|tennis channel|golf tv|ufc|mma|nfl net|mlb net|nba tv|nhl net|redzone|stadium|tudn|bbc sport|itv sport|setanta|optus sport|sky racing|racing|motorsport|f1 tv|formula 1|nascar|indycar|polsat sport|sport club|sport news|max sport|nova sport|viasat sport|match tv/i

// Documentary / culture families
const DOCS_NAME_RE = /national geographic|nat geo|natgeo|discovery|history channel|history ch|history hd|history 2|\bhistory\b|animal planet|odisea|viajar|viajes|food network|cooking channel|travel channel|science channel|\bscience\b|ciencia|smithsonian|investigaci|investigation|true crime|crime.*invest|bbc earth|bbc knowledge|canal historia|canal cultura|\bcultura\b|dmax|d-max|\btlc\b|a&e network|lifetime movie|biograph|documental|documentary|explorer|nat wild|\bwild\b|nature channel|planet|explore/i

type ApiChannel = {
  id: string
  name: string
  country: string
  categories: string[]
  logo: string
  is_nsfw: boolean
}
type ApiStream = {
  channel: string
  url: string
  status: string
  timeshift?: string
  quality?: string
}

export async function GET() { return run() }
export async function POST() { return run() }

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Load channels metadata — find all sports channel IDs
  let channelsJson: ApiChannel[] = []
  try {
    const r = await fetch(IPTV_CHANNELS, { signal: AbortSignal.timeout(20000) })
    channelsJson = await r.json()
  } catch (e) {
    return NextResponse.json({ error: `channels.json: ${e}` }, { status: 500 })
  }

  // Build maps: channel_id → { meta, category } for sports AND documentary
  const enrichedMap = new Map<string, { name: string; country: string; logo: string; category: string }>()
  for (const ch of channelsJson) {
    if (ch.is_nsfw) continue
    const isSportsCat = ch.categories.some(c => /sport|deport/i.test(c))
    const isDocsCat   = ch.categories.some(c => /documentary|science|nature|travel|history|cooking/i.test(c))
    const isSportsName = SPORTS_NAME_RE.test(ch.name)
    const isDocsName   = DOCS_NAME_RE.test(ch.name)
    if (isSportsCat || isSportsName) {
      enrichedMap.set(ch.id.toLowerCase(), { name: ch.name, country: ch.country.toLowerCase() || 'int', logo: ch.logo || '', category: 'sports' })
    } else if (isDocsCat || isDocsName) {
      enrichedMap.set(ch.id.toLowerCase(), { name: ch.name, country: ch.country.toLowerCase() || 'int', logo: ch.logo || '', category: 'documentary' })
    }
  }
  // keep backward compat alias
  const sportsMap = enrichedMap

  // 2. Load streams — filter for sports channel IDs
  let streamsJson: ApiStream[] = []
  try {
    const r = await fetch(IPTV_STREAMS, { signal: AbortSignal.timeout(40000) })
    streamsJson = await r.json()
  } catch (e) {
    return NextResponse.json({ error: `streams.json: ${e}` }, { status: 500 })
  }

  const sportsStreams: Array<{
    name: string; url: string; tvg_id: string | null
    logo: string | null; country: string; category: string
    language: null; is_active: boolean; last_synced_at: string
  }> = []

  for (const s of streamsJson) {
    if (!s.url || !s.channel) continue
    const meta = sportsMap.get(s.channel.toLowerCase())
    if (!meta) continue
    sportsStreams.push({
      name: meta.name,
      url: s.url,
      tvg_id: s.channel.toLowerCase(),
      logo: meta.logo || null,
      country: meta.country,
      category: meta.category,
      language: null,
      is_active: true,
      last_synced_at: new Date().toISOString(),
    })
  }

  // 3. Upsert in batches
  let inserted = 0
  for (let i = 0; i < sportsStreams.length; i += 200) {
    const batch = sportsStreams.slice(i, i + 200)
    const { error } = await supabase.from('channels').upsert(batch, { onConflict: 'url' })
    if (!error) inserted += batch.length
  }

  // 4. Also recategorize any existing channels that are sports by name
  try { await supabase.rpc('recategorize_sports') } catch { /* best-effort */ }

  return NextResponse.json({
    success: true,
    sports_channels_found: sportsMap.size,
    streams_found: sportsStreams.length,
    inserted,
  })
}
