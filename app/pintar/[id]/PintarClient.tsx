'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { type PaintingMeta } from '@/data/paintings'
import ColoringCanvas, { type ColoringCanvasHandle, type Tool, type BrushType } from '@/components/ColoringCanvas'
import Kusama, { type Dot } from '@/components/paintings/Kusama'
import { saveArtwork } from '@/lib/artworks'

// Tots els quadres usen SVG (vector, millor qualitat).
// Si no existeix (ex: renoir), ColoringCanvas fa fallback a posterize en temps real.
function sketchUrl(id: string): string {
  return `/sketches/${id}.svg`
}

// Colors extres per omplir paleta si el quadre en té pocs
const EXTRA_COLORS = ['#1A1A1A','#E63946','#F6C90E','#2E6A9E','#3FA34D','#F4A261']

// Color base del quadre — usat per accents (botons, ressaltats)
const PIGMENTS: Record<string, string> = {
  lascaux:'#D85B3C', renoir:'#D85B3C', morisot:'#D85B3C', matisse:'#D85B3C',
  vigee:'#D85B3C', botticelli:'#2E6A9E', artemisia:'#D85B3C', sofonisba:'#7C5C9E',
  vangogh:'#E0A52E', cassatt:'#2E6A9E', vermeer:'#2E6A9E', mondrian:'#D85B3C',
  munch:'#D85B3C', velazquez:'#7C5C9E', kandinsky:'#7C5C9E', klimt:'#E0A52E',
  hokusai:'#2E6A9E', kusama:'#E0A52E', homer:'#4E8C6A', sargent:'#D85B3C',
  lewitt:'#D85B3C', ndebele:'#4E8C6A',
  nebamun:'#57CC99', minhwa:'#C4622A', hiroshige2:'#2E6A9E', varma:'#2E6A9E',
  torres:'#8B4513', figari:'#C4622A', miro:'#E0A52E', wood:'#4E8C6A',
  tessellation:'#D85B3C', klee:'#E0A52E', delaunay:'#D85B3C', doesburg:'#D85B3C',
}

// glossy "wet paint" radial fill per cada dab
const dabBg = (c: string) =>
  c.toUpperCase() === '#FFFFFF'
    ? 'linear-gradient(135deg,#ffffff 0%,#ecebe3 100%)'
    : `radial-gradient(circle at 33% 27%, color-mix(in srgb, ${c} 60%, #fff) 0%, ${c} 50%, color-mix(in srgb, ${c} 74%, #000) 100%)`

interface PaintDabProps {
  color: string
  selected: boolean
  onSelect: () => void
}

function PaintDab({ color, selected, onSelect }: PaintDabProps) {
  return (
    <button
      onPointerDown={onSelect}
      aria-label={color}
      className="shrink-0 rounded-full"
      style={{
        width: 40, height: 40, border: 'none', padding: 0, cursor: 'pointer',
        background: dabBg(color),
        transition: 'transform .13s cubic-bezier(.22,1,.36,1)',
        transform: selected ? 'translateY(-6px) scale(1.14)' : 'none',
        boxShadow: selected
          ? '0 0 0 3px #fffdf8, 0 0 0 5px rgba(80,55,25,0.20), 0 10px 18px rgba(60,40,20,0.45)'
          : '0 4px 8px rgba(60,40,20,0.30), inset -2px -3px 5px rgba(0,0,0,0.22), inset 2px 3px 5px rgba(255,255,255,0.55)',
      }}
    />
  )
}

