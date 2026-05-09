import { pool } from '../config/db';
import { SOE_KNOWLEDGE, getKnowledgeById } from '../data/soe_knowledge';
import type { KnowledgeEntry } from '../data/soe_knowledge';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserPattern {
  total_games: number;
  avg_round: number;
  pct_no_juggernog: number;    // % de partidas sin Juggernog
  pct_early_death: number;     // % de muertes antes de ronda 15
  most_common_cause: string;
  most_deadly_zone: string;
  pct_no_buildable_late: number; // % sin buildable cuando ronda >= 15
  avg_rituals: number;
  pct_no_pap_late: number;    // % sin PaP cuando ronda >= 20
  pct_no_speed_cola_late: number; // % sin Speed Cola cuando ronda >= 20
  avg_points: number | null;
}

export interface BriefingItem {
  title: string;
  message: string;
  detail: string;
}

export interface BriefingResponse {
  games_analyzed: number;
  warnings: BriefingItem[];
  strengths: BriefingItem[];
  base_tips: BriefingItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function entryToItem(entry: KnowledgeEntry): BriefingItem {
  return { title: entry.title, message: entry.tip, detail: entry.detail };
}

function patternItem(title: string, message: string, detail: string): BriefingItem {
  return { title, message, detail };
}

// ─── Consulta de patrones ────────────────────────────────────────────────────

async function getUserPatterns(userId: number): Promise<UserPattern> {
  const [base, lateGames] = await Promise.all([
    pool.query<{
      total_games: number;
      avg_round: number;
      pct_no_juggernog: number;
      pct_early_death: number;
      most_common_cause: string;
      most_deadly_zone: string;
      avg_rituals: number;
      avg_points: number | null;
    }>(
      `SELECT
         COUNT(*)::int                                                          AS total_games,
         ROUND(AVG(round)::numeric, 1)::float                                  AS avg_round,
         ROUND(
           COUNT(*) FILTER (WHERE NOT ('juggernog' = ANY(perks))) * 100.0
           / NULLIF(COUNT(*), 0), 1
         )::float                                                               AS pct_no_juggernog,
         ROUND(
           COUNT(*) FILTER (WHERE round < 15) * 100.0
           / NULLIF(COUNT(*), 0), 1
         )::float                                                               AS pct_early_death,
         (SELECT cause_of_death FROM games
          WHERE user_id = $1
          GROUP BY cause_of_death ORDER BY COUNT(*) DESC LIMIT 1)              AS most_common_cause,
         (SELECT zone FROM games
          WHERE user_id = $1
          GROUP BY zone ORDER BY COUNT(*) DESC LIMIT 1)                        AS most_deadly_zone,
         ROUND(AVG(rituals_completed)::numeric, 1)::float                      AS avg_rituals,
         ROUND(AVG(points_at_death) FILTER (WHERE points_at_death IS NOT NULL)::numeric, 0)::float
                                                                                AS avg_points
       FROM games
       WHERE user_id = $1`,
      [userId],
    ),
    pool.query<{ pct_no_buildable_late: number; pct_no_pap_late: number; pct_no_speed_cola_late: number }>(
      `SELECT
         ROUND(
           COUNT(*) FILTER (WHERE round >= 15 AND NOT has_apothicon_servant AND NOT has_apothicon_sword AND NOT has_rocket_shield) * 100.0
           / NULLIF(COUNT(*) FILTER (WHERE round >= 15), 0), 1
         )::float                                                               AS pct_no_buildable_late,
         ROUND(
           COUNT(*) FILTER (WHERE round >= 20 AND NOT pack_a_punch) * 100.0
           / NULLIF(COUNT(*) FILTER (WHERE round >= 20), 0), 1
         )::float                                                               AS pct_no_pap_late,
         ROUND(
           COUNT(*) FILTER (WHERE round >= 20 AND NOT ('speed_cola' = ANY(perks))) * 100.0
           / NULLIF(COUNT(*) FILTER (WHERE round >= 20), 0), 1
         )::float                                                               AS pct_no_speed_cola_late
       FROM games
       WHERE user_id = $1`,
      [userId],
    ),
  ]);

  const b = base.rows[0]!;
  const l = lateGames.rows[0]!;

  return {
    total_games: b.total_games,
    avg_round: b.avg_round,
    pct_no_juggernog: b.pct_no_juggernog ?? 0,
    pct_early_death: b.pct_early_death ?? 0,
    most_common_cause: b.most_common_cause ?? 'desconocida',
    most_deadly_zone: b.most_deadly_zone ?? 'desconocida',
    avg_rituals: b.avg_rituals ?? 0,
    avg_points: b.avg_points ?? null,
    pct_no_buildable_late: l.pct_no_buildable_late ?? 0,
    pct_no_pap_late: l.pct_no_pap_late ?? 0,
    pct_no_speed_cola_late: l.pct_no_speed_cola_late ?? 0,
  };
}

// ─── Lógica del briefing ─────────────────────────────────────────────────────

function generateBriefing(p: UserPattern): Pick<BriefingResponse, 'warnings' | 'strengths'> {
  const warnings: BriefingItem[] = [];
  const strengths: BriefingItem[] = [];

  // ── Warnings (patrones problemáticos) ──

  if (p.pct_no_juggernog > 40) {
    warnings.push(
      patternItem(
        `Morís sin Juggernog el ${p.pct_no_juggernog}% de las veces`,
        'Juggernog antes de ronda 10, siempre.',
        getKnowledgeById('pk_01')?.detail ?? '',
      ),
    );
  }

  if (p.pct_early_death > 50) {
    warnings.push(
      patternItem(
        `${p.pct_early_death}% de tus partidas terminan antes de ronda 15`,
        'Las primeras rondas definen la partida. Priorizá la apertura y las perks tempranas.',
        getKnowledgeById('ap_02')?.detail ?? '',
      ),
    );
  }

  if (p.pct_no_buildable_late > 60) {
    warnings.push(
      patternItem(
        `Morís sin buildables en ronda 15+ el ${p.pct_no_buildable_late}% de las veces`,
        'Construí el Apothicon Servant antes de ronda 15: sus 3 piezas están en zonas abiertas.',
        getKnowledgeById('bd_01')?.detail ?? '',
      ),
    );
  }

  if (p.pct_no_pap_late > 50) {
    warnings.push(
      patternItem(
        `${p.pct_no_pap_late}% de tus partidas en ronda 20+ terminan sin PaP`,
        'Pack-a-Punch es obligatorio a partir de ronda 20. Guardá 5000 pts.',
        getKnowledgeById('ar_01')?.detail ?? '',
      ),
    );
  }

  if (p.pct_no_speed_cola_late > 60) {
    warnings.push(
      patternItem(
        `${p.pct_no_speed_cola_late}% de tus partidas largas no tienen Speed Cola`,
        'Speed Cola reduce el tiempo de recarga a la mitad. En rondas altas, esa diferencia es vida o muerte.',
        getKnowledgeById('pk_02')?.detail ?? '',
      ),
    );
  }

  if (p.avg_rituals < 1 && p.avg_round > 15) {
    warnings.push(
      patternItem(
        `Promedio de ${p.avg_rituals.toFixed(1)} rituales completados`,
        'Los rituales dan poder significativo. Con 4 completados obtenés la Apothicon Sword.',
        getKnowledgeById('rt_03')?.detail ?? '',
      ),
    );
  }

  const causeMap: Record<string, string> = {
    margwa: 'en_01',
    parasite: 'en_02',
    meatball: 'en_03',
    keeper: 'en_04',
  };
  const causeKnowledge = causeMap[p.most_common_cause];
  if (causeKnowledge) {
    const entry = getKnowledgeById(causeKnowledge);
    if (entry) {
      warnings.push(
        patternItem(
          `Causa de muerte más frecuente: ${p.most_common_cause}`,
          `Consejo específico: ${entry.tip}`,
          entry.detail,
        ),
      );
    }
  }

  if (p.avg_points !== null && p.avg_points > 5000) {
    warnings.push(
      patternItem(
        `Morís con un promedio de ${p.avg_points.toFixed(0)} puntos sin gastar`,
        'Los puntos no sirven después de morir. Si tenés más de 3000 pts, invertí en perks o armas.',
        getKnowledgeById('pt_03')?.detail ?? '',
      ),
    );
  }

  // ── Strengths (cosas que hacés bien) ──

  if (p.pct_no_juggernog <= 20) {
    strengths.push(
      patternItem(
        'Juggernog casi siempre presente',
        `Solo perdés el Juggernog el ${p.pct_no_juggernog}% de las veces. Excelente priorización de apertura.`,
        '',
      ),
    );
  }

  if (p.pct_no_pap_late <= 30 && p.avg_round >= 20) {
    strengths.push(
      patternItem(
        'Buen ritmo de Pack-a-Punch',
        `Llegás al PaP en la mayoría de tus partidas largas. Eso traduce directamente en rondas más altas.`,
        '',
      ),
    );
  }

  if (p.avg_rituals >= 2) {
    strengths.push(
      patternItem(
        `${p.avg_rituals.toFixed(1)} rituales promedio`,
        'Buen progreso en los rituales. Completar los 4 desbloquea la Apothicon Sword.',
        '',
      ),
    );
  }

  if (p.avg_round >= 25) {
    strengths.push(
      patternItem(
        `Promedio de ronda ${p.avg_round.toFixed(1)}`,
        'Tu promedio es sólido. Estás en el rango de jugadores experimentados de SoE.',
        '',
      ),
    );
  }

  return { warnings, strengths };
}

// ─── Base tips siempre presentes ─────────────────────────────────────────────

const BASE_TIP_IDS = ['ap_01', 'pk_01', 'ar_01', 'bd_01', 'rt_02', 'pt_01'];

function getBaseTips(): BriefingItem[] {
  return BASE_TIP_IDS
    .map((id) => getKnowledgeById(id))
    .filter((e): e is KnowledgeEntry => e !== undefined)
    .map(entryToItem);
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function generateUserBriefing(userId: number): Promise<BriefingResponse> {
  const patterns = await getUserPatterns(userId);

  if (patterns.total_games === 0) {
    return {
      games_analyzed: 0,
      warnings: [],
      strengths: [],
      base_tips: SOE_KNOWLEDGE.filter((e) =>
        ['ap_01', 'ap_02', 'pk_01', 'ar_01', 'bd_01', 'rt_02'].includes(e.id),
      ).map(entryToItem),
    };
  }

  const { warnings, strengths } = generateBriefing(patterns);

  return {
    games_analyzed: patterns.total_games,
    warnings,
    strengths,
    base_tips: getBaseTips(),
  };
}
