import { NextRequest, NextResponse } from 'next/server';
import type { DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebaseAdmin';
import { getAuthenticatedUser } from '@/lib/adminAuth';
import { getErrorMessage } from '@/lib/apiError';
import type { Order } from '@/types';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set(['admin', 'kitchen']);

const updateOrderSchema = z.object({
  orderStatus: z.enum(['Preparing', 'Ready for Pickup', 'Completed', 'Pending Payment', 'Cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
}).strict().refine(
  (update) => update.orderStatus !== undefined || update.paymentStatus !== undefined,
  'At least one order field must be provided.'
);

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

function formatOrder(
  id: string,
  data: DocumentData | undefined
): Order | null {
  if (!data) {
    return null;
  }

  return {
    ...data,
    id,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  } as Order;
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, data: null, error: { code, message } },
    { status }
  );
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return errorResponse('UNAUTHENTICATED', 'Please sign in to view this order.', 401);
    }

    const { id } = await params;
    const snapshot = await firestore.collection('orders').doc(id).get();
    const order = formatOrder(snapshot.id, snapshot.data());
    if (!order) {
      return errorResponse('NOT_FOUND', 'Order not found.', 404);
    }
    if (!STAFF_ROLES.has(user.role) && order.customerId !== user.uid) {
      return errorResponse('NOT_FOUND', 'Order not found.', 404);
    }

    return NextResponse.json({ success: true, data: order, error: null }, { status: 200 });
  } catch (error: unknown) {
    console.error('GET /api/orders/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', getErrorMessage(error), 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return errorResponse('UNAUTHENTICATED', 'Please sign in to update this order.', 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
    }

    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('INVALID_ORDER_UPDATE', 'Order update is invalid.', 400);
    }

    const { id } = await params;
    const orderRef = firestore.collection('orders').doc(id);
    const snapshot = await orderRef.get();
    const currentOrder = formatOrder(snapshot.id, snapshot.data());
    if (!currentOrder) {
      return errorResponse('NOT_FOUND', 'Order not found.', 404);
    }

    const isStaff = STAFF_ROLES.has(user.role);
    if (!isStaff && currentOrder.customerId !== user.uid) {
      return errorResponse('NOT_FOUND', 'Order not found.', 404);
    }

    if (!isStaff && parsed.data.paymentStatus !== undefined) {
      const validCustomerPaymentUpdate =
        currentOrder.paymentMethod === 'online'
        && currentOrder.orderStatus === 'Pending Payment'
        && (parsed.data.paymentStatus === 'paid' || parsed.data.paymentStatus === 'failed');
      if (!validCustomerPaymentUpdate) {
        return errorResponse('FORBIDDEN', 'You cannot update this payment.', 403);
      }
    }

    if (!isStaff && parsed.data.orderStatus !== undefined) {
      const validPaymentTransition =
        (parsed.data.orderStatus === 'Preparing' && currentOrder.paymentStatus === 'paid')
        || (parsed.data.orderStatus === 'Cancelled' && currentOrder.paymentStatus === 'failed');
      if (currentOrder.paymentMethod !== 'online' || !validPaymentTransition) {
        return errorResponse('FORBIDDEN', 'You cannot update this order status.', 403);
      }
    }

    if (currentOrder.orderStatus === 'Completed' && parsed.data.orderStatus !== undefined && parsed.data.orderStatus !== 'Completed') {
      return errorResponse('FORBIDDEN', 'Completed orders cannot have their status changed.', 403);
    }

    const updates: Partial<Order> = {};
    if (parsed.data.orderStatus !== undefined) {
      updates.orderStatus = parsed.data.orderStatus;
    }
    if (parsed.data.paymentStatus !== undefined) {
      updates.paymentStatus = parsed.data.paymentStatus;
      if (!isStaff && parsed.data.paymentStatus === 'paid') {
        updates.orderStatus = 'Preparing';
      } else if (!isStaff && parsed.data.paymentStatus === 'failed') {
        updates.orderStatus = 'Cancelled';
      }
    }

    const updatedAt = new Date().toISOString();
    const nextOrderStatus = updates.orderStatus || currentOrder.orderStatus;
    if (nextOrderStatus !== currentOrder.orderStatus) {
      updates.statusHistory = [
        ...(currentOrder.statusHistory || [
          { status: 'Placed Order', timestamp: currentOrder.createdAt },
        ]),
        { status: nextOrderStatus, timestamp: updatedAt },
      ];
    }

    await orderRef.update({ ...updates, updatedAt });
    const order = { ...currentOrder, ...updates, updatedAt };

    return NextResponse.json({ success: true, data: order, error: null }, { status: 200 });
  } catch (error: unknown) {
    console.error('PATCH /api/orders/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', getErrorMessage(error), 500);
  }
}
