import { MenuItem, ServiceResponse, Category } from '@/types';
import { getErrorMessage } from '@/lib/apiError';

// Helper to determine base URL for server/client fetch
function getApiUrl(path: string) {
  // In Next.js client side, relative URL '/api/...' works.
  // On server side during SSR, we can use absolute URL if needed or relative.
  return path;
}

export const menuService = {
  async getMenuItems(): Promise<ServiceResponse<MenuItem[]>> {
    try {
      const res = await fetch(getApiUrl('/api/menu'), { cache: 'no-store' });
      const json = await res.json();
      return json;
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: { code: 'FETCH_ERROR', message: getErrorMessage(error) },
      };
    }
  },

  async getMenuItemById(id: string): Promise<ServiceResponse<MenuItem | null>> {
    try {
      const res = await fetch(getApiUrl(`/api/menu/${id}`), { cache: 'no-store' });
      const json = await res.json();
      return json;
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: { code: 'FETCH_ERROR', message: getErrorMessage(error) },
      };
    }
  },

  async getCategories(): Promise<ServiceResponse<Category[]>> {
    try {
      const res = await fetch(getApiUrl('/api/categories'), { cache: 'no-store' });
      const json = await res.json();
      return json;
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: { code: 'FETCH_ERROR', message: getErrorMessage(error) },
      };
    }
  },

  async getFeaturedItems(): Promise<ServiceResponse<MenuItem[]>> {
    try {
      const res = await fetch(getApiUrl('/api/menu?featured=true'), { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        return {
          success: true,
          data: json.data.filter((item: MenuItem) => item.isAvailable).slice(0, 4),
          error: null,
        };
      }
      return json;
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: { code: 'FETCH_ERROR', message: getErrorMessage(error) },
      };
    }
  },

  async getPopularItems(): Promise<ServiceResponse<MenuItem[]>> {
    try {
      const res = await fetch(getApiUrl('/api/menu'), { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        return {
          success: true,
          data: json.data.filter((item: MenuItem) => item.isAvailable).slice(0, 6),
          error: null,
        };
      }
      return json;
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: { code: 'FETCH_ERROR', message: getErrorMessage(error) },
      };
    }
  },

  async updateMenuItem(
    id: string,
    updates: Partial<MenuItem>,
    adminKey?: string
  ): Promise<ServiceResponse<MenuItem | null>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (adminKey) {
        headers['x-admin-key'] = adminKey;
      }
      const res = await fetch(getApiUrl(`/api/menu/${id}`), {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      return json;
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: { code: 'UPDATE_ERROR', message: getErrorMessage(error) },
      };
    }
  },

  async addMenuItem(
    item: Omit<MenuItem, 'id'>,
    adminKey?: string
  ): Promise<ServiceResponse<MenuItem>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (adminKey) {
        headers['x-admin-key'] = adminKey;
      }
      const res = await fetch(getApiUrl('/api/menu'), {
        method: 'POST',
        headers,
        body: JSON.stringify(item),
      });
      const json = await res.json();
      return json;
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: { code: 'ADD_ERROR', message: getErrorMessage(error) },
      };
    }
  },

  async deleteMenuItem(id: string, adminKey?: string): Promise<ServiceResponse<boolean>> {
    try {
      const headers: Record<string, string> = {};
      if (adminKey) {
        headers['x-admin-key'] = adminKey;
      }
      const res = await fetch(getApiUrl(`/api/menu/${id}`), {
        method: 'DELETE',
        headers,
      });
      const json = await res.json();
      return {
        success: json.success,
        data: json.success,
        error: json.error,
      };
    } catch (error: unknown) {
      return {
        success: false,
        data: false,
        error: { code: 'DELETE_ERROR', message: getErrorMessage(error) },
      };
    }
  },

  resetMockData() {
    // No-op for API/Firestore backed service
  },
};
