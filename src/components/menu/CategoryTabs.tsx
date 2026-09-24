import { Category } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onChange: (category: string) => void;
  className?: string;
}

export function CategoryTabs({ categories, activeCategory, onChange, className }: CategoryTabsProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2 scrollbar-hide', className)}>
      {categories.map((category) => (
        <motion.button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
            activeCategory === category.id
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
          whileTap={{ scale: 0.95 }}
          aria-pressed={activeCategory === category.id}
        >
          {category.displayName}
        </motion.button>
      ))}
    </div>
  );
}