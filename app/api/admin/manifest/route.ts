import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'

export const revalidate = 0  // sempre fresc

export async function GET() {
  try {
    const res = await list({ prefix: 'manifests/custom-sketches.json' })
    if (res.blobs.length === 0) return NextResponse.json({})
    const data = await fetch(res.blobs[0].url, { cache: 'no-store' })
    const manifest = await data.json()
    return NextResponse.json(manifest)
  } catch {
    return NextResponse.json({})
  }
}
