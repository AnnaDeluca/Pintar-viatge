'use client'

interface Props {
  fills: Record<string, string>
  onRegionClick: (id: string) => void
}

const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function Petals({ cx, cy, id, fill, onClick }: {
  cx: number; cy: number; id: string
  fill: string; onClick: () => void
}) {
  return (
    <g>
      {PETAL_ANGLES.map(a => (
        <ellipse
          key={a}
          cx={0} cy={0}
          rx={11} ry={22}
          transform={`translate(${cx},${cy}) rotate(${a}) translate(0,-36)`}
          fill={fill}
          onClick={onClick}
          style={{ cursor: 'pointer' }}
        />
      ))}
    </g>
  )
}

function PetalsOutline({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      {PETAL_ANGLES.map(a => (
        <ellipse
          key={a}
          cx={0} cy={0}
          rx={11} ry={22}
          transform={`translate(${cx},${cy}) rotate(${a}) translate(0,-36)`}
          fill="none"
          stroke="#1A1A1A"
          strokeWidth={2}
        />
      ))}
    </g>
  )
}

export default function VanGogh({ fills, onRegionClick }: Props) {
  const f = (id: string) => fills[id] ?? '#FFFFFF'
  const click = (id: string) => () => onRegionClick(id)
  const cs = { cursor: 'pointer' as const }

  // Flower centers
  const flowers = [
    { pid: 'f1p', cid: 'f1c', cx: 105, cy: 130 },
    { pid: 'f2p', cid: 'f2c', cx: 195, cy: 115 },
    { pid: 'f3p', cid: 'f3c', cx: 150, cy: 155 },
  ]

  return (
    <svg viewBox="0 0 300 400" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Background */}
      <rect x={0} y={0} width={300} height={290} fill={f('bg')} onClick={click('bg')} style={cs}/>
      {/* Table */}
      <rect x={0} y={290} width={300} height={110} fill={f('table')} onClick={click('table')} style={cs}/>

      {/* Vase */}
      <path
        d="M 115 290 L 118 255 L 125 228 L 135 210 L 138 196 L 162 196 L 165 210 L 175 228 L 182 255 L 185 290 Z"
        fill={f('vase')} onClick={click('vase')} style={cs}
      />

      {/* Stems (decorative, same click as bg or stems region) */}
      <g>
        <path d="M 145 198 Q 120 182 105 155" stroke={f('stems') === '#FFFFFF' ? '#ccc' : f('stems')}
          fill="none" strokeWidth={5} onClick={click('stems')} style={cs}/>
        <path d="M 155 198 Q 165 178 195 140" stroke={f('stems') === '#FFFFFF' ? '#ccc' : f('stems')}
          fill="none" strokeWidth={5} onClick={click('stems')} style={cs}/>
        <path d="M 150 198 Q 150 178 150 172" stroke={f('stems') === '#FFFFFF' ? '#ccc' : f('stems')}
          fill="none" strokeWidth={5} onClick={click('stems')} style={cs}/>
      </g>

      {/* Petals */}
      {flowers.map(fl => (
        <Petals key={fl.pid} cx={fl.cx} cy={fl.cy} id={fl.pid}
          fill={f(fl.pid)} onClick={click(fl.pid)}/>
      ))}

      {/* Flower centers */}
      {flowers.map(fl => (
        <circle key={fl.cid} cx={fl.cx} cy={fl.cy} r={16}
          fill={f(fl.cid)} onClick={click(fl.cid)} style={cs}/>
      ))}

      {/* Outlines overlay */}
      <g style={{ pointerEvents: 'none' }} stroke="#1A1A1A" fill="none">
        <rect x={0} y={0} width={300} height={400} strokeWidth={3}/>
        <line x1={0} y1={290} x2={300} y2={290} strokeWidth={3}/>
        <path d="M 115 290 L 118 255 L 125 228 L 135 210 L 138 196 L 162 196 L 165 210 L 175 228 L 182 255 L 185 290 Z" strokeWidth={3}/>
        <path d="M 145 198 Q 120 182 105 155" strokeWidth={3}/>
        <path d="M 155 198 Q 165 178 195 140" strokeWidth={3}/>
        <path d="M 150 198 Q 150 178 150 172" strokeWidth={3}/>
        {flowers.map(fl => <PetalsOutline key={fl.pid} cx={fl.cx} cy={fl.cy}/>)}
        {flowers.map(fl => (
          <circle key={fl.cid} cx={fl.cx} cy={fl.cy} r={16} strokeWidth={2.5}/>
        ))}
      </g>
    </svg>
  )
}
