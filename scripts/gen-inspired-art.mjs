// Genera 3 obres SVG originals inspirades en artistes sota copyright:
// O'Keeffe (flor gegant), Lichtenstein (pop comic), Basquiat (corona+símbols)

import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'paintings')
const SKETCH = join(__dirname, '..', 'public', 'sketches')

// Helper per guardar SVG → JPG + thumb + sketch
async function save(name, colorSvg, sketchSvg, W, H) {
  const pOut = join(__dirname, '..', 'public', 'paintings')
  const sOut = join(__dirname, '..', 'public', 'sketches')
  await sharp(Buffer.from(colorSvg), { density: 150 })
    .resize(W, H).jpeg({ quality: 95 }).toFile(join(pOut, `${name}.jpg`))
  await sharp(Buffer.from(colorSvg), { density: 150 })
    .resize(400, 400, { fit: 'contain' }).jpeg({ quality: 85 }).toFile(join(pOut, `${name}-thumb.jpg`))
  await writeFile(join(sOut, `${name}.svg`), sketchSvg)
  await sharp(Buffer.from(sketchSvg), { density: 150 })
    .resize(500, 500, { fit: 'contain', background: 'white' }).png()
    .toFile(join(__dirname, '..', '.edge-previews', `${name}_sketch.png`))
  console.log(`${name} ✓`)
}

// ── O'KEEFFE: Flor gegant de prop ───────────────────────────────
const W1 = 600, H1 = 600
const okeeffe_color = `<svg xmlns="http://www.w3.org/2000/svg" width="${W1}" height="${H1}" viewBox="0 0 ${W1} ${H1}">
  <!-- Fons: gradient suau rosat/lila -->
  <defs>
    <radialGradient id="bg1" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#F093FB"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </radialGradient>
    <radialGradient id="ctr" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F6C90E"/>
      <stop offset="100%" stop-color="#E0A52E"/>
    </radialGradient>
  </defs>
  <rect width="${W1}" height="${H1}" fill="url(#bg1)"/>
  <!-- Pètals exteriors (grans, ondulats) -->
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="#FF6B6B" opacity="0.85" transform="rotate(0 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="#F093FB" opacity="0.85" transform="rotate(45 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="#FF8C42" opacity="0.85" transform="rotate(90 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="#F06292" opacity="0.85" transform="rotate(135 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="#FF6B6B" opacity="0.85" transform="rotate(180 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="#F093FB" opacity="0.85" transform="rotate(225 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="#FF8C42" opacity="0.85" transform="rotate(270 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="#F06292" opacity="0.85" transform="rotate(315 300 300)"/>
  <!-- Pètals interiors -->
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="#FF9999" opacity="0.9" transform="rotate(22 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="#F5A0C0" opacity="0.9" transform="rotate(67 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="#FF9999" opacity="0.9" transform="rotate(112 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="#F5A0C0" opacity="0.9" transform="rotate(157 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="#FF9999" opacity="0.9" transform="rotate(202 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="#F5A0C0" opacity="0.9" transform="rotate(247 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="#FF9999" opacity="0.9" transform="rotate(292 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="#F5A0C0" opacity="0.9" transform="rotate(337 300 300)"/>
  <!-- Centre groc -->
  <circle cx="300" cy="300" r="65" fill="url(#ctr)"/>
  <circle cx="300" cy="300" r="40" fill="#F6C90E"/>
</svg>`

const okeeffe_sketch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W1} ${H1}" preserveAspectRatio="xMidYMid meet">
  <rect width="${W1}" height="${H1}" fill="white"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="none" stroke="#1A1A1A" stroke-width="3" transform="rotate(0 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="none" stroke="#1A1A1A" stroke-width="3" transform="rotate(45 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="none" stroke="#1A1A1A" stroke-width="3" transform="rotate(90 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="none" stroke="#1A1A1A" stroke-width="3" transform="rotate(135 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="none" stroke="#1A1A1A" stroke-width="3" transform="rotate(180 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="none" stroke="#1A1A1A" stroke-width="3" transform="rotate(225 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="none" stroke="#1A1A1A" stroke-width="3" transform="rotate(270 300 300)"/>
  <ellipse cx="300" cy="90"  rx="85" ry="160" fill="none" stroke="#1A1A1A" stroke-width="3" transform="rotate(315 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="none" stroke="#1A1A1A" stroke-width="2.5" transform="rotate(22 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="none" stroke="#1A1A1A" stroke-width="2.5" transform="rotate(67 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="none" stroke="#1A1A1A" stroke-width="2.5" transform="rotate(112 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="none" stroke="#1A1A1A" stroke-width="2.5" transform="rotate(157 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="none" stroke="#1A1A1A" stroke-width="2.5" transform="rotate(202 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="none" stroke="#1A1A1A" stroke-width="2.5" transform="rotate(247 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="none" stroke="#1A1A1A" stroke-width="2.5" transform="rotate(292 300 300)"/>
  <ellipse cx="300" cy="160" rx="55" ry="105" fill="none" stroke="#1A1A1A" stroke-width="2.5" transform="rotate(337 300 300)"/>
  <circle cx="300" cy="300" r="65" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <circle cx="300" cy="300" r="40" fill="none" stroke="#1A1A1A" stroke-width="3"/>
