'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Trash2, ShoppingBag } from 'lucide-react';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { CartDrawer, CartButton } from '@/components/cart';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';

export default function CartPage() {
  const { items, clearCart, getItemCount, getSubtotal, getTotal, updateQuantity, removeItem, updateNotes } = useCartStore();
  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const total = getTotal();

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <CartButton />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <EmptyState
            icon={<ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600" />}
            title="Your cart is empty"
            description="Looks like you haven't added any items yet. Browse our menu and find something delicious!"
            action={{
              label: 'Browse Menu',
              onClick: () => window.location.href = '/menu',
              variant: 'primary'
            }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CartButton />
      <CartDrawer />

      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/menu" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Menu</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </span>
              <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Cart</h1>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <motion.div
                    key={item.menuItemId}
                    layout
                    className="p-4 flex gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
                        <span className="text-2xl">🍽️</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{item.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatPrice(item.unitPrice)} each
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.menuItemId)}
                          aria-label={`Remove ${item.name}`}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-1.5 text-gray-600 dark:text-gray-400"
                            aria-label="Decrease quantity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </Button>
                          <span className="px-4 py-2 text-base font-medium w-12 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="p-1.5 text-gray-600 dark:text-gray-400"
                            aria-label="Increase quantity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </Button>
                        </div>
                        
                        <div className="flex-1 text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateNotes(item.menuItemId, e.target.value)}
                          placeholder="Special instructions (e.g., less spicy, no onions)"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={clearCart}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Clear Cart
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal ({itemCount} items)</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Service Fee</span>
                  <span className="font-medium text-gray-900 dark:text-white">₱0.00</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-amber-600 dark:text-amber-400">{formatPrice(total)}</span>
                </div>
              </div>
              
              <Link href="/checkout">
                <Button size="lg" fullWidth className="mb-3">
                  Proceed to Checkout
                </Button>
              </Link>
              
              <Button variant="outline" fullWidth onClick={() => window.location.href = '/menu'}>
                Continue Shopping
              </Button>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No minimum order</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Pay at counter or online</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Track your order in real-time</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}