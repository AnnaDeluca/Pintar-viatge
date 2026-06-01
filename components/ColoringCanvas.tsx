'use client'

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'

const MAX_DIM = 900

function luma(d: Uint8ClampedArray, i: number) {
  return (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8
}

function sobelEdges(src: ImageData, threshold: number): ImageData {
  const { data: d, width: W, height: H } = src
  const out = new ImageData(W, H)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx =
        -luma(d, ((y-1)*W+x-1)*4) - 2*luma(d, (y*W+x-1)*4) - luma(d, ((y+1)*W+x-1)*4) +
         luma(d, ((y-1)*W+x+1)*4) + 2*luma(d, (y*W+x+1)*4) + luma(d, ((y+1)*W+x+1)*4)
      const gy =
        -luma(d, ((y-1)*W+x-1)*4) - 2*luma(d, ((y-1)*W+x)*4) - luma(d, ((y-1)*W+x+1)*4) +
         luma(d, ((y+1)*W+x-1)*4) + 2*luma(d, ((y+1)*W+x)*4) + luma(d, ((y+1)*W+x+1)*4)
      const mag = Math.hypot(gx, gy)
      if (mag > threshold) {
        const i = (y * W + x) * 4
        out.data[i + 3] = Math.min(255, mag * 3.5)
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

export interface ColoringCanvasHandle { clear: () => void }

export type Tool = 'fill' | 'brush'
export type BrushType = 'round' | 'marker' | 'crayon' | 'pencil'

interface Props {
  imageUrl: string
  selectedColor: string
  tool?: Tool
  brushSize?: number
  brushType?: BrushType
  onLoadFail?: () => void
  className?: string
  style?: React.CSSProperties
}

const ColoringCanvas = forwardRef<ColoringCanvasHandle, Props>(
  function ColoringCanvas({ imageUrl, selectedColor, tool = 'fill', brushSize = 20, brushType = 'round', onLoadFail, className = '', style }, ref) {
    const paintRef = useRef<HTMLCanvasElement>(null)
    const edgeRef  = useRef<HTMLCanvasElement>(null)
    const maskData = useRef<Uint8ClampedArray | null>(null)
    const [ready, setReady] = useState(false)
    const [dims, setDims] = useState({ w: 4, h: 3 })
    // stable ref so imageUrl change re-triggers load but onLoadFail doesn't
    const onFailRef = useRef(onLoadFail)
    useEffect(() => { onFailRef.current = onLoadFail }, [onLoadFail])

    useImperativeHandle(ref, () => ({
      clear() {
        const c = paintRef.current
        if (!c) return
        const ctx = c.getContext('2d')
        if (ctx) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height) }
      },
    }))

    useEffect(() => {
      const paint = paintRef.current
      const edge  = edgeRef.current
      if (!paint || !edge) return

      setReady(false)
      maskData.current = null

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

          // Canvas per Sobel: amb blur per eliminar soroll i obtenir contorns nets
          const blurCanvas = document.createElement('canvas')
          blurCanvas.width = W; blurCanvas.height = H
          const bc = blurCanvas.getContext('2d')!
          bc.filter = 'blur(2px)'
          bc.drawImage(img, 0, 0, W, H)
          bc.filter = 'none'
          const blurSrc = bc.getImageData(0, 0, W, H)

          const pc = paint.getContext('2d')!
          pc.fillStyle = '#fff'
          pc.fillRect(0, 0, W, H)

          const ec = edge.getContext('2d')!
          ec.putImageData(sobelEdges(blurSrc, 18), 0, 0)
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
    }, [ready, selectedColor, tool, brushSize])

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
