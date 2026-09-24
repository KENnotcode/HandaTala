import { Order } from '@/types';
import { motion } from 'framer-motion';
import { ChefHat, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import { OrderStatus } from '@/components/order';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

interface QueueOrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: 'Preparing' | 'Ready for Pickup' | 'Completed') => void;
  isActive?: boolean;
}

const statusConfig = {
  Preparing: { 
    icon: ChefHat, 
    color: 'blue', 
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    nextStatus: 'Ready for Pickup' as const,
    nextLabel: 'Mark Ready',
    nextIcon: Truck,
  },
  'Ready for Pickup': { 
    icon: Truck, 
    color: 'amber', 
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    nextStatus: 'Completed' as const,
    nextLabel: 'Mark Completed',
    nextIcon: CheckCircle,
  },
  Completed: { 
    icon: CheckCircle, 
    color: 'green', 
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
};

export function QueueOrderCard({ order, onStatusChange, isActive = true }: QueueOrderCardProps) {
  const config = statusConfig[order.orderStatus as keyof typeof statusConfig] || statusConfig.Preparing;
  const Icon = config.icon;
  const timeAgo = getTimeAgo(order.createdAt);
  const isOverdue = getMinutesAgo(order.createdAt) > 30 && order.orderStatus === 'Preparing';

  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl border p-4 transition-all duration-300',
        config.bgColor,
        config.borderColor,
        isActive ? 'shadow-sm' : 'opacity-50'
      )}
      initial={{ opacity: 0, y: 20, x: -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', `bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-600 dark:text-${config.color}-400`)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                #{order.trackingId}
              </span>
              <OrderStatus status={order.orderStatus} size="sm" />
              {isOverdue && (
                <Badge variant="danger" size="sm" className="animate-pulse">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(order.createdAt, 'time')}
          </span>
          <span className={cn('text-sm font-mono', isOverdue ? 'text-red-600' : 'text-gray-500')}>
            {timeAgo} ago
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">{item.quantity}x</span>
              <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
            </div>
            {item.notes && (
              <Badge variant="outline" size="sm" className="text-amber-600 dark:text-amber-400 border-amber-200">
                {item.notes}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
          <div className="flex items-center gap-1 text-sm text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4" />
            <strong>Note:</strong> {order.notes}
          </div>
        </div>
      )}

      {config.nextStatus && (
        <Button
          onClick={() => onStatusChange(order.id, config.nextStatus!)}
          fullWidth
          size="lg"
          leftIcon={<config.nextIcon className="w-4 h-4" />}
          className={cn(`bg-${config.color}-600 hover:bg-${config.color}-700`, isActive ? '' : 'opacity-50 cursor-not-allowed')}
          disabled={!isActive}
        >
          {config.nextLabel}
        </Button>
      )}

      {order.orderStatus === 'Completed' && (
        <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium">
          <CheckCircle className="w-4 h-4 inline mr-1" />
          Completed
        </div>
      )}
    </motion.div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

function getMinutesAgo(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / 60000);
}