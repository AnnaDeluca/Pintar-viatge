import WorldMap from '@/components/WorldMap'

export default function GalleryPage() {
  return (
    <div className="flex flex-col h-dvh" style={{ background: 'linear-gradient(160deg,#0d0d1a 0%,#1a0d2e 50%,#0d1a2e 100%)' }}>
      <header className="text-center pt-8 pb-4 px-4 shrink-0">
        <p className="text-white/40 text-xs tracking-widest uppercase mb-2" style={{ fontFamily: 'Nunito,sans-serif' }}>
          Un viatge màgic per l&apos;art del món
        </p>
        <h1 className="text-4xl md:text-6xl text-white mb-2"
          style={{
            fontFamily: "'Fredoka One',cursive",
            textShadow: '0 4px 32px rgba(240,147,251,0.5)',
            background: 'linear-gradient(135deg,#f093fb,#f5576c,#4facfe)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
          🎨 Pintem junts!
        </h1>
        <p className="text-white/50 text-sm" style={{ fontFamily: 'Nunito,sans-serif' }}>
          Toca un país per descobrir el seu art
        </p>
      </header>
      <WorldMap />
    </div>
  )
}
