import api from './api';

export type TrendDirection = 'up' | 'down' | 'stable';
export type OverallTrend = 'mejorando' | 'empeorando' | 'estable' | 'sin_datos';

export interface TrendMetric {
  key: string;
  label: string;
  old_value: number;
  new_value: number;
  change_pct: number;
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

export async function getTrends(): Promise<TrendResponse> {
  const { data } = await api.get<TrendResponse>('/api/trends');
  return data;
}
