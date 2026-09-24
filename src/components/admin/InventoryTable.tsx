import { InventoryItem } from '@/types';
import { motion } from 'framer-motion';
import { Plus, Minus, Edit, Trash2, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { Button, Badge, Input, Modal } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useInventoryStore } from '@/store/inventoryStore';
import { formatPrice } from '@/utils/format';
import { useState } from 'react';

interface InventoryTableProps {
  items: InventoryItem[];
  menuItemsMap: Map<string, { name: string; category: string; price: number; image: string }>;
  onUpdateStock: (menuItemId: string, quantity: number) => void;
  onSetAvailability: (menuItemId: string, isAvailable: boolean) => void;
  onEdit: (item: InventoryItem, menuItem: { name: string; category: string; price: number }) => void;
  onDelete: (menuItemId: string) => void;
}

export function InventoryTable({
  items,
  menuItemsMap,
  onUpdateStock,
  onSetAvailability,
  onEdit,
  onDelete,
}: InventoryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const handleSaveStock = (menuItemId: string) => {
    onUpdateStock(menuItemId, editStock);
    setEditingId(null);
  };

  const handleAdjustStock = (menuItemId: string, adjustment: number) => {
    const item = items.find(i => i.menuItemId === menuItemId);
    if (item) {
      const newStock = Math.max(0, item.stock + adjustment);
      onUpdateStock(menuItemId, newStock);
    }
  };

  const menuItem = items[0];
  const menuInfo = menuItemsMap.get(menuItem?.menuItemId || '');

  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Food Item</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Price</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Stock</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Availability</th>
            <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item, index) => {
            const menuInfo = menuItemsMap.get(item.menuItemId);
            const isLowStock = item.stock > 0 && item.stock <= item.lowStockThreshold;
            const isSoldOut = item.stock === 0 || !item.isAvailable;

            return (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn('hover:bg-gray-50 dark:hover:bg-gray-800/50', editingId === item.menuItemId && 'bg-amber-50 dark:bg-amber-900/10')}
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                      <img
                        src={menuInfo?.image || '/images/placeholder.jpg'}
                        alt={menuInfo?.name || 'Food'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {menuInfo?.name || 'Unknown Item'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        ID: {item.menuItemId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant="outline" size="sm">
                    {menuInfo?.category || 'Uncategorized'}
                  </Badge>
                </td>
                <td className="p-3 font-medium text-gray-900 dark:text-white">
                  {formatPrice(menuInfo?.price || 0)}
                </td>
                <td className="p-3">
                  {editingId === item.menuItemId ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                        min={0}
                        max={999}
                        className="w-24"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveStock(item.menuItemId)}
                        onBlur={() => handleSaveStock(item.menuItemId)}
                        autoFocus
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleSaveStock(item.menuItemId)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={cn('font-mono text-lg', isLowStock ? 'text-amber-600' : isSoldOut ? 'text-red-600' : 'text-green-600')}>
                        {item.stock}
                      </span>
                      {isLowStock && (
                        <Badge variant="warning" size="sm">Low</Badge>
                      )}
                      {isSoldOut && (
                        <Badge variant="danger" size="sm">Out</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditStock(item.stock);
                          setEditingId(item.menuItemId);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Edit stock"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <Button
                    variant={item.isAvailable ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => onSetAvailability(item.menuItemId, !item.isAvailable)}
                    className="gap-1"
                  >
                    {item.isAvailable ? (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Available</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Hidden</span>
                      </>
                    )}
                  </Button>
                </td>
                <td className="p-3">
                  {isSoldOut ? (
                    <Badge variant="danger" dot>Sold Out</Badge>
                  ) : isLowStock ? (
                    <Badge variant="warning" dot>Low Stock</Badge>
                  ) : (
                    <Badge variant="success" dot>In Stock</Badge>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item, menuInfo!)}
                      className="text-gray-400 hover:text-blue-600"
                      aria-label="Edit item"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteModal(item.menuItemId)}
                      className="text-gray-400 hover:text-red-600"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No inventory items found.</p>
        </div>
      )}

      <AnimatePresence>
        {showDeleteModal && (
          <Modal
            isOpen
            onClose={() => setShowDeleteModal(null)}
            title="Delete Item"
            description="Are you sure you want to delete this item? This action cannot be undone."
          >
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => {
                onDelete(showDeleteModal!);
                setShowDeleteModal(null);
              }}>
                Delete
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Need to import Check, X
import { Check, X } from 'lucide-react';