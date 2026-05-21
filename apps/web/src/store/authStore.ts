import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apkexcel_token', token);
      localStorage.setItem('apkexcel_user', JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('apkexcel_token');
      localStorage.removeItem('apkexcel_user');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('apkexcel_token');
      const userStr = localStorage.getItem('apkexcel_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true });
        } catch (e) {
          localStorage.removeItem('apkexcel_token');
          localStorage.removeItem('apkexcel_user');
        }
      }
    }
  },
}));
