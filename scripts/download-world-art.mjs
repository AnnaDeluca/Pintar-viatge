import { createWriteStream } from 'fs'
import { get } from 'https'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'paintings')
const delay = ms => new Promise(r => setTimeout(r, ms))
const UA = 'PintarViatge/1.0 (https://pintar-viatge.vercel.app; anuskitadeluca@gmail.com)'

function api(f, w) {
  return new Promise(res => {
    get(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(f)}&prop=imageinfo&iiprop=url&iiurlwidth=${w}&format=json`,
      { headers: { 'User-Agent': UA } }, r => {
        let d = ''; r.on('data', c => d += c); r.on('end', () => {
          try { const j = JSON.parse(d); const p = Object.values(j.query.pages)[0]; res(p.missing ? null : p?.imageinfo?.[0]?.thumburl || null) } catch { res(null) }
        })
      }).on('error', () => res(null))
  })
}

function dl(url, dest) {
  return new Promise((res, rej) => {
    const f = createWriteStream(dest)
    get(url, { headers: { 'User-Agent': UA } }, r => {
      if ([301, 302].includes(r.statusCode)) { f.close(); dl(r.headers.location, dest).then(res).catch(rej); return }
      if (r.statusCode !== 200) { f.close(); rej(new Error('HTTP ' + r.statusCode)); return }
      r.pipe(f); f.on('finish', () => f.close(res))
    }).on('error', rej)
  })
}

const imgs = [
  { n: 'varma',  f: 'Raja Ravi Varma - Woman Holding a Fan VA AC 2006AU7185.jpg' },
  { n: 'figari', f: 'Pedro Figari - Candombe - Google Art Project.jpg' },
  { n: 'mughal', f: 'Govardhan. Jahangir Visiting the Ascetic Jadrup. ca. 1616-20, Musee Guimet.jpg' },
]

for (const { n, f } of imgs) {
  await delay(600)
  const u800 = await api(f, 800); await delay(400); const u400 = await api(f, 400)
  process.stdout.write(`${n}: `)
  if (u800) { await dl(u800, join(OUT, `${n}.jpg`)); console.log('✓') }
  else { console.log('✗ no disponible'); continue }
  if (u400) await dl(u400, join(OUT, `${n}-thumb.jpg`))
}
console.log('Fet!')
