'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock3,
  Eye,
  EyeOff,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Utensils,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AdminSidebar } from '@/components/admin';
import { Badge, Button, Card, Input, Modal } from '@/components/ui';
import { menuService } from '@/services/menuService';
import { useAuthStore } from '@/store/authStore';
import { MenuItem } from '@/types';
import { formatPrice } from '@/utils/format';

interface MenuFormState {
  name: string;
  description: string;
  category: string;
  price: string;
  costPrice: string;
  image: string;
  stock: string;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: string;
}

const createEmptyForm = (): MenuFormState => ({
  name: '',
  description: '',
  category: '',
  price: '',
  costPrice: '',
  image: '',
  stock: '0',
  isAvailable: true,
  isFeatured: false,
  preparationTime: '10',
});

function createForm(item: MenuItem): MenuFormState {
  return {
    name: item.name,
    description: item.description,
    category: item.category,
    price: String(item.price),
    costPrice: String(item.costPrice),
    image: item.image,
    stock: String(item.stock),
    isAvailable: item.isAvailable,
    isFeatured: item.isFeatured,
    preparationTime: String(item.preparationTime),
  };
}

export default function AdminMenuPage() {
  const { isAdmin, isLoading: authLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuFormState>(createEmptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const result = await menuService.getMenuItems();
    if (result.success && result.data) {
      setItems(result.data);
    } else {
      const message = result.error?.message || 'Could not load menu items.';
      setLoadError(message);
      toast.error(message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/login');
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void loadItems();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [authLoading, isAdmin, loadItems, router]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const featuredItemCount = useMemo(
    () => items.filter((item) => item.isFeatured).length,
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !query
        || item.name.toLowerCase().includes(query)
        || item.description.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, items, search]);

  const openNewItem = () => {
    setEditingItem(null);
    setForm(createEmptyForm());
    setIsEditorOpen(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setForm(createForm(item));
    setIsEditorOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(form.price);
    const costPrice = Number(form.costPrice);
    const stock = Number(form.stock);
    const preparationTime = Number(form.preparationTime);

    if (
      !Number.isFinite(price)
      || !Number.isFinite(costPrice)
      || !Number.isInteger(stock)
      || !Number.isInteger(preparationTime)
      || price < 0
      || costPrice < 0
      || stock < 0
      || preparationTime < 0
    ) {
      toast.error('Enter valid non-negative prices, stock, and preparation time.');
      return;
    }

    const menuItem = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price,
      costPrice,
      image: form.image.trim() || '/images/Drinks and Desserts/DDGrahamFloat.jpg',
      stock,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      preparationTime,
    };

    if (
      menuItem.isFeatured
      && !editingItem?.isFeatured
      && featuredItemCount >= 4
    ) {
      toast.error('You can only display 4 featured items.');
      return;
    }

    setIsSaving(true);
    try {
      const result = editingItem
        ? await menuService.updateMenuItem(editingItem.id, menuItem)
        : await menuService.addMenuItem(menuItem);

      if (!result.success || !result.data) {
        toast.error(result.error?.message || 'Could not save this menu item.');
        return;
      }

      const savedItem = result.data;
      if (editingItem) {
        setItems((current) => current.map((item) => item.id === savedItem.id ? savedItem : item));
        toast.success('Menu item updated.');
      } else {
        setItems((current) => [savedItem, ...current]);
        toast.success('Menu item added.');
      }
      setIsEditorOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvailabilityChange = async (item: MenuItem) => {
    const result = await menuService.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
    if (!result.success || !result.data) {
      toast.error(result.error?.message || 'Could not update item availability.');
      return;
    }
    const updatedItem = result.data;
    setItems((current) => current.map((currentItem) => currentItem.id === item.id ? updatedItem : currentItem));
    toast.success(updatedItem.isAvailable ? 'Item is now available.' : 'Item is now unavailable.');
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const result = await menuService.deleteMenuItem(itemToDelete.id);
    if (!result.success || !result.data) {
      toast.error(result.error?.message || 'Could not delete this menu item.');
      setIsDeleting(false);
      return;
    }
    setItems((current) => current.filter((item) => item.id !== itemToDelete.id));
    setItemToDelete(null);
    setIsDeleting(false);
    toast.success('Menu item deleted.');
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="animate-pulse text-gray-500 dark:text-gray-400">Loading menu management...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />
      <div className="min-h-screen min-w-0 flex flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto flex min-h-20 max-w-7xl flex-col justify-center gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add and update the items customers see on the menu.
              </p>
            </div>
            <Button onClick={openNewItem} leftIcon={<Plus className="h-4 w-4" />}>
              Add menu item
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Total items', value: items.length, icon: Utensils },
              { label: 'Available', value: items.filter((item) => item.isAvailable && item.stock > 0).length, icon: Eye },
              { label: 'Featured', value: `${featuredItemCount}/4`, icon: Star },
              { label: 'Categories', value: categories.length, icon: Package },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mb-5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Input
                  label="Search menu"
                  placeholder="Search by item name or description..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-56">
                Category
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          {loadError && (
            <Card className="mb-5 border border-red-200 bg-red-50 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>{loadError}</p>
                <Button variant="outline" size="sm" onClick={() => void loadItems()}>Try again</Button>
              </div>
            </Card>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Menu items</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {isLoading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((number) => (
                <Card key={number} className="h-28 animate-pulse bg-gray-200 dark:bg-gray-800" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <Card className="py-12 text-center">
              <Utensils className="mx-auto mb-3 h-9 w-9 text-gray-400" aria-hidden="true" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {items.length === 0 ? 'Your menu is empty' : 'No matching items'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {items.length === 0
                  ? 'Add your first item to publish it to the customer menu.'
                  : 'Try a different search or category.'}
              </p>
              {items.length === 0 && (
                <Button className="mt-4" onClick={openNewItem} leftIcon={<Plus className="h-4 w-4" />}>
                  Add menu item
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.025, 0.2) }}
                >
                  <Card className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          <Utensils className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                            <Badge variant="outline" size="sm">{item.category}</Badge>
                            {item.isFeatured && <Badge variant="warning" size="sm">Featured</Badge>}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                            {item.description || 'No description'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm lg:w-72">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(item.price)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Stock</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.stock}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Prep time</p>
                          <p className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                            <Clock3 className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                            {item.preparationTime} min
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700 lg:border-0 lg:pt-0">
                        <div className="ml-auto flex items-center gap-1">
                          <Button
                            variant={item.isAvailable ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => void handleAvailabilityChange(item)}
                            aria-label={item.isAvailable ? `Mark ${item.name} unavailable` : `Mark ${item.name} available`}
                            aria-pressed={item.isAvailable}
                            className="w-28 justify-center"
                          >
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleAvailabilityChange(item)}
                            aria-label={item.isAvailable ? `Hide ${item.name}` : `Show ${item.name}`}
                            title={item.isAvailable ? 'Hide item' : 'Show item'}
                          >
                            {item.isAvailable
                              ? <EyeOff className="h-4 w-4" />
                              : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditItem(item)}
                            aria-label={`Edit ${item.name}`}
                            title="Edit item"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setItemToDelete(item)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                            aria-label={`Delete ${item.name}`}
                            title="Delete item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingItem ? 'Edit menu item' : 'Add menu item'}
        description="Changes are saved to the menu customers browse."
        size="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Item name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              maxLength={100}
              autoFocus
            />
            <div>
              <Input
                label="Category"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                required
                maxLength={60}
                list="menu-category-options"
                placeholder="e.g. Main Meals"
              />
              <datalist id="menu-category-options">
                {categories.map((category) => <option key={category} value={category} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label htmlFor="menu-description" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="menu-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Input
              label="Price (₱)"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              required
            />
            <Input
              label="Cost price (₱)"
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(event) => setForm((current) => ({ ...current, costPrice: event.target.value }))}
              required
            />
            <Input
              label="Stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
              required
            />
            <Input
              label="Prep time (min)"
              type="number"
              min="0"
              step="1"
              value={form.preparationTime}
              onChange={(event) => setForm((current) => ({ ...current, preparationTime: event.target.value }))}
              required
            />
          </div>

          <Input
            label="Image URL or public path"
            value={form.image}
            onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            placeholder="/images/Main Meals/your-image.jpg"
            maxLength={500}
            helperText="Use an app public path or an image URL."
          />

          <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) => setForm((current) => ({ ...current, isAvailable: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              Available to order
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => {
                  if (
                    event.target.checked
                    && !form.isFeatured
                    && !editingItem?.isFeatured
                    && featuredItemCount >= 4
                  ) {
                    toast.error('You can only display 4 featured items.');
                    return;
                  }
                  setForm((current) => ({ ...current, isFeatured: event.target.checked }));
                }}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              Feature on home page
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingItem ? 'Save changes' : 'Add item'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        title="Delete menu item?"
        description={`${itemToDelete?.name || 'This item'} will be removed from the customer menu.`}
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setItemToDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void handleDelete()} isLoading={isDeleting}>
            Delete item
          </Button>
        </div>
      </Modal>
    </div>
  );
}
