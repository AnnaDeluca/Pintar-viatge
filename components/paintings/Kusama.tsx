'use client'
import { useRef, useState } from 'react'

export interface Dot { x: number; y: number; color: string; r?: number }

interface Props {
  fills: Record<string, string>
  onRegionClick: (id: string) => void
  dots?: Dot[]
  onSvgClick?: (x: number, y: number) => void
}

const MIN_DIST = 22

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
    // Només acceptar punts dins de la silueta de la carbassa
    if (!isInsidePumpkin(x, y)) return
    lastPos.current = { x, y }
    onSvgClick?.(x, y)
  }

  return (
    <svg viewBox="0 0 320 320" width="100%" height="100%"
      style={{ display: 'block', cursor: 'crosshair', touchAction: 'none', background: '#FBF5E9' }}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setPainting(true); lastPos.current = null; tryAdd(e) }}
      onPointerMove={e => { if (painting) tryAdd(e) }}
      onPointerUp={() => { setPainting(false); lastPos.current = null }}
      onPointerCancel={() => { setPainting(false); lastPos.current = null }}
    >
      <defs>
        {/* Groc Kusama: ric, lleugerament daurat */}
        <radialGradient id="pumpkin-grad" cx="42%" cy="38%" r="68%">
          <stop offset="0%" stopColor="#FFE85A" />
          <stop offset="55%" stopColor="#F4C430" />
          <stop offset="100%" stopColor="#C99419" />
        </radialGradient>
        {/* Ombra interna del punt — sensació tridimensional */}
        <radialGradient id="dot-shade" cx="35%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        {/* Brillantor de la tija */}
        <linearGradient id="stem-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6B5224" />
          <stop offset="100%" stopColor="#3A2C12" />
        </linearGradient>
      </defs>

      {/* ── Carbassa de Kusama: silueta inspirada en les seves obres "Pumpkin" ── */}
      {/* La forma té 5 "lobes" verticals visibles. Wider than tall. */}

      {/* Tija */}
      <g>
        <path
          d="M 148 62 C 142 50, 154 38, 168 40 C 182 42, 184 56, 174 64 L 170 76"
          fill="url(#stem-grad)"
          stroke="#1A1A1A" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
        />
      </g>

      {/* Cos principal de la carbassa */}
      <path
        d="
          M 160 74
          C 100 74, 50 110, 50 175
          C 50 245, 100 285, 160 285
          C 220 285, 270 245, 270 175
          C 270 110, 220 74, 160 74
          Z
        "
        fill="url(#pumpkin-grad)"
        stroke="#1A1A1A" strokeWidth={3.5} strokeLinejoin="round"
      />

      {/* Segments verticals — donen l'aspecte de carbassa de veritat */}
      <g fill="none" stroke="#1A1A1A" strokeWidth={2.2} strokeLinecap="round" opacity={0.85}>
        {/* Segment 1 — esquerra exterior */}
        <path d="M 95 90 C 80 130, 80 220, 95 270" />
        {/* Segment 2 — esquerra interior */}
        <path d="M 128 78 C 118 125, 118 230, 128 282" />
        {/* Segment 3 — centre */}
        <path d="M 160 74 C 160 130, 160 230, 160 285" />
        {/* Segment 4 — dreta interior */}
        <path d="M 192 78 C 202 125, 202 230, 192 282" />
        {/* Segment 5 — dreta exterior */}
        <path d="M 225 90 C 240 130, 240 220, 225 270" />
      </g>

      {/* Suau ombra a la base, per donar pes */}
      <ellipse cx={160} cy={296} rx={92} ry={8} fill="#1A1A1A" opacity={0.10} />

      {/* Punts de l'usuari — Kusama style: negre amb gloss */}
      {dots.map((d, i) => {
        const r = d.r ?? 14
        return (
          <g key={i}>
            {/* Cos del punt */}
            <circle cx={d.x} cy={d.y} r={r} fill={d.color === '#1A1A1A' || d.color === '#000000' || !d.color ? 'url(#dot-shade)' : d.color} />
            {/* Reflex brillant (gloss) */}
            <ellipse cx={d.x - r * 0.32} cy={d.y - r * 0.36} rx={r * 0.36} ry={r * 0.26}
              fill="#fff" opacity={0.32} />
          </g>
        )
      })}

      {/* Pista (només si no s'ha pintat res) */}
      {dots.length === 0 && (
        <g style={{ pointerEvents: 'none' }}>
          <rect x={70} y={304} width={180} height={14} rx={7} fill="rgba(35,50,62,0.08)" />
          <text x={160} y={314} textAnchor="middle" fontSize={11}
            fill="rgba(35,50,62,0.6)" fontFamily="Nunito, sans-serif"
            fontWeight={700}>
            Arrossega per pintar punts!
          </text>
        </g>
      )}
    </svg>
  )
}

// Aproximació elíptica de la silueta — evita afegir punts fora de la carbassa
function isInsidePumpkin(x: number, y: number): boolean {
  const cx = 160, cy = 175
  const rx = 110, ry = 105
  const nx = (x - cx) / rx
  const ny = (y - cy) / ry
  return nx * nx + ny * ny <= 1
}
