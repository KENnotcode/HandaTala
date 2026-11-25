import { create } from 'zustand';
import type { ServiceResponse, SignupInput, User } from '@/types';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<ServiceResponse<User>>;
  signup: (input: SignupInput) => Promise<{ success: boolean; message: string }>;
  updateProfile: (updates: { firstName: string; middleName?: string; lastName: string; name: string; phone: string; photoURL?: string }) => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  customerLogin: (user: User) => void;
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
      } else {
        set({ isLoading: false });
      }
      return result;
    } catch (error: unknown) {
      console.error('Unexpected login failure:', error);
      set({ isLoading: false });
      return {
        success: false,
        data: null,
        error: { code: 'LOGIN_FAILED', message: 'Could not connect to the server. Check your connection and try again.' },
      };
    }
  },

  signup: async (input: SignupInput) => {
    set({ isLoading: true });
    try {
      const result = await authService.signup(input);
      if (result.success && result.data) {
        set({
          user: result.data,
          isAuthenticated: true,
          isAdmin: false,
          isLoading: false,
        });
        return { success: true, message: 'Account created successfully' };
      }
      set({ isLoading: false });
      return { success: false, message: result.error?.message || 'Unable to create account' };
    } catch {
      set({ isLoading: false });
      return { success: false, message: 'Unable to create account' };
    }
  },

  updateProfile: async (updates) => {
    set({ isLoading: true });
    try {
      const result = await authService.updateProfile(updates);
      if (result.success && result.data) {
        set({ user: result.data, isLoading: false });
        return { success: true, message: 'Profile updated successfully' };
      }
      set({ isLoading: false });
      return { success: false, message: result.error?.message || 'Failed to update profile' };
    } catch {
      set({ isLoading: false });
      return { success: false, message: 'Failed to update profile' };
    }
  },

  changePassword: async (currentPass: string, newPass: string) => {
    try {
      const result = await authService.changePassword(currentPass, newPass);
      if (result.success) {
        return { success: true, message: 'Password changed successfully' };
      }
      return { success: false, message: result.error?.message || 'Failed to change password' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      return { success: false, message };
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
  customerLogin: (user: User) => {
    set({ user, isAuthenticated: true, isAdmin: user.role === 'admin' });
  },
}));