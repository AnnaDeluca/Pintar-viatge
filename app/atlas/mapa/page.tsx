import Link from 'next/link'
import WorldMap from '@/components/WorldMap'
import { paintings } from '@/data/paintings'

const ACCENT = '#D85B3C'

export default function MapaPage() {
  const totalArt = paintings.length
  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--paper)' }}>
      <header className="flex items-center gap-3 shrink-0 px-4"
        style={{ paddingTop: 'max(14px, env(safe-area-inset-top))', paddingBottom: 8 }}>
        <Link href="/atlas" style={{
          width: 36, height: 36, borderRadius: 12, border: '1px solid var(--line)',
          background: 'var(--paper-2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', textDecoration: 'none', color: 'var(--ink)', fontSize: 18, flexShrink: 0,
        }}>←</Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span style={{ display: 'inline-block', width: 18, height: 3, borderRadius: 3, background: ACCENT, flexShrink: 0 }} />
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', lineHeight: 1 }}>
            Mapa del món · <span style={{ color: ACCENT }}>{totalArt} obres</span>
          </h1>
        </div>
      </header>
      <div className="flex-1 min-h-0 px-3 pb-3">
        <WorldMap />
      </div>
    </div>
  )
}
