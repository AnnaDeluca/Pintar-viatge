'use client'

interface Props {
  fills: Record<string, string>
  onRegionClick: (id: string) => void
}

export default function Kandinsky({ fills, onRegionClick }: Props) {
  const f = (id: string) => fills[id] ?? '#FFFFFF'
  const click = (id: string) => () => onRegionClick(id)
  const cs = { cursor: 'pointer' as const }

  // 6 concentric circles + background
  const cx = 150, cy = 150
  const radii = [130, 108, 85, 63, 42, 22]

  return (
    <svg viewBox="0 0 300 300" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Background square */}
      <rect x={0} y={0} width={300} height={300} fill={f('bg')} onClick={click('bg')} style={cs}/>

      {/* Concentric circles from outside in — each ring is a separate click region */}
      {/* Ring 6 (outermost ring area): r=130 to r=108 */}
      <circle cx={cx} cy={cy} r={radii[0]} fill={f('c1')} onClick={click('c1')} style={cs}/>
      <circle cx={cx} cy={cy} r={radii[1]} fill={f('c2')} onClick={click('c2')} style={cs}/>
      <circle cx={cx} cy={cy} r={radii[2]} fill={f('c3')} onClick={click('c3')} style={cs}/>
      <circle cx={cx} cy={cy} r={radii[3]} fill={f('c4')} onClick={click('c4')} style={cs}/>
      <circle cx={cx} cy={cy} r={radii[4]} fill={f('c5')} onClick={click('c5')} style={cs}/>
      <circle cx={cx} cy={cy} r={radii[5]} fill={f('c6')} onClick={click('c6')} style={cs}/>

      {/* Black outlines overlay */}
      <g style={{ pointerEvents: 'none' }}>
        {radii.map(r => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#1A1A1A" strokeWidth={3}/>
        ))}
        <rect x={0} y={0} width={300} height={300} fill="none" stroke="#1A1A1A" strokeWidth={4}/>
      </g>
    </svg>
  )
}
