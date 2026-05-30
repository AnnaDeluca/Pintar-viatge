'use client'
interface Props { fills: Record<string, string>; onRegionClick: (id: string) => void }
export default function Tarsila({ fills, onRegionClick }: Props) {
  const f = (id: string) => fills[id] ?? '#FFFFFF'
  const c = (id: string) => () => onRegionClick(id)
  const cs = { cursor: 'pointer' as const }
  return (
    <svg viewBox="0 0 300 380" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Sky */}
      <rect x={0} y={0} width={300} height={380} fill={f('sky')} onClick={c('sky')} style={cs}/>

      {/* Ground — green oval */}
      <ellipse cx={145} cy={345} rx={135} ry={42} fill={f('ground')} onClick={c('ground')} style={cs}/>

      {/* Sun — top right */}
      <circle cx={252} cy={62} r={42} fill={f('sun')} onClick={c('sun')} style={cs}/>

      {/* Cactus — right side, 3-pronged */}
      <path d="M 222 340 L 222 230 Q 222 218 234 218 L 260 218 Q 272 218 272 206 L 272 185"
        stroke={f('cactus')} strokeWidth={18} strokeLinecap="round" fill="none" onClick={c('cactus')} style={cs}/>
      <path d="M 222 270 Q 222 258 210 258 L 196 258 Q 184 258 184 246 L 184 230"
        stroke={f('cactus')} strokeWidth={18} strokeLinecap="round" fill="none" onClick={c('cactus')} style={cs}/>

      {/* Enormous foot */}
      <path d="M 52 350 C 48 320 55 298 68 288 C 82 278 100 275 118 278 C 148 278 168 285 175 298 C 182 312 178 338 172 352 C 148 360 80 360 52 350 Z"
        fill={f('foot')} onClick={c('foot')} style={cs}/>

      {/* Leg — thin, going up from foot to body */}
      <path d="M 96 278 C 94 250 96 220 98 190 L 114 190 C 116 220 118 250 118 278 Z"
        fill={f('leg')} onClick={c('leg')} style={cs}/>

      {/* Body — small round torso */}
      <ellipse cx={107} cy={178} rx={26} ry={20} fill={f('body')} onClick={c('body')} style={cs}/>

      {/* Arm — thin, reaching left */}
      <path d="M 82 175 C 68 170 52 165 38 162" stroke={f('body')}
        strokeWidth={10} strokeLinecap="round" fill="none" onClick={c('body')} style={cs}/>

      {/* Head — tiny circle */}
      <circle cx={107} cy={148} r={20} fill={f('head')} onClick={c('head')} style={cs}/>

      {/* Outline overlay */}
      <g style={{ pointerEvents: 'none' }} stroke="#1A1A1A" strokeLinejoin="round" strokeLinecap="round" fill="none">
        <rect x={0} y={0} width={300} height={380} strokeWidth={3}/>
        <ellipse cx={145} cy={345} rx={135} ry={42} strokeWidth={3}/>
        <circle cx={252} cy={62} r={42} strokeWidth={3}/>
        <path d="M 222 340 L 222 230 Q 222 218 234 218 L 260 218 Q 272 218 272 206 L 272 185" strokeWidth={5}/>
        <path d="M 222 270 Q 222 258 210 258 L 196 258 Q 184 258 184 246 L 184 230" strokeWidth={5}/>
        <path d="M 52 350 C 48 320 55 298 68 288 C 82 278 100 275 118 278 C 148 278 168 285 175 298 C 182 312 178 338 172 352 C 148 360 80 360 52 350 Z" strokeWidth={4}/>
        <path d="M 96 278 C 94 250 96 220 98 190 L 114 190 C 116 220 118 250 118 278 Z" strokeWidth={3}/>
        <ellipse cx={107} cy={178} rx={26} ry={20} strokeWidth={3}/>
        <path d="M 82 175 C 68 170 52 165 38 162" strokeWidth={5}/>
        <circle cx={107} cy={148} r={20} strokeWidth={3}/>
        {/* Sun rays */}
        {[0,45,90,135,180,225,270,315].map(a => (
          <line key={a}
            x1={252 + 48*Math.cos(a*Math.PI/180)} y1={62 + 48*Math.sin(a*Math.PI/180)}
            x2={252 + 58*Math.cos(a*Math.PI/180)} y2={62 + 58*Math.sin(a*Math.PI/180)}
            strokeWidth={2.5}/>
        ))}
      </g>
    </svg>
  )
}
