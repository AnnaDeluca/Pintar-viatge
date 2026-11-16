// Regenerate all PNG sketches using Sobel edge detection.
// Sobel detects EDGE TRANSITIONS — immune to absolute luminosity → no horizontal banding.
// Auto-tunes threshold per painting to hit target black pixel range.

import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PAINTINGS_DIR = join(__dirname, '..', 'public', 'paintings')
const SKETCHES_DIR  = join(__dirname, '..', 'public', 'sketches')
const MAX_DIM = 700
const TARGET_MIN = 0.06  // 6% black pixels minimum
const TARGET_MAX = 0.14  // 14% black pixels maximum

// Quadres a no tocar encara que tinguin PNG (cap ara mateix; els que no
// tenen sketch PNG ja se salten sols).
// Sketches IA fets a mà (Gemini) — NO sobreescriure amb Sobel.
// Workflow: README § "Sketches amb IA".
const SKIP = new Set(['botticelli', 'artemisia'])

// Ajustos per quadre:
//   blur      — més alt elimina textura fina (roca, pa d'or) i deixa els contorns grans
//   targetMax — més baix = menys línies
//   minComp   — mida mínima (px) d'un tros de línia; més petit s'esborra (anti-puntets)
//   dilate    — engruixeix les línies N px (per a quadres geomètrics de línia fina)
const OVERRIDES = {
  lascaux:    { blur: 4, targetMax: 0.10 },
  klimt:      { blur: 4, targetMax: 0.10 },  // la textura daurada es menja la parella
  kandinsky:  { blur: 2.5 },
  sofonisba:  { blur: 2 },
  hokusai:    { blur: 2 },
  homer:      { blur: 2 },
  munch:      { blur: 2 },
  doesburg:   { blur: 1, dilate: 1 },        // geomètric: vores nítides i gruixudes
}

// Esborra components connexos de menys de minSize px (puntets que no es poden pintar)
function despeckle(bin, W, H, minSize) {
  const N = W * H
  const lab = new Int32Array(N).fill(-1)
  const queue = new Int32Array(N)
  const comps = []
  for (let s = 0; s < N; s++) {
    if (!bin[s] || lab[s] >= 0) continue
    const L = comps.length
    let head = 0, tail = 0
    queue[tail++] = s; lab[s] = L
    const members = []
    while (head < tail) {
      const i = queue[head++]
      members.push(i)
      const x = i % W, y = (i / W) | 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        const j = ny * W + nx
        if (bin[j] && lab[j] < 0) { lab[j] = L; queue[tail++] = j }
      }
    }
    comps.push(members)
  }
  for (const members of comps) {
    if (members.length < minSize) for (const i of members) bin[i] = 0
  }
}

// Engruixeix les línies: cada píxel negre contagia els 8 veïns, n passades
function dilate(bin, W, H, n) {
  for (let pass = 0; pass < n; pass++) {
    const src = bin.slice()
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (src[y * W + x]) continue
      let on = false
      for (let dy = -1; dy <= 1 && !on; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        if (src[ny * W + nx]) { on = true; break }
      }
      if (on) bin[y * W + x] = 1
    }
  }
}

