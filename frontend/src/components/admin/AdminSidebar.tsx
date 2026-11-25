'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Utensils, 
  Package, 
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
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isMobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open admin navigation"
          aria-controls="admin-navigation-sidebar"
          aria-expanded={isMobileOpen}
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/admin" className="font-bold text-lg text-gray-900 dark:text-white">
          HandaTala
        </Link>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/55 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        id="admin-navigation-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] flex-col border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 lg:z-40 lg:w-64 lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <span className="whitespace-nowrap text-xl font-bold text-gray-900 dark:text-white">HandaTala</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden"
            aria-label="Close admin navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 transition-colors',
                  isActive
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Utensils className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
                {user?.role || 'admin'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            fullWidth
            onClick={handleLogout}
            className="mt-2"
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}