/**
 * Enhanced Navigation System
 * Simplified and intuitive navigation for WAI DevStudio Platform
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ChevronDown, 
  Home, 
  Code2, 
  Bot, 
  Palette, 
  Gamepad2, 
  Building, 
  BarChart3,
  Settings,
  Zap,
  Menu,
  X
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  description?: string;
  badge?: string;
  category: 'platform' | 'tool' | 'analytics' | 'settings';
  featured?: boolean;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  // Core Platforms
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/',
    description: 'Overview and quick access',
    category: 'platform',
    featured: true
  },
  {
    id: 'code-studio',
    label: 'Code Studio',
    icon: Code2,
    path: '/platforms/code-studio',
    description: 'AI-powered development',
    badge: 'v7.0',
    category: 'platform',
    featured: true
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant Builder',
    icon: Bot,
    path: '/platforms/ai-assistant-builder',
    description: 'Create custom AI assistants',
    category: 'platform',
    featured: true
  },
  {
    id: 'content-studio',
    label: 'Content Studio',
    icon: Palette,
    path: '/platforms/content-studio',
    description: 'AI content generation',
    category: 'platform',
    featured: true
  },
  {
    id: 'game-builder',
    label: 'Game Builder',
    icon: Gamepad2,
    path: '/platforms/game-builder',
    description: 'AI game development',
    category: 'platform'
  },
  {
    id: 'business-studio',
    label: 'Business Studio',
    icon: Building,
    path: '/platforms/business-studio',
    description: 'Enterprise solutions',
    category: 'platform'
  },
  
  // Development Tools
  {
    id: 'orchestration',
    label: 'WAI Orchestration',
    icon: Zap,
    path: '/orchestration-v3',
    description: 'AI agent coordination',
    badge: 'NEW',
    category: 'tool'
  },
  {
    id: 'agents',
    label: 'Agent Management',
    icon: Bot,
    path: '/agents',
    description: 'Manage AI agents',
    category: 'tool'
  },
  
  // Analytics
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics',
    description: 'Performance insights',
    category: 'analytics'
  },
  {
    id: 'cost-analytics',
    label: 'Cost Optimization',
    icon: BarChart3,
    path: '/cost-analytics',
    description: 'Cost tracking & savings',
    category: 'analytics'
  },
  
  // Settings
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/llm-management-settings',
    description: 'Platform configuration',
    category: 'settings'
  }
];

interface EnhancedNavigationProps {
  className?: string;
}

export function EnhancedNavigation({ className }: EnhancedNavigationProps) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const groupedItems = {
    platforms: NAVIGATION_ITEMS.filter(item => item.category === 'platform'),
    tools: NAVIGATION_ITEMS.filter(item => item.category === 'tool'),
    analytics: NAVIGATION_ITEMS.filter(item => item.category === 'analytics'),
    settings: NAVIGATION_ITEMS.filter(item => item.category === 'settings')
  };

  const isActiveRoute = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  const NavigationGroup = ({ 
    title, 
    items, 
    collapsible = false 
  }: { 
    title: string; 
    items: NavigationItem[]; 
    collapsible?: boolean;
  }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
      <div className="mb-6">
        {collapsible ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors"
          >
            {title}
            <ChevronDown className={cn(
              "h-3 w-3 transition-transform",
              !isExpanded && "rotate-180"
            )} />
          </button>
        ) : (
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {title}
          </h3>
        )}
        
        {(!collapsible || isExpanded) && (
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);
              
              return (
                <Link key={item.id} to={item.path}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground group",
                      isActive && "bg-accent text-accent-foreground",
                      isCollapsed && "justify-center px-2"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isActive && "text-primary"
                    )} />
                    
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.label}
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                            {item.featured && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu */}
        <aside className={cn(
          "fixed left-0 top-0 h-full w-72 bg-background border-r z-50 transform transition-transform duration-200 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}>
          <div className="p-6 pt-16 h-full overflow-y-auto">
            <div className="mb-8">
              <h2 className="text-lg font-semibold">WAI DevStudio</h2>
              <p className="text-sm text-muted-foreground">AI Development Platform</p>
            </div>
            
            <NavigationGroup title="Platforms" items={groupedItems.platforms} />
            <NavigationGroup title="Tools" items={groupedItems.tools} collapsible />
            <NavigationGroup title="Analytics" items={groupedItems.analytics} collapsible />
            <NavigationGroup title="Settings" items={groupedItems.settings} collapsible />
          </div>
        </aside>
      </>
    );
  }

  return (
    <aside className={cn(
      "bg-background border-r transition-all duration-200 ease-in-out",
      isCollapsed ? "w-16" : "w-72",
      className
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b">
          {!isCollapsed ? (
            <div>
              <h2 className="text-lg font-semibold">WAI DevStudio</h2>
              <p className="text-sm text-muted-foreground">AI Development Platform</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 p-6 overflow-y-auto">
          <NavigationGroup title="Platforms" items={groupedItems.platforms} />
          
          {!isCollapsed && (
            <>
              <NavigationGroup title="Tools" items={groupedItems.tools} collapsible />
              <NavigationGroup title="Analytics" items={groupedItems.analytics} collapsible />
              <NavigationGroup title="Settings" items={groupedItems.settings} collapsible />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("w-full", isCollapsed && "px-2")}
          >
            <Menu className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}

export default EnhancedNavigation;