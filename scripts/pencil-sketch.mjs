// Pencil Sketch via Color Dodge (tècnica de Gemini / OpenCV)
// Equivalent al codi Python de cv2 però en Node.js pur amb Sharp.
//
// Algorisme:
//  1. Escala de grisos
//  2. Inverteix → negatiu
//  3. Blur gaussià del negatiu
//  4. Color Dodge: gray / (1 - blurred/255) → línies de llapis

import { readdir, mkdir } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', 'public', 'sketches')
const PREV = join(__dirname, '..', '.edge-previews', 'pencil')
await mkdir(PREV, { recursive: true })

const MAX_DIM = 700

// Blur sigma: com més gran, línies més suaus i simples (menys soroll)
// El Gemini suggereix (21,21) → sigma ≈ 10
// Provem sigma adaptatiu: més gran per a imatges denses, menys per a geomètriques
const DEFAULT_SIGMA = 15

// Config per-quadre (igual que K-Means però ara amb sigma de blur)
const PAINTING_CONFIG = {
  // Detallats: sigma baix → línies fines que capturen els retrats
  vermeer:   12, cassatt:   12, vigee:     12, sofonisba: 14,
  velazquez: 14, varma:     12, artemisia: 14, morisot:   13,
  // Escenes: sigma mitjà
  hokusai:   15, mondrian:  10, lewitt:    10, munch:     16,
  homer:     16, ndebele:   12, klimt:     15, miro:      16,
  klee:      14, doesburg:  10, nebamun:   12, minhwa:    13,
  hiroshige2:13, wood:      14, figari:    16, torres:    13,
  // Abstractes/textura: sigma alt → menys detall, formes generals
  kandinsky: 22, matisse:   20, vangogh:   20, sargent:   20,
  botticelli:17, lascaux:   18, renoir:    16, delaunay:  18,
  kahlo:     16,
}

async function pencilSketch(srcPath, outPath, sigma = DEFAULT_SIGMA) {
  // 1. Carrega + redimensiona + grisos
  const { data: gray, info } = await sharp(srcPath)
    .resize(MAX_DIM, MAX_DIM, { fit: 'inside' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const W = info.width, H = info.height, N = W * H

  // 2. Inverteix
  const inv = Buffer.alloc(N)
  for (let i = 0; i < N; i++) inv[i] = 255 - gray[i]

  // 3. Blur gaussià del negatiu
  const blurred = await sharp(inv, { raw: { width: W, height: H, channels: 1 } })
    .blur(sigma)
    .raw()
    .toBuffer()

  // 4. Color Dodge: sketch = min(255, gray * 255 / (255 - blurred))
  const result = Buffer.alloc(N * 3)  // RGB per a PNG final
  for (let i = 0; i < N; i++) {
    const g = gray[i]
    const b = blurred[i]
    const v = b >= 254 ? 255 : Math.min(255, Math.round(g * 255 / (255 - b)))
    result[i * 3]     = v
    result[i * 3 + 1] = v
    result[i * 3 + 2] = v
  }

  await sharp(result, { raw: { width: W, height: H, channels: 3 } })
    .png({ compressionLevel: 6 })
    .toFile(outPath)

  return { W, H }
}

// ── Main ──────────────────────────────────────────────────────────
const files = (await readdir(SRC)).filter(f => /^[a-z0-9]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()

// Exclou obres SVG (originals inspirats i tessellation — no necessiten sketch de foto)
const SVG_ONLY = ['popart','abaporu','okeeffe','lichtenstein','basquiat','tessellation']

console.log('Generant pencil sketches (Color Dodge)...\n')
let ok = 0, skip = 0

for (const file of files) {
  const name = basename(file, '.jpg')
  if (SVG_ONLY.includes(name)) { skip++; continue }

  const sigma = PAINTING_CONFIG[name] ?? DEFAULT_SIGMA
  process.stdout.write(`${name.padEnd(14)} σ=${sigma}  `)

  try {
    const { W, H } = await pencilSketch(join(SRC, file), join(OUT, `${name}.png`), sigma)
    // Preview més petit
    await sharp(join(OUT, `${name}.png`))
      .resize(350, 350, { fit: 'contain', background: 'white' })
      .png()
      .toFile(join(PREV, `${name}_pencil.png`))
    console.log(`✓  (${W}×${H})`)
    ok++
  } catch (e) {
    console.log(`✗  ${e.message}`)
  }
}

console.log(`\nFet: ${ok} sketches, ${skip} omesos (SVG). Previsualitzacions: ${PREV}`)
