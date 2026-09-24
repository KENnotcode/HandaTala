'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, CreditCard, Wallet, ArrowLeft, X } from 'lucide-react';
import { AdminSidebar } from '@/components/admin';
import { FoodCard } from '@/components/menu';
import { Button, Badge, Card, Input, Modal } from '@/components/ui';
import { orderService } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { mockMenuItems } from '@/data/mockMenu';
import { useInventoryStore } from '@/store/inventoryStore';
import { formatPrice } from '@/utils/format';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

export default function AdminPOSPage() {
  const { isAdmin, checkAuth, user } = useAuthStore();
  const { isAvailable, getStock } = useInventoryStore();
  const [cart, setCart] = useState<Array<{ menuItemId: string; name: string; quantity: number; unitPrice: number; subtotal: number }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  const categories = ['all', 'rice-meals', 'meals', 'snacks', 'drinks', 'desserts'];

  useEffect(() => {
    checkAuth();
    if (!isAdmin) {
      window.location.href = '/admin/login';
      return;
    }
  }, [checkAuth, isAdmin]);

  const availableItems = useMemo(() => {
    return mockMenuItems.filter(item => isAvailable(item.id));
  }, [isAvailable]);

  const filteredItems = useMemo(() => {
    return availableItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category.toLowerCase().replace(' ', '-') === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [availableItems, searchQuery, activeCategory]);

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: any) => {
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

      if (newOrder) {
        if (paymentMethod === 'online') {
          await paymentService.initializeCheckout(newOrder);
          // Simulate payment
          setTimeout(async () => {
            await paymentService.simulatePaymentCallback(newOrder.id, true);
            setLastOrder(newOrder);
            setShowReceipt(true);
            setCart([]);
            setCustomerName('');
            setNotes('');
            setIsProcessing(false);
            toast.success('Order completed!');
          }, 1000);
        } else {
          setLastOrder(newOrder);
          setShowReceipt(true);
          setCart([]);
          setCustomerName('');
          setNotes('');
          setIsProcessing(false);
          toast.success('Order created! Pay at counter.');
        }
      }
    } catch {
      toast.error('Failed to process order');
      setIsProcessing(false);
    }
  };

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

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search menu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                          activeCategory === cat
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        )}
                      >
                        {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
                  {filteredItems.map((item, index) => (
                    <FoodCard
                      key={item.id}
                      item={item}
                      onAdd={() => addToCart(item)}
                      style={{ transitionDelay: `${index * 30}ms` }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="sticky top-24 flex flex-col h-[calc(100vh-8rem)]">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Order</h2>
                    <Badge variant="secondary">{itemCount} items</Badge>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
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
                            <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                              <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30" />
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
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
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
            </div>
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
    </div>
  );
}

import { AnimatePresence } from 'framer-motion';
import { Search, CheckCircle } from 'lucide-react';
import Link from 'next/link';