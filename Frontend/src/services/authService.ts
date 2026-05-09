import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

export interface UserPublic {
  id: number;
  username: string;
  email: string;
  avatar: string;
}

export interface AuthResponse {
  user: UserPublic;
  token: string;
}

export const register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/api/auth/register', { username, email, password });
  return data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
  return data;
};

export const updateAvatar = async (avatarKey: string, token: string): Promise<{ avatar: string }> => {
  const { data } = await api.put<{ avatar: string }>(
    '/api/users/avatar',
    { avatar: avatarKey },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
};
