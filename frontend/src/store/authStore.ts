import { create } from 'zustand';
import { User } from '@/types';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await authService.login(email, password);
      if (result.success && result.data) {
        set({
          user: result.data,
          isAuthenticated: true,
          isAdmin: result.data.role === 'admin',
          isLoading: false,
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false, isAdmin: false });
  },

  checkAuth: () => {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    const isAdmin = authService.isAdmin();
    set({ user, isAuthenticated, isAdmin, isLoading: false });
  },
}));