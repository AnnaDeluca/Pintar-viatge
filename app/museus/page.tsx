'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection } from 'geojson'
import Link from 'next/link'
import { paintings, type PaintingMeta } from '@/data/paintings'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const ACCENT = '#2E6A9E'

// ── Carrusel Netflix del museu ───────────────────────────────────
function MuseumCarousel({ museum, onClose, onPick }: {
  museum: MuseumPin; onClose: () => void; onPick: (id: string) => void
}) {
  const [idx, setIdx] = useState(0)
  const touchX = useRef<number | null>(null)
  const items = museum.paintings
  const total = items.length
  const p = items[idx]

  const prev = () => setIdx(i => (i - 1 + total) % total)
  const next = () => setIdx(i => (i + 1) % total)

  return (
    <div className="fixed inset-0 z-30 flex flex-col" style={{ animation: 'fadeIn .2s ease' }}>
      <div onClick={onClose} className="absolute inset-0"
        style={{ background: 'rgba(10,8,6,0.80)', backdropFilter: 'blur(5px)' }} />

      {/* Card central */}
      <div className="relative flex flex-col items-center justify-center flex-1 px-5"
        onTouchStart={e => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (dx < -40) next(); else if (dx > 40) prev()
          touchX.current = null
        }}>
        <div className="relative w-full" style={{ maxWidth: 360 }}>
          {/* Fons difuminat */}
          {p.thumbUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.thumbUrl} alt="" aria-hidden style={{
              position: 'absolute', inset: -20, width: 'calc(100% + 40px)', height: 'calc(100% + 40px)',
              objectFit: 'cover', filter: 'blur(22px) brightness(0.4)', borderRadius: 30, pointerEvents: 'none',
            }} />
          )}
          {/* Card */}
          <button onClick={() => onPick(p.id)} className="relative w-full active:scale-95 transition-transform"
            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
            <div style={{ width: '100%', aspectRatio: '3/2', borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 20px 55px rgba(0,0,0,0.7)' }}>
              {p.thumbUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.thumbUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#efe8d8', fontSize: 72 }}>{p.emoji}</div>
              }
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center' }}>
                <span style={{ background: 'white', color: '#1A1A1A', padding: '7px 20px',
                  borderRadius: 999, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>
                  🎨 Pinta!
                </span>
              </div>
            </div>
          </button>

          {/* Info */}
          <div style={{ textAlign: 'center', marginTop: 14, position: 'relative' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'white', lineHeight: 1.1 }}>
              {p.artist}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontFamily: 'var(--font-body)' }}>
              {p.emoji} {p.title} · {p.year}
            </div>
          </div>

          {/* Dots */}
          {total > 1 && (
            <div className="flex justify-center gap-2" style={{ marginTop: 12 }}>
              {items.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{
                  width: i === idx ? 18 : 7, height: 7, borderRadius: 4,
                  background: i === idx ? ACCENT : 'rgba(255,255,255,0.3)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'width .2s ease, background .2s ease',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Fletxes */}
        {total > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
              width: 50, height: 110, background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.6)', fontSize: 30, cursor: 'pointer' }}>‹</button>
            <button onClick={next} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
              width: 50, height: 110, background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.6)', fontSize: 30, cursor: 'pointer' }}>›</button>
          </>
        )}
      </div>

      {/* Footer museu */}
      <div className="relative flex items-center gap-3 px-5 shrink-0"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
        <span style={{ fontSize: 22 }}>🏛️</span>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {museum.name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)' }}>
            {museum.city}, {museum.country} · {total} {total === 1 ? 'obra' : 'obres'}
          </div>
        </div>
        {museum.mapsQuery && (
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(museum.mapsQuery)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ padding: '7px 12px', borderRadius: 999, textDecoration: 'none',
              background: `color-mix(in srgb, ${ACCENT} 25%, rgba(255,255,255,0.15))`,
              border: `1px solid color-mix(in srgb, ${ACCENT} 50%, rgba(255,255,255,0.3))`,
              color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            🗺️ Maps
          </a>
        )}
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, border: 'none',
          background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
    </div>
  )
}

// Agrega tots els museus únics de les obres
interface MuseumPin {
  key: string
  name: string
  city: string
  country: string
  url?: string
  mapsQuery?: string
  paintings: PaintingMeta[]
  coords: [number, number]
}

// Clúster de pins propers (agrupa múltiples museus en una sola icona)
interface ClusterPin {
  keys: string[]           // claus dels museus del clúster
  cx: number; cy: number  // posició SVG del centre
  totalPaintings: number
  museums: MuseumPin[]
}

function buildMuseumPins(): MuseumPin[] {
  const map = new Map<string, MuseumPin>()
  for (const p of paintings) {
    if (!p.museum || !p.coords) continue
    const key = `${p.museum.name}|${p.museum.city}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: p.museum.name,
        city: p.museum.city,
        country: p.museum.country,
        url: p.museum.url,
        mapsQuery: p.museum.mapsQuery,
        paintings: [],
        coords: p.museum.coords ?? p.coords,
      })
    }
    map.get(key)!.paintings.push(p)
  }
  return Array.from(map.values()).sort((a, b) => b.paintings.length - a.paintings.length)
}

const MUSEUM_PINS = buildMuseumPins()

interface GeoData {
  paths: { d: string | null }[]
  pins: Record<string, [number, number]>
}

export default function MuseusPage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 380, h: 264 })
  const [geo, setGeo] = useState<GeoData | null>(null)
  const [active, setActive] = useState<MuseumPin | null>(null)
  const [activeCluster, setActiveCluster] = useState<ClusterPin | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  const setView = useCallback((z: number, p: { x: number; y: number }) => {
    const cz = Math.min(20, Math.max(1, z))  // max zoom 20
    zoomRef.current = cz; panRef.current = p
    setZoom(cz); setPan(p)
  }, [])

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const update = () => setDims({ w: Math.max(200, el.clientWidth), h: Math.max(180, el.clientHeight) })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Load map
  useEffect(() => {
    let alive = true
    fetch(GEO_URL).then(r => r.json()).then(topo => {
      if (!alive) return
      const fc = feature(topo as any, (topo as any).objects.countries) as unknown as FeatureCollection
      const forFit: FeatureCollection = { type: 'FeatureCollection', features: fc.features.filter((f: Feature) => Number((f as any).id) !== 10) }
      const proj = geoNaturalEarth1().fitSize([dims.w, dims.h], forFit)
      const path = geoPath(proj)
      const paths = forFit.features.map((f: Feature) => ({ d: path(f) }))
      const pins: Record<string, [number, number]> = {}
      MUSEUM_PINS.forEach(m => { const p = proj(m.coords); if (p) pins[m.key] = p })
      setGeo({ paths, pins })
    })
    return () => { alive = false }
  }, [dims.w, dims.h])

  // Drag + pinch — mateixa implementació que WorldMap
  const ptrs = useRef(new Map<number, { x: number; y: number }>())
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)
  const pinchRef = useRef<{ dist: number; midSvgX: number; midSvgY: number } | null>(null)

  const screenToSvg = useCallback((cx: number, cy: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return { x: cx, y: cy }
    return { x: (cx - rect.left) * (dims.w / rect.width), y: (cy - rect.top) * (dims.h / rect.height) }
  }, [dims])

  const onDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (ptrs.current.size === 1) {
      dragRef.current = { sx: e.clientX, sy: e.clientY, px: panRef.current.x, py: panRef.current.y }
      pinchRef.current = null
    } else if (ptrs.current.size === 2) {
      dragRef.current = null
      const pts = Array.from(ptrs.current.values())
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      const mid = screenToSvg((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2)
      const z = zoomRef.current, p = panRef.current
      pinchRef.current = { dist, midSvgX: (mid.x - p.x) / z, midSvgY: (mid.y - p.y) / z }
    }
  }, [screenToSvg])

  const onMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!ptrs.current.has(e.pointerId)) return
    e.preventDefault()
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (ptrs.current.size === 1 && dragRef.current) {
      setView(zoomRef.current, { x: dragRef.current.px + e.clientX - dragRef.current.sx, y: dragRef.current.py + e.clientY - dragRef.current.sy })
    } else if (ptrs.current.size === 2 && pinchRef.current) {
      const pts = Array.from(ptrs.current.values())
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      const scale = newDist / pinchRef.current.dist
      const mid = screenToSvg((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2)
      const newZ = Math.min(20, Math.max(1, zoomRef.current * scale))
      setView(newZ, { x: mid.x - pinchRef.current.midSvgX * newZ, y: mid.y - pinchRef.current.midSvgY * newZ })
      pinchRef.current.dist = newDist
    }
  }, [screenToSvg, setView])

  const onUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    ptrs.current.delete(e.pointerId)
    if (ptrs.current.size < 2) pinchRef.current = null
    if (ptrs.current.size === 0) dragRef.current = null
  }, [])

  const zoomAround = useCallback((factor: number) => {
    const z = zoomRef.current, p = panRef.current
    const cx = dims.w / 2, cy = dims.h / 2
    const svgCx = (cx - p.x) / z, svgCy = (cy - p.y) / z
    const next = Math.min(20, Math.max(1, z * factor))
    if (next <= 1) { setView(1, { x: 0, y: 0 }); return }
    setView(next, { x: cx - svgCx * next, y: cy - svgCy * next })
  }, [dims, setView])

  const zoomIn = () => zoomAround(1.6)
  const zoomOut = () => zoomAround(1 / 1.6)

  // Agrupa museus propers en clústers segons el zoom actual
  // Distància de clustering dinàmica: 20px en coordenades de pantalla
  const clusters = useMemo<ClusterPin[]>(() => {
    if (!geo) return []
    const CLUSTER_PX = 32  // píxels de pantalla per agrupar
    const CLUSTER_SVG = CLUSTER_PX / zoom
    const groups: ClusterPin[] = []
    for (const m of MUSEUM_PINS) {
      const p = geo.pins[m.key]
      if (!p) continue
      const existing = groups.find(g => Math.hypot(g.cx - p[0], g.cy - p[1]) < CLUSTER_SVG)
      if (existing) {
        existing.keys.push(m.key)
        existing.museums.push(m)
        existing.totalPaintings += m.paintings.length
        // actualitza centre (centroide)
        existing.cx = (existing.cx * (existing.keys.length - 1) + p[0]) / existing.keys.length
        existing.cy = (existing.cy * (existing.keys.length - 1) + p[1]) / existing.keys.length
      } else {
        groups.push({ keys: [m.key], cx: p[0], cy: p[1], totalPaintings: m.paintings.length, museums: [m] })
      }
    }
    return groups
  }, [geo, zoom])

  // Museus visibles en el viewport actual del mapa
  const visibleMuseums = useMemo(() => {
    if (!geo) return MUSEUM_PINS.slice(0, 8)
    return MUSEUM_PINS.filter(m => {
      const p = geo.pins[m.key]
      if (!p) return false
      const sx = p[0] * zoom + pan.x
      const sy = p[1] * zoom + pan.y
      return sx >= -20 && sx <= dims.w + 20 && sy >= -20 && sy <= dims.h + 20
    }).slice(0, 12)
  }, [geo, zoom, pan, dims])

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--paper)' }}>
      {/* Header */}
      <header className="flex items-center gap-3 shrink-0 px-4"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 12 }}>
        <Link href="/" style={{
          width: 38, height: 38, borderRadius: 12, border: '1px solid var(--line)',
          background: 'var(--paper-2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', textDecoration: 'none', color: 'var(--ink)', fontSize: 18, flexShrink: 0,
        }}>←</Link>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>
            🏛️ Descobrir Museus
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-50)', fontFamily: 'var(--font-body)' }}>
            {MUSEUM_PINS.length} museus del món
          </p>
        </div>
      </header>

      {/* Mapa */}
      <div ref={containerRef} className="relative flex-1 min-h-0 mx-4 mb-2" style={{
        borderRadius: 20, overflow: 'hidden', background: '#d4e8f5',
        border: '1px solid rgba(46,106,158,0.2)',
        boxShadow: '0 4px 16px rgba(35,50,62,0.12)',
      }}>
        <svg viewBox={`0 0 ${dims.w} ${dims.h}`} width="100%" height="100%"
          style={{ display: 'block', touchAction: 'none', cursor: zoom > 1 ? 'grab' : 'default' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <rect width={dims.w} height={dims.h} fill="#d4e8f5"/>
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
            style={{ transition: 'transform .4s cubic-bezier(.22,1,.36,1)' }}>
            {geo?.paths.map((p, i) => (
              <path key={i} d={p.d ?? ''} fill="#e8f0e0" stroke="rgba(46,106,158,0.25)" strokeWidth={0.6 / zoom} strokeLinejoin="round"/>
            ))}
            {clusters.map(cl => {
              const s = 1 / zoom
              const isCluster = cl.keys.length > 1
              const isSingle = cl.keys.length === 1
              const museum = isSingle ? cl.museums[0] : null
              const isActive = isSingle && active?.key === cl.keys[0]
              const r = isCluster ? Math.min(14, 8 + cl.keys.length) : 8 + cl.totalPaintings * 1.5
              return (
                <g key={cl.keys.join('|')}
                  transform={`translate(${cl.cx},${cl.cy}) scale(${s})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (isCluster) {
                      // Zoom al clúster per desagrupar-lo
                      const newZ = Math.min(20, zoom * 3)
                      setView(newZ, {
                        x: dims.w / 2 - cl.cx * newZ,
                        y: dims.h / 2 - cl.cy * newZ,
                      })
                    } else if (museum) {
                      setActive(isActive ? null : museum)
                    }
                  }}>
                  <circle r={r + 10} fill="transparent"/>
                  <circle r={r}
                    fill={isActive ? ACCENT : (isCluster ? ACCENT : '#fff')}
                    stroke={ACCENT} strokeWidth={isCluster ? 0 : 2.5}
                    style={{ filter: `drop-shadow(0 2px 6px ${ACCENT}66)` }}/>
                  {isCluster ? (
                    <>
                      <text textAnchor="middle" y={5} fontSize={Math.max(10, r * 0.8)}
                        fill="white" fontWeight={800}
                        style={{ fontFamily: 'var(--font-display)', pointerEvents: 'none', userSelect: 'none' }}>
                        {cl.keys.length}
                      </text>
                    </>
                  ) : (
                    <>
                      <text textAnchor="middle" y={4} fontSize={11}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        🏛️
                      </text>
                      {cl.totalPaintings > 1 && (
                        <text textAnchor="middle" y={20} fontSize={9}
                          fill={isActive ? 'white' : ACCENT}
                          style={{ fontFamily: 'var(--font-display)', fontWeight: 800, pointerEvents: 'none' }}>
                          {cl.totalPaintings}
                        </text>
                      )}
                    </>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Botons zoom — dalt-esquerra per no tapar pins */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {[{fn: zoomIn, l: '+'}, {fn: zoomOut, l: '−'}].map(({fn, l}) => (
            <button key={l} onClick={fn} style={{
              width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(46,106,158,0.25)',
              background: 'var(--paper-2)', color: ACCENT, fontSize: 18, fontWeight: 700,
              boxShadow: '0 2px 6px rgba(35,50,62,0.1)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{l}</button>
          ))}
          {zoom > 1.05 && (
            <button onClick={() => setView(1, { x: 0, y: 0 })} style={{
              width: 32, height: 32, borderRadius: 10, border: `1px solid ${ACCENT}`,
              background: `color-mix(in srgb, ${ACCENT} 12%, white)`, fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🌍</button>
          )}
        </div>
      </div>

      {/* Carrusel Netflix del museu actiu */}
      {active && <MuseumCarousel museum={active} onClose={() => setActive(null)} onPick={id => router.push(`/pintar/${id}`)} />}

      {/* Llista museus visibles al viewport (quan no hi ha actiu) */}
      {!active && (
        <div className="mx-4 mb-4 overflow-y-auto shrink-0" style={{ maxHeight: '38vh' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: 'var(--ink-50)', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
            {zoom > 1.05 ? `${visibleMuseums.length} MUSEUS EN AQUEST ÀREA` : 'TOCA UN PIN O UN MUSEU DE LA LLISTA'}
          </p>
          <div className="flex flex-col gap-2">
            {visibleMuseums.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink-50)', textAlign: 'center', padding: '12px 0', fontFamily: 'var(--font-body)' }}>
                Cap museu en aquesta zona — allunya el zoom per veure&apos;n més
              </p>
            ) : visibleMuseums.map(m => (
              <button key={m.key} onClick={() => setActive(m)}
                className="flex items-center gap-3 active:scale-95 transition-transform text-left"
                style={{
                  border: '1px solid var(--line)', background: 'var(--paper-2)',
                  borderRadius: 14, padding: '10px 14px', cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(35,50,62,0.06)',
                }}>
                <span style={{ fontSize: 22 }}>🏛️</span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 800, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-50)', fontFamily: 'var(--font-body)' }}>
                    {m.city} · {m.paintings.length} {m.paintings.length === 1 ? 'obra' : 'obres'}
                  </div>
                </div>
                <span style={{ fontSize: 16, color: 'var(--ink-35)' }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
