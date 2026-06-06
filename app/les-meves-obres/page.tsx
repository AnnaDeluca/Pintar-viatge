'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadArtworks, deleteArtwork, type SavedArtwork } from '@/lib/artworks'

const ACCENT = '#D85B3C'

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' }).toUpperCase()
  } catch {
    return ''
  }
}

export default function MyArtworksPage() {
  const [artworks, setArtworks] = useState<SavedArtwork[]>([])
  const [active, setActive] = useState<SavedArtwork | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    setArtworks(loadArtworks())
  }, [])

  const handleDelete = (id: string) => {
    deleteArtwork(id)
    setArtworks(loadArtworks())
    setConfirmDelete(null)
    if (active?.id === id) setActive(null)
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--paper)' }}>

      {/* Top bar — centrat al desktop */}
      <header className="flex items-center gap-3 shrink-0 w-full max-w-6xl mx-auto"
        style={{ padding: '40px 18px 12px' }}>
        <Link href="/"
          className="flex items-center justify-center active:scale-90 transition-transform shrink-0"
          style={{
            width: 42, height: 42, borderRadius: 14, fontSize: 20,
            background: 'var(--paper-2)', border: '1px solid var(--line)',
            color: 'var(--ink)', textDecoration: 'none',
          }}>
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <h1 style={{
            margin: 0, fontFamily: 'var(--font-display)',
            fontSize: 24, fontWeight: 800, color: 'var(--ink)',
            lineHeight: 1.05,
          }}>
            Les meves obres
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-50)' }}>
            {artworks.length} {artworks.length === 1 ? 'obra guardada' : 'obres guardades'}
          </p>
        </div>
      </header>

      {/* Grid / Buit */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 18px 24px' }}>
        {artworks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full"
            style={{ paddingBottom: 40 }}>
            <div style={{ fontSize: 70, opacity: 0.4 }}>🖼️</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
              color: 'var(--ink-70)', marginTop: 14,
            }}>
              Encara no hi ha obres
            </div>
            <div style={{
              fontSize: 13.5, color: 'var(--ink-50)', marginTop: 6, maxWidth: 260,
            }}>
              Pinta un quadre i clica &quot;HE ACABAT&quot; per guardar-lo aqui
            </div>
            <Link href="/"
              style={{
                marginTop: 24, padding: '12px 26px', borderRadius: 999,
                background: ACCENT, color: 'white',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5,
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(216,91,60,0.4)',
              }}>
              Comencar a pintar
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
            {artworks.map(a => (
              <button key={a.id} onClick={() => setActive(a)}
                className="text-left active:scale-95 transition-transform"
                style={{
                  background: 'var(--paper-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 18, overflow: 'hidden',
                  padding: 0, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(35,50,62,0.08)',
                }}>
                <div style={{
                  width: '100%', aspectRatio: '1', overflow: 'hidden',
                  background: 'white',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.dataUrl} alt={a.artworkName}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
                    color: 'var(--ink)', lineHeight: 1.15,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {a.emoji} {a.artworkName}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--ink-50)', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {a.childName} · {formatDate(a.date)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Visor a pantalla completa */}
      {active && (
        <div onClick={() => setActive(null)}
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{
            background: 'rgba(20,26,34,0.92)', zIndex: 60,
            padding: 16, animation: 'fadeIn .2s ease',
          }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={active.dataUrl} alt={active.artworkName}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '92%', maxHeight: '70%', objectFit: 'contain',
              borderRadius: 12, background: 'white',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }} />
          <div style={{
            color: 'white', textAlign: 'center', marginTop: 18, padding: '0 20px',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
            }}>
              {active.emoji} {active.artworkName}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
              {active.childName} · {formatDate(active.date)}
            </div>
            {active.paintingId !== 'la-meva-foto' && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                Inspirat en {active.paintingTitle} de {active.artist}
              </div>
            )}
          </div>

          <div className="flex gap-3" style={{ marginTop: 18 }} onClick={e => e.stopPropagation()}>
            <a href={active.dataUrl} download={`${active.artworkName}.png`}
              style={{
                padding: '11px 20px', borderRadius: 999,
                background: 'rgba(255,255,255,0.15)', color: 'white',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)',
              }}>
              ⬇ Descarregar
            </a>
            <button onClick={() => setConfirmDelete(active.id)}
              style={{
                padding: '11px 20px', borderRadius: 999, border: 'none',
                background: 'rgba(216,91,60,0.3)', color: 'white',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
              }}>
              🗑️ Esborrar
            </button>
            <button onClick={() => setActive(null)}
              style={{
                padding: '11px 20px', borderRadius: 999, border: 'none',
                background: 'rgba(255,255,255,0.15)', color: 'white',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
              }}>
              Tancar
            </button>
          </div>
        </div>
      )}

      {/* Confirma esborrar */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)}
          className="fixed inset-0 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 80 }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--paper-2)', borderRadius: 22, padding: 22,
              maxWidth: 320, textAlign: 'center',
            }}>
            <div style={{ fontSize: 36 }}>🗑️</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
              marginTop: 6, color: 'var(--ink)',
            }}>
              Esborrar aquesta obra?
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 4 }}>
              No es pot recuperar
            </div>
            <div className="flex gap-2" style={{ marginTop: 18 }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 999, border: 'none',
                  background: 'rgba(35,50,62,0.08)', color: 'var(--ink-70)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer',
                }}>
                Cancellar
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 999, border: 'none',
                  background: ACCENT, color: 'white',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
                  cursor: 'pointer',
                }}>
                Si, esborrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
