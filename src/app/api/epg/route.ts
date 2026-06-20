import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tvgIds = searchParams.get('ids')?.split(',').filter(Boolean) || []

  if (tvgIds.length === 0) return NextResponse.json({})

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('epg_programs')
    .select('tvg_id, title, description, thumbnail, start_time, end_time')
    .in('tvg_id', tvgIds.slice(0, 100))
    .lte('start_time', now)
    .gte('end_time', now)
    .order('start_time')

  // Build map: tvg_id → current program
  const result: Record<string, { title: string; description: string; thumbnail: string; start_time: string; end_time: string }> = {}
  for (const row of (data || [])) {
    if (!result[row.tvg_id]) result[row.tvg_id] = row
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  })
}
