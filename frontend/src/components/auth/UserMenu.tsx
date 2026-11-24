'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChefHat,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Utensils,
  CreditCard,
  List,
  UserCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

import Image from 'next/image';

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);

  const closeMenu = (returnFocus = true) => {
    setIsOpen(false);
    if (returnFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    itemRefs.current[0]?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') {
        return;
      }

      event.preventDefault();
      const items = itemRefs.current.filter(Boolean);
      if (!items.length) return;

      const currentIndex = items.findIndex((item) => item === document.activeElement);
      let nextIndex = currentIndex;
      if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = items.length - 1;
      else if (event.key === 'ArrowDown') nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      else nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;

      items[nextIndex]?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const role = user.role;
  const menuItems = role === 'admin'
    ? [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Menu', href: '/admin/menu', icon: Utensils },
        { label: 'Inventory', href: '/admin/inventory', icon: ShoppingBag },
        { label: 'Orders', href: '/admin/orders', icon: List },
        { label: 'POS', href: '/admin/pos', icon: CreditCard },
      ]
    : role === 'kitchen'
      ? [{ label: 'Kitchen Queue', href: '/queue', icon: ChefHat }]
      : [
          { label: 'Profile', href: '/profile', icon: UserCircle },
          { label: 'My Orders', href: '/orders', icon: ShoppingBag },
        ];

  const handleSignOut = async () => {
    closeMenu(false);
    await logout();
    router.replace('/');
  };

  const initial = (user.firstName?.charAt(0) || user.name?.charAt(0) || user.email.charAt(0)).toUpperCase();


  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className="flex min-h-11 min-w-11 items-center gap-2 rounded-full p-1 pr-1 text-gray-900 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:text-white dark:hover:bg-gray-800"
        aria-label={`Open menu for ${user.name || user.email}`}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-base font-bold uppercase text-white shadow-sm overflow-hidden">
          {user.photoURL ? (
            <Image src={user.photoURL} alt={user.name} className="h-full w-full object-cover" width={40} height={40} />
          ) : (
            initial
          )}
        </span>
        <ChevronDown className={`hidden h-4 w-4 transition-transform sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-60 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Hello, {user.firstName || user.name.split(' ')[0]}
          </div>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                href={item.href}
                role="menuitem"
                onClick={() => closeMenu()}
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700 focus:outline-none dark:text-gray-200 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
          <button
            ref={(element) => {
              itemRefs.current[menuItems.length] = element;
            }}
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
