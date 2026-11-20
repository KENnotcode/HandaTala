import { MenuItem } from '@/types';
import { motion } from 'framer-motion';
import { FoodCard } from './FoodCard';
import { Skeleton } from '@/components/ui';

interface MenuGridProps {
  items: MenuItem[];
  isLoading?: boolean;
  skeletonCount?: number;
}

export function MenuGrid({ items, isLoading = false, skeletonCount = 6 }: MenuGridProps) {
  if (isLoading) {
    return (
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <FoodCard key={`skeleton-${i}`} item={{} as MenuItem} isSkeleton />
        ))}
      </motion.div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        className="col-span-full flex flex-col items-center justify-center py-12 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Skeleton variant="circular" width={64} height={64} className="mb-4 text-gray-300" />
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No meals found. Try another search or category.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {items.map((item, index) => (
        <FoodCard key={item.id} item={item} style={{ transitionDelay: `${index * 50}ms` }} />
      ))}
    </motion.div>
  );
}