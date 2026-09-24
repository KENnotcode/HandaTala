'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { AdminSidebar } from '@/components/admin';
import { InventoryTable } from '@/components/admin';
import { Button, Input, Badge, Card, Modal } from '@/components/ui';
import { inventoryService } from '@/services/inventoryService';
import { menuService } from '@/services/menuService';
import { formatPrice } from '@/utils/format';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import { InventoryItem } from '@/types';
import { MenuItem } from '@/types';

export default function AdminInventoryPage() {
  const { isAdmin, checkAuth } = useAuthStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'low' | 'out'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ inventory: InventoryItem; menu: MenuItem } | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: 'Rice Meals',
    price: 0,
    stock: 0,
    isAvailable: true,
    isFeatured: false,
    preparationTime: 10,
    image: '/images/placeholder.jpg',
  });

  useEffect(() => {
    checkAuth();
    if (!isAdmin) {
      window.location.href = '/admin/login';
      return;
    }
    fetchData();
  }, [checkAuth, isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invResult, menuResult] = await Promise.all([
        inventoryService.getInventory(),
        menuService.getMenuItems(),
      ]);
      if (invResult.success && invResult.data) setInventory(invResult.data);
      if (menuResult.success && menuResult.data) setMenuItems(menuResult.data);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const menuItemsMap = useMemo(() => {
    const map = new Map();
    menuItems.forEach(item => map.set(item.id, item));
    return map;
  }, [menuItems]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      const matchesSearch = menuItem?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.menuItemId.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (filterStatus === 'available') matchesFilter = item.isAvailable && item.stock > 0;
      if (filterStatus === 'low') matchesFilter = item.stock > 0 && item.stock <= item.lowStockThreshold;
      if (filterStatus === 'out') matchesFilter = item.stock === 0 || !item.isAvailable;
      
      return matchesSearch && matchesFilter;
    });
  }, [inventory, searchQuery, filterStatus, menuItemsMap]);

  const handleUpdateStock = async (menuItemId: string, quantity: number) => {
    try {
      const result = await inventoryService.updateStock(menuItemId, quantity);
      if (result.success) {
        setInventory(prev => prev.map(item => 
          item.menuItemId === menuItemId ? { ...item, stock: quantity, isAvailable: quantity > 0 && item.isAvailable } : item
        ));
        await menuService.updateMenuItem(menuItemId, { stock: quantity });
        toast.success('Stock updated');
      }
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const handleSetAvailability = async (menuItemId: string, isAvailable: boolean) => {
    try {
      const result = await inventoryService.setAvailability(menuItemId, isAvailable);
      if (result.success) {
        setInventory(prev => prev.map(item => 
          item.menuItemId === menuItemId ? { ...item, isAvailable } : item
        ));
        const menuItem = menuItemsMap.get(menuItemId);
        if (menuItem) await menuService.updateMenuItem(menuItemId, { isAvailable });
        toast.success(isAvailable ? 'Item is now available' : 'Item hidden');
      }
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const handleEdit = (invItem: InventoryItem, menuItem: MenuItem) => {
    setEditingItem({ inventory: invItem, menu: menuItem });
  };

  const handleDelete = async (menuItemId: string) => {
    try {
      const result = await inventoryService.updateStock(menuItemId, 0);
      await menuService.deleteMenuItem(menuItemId);
      setInventory(prev => prev.filter(item => item.menuItemId !== menuItemId));
      setMenuItems(prev => prev.filter(item => item.id !== menuItemId));
      toast.success('Item deleted');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await menuService.addMenuItem(newItem);
      if (result.success && result.data) {
        await inventoryService.updateStock(result.data.id, newItem.stock);
        toast.success('Item added successfully');
        setShowAddModal(false);
        setNewItem({ name: '', description: '', category: 'Rice Meals', price: 0, stock: 0, isAvailable: true, isFeatured: false, preparationTime: 10, image: '/images/placeholder.jpg' });
        fetchData();
      }
    } catch {
      toast.error('Failed to add item');
    }
  };

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage food items, stock levels, and availability</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
                <Button variant="outline" size="sm" leftIcon={<Upload className="w-4 h-4" />}>Import</Button>
                <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                  Add Item
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="all">All Items</option>
                      <option value="available">Available</option>
                      <option value="low">Low Stock</option>
                      <option value="out">Sold Out</option>
                    </select>
                    <Badge variant="outline" className="ml-2">
                      {filteredInventory.length} items
                    </Badge>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <InventoryTable
                  items={filteredInventory}
                  menuItemsMap={menuItemsMap}
                  onUpdateStock={handleUpdateStock}
                  onSetAvailability={handleSetAvailability}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            </>
          )}

          <AnimatePresence>
            {showAddModal && (
              <Modal
                isOpen
                onClose={() => setShowAddModal(false)}
                title="Add New Menu Item"
                size="lg"
              >
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      placeholder="e.g., Chicken Rice Meal"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      required
                    />
                    <Input
                      label="Category"
                      type="select"
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      required
                    >
                      <option value="Rice Meals">Rice Meals</option>
                      <option value="Meals">Meals</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Desserts">Desserts</option>
                    </Input>
                  </div>
                  <Input
                    label="Description"
                    placeholder="Brief description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Price (₱)"
                      type="number"
                      min="0"
                      step="0.5"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                      required
                    />
                    <Input
                      label="Initial Stock"
                      type="number"
                      min="0"
                      value={newItem.stock}
                      onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value)})}
                      required
                    />
                    <Input
                      label="Prep Time (min)"
                      type="number"
                      min="1"
                      value={newItem.preparationTime}
                      onChange={(e) => setNewItem({...newItem, preparationTime: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newItem.isAvailable}
                        onChange={(e) => setNewItem({...newItem, isAvailable: e.target.checked})}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm">Available</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newItem.isFeatured}
                        onChange={(e) => setNewItem({...newItem, isFeatured: e.target.checked})}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm">Featured</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Item</Button>
                  </div>
                </form>
              </Modal>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';