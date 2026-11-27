'use client';

import { useState, type ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggleCollapsed={() => setIsCollapsed((collapsed) => !collapsed)}
      />
      <div className={`min-h-screen min-w-0 flex flex-col ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {children}
      </div>
    </>
  );
}
