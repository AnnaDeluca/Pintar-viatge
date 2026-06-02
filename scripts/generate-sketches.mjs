// Genera els SVG de contorns de TOTS els quadres → public/sketches/{id}.svg
// Es fa una sola vegada (build time). El navegador només carrega l'SVG.

import { readdir, mkdir, writeFile, readFile } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { Jimp } from 'jimp'
import potraceModule from 'potrace'
import sharp from 'sharp'
const { trace: potraceTrace } = potraceModule

// ── RGB → Lab (espai de color perceptualment uniforme — molt millor per K-Means) ──
function rgbToLab(r, g, b) {
  r /= 255; g /= 255; b /= 255
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92
  let X = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
  let Y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.00000
  let Z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883
  const f = t => t > 0.008856 ? Math.pow(t, 1/3) : 7.787 * t + 16/116
  const L = 116 * f(Y) - 16
  const a = 500 * (f(X) - f(Y))
  const bb = 200 * (f(Y) - f(Z))
  return [L, a, bb]
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', 'public', 'sketches')
await mkdir(OUT, { recursive: true })

const MAX_DIM = 600
const KMEANS_ITER = 12

// CONFIG PER-QUADRE — V2 amb median filter + Lab color space
// turdSize més gran i alphaMax més alt → corbes més suaus tipus comic
const PAINTING_CONFIG = {
  // Retrats detallats — K alt, més detall
  vermeer:   { K: 8, tol: 0.6, minSize: 60, turdSize: 10, alphaMax: 1.2 },
  cassatt:   { K: 8, tol: 0.6, minSize: 60, turdSize: 10, alphaMax: 1.2 },
  vigee:     { K: 8, tol: 0.6, minSize: 60, turdSize: 10, alphaMax: 1.2 },
  sofonisba: { K: 8, tol: 0.6, minSize: 60, turdSize: 12, alphaMax: 1.2 },
  velazquez: { K: 8, tol: 0.6, minSize: 60, turdSize: 12, alphaMax: 1.2 },
  kahlo:     { K: 8, tol: 0.6, minSize: 60, turdSize: 10, alphaMax: 1.2 },
  morisot:   { K: 7, tol: 0.7, minSize: 70, turdSize: 12, alphaMax: 1.25 },
  klimt:     { K: 7, tol: 0.7, minSize: 70, turdSize: 12, alphaMax: 1.25 },
  artemisia: { K: 7, tol: 0.7, minSize: 70, turdSize: 12, alphaMax: 1.25 },
  // Escenes amb formes clares
  hokusai:   { K: 7, tol: 0.8, minSize: 80, turdSize: 14, alphaMax: 1.3 },
  mondrian:  { K: 5, tol: 1.0, minSize: 120, turdSize: 18, alphaMax: 1.34 },
  lewitt:    { K: 6, tol: 0.7, minSize: 70, turdSize: 14, alphaMax: 1.3 },
  munch:     { K: 6, tol: 0.8, minSize: 80, turdSize: 14, alphaMax: 1.3 },
  homer:     { K: 6, tol: 0.8, minSize: 80, turdSize: 14, alphaMax: 1.3 },
  ndebele:   { K: 6, tol: 0.7, minSize: 70, turdSize: 14, alphaMax: 1.3 },
  // Abstractes / densitat alta — K baix + suavitzat fort
  kandinsky: { K: 5, tol: 1.0, minSize: 100, turdSize: 16, alphaMax: 1.33 },
  matisse:   { K: 5, tol: 1.0, minSize: 100, turdSize: 16, alphaMax: 1.33 },
  vangogh:   { K: 5, tol: 1.0, minSize: 100, turdSize: 16, alphaMax: 1.33 },
  sargent:   { K: 5, tol: 1.0, minSize: 100, turdSize: 16, alphaMax: 1.33 },
  botticelli:{ K: 6, tol: 0.9, minSize: 90, turdSize: 14, alphaMax: 1.3 },
  lascaux:   { K: 5, tol: 1.0, minSize: 100, turdSize: 16, alphaMax: 1.33 },
}
const DEFAULT_CONFIG = { K: 7, tol: 0.7, minSize: 70, turdSize: 12, alphaMax: 1.25 }

function kmeans(pixels, K, maxIter) {
  const N = pixels.length / 3
  const centers = new Float32Array(K * 3)
  // K-Means++ init: el primer centre aleatori, els altres lluny dels anteriors
  let idx = Math.floor(Math.random() * N) * 3
  centers[0] = pixels[idx]; centers[1] = pixels[idx + 1]; centers[2] = pixels[idx + 2]
  for (let k = 1; k < K; k++) {
    const dists = new Float32Array(N)
    let totalD = 0
    for (let i = 0; i < N; i++) {
      let minD = Infinity
      const r = pixels[i*3], g = pixels[i*3+1], b = pixels[i*3+2]
      for (let kk = 0; kk < k; kk++) {
        const dr = r - centers[kk*3], dg = g - centers[kk*3+1], db = b - centers[kk*3+2]
        const d = dr*dr + dg*dg + db*db
        if (d < minD) minD = d
      }
      dists[i] = minD; totalD += minD
    }
    let pick = Math.random() * totalD
    for (let i = 0; i < N; i++) {
      pick -= dists[i]
      if (pick <= 0) {
        centers[k*3] = pixels[i*3]; centers[k*3+1] = pixels[i*3+1]; centers[k*3+2] = pixels[i*3+2]
        break
      }
    }
  }

  const labels = new Uint8Array(N)
  for (let it = 0; it < maxIter; it++) {
    let changed = 0
    for (let i = 0; i < N; i++) {
      const r = pixels[i*3], g = pixels[i*3+1], b = pixels[i*3+2]
      let best = 0, bestD = Infinity
      for (let k = 0; k < K; k++) {
        const dr = r - centers[k*3], dg = g - centers[k*3+1], db = b - centers[k*3+2]
        const d = dr*dr + dg*dg + db*db
        if (d < bestD) { bestD = d; best = k }
      }
      if (labels[i] !== best) { labels[i] = best; changed++ }
    }
    if (changed === 0) break

    const sums = new Float64Array(K * 3)
    const counts = new Uint32Array(K)
    for (let i = 0; i < N; i++) {
      const k = labels[i]
      sums[k*3] += pixels[i*3]; sums[k*3+1] += pixels[i*3+1]; sums[k*3+2] += pixels[i*3+2]
      counts[k]++
    }
    for (let k = 0; k < K; k++) {
      if (counts[k] === 0) continue
      centers[k*3] = sums[k*3]/counts[k]
      centers[k*3+1] = sums[k*3+1]/counts[k]
      centers[k*3+2] = sums[k*3+2]/counts[k]
    }
  }
  return labels
}

function traceBoundaries(labels, W, H) {
  const out = new Uint8Array(W * H)
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x
    if (labels[i] !== labels[i-1] || labels[i] !== labels[i+1] ||
        labels[i] !== labels[i-W] || labels[i] !== labels[i+W]) out[i] = 1
  }
  return out
}

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