function EraserDab({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <button
      onPointerDown={onSelect}
      aria-label="Goma d'esborrar"
      className="shrink-0 rounded-full flex items-center justify-center"
      style={{
        width: 40, height: 40, border: 'none', padding: 0, cursor: 'pointer',
        background: 'linear-gradient(135deg,#ffffff 0%,#ece9e0 100%)',
        transition: 'transform .13s cubic-bezier(.22,1,.36,1)',
        transform: selected ? 'translateY(-6px) scale(1.14)' : 'none',
        boxShadow: selected
          ? '0 0 0 3px #fffdf8, 0 0 0 5px rgba(80,55,25,0.20), 0 10px 18px rgba(60,40,20,0.45)'
          : '0 4px 8px rgba(60,40,20,0.30), inset 0 0 0 1px rgba(80,55,25,0.16), inset 2px 3px 5px rgba(255,255,255,0.7)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24">
        <g transform="rotate(-38 12 12)">
          <rect x="3.5" y="9" width="17" height="9.5" rx="2.6" fill="#F09BA6" />
          <rect x="3.5" y="9" width="6.5" height="9.5" rx="2.6" fill="#fff" opacity="0.65" />
          <rect x="3.5" y="9" width="17" height="9.5" rx="2.6" fill="none" stroke="#C9707C" strokeWidth="1" />
        </g>
      </svg>
    </button>
  )
}

// Strip de l'arc de Sant Martí — toca o arrossega per triar el color
function RainbowStrip({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [indicator, setIndicator] = useState<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    // Arc de Sant Martí: tota l'espectre + blancs i negres
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    const stops = [
      [0,    '#FF0000'], [1/12, '#FF4400'], [2/12, '#FF8800'],
      [3/12, '#FFCC00'], [4/12, '#FFFF00'], [5/12, '#88FF00'],
      [6/12, '#00FF44'], [7/12, '#00FFCC'], [8/12, '#00AAFF'],
      [9/12, '#0044FF'], [10/12,'#6600FF'], [11/12,'#CC00FF'],
      [1,    '#FF0088'],
    ] as const
    stops.forEach(([pos, c]) => grad.addColorStop(pos, c))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H * 0.72)

    // Franja neutra: blanc → gris → negre
    const grad2 = ctx.createLinearGradient(0, 0, W, 0)
    grad2.addColorStop(0,    '#FFFFFF')
    grad2.addColorStop(0.35, '#CCCCCC')
    grad2.addColorStop(0.65, '#666666')
    grad2.addColorStop(1,    '#000000')
    ctx.fillStyle = grad2
    ctx.fillRect(0, H * 0.76, W, H * 0.24)
  }, [])

  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(canvas.width - 1,
      Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))))
    const y = Math.max(0, Math.min(canvas.height - 1,
      Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))))
    const [r, g, b] = canvas.getContext('2d')!.getImageData(x, y, 1, 1).data
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
    onChange(hex)
    setIndicator(x / canvas.width)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <canvas ref={canvasRef} width={512} height={56}
        style={{
          width: '100%', height: 56, borderRadius: 14,
          touchAction: 'none', cursor: 'crosshair', display: 'block',
          boxShadow: '0 3px 10px rgba(60,40,20,0.25)',
        }}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); pick(e) }}
        onPointerMove={e => { if (e.buttons) pick(e) }}
      />
      {/* Indicador de posició */}
      {indicator !== null && (
        <div style={{
          position: 'absolute', top: -4, bottom: -4,
          left: `calc(${indicator * 100}% - 3px)`,
          width: 6, borderRadius: 3,
          background: 'white',
          boxShadow: '0 0 0 2px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}

// Dab amb input type=color al damunt — selector lliure de qualsevol color
function RainbowDab({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <label
      aria-label="Triar color personalitzat"
      className="shrink-0 relative cursor-pointer"
      style={{
        width: 46, height: 46, borderRadius: '50%',
        // Cercle arc de Sant Martí
        background: 'conic-gradient(from 0deg, #E63946, #F4A261, #F6C90E, #57CC99, #4CC9F0, #2364AA, #8B5CF6, #D946EF, #E63946)',
        transition: 'transform .13s cubic-bezier(.22,1,.36,1)',
        boxShadow: '0 4px 8px rgba(60,40,20,0.30), inset -2px -3px 5px rgba(0,0,0,0.22), inset 2px 3px 5px rgba(255,255,255,0.55)',
      }}>
      {/* Centre amb el color actual + + */}
      <span style={{
        position: 'absolute', inset: 8, borderRadius: '50%',
        background: value.toUpperCase() === '#FFFFFF' ? '#FBF5E9' : value,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(74,58,32,0.8)', fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-body)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6)',
      }}>+</span>
      <input
        type="color"
        value={value.toUpperCase() === '#FFFFFF' ? '#E63946' : value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        style={{ width: '100%', height: '100%' }}
        aria-label="Color personalitzat"
      />
    </label>
  )
}

function StudioBtn({ children, onClick, ariaLabel }: { children: React.ReactNode; onClick: () => void; ariaLabel: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="shrink-0 flex items-center justify-center text-white active:scale-95 transition-transform"
      style={{
        width: 36, height: 36, borderRadius: 12, fontSize: 16,
        border: '1px solid rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.09)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {children}
    </button>
  )
}

export default function PintarClient({ painting }: { painting: PaintingMeta }) {
  const isDots = painting.mechanic === 'dots'
  const accent = PIGMENTS[painting.id] ?? '#D85B3C'

  // Comprova si hi ha una imatge personalitzada pujada via /admin
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null)
  useEffect(() => {
    if (isDots) return
    fetch('/api/admin/manifest')
      .then(r => r.json())
      .then((m: Record<string, string>) => {
        if (m[painting.id]) setCustomImageUrl(m[painting.id])
      })
      .catch(() => {})
  }, [painting.id, isDots])

  const canvasRef = useRef<ColoringCanvasHandle>(null)
  const [selectedColor, setSelectedColor] = useState(painting.palette[0] ?? '#E63946')
  const [tool, setTool] = useState<Tool>('fill')
  const [brushType, setBrushType] = useState<BrushType>('round')
  const [brushSize, setBrushSize] = useState(8)
  const [canUndo, setCanUndo] = useState(false)
  const [trayOpen, setTrayOpen] = useState(true)
  const [showModel, setShowModel] = useState(false)
  const [showExtraColors, setShowExtraColors] = useState(false)  // fila extra amagada per defecte
  const [showMuseum, setShowMuseum] = useState(false)
  const [dots, setDots] = useState<Dot[]>([])
  const [showOriginal, setShowOriginal] = useState(false)
  const [showFact, setShowFact] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [artworkName, setArtworkName] = useState('')
  const [childName, setChildName] = useState('')
  const [savedOk, setSavedOk] = useState(false)
  const handleLoadFail = useCallback(() => setLoadError(true), [])

  const handleSvgClick = useCallback((x: number, y: number) => {
    setDots(prev => {
      const next = [...prev, { x, y, color: selectedColor, r: 7 + Math.floor(Math.random() * 9) }]
      if (next.length === 25 && !celebrate) {
        setTimeout(() => setCelebrate(true), 200)
      }
      return next
    })
  }, [selectedColor, celebrate])

  const handleClear = () => {
    if (isDots) setDots([])
    else canvasRef.current?.clear()
    setCelebrate(false)
  }

  const handleUndo = () => {
    if (isDots) {
      setDots(prev => prev.slice(0, -1))
    } else {
      canvasRef.current?.undo()
    }
  }
  const undoAvailable = isDots ? dots.length > 0 : canUndo

  const handleDone = () => {
    setArtworkName('')
    setChildName('')
    setShowSaveModal(true)
  }

  const handlePrint = () => {
    const dataUrl = isDots ? null : canvasRef.current?.exportPng()
    if (!dataUrl) return
    const win = window.open('', '_blank')
    if (!win) return
    const name = childName.trim() || 'Artista'
    const title = painting.title
    win.document.write(`<!DOCTYPE html><html><head><title>${name} - ${title}</title>
      <style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:white;font-family:Arial,sans-serif}
      img{max-width:90vw;max-height:80vh;object-fit:contain;border:1px solid #ddd}
      p{margin:12px 0 4px;font-size:18px;font-weight:800;letter-spacing:0.1em}
      small{font-size:13px;color:#888}
      @media print{body{min-height:auto}}</style></head>
      <body><img src="${dataUrl}" onload="setTimeout(()=>{window.print()},300)">
      <p>${name.toUpperCase()}</p><small>${title} — Pintat per a Pintem Junts!</small></body></html>`)
    win.document.close()
  }

  const handleSaveAndCelebrate = () => {
    const dataUrl = isDots ? null : canvasRef.current?.exportPng()
    if (dataUrl) {
      try {
        saveArtwork({
          paintingId: painting.id,
          paintingTitle: painting.title,
          artist: painting.artist,
          emoji: painting.emoji,
          childName: childName.trim() || 'ARTISTA',
          artworkName: artworkName.trim() || painting.title,
          dataUrl,
        })
        setSavedOk(true)
      } catch (e) {
        console.warn('Save failed', e)
      }
    }
    setShowSaveModal(false)
    setCelebrate(true)
  }

  // colors del quadre + bàsics, deduplicat
  const artColors = (() => {
    const own = [...new Set(painting.palette.map(c => c.toUpperCase()))].filter(c => c !== '#FFFFFF')
    EXTRA_COLORS.forEach(c => { if (!own.includes(c)) own.push(c) })
    return own.slice(0, 13)
  })()

  const isErasing = selectedColor.toUpperCase() === '#FFFFFF'

  return (
    <div className="flex flex-col h-dvh overflow-hidden relative"
      style={{ background: 'radial-gradient(ellipse at 50% 32%, #322E29 0%, #211E1A 62%, #18150F 100%)' }}>

      {/* Top bar — mes ample al desktop */}
      <header className="flex items-center gap-2 px-2.5 md:px-4 pt-1.5 pb-1 shrink-0 w-full max-w-6xl mx-auto"
        style={{ paddingTop: 'max(6px, env(safe-area-inset-top))' }}>
        <Link href="/" aria-label="Tornar a l'atlas"
          className="shrink-0 flex items-center justify-center text-white active:scale-95 transition-transform"
          style={{
            width: 36, height: 36, borderRadius: 12, fontSize: 17,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.09)',
            backdropFilter: 'blur(6px)',
          }}>
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-white truncate"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, lineHeight: 1.05 }}>
            {painting.emoji} {painting.title}
          </h1>
          <p className="truncate" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 0 }}>
            {painting.artist}
          </p>
        </div>
        {painting.museum && (
          <StudioBtn onClick={() => setShowMuseum(v => !v)} ariaLabel="Visita el museu">🗺️</StudioBtn>
        )}
        <StudioBtn onClick={() => setShowFact(v => !v)} ariaLabel="Curiositat">💡</StudioBtn>
        <button
          onClick={undoAvailable ? handleUndo : undefined}
          disabled={!undoAvailable}
          aria-label="Desfer"
          className="shrink-0 flex items-center justify-center text-white transition-all active:scale-95"
          style={{
            width: 36, height: 36, borderRadius: 12, fontSize: 16,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.09)',
            backdropFilter: 'blur(6px)',
            opacity: undoAvailable ? 1 : 0.35,
            cursor: undoAvailable ? 'pointer' : 'not-allowed',
          }}
        >
          ↶
        </button>
        {painting.imageUrl && !isDots && (
          <button onClick={() => setShowModel(v => !v)} aria-label={showModel ? 'Amaga model' : 'Mostra model'}
            className="shrink-0 flex items-center justify-center text-white active:scale-95 transition-all"
            style={{
              width: 36, height: 36, borderRadius: 12, fontSize: 14,
              border: '1px solid rgba(255,255,255,0.14)',
              background: showModel ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(6px)',
              opacity: showModel ? 1 : 0.5,
            }}>
            {showModel ? '👁️' : '🙈'}
          </button>
        )}
        <StudioBtn onClick={handleClear} ariaLabel="Esborrar tot">🗑️</StudioBtn>
      </header>

      {/* Badge "Inspirat en" — visible si l'obra és original creada per a l'app */}
      {painting.inspiredBy && (
        <div className="mx-3 mt-0.5 shrink-0 flex items-center gap-2 px-3 py-1.5"
          style={{
            borderRadius: 12,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
          }}>
          <span style={{ fontSize: 13 }}>✨</span>
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
            INSPIRAT EN {painting.inspiredBy.toUpperCase()}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
            · Obra original creada per a l&apos;app
          </span>
        </div>
      )}

      {/* Fun fact */}
      {showFact && (
        <div className="mx-4 mt-0.5 shrink-0"
          style={{
            borderRadius: 16, padding: '12px 15px',
            background: 'rgba(224,165,46,0.16)',
            border: '1px solid rgba(224,165,46,0.4)',
            animation: 'floatUp .25s ease',
          }}>
          <p style={{ margin: 0, color: '#FBE9C6', fontSize: 13.5, lineHeight: 1.4 }}>
            <b style={{ color: '#F4C25E' }}>Sabies que…</b> {painting.funFact}
          </p>
        </div>
      )}

      {/* Panell museu */}
      {showMuseum && painting.museum && (() => {
        const m = painting.museum
        const mapsUrl = m.mapsQuery
          ? `https://www.google.com/maps/search/${encodeURIComponent(m.mapsQuery)}`
          : `https://www.google.com/maps/search/${encodeURIComponent(`${m.name} ${m.city}`)}`
        return (
          <div className="mx-4 mt-0.5 shrink-0"
            style={{
              borderRadius: 16, padding: '12px 15px',
              background: 'rgba(46,106,158,0.18)',
              border: '1px solid rgba(76,201,240,0.35)',
              animation: 'floatUp .25s ease',
            }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p style={{ margin: 0, color: '#AEE6FF', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                  On es pot veure
                </p>
                <p style={{ margin: '2px 0 0', color: '#E8F4FD', fontSize: 13.5, fontWeight: 700, lineHeight: 1.2 }}>
                  {m.name}
                </p>
                <p style={{ margin: '1px 0 0', color: 'rgba(174,230,255,0.7)', fontSize: 12 }}>
                  {m.city}, {m.country}
                </p>
              </div>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 active:scale-95 transition-transform"
                style={{
                  padding: '8px 14px', borderRadius: 999, textDecoration: 'none',
                  background: 'rgba(76,201,240,0.25)', border: '1px solid rgba(76,201,240,0.4)',
                  color: '#AEE6FF', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                }}>
                🗺️ Maps
              </a>
            </div>
          </div>
        )
      })()}

      {/* Canvas + referència — centrat al desktop amb max-width */}
      <div className="flex-1 flex gap-2 px-2 md:px-6 pt-2 min-h-0 items-center w-full max-w-6xl mx-auto"
        style={{
          paddingBottom: isDots ? 70 : (trayOpen ? 150 : 80),
          transition: 'padding-bottom .25s cubic-bezier(.22,1,.36,1)',
        }}>
        <div className="flex-1 flex items-center justify-center min-w-0 min-h-0 h-full">
          {isDots ? (
            <div className="rounded-3xl overflow-hidden shadow-2xl"
              style={{
                // Sense width:100% — així maxWidth + maxHeight + aspectRatio
                // mantenen sempre la forma original de la carbassa
                maxHeight: '100%', maxWidth: '100%', aspectRatio: '280/300',
              }}>
              <Kusama fills={{}} onRegionClick={() => {}} dots={dots} onSvgClick={handleSvgClick} />
            </div>
          ) : painting.imageUrl && !loadError ? (
            <ColoringCanvas
              ref={canvasRef}
              imageUrl={customImageUrl || painting.imageUrl}
              sketchUrl={customImageUrl ? undefined : sketchUrl(painting.id)}
              selectedColor={selectedColor}
              tool={tool}
              brushSize={brushSize}
              brushType={brushType}
              onLoadFail={handleLoadFail}
              onHistoryChange={setCanUndo}
              className="overflow-hidden"
              // Marc blanc tipus "passe-partout" + ombra
              style={{
                borderRadius: 14,
                boxShadow: '0 18px 40px rgba(35,50,62,0.28), 0 0 0 6px #fff, 0 0 0 7px rgba(35,50,62,0.12)',
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/55 text-sm p-6 text-center gap-3 rounded-3xl"
              style={{ width: 240, height: 180, background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-5xl">🖼️</span>
              <p>No s&apos;ha pogut carregar el quadre</p>
              {loadError && (
                <button onClick={() => setLoadError(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white active:scale-90 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  Tornar a provar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Model — referència original (ocultable) */}
        {painting.imageUrl && !isDots && showModel && (
          <div className="flex flex-col items-center gap-1 shrink-0"
            style={{ width: 'clamp(52px, 9vw, 90px)' }}>
            <span style={{
              fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontFamily: 'var(--font-body)',
            }}>
              Model
            </span>
            <button onClick={() => setShowOriginal(true)}
              className="w-full rounded-xl overflow-hidden active:scale-95 transition-transform"
              style={{
                border: '2px solid rgba(255,255,255,0.25)',
                boxShadow: '0 6px 14px rgba(0,0,0,0.4)',
                background: 'none', padding: 0, cursor: 'pointer',
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={painting.thumbUrl || painting.imageUrl} alt={painting.title}
                className="w-full block" />
            </button>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>
              toca per veure
            </span>
          </div>
        )}
      </div>

      {/* He acabat — FLOTANT a esquerra bottom. En pantalles amples es queda
          a prop de la zona del canvas (no a l'extrem esquerre del navegador) */}
      <button onClick={handleDone}
        className="fixed flex items-center gap-1 active:scale-95 transition-transform"
        style={{
          left: 'max(14px, calc((100vw - 1152px) / 2 + 14px))',
          // Per Kusama no hi ha tray, sempre a baix.
          // Per la resta: puja amunt quan s'obre la safata
          bottom: (!isDots && trayOpen) ? 'calc(env(safe-area-inset-bottom) + 150px)' : 'calc(env(safe-area-inset-bottom) + 14px)',
          zIndex: 41,
          padding: '8px 16px', borderRadius: 999, border: 'none',
          background: accent, color: 'white',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
          boxShadow: `0 4px 14px ${accent}66`,
          display: 'flex', alignItems: 'center',
          transition: 'bottom .25s cubic-bezier(.22,1,.36,1)',
        }}>
        He acabat <span style={{ fontSize: 14 }}>✓</span>
      </button>

      {/* ── La safata ceràmica FLOTANT — desplegable per donar màxim espai al canvas ── */}
      {!isDots && !trayOpen && (
        <button onClick={() => setTrayOpen(true)}
          aria-label="Obrir paleta"
          className="fixed flex items-center justify-center active:scale-95 transition-transform"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom) + 14px)',
            // En pantalles molt amples queda a prop del canvas (no del navegador)
            right: 'max(14px, calc((100vw - 1152px) / 2 + 14px))',
            zIndex: 40,
            width: 60, height: 60, borderRadius: '50%', border: 'none',
            padding: 0, cursor: 'pointer',
            background: 'linear-gradient(180deg,#F5EAD4 0%, #E7D4B2 100%)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}>
          <span style={{
            width: 38, height: 38, borderRadius: '50%', display: 'block',
            background: dabBg(selectedColor),
            boxShadow: '0 3px 6px rgba(60,40,20,0.4), inset -2px -3px 5px rgba(0,0,0,0.22), inset 2px 3px 5px rgba(255,255,255,0.5)',
          }} />
        </button>
      )}
      {!isDots && trayOpen && (
        <div className="fixed pb-safe"
          style={{
            // Centrada amb max-width al desktop (no s'estira a tota la pantalla)
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 720,  // amplada agradable al desktop
            bottom: 0, zIndex: 40,
            paddingTop: 4, paddingBottom: 8,
            background: 'linear-gradient(180deg,#F5EAD4 0%, #E7D4B2 100%)',
            borderTopLeftRadius: 22, borderTopRightRadius: 22,
            borderTop: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 -8px 22px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.8)',
            animation: 'sheetUp .25s cubic-bezier(.22,1,.36,1)',
          }}>
          {/* Botó "tancar safata" — fletxa avall + drag handle visual */}
          <button onClick={() => setTrayOpen(false)}
            aria-label="Tancar paleta"
            className="absolute active:scale-95 transition-transform"
            style={{
              top: 6, right: 12, zIndex: 1,
              width: 28, height: 28, borderRadius: '50%',
              border: 'none', cursor: 'pointer',
              background: 'rgba(74,58,32,0.12)',
              color: '#5C4424', fontSize: 14, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            ↓
          </button>
          <div className="flex justify-center" style={{ paddingBottom: 4 }}>
            <div style={{ width: 38, height: 4, borderRadius: 4, background: 'rgba(74,58,32,0.2)' }} />
          </div>

          {/* Capçalera + eines fusionades en una sola fila per estalviar alçada */}
          <div className="flex items-center justify-center gap-1.5 px-3 pb-1.5 flex-wrap">
            <div className="flex rounded-full overflow-hidden"
              style={{ background: 'rgba(74,58,32,0.08)', border: '1px solid rgba(74,58,32,0.12)' }}>
              <button onClick={() => setTool('fill')}
                className="flex items-center gap-1.5 active:scale-95 transition-all"
                style={{
                  padding: '7px 14px', fontSize: 12.5, fontWeight: 700,
                  background: tool === 'fill' ? accent : 'transparent',
                  color: tool === 'fill' ? 'white' : 'rgba(74,58,32,0.7)',
                  fontFamily: 'var(--font-body)', border: 'none',
                }}>
                <span style={{ fontSize: 14 }}>🪣</span> Omple
              </button>
              <button onClick={() => setTool('brush')}
                className="flex items-center gap-1.5 active:scale-95 transition-all"
                style={{
                  padding: '7px 14px', fontSize: 12.5, fontWeight: 700,
                  background: tool === 'brush' ? accent : 'transparent',
                  color: tool === 'brush' ? 'white' : 'rgba(74,58,32,0.7)',
                  fontFamily: 'var(--font-body)', border: 'none',
                }}>
                <span style={{ fontSize: 14 }}>🖌️</span> Pinzell
              </button>
            </div>

            {/* Tipus de pinzell + mides (només si tool=brush) */}
            {tool === 'brush' && (
              <>
                {/* Tipus */}
                <div className="flex items-center gap-1">
                  {([
                    { t: 'round',  icon: '●',  label: 'Rodó' },
                    { t: 'marker', icon: '▮',  label: 'Retolador' },
                    { t: 'crayon', icon: '✶',  label: 'Cera' },
                    { t: 'pencil', icon: '✎',  label: 'Llapis' },
                  ] as const).map(({ t, icon, label }) => {
                    const active = brushType === t
                    return (
                      <button key={t} onClick={() => setBrushType(t)}
                        title={label}
                        className="flex items-center justify-center active:scale-90 transition-all"
                        style={{
                          width: 30, height: 30, borderRadius: 10,
                          fontSize: 13, fontWeight: 700,
                          color: active ? accent : 'rgba(74,58,32,0.7)',
                          background: active ? `${accent}1f` : 'rgba(74,58,32,0.06)',
                          border: `1.5px solid ${active ? accent : 'rgba(74,58,32,0.15)'}`,
                        }}>
                        {icon}
                      </button>
                    )
                  })}
                </div>

                {/* Mides — més fines */}
                <div className="flex items-center gap-1.5">
                  {[
                    { l: 'XS', s: 3 },
                    { l: 'S',  s: 8 },
                    { l: 'M',  s: 18 },
                    { l: 'L',  s: 36 },
                    { l: 'XL', s: 60 },
                  ].map(({ l, s }) => {
                    const active = brushSize === s
                    return (
                      <button key={l} onClick={() => setBrushSize(s)}
                        title={l}
                        className="flex items-center justify-center rounded-full active:scale-90 transition-all"
                        style={{
                          width: 30, height: 30,
                          background: active ? `${accent}33` : 'rgba(74,58,32,0.06)',
                          border: `1.5px solid ${active ? accent : 'rgba(74,58,32,0.15)'}`,
                        }}>
                        <div className="rounded-full" style={{
                          background: selectedColor,
                          width: Math.max(2, Math.min(20, 2 + s * 0.3)),
                          height: Math.max(2, Math.min(20, 2 + s * 0.3)),
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
                        }} />
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Dabs — primera fila: paleta del quadre + botó expandir */}
          <div className="flex items-center overflow-x-auto"
            style={{ gap: 7, padding: '2px 12px 0', scrollbarWidth: 'none' }}>
            <EraserDab selected={isErasing} onSelect={() => setSelectedColor('#FFFFFF')} />
            <span style={{ width: 1, height: 28, background: 'rgba(74,58,32,0.16)', alignSelf: 'center', flexShrink: 0 }} />
            {artColors.map(c => (
              <PaintDab key={c} color={c}
                selected={!isErasing && selectedColor.toUpperCase() === c}
                onSelect={() => setSelectedColor(c)} />
            ))}
            {/* Botó expandir més colors */}
            <button onClick={() => setShowExtraColors(v => !v)}
              className="shrink-0 flex items-center justify-center active:scale-90 transition-all"
              style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: showExtraColors ? 'rgba(74,58,32,0.18)' : 'rgba(74,58,32,0.08)',
                fontSize: 16, color: 'rgba(74,58,32,0.7)',
                boxShadow: showExtraColors ? 'inset 0 1px 3px rgba(0,0,0,0.12)' : '0 2px 5px rgba(60,40,20,0.15)',
              }}>
              {showExtraColors ? '▴' : '▾'}
            </button>
          </div>

          {/* Arc de Sant Martí — amagat per defecte, expandible */}
          {showExtraColors && (
            <div style={{ padding: '6px 12px 2px' }}>
              <RainbowStrip value={selectedColor} onChange={setSelectedColor} />
            </div>
          )}
        </div>
      )}

      {/* Original a pantalla completa */}
      {showOriginal && painting.imageUrl && (
        <div onClick={() => setShowOriginal(false)}
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ background: 'rgba(10,8,6,0.94)', zIndex: 55, animation: 'fadeIn .2s ease' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={painting.imageUrl} alt={painting.title}
            className="object-contain"
            style={{
              maxWidth: '92%', maxHeight: '82%',
              borderRadius: 16, boxShadow: '0 18px 50px rgba(0,0,0,0.7)',
            }} />
          <p className="absolute bottom-10"
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            Toca per tancar
          </p>
        </div>
      )}

      {/* Celebració */}
      {celebrate && (
        <div onClick={() => setCelebrate(false)}
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{ background: 'rgba(251,245,233,0.96)', zIndex: 60, animation: 'fadeIn .2s ease' }}>
          {[...Array(26)].map((_, i) => {
            const cols = ['#D85B3C', '#E0A52E', '#2E6A9E', '#4E8C6A', '#7C5C9E', '#FFD700']
            return (
              <div key={i} style={{
                position: 'absolute', top: 0,
                left: `${(i * 37) % 100}%`,
                width: 9, height: 13, borderRadius: 2,
                background: cols[i % cols.length],
                animation: `confettiFall ${1.6 + (i % 5) * 0.35}s ${(i % 7) * 0.12}s ease-in forwards`,
              }} />
            )
          })}
          <div style={{ fontSize: 74, animation: 'bob 1s ease-in-out infinite' }}>🎉</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800,
            color: accent, marginTop: 4,
          }}>
            Ets un artista!
          </div>
          <div style={{ fontSize: 15, color: 'var(--ink-70)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
            {savedOk ? 'La teva obra esta guardada ✨' : 'La teva obra ha quedat preciosa ✨'}
          </div>
          <div className="flex flex-col items-center gap-2.5" style={{ marginTop: 20 }}>
            <button onClick={() => setCelebrate(false)}
              style={{
                padding: '12px 26px', borderRadius: 999, border: 'none',
                background: accent, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                boxShadow: `0 8px 20px ${accent}66`,
              }}>
              Seguir pintant
            </button>
            {/* Imprimir */}
            {!isDots && (
              <button onClick={handlePrint}
                style={{
                  padding: '10px 20px', borderRadius: 999, border: 'none',
                  background: 'rgba(35,50,62,0.08)', color: 'var(--ink-70)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                🖨️ Imprimir
              </button>
            )}
            {savedOk && (
              <Link href="/les-meves-obres"
                style={{
                  padding: '10px 20px', borderRadius: 999,
                  background: 'transparent', color: 'var(--ink-70)', fontSize: 13, fontWeight: 700,
                  fontFamily: 'var(--font-display)', textDecoration: 'none',
                  border: '1.5px solid var(--ink-35)',
                }}>
                Veure les meves obres
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Modal: posa nom a la teva obra */}
      {showSaveModal && (
        <div onClick={() => setShowSaveModal(false)}
          className="fixed inset-0 flex items-end sm:items-center justify-center px-4"
          style={{ background: 'rgba(20,26,34,0.55)', zIndex: 70, animation: 'fadeIn .2s ease' }}>
          <div onClick={e => e.stopPropagation()}
            className="w-full"
            style={{
              maxWidth: 420, background: 'var(--paper-2)',
              borderTopLeftRadius: 30, borderTopRightRadius: 30,
              borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
              padding: '24px 22px 28px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
              animation: 'sheetUp .3s cubic-bezier(.22,1,.36,1)',
            }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 38 }}>🎨</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                color: 'var(--ink)', marginTop: 4,
              }}>
                Guardem la teva obra!
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 2 }}>
                Posa-li un nom per recordar-la
              </div>
            </div>

            <label className="block" style={{ marginBottom: 14 }}>
              <span style={{
                display: 'block', fontSize: 11, fontWeight: 800,
                color: 'var(--ink-70)', letterSpacing: '0.08em', marginBottom: 6,
              }}>
                Nom de l&apos;obra
              </span>
              <input
                type="text"
                value={artworkName}
                onChange={e => setArtworkName(e.target.value.toUpperCase().slice(0, 30))}
                placeholder="EL MEU QUADRE"
                autoFocus
                className="no-uppercase"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 14,
                  border: '2px solid var(--line)', background: 'white',
                  fontSize: 16, fontWeight: 700, color: 'var(--ink)',
                  fontFamily: 'var(--font-body)', textTransform: 'uppercase',
                }}
              />
            </label>

            <label className="block" style={{ marginBottom: 18 }}>
              <span style={{
                display: 'block', fontSize: 11, fontWeight: 800,
                color: 'var(--ink-70)', letterSpacing: '0.08em', marginBottom: 6,
              }}>
                El teu nom
              </span>
              <input
                type="text"
                value={childName}
                onChange={e => setChildName(e.target.value.toUpperCase().slice(0, 20))}
                placeholder="ARTISTA"
                className="no-uppercase"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 14,
                  border: '2px solid var(--line)', background: 'white',
                  fontSize: 16, fontWeight: 700, color: 'var(--ink)',
                  fontFamily: 'var(--font-body)', textTransform: 'uppercase',
                }}
              />
            </label>

            <div className="flex gap-2">
              <button onClick={() => setShowSaveModal(false)}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 999, border: 'none',
                  background: 'rgba(35,50,62,0.06)', color: 'var(--ink-70)',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                }}>
                Tornar
              </button>
              <button onClick={handleSaveAndCelebrate}
                style={{
                  flex: 2, padding: '13px 0', borderRadius: 999, border: 'none',
                  background: accent, color: 'white',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  boxShadow: `0 6px 18px ${accent}66`,
                }}>
                Guardar i celebrar! 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
