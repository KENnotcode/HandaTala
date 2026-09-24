import { Button } from '@/components/ui';
import { formatPrice } from '@/utils/format';

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout: () => void;
  isEmpty?: boolean;
}

export function CartSummary({ subtotal, itemCount, onCheckout, isEmpty = false }: CartSummaryProps) {
  if (isEmpty) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
          Your cart is empty
        </p>
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 mb-4">
          Browse today's menu and add something you like.
        </p>
        <Button variant="outline" fullWidth onClick={onCheckout}>
          Browse Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Subtotal ({itemCount} items)</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Service Fee</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">₱0.00</span>
      </div>
      <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-gray-900 dark:text-gray-100">Total</span>
        <span className="text-amber-600 dark:text-amber-400">{formatPrice(subtotal)}</span>
      </div>
      <Button onClick={onCheckout} fullWidth size="lg" className="mt-2">
        Proceed to Checkout
      </Button>
    </div>
  );
}