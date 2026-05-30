'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { type PaintingMeta } from '@/data/paintings'
import ColoringCanvas, { type ColoringCanvasHandle } from '@/components/ColoringCanvas'
import Kusama, { type Dot } from '@/components/paintings/Kusama'

const EXTRA_COLORS = [
  '#E63946','#FF6B6B','#F4A261','#F6C90E','#FFD700',
  '#57CC99','#2E8B57','#4CC9F0','#2364AA','#0A3060',
  '#8B5CF6','#D946EF','#F08080','#A0522D','#8B4513',
  '#1A1A1A','#FFFFFF','#F5F5DC',
]

export default function PintarClient({ painting }: { painting: PaintingMeta }) {
  const isDots = painting.mechanic === 'dots'

  const canvasRef = useRef<ColoringCanvasHandle>(null)
  const [selectedColor, setSelectedColor] = useState('#E63946')
  const [dots, setDots] = useState<Dot[]>([])
  const [showOriginal, setShowOriginal] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const handleSvgClick = useCallback((x: number, y: number) => {
    setDots(prev => {
      const next = [...prev, { x, y, color: selectedColor }]
      if (next.length === 30 && !celebrate) {
        setTimeout(() => { setCelebrate(true); setTimeout(() => setCelebrate(false), 3000) }, 200)
      }
      return next
    })
  }, [selectedColor, celebrate])

  const handleClear = () => {
    if (isDots) setDots([])
    else canvasRef.current?.clear()
    setCelebrate(false)
  }

  const palette = [...new Set([...painting.palette, ...EXTRA_COLORS])].slice(0, 20)

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: '#0e0c18' }}>

      {/* ── Top bar ── */}
      <header className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
        <Link href="/"
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg shrink-0 active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-base leading-tight truncate"
            style={{ fontFamily:"'Fredoka One',cursive" }}>
            {painting.emoji} {painting.title}
          </h1>
          <p className="text-white/40 text-xs truncate">
            {painting.artist} · {painting.flag} {painting.year}
          </p>
        </div>

        {/* Ver original */}
        {painting.imageUrl && (
          <button onClick={() => setShowOriginal(v => !v)}
            className="px-3 h-10 rounded-2xl text-xs font-bold shrink-0 active:scale-90 transition-transform"
            style={{
              background: showOriginal ? 'rgba(240,147,251,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white', fontFamily: 'Nunito,sans-serif',
            }}>
            🖼️ Original
          </button>
        )}

        {/* Fun fact */}
        <button
          onClick={() => {
            const div = document.getElementById('funfact')
            if (div) div.style.display = div.style.display === 'none' ? 'block' : 'none'
          }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.1)', fontSize: 18 }}>
          💡
        </button>

        {/* Clear */}
        <button onClick={handleClear}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.1)', fontSize: 18 }}>
          🗑️
        </button>
      </header>

      {/* Fun fact banner */}
      <div id="funfact"
        className="mx-3 mb-1 rounded-2xl px-4 py-2 text-sm font-medium shrink-0"
        style={{ display: 'none', background: 'rgba(240,147,251,0.12)', border: '1px solid rgba(240,147,251,0.2)' }}>
        <p style={{ color: '#ffecd2', fontFamily: 'Nunito,sans-serif' }}>💡 {painting.funFact}</p>
      </div>

      {/* ── Canvas area ── */}
      <div className="flex-1 flex items-center justify-center px-3 pb-2 overflow-hidden min-h-0">
        <div className="relative w-full h-full flex items-center justify-center">

          {isDots ? (
            /* Kusama dots */
            <div className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ maxHeight: '100%', maxWidth: '100%', width: '100%', aspectRatio: '280/300' }}>
              <Kusama fills={{}} onRegionClick={() => {}}
                dots={dots} onSvgClick={handleSvgClick}/>
            </div>
          ) : (
            /* Real painting → ColoringCanvas */
            <div className="rounded-3xl overflow-hidden shadow-2xl w-full h-full flex items-center justify-center">
              {painting.imageUrl ? (
                <ColoringCanvas
                  ref={canvasRef}
                  imageUrl={painting.imageUrl}
                  selectedColor={selectedColor}
                />
              ) : (
                <div className="flex items-center justify-center text-white/40 text-sm p-8 text-center"
                  style={{ fontFamily: 'Nunito,sans-serif' }}>
                  Cuadro no disponible
                </div>
              )}
            </div>
          )}

          {/* Original painting overlay */}
          {showOriginal && painting.imageUrl && (
            <div className="absolute inset-0 rounded-3xl overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.92)', zIndex: 20 }}
              onClick={() => setShowOriginal(false)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={painting.imageUrl} alt={painting.title}
                className="max-w-full max-h-full object-contain rounded-2xl"
                style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}/>
              <p className="absolute bottom-3 text-white/50 text-xs"
                style={{ fontFamily: 'Nunito,sans-serif' }}>
                Toca para cerrar
              </p>
            </div>
          )}

          {/* Celebration */}
          {celebrate && (
            <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.92)', zIndex: 30 }}>
              <div className="text-8xl mb-2 animate-bounce">🎉</div>
              <p className="text-3xl font-bold text-center"
                style={{ fontFamily: "'Fredoka One',cursive", color: '#f5576c' }}>
                ¡Eres un artista!
              </p>
              <p className="text-5xl mt-3">⭐🎨⭐</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Palette ── */}
      <div className="shrink-0 pb-safe"
        style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5 px-3 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {/* Eraser */}
          <button onClick={() => setSelectedColor('#FFFFFF')}
            className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all active:scale-90"
            style={{
              background: '#FFFFFF',
              borderColor: selectedColor === '#FFFFFF' ? '#f5576c' : 'rgba(255,255,255,0.2)',
              transform: selectedColor === '#FFFFFF' ? 'scale(1.25)' : 'scale(1)',
              boxShadow: selectedColor === '#FFFFFF' ? '0 0 0 3px rgba(245,87,108,0.4)' : 'none',
            }}>
            🧹
          </button>
          {palette.map(color => (
            <button key={color} onClick={() => setSelectedColor(color)}
              className="shrink-0 w-12 h-12 rounded-full border-2 transition-all active:scale-90"
              style={{
                background: color,
                borderColor: selectedColor === color ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                transform: selectedColor === color ? 'scale(1.3)' : 'scale(1)',
                boxShadow: selectedColor === color
                  ? '0 0 0 3px rgba(255,255,255,0.4), 0 4px 20px rgba(0,0,0,0.5)'
                  : '0 2px 8px rgba(0,0,0,0.4)',
              }}/>
          ))}
        </div>
      </div>
    </div>
  )
}
