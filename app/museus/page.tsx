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
        coords: p.coords,
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
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  const setView = useCallback((z: number, p: { x: number; y: number }) => {
    const cz = Math.min(10, Math.max(1, z))
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
      const newZ = Math.min(10, Math.max(1, zoomRef.current * scale))
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
    const next = Math.min(10, Math.max(1, z * factor))
    if (next <= 1) { setView(1, { x: 0, y: 0 }); return }
    setView(next, { x: cx - svgCx * next, y: cy - svgCy * next })
  }, [dims, setView])

  const zoomIn = () => zoomAround(1.6)
  const zoomOut = () => zoomAround(1 / 1.6)

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
            {geo && MUSEUM_PINS.map(m => {
              const p = geo.pins[m.key]
              if (!p) return null
              const s = 1 / zoom
              const isActive = active?.key === m.key
              return (
                <g key={m.key} transform={`translate(${p[0]},${p[1]}) scale(${s})`}
                  style={{ cursor: 'pointer' }} onClick={() => setActive(isActive ? null : m)}>
                  <circle r={24} fill="transparent"/>
                  {/* Radi proporcional a nombre d'obres */}
                  <circle r={7 + m.paintings.length * 2}
                    fill={isActive ? ACCENT : '#fff'}
                    stroke={ACCENT} strokeWidth={2.5}
                    style={{ filter: `drop-shadow(0 2px 5px ${ACCENT}55)` }}/>
                  <text textAnchor="middle" y={4} fontSize={11} style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    🏛️
                  </text>
                  <text textAnchor="middle" y={20} fontSize={9} fill={ACCENT}
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 800, pointerEvents: 'none' }}>
                    {m.paintings.length}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Botons zoom */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1">
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

      {/* Detall museu — panel lliscant */}
      {active && (
        <div className="mx-4 mb-4 rounded-3xl overflow-hidden shrink-0"
          style={{
            background: 'var(--paper-2)', border: '1px solid var(--line)',
            boxShadow: '0 -4px 20px rgba(35,50,62,0.12)',
            maxHeight: '40vh', overflowY: 'auto',
            animation: 'sheetUp .3s cubic-bezier(.22,1,.36,1)',
          }}>
          <div className="flex items-start gap-3 p-4 pb-2">
            <div style={{ fontSize: 32, flexShrink: 0 }}>🏛️</div>
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)', lineHeight: 1.1 }}>
                {active.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                {active.city}, {active.country}
              </div>
            </div>
            {active.mapsQuery && (
              <a href={`https://www.google.com/maps/search/${encodeURIComponent(active.mapsQuery)}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  padding: '7px 12px', borderRadius: 999, textDecoration: 'none',
                  background: `color-mix(in srgb, ${ACCENT} 12%, white)`,
                  border: `1px solid color-mix(in srgb, ${ACCENT} 30%, white)`,
                  color: ACCENT, fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                🗺️ Maps
              </a>
            )}
          </div>

          {/* Obres d'aquest museu */}
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {active.paintings.map(p => (
              <button key={p.id} onClick={() => router.push(`/pintar/${p.id}`)}
                className="shrink-0 active:scale-95 transition-transform text-left"
                style={{ width: 100, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                <div style={{
                  width: 100, height: 76, borderRadius: 12, overflow: 'hidden',
                  background: '#efe8d8', boxShadow: '0 4px 10px rgba(35,50,62,0.15)',
                }}>
                  {p.thumbUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.thumbUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 30 }}>{p.emoji}</div>
                  }
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.emoji} {p.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Llista museus (quan no hi ha actiu) */}
      {!active && (
        <div className="mx-4 mb-4 overflow-y-auto shrink-0" style={{ maxHeight: '38vh' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: 'var(--ink-50)', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
            TOCA UN PIN AL MAPA O UN MUSEU DE LA LLISTA
          </p>
          <div className="flex flex-col gap-2">
            {MUSEUM_PINS.slice(0, 8).map(m => (
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
