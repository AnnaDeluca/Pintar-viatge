'use client'
interface Props { fills: Record<string, string>; onRegionClick: (id: string) => void }
export default function Ndebele({ fills, onRegionClick }: Props) {
  const f = (id: string) => fills[id] ?? '#FFFFFF'
  const c = (id: string) => () => onRegionClick(id)
  const cs = { cursor: 'pointer' as const }
  const sw = 4
  return (
    <svg viewBox="0 0 300 340" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Background wall */}
      <rect x={0} y={0} width={300} height={340} fill={f('wall')} onClick={c('wall')} style={cs}/>

      {/* Top frieze band */}
      <rect x={0} y={0} width={300} height={55} fill={f('frieze')} onClick={c('frieze')} style={cs}/>

      {/* Triangles in frieze — pointing down, alternating */}
      <polygon points="0,0 50,0 25,52"   fill={f('tri1')} onClick={c('tri1')} style={cs}/>
      <polygon points="50,0 100,0 75,52"  fill={f('tri2')} onClick={c('tri2')} style={cs}/>
      <polygon points="100,0 150,0 125,52" fill={f('tri1')} onClick={c('tri1')} style={cs}/>
      <polygon points="150,0 200,0 175,52" fill={f('tri3')} onClick={c('tri3')} style={cs}/>
      <polygon points="200,0 250,0 225,52" fill={f('tri1')} onClick={c('tri1')} style={cs}/>
      <polygon points="250,0 300,0 275,52" fill={f('tri4')} onClick={c('tri4')} style={cs}/>

      {/* Left column */}
      <rect x={0} y={55} width={48} height={230} fill={f('left')} onClick={c('left')} style={cs}/>
      {/* Left column inner step detail */}
      <rect x={8} y={70} width={32} height={18} fill={f('tri2')} onClick={c('tri2')} style={cs}/>
      <rect x={8} y={106} width={32} height={18} fill={f('tri3')} onClick={c('tri3')} style={cs}/>
      <rect x={8} y={142} width={32} height={18} fill={f('tri4')} onClick={c('tri4')} style={cs}/>
      <rect x={8} y={178} width={32} height={18} fill={f('tri2')} onClick={c('tri2')} style={cs}/>
      <rect x={8} y={214} width={32} height={18} fill={f('tri3')} onClick={c('tri3')} style={cs}/>
      <rect x={8} y={248} width={32} height={18} fill={f('tri1')} onClick={c('tri1')} style={cs}/>

      {/* Right column */}
      <rect x={252} y={55} width={48} height={230} fill={f('right')} onClick={c('right')} style={cs}/>
      <rect x={260} y={70} width={32} height={18} fill={f('tri3')} onClick={c('tri3')} style={cs}/>
      <rect x={260} y={106} width={32} height={18} fill={f('tri2')} onClick={c('tri2')} style={cs}/>
      <rect x={260} y={142} width={32} height={18} fill={f('tri1')} onClick={c('tri1')} style={cs}/>
      <rect x={260} y={178} width={32} height={18} fill={f('tri4')} onClick={c('tri4')} style={cs}/>
      <rect x={260} y={214} width={32} height={18} fill={f('tri2')} onClick={c('tri2')} style={cs}/>
      <rect x={260} y={248} width={32} height={18} fill={f('tri3')} onClick={c('tri3')} style={cs}/>

      {/* Center panel (above door area) */}
      <rect x={48} y={55} width={204} height={130} fill={f('center')} onClick={c('center')} style={cs}/>
      {/* Center panel decorative row */}
      <rect x={60} y={68} width={180} height={22} fill={f('tri4')} onClick={c('tri4')} style={cs}/>
      <rect x={60} y={104} width={180} height={22} fill={f('tri1')} onClick={c('tri1')} style={cs}/>
      <rect x={60} y={140} width={180} height={22} fill={f('tri2')} onClick={c('tri2')} style={cs}/>

      {/* Door */}
      <rect x={110} y={185} width={80} height={100} fill={f('door')} onClick={c('door')} style={cs}/>

      {/* Base / threshold band */}
      <rect x={0} y={285} width={300} height={55} fill={f('base')} onClick={c('base')} style={cs}/>
      {/* Base triangles pointing up */}
      <polygon points="0,340 50,340 25,288"   fill={f('tri2')} onClick={c('tri2')} style={cs}/>
      <polygon points="50,340 100,340 75,288"  fill={f('tri4')} onClick={c('tri4')} style={cs}/>
      <polygon points="100,340 150,340 125,288" fill={f('tri1')} onClick={c('tri1')} style={cs}/>
      <polygon points="150,340 200,340 175,288" fill={f('tri3')} onClick={c('tri3')} style={cs}/>
      <polygon points="200,340 250,340 225,288" fill={f('tri2')} onClick={c('tri2')} style={cs}/>
      <polygon points="250,340 300,340 275,288" fill={f('tri1')} onClick={c('tri1')} style={cs}/>

      {/* Black grid overlay */}
      <g style={{ pointerEvents:'none' }} stroke="#1A1A1A" fill="none" strokeWidth={sw}>
        <rect x={0} y={0} width={300} height={340}/>
        {/* Frieze */}
        <rect x={0} y={0} width={300} height={55}/>
        {[50,100,150,200,250].map(x => <line key={x} x1={x} y1={0} x2={x - 25} y2={52}/>)}
        {[50,100,150,200,250].map(x => <line key={`r${x}`} x1={x} y1={0} x2={x + 25} y2={52}/>)}
        {/* Columns */}
        <rect x={0} y={55} width={48} height={230}/>
        <rect x={252} y={55} width={48} height={230}/>
        {/* Horizontal dividers in columns */}
        {[70,88,106,124,142,160,178,196,214,232,248,266].map(y => (
          <line key={y} x1={8} y1={y} x2={40} y2={y} strokeWidth={1.5}/>
        ))}
        {[70,88,106,124,142,160,178,196,214,232,248,266].map(y => (
          <line key={`r${y}`} x1={260} y1={y} x2={292} y2={y} strokeWidth={1.5}/>
        ))}
        {/* Center panel */}
        <rect x={48} y={55} width={204} height={130}/>
        <rect x={60} y={68} width={180} height={22}/>
        <rect x={60} y={104} width={180} height={22}/>
        <rect x={60} y={140} width={180} height={22}/>
        {/* Door */}
        <rect x={110} y={185} width={80} height={100}/>
        {/* Base */}
        <rect x={0} y={285} width={300} height={55}/>
        {[50,100,150,200,250].map(x => <line key={`b${x}`} x1={x} y1={340} x2={x-25} y2={288}/>)}
        {[50,100,150,200,250].map(x => <line key={`br${x}`} x1={x} y1={340} x2={x+25} y2={288}/>)}
      </g>
    </svg>
  )
}
