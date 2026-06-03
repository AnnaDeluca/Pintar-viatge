'use client'
import { useEffect, useRef, useState } from 'react'
import { paintings } from '@/data/paintings'

const ACCENT = '#D85B3C'

type UploadState = 'idle' | 'uploading' | 'ok' | 'error'

interface PaintingRow {
  id: string
  title: string
  artist: string
  emoji: string
  currentUrl: string | null
  thumbUrl?: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authErr, setAuthErr] = useState(false)
  const [manifest, setManifest] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, UploadState>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Carrega el manifest (URLs personalitzades) en autenticar-se
  const loadManifest = async () => {
    try {
      const r = await fetch('/api/admin/manifest')
      if (r.ok) setManifest(await r.json())
    } catch {}
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // Prova d'autenticació amb una petició test
    const r = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'x-admin-password': password },
      body: new FormData(),  // buit → hauria de donar 400, no 401
    })
    if (r.status !== 401) {
      setAuthed(true)
      setAuthErr(false)
      loadManifest()
    } else {
      setAuthErr(true)
    }
  }

  const handleUpload = async (paintingId: string, file: File) => {
    setUploading(u => ({ ...u, [paintingId]: 'uploading' }))
    try {
      const form = new FormData()
      form.append('paintingId', paintingId)
      form.append('file', file)
      const r = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: form,
      })
      if (!r.ok) throw new Error(await r.text())
      const { url } = await r.json()
      setManifest(m => ({ ...m, [paintingId]: url }))
      setUploading(u => ({ ...u, [paintingId]: 'ok' }))
      setTimeout(() => setUploading(u => ({ ...u, [paintingId]: 'idle' })), 2000)
    } catch (e) {
      console.error(e)
      setUploading(u => ({ ...u, [paintingId]: 'error' }))
      setTimeout(() => setUploading(u => ({ ...u, [paintingId]: 'idle' })), 3000)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--paper)' }}>
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-xs">
          <div style={{ textAlign: 'center', fontSize: 40 }}>🎨</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800,
            color: 'var(--ink)', textAlign: 'center', margin: 0,
          }}>
            Admin — Pintem junts
          </h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contrasenya"
            autoFocus
            className="no-uppercase"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 16,
              border: `2px solid ${authErr ? '#E63946' : 'var(--line)'}`,
              fontSize: 18, fontFamily: 'var(--font-body)', color: 'var(--ink)',
              background: 'var(--paper-2)',
            }}
          />
          {authErr && (
            <p style={{ color: '#E63946', fontSize: 13, margin: 0, textAlign: 'center' }}>
              Contrasenya incorrecta
            </p>
          )}
          <button type="submit"
            style={{
              padding: '14px', borderRadius: 999, border: 'none',
              background: ACCENT, color: 'white',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
              cursor: 'pointer', boxShadow: `0 6px 20px ${ACCENT}66`,
            }}>
            Entrar
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* Header */}
      <header style={{
        background: ACCENT, color: 'white', padding: '16px 20px',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 2px 12px rgba(216,91,60,0.4)',
      }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>
          🎨 Admin — Puja imatges
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.8 }}>
          Toca un quadre per pujar una imatge nova
        </p>
      </header>

      {/* Grid de quadres */}
      <div style={{ padding: '16px', display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {paintings.filter(p => !p.mechanic).map(p => {
          const customUrl = manifest[p.id]
          const state = uploading[p.id] ?? 'idle'
          const isSelected = selected === p.id

          return (
            <div key={p.id}
              onClick={() => { setSelected(p.id); fileRef.current?.click() }}
              style={{
                background: 'var(--paper-2)',
                border: `2px solid ${isSelected ? ACCENT : 'var(--line)'}`,
                borderRadius: 16, overflow: 'hidden',
                cursor: 'pointer', position: 'relative',
                boxShadow: isSelected ? `0 0 0 3px ${ACCENT}44` : '0 2px 8px rgba(35,50,62,0.08)',
                transition: 'all .15s ease',
              }}>
              {/* Miniatura */}
              <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#ece6d8', position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={customUrl || p.thumbUrl || p.imageUrl}
                  alt={p.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Badge: imatge personalitzada */}
                {customUrl && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    background: '#57CC99', color: 'white',
                    borderRadius: 8, padding: '2px 7px', fontSize: 10, fontWeight: 800,
                  }}>
                    ✓ Nova
                  </div>
                )}
                {/* Estat de pujada */}
                {state === 'uploading' && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 24,
                  }}>
                    ⏳
                  </div>
                )}
                {state === 'ok' && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(87,204,153,0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 32,
                  }}>
                    ✓
                  </div>
                )}
                {state === 'error' && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(230,57,70,0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 24, textAlign: 'center', padding: 8,
                  }}>
                    Error :(
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: '8px 10px' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800,
                  color: 'var(--ink)', lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.emoji} {p.title}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--ink-50)', marginTop: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.artist}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Instruccions */}
      <div style={{ padding: '8px 20px 32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-50)', fontSize: 13 }}>
          Les imatges pujades es guarden a Vercel Blob i s&apos;apliquen
          immediatament sense necessitat de redeploy.
        </p>
        <p style={{ color: 'var(--ink-35)', fontSize: 12, marginTop: 4 }}>
          Formats acceptats: JPG, PNG, WEBP · Max 4.5 MB
        </p>
      </div>

      {/* Input de fitxer ocult */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file && selected) {
            handleUpload(selected, file)
            setSelected(null)
            e.target.value = ''
          }
        }}
      />
    </div>
  )
}
