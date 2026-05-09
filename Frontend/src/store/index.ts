import { configureStore } from '@reduxjs/toolkit';
import gamesReducer from './gamesSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    games: gamesReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
