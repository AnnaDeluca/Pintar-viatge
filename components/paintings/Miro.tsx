'use client'

interface Props {
  fills: Record<string, string>
  onRegionClick: (id: string) => void
}

export default function Miro({ fills, onRegionClick }: Props) {
  const f = (id: string) => fills[id] ?? '#FFFFFF'
  const click = (id: string) => () => onRegionClick(id)
  const cs = { cursor: 'pointer' as const }
  const sw = 3

  return (
    <svg viewBox="0 0 300 340" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Sky background */}
      <rect x={0} y={0} width={300} height={340} fill={f('sky')} onClick={click('sky')} style={cs}/>

      {/* Body — big organic blob */}
      <ellipse cx={150} cy={210} rx={70} ry={90} fill={f('body')} onClick={click('body')} style={cs}/>

      {/* Head — round shape */}
      <circle cx={150} cy={105} r={48} fill={f('head')} onClick={click('head')} style={cs}/>

      {/* Eye */}
      <circle cx={163} cy={98} r={14} fill={f('eye')} onClick={click('eye')} style={cs}/>

      {/* Star shape (top-right) */}
      <polygon
        points="230,45 237,68 262,68 242,83 249,106 230,91 211,106 218,83 198,68 223,68"
        fill={f('star')} onClick={click('star')} style={cs}
      />

      {/* Decorative dots */}
      <circle cx={68} cy={160} r={18} fill={f('dot1')} onClick={click('dot1')} style={cs}/>
      <circle cx={55} cy={255} r={14} fill={f('dot2')} onClick={click('dot2')} style={cs}/>

      {/* Outlines overlay */}
      <g style={{ pointerEvents: 'none' }} strokeWidth={sw} stroke="#1A1A1A" fill="none">
        <rect x={0} y={0} width={300} height={340}/>
        <ellipse cx={150} cy={210} rx={70} ry={90}/>
        <circle cx={150} cy={105} r={48}/>
        <circle cx={163} cy={98} r={14}/>
        <polygon points="230,45 237,68 262,68 242,83 249,106 230,91 211,106 218,83 198,68 223,68"/>
        <circle cx={68} cy={160} r={18}/>
        <circle cx={55} cy={255} r={14}/>

        {/* Arm-like squiggly line */}
        <path d="M 80 210 Q 40 185 35 145" strokeWidth={sw+1}/>
        {/* Leg lines */}
        <path d="M 120 295 Q 110 325 95 335"/>
        <path d="M 180 295 Q 190 325 205 335"/>
      </g>
    </svg>
  )
}
