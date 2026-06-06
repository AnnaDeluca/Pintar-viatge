'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { paintings, type PaintingMeta } from '@/data/paintings'

const ACCENT = '#D85B3C'

// Regions per als "títols de categoria Netflix"
const REGIONS = [
  { id: 'europa',    label: '🎨 Europa',           countries: ['França','Itàlia','Holanda','Noruega','Espanya','Alemanya','Àustria','Suïssa'] },
  { id: 'america',   label: '🌾 Amèrica del Nord',  countries: ['EUA','EUA/França'] },
  { id: 'latam',     label: '🥁 Amèrica Llatina',   countries: ['Uruguai','Brasil','Mèxic'] },
  { id: 'asia',      label: '🌊 Àsia',              countries: ['Japó','Corea','Corea del Sud','Índia','Xina'] },
  { id: 'africa',    label: '🏠 Àfrica',            countries: ['Sud-àfrica','Egipte'] },
  { id: 'matema',    label: '🔢 Matemàtiques',      countries: ['Matemàtiques'] },
]

// Assigna cada quadre a la seva regió
function groupByRegion() {
  return REGIONS.map(r => ({
    ...r,
    items: paintings.filter(p => r.countries.includes(p.country ?? '')),
  })).filter(r => r.items.length > 0)
}

// ── Card gran estil Netflix ───────────────────────────────────────
function PaintingCard({ p, onPick }: { p: PaintingMeta; onPick: (id: string) => void }) {
  return (
    <button onClick={() => onPick(p.id)}
      className="shrink-0 text-left active:scale-95 transition-transform relative"
      style={{ width: 'min(72vw, 280px)', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
      {/* Imatge */}
      <div style={{ width: '100%', aspectRatio: '3/2', borderRadius: 18, overflow: 'hidden', position: 'relative',
        boxShadow: '0 12px 36px rgba(0,0,0,0.22), 0 0 0 1px rgba(35,50,62,0.08)' }}>
        {p.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.thumbUrl} alt={p.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#efe8d8', fontSize: 60 }}>
            {p.emoji}
          </div>
        )}
        {/* Gradient */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
        {/* Emoji badge */}
        <div style={{ position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '3px 7px', fontSize: 16, backdropFilter: 'blur(6px)' }}>
          {p.emoji}
        </div>
      </div>
      {/* Artista — protagonista */}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
        color: 'var(--ink)', marginTop: 10, lineHeight: 1.15,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {p.artist}
      </div>
      {/* Títol + any */}
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-50)',
        marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {p.emoji} {p.title} · {p.year}
      </div>
    </button>
  )
}

// ── Fila horitzontal per categoria ────────────────────────────────
function RegionRow({ label, items, onPick }: { label: string; items: PaintingMeta[]; onPick: (id: string) => void }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string | null>(null)

  return (
    <section className="shrink-0">
      <h2 style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
        color: 'var(--ink)', margin: '0 0 12px', paddingLeft: 18,
      }}>
        {label}
      </h2>
      <div ref={rowRef} className="flex gap-3 overflow-x-auto"
        style={{ scrollbarWidth: 'none', paddingLeft: 18, paddingRight: 18, paddingBottom: 4 }}>
        {items.map(p => (
          <PaintingCard key={p.id} p={p} onPick={onPick} />
        ))}
      </div>
    </section>
  )
}

export default function AtlasPage() {
  const router = useRouter()
  const regions = groupByRegion()
  const total = paintings.length

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--paper)' }}>

      {/* Header */}
      <header className="flex items-center gap-3 shrink-0 px-4"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 12 }}>
        <Link href="/" style={{
          width: 36, height: 36, borderRadius: 12, border: '1px solid var(--line)',
          background: 'var(--paper-2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', textDecoration: 'none', color: 'var(--ink)', fontSize: 18, flexShrink: 0,
        }}>←</Link>
        <div className="flex-1 min-w-0">
          <h1 style={{
            margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 22, color: 'var(--ink)', lineHeight: 1,
          }}>
            Grans Artistes
          </h1>
          <p style={{
            margin: 0, fontSize: 12, color: 'var(--ink-50)',
            fontFamily: 'var(--font-body)',
          }}>
            {total} obres · Toca per pintar
          </p>
        </div>
        {/* Botó mapa (optional) */}
        <Link href="/atlas/mapa"
          style={{
            padding: '7px 12px', borderRadius: 999, border: '1px solid var(--line)',
            background: 'var(--paper-2)', color: 'var(--ink-70)', textDecoration: 'none',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          }}>
          🌍 Mapa
        </Link>
      </header>

      {/* Galeria Netflix — scroll vertical, files horitzontals */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-7 py-2"
        style={{ scrollbarWidth: 'none' }}>
        {regions.map(r => (
          <RegionRow key={r.id} label={r.label} items={r.items}
            onPick={id => router.push(`/pintar/${id}`)} />
        ))}
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