</svg>`

await save('okeeffe', okeeffe_color, okeeffe_sketch, W1, H1)

// ── LICHTENSTEIN: Comic pop art amb punts halftone ──────────────
const W2 = 560, H2 = 600
const lichtenstein_color = `<svg xmlns="http://www.w3.org/2000/svg" width="${W2}" height="${H2}" viewBox="0 0 ${W2} ${H2}">
  <rect width="${W2}" height="${H2}" fill="#FFFF88"/>
  <!-- Punts halftone (fons) -->
  ${Array.from({length:12},(_,row)=>Array.from({length:12},(_,col)=>`<circle cx="${30+col*45}" cy="${30+row*45}" r="12" fill="#FFD700" opacity="0.5"/>`).join('')).join('')}
  <!-- Cara comic -->
  <ellipse cx="280" cy="280" rx="200" ry="230" fill="#FFDAB9" stroke="#1A1A1A" stroke-width="5"/>
  <!-- Ull esquerre -->
  <ellipse cx="200" cy="230" rx="45" ry="35" fill="white" stroke="#1A1A1A" stroke-width="4"/>
  <circle cx="210" cy="228" r="20" fill="#2364AA"/>
  <circle cx="215" cy="223" r="7" fill="black"/>
  <circle cx="218" cy="220" r="4" fill="white"/>
  <!-- Ull dret -->
  <ellipse cx="360" cy="230" rx="45" ry="35" fill="white" stroke="#1A1A1A" stroke-width="4"/>
  <circle cx="370" cy="228" r="20" fill="#2364AA"/>
  <circle cx="375" cy="223" r="7" fill="black"/>
  <circle cx="378" cy="220" r="4" fill="white"/>
  <!-- Nas -->
  <path d="M 280 250 Q 265 300 270 320 Q 280 330 290 320 Q 295 300 280 250" fill="#FFAA80" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Boca gran (Lichtenstein style) -->
  <ellipse cx="280" cy="370" rx="90" ry="40" fill="#E63946" stroke="#1A1A1A" stroke-width="4"/>
  <ellipse cx="280" cy="358" rx="85" ry="20" fill="#FFDAB9"/>
  <!-- Dents -->
  <rect x="210" y="358" width="35" height="22" rx="5" fill="white" stroke="#1A1A1A" stroke-width="2"/>
  <rect x="248" y="358" width="35" height="22" rx="5" fill="white" stroke="#1A1A1A" stroke-width="2"/>
  <rect x="286" y="358" width="35" height="22" rx="5" fill="white" stroke="#1A1A1A" stroke-width="2"/>
  <rect x="324" y="358" width="35" height="22" rx="5" fill="white" stroke="#1A1A1A" stroke-width="2"/>
  <!-- Cabells (Lichtenstein: línies negres gruixudes) -->
  <path d="M 80 200 Q 100 80 280 60 Q 460 80 480 200 Q 460 120 280 110 Q 100 120 80 200 Z" fill="#F6C90E" stroke="#1A1A1A" stroke-width="5"/>
  <!-- Globus de pensament -->
  <ellipse cx="460" cy="80" rx="75" ry="45" fill="white" stroke="#1A1A1A" stroke-width="4"/>
  <text x="460" y="72" text-anchor="middle" font-family="Arial Black, Arial" font-size="13" font-weight="900" fill="#1A1A1A">QUIN COLOR</text>
  <text x="460" y="90" text-anchor="middle" font-family="Arial Black, Arial" font-size="13" font-weight="900" fill="#1A1A1A">TRIARE?!</text>
  <circle cx="410" cy="115" r="8" fill="white" stroke="#1A1A1A" stroke-width="3"/>
  <circle cx="398" cy="130" r="5" fill="white" stroke="#1A1A1A" stroke-width="2"/>
  <circle cx="390" cy="142" r="3" fill="white" stroke="#1A1A1A" stroke-width="2"/>
