'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { type PaintingMeta } from '@/data/paintings'
import ColoringCanvas, { type ColoringCanvasHandle, type Tool } from '@/components/ColoringCanvas'
import Kusama, { type Dot } from '@/components/paintings/Kusama'

// Paleta de colors organitzada per famílies
const COLOR_FAMILIES = [
  { name: 'Vermells',  colors: ['#E63946','#FF6B6B','#F08080','#8B0000','#C41E3A'] },
  { name: 'Taronges',  colors: ['#F4A261','#FF8C42','#FFA500','#D2691E','#A0522D'] },
  { name: 'Grocs',     colors: ['#F6C90E','#FFD700','#FFF44F','#DAA520','#B8860B'] },
  { name: 'Verds',     colors: ['#57CC99','#2E8B57','#90EE90','#228B22','#006400'] },
  { name: 'Blaus',     colors: ['#AEE6FF','#4CC9F0','#2364AA','#0A3060','#1A1A2E'] },
  { name: 'Violetes',  colors: ['#8B5CF6','#D946EF','#F093FB','#9370DB','#4B0082'] },
  { name: 'Marrons',   colors: ['#8B4513','#A0522D','#654321','#D2691E','#F5DEB3'] },
  { name: 'Neutres',   colors: ['#FFFFFF','#F5F5DC','#808080','#1A1A1A','#000000'] },
]

const ALL_COLORS = COLOR_FAMILIES.flatMap(f => f.colors)

