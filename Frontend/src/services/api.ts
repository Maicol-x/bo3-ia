/**
 * Instancia de axios compartida con interceptor de autenticación.
 * Añade automáticamente el header Authorization: Bearer <token>
 * leyendo el token desde localStorage.
 */
import axios from 'axios';

const TOKEN_KEY = 'bo3ia_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
