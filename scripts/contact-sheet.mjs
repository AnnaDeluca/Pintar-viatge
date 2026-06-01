// Genera una graella amb totes les imatges originals + nom
// per revisar visualment quins són pintures reals.
import { readdir, mkdir } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', '.edge-previews')
await mkdir(OUT, { recursive: true })

const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()

const TILE = 260
const PAD = 12
const LABEL_H = 28
const COLS = 4
const ROWS = Math.ceil(files.length / COLS)

const W = COLS * TILE + (COLS + 1) * PAD
const H = ROWS * (TILE + LABEL_H + PAD) + PAD

const composite = []

for (let i = 0; i < files.length; i++) {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  const x = PAD + col * (TILE + PAD)
  const y = PAD + row * (TILE + LABEL_H + PAD)
  const name = basename(files[i], '.jpg')

  // Imatge
  const buf = await sharp(join(SRC, files[i]))
    .resize(TILE, TILE, { fit: 'cover' })
    .png()
    .toBuffer()
  composite.push({ input: buf, left: x, top: y })

  // Etiqueta amb nom
  const labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${LABEL_H}">
    <rect width="100%" height="100%" fill="#23323E" />
    <text x="${TILE / 2}" y="19" font-family="Arial, sans-serif" font-size="14"
          font-weight="700" fill="white" text-anchor="middle">${name}</text>
  </svg>`
  composite.push({ input: Buffer.from(labelSvg), left: x, top: y + TILE })
}

await sharp({
  create: { width: W, height: H, channels: 4, background: { r: 251, g: 245, b: 233, alpha: 1 } },
})
  .composite(composite)
  .png()
  .toFile(join(OUT, 'contact_sheet.png'))

console.log(`Graella: ${join(OUT, 'contact_sheet.png')}`)
