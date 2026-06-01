// Compara mètodes de detecció de contorns:
//  - Original
//  - Sobel + hysteresis (actual)
//  - DoG (Difference of Gaussians)
//  - DoG + threshold
//
// Genera un grid amb tots els quadres per veure quin mètode funciona millor.

import { readdir, mkdir } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { Jimp } from 'jimp'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', '.edge-previews')
await mkdir(OUT, { recursive: true })

const MAX_DIM = 500
const TARGET_PCT = 2.5
const WEAK_RATIO = 0.5

// ── Helpers ────────────────────────────────────────────────────
function luma(d, i) { return (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8 }

function lumaImage(d, W, H) {
  const L = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) L[i] = luma(d, i * 4)
  return L
}

// ── MÈTODE 1: Sobel + Hysteresis ───────────────────────────────
function sobelMag(d, W, H) {
  const mag = new Float32Array(W * H)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx =
        -luma(d, ((y-1)*W+x-1)*4) - 2*luma(d, (y*W+x-1)*4) - luma(d, ((y+1)*W+x-1)*4) +
         luma(d, ((y-1)*W+x+1)*4) + 2*luma(d, (y*W+x+1)*4) + luma(d, ((y+1)*W+x+1)*4)
      const gy =
        -luma(d, ((y-1)*W+x-1)*4) - 2*luma(d, ((y-1)*W+x)*4) - luma(d, ((y-1)*W+x+1)*4) +
         luma(d, ((y+1)*W+x-1)*4) + 2*luma(d, ((y+1)*W+x)*4) + luma(d, ((y+1)*W+x+1)*4)
      mag[y * W + x] = Math.hypot(gx, gy)
    }
  }
  return mag
}

function adaptiveThresh(mag, W, H, pct) {
  const hist = new Uint32Array(256)
  let total = 0
  for (let i = 0; i < W * H; i++) {
    const m = Math.min(255, Math.floor(mag[i]))
    if (m > 0) { hist[m]++; total++ }
  }
  const target = Math.floor(total * (pct / 100))
  let cum = 0
  for (let bin = 255; bin >= 0; bin--) {
    cum += hist[bin]
    if (cum >= target) return bin
  }
  return 30
}

function sobelHysteresis(d, W, H) {
  const mag = sobelMag(d, W, H)
  const strongT = Math.max(20, adaptiveThresh(mag, W, H, TARGET_PCT))
  const weakT = Math.max(10, Math.floor(strongT * WEAK_RATIO))
  const visited = new Uint8Array(W * H)
  const queue = []
  for (let i = 0; i < W * H; i++) if (mag[i] >= strongT) { visited[i] = 1; queue.push(i) }
  while (queue.length) {
    const pos = queue.pop()
    const x = pos % W, y = (pos - x) / W
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue
      const nx = x + dx, ny = y + dy
      if (nx < 1 || nx >= W - 1 || ny < 1 || ny >= H - 1) continue
      const n = ny * W + nx
      if (!visited[n] && mag[n] >= weakT) { visited[n] = 1; queue.push(n) }
    }
  }
  return visited
}

// ── MÈTODE 2: DoG (Difference of Gaussians) ────────────────────
// Aquest mètode és el que fa servir el "comic book / line art" de molts editors.
// Resta una versió molt difuminada d'una poc difuminada → ressalta vores fines.
async function dogMethod(jimpImg, W, H) {
  // Dos blurs amb sigmes diferents
  const small = jimpImg.clone().blur(2)
  const large = jimpImg.clone().blur(8)
  const ds = new Uint8Array(small.bitmap.data.buffer, small.bitmap.data.byteOffset, small.bitmap.data.byteLength)
  const dl = new Uint8Array(large.bitmap.data.buffer, large.bitmap.data.byteOffset, large.bitmap.data.byteLength)
  const Ls = lumaImage(ds, W, H)
  const Ll = lumaImage(dl, W, H)
  // Diferència
  const diff = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) diff[i] = Math.abs(Ls[i] - Ll[i])
  // Llindar adaptatiu (mateix percentil que Sobel per equitat)
  const out = new Uint8Array(W * H)
  // Per DoG, picks where small > large (foscor més enfocada)
  const hist = new Uint32Array(256)
  let total = 0
  for (let i = 0; i < W * H; i++) {
    const m = Math.min(255, Math.floor(diff[i]))
    if (m > 0) { hist[m]++; total++ }
  }
  const target = Math.floor(total * 4 / 100)
  let cum = 0
  let strongT = 30
  for (let bin = 255; bin >= 0; bin--) {
    cum += hist[bin]
    if (cum >= target) { strongT = bin; break }
  }
  for (let i = 0; i < W * H; i++) if (diff[i] >= strongT) out[i] = 1
  return out
}

