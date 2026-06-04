'use client'
import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import ColoringCanvas, { type ColoringCanvasHandle, type Tool, type BrushType } from '@/components/ColoringCanvas'

const ACCENT = '#4E8C6A'

// Color Dodge pencil sketch — igual que el script Node.js però al navegador
async function applyPencilSketch(file: File, sigma: number = 18): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 800
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const W = Math.round(img.width * scale)
      const H = Math.round(img.height * scale)

      // Canvas original → grisos
      const c0 = document.createElement('canvas')
      c0.width = W; c0.height = H
      const ctx0 = c0.getContext('2d')!
      ctx0.filter = 'grayscale(100%)'
      ctx0.drawImage(img, 0, 0, W, H)
      const grayData = ctx0.getImageData(0, 0, W, H).data

      // Canvas blur del negatiu (simula el blur gaussià)
      const cBlur = document.createElement('canvas')
      cBlur.width = W; cBlur.height = H
      const ctxB = cBlur.getContext('2d')!
      // Invertim la imatge grisa
      ctxB.filter = `grayscale(100%) invert(100%) blur(${sigma}px)`
      ctxB.drawImage(img, 0, 0, W, H)
      const blurData = ctxB.getImageData(0, 0, W, H).data

      // Color Dodge
      const out = document.createElement('canvas')
      out.width = W; out.height = H
      const ctxO = out.getContext('2d')!
      const result = ctxO.createImageData(W, H)
      for (let i = 0; i < W * H; i++) {
        const g = grayData[i * 4]         // valor gris original
        const b = blurData[i * 4]         // blur del negatiu
        const v = b >= 254 ? 255 : Math.min(255, Math.round(g * 255 / (255 - b)))
        result.data[i * 4]     = v
        result.data[i * 4 + 1] = v
        result.data[i * 4 + 2] = v
        result.data[i * 4 + 3] = 255
      }
      ctxO.putImageData(result, 0, 0)
      resolve(out.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function LaMemFotoPage() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [sketchUrl, setSketchUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [tool, setTool] = useState<Tool>('fill')
  const [brushType, setBrushType] = useState<BrushType>('round')
  const [brushSize, setBrushSize] = useState(8)
  const [selectedColor, setSelectedColor] = useState('#E63946')
  const canvasRef = useRef<ColoringCanvasHandle>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setProcessing(true)
    try {
      const url = URL.createObjectURL(file)
      setPhotoUrl(url)
      const sketch = await applyPencilSketch(file, 18)
      setSketchUrl(sketch)
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(false)
    }
  }, [])

  const QUICK_COLORS = ['#E63946','#F6C90E','#4CC9F0','#57CC99','#8B5CF6','#F4A261','#1A1A1A','#FFFFFF']

  if (!photoUrl) {
    return (
      <div className="flex flex-col h-dvh overflow-hidden items-center justify-center px-6"
        style={{ background: 'var(--paper)' }}>
        <Link href="/" style={{
          position: 'absolute', top: 20, left: 20,
          textDecoration: 'none', color: 'var(--ink-50)', fontSize: 24,
        }}>←</Link>

        <div style={{ fontSize: 72, marginBottom: 16 }}>📸</div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28,
          color: 'var(--ink)', margin: '0 0 8px', textAlign: 'center',
        }}>
          La teva foto
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-70)',
          textAlign: 'center', margin: '0 0 32px', maxWidth: 300,
        }}>
          Fes una foto o puja un dibuix i el convertirem en un quadre per pintar!
        </p>

        {/* Botons principals */}
        <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 320 }}>
          <button onClick={() => { fileRef.current!.accept='image/*'; fileRef.current!.capture='environment'; fileRef.current!.click() }}
            className="flex items-center gap-3 active:scale-95 transition-transform"
            style={{
              padding: '16px 20px', borderRadius: 20, border: 'none',
              background: `linear-gradient(135deg,${ACCENT},#3a7055)`,
              color: 'white', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
              cursor: 'pointer', boxShadow: '0 6px 20px rgba(78,140,106,0.4)',
            }}>
            <span style={{ fontSize: 28 }}>📷</span>
            <div className="text-left">
              <div>Fes una foto</div>
              <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>Amb la càmera del mòbil</div>
            </div>
          </button>

          <button onClick={() => { fileRef.current!.accept='image/*'; fileRef.current!.removeAttribute('capture'); fileRef.current!.click() }}
            className="flex items-center gap-3 active:scale-95 transition-transform"
            style={{
              padding: '16px 20px', borderRadius: 20, border: `2px solid ${ACCENT}`,
              background: 'white', color: ACCENT,
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
              cursor: 'pointer',
            }}>
            <span style={{ fontSize: 28 }}>🖼️</span>
            <div className="text-left">
              <div>Puja una imatge</div>
              <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>Des de la galeria o arxius</div>
            </div>
          </button>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--ink-35)', fontFamily: 'var(--font-body)' }}>
          La foto no surt de l&apos;aparell — tot es processa al teu dispositiu
        </p>

        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden relative"
      style={{ background: 'radial-gradient(ellipse at 50% 32%, #322E29 0%, #211E1A 62%, #18150F 100%)' }}>

      {/* Header */}
      <header className="flex items-center gap-2 px-3 shrink-0"
        style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
        <Link href="/" style={{
          width: 36, height: 36, borderRadius: 12, fontSize: 17,
          border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.09)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', textDecoration: 'none',
        }}>←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-white truncate"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
            📸 La meva foto
          </h1>
        </div>
        {/* Canviar foto */}
        <button onClick={() => { setPhotoUrl(null); setSketchUrl(null) }}
          className="flex items-center gap-1 active:scale-95 transition-transform"
          style={{
            padding: '6px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.8)',
            fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer',
          }}>
          📷 Canviar
        </button>
        <button onClick={() => canvasRef.current?.undo()}
          style={{
            width: 36, height: 36, borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.09)', color: 'white', fontSize: 16,
            cursor: 'pointer',
          }}>
          ↶
        </button>
        <button onClick={() => canvasRef.current?.clear()}
          style={{
            width: 36, height: 36, borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.09)', color: 'white', fontSize: 16,
            cursor: 'pointer',
          }}>
          🗑️
        </button>
      </header>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center px-3 pt-2 min-h-0"
        style={{ paddingBottom: 140 }}>
        {processing ? (
          <div className="flex flex-col items-center gap-4">
            <div style={{ fontSize: 50, animation: 'bob 1s ease-in-out infinite' }}>🎨</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
              Convertint en dibuix per pintar...
            </p>
          </div>
        ) : photoUrl && sketchUrl ? (
          <ColoringCanvas
            ref={canvasRef}
            imageUrl={photoUrl}
            sketchUrl={sketchUrl}
            selectedColor={selectedColor}
            tool={tool}
            brushSize={brushSize}
            brushType={brushType}
            className="overflow-hidden"
            style={{
              borderRadius: 14,
              boxShadow: '0 18px 40px rgba(35,50,62,0.28), 0 0 0 6px #fff, 0 0 0 7px rgba(35,50,62,0.12)',
            }}
          />
        ) : null}
      </div>

      {/* Safata de colors simplificada */}
      <div className="fixed left-0 right-0 pb-safe"
        style={{
          bottom: 0, zIndex: 40, paddingTop: 10, paddingBottom: 14,
          background: 'linear-gradient(180deg,#F5EAD4 0%, #E7D4B2 100%)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          boxShadow: '0 -8px 22px rgba(0,0,0,0.40)',
          maxWidth: 720, marginLeft: 'auto', marginRight: 'auto',
        }}>
        {/* Eines */}
        <div className="flex items-center justify-center gap-2 px-4 pb-2">
          {[{t:'fill',i:'🪣'},{t:'brush',i:'🖌️'}].map(({t,i}) => (
            <button key={t} onClick={() => setTool(t as Tool)}
              style={{
                padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: tool === t ? ACCENT : 'rgba(74,58,32,0.08)',
                color: tool === t ? 'white' : 'rgba(74,58,32,0.7)',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12.5,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
              <span>{i}</span> {t === 'fill' ? 'Omple' : 'Pinzell'}
            </button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex items-center gap-2 px-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {/* Goma */}
          <button onClick={() => setSelectedColor('#FFFFFF')}
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 40, height: 40, borderRadius: '50%', border: `2px solid ${selectedColor === '#FFFFFF' ? ACCENT : 'rgba(74,58,32,0.2)'}`,
              background: '#fff', cursor: 'pointer', fontSize: 16,
              transform: selectedColor === '#FFFFFF' ? 'scale(1.2)' : 'scale(1)',
            }}>🧹</button>
          {QUICK_COLORS.map(c => (
            <button key={c} onClick={() => setSelectedColor(c)}
              className="shrink-0"
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `radial-gradient(circle at 33% 27%, color-mix(in srgb, ${c} 60%, #fff) 0%, ${c} 50%, color-mix(in srgb, ${c} 74%, #000) 100%)`,
                border: `2px solid ${selectedColor === c ? ACCENT : 'rgba(74,58,32,0.15)'}`,
                transform: selectedColor === c ? 'scale(1.25) translateY(-4px)' : 'scale(1)',
                cursor: 'pointer', transition: 'transform .13s',
                boxShadow: selectedColor === c ? '0 8px 16px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.2)',
              }}/>
          ))}
          {/* Color lliure */}
          <label className="shrink-0 relative" style={{
            width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
            background: 'conic-gradient(from 0deg, #E63946, #F4A261, #F6C90E, #57CC99, #4CC9F0, #8B5CF6, #E63946)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>
            <span style={{
              position: 'absolute', inset: 6, borderRadius: '50%',
              background: selectedColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: 'rgba(74,58,32,0.8)',
            }}>+</span>
            <input type="color" value={selectedColor} onChange={e => setSelectedColor(e.target.value)}
              style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}/>
          </label>
        </div>
      </div>
    </div>
  )
}
