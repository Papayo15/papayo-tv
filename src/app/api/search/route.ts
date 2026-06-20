import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || ''
  if (q.length < 2) return NextResponse.json({ channels: [], movies: [], series: [] })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Search channels in parallel with TMDB
  const [channelRes, tmdbRes] = await Promise.allSettled([
    supabase
      .from('channels')
      .select('id,name,url,logo,country,category')
      .or(`name.ilike.%${q}%`)
      .eq('is_active', true)
      .order('name')
      .limit(50),

    process.env.TMDB_API_KEY
      ? fetch(
          `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&language=es-MX&page=1`,
          { headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` } }
        ).then(r => r.ok ? r.json() : { results: [] })
      : Promise.resolve({ results: [] }),
  ])

  const channels = channelRes.status === 'fulfilled' ? (channelRes.value.data || []) : []
  const tmdb = tmdbRes.status === 'fulfilled' ? tmdbRes.value : { results: [] }
  const content = (tmdb.results || []).filter((r: { media_type: string }) => r.media_type !== 'person')
  const movies = content.filter((r: { media_type: string }) => r.media_type === 'movie')
  const series = content.filter((r: { media_type: string }) => r.media_type === 'tv')

  return NextResponse.json({ channels, movies, series })
}
