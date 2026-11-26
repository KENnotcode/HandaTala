import { Order, OrderStatus as OrderStatusType } from '@/types';
import { motion } from 'framer-motion';
import { ChefHat, Truck, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { OrderStatus } from '@/components/order';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

interface QueueOrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatusType) => void;
  isActive?: boolean;
}

type StatusConfig = {
  icon: typeof ChefHat | typeof Clock | typeof Truck | typeof CheckCircle | typeof XCircle;
  color: string;
  bgColor: string;
  borderColor: string;
  nextStatus?: 'Preparing' | 'Ready for Pickup' | 'Completed';
  nextLabel?: string;
  nextIcon?: typeof ChefHat | typeof Truck | typeof CheckCircle;
  badgeStyle: string;
  buttonStyle: string;
};

const statusConfig: Record<'Received' | 'Preparing' | 'Ready for Pickup' | 'Completed' | 'Cancelled', StatusConfig> = {
  Received: {
    icon: Clock,
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    nextStatus: 'Preparing',
    nextLabel: 'Start Preparing',
    nextIcon: ChefHat,
    badgeStyle: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    buttonStyle: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  Preparing: { 
    icon: ChefHat, 
    color: 'blue', 
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    nextStatus: 'Ready for Pickup',
    nextLabel: 'Mark Ready',
    nextIcon: Truck,
    badgeStyle: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    buttonStyle: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  'Ready for Pickup': { 
    icon: Truck, 
    color: 'amber', 
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    nextStatus: 'Completed',
    nextLabel: 'Mark Completed',
    nextIcon: CheckCircle,
    badgeStyle: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    buttonStyle: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  Completed: { 
    icon: CheckCircle, 
    color: 'green', 
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    badgeStyle: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    buttonStyle: 'bg-green-600 hover:bg-green-700 text-white',
  },
  Cancelled: { 
    icon: XCircle, 
    color: 'red', 
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    badgeStyle: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    buttonStyle: 'bg-red-600 hover:bg-red-700 text-white',
  },
};

export function QueueOrderCard({ order, onStatusChange, isActive = true }: QueueOrderCardProps) {
  const config = statusConfig[order.orderStatus as keyof typeof statusConfig] || statusConfig.Received;
  const Icon = config.icon;
  const timeAgo = getTimeAgo(order.createdAt);
  const isOverdue = getMinutesAgo(order.createdAt) > 30 && (order.orderStatus === 'Preparing' || order.orderStatus === 'Received');

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
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', config.badgeStyle)}>
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

      {config.nextStatus && config.nextIcon && config.nextLabel && (
        <div className="space-y-2">
          <Button
            onClick={() => onStatusChange(order.id, config.nextStatus!)}
            fullWidth
            size="lg"
            leftIcon={<config.nextIcon className="w-4 h-4" />}
            className={cn(config.buttonStyle, isActive ? '' : 'opacity-50 cursor-not-allowed')}
            disabled={!isActive}
          >
            {config.nextLabel}
          </Button>
          {isActive && (
            <Button
              onClick={() => {
                if (window.confirm(`Are you sure you want to cancel order #${order.trackingId}?`)) {
                  onStatusChange(order.id, 'Cancelled');
                }
              }}
              fullWidth
              size="sm"
              variant="ghost"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs py-1"
            >
              Cancel Order
            </Button>
          )}
        </div>
      )}

      {order.orderStatus === 'Completed' && (
        <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium">
          <CheckCircle className="w-4 h-4 inline mr-1" />
          Completed
        </div>
      )}

      {order.orderStatus === 'Cancelled' && (
        <div className="text-center text-sm text-red-600 dark:text-red-400 font-medium">
          <XCircle className="w-4 h-4 inline mr-1" />
          Cancelled
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