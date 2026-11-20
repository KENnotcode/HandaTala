import { InventoryItem } from '@/types';
import { mockMenuItems } from './mockMenu';

export const mockInventory: InventoryItem[] = mockMenuItems.map((menuItem, index) => ({
  id: `inventory-${String(index + 1).padStart(3, '0')}`,
  menuItemId: menuItem.id,
  stock: menuItem.stock,
  lowStockThreshold: 5,
  isAvailable: menuItem.isAvailable,
  updatedAt: new Date().toISOString(),
}));
