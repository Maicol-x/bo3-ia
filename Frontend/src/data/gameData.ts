export interface EnemyInfo {
  name: string;
  emoji: string;
  dangerLabel: string;
  dangerColor: string;
  description: string;
  tips: string[];
  bestWeapons: string[];
}

export const ENEMY_INFO: Record<string, EnemyInfo> = {
  zombie: {
    name: 'Zombie',
    emoji: '🧟',
    dangerLabel: 'BAJO',
    dangerColor: '#4caf50',
    description: 'El enemigo base de SoE. Fácil individualmente, pero mortal en hordas compactas en rondas altas.',
    tips: [
      'Apunta siempre a la cabeza para ahorrar munición',
      'No te dejes acorralar en zonas estrechas',
      'En rondas altas (25+) usa armas con AAT elemental',
    ],
    bestWeapons: ['KN-44 (PaP)', 'HVK-30 (PaP)', 'VMP (PaP)', 'Apothicon Servant'],
  },
  margwa: {
    name: 'Margwa',
    emoji: '🐙',
    dangerLabel: 'EXTREMO',
    dangerColor: '#f44336',
    description: 'Mini-jefe con 3 cabezas. Solo se puede dañar cuando abre la boca. Aparece en rondas especiales y al completar rituales.',
    tips: [
      'SOLO puedes dañarlo cuando alguna boca está abierta',
      'Retrocede inmediatamente al aparecer, no lo enfrentes de cerca',
      'El Apothicon Servant lo elimina de un solo disparo bien apuntado',
      'Mantente en movimiento constante para evitar su aplastamiento',
    ],
    bestWeapons: ['Apothicon Servant', 'Ray Gun (PaP)', 'Drakon (PaP)', 'SVG-100 (PaP)'],
  },
  parasite: {
    name: 'Parasite',
    emoji: '🦟',
    dangerLabel: 'MEDIO',
    dangerColor: '#ff9800',
    description: 'Enemigo volador que lanza proyectiles ácidos. Puede sorprenderte desde ángulos inesperados y es difícil de rastrear.',
    tips: [
      'Priorízalos sobre los zombies normales cuando aparecen juntos',
      'Usa armas de disparo rápido para derribarlos en vuelo',
      'Dead Wire y Thunder Wall son muy efectivos contra ellos',
    ],
    bestWeapons: ['VMP (PaP)', 'L-CAR 9 (PaP)', 'HVK-30 (PaP)', 'Kuda (PaP)'],
  },
  meatball: {
    name: 'Meatball',
    emoji: '💥',
    dangerLabel: 'MEDIO',
    dangerColor: '#ff9800',
    description: 'Zombie eléctrico que explota al morir. Su explosión puede dañarte gravemente y hacerte perder perks si estás demasiado cerca.',
    tips: [
      'Nunca lo mates a corta distancia, puede quitarte todas las perks',
      'Usa armas de largo alcance para matarlo desde lejos',
      "Widow's Wine puede absorber su explosión si te alcanza",
    ],
    bestWeapons: ['Drakon (PaP)', 'SVG-100 (PaP)', 'KRM-26 (PaP)', 'Brecci (PaP)'],
  },
  keeper: {
    name: 'Keeper',
    emoji: '💀',
    dangerLabel: 'ALTO',
    dangerColor: '#e91e63',
    description: 'Guardián del Éter. Aparece en fases del Easter Egg. Extremadamente resistente y causa daño masivo con sus ataques.',
    tips: [
      'Asegúrate de tener suficiente munición antes de enfrentarlo',
      'Mantente en movimiento circular constante, nunca estático',
      'Juggernog es OBLIGATORIO para sobrevivir sus ataques',
      'El Apothicon Servant hace daño masivo contra él',
    ],
    bestWeapons: ['Apothicon Servant', 'Ray Gun (PaP)', 'Drakon (PaP)', 'HVK-30 (PaP)'],
  },
  unknown: {
    name: 'Desconocida',
    emoji: '❓',
    dangerLabel: '—',
    dangerColor: '#9e9e9e',
    description: 'Causa de muerte no registrada o desconocida.',
    tips: ['Intenta registrar la causa exacta para que la IA pueda analizarlo mejor'],
    bestWeapons: [],
  },
};

export interface PerkInfo {
  name: string;
  emoji: string;
  color: string;
  priorityLabel: string;
  priorityColor: string;
  description: string;
  effect: string;
}

export const PERK_INFO: Record<string, PerkInfo> = {
  quick_revive: {
    name: 'Quick Revive',
    emoji: '💊',
    color: '#42a5f5',
    priorityLabel: 'ALTA (Solo)',
    priorityColor: '#42a5f5',
    description: 'En solitario te revive automáticamente 3 veces antes de ser eliminado definitivamente. En cooperativo acelera la velocidad de reanimar aliados.',
    effect: 'Solo: 3 auto-revives | Coop: revive más rápido',
  },
  juggernog: {
    name: 'Juggernog',
    emoji: '🛡️',
    color: '#e53935',
    priorityLabel: 'ESENCIAL',
    priorityColor: '#f44336',
    description: 'La perk más importante del juego. Aumenta tu vida base de 100 a 250 HP, permitiéndote sobrevivir muchos más golpes.',
    effect: 'HP: 100 → 250 (+150%)',
  },
  speed_cola: {
    name: 'Speed Cola',
    emoji: '⚡',
    color: '#66bb6a',
    priorityLabel: 'ALTA',
    priorityColor: '#66bb6a',
    description: 'Reduce el tiempo de recarga de todas las armas a la mitad. Crítica en rondas altas donde necesitas disparar más continuamente.',
    effect: 'Recarga: −50% tiempo',
  },
  double_tap: {
    name: 'Double Tap II',
    emoji: '🔫',
    color: '#ffa726',
    priorityLabel: 'ALTA',
    priorityColor: '#ffa726',
    description: 'Duplica tanto la cadencia de disparo como el daño por bala. En la segunda versión de BO3 es extremadamente poderosa.',
    effect: 'Daño ×2 + Cadencia ×2',
  },
  widows_wine: {
    name: "Widow's Wine",
    emoji: '🕷️',
    color: '#8d6e63',
    priorityLabel: 'MEDIA',
    priorityColor: '#a1887f',
    description: 'Al recibir daño, lanza telarañas que inmovilizan zombies cercanos. También aumenta el daño de tus granadas.',
    effect: 'Al recibir daño: ralentiza zombies cercanos',
  },
  mule_kick: {
    name: 'Mule Kick',
    emoji: '🦵',
    color: '#ab47bc',
    priorityLabel: 'BAJA',
    priorityColor: '#ab47bc',
    description: 'Permite llevar un tercer arma simultáneamente. Útil para combinar el Apothicon Servant con dos armas de la caja.',
    effect: '+1 slot de arma (3 armas en total)',
  },
  stamin_up: {
    name: 'Stamin-Up',
    emoji: '👟',
    color: '#26c6da',
    priorityLabel: 'MEDIA',
    priorityColor: '#26c6da',
    description: 'Aumenta la velocidad de movimiento y elimina el límite de duración del sprint. Muy útil para hacer trenes de zombies.',
    effect: 'Velocidad sprint: +7% | Sprint: ilimitado',
  },
};
