'use client'

interface Props {
  fills: Record<string, string>
  onRegionClick: (id: string) => void
}

export default function Hokusai({ fills, onRegionClick }: Props) {
  const f = (id: string) => fills[id] ?? '#FFFFFF'
  const click = (id: string) => () => onRegionClick(id)
  const cs = { cursor: 'pointer' as const }

  return (
    <svg viewBox="0 0 400 280" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Sky */}
      <rect x={0} y={0} width={400} height={280} fill={f('sky')} onClick={click('sky')} style={cs}/>

      {/* Sea base */}
      <path
        d="M 0 200 Q 80 175 160 200 Q 240 225 320 200 Q 360 187 400 200 L 400 280 L 0 280 Z"
        fill={f('sea')} onClick={click('sea')} style={cs}
      />

      {/* Main wave */}
      <path
        d="M 0 140 Q 60 60 130 100 Q 180 130 230 80 Q 270 40 310 90 Q 350 130 400 110 L 400 200 Q 360 187 320 200 Q 240 225 160 200 Q 80 175 0 200 Z"
        fill={f('wave')} onClick={click('wave')} style={cs}
      />

      {/* Wave foam / crest (white tips) */}
      <path
        d="M 90 85 Q 130 55 170 80 Q 200 100 230 75 Q 255 55 280 80"
        fill="none"
        stroke={f('foam')}
        strokeWidth={10}
        strokeLinecap="round"
        onClick={click('foam')}
        style={cs}
      />
      <path
        d="M 60 105 Q 90 82 130 100"
        fill="none"
        stroke={f('foam')}
        strokeWidth={8}
        strokeLinecap="round"
        onClick={click('foam')}
        style={cs}
      />

      {/* Mount Fuji body */}
      <polygon
        points="265,30 325,145 205,145"
        fill={f('fuji')} onClick={click('fuji')} style={cs}
      />

      {/* Mount Fuji snow cap */}
      <polygon
        points="265,30 287,75 243,75"
        fill={f('snow')} onClick={click('snow')} style={cs}
      />

      {/* Outline overlay */}
      <g style={{ pointerEvents: 'none' }} stroke="#1A1A1A" fill="none" strokeWidth={2.5}>
        <rect x={0} y={0} width={400} height={280}/>
        <path d="M 0 200 Q 80 175 160 200 Q 240 225 320 200 Q 360 187 400 200"/>
        <path d="M 0 140 Q 60 60 130 100 Q 180 130 230 80 Q 270 40 310 90 Q 350 130 400 110 L 400 200 Q 360 187 320 200 Q 240 225 160 200 Q 80 175 0 200 Z"/>
        <path d="M 90 85 Q 130 55 170 80 Q 200 100 230 75 Q 255 55 280 80" strokeWidth={3} strokeLinecap="round"/>
        <path d="M 60 105 Q 90 82 130 100" strokeWidth={3} strokeLinecap="round"/>
        <polygon points="265,30 325,145 205,145"/>
        <polygon points="265,30 287,75 243,75"/>
        {/* Wave interior details */}
        <path d="M 30 160 Q 70 145 110 155" strokeWidth={1.5}/>
        <path d="M 130 165 Q 175 150 215 162" strokeWidth={1.5}/>
        <path d="M 230 155 Q 270 142 310 152" strokeWidth={1.5}/>
      </g>
    </svg>
  )
}
