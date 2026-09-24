import { create } from 'zustand';
import { Order, OrderStatus } from '@/types';
import { orderService } from '@/services/orderService';

interface QueueState {
  preparingOrders: Order[];
  readyOrders: Order[];
  completedOrders: Order[];
  isLoading: boolean;
  fetchQueue: () => Promise<void>;
  moveToReady: (orderId: string) => Promise<void>;
  moveToCompleted: (orderId: string) => Promise<void>;
  getAllActiveOrders: () => Order[];
}

export const useQueueStore = create<QueueState>((set, get) => ({
  preparingOrders: [],
  readyOrders: [],
  completedOrders: [],
  isLoading: false,

  fetchQueue: async () => {
    set({ isLoading: true });
    try {
      const result = await orderService.getActiveOrders();
      if (result.success && result.data) {
        const preparing = result.data.filter((o) => o.orderStatus === 'Preparing' || o.orderStatus === 'Pending Payment');
        const ready = result.data.filter((o) => o.orderStatus === 'Ready for Pickup');
        const completedResult = await orderService.getOrdersByStatus('Completed');
        const completed = completedResult.success && completedResult.data 
          ? completedResult.data.slice(0, 10) 
          : [];
        
        set({ 
          preparingOrders: preparing,
          readyOrders: ready,
          completedOrders: completed,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  moveToReady: async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'Ready for Pickup');
      set((state) => {
        const order = state.preparingOrders.find((o) => o.id === orderId);
        if (!order) return state;
        
        const updatedOrder = { ...order, orderStatus: 'Ready for Pickup' as OrderStatus };
        return {
          preparingOrders: state.preparingOrders.filter((o) => o.id !== orderId),
          readyOrders: [...state.readyOrders, updatedOrder],
        };
      });
    } catch {
      // Silently fail
    }
  },

  moveToCompleted: async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'Completed');
      set((state) => {
        const order = state.readyOrders.find((o) => o.id === orderId);
        if (!order) return state;
        
        const updatedOrder = { ...order, orderStatus: 'Completed' as OrderStatus };
        return {
          readyOrders: state.readyOrders.filter((o) => o.id !== orderId),
          completedOrders: [updatedOrder, ...state.completedOrders].slice(0, 10),
        };
      });
    } catch {
      // Silently fail
    }
  },

  getAllActiveOrders: () => {
    const state = get();
    return [...state.preparingOrders, ...state.readyOrders];
  },
}));