// Guarda i recupera obres pintades per nens al localStorage.
// El dataUrl és un PNG base64 del canvas.

export interface SavedArtwork {
  id: string
  paintingId: string
  paintingTitle: string
  artist: string
  emoji: string
  childName: string
  artworkName: string
  date: string  // ISO
  dataUrl: string  // PNG base64
}

const STORAGE_KEY = 'pintar-viatge-artworks'

export function loadArtworks(): SavedArtwork[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveArtwork(artwork: Omit<SavedArtwork, 'id' | 'date'>): SavedArtwork {
  const full: SavedArtwork = {
    ...artwork,
    id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  }
  const list = loadArtworks()
  list.unshift(full)
  // Limita a 60 obres per evitar omplir el localStorage
  const trimmed = list.slice(0, 60)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (e) {
    // Si peta per quota, elimina la més antiga i prova de nou
    const reduced = trimmed.slice(0, Math.floor(trimmed.length / 2))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced))
    } catch {
      console.warn('No s\'ha pogut guardar l\'obra:', e)
    }
  }
  return full
}

export function deleteArtwork(id: string): void {
  const list = loadArtworks().filter(a => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function clearAllArtworks(): void {
  localStorage.removeItem(STORAGE_KEY)
}
