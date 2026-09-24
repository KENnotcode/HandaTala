import { Order, OrderStatus } from '@/types';
import { motion } from 'framer-motion';
import { ChefHat, Truck, CheckCircle, Clock } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { cn } from '@/utils/cn';
import { QueueOrderCard } from './QueueOrderCard';

interface QueueColumnProps {
  title: string;
  status: OrderStatus;
  orders: Order[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'green';
  emptyMessage?: string;
}

export function QueueColumn({ 
  title, 
  status, 
  orders, 
  onStatusChange, 
  icon, 
  color,
  emptyMessage 
}: QueueColumnProps) {
  const colorStyles = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  };

  const textColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
  };

  return (
    <motion.div
      className="flex-1 min-w-[300px] max-w-[400px] flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={cn('p-4 rounded-t-xl border-b', colorStyles[color], 'border')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', colorStyles[color])}>
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

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <QueueOrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              isActive={status !== 'Completed'}
              style={{ transitionDelay: `${index * 50}ms` }}
            />
          ))
        ) : (
          <motion.div
            className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mb-4', colorStyles[color])}>
              {icon}
            </div>
            <p className="text-gray-500 dark:text-gray-400">{emptyMessage || `No orders ${title.toLowerCase()}`}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}