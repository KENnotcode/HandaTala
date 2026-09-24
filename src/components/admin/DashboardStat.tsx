import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { cn } from '@/utils/cn';

interface DashboardStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'amber' | 'blue' | 'green' | 'red' | 'purple';
  className?: string;
}

export function DashboardStat({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'amber',
  className 
}: DashboardStatProps) {
  const colorStyles = {
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <motion.div
      className={cn('p-5', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-5 h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <p className="text-sm mt-1 flex items-center gap-1">
                <span className={cn('font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                <span className="text-gray-500 dark:text-gray-400">{trend.label}</span>
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', colorStyles[color])}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}