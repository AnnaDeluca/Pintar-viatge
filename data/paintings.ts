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

export const paintings: PaintingMeta[] = [
  // ── Prehistoria ──────────────────────────────────────────────
  {
    id: 'lascaux',
    title: 'El bisonte',
    artist: 'Arte rupestre de Lascaux',
    year: '~15 000 a.C.',
    country: 'Francia',
    flag: '🪨',
    emoji: '🦬',
    funFact: '¡Estos bisontes los pintaron personas hace 17 000 años, con ramas y polvo de tierra!',
    palette: ['#8B4513','#D2691E','#F4A460','#1A1A1A','#C4A35A','#F5DEB3','#8B0000','#654321'],
    regions: [],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Lascaux_painting.jpg/700px-Lascaux_painting.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Lascaux_painting.jpg/400px-Lascaux_painting.jpg',
  },
  // ── Asia ─────────────────────────────────────────────────────
  {
    id: 'hokusai',
    title: 'La gran ola',
    artist: 'Katsushika Hokusai',
    year: 1831,
    country: 'Japón',
    flag: '🇯🇵',
    emoji: '🌊',
    funFact: 'Hokusai tenía 71 años cuando pintó La gran ola. ¡Nunca es tarde para hacer arte!',
    palette: ['#AEE6FF','#2364AA','#FFFFFF','#4CC9F0','#1A1A2E','#E8F4FD','#0A3060'],
    regions: [],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/The_Great_Wave_off_Kanagawa.jpg/700px-The_Great_Wave_off_Kanagawa.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/The_Great_Wave_off_Kanagawa.jpg/400px-The_Great_Wave_off_Kanagawa.jpg',
  },
  {
    id: 'kusama',
    title: 'La calabaza',
    artist: 'Yayoi Kusama',
    year: 1994,
    country: 'Japón',
    flag: '🇯🇵',
    emoji: '🎃',
    funFact: 'Kusama llena todo de puntos porque le gustan desde pequeña. ¡Tú también puedes!',
    palette: ['#1A1A1A','#E63946','#2364AA','#57CC99','#8B5CF6','#F4A261','#F6C90E','#FF6B6B'],
    regions: [],
    mechanic: 'dots',
    // No free image; uses SVG component
  },
  // ── América Latina ────────────────────────────────────────────
  {
    id: 'kahlo',
    title: 'Autorretrato',
    artist: 'Frida Kahlo',
    year: 1940,
    country: 'México',
    flag: '🇲🇽',
    emoji: '🌺',
    funFact: 'Frida pintaba mirándose en un espejo. ¡Este cuadro es un regalo que se hizo a sí misma!',
    palette: ['#E63946','#F6C90E','#57CC99','#8B4513','#1A1A1A','#F4A261','#2364AA','#F08080'],
    regions: [],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Frida_Kahlo%2C_Self-Portrait_with_Thorn_Necklace_and_Hummingbird_%281940%29.jpg/500px-Frida_Kahlo%2C_Self-Portrait_with_Thorn_Necklace_and_Hummingbird_%281940%29.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Frida_Kahlo%2C_Self-Portrait_with_Thorn_Necklace_and_Hummingbird_%281940%29.jpg/300px-Frida_Kahlo%2C_Self-Portrait_with_Thorn_Necklace_and_Hummingbird_%281940%29.jpg',
  },
  {
    id: 'tarsila',
    title: 'Abaporu',
    artist: 'Tarsila do Amaral',
    year: 1928,
    country: 'Brasil',
    flag: '🇧🇷',
    emoji: '🌵',
    funFact: '"Abaporu" significa "el hombre que come gente" en guaraní. ¡Qué nombre tan curioso!',
    palette: ['#4CC9F0','#57CC99','#F6C90E','#E63946','#F4A261','#A0522D','#2364AA','#98D8C8'],
    regions: [],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Tarsila_Abaporu.jpg/500px-Tarsila_Abaporu.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Tarsila_Abaporu.jpg/300px-Tarsila_Abaporu.jpg',
  },
  // ── Europa ────────────────────────────────────────────────────
  {
    id: 'vangogh',
    title: 'Los girasoles',
    artist: 'Vincent van Gogh',
    year: 1888,
    country: 'Holanda',
    flag: '🇳🇱',
    emoji: '🌻',
    funFact: 'Van Gogh pintó girasoles porque le encantaba el sol del sur de Francia.',
    palette: ['#F6C90E','#F4A261','#A0522D','#E63946','#4CC9F0','#57CC99','#8B6914','#FFD700'],
    regions: [],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Vincent_Willem_van_Gogh_127.jpg/500px-Vincent_Willem_van_Gogh_127.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Vincent_Willem_van_Gogh_127.jpg/300px-Vincent_Willem_van_Gogh_127.jpg',
  },
  {
    id: 'matisse',
    title: 'La danza',
    artist: 'Henri Matisse',
    year: 1910,
    country: 'Francia',
    flag: '🇫🇷',
    emoji: '💃',
    funFact: 'Matisse pintó 5 personas bailando en círculo para el palacio de un señor ruso.',
    palette: ['#E63946','#F4A261','#57CC99','#AEE6FF','#4CC9F0','#FFFFFF','#FF6B6B','#2E8B57'],
    regions: [],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Matisse_Dance_%28II%29.jpg/700px-Matisse_Dance_%28II%29.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Matisse_Dance_%28II%29.jpg/400px-Matisse_Dance_%28II%29.jpg',
  },
  {
    id: 'mondrian',
    title: 'Composición en rojo, azul y amarillo',
    artist: 'Piet Mondrian',
    year: 1930,
    country: 'Holanda',
    flag: '🇳🇱',
    emoji: '🟥',
    funFact: 'Mondrian solo usaba tres colores: rojo, azul y amarillo, más blanco y negro.',
    palette: ['#E63946','#F6C90E','#2364AA','#FFFFFF','#F4F1DE','#1A1A1A'],
    regions: [],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg/500px-Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg/300px-Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg',
  },
  {
    id: 'kandinsky',
    title: 'Composición VII',
    artist: 'Wassily Kandinsky',
    year: 1913,
    country: 'Alemania',
    flag: '🇩🇪',
    emoji: '⭕',
    funFact: 'Kandinsky veía colores cuando escuchaba música. ¡Se llama sinestesia!',
    palette: ['#E63946','#F4A261','#F6C90E','#57CC99','#4CC9F0','#8B5CF6','#F08080','#FFFFFF'],
    regions: [],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Vassily_Kandinsky%2C_1913_-_Composition_7.jpg/700px-Vassily_Kandinsky%2C_1913_-_Composition_7.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Vassily_Kandinsky%2C_1913_-_Composition_7.jpg/400px-Vassily_Kandinsky%2C_1913_-_Composition_7.jpg',
  },
  {
    id: 'klimt',
    title: 'El beso',
    artist: 'Gustav Klimt',
    year: 1908,
    country: 'Austria',
    flag: '🇦🇹',
    emoji: '💛',
    funFact: 'Klimt usó oro de verdad en sus cuadros. ¡Como si pintara con tesoros!',
    palette: ['#FFD700','#DAA520','#B8860B','#8B6914','#F4A261','#E63946','#2364AA','#57CC99','#F5E6C8'],
    regions: [],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/600px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/300px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg',
  },
  // ── África ────────────────────────────────────────────────────
  {
    id: 'ndebele',
    title: 'Casa decorada',
    artist: 'Arte Ndebele',
    year: 'Tradicional',
    country: 'Sudáfrica',
    flag: '🇿🇦',
    emoji: '🏠',
    funFact: 'Las mujeres Ndebele pintan sus casas con formas geométricas brillantes. ¡Es su forma de arte!',
    palette: ['#E63946','#F6C90E','#2364AA','#57CC99','#F4A261','#8B5CF6','#FFFFFF','#1A1A1A'],
    regions: ['wall','frieze','tri1','tri2','tri3','tri4','left','right','center','door','base'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Ndebele_village.jpg/700px-Ndebele_village.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Ndebele_village.jpg/400px-Ndebele_village.jpg',
  },
]

export function getPainting(id: string): PaintingMeta | undefined {
  return paintings.find(p => p.id === id)
}
