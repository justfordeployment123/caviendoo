import axios from 'axios';
import { useAuthStore } from '../store/auth';

const VITE_API_URL = import.meta.env['VITE_API_URL'] as string || '';
const API_BASE = VITE_API_URL.endsWith('/api/v1') ? VITE_API_URL : `${VITE_API_URL}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? '';
    const isAuthEndpoint = url.endsWith('/login') || url.includes('/settings');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
