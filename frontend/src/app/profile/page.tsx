'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  const initial = (user.firstName?.charAt(0) || user.name?.charAt(0) || user.email.charAt(0)).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <UserCircle className="mb-3 h-12 w-12 text-amber-600" />
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account information.</p>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-5 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-600 text-xl font-bold uppercase text-white">
              {initial}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h2>
              <p className="text-sm capitalize text-gray-500 dark:text-gray-400">{user.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-gray-200 pt-4 text-gray-700 dark:border-gray-700 dark:text-gray-300">
            <Mail className="h-5 w-5 text-gray-400" />
            <span>{user.email}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
