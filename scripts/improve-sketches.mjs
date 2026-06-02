// Prova millores a l'algoritme actual:
//   1. MEDIAN FILTER preprocessing (preserva vores, elimina soroll)
//   2. K-Means en espai Lab (millor percepció humana)
//   3. Potrace amb optTolerance més alt (línies més suaus)
//   4. turdSize més gran (elimina detall espuri)
//
// Genera variants a .edge-previews/improved/ per comparar amb actuals.

import { readdir, mkdir, writeFile, readFile } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { Jimp } from 'jimp'
import potraceModule from 'potrace'
import sharp from 'sharp'
const { trace: potraceTrace } = potraceModule

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', '.edge-previews', 'improved')
await mkdir(OUT, { recursive: true })

const MAX_DIM = 600

// ── RGB → Lab (perception-uniform) ─────────────────────────────
function rgbToLab(r, g, b) {
  // sRGB → linear
  r /= 255; g /= 255; b /= 255
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92
  // linear RGB → XYZ (D65)
  let X = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
  let Y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.00000
  let Z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883
  // XYZ → Lab
  const f = t => t > 0.008856 ? Math.pow(t, 1/3) : 7.787 * t + 16/116
  const L = 116 * f(Y) - 16
  const a = 500 * (f(X) - f(Y))
  const bb = 200 * (f(Y) - f(Z))
  return [L, a, bb]
}

