'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { paintings } from '@/data/paintings'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const MIN_ZOOM = 1
const MAX_ZOOM = 10
const CLUSTER_THRESHOLD = 2.5  // zoom > X → mostra pins individuals

// Clusters de regions per a zoom baix
const CLUSTERS = [
  {
    id: 'europa',
    label: 'Europa',
    coords: [12, 50] as [number, number],
    color: '#f093fb',
    glow: 'rgba(240,147,251,0.5)',
    paintingIds: ['lascaux','renoir','morisot','matisse','vigee','botticelli','artemisia','sofonisba','vangogh','cassatt','vermeer','mondrian','munch','velazquez','lewitt','kandinsky','klimt'],
  },
  {
    id: 'america',
    label: 'Amèrica',
    coords: [-85, 40] as [number, number],
    color: '#F6C90E',
    glow: 'rgba(246,201,14,0.5)',
    paintingIds: ['homer','sargent'],
  },
  {
    id: 'japo',
    label: 'Japó',
    coords: [138, 36] as [number, number],
    color: '#4CC9F0',
    glow: 'rgba(76,201,240,0.5)',
    paintingIds: ['hokusai','kusama'],
  },
  {
    id: 'africa',
    label: 'Àfrica',
    coords: [25, -26] as [number, number],
    color: '#57CC99',
    glow: 'rgba(87,204,153,0.5)',
    paintingIds: ['ndebele'],
  },
]

// Countries to highlight (ISO numeric)
const HIGHLIGHT: Record<number, { fill: string; hover: string }> = {
  250: { fill: '#3d1a55', hover: '#5a2d7a' }, // França
  380: { fill: '#1a3d6e', hover: '#2655a0' }, // Itàlia
  528: { fill: '#1a3d6e', hover: '#2655a0' }, // Holanda
  578: { fill: '#1a4d6e', hover: '#266090' }, // Noruega
  724: { fill: '#6e1a1a', hover: '#a02626' }, // Espanya
  276: { fill: '#1a3d6e', hover: '#2655a0' }, // Alemanya
  40:  { fill: '#1a3d6e', hover: '#2655a0' }, // Àustria
  392: { fill: '#0a3d5e', hover: '#0d5e8e' }, // Japó
  710: { fill: '#1a5c3a', hover: '#24844f' }, // Sud-àfrica
  840: { fill: '#4a3d1a', hover: '#6e5a26' }, // EUA
  826: { fill: '#1a3d6e', hover: '#2655a0' }, // Regne Unit (Sargent)
}

// Color per quadre individual
const PAINTING_COLOR: Record<string, string> = {
  lascaux:   '#C4A35A', renoir:    '#f093fb', matisse:   '#E63946',
  morisot:   '#AEE6FF', vigee:     '#57CC99', botticelli:'#4CC9F0',
  artemisia: '#E63946', sofonisba: '#8B5CF6', vangogh:   '#F6C90E',
  cassatt:   '#AEE6FF', vermeer:   '#E8D5B7', mondrian:  '#E63946',
  munch:     '#FF6B6B', velazquez: '#C8A882', kandinsky: '#8B5CF6',
  klimt:     '#FFD700', hokusai:   '#4CC9F0', kusama:    '#F6C90E',
  homer:     '#57CC99', sargent:   '#FF6B6B', ndebele:   '#57CC99',
  lewitt:    '#E63946',
}

