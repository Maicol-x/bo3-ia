import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStats, saveGame, getAllGames } from '../services/gameService';
import { useAppDispatch } from './useAppStore';
import { addGame } from '../store/gamesSlice';
import type { Game } from '../types';

export const useStats = () =>
  useQuery({ queryKey: ['stats'], queryFn: getStats });

export const useGames = () =>
  useQuery({ queryKey: ['games'], queryFn: getAllGames });

export const useSaveGame = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (game: Omit<Game, 'id' | 'created_at'>) => saveGame(game),
    onSuccess: ({ game }) => {
      dispatch(addGame(game));
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
};
