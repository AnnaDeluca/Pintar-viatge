import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'upload.wikimedia.org',
]

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  if (!ALLOWED_ORIGINS.includes(parsed.hostname)) {
    return new NextResponse('Origin not allowed', { status: 403 })
  }

  const upstream = await fetch(url, {
    headers: { 'User-Agent': 'PintarViatge/1.0 (https://pintar-viatge.vercel.app)' },
  })

  if (!upstream.ok) {
    return new NextResponse('Upstream error', { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
  const body = await upstream.arrayBuffer()

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      // Cache 30 dies al navegador, 1 any a la CDN de Vercel
      'Cache-Control': 'public, max-age=2592000, s-maxage=31536000, immutable',
    },
  })
}
