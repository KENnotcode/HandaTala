import type { Order, CartItem, ServiceResponse, OrderStatus, PaymentMethod, PaymentStatus } from '@/types';
import { getFirebaseAuth } from '@/lib/firebaseClient';

const NETWORK_ERROR = 'Could not connect to the server. Check your connection and try again.';

async function requestOrderApi<T>(
  path: string,
  init: RequestInit = {}
): Promise<ServiceResponse<T>> {
  try {
    const auth = getFirebaseAuth();
    await auth.authStateReady();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return {
        success: false,
        data: null,
        error: { code: 'UNAUTHENTICATED', message: 'Please sign in to access orders.' },
      };
    }

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${await firebaseUser.getIdToken()}`);
    if (init.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(path, { ...init, headers });
    const result = await response.json() as ServiceResponse<T>;
    if (!response.ok || !result.success) {
      return {
        success: false,
        data: null,
        error: result.error || {
          code: `HTTP_${response.status}`,
          message: 'The order request could not be completed.',
        },
      };
    }

    return { success: true, data: result.data, error: null };
  } catch (error: unknown) {
    console.error(`Order API request failed (${path}):`, error);
    return {
      success: false,
      data: null,
      error: { code: 'NETWORK_ERROR', message: NETWORK_ERROR },
    };
  }
}

export const orderService = {
  getOrders(): Promise<ServiceResponse<Order[]>> {
    return requestOrderApi<Order[]>('/api/orders');
  },

  getOrdersByCustomerId(customerId: string): Promise<ServiceResponse<Order[]>> {
    const query = new URLSearchParams({ customerId });
    return requestOrderApi<Order[]>(`/api/orders?${query.toString()}`);
  },

  getOrderById(id: string): Promise<ServiceResponse<Order | null>> {
    return requestOrderApi<Order | null>(`/api/orders/${encodeURIComponent(id)}`);
  },

  getOrderByTrackingId(trackingId: string): Promise<ServiceResponse<Order | null>> {
    const query = new URLSearchParams({ trackingId });
    return requestOrderApi<Order | null>(`/api/orders?${query.toString()}`);
  },

  async createOrder(
    items: CartItem[],
    paymentMethod: PaymentMethod,
    customerName = 'Guest Customer',
    notes = ''
  ): Promise<ServiceResponse<Order>> {
    const result = await requestOrderApi<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ items, paymentMethod, customerName, notes }),
    });

    if (result.success && result.data && typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('handatala_orders_channel');
          bc.postMessage({ type: 'ORDER_CREATED', order: result.data });
          bc.close();
        }
        localStorage.setItem('handatala_latest_order', JSON.stringify({ id: result.data.id, time: Date.now() }));
      } catch {}
    }

    return result;
  },

  updateOrderStatus(orderId: string, status: OrderStatus): Promise<ServiceResponse<Order | null>> {
    return requestOrderApi<Order | null>(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus: status }),
    });
  },

  updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<ServiceResponse<Order | null>> {
    return requestOrderApi<Order | null>(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus: status }),
    });
  },

  async getOrdersByStatus(status: OrderStatus): Promise<ServiceResponse<Order[]>> {
    const result = await this.getOrders();
    if (!result.success || !result.data) {
      return result;
    }
    return {
      success: true,
      data: result.data.filter((order) => order.orderStatus === status),
      error: null,
    };
  },

  async getActiveOrders(): Promise<ServiceResponse<Order[]>> {
    const result = await this.getOrders();
    if (!result.success || !result.data) {
      return result;
    }
    const activeOrders = result.data.filter(
      (order) => order.orderStatus === 'Received'
        || order.orderStatus === 'Preparing'
        || order.orderStatus === 'Ready for Pickup'
        || order.orderStatus === 'Pending Payment'
    );
    return {
      success: true,
      data: activeOrders.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
      error: null,
    };
  },
};
