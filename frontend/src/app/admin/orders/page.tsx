'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Download } from 'lucide-react';
import { AdminSidebar } from '@/components/admin';
import { OrderTable } from '@/components/admin';
import { Button } from '@/components/ui';
import { orderService } from '@/services/orderService';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Order, OrderStatus } from '@/types';
import { useRouter } from 'next/navigation';

export default function AdminOrdersPage() {
  const { isAdmin, isLoading: authLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const result = await orderService.getOrders();
      if (result.success && result.data) {
        setOrders(result.data);
        setLoadError(null);
      } else {
        const message = result.error?.message || 'Failed to load orders';
        console.error('Failed to load admin orders:', result.error);
        setLoadError(message);
        if (showLoading) toast.error(message);
      }
    } catch (error: unknown) {
      console.error('Failed to load admin orders:', error);
      setLoadError('Failed to load orders');
      if (showLoading) toast.error('Failed to load orders');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.push('/login');
        return;
      }
      void fetchOrders();
      const intervalId = window.setInterval(() => {
        void fetchOrders(false);
      }, 15000);
      return () => window.clearInterval(intervalId);
    }
  }, [authLoading, isAdmin, router, fetchOrders]);

  const handleViewOrder = (order: Order) => {
    router.push(`/order/${order.trackingId}`);
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const result = await orderService.updateOrderStatus(orderId, status);
      if (!result.success || !result.data) {
        toast.error(result.error?.message || 'Failed to update order status');
        return;
      }
      setOrders(prev => prev.map(o => o.id === orderId ? result.data! : o));
      toast.success(`Order marked as ${status}`);
    } catch (error: unknown) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredOrders = orders.filter(order => 
    filterStatus === 'all' || order.orderStatus === filterStatus
  );

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-14 z-30 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 py-3 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage all customer orders</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
                <Button variant="outline" size="sm" onClick={fetchOrders} leftIcon={<RefreshCw className="w-4 h-4" />} disabled={isLoading}>
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loadError && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {loadError}
            </div>
          )}
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <OrderTable
                orders={filteredOrders}
                onViewOrder={handleViewOrder}
                onUpdateStatus={handleUpdateStatus}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
              />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}