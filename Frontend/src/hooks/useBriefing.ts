import { useQuery } from '@tanstack/react-query';
import { getBriefing } from '../services/briefingService';
import type { BriefingResponse } from '../services/briefingService';

export const useBriefing = () => {
  return useQuery<BriefingResponse, Error>({
    queryKey: ['briefing'],
    queryFn: getBriefing,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
};
