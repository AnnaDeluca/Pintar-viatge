// Extrem: blur fort + N=2 + neteja components petits + smoothing
import { readdir, mkdir } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { Jimp } from 'jimp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', '.edge-previews', 'clean')
await mkdir(OUT, { recursive: true })

const MAX_DIM = 500

function luma(d, i) { return (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8 }
function lumaImg(d, W, H) { const L = new Float32Array(W*H); for (let i = 0; i < W*H; i++) L[i] = luma(d, i*4); return L }

function posterizeAdaptive(L, W, H, N) {
  const s = Float32Array.from(L).sort()
  const lo = s[Math.floor(s.length * 0.02)]
  const hi = s[Math.floor(s.length * 0.98)]
  const range = Math.max(1, hi - lo)
  const Q = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const n = Math.max(0, Math.min(1, (L[i] - lo) / range))
    Q[i] = Math.floor(n * N * 0.9999)
  }
  return Q
}

function trace(Q, W, H) {
  const out = new Uint8Array(W * H)
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x
    if (Q[i] !== Q[i-1] || Q[i] !== Q[i+1] || Q[i] !== Q[i-W] || Q[i] !== Q[i+W]) out[i] = 1
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

async function toPng(edges, W, H, path) {
  const out = new Jimp({ width: W, height: H, color: 0xFFFFFFFF })
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (edges[y*W+x]) out.setPixelColor(0x000000FF, x, y)
  await out.write(path)
}

const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()

// Diverses combinacions agressives
const CONFIGS = [
  { name: 'N2_blur10_clean30',  N: 2, blur: 10, minSize: 30 },
  { name: 'N2_blur15_clean50',  N: 2, blur: 15, minSize: 50 },
  { name: 'N3_blur8_clean40',   N: 3, blur: 8,  minSize: 40 },
  { name: 'N2_blur8_clean25',   N: 2, blur: 8,  minSize: 25 },
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
    const L = lumaImg(d, W, H)
    const Q = posterizeAdaptive(L, W, H, cfg.N)
    let edges = trace(Q, W, H)
    edges = removeSmall(edges, W, H, cfg.minSize)
    await toPng(edges, W, H, join(OUT, `${name}_${cfg.name}.png`))
  }
  console.log(`${name} ✓`)
}
console.log(OUT)
