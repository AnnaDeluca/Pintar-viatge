'use client'
import { useRef, useState } from 'react'

export interface Dot { x: number; y: number; color: string; r?: number }

interface Props {
  fills: Record<string, string>
  onRegionClick: (id: string) => void
  dots?: Dot[]
  onSvgClick?: (x: number, y: number) => void
}

const MIN_DIST = 18

export default function Kusama({ dots = [], onSvgClick }: Props) {
  const [painting, setPainting] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  function getCoords(e: React.PointerEvent<SVGSVGElement>) {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    return {
      x: (e.clientX - rect.left) * (vb.width / rect.width),
      y: (e.clientY - rect.top) * (vb.height / rect.height),
    }
  }

  function tryAdd(e: React.PointerEvent<SVGSVGElement>) {
    const { x, y } = getCoords(e)
    if (lastPos.current) {
      const d = Math.hypot(x - lastPos.current.x, y - lastPos.current.y)
      if (d < MIN_DIST) return
    }
    lastPos.current = { x, y }
    onSvgClick?.(x, y)
  }

  return (
    <svg viewBox="0 0 280 300" width="100%" height="100%"
      style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setPainting(true); lastPos.current = null; tryAdd(e) }}
      onPointerMove={e => { if (painting) tryAdd(e) }}
      onPointerUp={() => { setPainting(false); lastPos.current = null }}
      onPointerCancel={() => { setPainting(false); lastPos.current = null }}
    >
      <defs>
        <radialGradient id="pumpkin-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFE066"/>
          <stop offset="100%" stopColor="#E6A800"/>
        </radialGradient>
        <filter id="dot-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect x={0} y={0} width={280} height={300} fill="#F5F0E0"/>

      {/* Pumpkin body */}
      <ellipse cx={140} cy={168} rx={115} ry={108} fill="url(#pumpkin-grad)"/>

      {/* Pumpkin ribs */}
      {[-80,-48,-16,16,48,80].map((ox, i) => (
        <ellipse key={i} cx={140 + ox} cy={168} rx={22} ry={108}
          fill="none" stroke="#C47A00" strokeWidth={2} opacity={0.3}/>
      ))}

      {/* Pumpkin stem */}
      <path d="M 132 60 C 128 44 136 30 150 28 C 160 26 167 34 163 44 L 158 60"
        fill="#4a9e6e" stroke="#2d6b48" strokeWidth={2.5} strokeLinecap="round"/>
      {/* Leaf */}
      <path d="M 150 48 C 165 38 178 42 178 54 C 178 62 165 64 155 58"
        fill="#57CC99" stroke="#2d6b48" strokeWidth={1.5}/>

      {/* User dots */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r ?? 11} fill={d.color}
          filter="url(#dot-glow)"
          style={{ stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1 }}/>
      ))}

      {/* Outline */}
      <g style={{ pointerEvents: 'none' }} fill="none" stroke="#1A1A1A">
        <ellipse cx={140} cy={168} rx={115} ry={108} strokeWidth={3}/>
        <rect x={0} y={0} width={280} height={300} strokeWidth={3}/>
      </g>

      {/* Hint text */}
      {dots.length === 0 && (
        <text x={140} y={284} textAnchor="middle" fontSize={12}
          fill="#888" fontFamily="Nunito, sans-serif" style={{ pointerEvents:'none' }}>
          Arrossega per pintar punts!
        </text>
      )}
    </svg>
  )
}
