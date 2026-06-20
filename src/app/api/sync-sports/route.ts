import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const IPTV_CHANNELS = 'https://iptv-org.github.io/api/channels.json'
const IPTV_STREAMS  = 'https://iptv-org.github.io/api/streams.json'

// All network families we want — broad enough to catch regional variants
const SPORTS_NAME_RE = /espn|fox sport|foxsport|fs1|fs2|fs\s*one|fox dep|nbc sport|sky sport|skysport|bein|beinsport|eurosport|dazn|bt sport|tnt sport|canal\+\s*sport|movistar dep|movistar\+|tyc|win sport|winsport|dsport|claro sport|directv sport|teledeporte|arena sport|eleven sport|sport1|sport2|sport24|supersport|startimes sport|flow sport|sportsnet|tsn|rds sport|outdoor channel|golf channel|tennis channel|golf tv|fighting|boxe|wrestling|ufc|mma|nfl net|mlb net|nba tv|nhl net|redzone|stadium|fight|tudn|univision dep|caracol dep|rcn dep|antena 2|signal iduna|bbc sport|itv sport|talksport|setanta|optus sport|foxtel sport|kayo|sky racing|racing|motorsport|f1 tv|formula 1|nascar|indycar|velocidad|polsat sport|sport klip|tv sport|sport club|sport news/i

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

  // Build a map: channel_id → metadata for all sports channels
  const sportsMap = new Map<string, { name: string; country: string; logo: string }>()
  for (const ch of channelsJson) {
    if (ch.is_nsfw) continue
    const isSportsCat = ch.categories.some(c => /sport|deport/i.test(c))
    const isSportsName = SPORTS_NAME_RE.test(ch.name)
    if (isSportsCat || isSportsName) {
      sportsMap.set(ch.id.toLowerCase(), {
        name: ch.name,
        country: ch.country.toLowerCase() || 'int',
        logo: ch.logo || '',
      })
    }
  }

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
      category: 'sports',
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
  await supabase.rpc('recategorize_sports').catch(() => null) // best-effort

  return NextResponse.json({
    success: true,
    sports_channels_found: sportsMap.size,
    streams_found: sportsStreams.length,
    inserted,
  })
}
