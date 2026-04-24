import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminInfo {
  id: number;
  email: string;
  name: string | null;
}

interface AuthState {
  token: string | null;
  expiresAt: string | null;
  admin: AdminInfo | null;
  setAuth: (token: string, expiresAt: string, admin: AdminInfo) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,
      admin: null,
      setAuth: (token, expiresAt, admin) => set({ token, expiresAt, admin }),
      logout: () => set({ token: null, expiresAt: null, admin: null }),
      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return new Date(expiresAt) > new Date();
      },
    }),
    { name: 'caviendoo-admin-auth' },
  ),
);
