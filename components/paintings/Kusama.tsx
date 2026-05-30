'use client'

export interface Dot { x: number; y: number; color: string }

interface Props {
  fills: Record<string, string>
  onRegionClick: (id: string) => void
  dots?: Dot[]
  onSvgClick?: (x: number, y: number) => void
}

export default function Kusama({ dots = [], onSvgClick }: Props) {
  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    const x = (e.clientX - rect.left) * (vb.width / rect.width)
    const y = (e.clientY - rect.top) * (vb.height / rect.height)
    onSvgClick?.(x, y)
  }

  return (
    <svg viewBox="0 0 280 300" width="100%" height="100%"
      style={{ display: 'block', cursor: 'crosshair' }}
      onClick={handleClick}
    >
      {/* Background */}
      <rect x={0} y={0} width={280} height={300} fill="#F5F0E0"/>

      {/* Pumpkin body — yellow pre-filled */}
      <ellipse cx={140} cy={162} rx={115} ry={105} fill="#F6C90E"/>

      {/* Pumpkin ribs */}
      {[-80,-48,-16,16,48,80].map((ox, i) => (
        <ellipse key={i} cx={140 + ox} cy={162} rx={22} ry={105}
          fill="none" stroke="#1A1A1A" strokeWidth={2.5} opacity={0.2}/>
      ))}

      {/* Pumpkin stem */}
      <path d="M 132 57 C 128 42 135 30 148 28 C 158 26 165 32 162 42 L 158 57"
        fill="#57CC99" stroke="#1A1A1A" strokeWidth={3}/>

      {/* User-placed dots */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={11} fill={d.color}/>
      ))}

      {/* Outline overlay */}
      <g style={{ pointerEvents: 'none' }} fill="none" stroke="#1A1A1A">
        <ellipse cx={140} cy={162} rx={115} ry={105} strokeWidth={4}/>
        <rect x={0} y={0} width={280} height={300} strokeWidth={3}/>
      </g>

      {/* Instruction hint if no dots yet */}
      {dots.length === 0 && (
        <text x={140} y={280} textAnchor="middle" fontSize={13}
          fill="#888" fontFamily="Nunito, sans-serif" style={{ pointerEvents:'none' }}>
          ¡Toca para añadir puntos!
        </text>
      )}
    </svg>
  )
}
