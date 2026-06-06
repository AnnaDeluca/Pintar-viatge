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

// Skip list: paintings that already have good SVG-only sketches or no PNG needed
const SKIP = new Set(['abaporu', 'basquiat', 'lichtenstein', 'okeeffe', 'popart', 'tessellation'])
// Already fixed with Sobel manually
const ALREADY_DONE = new Set(['lascaux'])

async function sobelSketch(src, targetMin = TARGET_MIN, targetMax = TARGET_MAX) {
  const { data: grayRaw, info } = await sharp(src)
    .resize(MAX_DIM, MAX_DIM, { fit: 'inside' })
    .greyscale()
    .blur(1.5)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const W = info.width, H = info.height, N = W * H
  const gray = new Uint8Array(grayRaw)

  // Sobel gradient magnitude
  const mag = new Float32Array(N)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      const gx = (
        -gray[i - W - 1] - 2 * gray[i - 1] - gray[i + W - 1]
        + gray[i - W + 1] + 2 * gray[i + 1] + gray[i + W + 1]
      )
      const gy = (
        -gray[i - W - 1] - 2 * gray[i - W] - gray[i - W + 1]
        + gray[i + W - 1] + 2 * gray[i + W] + gray[i + W + 1]
      )
      mag[i] = Math.sqrt(gx * gx + gy * gy)
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

  // Render
  const result = Buffer.alloc(N * 3)
  let dark = 0
  for (let i = 0; i < N; i++) {
    const val = norm[i] >= bestT ? 0 : 255
    result[i * 3] = result[i * 3 + 1] = result[i * 3 + 2] = val
    if (val === 0) dark++
  }

  return { result, W, H, N, dark, T: bestT }
}

// Process all paintings that have a PNG sketch
const paintings = readdirSync(PAINTINGS_DIR)
  .filter(f => f.endsWith('.jpg') && !f.includes('-thumb'))
  .map(f => f.replace('.jpg', ''))

let ok = 0, skipped = 0, errors = 0

for (const name of paintings) {
  if (SKIP.has(name) || ALREADY_DONE.has(name)) {
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
    const { result, W, H, N, dark, T } = await sobelSketch(src)
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
