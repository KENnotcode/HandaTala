'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, Grid, List } from 'lucide-react';
import { Button, Badge, Input, Card } from '@/components/ui';
import { CategoryTabs, SearchBar, MenuGrid, FoodCard } from '@/components/menu';
import { CartButton } from '@/components/cart';
import { mockMenuItems, categories } from '@/data/mockMenu';
import { useInventoryStore } from '@/store/inventoryStore';
import { cn } from '@/utils/cn';

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { isAvailable, getStock, isLowStock } = useInventoryStore();

  const filteredItems = useMemo(() => {
    return mockMenuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category.toLowerCase().replace(' ', '-') === activeCategory;
      const isAvail = isAvailable(item.id);
      return matchesSearch && matchesCategory && isAvail;
    });
  }, [searchQuery, activeCategory, isAvailable]);

  const availableCategories = useMemo(() => {
    const cats = new Set(mockMenuItems.filter(isAvailable).map(item => item.category));
    return Array.from(cats);
  }, [isAvailable]);

  const displayCategories = useMemo(() => {
    return categories.filter(c => c.id === 'all' || availableCategories.includes(c.displayName));
  }, [availableCategories]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CartButton />
      
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900 dark:text-white">HandaTala</span>
              </Link>
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                <span className="font-mono text-amber-600">{filteredItems.length}</span> items
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="w-4 h-4" />}>
                Filters
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4 border-b border-gray-200 dark:border-gray-700"
            >
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Available only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Popular</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Price:</span>
                    <select className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm">
                      <option value="">Any</option>
                      <option value="0-50">₱0 - ₱50</option>
                      <option value="50-100">₱50 - ₱100</option>
                      <option value="100+">₱100+</option>
                    </select>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search food..." />
        </div>

        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <CategoryTabs
            categories={displayCategories}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <Card className="sticky top-24 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
              <nav className="space-y-1" aria-label="Category filter">
                {displayCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      activeCategory === category.id
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {category.displayName}
                  </button>
                ))}
              </nav>
            </Card>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Utensils className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No meals found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Try another search or category.
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>
                  Clear Filters
                </Button>
              </motion.div>
            ) : (
              viewMode === 'grid' ? (
                <MenuGrid items={filteredItems} />
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <FoodCard item={item} />
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
import { Utensils } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';