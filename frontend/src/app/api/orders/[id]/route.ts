import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebaseAdmin';
import { getAuthenticatedUser } from '@/lib/adminAuth';
import { getErrorMessage } from '@/lib/apiError';
import type { Order } from '@/types';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set(['admin', 'kitchen']);

const updateOrderSchema = z.object({
  orderStatus: z.enum(['Received', 'Preparing', 'Ready for Pickup', 'Completed', 'Pending Payment', 'Cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
}).strict().refine(
  (update) => update.orderStatus !== undefined || update.paymentStatus !== undefined,
  'At least one order field must be provided.'
);

class OrderUpdateError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string
  ) {
    super(message);
  }
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
    paymentStatus: data.paymentStatus ?? 'pending',
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
    const order = await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      const currentOrder = formatOrder(snapshot.id, snapshot.data());
      if (!currentOrder) {
        throw new OrderUpdateError('NOT_FOUND', 404, 'Order not found.');
      }

      const isStaff = STAFF_ROLES.has(user.role);
      if (!isStaff && currentOrder.customerId !== user.uid) {
        throw new OrderUpdateError('NOT_FOUND', 404, 'Order not found.');
      }

      if (parsed.data.paymentStatus !== undefined && user.role !== 'admin') {
        throw new OrderUpdateError('FORBIDDEN', 403, 'Only admins can update payment status.');
      }

      if (!isStaff && parsed.data.orderStatus !== undefined) {
        throw new OrderUpdateError('FORBIDDEN', 403, 'You cannot update this order status.');
      }

      if (
        currentOrder.orderStatus === 'Completed'
        && parsed.data.orderStatus !== undefined
        && parsed.data.orderStatus !== 'Completed'
      ) {
        throw new OrderUpdateError('FORBIDDEN', 403, 'Completed orders cannot have their status changed.');
      }
      if (
        currentOrder.orderStatus === 'Cancelled'
        && parsed.data.orderStatus !== undefined
        && parsed.data.orderStatus !== 'Cancelled'
      ) {
        throw new OrderUpdateError('FORBIDDEN', 403, 'Cancelled orders cannot be reopened.');
      }

      const updates: Partial<Order> = {};
      if (parsed.data.orderStatus !== undefined) {
        updates.orderStatus = parsed.data.orderStatus;
      }
      if (parsed.data.paymentStatus !== undefined) {
        updates.paymentStatus = parsed.data.paymentStatus;
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

      const shouldDeductStock = nextOrderStatus !== 'Cancelled'
        && !currentOrder.stockDeducted
        && ['Preparing', 'Ready for Pickup', 'Completed'].includes(nextOrderStatus);
      const shouldReleaseStock = nextOrderStatus === 'Cancelled'
        && (currentOrder.stockReserved === true || currentOrder.stockDeducted === true);

      if (shouldDeductStock || shouldReleaseStock) {
        const itemQuantities = new Map<string, number>();
        currentOrder.items.forEach((item) => {
          itemQuantities.set(
            item.menuItemId,
            (itemQuantities.get(item.menuItemId) || 0) + item.quantity
          );
        });

        const menuSnapshots = new Map<string, DocumentSnapshot>();
        for (const menuItemId of itemQuantities.keys()) {
          const menuSnapshot = await transaction.get(
            firestore.collection('menu_items').doc(menuItemId)
          );
          if (!menuSnapshot.exists) {
            throw new OrderUpdateError(
              shouldDeductStock ? 'INSUFFICIENT_STOCK' : 'STOCK_RESTORE_FAILED',
              409,
              shouldDeductStock
                ? 'We cannot process your orders as we dont have enough stocks'
                : 'Cannot cancel this order because a menu item no longer exists.'
            );
          }
          menuSnapshots.set(menuItemId, menuSnapshot);
        }

        const stockUpdates = new Map<string, { stock: number; reservedStock: number }>();
        for (const [menuItemId, quantity] of itemQuantities) {
          const menuSnapshot = menuSnapshots.get(menuItemId);
          if (!menuSnapshot) {
            throw new OrderUpdateError('STOCK_RESTORE_FAILED', 409, 'Could not update item stock.');
          }
          const menuItem = menuSnapshot.data();
          const currentStock = menuItem?.stock;
          const stock = typeof currentStock === 'number' && Number.isFinite(currentStock)
            ? currentStock
            : 0;
          const currentReservedStock = menuItem?.reservedStock;
          const reservedStock = typeof currentReservedStock === 'number' && Number.isFinite(currentReservedStock)
            ? currentReservedStock
            : 0;

          if (shouldDeductStock) {
            if (stock < quantity) {
              throw new OrderUpdateError(
                'INSUFFICIENT_STOCK',
                409,
                'We cannot process your orders as we dont have enough stocks'
              );
            }
            stockUpdates.set(menuItemId, {
              stock: stock - quantity,
              reservedStock: currentOrder.stockReserved
                ? Math.max(0, reservedStock - quantity)
                : reservedStock,
            });
          } else if (currentOrder.stockReserved) {
            stockUpdates.set(menuItemId, {
              stock,
              reservedStock: Math.max(0, reservedStock - quantity),
            });
          } else {
            stockUpdates.set(menuItemId, {
              stock: stock + quantity,
              reservedStock,
            });
          }
        }

        for (const [menuItemId, stockUpdate] of stockUpdates) {
          const menuSnapshot = menuSnapshots.get(menuItemId);
          if (!menuSnapshot) {
            throw new OrderUpdateError('STOCK_RESTORE_FAILED', 409, 'Could not update item stock.');
          }
          transaction.update(menuSnapshot.ref, {
            ...stockUpdate,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        if (shouldDeductStock) {
          updates.stockDeducted = true;
          updates.stockReserved = false;
        }
        if (shouldReleaseStock) {
          updates.stockDeducted = false;
          updates.stockReserved = false;
        }
      }

      await transaction.update(orderRef, { ...updates, updatedAt });
      return { ...currentOrder, ...updates, updatedAt };
    });

    return NextResponse.json({ success: true, data: order, error: null }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof OrderUpdateError) {
      return errorResponse(error.code, error.message, error.status);
    }
    console.error('PATCH /api/orders/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', getErrorMessage(error), 500);
  }
}
