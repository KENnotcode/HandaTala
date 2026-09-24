import { User, ServiceResponse } from '@/types';
import { mockUsers, mockAdminCredentials } from '@/data/mockUsers';

const AUTH_KEY = 'handatala_auth';
const ADMIN_KEY = 'handatala_admin';

export const authService = {
  async login(email: string, password: string): Promise<ServiceResponse<User>> {
    if (email === mockAdminCredentials.email && password === mockAdminCredentials.password) {
      const adminUser = mockUsers.find((u) => u.role === 'admin');
      if (adminUser) {
        const authData = { user: adminUser, isAuthenticated: true, isAdmin: true };
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        localStorage.setItem(ADMIN_KEY, 'true');
        return {
          success: true,
          data: adminUser,
          error: null,
        };
      }
    }

    const kitchenUser = mockUsers.find((u) => u.role === 'kitchen');
    if (kitchenUser) {
      const authData = { user: kitchenUser, isAuthenticated: true, isAdmin: false };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      return {
        success: true,
        data: kitchenUser,
        error: null,
      };
    }

    return {
      success: false,
      data: null as any,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    };
  },

  async logout(): Promise<ServiceResponse<boolean>> {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ADMIN_KEY);
    return {
      success: true,
      data: true,
      error: null,
    };
  },

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const authData = localStorage.getItem(AUTH_KEY);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.user || null;
      } catch {
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const authData = localStorage.getItem(AUTH_KEY);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.isAuthenticated === true;
      } catch {
        return false;
      }
    }
    return false;
  },

  isAdmin(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ADMIN_KEY) === 'true';
  },

  requireAuth(): boolean {
    return this.isAuthenticated();
  },

  requireAdmin(): boolean {
    return this.isAdmin();
  },
};