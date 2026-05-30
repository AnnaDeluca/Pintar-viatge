import WorldMap from '@/components/WorldMap'

export default function GalleryPage() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a0d35 0%, #0a0d1f 60%, #050810 100%)' }}>

      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {[...Array(40)].map((_, i) => (
          <div key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
              height: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
              top: `${(i * 7.3 + 5) % 90}%`,
              left: `${(i * 11.7 + 3) % 98}%`,
              opacity: 0.3 + (i % 4) * 0.15,
            }}
          />
        ))}
      </div>

      <header className="text-center pt-6 pb-3 px-4 shrink-0 relative" style={{ zIndex: 1 }}>
        <p className="text-white/35 text-xs tracking-widest uppercase mb-1"
          style={{ fontFamily: 'Nunito,sans-serif', letterSpacing: '0.2em' }}>
          Un viatge màgic per l&apos;art del món
        </p>
        <h1 className="text-4xl md:text-6xl text-white mb-1"
          style={{
            fontFamily: "'Fredoka One',cursive",
            background: 'linear-gradient(135deg,#f093fb 0%,#f5576c 50%,#4facfe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 24px rgba(240,147,251,0.4))',
          }}>
          🎨 Pintem junts!
        </h1>
        <p className="text-white/45 text-sm" style={{ fontFamily: 'Nunito,sans-serif' }}>
          Toca un país per descobrir el seu art
        </p>
      </header>

      <div className="flex-1 relative min-h-0" style={{ zIndex: 1 }}>
        <WorldMap />
      </div>
    </div>
  )
}
