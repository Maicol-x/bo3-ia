import { pool } from '../config/db';
import type { Game, StatsResponse } from '../models/game.model';

export const insertGame = async (game: Omit<Game, 'id' | 'created_at'>): Promise<Game> => {
  const {
    user_id,
    map, game_mode, platform, character,
    round, zone, cause_of_death,
    perks, weapons_pap, gobblegums,
    pack_a_punch, rituals_completed,
    has_apothicon_servant, has_apothicon_sword,
    has_rocket_shield, civil_protector_active,
    points_at_death, notes,
    session_id,
  } = game;

  const weapons = weapons_pap.map((w) => w.weapon);

  const { rows } = await pool.query<Game>(
    `INSERT INTO games (
      user_id,
      map, game_mode, platform, character,
      round, zone, cause_of_death,
      perks, weapons, weapons_pap, gobblegums,
      pack_a_punch, rituals_completed,
      has_apothicon_servant, has_apothicon_sword,
      has_rocket_shield, civil_protector_active,
      points_at_death, notes, session_id
    ) VALUES (
      $1,
      $2, $3, $4, $5,
      $6, $7, $8,
      $9, $10, $11::jsonb, $12,
      $13, $14,
      $15, $16,
      $17, $18,
      $19, $20, $21
    ) RETURNING *`,
    [
      user_id ?? null,
      map, game_mode, platform, character ?? null,
      round, zone, cause_of_death,
      perks, weapons, JSON.stringify(weapons_pap), gobblegums,
      pack_a_punch, rituals_completed,
      has_apothicon_servant, has_apothicon_sword,
      has_rocket_shield, civil_protector_active,
      points_at_death ?? null, notes ?? null, session_id ?? null,
    ],
  );
  return rows[0]!;
};

export const getAllGames = async (userId?: number): Promise<Game[]> => {
  if (userId !== undefined) {
    const { rows } = await pool.query<Game>(
      'SELECT * FROM games WHERE user_id = $1 ORDER BY id DESC',
      [userId],
    );
    return rows;
  }
  const { rows } = await pool.query<Game>('SELECT * FROM games ORDER BY id DESC');
  return rows;
};

export const fetchStats = async (userId?: number): Promise<StatsResponse> => {
  const filter = userId !== undefined ? 'WHERE user_id = $1' : '';
  const params = userId !== undefined ? [userId] : [];

  const { rows: general } = await pool.query<{ total_games: number; avg_round: number }>(
    `SELECT COUNT(*)::int AS total_games,
            ROUND(AVG(round)::numeric, 1)::float AS avg_round
     FROM games ${filter}`,
    params,
  );

  const { rows: zones } = await pool.query<{ zone: string; avg: number }>(
    `SELECT zone, ROUND(AVG(round)::numeric, 1)::float AS avg
     FROM games ${filter} GROUP BY zone ORDER BY avg DESC LIMIT 1`,
    params,
  );

  const { rows: jugg } = await pool.query<{ has_jugg: boolean; avg_round: number }>(
    `SELECT ('juggernog' = ANY(perks)) AS has_jugg,
            ROUND(AVG(round)::numeric, 1)::float AS avg_round
     FROM games ${filter} GROUP BY has_jugg`,
    params,
  );

  const { rows: pap } = await pool.query<{ pack_a_punch: boolean; avg_round: number }>(
    `SELECT pack_a_punch, ROUND(AVG(round)::numeric, 1)::float AS avg_round
     FROM games ${filter} GROUP BY pack_a_punch`,
    params,
  );

  const { rows: causes } = await pool.query<{ cause_of_death: string }>(
    `SELECT cause_of_death FROM games ${filter}
     GROUP BY cause_of_death ORDER BY COUNT(*) DESC LIMIT 1`,
    params,
  );

  const { rows: aats } = await pool.query<{ aat: string; avg_round: number }>(
    `SELECT wp->>'aat' AS aat,
            ROUND(AVG(round)::numeric, 1)::float AS avg_round
     FROM games ${userId !== undefined ? ', jsonb_array_elements(weapons_pap) AS wp WHERE user_id = $1 AND' : ', jsonb_array_elements(weapons_pap) AS wp WHERE'} wp->>'aat' IS NOT NULL
     GROUP BY aat ORDER BY avg_round DESC LIMIT 1`,
    params,
  );

  const stats = general[0]!;
  const bestZone = zones[0]?.zone ?? 'desconocida';
  const juggAvg = jugg.find((r) => r.has_jugg === true)?.avg_round ?? 0;
  const noJuggAvg = jugg.find((r) => r.has_jugg === false)?.avg_round ?? 0;
  const papAvg = pap.find((r) => r.pack_a_punch === true)?.avg_round ?? 0;
  const mostCommonCause = causes[0]?.cause_of_death ?? 'desconocida';
  const mostEffectiveAat = aats[0]?.aat ?? 'sin datos';

  const tips: string[] = [];

  if (noJuggAvg > 0 && juggAvg > noJuggAvg) {
    tips.push(`Con Juggernog llegas en promedio a ronda ${juggAvg} vs ${noJuggAvg} sin el — priorizalo siempre.`);
  } else if (noJuggAvg > 0) {
    tips.push('Sueles morir sin Juggernog — consiguelo antes de la ronda 10.');
  }
  if (papAvg > 0) {
    tips.push(`Cuando llegas al Pack-a-Punch, tu promedio sube a ronda ${papAvg} — es critico para sobrevivir.`);
  }
  if (bestZone !== 'desconocida') {
    tips.push(`Tu mejor zona es "${bestZone}" — usala para entrenar en rondas altas.`);
  }
  if (mostCommonCause !== 'desconocida') {
    tips.push(`Tu causa de muerte mas frecuente es "${mostCommonCause}" — presta atencion a esa amenaza.`);
  }
  if (stats.avg_round < 20) {
    tips.push('Tu promedio es bajo — enfocate en abrir rutas y conseguir Juggernog en las primeras rondas.');
  }
  if (mostEffectiveAat !== 'sin datos') {
    tips.push(`El AAT "${mostEffectiveAat}" es el que mas se correlaciona con rondas altas en tus partidas.`);
  }
  if (tips.length === 0) {
    tips.push('Registra mas partidas para obtener recomendaciones personalizadas.');
  }

  return {
    stats: {
      total_games: stats.total_games,
      avg_round: stats.avg_round,
      best_zone: bestZone,
      juggernog_avg_round: juggAvg,
      no_juggernog_avg_round: noJuggAvg,
      pap_avg_round: papAvg,
      most_common_cause: mostCommonCause,
      most_effective_aat: mostEffectiveAat,
    },
    tips,
  };
};
