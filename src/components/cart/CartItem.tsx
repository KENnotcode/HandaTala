import { CartItem as CartItemType } from '@/types';
import { motion, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { formatPrice } from '@/utils/format';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onNotesChange: (id: string, notes: string) => void;
}

export function CartItem({ item, onQuantityChange, onRemove, onNotesChange }: CartItemProps) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <motion.div
      layout
      className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
          <span className="text-2xl">🍽️</span>
        </div>
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</h4>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {formatPrice(item.unitPrice)} each
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.menuItemId)}
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
              onClick={() => onQuantityChange(item.menuItemId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-1.5 text-gray-600 dark:text-gray-400"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1.5 text-base font-medium w-10 text-center">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onQuantityChange(item.menuItemId, item.quantity + 1)}
              className="p-1.5 text-gray-600 dark:text-gray-400"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 text-right">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatPrice(item.subtotal)}
            </p>
          </div>
        </div>
        
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1"
          >
            {item.notes ? 'Edit note' : 'Add note'}
          </Button>
          
          {showNotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <input
                type="text"
                value={item.notes || ''}
                onChange={(e) => onNotesChange(item.menuItemId, e.target.value)}
                placeholder="Special instructions (e.g., less spicy, no onions)"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}