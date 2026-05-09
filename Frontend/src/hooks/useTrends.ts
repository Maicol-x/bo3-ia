import { useQuery } from '@tanstack/react-query';
import { getTrends } from '../services/trendService';

export function useTrends() {
  return useQuery({
    queryKey: ['trends'],
    queryFn: getTrends,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
