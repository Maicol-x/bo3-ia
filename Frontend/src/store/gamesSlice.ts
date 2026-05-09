import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Game } from '../types';

interface GamesState {
  games: Game[];
  selectedGame: Game | null;
  loading: boolean;
  error: string | null;
}

const initialState: GamesState = {
  games: [],
  selectedGame: null,
  loading: false,
  error: null,
};

const gamesSlice = createSlice({
  name: 'games',
  initialState,
  reducers: {
    setGames(state, action: PayloadAction<Game[]>) {
      state.games = action.payload;
    },
    addGame(state, action: PayloadAction<Game>) {
      state.games.unshift(action.payload);
    },
    selectGame(state, action: PayloadAction<Game | null>) {
      state.selectedGame = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setGames, addGame, selectGame, setLoading, setError } = gamesSlice.actions;
export default gamesSlice.reducer;
