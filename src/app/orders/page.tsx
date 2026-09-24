'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { CartButton } from '@/components/cart';
import { orderService } from '@/services/orderService';
import { OrderCard } from '@/components/order';
import { formatPrice, formatDate } from '@/utils/format';
import { toast } from 'sonner';

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const result = await orderService.getOrders();
        if (result.success && result.data) {
          setOrders(result.data);
        }
      } catch {
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    'Preparing': 'info',
    'Ready for Pickup': 'warning',
    'Completed': 'success',
    'Cancelled': 'danger',
    'Pending Payment': 'warning',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CartButton />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CartButton />
      
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <Badge variant="default" className="mb-2" dot>
              Order History
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Your Orders
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and manage all your past and current orders
            </p>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-16 h-16 text-gray-300 dark:text-gray-600" />}
              title="No orders yet"
              description="You haven't placed any orders yet. Browse our menu and place your first order!"
              action={{
                label: 'Browse Menu',
                onClick: () => window.location.href = '/menu',
                variant: 'primary'
              }}
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <OrderCard
                    order={order}
                    variant="compact"
                    onClick={() => window.location.href = `/order/${order.trackingId}`}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}