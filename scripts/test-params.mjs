// Test diferents combinacions K + tolerance per a 6 quadres
// (4 problematics + 2 que ja funcionen com a control)
import { mkdir, writeFile, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Jimp } from 'jimp'
import potraceModule from 'potrace'
import sharp from 'sharp'
const { trace: potraceTrace } = potraceModule

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', '.edge-previews', 'params')
await mkdir(OUT, { recursive: true })

const MAX_DIM = 600

function kmeans(pixels, K, maxIter) {
  const N = pixels.length / 3
  const centers = new Float32Array(K * 3)
  // K-Means++ init
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
    const stack = [s], comp = []
    v[s] = 1
    while (stack.length) {
      const p = stack.pop(); comp.push(p)
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

function potraceSvg(pngBuffer, opts) {
  return new Promise((res, rej) => {
    potraceTrace(pngBuffer, opts, (err, svg) => err ? rej(err) : res(svg))
  })
}

// Configuracions a provar
const CONFIGS = [
  { name: 'K8_tol04_min40',  K: 8, tol: 0.4, minSize: 40, blur: 2 },  // ACTUAL
  { name: 'K6_tol06_min60',  K: 6, tol: 0.6, minSize: 60, blur: 3 },  // MES NET
  { name: 'K5_tol08_min80',  K: 5, tol: 0.8, minSize: 80, blur: 4 },  // MOLT NET
  { name: 'K6_tol04_min60',  K: 6, tol: 0.4, minSize: 60, blur: 2 },  // MITJA
]

// 4 problematics + 2 controls
const TEST_PAINTINGS = ['kandinsky', 'matisse', 'vangogh', 'sofonisba', 'vermeer', 'mondrian']

for (const name of TEST_PAINTINGS) {
  const img = await Jimp.read(join(SRC, `${name}.jpg`))
  const ratio = MAX_DIM / Math.max(img.width, img.height)
  if (ratio < 1) img.resize({ w: Math.round(img.width * ratio), h: Math.round(img.height * ratio) })
  const W = img.width, H = img.height

  for (const cfg of CONFIGS) {
    const blurred = img.clone().blur(cfg.blur)
    const d = new Uint8Array(blurred.bitmap.data.buffer, blurred.bitmap.data.byteOffset, blurred.bitmap.data.byteLength)
    const pixels = new Float32Array(W * H * 3)
    for (let i = 0; i < W * H; i++) {
      pixels[i*3] = d[i*4]; pixels[i*3+1] = d[i*4+1]; pixels[i*3+2] = d[i*4+2]
    }
    const labels = kmeans(pixels, cfg.K, 12)
    let edges = traceBoundaries(labels, W, H)
    edges = removeSmall(edges, W, H, cfg.minSize)
    edges = dilate(edges, W, H)
    const bmpPath = join(OUT, `${name}_${cfg.name}_bmp.png`)
    await edgesToPng(edges, W, H, bmpPath)
    const pngBuf = await readFile(bmpPath)
    const svg = await potraceSvg(pngBuf, {
      turdSize: 8, turnPolicy: 'minority', alphaMax: 1.0,
      optCurve: true, optTolerance: cfg.tol, threshold: 128,
      blackOnWhite: true, color: '#1A1A1A', background: '#FFFFFF',
    })
    await writeFile(join(OUT, `${name}_${cfg.name}.svg`), svg)
    // Render
    await sharp(Buffer.from(svg), { density: 200 })
      .resize(300, 300, { fit: 'contain', background: 'white' })
      .png().toFile(join(OUT, `${name}_${cfg.name}.png`))
  }
  console.log(`${name} ✓`)
}

// Genera grid
const TILE = 200
const PAD = 6
const LABEL_W = 80
const HEAD = 28
const COLS = CONFIGS.length
const W_TOT = LABEL_W + COLS * TILE + (COLS + 1) * PAD
const H_TOT = HEAD + TEST_PAINTINGS.length * (TILE + PAD) + PAD

const headSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W_TOT}" height="${HEAD}">
  <rect width="100%" height="100%" fill="#23323E" />
  ${CONFIGS.map((c, i) => `
    <text x="${LABEL_W + PAD + i * (TILE + PAD) + TILE / 2}" y="20" font-family="Arial" font-size="12"
          font-weight="800" fill="${i === 0 ? '#aaa' : '#FFD700'}" text-anchor="middle">${c.name}</text>
  `).join('')}
</svg>`

const composite = [{ input: Buffer.from(headSvg), left: 0, top: 0 }]

for (let i = 0; i < TEST_PAINTINGS.length; i++) {
  const name = TEST_PAINTINGS[i]
  const y = HEAD + i * (TILE + PAD) + PAD
  // Label nom
  const lbl = `<svg xmlns="http://www.w3.org/2000/svg" width="${LABEL_W}" height="${TILE}">
    <rect width="100%" height="100%" fill="#FBF5E9" />
    <text x="6" y="${TILE/2}" font-family="Arial" font-size="14" font-weight="800"
          fill="#23323E" dominant-baseline="middle">${name.toUpperCase()}</text>
  </svg>`
  composite.push({ input: Buffer.from(lbl), left: PAD, top: y })

  for (let c = 0; c < CONFIGS.length; c++) {
    const buf = await sharp(join(OUT, `${name}_${CONFIGS[c].name}.png`))
      .resize(TILE, TILE, { fit: 'contain', background: 'white' }).png().toBuffer()
    composite.push({ input: buf, left: LABEL_W + PAD * 2 + c * (TILE + PAD), top: y })
  }
}

await sharp({ create: { width: W_TOT, height: H_TOT, channels: 4, background: { r: 251, g: 245, b: 233, alpha: 1 } } })
  .composite(composite).png({ quality: 80 })
  .toFile(join(__dirname, '..', '.edge-previews', 'param_test.png'))

console.log(`Grid: .edge-previews/param_test.png`)
