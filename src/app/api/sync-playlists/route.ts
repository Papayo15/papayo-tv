import { NextResponse } from 'next/server'
import { syncAllPlaylists } from '@/lib/sync/playlists'

export const maxDuration = 60

export async function GET() { return run() }
export async function POST() { return run() }

async function run() {
  const result = await syncAllPlaylists()
  return NextResponse.json({
    success: true,
    ...result,
  })
}
