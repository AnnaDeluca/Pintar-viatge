import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center"
      style={{ background: 'var(--paper)' }}>
      <div className="text-7xl" style={{ animation: 'bob 1.5s ease-in-out infinite' }}>🎨</div>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30,
        color: 'var(--ink)', margin: 0, lineHeight: 1.05, letterSpacing: '-0.01em',
      }}>
        Ups! No trobem aquest quadre
      </h1>
      <p style={{
        fontSize: 14.5, color: 'var(--ink-70)', fontFamily: 'var(--font-body)', margin: 0,
        maxWidth: 280,
      }}>
        Potser la pàgina no existeix o ha canviat d&apos;adreça.
      </p>
      <Link href="/"
        className="active:scale-95 transition-transform"
        style={{
          padding: '12px 24px', borderRadius: 999, color: 'white',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
          background: '#D85B3C',
          boxShadow: '0 8px 20px rgba(216,91,60,0.4)',
        }}>
        ← Tornar a l&apos;atlas
      </Link>
    </div>
  )
}
