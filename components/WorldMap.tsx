'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection } from 'geojson'
import { paintings, type PaintingMeta } from '@/data/paintings'

// Tons del museu — mapeig de regió a pigment
const TONE_HEX: Record<string, string> = {
  terracotta: '#D85B3C',
  ochre:      '#E0A52E',
  prussian:   '#2E6A9E',
  viridian:   '#4E8C6A',
  plum:       '#7C5C9E',
}

// Països ressaltats segons el seu pigment
const HIGHLIGHT: Record<number, keyof typeof TONE_HEX> = {
  250: 'terracotta', // França
  380: 'terracotta', // Itàlia
  528: 'terracotta', // Holanda
  276: 'terracotta', // Alemanya
  40:  'terracotta', // Àustria
  578: 'terracotta', // Noruega
  724: 'terracotta', // Espanya
  392: 'prussian',   // Japó
  710: 'viridian',   // Sud-àfrica
  840: 'ochre',      // EUA
  826: 'ochre',      // Regne Unit (Sargent)
  356: 'plum',       // Índia (Varma)
  858: 'ochre',      // Uruguai (Figari)
  818: 'ochre',      // Egipte
  410: 'prussian',   // Corea del Sud
}

interface Region {
  id: string
  label: string
  emoji: string
  coords: [number, number]   // [lon, lat]
  tone: keyof typeof TONE_HEX
  paintingIds: string[]
}

// Color accent per a cada quadre individual al mapa
const PAINTING_COLOR: Record<string, string> = {
  lascaux:'#C4A35A', renoir:'#D85B3C', morisot:'#4CC9F0', matisse:'#E63946',
  vigee:'#57CC99', botticelli:'#4CC9F0', artemisia:'#2364AA', sofonisba:'#8B5CF6',
  vangogh:'#F6C90E', cassatt:'#AEE6FF', vermeer:'#E8D5B7', mondrian:'#E63946',
  munch:'#FF6B6B', velazquez:'#C8A882', kandinsky:'#8B5CF6', klimt:'#FFD700',
  hokusai:'#4CC9F0', kusama:'#F6C90E', homer:'#57CC99', sargent:'#FF6B6B',
  lewitt:'#E63946', ndebele:'#57CC99', miro:'#F6C90E', klee:'#F4A261',
  delaunay:'#E63946', doesburg:'#2364AA', tessellation:'#8B5CF6',
  varma:'#7C5C9E', figari:'#E0A52E',
  nebamun:'#E0A52E', minhwa:'#4CC9F0', hiroshige2:'#4CC9F0',
}

const REGIONS: Region[] = [
  {
    id: 'europa', label: 'Europa', emoji: '🎨',
    coords: [12, 48], tone: 'terracotta',
    // tessellation no té coords geogràfiques → no al mapa individual
    paintingIds: [
      'delaunay','klee','doesburg','mondrian','lewitt','miro',
      'kandinsky','klimt','vangogh','matisse','renoir','morisot',
      'vigee','botticelli','artemisia','sofonisba','cassatt','vermeer',
      'munch','velazquez','lascaux',
    ],
  },
  {
    id: 'latam', label: 'Amèrica Llatina', emoji: '🥁',
    coords: [-58, -25], tone: 'ochre',
    paintingIds: ['figari'],
  },
  {
    id: 'america', label: 'Amèrica del Nord', emoji: '🌾',
    coords: [-85, 40], tone: 'ochre',
    paintingIds: ['homer','sargent'],
  },
  {
    id: 'india', label: 'Índia', emoji: '🪭',
    coords: [78, 20], tone: 'plum',
    paintingIds: ['varma'],
  },
  {
    id: 'egipte', label: 'Egipte Antic', emoji: '🌿',
    coords: [32, 26], tone: 'ochre',
    paintingIds: ['nebamun'],
  },
  {
    id: 'korea', label: 'Corea', emoji: '🐯',
    coords: [127, 37], tone: 'prussian',
    paintingIds: ['minhwa'],
  },
  {
    id: 'japo', label: 'Japó', emoji: '🌊',
    coords: [138, 37], tone: 'prussian',
    paintingIds: ['hokusai','kusama','hiroshige2'],
  },
  {
    id: 'sudafrica', label: 'Sud-àfrica', emoji: '🏠',
    coords: [25, -29], tone: 'viridian',
    paintingIds: ['ndebele'],
  },
]

