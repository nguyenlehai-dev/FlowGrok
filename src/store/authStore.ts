import { create } from 'zustand';
import axios from 'axios';
import { authApi } from '../api/client';
import { clearStoredToken, getStoredToken, setStoredToken } from './authStorage';

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
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getStoredToken(),
  isLoading: Boolean(getStoredToken()),

  login: async (email, password, remember = true) => {
    const res = await authApi.login(email, password);
    const token = res.data.access_token;
    setStoredToken(token, remember);
    set({ token, isLoading: true });
    // Fetch user info after login
    const me = await authApi.getMe();
    set({ user: me.data, isLoading: false });
  },

  register: async (email, password) => {
    await authApi.register(email, password);
  },

  logout: () => {
    clearStoredToken();
    set({ user: null, token: null, isLoading: false });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res = await authApi.getMe();
      set({ user: res.data, isLoading: false });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearStoredToken();
        set({ user: null, token: null, isLoading: false });
        return;
      }

      set({ isLoading: false });
    }
  },
}));
