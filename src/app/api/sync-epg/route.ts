import { NextResponse } from 'next/server'
import { syncEpg } from '@/lib/sync/epg'

export async function POST() {
  const inserted = await syncEpg()
  return NextResponse.json({ success: true, inserted })
}
