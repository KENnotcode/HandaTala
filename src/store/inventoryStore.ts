import { create } from 'zustand';
import { InventoryItem, MenuItem } from '@/types';
import { inventoryService } from '@/services/inventoryService';
import { menuService } from '@/services/menuService';

interface InventoryState {
  inventory: InventoryItem[];
  menuItems: MenuItem[];
  isLoading: boolean;
  error: string | null;
  fetchInventory: () => Promise<void>;
  fetchMenuItems: () => Promise<void>;
  updateStock: (menuItemId: string, quantity: number) => Promise<void>;
  adjustStock: (menuItemId: string, adjustment: number) => Promise<void>;
  setAvailability: (menuItemId: string, isAvailable: boolean) => Promise<void>;
  getStock: (menuItemId: string) => number;
  isAvailable: (menuItemId: string) => boolean;
  isLowStock: (menuItemId: string) => boolean;
  clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventory: [],
  menuItems: [],
  isLoading: false,
  error: null,

  fetchInventory: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await inventoryService.getInventory();
      if (result.success && result.data) {
        set({ inventory: result.data, isLoading: false });
      } else {
        set({ error: result.error?.message || 'Failed to fetch inventory', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to fetch inventory', isLoading: false });
    }
  },

  fetchMenuItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await menuService.getMenuItems();
      if (result.success && result.data) {
        set({ menuItems: result.data, isLoading: false });
      } else {
        set({ error: result.error?.message || 'Failed to fetch menu items', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to fetch menu items', isLoading: false });
    }
  },

  updateStock: async (menuItemId: string, quantity: number) => {
    try {
      const result = await inventoryService.updateStock(menuItemId, quantity);
      if (result.success && result.data) {
        set((state) => ({
          inventory: state.inventory.map((inv) =>
            inv.menuItemId === menuItemId ? result.data! : inv
          ),
          menuItems: state.menuItems.map((item) =>
            item.id === menuItemId ? { ...item, stock: quantity, isAvailable: quantity > 0 && item.isAvailable } : item
          ),
        }));
      }
    } catch {
      // Silently fail
    }
  },

  adjustStock: async (menuItemId: string, adjustment: number) => {
    const currentStock = get().getStock(menuItemId);
    await get().updateStock(menuItemId, currentStock + adjustment);
  },

  setAvailability: async (menuItemId: string, isAvailable: boolean) => {
    try {
      const result = await inventoryService.setAvailability(menuItemId, isAvailable);
      if (result.success && result.data) {
        set((state) => ({
          inventory: state.inventory.map((inv) =>
            inv.menuItemId === menuItemId ? result.data! : inv
          ),
          menuItems: state.menuItems.map((item) =>
            item.id === menuItemId ? { ...item, isAvailable } : item
          ),
        }));
      }
    } catch {
      // Silently fail
    }
  },

  getStock: (menuItemId: string) => {
    const inv = get().inventory.find((i) => i.menuItemId === menuItemId);
    return inv?.stock ?? 0;
  },

  isAvailable: (menuItemId: string) => {
    const inv = get().inventory.find((i) => i.menuItemId === menuItemId);
    return inv?.isAvailable && (inv?.stock ?? 0) > 0;
  },

  isLowStock: (menuItemId: string) => {
    const inv = get().inventory.find((i) => i.menuItemId === menuItemId);
    if (!inv) return false;
    return inv.stock > 0 && inv.stock <= inv.lowStockThreshold;
  },

  clearError: () => {
    set({ error: null });
  },
}));