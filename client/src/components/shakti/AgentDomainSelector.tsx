import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Code, Briefcase, Palette, Scale, Search, LineChart, 
  Megaphone, Calculator, Settings, Shield, Users, 
  GraduationCap, Building, Globe, Heart, Landmark,
  ChevronDown, Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Domain {
  id: string;
  name: string;
  icon: any;
  agentCount: number;
  color: string;
  description: string;
  categories?: string[];
}

const WAI_DOMAINS: Domain[] = [
  { id: 'development', name: 'Development', icon: Code, agentCount: 77, color: 'blue', description: 'Software engineering, coding, architecture' },
  { id: 'executive', name: 'Executive', icon: Briefcase, agentCount: 25, color: 'purple', description: 'Leadership, strategy, orchestration' },
  { id: 'analytics', name: 'Analytics', icon: LineChart, agentCount: 35, color: 'green', description: 'Data analysis, business intelligence' },
  { id: 'research', name: 'Research', icon: Search, agentCount: 30, color: 'cyan', description: 'Research, investigation, synthesis' },
  { id: 'creative', name: 'Creative', icon: Palette, agentCount: 25, color: 'pink', description: 'Content creation, design, multimedia' },
  { id: 'marketing', name: 'Marketing', icon: Megaphone, agentCount: 20, color: 'orange', description: 'Marketing, branding, growth' },
  { id: 'finance', name: 'Finance', icon: Calculator, agentCount: 15, color: 'emerald', description: 'Financial analysis, planning' },
  { id: 'operations', name: 'Operations', icon: Settings, agentCount: 18, color: 'slate', description: 'Operations, logistics, process' },
  { id: 'quality', name: 'Quality', icon: Shield, agentCount: 15, color: 'yellow', description: 'QA, testing, validation' },
  { id: 'devops', name: 'DevOps', icon: Globe, agentCount: 15, color: 'red', description: 'DevOps, infrastructure' },
];

const LEGAL_DOMAINS: Domain[] = [
  { id: 'corporate', name: 'Corporate Law', icon: Building, agentCount: 12, color: 'indigo', description: 'Business law, M&A, compliance', categories: ['Company Law', 'M&A', 'Startups'] },
  { id: 'criminal', name: 'Criminal Law', icon: Shield, agentCount: 10, color: 'red', description: 'Criminal defense, prosecution', categories: ['BNS 2023', 'CrPC', 'BNSS'] },
  { id: 'civil', name: 'Civil Law', icon: Scale, agentCount: 10, color: 'blue', description: 'Civil litigation, contracts', categories: ['CPC', 'Contracts', 'Torts'] },
  { id: 'constitutional', name: 'Constitutional', icon: Landmark, agentCount: 8, color: 'purple', description: 'Constitutional law, rights', categories: ['Fundamental Rights', 'Writs'] },
  { id: 'family', name: 'Family Law', icon: Heart, agentCount: 8, color: 'pink', description: 'Divorce, custody, inheritance', categories: ['Divorce', 'Custody', 'Succession'] },
  { id: 'labor', name: 'Labor Law', icon: Users, agentCount: 10, color: 'orange', description: 'Employment, workplace rights', categories: ['Labor Code', 'Industrial Relations'] },
  { id: 'ip', name: 'IP Law', icon: GraduationCap, agentCount: 10, color: 'cyan', description: 'Patents, trademarks, copyrights', categories: ['Patents', 'Trademarks', 'Copyrights'] },
  { id: 'cyber', name: 'Cyber Law', icon: Globe, agentCount: 10, color: 'green', description: 'IT Act, cybercrime, data privacy', categories: ['IT Act 2000', 'DPDP 2023', 'Cybercrime'] },
];

interface AgentDomainSelectorProps {
  selectedDomains: string[];
  onDomainsChange: (domains: string[]) => void;
  mode: 'wai' | 'legal' | 'super';
  onModeChange: (mode: 'wai' | 'legal' | 'super') => void;
}

export function AgentDomainSelector({
  selectedDomains,
  onDomainsChange,
  mode,
  onModeChange
}: AgentDomainSelectorProps) {
  const domains = mode === 'legal' ? LEGAL_DOMAINS : mode === 'super' ? [...WAI_DOMAINS, ...LEGAL_DOMAINS] : WAI_DOMAINS;
  
  const totalAgents = mode === 'super' ? 550 : mode === 'legal' ? 275 : 275;
  const selectedAgentCount = selectedDomains.length === 0 
    ? totalAgents 
    : domains.filter(d => selectedDomains.includes(d.id)).reduce((acc, d) => acc + d.agentCount, 0);

  const toggleDomain = (domainId: string) => {
    if (selectedDomains.includes(domainId)) {
      onDomainsChange(selectedDomains.filter(d => d !== domainId));
    } else {
      onDomainsChange([...selectedDomains, domainId]);
    }
  };

  const clearAll = () => onDomainsChange([]);

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      purple: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      green: 'bg-green-500/10 text-green-600 border-green-500/30',
      cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
      pink: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
      orange: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      slate: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
      yellow: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      red: 'bg-red-500/10 text-red-600 border-red-500/30',
      indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    };
    return colors[color] || colors.blue;
  };

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm" data-testid="domain-selector">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8" data-testid="mode-selector">
                  {mode === 'super' ? 'Super Chat (550 Agents)' : mode === 'legal' ? 'Legal Chat (275 Agents)' : 'General Chat (275 Agents)'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Select Chat Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onModeChange('super')} data-testid="mode-super">
                  <div className="flex items-center justify-between w-full">
                    <span>Super Chat (550 Agents)</span>
                    {mode === 'super' && <Check className="w-4 h-4 ml-2" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onModeChange('wai')} data-testid="mode-wai">
                  <div className="flex items-center justify-between w-full">
                    <span>General Chat (275 Agents)</span>
                    {mode === 'wai' && <Check className="w-4 h-4 ml-2" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onModeChange('legal')} data-testid="mode-legal">
                  <div className="flex items-center justify-between w-full">
                    <span>Legal Chat (275 Agents)</span>
                    {mode === 'legal' && <Check className="w-4 h-4 ml-2" />}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant="secondary" className="text-xs" data-testid="agent-count-badge">
              {selectedAgentCount} agents active
            </Badge>
          </div>

          {selectedDomains.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs" data-testid="clear-domains">
              Clear filters
            </Button>
          )}
        </div>

        <ScrollArea className="w-full">
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => {
              const Icon = domain.icon;
              const isSelected = selectedDomains.includes(domain.id);
              
              return (
                <Button
                  key={domain.id}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleDomain(domain.id)}
                  className={`h-8 transition-all ${
                    isSelected 
                      ? getColorClass(domain.color) 
                      : 'bg-background hover:bg-muted'
                  }`}
                  data-testid={`domain-${domain.id}`}
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  <span className="text-xs">{domain.name}</span>
                  <Badge 
                    variant="secondary" 
                    className="ml-1.5 h-4 px-1 text-[10px] bg-background/50"
                  >
                    {domain.agentCount}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
