export type KnowledgeCategory =
  | 'apertura'
  | 'perks'
  | 'enemigos'
  | 'buildables'
  | 'rituales'
  | 'puntos'
  | 'zonas'
  | 'armas';

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  tip: string;       // Consejo accionable, conciso
  detail: string;    // Explicación extendida
}

// ─── APERTURA ────────────────────────────────────────────────────────────────
const aperturaEntries: KnowledgeEntry[] = [
  {
    id: 'ap_01',
    category: 'apertura',
    title: 'Ruta óptima de apertura',
    tip: 'Abre Junction primero: da acceso a 3 zonas simultáneamente.',
    detail:
      'Junction es el hub central del mapa. Abrirlo en rondas 1-3 te da acceso al Canal District, Footlight District y Waterfront District. Desde Junction también podés subir al techo donde está el Pack-a-Punch.',
  },
  {
    id: 'ap_02',
    category: 'apertura',
    title: 'Prioridad primeras 5 rondas',
    tip: 'Ronda 1-3: puntos con cuchillo. Ronda 4-5: conseguir Juggernog.',
    detail:
      'Disparar al cuerpo sin matar y terminar con cuchillo da el máximo de puntos. En rondas 1-5 podés llegar a 2000-3000 puntos extra con esta técnica. Juggernog en ronda 4-5 es el objetivo más importante de la apertura.',
  },
  {
    id: 'ap_03',
    category: 'apertura',
    title: 'Farmear puntos en instakill',
    tip: 'En rondas instakill, golpeá sin matar para multiplicar tus ganancias.',
    detail:
      'Las rondas de powerup instakill son rondas pares en SoE. Si golpeás al zombi repetidamente con el cuchillo antes de matarlo, cada golpe da puntos aunque lo mates en uno. Podés llegar a 300-500 pts por zombi.',
  },
];

// ─── PERKS ───────────────────────────────────────────────────────────────────
const perksEntries: KnowledgeEntry[] = [
  {
    id: 'pk_01',
    category: 'perks',
    title: 'Juggernog — PRIORIDAD 1',
    tip: 'Juggernog antes de la ronda 10 siempre, sin excepciones.',
    detail:
      'Juggernog duplica tu HP efectivo (100 → 250 HP). Sin él, morís de 3-4 golpes desde ronda 10. Está en Canal District (máquina junto al Ruby Rabbit). Cuesta 2500 puntos.',
  },
  {
    id: 'pk_02',
    category: 'perks',
    title: 'Speed Cola — PRIORIDAD 2',
    tip: 'Speed Cola en rondas 15+: recarga en mitad del tiempo, esencial con armas de alto daño.',
    detail:
      'Speed Cola reduce el tiempo de recarga a la mitad. En rondas altas, los zombis te alcanzan durante la recarga. Está en The Rift. Cuesta 3000 puntos.',
  },
  {
    id: 'pk_03',
    category: 'perks',
    title: 'Quick Revive — Solo',
    tip: 'En partidas solo, Quick Revive te da 3 auto-revives. Es gratis en Junction al spawn.',
    detail:
      'Quick Revive en modo solo actúa como 3 vidas extra. Está en Junction (zona de spawn). El costo es 500 puntos. En co-op acelera el tiempo de revive de otros jugadores.',
  },
  {
    id: 'pk_04',
    category: 'perks',
    title: 'Double Tap II — Rondas altas',
    tip: 'Double Tap II duplica el daño de bala: imprescindible sin PaP en rondas 20+.',
    detail:
      'Double Tap II dobla el daño de todas las armas. Combinado con PaP es devastador. Está en Waterfront District. Cuesta 2000 puntos.',
  },
  {
    id: 'pk_05',
    category: 'perks',
    title: "Widow's Wine — Contra hordas",
    tip: "Widow's Wine enreda a los zombis que te golpean: compra tiempo de escape.",
    detail:
      "Widow's Wine crea una explosión de telaraña cuando sos golpeado, inmovilizando zombis cercanos. Ideal en rutas estrechas. Está en Footlight District. Cuesta 4000 puntos.",
  },
];