// ── MÈTODE 3: XDoG (Extended DoG) — el millor per estil dibuix ──
// Variant del DoG amb sigmoid tanh per produir línies estilitzades.
async function xdogMethod(jimpImg, W, H) {
  // Sigmes
  const sigma = 1.6
  const k = 4.5    // factor del segon sigma
  const tau = 0.98 // contrast entre els dos blurs (pull-out)
  const phi = 45   // pendent de la sigmoide
  const epsilon = 0.6 // ajust del nivell

  const small = jimpImg.clone().blur(sigma)
  const large = jimpImg.clone().blur(sigma * k)
  const ds = new Uint8Array(small.bitmap.data.buffer, small.bitmap.data.byteOffset, small.bitmap.data.byteLength)
  const dl = new Uint8Array(large.bitmap.data.buffer, large.bitmap.data.byteOffset, large.bitmap.data.byteLength)
  const Ls = lumaImage(ds, W, H)
  const Ll = lumaImage(dl, W, H)

  // XDoG: (1+tau) * Gsmall - tau * Glarge, normalitzat a 0..1
  const u = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const v = ((1 + tau) * Ls[i] - tau * Ll[i]) / 255
    u[i] = v
  }

  // Sigmoide: 1 si u >= epsilon, 1 + tanh(phi*(u-epsilon)) altrament
  const out = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    let v
    if (u[i] >= epsilon) v = 1
    else v = 1 + Math.tanh(phi * (u[i] - epsilon))
    // v està entre 0 i 1, 0 = línia
    if (v < 0.5) out[i] = 1
  }
  return out
}

// ── MÈTODE 4: Posterització + contorns ─────────────────────────
// Quantitza colors a N nivells i traça les vores entre regions
async function posterizeMethod(jimpImg, W, H) {
  const N = 4 // nombre de nivells de gris
  const blurred = jimpImg.clone().blur(4)
  const d = new Uint8Array(blurred.bitmap.data.buffer, blurred.bitmap.data.byteOffset, blurred.bitmap.data.byteLength)
  const L = lumaImage(d, W, H)
  // Quantitza a N nivells
  const Q = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) Q[i] = Math.floor(L[i] * N / 256)
  // Traça vores: si quantum diferent del veí, és vora
  const out = new Uint8Array(W * H)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      if (Q[i] !== Q[i - 1] || Q[i] !== Q[i + 1] ||
          Q[i] !== Q[i - W] || Q[i] !== Q[i + W]) {
        out[i] = 1
      }
    }
  }
  return out
}

// ── Render edges a PNG ─────────────────────────────────────────
async function edgesToPng(edges, W, H, outPath) {
  const out = new Jimp({ width: W, height: H, color: 0xFFFFFFFF })
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (edges[y * W + x]) out.setPixelColor(0x000000FF, x, y)
  }
  await out.write(outPath)
}

// ── Main: processa cada quadre amb cada mètode ─────────────────
const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()

const METHODS = ['sobel', 'dog', 'xdog', 'posterize']

