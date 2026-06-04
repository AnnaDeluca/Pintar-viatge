import Link from 'next/link'

const ACCENT = '#D85B3C'

const MODES = [
  {
    href: '/atlas',
    emoji: '🌍',
    title: 'Descobrir Artistes',
    sub: 'Viatge per l\'art del món',
    color: '#D85B3C',
    bg: 'linear-gradient(135deg,#fde8e4,#fbd0c8)',
    border: '#f4a896',
  },
  {
    href: '/museus',
    emoji: '🏛️',
    title: 'Descobrir Museus',
    sub: 'Visita els museus del món',
    color: '#2E6A9E',
    bg: 'linear-gradient(135deg,#ddeeff,#c4dff5)',
    border: '#9ec4e8',
  },
  {
    href: '/la-meva-foto',
    emoji: '📸',
    title: 'La Meva Foto',
    sub: 'Pinta el teu propi dibuix!',
    color: '#4E8C6A',
    bg: 'linear-gradient(135deg,#dff5ec,#c4edd8)',
    border: '#96d9b8',
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--paper)' }}>
      {/* Header */}
      <header className="shrink-0 text-center" style={{ paddingTop: 52, paddingBottom: 24 }}>
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
      <main className="flex-1 overflow-y-auto px-5 pb-6" style={{ maxWidth: 540, margin: '0 auto', width: '100%' }}>
        <div className="flex flex-col gap-3">
          {MODES.map(m => (
            <Link key={m.href} href={m.href}
              className="flex items-center gap-4 active:scale-98 transition-transform"
              style={{
                textDecoration: 'none',
                background: m.bg,
                border: `1.5px solid ${m.border}`,
                borderRadius: 22,
                padding: '18px 20px',
                boxShadow: '0 4px 14px rgba(35,50,62,0.08)',
              }}>
              {/* Emoji */}
              <div className="flex items-center justify-center shrink-0"
                style={{
                  width: 64, height: 64, borderRadius: 18, fontSize: 34,
                  background: 'rgba(255,255,255,0.7)',
                  boxShadow: '0 2px 8px rgba(35,50,62,0.10)',
                }}>
                {m.emoji}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19,
                  color: m.color, lineHeight: 1.1,
                }}>
                  {m.title}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 13.5,
                  color: 'var(--ink-70)', marginTop: 3,
                }}>
                  {m.sub}
                </div>
              </div>
              {/* Fletxa */}
              <span style={{ fontSize: 20, color: m.color, opacity: 0.6 }}>›</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
