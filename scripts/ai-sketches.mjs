// Genera sketches d'alta qualitat amb un model d'AI a Replicate.
// Cost: ~$0.10-0.30 total per a tots els 21 quadres.
//
// SETUP (una sola vegada):
//   1. Crea compte gratis a https://replicate.com
//   2. Treu un token a https://replicate.com/account/api-tokens
//   3. Crea fitxer .env.local amb: REPLICATE_API_TOKEN=r8_xxxxxxxxx
//      (afegeix .env.local al .gitignore — JA HI ÉS)
//   4. Pots provar primer amb 1-2 quadres modificant TEST_LIMIT
//
// EXECUCIÓ:
//   node scripts/ai-sketches.mjs
//   → guarda PNGs a /public/sketches/{id}_ai.png
//   → pots comparar amb els SVG de potrace abans de decidir què usar

import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import Replicate from 'replicate'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', 'public', 'sketches')
await mkdir(OUT, { recursive: true })

// Llegeix REPLICATE_API_TOKEN de .env.local
if (existsSync(join(__dirname, '..', '.env.local'))) {
  const env = await readFile(join(__dirname, '..', '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/)
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

if (!process.env.REPLICATE_API_TOKEN) {
  console.error('❌ Cal REPLICATE_API_TOKEN al fitxer .env.local')
  console.error('   Treu-ne un a https://replicate.com/account/api-tokens')
  process.exit(1)
}

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

// Model: "informative-drawings" — específicament entrenat per a line art
// https://replicate.com/cjwbw/informative-drawings
const MODEL = 'cjwbw/informative-drawings:b1d2f44b8a3c5f8f9bf0f0c2c87f15b3e1f9a2e3a1c5d3e3c4b1a2c3d4e5f6a7'
// Versió actualitzada (preferida — molt més estable):
const MODEL_SIMPLE = 'cjwbw/informative-drawings'  // sense versió → última

// Si vols provar primer amb pocs quadres, posa-hi un número (ex 3).
// 0 = tots.
const TEST_LIMIT = Number(process.env.TEST_LIMIT || 0)

const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()
const targets = TEST_LIMIT > 0 ? files.slice(0, TEST_LIMIT) : files

console.log(`Generant ${targets.length} sketches amb Replicate (model: ${MODEL_SIMPLE})`)
console.log('Estimació: ~5-15 segons per imatge\n')

for (const file of targets) {
  const name = basename(file, '.jpg')
  process.stdout.write(`${name}... `)
  try {
    // Llegim el PNG i el convertim a data URL
    const buf = await readFile(join(SRC, file))
    const b64 = buf.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${b64}`

    const output = await replicate.run(MODEL_SIMPLE, {
      input: {
        image: dataUrl,
        style: 'anime_style',  // o 'contour_style' / 'opensketch_style'
        resolution: 768,
      },
    })

    // output és la URL del PNG resultant
    const imgUrl = typeof output === 'string' ? output : Array.isArray(output) ? output[0] : output.url
    if (!imgUrl) throw new Error('No s\'ha rebut URL de Replicate')

    const res = await fetch(imgUrl)
    const arrBuf = await res.arrayBuffer()
    await writeFile(join(OUT, `${name}_ai.png`), Buffer.from(arrBuf))
    console.log(`✓`)
  } catch (e) {
    console.log(`✗ ${e.message}`)
  }
}

console.log('\nFet! Compara els resultats amb els SVGs actuals:')
console.log('  - /public/sketches/{id}.svg     ← K-Means + Potrace (actual)')
console.log('  - /public/sketches/{id}_ai.png  ← AI (informative-drawings)')
console.log('\nSi t\'agraden els AI, actualitza ColoringCanvas.tsx perquè usi')
console.log('els PNG _ai.png en lloc dels SVG.')