for (const file of files) {
  const name = basename(file, '.jpg')
  const srcPath = join(SRC, file)
  const img = await Jimp.read(srcPath)
  const ratio = MAX_DIM / Math.max(img.width, img.height)
  if (ratio < 1) img.resize({ w: Math.round(img.width * ratio), h: Math.round(img.height * ratio) })
  const W = img.width, H = img.height
  const blurred = img.clone().blur(5)
  const d = new Uint8Array(blurred.bitmap.data.buffer, blurred.bitmap.data.byteOffset, blurred.bitmap.data.byteLength)

  // Original PNG
  await img.write(join(OUT, `_orig_${name}.png`))
  // Sobel
  const sobel = sobelHysteresis(d, W, H)
  await edgesToPng(sobel, W, H, join(OUT, `_sobel_${name}.png`))
  // DoG
  const dog = await dogMethod(img, W, H)
  await edgesToPng(dog, W, H, join(OUT, `_dog_${name}.png`))
  // XDoG
  const xdog = await xdogMethod(img, W, H)
  await edgesToPng(xdog, W, H, join(OUT, `_xdog_${name}.png`))
  // Posterize
  const poster = await posterizeMethod(img, W, H)
  await edgesToPng(poster, W, H, join(OUT, `_poster_${name}.png`))

  console.log(`${name} ✓`)
}

// ── Genera grid de comparació amb sharp ────────────────────────
console.log('\nGenerant grids de comparació...')

const COLS = 5  // orig, sobel, dog, xdog, poster
const TILE = 220
const PAD = 8
const HEADER = 26
const ROW = TILE + PAD

// Per a no fer un mega-grid amb tots els quadres alhora,
// fem un grid per a tots junts (5 col × N rows)
const titles = ['Original', 'Sobel (actual)', 'DoG', 'XDoG', 'Posterize']
const N = files.length
const W_TOT = COLS * TILE + (COLS + 1) * PAD
const H_TOT = HEADER + N * ROW + PAD

const composite = []
for (let i = 0; i < N; i++) {
  const name = basename(files[i], '.jpg')
  for (let c = 0; c < COLS; c++) {
    const prefix = ['_orig', '_sobel', '_dog', '_xdog', '_poster'][c]
    composite.push({
      input: join(OUT, `${prefix}_${name}.png`),
      left: PAD + c * (TILE + PAD),
      top: HEADER + i * ROW,
    })
  }
}

// Capçaleres SVG
const headerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W_TOT}" height="${HEADER}">
  <rect width="100%" height="100%" fill="#FBF5E9" />
  ${titles.map((t, c) => `
    <text x="${PAD + c * (TILE + PAD) + TILE / 2}" y="18"
          font-family="Arial, sans-serif" font-size="13" font-weight="700"
          fill="#23323E" text-anchor="middle">${t}</text>
  `).join('')}
</svg>`

composite.unshift({ input: Buffer.from(headerSvg), left: 0, top: 0 })

// Etiquetes de nom al costat esquerre (sobrescrivim cada fila)
const labels = []
for (let i = 0; i < N; i++) {
  const name = basename(files[i], '.jpg')
  const labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAD}" height="${TILE}">
    <rect width="100%" height="100%" fill="#FBF5E9" />
  </svg>`
  // Ja no fa falta; els noms van escrits al costat per separat
}

// Hem de redimensionar les imatges a TILE primer per garantir el grid
const resized = []
for (const c of composite) {
  if (c.input instanceof Buffer) { resized.push(c); continue }
  const buf = await sharp(c.input).resize(TILE, TILE, { fit: 'contain', background: { r: 251, g: 245, b: 233 } }).png().toBuffer()
  resized.push({ input: buf, left: c.left, top: c.top })
}

await sharp({
  create: { width: W_TOT, height: H_TOT, channels: 4, background: { r: 251, g: 245, b: 233, alpha: 1 } },
})
  .composite(resized)
  .png()
  .toFile(join(OUT, 'comparison_grid.png'))

console.log('Grid: ' + join(OUT, 'comparison_grid.png'))
