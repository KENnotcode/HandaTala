import { Order, OrderStatus, PaymentStatus } from '@/types';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui';
import { cn } from '@/utils/cn';
import { QueueOrderCard } from './QueueOrderCard';

interface QueueColumnProps {
  title: string;
  status: OrderStatus;
  orders: Order[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  isAdmin: boolean;
  onPaymentStatusChange: (orderId: string, status: PaymentStatus) => Promise<void>;
  icon: React.ReactNode;
  color: 'purple' | 'blue' | 'amber' | 'green' | 'red';
  emptyMessage?: string;
}

export function QueueColumn({ 
  title, 
  status, 
  orders, 
  onStatusChange, 
  isAdmin,
  onPaymentStatusChange,
  icon, 
  color,
  emptyMessage 
}: QueueColumnProps) {
  const colorStyles = {
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const textColors = {
    purple: 'text-purple-600 dark:text-purple-400',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <motion.div
      className="flex h-full min-h-0 w-[min(85vw,360px)] shrink-0 flex-col 2xl:w-auto 2xl:min-w-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={cn('shrink-0 p-4 rounded-t-xl border-b', colorStyles[color], 'border')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', colorStyles[color], textColors[color])}>
              {icon}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn(textColors[color], 'font-mono')}>
            {orders.length}
          </Badge>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3 space-y-3">
        {orders.length > 0 ? (
          orders.map((order) => (
            <QueueOrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              isAdmin={isAdmin}
              onPaymentStatusChange={onPaymentStatusChange}
              isActive={status !== 'Completed' && status !== 'Cancelled'}
            />
          ))
        ) : (
          <motion.div
            className="flex flex-col items-center justify-center h-full min-h-50 text-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mb-4', colorStyles[color], textColors[color])}>
              {icon}
            </div>
            <p className="text-gray-500 dark:text-gray-400">{emptyMessage || `No orders ${title.toLowerCase()}`}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}