import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

// Patterns → correct category. Run after every sync to fix mis-tagged channels.
const RULES: { pattern: string; category: string }[] = [
  // Sports — most important
  { pattern: 'ESPN', category: 'sports' },
  { pattern: 'Fox Sport', category: 'sports' },
  { pattern: 'FS1', category: 'sports' },
  { pattern: 'FS2', category: 'sports' },
  { pattern: 'NBC Sport', category: 'sports' },
  { pattern: 'Sky Sport', category: 'sports' },
  { pattern: 'BT Sport', category: 'sports' },
  { pattern: 'TNT Sport', category: 'sports' },
  { pattern: 'beIN', category: 'sports' },
  { pattern: 'Eurosport', category: 'sports' },
  { pattern: 'DAZN', category: 'sports' },
  { pattern: 'TyC', category: 'sports' },
  { pattern: 'Win Sport', category: 'sports' },
  { pattern: 'DSport', category: 'sports' },
  { pattern: 'Claro Sport', category: 'sports' },
  { pattern: 'DirecTV Sport', category: 'sports' },
  { pattern: 'TUDN', category: 'sports' },
  { pattern: 'Teledeporte', category: 'sports' },
  { pattern: 'Movistar+', category: 'sports' },
  { pattern: 'Canal+ Sport', category: 'sports' },
  { pattern: 'Sport1', category: 'sports' },
  { pattern: 'Supersport', category: 'sports' },
  { pattern: 'Polsat Sport', category: 'sports' },
  { pattern: 'Eleven Sport', category: 'sports' },
  { pattern: 'Arena Sport', category: 'sports' },
  { pattern: 'Setanta', category: 'sports' },
  { pattern: 'Optus Sport', category: 'sports' },
  { pattern: 'Sportsnet', category: 'sports' },
  { pattern: 'TSN', category: 'sports' },
  { pattern: 'Golf Channel', category: 'sports' },
  { pattern: 'Golf TV', category: 'sports' },
  { pattern: 'Tennis Channel', category: 'sports' },
  { pattern: 'Stadium', category: 'sports' },
  { pattern: 'NFL Network', category: 'sports' },
  { pattern: 'MLB Network', category: 'sports' },
  { pattern: 'NBA TV', category: 'sports' },
  { pattern: 'NHL Network', category: 'sports' },
  { pattern: 'Motorsport', category: 'sports' },
  { pattern: 'Formula 1', category: 'sports' },
  { pattern: 'F1 TV', category: 'sports' },
  { pattern: 'NASCAR', category: 'sports' },
  { pattern: 'RedZone', category: 'sports' },
  { pattern: 'Flow Sport', category: 'sports' },
  { pattern: 'Fox Dep', category: 'sports' },
  { pattern: 'deporte', category: 'sports' },
  { pattern: 'Deporte', category: 'sports' },
  // News
  { pattern: 'CNN', category: 'news' },
  { pattern: 'BBC News', category: 'news' },
  { pattern: 'France 24', category: 'news' },
  { pattern: 'Al Jazeera', category: 'news' },
  { pattern: 'Euronews', category: 'news' },
  { pattern: 'Fox News', category: 'news' },
  { pattern: 'MSNBC', category: 'news' },
  // Kids
  { pattern: 'Disney', category: 'kids' },
  { pattern: 'Nickelodeon', category: 'kids' },
  { pattern: 'Cartoon Network', category: 'kids' },
  { pattern: 'Discovery Kids', category: 'kids' },
  { pattern: 'Boomerang', category: 'kids' },
]

export async function POST() { return run() }
export async function GET() { return run() }

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let totalFixed = 0

  for (const rule of RULES) {
    const { count } = await supabase
      .from('channels')
      .update({ category: rule.category, last_synced_at: new Date().toISOString() })
      .ilike('name', `%${rule.pattern}%`)
      .neq('category', rule.category)
      .select('id', { count: 'exact', head: true })

    totalFixed += count || 0
  }

  return NextResponse.json({ success: true, fixed: totalFixed })
}
