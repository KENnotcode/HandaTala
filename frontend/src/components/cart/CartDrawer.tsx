'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShoppingBag, Lock, LogIn } from 'lucide-react';
import { Drawer, Modal, Button } from '@/components/ui';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/utils/format';
import { useRouter } from 'next/navigation';

export function CartDrawer() {
  const { items, isOpen, closeCart, getItemCount, getSubtotal, updateQuantity, removeItem, updateNotes } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleProceedToCheckout = () => {
    closeCart();
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    } else {
      router.push('/checkout');
    }
  };

  return (
    <>
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
                  Browse today&apos;s menu and add something you like.
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
                  onCheckout={handleProceedToCheckout}
                />
              </>
            )}
          </div>
        </Drawer>
      </AnimatePresence>

      <Modal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Sign In Required"
        description="Please log in to your account before placing your order, or you can choose to login later."
        size="md"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-center py-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-700 dark:text-amber-300">
            <Lock className="w-8 h-8 mr-2" />
            <span className="font-semibold text-lg">Account Login Recommended</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setShowLoginPrompt(false);
                router.push('/login');
              }}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Log In Now
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowLoginPrompt(false);
                router.push('/checkout');
              }}
            >
              Log In Later (Proceed)
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function CartButton() {
  const { openCart, getItemCount, getSubtotal } = useCartStore();
  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  return (
    <button
      type="button"
      onClick={openCart}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-amber-600 text-white px-4 py-3 rounded-full shadow-xl hover:bg-amber-700 transition-all cursor-pointer"
      style={{ pointerEvents: 'auto' }}
      aria-label={`Open cart with ${itemCount} items, total ${formatPrice(subtotal)}`}
      aria-haspopup="dialog"
    >
      <ShoppingBag className="w-5 h-5 pointer-events-none" />
      <span className="font-medium hidden sm:inline pointer-events-none">{itemCount} items</span>
      <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-bold pointer-events-none">
        {formatPrice(subtotal)}
      </span>
      <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold pointer-events-none">
        {itemCount > 9 ? '9+' : itemCount}
      </span>
    </button>
  );
}
