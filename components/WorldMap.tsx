'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { paintings } from '@/data/paintings'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Tots els quadres europeus junts, "França" integrat a Europa
const PINS = [
  {
    id: 'europa',
    label: 'Europa',
    coords: [15, 50] as [number, number],
    paintingIds: ['lascaux', 'vangogh', 'matisse', 'mondrian', 'kandinsky', 'klimt', 'kahlo'],
    emoji: '🎨',
    color: '#f093fb',
    glow: 'rgba(240,147,251,0.5)',
  },
  {
    id: 'japo',
    label: 'Japó',
    coords: [138, 36] as [number, number],
    paintingIds: ['hokusai', 'kusama'],
    emoji: '🌊',
    color: '#4CC9F0',
    glow: 'rgba(76,201,240,0.5)',
  },
  {
    id: 'sudafrica',
    label: 'Sud-àfrica',
    coords: [25, -30] as [number, number],
    paintingIds: ['ndebele'],
    emoji: '🏠',
    color: '#57CC99',
    glow: 'rgba(87,204,153,0.5)',
  },
]

// Countries to highlight (ISO numeric)
const HIGHLIGHT: Record<number, { fill: string; hover: string }> = {
  250: { fill: '#4a2060', hover: '#6a2d88' }, // França
  528: { fill: '#1e3d7a', hover: '#2a55aa' }, // Holanda
  276: { fill: '#1e3d7a', hover: '#2a55aa' }, // Alemanya
  40:  { fill: '#1e3d7a', hover: '#2a55aa' }, // Àustria
  392: { fill: '#0a4a6b', hover: '#0d6a9b' }, // Japó
  710: { fill: '#1a5c3a', hover: '#24844f' }, // Sud-àfrica
}

export default function WorldMap() {
  const [activePin, setActivePin] = useState<string | null>(null)
  const router = useRouter()
  const paintingMap = Object.fromEntries(paintings.map(p => [p.id, p]))

  const handlePin = (pin: typeof PINS[0]) => {
    if (pin.paintingIds.length === 1) {
      router.push(`/pintar/${pin.paintingIds[0]}`)
    } else {
      setActivePin(prev => prev === pin.id ? null : pin.id)
    }
  }

  const activeData = activePin ? PINS.find(p => p.id === activePin) : null

  return (
    <div className="relative w-full h-full" style={{ minHeight: 0 }}>
      {/* Mapa ─ absolute per omplir tot l'espai disponible */}
      <div className="absolute inset-0">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 125, center: [20, 10] }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Ocean gradient via rect */}
          <rect width="800" height="600" fill="url(#oceanGrad)" />

          <defs>
            <radialGradient id="oceanGrad" cx="50%" cy="50%" r="80%">
              <stop offset="0%" stopColor="#0d3b5e" />
              <stop offset="100%" stopColor="#071a2e" />
            </radialGradient>
          </defs>

          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const h = HIGHLIGHT[Number(geo.id)]
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={h?.fill ?? '#1e4d2b'}
                    stroke="#0d2518"
                    strokeWidth={0.4}
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

          {PINS.map(pin => {
            const isActive = activePin === pin.id
            return (
              <Marker
                key={pin.id}
                coordinates={pin.coords}
                onClick={() => handlePin(pin)}
                style={{ cursor: 'pointer' }}
              >
                {/* Zona de click invisible gran */}
                <circle r={36} fill="transparent" style={{ cursor: 'pointer' }} />
                {/* Pulsing glow rings */}
                <circle r={28} fill={pin.glow} opacity={0.25} style={{ pointerEvents: 'none' }} />
                <circle r={20} fill={pin.glow} opacity={0.35} style={{ pointerEvents: 'none' }} />

                {/* Pin body */}
                <circle r={14}
                  fill={isActive ? '#ffffff' : pin.color}
                  stroke="white"
                  strokeWidth={2.5}
                  style={{ filter: `drop-shadow(0 2px 8px ${pin.glow})` }}
                />

                {/* Emoji */}
                <text
                  textAnchor="middle"
                  y={5}
                  fontSize={12}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {pin.emoji}
                </text>

                {/* Label amb fons */}
                <rect
                  x={-28} y={18}
                  width={56} height={16}
                  rx={8}
                  fill="rgba(0,0,0,0.55)"
                />
                <text
                  textAnchor="middle"
                  y={30}
                  fontSize={9}
                  fill="white"
                  style={{
                    fontFamily: 'Nunito,sans-serif',
                    fontWeight: 800,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {pin.label}
                </text>

                {/* Badge recompte */}
                {pin.paintingIds.length > 1 && (
                  <>
                    <circle cx={12} cy={-12} r={9}
                      fill="#F6C90E"
                      stroke="white"
                      strokeWidth={2}
                    />
                    <text x={12} y={-8} textAnchor="middle" fontSize={9} fill="#1A1A1A"
                      style={{ fontWeight: 800, pointerEvents: 'none', userSelect: 'none' }}>
                      {pin.paintingIds.length}
                    </text>
                  </>
                )}
              </Marker>
            )
          })}
        </ComposableMap>
      </div>

      {/* Popup quadres */}
      {activeData && (
        <div
          className="absolute inset-x-3 bottom-3 rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(8,14,26,0.96)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header popup */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div>
              <p className="text-white font-bold text-sm" style={{ fontFamily: "'Fredoka One',cursive" }}>
                {activeData.emoji} {activeData.label}
              </p>
              <p className="text-white/40 text-xs" style={{ fontFamily: 'Nunito,sans-serif' }}>
                Tria un quadre per pintar
              </p>
            </div>
            <button
              onClick={() => setActivePin(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', fontSize: 16 }}>
              ×
            </button>
          </div>

          {/* Quadres grid */}
          <div className="flex gap-2.5 px-3 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {activeData.paintingIds.map(id => {
              const p = paintingMap[id]
              if (!p) return null
              return (
                <Link key={id} href={`/pintar/${id}`}
                  className="shrink-0 rounded-2xl overflow-hidden active:scale-95 transition-transform"
                  style={{
                    width: 120,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                  <div className="h-20 overflow-hidden">
                    {p.thumbUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.thumbUrl} alt={p.title} className="w-full h-full object-cover" />
                      : (
                        <div className="w-full h-full flex items-center justify-center text-4xl"
                          style={{ background: 'linear-gradient(135deg,#1a1a3a,#2d1a4a)' }}>
                          {p.emoji}
                        </div>
                      )
                    }
                  </div>
                  <div className="px-2 py-2">
                    <p className="text-white text-xs font-bold leading-tight truncate"
                      style={{ fontFamily: "'Fredoka One',cursive" }}>{p.title}</p>
                    <p className="text-white/45 text-xs truncate mt-0.5"
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
