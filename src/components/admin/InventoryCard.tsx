import { InventoryItem } from '@/types';
import { motion } from 'framer-motion';
import { Plus, Minus, Edit, Eye, EyeOff } from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

interface InventoryCardProps {
  item: InventoryItem;
  menuItem: { name: string; category: string; price: number; image: string };
  onUpdateStock: (menuItemId: string, quantity: number) => void;
  onSetAvailability: (menuItemId: string, isAvailable: boolean) => void;
  onEdit: () => void;
}

export function InventoryCard({ item, menuItem, onUpdateStock, onSetAvailability, onEdit }: InventoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editStock, setEditStock] = useState(item.stock);

  const isLowStock = item.stock > 0 && item.stock <= item.lowStockThreshold;
  const isSoldOut = item.stock === 0 || !item.isAvailable;

  const handleSave = () => {
    onUpdateStock(item.menuItemId, editStock);
    setIsEditing(false);
  };

  const handleAdjust = (delta: number) => {
    const newStock = Math.max(0, editStock + delta);
    setEditStock(newStock);
  };

  return (
    <motion.div
      layout
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={menuItem.image}
          alt={menuItem.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <Badge variant={isSoldOut ? 'danger' : isLowStock ? 'warning' : 'success'} dot>
            {isSoldOut ? 'Sold Out' : isLowStock ? 'Low Stock' : 'In Stock'}
          </Badge>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/90 dark:bg-gray-800/90"
              onClick={() => onSetAvailability(item.menuItemId, !item.isAvailable)}
              aria-label={item.isAvailable ? 'Hide item' : 'Show item'}
            >
              {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/90 dark:bg-gray-800/90"
              onClick={onEdit}
              aria-label="Edit item"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{menuItem.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{menuItem.category}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
            {formatPrice(menuItem.price)}
          </span>
          <Badge variant="outline" size="sm">
            Prep: ~{menuItem.preparationTime || 10} min
          </Badge>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAdjust(-1)}>
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                  min={0}
                  max={999}
                  className="w-20 text-center"
                />
                <Button variant="outline" size="sm" onClick={() => handleAdjust(1)}>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} className="ml-auto">
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn('font-mono text-2xl font-bold', isLowStock ? 'text-amber-600' : isSoldOut ? 'text-red-600' : 'text-green-600')}>
                  {item.stock}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">in stock</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setEditStock(item.stock); setIsEditing(true); }}>
                Adjust
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant={item.isAvailable ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onSetAvailability(item.menuItemId, !item.isAvailable)}
            fullWidth
            className="gap-1"
          >
            {item.isAvailable ? (
              <>
                <Eye className="w-4 h-4" />
                Available
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Hidden
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

import { useState } from 'react';