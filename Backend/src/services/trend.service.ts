import { pool } from '../config/db';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TrendDirection = 'up' | 'down' | 'stable';
export type OverallTrend = 'mejorando' | 'empeorando' | 'estable' | 'sin_datos';

export interface TrendMetric {
  key: string;
  label: string;
  old_value: number;     // Primera mitad (partidas más antiguas)
  new_value: number;     // Segunda mitad (partidas más recientes)
  change_pct: number;    // % de cambio (positivo = mejora)
  trend: TrendDirection;
  unit: '%' | 'rondas' | 'rituales';
  interpretation: string;
}

export interface TrendResponse {
  games_analyzed: number;
  min_games_required: number;
  has_enough_data: boolean;
  period_label: string;
  metrics: TrendMetric[];
  overall_trend: OverallTrend;
  summary: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MIN_GAMES = 6;       // Mínimo para dividir en dos mitades de 3
const TREND_THRESHOLD = 8; // % mínimo de cambio para considerar tendencia real

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcChangePct(oldVal: number, newVal: number): number {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  return Math.round(((newVal - oldVal) / oldVal) * 100 * 10) / 10;
}

function calcDirection(changePct: number, higherIsBetter: boolean): TrendDirection {
  if (Math.abs(changePct) < TREND_THRESHOLD) return 'stable';
  if (higherIsBetter) return changePct > 0 ? 'up' : 'down';
  return changePct > 0 ? 'down' : 'up';
}

// ─── Query principal ──────────────────────────────────────────────────────────

interface HalfRow {
  total_games: number;
  old_avg_round: number | null;
  new_avg_round: number | null;
  old_jugg_rate: number | null;
  new_jugg_rate: number | null;
  old_pap_rate: number | null;
  new_pap_rate: number | null;
  old_buildable_rate: number | null;
  new_buildable_rate: number | null;
  old_avg_rituals: number | null;
  new_avg_rituals: number | null;
}

async function fetchHalves(userId: number): Promise<HalfRow> {
  const { rows } = await pool.query<HalfRow>(
    `WITH ranked AS (
       SELECT
         round,
         pack_a_punch,
         perks,
         (has_apothicon_servant OR has_apothicon_sword OR has_rocket_shield) AS has_buildable,
         rituals_completed,
         ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn,
         COUNT(*) OVER ()                              AS total_games
       FROM games
       WHERE user_id = $1
     )
     SELECT
       MAX(total_games)::int                                                          AS total_games,
       ROUND(AVG(round)        FILTER (WHERE rn <= total_games / 2)::numeric, 1)::float AS old_avg_round,
       ROUND(AVG(round)        FILTER (WHERE rn >  total_games / 2)::numeric, 1)::float AS new_avg_round,
       ROUND(AVG(CASE WHEN 'juggernog' = ANY(perks) THEN 1.0 ELSE 0 END) FILTER (WHERE rn <= total_games / 2)::numeric, 3)::float AS old_jugg_rate,
       ROUND(AVG(CASE WHEN 'juggernog' = ANY(perks) THEN 1.0 ELSE 0 END) FILTER (WHERE rn >  total_games / 2)::numeric, 3)::float AS new_jugg_rate,
       ROUND(AVG(CASE WHEN pack_a_punch          THEN 1.0 ELSE 0 END) FILTER (WHERE rn <= total_games / 2)::numeric, 3)::float AS old_pap_rate,
       ROUND(AVG(CASE WHEN pack_a_punch          THEN 1.0 ELSE 0 END) FILTER (WHERE rn >  total_games / 2)::numeric, 3)::float AS new_pap_rate,
       ROUND(AVG(CASE WHEN has_buildable         THEN 1.0 ELSE 0 END) FILTER (WHERE rn <= total_games / 2)::numeric, 3)::float AS old_buildable_rate,
       ROUND(AVG(CASE WHEN has_buildable         THEN 1.0 ELSE 0 END) FILTER (WHERE rn >  total_games / 2)::numeric, 3)::float AS new_buildable_rate,
       ROUND(AVG(rituals_completed) FILTER (WHERE rn <= total_games / 2)::numeric, 2)::float AS old_avg_rituals,
       ROUND(AVG(rituals_completed) FILTER (WHERE rn >  total_games / 2)::numeric, 2)::float AS new_avg_rituals
     FROM ranked`,
    [userId],
  );
  return rows[0]!;
}

// ─── Generador de métricas ────────────────────────────────────────────────────

function buildMetrics(row: HalfRow): TrendMetric[] {
  const metrics: TrendMetric[] = [];

  // Ronda promedio
  const oldRound = row.old_avg_round ?? 0;
  const newRound = row.new_avg_round ?? 0;
  const roundChange = calcChangePct(oldRound, newRound);
  metrics.push({
    key: 'avg_round',
    label: 'Ronda promedio',
    old_value: oldRound,
    new_value: newRound,
    change_pct: roundChange,
    trend: calcDirection(roundChange, true),
    unit: 'rondas',
    interpretation:
      roundChange >= TREND_THRESHOLD
        ? `Tu ronda promedio subió de ${oldRound} a ${newRound} — mejora sólida.`
        : roundChange <= -TREND_THRESHOLD
          ? `Tu ronda promedio bajó de ${oldRound} a ${newRound} — revisá los patrones recientes.`
          : `Tu ronda promedio se mantiene estable alrededor de ${newRound}.`,
  });

  // Tasa de Juggernog
  const oldJugg = Math.round((row.old_jugg_rate ?? 0) * 100);
  const newJugg = Math.round((row.new_jugg_rate ?? 0) * 100);
  const juggChange = calcChangePct(oldJugg, newJugg);
  metrics.push({
    key: 'juggernog_rate',
    label: 'Partidas con Juggernog',
    old_value: oldJugg,
    new_value: newJugg,
    change_pct: juggChange,
    trend: calcDirection(juggChange, true),
    unit: '%',
    interpretation:
      juggChange >= TREND_THRESHOLD
        ? `Conseguís Juggernog más seguido (${oldJugg}% → ${newJugg}%) — mejor apertura.`
        : juggChange <= -TREND_THRESHOLD
          ? `Conseguís Juggernog menos seguido (${oldJugg}% → ${newJugg}%) — cuidado con la apertura.`
          : `Tu tasa de Juggernog es constante (${newJugg}%).`,
  });

  // Tasa de PaP
  const oldPap = Math.round((row.old_pap_rate ?? 0) * 100);
  const newPap = Math.round((row.new_pap_rate ?? 0) * 100);
  const papChange = calcChangePct(oldPap, newPap);
  metrics.push({
    key: 'pap_rate',
    label: 'Partidas con Pack-a-Punch',
    old_value: oldPap,
    new_value: newPap,
    change_pct: papChange,
    trend: calcDirection(papChange, true),
    unit: '%',
    interpretation:
      papChange >= TREND_THRESHOLD
        ? `Llegás al PaP más seguido (${oldPap}% → ${newPap}%) — buena progresión económica.`
        : papChange <= -TREND_THRESHOLD
          ? `Llegás al PaP menos seguido (${oldPap}% → ${newPap}%) — revisá tu farm de puntos.`
          : `Tu tasa de PaP es constante (${newPap}%).`,
  });

  // Tasa de buildables
  const oldBuild = Math.round((row.old_buildable_rate ?? 0) * 100);
  const newBuild = Math.round((row.new_buildable_rate ?? 0) * 100);
  const buildChange = calcChangePct(oldBuild, newBuild);
  metrics.push({
    key: 'buildable_rate',
    label: 'Partidas con buildable',
    old_value: oldBuild,
    new_value: newBuild,
    change_pct: buildChange,
    trend: calcDirection(buildChange, true),
    unit: '%',
    interpretation:
      buildChange >= TREND_THRESHOLD
        ? `Construís buildables más seguido (${oldBuild}% → ${newBuild}%) — mejor preparación.`
        : buildChange <= -TREND_THRESHOLD
          ? `Construís buildables menos seguido (${oldBuild}% → ${newBuild}%).`
          : `Tu tasa de buildables es constante (${newBuild}%).`,
  });

  // Rituales promedio
  const oldRit = row.old_avg_rituals ?? 0;
  const newRit = row.new_avg_rituals ?? 0;
  const ritChange = calcChangePct(oldRit, newRit);
  metrics.push({
    key: 'avg_rituals',
    label: 'Rituales completados (promedio)',
    old_value: Math.round(oldRit * 10) / 10,
    new_value: Math.round(newRit * 10) / 10,
    change_pct: ritChange,
    trend: calcDirection(ritChange, true),
    unit: 'rituales',
    interpretation:
      ritChange >= TREND_THRESHOLD
        ? `Completás más rituales por partida (${oldRit.toFixed(1)} → ${newRit.toFixed(1)}) — mejor dominio del mapa.`
        : ritChange <= -TREND_THRESHOLD
          ? `Completás menos rituales por partida (${oldRit.toFixed(1)} → ${newRit.toFixed(1)}).`
          : `Tu progreso en rituales es constante (${newRit.toFixed(1)} por partida).`,
  });

  return metrics;
}

// ─── Overall trend ────────────────────────────────────────────────────────────

function calcOverallTrend(metrics: TrendMetric[]): OverallTrend {
  const ups = metrics.filter((m) => m.trend === 'up').length;
  const downs = metrics.filter((m) => m.trend === 'down').length;
  if (ups === 0 && downs === 0) return 'estable';
  if (ups > downs) return 'mejorando';
  if (downs > ups) return 'empeorando';
  return 'estable';
}

function buildSummary(overall: OverallTrend, metrics: TrendMetric[]): string {
  const roundMetric = metrics.find((m) => m.key === 'avg_round');
  const roundDiff = roundMetric ? (roundMetric.new_value - roundMetric.old_value).toFixed(1) : '0';

  switch (overall) {
    case 'mejorando':
      return `Estás mejorando. Tu ronda promedio subió ${Number(roundDiff) >= 0 ? '+' : ''}${roundDiff} entre tus partidas antiguas y recientes.`;
    case 'empeorando':
      return `Tus métricas recientes bajaron un poco. Revisá los warnings del briefing para identificar qué cambió.`;
    case 'estable':
      return `Tu rendimiento es consistente. Registrá más partidas para detectar tendencias claras.`;
    default:
      return '';
  }
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function fetchTrends(userId: number): Promise<TrendResponse> {
  const row = await fetchHalves(userId);
  const totalGames = row.total_games ?? 0;

  if (totalGames < MIN_GAMES) {
    return {
      games_analyzed: totalGames,
      min_games_required: MIN_GAMES,
      has_enough_data: false,
      period_label: '',
      metrics: [],
      overall_trend: 'sin_datos',
      summary: `Necesitás ${MIN_GAMES - totalGames} partida${MIN_GAMES - totalGames === 1 ? '' : 's'} más para ver tu progresión.`,
    };
  }

  const half = Math.floor(totalGames / 2);
  const metrics = buildMetrics(row);
  const overall = calcOverallTrend(metrics);

  return {
    games_analyzed: totalGames,
    min_games_required: MIN_GAMES,
    has_enough_data: true,
    period_label: `primeras ${half} vs últimas ${totalGames - half}`,
    metrics,
    overall_trend: overall,
    summary: buildSummary(overall, metrics),
  };
}
