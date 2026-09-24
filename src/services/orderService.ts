import { Order, CartItem, ServiceResponse, OrderStatus, PaymentMethod, PaymentStatus } from '@/types';
import { mockOrders } from '@/data/mockOrders';

let orders = [...mockOrders];

const generateTrackingId = (): string => {
  const year = new Date().getFullYear();
  const count = orders.length + 1;
  return `HT-${year}-${String(count).padStart(5, '0')}`;
};

const generateOrderId = (): string => {
  return `order-${Date.now()}`;
};

export const orderService = {
  async getOrders(): Promise<ServiceResponse<Order[]>> {
    return {
      success: true,
      data: [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      error: null,
    };
  },

  async getOrderById(id: string): Promise<ServiceResponse<Order | null>> {
    const order = orders.find((order) => order.id === id);
    return {
      success: true,
      data: order || null,
      error: order ? null : { code: 'NOT_FOUND', message: 'Order not found' },
    };
  },

  async getOrderByTrackingId(trackingId: string): Promise<ServiceResponse<Order | null>> {
    const order = orders.find((order) => order.trackingId === trackingId);
    return {
      success: true,
      data: order || null,
      error: order ? null : { code: 'NOT_FOUND', message: 'Order not found' },
    };
  },

  async createOrder(
    items: CartItem[],
    paymentMethod: PaymentMethod,
    customerName: string = 'Guest Customer',
    notes: string = ''
  ): Promise<ServiceResponse<Order>> {
    const newOrder: Order = {
      id: generateOrderId(),
      trackingId: generateTrackingId(),
      customerId: null,
      customerName,
      items,
      subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
      total: items.reduce((sum, item) => sum + item.subtotal, 0),
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'pending' : 'paid',
      orderStatus: paymentMethod === 'online' ? 'Pending Payment' : 'Preparing',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    return {
      success: true,
      data: newOrder,
      error: null,
    };
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<ServiceResponse<Order | null>> {
    const index = orders.findIndex((order) => order.id === orderId);
    if (index === -1) {
      return {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      };
    }

    orders[index] = {
      ...orders[index],
      orderStatus: status,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: orders[index],
      error: null,
    };
  },

  async updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<ServiceResponse<Order | null>> {
    const index = orders.findIndex((order) => order.id === orderId);
    if (index === -1) {
      return {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      };
    }

    orders[index] = {
      ...orders[index],
      paymentStatus: status,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: orders[index],
      error: null,
    };
  },

  async getOrdersByStatus(status: OrderStatus): Promise<ServiceResponse<Order[]>> {
    const filtered = orders.filter((order) => order.orderStatus === status);
    return {
      success: true,
      data: filtered,
      error: null,
    };
  },

  async getActiveOrders(): Promise<ServiceResponse<Order[]>> {
    const active = orders.filter(
      (order) => order.orderStatus === 'Preparing' || order.orderStatus === 'Ready for Pickup' || order.orderStatus === 'Pending Payment'
    );
    return {
      success: true,
      data: active.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      error: null,
    };
  },

  resetMockData() {
    orders = [...mockOrders];
  },
};