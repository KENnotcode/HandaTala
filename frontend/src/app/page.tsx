'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Utensils, Clock, Truck, Shield, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import { FoodCard } from '@/components/menu';
import { CartButton } from '@/components/cart';
import { menuService } from '@/services/menuService';
import { useAuthStore } from '@/store/authStore';
import { MenuItem } from '@/types';
import { getErrorMessage } from '@/lib/apiError';
import { UserMenu } from '@/components/auth/UserMenu';

export default function LandingPage() {
  const { user, isAuthenticated, checkAuth, isLoading: authLoading } = useAuthStore();
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [featuredRes, popularRes] = await Promise.all([
          menuService.getFeaturedItems(),
          menuService.getPopularItems(),
        ]);

        if (featuredRes.success && featuredRes.data) {
          setFeaturedItems(featuredRes.data.filter((item) => item.isAvailable && item.stock > 0).slice(0, 4));
        }
        if (popularRes.success && popularRes.data) {
          setPopularItems(popularRes.data.filter((item) => item.isAvailable && item.stock > 0).slice(0, 6));
        }
        if (!featuredRes.success && !popularRes.success) {
          setError('Failed to load menu items');
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const features = [
    { icon: Utensils, title: 'Browse Menu', description: "View today's fresh offerings with real-time availability" },
    { icon: Clock, title: 'Order Ahead', description: 'Skip the line by pre-ordering from your phone' },
    { icon: Truck, title: 'Track Status', description: 'Real-time updates from kitchen to pickup' },
    { icon: Shield, title: 'Secure Payment', description: 'Pay online or at the counter' },
  ];



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CartButton />
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2" aria-label="HandaTala Home">
              <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">HandaTala</span>
            </Link>
            
            <div className="flex items-center gap-3">
              {!authLoading && isAuthenticated && user ? (
                <UserMenu />
              ) : !authLoading ? (
                <>
                  <Link
                    href="/login"
                    className="flex min-h-11 items-center px-3 text-sm font-medium text-gray-700 transition-colors hover:text-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:text-gray-200"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    className="flex min-h-11 items-center rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
                  >
                    Sign up
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        {error && (
          <div
            role="alert"
            className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8"
          >
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
        <section className="relative overflow-hidden bg-linear-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge variant="default" className="mb-4" dot>
                  <Sparkles className="w-3 h-3" />
                  Now serving: Daily Fresh Meals
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                  Order ahead.{' '}
                  <span className="text-amber-600 dark:text-amber-400">Skip the line.</span>{' '}
                  Enjoy your meal.
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl">
                  HandaTala is your canteen companion. Browse todays menu, place your order, and pick it up when ready. No more waiting in line!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/menu">
                    <Button size="lg" className="w-full sm:w-auto" leftIcon={<Utensils className="w-5 h-5" />}>
                      View Todays Menu
                    </Button>
                  </Link>
                  <Link href="/orders">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Track My Order
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 bg-linear-to-br from-amber-200 to-amber-400 rounded-3xl opacity-20 blur-2xl" />
                  <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="space-y-4">
                      {isLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                          >
                            <Skeleton variant="rectangular" width={64} height={64} />
                            <div className="flex-1 space-y-2">
                              <Skeleton width="60%" />
                              <Skeleton width="85%" />
                            </div>
                          </div>
                        ))
                      ) : featuredItems.slice(0, 3).map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                        >
                          <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                            <div className="w-full h-full bg-linear-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                          </div>
                          <span className="font-bold text-amber-600 dark:text-amber-400">₱{item.price}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge variant="default" className="mb-4" dot>
                How It Works
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Simple ordering in 3 steps
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                From browsing to pickup, weve made the process seamless
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full text-center p-6 hover:shadow-lg transition-shadow">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <feature.icon className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Badge variant="default" className="mb-4" dot>
                  Todays Specials
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  Featured Today
                </h2>
              </motion.div>
              <Link href="/menu">
                <Button variant="outline" className="self-start">
                  View All Menu
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <FoodCard key={index} item={{} as MenuItem} isSkeleton />
                  ))
                ) : featuredItems.map((item, index) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge variant="default" className="mb-4" dot>
                Popular Items
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Customer Favorites
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Most ordered items this week
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <FoodCard key={index} item={{} as MenuItem} isSkeleton />
                  ))
                ) : popularItems.map((item, index) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-amber-600 dark:bg-amber-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to order?
              </h2>
              <p className="text-amber-100 mb-8 max-w-2xl mx-auto">
                Join hundreds of satisfied customers. Browse our menu and place your first order today!
              </p>
              <Link href="/menu">
                <Button size="lg" variant="outline" className="w-full sm:w-auto" leftIcon={<Utensils className="w-5 h-5" />}>
                  Start Ordering Now
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900 dark:text-white">HandaTala</span>
              </Link>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your canteen companion for seamless food ordering. Skip the line, enjoy your meal.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/menu" className="hover:text-amber-600 transition-colors">Menu</Link></li>
                <li><Link href="/orders" className="hover:text-amber-600 transition-colors">My Orders</Link></li>
                <li><Link href="/queue" className="hover:text-amber-600 transition-colors">Kitchen Queue</Link></li>
                <li><Link href="/login" className="hover:text-amber-600 transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Categories</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/menu?category=rice-meals" className="hover:text-amber-600 transition-colors">Rice Meals</Link></li>
                <li><Link href="/menu?category=snacks" className="hover:text-amber-600 transition-colors">Snacks</Link></li>
                <li><Link href="/menu?category=drinks" className="hover:text-amber-600 transition-colors">Drinks</Link></li>
                <li><Link href="/menu?category=desserts" className="hover:text-amber-600 transition-colors">Desserts</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Canteen Building, Ground Floor</li>
                <li>Open: 7:00 AM - 7:00 PM</li>
                <li>Email: canteen@handatala.test</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; 2026 HandaTala. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}