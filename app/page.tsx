import Link from 'next/link'
import WorldMap from '@/components/WorldMap'
import { paintings } from '@/data/paintings'

const ACCENT = '#D85B3C' // terracotta

export default function GalleryPage() {
  const countries = new Set(paintings.map(p => p.country.split('/')[0].trim())).size
  const totalArt = paintings.length

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--paper)' }}>

      {/* Header */}
      <header className="shrink-0 relative" style={{ paddingTop: 48, paddingLeft: 24, paddingRight: 24 }}>
        {/* Botó Les meves obres */}
        <Link href="/les-meves-obres"
          className="absolute flex items-center gap-1.5 active:scale-95 transition-transform"
          style={{
            top: 48, right: 18,
            padding: '8px 14px', borderRadius: 999,
            background: 'var(--paper-2)', border: '1px solid var(--line)',
            color: 'var(--ink)', textDecoration: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5,
            boxShadow: '0 2px 6px rgba(35,50,62,0.08)',
          }}>
          🖼️ Les meves obres
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <span style={{
            display: 'inline-block', width: 26, height: 3, borderRadius: 3, background: ACCENT,
          }} />
          <span style={{
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--ink-50)', fontWeight: 700, fontFamily: 'var(--font-body)',
          }}>
            Un viatge per l&apos;art del món
          </span>
        </div>
        <h1 style={{
          margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 40, lineHeight: 0.98, letterSpacing: '-0.01em', color: 'var(--ink)',
        }}>
          Pintem <span style={{ color: ACCENT }}>junts</span>
        </h1>
        <p style={{
          margin: '6px 0 0', fontSize: 14.5, color: 'var(--ink-70)', fontFamily: 'var(--font-body)',
        }}>
          Toca un punt del mapa i comença a pintar.
        </p>
      </header>

      {/* Mapa centrat verticalment */}
      <div className="flex-1 flex flex-col justify-center min-h-0"
        style={{ padding: '14px 18px 0' }}>
        <WorldMap />
      </div>

      {/* Peu */}
      <div className="text-center shrink-0"
        style={{
          padding: '12px 0 20px',
          fontSize: 11.5, color: 'var(--ink-35)', letterSpacing: '0.04em',
          fontFamily: 'var(--font-body)',
        }}>
        {totalArt} obres mestres · {countries} països · 17.000 anys d&apos;art
      </div>
    </div>
  )
}
