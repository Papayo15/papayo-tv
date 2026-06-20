import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const { data } = await adminClient()
    .from('featured_events')
    .select('*, event_channels(*)')
    .order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, error } = await adminClient()
    .from('featured_events')
    .insert({
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      banner_url: body.banner_url || null,
      color: body.color || '#dc2626',
      starts_at: body.starts_at || null,
      ends_at: body.ends_at || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
