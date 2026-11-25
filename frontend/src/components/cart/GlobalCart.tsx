'use client';

import { usePathname } from 'next/navigation';
import { CartDrawer } from './CartDrawer';

export function GlobalCart() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return <CartDrawer />;
}
