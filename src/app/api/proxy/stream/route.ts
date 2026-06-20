import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

// Proxies HLS streams server-side, bypassing CORS and some geo-blocks.
// Usage: /api/proxy/stream?url=<encoded_stream_url>
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')
  if (!raw) return new NextResponse('Missing url', { status: 400 })

  let url: string
  try {
    url = decodeURIComponent(raw)
    new URL(url) // validate
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  // Only proxy http/https streams
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return new NextResponse('Only http/https allowed', { status: 400 })
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (SmartTV) AppleWebKit/537.36 Chrome/120.0.0.0',
        'Referer': new URL(url).origin + '/',
        'Origin': new URL(url).origin,
      },
      signal: AbortSignal.timeout(20000),
    })

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const isM3U8 = contentType.includes('mpegurl') || url.includes('.m3u8')

    if (isM3U8) {
      // Rewrite M3U8 so all segment/playlist URLs also go through this proxy
      const text = await upstream.text()
      const base = new URL(url)
      const rewritten = text.split('\n').map(line => {
        const l = line.trim()
        if (!l || l.startsWith('#')) return line
        // Resolve relative URLs and route through proxy
        try {
          const abs = new URL(l, base).href
          return `/api/proxy/stream?url=${encodeURIComponent(abs)}`
        } catch {
          return line
        }
      }).join('\n')

      return new NextResponse(rewritten, {
        status: upstream.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // For TS segments and other binary content — stream through
    const body = await upstream.arrayBuffer()
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=10',
      },
    })
  } catch (e) {
    return new NextResponse(`Proxy error: ${String(e)}`, { status: 502 })
  }
}
