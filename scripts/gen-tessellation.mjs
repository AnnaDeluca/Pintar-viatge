// Genera un mosaic hexagonal (honeycomb) estil Escher:
//  - PNG de colors vibrands (la "pintura" de referència)
//  - SVG de contorns nets per a l'activitat de pintar

import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Paleta vibrant per al mosaic de referència (colors Miró/Delaunay)
const COLORS = [
  '#E63946','#F6C90E','#2364AA','#57CC99','#F4A261',
  '#8B5CF6','#FF6B6B','#4CC9F0','#FFD700','#2E8B57',
  '#D946EF','#F093FB','#AEE6FF','#FF8C42',
]

const W = 700, H = 700
const R = 38   // radi de l'hexàgon
const pad = 2  // separació entre hexàgons

// Centres dels hexàgons en un grid offset
function hexCenters(W, H, R) {
  const centers = []
  const dx = R * Math.sqrt(3)
  const dy = R * 1.5
  let row = 0
  for (let y = R; y < H + R; y += dy, row++) {
    const offset = row % 2 === 0 ? 0 : dx / 2
    for (let x = offset + R; x < W + R; x += dx) {
      centers.push({ x, y, row, col: Math.round(x / dx) })
    }
  }
  return centers
}

// Punts d'un hexàgon regular
function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = Math.PI / 180 * (60 * i - 30)
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  })
}

function pointsToPath(pts) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z'
}

const centers = hexCenters(W, H, R)

// ── PNG de referència: colors vibrands ──────────────────────────
const coloredSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#1A1A2E"/>
  ${centers.map((c, i) => {
    const color = COLORS[i % COLORS.length]
    const pts = hexPoints(c.x, c.y, R - pad)
    return `<path d="${pointsToPath(pts)}" fill="${color}" stroke="#1A1A2E" stroke-width="2"/>`
  }).join('\n  ')}
</svg>`

await sharp(Buffer.from(coloredSvg), { density: 150 })
  .resize(W, H)
  .jpeg({ quality: 95 })
  .toFile(join(__dirname, '..', 'public', 'paintings', 'tessellation.jpg'))

await sharp(Buffer.from(coloredSvg), { density: 150 })
  .resize(400, 400, { fit: 'contain' })
  .jpeg({ quality: 85 })
  .toFile(join(__dirname, '..', 'public', 'paintings', 'tessellation-thumb.jpg'))

console.log('tessellation.jpg ✓')

// ── SVG de contorns: línies netes per pintar ────────────────────
const sketchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
  <rect width="${W}" height="${H}" fill="white"/>
  ${centers.map(c => {
    const pts = hexPoints(c.x, c.y, R - pad)
    return `<path d="${pointsToPath(pts)}" fill="none" stroke="#1A1A1A" stroke-width="2.5" stroke-linejoin="round"/>`
  }).join('\n  ')}
</svg>`

await writeFile(join(__dirname, '..', 'public', 'sketches', 'tessellation.svg'), sketchSvg)
console.log('tessellation.svg ✓')

// Genera preview
await sharp(Buffer.from(sketchSvg), { density: 150 })
  .resize(400, 400, { fit: 'contain', background: 'white' })
  .png()
  .toFile(join(__dirname, '..', '.edge-previews', 'tessellation_sketch.png'))
console.log('Preview ✓')
