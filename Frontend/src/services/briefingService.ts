import api from './api';

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

export const getBriefing = async (): Promise<BriefingResponse> => {
  const { data } = await api.get<BriefingResponse>('/api/briefing');
  return data;
};
