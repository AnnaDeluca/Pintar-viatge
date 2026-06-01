// Renderitza la carbassa de Kusama a PNG per verificar el disseny.
// Executa: node scripts/preview-kusama.mjs
import sharp from 'sharp'
import { mkdir, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', '.edge-previews')
await mkdir(OUT, { recursive: true })

// Reprodueix l'SVG del component, amb alguns punts de mostra
const sampleDots = [
  { x: 110, y: 130, color: '#1A1A1A', r: 14 },
  { x: 160, y: 110, color: '#1A1A1A', r: 16 },
  { x: 210, y: 145, color: '#1A1A1A', r: 13 },
  { x: 90,  y: 195, color: '#1A1A1A', r: 15 },
  { x: 140, y: 175, color: '#1A1A1A', r: 14 },
  { x: 195, y: 200, color: '#1A1A1A', r: 17 },
  { x: 230, y: 200, color: '#1A1A1A', r: 12 },
  { x: 115, y: 240, color: '#1A1A1A', r: 13 },
  { x: 165, y: 240, color: '#1A1A1A', r: 14 },
  { x: 215, y: 245, color: '#1A1A1A', r: 11 },
]

const dotsSvg = sampleDots.map(d => `
  <g>
    <circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="url(#dot-shade)" />
    <ellipse cx="${d.x - d.r * 0.32}" cy="${d.y - d.r * 0.36}" rx="${d.r * 0.36}" ry="${d.r * 0.26}" fill="#fff" opacity="0.32" />
  </g>
`).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="640" height="640">
  <defs>
    <radialGradient id="pumpkin-grad" cx="42%" cy="38%" r="68%">
      <stop offset="0%" stop-color="#FFE85A" />
      <stop offset="55%" stop-color="#F4C430" />
      <stop offset="100%" stop-color="#C99419" />
    </radialGradient>
    <radialGradient id="dot-shade" cx="35%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#3a3a3a" />
      <stop offset="100%" stop-color="#000" />
    </radialGradient>
    <linearGradient id="stem-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6B5224" />
      <stop offset="100%" stop-color="#3A2C12" />
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="#FBF5E9" />
  <g>
    <path d="M 148 62 C 142 50, 154 38, 168 40 C 182 42, 184 56, 174 64 L 170 76" fill="url(#stem-grad)" stroke="#1A1A1A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
  </g>
  <path d="M 160 74 C 100 74, 50 110, 50 175 C 50 245, 100 285, 160 285 C 220 285, 270 245, 270 175 C 270 110, 220 74, 160 74 Z" fill="url(#pumpkin-grad)" stroke="#1A1A1A" stroke-width="3.5" stroke-linejoin="round" />
  <g fill="none" stroke="#1A1A1A" stroke-width="2.2" stroke-linecap="round" opacity="0.85">
    <path d="M 95 90 C 80 130, 80 220, 95 270" />
    <path d="M 128 78 C 118 125, 118 230, 128 282" />
    <path d="M 160 74 C 160 130, 160 230, 160 285" />
    <path d="M 192 78 C 202 125, 202 230, 192 282" />
    <path d="M 225 90 C 240 130, 240 220, 225 270" />
  </g>
  <ellipse cx="160" cy="296" rx="92" ry="8" fill="#1A1A1A" opacity="0.10" />
  ${dotsSvg}
</svg>`

const outPath = join(OUT, 'kusama_preview.png')
await sharp(Buffer.from(svg)).png().toFile(outPath)
console.log(`Renderitzat a ${outPath}`)
