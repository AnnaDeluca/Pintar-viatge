// Crea un SVG original inspirat en l'estil d'Abaporu (Tarsila do Amaral):
// figura humana estilitzada, formes simples, colors plans tropicals.
// Es una obra original — no còpia, no copyright.

import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))

const W = 600, H = 700

// PNG de referència (original) — colors inspirats en Tarsila
const colorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- Fons: cel blau tropical + terra verda -->
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#87CEEB"/>
      <stop offset="60%" stop-color="#4CC9F0"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#57CC99"/>
      <stop offset="100%" stop-color="#2E8B57"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <!-- Terra -->
  <rect x="0" y="520" width="${W}" height="180" fill="url(#ground)"/>
  <!-- Sol -->
  <circle cx="480" cy="100" r="55" fill="#F6C90E" opacity="0.9"/>
  <!-- Cactus / planta tropical -->
  <rect x="480" y="360" width="22" height="180" rx="11" fill="#2E8B57"/>
  <ellipse cx="480" cy="340" rx="40" ry="55" fill="#57CC99"/>
  <!-- Figura humana estilitzada (cap petit, cos gran, peu enorme) -->
  <!-- Peu enorme: característica d'Abaporu -->
  <ellipse cx="200" cy="620" rx="140" ry="65" fill="#C4956A"/>
  <!-- Cama -->
  <rect x="170" y="440" width="60" height="200" rx="30" fill="#C4956A"/>
  <!-- Cos gran i arrodonit -->
  <ellipse cx="230" cy="390" rx="120" ry="100" fill="#D4A57A"/>
  <!-- Braç -->
  <ellipse cx="100" cy="450" rx="35" ry="80" fill="#C4956A" transform="rotate(-20 100 450)"/>
  <!-- Mà -->
  <ellipse cx="75" cy="530" rx="30" ry="22" fill="#C4956A"/>
  <!-- Coll -->
  <rect x="215" y="270" width="30" height="60" rx="15" fill="#D4A57A"/>
  <!-- Cap petit (característica d'Abaporu) -->
  <circle cx="225" cy="240" r="50" fill="#D4A57A"/>
  <!-- Cara simple -->
  <ellipse cx="215" cy="235" rx="6" ry="8" fill="#8B4513"/>
  <ellipse cx="238" cy="235" rx="6" ry="8" fill="#8B4513"/>
  <path d="M 210 255 Q 225 265 242 255" fill="none" stroke="#8B4513" stroke-width="3" stroke-linecap="round"/>
</svg>`

await sharp(Buffer.from(colorSvg), { density: 150 })
  .resize(W, H)
  .jpeg({ quality: 95 })
  .toFile(join(__dirname, '..', 'public', 'paintings', 'abaporu.jpg'))

await sharp(Buffer.from(colorSvg), { density: 150 })
  .resize(400, 400, { fit: 'contain' })
  .jpeg({ quality: 85 })
  .toFile(join(__dirname, '..', 'public', 'paintings', 'abaporu-thumb.jpg'))

console.log('abaporu.jpg ✓')

// SVG de contorns per pintar (directament de l'SVG — sense K-Means)
const sketchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
  <rect width="${W}" height="${H}" fill="white"/>
  <!-- Sol -->
  <circle cx="480" cy="100" r="55" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Terra -->
  <path d="M 0 520 Q 150 500 300 520 Q 450 540 600 520 L 600 700 L 0 700 Z" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Planta -->
  <rect x="480" y="360" width="22" height="180" rx="11" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <ellipse cx="480" cy="335" rx="40" ry="55" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Peu enorme -->
  <ellipse cx="200" cy="620" rx="140" ry="65" fill="none" stroke="#1A1A1A" stroke-width="5"/>
  <!-- Cama -->
  <path d="M 170 640 L 170 440 Q 200 420 230 440 L 230 640" fill="none" stroke="#1A1A1A" stroke-width="5" stroke-linejoin="round"/>
  <!-- Cos gran -->
  <ellipse cx="230" cy="390" rx="120" ry="100" fill="none" stroke="#1A1A1A" stroke-width="5"/>
  <!-- Braç i mà -->
  <ellipse cx="100" cy="450" rx="35" ry="80" fill="none" stroke="#1A1A1A" stroke-width="5" transform="rotate(-20 100 450)"/>
  <ellipse cx="75" cy="530" rx="30" ry="22" fill="none" stroke="#1A1A1A" stroke-width="5"/>
  <!-- Coll -->
  <path d="M 215 330 L 215 270 Q 230 260 245 270 L 245 330" fill="none" stroke="#1A1A1A" stroke-width="5"/>
  <!-- Cap -->
  <circle cx="225" cy="240" r="50" fill="none" stroke="#1A1A1A" stroke-width="5"/>
  <!-- Ulls -->
  <ellipse cx="215" cy="235" rx="6" ry="8" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <ellipse cx="238" cy="235" rx="6" ry="8" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Boca -->
  <path d="M 210 255 Q 225 265 242 255" fill="none" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
</svg>`

await writeFile(join(__dirname, '..', 'public', 'sketches', 'abaporu.svg'), sketchSvg)
console.log('abaporu.svg ✓')

// Preview
await sharp(Buffer.from(sketchSvg), { density: 150 })
  .resize(400, 400, { fit: 'contain', background: 'white' })
  .png()
  .toFile(join(__dirname, '..', '.edge-previews', 'abaporu_sketch.png'))
console.log('preview ✓')
