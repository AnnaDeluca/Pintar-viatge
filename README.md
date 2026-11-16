# 🎨 Pintem Junts! (Pintar-viatge)

App de pintar per a nens: colorejar quadres d'artistes famosos en un viatge
pel món i el temps. Feta amb Next.js (App Router) + Tailwind, en català.

## Rutes

| Ruta | Què és |
|---|---|
| `/` | Pantalla d'inici amb els 4 modes |
| `/atlas` | Descobrir artistes al mapa del món |
| `/museus` | Descobrir museus del món |
| `/pintar/[id]` | Llenç per colorejar un quadre (omplir + pinzell, zoom, desfer) |
| `/la-meva-foto` | Converteix una foto pròpia en dibuix per colorejar (IA de Hugging Face amb fallback local al dispositiu) |
| `/les-meves-obres` | Galeria de les obres guardades (localStorage) |
| `/admin` | Pujar imatges personalitzades dels quadres (protegit per contrasenya) |

## Com funcionen els dibuixos per colorejar

- `public/paintings/*.jpg` — imatge original del quadre (+ `-thumb`).
- `public/sketches/<id>.png` — contorns pre-generats amb detecció de vores
  Sobel (blanc + línies negres). Si falta el PNG, `ColoringCanvas` genera els
  contorns en temps real al navegador (adaptive threshold).
- Per regenerar sketches: `node scripts/regenerate-sketches.mjs [id1 id2 ...]`
  (sense arguments els regenera tots). Ajustos per quadre a `OVERRIDES` dins
  l'script: `blur` (elimina textura fina), `minComp` (anti-puntets), `dilate`
  (engruixeix línies) i `colorEdges` (vores per canal de color, per a contorns
  que tenen la mateixa lluminositat).

### Sketches amb IA (qualitat superior)

Per als quadres on el Sobel no arriba (figures de contorn suau, molta textura),
el sketch es genera **manualment amb Gemini** (gratis, sense tokens) i es
commiteja com a fitxer estàtic — l'app no depèn de cap servei en runtime:

1. Puja `public/paintings/<id>.jpg` a [gemini.google.com](https://gemini.google.com)
   amb el prompt que hi ha dins `scripts/install-ai-sketch.mjs`.
2. `node scripts/install-ai-sketch.mjs <id> <imatge-descarregada>` (neteja i instal·la).
3. `aiSketch: true` al quadre a `data/paintings.ts` — fa que el cubell d'omplir
   usi les línies del sketch com a límits (l'art IA no està alineat píxel a
   píxel amb el quadre).
4. Afegeix l'id al `SKIP` de `regenerate-sketches.mjs`.

Fet així: `botticelli`.

## Desplegament

**Vercel** desplega automàticament la branca `main` d'aquest repo
(projecte `pintar-viatge` → https://pintar-viatge.vercel.app). El workflow de
GitHub Actions (`.github/workflows/ci.yml`) només verifica que el build compila.

> ⚠️ Hi ha una còpia antiga de l'app dins el repo `coral-la-fuga`
> (subdirectori `pintar-viaje/`). La font de veritat és **aquest** repo;
> eviteu editar la còpia.

## Configuració de l'admin (`/admin`)

Variables d'entorn a Vercel (Settings → Environment Variables):

- `ADMIN_PASSWORD` — contrasenya per accedir a `/admin`. **Sense aquesta
  variable, la pujada queda desactivada** (error 503).
- `BLOB_READ_WRITE_TOKEN` — token de Vercel Blob (Storage → Create Blob store)
  on es guarden les imatges pujades i el manifest.

## Desenvolupament

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de producció
```