</svg>`

const lichtenstein_sketch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W2} ${H2}" preserveAspectRatio="xMidYMid meet">
  <rect width="${W2}" height="${H2}" fill="white"/>
  ${Array.from({length:12},(_,row)=>Array.from({length:12},(_,col)=>`<circle cx="${30+col*45}" cy="${30+row*45}" r="12" fill="none" stroke="#ccc" stroke-width="1.5"/>`).join('')).join('')}
  <ellipse cx="280" cy="280" rx="200" ry="230" fill="none" stroke="#1A1A1A" stroke-width="5"/>
  <ellipse cx="200" cy="230" rx="45" ry="35" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <circle cx="210" cy="228" r="20" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <circle cx="215" cy="223" r="7" fill="none" stroke="#1A1A1A" stroke-width="2"/>
  <ellipse cx="360" cy="230" rx="45" ry="35" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <circle cx="370" cy="228" r="20" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <circle cx="375" cy="223" r="7" fill="none" stroke="#1A1A1A" stroke-width="2"/>
  <path d="M 280 250 Q 265 300 270 320 Q 280 330 290 320 Q 295 300 280 250" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <ellipse cx="280" cy="370" rx="90" ry="40" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <ellipse cx="280" cy="358" rx="85" ry="20" fill="none" stroke="#1A1A1A" stroke-width="2.5"/>
  <rect x="210" y="358" width="35" height="22" rx="5" fill="none" stroke="#1A1A1A" stroke-width="2"/>
  <rect x="248" y="358" width="35" height="22" rx="5" fill="none" stroke="#1A1A1A" stroke-width="2"/>
  <rect x="286" y="358" width="35" height="22" rx="5" fill="none" stroke="#1A1A1A" stroke-width="2"/>
  <rect x="324" y="358" width="35" height="22" rx="5" fill="none" stroke="#1A1A1A" stroke-width="2"/>
  <path d="M 80 200 Q 100 80 280 60 Q 460 80 480 200 Q 460 120 280 110 Q 100 120 80 200 Z" fill="none" stroke="#1A1A1A" stroke-width="5"/>
  <ellipse cx="460" cy="80" rx="75" ry="45" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <circle cx="410" cy="115" r="8" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <circle cx="398" cy="130" r="5" fill="none" stroke="#1A1A1A" stroke-width="2"/>
</svg>`

await save('lichtenstein', lichtenstein_color, lichtenstein_sketch, W2, H2)

