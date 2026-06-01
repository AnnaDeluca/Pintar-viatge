'use client'

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'

const MAX_DIM = 600

function luma(d: Uint8ClampedArray, i: number) {
  return (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8
}

// ── POSTERIZE EDGES ────────────────────────────────────────────────────
// Mètode molt millor que Sobel per a estètica de llibre per pintar:
//   1. Quantitza la imatge a N nivells de lluminositat
//   2. Traça les vores entre regions de quantitzacions diferents
// Resultat: línies fines, contínues, netes — com un dibuix real.
//
// La quantització és ADAPTATIVA: usa el rang real del 2%-98% del histograma
// (no fixe 0..255). Així capturem detall a quadres uniformes (Matisse, Velázquez)
// sense saturar els que tenen molt contrast (Hokusai, Cassatt).
function posterizeEdges(src: ImageData, N = 5): ImageData {
  const { data: d, width: W, height: H } = src
  // Calcula lluminositat per píxel
  const L = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) L[i] = luma(d, i * 4)

  // Percentils 2/98 com a rang
  const sorted = Float32Array.from(L).sort()
  const lo = sorted[Math.floor(sorted.length * 0.02)]
  const hi = sorted[Math.floor(sorted.length * 0.98)]
  const range = Math.max(1, hi - lo)

  // Quantitza al rang [0, N)
  const Q = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const norm = Math.max(0, Math.min(1, (L[i] - lo) / range))
    Q[i] = Math.floor(norm * N * 0.9999)
  }

  // Vores: píxel marca'ls com vora si algun veí 4-cardinals té quantum diferent
  const out = new ImageData(W, H)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      if (Q[i] !== Q[i - 1] || Q[i] !== Q[i + 1] ||
          Q[i] !== Q[i - W] || Q[i] !== Q[i + W]) {
        out.data[i * 4 + 3] = 255
      }
    }
  }
  return out
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function colorDist(d: Uint8ClampedArray, i: number, r: number, g: number, b: number) {
  return Math.abs(d[i]-r) + Math.abs(d[i+1]-g) + Math.abs(d[i+2]-b)
}

function floodFill(
  paint: Uint8ClampedArray, mask: Uint8ClampedArray,
  W: number, H: number, sx: number, sy: number,
  fr: number, fg: number, fb: number, tolerance: number,
) {
  const si = (sy * W + sx) * 4
  const tr = mask[si], tg = mask[si+1], tb = mask[si+2]
  if (paint[si]===fr && paint[si+1]===fg && paint[si+2]===fb && paint[si+3]===255) return
  const vis = new Uint8Array(W * H)
  const q: number[] = [sy * W + sx]
  let head = 0
  while (head < q.length) {
    const pos = q[head++]
    if (vis[pos]) continue
    vis[pos] = 1
    const x = pos % W, y = (pos - x) / W
    const mi = pos * 4
    if (colorDist(mask, mi, tr, tg, tb) > tolerance) continue
    paint[mi]=fr; paint[mi+1]=fg; paint[mi+2]=fb; paint[mi+3]=255
    if (x > 0)     q.push(pos-1)
    if (x < W-1)   q.push(pos+1)
    if (y > 0)     q.push(pos-W)
    if (y < H-1)   q.push(pos+W)
  }
}

export interface ColoringCanvasHandle {
  clear: () => void
  undo: () => void
  canUndo: () => boolean
  /** Exporta la composició actual (pintura + contorns) com a PNG data URL */
  exportPng: () => string | null
}

const UNDO_LIMIT = 20  // màxim de passes a guardar (ImageData ocupa molt)

export type Tool = 'fill' | 'brush'
export type BrushType = 'round' | 'marker' | 'crayon' | 'pencil'

interface Props {
  imageUrl: string
  selectedColor: string
  tool?: Tool
  brushSize?: number
  brushType?: BrushType
  onLoadFail?: () => void
  onHistoryChange?: (canUndo: boolean) => void
  className?: string
  style?: React.CSSProperties
}

