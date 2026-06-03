// Pop Art original inspirat en l'estil Warhol:
// Graella 2x2, mateixa cara simple en 4 combinacions de colors.
// Obra original — no còpia de cap obra de Warhol.

import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CELL = 280
const W = CELL * 2, H = CELL * 2

// 4 combinacions de colors vibrands estil Pop Art
const COMBOS = [
  { bg: '#FF6B6B', hair: '#F6C90E', skin: '#FFC8A0', lips: '#E63946', shadow: '#8B5CF6' },
  { bg: '#4CC9F0', hair: '#1A1A1A', skin: '#F4D5B0', lips: '#E63946', shadow: '#F093FB' },
  { bg: '#F6C90E', hair: '#E63946', skin: '#F4D5B0', lips: '#1A1A1A', shadow: '#4CC9F0' },
  { bg: '#57CC99', hair: '#F093FB', skin: '#FFC8A0', lips: '#F6C90E', shadow: '#2364AA' },
]

// Cara Warhol-style: formes planes i simples
function face(ox, oy, c, forColor) {
  return `
  <!-- Cel·la ${forColor} -->
  <rect x="${ox}" y="${oy}" width="${CELL}" height="${CELL}" fill="${c.bg}"/>
  <!-- Cabells -->
  <ellipse cx="${ox + CELL/2}" cy="${oy + 95}" rx="78" ry="88" fill="${c.hair}"/>
  <!-- Coll -->
  <rect x="${ox + CELL/2 - 22}" y="${oy + 175}" width="44" height="55" fill="${c.skin}"/>
  <!-- Espatlla / cos superior -->
  <ellipse cx="${ox + CELL/2}" cy="${oy + 255}" rx="85" ry="50" fill="${c.skin}"/>
  <!-- Cara -->
  <ellipse cx="${ox + CELL/2}" cy="${oy + 130}" rx="60" ry="68" fill="${c.skin}"/>
  <!-- Ombra ulls (sombra estil Warhol) -->
  <ellipse cx="${ox + CELL/2 - 20}" cy="${oy + 118}" rx="18" ry="10" fill="${c.shadow}" opacity="0.7"/>
  <ellipse cx="${ox + CELL/2 + 20}" cy="${oy + 118}" rx="18" ry="10" fill="${c.shadow}" opacity="0.7"/>
  <!-- Ulls -->
  <ellipse cx="${ox + CELL/2 - 20}" cy="${oy + 118}" rx="9" ry="11" fill="#1A1A1A"/>
  <ellipse cx="${ox + CELL/2 + 20}" cy="${oy + 118}" rx="9" ry="11" fill="#1A1A1A"/>
  <circle cx="${ox + CELL/2 - 18}" cy="${oy + 116}" r="3" fill="white"/>
  <circle cx="${ox + CELL/2 + 22}" cy="${oy + 116}" r="3" fill="white"/>
  <!-- Nas -->
  <ellipse cx="${ox + CELL/2}" cy="${oy + 138}" rx="8" ry="5" fill="${c.hair}" opacity="0.5"/>
  <!-- Boca (iconic Warhol: llavis gruixuts) -->
  <ellipse cx="${ox + CELL/2}" cy="${oy + 157}" rx="24" ry="13" fill="${c.lips}"/>
  <ellipse cx="${ox + CELL/2}" cy="${oy + 150}" rx="20" ry="7" fill="${c.skin}"/>
  <!-- Línia dels llavis -->
  <path d="M ${ox+CELL/2-24} ${oy+157} Q ${ox+CELL/2} ${oy+170} ${ox+CELL/2+24} ${oy+157}" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>`
}

// PNG de referència (colors)
const colorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${face(0, 0, COMBOS[0], 'TL')}
  ${face(CELL, 0, COMBOS[1], 'TR')}
  ${face(0, CELL, COMBOS[2], 'BL')}
  ${face(CELL, CELL, COMBOS[3], 'BR')}
  <!-- Línies de separació de la graella -->
  <line x1="${CELL}" y1="0" x2="${CELL}" y2="${H}" stroke="#1A1A1A" stroke-width="4"/>
  <line x1="0" y1="${CELL}" x2="${W}" y2="${CELL}" stroke="#1A1A1A" stroke-width="4"/>
