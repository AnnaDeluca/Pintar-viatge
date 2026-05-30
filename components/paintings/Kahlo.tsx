'use client'
interface Props { fills: Record<string, string>; onRegionClick: (id: string) => void }

const PETAL_N = 6
function FlowerPetals({ cx, cy, r, id, fill, onClick }: {
  cx:number; cy:number; r:number; id:string; fill:string; onClick:()=>void
}) {
  const cs = { cursor: 'pointer' as const }
  return <g>{Array.from({length:PETAL_N}, (_,i) => {
    const a = (i * 360/PETAL_N) * Math.PI/180
    return <ellipse key={i} cx={0} cy={0} rx={r*0.42} ry={r*0.72}
      transform={`translate(${cx},${cy}) rotate(${i*60}) translate(0,${-r*0.58})`}
      fill={fill} onClick={onClick} style={cs}/>
  })}</g>
}
function FlowerOutline({ cx, cy, r }: {cx:number;cy:number;r:number}) {
  return <g>{Array.from({length:PETAL_N}, (_,i) => (
    <ellipse key={i} cx={0} cy={0} rx={r*0.42} ry={r*0.72}
      transform={`translate(${cx},${cy}) rotate(${i*60}) translate(0,${-r*0.58})`}
      fill="none" stroke="#1A1A1A" strokeWidth={1.5}/>
  ))}</g>
}

export default function Kahlo({ fills, onRegionClick }: Props) {
  const f = (id: string) => fills[id] ?? '#FFFFFF'
  const c = (id: string) => () => onRegionClick(id)
  const cs = { cursor: 'pointer' as const }

  return (
    <svg viewBox="0 0 280 360" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Background foliage */}
      <rect x={0} y={0} width={280} height={360} fill={f('bg')} onClick={c('bg')} style={cs}/>

      {/* Dress / body */}
      <path d="M 40 360 L 40 255 C 70 235 105 225 140 224 C 175 225 210 235 240 255 L 240 360 Z"
        fill={f('dress')} onClick={c('dress')} style={cs}/>
      {/* Blouse */}
      <path d="M 78 230 C 100 215 140 210 162 215 C 175 218 185 225 190 230 C 175 238 155 242 140 242 C 125 242 105 238 78 230 Z"
        fill={f('dress')} onClick={c('dress')} style={cs}/>

      {/* Hair — top and sides */}
      <path d="M 80 192 C 78 165 82 138 92 120 C 105 95 120 82 140 80 C 160 78 178 90 190 110 C 200 128 202 155 200 180 C 200 192 198 200 196 205 C 180 172 165 158 140 155 C 115 153 100 167 84 200 Z"
        fill={f('hair')} onClick={c('hair')} style={cs}/>
      {/* Braid / top of hair */}
      <path d="M 102 82 C 120 68 160 68 178 82 C 165 72 140 70 115 75 Z"
        fill={f('hair')} onClick={c('hair')} style={cs}/>

      {/* Flowers in hair */}
      <FlowerPetals cx={100} cy={98} r={22} id="flower1" fill={f('flower1')} onClick={c('flower1')}/>
      <circle cx={100} cy={98} r={8} fill={f('flower1')} onClick={c('flower1')} style={cs}/>

      <FlowerPetals cx={140} cy={82} r={26} id="flower2" fill={f('flower2')} onClick={c('flower2')}/>
      <circle cx={140} cy={82} r={10} fill={f('flower2')} onClick={c('flower2')} style={cs}/>

      <FlowerPetals cx={180} cy={98} r={22} id="flower3" fill={f('flower3')} onClick={c('flower3')}/>
      <circle cx={180} cy={98} r={8} fill={f('flower3')} onClick={c('flower3')} style={cs}/>

      {/* Face */}
      <ellipse cx={140} cy={178} rx={58} ry={66} fill={f('face')} onClick={c('face')} style={cs}/>

      {/* Unibrow */}
      <path d="M 102 158 C 115 152 128 150 140 150 C 152 150 165 152 178 158"
        stroke={f('necklace')} strokeWidth={7} strokeLinecap="round" fill="none"
        onClick={c('necklace')} style={cs}/>

      {/* Necklace / collar */}
      <path d="M 100 226 C 115 232 130 235 140 235 C 150 235 165 232 180 226"
        stroke={f('necklace')} strokeWidth={10} strokeLinecap="round" fill="none"
        onClick={c('necklace')} style={cs}/>

      {/* Outline overlay */}
      <g style={{ pointerEvents:'none' }} stroke="#1A1A1A" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <rect x={0} y={0} width={280} height={360} strokeWidth={3}/>
        <path d="M 40 360 L 40 255 C 70 235 105 225 140 224 C 175 225 210 235 240 255 L 240 360 Z" strokeWidth={3}/>
        <path d="M 80 192 C 78 165 82 138 92 120 C 105 95 120 82 140 80 C 160 78 178 90 190 110 C 200 128 202 155 200 180 C 200 192 198 200 196 205 C 180 172 165 158 140 155 C 115 153 100 167 84 200 Z" strokeWidth={2.5}/>
        <ellipse cx={140} cy={178} rx={58} ry={66} strokeWidth={3}/>
        {/* Eyes */}
        <ellipse cx={120} cy={175} rx={10} ry={7} strokeWidth={2} fill="#1A1A1A"/>
        <ellipse cx={160} cy={175} rx={10} ry={7} strokeWidth={2} fill="#1A1A1A"/>
        {/* Unibrow line */}
        <path d="M 102 158 C 115 152 128 150 140 150 C 152 150 165 152 178 158" strokeWidth={5}/>
        {/* Necklace */}
        <path d="M 100 226 C 115 232 130 235 140 235 C 150 235 165 232 180 226" strokeWidth={4}/>
        {/* Flowers */}
        <FlowerOutline cx={100} cy={98} r={22}/>
        <circle cx={100} cy={98} r={8} strokeWidth={2}/>
        <FlowerOutline cx={140} cy={82} r={26}/>
        <circle cx={140} cy={82} r={10} strokeWidth={2}/>
        <FlowerOutline cx={180} cy={98} r={22}/>
        <circle cx={180} cy={98} r={8} strokeWidth={2}/>
        {/* Nose hint */}
        <path d="M 136 185 C 133 196 138 202 144 202" strokeWidth={2}/>
        {/* Lips */}
        <path d="M 122 212 C 130 218 150 218 158 212" strokeWidth={2.5}/>
      </g>
    </svg>
  )
}