export default function WorldMap() {
  const [activeCluster, setActiveCluster] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([20, 10])
  const router = useRouter()
  const paintingMap = Object.fromEntries(paintings.map(p => [p.id, p]))

  const showIndividual = zoom >= CLUSTER_THRESHOLD

  const handleCluster = (id: string, paintingIds: string[]) => {
    if (paintingIds.length === 1) {
      router.push(`/pintar/${paintingIds[0]}`)
    } else {
      setActiveCluster(prev => prev === id ? null : id)
    }
  }

  const activeData = activeCluster ? CLUSTERS.find(c => c.id === activeCluster) : null

  return (
    <div className="relative w-full h-full" style={{ minHeight: 0 }}>
      <div className="absolute inset-0">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 125, center: [20, 10] }}
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <radialGradient id="oceanGrad" cx="50%" cy="50%" r="80%">
              <stop offset="0%" stopColor="#0d3b5e" />
              <stop offset="100%" stopColor="#071a2e" />
            </radialGradient>
          </defs>

          <rect width="800" height="600" fill="url(#oceanGrad)" />

          <ZoomableGroup
            zoom={zoom}
            center={center}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onMoveEnd={({ zoom: z, coordinates }: { zoom: number; coordinates: [number, number] }) => {
              setZoom(z)
              setCenter(coordinates)
              if (z < CLUSTER_THRESHOLD) setActiveCluster(null)
            }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const h = HIGHLIGHT[Number(geo.id)]
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={h?.fill ?? '#1e4d2b'}
                      stroke="#0a1f12"
                      strokeWidth={0.4 / zoom}
                      style={{
                        default: { outline: 'none' },
                        hover:   { outline: 'none', fill: h?.hover ?? '#2a6b3c', cursor: 'default' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {/* Pins individuals (zoom alt) */}
            {showIndividual && paintings.filter(p => p.coords).map(p => {
              const color = PAINTING_COLOR[p.id] ?? '#ffffff'
              const s = 1 / zoom
              return (
                <Marker
                  key={p.id}
                  coordinates={p.coords!}
                  onClick={() => router.push(`/pintar/${p.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <g transform={`scale(${s})`}>
                    <circle r={22} fill={color} opacity={0.2} />
                    <circle r={14} fill={color} stroke="white" strokeWidth={2}
                      style={{ filter: `drop-shadow(0 1px 4px ${color})` }}
                    />
                    <text textAnchor="middle" y={5} fontSize={10}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {p.emoji}
                    </text>
                    {zoom >= 4 && (
                      <>
                        <rect x={-30} y={17} width={60} height={14} rx={7} fill="rgba(0,0,0,0.7)" />
                        <text textAnchor="middle" y={28} fontSize={8} fill="white"
                          style={{ fontFamily: 'Nunito,sans-serif', fontWeight: 800, pointerEvents: 'none', userSelect: 'none' }}>
                          {p.title.length > 14 ? p.title.slice(0, 13) + '…' : p.title}
                        </text>
                      </>
                    )}
                  </g>
                </Marker>
              )
            })}

            {/* Pins agrupats (zoom baix) */}
            {!showIndividual && CLUSTERS.map(cl => {
              const isActive = activeCluster === cl.id
              const count = cl.paintingIds.filter(id => paintingMap[id]).length
              const s = 1 / zoom
              return (
                <Marker
                  key={cl.id}
                  coordinates={cl.coords}
                  onClick={() => handleCluster(cl.id, cl.paintingIds)}
                  style={{ cursor: 'pointer' }}
                >
                  <g transform={`scale(${s})`}>
                    <circle r={36} fill="transparent" style={{ cursor: 'pointer' }} />
                    <circle r={28} fill={cl.glow} opacity={0.2} style={{ pointerEvents: 'none' }} />
                    <circle r={18} fill={cl.glow} opacity={0.3} style={{ pointerEvents: 'none' }} />
                    <circle r={13} fill={isActive ? '#fff' : cl.color} stroke="white" strokeWidth={2.5}
                      style={{ filter: `drop-shadow(0 2px 8px ${cl.glow})` }}
                    />
                    <text textAnchor="middle" y={4} fontSize={11} style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      🎨
                    </text>
                    <rect x={-26} y={17} width={52} height={14} rx={7} fill="rgba(0,0,0,0.6)" />
                    <text textAnchor="middle" y={28} fontSize={8} fill="white"
                      style={{ fontFamily: 'Nunito,sans-serif', fontWeight: 800, pointerEvents: 'none', userSelect: 'none' }}>
                      {cl.label}
                    </text>
                    <circle cx={11} cy={-11} r={9} fill="#F6C90E" stroke="white" strokeWidth={2} />
                    <text x={11} y={-7} textAnchor="middle" fontSize={9} fill="#1A1A1A"
                      style={{ fontWeight: 800, pointerEvents: 'none', userSelect: 'none' }}>
                      {count}
                    </text>
                  </g>
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Hint zoom */}
      {!showIndividual && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs text-white/50 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.4)', fontFamily: 'Nunito,sans-serif', backdropFilter: 'blur(8px)' }}>
          Fes zoom per veure cada obra
        </div>
      )}

      {/* Botons zoom */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2" style={{ zIndex: 10 }}>
        <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, +(z * 1.6).toFixed(2)))}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-xl active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          +
        </button>
        <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, +(z / 1.6).toFixed(2)))}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-xl active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          −
        </button>
        {zoom > 1.2 && (
          <button onClick={() => { setZoom(1); setCenter([20, 10]) }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            🌍
          </button>
        )}
      </div>

      {/* Popup cluster (zoom baix) */}
      {activeData && !showIndividual && (
        <div className="absolute inset-x-3 bottom-3 rounded-3xl overflow-hidden"
          style={{ background: 'rgba(8,14,26,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div>
              <p className="text-white font-bold text-sm" style={{ fontFamily: "'Fredoka One',cursive" }}>
                🎨 {activeData.label}
              </p>
              <p className="text-white/40 text-xs" style={{ fontFamily: 'Nunito,sans-serif' }}>
                Tria un quadre · o fes zoom per veure'ls al mapa
              </p>
            </div>
            <button onClick={() => setActiveCluster(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', fontSize: 16 }}>
              ×
            </button>
          </div>
          <div className="flex gap-2.5 px-3 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {activeData.paintingIds.map(id => {
              const p = paintingMap[id]
              if (!p) return null
              return (
                <Link key={id} href={`/pintar/${id}`}
                  className="shrink-0 rounded-2xl overflow-hidden active:scale-95 transition-transform"
                  style={{ width: 110, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="h-16 overflow-hidden">
                    {p.thumbUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.thumbUrl} alt={p.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl"
                          style={{ background: 'linear-gradient(135deg,#1a1a3a,#2d1a4a)' }}>{p.emoji}</div>
                    }
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-white text-xs font-bold leading-tight truncate"
                      style={{ fontFamily: "'Fredoka One',cursive" }}>{p.title}</p>
                    <p className="text-white/40 text-xs truncate mt-0.5"
                      style={{ fontFamily: 'Nunito,sans-serif' }}>{p.artist}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
