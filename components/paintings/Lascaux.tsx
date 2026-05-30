'use client'
interface Props { fills: Record<string, string>; onRegionClick: (id: string) => void }
export default function Lascaux({ fills, onRegionClick }: Props) {
  const f = (id: string) => fills[id] ?? '#FFFFFF'
  const c = (id: string) => () => onRegionClick(id)
  const cs = { cursor: 'pointer' as const }
  return (
    <svg viewBox="0 0 380 280" width="100%" height="100%" style={{ display: 'block' }}>
      {/* Cave wall */}
      <rect x={0} y={0} width={380} height={280} fill={f('wall')} onClick={c('wall')} style={cs}/>
      {/* Rock texture cracks (decorative, non-interactive) */}

      {/* Bison body — main large shape */}
      <path d="
        M 100 195
        C 92 178 88 162 90 148
        C 92 132 100 120 112 110
        C 125 98 142 90 162 88
        C 185 84 210 88 232 96
        C 255 105 272 118 280 136
        C 288 152 285 170 278 184
        C 268 200 252 210 232 216
        C 210 222 185 222 162 218
        C 138 213 118 206 100 195 Z"
        fill={f('body')} onClick={c('body')} style={cs}/>

      {/* Bison hump — higher back area */}
      <path d="
        M 162 88
        C 152 78 148 65 155 55
        C 162 44 175 40 190 42
        C 205 44 215 55 215 68
        C 215 78 210 87 205 92
        C 195 88 178 86 162 88 Z"
        fill={f('body')} onClick={c('body')} style={cs}/>

      {/* Head */}
      <path d="
        M 100 195
        C 95 185 90 175 88 165
        C 86 155 88 145 92 138
        C 82 142 70 148 62 158
        C 54 168 52 182 56 194
        C 60 206 70 214 82 216
        C 94 218 104 213 110 205
        C 106 202 102 198 100 195 Z"
        fill={f('head')} onClick={c('head')} style={cs}/>

      {/* Horn */}
      <path d="M 68 155 C 60 140 58 125 65 112 C 70 104 78 100 85 103"
        stroke={f('horn')} strokeWidth={8} strokeLinecap="round" fill="none"
        onClick={c('horn')} style={cs}/>

      {/* Legs — four thick shapes */}
      <path d="
        M 145 216 C 140 225 138 245 140 265 L 155 265 C 157 245 158 225 158 218 Z
        M 175 218 C 172 228 170 248 172 265 L 187 265 C 188 248 188 228 185 220 Z
        M 218 214 C 215 224 213 244 215 262 L 230 262 C 232 244 232 224 228 216 Z
        M 245 208 C 242 218 240 238 242 256 L 257 256 C 258 238 258 218 254 210 Z"
        fill={f('legs')} onClick={c('legs')} style={cs}/>

      {/* Tail */}
      <path d="M 278 184 C 285 180 295 178 300 182 C 305 188 298 196 290 194"
        stroke={f('body')} strokeWidth={7} strokeLinecap="round" fill="none"
        onClick={c('body')} style={cs}/>

      {/* Outline overlay */}
      <g style={{ pointerEvents:'none' }} stroke="#2C1A0E" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <rect x={0} y={0} width={380} height={280} strokeWidth={3}/>
        {/* Cave cracks */}
        <path d="M 20 30 C 35 50 28 70 40 90" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.4}/>
        <path d="M 340 200 C 355 215 350 240 360 260" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.4}/>
        <path d="M 10 180 C 25 170 20 155 30 140" strokeWidth={1} strokeDasharray="3 4" opacity={0.35}/>
        {/* Body outline */}
        <path d="M 100 195 C 92 178 88 162 90 148 C 92 132 100 120 112 110 C 125 98 142 90 162 88 C 185 84 210 88 232 96 C 255 105 272 118 280 136 C 288 152 285 170 278 184 C 268 200 252 210 232 216 C 210 222 185 222 162 218 C 138 213 118 206 100 195 Z" strokeWidth={3}/>
        <path d="M 162 88 C 152 78 148 65 155 55 C 162 44 175 40 190 42 C 205 44 215 55 215 68 C 215 78 210 87 205 92 C 195 88 178 86 162 88 Z" strokeWidth={2.5}/>
        <path d="M 100 195 C 95 185 90 175 88 165 C 86 155 88 145 92 138 C 82 142 70 148 62 158 C 54 168 52 182 56 194 C 60 206 70 214 82 216 C 94 218 104 213 110 205 C 106 202 102 198 100 195 Z" strokeWidth={2.5}/>
        <path d="M 68 155 C 60 140 58 125 65 112 C 70 104 78 100 85 103" strokeWidth={4}/>
        {/* Eye */}
        <circle cx={65} cy={182} r={4} fill="#2C1A0E"/>
        {/* Legs */}
        <path d="M 145 216 C 140 225 138 245 140 265 L 155 265 C 157 245 158 225 158 218 Z M 175 218 C 172 228 170 248 172 265 L 187 265 C 188 248 188 228 185 220 Z M 218 214 C 215 224 213 244 215 262 L 230 262 C 232 244 232 224 228 216 Z M 245 208 C 242 218 240 238 242 256 L 257 256 C 258 238 258 218 254 210 Z" strokeWidth={2.5}/>
      </g>

      {/* Hand stencils decoration (non-interactive) */}
      <g style={{ pointerEvents:'none' }} opacity={0.25} fill="#8B4513">
        <circle cx={38} cy={48} r={7}/>
        <ellipse cx={30} cy={42} rx={4} ry={7} transform="rotate(-20,30,42)"/>
        <ellipse cx={35} cy={38} rx={4} ry={7} transform="rotate(-5,35,38)"/>
        <ellipse cx={42} cy={37} rx={4} ry={7} transform="rotate(10,42,37)"/>
        <ellipse cx={48} cy={40} rx={4} ry={7} transform="rotate(25,48,40)"/>
      </g>
    </svg>
  )
}
