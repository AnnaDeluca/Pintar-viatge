'use client'

interface Props {
  fills: Record<string, string>
  onRegionClick: (id: string) => void
}

// 5 simplified dancing figures
const dancers = [
  { id: 'd1', bx: 55,  by: 150, rx: 22, ry: 52, hx: 48,  hy: 90,  rotate: -20 },
  { id: 'd2', bx: 120, by: 140, rx: 22, ry: 52, hx: 118, hy: 80,  rotate: -5  },
  { id: 'd3', bx: 185, by: 135, rx: 22, ry: 52, hx: 186, hy: 74,  rotate: 0   },
  { id: 'd4', bx: 250, by: 142, rx: 22, ry: 52, hx: 252, hy: 81,  rotate: 8   },
  { id: 'd5', bx: 315, by: 152, rx: 22, ry: 52, hx: 322, hy: 92,  rotate: 20  },
]

export default function Matisse({ fills, onRegionClick }: Props) {
  const f = (id: string) => fills[id] ?? '#FFFFFF'
  const click = (id: string) => () => onRegionClick(id)
  const cs = { cursor: 'pointer' as const }

  return (
    <svg viewBox="0 0 370 280" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Sky */}
      <rect x={0} y={0} width={370} height={165} fill={f('sky')} onClick={click('sky')} style={cs}/>
      {/* Ground */}
      <rect x={0} y={165} width={370} height={115} fill={f('ground')} onClick={click('ground')} style={cs}/>

      {/* Dancers — body ellipses */}
      {dancers.map(d => (
        <g key={d.id} transform={`rotate(${d.rotate}, ${d.bx}, ${d.by})`}>
          <ellipse
            cx={d.bx} cy={d.by}
            rx={d.rx} ry={d.ry}
            fill={f(d.id)} onClick={click(d.id)} style={cs}
          />
          <circle
            cx={d.hx} cy={d.hy}
            r={16}
            fill={f(d.id)} onClick={click(d.id)} style={cs}
          />
        </g>
      ))}

      {/* Outlines */}
      <g style={{ pointerEvents: 'none' }} strokeWidth={3} stroke="#1A1A1A" fill="none">
        <rect x={0} y={0} width={370} height={280}/>
        <line x1={0} y1={165} x2={370} y2={165}/>
        {dancers.map(d => (
          <g key={d.id} transform={`rotate(${d.rotate}, ${d.bx}, ${d.by})`}>
            <ellipse cx={d.bx} cy={d.by} rx={d.rx} ry={d.ry}/>
            <circle cx={d.hx} cy={d.hy} r={16}/>
          </g>
        ))}
        {/* Arms connecting dancers */}
        <path d="M 77 110 Q 98 95 118 98"/>
        <path d="M 142 90 Q 163 80 183 82"/>
        <path d="M 207 82 Q 228 80 248 87"/>
        <path d="M 272 92 Q 293 100 313 110"/>
      </g>
    </svg>
  )
}