interface GeoData {
  paths: { d: string | null; tone: keyof typeof TONE_HEX | null }[]
  pins: Record<string, [number, number]>
  paintingPins: Record<string, [number, number]>  // posicions SVG de cada quadre individual
}

function useWorldMap(W: number, H: number): { geo: GeoData | null; err: boolean } {
  const [geo, setGeo] = useState<GeoData | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        const topo = await res.json()
        // @ts-expect-error topojson types loose
        const fc = feature(topo, topo.objects.countries) as FeatureCollection
        const fcForFit: FeatureCollection = {
          type: 'FeatureCollection',
          features: fc.features.filter((f: Feature) => Number((f as any).id) !== 10),
        }
        const proj = geoNaturalEarth1().fitSize([W, H], fcForFit)
        const path = geoPath(proj)
        const paths = fc.features
          .filter((f: Feature) => Number((f as any).id) !== 10)
          .map((f: Feature) => ({
            d: path(f),
            tone: HIGHLIGHT[Number((f as any).id)] ?? null,
          }))
        // Pins de cluster (regions)
        const pins: Record<string, [number, number]> = {}
        REGIONS.forEach(r => {
          const p = proj(r.coords)
          if (p) pins[r.id] = p
        })
        // Pins individuals de cada quadre (per fer zoom-to-fit)
        const paintingPins: Record<string, [number, number]> = {}
        paintings.forEach(p => {
          if (p.coords) {
            const pt = proj(p.coords)
            if (pt) paintingPins[p.id] = pt
          }
        })
        if (alive) setGeo({ paths, pins, paintingPins })
      } catch {
        if (alive) setErr(true)
      }
    }
    load()
    return () => { alive = false }
  }, [W, H])

  return { geo, err }
}

interface PickerProps {
  region: Region | null
  paintingMap: Record<string, PaintingMeta>
  onClose: () => void
  onPick: (id: string) => void
}

