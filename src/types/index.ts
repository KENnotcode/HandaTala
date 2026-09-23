export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  trackingId: string;
  customerId: string | null;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'online' | 'counter' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'Preparing' | 'Ready for Pickup' | 'Completed' | 'Pending Payment' | 'Cancelled';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  menuItemId: string;
  stock: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: 'online' | 'counter' | 'cash';
  provider: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  reference: string;
  amount: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'kitchen';
}

export interface Category {
  id: string;
  name: string;
  displayName: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export type OrderStatus = Order['orderStatus'];
export type PaymentStatus = Payment['status'];
export type PaymentMethod = Order['paymentMethod'];