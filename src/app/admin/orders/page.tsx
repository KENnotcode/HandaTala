'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Filter, Eye, MoreVertical, Download } from 'lucide-react';
import { AdminSidebar } from '@/components/admin';
import { OrderTable } from '@/components/admin';
import { Button, Badge, Card } from '@/components/ui';
import { orderService } from '@/services/orderService';
import { formatPrice, formatDate } from '@/utils/format';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { OrderStatus } from '@/types';

export default function AdminOrdersPage() {
  const { isAdmin, checkAuth } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    checkAuth();
    if (!isAdmin) {
      window.location.href = '/admin/login';
      return;
    }
    fetchOrders();
  }, [checkAuth, isAdmin]);

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

  const handleViewOrder = (order: any) => {
    window.location.href = `/order/${order.trackingId}`;
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const result = await orderService.updateOrderStatus(orderId, status);
      if (result.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: status } : o));
        toast.success(`Order marked as ${status}`);
      }
    } catch {
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
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-16">
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