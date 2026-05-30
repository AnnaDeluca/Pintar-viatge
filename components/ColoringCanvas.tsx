'use client'

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'

const MAX_DIM = 900

// ── Sobel edge detection ──────────────────────────────────────────────────────
function luma(d: Uint8ClampedArray, i: number) {
  return (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8
}

function sobelEdges(src: ImageData, threshold: number): ImageData {
  const { data: d, width: W, height: H } = src
  const out = new ImageData(W, H)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx =
        -luma(d, ((y - 1) * W + x - 1) * 4) - 2 * luma(d, (y * W + x - 1) * 4) - luma(d, ((y + 1) * W + x - 1) * 4) +
         luma(d, ((y - 1) * W + x + 1) * 4) + 2 * luma(d, (y * W + x + 1) * 4) + luma(d, ((y + 1) * W + x + 1) * 4)
      const gy =
        -luma(d, ((y - 1) * W + x - 1) * 4) - 2 * luma(d, ((y - 1) * W + x) * 4) - luma(d, ((y - 1) * W + x + 1) * 4) +
         luma(d, ((y + 1) * W + x - 1) * 4) + 2 * luma(d, ((y + 1) * W + x) * 4) + luma(d, ((y + 1) * W + x + 1) * 4)
      const mag = Math.hypot(gx, gy)
      const i = (y * W + x) * 4
      if (mag > threshold) {
        // black pixel, alpha proportional to edge strength
        out.data[i + 3] = Math.min(255, mag * 3.5)
      }
    }
  }
  return out
}

// ── Flood fill ────────────────────────────────────────────────────────────────
function colorDist(d: Uint8ClampedArray, i: number, r: number, g: number, b: number) {
  return Math.abs(d[i] - r) + Math.abs(d[i + 1] - g) + Math.abs(d[i + 2] - b)
}

function floodFill(
  paint: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  W: number, H: number,
  sx: number, sy: number,
  fr: number, fg: number, fb: number,
  tolerance: number,
) {
  const si = (sy * W + sx) * 4
  const tr = mask[si], tg = mask[si + 1], tb = mask[si + 2]
  if (paint[si] === fr && paint[si + 1] === fg && paint[si + 2] === fb && paint[si + 3] === 255) return
  const vis = new Uint8Array(W * H)
  const q: number[] = [sy * W + sx]
  let head = 0
  while (head < q.length) {
    const pos = q[head++]
    if (vis[pos]) continue
    vis[pos] = 1
    const x = pos % W
    const y = (pos - x) / W
    const mi = pos * 4
    if (colorDist(mask, mi, tr, tg, tb) > tolerance) continue
    paint[mi] = fr; paint[mi + 1] = fg; paint[mi + 2] = fb; paint[mi + 3] = 255
    if (x > 0)     q.push(pos - 1)
    if (x < W - 1) q.push(pos + 1)
    if (y > 0)     q.push(pos - W)
    if (y < H - 1) q.push(pos + W)
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// ── Component ─────────────────────────────────────────────────────────────────
export interface ColoringCanvasHandle {
  clear: () => void
}

interface Props {
  imageUrl: string
  selectedColor: string
  onLoadFail?: () => void
}

const ColoringCanvas = forwardRef<ColoringCanvasHandle, Props>(
  function ColoringCanvas({ imageUrl, selectedColor, onLoadFail }, ref) {
    const paintRef = useRef<HTMLCanvasElement>(null)
    const edgeRef  = useRef<HTMLCanvasElement>(null)
    const maskData = useRef<Uint8ClampedArray | null>(null)
    const [ready, setReady] = useState(false)
    const [dims, setDims] = useState({ w: 4, h: 3 })

    useImperativeHandle(ref, () => ({
      clear() {
        const c = paintRef.current
        if (!c) return
        const ctx = c.getContext('2d')!
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, c.width, c.height)
      },
    }))

    useEffect(() => {
      setReady(false)
      maskData.current = null
      const paint = paintRef.current
      const edge  = edgeRef.current
      if (!paint || !edge) return

      let cancelled = false

      const applyImage = (img: HTMLImageElement) => {
        if (cancelled) return
        const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight))
        const W = Math.round(img.naturalWidth  * scale)
        const H = Math.round(img.naturalHeight * scale)
        setDims({ w: W, h: H })

        paint.width = W;  paint.height = H
        edge.width  = W;  edge.height  = H

        try {
          const tmp = document.createElement('canvas')
          tmp.width = W; tmp.height = H
          const tc = tmp.getContext('2d')!
          tc.filter = 'blur(1.5px)'
          tc.drawImage(img, 0, 0, W, H)
          const src = tc.getImageData(0, 0, W, H)
          maskData.current = new Uint8ClampedArray(src.data)

          const pc = paint.getContext('2d')!
          pc.fillStyle = '#fff'
          pc.fillRect(0, 0, W, H)

          const ec = edge.getContext('2d')!
          ec.putImageData(sobelEdges(src, 12), 0, 0)
        } catch {
          // Canvas tainted (CORS) — draw image directly, no coloring
          const pc = paint.getContext('2d')!
          pc.drawImage(img, 0, 0, W, H)
        }

        setReady(true)
      }

      // Images served from same origin (/api/img) — no CORS needed, canvas won't be tainted.
      const img1 = new Image()
      img1.onload  = () => applyImage(img1)
      img1.onerror = () => { if (!cancelled) onLoadFail?.() }
      img1.src = imageUrl

      // Fallback: if nothing has loaded after 12 s, call onLoadFail
      const timeout = setTimeout(() => {
        if (!cancelled) onLoadFail?.()
      }, 12000)

      return () => {
        cancelled = true
        clearTimeout(timeout)
        img1.onload = null
        img1.onerror = null
      }
    }, [imageUrl, onLoadFail])

    const handlePointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const paint = paintRef.current
      const m = maskData.current
      if (!paint || !m || !ready) return
      e.preventDefault()
      const rect = paint.getBoundingClientRect()
      const sx = Math.floor((e.clientX - rect.left) * (paint.width  / rect.width))
      const sy = Math.floor((e.clientY - rect.top)  * (paint.height / rect.height))
      if (sx < 0 || sx >= paint.width || sy < 0 || sy >= paint.height) return
      const pc = paint.getContext('2d')!
      const pd = pc.getImageData(0, 0, paint.width, paint.height)
      const [fr, fg, fb] = hexToRgb(selectedColor)
      floodFill(pd.data, m, paint.width, paint.height, sx, sy, fr, fg, fb, 38)
      pc.putImageData(pd, 0, 0)
    }, [ready, selectedColor])

    return (
      <div className="relative bg-white" style={{ aspectRatio: `${dims.w}/${dims.h}`, maxWidth: '100%', maxHeight: '100%' }}>
        {/* Color layer */}
        <canvas ref={paintRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: ready ? 'crosshair' : 'default', touchAction: 'none' }}
          onPointerDown={handlePointer}
        />
        {/* Edge overlay (multiply blend: edges show through over any color) */}
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
