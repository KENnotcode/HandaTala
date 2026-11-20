import { Order, CartItem } from '@/types';

const createOrder = (
  id: string,
  trackingId: string,
  items: CartItem[],
  paymentMethod: Order['paymentMethod'],
  orderStatus: Order['orderStatus'],
  paymentStatus: Order['paymentStatus'],
  customerName: string = 'Guest Customer',
  notes: string = '',
  minutesAgo: number = 0
): Order => {
  const now = new Date();
  const createdAt = new Date(now.getTime() - minutesAgo * 60000).toISOString();
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  return {
    id,
    trackingId,
    customerId: null,
    customerName,
    items,
    subtotal,
    total: subtotal,
    paymentMethod,
    paymentStatus,
    orderStatus,
    notes,
    createdAt,
    updatedAt: createdAt,
  };
};

export const mockOrders: Order[] = [
  createOrder(
    'order-001',
    'HT-2026-00124',
    [
      { menuItemId: 'food-001', name: 'Chicken Rice Meal', quantity: 2, unitPrice: 65, subtotal: 130 },
      { menuItemId: 'food-015', name: 'Iced Tea', quantity: 1, unitPrice: 25, subtotal: 25 },
    ],
    'online',
    'Preparing',
    'paid',
    'Juan Dela Cruz',
    'Less spicy',
    45
  ),
  createOrder(
    'order-002',
    'HT-2026-00125',
    [
      { menuItemId: 'food-004', name: 'Chicken BBQ Meal', quantity: 1, unitPrice: 75, subtotal: 75 },
      { menuItemId: 'food-016', name: 'Calamansi Juice', quantity: 1, unitPrice: 30, subtotal: 30 },
    ],
    'counter',
    'Preparing',
    'pending',
    'Maria Santos',
    '',
    30
  ),
  createOrder(
    'order-003',
    'HT-2026-00126',
    [
      { menuItemId: 'food-005', name: 'Pancit Canton', quantity: 1, unitPrice: 60, subtotal: 60 },
      { menuItemId: 'food-017', name: 'Bottled Water', quantity: 2, unitPrice: 15, subtotal: 30 },
    ],
    'online',
    'Preparing',
    'paid',
    'Pedro Reyes',
    'No onions',
    20
  ),
  createOrder(
    'order-004',
    'HT-2026-00121',
    [
      { menuItemId: 'food-006', name: 'Siomai Rice', quantity: 1, unitPrice: 55, subtotal: 55 },
    ],
    'counter',
    'Ready for Pickup',
    'paid',
    'Ana Garcia',
    '',
    60
  ),
  createOrder(
    'order-005',
    'HT-2026-00122',
    [
      { menuItemId: 'food-019', name: 'Halo-Halo', quantity: 1, unitPrice: 65, subtotal: 65 },
      { menuItemId: 'food-015', name: 'Iced Tea', quantity: 1, unitPrice: 25, subtotal: 25 },
    ],
    'online',
    'Ready for Pickup',
    'paid',
    'Carlos Mendoza',
    'Extra leche flan',
    50
  ),
  createOrder(
    'order-006',
    'HT-2026-00117',
    [
      { menuItemId: 'food-008', name: 'Burger Steak', quantity: 1, unitPrice: 80, subtotal: 80 },
      { menuItemId: 'food-009', name: 'French Fries', quantity: 1, unitPrice: 45, subtotal: 45 },
      { menuItemId: 'food-015', name: 'Iced Tea', quantity: 1, unitPrice: 25, subtotal: 25 },
    ],
    'counter',
    'Completed',
    'paid',
    'Rosa Lim',
    '',
    120
  ),
  createOrder(
    'order-007',
    'HT-2026-00118',
    [
      { menuItemId: 'food-002', name: 'Pork Adobo Rice', quantity: 1, unitPrice: 70, subtotal: 70 },
      { menuItemId: 'food-016', name: 'Calamansi Juice', quantity: 1, unitPrice: 30, subtotal: 30 },
    ],
    'online',
    'Completed',
    'paid',
    'Miguel Torres',
    'Extra rice',
    110
  ),
  createOrder(
    'order-008',
    'HT-2026-00119',
    [
      { menuItemId: 'food-010', name: 'Cheese Burger', quantity: 2, unitPrice: 65, subtotal: 130 },
      { menuItemId: 'food-017', name: 'Bottled Water', quantity: 2, unitPrice: 15, subtotal: 30 },
    ],
    'counter',
    'Completed',
    'paid',
    'Guest Customer',
    '',
    100
  ),
];