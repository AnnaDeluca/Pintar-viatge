import { put, list } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { paintings } from '@/data/paintings'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'pintem2024'

export async function POST(req: NextRequest) {
  // Autenticació simple
  const pw = req.headers.get('x-admin-password')
  if (pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const form = await req.formData()
  const paintingId = form.get('paintingId') as string
  const file = form.get('file') as File | null

  if (!paintingId || !file) {
    return NextResponse.json({ error: 'Falten dades' }, { status: 400 })
  }

  const painting = paintings.find(p => p.id === paintingId)
  if (!painting) {
    return NextResponse.json({ error: `Quadre '${paintingId}' no trobat` }, { status: 404 })
  }

  // Puja a Vercel Blob
  const ext = file.name.split('.').pop() ?? 'jpg'
  const blob = await put(
    `custom-paintings/${paintingId}.${ext}`,
    file,
    { access: 'public', addRandomSuffix: false },
  )

  // Actualitza el manifest (llista de URLs personalitzades)
  const manifestBlob = await list({ prefix: 'manifests/custom-sketches.json' })
  let manifest: Record<string, string> = {}
  if (manifestBlob.blobs.length > 0) {
    try {
      const res = await fetch(manifestBlob.blobs[0].url)
      manifest = await res.json()
    } catch {}
  }
  manifest[paintingId] = blob.url

  await put(
    'manifests/custom-sketches.json',
    JSON.stringify(manifest, null, 2),
    { access: 'public', addRandomSuffix: false },
  )

  return NextResponse.json({ url: blob.url, paintingId })
}
