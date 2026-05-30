'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { paintings } from '@/data/paintings'

const GRADIENT: Record<string, string> = {
  lascaux:   'linear-gradient(135deg,#8B4513,#D2691E)',
  hokusai:   'linear-gradient(135deg,#0A3060,#4CC9F0)',
  kusama:    'linear-gradient(135deg,#1A1A1A,#F6C90E)',
  kahlo:     'linear-gradient(135deg,#6B0F1A,#F4A261)',
  tarsila:   'linear-gradient(135deg,#1A6B5A,#4CC9F0)',
  vangogh:   'linear-gradient(135deg,#8B6914,#F6C90E)',
  matisse:   'linear-gradient(135deg,#C41E3A,#2E8B57)',
  mondrian:  'linear-gradient(135deg,#E63946,#2364AA)',
  klimt:     'linear-gradient(135deg,#8B6914,#FFD700)',
  kandinsky: 'linear-gradient(135deg,#8B5CF6,#4CC9F0)',
  ndebele:   'linear-gradient(135deg,#E63946,#F6C90E)',
}

const PINS = [
  { id: 'europa',    label: 'Europa',     x: 468, y: 145, paintingIds: ['lascaux','vangogh','matisse','mondrian','kandinsky','klimt'], emoji: '🎨' },
  { id: 'japo',      label: 'Japó',       x: 858, y: 158, paintingIds: ['hokusai','kusama'], emoji: '🌊' },
  { id: 'mexic',     label: 'Mèxic',      x: 138, y: 200, paintingIds: ['kahlo'], emoji: '🌺' },
  { id: 'brasil',    label: 'Brasil',     x: 215, y: 308, paintingIds: ['tarsila'], emoji: '🌵' },
  { id: 'sudafrica', label: 'Sud-àfrica', x: 468, y: 355, paintingIds: ['ndebele'], emoji: '🏠' },
]

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
    <div className="relative w-full flex-1" style={{ minHeight: 0 }}
      onClick={e => { if (e.target === e.currentTarget) setActivePin(null) }}>
      <svg viewBox="0 0 1000 520" className="w-full h-full" style={{ display: 'block' }}>
        {/* Ocean */}
        <rect width={1000} height={520} fill="#0d2137"/>
        {/* Ocean grid */}
        {[125,250,375,500,625,750,875].map(x => (
          <line key={x} x1={x} y1={0} x2={x} y2={520} stroke="#162d45" strokeWidth={1}/>
        ))}
        {[130,260,390].map(y => (
          <line key={y} x1={0} y1={y} x2={1000} y2={y} stroke="#162d45" strokeWidth={1}/>
        ))}

        {/* North America */}
        <path d="M 95,58 C 140,42 200,50 248,78 C 278,98 285,135 275,172 C 265,208 242,238 215,255 C 188,270 158,268 132,252 C 106,236 88,208 80,175 C 72,142 72,105 85,78 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={2}/>
        <path d="M 268,22 C 295,15 330,18 348,35 C 362,48 358,68 340,78 C 322,88 298,85 278,72 C 260,60 255,42 268,22 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={1.5}/>

        {/* South America */}
        <path d="M 192,262 C 218,252 248,258 265,278 C 280,298 278,328 268,358 C 258,388 240,412 218,422 C 196,430 174,420 160,400 C 146,380 142,350 148,320 C 155,290 168,272 192,262 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={2}/>

        {/* Europe */}
        <path d="M 428,95 C 458,80 498,82 520,102 C 540,120 538,150 524,170 C 510,188 485,196 460,190 C 435,184 418,165 414,145 C 410,125 415,105 428,95 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={2}/>
        <path d="M 405,108 C 418,100 432,104 436,116 C 440,128 432,140 420,142 C 408,144 398,134 398,122 C 398,113 403,110 405,108 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={1}/>
        <path d="M 462,80 C 474,62 494,58 508,70 C 520,82 518,100 505,110 C 492,118 475,112 466,100 C 460,92 460,86 462,80 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={1}/>

        {/* Africa */}
        <path d="M 428,190 C 460,178 502,180 526,202 C 548,222 555,258 550,295 C 545,332 528,365 506,387 C 484,407 456,412 432,400 C 408,386 394,358 390,325 C 385,292 388,255 398,225 C 406,206 418,194 428,190 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={2}/>

        {/* Asia */}
        <path d="M 518,78 C 592,58 682,55 762,68 C 828,80 880,108 908,142 C 928,168 920,200 898,224 C 876,246 840,258 800,262 C 758,265 712,252 670,235 C 628,218 590,192 562,165 C 536,140 520,110 518,78 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={2}/>
        <path d="M 638,225 C 660,218 682,222 696,238 C 708,252 706,272 694,285 C 682,296 664,298 650,288 C 636,278 630,260 633,245 C 635,235 638,226 638,225 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={1.5}/>
        {/* Japan */}
        <path d="M 850,128 C 865,120 882,126 888,142 C 894,156 886,172 872,176 C 858,180 845,168 843,154 C 841,142 846,132 850,128 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={1.5}/>

        {/* Australia */}
        <path d="M 755,340 C 795,325 845,330 872,352 C 897,372 898,408 876,430 C 854,450 818,454 786,440 C 755,426 738,398 740,370 C 742,350 748,342 755,340 Z" fill="#2d6a4f" stroke="#1b4332" strokeWidth={2}/>

        {/* Antarctica */}
        <path d="M 0,490 C 250,475 600,472 1000,490 L 1000,520 L 0,520 Z" fill="#c8dce8" opacity={0.25}/>

        {/* Pins */}
        {PINS.map(pin => {
          const isActive = activePin === pin.id
          return (
            <g key={pin.id} onClick={() => handlePin(pin)} style={{ cursor: 'pointer' }}>
              {/* Glow ring */}
              <circle cx={pin.x} cy={pin.y} r={22} fill="rgba(245,87,108,0.18)"/>
              <circle cx={pin.x} cy={pin.y} r={16} fill="rgba(245,87,108,0.25)"/>
              {/* Pin */}
              <circle cx={pin.x} cy={pin.y} r={13}
                fill={isActive ? '#f093fb' : '#f5576c'}
                stroke="white" strokeWidth={2.5}/>
              {/* Emoji */}
              <text x={pin.x} y={pin.y + 5} textAnchor="middle" fontSize={11}
                style={{ pointerEvents: 'none' }}>
                {pin.emoji}
              </text>
              {/* Label */}
              <text x={pin.x} y={pin.y + 30} textAnchor="middle" fontSize={10} fill="white"
                style={{ fontFamily: 'Nunito,sans-serif', fontWeight: 800, pointerEvents: 'none',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {pin.label}
              </text>
              {/* Count badge */}
              {pin.paintingIds.length > 1 && (
                <>
                  <circle cx={pin.x + 10} cy={pin.y - 10} r={8} fill="#F6C90E" stroke="white" strokeWidth={1.5}/>
                  <text x={pin.x + 10} y={pin.y - 6} textAnchor="middle" fontSize={9} fill="#1A1A1A"
                    style={{ fontWeight: 800, pointerEvents: 'none' }}>
                    {pin.paintingIds.length}
                  </text>
                </>
              )}
            </g>
          )
        })}
      </svg>

      {/* Popup panel */}
      {activeData && (
        <div className="absolute inset-x-2 bottom-2 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(10,18,30,0.97)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-white/60 text-xs" style={{ fontFamily: 'Nunito' }}>
              {activeData.label} · Tria un quadre
            </p>
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
                  <div className="h-20 flex items-center justify-center text-4xl"
                    style={{ background: GRADIENT[id] }}>
                    {p.thumbUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.thumbUrl} alt={p.title} className="w-full h-full object-cover"/>
                      : p.emoji}
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
