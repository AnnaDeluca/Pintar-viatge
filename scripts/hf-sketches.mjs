// Genera sketches amb HuggingFace Inference API (GRATIS amb rate limit).
//
// SETUP (una sola vegada):
//   1. Crea compte gratis a https://huggingface.co/join
//   2. Treu un token (READ) a https://huggingface.co/settings/tokens
//   3. Crea fitxer .env.local amb: HF_TOKEN=hf_xxxxxxxxx
//   4. Executa: node scripts/hf-sketches.mjs
//
// El free tier permet ~100-300 requests al dia.
// Pels 21 quadres en sobra.

import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'paintings')
const OUT = join(__dirname, '..', 'public', 'sketches')
await mkdir(OUT, { recursive: true })

// Llegeix HF_TOKEN del .env.local
if (existsSync(join(__dirname, '..', '.env.local'))) {
  const env = await readFile(join(__dirname, '..', '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/)
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

if (!process.env.HF_TOKEN) {
  console.error('❌ Cal HF_TOKEN al fitxer .env.local')
  console.error('   1. Compte: https://huggingface.co/join')
  console.error('   2. Token (READ): https://huggingface.co/settings/tokens')
  console.error('   3. .env.local amb: HF_TOKEN=hf_xxxxxxxxxxx')
  process.exit(1)
}

// Models a provar (ordenats per qualitat esperada per a coloring book line art)
const MODELS = [
  'Carve/anime2sketch',        // millor per a line art estil sketch
  'lllyasviel/sd-controlnet-canny',  // ControlNet Canny
  'cjwbw/informative-drawings',      // Informative-Drawings (Gemini's tip)
]

const TEST_LIMIT = Number(process.env.TEST_LIMIT || 3)  // 3 quadres per testar primer

const files = (await readdir(SRC)).filter(f => /^[a-z]+\.jpg$/i.test(f) && !f.includes('thumb'))
files.sort()

// Primer prova amb pocs quadres específics
const targets = TEST_LIMIT > 0
  ? ['vermeer.jpg', 'hokusai.jpg', 'vangogh.jpg'].filter(f => files.includes(f))
  : files

async function callHF(modelId, imgBuf) {
  const res = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imgBuf,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
  const contentType = res.headers.get('content-type') || ''
  if (contentType.startsWith('image/')) {
    return await res.arrayBuffer()
  }
  // Pot retornar JSON amb error o amb base64
  const text = await res.text()
  try {
    const j = JSON.parse(text)
    if (j.error) throw new Error(`HF: ${j.error}`)
    if (j.image) return Buffer.from(j.image, 'base64')
    throw new Error(`Resposta inesperada: ${text.slice(0, 200)}`)
  } catch (e) {
    throw new Error(`Resposta: ${text.slice(0, 200)}`)
  }
}

console.log(`Test amb ${targets.length} quadres i ${MODELS.length} models\n`)

for (const file of targets) {
  const name = basename(file, '.jpg')
  const imgBuf = await readFile(join(SRC, file))
  console.log(`\n=== ${name} ===`)

  for (const model of MODELS) {
    const modelSafeName = model.replace(/\//g, '_')
    process.stdout.write(`  ${model}... `)
    try {
      const buf = await callHF(model, imgBuf)
      const outPath = join(OUT, `${name}_hf_${modelSafeName}.png`)
      await writeFile(outPath, Buffer.from(buf))
      console.log(`✓ → ${basename(outPath)}`)
    } catch (e) {
      console.log(`✗ ${e.message.slice(0, 100)}`)
    }
  }
}

console.log('\nFet! Mira els resultats a /public/sketches/{name}_hf_*.png')
console.log('Si t\'agrada un model, executa amb tots els quadres:')
console.log('  TEST_LIMIT=0 node scripts/hf-sketches.mjs')
