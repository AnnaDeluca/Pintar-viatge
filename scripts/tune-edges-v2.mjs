// Prova combinacions per eliminar les línies paral·leles (isobands)
//  - N petit (3-4 nivells)
//  - Skeletonització (línies de 1px)
//  - Sobel només (sharp edges) com a control

import { readdir, mkdir } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { Jimp } from 'jimp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', '.edge-previews', 'v2')
await mkdir(OUT, { recursive: true })

const MAX_DIM = 500

function luma(d, i) { return (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8 }
function lumaImage(d, W, H) {
  const L = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) L[i] = luma(d, i * 4)
  return L
}

// Posterize adaptatiu
function posterize(L, W, H, N) {
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

function traceBoundaries(Q, W, H) {
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

// Zhang-Suen thinning: redueix qualsevol forma a 1px de gruix
// Iteratiu: cada pas elimina píxels redundants fins que no hi ha més canvis.
function thinZhangSuen(edges, W, H) {
  const data = new Uint8Array(edges) // 0 = blanc, 1 = negre
  let changed = true
  const toRemove = []
  while (changed) {
    changed = false
    // Subiteració 1
    toRemove.length = 0
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x
        if (!data[i]) continue
        const p2 = data[i - W], p3 = data[i - W + 1], p4 = data[i + 1], p5 = data[i + W + 1]
        const p6 = data[i + W], p7 = data[i + W - 1], p8 = data[i - 1], p9 = data[i - W - 1]
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
        if (B < 2 || B > 6) continue
        let A = 0
        if (p2 === 0 && p3 === 1) A++
        if (p3 === 0 && p4 === 1) A++
        if (p4 === 0 && p5 === 1) A++
        if (p5 === 0 && p6 === 1) A++
        if (p6 === 0 && p7 === 1) A++
        if (p7 === 0 && p8 === 1) A++
        if (p8 === 0 && p9 === 1) A++
        if (p9 === 0 && p2 === 1) A++
        if (A !== 1) continue
        if (p2 * p4 * p6 !== 0) continue
        if (p4 * p6 * p8 !== 0) continue
        toRemove.push(i)
      }
    }
    if (toRemove.length) { changed = true; for (const i of toRemove) data[i] = 0 }
    // Subiteració 2
    toRemove.length = 0
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x
        if (!data[i]) continue
        const p2 = data[i - W], p3 = data[i - W + 1], p4 = data[i + 1], p5 = data[i + W + 1]
        const p6 = data[i + W], p7 = data[i + W - 1], p8 = data[i - 1], p9 = data[i - W - 1]
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
        if (B < 2 || B > 6) continue
        let A = 0
        if (p2 === 0 && p3 === 1) A++
        if (p3 === 0 && p4 === 1) A++
        if (p4 === 0 && p5 === 1) A++
        if (p5 === 0 && p6 === 1) A++
        if (p6 === 0 && p7 === 1) A++
        if (p7 === 0 && p8 === 1) A++
        if (p8 === 0 && p9 === 1) A++
        if (p9 === 0 && p2 === 1) A++
        if (A !== 1) continue
        if (p2 * p4 * p8 !== 0) continue
        if (p2 * p6 * p8 !== 0) continue
        toRemove.push(i)
      }
    }
    if (toRemove.length) { changed = true; for (const i of toRemove) data[i] = 0 }
  }
  return data
}

// Elimina petits components connectats (soroll)
function removeSmallComponents(edges, W, H, minSize) {
  const data = new Uint8Array(edges)
  const visited = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const start = y * W + x
      if (!data[start] || visited[start]) continue
      // BFS per trobar el component
      const stack = [start]
      const comp = []
      visited[start] = 1
      while (stack.length) {
        const p = stack.pop()
        comp.push(p)
        const px = p % W, py = (p - px) / W
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const nx = px + dx, ny = py + dy
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
          const n = ny * W + nx
          if (data[n] && !visited[n]) { visited[n] = 1; stack.push(n) }
        }
      }
      if (comp.length < minSize) {
        for (const p of comp) data[p] = 0
      }
    }
  }
  return data
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

// Configs
const CONFIGS = [
  // N petit: menys línies paral·leles
  { name: 'N3_blur5',        N: 3, blur: 5, skel: false, deNoise: 8 },
  { name: 'N4_blur5',        N: 4, blur: 5, skel: false, deNoise: 8 },
  // Skeletonitzat
  { name: 'N5_blur4_skel',   N: 5, blur: 4, skel: true,  deNoise: 8 },
  { name: 'N4_blur5_skel',   N: 4, blur: 5, skel: true,  deNoise: 12 },
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
    const Q = posterize(L, W, H, cfg.N)
    let edges = traceBoundaries(Q, W, H)
    if (cfg.skel) edges = thinZhangSuen(edges, W, H)
    if (cfg.deNoise) edges = removeSmallComponents(edges, W, H, cfg.deNoise)
    await edgesToPng(edges, W, H, join(OUT, `${name}_${cfg.name}.png`))
  }
  console.log(`${name} ✓`)
}

console.log(`\nResultats: ${OUT}`)
