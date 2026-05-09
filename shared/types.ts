// Tipos compartidos entre frontend y backend

export interface Game {
  id?: number;
  round: number;
  juggernog: boolean;
  perks: string[];
  zone: string;
  cause_of_death: string;
  created_at?: string;
}

export interface Stats {
  total_games: number;
  avg_round: number;
  most_common_zone: string;
  most_common_cause: string;
}

export interface RiskResult {
  risk: number;
  recommendations: string[];
}
