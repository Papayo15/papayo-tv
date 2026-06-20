import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Free XMLTV EPG sources (confirmed working)
const EPG_SOURCES = [
  'https://i.mjh.nz/SamsungTVPlus/all.xml',
  'https://i.mjh.nz/PlutoTV/us.xml',
  'https://i.mjh.nz/PlutoTV/es.xml',
  'https://i.mjh.nz/PlutoTV/mx.xml',
  'https://i.mjh.nz/PlutoTV/ar.xml',
  'https://i.mjh.nz/PlutoTV/co.xml',
]

function parseXMLTV(xml: string): {
  channels: Map<string, string>        // id → display-name
  programs: Array<{ tvg_id: string; title: string; description: string; thumbnail: string; start_time: Date; end_time: Date }>
} {
  const channels = new Map<string, string>()
  const programs: Array<{ tvg_id: string; title: string; description: string; thumbnail: string; start_time: Date; end_time: Date }> = []

  // Parse channels
  const chanRe = /<channel id="([^"]+)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]*)<\/display-name>/g
  let m: RegExpExecArray | null
  while ((m = chanRe.exec(xml)) !== null) {
    channels.set(m[1], m[2].trim())
  }

  // Parse programmes
  const progRe = /<programme\s+([^>]+)>([\s\S]*?)<\/programme>/g
  const now = new Date()
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48h ahead

  while ((m = progRe.exec(xml)) !== null) {
    const attrs = m[1]
    const body = m[2]

    const startStr = attrs.match(/start="([^"]+)"/)?.[1]
    const stopStr = attrs.match(/stop="([^"]+)"/)?.[1]
    const channel = attrs.match(/channel="([^"]+)"/)?.[1]

    if (!startStr || !stopStr || !channel) continue

    const start = parseXMLTVDate(startStr)
    const end = parseXMLTVDate(stopStr)

    if (!start || !end) continue
    if (end < now || start > cutoff) continue

    const titleM = body.match(/<title[^>]*>([^<]*)<\/title>/)
    const descM = body.match(/<desc[^>]*>([\s\S]*?)<\/desc>/)
    const iconM = body.match(/<icon src="([^"]*)"/)

    programs.push({
      tvg_id: channel.toLowerCase(),
      title: titleM?.[1]?.trim() || 'Sin título',
      description: descM?.[1]?.trim() || '',
      thumbnail: iconM?.[1] || '',
      start_time: start,
      end_time: end,
    })
  }

  return { channels, programs }
}

function parseXMLTVDate(str: string): Date | null {
  // Format: "20241015120000 +0000" or "20241015120000 +0200"
  const m = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})$/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, tz] = m
  const tzSign = tz[0] === '+' ? 1 : -1
  const tzH = parseInt(tz.slice(1, 3))
  const tzM = parseInt(tz.slice(3, 5))
  const utcMs = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) - tzSign * (tzH * 60 + tzM) * 60000
  return new Date(utcMs)
}

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let totalInserted = 0
  const allPrograms: Array<{ tvg_id: string; title: string; description: string; thumbnail: string; start_time: string; end_time: string }> = []

  for (const url of EPG_SOURCES) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
      if (!res.ok) continue
      const xml = await res.text()
      const { programs } = parseXMLTV(xml)

      for (const p of programs) {
        allPrograms.push({
          tvg_id: p.tvg_id,
          title: p.title,
          description: p.description,
          thumbnail: p.thumbnail,
          start_time: p.start_time.toISOString(),
          end_time: p.end_time.toISOString(),
        })
      }
    } catch {
      // skip failed source
    }
  }

  if (allPrograms.length === 0) {
    return NextResponse.json({ inserted: 0, message: 'No EPG data fetched' })
  }

  // Delete old programs first (older than 2 hours ago)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  await supabase.from('epg_programs').delete().lt('end_time', twoHoursAgo)

  // Insert in batches
  for (let i = 0; i < allPrograms.length; i += 200) {
    const batch = allPrograms.slice(i, i + 200)
    const { error } = await supabase.from('epg_programs').upsert(batch, {
      onConflict: 'tvg_id,start_time',
    })
    if (!error) totalInserted += batch.length
  }

  return NextResponse.json({ success: true, inserted: totalInserted })
}
