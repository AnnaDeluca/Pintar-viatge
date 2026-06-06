// Fix Lascaux: elimina el patró periòdic de 3 files
// Tècnica: calcula la mitja per cada fase (y % 3) i la normalitza

import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings', 'lascaux.jpg')
const OUT = join(__dirname, '..', 'public', 'sketches', 'lascaux.png')
const MAX_DIM = 700
const SIGMA = 18

const { data: grayRaw, info } = await sharp(SRC)
  .resize(MAX_DIM, MAX_DIM, { fit: 'inside' })
  .greyscale().raw().toBuffer({ resolveWithObject: true })

const W = info.width, H = info.height, N = W * H
console.log(`Lascaux: ${W}×${H}`)

// Normalitza les files estàndard (tendència de llarg abast)
function destripeRows(src, W, H, smoothR) {
  const N = W * H
  let gs = 0; for (let i = 0; i < N; i++) gs += src[i]
  const gm = gs / N
  const rm = new Float32Array(H)
  for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) s += src[y * W + x]; rm[y] = s / W }
  const sr = new Float32Array(H)
  for (let y = 0; y < H; y++) {
    let s = 0, cnt = 0
    for (let d = -smoothR; d <= smoothR; d++) { const ny = y + d; if (ny >= 0 && ny < H) { s += rm[ny]; cnt++ } }
    sr[y] = s / cnt
  }
  const out = new Uint8Array(N)
  for (let y = 0; y < H; y++) {
    const corr = gm - sr[y]
    for (let x = 0; x < W; x++) out[y * W + x] = Math.max(0, Math.min(255, Math.round(src[y * W + x] + corr)))
  }
  return out
}

// Elimina el patró periòdic de PERIOD files
// Totes les files y % PERIOD == k haurien de tenir la mateixa mitja
function removePeriodicBanding(src, W, H, period) {
  const N = W * H
  // Mitja global
  let gs = 0; for (let i = 0; i < N; i++) gs += src[i]
  const gm = gs / N
  // Mitja per cada fase
  const phaseSum = new Float64Array(period)
  const phaseCnt = new Int32Array(period)
  const rm = new Float32Array(H)
  for (let y = 0; y < H; y++) {
    let s = 0; for (let x = 0; x < W; x++) s += src[y * W + x]
    rm[y] = s / W
    phaseSum[y % period] += rm[y]
    phaseCnt[y % period]++
  }
  const phaseMean = phaseSum.map((s, i) => s / phaseCnt[i])
  console.log('  Phase means:', [...phaseMean].map(v => v.toFixed(1)).join(', '), '  Global mean:', gm.toFixed(1))
  const out = new Uint8Array(N)
  for (let y = 0; y < H; y++) {
    const corr = gm - phaseMean[y % period]
    for (let x = 0; x < W; x++) out[y * W + x] = Math.max(0, Math.min(255, Math.round(src[y * W + x] + corr)))
  }
  return out
}

function rowVariance(buf, W, H) {
  const rm = new Float32Array(H)
  for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) s += buf[y * W + x]; rm[y] = s / W }
  const mean = rm.reduce((a, b) => a + b) / H
  let v = 0; for (let y = 0; y < H; y++) v += (rm[y] - mean) ** 2
  return Math.sqrt(v / H)
}

function autocorr3(buf, W, H) {
  const rm = new Float32Array(H)
  for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) s += buf[y * W + x]; rm[y] = s / W }
  const mean = rm.reduce((a, b) => a + b) / H
  let c = 0, cnt = 0
  for (let y = 0; y < H - 3; y++) { c += (rm[y] - mean) * (rm[y + 3] - mean); cnt++ }
  return c / cnt
}

const gray = new Uint8Array(grayRaw)
console.log('Font std:', rowVariance(gray, W, H).toFixed(2), 'autocorr3:', autocorr3(gray, W, H).toFixed(1))

// 1. Destripe estàndard (tendència de llarg abast)
const ds1 = destripeRows(gray, W, H, 5)
console.log('Post-destripe1 std:', rowVariance(ds1, W, H).toFixed(2), 'autocorr3:', autocorr3(ds1, W, H).toFixed(1))

// 2. Elimina patró periòdic de 3 files
console.log('Eliminant patró de 3 files:')
const ds2 = removePeriodicBanding(ds1, W, H, 3)
console.log('Post-deperiodic std:', rowVariance(ds2, W, H).toFixed(2), 'autocorr3:', autocorr3(ds2, W, H).toFixed(1))

// 3. Color Dodge
const invBuf = Buffer.alloc(N)
for (let i = 0; i < N; i++) invBuf[i] = 255 - ds2[i]
const blurBuf = await sharp(invBuf, { raw: { width: W, height: H, channels: 1 } }).blur(SIGMA).raw().toBuffer()
const blurred = new Uint8Array(blurBuf)
const dodge = new Uint8Array(N)
for (let i = 0; i < N; i++) {
  const g = ds2[i], b = blurred[i]
  dodge[i] = b >= 254 ? 255 : Math.min(255, Math.round(g * 255 / (255 - b)))
}
console.log('Color Dodge std:', rowVariance(dodge, W, H).toFixed(2), 'autocorr3:', autocorr3(dodge, W, H).toFixed(1))

// 4. Elimina patró periòdic al resultat Color Dodge
console.log('Eliminant patró de 3 files al resultat:')
const final = removePeriodicBanding(dodge, W, H, 3)
console.log('Final std:', rowVariance(final, W, H).toFixed(2), 'autocorr3:', autocorr3(final, W, H).toFixed(1))

// Guarda
const result = Buffer.alloc(N * 3)
let dark = 0
for (let i = 0; i < N; i++) {
  const v = final[i]
  result[i * 3] = result[i * 3 + 1] = result[i * 3 + 2] = v
  if (v < 128) dark++
}
await sharp(result, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 6 }).toFile(OUT)
console.log(`✅ Guardat: ${OUT}`)
console.log(`Dark (<128): ${(dark/N*100).toFixed(1)}%`)
