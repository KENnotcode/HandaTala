import { OrderStatus as OrderStatusType } from '@/types';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Loader2, Truck, Package } from 'lucide-react';
import { cn } from '@/utils/cn';

interface OrderStatusProps {
  status: OrderStatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const statusConfig: Record<OrderStatusType, { label: string; color: string; icon: React.ReactNode }> = {
  'Pending Payment': {
    label: 'Pending Payment',
    color: 'amber',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  Preparing: {
    label: 'Preparing',
    color: 'blue',
    icon: <Package className="w-4 h-4" />,
  },
  'Ready for Pickup': {
    label: 'Ready for Pickup',
    color: 'green',
    icon: <Truck className="w-4 h-4" />,
  },
  Completed: {
    label: 'Completed',
    color: 'emerald',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  Cancelled: {
    label: 'Cancelled',
    color: 'red',
    icon: <Circle className="w-4 h-4" />,
  },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-1 gap-1',
  md: 'text-sm px-3 py-1.5 gap-2',
  lg: 'text-base px-4 py-2 gap-2.5',
};

export function OrderStatus({ status, size = 'md', showLabel = true, animated = true }: OrderStatusProps) {
  const config = statusConfig[status];
  const isActive = status !== 'Cancelled' && status !== 'Completed';

  return (
    <motion.span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        `bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/30 dark:text-${config.color}-400`,
        sizeStyles[size]
      )}
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
    >
      <motion.span
        animate={isActive && animated ? { scale: [1, 1.2, 1] } : undefined}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {config.icon}
      </motion.span>
      {showLabel && <span>{config.label}</span>}
    </motion.span>
  );
}

interface OrderTimelineProps {
  currentStatus: OrderStatusType;
  className?: string;
}

const statusOrder: OrderStatusType[] = ['Preparing', 'Ready for Pickup', 'Completed'];

export function OrderTimeline({ currentStatus, className }: OrderTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isCompleted = currentStatus === 'Completed';
  const isCancelled = currentStatus === 'Cancelled';

  if (isCancelled) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex-1" />
        <OrderStatus status="Cancelled" size="md" />
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className={cn('relative flex items-start', className)}>
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      <div className="flex flex-col gap-6 relative z-10">
        {statusOrder.map((status, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === statusOrder.length - 1;

          return (
            <motion.div
              key={status}
              className="flex items-start gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex flex-col items-center relative">
                <motion.div
                  className={cn(
                    'w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-300',
                    isActive
                      ? `bg-${statusConfig[status].color}-600 border-${statusConfig[status].color}-600`
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  )}
                  animate={isCurrent && !isCompleted ? { scale: [1, 1.1, 1] } : undefined}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {isActive && (
                    <CheckCircle className="w-5 h-5 text-white" />
                  )}
                </motion.div>
                {!isLast && (
                  <motion.div
                    className="w-0.5 flex-1"
                    style={{ backgroundColor: index < currentIndex ? `var(--color-${statusConfig[status].color}-600)` : 'transparent' }}
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <motion.p
                  className={cn(
                    'font-medium transition-colors duration-300',
                    isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {statusConfig[status].label}
                </motion.p>
                {isCurrent && !isCompleted && (
                  <motion.p
                    className="text-sm text-amber-600 dark:text-amber-400 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Current status
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}