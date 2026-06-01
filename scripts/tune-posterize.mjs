// Tune the posterize method.
// Prova diversos paràmetres (N levels, blur) i guarda els resultats.
// Usage: node scripts/tune-posterize.mjs

import { readdir, mkdir } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { Jimp } from 'jimp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', '.edge-previews', 'tune')
await mkdir(OUT, { recursive: true })

const MAX_DIM = 500

function luma(d, i) { return (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8 }

function lumaImage(d, W, H) {
  const L = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) L[i] = luma(d, i * 4)
  return L
}

// Posterize amb quantització ADAPTATIVA al rang real de l'histograma
// (no fixe 0..255). Així capturem detall a quadres uniformes.
function posterizeAdaptive(L, W, H, N) {
  // Calcula percentils 2 i 98 com a rang
  const sorted = Float32Array.from(L).sort()
  const lo = sorted[Math.floor(sorted.length * 0.02)]
  const hi = sorted[Math.floor(sorted.length * 0.98)]
  const range = Math.max(1, hi - lo)

  const Q = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const norm = Math.max(0, Math.min(1, (L[i] - lo) / range))
    Q[i] = Math.floor(norm * N * 0.9999)
  }
  return Q
}

function tracBoundaries(Q, W, H) {
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

async function edgesToPng(edges, W, H, outPath) {
  const out = new Jimp({ width: W, height: H, color: 0xFFFFFFFF })
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (edges[y * W + x]) out.setPixelColor(0x000000FF, x, y)
  }
  await out.write(outPath)
}

const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()

// Configs a provar
const CONFIGS = [
  { name: 'N4_blur4', N: 4, blur: 4 },
  { name: 'N5_blur3', N: 5, blur: 3 },
  { name: 'N5_blur4_adaptive', N: 5, blur: 4, adaptive: true },
  { name: 'N6_blur4_adaptive', N: 6, blur: 4, adaptive: true },
]

for (const file of files) {
  const name = basename(file, '.jpg')
  const img = await Jimp.read(join(SRC, file))
  const ratio = MAX_DIM / Math.max(img.width, img.height)
  if (ratio < 1) img.resize({ w: Math.round(img.width * ratio), h: Math.round(img.height * ratio) })
  const W = img.width, H = img.height

  for (const cfg of CONFIGS) {
    const blurred = img.clone().blur(cfg.blur)
    const d = new Uint8Array(blurred.bitmap.data.buffer, blurred.bitmap.data.byteOffset, blurred.bitmap.data.byteLength)
    const L = lumaImage(d, W, H)
    let Q
    if (cfg.adaptive) {
      Q = posterizeAdaptive(L, W, H, cfg.N)
    } else {
      Q = new Uint8Array(W * H)
      for (let i = 0; i < W * H; i++) Q[i] = Math.floor(L[i] * cfg.N / 256)
    }
    const edges = tracBoundaries(Q, W, H)
    let blackCount = 0
    for (let i = 0; i < W * H; i++) if (edges[i]) blackCount++
    const pct = (blackCount / (W * H) * 100).toFixed(1)
    await edgesToPng(edges, W, H, join(OUT, `${name}_${cfg.name}.png`))
  }
  console.log(`${name} ✓`)
}

console.log(`\nResultats a ${OUT}`)
