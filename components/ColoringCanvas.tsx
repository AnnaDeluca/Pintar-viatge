'use client'

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'

const MAX_DIM = 600

function luma(d: Uint8ClampedArray, i: number) {
  return (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8
}

// ── ADAPTIVE THRESHOLD SKETCH ─────────────────────────────────────────────
// Port de l'algoritme OpenCV: medianBlur + adaptiveThreshold + erode
//   src:     ImageData original (sense blur)
//   blurred: ImageData amb blur(5px) = mitja local (Gaussiana)
//   C:       constant de sensibilitat (C=4 → menys soroll que Color Dodge)
// Sortida: blanc (no-vora) + negre (vora) — compatible amb mixBlendMode multiply
function adaptiveThresholdSketch(src: ImageData, blurred: ImageData, C = 4): ImageData {
  const { data: d, width: W, height: H } = src
  const { data: b } = blurred
  const out = new ImageData(W, H)
  for (let i = 0; i < W * H; i++) {
    const g    = luma(d, i * 4)   // grisos originals
    const mean = luma(b, i * 4)   // mitja local (blur gaussià)
    // negre si el píxel és prou més fosc que el veïnat
    const val = g < mean - C ? 0 : 255
    out.data[i * 4]     = val
    out.data[i * 4 + 1] = val
    out.data[i * 4 + 2] = val
    out.data[i * 4 + 3] = 255
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
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  getZoom: () => number
}

const UNDO_LIMIT = 20  // màxim de passes a guardar (ImageData ocupa molt)

export type Tool = 'fill' | 'brush'
export type BrushType = 'round' | 'marker' | 'crayon' | 'pencil'

interface Props {
  imageUrl: string
  /** SVG pre-generat amb els contorns (a /public/sketches/). Si es present
   *  s'usa en lloc de l'algoritme de detecció a runtime. */
  sketchUrl?: string
  selectedColor: string
  tool?: Tool
  brushSize?: number
  brushType?: BrushType
  onLoadFail?: () => void
  onHistoryChange?: (canUndo: boolean) => void
  onZoomChange?: (zoom: number) => void
  className?: string
  style?: React.CSSProperties
}

const ColoringCanvas = forwardRef<ColoringCanvasHandle, Props>(
  function ColoringCanvas({ imageUrl, sketchUrl, selectedColor, tool = 'fill', brushSize = 20, brushType = 'round', onLoadFail, onHistoryChange, onZoomChange, className = '', style }, ref) {
    const paintRef = useRef<HTMLCanvasElement>(null)
    const edgeRef  = useRef<HTMLCanvasElement>(null)
    const outerRef = useRef<HTMLDivElement>(null)
    const maskData = useRef<Uint8ClampedArray | null>(null)
    const history = useRef<ImageData[]>([])
    const [ready, setReady] = useState(false)
    const [dims, setDims] = useState({ w: 4, h: 3 })
    const [xform, setXform] = useState({ zoom: 1, panX: 0, panY: 0 })
    const activePointers = useRef(new Map<number, { x: number; y: number }>())
    const pinchStart = useRef<{ dist: number; midX: number; midY: number; zoom0: number; panX0: number; panY0: number } | null>(null)
    const paintingActive = useRef(false)
    // Per forçar re-render del botó d'undo quan canviï la història
    const [historyVersion, setHistoryVersion] = useState(0)

    const applyZoom = useCallback((newZoom: number, anchorScreenX?: number, anchorScreenY?: number) => {
      const outer = outerRef.current
      const ow = outer?.clientWidth ?? 400
      const oh = outer?.clientHeight ?? 300
      const ax = anchorScreenX !== undefined ? anchorScreenX - (outer?.getBoundingClientRect().left ?? 0) : ow / 2
      const ay = anchorScreenY !== undefined ? anchorScreenY - (outer?.getBoundingClientRect().top  ?? 0) : oh / 2
      setXform(prev => {
        const innerX = (ax - prev.panX) / prev.zoom
        const innerY = (ay - prev.panY) / prev.zoom
        if (newZoom <= 1) return { zoom: 1, panX: 0, panY: 0 }
        return {
          zoom: newZoom,
          panX: Math.min(0, Math.max(ow * (1 - newZoom), ax - innerX * newZoom)),
          panY: Math.min(0, Math.max(oh * (1 - newZoom), ay - innerY * newZoom)),
        }
      })
    }, [])

    useEffect(() => { onZoomChange?.(xform.zoom) }, [xform.zoom, onZoomChange])

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

    const ZOOM_STEPS = [1, 1.5, 2, 3, 4]

    useImperativeHandle(ref, () => ({
      zoomIn() {
        const next = ZOOM_STEPS.find(s => s > xform.zoom) ?? 4
        applyZoom(next)
      },
      zoomOut() {
        const prev = [...ZOOM_STEPS].reverse().find(s => s < xform.zoom) ?? 1
        applyZoom(prev)
      },
      resetZoom() { setXform({ zoom: 1, panX: 0, panY: 0 }) },
      getZoom() { return xform.zoom },
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
    }), [snapshot, xform.zoom, applyZoom])

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

        paint.width = W; paint.height = H
        edge.width  = W; edge.height  = H

        // Si tenim un SVG pre-generat, l'usem (línies vectorials suaus + Potrace).
        // Si no, fem el processament en runtime amb posterize (fallback).
        const useSketch = !!sketchUrl

        const finalize = () => {
          if (alive) {
            setDims({ w: W, h: H })
            setReady(true)
          }
        }

        const fillWhite = () => {
          const pc = paint.getContext('2d')!
          pc.fillStyle = '#fff'
          pc.fillRect(0, 0, W, H)
        }

        if (useSketch) {
          // Primer construïm la màscara del flood fill des de la imatge original
          // (millor que usar el sketch perquè el sketch pot tenir àrees massa clares)
          try {
            const mc = document.createElement('canvas')
            mc.width = W; mc.height = H
            const mctx = mc.getContext('2d')!
            mctx.drawImage(img, 0, 0, W, H)
            maskData.current = new Uint8ClampedArray(mctx.getImageData(0, 0, W, H).data)
          } catch {}

          // Carrega el sketch (PNG o SVG) i el renderitza al canvas edge
          const sketchImg = new Image()
          sketchImg.crossOrigin = 'anonymous'
          sketchImg.onload = () => {
            if (!alive) return
            try {
              fillWhite()
              const ec = edge.getContext('2d')!
              ec.clearRect(0, 0, W, H)
              ec.drawImage(sketchImg, 0, 0, W, H)
            } catch {
              fillWhite()
            }
            finalize()
          }
          sketchImg.onerror = () => {
            // Si l'SVG falla, fem fallback al posterize de la imatge original
            try {
              const maskCanvas = document.createElement('canvas')
              maskCanvas.width = W; maskCanvas.height = H
              const mc = maskCanvas.getContext('2d')!
              mc.drawImage(img, 0, 0, W, H)
              maskData.current = new Uint8ClampedArray(mc.getImageData(0, 0, W, H).data)

              const origCanvas2 = document.createElement('canvas')
              origCanvas2.width = W; origCanvas2.height = H
              origCanvas2.getContext('2d')!.drawImage(img, 0, 0, W, H)
              const origData2 = origCanvas2.getContext('2d')!.getImageData(0, 0, W, H)

              const blurCanvas = document.createElement('canvas')
              blurCanvas.width = W; blurCanvas.height = H
              const bc = blurCanvas.getContext('2d')!
              bc.filter = 'blur(5px)'
              bc.drawImage(img, 0, 0, W, H)
              fillWhite()
              const edges = adaptiveThresholdSketch(origData2, bc.getImageData(0, 0, W, H))
              edge.getContext('2d')!.putImageData(edges, 0, 0)
            } catch {
              fillWhite()
            }
            finalize()
          }
          sketchImg.src = sketchUrl
        } else {
          // Fallback: adaptive threshold a runtime
          try {
            const maskCanvas = document.createElement('canvas')
            maskCanvas.width = W; maskCanvas.height = H
            const mc = maskCanvas.getContext('2d')!
            mc.drawImage(img, 0, 0, W, H)
            maskData.current = new Uint8ClampedArray(mc.getImageData(0, 0, W, H).data)
            const origData = mc.getImageData(0, 0, W, H)

            const blurCanvas = document.createElement('canvas')
            blurCanvas.width = W; blurCanvas.height = H
            const bc = blurCanvas.getContext('2d')!
            bc.filter = 'blur(5px)'
            bc.drawImage(img, 0, 0, W, H)
            fillWhite()
            const edges = adaptiveThresholdSketch(origData, bc.getImageData(0, 0, W, H))
            edge.getContext('2d')!.putImageData(edges, 0, 0)
          } catch {
            fillWhite()
          }
          finalize()
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
    }, [imageUrl, sketchUrl])  // re-run when imageUrl or sketchUrl changes

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
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePointers.current.size >= 2) {
        // Dos dits: mode pinch/pan — cancel·la el pinzell actiu
        paintingActive.current = false
        lastPos.current = null
        const pts = [...activePointers.current.values()]
        const dx = pts[1].x - pts[0].x
        const dy = pts[1].y - pts[0].y
        pinchStart.current = {
          dist: Math.hypot(dx, dy),
          midX: (pts[0].x + pts[1].x) / 2,
          midY: (pts[0].y + pts[1].y) / 2,
          zoom0: xform.zoom,
          panX0: xform.panX,
          panY0: xform.panY,
        }
        return
      }

      // Un dit: mode pintura
      paintingActive.current = true
      const { x, y } = getCanvasCoords(e)
      if (x < 0 || x >= paint.width || y < 0 || y >= paint.height) return
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
        drawBrushStroke(x, y, x, y)
        lastPos.current = { x, y }
      }
    }, [ready, selectedColor, tool, brushSize, snapshot, xform.zoom, xform.panX, xform.panY])

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePointers.current.size >= 2 && pinchStart.current) {
        // Pinch zoom + pan
        const pts = [...activePointers.current.values()]
        const dx = pts[1].x - pts[0].x
        const dy = pts[1].y - pts[0].y
        const dist = Math.hypot(dx, dy)
        const midX = (pts[0].x + pts[1].x) / 2
        const midY = (pts[0].y + pts[1].y) / 2
        const { dist: d0, midX: mx0, midY: my0, zoom0, panX0, panY0 } = pinchStart.current
        const outer = outerRef.current
        if (!outer) return
        const rect = outer.getBoundingClientRect()
        const newZoom = Math.min(4, Math.max(1, zoom0 * dist / d0))
        // Punt interior fix: on estava el centre del pinch abans
        const innerX = (mx0 - rect.left - panX0) / zoom0
        const innerY = (my0 - rect.top  - panY0) / zoom0
        const ow = outer.clientWidth
        const oh = outer.clientHeight
        const newPanX = midX - rect.left - innerX * newZoom
        const newPanY = midY - rect.top  - innerY * newZoom
        setXform({
          zoom: newZoom,
          panX: newZoom <= 1 ? 0 : Math.min(0, Math.max(ow * (1 - newZoom), newPanX)),
          panY: newZoom <= 1 ? 0 : Math.min(0, Math.max(oh * (1 - newZoom), newPanY)),
        })
        return
      }

      if (!paintingActive.current || tool !== 'brush' || !lastPos.current || !ready) return
      const { x, y } = getCanvasCoords(e)
      drawBrushStroke(lastPos.current.x, lastPos.current.y, x, y)
      lastPos.current = { x, y }
    }, [tool, ready, selectedColor, brushSize])

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      activePointers.current.delete(e.pointerId)
      if (activePointers.current.size < 2) pinchStart.current = null
      if (activePointers.current.size === 0) {
        lastPos.current = null
        paintingActive.current = false
      }
    }, [])

    return (
      <div ref={outerRef} className={`relative bg-white overflow-hidden ${className}`}
        style={{
          width: '100%',
          aspectRatio: `${dims.w}/${dims.h}`,
          maxHeight: '100%',
          ...style,
        }}>
        {/* inner wrapper que es transforma per zoom/pan */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translate(${xform.panX}px, ${xform.panY}px) scale(${xform.zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}>
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
        </div>
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
