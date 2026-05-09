export const ZONES = ['junction', 'canal_district', 'footlight_district', 'waterfront_district', 'the_rift'] as const;
export const CAUSES_OF_DEATH = ['zombie', 'margwa', 'parasite', 'meatball', 'keeper', 'unknown'] as const;
export const PERKS = ['quick_revive', 'juggernog', 'speed_cola', 'double_tap', 'widows_wine', 'mule_kick', 'stamin_up'] as const;
export const CHARACTERS = ['nero', 'jack', 'jessica', 'floyd'] as const;
export const GAME_MODES = ['solo', 'split_screen'] as const;
export const PLATFORMS = ['pc', 'ps3', 'ps4'] as const;
export const GOBBLEGUMS = ['in_plain_sight', 'anywhere_but_here', 'stock_option', 'alchemical_antithesis', 'sword_flay', 'armental_accomplice'] as const;
export const AATS = ['dead_wire', 'blast_furnace', 'turned', 'thunder_wall', 'fireworks'] as const;
export const SOE_WEAPONS = [
  'RK5', 'L-CAR 9', 'Kuda', 'VMP', 'KN-44', 'HVK-30', 'ICR-1', 'M8A7',
  'KRM-26', 'Haymaker 12', 'Bootlegger',
  'Ray Gun', 'Dingo', 'Drakon', 'Brecci', 'SVG-100', 'Apothicon Servant',
] as const;

export type Zone = typeof ZONES[number];
export type CauseOfDeath = typeof CAUSES_OF_DEATH[number];
export type Perk = typeof PERKS[number];
export type Character = typeof CHARACTERS[number];
export type GameMode = typeof GAME_MODES[number];
export type Platform = typeof PLATFORMS[number];
export type Gobblegum = typeof GOBBLEGUMS[number];
export type AAT = typeof AATS[number];

export interface WeaponPap {
  weapon: string;
  pap_count: 0 | 1 | 2;
  aat?: AAT;
}

export interface Game {
  id?: number;
  map: string;
  game_mode: GameMode;
  platform: Platform;
  character?: Character;
  round: number;
  zone: Zone;
  cause_of_death: CauseOfDeath;
  perks: Perk[];
  weapons: string[];
  weapons_pap: WeaponPap[];
  gobblegums: Gobblegum[];
  pack_a_punch: boolean;
  rituals_completed: number;
  has_apothicon_servant: boolean;
  has_apothicon_sword: boolean;
  has_rocket_shield: boolean;
  civil_protector_active: boolean;
  points_at_death?: number;
  notes?: string;
  session_id?: number;
  created_at?: string;
}

export interface RiskResult {
  risk: number;
  recommendations: string[];
}

export interface Stats {
  total_games: number;
  avg_round: number;
  best_zone: string;
  juggernog_avg_round: number;
  no_juggernog_avg_round: number;
  pap_avg_round: number;
  most_common_cause: string;
  most_effective_aat: string;
}

export interface StatsResponse {
  stats: Stats;
  tips: string[];
}
