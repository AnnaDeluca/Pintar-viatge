// Pipeline avançat suggerit pel Gemini:
// 1. K-Means color clustering → aplana els colors (8 colors)
// 2. Trace boundaries entre regions
// 3. Otsu threshold + Potrace → línies vectorials suaus
//
// Resultat: línies netes, sense pixelat ni soroll.

import { readdir, mkdir, writeFile } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { Jimp } from 'jimp'
import potraceModule from 'potrace'
const { trace: potraceTrace } = potraceModule

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', '.edge-previews', 'kmeans')
await mkdir(OUT, { recursive: true })

const MAX_DIM = 500
const K = 8         // nombre de colors K-Means
const KMEANS_ITER = 12
const MIN_COMP_SIZE = 35

// ── K-Means simple ─────────────────────────────────────────────
function kmeans(pixels, K, maxIter) {
  // pixels: Float32Array de [R,G,B,R,G,B,...] (3 canals)
  const N = pixels.length / 3
  // Centroides inicials: random sampling
  const centers = new Float32Array(K * 3)
  for (let k = 0; k < K; k++) {
    const idx = Math.floor(Math.random() * N) * 3
    centers[k * 3]     = pixels[idx]
    centers[k * 3 + 1] = pixels[idx + 1]
    centers[k * 3 + 2] = pixels[idx + 2]
  }

  const labels = new Uint8Array(N)
  for (let it = 0; it < maxIter; it++) {
    // Assigna cada píxel al centroide més proper
    let changed = 0
    for (let i = 0; i < N; i++) {
      const r = pixels[i * 3], g = pixels[i * 3 + 1], b = pixels[i * 3 + 2]
      let best = 0, bestD = Infinity
      for (let k = 0; k < K; k++) {
        const dr = r - centers[k * 3], dg = g - centers[k * 3 + 1], db = b - centers[k * 3 + 2]
        const d = dr * dr + dg * dg + db * db
        if (d < bestD) { bestD = d; best = k }
      }
      if (labels[i] !== best) { labels[i] = best; changed++ }
    }
    if (changed === 0) break

    // Recompute centroids
    const sums = new Float64Array(K * 3)
    const counts = new Uint32Array(K)
    for (let i = 0; i < N; i++) {
      const k = labels[i]
      sums[k * 3]     += pixels[i * 3]
      sums[k * 3 + 1] += pixels[i * 3 + 1]
      sums[k * 3 + 2] += pixels[i * 3 + 2]
      counts[k]++
    }
    for (let k = 0; k < K; k++) {
      if (counts[k] === 0) continue
      centers[k * 3]     = sums[k * 3] / counts[k]
      centers[k * 3 + 1] = sums[k * 3 + 1] / counts[k]
      centers[k * 3 + 2] = sums[k * 3 + 2] / counts[k]
    }
  }
  return labels
}

// Traça vores entre regions de cluster diferent
function traceBoundaries(labels, W, H) {
  const out = new Uint8Array(W * H)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      if (labels[i] !== labels[i - 1] || labels[i] !== labels[i + 1] ||
          labels[i] !== labels[i - W] || labels[i] !== labels[i + W]) {
        out[i] = 1
      }
    }
  }
  return out
}

// Elimina components petits (denoise)
function removeSmall(edges, W, H, minSize) {
  const data = new Uint8Array(edges)
  const v = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = y * W + x
    if (!data[s] || v[s]) continue
    const stack = [s]
    const comp = []
    v[s] = 1
    while (stack.length) {
      const p = stack.pop()
      comp.push(p)
      const px = p % W, py = (p - px) / W
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = px + dx, ny = py + dy
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        const n = ny * W + nx
        if (data[n] && !v[n]) { v[n] = 1; stack.push(n) }
      }
    }
    if (comp.length < minSize) for (const p of comp) data[p] = 0
  }
  return data
}

