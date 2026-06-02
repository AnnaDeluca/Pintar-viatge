import { readdir } from 'fs/promises'
import { join, basename } from 'path'
import sharp from 'sharp'

const SRC = 'public/paintings'
const SVG_DIR = 'public/sketches'
const POSTER_DIR = '.edge-previews/clean'

const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()

const TILE = 200
const PAD = 8
const LABEL_H = 22
const HEAD = 32
const COLS = 3
const ROWS_PER_PAGE = 7

const ROW_H = TILE + LABEL_H + PAD
const W = COLS * TILE + (COLS + 1) * PAD

const headSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${HEAD}">
  <rect width="100%" height="100%" fill="#23323E" />
  <text x="${PAD + TILE / 2}" y="22" font-family="Arial" font-size="13" font-weight="800" fill="white" text-anchor="middle">ORIGINAL</text>
  <text x="${PAD * 2 + TILE + TILE / 2}" y="22" font-family="Arial" font-size="13" font-weight="800" fill="#aaa" text-anchor="middle">ABANS (POSTERIZE)</text>
  <text x="${PAD * 3 + TILE * 2 + TILE / 2}" y="22" font-family="Arial" font-size="13" font-weight="800" fill="#FFD700" text-anchor="middle">ARA (NOU)</text>
</svg>`

let pageNum = 1
for (let pStart = 0; pStart < files.length; pStart += ROWS_PER_PAGE) {
  const pEnd = Math.min(pStart + ROWS_PER_PAGE, files.length)
  const rows = pEnd - pStart
  const H = HEAD + rows * ROW_H + PAD
  const composite = [{ input: Buffer.from(headSvg), left: 0, top: 0 }]

  for (let i = 0; i < rows; i++) {
    const name = basename(files[pStart + i], '.jpg')
    const y = HEAD + i * ROW_H

    try {
      const b = await sharp(join(SRC, files[pStart + i]))
        .resize(TILE, TILE, { fit: 'contain', background: { r: 251, g: 245, b: 233 } }).png().toBuffer()
      composite.push({ input: b, left: PAD, top: y })
    } catch {}
    try {
      const b = await sharp(join(POSTER_DIR, `${name}_N3_blur8_clean40.png`))
        .resize(TILE, TILE, { fit: 'contain', background: 'white' }).png().toBuffer()
      composite.push({ input: b, left: PAD * 2 + TILE, top: y })
    } catch {}
    try {
      const b = await sharp(join(SVG_DIR, `${name}.svg`), { density: 200 })
        .resize(TILE, TILE, { fit: 'contain', background: 'white' }).png().toBuffer()
      composite.push({ input: b, left: PAD * 3 + TILE * 2, top: y })
    } catch {}

    const labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W - 2 * PAD}" height="${LABEL_H}">
      <rect width="100%" height="100%" fill="#FBF5E9" />
      <text x="10" y="16" font-family="Arial" font-size="13" font-weight="700" fill="#23323E">${name.toUpperCase()}</text>
    </svg>`
    composite.push({ input: Buffer.from(labelSvg), left: PAD, top: y + TILE })
  }

  const outPath = `.edge-previews/compare_p${pageNum}.png`
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 251, g: 245, b: 233, alpha: 1 } } })
    .composite(composite).png({ quality: 80 }).toFile(outPath)
  console.log(`Pagina ${pageNum}: ${outPath}`)
  pageNum++
}
