import type { Game, WeaponPap } from '../models/game.model';

export interface RiskResult {
  risk: number;
  recommendations: string[];
}

const AAT_LABELS: Record<string, string> = {
  dead_wire: 'Dead Wire',
  blast_furnace: 'Blast Furnace',
  turned: 'Turned',
  thunder_wall: 'Thunder Wall',
  fireworks: 'Fireworks',
};

export const calculateRisk = (game: Omit<Game, 'id' | 'created_at'>): RiskResult => {
  let risk = 0;
  const recommendations: string[] = [];

  const hasJuggernog = game.perks.includes('juggernog');
  const papWeapons = game.weapons_pap.filter((w) => w.pap_count > 0);
  const doublePapWeapons = game.weapons_pap.filter((w) => w.pap_count === 2);
  const hasDeadWire = game.weapons_pap.some((w) => w.aat === 'dead_wire');
  const hasBlastFurnace = game.weapons_pap.some((w) => w.aat === 'blast_furnace');
  const hasTurned = game.weapons_pap.some((w) => w.aat === 'turned');
  const hasStrongAat = hasDeadWire || hasBlastFurnace;

  // Regla 1: sin Juggernog
  if (!hasJuggernog) {
    risk += 0.35;
    recommendations.push('Sin Juggernog eres muy vulnerable — consíguelo antes de la ronda 10.');
  }

  // Regla 2: zona peligrosa
  if (game.zone === 'canal_district' || game.zone === 'junction') {
    risk += 0.2;
    recommendations.push(`La zona "${game.zone}" tiene spawns complejos — entrena en Waterfront o Footlight.`);
  }

  // Regla 3: ronda baja al morir
  if (game.round < 15) {
    risk += 0.25;
    recommendations.push('Morir antes de la ronda 15 indica problemas en el inicio — abre rutas más rápido.');
  } else if (game.round < 25) {
    risk += 0.1;
  }

  // Regla 4: sin PaP en rondas medias
  if (!game.pack_a_punch && game.round >= 20) {
    risk += 0.2;
    recommendations.push('En ronda 20+ sin PaP tus armas son insuficientes — completa los rituales antes.');
  }

  // Regla 5: tiene PaP pero sin AAT en rondas altas
  if (papWeapons.length > 0 && !hasStrongAat && game.round >= 20) {
    risk += 0.15;
    const currentAats = papWeapons.map((w) => (w.aat ? AAT_LABELS[w.aat] : 'sin efecto')).join(', ');
    recommendations.push(
      `Tus armas PaP tienen: ${currentAats}. En rondas altas Dead Wire o Blast Furnace son esenciales — vuelve a PaP para cambiar el efecto (2500 pts).`,
    );
  }

  // Regla 6: tiene Turned en rondas altas
  if (hasTurned && game.round >= 20) {
    risk += 0.1;
    recommendations.push('Turned convierte zombis en aliados pero te quita puntos en rondas altas — cámbialo por Dead Wire o Blast Furnace.');
  }

  // Regla 7: sin buildables en rondas medias
  const buildables = [game.has_apothicon_servant, game.has_apothicon_sword, game.has_rocket_shield];
  if (!buildables.some(Boolean) && game.round >= 15) {
    risk += 0.15;
    recommendations.push('Sin buildables en rondas medias — el Apothicon Servant limpia hordas enteras.');
  }

  // Regla 8: rituales incompletos en rondas altas
  if (game.rituals_completed < 2 && game.round >= 20) {
    risk += 0.1;
    recommendations.push('Pocos rituales completados — sin acceso al PaP el progreso se estanca.');
  }

  // Regla 9: sin Speed Cola en rondas altas
  if (!game.perks.includes('speed_cola') && game.round >= 20) {
    risk += 0.1;
    recommendations.push('Speed Cola reduce el tiempo de recarga a la mitad — esencial en rondas altas.');
  }

  // Bonus informativo: tiene double PaP con buen AAT
  if (doublePapWeapons.some((w) => w.aat === 'dead_wire') ) {
    recommendations.push('Dead Wire x2 PaP: el mejor setup posible para limpiar hordas — ¡bien jugado!');
  }

  risk = Math.min(risk, 1);

  return { risk: Math.round(risk * 100) / 100, recommendations };
};
