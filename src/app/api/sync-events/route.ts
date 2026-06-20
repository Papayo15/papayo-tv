import { NextResponse } from 'next/server'
import { syncEvents } from '@/lib/sync/events'

export async function POST() {
  await syncEvents()
  return NextResponse.json({ success: true })
}

export async function GET() {
  await syncEvents()
  return NextResponse.json({ success: true })
}
