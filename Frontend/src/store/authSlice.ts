import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserPublic } from '../services/authService';

const TOKEN_KEY = 'bo3ia_token';
const USER_KEY  = 'bo3ia_user';

interface AuthState {
  user: UserPublic | null;
  token: string | null;
}

function loadToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

/** Decodifica el payload de un JWT sin verificar firma (solo para leer claims). */
function decodeJwt(token: string): UserPublic | null {
  try {
    const b64 = token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64)) as { id?: number; username?: string; email?: string; avatar?: string };
    if (payload.id && payload.username) {
      return { id: Number(payload.id), username: payload.username, email: payload.email ?? '', avatar: payload.avatar ?? 'ghost' };
    }
    return null;
  } catch { return null; }
}

function loadUser(): UserPublic | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw) as UserPublic;
    // Fallback: extraer del token si el objeto no fue guardado aún
    const token = loadToken();
    if (token) return decodeJwt(token);
    return null;
  } catch { return null; }
}

const initialState: AuthState = {
  user: loadUser(),
  token: loadToken(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: UserPublic; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      try {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
      } catch { /* localStorage no disponible */ }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch { /* localStorage no disponible */ }
    },
    updateUserAvatar(state, action: PayloadAction<string>) {
      if (state.user) {
        state.user = { ...state.user, avatar: action.payload };
        try { localStorage.setItem(USER_KEY, JSON.stringify(state.user)); } catch { /* ignorar */ }
      }
    },
  },
});

export const { setAuth, logout, updateUserAvatar } = authSlice.actions;
export default authSlice.reducer;
