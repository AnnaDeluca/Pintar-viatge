import Link from 'next/link'

const ACCENT = '#F25C3D'

// Targetes estil "adhesiu": fons de color viu, contorn de tinta gruixut i
// ombra sòlida desplaçada — el mateix llenguatge que el logo.
const MODES = [
  {
    href: '/atlas',
    emoji: '🌍',
    title: 'Descobrir Artistes',
    sub: 'Viatge per l\'art del món',
    color: '#C73E22',
    bg: '#FFD9CE',
  },
  {
    href: '/museus',
    emoji: '🏛️',
    title: 'Descobrir Museus',
    sub: 'Visita els museus del món',
    color: '#1E6FB8',
    bg: '#CFE7FD',
  },
  {
    href: '/la-meva-foto',
    emoji: '📸',
    title: 'La Meva Foto',
    sub: 'Pinta el teu propi dibuix!',
    color: '#1F7D48',
    bg: '#CDF0DB',
  },
  {
    href: '/les-meves-obres',
    emoji: '🖼️',
    title: 'Les Meves Obres',
    sub: 'Les teves creacions guardades',
    color: '#6E42C1',
    bg: '#E5D9FB',
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--paper)' }}>
      {/* Header */}
      <header className="shrink-0 text-center" style={{ paddingTop: 40, paddingBottom: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={64} height={64}
          style={{ borderRadius: 18, boxShadow: '0 4px 12px rgba(35,50,62,0.16)', margin: '0 auto 12px' }} />
        <div className="flex items-center justify-center gap-2 mb-2">
          <span style={{ display: 'inline-block', width: 26, height: 3, borderRadius: 3, background: ACCENT }} />
          <span style={{
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--ink-50)', fontWeight: 700, fontFamily: 'var(--font-body)',
          }}>
            Un viatge per l&apos;art del món
          </span>
          <span style={{ display: 'inline-block', width: 26, height: 3, borderRadius: 3, background: ACCENT }} />
        </div>
        <h1 style={{
          margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 42, lineHeight: 0.98, letterSpacing: '-0.01em', color: 'var(--ink)',
        }}>
          Pintem <span style={{ color: ACCENT }}>junts</span>
        </h1>
        <p style={{
          margin: '8px 0 0', fontSize: 15, color: 'var(--ink-70)', fontFamily: 'var(--font-body)',
        }}>
          Tria com vols jugar avui
        </p>
      </header>

      {/* Mode cards */}
      <main className="flex-1 overflow-y-auto flex flex-col px-5 pb-6" style={{ maxWidth: 540, margin: '0 auto', width: '100%' }}>
        {/* margin auto = centrat vertical quan sobra espai, scroll normal quan no */}
        <div className="flex flex-col gap-4" style={{ margin: 'auto 0' }}>
          {MODES.map(m => (
            <Link key={m.href} href={m.href}
              className="flex items-center gap-4 active:scale-98 transition-transform"
              style={{
                textDecoration: 'none',
                background: m.bg,
                border: '2.5px solid var(--ink)',
                borderRadius: 20,
                padding: '16px 18px',
                boxShadow: '0 5px 0 rgba(35,50,62,0.85)',
              }}>
              {/* Emoji */}
              <div className="flex items-center justify-center shrink-0"
                style={{
                  width: 62, height: 62, borderRadius: 16, fontSize: 32,
                  background: '#FFFDF7',
                  border: '2.5px solid var(--ink)',
                }}>
                {m.emoji}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19,
                  color: m.color, lineHeight: 1.12,
                }}>
                  {m.title}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                  color: 'var(--ink-70)', marginTop: 3,
                }}>
                  {m.sub}
                </div>
              </div>
              {/* Fletxa */}
              <span style={{ fontSize: 22, color: 'var(--ink)', opacity: 0.75, fontWeight: 700 }}>›</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
