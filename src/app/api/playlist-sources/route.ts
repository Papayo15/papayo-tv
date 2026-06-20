import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = admin()
  const { data, error } = await supabase
    .from('playlist_sources')
    .select('*')
    .order('service')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { name, url, country, service } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

  const supabase = admin()
  const { data, error } = await supabase
    .from('playlist_sources')
    .upsert(
      { name: name || url, url, country: country || 'int', service: service || 'custom' },
      { onConflict: 'url', ignoreDuplicates: false }
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = await req.json()
  const supabase = admin()
  const { error } = await supabase
    .from('playlist_sources')
    .update({ is_active })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const supabase = admin()
  const { error } = await supabase
    .from('playlist_sources')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