async function sobelSketch(src, { blur = 1.5, targetMin = TARGET_MIN, targetMax = TARGET_MAX, minComp = 24, dilate: dilateN = 0, colorEdges = false } = {}) {
  let pipe = sharp(src).resize(MAX_DIM, MAX_DIM, { fit: 'inside' })
  if (!colorEdges) pipe = pipe.greyscale()
  const { data: raw, info } = await pipe
    .blur(blur)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const W = info.width, H = info.height, N = W * H
  const CH = info.channels  // 1 (gris) o 3 (colorEdges)
  const px = new Uint8Array(raw)

  // Sobel per canal; la magnitud final és el màxim dels canals. Amb colorEdges
  // detecta vores de color que tenen la mateixa lluminositat (ex: pell vs cel
  // a Botticelli), invisibles per al Sobel en escala de grisos.
  const mag = new Float32Array(N)
  const R = W * CH
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      let best = 0
      for (let c = 0; c < CH; c++) {
        const k = i * CH + c
        const gx = (
          -px[k - R - CH] - 2 * px[k - CH] - px[k + R - CH]
          + px[k - R + CH] + 2 * px[k + CH] + px[k + R + CH]
        )
        const gy = (
          -px[k - R - CH] - 2 * px[k - R] - px[k - R + CH]
          + px[k + R - CH] + 2 * px[k + R] + px[k + R + CH]
        )
        const m = Math.sqrt(gx * gx + gy * gy)
        if (m > best) best = m
      }
      mag[i] = best
    }
  }

  let maxMag = 0
  for (let i = 0; i < N; i++) if (mag[i] > maxMag) maxMag = mag[i]
  const norm = new Uint8Array(N)
  for (let i = 0; i < N; i++) norm[i] = Math.round((mag[i] / maxMag) * 255)

  // Auto-tune threshold to hit target black pixel range
  let bestT = 80
  let bestScore = Infinity
  for (const T of [5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]) {
    let dark = 0
    for (let i = 0; i < N; i++) if (norm[i] >= T) dark++
    const pct = dark / N
    if (pct >= targetMin && pct <= targetMax) {
      bestT = T
      bestScore = 0
      break
    }
    const score = Math.min(Math.abs(pct - targetMin), Math.abs(pct - targetMax))
    if (score < bestScore) { bestScore = score; bestT = T }
  }

  // Binaritza + neteja puntets + (opcional) engruixeix
  const bin = new Uint8Array(N)
  for (let i = 0; i < N; i++) bin[i] = norm[i] >= bestT ? 1 : 0
  if (minComp > 0) despeckle(bin, W, H, minComp)
  if (dilateN > 0) dilate(bin, W, H, dilateN)

  // Render
  const result = Buffer.alloc(N * 3)
  let dark = 0
  for (let i = 0; i < N; i++) {
    const val = bin[i] ? 0 : 255
    result[i * 3] = result[i * 3 + 1] = result[i * 3 + 2] = val
    if (val === 0) dark++
  }

  return { result, W, H, N, dark, T: bestT }
}

// Process all paintings that have a PNG sketch.
// Usage: node scripts/regenerate-sketches.mjs [nom1 nom2 ...] per regenerar només alguns.
const only = new Set(process.argv.slice(2))
const paintings = readdirSync(PAINTINGS_DIR)
  .filter(f => f.endsWith('.jpg') && !f.includes('-thumb'))
  .map(f => f.replace('.jpg', ''))
  .filter(name => only.size === 0 || only.has(name))

let ok = 0, skipped = 0, errors = 0

for (const name of paintings) {
  if (SKIP.has(name)) {
    process.stdout.write(`  skip  ${name}\n`)
    skipped++
    continue
  }

  const sketchPath = join(SKETCHES_DIR, `${name}.png`)
  if (!existsSync(sketchPath)) {
    process.stdout.write(`  no-png ${name}\n`)
    skipped++
    continue
  }

  const src = join(PAINTINGS_DIR, `${name}.jpg`)
  try {
    const { result, W, H, N, dark, T } = await sobelSketch(src, OVERRIDES[name])
    await sharp(result, { raw: { width: W, height: H, channels: 3 } })
      .png({ compressionLevel: 6 })
      .toFile(sketchPath)
    const pct = (dark / N * 100).toFixed(1)
    process.stdout.write(`  ✅ ${name.padEnd(20)} ${W}×${H}  T=${T}  ${pct}% black\n`)
    ok++
  } catch (e) {
    process.stdout.write(`  ❌ ${name}: ${e.message}\n`)
    errors++
  }
}

console.log(`\nDone: ${ok} regenerated, ${skipped} skipped, ${errors} errors`)
