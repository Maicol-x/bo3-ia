import api from './api';
import type { Game, StatsResponse, RiskResult } from '../types';

export interface SaveGameResponse {
  game: Game;
  risk: RiskResult;
}

export const saveGame = async (game: Omit<Game, 'id' | 'created_at'>): Promise<SaveGameResponse> => {
  const { data } = await api.post<SaveGameResponse>('/api/games', game);
  return data;
};

export const getAllGames = async (): Promise<Game[]> => {
  const { data } = await api.get<Game[]>('/api/games');
  return data;
};

export const getStats = async (): Promise<StatsResponse> => {
  const { data } = await api.get<StatsResponse>('/api/stats');
  return data;
};

export { default } from './api';
