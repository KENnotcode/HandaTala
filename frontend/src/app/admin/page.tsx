'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Utensils, 
  Package, 
  ShoppingBag, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  CreditCard
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin';
import { DashboardStat } from '@/components/admin';
import { Button, Card, Badge } from '@/components/ui';
import { orderService } from '@/services/orderService';
import { inventoryService } from '@/services/inventoryService';
import { formatPrice, formatDate } from '@/utils/format';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Order } from '@/types';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { isAdmin, isLoading: authLoading, checkAuth, user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    todayOrders: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    lowStock: 0,
    soldOut: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ordersResult, inventoryStatsResult] = await Promise.all([
        orderService.getOrders(),
        inventoryService.getInventoryStats(),
      ]);

      if (ordersResult.success && ordersResult.data) {
        const orders = ordersResult.data;
        const today = new Date().toDateString();
        
        const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
        const preparing = orders.filter(o => o.orderStatus === 'Preparing').length;
        const ready = orders.filter(o => o.orderStatus === 'Ready for Pickup').length;
        const completed = orders.filter(o => o.orderStatus === 'Completed').length;
        
        const todayRevenue = todayOrders
          .filter(o => o.paymentStatus === 'paid' && o.orderStatus !== 'Cancelled')
          .reduce((sum, o) => sum + o.total, 0);

        setStats({
          todayOrders: todayOrders.length,
          preparing,
          ready,
          completed,
          lowStock: inventoryStatsResult.data?.lowStockItems || 0,
          soldOut: inventoryStatsResult.data?.soldOutItems || 0,
          totalRevenue: todayRevenue,
        });

        setRecentOrders(orders.slice(0, 5));
      }
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
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
      const timeoutId = window.setTimeout(() => {
        void         queueMicrotask(() => {
          void fetchDashboardData();
        });
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [authLoading, isAdmin, router, fetchDashboardData]);

  const statCards = [
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: <ShoppingBag className="w-6 h-6" />,
      color: 'amber' as const,
      trend: { value: 12, label: 'vs yesterday' },
    },
    {
      title: 'Preparing',
      value: stats.preparing,
      icon: <Utensils className="w-6 h-6" />,
      color: 'blue' as const,
    },
    {
      title: 'Ready for Pickup',
      value: stats.ready,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green' as const,
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green' as const,
      trend: { value: 8, label: 'this week' },
    },
    {
      title: 'Low Stock',
      value: stats.lowStock,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'amber' as const,
    },
    {
      title: 'Sold Out',
      value: stats.soldOut,
      icon: <XCircle className="w-6 h-6" />,
      color: 'red' as const,
    },
    {
      title: "Today's Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: <CreditCard className="w-6 h-6" />,
      color: 'green' as const,
      trend: { value: 15, label: 'vs yesterday' },
    },
  ];

  if (!isAdmin || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      
      <div className="min-h-screen min-w-0 flex flex-col lg:pl-64">
        <header className="sticky top-14 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-slate-900/95 lg:top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 py-3 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.name || 'Admin'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchDashboardData} leftIcon={<Clock className="w-4 h-4" />} disabled={isLoading}>
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <motion.div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mb-6 lg:mb-8"
              >
                {statCards.map((stat, index) => (
                  <DashboardStat
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    trend={stat.trend}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  />
                ))}
              </motion.div>

              <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
                      <a href="/admin/orders" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                        View All
                      </a>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          No orders yet
                        </div>
                      ) : (
                        recentOrders.map((order, index) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-between"
                          >
                            <Link href={`/admin/orders/${order.id}`} className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm text-amber-600 dark:text-amber-400">
                                  #{order.trackingId}
                                </span>
                                <Badge 
                                  variant={statusColors[order.orderStatus] || 'default'} 
                                  size="sm"
                                >
                                  {order.orderStatus}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                              </p>
                            </Link>
                            <div className="text-right">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {formatPrice(order.total)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(order.createdAt, 'short')}
                              </p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
                    </div>
                    <div className="p-4 space-y-3">
                      <Link href="/admin/inventory">
                        <Button variant="outline" fullWidth leftIcon={<Package className="w-4 h-4" />} className="justify-start">
                          Manage Inventory
                        </Button>
                      </Link>
                      <Link href="/admin/menu">
                        <Button variant="outline" fullWidth leftIcon={<Utensils className="w-4 h-4" />} className="justify-start">
                          Edit Menu
                        </Button>
                      </Link>
                      <Link href="/admin/orders">
                        <Button variant="outline" fullWidth leftIcon={<ShoppingBag className="w-4 h-4" />} className="justify-start">
                          View All Orders
                        </Button>
                      </Link>
                      <Link href="/admin/pos">
                        <Button variant="outline" fullWidth leftIcon={<CreditCard className="w-4 h-4" />} className="justify-start">
                          Open POS
                        </Button>
                      </Link>
                      <Link href="/queue">
                        <Button variant="primary" fullWidth leftIcon={<Utensils className="w-4 h-4" />} className="justify-start">
                          Open Kitchen Queue
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  'Received': 'info',
  'Preparing': 'info',
  'Ready for Pickup': 'warning',
  'Completed': 'success',
  'Cancelled': 'danger',
  'Pending Payment': 'warning',
};