const ColoringCanvas = forwardRef<ColoringCanvasHandle, Props>(
  function ColoringCanvas({ imageUrl, selectedColor, tool = 'fill', brushSize = 20, brushType = 'round', onLoadFail, onHistoryChange, className = '', style }, ref) {
    const paintRef = useRef<HTMLCanvasElement>(null)
    const edgeRef  = useRef<HTMLCanvasElement>(null)
    const maskData = useRef<Uint8ClampedArray | null>(null)
    const history = useRef<ImageData[]>([])
    const [ready, setReady] = useState(false)
    const [dims, setDims] = useState({ w: 4, h: 3 })
    // Per forçar re-render del botó d'undo quan canviï la història
    const [historyVersion, setHistoryVersion] = useState(0)

    const snapshot = useCallback(() => {
      const c = paintRef.current
      if (!c) return
      const ctx = c.getContext('2d')
      if (!ctx) return
      const data = ctx.getImageData(0, 0, c.width, c.height)
      history.current.push(data)
      // Limita la història per no menjar memòria
      if (history.current.length > UNDO_LIMIT) history.current.shift()
      setHistoryVersion(v => v + 1)
    }, [])
    // stable ref so imageUrl change re-triggers load but onLoadFail doesn't
    const onFailRef = useRef(onLoadFail)
    useEffect(() => { onFailRef.current = onLoadFail }, [onLoadFail])
    const onHistoryChangeRef = useRef(onHistoryChange)
    useEffect(() => { onHistoryChangeRef.current = onHistoryChange }, [onHistoryChange])
    useEffect(() => {
      onHistoryChangeRef.current?.(history.current.length > 0)
    }, [historyVersion])

    useImperativeHandle(ref, () => ({
      clear() {
        const c = paintRef.current
        if (!c) return
        // Snapshot abans de netejar perquè es pugui desfer
        snapshot()
        const ctx = c.getContext('2d')
        if (ctx) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height) }
      },
      undo() {
        const c = paintRef.current
        if (!c) return
        const last = history.current.pop()
        if (!last) return
        const ctx = c.getContext('2d')
        if (ctx) ctx.putImageData(last, 0, 0)
        setHistoryVersion(v => v + 1)
      },
      canUndo() {
        return history.current.length > 0
      },
      exportPng() {
        const paint = paintRef.current
        const edge = edgeRef.current
        if (!paint || !edge) return null
        // Compon pintura + vores en un canvas off-screen
        const out = document.createElement('canvas')
        out.width = paint.width
        out.height = paint.height
        const ctx = out.getContext('2d')
        if (!ctx) return null
        // Fons blanc (per si hi ha transparència)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, out.width, out.height)
        ctx.drawImage(paint, 0, 0)
        // Vores amb multiply per simular l'efecte visual del DOM
        ctx.globalCompositeOperation = 'multiply'
        ctx.drawImage(edge, 0, 0)
        ctx.globalCompositeOperation = 'source-over'
        return out.toDataURL('image/png')
      },
    }), [snapshot])

    useEffect(() => {
      const paint = paintRef.current
      const edge  = edgeRef.current
      if (!paint || !edge) return

      setReady(false)
      maskData.current = null
      history.current = []
      setHistoryVersion(v => v + 1)

      let alive = true
      const failTimer = setTimeout(() => { if (alive) onFailRef.current?.() }, 15000)

      const img = new Image()

      img.onload = () => {
        if (!alive) return
        clearTimeout(failTimer)

        const nw = img.naturalWidth
        const nh = img.naturalHeight
        if (!nw || !nh) { onFailRef.current?.(); return }

        const scale = Math.min(1, MAX_DIM / Math.max(nw, nh))
        const W = Math.round(nw * scale)
        const H = Math.round(nh * scale)

        // Set canvas dimensions (clears canvas content)
        paint.width = W; paint.height = H
        edge.width  = W; edge.height  = H

        try {
          // Canvas per la màscara de flood fill (imatge neta sense blur)
          const maskCanvas = document.createElement('canvas')
          maskCanvas.width = W; maskCanvas.height = H
          const mc = maskCanvas.getContext('2d')!
          mc.drawImage(img, 0, 0, W, H)
          const maskSrc = mc.getImageData(0, 0, W, H)
          maskData.current = new Uint8ClampedArray(maskSrc.data)

          // Blur més fort + N=3 nivells: elimina les línies paral·leles
          // ("isobands") que es formaven amb N=5; una sola línia per forma.
          const blurCanvas = document.createElement('canvas')
          blurCanvas.width = W; blurCanvas.height = H
          const bc = blurCanvas.getContext('2d')!
          bc.filter = 'blur(5px)'
          bc.drawImage(img, 0, 0, W, H)
          bc.filter = 'none'
          const blurSrc = bc.getImageData(0, 0, W, H)

          const pc = paint.getContext('2d')!
          pc.fillStyle = '#fff'
          pc.fillRect(0, 0, W, H)

          // POSTERIZE amb N=3 nivells + percentil 2-98 → línia única
          // i neta per a cada forma (com un llibre per pintar de veritat)
          const edges = posterizeEdges(blurSrc, 3)

          const ec = edge.getContext('2d')!
          ec.putImageData(edges, 0, 0)
        } catch (err) {
          const pc = paint.getContext('2d')
          if (pc) pc.drawImage(img, 0, 0, W, H)
        }

        if (alive) {
          setDims({ w: W, h: H })
          setReady(true)
        }
      }

      img.onerror = () => { if (alive) onFailRef.current?.() }
      img.src = imageUrl

      return () => {
        alive = false
        clearTimeout(failTimer)
        img.onload = null
        img.onerror = null
      }
    }, [imageUrl])  // only re-run when imageUrl changes

    const lastPos = useRef<{ x: number; y: number } | null>(null)

    const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const paint = paintRef.current!
      const rect = paint.getBoundingClientRect()
      return {
        x: Math.floor((e.clientX - rect.left) * (paint.width / rect.width)),
        y: Math.floor((e.clientY - rect.top) * (paint.height / rect.height)),
      }
    }

    const drawBrushStroke = (x0: number, y0: number, x1: number, y1: number) => {
      const paint = paintRef.current!
      const pc = paint.getContext('2d')!
      // Mida normalitzada a l'amplada real del canvas
      const r = (brushSize * paint.width) / 600

      pc.save()
      pc.globalAlpha = 1
      pc.strokeStyle = selectedColor
      pc.fillStyle = selectedColor
      pc.lineCap = 'round'
      pc.lineJoin = 'round'

      if (brushType === 'marker') {
        // Marcador: traç pla amb cantons quadrats, semi-translúcid (capes acumulen)
        pc.lineWidth = r * 2
        pc.lineCap = 'square'
        pc.globalAlpha = 0.6
        pc.beginPath()
        pc.moveTo(x0, y0)
        pc.lineTo(x1, y1)
        pc.stroke()
      } else if (brushType === 'crayon') {
        // Cera: traç amb textura granulada (punts dispersos al llarg de la línia)
        const dx = x1 - x0, dy = y1 - y0
        const dist = Math.max(1, Math.hypot(dx, dy))
        const steps = Math.ceil(dist)
        pc.globalAlpha = 0.45
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const cx = x0 + dx * t
          const cy = y0 + dy * t
          // 3-5 puntets dispersos al voltant del centre
          const dots = 3 + Math.floor(Math.random() * 3)
          for (let j = 0; j < dots; j++) {
            const angle = Math.random() * Math.PI * 2
            const dr = Math.random() * r
            pc.beginPath()
            pc.arc(cx + Math.cos(angle) * dr, cy + Math.sin(angle) * dr, r * 0.35, 0, Math.PI * 2)
            pc.fill()
          }
        }
      } else if (brushType === 'pencil') {
        // Llapis: traç fi semi-translúcid (acumula amb passades)
        pc.lineWidth = Math.max(1, r * 0.6)
        pc.globalAlpha = 0.55
        pc.beginPath()
        pc.moveTo(x0, y0)
        pc.lineTo(x1, y1)
        pc.stroke()
      } else {
        // Rodó (per defecte): traç llis i opac
        pc.lineWidth = r * 2
        pc.beginPath()
        pc.moveTo(x0, y0)
        pc.lineTo(x1, y1)
        pc.stroke()
      }

      pc.restore()
    }

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const paint = paintRef.current
      if (!paint || !ready) return
      e.preventDefault()
      paint.setPointerCapture(e.pointerId)
      const { x, y } = getCanvasCoords(e)
      if (x < 0 || x >= paint.width || y < 0 || y >= paint.height) return

      // Snapshot abans de qualsevol acció — permet desfer
      snapshot()

      if (tool === 'fill') {
        const m = maskData.current
        if (!m) return
        const pc = paint.getContext('2d')!
        const pd = pc.getImageData(0, 0, paint.width, paint.height)
        const [fr, fg, fb] = hexToRgb(selectedColor)
        floodFill(pd.data, m, paint.width, paint.height, x, y, fr, fg, fb, 38)
        pc.putImageData(pd, 0, 0)
      } else {
        // brush: punt inicial
        drawBrushStroke(x, y, x, y)
        lastPos.current = { x, y }
      }
    }, [ready, selectedColor, tool, brushSize, snapshot])

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      if (tool !== 'brush' || !lastPos.current || !ready) return
      e.preventDefault()
      const { x, y } = getCanvasCoords(e)
      drawBrushStroke(lastPos.current.x, lastPos.current.y, x, y)
      lastPos.current = { x, y }
    }, [tool, ready, selectedColor, brushSize])

    const handlePointerUp = useCallback(() => {
      lastPos.current = null
    }, [])

    return (
      <div className={`relative bg-white ${className}`}
        style={{ aspectRatio: `${dims.w}/${dims.h}`, width: '100%', maxHeight: '100%', ...style }}>
        <canvas ref={paintRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: ready ? 'crosshair' : 'default', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        <canvas ref={edgeRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'multiply' }}
        />
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white gap-3">
            <div className="text-5xl animate-bounce">🎨</div>
            <p className="text-sm text-black/40" style={{ fontFamily: 'Nunito,sans-serif' }}>Carregant…</p>
          </div>
        )}
      </div>
    )
  }
)

export default ColoringCanvas
