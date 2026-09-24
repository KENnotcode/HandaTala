'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Utensils, 
  Package, 
  ShoppingBag, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  Users,
  CreditCard
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin';
import { DashboardStat } from '@/components/admin';
import { Button, Card, Badge } from '@/components/ui';
import { orderService } from '@/services/orderService';
import { inventoryService } from '@/services/inventoryService';
import { formatPrice, formatDate } from '@/utils/format';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const { isAdmin, checkAuth, user } = useAuthStore();
  const [stats, setStats] = useState({
    todayOrders: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    lowStock: 0,
    soldOut: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    if (!isAdmin) {
      window.location.href = '/admin/login';
      return;
    }
    fetchDashboardData();
  }, [checkAuth, isAdmin]);

  const fetchDashboardData = async () => {
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
          .filter(o => o.paymentStatus === 'paid')
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
  };

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-16">
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

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7].map(i => (
                <motion.div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
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
                                {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
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

import Link from 'next/link';
const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  'Preparing': 'info',
  'Ready for Pickup': 'warning',
  'Completed': 'success',
  'Cancelled': 'danger',
  'Pending Payment': 'warning',
};