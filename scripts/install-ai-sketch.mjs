// Instal·la un sketch generat amb IA (p. ex. Gemini) com a pàgina per pintar.
//
// Workflow complet:
//   1. Puja el quadre (public/paintings/<id>.jpg) a gemini.google.com amb el prompt:
//      "Converteix aquest quadre en una pàgina per pintar per a nens: només
//       contorns negres continus sobre fons blanc pur, sense ombres, grisos ni
//       textures. Línies gruixudes i ben tancades. Mantén EXACTAMENT la
//       composició i les proporcions del quadre original."
//   2. Baixa la imatge resultant i executa:
//        node scripts/install-ai-sketch.mjs <id> <fitxer-descarregat>
//   3. A data/paintings.ts afegeix `aiSketch: true` al quadre (el cubell
//      d'omplir usarà les línies del sketch com a límits).
//   4. Afegeix l'id al SKIP de scripts/regenerate-sketches.mjs perquè el
//      Sobel no el sobreescrigui.
//
// El pas de neteja: escala de grisos + normalitzar + contrast (fons a blanc
// pur, línies ben negres) + amplada 1400 px.

import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const [id, input] = process.argv.slice(2)

if (!id || !input) {
  console.error('Ús: node scripts/install-ai-sketch.mjs <id> <imatge>')
  process.exit(1)
}
const painting = join(__dirname, '..', 'public', 'paintings', `${id}.jpg`)
if (!existsSync(painting)) {
  console.error(`❌ No existeix public/paintings/${id}.jpg — l'id és correcte?`)
  process.exit(1)
}
if (!existsSync(input)) {
  console.error(`❌ No trobo el fitxer d'entrada: ${input}`)
  process.exit(1)
}

const out = join(__dirname, '..', 'public', 'sketches', `${id}.png`)
const pm = await sharp(painting).metadata()
const im = await sharp(input).metadata()
const rp = (pm.width / pm.height).toFixed(3)
const ri = (im.width / im.height).toFixed(3)
console.log(`quadre ${pm.width}×${pm.height} (ratio ${rp}) · IA ${im.width}×${im.height} (ratio ${ri})`)
if (Math.abs(rp - ri) > 0.05) {
  console.warn(`⚠️  Les proporcions difereixen (${rp} vs ${ri}): el sketch es veurà estirat.`)
  console.warn('   Torna a demanar-la a la IA amb "mateixes proporcions que l\'original".')
}

await sharp(input)
  .greyscale()
  .normalise()
  .linear(1.18, -28)
  .resize(1400)
  .png({ compressionLevel: 9 })
  .toFile(out)

console.log(`✅ Instal·lat a public/sketches/${id}.png`)
console.log(`   Recorda: aiSketch: true a data/paintings.ts i '${id}' al SKIP de regenerate-sketches.mjs`)