export default function PintarClient({ painting }: { painting: PaintingMeta }) {
  const isDots = painting.mechanic === 'dots'

  const canvasRef = useRef<ColoringCanvasHandle>(null)
  const [selectedColor, setSelectedColor] = useState('#E63946')
  const [tool, setTool] = useState<Tool>('fill')
  const [brushSize, setBrushSize] = useState(24)
  const [dots, setDots] = useState<Dot[]>([])
  const [showOriginal, setShowOriginal] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const handleLoadFail = useCallback(() => setLoadError(true), [])

  const handleSvgClick = useCallback((x: number, y: number) => {
    setDots(prev => {
      const next = [...prev, { x, y, color: selectedColor, r: 7 + Math.floor(Math.random() * 9) }]
      if (next.length === 25 && !celebrate) {
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

  // Combina paleta del quadre + alguns colors generals, sense duplicats
  const quickPalette = [...new Set([
    ...painting.palette,
    '#E63946','#F6C90E','#57CC99','#4CC9F0','#8B5CF6','#FF6B6B','#FFFFFF','#1A1A1A',
  ])].slice(0, 14)

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: '#0e0c18' }}>

      {/* Top bar */}
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
        <button
          onClick={() => {
            const div = document.getElementById('funfact')
            if (div) div.style.display = div.style.display === 'none' ? 'block' : 'none'
          }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.1)', fontSize: 18 }}>
          💡
        </button>
        <button onClick={handleClear}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.1)', fontSize: 18 }}>
          🗑️
        </button>
      </header>

      {/* Fun fact */}
      <div id="funfact"
        className="mx-3 mb-1 rounded-2xl px-4 py-2 text-sm font-medium shrink-0"
        style={{ display: 'none', background: 'rgba(240,147,251,0.12)', border: '1px solid rgba(240,147,251,0.2)' }}>
        <p style={{ color: '#ffecd2', fontFamily: 'Nunito,sans-serif' }}>💡 {painting.funFact}</p>
      </div>

      {/* Canvas + referència */}
      <div className="flex-1 flex gap-2 px-3 pb-2 overflow-hidden min-h-0">

        {/* Canvas principal — directament al flex, sense wrappers intermedis */}
        <div className="flex-1 flex items-center justify-center min-w-0 min-h-0">
          {isDots ? (
            <div className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ maxHeight: '100%', maxWidth: '100%', width: '100%', aspectRatio: '280/300' }}>
              <Kusama fills={{}} onRegionClick={() => {}}
                dots={dots} onSvgClick={handleSvgClick}/>
            </div>
          ) : painting.imageUrl && !loadError ? (
            <ColoringCanvas
              ref={canvasRef}
              imageUrl={painting.imageUrl}
              selectedColor={selectedColor}
              tool={tool}
              brushSize={brushSize}
              onLoadFail={handleLoadFail}
              className="rounded-3xl overflow-hidden shadow-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/40 text-sm p-8 text-center gap-3 rounded-3xl"
              style={{ fontFamily: 'Nunito,sans-serif', width: 240, height: 180, background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-5xl">🖼️</span>
              <p>No s&apos;ha pogut carregar el quadre</p>
              {loadError && (
                <button onClick={() => setLoadError(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white active:scale-90 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  Tornar a intentar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Miniatura original — responsive: més gran en pantalles amples */}
        {painting.imageUrl && !isDots && (
          <div className="flex flex-col items-center gap-1.5 shrink-0 justify-center"
            style={{ width: 'clamp(72px, 14vw, 160px)' }}>
            <p className="text-white/40 text-center"
              style={{ fontSize: 'clamp(7px, 1.2vw, 10px)', fontFamily: 'Nunito,sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Original
            </p>
            <button
              onClick={() => setShowOriginal(true)}
              className="w-full rounded-2xl overflow-hidden shadow-xl active:scale-95 transition-transform"
              style={{ border: '2px solid rgba(255,255,255,0.25)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={painting.thumbUrl || painting.imageUrl}
                alt={painting.title}
                className="w-full h-auto block"
              />
            </button>
            <p className="text-white/25 text-center"
              style={{ fontSize: 'clamp(6px, 1vw, 9px)', fontFamily: 'Nunito,sans-serif' }}>
              toca per ampliar
            </p>
          </div>
        )}
      </div>

      {/* Celebració a pantalla completa */}
      {celebrate && (
        <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.95)', zIndex: 50 }}>
          <div className="text-8xl mb-4 animate-bounce">🎉</div>
          <p className="text-4xl font-bold text-center px-8"
            style={{ fontFamily: "'Fredoka One',cursive", color: '#f5576c' }}>
            Ets un artista!
          </p>
          <p className="text-5xl mt-4">⭐🎨⭐</p>
        </div>
      )}

      {/* Overlay original a pantalla completa */}
      {showOriginal && painting.imageUrl && (
        <div className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)', zIndex: 50 }}
          onClick={() => setShowOriginal(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={painting.imageUrl} alt={painting.title}
            className="max-w-full max-h-full object-contain rounded-2xl"
            style={{ maxWidth: '90vw', maxHeight: '90vh', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}/>
          <p className="absolute bottom-6 text-white/50 text-sm"
            style={{ fontFamily: 'Nunito,sans-serif' }}>
            Toca per tancar
          </p>
        </div>
      )}

      {/* Barra d'eines + paleta */}
      <div className="shrink-0 pb-safe"
        style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Row 1: Eines + control de mida del pinzell */}
        {!isDots && (
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
            {/* Toggle eina */}
            <div className="flex rounded-2xl overflow-hidden shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setTool('fill')}
                className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                style={{
                  background: tool === 'fill' ? '#f5576c' : 'transparent',
                  color: tool === 'fill' ? 'white' : 'rgba(255,255,255,0.6)',
                  fontFamily: 'Nunito,sans-serif',
                }}>
                <span style={{ fontSize: 14 }}>🪣</span> Omple
              </button>
              <button onClick={() => setTool('brush')}
                className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                style={{
                  background: tool === 'brush' ? '#f5576c' : 'transparent',
                  color: tool === 'brush' ? 'white' : 'rgba(255,255,255,0.6)',
                  fontFamily: 'Nunito,sans-serif',
                }}>
                <span style={{ fontSize: 14 }}>🖌️</span> Pinzell
              </button>
            </div>

            {/* Slider mida pinzell (només si tool=brush) */}
            {tool === 'brush' && (
              <>
                <div className="w-6 h-6 rounded-full shrink-0 border border-white/20"
                  style={{ background: selectedColor, width: Math.max(8, brushSize * 0.6), height: Math.max(8, brushSize * 0.6) }}/>
                <input type="range" min={6} max={60} step={2}
                  value={brushSize}
                  onChange={e => setBrushSize(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: '#f5576c' }}/>
              </>
            )}

            {/* Espaiador + botó paleta */}
            <div className="flex-1" />
            <button onClick={() => setShowColorPicker(true)}
              className="shrink-0 px-3 py-1.5 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-transform"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'Nunito,sans-serif' }}>
              <span style={{ fontSize: 14 }}>🎨</span> Més colors
            </button>
          </div>
        )}

        {/* Row 2: paleta ràpida */}
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {/* Goma */}
          <button onClick={() => setSelectedColor('#FFFFFF')}
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg border-2 transition-all active:scale-90"
            style={{
              background: '#FFFFFF',
              borderColor: selectedColor === '#FFFFFF' ? '#f5576c' : 'rgba(255,255,255,0.2)',
              transform: selectedColor === '#FFFFFF' ? 'scale(1.2)' : 'scale(1)',
              boxShadow: selectedColor === '#FFFFFF' ? '0 0 0 3px rgba(245,87,108,0.4)' : 'none',
            }}>
            🧹
          </button>
          {quickPalette.map(color => (
            <button key={color} onClick={() => setSelectedColor(color)}
              className="shrink-0 w-11 h-11 rounded-full border-2 transition-all active:scale-90"
              style={{
                background: color,
                borderColor: selectedColor === color ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                transform: selectedColor === color ? 'scale(1.25)' : 'scale(1)',
                boxShadow: selectedColor === color
                  ? '0 0 0 3px rgba(255,255,255,0.4), 0 4px 20px rgba(0,0,0,0.5)'
                  : '0 2px 8px rgba(0,0,0,0.4)',
              }}/>
          ))}
          {/* Botó "més" a la paleta ràpida */}
          <button onClick={() => setShowColorPicker(true)}
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-xl border-2 border-dashed transition-all active:scale-90"
            style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
            +
          </button>
        </div>
      </div>

      {/* Modal paleta completa */}
      {showColorPicker && (
        <div className="fixed inset-0 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 60 }}
          onClick={() => setShowColorPicker(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-5 pb-safe"
            style={{ background: '#15131f', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Fredoka One',cursive" }}>
                🎨 Tria un color
              </h2>
              <button onClick={() => setShowColorPicker(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                ×
              </button>
            </div>

            {/* Famílies de colors */}
            {COLOR_FAMILIES.map(family => (
              <div key={family.name} className="mb-4">
                <p className="text-white/50 text-xs mb-2 uppercase tracking-wider"
                  style={{ fontFamily: 'Nunito,sans-serif', letterSpacing: '0.1em' }}>
                  {family.name}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {family.colors.map(color => (
                    <button key={color}
                      onClick={() => { setSelectedColor(color); setShowColorPicker(false) }}
                      className="aspect-square rounded-2xl border-2 transition-all active:scale-90"
                      style={{
                        background: color,
                        borderColor: selectedColor === color ? '#f5576c' : 'rgba(255,255,255,0.15)',
                        boxShadow: selectedColor === color ? '0 0 0 2px rgba(245,87,108,0.5)' : '0 2px 8px rgba(0,0,0,0.4)',
                      }}/>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom color input */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/50 text-xs mb-2 uppercase tracking-wider"
                style={{ fontFamily: 'Nunito,sans-serif', letterSpacing: '0.1em' }}>
                Color personalitzat
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="color"
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                  className="w-14 h-14 rounded-2xl cursor-pointer"
                  style={{ background: 'transparent', border: 'none' }}/>
                <span className="text-white/70 text-sm" style={{ fontFamily: 'Nunito,sans-serif' }}>
                  Toca per triar qualsevol color
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
