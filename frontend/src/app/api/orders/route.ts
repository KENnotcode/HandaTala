import { NextRequest, NextResponse } from 'next/server';
import type { DocumentSnapshot, Query } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebaseAdmin';
import { getAuthenticatedUser } from '@/lib/adminAuth';
import { getErrorMessage } from '@/lib/apiError';
import type { CartItem, Order } from '@/types';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ORDER_COLLECTION = 'orders';
const STAFF_ROLES = new Set(['admin', 'kitchen']);

const cartItemSchema = z.object({
  menuItemId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  notes: z.string().optional(),
});

const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  paymentMethod: z.enum(['online', 'counter', 'cash']),
  customerName: z.string().trim().optional(),
  notes: z.string().optional().default(''),
});

class OrderSubmissionError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function isStaff(role: string): boolean {
  return STAFF_ROLES.has(role);
}

function formatTimestamp(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'object'
    && value !== null
    && 'toDate' in value
    && typeof value.toDate === 'function'
  ) {
    const date = value.toDate();
    return date instanceof Date ? date.toISOString() : '';
  }
  return '';
}

function formatOrder(snapshot: DocumentSnapshot): Order {
  const data = snapshot.data() as (Partial<Order> & {
    createdAt?: unknown;
    updatedAt?: unknown;
  }) | undefined;

  return {
    ...data,
    id: snapshot.id,
    createdAt: formatTimestamp(data?.createdAt),
    updatedAt: formatTimestamp(data?.updatedAt),
  } as Order;
}

function orderResponse(order: Order, status = 200) {
  return NextResponse.json({ success: true, data: order, error: null }, { status });
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, data: null, error: { code, message } },
    { status }
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return errorResponse('UNAUTHENTICATED', 'Please sign in to view orders.', 401);
    }

    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('trackingId');
    const requestedCustomerId = searchParams.get('customerId');

    if (trackingId) {
      const snapshot = await firestore.collection(ORDER_COLLECTION)
        .where('trackingId', '==', trackingId)
        .limit(1)
        .get();
      const document = snapshot.docs[0];
      if (!document) {
        return errorResponse('NOT_FOUND', 'Order not found.', 404);
      }

      const order = formatOrder(document);
      if (!isStaff(user.role) && order.customerId !== user.uid) {
        return errorResponse('NOT_FOUND', 'Order not found.', 404);
      }
      return orderResponse(order);
    }

    if (requestedCustomerId && !isStaff(user.role) && requestedCustomerId !== user.uid) {
      return errorResponse('FORBIDDEN', 'You can only view your own orders.', 403);
    }

    let query: Query = firestore.collection(ORDER_COLLECTION);
    if (requestedCustomerId) {
      query = query.where('customerId', '==', requestedCustomerId);
    } else if (!isStaff(user.role)) {
      if (user.role !== 'customer') {
        return errorResponse('FORBIDDEN', 'You do not have permission to view orders.', 403);
      }
      query = query.where('customerId', '==', user.uid);
    }

    const snapshot = await query.get();
    const orders = snapshot.docs
      .map(formatOrder)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, data: orders, error: null }, { status: 200 });
  } catch (error: unknown) {
    console.error('GET /api/orders error:', error);
    return errorResponse('INTERNAL_ERROR', getErrorMessage(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return errorResponse('UNAUTHENTICATED', 'Please sign in to place an order.', 401);
    }
    if (user.role !== 'customer' && user.role !== 'admin') {
      return errorResponse('FORBIDDEN', 'You do not have permission to place orders.', 403);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
    }

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('INVALID_ORDER', 'Order details are invalid.', 400);
    }

    const itemQuantities = new Map<string, number>();
    for (const item of parsed.data.items) {
      itemQuantities.set(
        item.menuItemId,
        (itemQuantities.get(item.menuItemId) || 0) + item.quantity
      );
    }

    const orderRef = firestore.collection(ORDER_COLLECTION).doc();
    const order = await firestore.runTransaction(async (transaction) => {
      const menuRecords = new Map<string, {
        price: number;
        name: string;
      }>();
      for (const [menuItemId, quantity] of itemQuantities) {
        const menuRef = firestore.collection('menu_items').doc(menuItemId);
        const snapshot = await transaction.get(menuRef);
        const menuItem = snapshot.data();
        if (!snapshot.exists || !menuItem) {
          throw new OrderSubmissionError('ITEM_NOT_FOUND', 409, 'A menu item is no longer available.');
        }
        if (menuItem.isAvailable === false) {
          throw new OrderSubmissionError('ITEM_UNAVAILABLE', 409, `${menuItem.name || 'This item'} is unavailable.`);
        }

        const stock = typeof menuItem.stock === 'number' && Number.isFinite(menuItem.stock)
          ? menuItem.stock
          : 0;
        if (stock < quantity) {
          throw new OrderSubmissionError(
            'INSUFFICIENT_STOCK',
            409,
            'We cannot process your orders as we dont have enough stocks'
          );
        }
        if (typeof menuItem.price !== 'number' || !Number.isFinite(menuItem.price)) {
          throw new OrderSubmissionError('INVALID_MENU_PRICE', 409, 'A menu item price is unavailable.');
        }

        menuRecords.set(menuItemId, {
          price: menuItem.price,
          name: typeof menuItem.name === 'string' ? menuItem.name : '',
        });
      }

      const items: CartItem[] = parsed.data.items.map((item) => {
        const menuItem = menuRecords.get(item.menuItemId);
        if (!menuItem) {
          throw new OrderSubmissionError('ITEM_NOT_FOUND', 409, 'A menu item is no longer available.');
        }
        return {
          menuItemId: item.menuItemId,
          name: menuItem.name || item.name,
          quantity: item.quantity,
          unitPrice: menuItem.price,
          subtotal: menuItem.price * item.quantity,
          ...(item.notes ? { notes: item.notes } : {}),
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const now = new Date().toISOString();
      const paymentStatus = user.role === 'admin' && parsed.data.paymentMethod !== 'online'
        ? 'paid'
        : 'pending';
      const order: Order = {
        id: orderRef.id,
        trackingId: `HT-${new Date().getFullYear()}-${orderRef.id.slice(0, 8).toUpperCase()}`,
        customerId: user.role === 'customer' ? user.uid : null,
        customerName: user.role === 'admin'
          ? parsed.data.customerName || 'Walk-in Customer'
          : user.name || user.email.split('@')[0] || 'Customer',
        items,
        subtotal,
        total: subtotal,
        paymentMethod: parsed.data.paymentMethod,
        paymentStatus,
        orderStatus: 'Received',
        notes: parsed.data.notes,
        createdAt: now,
        updatedAt: now,
        statusHistory: [
          { status: 'Placed Order', timestamp: now },
          { status: 'Received', timestamp: now },
        ],
        stockDeducted: false,
        stockReserved: false,
      };

      transaction.set(orderRef, order);
      return order;
    });

    return orderResponse(order, 201);
  } catch (error: unknown) {
    if (error instanceof OrderSubmissionError) {
      return errorResponse(error.code, error.message, error.status);
    }
    console.error('POST /api/orders error:', error);
    return errorResponse('INTERNAL_ERROR', getErrorMessage(error), 500);
  }
}
