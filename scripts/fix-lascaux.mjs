// Fix definitiu Lascaux: Sobel edge detection
// Detecta VORERES (transicions de clar a fosc) en lloc de zones fosques.
// Resultat: blanc + línies negres fines → compatible amb multiply blend.

import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings', 'lascaux.jpg')
const OUT = join(__dirname, '..', 'public', 'sketches', 'lascaux.png')
const MAX_DIM = 700

// ── 1. Carrega + grisos + blur lleuger (redueix soroll abans de Sobel) ─────
const { data: grayRaw, info } = await sharp(SRC)
  .resize(MAX_DIM, MAX_DIM, { fit: 'inside' })
  .greyscale()
  .blur(1.5)   // redueix soroll petita escala
  .raw()
  .toBuffer({ resolveWithObject: true })

const W = info.width, H = info.height, N = W * H
console.log(`Lascaux: ${W}×${H}`)
const gray = new Uint8Array(grayRaw)

// ── 2. Sobel: calcula magnitud del gradient ──────────────────────────────
// Kernels Sobel 3×3
const mag = new Float32Array(N)
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const i = y * W + x
    // Gx
    const gx = (
      -gray[i - W - 1] - 2 * gray[i - 1] - gray[i + W - 1]
      + gray[i - W + 1] + 2 * gray[i + 1] + gray[i + W + 1]
    )
    // Gy
    const gy = (
      -gray[i - W - 1] - 2 * gray[i - W] - gray[i - W + 1]
      + gray[i + W - 1] + 2 * gray[i + W] + gray[i + W + 1]
    )
    mag[i] = Math.sqrt(gx * gx + gy * gy)
  }
}

// Normalitza al rang 0-255
let maxMag = 0
for (let i = 0; i < N; i++) if (mag[i] > maxMag) maxMag = mag[i]
const norm = new Uint8Array(N)
for (let i = 0; i < N; i++) norm[i] = Math.round((mag[i] / maxMag) * 255)

// ── 3. Threshold de Sobel ─────────────────────────────────────────────────
// Prova per trobar ~ 8-12% de píxels negres
for (const T of [40, 50, 60, 70, 80]) {
  let dark = 0
  for (let i = 0; i < N; i++) if (norm[i] >= T) dark++
  process.stdout.write(`T=${T}: ${(dark/N*100).toFixed(1)}%  `)
}
console.log()

// T=80: línies primes i netes (~8.5% però augmentem amb dilatació mínima)
const THRESHOLD = 80

// ── 4. Guarda blanc + negre (sense dilatació — línies d'1px prou clares) ──
const result = Buffer.alloc(N * 3)
let dark = 0
for (let i = 0; i < N; i++) {
  const val = norm[i] >= THRESHOLD ? 0 : 255
  result[i * 3] = result[i * 3 + 1] = result[i * 3 + 2] = val
  if (val === 0) dark++
}

await sharp(result, { raw: { width: W, height: H, channels: 3 } })
  .png({ compressionLevel: 6 }).toFile(OUT)

// Verifica que no hi ha patró horitzontal
const rm = new Float32Array(H)
for (let y = 0; y < H; y++) {
  let s = 0
  for (let x = 0; x < W; x++) s += (result[(y * W + x) * 3] === 0 ? 1 : 0)
  rm[y] = s / W
}
const mean = rm.reduce((a, b) => a + b) / H
let v = 0, ac3 = 0
for (let y = 0; y < H; y++) v += (rm[y] - mean) ** 2
for (let y = 0; y < H - 3; y++) ac3 += (rm[y] - mean) * (rm[y + 3] - mean)

console.log(`✅ Guardat: ${OUT}`)
console.log(`Dark: ${(dark/N*100).toFixed(1)}%  Row std: ${Math.sqrt(v/H).toFixed(3)}  Autocorr3: ${(ac3/(H-3)).toFixed(1)}`)
