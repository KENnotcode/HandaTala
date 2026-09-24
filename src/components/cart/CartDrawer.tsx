'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import { Drawer } from '@/components/ui';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';

export function CartDrawer() {
  const { items, isOpen, closeCart, getItemCount, getSubtotal, updateQuantity, removeItem, updateNotes, clearCart } = useCartStore();
  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  return (
    <AnimatePresence>
      <Drawer
        isOpen={isOpen}
        onClose={closeCart}
        title="Your Cart"
        position="right"
        size="lg"
        showCloseButton
      >
        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                Browse today's menu and add something you like.
              </p>
              <button
                onClick={closeCart}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Continue browsing
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2">
                <ul className="space-y-2" role="list" aria-label="Cart items">
                  {items.map((item) => (
                    <CartItem
                      key={item.menuItemId}
                      item={item}
                      onQuantityChange={updateQuantity}
                      onRemove={removeItem}
                      onNotesChange={updateNotes}
                    />
                  ))}
                </ul>
              </div>
              <CartSummary
                subtotal={subtotal}
                itemCount={itemCount}
                onCheckout={() => {
                  closeCart();
                  window.location.href = '/checkout';
                }}
              />
            </>
          )}
        </div>
      </Drawer>
    </AnimatePresence>
  );
}

export function CartButton() {
  const { isOpen, openCart, getItemCount, getSubtotal } = useCartStore();
  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  if (itemCount === 0) return null;

  return (
    <motion.button
      onClick={openCart}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-amber-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-amber-700 transition-all duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Open cart with ${itemCount} items, total ${formatPrice(subtotal)}`}
    >
      <ShoppingBag className="w-5 h-5" />
      <span className="font-medium hidden sm:inline">{itemCount} items</span>
      <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-bold">
        {formatPrice(subtotal)}
      </span>
      <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
        {itemCount > 9 ? '9+' : itemCount}
      </span>
    </motion.button>
  );
}