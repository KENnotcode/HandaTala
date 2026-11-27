'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { Plus, Minus, Trash2, CreditCard, Wallet, X, Search, CheckCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin';
import { FoodCard } from '@/components/menu';
import { Button, Badge, Card, Input, Modal } from '@/components/ui';
import { orderService } from '@/services/orderService';
import { menuService } from '@/services/menuService';
import { formatPrice } from '@/utils/format';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import type { CartItem, MenuItem, Order } from '@/types';

function categoryKey(category: string): string {
  return category.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

export default function AdminPOSPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading, checkAuth, user } = useAuthStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const loadMenuItems = useCallback(async (showLoading = true) => {
    if (showLoading) setIsMenuLoading(true);
    try {
      const result = await menuService.getMenuItems();
      if (!result.success || !result.data) {
        const message = result.error?.message || 'Could not load menu items.';
        console.error('Failed to load POS menu:', result.error);
        setMenuError(message);
        if (showLoading) toast.error(message);
        return;
      }

      setMenuItems(result.data);
      setMenuError(null);
    } catch (error: unknown) {
      console.error('Failed to load POS menu:', error);
      setMenuError('Could not load menu items.');
      if (showLoading) toast.error('Could not load menu items.');
    } finally {
      if (showLoading) setIsMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/login');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const timeoutId = window.setTimeout(() => {
      void loadMenuItems();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [authLoading, isAdmin, loadMenuItems]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const refreshMenu = () => void loadMenuItems(false);
    window.addEventListener('focus', refreshMenu);
    const intervalId = window.setInterval(refreshMenu, 30000);
    return () => {
      window.removeEventListener('focus', refreshMenu);
      window.clearInterval(intervalId);
    };
  }, [authLoading, isAdmin, loadMenuItems]);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, string>();
    menuItems.forEach((item) => {
      const key = categoryKey(item.category);
      if (key && !categoryMap.has(key)) {
        categoryMap.set(key, item.category.trim());
      }
    });
    return [
      { key: 'all', label: 'All' },
      ...Array.from(categoryMap, ([key, label]) => ({ key, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [menuItems]);

  const availableItems = useMemo(() => {
    return menuItems.filter((item) => item.isAvailable && (item.availableStock ?? item.stock) > 0);
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return availableItems.filter(item => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(query)
        || item.description.toLowerCase().includes(query);
      const matchesCategory = activeCategory === 'all' || categoryKey(item.category) === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [availableItems, searchQuery, activeCategory]);

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => 
          i.menuItemId === item.id 
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.price,
        subtotal: item.price,
        image: item.image,
      }];
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
      return;
    }
    setCart(prev => prev.map(i => 
      i.menuItemId === menuItemId 
        ? { ...i, quantity, subtotal: i.unitPrice * quantity }
        : i
    ));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    setIsProcessing(true);
    try {
      const cartItems = cart.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      }));

      const newOrder = await orderService.createOrder(
        cartItems,
        paymentMethod === 'online' ? 'online' : 'counter',
        customerName,
        notes
      );

      if (!newOrder.success || !newOrder.data) {
        toast.error(newOrder.error?.message || 'Failed to process order');
        setIsProcessing(false);
        return;
      }

      const order = newOrder.data;
      setLastOrder(order);
      setShowReceipt(true);
      setCart([]);
      setCustomerName('');
      setNotes('');
      setIsProcessing(false);
      toast.success(
        paymentMethod === 'online'
          ? 'Order created! Payment is still unpaid.'
          : 'Order created! Pay at counter.'
      );
    } catch (error: unknown) {
      console.error('Failed to process POS order:', error);
      toast.error('Failed to process order');
      setIsProcessing(false);
    }
  };

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminLayout>
      
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-14 z-30 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 py-3 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">POS - Point of Sale</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Walk-in counter orders</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-amber-600">
                  Staff: {user?.name || 'Admin'}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-4 flex flex-col gap-4">
                  <div className="relative w-full xl:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search menu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category.key}
                        onClick={() => setActiveCategory(category.key)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                          activeCategory === category.key
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        )}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {menuError && (
                  <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>{menuError}</span>
                      <Button variant="outline" size="sm" onClick={() => void loadMenuItems()}>
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                {isMenuLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {Array.from({ length: 6 }, (_, index) => (
                      <div key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <div className="aspect-video animate-pulse bg-gray-200 dark:bg-gray-700" />
                        <div className="space-y-3 p-4">
                          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-9 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {filteredItems.map((item) => (
                      <FoodCard
                        key={item.id}
                        item={item}
                        onAdd={() => addToCart(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {menuItems.length === 0 ? 'No menu items available' : 'No matching items'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {menuItems.length === 0
                        ? 'Add items through Menu Management to make them available here.'
                        : 'Try another search or category.'}
                    </p>
                  </div>
                )}
              </motion.div>
            </section>

            <aside className="min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="flex flex-col xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)]">
                  <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Order</h2>
                    <Badge variant="default">{itemCount} items</Badge>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No items in order</p>
                        <p className="text-sm mt-1">Add items from the menu</p>
                      </div>
                    ) : (
                      <ul className="space-y-3" role="list">
                        {cart.map((item) => (
                          <motion.li
                            key={item.menuItemId}
                            layout
                            className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                          >
                            <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                              <div className="w-full h-full bg-linear-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30" />
                            </div>
                            <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  sizes="48px"
                                  unoptimized
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-linear-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
                                  <span className="text-lg">🍽️</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">{item.name}</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(item.menuItemId)}
                                  className="text-gray-400 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="p-1"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="px-2 font-medium w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                  className="p-1"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <span className="ml-auto font-medium text-gray-900 dark:text-white">
                                  {formatPrice(item.subtotal)}
                                </span>
                              </div>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="shrink-0 space-y-3 border-t border-gray-200 p-4 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                          <span className="font-medium text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-gray-900 dark:text-white">Total</span>
                          <span className="text-amber-600 dark:text-amber-400">{formatPrice(subtotal)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">Payment Method</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setPaymentMethod('cash')}
                            className={cn(
                              'p-3 rounded-lg border-2 text-center transition-colors',
                              paymentMethod === 'cash'
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            )}
                          >
                            <Wallet className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium">Cash</span>
                          </button>
                          <button
                            onClick={() => setPaymentMethod('online')}
                            className={cn(
                              'p-3 rounded-lg border-2 text-center transition-colors',
                              paymentMethod === 'online'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            )}
                          >
                            <CreditCard className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium">Online</span>
                          </button>
                        </div>
                      </div>

                      <Input
                        label="Customer Name"
                        placeholder="Walk-in Customer"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <Input
                        label="Notes (Optional)"
                        placeholder="Special requests"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />

                      <Button
                        onClick={handleCheckout}
                        disabled={isProcessing || cart.length === 0}
                        fullWidth
                        size="lg"
                        isLoading={isProcessing}
                        className="mt-2"
                      >
                        {isProcessing ? 'Processing...' : `Complete Order - ${formatPrice(subtotal)}`}
                      </Button>

                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => { setCart([]); setCustomerName(''); setNotes(''); }}
                        leftIcon={<X className="w-4 h-4" />}
                      >
                        Clear Order
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            </aside>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showReceipt && lastOrder && (
          <Modal
            isOpen
            onClose={() => setShowReceipt(false)}
            title="Order Receipt"
            size="md"
          >
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-mono text-xl font-bold text-amber-600">#{lastOrder.trackingId}</p>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-medium">{lastOrder.customerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment</span>
                  <Badge variant={paymentMethod === 'online' ? 'success' : 'warning'}>
                    {paymentMethod === 'online' ? 'Paid Online' : 'Pay at Counter'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" fullWidth onClick={() => setShowReceipt(false)}>
                  Done
                </Button>
                <Button fullWidth onClick={() => window.print()}>
                  Print
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      </AdminLayout>
    </div>
  );
}