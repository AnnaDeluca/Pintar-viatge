'use client'

interface Props {
  fills: Record<string, string>
  onRegionClick: (id: string) => void
}

const W = 300, H = 300
const V1 = 110, V2 = 240   // vertical dividers
const H1 = 130, H2 = 220   // horizontal dividers
const SW = 7               // stroke width

export default function Mondrian({ fills, onRegionClick }: Props) {
  const f = (id: string) => fills[id] ?? '#FFFFFF'
  const click = (id: string) => () => onRegionClick(id)
  const style = { cursor: 'pointer' as const }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: 'block' }}>
      {/* Fill regions */}
      <rect x={0}  y={0}  width={V1}    height={H1}    fill={f('tl')} onClick={click('tl')} style={style}/>
      <rect x={V1} y={0}  width={V2-V1} height={H1}    fill={f('tm')} onClick={click('tm')} style={style}/>
      <rect x={V2} y={0}  width={W-V2}  height={H1}    fill={f('tr')} onClick={click('tr')} style={style}/>
      <rect x={0}  y={H1} width={V1}    height={H2-H1} fill={f('ml')} onClick={click('ml')} style={style}/>
      <rect x={V1} y={H1} width={V2-V1} height={H2-H1} fill={f('mm')} onClick={click('mm')} style={style}/>
      <rect x={V2} y={H1} width={W-V2}  height={H2-H1} fill={f('mr')} onClick={click('mr')} style={style}/>
      <rect x={0}  y={H2} width={V1}    height={H-H2}  fill={f('bl')} onClick={click('bl')} style={style}/>
      <rect x={V1} y={H2} width={V2-V1} height={H-H2}  fill={f('bm')} onClick={click('bm')} style={style}/>
      <rect x={V2} y={H2} width={W-V2}  height={H-H2}  fill={f('br')} onClick={click('br')} style={style}/>

      {/* Black grid lines overlay (non-interactive) */}
      <g style={{ pointerEvents: 'none' }}>
        <rect x={0} y={0} width={W} height={H} fill="none" stroke="#1A1A1A" strokeWidth={SW}/>
        <line x1={V1} y1={0} x2={V1} y2={H} stroke="#1A1A1A" strokeWidth={SW}/>
        <line x1={V2} y1={0} x2={V2} y2={H} stroke="#1A1A1A" strokeWidth={SW}/>
        <line x1={0} y1={H1} x2={W} y2={H1} stroke="#1A1A1A" strokeWidth={SW}/>
        <line x1={0} y1={H2} x2={W} y2={H2} stroke="#1A1A1A" strokeWidth={SW}/>
      </g>
    </svg>
  )
}
