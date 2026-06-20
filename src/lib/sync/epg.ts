import { createClient } from '@supabase/supabase-js'

const EPG_SOURCES = [
  'https://i.mjh.nz/SamsungTVPlus/all.xml',
  'https://i.mjh.nz/PlutoTV/us.xml',
  'https://i.mjh.nz/PlutoTV/es.xml',
  'https://i.mjh.nz/PlutoTV/mx.xml',
  'https://i.mjh.nz/PlutoTV/ar.xml',
  'https://i.mjh.nz/PlutoTV/co.xml',
]

function parseXMLTVDate(str: string): Date | null {
  const m = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})$/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, tz] = m
  const sign = tz[0] === '+' ? 1 : -1
  const tzH = parseInt(tz.slice(1, 3)), tzM = parseInt(tz.slice(3, 5))
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) - sign * (tzH * 60 + tzM) * 60000)
}

function parseXMLTV(xml: string) {
  const programs: Array<{ tvg_id: string; title: string; description: string; thumbnail: string; start_time: string; end_time: string }> = []
  const now = new Date()
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const re = /<programme\s+([^>]+)>([\s\S]*?)<\/programme>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1], body = m[2]
    const start = parseXMLTVDate(attrs.match(/start="([^"]+)"/)?.[1] || '')
    const end = parseXMLTVDate(attrs.match(/stop="([^"]+)"/)?.[1] || '')
    const channel = attrs.match(/channel="([^"]+)"/)?.[1]
    if (!start || !end || !channel || end < now || start > cutoff) continue
    programs.push({
      tvg_id: channel.toLowerCase(),
      title: body.match(/<title[^>]*>([^<]*)<\/title>/)?.[1]?.trim() || 'Sin título',
      description: body.match(/<desc[^>]*>([\s\S]*?)<\/desc>/)?.[1]?.trim() || '',
      thumbnail: body.match(/<icon src="([^"]*)"/)?.[1] || '',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    })
  }
  return programs
}

export async function syncEpg(): Promise<number> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const allPrograms: Array<{ tvg_id: string; title: string; description: string; thumbnail: string; start_time: string; end_time: string }> = []

  for (const url of EPG_SOURCES) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
      if (!res.ok) continue
      allPrograms.push(...parseXMLTV(await res.text()))
    } catch { /* skip */ }
  }

  if (allPrograms.length === 0) return 0

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  await supabase.from('epg_programs').delete().lt('end_time', twoHoursAgo)

  let inserted = 0
  for (let i = 0; i < allPrograms.length; i += 200) {
    const { error } = await supabase.from('epg_programs').upsert(allPrograms.slice(i, i + 200), { onConflict: 'tvg_id,start_time' })
    if (!error) inserted += 200
  }
  return inserted
}