function PickerSheet({ region, paintingMap, onClose, onPick }: PickerProps) {
  if (!region) return null
  const hex = TONE_HEX[region.tone]
  const items = region.paintingIds.map(id => paintingMap[id]).filter(Boolean)

  return (
    <div className="fixed inset-0 z-30">
      {/* Scrim */}
      <div onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(20,26,34,0.32)', animation: 'fadeIn .2s ease' }} />
      {/* Sheet */}
      <div className="absolute left-0 right-0 bottom-0 pb-safe"
        style={{
          background: 'var(--paper-2)',
          borderTopLeftRadius: 30, borderTopRightRadius: 30,
          boxShadow: '0 -14px 40px rgba(35,50,62,0.25)',
          paddingBottom: 30, animation: 'sheetUp .34s cubic-bezier(.22,1,.36,1)',
          maxHeight: '78vh', overflowY: 'auto',
        }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5">
          <div style={{ width: 42, height: 5, borderRadius: 5, background: 'var(--line)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-1">
          <div className="flex items-center justify-center shrink-0"
            style={{
              width: 46, height: 46, borderRadius: 14, fontSize: 24,
              background: `color-mix(in srgb, ${hex} 16%, white)`,
              border: `1.5px solid color-mix(in srgb, ${hex} 40%, white)`,
            }}>
            {region.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700, lineHeight: 1.1,
              color: 'var(--ink)',
            }}>
              {region.label}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 1, fontFamily: 'var(--font-body)' }}>
              Tria una obra per pintar
            </div>
          </div>
          <button onClick={onClose}
            className="flex items-center justify-center active:scale-90 transition-transform"
            style={{
              width: 34, height: 34, borderRadius: 17, border: 'none',
              background: 'var(--paper)', color: 'var(--ink-50)', fontSize: 20,
              boxShadow: 'inset 0 0 0 1px var(--line)',
            }}>
            ×
          </button>
        </div>

        {/* Paintings */}
        <div className="flex gap-3.5 px-5 pt-3.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {items.map(p => (
            <button key={p.id} onClick={() => onPick(p.id)}
              className="shrink-0 text-left active:scale-95 transition-transform"
              style={{ width: 152, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
              <div className="flex items-center justify-center overflow-hidden"
                style={{
                  width: 152, height: 120, borderRadius: 16, background: '#efe8d8',
                  boxShadow: '0 8px 18px rgba(35,50,62,0.18), 0 0 0 1px var(--line)',
                }}>
                {p.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbUrl} alt={p.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 46 }}>{p.emoji}</span>
                )}
              </div>
              <div className="truncate" style={{
                fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700,
                lineHeight: 1.12, marginTop: 9, color: 'var(--ink)',
              }}>
                {p.title}
              </div>
              <div className="truncate" style={{
                fontSize: 12, color: 'var(--ink-50)', marginTop: 1, fontFamily: 'var(--font-body)',
              }}>
                {p.artist} · {p.year}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const MIN_ZOOM = 1
const MAX_ZOOM = 20   // permet fer molt de zoom
const CLUSTER_THRESHOLD = 2.5  // zoom > X → mostra pins individuals

export default function WorldMap() {
  const router = useRouter()
  const [region, setRegion] = useState<Region | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 380, h: 264 })

  // Zoom & pan — useRef per tenir sempre el valor actual en event handlers
  // useState per forçar re-renders
  const [zoom, setZoomState] = useState(() => {
    if (typeof window === 'undefined') return 1
    return Number(sessionStorage.getItem('map-zoom') || '1')
  })
  const [pan, setPanState] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    const saved = sessionStorage.getItem('map-pan')
    return saved ? JSON.parse(saved) : { x: 0, y: 0 }
  })
  // Refs per a event handlers (sempre actuals, sense stale closure)
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)

  const setView = useCallback((z: number, p: { x: number; y: number }) => {
    const clampedZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
    zoomRef.current = clampedZ
    panRef.current = p
    setZoomState(clampedZ)
    setPanState(p)
    sessionStorage.setItem('map-zoom', String(clampedZ))
    sessionStorage.setItem('map-pan', JSON.stringify(p))
  }, [])

  // Alias per compatibilitat
  const setZoom = (z: number) => setView(z, panRef.current)
  const setPan = (p: { x: number; y: number }) => setView(zoomRef.current, p)

  // ── Drag + Pinch-to-zoom amb Pointer Events ────────────────────
  const ptrs = useRef<Map<number, { x: number; y: number }>>(new Map())
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null)
  const pinchRef = useRef<{ dist: number; midSvgX: number; midSvgY: number } | null>(null)

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return { x: clientX, y: clientY }
    const scaleX = dims.w / rect.width
    const scaleY = dims.h / rect.height
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }, [dims])

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (ptrs.current.size === 1) {
      dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: panRef.current.x, startPanY: panRef.current.y }
      pinchRef.current = null
    } else if (ptrs.current.size === 2) {
      dragRef.current = null
      const pts = Array.from(ptrs.current.values())
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      const midX = (pts[0].x + pts[1].x) / 2
      const midY = (pts[0].y + pts[1].y) / 2
      const svgMid = screenToSvg(midX, midY)
      const z = zoomRef.current, p = panRef.current
      pinchRef.current = {
        dist,
        midSvgX: (svgMid.x - p.x) / z,
        midSvgY: (svgMid.y - p.y) / z,
      }
    }
  }, [screenToSvg])

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!ptrs.current.has(e.pointerId)) return
    e.preventDefault()
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (ptrs.current.size === 1 && dragRef.current) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setView(zoomRef.current, { x: dragRef.current.startPanX + dx, y: dragRef.current.startPanY + dy })
    } else if (ptrs.current.size === 2 && pinchRef.current) {
      const pts = Array.from(ptrs.current.values())
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      const scaleFactor = newDist / pinchRef.current.dist
      const newMidX = (pts[0].x + pts[1].x) / 2
      const newMidY = (pts[0].y + pts[1].y) / 2
      const svgNewMid = screenToSvg(newMidX, newMidY)
      // Usa ref (sempre actual, no stale)
      const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * scaleFactor))
      const newPx = svgNewMid.x - pinchRef.current.midSvgX * newZ
      const newPy = svgNewMid.y - pinchRef.current.midSvgY * newZ
      setView(newZ, { x: newPx, y: newPy })
      pinchRef.current.dist = newDist
    }
  }, [screenToSvg, setView])

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    ptrs.current.delete(e.pointerId)
    if (ptrs.current.size < 2) pinchRef.current = null
    if (ptrs.current.size === 0) dragRef.current = null
  }, [])

  // Zoom predefinit per a cada cluster.
  // cx/cy: fracció [0,1] de l'SVG on és el centre geogràfic de la zona.
  // z: nivell de zoom que mostra tots els pins individuals.
  // Zoom per a cada cluster. El centre és el geo.pins[regionId] projectat
  // (posició SVG exacta del pin de la regió — ja correcte al mapa).
  const REGION_ZOOM: Record<string, number> = {
    europa: 3.0, latam: 4.5, america: 4.0,
    india: 5.5, egipte: 5.5, korea: 7.0,
    japo: 6.0, sudafrica: 5.5,
  }

  // zoomToRegion definit mes avall, despres de geo

  const zoomAround = useCallback((factor: number) => {
    const W = dims.w, H = dims.h
    const cx = W / 2, cy = H / 2
    const z = zoomRef.current, p = panRef.current
    const svgCx = (cx - p.x) / z
    const svgCy = (cy - p.y) / z
    const next = z * factor
    if (next <= 1) { setView(1, { x: 0, y: 0 }); return }
    setView(next, { x: cx - svgCx * next, y: cy - svgCy * next })
  }, [dims, setView])
  const zoomIn    = () => zoomAround(1.6)
  const zoomOut   = () => zoomAround(1 / 1.6)
  const resetZoom = () => setView(1, { x: 0, y: 0 })

  // Mesura del contenidor — usem TANT l'amplada com l'alçada reals,
  // així el mapa s'adapta a l'espai real i no es retalla per overflow
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const update = () => {
      const w = Math.max(200, el.clientWidth)
      const h = Math.max(180, el.clientHeight)
      setDims({ w, h })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { geo, err } = useWorldMap(dims.w, dims.h)
  const paintingMap = useMemo(
    () => Object.fromEntries(paintings.map(p => [p.id, p])),
    [],
  )

  const handlePick = (id: string) => {
    router.push(`/pintar/${id}`)
  }

  // Definit aquí perquè necessita geo (declarat a sobre)
  const zoomToRegion = useCallback((regionId: string) => {
    if (!geo) return
    const pin = geo.pins[regionId]
    if (!pin || dims.w === 0) return
    const z = REGION_ZOOM[regionId] ?? 3.5
    const W = dims.w, H = dims.h
    setView(z, { x: W / 2 - pin[0] * z, y: H / 2 - pin[1] * z })
  }, [geo, dims, setView])

  // Quan es toca un cluster: zoom automàtic a la regió
  const handleClusterTap = (regionId: string) => {
    zoomToRegion(regionId)
    // Si el cluster només té 1 quadre, ves-hi directament
    const r = REGIONS.find(r => r.id === regionId)
    if (r && r.paintingIds.length === 1) {
      router.push(`/pintar/${r.paintingIds[0]}`)
    }
  }

  // Ruta del viatge: Europa → Japó → Sud-àfrica
  const route = geo ? ['europa', 'japo', 'sudafrica'].map(id => geo.pins[id]).filter(Boolean) : null
  const routeD = route && route.length === 3
    ? `M${route[0][0]},${route[0][1]} L${route[1][0]},${route[1][1]} L${route[2][0]},${route[2][1]}`
    : ''

  return (
    <>
      <div ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{
          borderRadius: 26,
          background: 'var(--ocean)',
          border: '1px solid var(--land-stroke)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 14px 30px rgba(35,50,62,0.14)',
          aspectRatio: '16 / 9',
          maxHeight: '100%',
        }}>
        <svg viewBox={`0 0 ${dims.w} ${dims.h}`}
          width="100%" height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', touchAction: 'none', cursor: zoom > 1 ? 'grab' : 'default' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}>
          {!geo && !err && (
            <text x={dims.w / 2} y={dims.h / 2} textAnchor="middle" fontSize="12"
              fill="var(--ink-50)" style={{ fontFamily: 'var(--font-body)' }}>
              Desplegant el mapa…
            </text>
          )}
          {err && (
            <text x={dims.w / 2} y={dims.h / 2} textAnchor="middle" fontSize="11"
              fill="var(--ink-50)" style={{ fontFamily: 'var(--font-body)' }}>
              🌍 No s&apos;ha pogut carregar el mapa
            </text>
          )}

          {/* Grup transformat per zoom + pan */}
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
            style={{ transition: 'transform .6s cubic-bezier(.22,1,.36,1)' }}>

          {/* Països */}
          {geo && geo.paths.map((p, i) => (
            <path key={i} d={p.d ?? ''}
              fill={
                p.tone
                  ? `color-mix(in srgb, ${TONE_HEX[p.tone]} 34%, var(--land))`
                  : 'var(--land)'
              }
              stroke="var(--land-stroke)"
              strokeWidth={0.5 / zoom}
              strokeLinejoin="round" />
          ))}

          {/* Ruta de viatge */}
          {geo && routeD && (
            <path d={routeD} fill="none" stroke="var(--ochre)"
              strokeWidth={1.4 / zoom} strokeDasharray={`${2 / zoom} ${4 / zoom}`}
              strokeLinecap="round" opacity={0.85} />
          )}

          {/* Pins INDIVIDUALS (quan el zoom és prou alt) */}
          {geo && zoom >= CLUSTER_THRESHOLD && paintings.filter(p => p.coords).map(p => {
            const pt = geo.paintingPins[p.id]
            if (!pt) return null
            const color = PAINTING_COLOR[p.id] ?? '#D85B3C'
            const s = 1 / zoom
            return (
              <g key={p.id} transform={`translate(${pt[0]},${pt[1]}) scale(${s})`}
                style={{ cursor: 'pointer' }} onClick={() => router.push(`/pintar/${p.id}`)}>
                {/* Zona de click */}
                <circle r={28} fill="transparent" />
                {/* Glow */}
                <circle r={18} fill={color} opacity={0.18} style={{ pointerEvents: 'none' }} />
                {/* Pin */}
                <circle r={12} fill={color} stroke="#FFFCF4" strokeWidth={2.5}
                  style={{ filter: `drop-shadow(0 1px 4px ${color}88)` }} />
                <text textAnchor="middle" y={4.5} fontSize={10}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {p.emoji}
                </text>
                {/* Etiqueta — només quan zoom gran */}
                {zoom >= 4 && (
                  <g transform="translate(0,24)">
                    <rect x={-32} y={-10} width={64} height={16} rx={8}
                      fill="rgba(0,0,0,0.65)" />
                    <text textAnchor="middle" y={1.5} fontSize={8} fill="white"
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, pointerEvents: 'none' }}>
                      {p.title.length > 16 ? p.title.slice(0,15) + '…' : p.title}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Pins de CLUSTER (quan el zoom és baix) */}
          {geo && zoom < CLUSTER_THRESHOLD && REGIONS.map(r => {
            const p = geo.pins[r.id]
            if (!p) return null
            const hex = TONE_HEX[r.tone]
            const count = r.paintingIds.filter(id => paintingMap[id]).length
            const s = 1 / zoom
            return (
              <g key={r.id} transform={`translate(${p[0]},${p[1]}) scale(${s})`}
                style={{ cursor: 'pointer' }} onClick={() => handleClusterTap(r.id)}>
                {/* Anell pulsant */}
                <circle r={13} fill={hex} opacity={0.18}>
                  <animate attributeName="r" values="13;26;13" dur="2.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.28;0;0.28" dur="2.6s" repeatCount="indefinite" />
                </circle>
                {/* Zona de click ampliada */}
                <circle r={22} fill="transparent" />
                {/* Medalló */}
                <circle r={13} fill="#FFFCF4" stroke={hex} strokeWidth={3} />
                <text textAnchor="middle" y={4.5} fontSize={13}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {r.emoji}
                </text>
                {/* Badge recompte */}
                <circle cx={10} cy={-10} r={7.5} fill="var(--ochre)" stroke="#FFFCF4" strokeWidth={2} />
                <text x={10} y={-7} textAnchor="middle" fontSize={9} fill="#3a2a08"
                  style={{ fontWeight: 800, pointerEvents: 'none', fontFamily: 'var(--font-body)' }}>
                  {count}
                </text>
                {/* Etiqueta */}
                <g transform="translate(0,30)">
                  <rect x={-30} y={-11} width={60} height={18} rx={9}
                    fill="rgba(255,252,244,0.92)" stroke="var(--line)" strokeWidth={1} />
                  <text textAnchor="middle" y={2.5} fontSize={10} fill="var(--ink)"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, pointerEvents: 'none' }}>
                    {r.label}
                  </text>
                </g>
              </g>
            )
          })}

          </g>
          {/* Fi del grup transformat */}

          {/* Rosa dels vents */}
          {geo && (
            <g transform={`translate(40,${dims.h - 42})`} opacity={0.9} style={{ pointerEvents: 'none' }}>
              <circle r={14} fill="none" stroke="rgba(35,50,62,0.28)" strokeWidth={1} />
              <circle r={2} fill="rgba(35,50,62,0.28)" />
              <polygon points="0,-13 3,-2 0,0 -3,-2" fill="var(--terracotta)" />
              <polygon points="0,13 3,2 0,0 -3,2" fill="rgba(35,50,62,0.28)" />
              <polygon points="-13,0 -2,3 0,0 -2,-3" fill="rgba(35,50,62,0.28)" />
              <polygon points="13,0 2,3 0,0 2,-3" fill="rgba(35,50,62,0.28)" />
              <text x={0} y={-18} textAnchor="middle" fontSize={8} fill="rgba(35,50,62,0.28)"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                N
              </text>
            </g>
          )}
        </svg>

        {/* Botons de zoom */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
          <button onClick={zoomIn}
            aria-label="Ampliar"
            className="flex items-center justify-center active:scale-90 transition-transform"
            style={{
              width: 36, height: 36, borderRadius: 12, border: '1px solid var(--line)',
              background: 'var(--paper-2)', color: 'var(--ink)', fontSize: 18, fontWeight: 700,
              boxShadow: '0 2px 6px rgba(35,50,62,0.10)',
            }}>+</button>
          <button onClick={zoomOut}
            aria-label="Reduir"
            disabled={zoom <= MIN_ZOOM}
            className="flex items-center justify-center active:scale-90 transition-transform"
            style={{
              width: 36, height: 36, borderRadius: 12, border: '1px solid var(--line)',
              background: 'var(--paper-2)', color: 'var(--ink)', fontSize: 18, fontWeight: 700,
              boxShadow: '0 2px 6px rgba(35,50,62,0.10)',
              opacity: zoom <= MIN_ZOOM ? 0.4 : 1,
            }}>−</button>
          {zoom > 1.05 && (
            <button onClick={resetZoom}
              aria-label="Vista global"
              className="flex items-center justify-center active:scale-90 transition-transform"
              style={{
                width: 36, height: 36, borderRadius: 12, border: '1px solid var(--terracotta)',
                background: 'color-mix(in srgb, var(--terracotta) 16%, white)',
                color: 'var(--terracotta)', fontSize: 16,
                boxShadow: '0 2px 6px rgba(216,91,60,0.18)',
              }}>🌍</button>
          )}
        </div>
      </div>

      {/* Chips de regió */}
      <div className="flex flex-wrap justify-center gap-2 mt-4 px-2">
        {REGIONS.map(r => {
          const hex = TONE_HEX[r.tone]
          const count = r.paintingIds.filter(id => paintingMap[id]).length
          return (
            <button key={r.id} onClick={() => handleClusterTap(r.id)}
              className="flex items-center gap-1.5 active:scale-95 transition-transform"
              style={{
                padding: '7px 13px 7px 9px', borderRadius: 999,
                border: '1px solid var(--line)', background: 'var(--paper-2)',
                boxShadow: '0 2px 6px rgba(35,50,62,0.06)',
              }}>
              <span className="flex items-center justify-center"
                style={{
                  width: 18, height: 18, borderRadius: 9, fontSize: 11,
                  background: `color-mix(in srgb, ${hex} 18%, white)`,
                }}>
                {r.emoji}
              </span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)',
              }}>
                {r.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: hex, fontFamily: 'var(--font-body)' }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <PickerSheet
        region={region}
        paintingMap={paintingMap}
        onClose={() => setRegion(null)}
        onPick={handlePick}
      />
    </>
  )
}
