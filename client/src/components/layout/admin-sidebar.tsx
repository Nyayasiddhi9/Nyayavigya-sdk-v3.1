'use client';

import * as React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Bot, 
  Brain, 
  Settings, 
  Activity, 
  Users, 
  Shield, 
  BarChart3,
  Workflow,
  Layers,
  Zap,
  Database,
  X
} from 'lucide-react';

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'System Status', href: '/system', icon: Activity },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    name: 'Agent Management',
    items: [
      { name: 'Agent Registry', href: '/agents', icon: Bot },
      { name: 'Agent Analytics', href: '/agents/analytics', icon: BarChart3 },
      { name: 'Agent Orchestration', href: '/orchestration', icon: Workflow },
    ],
  },
  {
    name: 'LLM Providers',
    items: [
      { name: 'Provider Catalog', href: '/llm-providers', icon: Brain },
      { name: 'Model Management', href: '/llm-providers/models', icon: Layers },
      { name: 'Cost Analytics', href: '/llm-providers/costs', icon: BarChart3 },
    ],
  },
  {
    name: 'Enterprise',
    items: [
      { name: 'User Management', href: '/users', icon: Users },
      { name: 'Security & Compliance', href: '/security', icon: Shield },
      { name: 'Integrations', href: '/integrations', icon: Zap },
      { name: 'Data Management', href: '/data', icon: Database },
    ],
  },
  {
    name: 'Administration',
    items: [
      { name: 'System Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'admin-sidebar fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold">WAI Enterprise</div>
                <div className="text-xs text-muted-foreground">Admin Console</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-6">
              {navigation.map((group) => (
                <div key={group.name}>
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.name}
                  </h3>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={cn(
                              'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                            onClick={onClose}
                          >
                            <item.icon
                              className={cn(
                                'mr-3 h-4 w-4 flex-shrink-0',
                                isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                              )}
                            />
                            {item.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Sidebar footer */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">All systems operational</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}