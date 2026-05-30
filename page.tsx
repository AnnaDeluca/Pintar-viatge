import Link from 'next/link'
import { paintings } from '@/data/paintings'

const GRADIENT: Record<string, string> = {
  lascaux:   'linear-gradient(135deg,#8B4513 0%,#D2691E 100%)',
  hokusai:   'linear-gradient(135deg,#0A3060 0%,#4CC9F0 100%)',
  kusama:    'linear-gradient(135deg,#1A1A1A 0%,#F6C90E 100%)',
  kahlo:     'linear-gradient(135deg,#6B0F1A 0%,#F4A261 100%)',
  tarsila:   'linear-gradient(135deg,#1A6B5A 0%,#4CC9F0 100%)',
  vangogh:   'linear-gradient(135deg,#8B6914 0%,#F6C90E 100%)',
  matisse:   'linear-gradient(135deg,#C41E3A 0%,#2E8B57 100%)',
  mondrian:  'linear-gradient(135deg,#E63946 0%,#2364AA 100%)',
  klimt:     'linear-gradient(135deg,#8B6914 0%,#FFD700 100%)',
  kandinsky: 'linear-gradient(135deg,#8B5CF6 0%,#4CC9F0 100%)',
  ndebele:   'linear-gradient(135deg,#E63946 0%,#F6C90E 100%)',
}

export default function GalleryPage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0d0d1a 0%,#1a0d2e 50%,#0d1a2e 100%)' }}>

      {/* Header */}
      <header className="text-center pt-10 pb-8 px-4">
        <p className="text-white/40 text-xs tracking-widest uppercase mb-3"
          style={{ fontFamily: 'Nunito,sans-serif' }}>
          Un viaje mágico por el arte del mundo
        </p>
        <h1 className="text-5xl md:text-7xl text-white mb-4"
          style={{
            fontFamily: "'Fredoka One',cursive",
            textShadow: '0 4px 32px rgba(240,147,251,0.5)',
            background: 'linear-gradient(135deg,#f093fb,#f5576c,#4facfe)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
          🎨 ¡Pintamos juntos!
        </h1>
        <p className="text-white/50 text-base" style={{ fontFamily: 'Nunito,sans-serif' }}>
          Elige un cuadro, elige un color, ¡y toca!
        </p>
      </header>

      {/* Grid */}
      <main className="max-w-5xl mx-auto px-3 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {paintings.map(p => {
            const thumb = p.thumbUrl
            const grad  = GRADIENT[p.id] ?? 'linear-gradient(135deg,#667eea,#764ba2)'
            return (
              <Link key={p.id} href={`/pintar/${p.id}`} className="block group">
                <article
                  className="rounded-2xl overflow-hidden transition-all duration-200 active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                  }}>

                  {/* Thumbnail */}
                  <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: grad }}>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-110"
                        loading="lazy"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        {p.emoji}
                      </div>
                    )}

                    {/* Dark gradient at bottom for readability */}
                    <div className="absolute inset-x-0 bottom-0 h-12"
                      style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.6),transparent)' }}/>

                    {/* Emoji badge */}
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center text-base"
                      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
                      {p.emoji}
                    </div>

                    {/* Dots badge */}
                    {p.mechanic === 'dots' && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(240,147,251,0.9)', color: 'white', fontFamily: 'Nunito,sans-serif' }}>
                        ¡Puntos!
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-base">{p.flag}</span>
                      <span className="text-white/35 text-xs">{p.year}</span>
                    </div>
                    <h2 className="text-white text-sm leading-tight mb-0.5 truncate"
                      style={{ fontFamily: "'Fredoka One',cursive" }}>
                      {p.title}
                    </h2>
                    <p className="text-white/45 text-xs truncate" style={{ fontFamily: 'Nunito,sans-serif' }}>
                      {p.artist}
                    </p>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