// ── K-Means en Lab ─────────────────────────────────────────────
function kmeansLab(pixels, K, maxIter) {
  // pixels: Float32Array de [L,a,b,L,a,b,...]
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
      const l = pixels[i*3], a = pixels[i*3+1], b = pixels[i*3+2]
      for (let kk = 0; kk < k; kk++) {
        const dl = l - centers[kk*3], da = a - centers[kk*3+1], db = b - centers[kk*3+2]
        const d = dl*dl + da*da + db*db
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
      const l = pixels[i*3], a = pixels[i*3+1], b = pixels[i*3+2]
      let best = 0, bestD = Infinity
      for (let k = 0; k < K; k++) {
        const dl = l - centers[k*3], da = a - centers[k*3+1], db = b - centers[k*3+2]
        const d = dl*dl + da*da + db*db
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

// ── Config — paint per cada quadre amb 3 estils per comparar ───
const TEST_PAINTINGS = ['kandinsky', 'matisse', 'vangogh', 'sofonisba', 'vermeer', 'mondrian', 'hokusai', 'sargent']

// Configs a provar (totes amb median filter + Lab)
const CONFIGS = [
  // CURRENT — el que ja tenim (per a comparació)
  { name: 'CURRENT', median: false, lab: false, K: 7, tol: 0.5, minSize: 50, turdSize: 8, alphaMax: 1.0 },
  // Median filter + Lab + Potrace més suau
  { name: 'MED_LAB_SMOOTH', median: true, lab: true, K: 6, tol: 1.0, minSize: 80, turdSize: 14, alphaMax: 1.33 },
  // Median + Lab + més detall
  { name: 'MED_LAB_DETAIL', median: true, lab: true, K: 8, tol: 0.6, minSize: 60, turdSize: 10, alphaMax: 1.2 },
  // Median + Lab + molt simplificat
  { name: 'MED_LAB_MINIMAL', median: true, lab: true, K: 5, tol: 1.2, minSize: 100, turdSize: 18, alphaMax: 1.34 },
]

console.log('Provant ' + CONFIGS.length + ' configs sobre ' + TEST_PAINTINGS.length + ' quadres...\n')

for (const name of TEST_PAINTINGS) {
  for (const cfg of CONFIGS) {
    try {
      // Carrega imatge
      let imgBuf = await readFile(join(SRC, name + '.jpg'))
      let sharpImg = sharp(imgBuf)

      // Redueix a MAX_DIM
      const meta = await sharpImg.metadata()
      const ratio = MAX_DIM / Math.max(meta.width, meta.height)
      if (ratio < 1) {
        sharpImg = sharpImg.resize(Math.round(meta.width * ratio), Math.round(meta.height * ratio))
      }

      // Median filter (millor que blur — preserva vores!)
      if (cfg.median) {
        sharpImg = sharpImg.median(5)  // size 5x5 median
      } else {
        // Equivalent: blur lleuger
        sharpImg = sharpImg.blur(2)
      }

      const { data, info } = await sharpImg.raw().toBuffer({ resolveWithObject: true })
      const W = info.width, H = info.height
      const channels = info.channels  // 3 o 4

      // Construir array de píxels (Lab o RGB)
      const pixels = new Float32Array(W * H * 3)
      for (let i = 0; i < W * H; i++) {
        const r = data[i * channels], g = data[i * channels + 1], b = data[i * channels + 2]
        if (cfg.lab) {
          const [L, a, bb] = rgbToLab(r, g, b)
          pixels[i*3] = L; pixels[i*3+1] = a; pixels[i*3+2] = bb
        } else {
          pixels[i*3] = r; pixels[i*3+1] = g; pixels[i*3+2] = b
        }
      }

      const labels = kmeansLab(pixels, cfg.K, 15)
      let edges = traceBoundaries(labels, W, H)
      edges = removeSmall(edges, W, H, cfg.minSize)
      edges = dilate(edges, W, H)

      // Bitmap intermedi
      const bmpPath = join(OUT, `${name}_${cfg.name}_bmp.png`)
      await edgesToPng(edges, W, H, bmpPath)

      // Potrace vectorització
      const pngBuf = await readFile(bmpPath)
      const svg = await potraceSvg(pngBuf, {
        turdSize: cfg.turdSize,
        turnPolicy: 'minority',
        alphaMax: cfg.alphaMax,
        optCurve: true,
        optTolerance: cfg.tol,
        threshold: 128,
        blackOnWhite: true,
        color: '#1A1A1A',
        background: '#FFFFFF',
      })
      await writeFile(join(OUT, `${name}_${cfg.name}.svg`), svg)
      // Render
      await sharp(Buffer.from(svg), { density: 200 })
        .resize(300, 300, { fit: 'contain', background: 'white' })
        .png().toFile(join(OUT, `${name}_${cfg.name}.png`))
    } catch (e) {
      console.log(`  ${name}/${cfg.name}: ${e.message}`)
    }
  }
  console.log(`${name} ✓`)
}

// Grid de comparació
const TILE = 220
const PAD = 6
const LABEL_W = 90
const HEAD = 28
const W_TOT = LABEL_W + CONFIGS.length * TILE + (CONFIGS.length + 1) * PAD
const H_TOT = HEAD + TEST_PAINTINGS.length * (TILE + PAD) + PAD

const headSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W_TOT}" height="${HEAD}">
  <rect width="100%" height="100%" fill="#23323E" />
  ${CONFIGS.map((c, i) => `
    <text x="${LABEL_W + PAD + i * (TILE + PAD) + TILE / 2}" y="20" font-family="Arial" font-size="11"
          font-weight="800" fill="${i === 0 ? '#aaa' : '#FFD700'}" text-anchor="middle">${c.name}</text>
  `).join('')}
</svg>`

const composite = [{ input: Buffer.from(headSvg), left: 0, top: 0 }]

for (let i = 0; i < TEST_PAINTINGS.length; i++) {
  const n = TEST_PAINTINGS[i]
  const y = HEAD + i * (TILE + PAD) + PAD
  const lbl = `<svg xmlns="http://www.w3.org/2000/svg" width="${LABEL_W}" height="${TILE}">
    <rect width="100%" height="100%" fill="#FBF5E9" />
    <text x="6" y="${TILE/2}" font-family="Arial" font-size="13" font-weight="800"
          fill="#23323E" dominant-baseline="middle">${n.toUpperCase()}</text>
  </svg>`
  composite.push({ input: Buffer.from(lbl), left: PAD, top: y })
  for (let c = 0; c < CONFIGS.length; c++) {
    try {
      const buf = await sharp(join(OUT, `${n}_${CONFIGS[c].name}.png`))
        .resize(TILE, TILE, { fit: 'contain', background: 'white' }).png().toBuffer()
      composite.push({ input: buf, left: LABEL_W + PAD * 2 + c * (TILE + PAD), top: y })
    } catch {}
  }
}

await sharp({ create: { width: W_TOT, height: H_TOT, channels: 4, background: { r: 251, g: 245, b: 233, alpha: 1 } } })
  .composite(composite).png({ quality: 80 })
  .toFile(join(__dirname, '..', '.edge-previews', 'improved_grid.png'))

console.log(`\nGrid: .edge-previews/improved_grid.png`)
