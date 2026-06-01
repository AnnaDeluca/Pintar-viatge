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
  coords?: [number, number]  // [longitud, latitud]
}

export const paintings: PaintingMeta[] = [
  // ── Prehistòria ────────────────────────────────────────────────
  {
    id: 'lascaux',
    title: 'El bisó',
    artist: 'Art rupestre de Lascaux',
    year: '~15 000 a.C.',
    country: 'França',
    flag: '🪨', emoji: '🦬',
    funFact: 'Aquestes pintures les van fer persones fa 17.000 anys, amb branques i pols de terra!',
    palette: ['#8B4513','#D2691E','#F4A460','#1A1A1A','#C4A35A','#F5DEB3','#8B0000','#654321'],
    regions: [],
    imageUrl: '/paintings/lascaux.jpg', thumbUrl: '/paintings/lascaux-thumb.jpg',
    coords: [1.1, 45.0],
  },
  // ── Àsia Oriental ──────────────────────────────────────────────
  {
    id: 'hokusai',
    title: 'La gran ona',
    artist: 'Katsushika Hokusai',
    year: 1831, country: 'Japó', flag: '🇯🇵', emoji: '🌊',
    funFact: 'El Hokusai tenia 71 anys quan va pintar La gran ona. Mai és tard per fer art!',
    palette: ['#AEE6FF','#2364AA','#FFFFFF','#4CC9F0','#1A1A2E','#E8F4FD','#0A3060'],
    regions: [],
    imageUrl: '/paintings/hokusai.jpg', thumbUrl: '/paintings/hokusai-thumb.jpg',
    coords: [139.7, 35.7],
  },
  {
    id: 'kusama',
    title: 'La carbassa',
    artist: 'Yayoi Kusama',
    year: 1994, country: 'Japó', flag: '🇯🇵', emoji: '🎃',
    funFact: 'La Kusama omple tot de punts perquè li agraden des de petita. Tu també pots!',
    palette: ['#1A1A1A','#E63946','#2364AA','#57CC99','#8B5CF6','#F4A261','#F6C90E','#FF6B6B'],
    regions: [], mechanic: 'dots',
    coords: [139.7, 36.0],
  },
  // ── Amèrica del Nord ───────────────────────────────────────────
  {
    id: 'homer',
    title: 'El joc de la corda',
    artist: 'Winslow Homer',
    year: 1872, country: 'EUA', flag: '🇺🇸', emoji: '🌾',
    funFact: 'Homer va pintar nens jugant als camps d\'Amèrica. És un dels quadres més estimats dels EUA!',
    palette: ['#57CC99','#4CC9F0','#F6C90E','#8B4513','#F4A261','#2364AA','#E8F4FD','#2E8B57'],
    regions: [],
    imageUrl: '/paintings/homer.jpg', thumbUrl: '/paintings/homer-thumb.jpg',
    coords: [-82.5, 41.0],
  },
  {
    id: 'sargent',
    title: 'Clavells, llirs i roses',
    artist: 'John Singer Sargent',
    year: 1886, country: 'EUA', flag: '🇺🇸', emoji: '🌸',
    funFact: 'Sargent va pintar aquest quadre a l\'aire lliure, de nit, amb llanternes de paper japonès. Quina il·luminació tan màgica!',
    palette: ['#E63946','#FF6B6B','#FFFFFF','#57CC99','#F4A261','#F093FB','#2E8B57','#FFD700'],
    regions: [],
    imageUrl: '/paintings/sargent.jpg', thumbUrl: '/paintings/sargent-thumb.jpg',
    coords: [-1.8, 52.1],
  },
  // ── Europa (Itàlia) ────────────────────────────────────────────
  {
    id: 'botticelli',
    title: 'El naixement de Venus',
    artist: 'Sandro Botticelli',
    year: 1485, country: 'Itàlia', flag: '🇮🇹', emoji: '🐚',
    funFact: 'La Venus de Botticelli mesura 2 metres d\'alçada! La van pintar per a una família molt rica de Florència.',
    palette: ['#4CC9F0','#AEE6FF','#F5DEB3','#E63946','#F4A261','#57CC99','#8B4513','#FFD700'],
    regions: [],
    imageUrl: '/paintings/botticelli.jpg', thumbUrl: '/paintings/botticelli-thumb.jpg',
    coords: [11.2, 43.8],
  },
  {
    id: 'artemisia',
    title: 'Autoretrat amb llaüt',
    artist: 'Artemisia Gentileschi',
    year: 1617, country: 'Itàlia', flag: '🇮🇹', emoji: '🎵',
    funFact: 'L\'Artemisia es va pintar a ella mateixa tocant el llaüt! Va ser la primera dona admesa a l\'Acadèmia de les Arts de Florència.',
    palette: ['#2364AA','#4CC9F0','#8B4513','#F5DEB3','#1A1A1A','#654321','#C4A35A','#F4A261'],
    regions: [],
    imageUrl: '/paintings/artemisia.jpg', thumbUrl: '/paintings/artemisia-thumb.jpg',
    coords: [12.5, 41.9],
  },
  {
    id: 'sofonisba',
    title: 'El joc d\'escacs',
    artist: 'Sofonisba Anguissola',
    year: 1555, country: 'Itàlia', flag: '🇮🇹', emoji: '♟️',
    funFact: 'La Sofonisba va pintar les seves germanes jugant als escacs quan tenia 23 anys. Va ser mestra de pintura de la reina d\'Espanya!',
    palette: ['#1A1A2E','#F5DEB3','#2364AA','#8B4513','#E63946','#57CC99','#C4A35A','#FFFFFF'],
    regions: [],
    imageUrl: '/paintings/sofonisba.jpg', thumbUrl: '/paintings/sofonisba-thumb.jpg',
    coords: [9.7, 45.4],
  },
  // ── Europa (França) ────────────────────────────────────────────
  {
    id: 'renoir',
    title: 'Bal du Moulin de la Galette',
    artist: 'Pierre-Auguste Renoir',
    year: 1876, country: 'França', flag: '🇫🇷', emoji: '💃',
    funFact: 'El Renoir va pintar aquesta festa al Montmartre de París. Hi ha 40 persones reals retratades!',
    palette: ['#E63946','#F4A261','#57CC99','#AEE6FF','#4CC9F0','#8B5CF6','#F5DEB3','#2364AA'],
    regions: [],
    imageUrl: '/paintings/kahlo.jpg', thumbUrl: '/paintings/kahlo-thumb.jpg',
    coords: [2.3, 48.9],
  },
  {
    id: 'morisot',
    title: 'El bressol',
    artist: 'Berthe Morisot',
    year: 1872, country: 'França', flag: '🇫🇷', emoji: '👶',
    funFact: 'La Morisot va ser la primera dona a exposar amb els impressionistes. Va pintar la seva germana mirant el seu nadó.',
    palette: ['#FFFFFF','#AEE6FF','#F5DEB3','#4CC9F0','#E8F4FD','#57CC99','#2364AA','#F4A261'],
    regions: [],
    imageUrl: '/paintings/morisot.jpg', thumbUrl: '/paintings/morisot-thumb.jpg',
    coords: [2.4, 48.8],
  },
  {
    id: 'matisse',
    title: 'La dansa',
    artist: 'Henri Matisse',
    year: 1910, country: 'França', flag: '🇫🇷', emoji: '💃',
    funFact: 'El Matisse va pintar 5 persones ballant en cercle per al palau d\'un senyor rus.',
    palette: ['#E63946','#F4A261','#57CC99','#AEE6FF','#4CC9F0','#FFFFFF','#FF6B6B','#2E8B57'],
    regions: [],
    imageUrl: '/paintings/matisse.jpg', thumbUrl: '/paintings/matisse-thumb.jpg',
    coords: [2.4, 47.5],
  },
  {
    id: 'vigee',
    title: 'Autoretrat amb barret de palla',
    artist: 'Élisabeth Vigée Le Brun',
    year: 1782, country: 'França', flag: '🇫🇷', emoji: '🎨',
    funFact: 'La Vigée Le Brun era la pintora oficial de la reina Maria Antonieta. Va haver de fugir de França durant la Revolució!',
    palette: ['#1A1A2E','#F5DEB3','#57CC99','#4CC9F0','#E63946','#8B4513','#F4A261','#FFFFFF'],
    regions: [],
    imageUrl: '/paintings/vigee.jpg', thumbUrl: '/paintings/vigee-thumb.jpg',
    coords: [2.3, 48.85],
  },
  // ── Europa (Holanda) ───────────────────────────────────────────
  {
    id: 'vangogh',
    title: 'Els girasols',
    artist: 'Vincent van Gogh',
    year: 1888, country: 'Holanda', flag: '🇳🇱', emoji: '🌻',
    funFact: 'El Van Gogh va pintar girasols perquè li encantava el sol del sud de França.',
    palette: ['#F6C90E','#F4A261','#A0522D','#E63946','#4CC9F0','#57CC99','#8B6914','#FFD700'],
    regions: [],
    imageUrl: '/paintings/vangogh.jpg', thumbUrl: '/paintings/vangogh-thumb.jpg',
    coords: [4.9, 52.4],
  },
  {
    id: 'cassatt',
    title: 'El bany de la nena',
    artist: 'Mary Cassatt',
    year: 1893, country: 'EUA/França', flag: '🇺🇸', emoji: '🛁',
    funFact: 'La Mary Cassatt era americana però va viure a París i es va fer amiga dels impressionistes francesos. Va ser la primera americana a exposar amb ells!',
    palette: ['#AEE6FF','#F5DEB3','#E8F4FD','#57CC99','#4CC9F0','#F4A261','#FFFFFF','#8B4513'],
    regions: [],
    imageUrl: '/paintings/cassatt.jpg', thumbUrl: '/paintings/cassatt-thumb.jpg',
    coords: [4.9, 52.5],
  },
  {
    id: 'vermeer',
    title: 'Noia amb arracada de perla',
    artist: 'Johannes Vermeer',
    year: 1665, country: 'Holanda', flag: '🇳🇱', emoji: '💎',
    funFact: 'Ningú sap qui és la noia del quadre. Pot ser la filla de Vermeer, o potser es va inventar!',
    palette: ['#1A1A2E','#4CC9F0','#F5DEB3','#FFFFFF','#8B6914','#2364AA','#E8D5B7','#0A3060'],
    regions: [],
    imageUrl: '/paintings/vermeer.jpg', thumbUrl: '/paintings/vermeer-thumb.jpg',
    coords: [4.4, 52.0],
  },
  {
    id: 'mondrian',
    title: 'Composició en vermell, blau i groc',
    artist: 'Piet Mondrian',
    year: 1930, country: 'Holanda', flag: '🇳🇱', emoji: '🟥',
    funFact: 'El Mondrian només feia servir tres colors: vermell, blau i groc, més blanc i negre.',
    palette: ['#E63946','#F6C90E','#2364AA','#FFFFFF','#F4F1DE','#1A1A1A'],
    regions: [],
    imageUrl: '/paintings/mondrian.jpg', thumbUrl: '/paintings/mondrian-thumb.jpg',
    coords: [4.9, 52.2],
  },
  // ── Europa (Noruega) ───────────────────────────────────────────
  {
    id: 'munch',
    title: 'El crit',
    artist: 'Edvard Munch',
    year: 1893, country: 'Noruega', flag: '🇳🇴', emoji: '😱',
    funFact: 'El Munch va dir que va sentir "un crit infinit de la natura" mentre passejava. Va pintar el cel de vermell per mostrar la por!',
    palette: ['#E63946','#F4A261','#F6C90E','#1A1A2E','#4CC9F0','#8B4513','#FF6B6B','#0A3060'],
    regions: [],
    imageUrl: '/paintings/munch.jpg', thumbUrl: '/paintings/munch-thumb.jpg',
    coords: [10.7, 59.9],
  },
  // ── Europa (Espanya) ───────────────────────────────────────────
  {
    id: 'lewitt',
    title: 'Mural de Barcelona',
    artist: 'Sol LeWitt',
    year: 2002, country: 'Espanya', flag: '🇪🇸', emoji: '🔷',
    funFact: 'El Sol LeWitt no pintava els seus murals: donava instruccions als ajudants! Aquest mural ENORME el pots veure al vestíbul del CaixaForum Barcelona.',
    palette: ['#E63946','#F6C90E','#2364AA','#1A1A1A','#FFFFFF','#57CC99','#8B5CF6','#F4A261'],
    regions: [],
    imageUrl: '/paintings/lewitt.jpg', thumbUrl: '/paintings/lewitt-thumb.jpg',
    coords: [2.15, 41.38],
  },
  {
    id: 'velazquez',
    title: 'Les Menines',
    artist: 'Diego Velázquez',
    year: 1656, country: 'Espanya', flag: '🇪🇸', emoji: '👑',
    funFact: 'En aquest quadre, el pintor es va retratar a ell mateix pintant! Es veu al fons amb el pinzell.',
    palette: ['#1A1A2E','#8B4513','#F5DEB3','#E63946','#2364AA','#4CC9F0','#654321','#C8A882'],
    regions: [],
    imageUrl: '/paintings/velazquez.jpg', thumbUrl: '/paintings/velazquez-thumb.jpg',
    coords: [-3.7, 40.4],
  },
  // ── Europa (Alemanya/Àustria) ──────────────────────────────────
  {
    id: 'kandinsky',
    title: 'Composició VII',
    artist: 'Wassily Kandinsky',
    year: 1913, country: 'Alemanya', flag: '🇩🇪', emoji: '⭕',
    funFact: 'El Kandinsky veia colors quan escoltava música. Es diu sinestèsia!',
    palette: ['#E63946','#F4A261','#F6C90E','#57CC99','#4CC9F0','#8B5CF6','#F08080','#FFFFFF'],
    regions: [],
    imageUrl: '/paintings/kandinsky.jpg', thumbUrl: '/paintings/kandinsky-thumb.jpg',
    coords: [11.6, 48.1],
  },
  {
    id: 'klimt',
    title: 'El petó',
    artist: 'Gustav Klimt',
    year: 1908, country: 'Àustria', flag: '🇦🇹', emoji: '💛',
    funFact: 'El Klimt feia servir or de veritat als seus quadres. Com si pintés amb tresors!',
    palette: ['#FFD700','#DAA520','#B8860B','#8B6914','#F4A261','#E63946','#2364AA','#57CC99','#F5E6C8'],
    regions: [],
    imageUrl: '/paintings/klimt.jpg', thumbUrl: '/paintings/klimt-thumb.jpg',
    coords: [16.4, 48.2],
  },
  // ── Àfrica ─────────────────────────────────────────────────────
  {
    id: 'ndebele',
    title: 'Casa decorada',
    artist: 'Art Ndebele',
    year: 'Tradicional', country: 'Sud-àfrica', flag: '🇿🇦', emoji: '🏠',
    funFact: 'Les dones Ndebele pinten les seves cases amb formes geomètriques brillants. És la seva forma d\'art!',
    palette: ['#E63946','#F6C90E','#2364AA','#57CC99','#F4A261','#8B5CF6','#FFFFFF','#1A1A1A'],
    regions: ['wall','frieze','tri1','tri2','tri3','tri4','left','right','center','door','base'],
    imageUrl: '/paintings/ndebele.jpg', thumbUrl: '/paintings/ndebele-thumb.jpg',
    coords: [28.0, -26.0],
  },
]

export function getPainting(id: string): PaintingMeta | undefined {
  return paintings.find(p => p.id === id)
}