</svg>`

await sharp(Buffer.from(colorSvg), { density: 150 })
  .resize(W, H).jpeg({ quality: 95 })
  .toFile(join(__dirname, '..', 'public', 'paintings', 'popart.jpg'))
await sharp(Buffer.from(colorSvg), { density: 150 })
  .resize(400, 400, { fit: 'contain' }).jpeg({ quality: 85 })
  .toFile(join(__dirname, '..', 'public', 'paintings', 'popart-thumb.jpg'))
console.log('popart.jpg ✓')

// SVG de contorns per pintar (línies negres sobre blanc)
function faceLines(ox, oy) {
  return `
  <!-- Cabells -->
  <ellipse cx="${ox+CELL/2}" cy="${oy+95}" rx="78" ry="88" fill="none" stroke="#1A1A1A" stroke-width="3.5"/>
  <!-- Cara -->
  <ellipse cx="${ox+CELL/2}" cy="${oy+130}" rx="60" ry="68" fill="none" stroke="#1A1A1A" stroke-width="3.5"/>
  <!-- Coll -->
  <rect x="${ox+CELL/2-22}" y="${oy+175}" width="44" height="55" rx="8" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Espatlla -->
  <ellipse cx="${ox+CELL/2}" cy="${oy+255}" rx="85" ry="50" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Zones dels ulls (per pintar la ombra) -->
  <ellipse cx="${ox+CELL/2-20}" cy="${oy+118}" rx="18" ry="10" fill="none" stroke="#1A1A1A" stroke-width="2.5"/>
  <ellipse cx="${ox+CELL/2+20}" cy="${oy+118}" rx="18" ry="10" fill="none" stroke="#1A1A1A" stroke-width="2.5"/>
  <!-- Ulls -->
  <ellipse cx="${ox+CELL/2-20}" cy="${oy+118}" rx="9" ry="11" fill="none" stroke="#1A1A1A" stroke-width="2.5"/>
  <ellipse cx="${ox+CELL/2+20}" cy="${oy+118}" rx="9" ry="11" fill="none" stroke="#1A1A1A" stroke-width="2.5"/>
  <!-- Nas -->
  <ellipse cx="${ox+CELL/2}" cy="${oy+138}" rx="8" ry="5" fill="none" stroke="#1A1A1A" stroke-width="2"/>
  <!-- Boca -->
  <ellipse cx="${ox+CELL/2}" cy="${oy+157}" rx="24" ry="13" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <path d="M ${ox+CELL/2-20} ${oy+150} Q ${ox+CELL/2} ${oy+156} ${ox+CELL/2+20} ${oy+150}" fill="none" stroke="#1A1A1A" stroke-width="2"/>`
}

const sketchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
  <rect width="${W}" height="${H}" fill="white"/>
  ${faceLines(0, 0)}
  ${faceLines(CELL, 0)}
  ${faceLines(0, CELL)}
  ${faceLines(CELL, CELL)}
  <line x1="${CELL}" y1="0" x2="${CELL}" y2="${H}" stroke="#1A1A1A" stroke-width="5"/>
  <line x1="0" y1="${CELL}" x2="${W}" y2="${CELL}" stroke="#1A1A1A" stroke-width="5"/>
</svg>`

await writeFile(join(__dirname, '..', 'public', 'sketches', 'popart.svg'), sketchSvg)
console.log('popart.svg ✓')

await sharp(Buffer.from(sketchSvg), { density: 150 })
  .resize(500, 500, { fit: 'contain', background: 'white' }).png()
  .toFile(join(__dirname, '..', '.edge-previews', 'popart_sketch.png'))
console.log('preview ✓')
