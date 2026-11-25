import { MenuItem } from '@/types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { Button, Badge, Card, Skeleton } from '@/components/ui';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';

interface FoodCardProps {
  item: MenuItem;
  isSkeleton?: boolean;
  onAdd?: () => void;
  style?: React.CSSProperties;
}

export function FoodCard({ item, isSkeleton = false, onAdd }: FoodCardProps) {
  const { addItem } = useCartStore();

  if (isSkeleton) {
    return (
      <Card className="overflow-hidden flex flex-col h-full" padding="none">
        <Skeleton variant="rectangular" className="aspect-video w-full" />
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="rectangular" className="h-10 w-full mt-auto" />
        </div>
      </Card>
    );
  }

  const stock = item.stock;
  const lowStock = stock > 0 && stock <= 10;
  const available = item.isAvailable && stock > 0;
  const handleAdd = () => {
    if (available) {
      addItem(item);
      onAdd?.();
    }
  };
  const isSoldOut = !available || stock === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden flex flex-col h-full relative" padding="none" hover>
        <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${isSoldOut ? 'grayscale' : ''}`}
          />
          {item.isFeatured && (
            <Badge variant="warning" className="absolute top-2 left-2" dot>
              Popular
            </Badge>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-t from-gray-900/75 via-gray-600/40 to-gray-300/10">
              <span className="rounded-full bg-red-600 px-4 py-2 text-lg font-bold ">
                {item.isAvailable ? 'Sold Out' : 'Unavailable'}
              </span>
            </div>
          )}
          {lowStock && !isSoldOut && (
            <Badge variant="warning" className="absolute top-2 right-2" dot>
              Only {stock} left
            </Badge>
          )}
        </div>
        
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 flex-1">
              {item.name}
            </h3>
            <span className="font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
              {formatPrice(item.price)}
            </span>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">
            {item.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {available ? (
                stock > 0 && stock <= 10 ? (
                  <Badge variant="warning" size="sm" dot>
                    {stock} left
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm" dot>
                    Available
                  </Badge>
                )
              ) : (
                <Badge variant="danger" size="sm" dot>
                  {item.isAvailable ? 'Sold Out' : 'Unavailable'}
                </Badge>
              )}
            </div>
            <span className="text-xs text-gray-400">
              ~{item.preparationTime} min
            </span>
          </div>
          
          <Button
            onClick={handleAdd}
            disabled={isSoldOut}
            fullWidth
            size="md"
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            className="mt-auto"
          >
            {isSoldOut ? (item.isAvailable ? 'Sold Out' : 'Unavailable') : 'Add to Cart'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}