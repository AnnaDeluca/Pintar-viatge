// Genera previsualitzacions de la detecció de contorns per cada quadre.
// Executa: node scripts/preview-edges.mjs [strongT] [weakT]
//
// Mirroritza exactament la pipeline de components/ColoringCanvas.tsx:
//   1. Blur fort (5px equivalent)
//   2. Sobel hysteresis (weakT, strongT) → binari
//   3. Sortida = imatge original difuminada + línies negres sobre blanc

import { readdir, mkdir } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { Jimp } from 'jimp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', '.edge-previews')

// Llindars ADAPTATIUS: triem el strong tal que ~TARGET_PCT píxels el superin
const TARGET_PCT = Number(process.argv[2] || 2.5)   // % de píxels per sobre del strong
const WEAK_RATIO = Number(process.argv[3] || 0.5)   // weak = strong * ratio (més estricte = línia més fina)
const MAX_DIM = 600
const BLUR = 7

console.log(`Llindars adaptatius: target=${TARGET_PCT}% píxels, weak/strong=${WEAK_RATIO}`)

await mkdir(OUT, { recursive: true })

function luma(d, i) {
  return (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8
}

function sobelMagnitudes(d, W, H) {
  const mag = new Float32Array(W * H)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx =
        -luma(d, ((y - 1) * W + x - 1) * 4) - 2 * luma(d, (y * W + x - 1) * 4) - luma(d, ((y + 1) * W + x - 1) * 4) +
         luma(d, ((y - 1) * W + x + 1) * 4) + 2 * luma(d, (y * W + x + 1) * 4) + luma(d, ((y + 1) * W + x + 1) * 4)
      const gy =
        -luma(d, ((y - 1) * W + x - 1) * 4) - 2 * luma(d, ((y - 1) * W + x) * 4) - luma(d, ((y - 1) * W + x + 1) * 4) +
         luma(d, ((y + 1) * W + x - 1) * 4) + 2 * luma(d, ((y + 1) * W + x) * 4) + luma(d, ((y + 1) * W + x + 1) * 4)
      mag[y * W + x] = Math.hypot(gx, gy)
    }
  }
  return mag
}

// Triem strong tal que ~targetPct dels píxels el superin (percentil)
function adaptiveStrongThreshold(mag, W, H, targetPct) {
  // Histograma de 256 bins (clamp mag a 0..255)
  const hist = new Uint32Array(256)
  let total = 0
  for (let i = 0; i < W * H; i++) {
    const m = Math.min(255, Math.floor(mag[i]))
    if (m > 0) { hist[m]++; total++ }
  }
  const targetCount = Math.floor(total * (targetPct / 100))
  let cum = 0
  for (let bin = 255; bin >= 0; bin--) {
    cum += hist[bin]
    if (cum >= targetCount) return bin
  }
  return 30
}

function sobelEdges(d, W, H, weakT, strongT) {
  const mag = sobelMagnitudes(d, W, H)
  const out = new Uint8Array(W * H)
  const visited = new Uint8Array(W * H)
  const queue = []

  for (let i = 0; i < W * H; i++) {
    if (mag[i] >= strongT) {
      visited[i] = 1
      queue.push(i)
    }
  }

  while (queue.length) {
    const pos = queue.pop()
    const x = pos % W
    const y = (pos - x) / W
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = x + dx, ny = y + dy
        if (nx < 1 || nx >= W - 1 || ny < 1 || ny >= H - 1) continue
        const n = ny * W + nx
        if (visited[n]) continue
        if (mag[n] >= weakT) {
          visited[n] = 1
          queue.push(n)
        }
      }
    }
  }

  for (let i = 0; i < W * H; i++) {
    if (visited[i]) out[i] = 1
  }
  return out
}

async function processOne(srcPath, outPath) {
  const img = await Jimp.read(srcPath)
  // Reduir a MAX_DIM
  const ratio = MAX_DIM / Math.max(img.width, img.height)
  if (ratio < 1) img.resize({ w: Math.round(img.width * ratio), h: Math.round(img.height * ratio) })
  const W = img.width, H = img.height

  // Còpia per al fons (blanc) i una blur per Sobel
  const blurred = img.clone().blur(BLUR)
  const d = new Uint8Array(blurred.bitmap.data.buffer, blurred.bitmap.data.byteOffset, blurred.bitmap.data.byteLength)

  // Calcular llindars adaptatius per a aquesta imatge concreta
  const mag = sobelMagnitudes(d, W, H)
  const strongT = Math.max(20, adaptiveStrongThreshold(mag, W, H, TARGET_PCT))
  const weakT = Math.max(10, Math.floor(strongT * WEAK_RATIO))

  // Reutilitzem la magnitud
  const visited = new Uint8Array(W * H)
  const queue = []
  for (let i = 0; i < W * H; i++) {
    if (mag[i] >= strongT) { visited[i] = 1; queue.push(i) }
  }
  while (queue.length) {
    const pos = queue.pop()
    const x = pos % W
    const y = (pos - x) / W
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = x + dx, ny = y + dy
        if (nx < 1 || nx >= W - 1 || ny < 1 || ny >= H - 1) continue
        const n = ny * W + nx
        if (visited[n]) continue
        if (mag[n] >= weakT) { visited[n] = 1; queue.push(n) }
      }
    }
  }
  const edges = visited

  // Compta línies (ratio negre/total)
  let blackCount = 0
  for (let i = 0; i < W * H; i++) if (edges[i]) blackCount++
  const blackPct = (blackCount / (W * H) * 100).toFixed(1)
  const debug = `s=${strongT} w=${weakT}`

  // Crea imatge de sortida: blanc + línies negres
  const out = new Jimp({ width: W, height: H, color: 0xFFFFFFFF })
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (edges[y * W + x]) {
        out.setPixelColor(0x000000FF, x, y)
      }
    }
  }
  await out.write(outPath)
  return { blackPct, debug }
}

const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()
console.log(`\nProcessant ${files.length} imatges:\n`)

for (const file of files) {
  const name = basename(file, '.jpg')
  const srcPath = join(SRC, file)
  const outPath = join(OUT, `${name}_edges.png`)
  try {
    const { blackPct, debug } = await processOne(srcPath, outPath)
    console.log(`  ${name.padEnd(12)} → ${blackPct.padStart(5)}% negre  (${debug})`)
  } catch (e) {
    console.log(`  ${name.padEnd(12)} ✗ ${e.message}`)
  }
}

console.log(`\nPrevisualitzacions a: ${OUT}`)
