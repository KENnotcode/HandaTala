import { Order, Payment, ServiceResponse, PaymentMethod, PaymentStatus } from '@/types';
import { orderService } from './orderService';

let payments: Payment[] = [];

const generatePaymentId = (): string => {
  return `payment-${Date.now()}`;
};

const generateReference = (): string => {
  return `MOCK-PAY-${Date.now()}`;
};

export const paymentService = {
  async createPayment(order: Order): Promise<ServiceResponse<Payment>> {
    const payment: Payment = {
      id: generatePaymentId(),
      orderId: order.id,
      method: order.paymentMethod,
      provider: order.paymentMethod === 'online' ? 'paymongo' : 'manual',
      status: 'pending',
      reference: generateReference(),
      amount: order.total,
      createdAt: new Date().toISOString(),
    };

    payments.push(payment);
    
    if (order.paymentMethod === 'online') {
      await orderService.updatePaymentStatus(order.id, 'pending');
    }

    return {
      success: true,
      data: payment,
      error: null,
    };
  },

  async initializeCheckout(order: Order): Promise<ServiceResponse<{ checkoutUrl: string; payment: Payment }>> {
    const paymentResult = await this.createPayment(order);
    
    if (!paymentResult.success || !paymentResult.data) {
      return {
        success: false,
        data: null,
        error: { code: 'PAYMENT_FAILED', message: 'Failed to create payment' },
      };
    }

    if (order.paymentMethod === 'online') {
      return {
        success: true,
        data: {
          checkoutUrl: `/checkout/online?paymentId=${paymentResult.data.id}`,
          payment: paymentResult.data,
        },
        error: null,
      };
    }

    return {
      success: true,
      data: {
        checkoutUrl: `/checkout/counter?paymentId=${paymentResult.data.id}`,
        payment: paymentResult.data,
      },
      error: null,
    };
  },

  async processOnlinePayment(paymentId: string): Promise<ServiceResponse<Payment>> {
    const index = payments.findIndex((p) => p.id === paymentId);
    if (index === -1) {
      return {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      };
    }

    payments[index] = {
      ...payments[index],
      status: 'paid',
    };

    await orderService.updatePaymentStatus(payments[index].orderId, 'paid');
    await orderService.updateOrderStatus(payments[index].orderId, 'Preparing');

    return {
      success: true,
      data: payments[index],
      error: null,
    };
  },

  async processCounterPayment(paymentId: string): Promise<ServiceResponse<Payment>> {
    const index = payments.findIndex((p) => p.id === paymentId);
    if (index === -1) {
      return {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      };
    }

    payments[index] = {
      ...payments[index],
      status: 'paid',
    };

    await orderService.updatePaymentStatus(payments[index].orderId, 'paid');
    await orderService.updateOrderStatus(payments[index].orderId, 'Preparing');

    return {
      success: true,
      data: payments[index],
      error: null,
    };
  },

  async getPaymentById(id: string): Promise<ServiceResponse<Payment | null>> {
    const payment = payments.find((p) => p.id === id);
    return {
      success: true,
      data: payment || null,
      error: payment ? null : { code: 'NOT_FOUND', message: 'Payment not found' },
    };
  },

  async getPaymentByOrderId(orderId: string): Promise<ServiceResponse<Payment | null>> {
    const payment = payments.find((p) => p.orderId === orderId);
    return {
      success: true,
      data: payment || null,
      error: payment ? null : { code: 'NOT_FOUND', message: 'Payment not found' },
    };
  },

  async simulatePaymentCallback(paymentId: string, success: boolean): Promise<ServiceResponse<Payment>> {
    const index = payments.findIndex((p) => p.id === paymentId);
    if (index === -1) {
      return {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      };
    }

    const newStatus: PaymentStatus = success ? 'paid' : 'failed';
    payments[index] = {
      ...payments[index],
      status: newStatus,
    };

    await orderService.updatePaymentStatus(payments[index].orderId, newStatus);
    if (success) {
      await orderService.updateOrderStatus(payments[index].orderId, 'Preparing');
    } else {
      await orderService.updateOrderStatus(payments[index].orderId, 'Cancelled');
    }

    return {
      success: true,
      data: payments[index],
      error: null,
    };
  },

  resetMockData() {
    payments = [];
  },
};