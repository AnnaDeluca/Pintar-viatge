// Executa: node scripts/download-images.mjs
import { createWriteStream, mkdirSync } from 'fs'
import { get as httpsGet } from 'https'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'paintings')
mkdirSync(OUT, { recursive: true })

const UA = 'PintarViatge/1.0 (https://pintar-viatge.vercel.app; anuskitadeluca@gmail.com)'

// Noms exactes de fitxer a Wikimedia Commons
const IMAGES = [
  { file: 'lascaux',    name: 'Lascaux_painting.jpg' },
  { file: 'hokusai',    name: 'The_Great_Wave_off_Kanagawa.jpg' },
  // Frida Kahlo és sota copyright en alguns països → usem Diego Rivera (1886-1957, PD)
  { file: 'kahlo',      name: 'Dream_of_a_Sunday_Afternoon_in_Alameda_Park.jpg' },
  // Tarsila do Amaral (†1973) té restriccions → usem Cândido Portinari "Os Retirantes" (1944, †1962, PD)
  { file: 'tarsila',    name: 'Candido_Portinari_-_Retirantes,_1944.jpg' },
  { file: 'vangogh',    name: 'Vincent_Willem_van_Gogh_127.jpg' },
  // Matisse Dance — nom correcte a Commons
  { file: 'matisse',    name: 'La_Danse_II,_par_Henri_Matisse.jpg' },
  // Mondrian — nom correcte a Commons
  { file: 'mondrian',   name: 'Piet_Mondriaan,_1930_-_Mondrian_Composition_II_in_Red,_Blue,_and_Yellow.jpg' },
  { file: 'kandinsky',  name: 'Vassily_Kandinsky,_1913_-_Composition_7.jpg' },
  { file: 'klimt',      name: 'The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg' },
  { file: 'ndebele',    name: 'Ndebele_village.jpg' },
]

function httpGet(url) {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { 'User-Agent': UA } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        resolve(httpGet(res.headers.location)); return
      }
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    }).on('error', reject)
  })
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)
    httpsGet(url, { headers: { 'User-Agent': UA } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); download(res.headers.location, dest).then(resolve).catch(reject); return
      }
      if (res.statusCode !== 200) { file.close(); reject(new Error(`HTTP ${res.statusCode}`)); return }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', reject)
  })
}

async function getThumbUrl(filename, width) {
  const res = await httpGet(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json`)
  const j = JSON.parse(res.body)
  const page = Object.values(j.query.pages)[0]
  if (page.missing) throw new Error('Fitxer no existeix a Commons')
  const thumb = page.imageinfo?.[0]?.thumburl
  if (!thumb) throw new Error('Sense thumburl (possible restricció de drets)')
  return thumb
}

const delay = ms => new Promise(r => setTimeout(r, ms))

for (const { file, name } of IMAGES) {
  process.stdout.write(`${file}: `)
  try {
    await delay(500) // evitar rate limit
    const url700 = await getThumbUrl(name, 700)
    await delay(300)
    const url400 = await getThumbUrl(name, 400)

    process.stdout.write('descarregant... ')
    await download(url700, join(OUT, `${file}.jpg`))
    await download(url400, join(OUT, `${file}-thumb.jpg`))
    console.log('✓')
  } catch (e) {
    console.log(`✗ ${e.message}`)
  }
}

console.log('\nFet! Ara executa:')
console.log('  git add public/paintings && git commit -m "Afegeix imatges locals" && git push')
