import { create } from 'zustand';
import { Order, OrderStatus, PaymentStatus, ServiceResponse } from '@/types';
import { orderService } from '@/services/orderService';

interface QueueState {
  receivedOrders: Order[];
  preparingOrders: Order[];
  readyOrders: Order[];
  completedOrders: Order[];
  cancelledOrders: Order[];
  isLoading: boolean;
  fetchQueue: () => Promise<void>;
  moveToPreparing: (orderId: string) => Promise<void>;
  moveToReady: (orderId: string) => Promise<void>;
  moveToCompleted: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  updatePaymentStatus: (
    orderId: string,
    status: PaymentStatus
  ) => Promise<ServiceResponse<Order | null>>;
  getAllActiveOrders: () => Order[];
}

export const useQueueStore = create<QueueState>((set, get) => ({
  receivedOrders: [],
  preparingOrders: [],
  readyOrders: [],
  completedOrders: [],
  cancelledOrders: [],
  isLoading: false,

  fetchQueue: async () => {
    set({ isLoading: true });
    try {
      const result = await orderService.getActiveOrders();
      if (result.success && result.data) {
        const received = result.data.filter((o) => o.orderStatus === 'Received' || o.orderStatus === 'Pending Payment');
        const preparing = result.data.filter((o) => o.orderStatus === 'Preparing');
        const ready = result.data.filter((o) => o.orderStatus === 'Ready for Pickup');
        const completedResult = await orderService.getOrdersByStatus('Completed');
        const completed = completedResult.success && completedResult.data 
          ? completedResult.data.slice(0, 10) 
          : [];
        const cancelledResult = await orderService.getOrdersByStatus('Cancelled');
        const cancelled = cancelledResult.success && cancelledResult.data
          ? cancelledResult.data.slice(0, 10)
          : [];
        
        set({ 
          receivedOrders: received,
          preparingOrders: preparing,
          readyOrders: ready,
          completedOrders: completed,
          cancelledOrders: cancelled,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  moveToPreparing: async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'Preparing');
      set((state) => {
        const order = state.receivedOrders.find((o) => o.id === orderId);
        if (!order) return state;
        
        const updatedOrder = { ...order, orderStatus: 'Preparing' as OrderStatus };
        return {
          receivedOrders: state.receivedOrders.filter((o) => o.id !== orderId),
          preparingOrders: [...state.preparingOrders, updatedOrder],
        };
      });
    } catch {
      // Silently fail
    }
  },

  moveToReady: async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'Ready for Pickup');
      set((state) => {
        const order = state.preparingOrders.find((o) => o.id === orderId)
          || state.receivedOrders.find((o) => o.id === orderId);
        if (!order) return state;
        
        const updatedOrder = { ...order, orderStatus: 'Ready for Pickup' as OrderStatus };
        return {
          receivedOrders: state.receivedOrders.filter((o) => o.id !== orderId),
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
        const order = state.readyOrders.find((o) => o.id === orderId)
          || state.preparingOrders.find((o) => o.id === orderId)
          || state.receivedOrders.find((o) => o.id === orderId);
        if (!order) return state;
        
        const updatedOrder = { ...order, orderStatus: 'Completed' as OrderStatus };
        return {
          receivedOrders: state.receivedOrders.filter((o) => o.id !== orderId),
          preparingOrders: state.preparingOrders.filter((o) => o.id !== orderId),
          readyOrders: state.readyOrders.filter((o) => o.id !== orderId),
          completedOrders: [updatedOrder, ...state.completedOrders].slice(0, 10),
        };
      });
    } catch {
      // Silently fail
    }
  },

  cancelOrder: async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'Cancelled');
      set((state) => {
        const order = state.receivedOrders.find((o) => o.id === orderId)
          || state.preparingOrders.find((o) => o.id === orderId)
          || state.readyOrders.find((o) => o.id === orderId);
        if (!order) return state;
        
        const updatedOrder = { ...order, orderStatus: 'Cancelled' as OrderStatus };
        return {
          receivedOrders: state.receivedOrders.filter((o) => o.id !== orderId),
          preparingOrders: state.preparingOrders.filter((o) => o.id !== orderId),
          readyOrders: state.readyOrders.filter((o) => o.id !== orderId),
          cancelledOrders: [updatedOrder, ...state.cancelledOrders].slice(0, 10),
        };
      });
    } catch {
      // Silently fail
    }
  },

  updatePaymentStatus: async (orderId, status) => {
    const result = await orderService.updatePaymentStatus(orderId, status);
    if (result.success && result.data) {
      set((state) => {
        const updateOrders = (orders: Order[]) => orders.map((order) =>
          order.id === orderId ? result.data! : order
        );
        return {
          receivedOrders: updateOrders(state.receivedOrders),
          preparingOrders: updateOrders(state.preparingOrders),
          readyOrders: updateOrders(state.readyOrders),
          completedOrders: updateOrders(state.completedOrders),
          cancelledOrders: updateOrders(state.cancelledOrders),
        };
      });
    }
    return result;
  },

  getAllActiveOrders: () => {
    const state = get();
    return [...state.receivedOrders, ...state.preparingOrders, ...state.readyOrders];
  },
}));