// ─── ENEMIGOS ─────────────────────────────────────────────────────────────────
const enemigosEntries: KnowledgeEntry[] = [
  {
    id: 'en_01',
    category: 'enemigos',
    title: 'Margwa — Apuntá a la boca',
    tip: 'Cuando el Margwa abre una boca, disparale directo ahí. Ignorá el resto del cuerpo.',
    detail:
      'El Margwa tiene 3 cabezas, cada una con un punto débil (la boca cuando se abre). El cuerpo es prácticamente invulnerable. Dead Wire con PaP x2 puede matarlo de una carga. Aparece desde ronda 8-10 en adelante.',
  },
  {
    id: 'en_02',
    category: 'enemigos',
    title: 'Parásito — Mantenelo a distancia',
    tip: 'El parásito vuela: usá armas de largo alcance. Nunca le tires con una escopeta.',
    detail:
      'Los parásitos son zombis voladores de bajo HP pero muy rápidos. Aparecen en hordas. Con un arma con Dead Wire podés encadenar varios. Suelen aparecer junto a los zombis normales desde ronda 10.',
  },
  {
    id: 'en_03',
    category: 'enemigos',
    title: 'Meatball — No dejes que explote cerca',
    tip: 'Matá al Meatball a distancia. Explota al morir y te puede down.',
    detail:
      'El Meatball es una criatura esférica que se acerca lentamente. Al morir, explota y hace daño de área. Matalo desde lejos antes de que llegue a tu posición. Aparece en rondas medianas-altas.',
  },
  {
    id: 'en_04',
    category: 'enemigos',
    title: 'Keeper — Protocolos de ritual',
    tip: 'El Keeper aparece al completar rituales. Usá el Apothicon Servant para matarlo rápido.',
    detail:
      'El Keeper es el guardián de los rituales. Para completar cada ritual tenés que matar a tu personaje familiar en modo bestia dentro de la zona, y luego al Keeper que aparece. El Apothicon Servant o el Servant con PaP lo matan eficientemente.',
  },
];

// ─── BUILDABLES ───────────────────────────────────────────────────────────────
const buildablesEntries: KnowledgeEntry[] = [
  {
    id: 'bd_01',
    category: 'buildables',
    title: 'Apothicon Servant — La mejor arma del mapa',
    tip: 'El Servant absorbe hordas enteras. Construilo lo antes posible (3 piezas en zonas abiertas).',
    detail:
      'El Apothicon Servant tiene 3 piezas coleccionables: una en Canal District, una en Footlight District y una en Waterfront District. Construís en la mesa de Junction. Absorbe zombis en un vórtice. En modo bestia, podés dispararlo sin consumir cargas.',
  },
  {
    id: 'bd_02',
    category: 'buildables',
    title: 'Apothicon Sword — El arma del endgame',
    tip: 'La Sword mata hordas de 1 golpe. Requiere completar los 4 rituales.',
    detail:
      'La Apothicon Sword es el arma cuerpo a cuerpo más fuerte del mapa. Para obtenerla tenés que completar los 4 rituales (uno por zona), matar a los 4 Keepers, y luego interactuar con el altar en Junction. El kill con la Sword no consume munición.',
  },
  {
    id: 'bd_03',
    category: 'buildables',
    title: 'Rocket Shield — Escudo y arma',
    tip: 'El Rocket Shield bloquea daño frontal y tiene ataque de cohete que mata grupos.',
    detail:
      'El Rocket Shield tiene 3 piezas en Waterfront District. Además de bloquear daño, su ataque especial lanza un cohete que mata zombis en área. Útil cuando perdiste todas las perks y necesitás recuperarte.',
  },
  {
    id: 'bd_04',
    category: 'buildables',
    title: 'Civil Protector — Farm de puntos',
    tip: 'Activá el Civil Protector en Junction. Da puntos y mata zombis por vos cada 90 segs.',
    detail:
      'El Civil Protector es un NPC gigante en Junction que se activa con corriente eléctrica (modo bestia). Mata zombis automáticamente y genera puntos. Hay un exploit conocido donde activándolo repetidamente en ciertos momentos da puntos extra.',
  },
];

