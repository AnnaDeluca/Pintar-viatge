// Grid de comparació: original | posterize (anterior) | K-Means+Potrace (nou)
// per a tots els 21 quadres. Genera .edge-previews/comparison_before_after.png

import { readdir, mkdir } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const SVG_DIR = join(__dirname, '..', 'public', 'sketches')
const POSTER_DIR = join(__dirname, '..', '.edge-previews', 'clean')  // N3_blur8_clean40
const OUT = join(__dirname, '..', '.edge-previews')
await mkdir(OUT, { recursive: true })

const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()

const TILE = 260
const PAD = 10
const LABEL_H = 24
const COLS = 3  // original | posterize | kmeans+potrace
const TITLES = ['ORIGINAL', 'ABANS (posterize)', 'ARA (K-Means + Potrace)']

const ROW_H = TILE + LABEL_H + PAD
const HEADER_H = 40

const W_TOT = COLS * TILE + (COLS + 1) * PAD
const H_TOT = HEADER_H + files.length * ROW_H + PAD

// Capçaleres SVG
const headerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W_TOT}" height="${HEADER_H}">
  <rect width="100%" height="100%" fill="#23323E" />
  ${TITLES.map((t, c) => `
    <text x="${PAD + c * (TILE + PAD) + TILE / 2}" y="26"
          font-family="Arial, sans-serif" font-size="14" font-weight="800"
          fill="white" text-anchor="middle">${t}</text>
  `).join('')}
</svg>`

const composite = [{ input: Buffer.from(headerSvg), left: 0, top: 0 }]

for (let i = 0; i < files.length; i++) {
  const name = basename(files[i], '.jpg')
  const y = HEADER_H + i * ROW_H
  const paintingName = name.toUpperCase()

  // Original
  try {
    const buf = await sharp(join(SRC, files[i]))
      .resize(TILE, TILE, { fit: 'contain', background: { r: 251, g: 245, b: 233 } })
      .png().toBuffer()
    composite.push({ input: buf, left: PAD, top: y })
  } catch (e) { console.warn(`orig ${name}: ${e.message}`) }

  // Posterize anterior (.edge-previews/clean/{name}_N3_blur8_clean40.png)
  try {
    const posterPath = join(POSTER_DIR, `${name}_N3_blur8_clean40.png`)
    const buf = await sharp(posterPath)
      .resize(TILE, TILE, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .png().toBuffer()
    composite.push({ input: buf, left: PAD + (TILE + PAD), top: y })
  } catch (e) { console.warn(`poster ${name}: ${e.message}`) }

  // K-Means + Potrace (renderitzar l'SVG via sharp)
  try {
    const svgPath = join(SVG_DIR, `${name}.svg`)
    const buf = await sharp(svgPath, { density: 200 })
      .resize(TILE, TILE, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .png().toBuffer()
    composite.push({ input: buf, left: PAD + 2 * (TILE + PAD), top: y })
  } catch (e) { console.warn(`svg ${name}: ${e.message}`) }

  // Label amb el nom
  const labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W_TOT - 2 * PAD}" height="${LABEL_H}">
    <rect width="100%" height="100%" fill="#FBF5E9" />
    <text x="14" y="17" font-family="Arial, sans-serif" font-size="13"
          font-weight="700" fill="#23323E">${paintingName}</text>
  </svg>`
  composite.push({ input: Buffer.from(labelSvg), left: PAD, top: y + TILE })
}

console.log(`Components: ${composite.length}`)
console.log(`Dimensions: ${W_TOT} x ${H_TOT}`)

await sharp({
  create: { width: W_TOT, height: H_TOT, channels: 4, background: { r: 251, g: 245, b: 233, alpha: 1 } },
})
  .composite(composite)
  .png()
  .toFile(join(OUT, 'comparison_before_after.png'))

console.log(`Grid: ${join(OUT, 'comparison_before_after.png')}`)
