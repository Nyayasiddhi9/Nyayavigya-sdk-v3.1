import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  LayoutDashboard, Users, Bot, Workflow, Settings, Zap, Database,
  BarChart3, Shield, ChevronRight, ChevronDown, Building2, Layers,
  FlaskConical, BookOpen, Key, Brain, Sparkles, GitBranch, Network,
  Play, UserPlus, Briefcase, TestTube2, FolderTree, Target, Rocket,
  ToggleLeft, Cpu
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface NavSection {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navigationSections: NavSection[] = [
  {
    id: 'lifecycle',
    label: 'Lifecycle',
    icon: Rocket,
    defaultOpen: true,
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'onboarding', label: 'Onboarding', icon: UserPlus, badge: 'New' },
    ]
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: Building2,
    defaultOpen: true,
    items: [
      { id: 'org-setup', label: 'Organization Setup', icon: Building2 },
      { id: 'team-templates', label: 'Team Templates', icon: FolderTree, badge: '12' },
      { id: 'team-hierarchy', label: 'Team Hierarchy', icon: GitBranch },
      { id: 'swarm-config', label: 'Swarm Configuration', icon: Network },
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Workflow,
    defaultOpen: false,
    items: [
      { id: 'agents', label: 'Agent Roster', icon: Bot, badge: '267' },
      { id: 'agent-definitions', label: 'Agent Definitions', icon: Brain },
      { id: 'workflows', label: 'Workflows', icon: Workflow },
      { id: 'decisions', label: 'Decision Cards', icon: Target },
    ]
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: Settings,
    defaultOpen: false,
    items: [
      { id: 'feature-flags', label: 'Feature Flags', icon: ToggleLeft, badge: 'v2.0' },
      { id: 'providers', label: 'LLM Providers', icon: Zap, badge: '23' },
      { id: 'tools', label: 'MCP Tools', icon: Database, badge: '93' },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'api-gateway', label: 'API Gateway', icon: Key },
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: Brain,
    defaultOpen: false,
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'digital-twin', label: 'Digital Twin', icon: Users },
      { id: 'architect', label: 'Architect', icon: Layers },
    ]
  },
  {
    id: 'testing',
    label: 'Testing',
    icon: FlaskConical,
    defaultOpen: false,
    items: [
      { id: 'test-bed', label: 'Team Test Bed', icon: TestTube2, badge: 'New' },
      { id: 'simulations', label: 'Simulations', icon: Play },
    ]
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: BookOpen,
    defaultOpen: false,
    items: [
      { id: 'documentation', label: 'Documentation', icon: BookOpen },
      { id: 'create-agent', label: 'Create Agent', icon: Sparkles },
      { id: 'enhanced-config', label: 'Enhanced Config', icon: Shield },
    ]
  }
];

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function AdminSidebar({ activeSection, onSectionChange, collapsed = false }: AdminSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    navigationSections.reduce((acc, section) => {
      acc[section.id] = section.defaultOpen ?? false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 z-40",
      collapsed ? "w-16" : "w-64"
    )} data-testid="sidebar-navigation">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg" data-testid="text-brand">WAI SDK</h1>
              <p className="text-xs text-slate-400">Admin Console v1.0</p>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 py-2">
        <div className="px-2 space-y-1">
          {navigationSections.map(section => (
            <Collapsible
              key={section.id}
              open={openSections[section.id]}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-slate-300 hover:text-white hover:bg-slate-800"
                  data-testid={`button-section-${section.id}`}
                >
                  <div className="flex items-center gap-2">
                    <section.icon className="w-4 h-4" />
                    {!collapsed && <span className="text-sm font-medium">{section.label}</span>}
                  </div>
                  {!collapsed && (
                    openSections[section.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 mt-1">
                {section.items.map(item => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800",
                      activeSection === item.id && "bg-slate-800 text-white"
                    )}
                    onClick={() => onSectionChange(item.id)}
                    data-testid={`button-nav-${item.id}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-sm">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant={item.badgeVariant || 'secondary'} 
                            className="text-xs px-1.5 py-0"
                            data-testid={`badge-nav-${item.id}`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {!collapsed && <span>System Healthy</span>}
        </div>
      </div>
    </div>
  );
}
