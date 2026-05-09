export const ZONE_LABELS: Record<string, string> = {
  junction:            'Junction',
  canal_district:      'Canal District',
  footlight_district:  'Footlight District',
  waterfront_district: 'Waterfront District',
  the_rift:            'The Rift',
};

export const CHARACTER_LABELS: Record<string, string> = {
  nero:    'Nero',
  jack:    'Jack',
  jessica: 'Jessica',
  floyd:   'Floyd',
};

export const CAUSE_LABELS: Record<string, string> = {
  zombie:   'Zombie',
  margwa:   'Margwa',
  parasite: 'Parásito',
  meatball: 'Meatball',
  keeper:   'Keeper',
  unknown:  'Desconocida',
};

export const PERK_LABELS: Record<string, string> = {
  quick_revive: 'Quick Revive',
  juggernog:    'Juggernog',
  speed_cola:   'Speed Cola',
  double_tap:   'Double Tap II',
  widows_wine:  "Widow's Wine",
  mule_kick:    'Mule Kick',
  stamin_up:    'Stamin-Up',
};

export function label(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return '—';
  return map[key] ?? key;
}
