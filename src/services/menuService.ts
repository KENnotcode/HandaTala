import { MenuItem, ServiceResponse, Category } from '@/types';
import { mockMenuItems, categories } from '@/data/mockMenu';

let menuItems = [...mockMenuItems];

export const menuService = {
  async getMenuItems(): Promise<ServiceResponse<MenuItem[]>> {
    return {
      success: true,
      data: menuItems,
      error: null,
    };
  },

  async getMenuItemById(id: string): Promise<ServiceResponse<MenuItem | null>> {
    const item = menuItems.find((item) => item.id === id);
    return {
      success: true,
      data: item || null,
      error: item ? null : { code: 'NOT_FOUND', message: 'Menu item not found' },
    };
  },

  async getCategories(): Promise<ServiceResponse<Category[]>> {
    return {
      success: true,
      data: categories,
      error: null,
    };
  },

  async getFeaturedItems(): Promise<ServiceResponse<MenuItem[]>> {
    const featured = menuItems.filter((item) => item.isFeatured && item.isAvailable);
    return {
      success: true,
      data: featured,
      error: null,
    };
  },

  async getPopularItems(): Promise<ServiceResponse<MenuItem[]>> {
    const popular = menuItems.filter((item) => item.isAvailable).slice(0, 6);
    return {
      success: true,
      data: popular,
      error: null,
    };
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<ServiceResponse<MenuItem | null>> {
    const index = menuItems.findIndex((item) => item.id === id);
    if (index === -1) {
      return {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Menu item not found' },
      };
    }
    menuItems[index] = { ...menuItems[index], ...updates };
    return {
      success: true,
      data: menuItems[index],
      error: null,
    };
  },

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<ServiceResponse<MenuItem>> {
    const newItem: MenuItem = {
      ...item,
      id: `food-${Date.now()}`,
    };
    menuItems.push(newItem);
    return {
      success: true,
      data: newItem,
      error: null,
    };
  },

  async deleteMenuItem(id: string): Promise<ServiceResponse<boolean>> {
    const index = menuItems.findIndex((item) => item.id === id);
    if (index === -1) {
      return {
        success: false,
        data: false,
        error: { code: 'NOT_FOUND', message: 'Menu item not found' },
      };
    }
    menuItems.splice(index, 1);
    return {
      success: true,
      data: true,
      error: null,
    };
  },

  resetMockData() {
    menuItems = [...mockMenuItems];
  },
};