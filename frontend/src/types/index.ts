export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice: number;
  image: string;
  stock: number;
  lowStockThreshold?: number;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number;
  updatedAt?: string | null;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  image?: string;
}

export type OrderStatus =
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Completed'
  | 'Pending Payment'
  | 'Cancelled';

export interface OrderStatusEvent {
  status: 'Placed Order' | OrderStatus;
  timestamp: string;
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
  orderStatus: OrderStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  statusHistory?: OrderStatusEvent[];
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
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'kitchen';
  phone?: string;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SignupInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
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

export type PaymentStatus = Payment['status'];
export type PaymentMethod = Order['paymentMethod'];