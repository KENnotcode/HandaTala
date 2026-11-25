'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Clock, Package, Truck, CheckCircle, RefreshCw, Copy, XCircle } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { CartButton } from '@/components/cart';
import { orderService } from '@/services/orderService';
import { OrderStatus, OrderTimeline } from '@/components/order';
import { formatPrice, formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import type { Order, OrderStatus as OrderStatusValue, OrderStatusEvent } from '@/types';

type TimelineStatus = 'Placed Order' | OrderStatusValue;

function formatTimelineTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Time unavailable';
  }
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function OrderTrackingPage() {
  const { trackingId } = useParams<{ trackingId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    const fetchOrder = async (showLoading: boolean) => {
      if (!trackingId) {
        setOrder(null);
        setIsLoading(false);
        return;
      }

      if (showLoading) {
        setIsLoading(true);
        setOrder(null);
      }
      try {
        const result = await orderService.getOrderByTrackingId(trackingId);
        if (!isCurrent) return;
        if (result.success && result.data) {
          setOrder(result.data);
        } else if (showLoading) {
          setOrder(null);
          toast.error(result.error?.message || 'Order not found');
        } else {
          console.error('Failed to refresh order details:', result.error);
        }
      } catch (error: unknown) {
        if (!isCurrent) return;
        console.error('Failed to load order details:', error);
        if (showLoading) {
          setOrder(null);
          toast.error('Failed to load order');
        }
      } finally {
        if (isCurrent && showLoading) setIsLoading(false);
      }
    };

    void fetchOrder(true);
    const intervalId = window.setInterval(() => void fetchOrder(false), 15000);
    const refreshOnFocus = () => void fetchOrder(false);
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [trackingId]);

  const copyTrackingId = () => {
    if (trackingId) {
      navigator.clipboard.writeText(trackingId);
      toast.success('Tracking ID copied!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <CartButton />
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto px-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <CartButton />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Order Not Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            We couldn&apos;t find an order with that tracking number. Please check and try again.
          </p>
          <Link href="/orders">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              View My Orders
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const recordedHistory = order.statusHistory || [];
  const statusHistory: OrderStatusEvent[] = [
    ...(recordedHistory.some((event) => event.status === 'Placed Order')
      ? []
      : [{ status: 'Placed Order' as const, timestamp: order.createdAt }]),
    ...recordedHistory,
    ...(recordedHistory.some((event) => event.status === order.orderStatus)
      ? []
      : [{ status: order.orderStatus, timestamp: order.updatedAt }]),
  ];
  const timestampByStatus = new Map<TimelineStatus, string>();
  statusHistory.forEach((event) => timestampByStatus.set(event.status, event.timestamp));

  const hasPendingPayment = statusHistory.some((event) => event.status === 'Pending Payment');
  const isCancelled = order.orderStatus === 'Cancelled';
  const previousStatuses: OrderStatusValue[] = ['Preparing', 'Ready for Pickup', 'Completed'];
  const timelineStatuses: TimelineStatus[] = isCancelled
    ? [
      'Placed Order',
      ...(hasPendingPayment ? ['Pending Payment' as const] : []),
      ...previousStatuses.filter((status) => statusHistory.some((event) => event.status === status)),
      'Cancelled',
    ]
    : [
      'Placed Order',
      ...(hasPendingPayment ? ['Pending Payment' as const] : []),
      ...previousStatuses,
    ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CartButton />
      
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/orders" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Orders</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={copyTrackingId} leftIcon={<Copy className="w-4 h-4" />}>
                Copy ID
              </Button>
              {order.orderStatus !== 'Completed' && order.orderStatus !== 'Cancelled' && (
                <Button variant="ghost" size="sm" onClick={() => window.location.reload()} leftIcon={<RefreshCw className="w-4 h-4" />}>
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <Badge variant="default" className="mb-2" dot>
                  Order Tracking
                </Badge>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Order <span className="text-amber-600 dark:text-amber-400">#{order.trackingId}</span>
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <OrderStatus status={order.orderStatus} size="lg" />
              </div>
            </div>

            <Card className="p-4">
              <OrderTimeline currentStatus={order.orderStatus} />
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Details</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{order.paymentMethod.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Payment Status</p>
                    <Badge variant={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'pending' ? 'warning' : 'danger'}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Placed</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.createdAt, 'full')}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Items</h3>
                  <ul className="space-y-3" role="list">
                    {order.items.map((item, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          {item.notes && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 italic">Note: {item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.quantity} × {formatPrice(item.unitPrice)}
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatPrice(item.subtotal)}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                  
                  <div className="mt-4 flex justify-end space-x-4 text-lg font-bold">
                    <span>Total: {formatPrice(order.total)}</span>
                  </div>
                </div>
              </Card>

              {order.notes && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Special Instructions</h2>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                    <p className="text-amber-800 dark:text-amber-200 italic">{order.notes}</p>
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Order Timeline</h2>
                <div className="space-y-4">
                  {timelineStatuses.map((status, index) => {
                    const timestamp = timestampByStatus.get(status);
                    const isCurrent = status === order.orderStatus;
                    const isPast = Boolean(timestamp) && !isCurrent;

                    return (
                      <motion.div
                        key={status}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4"
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                          status === 'Cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          isPast ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          isCurrent ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 animate-pulse' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        )}>
                          {status === 'Ready for Pickup' ? (
                            <Truck className="w-5 h-5" />
                          ) : status === 'Completed' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : status === 'Cancelled' ? (
                            <XCircle className="w-5 h-5" />
                          ) : status === 'Pending Payment' ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <Package className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            'font-medium',
                            isPast || isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                          )}>
                            {status}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {timestamp ? formatTimelineTimestamp(timestamp) : 'Waiting for this step'}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                
                <div className="space-y-3">
                  <Link href={`/order/${order.trackingId}?receipt=true`}>
                    <Button variant="outline" fullWidth leftIcon={<CheckCircle className="w-4 h-4" />}>
                      View Receipt
                    </Button>
                  </Link>
                  
                  <Button variant="outline" fullWidth leftIcon={<Copy className="w-4 h-4" />} onClick={copyTrackingId}>
                    Copy Tracking ID
                  </Button>
                  
                  <Link href="/orders">
                    <Button variant="outline" fullWidth leftIcon={<Clock className="w-4 h-4" />}>
                      View Order History
                    </Button>
                  </Link>
                  
                  <Link href="/menu">
                    <Button variant="primary" fullWidth leftIcon={<ChevronRight className="w-4 h-4" />}>
                      Order Again
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Need Help?</h3>
                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <p>Contact the canteen staff if you have questions about your order.</p>
                    <p className="font-medium">Canteen: Ground Floor, Building A</p>
                    <p className="font-medium">Hours: 7:00 AM - 7:00 PM</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}