// ─── RITUALES ─────────────────────────────────────────────────────────────────
const ritualesEntries: KnowledgeEntry[] = [
  {
    id: 'rt_01',
    category: 'rituales',
    title: 'Orden óptimo de rituales',
    tip: 'Completá el ritual del Rift primero: está cerca de Speed Cola.',
    detail:
      'El ritual en The Rift da acceso directo a Speed Cola. Completar rituales mientras conseguís perks hace el camino más eficiente. El orden recomendado: Rift → Canal District → Waterfront → Footlight.',
  },
  {
    id: 'rt_02',
    category: 'rituales',
    title: 'Cómo completar un ritual',
    tip: 'En modo bestia, matá a tu familiar en la zona del ritual, luego matá al Keeper.',
    detail:
      '1. Activá modo bestia. 2. Buscá a tu personaje familiar en la zona (están marcados). 3. Matalo en modo bestia. 4. El Keeper aparece — matalo con armas normales. 5. El ritual se completa y el personaje sube de nivel. Repetí en las 4 zonas.',
  },
  {
    id: 'rt_03',
    category: 'rituales',
    title: '4 rituales = Apothicon Sword',
    tip: 'Completar los 4 rituales desbloquea la Sword, el arma definitiva del mapa.',
    detail:
      'Completar los 4 rituales activa el altar en Junction. Al interactuar con él en modo bestia conseguís la Apothicon Sword. Vale la pena aunque estés en rondas altas: mata hordas de un solo golpe indefinidamente.',
  },
];

// ─── PUNTOS ───────────────────────────────────────────────────────────────────
const puntosEntries: KnowledgeEntry[] = [
  {
    id: 'pt_01',
    category: 'puntos',
    title: 'Técnica cuerpo-cuchillo',
    tip: 'Disparás al cuerpo (sin matar) y terminás con cuchillo: 130+60 puntos vs 60 de un headshot.',
    detail:
      'Cada disparo al cuerpo da 10 pts, al torso 10 pts, a las piernas 10 pts. Matar con bala da 50 pts extra. Matar con cuchillo da 130 pts. Golpear con bala y rematar con cuchillo suma los 10 + 130 + 10 de bonus.',
  },
  {
    id: 'pt_02',
    category: 'puntos',
    title: 'Modo Bestia para farm',
    tip: 'En modo bestia, el Servant no consume cargas. Usalo para matar sin gastar munición.',
    detail:
      'Activar modo bestia permite disparar el Apothicon Servant gratuitamente. Esto es especialmente útil en rondas altas para matar hordas sin gastar munición real y luego seguir con tu arma principal.',
  },
  {
    id: 'pt_03',
    category: 'puntos',
    title: 'Puntos al morir = partida mal planificada',
    tip: 'Si morís con más de 5000 pts acumulados, debiste haber comprado algo más.',
    detail:
      'Los puntos no sirven una vez muerto. Si llegás a 3000+ puntos antes de tener Juggernog, compralo. Si tenés 5000+ sin Speed Cola, comprala. Los puntos son un recurso temporal, no un objetivo.',
  },
];

