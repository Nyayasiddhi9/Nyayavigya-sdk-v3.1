'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';

interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className={cn('admin-layout', className)}>
      <AdminHeader 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <AdminSidebar 
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}