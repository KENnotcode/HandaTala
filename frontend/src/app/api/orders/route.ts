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

    const items: CartItem[] = [];
    for (const item of parsed.data.items) {
      const menuDocument = await firestore.collection('menu_items').doc(item.menuItemId).get();
      const menuItem = menuDocument.data();
      if (!menuDocument.exists || !menuItem) {
        return errorResponse('ITEM_NOT_FOUND', `${item.name} is no longer on the menu.`, 409);
      }
      if (menuItem.isAvailable === false) {
        return errorResponse('ITEM_UNAVAILABLE', `${menuItem.name || item.name} is unavailable.`, 409);
      }
      if (typeof menuItem.stock === 'number' && menuItem.stock < item.quantity) {
        return errorResponse('INSUFFICIENT_STOCK', `Not enough stock for ${menuItem.name || item.name}.`, 409);
      }
      if (typeof menuItem.price !== 'number' || !Number.isFinite(menuItem.price)) {
        return errorResponse('INVALID_MENU_PRICE', `Price for ${item.name} is unavailable.`, 409);
      }

      items.push({
        menuItemId: item.menuItemId,
        name: typeof menuItem.name === 'string' ? menuItem.name : item.name,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        subtotal: menuItem.price * item.quantity,
        ...(item.notes ? { notes: item.notes } : {}),
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const orderRef = firestore.collection(ORDER_COLLECTION).doc();
    const now = new Date().toISOString();
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
      paymentStatus: parsed.data.paymentMethod === 'online' ? 'pending' : 'paid',
      orderStatus: parsed.data.paymentMethod === 'online' ? 'Pending Payment' : 'Preparing',
      notes: parsed.data.notes,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        { status: 'Placed Order', timestamp: now },
        {
          status: parsed.data.paymentMethod === 'online' ? 'Pending Payment' : 'Preparing',
          timestamp: now,
        },
      ],
    };

    await orderRef.set(order);
    return orderResponse(order, 201);
  } catch (error: unknown) {
    console.error('POST /api/orders error:', error);
    return errorResponse('INTERNAL_ERROR', getErrorMessage(error), 500);
  }
}
