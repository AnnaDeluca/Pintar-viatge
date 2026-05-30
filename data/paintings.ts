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
  imageUrl?: string   // real painting from Wikimedia Commons (public domain)
  thumbUrl?: string   // smaller thumbnail for gallery
}

function img(path: string): string {
  return `/api/img?url=${encodeURIComponent('https://upload.wikimedia.org/wikipedia/commons/' + path)}`
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
    imageUrl: img('thumb/1/1b/Lascaux_painting.jpg/700px-Lascaux_painting.jpg'),
    thumbUrl: img('thumb/1/1b/Lascaux_painting.jpg/400px-Lascaux_painting.jpg'),
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
    imageUrl: img('thumb/0/0a/The_Great_Wave_off_Kanagawa.jpg/700px-The_Great_Wave_off_Kanagawa.jpg'),
    thumbUrl: img('thumb/0/0a/The_Great_Wave_off_Kanagawa.jpg/400px-The_Great_Wave_off_Kanagawa.jpg'),
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
    // No free image; uses SVG component
  },
  // ── Amèrica Llatina ────────────────────────────────────────────
  {
    id: 'kahlo',
    title: 'Autoretrat',
    artist: 'Frida Kahlo',
    year: 1940,
    country: 'Mèxic',
    flag: '🇲🇽',
    emoji: '🌺',
    funFact: 'La Frida pintava mirant-se en un mirall. Aquest quadre és un regal que es va fer a ella mateixa!',
    palette: ['#E63946','#F6C90E','#57CC99','#8B4513','#1A1A1A','#F4A261','#2364AA','#F08080'],
    regions: [],
    imageUrl: img('thumb/0/06/Frida_Kahlo%2C_Self-Portrait_with_Thorn_Necklace_and_Hummingbird_%281940%29.jpg/500px-Frida_Kahlo%2C_Self-Portrait_with_Thorn_Necklace_and_Hummingbird_%281940%29.jpg'),
    thumbUrl: img('thumb/0/06/Frida_Kahlo%2C_Self-Portrait_with_Thorn_Necklace_and_Hummingbird_%281940%29.jpg/300px-Frida_Kahlo%2C_Self-Portrait_with_Thorn_Necklace_and_Hummingbird_%281940%29.jpg'),
  },
  {
    id: 'tarsila',
    title: 'Abaporu',
    artist: 'Tarsila do Amaral',
    year: 1928,
    country: 'Brasil',
    flag: '🇧🇷',
    emoji: '🌵',
    funFact: '"Abaporu" vol dir "l\'home que menja gent" en guaraní. Quin nom tan curiós!',
    palette: ['#4CC9F0','#57CC99','#F6C90E','#E63946','#F4A261','#A0522D','#2364AA','#98D8C8'],
    regions: [],
    imageUrl: img('thumb/b/b7/Tarsila_Abaporu.jpg/500px-Tarsila_Abaporu.jpg'),
    thumbUrl: img('thumb/b/b7/Tarsila_Abaporu.jpg/300px-Tarsila_Abaporu.jpg'),
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
    imageUrl: img('thumb/4/46/Vincent_Willem_van_Gogh_127.jpg/500px-Vincent_Willem_van_Gogh_127.jpg'),
    thumbUrl: img('thumb/4/46/Vincent_Willem_van_Gogh_127.jpg/300px-Vincent_Willem_van_Gogh_127.jpg'),
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
    imageUrl: img('thumb/a/a7/Matisse_Dance_%28II%29.jpg/700px-Matisse_Dance_%28II%29.jpg'),
    thumbUrl: img('thumb/a/a7/Matisse_Dance_%28II%29.jpg/400px-Matisse_Dance_%28II%29.jpg'),
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
    imageUrl: img('thumb/a/a4/Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg/500px-Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg'),
    thumbUrl: img('thumb/a/a4/Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg/300px-Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg'),
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
    imageUrl: img('thumb/b/b4/Vassily_Kandinsky%2C_1913_-_Composition_7.jpg/700px-Vassily_Kandinsky%2C_1913_-_Composition_7.jpg'),
    thumbUrl: img('thumb/b/b4/Vassily_Kandinsky%2C_1913_-_Composition_7.jpg/400px-Vassily_Kandinsky%2C_1913_-_Composition_7.jpg'),
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
    imageUrl: img('thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/600px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg'),
    thumbUrl: img('thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/300px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg'),
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
    imageUrl: img('thumb/6/65/Ndebele_village.jpg/700px-Ndebele_village.jpg'),
    thumbUrl: img('thumb/6/65/Ndebele_village.jpg/400px-Ndebele_village.jpg'),
  },
]

export function getPainting(id: string): PaintingMeta | undefined {
  return paintings.find(p => p.id === id)
}
