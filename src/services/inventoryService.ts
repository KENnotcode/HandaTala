import { InventoryItem, MenuItem, ServiceResponse } from '@/types';
import { mockInventory } from '@/data/mockInventory';
import { menuService } from './menuService';

let inventory = [...mockInventory];

export const inventoryService = {
  async getInventory(): Promise<ServiceResponse<InventoryItem[]>> {
    return {
      success: true,
      data: [...inventory],
      error: null,
    };
  },

  async getInventoryByMenuItemId(menuItemId: string): Promise<ServiceResponse<InventoryItem | null>> {
    const item = inventory.find((inv) => inv.menuItemId === menuItemId);
    return {
      success: true,
      data: item || null,
      error: item ? null : { code: 'NOT_FOUND', message: 'Inventory item not found' },
    };
  },

  async updateStock(menuItemId: string, quantity: number): Promise<ServiceResponse<InventoryItem | null>> {
    const index = inventory.findIndex((inv) => inv.menuItemId === menuItemId);
    if (index === -1) {
      return {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Inventory item not found' },
      };
    }

    const newStock = Math.max(0, quantity);
    inventory[index] = {
      ...inventory[index],
      stock: newStock,
      isAvailable: newStock > 0 && inventory[index].isAvailable,
      updatedAt: new Date().toISOString(),
    };

    await menuService.updateMenuItem(menuItemId, { 
      stock: newStock,
      isAvailable: newStock > 0 && inventory[index].isAvailable,
    });

    return {
      success: true,
      data: inventory[index],
      error: null,
    };
  },

  async adjustStock(menuItemId: string, adjustment: number): Promise<ServiceResponse<InventoryItem | null>> {
    const invItem = inventory.find((inv) => inv.menuItemId === menuItemId);
    if (!invItem) {
      return {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Inventory item not found' },
      };
    }

    return this.updateStock(menuItemId, invItem.stock + adjustment);
  },

  async setAvailability(menuItemId: string, isAvailable: boolean): Promise<ServiceResponse<InventoryItem | null>> {
    const index = inventory.findIndex((inv) => inv.menuItemId === menuItemId);
    if (index === -1) {
      return {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Inventory item not found' },
      };
    }

    inventory[index] = {
      ...inventory[index],
      isAvailable,
      updatedAt: new Date().toISOString(),
    };

    await menuService.updateMenuItem(menuItemId, { isAvailable });

    return {
      success: true,
      data: inventory[index],
      error: null,
    };
  },

  async updateLowStockThreshold(menuItemId: string, threshold: number): Promise<ServiceResponse<InventoryItem | null>> {
    const index = inventory.findIndex((inv) => inv.menuItemId === menuItemId);
    if (index === -1) {
      return {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Inventory item not found' },
      };
    }

    inventory[index] = {
      ...inventory[index],
      lowStockThreshold: threshold,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: inventory[index],
      error: null,
    };
  },

  async getLowStockItems(): Promise<ServiceResponse<InventoryItem[]>> {
    const lowStock = inventory.filter(
      (inv) => inv.stock > 0 && inv.stock <= inv.lowStockThreshold && inv.isAvailable
    );
    return {
      success: true,
      data: lowStock,
      error: null,
    };
  },

  async getSoldOutItems(): Promise<ServiceResponse<InventoryItem[]>> {
    const soldOut = inventory.filter((inv) => inv.stock === 0 || !inv.isAvailable);
    return {
      success: true,
      data: soldOut,
      error: null,
    };
  },

  async getInventoryStats(): Promise<ServiceResponse<{
    totalItems: number;
    availableItems: number;
    lowStockItems: number;
    soldOutItems: number;
  }>> {
    const totalItems = inventory.length;
    const availableItems = inventory.filter((inv) => inv.isAvailable && inv.stock > 0).length;
    const lowStockItems = inventory.filter((inv) => inv.isAvailable && inv.stock > 0 && inv.stock <= inv.lowStockThreshold).length;
    const soldOutItems = inventory.filter((inv) => inv.stock === 0 || !inv.isAvailable).length;

    return {
      success: true,
      data: { totalItems, availableItems, lowStockItems, soldOutItems },
      error: null,
    };
  },

  resetMockData() {
    inventory = [...mockInventory];
  },
};