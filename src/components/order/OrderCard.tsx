import { Order } from '@/types';
import { motion } from 'framer-motion';
import { formatPrice, formatDate } from '@/utils/format';
import { Card } from '@/components/ui';
import { OrderStatus } from './OrderStatus';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  variant?: 'default' | 'compact';
  showCustomer?: boolean;
}

export function OrderCard({ order, onClick, variant = 'default', showCustomer = false }: OrderCardProps) {
  const isInteractive = !!onClick;

  if (variant === 'compact') {
    return (
      <motion.div
        layout
        className={cn(
          'p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
          isInteractive && 'cursor-pointer hover:border-amber-300 dark:hover:border-amber-600 transition-colors'
        )}
        onClick={onClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-amber-600 dark:text-amber-400">
                #{order.trackingId}
              </span>
              <OrderStatus status={order.orderStatus} size="sm" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(order.total)}
            </p>
            <p className="text-xs text-gray-400">
              {formatDate(order.createdAt, 'short')}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className={cn('overflow-hidden', isInteractive && 'cursor-pointer hover:shadow-md transition-shadow')}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
                #{order.trackingId}
              </span>
              <OrderStatus status={order.orderStatus} size="md" />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{formatDate(order.createdAt, 'full')}</span>
              {showCustomer && order.customerName !== 'Guest Customer' && (
                <span>Customer: {order.customerName}</span>
              )}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          <ul className="space-y-2" role="list">
            {order.items.map((item, index) => (
              <li key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.name}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-gray-500 dark:text-gray-400">
                    x{item.quantity}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Payment</span>
            <span className="capitalize text-gray-900 dark:text-gray-100">
              {order.paymentMethod.replace('-', ' ')}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Need to import cn
import { cn } from '@/utils/cn';