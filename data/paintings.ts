export interface PaintingMeta {
  id: string
  title: string
  artist: string
  year: number | string
  country: string
  flag: string
  emoji: string
  funFact: string
  palette: string[]
  regions: string[]
  mechanic?: 'fill' | 'dots'
  imageUrl?: string
  thumbUrl?: string
}

export const paintings: PaintingMeta[] = [
  // ── Prehistoria ──────────────────────────────────────────────
  {
    id: 'lascaux',
    title: 'El bisó',
    artist: 'Art rupestre de Lascaux',
    year: '~15 000 a.C.',
    country: 'França',
    flag: '🪨',
    emoji: '🦬',
    funFact: 'Aquestes pintures les van fer persones fa 17.000 anys, amb branques i pols de terra!',
    palette: ['#8B4513','#D2691E','#F4A460','#1A1A1A','#C4A35A','#F5DEB3','#8B0000','#654321'],
    regions: [],
    imageUrl: '/paintings/lascaux.jpg',
    thumbUrl: '/paintings/lascaux-thumb.jpg',
  },
  // ── Asia ─────────────────────────────────────────────────────
  {
    id: 'hokusai',
    title: 'La gran ona',
    artist: 'Katsushika Hokusai',
    year: 1831,
    country: 'Japó',
    flag: '🇯🇵',
    emoji: '🌊',
    funFact: 'El Hokusai tenia 71 anys quan va pintar La gran ona. Mai és tard per fer art!',
    palette: ['#AEE6FF','#2364AA','#FFFFFF','#4CC9F0','#1A1A2E','#E8F4FD','#0A3060'],
    regions: [],
    imageUrl: '/paintings/hokusai.jpg',
    thumbUrl: '/paintings/hokusai-thumb.jpg',
  },
  {
    id: 'kusama',
    title: 'La carbassa',
    artist: 'Yayoi Kusama',
    year: 1994,
    country: 'Japó',
    flag: '🇯🇵',
    emoji: '🎃',
    funFact: 'La Kusama omple tot de punts perquè li agraden des de petita. Tu també pots!',
    palette: ['#1A1A1A','#E63946','#2364AA','#57CC99','#8B5CF6','#F4A261','#F6C90E','#FF6B6B'],
    regions: [],
    mechanic: 'dots',
  },
  // ── Amèrica Llatina ────────────────────────────────────────────
  {
    id: 'kahlo',
    title: 'Bal du Moulin de la Galette',
    artist: 'Pierre-Auguste Renoir',
    year: 1876,
    country: 'França',
    flag: '🇫🇷',
    emoji: '💃',
    funFact: 'El Renoir va pintar aquesta festa al Montmartre de París. Hi ha 40 persones reals retratades!',
    palette: ['#E63946','#F4A261','#57CC99','#AEE6FF','#4CC9F0','#8B5CF6','#F5DEB3','#2364AA'],
    regions: [],
    imageUrl: '/paintings/kahlo.jpg',
    thumbUrl: '/paintings/kahlo-thumb.jpg',
  },
  // ── Europa ────────────────────────────────────────────────────
  {
    id: 'vangogh',
    title: 'Els girasols',
    artist: 'Vincent van Gogh',
    year: 1888,
    country: 'Holanda',
    flag: '🇳🇱',
    emoji: '🌻',
    funFact: 'El Van Gogh va pintar girasols perquè li encantava el sol del sud de França.',
    palette: ['#F6C90E','#F4A261','#A0522D','#E63946','#4CC9F0','#57CC99','#8B6914','#FFD700'],
    regions: [],
    imageUrl: '/paintings/vangogh.jpg',
    thumbUrl: '/paintings/vangogh-thumb.jpg',
  },
  {
    id: 'matisse',
    title: 'La dansa',
    artist: 'Henri Matisse',
    year: 1910,
    country: 'França',
    flag: '🇫🇷',
    emoji: '💃',
    funFact: 'El Matisse va pintar 5 persones ballant en cercle per al palau d\'un senyor rus.',
    palette: ['#E63946','#F4A261','#57CC99','#AEE6FF','#4CC9F0','#FFFFFF','#FF6B6B','#2E8B57'],
    regions: [],
    imageUrl: '/paintings/matisse.jpg',
    thumbUrl: '/paintings/matisse-thumb.jpg',
  },
  {
    id: 'mondrian',
    title: 'Composició en vermell, blau i groc',
    artist: 'Piet Mondrian',
    year: 1930,
    country: 'Holanda',
    flag: '🇳🇱',
    emoji: '🟥',
    funFact: 'El Mondrian només feia servir tres colors: vermell, blau i groc, més blanc i negre.',
    palette: ['#E63946','#F6C90E','#2364AA','#FFFFFF','#F4F1DE','#1A1A1A'],
    regions: [],
    imageUrl: '/paintings/mondrian.jpg',
    thumbUrl: '/paintings/mondrian-thumb.jpg',
  },
  {
    id: 'kandinsky',
    title: 'Composició VII',
    artist: 'Wassily Kandinsky',
    year: 1913,
    country: 'Alemanya',
    flag: '🇩🇪',
    emoji: '⭕',
    funFact: 'El Kandinsky veia colors quan escoltava música. Es diu sinestèsia!',
    palette: ['#E63946','#F4A261','#F6C90E','#57CC99','#4CC9F0','#8B5CF6','#F08080','#FFFFFF'],
    regions: [],
    imageUrl: '/paintings/kandinsky.jpg',
    thumbUrl: '/paintings/kandinsky-thumb.jpg',
  },
  {
    id: 'klimt',
    title: 'El petó',
    artist: 'Gustav Klimt',
    year: 1908,
    country: 'Àustria',
    flag: '🇦🇹',
    emoji: '💛',
    funFact: 'El Klimt feia servir or de veritat als seus quadres. Com si pintés amb tresors!',
    palette: ['#FFD700','#DAA520','#B8860B','#8B6914','#F4A261','#E63946','#2364AA','#57CC99','#F5E6C8'],
    regions: [],
    imageUrl: '/paintings/klimt.jpg',
    thumbUrl: '/paintings/klimt-thumb.jpg',
  },
  // ── Àfrica ────────────────────────────────────────────────────
  {
    id: 'ndebele',
    title: 'Casa decorada',
    artist: 'Art Ndebele',
    year: 'Tradicional',
    country: 'Sud-àfrica',
    flag: '🇿🇦',
    emoji: '🏠',
    funFact: 'Les dones Ndebele pinten les seves cases amb formes geomètriques brillants. És la seva forma d\'art!',
    palette: ['#E63946','#F6C90E','#2364AA','#57CC99','#F4A261','#8B5CF6','#FFFFFF','#1A1A1A'],
    regions: ['wall','frieze','tri1','tri2','tri3','tri4','left','right','center','door','base'],
    imageUrl: '/paintings/ndebele.jpg',
    thumbUrl: '/paintings/ndebele-thumb.jpg',
  },
]

export function getPainting(id: string): PaintingMeta | undefined {
  return paintings.find(p => p.id === id)
}