// ── BASQUIAT: Corona + símbol SAMO + figures expressionistes ────
const W3 = 600, H3 = 600
const basquiat_color = `<svg xmlns="http://www.w3.org/2000/svg" width="${W3}" height="${H3}" viewBox="0 0 ${W3} ${H3}">
  <rect width="${W3}" height="${H3}" fill="#F5E6C8"/>
  <!-- Textura fons (pinzellades) -->
  <rect x="0" y="0" width="${W3}" height="200" fill="#E63946" opacity="0.15"/>
  <rect x="0" y="400" width="${W3}" height="200" fill="#4CC9F0" opacity="0.15"/>
  <!-- Figura central Basquiat-style (cap simple, ulls buits) -->
  <rect x="220" y="160" width="160" height="200" rx="20" fill="#3A2A1A" stroke="#1A1A1A" stroke-width="4"/>
  <!-- Ulls buits (característic Basquiat) -->
  <rect x="240" y="195" width="40" height="35" rx="5" fill="#F6C90E" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="318" y="195" width="40" height="35" rx="5" fill="#F6C90E" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Boca oberta -->
  <rect x="248" y="275" width="100" height="35" rx="8" fill="#E63946" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Dents -->
  <rect x="258" y="278" width="22" height="18" fill="white"/>
  <rect x="284" y="278" width="22" height="18" fill="white"/>
  <rect x="310" y="278" width="22" height="18" fill="white"/>
  <!-- CORONA (símbol clau de Basquiat) -->
  <polygon points="300,70 270,120 300,105 330,120" fill="#F6C90E" stroke="#1A1A1A" stroke-width="4"/>
  <polygon points="300,70 260,100 280,120 300,105" fill="#F6C90E" stroke="#1A1A1A" stroke-width="3"/>
  <polygon points="300,70 340,100 320,120 300,105" fill="#F6C90E" stroke="#1A1A1A" stroke-width="3"/>
  <!-- SAMO© (marca registrada fictícia de Basquiat) -->
  <text x="80" y="120" font-family="Arial" font-size="22" font-weight="900" fill="#E63946" transform="rotate(-15 80 120)">SAMO©</text>
  <!-- Fletxes i símbols -->
  <text x="450" y="180" font-family="Arial" font-size="40" fill="#2364AA" font-weight="900">✦</text>
  <text x="50" y="400" font-family="Arial" font-size="30" fill="#E63946" transform="rotate(10 50 400)">©</text>
  <text x="460" y="450" font-family="Arial" font-size="28" fill="#57CC99" font-weight="900">★</text>
  <!-- Línies expressionistes -->
  <line x1="50" y1="300" x2="190" y2="280" stroke="#1A1A1A" stroke-width="4" stroke-linecap="round"/>
  <line x1="410" y1="280" x2="550" y2="310" stroke="#1A1A1A" stroke-width="4" stroke-linecap="round"/>
  <line x1="50" y1="500" x2="550" y2="480" stroke="#1A1A1A" stroke-width="3" stroke-dasharray="8 6"/>
  <!-- Cos -->
  <rect x="260" y="355" width="80" height="130" rx="10" fill="#3A2A1A" stroke="#1A1A1A" stroke-width="3"/>
  <!-- Cames -->
  <rect x="255" y="470" width="35" height="100" rx="8" fill="#3A2A1A" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="308" y="470" width="35" height="100" rx="8" fill="#3A2A1A" stroke="#1A1A1A" stroke-width="3"/>
</svg>`

const basquiat_sketch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W3} ${H3}" preserveAspectRatio="xMidYMid meet">
  <rect width="${W3}" height="${H3}" fill="white"/>
  <rect x="220" y="160" width="160" height="200" rx="20" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <rect x="240" y="195" width="40" height="35" rx="5" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="318" y="195" width="40" height="35" rx="5" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="248" y="275" width="100" height="35" rx="8" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="258" y="278" width="22" height="18" fill="none" stroke="#1A1A1A" stroke-width="2"/>
  <rect x="284" y="278" width="22" height="18" fill="none" stroke="#1A1A1A" stroke-width="2"/>
  <rect x="310" y="278" width="22" height="18" fill="none" stroke="#1A1A1A" stroke-width="2"/>
  <polygon points="300,70 270,120 300,105 330,120" fill="none" stroke="#1A1A1A" stroke-width="4"/>
  <polygon points="300,70 260,100 280,120 300,105" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <polygon points="300,70 340,100 320,120 300,105" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <text x="80" y="120" font-family="Arial" font-size="22" font-weight="900" fill="#1A1A1A" transform="rotate(-15 80 120)">SAMO©</text>
  <text x="450" y="180" font-family="Arial" font-size="40" fill="#1A1A1A" font-weight="900">✦</text>
  <text x="50" y="400" font-family="Arial" font-size="30" fill="#1A1A1A" transform="rotate(10 50 400)">©</text>
  <text x="460" y="450" font-family="Arial" font-size="28" fill="#1A1A1A" font-weight="900">★</text>
  <line x1="50" y1="300" x2="190" y2="280" stroke="#1A1A1A" stroke-width="4" stroke-linecap="round"/>
  <line x1="410" y1="280" x2="550" y2="310" stroke="#1A1A1A" stroke-width="4" stroke-linecap="round"/>
  <line x1="50" y1="500" x2="550" y2="480" stroke="#1A1A1A" stroke-width="3" stroke-dasharray="8 6"/>
  <rect x="260" y="355" width="80" height="130" rx="10" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="255" y="470" width="35" height="100" rx="8" fill="none" stroke="#1A1A1A" stroke-width="3"/>
  <rect x="308" y="470" width="35" height="100" rx="8" fill="none" stroke="#1A1A1A" stroke-width="3"/>
</svg>`

await save('basquiat', basquiat_color, basquiat_sketch, W3, H3)
