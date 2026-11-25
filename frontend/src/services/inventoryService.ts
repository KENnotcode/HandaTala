import type { InventoryItem, MenuItem, ServiceResponse } from '@/types';
import { menuService } from './menuService';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

function toInventoryItem(menuItem: MenuItem): InventoryItem {
  return {
    id: `inventory-${menuItem.id}`,
    menuItemId: menuItem.id,
    stock: menuItem.stock,
    lowStockThreshold: menuItem.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
    isAvailable: menuItem.isAvailable,
    updatedAt: menuItem.updatedAt || '',
  };
}

function failure<T>(code: string, message: string): ServiceResponse<T> {
  return { success: false, data: null, error: { code, message } };
}

export const inventoryService = {
  async getInventory(): Promise<ServiceResponse<InventoryItem[]>> {
    const result = await menuService.getMenuItems();
    if (!result.success || !result.data) {
      return failure(
        result.error?.code || 'FETCH_ERROR',
        result.error?.message || 'Failed to load inventory.'
      );
    }

    return {
      success: true,
      data: result.data.map(toInventoryItem),
      error: null,
    };
  },

  async getInventoryByMenuItemId(menuItemId: string): Promise<ServiceResponse<InventoryItem | null>> {
    const result = await menuService.getMenuItemById(menuItemId);
    if (!result.success || !result.data) {
      return failure(
        result.error?.code || 'NOT_FOUND',
        result.error?.message || 'Inventory item not found.'
      );
    }

    return { success: true, data: toInventoryItem(result.data), error: null };
  },

  async updateStock(menuItemId: string, quantity: number): Promise<ServiceResponse<InventoryItem | null>> {
    if (!Number.isInteger(quantity) || quantity < 0) {
      return failure('INVALID_STOCK', 'Stock must be a non-negative whole number.');
    }

    const currentResult = await menuService.getMenuItemById(menuItemId);
    if (!currentResult.success || !currentResult.data) {
      return failure(
        currentResult.error?.code || 'NOT_FOUND',
        currentResult.error?.message || 'Menu item not found.'
      );
    }

    const result = await menuService.updateMenuItem(menuItemId, {
      stock: quantity,
      isAvailable: quantity > 0 && currentResult.data.isAvailable,
    });
    if (!result.success || !result.data) {
      return failure(
        result.error?.code || 'UPDATE_ERROR',
        result.error?.message || 'Failed to update stock.'
      );
    }

    return { success: true, data: toInventoryItem(result.data), error: null };
  },

  async adjustStock(menuItemId: string, adjustment: number): Promise<ServiceResponse<InventoryItem | null>> {
    const currentResult = await this.getInventoryByMenuItemId(menuItemId);
    if (!currentResult.success || !currentResult.data) {
      return currentResult;
    }

    return this.updateStock(menuItemId, currentResult.data.stock + adjustment);
  },

  async setAvailability(menuItemId: string, isAvailable: boolean): Promise<ServiceResponse<InventoryItem | null>> {
    const result = await menuService.updateMenuItem(menuItemId, { isAvailable });
    if (!result.success || !result.data) {
      return failure(
        result.error?.code || 'UPDATE_ERROR',
        result.error?.message || 'Failed to update availability.'
      );
    }

    return { success: true, data: toInventoryItem(result.data), error: null };
  },

  async updateLowStockThreshold(menuItemId: string, threshold: number): Promise<ServiceResponse<InventoryItem | null>> {
    if (!Number.isInteger(threshold) || threshold < 0) {
      return failure('INVALID_THRESHOLD', 'Low stock threshold must be a non-negative whole number.');
    }

    const result = await menuService.updateMenuItem(menuItemId, { lowStockThreshold: threshold });
    if (!result.success || !result.data) {
      return failure(
        result.error?.code || 'UPDATE_ERROR',
        result.error?.message || 'Failed to update low stock threshold.'
      );
    }

    return { success: true, data: toInventoryItem(result.data), error: null };
  },

  async getLowStockItems(): Promise<ServiceResponse<InventoryItem[]>> {
    const result = await this.getInventory();
    if (!result.success || !result.data) {
      return result;
    }

    return {
      success: true,
      data: result.data.filter(
        (item) => item.stock > 0 && item.stock <= item.lowStockThreshold && item.isAvailable
      ),
      error: null,
    };
  },

  async getSoldOutItems(): Promise<ServiceResponse<InventoryItem[]>> {
    const result = await this.getInventory();
    if (!result.success || !result.data) {
      return result;
    }

    return {
      success: true,
      data: result.data.filter((item) => item.stock === 0 || !item.isAvailable),
      error: null,
    };
  },

  async getInventoryStats(): Promise<ServiceResponse<{
    totalItems: number;
    availableItems: number;
    lowStockItems: number;
    soldOutItems: number;
  }>> {
    const result = await this.getInventory();
    if (!result.success || !result.data) {
      return failure(
        result.error?.code || 'FETCH_ERROR',
        result.error?.message || 'Failed to load inventory statistics.'
      );
    }

    const inventory = result.data;
    return {
      success: true,
      data: {
        totalItems: inventory.length,
        availableItems: inventory.filter((item) => item.isAvailable && item.stock > 0).length,
        lowStockItems: inventory.filter(
          (item) => item.isAvailable && item.stock > 0 && item.stock <= item.lowStockThreshold
        ).length,
        soldOutItems: inventory.filter((item) => item.stock === 0 || !item.isAvailable).length,
      },
      error: null,
    };
  },
};
