import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '@/types';
import { menuService } from '@/services/menuService';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: MenuItem, quantity?: number, notes?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item: MenuItem, quantity = 1, notes = '') => {
        const existingItem = get().items.find((i) => i.menuItemId === item.id);
        if (existingItem) {
          set((state) => ({
            items: state.items.map((i) =>
              i.menuItemId === item.id
                ? { ...i, quantity: i.quantity + quantity, subtotal: (i.quantity + quantity) * i.unitPrice }
                : i
            ),
          }));
        } else {
          const newItem: CartItem = {
            menuItemId: item.id,
            name: item.name,
            quantity,
            unitPrice: item.price,
            subtotal: item.price * quantity,
            notes,
          };
          set((state) => ({ items: [...state.items, newItem] }));
        }
        set({ isOpen: true });
      },

      removeItem: (menuItemId: string) => {
        set((state) => ({ items: state.items.filter((i) => i.menuItemId !== menuItemId) }));
      },

      updateQuantity: (menuItemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, quantity, subtotal: i.unitPrice * quantity } : i
          ),
        }));
      },

      updateNotes: (menuItemId: string, notes: string) => {
        set((state) => ({
          items: state.items.map((i) => (i.menuItemId === menuItemId ? { ...i, notes } : i)),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getTotal: () => {
        return get().getSubtotal();
      },
    }),
    {
      name: 'handatala-cart',
    }
  )
);