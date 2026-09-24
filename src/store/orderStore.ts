import { create } from 'zustand';
import { Order, OrderStatus } from '@/types';
import { orderService } from '@/services/orderService';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  fetchOrderByTrackingId: (trackingId: string) => Promise<void>;
  createOrder: (order: Omit<Order, 'id' | 'trackingId' | 'createdAt' | 'updatedAt'>) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  setCurrentOrder: (order: Order | null) => void;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await orderService.getOrders();
      if (result.success && result.data) {
        set({ orders: result.data, isLoading: false });
      } else {
        set({ error: result.error?.message || 'Failed to fetch orders', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to fetch orders', isLoading: false });
    }
  },

  fetchOrderById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await orderService.getOrderById(id);
      if (result.success && result.data) {
        set({ currentOrder: result.data, isLoading: false });
      } else {
        set({ error: result.error?.message || 'Order not found', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to fetch order', isLoading: false });
    }
  },

  fetchOrderByTrackingId: async (trackingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await orderService.getOrderByTrackingId(trackingId);
      if (result.success && result.data) {
        set({ currentOrder: result.data, isLoading: false });
      } else {
        set({ error: result.error?.message || 'Order not found', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to fetch order', isLoading: false });
    }
  },

  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await orderService.createOrder(
        orderData.items,
        orderData.paymentMethod,
        orderData.customerName,
        orderData.notes
      );
      if (result.success && result.data) {
        set((state) => ({ 
          orders: [result.data!, ...state.orders],
          currentOrder: result.data,
          isLoading: false 
        }));
        return result.data;
      } else {
        set({ error: result.error?.message || 'Failed to create order', isLoading: false });
        return null;
      }
    } catch {
      set({ error: 'Failed to create order', isLoading: false });
      return null;
    }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    try {
      const result = await orderService.updateOrderStatus(orderId, status);
      if (result.success && result.data) {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? result.data! : o)),
          currentOrder: state.currentOrder?.id === orderId ? result.data! : state.currentOrder,
        }));
      }
    } catch {
      // Silently fail for now
    }
  },

  setCurrentOrder: (order: Order | null) => {
    set({ currentOrder: order });
  },

  clearError: () => {
    set({ error: null });
  },
}));