'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Utensils, 
  Package, 
  ShoppingCart, 
  List, 
  ChefHat,
  LogOut,
  Menu,
  X,
  CreditCard
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Menu', href: '/admin/menu', icon: Utensils },
  { name: 'Inventory', href: '/admin/inventory', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: List },
  { name: 'POS', href: '/admin/pos', icon: CreditCard },
  { name: 'Queue', href: '/queue', icon: ChefHat },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/admin/login';
  };

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: isMobileOpen || !isCollapsed ? 0 : -280 }}
          exit={{ x: -280 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed lg:relative inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300',
            isCollapsed ? 'w-20' : 'w-64',
            isMobileOpen ? 'w-64' : ''
          )}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
            <motion.div
              initial={false}
              animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
              className="overflow-hidden whitespace-nowrap"
            >
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900 dark:text-white">HandaTala</span>
              </Link>
            </motion.div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </Button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin navigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <motion.span
                    initial={false}
                    animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            <div className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg',
              isCollapsed ? 'justify-center' : 'justify-start'
            )}>
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <motion.div
                initial={false}
                animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role || 'admin'}
                  </p>
                </div>
              </motion.div>
            </div>
            <Button
              variant="ghost"
              fullWidth
              onClick={handleLogout}
              className="mt-2"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              <span className={isCollapsed ? 'hidden' : 'inline'}>Sign Out</span>
            </Button>
          </div>
        </motion.aside>
      </AnimatePresence>
    </>
  );
}

import { useState } from 'react';