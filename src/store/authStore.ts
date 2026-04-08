import { create } from 'zustand';
import { authApi } from '../api/client';

interface User {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    const token = res.data.access_token;
    localStorage.setItem('token', token);
    set({ token });
    // Fetch user info after login
    const me = await authApi.getMe();
    set({ user: me.data });
  },

  register: async (email, password) => {
    await authApi.register(email, password);
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res = await authApi.getMe();
      set({ user: res.data, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
