// Genera els SVG de contorns de TOTS els quadres → public/sketches/{id}.svg
// Es fa una sola vegada (build time). El navegador només carrega l'SVG.

import { readdir, mkdir, writeFile, readFile } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { Jimp } from 'jimp'
import potraceModule from 'potrace'
const { trace: potraceTrace } = potraceModule

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', 'public', 'sketches')
await mkdir(OUT, { recursive: true })

const MAX_DIM = 600
const K = 8
const KMEANS_ITER = 12
const MIN_COMP_SIZE = 40

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

function potraceSvg(pngBuffer) {
  return new Promise((res, rej) => {
    potraceTrace(pngBuffer, {
      turdSize: 8,
      turnPolicy: 'minority',
      alphaMax: 1.0,
      optCurve: true,
      optTolerance: 0.4,
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
  process.stdout.write(`${name}... `)
  try {
    const img = await Jimp.read(join(SRC, file))
    const ratio = MAX_DIM / Math.max(img.width, img.height)
    if (ratio < 1) img.resize({ w: Math.round(img.width * ratio), h: Math.round(img.height * ratio) })
    const W = img.width, H = img.height
    const blurred = img.clone().blur(2)
    const d = new Uint8Array(blurred.bitmap.data.buffer, blurred.bitmap.data.byteOffset, blurred.bitmap.data.byteLength)

    const pixels = new Float32Array(W * H * 3)
    for (let i = 0; i < W * H; i++) {
      pixels[i*3] = d[i*4]; pixels[i*3+1] = d[i*4+1]; pixels[i*3+2] = d[i*4+2]
    }
    const labels = kmeans(pixels, K, KMEANS_ITER)
    let edges = traceBoundaries(labels, W, H)
    edges = removeSmall(edges, W, H, MIN_COMP_SIZE)
    edges = dilate(edges, W, H)

    const bmpPath = join(tmpDir, `${name}.png`)
    await edgesToPng(edges, W, H, bmpPath)
    const pngBuf = await readFile(bmpPath)
    const svg = await potraceSvg(pngBuf)

    // L'SVG de potrace té width/height — el deixem responsive
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