function dilate(edges, W, H) {
  const out = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x
    if (edges[i]) { out[i] = 1; continue }
    if (x > 0 && edges[i-1]) out[i] = 1
    else if (x < W-1 && edges[i+1]) out[i] = 1
    else if (y > 0 && edges[i-W]) out[i] = 1
    else if (y < H-1 && edges[i+W]) out[i] = 1
  }
  return out
}

async function edgesToPng(edges, W, H, outPath) {
  const out = new Jimp({ width: W, height: H, color: 0xFFFFFFFF })
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (edges[y*W+x]) out.setPixelColor(0x000000FF, x, y)
  }
  await out.write(outPath)
}

function potraceSvg(pngBuffer, { tol, turdSize, alphaMax }) {
  return new Promise((res, rej) => {
    potraceTrace(pngBuffer, {
      turdSize,
      turnPolicy: 'minority',
      alphaMax,
      optCurve: true,
      optTolerance: tol,
      threshold: 128,
      blackOnWhite: true,
      color: '#1A1A1A',
      background: 'transparent',
    }, (err, svg) => err ? rej(err) : res(svg))
  })
}

// ── Main ──
const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()

const tmpDir = join(__dirname, '..', '.tmp-sketches')
await mkdir(tmpDir, { recursive: true })

for (const file of files) {
  const name = basename(file, '.jpg')
  const cfg = PAINTING_CONFIG[name] || DEFAULT_CONFIG
  process.stdout.write(`${name} (K=${cfg.K})... `)
  try {
    // ── Preprocessing amb sharp: median filter (preserva vores!) ──
    const imgBuf = await readFile(join(SRC, file))
    const meta = await sharp(imgBuf).metadata()
    const ratio = MAX_DIM / Math.max(meta.width, meta.height)
    const W = ratio < 1 ? Math.round(meta.width * ratio) : meta.width
    const H = ratio < 1 ? Math.round(meta.height * ratio) : meta.height

    // Pipeline: resize → median filter (5x5) → raw bytes
    const { data, info } = await sharp(imgBuf)
      .resize(W, H)
      .median(5)
      .raw()
      .toBuffer({ resolveWithObject: true })

    const channels = info.channels  // 3 (RGB) o 4 (RGBA)

    // ── K-Means en espai Lab (perceptualment uniform) ──
    const pixels = new Float32Array(W * H * 3)
    for (let i = 0; i < W * H; i++) {
      const r = data[i * channels], g = data[i * channels + 1], b = data[i * channels + 2]
      const [L, a, bb] = rgbToLab(r, g, b)
      pixels[i*3] = L; pixels[i*3+1] = a; pixels[i*3+2] = bb
    }
    const labels = kmeans(pixels, cfg.K, KMEANS_ITER)

    // ── Traça vores + neteja + dilate ──
    let edges = traceBoundaries(labels, W, H)
    edges = removeSmall(edges, W, H, cfg.minSize)
    edges = dilate(edges, W, H)

    const bmpPath = join(tmpDir, `${name}.png`)
    await edgesToPng(edges, W, H, bmpPath)
    const pngBuf = await readFile(bmpPath)
    const svg = await potraceSvg(pngBuf, cfg)

    const cleaned = svg
      .replace(/<svg([^>]*) width="[^"]*"/, '<svg$1')
      .replace(/(<svg[^>]*) height="[^"]*"/, '$1')
      .replace(/<svg([^>]*)>/, `<svg$1 preserveAspectRatio="xMidYMid meet">`)

    await writeFile(join(OUT, `${name}.svg`), cleaned)
    console.log(`✓  (${W}×${H})`)
  } catch (e) {
    console.log(`✗  ${e.message}`)
  }
}

console.log(`\nSVGs generats a ${OUT}`)
