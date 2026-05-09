import api from './api';

export type SessionStatus = 'waiting' | 'in_progress' | 'finished';

export interface SessionMember {
  user_id: number;
  username: string;
  avatar: string;
  joined_at: string;
  is_leader: boolean;
}

export interface ChatMsg {
  id: number;
  session_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

export interface SessionData {
  id: number;
  code: string;
  leader_id: number;
  status: SessionStatus;
  max_players: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  members: SessionMember[];
}

export async function createSession(): Promise<SessionData> {
  const { data } = await api.post<SessionData>('/api/sessions');
  return data;
}

export async function joinSession(code: string): Promise<SessionData> {
  const { data } = await api.post<SessionData>(`/api/sessions/${code}/join`);
  return data;
}

export async function getSession(code: string): Promise<SessionData> {
  const { data } = await api.get<SessionData>(`/api/sessions/${code}`);
  return data;
}

export interface PlayerGame {
  round: number;
  character: string | null;
  cause_of_death: string;
  zone: string;
  perks: string[];
  pack_a_punch: boolean;
  rituals_completed: number;
  points_at_death: number | null;
  notes: string | null;
}

export interface PlayerStat {
  user_id: number;
  username: string;
  avatar: string;
  games: PlayerGame[];
  best_round: number;
  total_games: number;
}

export interface SessionStats {
  session_id: number;
  code: string;
  duration_seconds: number | null;
  started_at: string | null;
  finished_at: string | null;
  player_count: number;
  total_games: number;
  best_round_overall: number;
  players: PlayerStat[];
}

export async function getSessionStats(code: string): Promise<SessionStats> {
  const { data } = await api.get<SessionStats>(`/api/sessions/${code}/stats`);
  return data;
}

export async function getSessionSummary(code: string): Promise<string> {
  const { data } = await api.get<{ summary: string }>(`/api/sessions/${code}/summary`);
  return data.summary;
}