// ─── ZONAS ────────────────────────────────────────────────────────────────────
const zonasEntries: KnowledgeEntry[] = [
  {
    id: 'zn_01',
    category: 'zonas',
    title: 'The Rift — Mejor zona de entrenamiento',
    tip: 'The Rift tiene espacio abierto y salidas múltiples: ideal para rondas 20+.',
    detail:
      'The Rift es la zona más amplia de SoE. El spawn de zombis es predecible y hay dos rutas de escape. Además está Speed Cola y el altar de rituales. Es la zona favorita para los estrategas.',
  },
  {
    id: 'zn_02',
    category: 'zonas',
    title: 'Junction — Hub peligroso',
    tip: 'Junction tiene spawns desde 4 direcciones. Evitá quedarte ahí en rondas altas.',
    detail:
      'Junction es el centro del mapa pero también el más peligroso: los zombis vienen de todas las conexiones. Usalo para comprar y activar el Civil Protector, pero entrenás en otras zonas.',
  },
  {
    id: 'zn_03',
    category: 'zonas',
    title: 'Waterfront — Zona versátil',
    tip: 'Waterfront tiene espacio suficiente y contiene Double Tap II y Mule Kick.',
    detail:
      'Waterfront District combina espacio para entrenar con acceso a dos perks importantes. También ahí están las piezas del Rocket Shield. Es una buena zona secundaria si The Rift está comprometido.',
  },
  {
    id: 'zn_04',
    category: 'zonas',
    title: 'Canal District — Zona de apertura',
    tip: 'Canal District contiene Juggernog. Abrilo temprano pero no entrenés ahí en rondas altas.',
    detail:
      'Canal District es angosto y los zombis spawnean muy cerca. Es perfecto para las primeras rondas donde necesitás puntos en espacio reducido, pero en rondas 15+ el espacio limitado es mortal.',
  },
];

// ─── ARMAS ────────────────────────────────────────────────────────────────────
const armasEntries: KnowledgeEntry[] = [
  {
    id: 'ar_01',
    category: 'armas',
    title: 'Pack-a-Punch — Esencial ronda 20+',
    tip: 'Sin PaP, las armas normales hacen el 10% del daño en rondas altas. PaP antes de ronda 20.',
    detail:
      'El daño de los zombis escala exponencialmente por ronda. Sin PaP, desde la ronda 20 en adelante casi ningún arma mata en menos de un cargador. PaP cuesta 5000 pts y está en el techo de Junction.',
  },
  {
    id: 'ar_02',
    category: 'armas',
    title: 'Dead Wire — El mejor AAT',
    tip: 'Dead Wire encadena electricidad entre zombis. Mejor AAT para hordas grandes.',
    detail:
      'Dead Wire es el AAT más versátil: la electricidad salta de zombi a zombi, limpando hordas enteras. Es especialmente efectivo con el Kuda PaP x2 o el VMP. Sobresale en rondas 20-30+.',
  },
  {
    id: 'ar_03',
    category: 'armas',
    title: 'Blast Furnace — Daño de área',
    tip: 'Blast Furnace quema grupos de zombis. Bueno en zonas angostas como Canal District.',
    detail:
      'Blast Furnace causa una explosión de fuego que hace daño continuo. Es menos efectivo que Dead Wire en grupos grandes pero devastador en espacios cerrados donde los zombis van en fila.',
  },
  {
    id: 'ar_04',
    category: 'armas',
    title: 'Kuda — El arma de pared más eficiente',
    tip: 'Kuda PaP x2 con Dead Wire es la combinación más accesible y efectiva del mapa.',
    detail:
      'La Kuda es un SMG de pared en Canal District por 1500 pts. Con PaP x2 (10000 pts total) y Dead Wire, se convierte en una de las mejores armas del mapa. Su alta cadencia de fuego maximiza los procs de Dead Wire.',
  },
  {
    id: 'ar_05',
    category: 'armas',
    title: 'Ray Gun — De la caja',
    tip: 'Ray Gun mata rápido en rondas bajas-medias, pero en rondas altas necesita PaP x2.',
    detail:
      'La Ray Gun es la pistola de maravillas clásica. Con PaP x2 sigue siendo viable en rondas altas. Su splash damage puede hacerte daño a vos mismo en espacios cerrados — usala con cuidado.',
  },
];

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export const SOE_KNOWLEDGE: KnowledgeEntry[] = [
  ...aperturaEntries,
  ...perksEntries,
  ...enemigosEntries,
  ...buildablesEntries,
  ...ritualesEntries,
  ...puntosEntries,
  ...zonasEntries,
  ...armasEntries,
];

export const getKnowledgeById = (id: string): KnowledgeEntry | undefined =>
  SOE_KNOWLEDGE.find((e) => e.id === id);

export const getKnowledgeByCategory = (category: KnowledgeCategory): KnowledgeEntry[] =>
  SOE_KNOWLEDGE.filter((e) => e.category === category);
