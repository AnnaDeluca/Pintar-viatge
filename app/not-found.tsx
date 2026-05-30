import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center"
      style={{ background: 'linear-gradient(160deg,#0d0d1a 0%,#1a0d2e 50%,#0d1a2e 100%)' }}
    >
      <div className="text-8xl animate-bounce">🎨</div>
      <h1
        className="text-4xl md:text-5xl text-white"
        style={{
          fontFamily: "'Fredoka One',cursive",
          background: 'linear-gradient(135deg,#f093fb,#f5576c,#4facfe)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Ups! No trobem aquest quadre
      </h1>
      <p className="text-white/50 text-base" style={{ fontFamily: 'Nunito,sans-serif' }}>
        Potser la pàgina no existeix o ha canviat d&apos;adreça.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-2xl font-bold text-white text-base active:scale-90 transition-transform"
        style={{
          background: 'linear-gradient(135deg,#f093fb,#f5576c)',
          fontFamily: 'Nunito,sans-serif',
          boxShadow: '0 4px 24px rgba(240,147,251,0.4)',
        }}
      >
        ← Tornar a la galeria
      </Link>
    </div>
  )
}