// Dilata 1px per fer la línia més gruixuda abans del Potrace
function dilate(edges, W, H) {
  const out = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x
    if (edges[i]) { out[i] = 1; continue }
    if (x > 0 && edges[i - 1]) out[i] = 1
    else if (x < W - 1 && edges[i + 1]) out[i] = 1
    else if (y > 0 && edges[i - W]) out[i] = 1
    else if (y < H - 1 && edges[i + W]) out[i] = 1
  }
  return out
}

// Render edges com a PNG (negre sobre blanc)
async function edgesToPng(edges, W, H, outPath) {
  const out = new Jimp({ width: W, height: H, color: 0xFFFFFFFF })
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (edges[y * W + x]) out.setPixelColor(0x000000FF, x, y)
  }
  await out.write(outPath)
}

// Potrace vectorització → SVG suau
function potraceSvg(pngBuffer) {
  return new Promise((res, rej) => {
    potraceTrace(pngBuffer, {
      turdSize: 8,       // suprimeix taques < 8px
      turnPolicy: 'minority',
      alphaMax: 1.0,     // suavitza els cantons (0 = angles vius, 1.3 = suau)
      optCurve: true,    // optimitza corbes Bézier
      optTolerance: 0.4, // tolerància (més = més simplificat)
      threshold: 128,    // llindar B/N
      blackOnWhite: true,
      color: '#000000',
      background: '#FFFFFF',
    }, (err, svg) => err ? rej(err) : res(svg))
  })
}

// Converteix SVG a PNG amb sharp per comparar
import sharp from 'sharp'
async function svgToPng(svg, W, H, outPath) {
  await sharp(Buffer.from(svg)).resize(W, H).png().toFile(outPath)
}

// ── Main ──────────────────────────────────────────────────────
const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()

for (const file of files) {
  const name = basename(file, '.jpg')
  console.log(`Processant ${name}...`)
  try {
    // Carrega + escala
    const img = await Jimp.read(join(SRC, file))
    const ratio = MAX_DIM / Math.max(img.width, img.height)
    if (ratio < 1) img.resize({ w: Math.round(img.width * ratio), h: Math.round(img.height * ratio) })
    const W = img.width, H = img.height
    // Blur lleuger per a estabilitat de K-Means
    const blurred = img.clone().blur(2)
    const d = new Uint8Array(blurred.bitmap.data.buffer, blurred.bitmap.data.byteOffset, blurred.bitmap.data.byteLength)

    // ── PAS 1: K-Means ──
    const pixels = new Float32Array(W * H * 3)
    for (let i = 0; i < W * H; i++) {
      pixels[i * 3]     = d[i * 4]
      pixels[i * 3 + 1] = d[i * 4 + 1]
      pixels[i * 3 + 2] = d[i * 4 + 2]
    }
    const labels = kmeans(pixels, K, KMEANS_ITER)

    // ── PAS 2: Traça vores ──
    let edges = traceBoundaries(labels, W, H)
    edges = removeSmall(edges, W, H, MIN_COMP_SIZE)
    edges = dilate(edges, W, H)   // engruixim 1px per al Potrace

    // Guarda el bitmap intermedi
    const bitmapPath = join(OUT, `${name}_bitmap.png`)
    await edgesToPng(edges, W, H, bitmapPath)

    // ── PAS 3: Potrace vectorització ──
    // Llegim el PNG que acabem de gravar com a buffer
    const { readFile } = await import('fs/promises')
    const pngBuf = await readFile(bitmapPath)
    let svg
    try {
      svg = await potraceSvg(pngBuf)
      await writeFile(join(OUT, `${name}.svg`), svg)
      // Rendering del SVG vectoritzat per veure
      await svgToPng(svg, W * 2, H * 2, join(OUT, `${name}_vector.png`))
      console.log(`  ${name} ✓ vectoritzat`)
    } catch (e) {
      console.log(`  ${name} ✗ potrace: ${e.message}`)
    }
  } catch (e) {
    console.log(`  ${name} ✗ ${e.message}`)
  }
}

console.log(`\nResultats: ${OUT}`)
