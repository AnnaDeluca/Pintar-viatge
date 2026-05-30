'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps'
import { paintings } from '@/data/paintings'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const PINS = [
  { id: 'europa',    label: 'Europa',     coords: [10, 50]   as [number,number], paintingIds: ['lascaux','vangogh','matisse','mondrian','kandinsky','klimt'], emoji: '🎨', color: '#f093fb' },
  { id: 'japo',      label: 'Japó',       coords: [138, 36]  as [number,number], paintingIds: ['hokusai','kusama'], emoji: '🌊', color: '#4CC9F0' },
  { id: 'franca',    label: 'França',     coords: [2.3, 48.9] as [number,number], paintingIds: ['kahlo'], emoji: '💃', color: '#f5576c' },
  { id: 'sudafrica', label: 'Sud-àfrica', coords: [25, -29]  as [number,number], paintingIds: ['ndebele'], emoji: '🏠', color: '#57CC99' },
]

const HIGHLIGHT: Record<number, string> = {
  250: '#3d1a4a',
  528: '#1a2d4a',
  276: '#1a2d4a',
  40:  '#1a2d4a',
  392: '#1a2d4a',
  710: '#1a3d2a',
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
    <div className="relative w-full flex-1 flex flex-col" style={{ minHeight: 0 }}>
      <div className="flex-1" style={{ minHeight: 0 }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130, center: [20, 10] }}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const h = HIGHLIGHT[Number(geo.id)]
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={h ?? '#1e3a2e'}
                    stroke="#0d2137"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: h ? '#5a2d6a' : '#2d5a42' },
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
              <Marker key={pin.id} coordinates={pin.coords} onClick={() => handlePin(pin)} style={{ cursor: 'pointer' }}>
                <circle r={18} fill={pin.color} opacity={0.2} />
                <circle r={12} fill={pin.color} opacity={0.3} />
                <circle r={9} fill={isActive ? '#fff' : pin.color} stroke="white" strokeWidth={2} />
                <text textAnchor="middle" y={4} fontSize={9} style={{ pointerEvents: 'none' }}>{pin.emoji}</text>
                <text textAnchor="middle" y={26} fontSize={9} fill="white"
                  style={{ fontFamily: 'Nunito,sans-serif', fontWeight: 800, pointerEvents: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}>
                  {pin.label}
                </text>
                {pin.paintingIds.length > 1 && (
                  <>
                    <circle cx={8} cy={-8} r={7} fill="#F6C90E" stroke="white" strokeWidth={1.5} />
                    <text x={8} y={-4} textAnchor="middle" fontSize={8} fill="#1A1A1A"
                      style={{ fontWeight: 800, pointerEvents: 'none' }}>{pin.paintingIds.length}</text>
                  </>
                )}
              </Marker>
            )
          })}
        </ComposableMap>
      </div>

      {activeData && (
        <div className="absolute inset-x-2 bottom-2 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(10,18,30,0.97)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-white/60 text-xs" style={{ fontFamily: 'Nunito' }}>{activeData.label} · Tria un quadre</p>
            <button onClick={() => setActivePin(null)} className="text-white/40 text-lg leading-none">×</button>
          </div>
          <div className="flex gap-2 px-3 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {activeData.paintingIds.map(id => {
              const p = paintingMap[id]
              if (!p) return null
              return (
                <Link key={id} href={`/pintar/${id}`}
                  className="shrink-0 rounded-xl overflow-hidden active:scale-95 transition-transform"
                  style={{ width: 130 }}>
                  <div className="h-20 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#1a1a3a,#2d1a4a)' }}>
                    {p.thumbUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.thumbUrl} alt={p.title} className="w-full h-full object-cover" />
                      : <span className="text-4xl">{p.emoji}</span>}
                  </div>
                  <div className="px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-white text-xs font-bold leading-tight truncate"
                      style={{ fontFamily: "'Fredoka One',cursive" }}>{p.title}</p>
                    <p className="text-white/50 text-xs truncate" style={{ fontFamily: 'Nunito' }}>{p.artist}</p>
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
