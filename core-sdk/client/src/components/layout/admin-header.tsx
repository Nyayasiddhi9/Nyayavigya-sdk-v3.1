'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/user-nav';
import { NotificationCenter } from '@/components/notification-center';
import { SystemStatus } from '@/components/system-status';
import { Menu, Search } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export function AdminHeader({ onMenuClick, sidebarOpen }: AdminHeaderProps) {
  return (
    <header className="admin-header flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <div className="hidden md:flex items-center space-x-2">
          <div className="font-semibold text-lg">WAI Enterprise</div>
          <div className="text-sm text-muted-foreground">Admin Console</div>
        </div>

        <div className="hidden lg:block">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents, models, or capabilities..."
              className="pl-8 w-[300px]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <SystemStatus />
        <NotificationCenter />
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}