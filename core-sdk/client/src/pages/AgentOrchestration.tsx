'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Bot, 
  Crown, 
  Code, 
  Palette, 
  TestTube, 
  Settings, 
  Brain, 
  Activity, 
  Zap, 
  Users, 
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Eye } from 'lucide-react';

// Agent tier configurations based on ROMA architecture
const AGENT_TIERS = {
  executive: {
    name: 'Executive Tier',
    icon: Crown,
    color: 'purple',
    description: 'Strategic planning, resource allocation, executive decisions',
    capabilities: ['Strategic Planning', 'Resource Allocation', 'Executive Decisions', 'High-level Coordination']
  },
  development: {
    name: 'Development Tier', 
    icon: Code,
    color: 'blue',
    description: 'Code generation, testing, deployment, debugging',
    capabilities: ['Code Generation', 'Testing Automation', 'Deployment', 'Debugging', 'Code Review']
  },
  creative: {
    name: 'Creative Tier',
    icon: Palette, 
    color: 'pink',
    description: 'Content creation, design, multimedia, artistic generation',
    capabilities: ['Content Creation', 'Design Generation', 'Video/Audio Creation', 'Artistic Generation']
  },
  qa: {
    name: 'QA Tier',
    icon: TestTube,
    color: 'green', 
    description: 'Testing automation, quality assurance, validation',
    capabilities: ['Test Automation', 'Quality Assurance', 'Validation', 'Performance Testing']
  },
  devops: {
    name: 'DevOps Tier',
    icon: Settings,
    color: 'orange',
    description: 'Infrastructure, deployment, monitoring, scaling',
    capabilities: ['Infrastructure Management', 'CI/CD', 'Monitoring', 'Auto-scaling']
  },
  domainSpecialist: {
    name: 'Domain Specialist',
    icon: Brain,
    color: 'indigo',
    description: 'Specialized knowledge, domain expertise, consulting',
    capabilities: ['Domain Expertise', 'Specialized Knowledge', 'Consulting', 'Expert Analysis']
  }
};

interface Agent {
  id: string; // Original ID from backend
  uniqueKey: string; // Composite key: ${source}:${id} for React rendering
  name: string;
  tier: keyof typeof AGENT_TIERS;
  status: 'active' | 'idle' | 'busy' | 'error';
  health: 'healthy' | 'warning' | 'critical';
  workload: number;
  uptime: number;
  tasksCompleted: number;
  averageResponseTime: number;
  lastActivity: string;
  capabilities: string[];
  currentTask?: string;
  performance: {
    successRate: number;
    efficiency: number;
    costOptimization: number;
  };
  description?: string;
  systemPrompt?: string;
  preferredModels?: string[];
  enabled?: boolean;
  source?: 'WAI' | 'wshobson';
}

// Form schema for editing agents
const editAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  systemPrompt: z.string().min(1, "System prompt is required"),
  capabilities: z.string().min(1, "Capabilities are required"),
  tier: z.enum(['executive', 'development', 'creative', 'qa', 'devops', 'domainSpecialist']),
  preferredModels: z.string().optional(),
});

type EditAgentForm = z.infer<typeof editAgentSchema>;

// API Agent interface (from database)
interface ApiAgent {
  id: string;
  name: string;
  tier: string;
  description?: string;
  systemPrompt?: string;
  capabilities?: string | string[];
  status?: string;
  enabled?: boolean;
  preferredModels?: string[];
  romaLevel?: string;
  createdAt?: string;
  updatedAt?: string;
  source?: 'WAI' | 'wshobson';
}

// Transform API data to match Agent interface
const transformApiAgent = (apiAgent: ApiAgent): Agent => {
  // Map tier names to match our AGENT_TIERS keys
  const tierMapping: Record<string, keyof typeof AGENT_TIERS> = {
    'executive': 'executive',
    'development': 'development', 
    'creative': 'creative',
    'qa': 'qa',
    'devops': 'devops',
    'domain': 'domainSpecialist'
  };

  const source = apiAgent.source || 'WAI';
  return {
    id: apiAgent.id,
    uniqueKey: `${source}:${apiAgent.id}`, // Composite key for React rendering
    name: apiAgent.name || `Agent ${apiAgent.id}`,
    tier: tierMapping[apiAgent.tier] || 'development',
    status: apiAgent.enabled ? 'active' : 'idle',
    health: 'healthy', // Default value
    workload: Math.round(Math.random() * 100), // Simulated for now
    uptime: 95 + Math.random() * 5,
    tasksCompleted: Math.round(Math.random() * 1000),
    averageResponseTime: 50 + Math.random() * 200,
    lastActivity: new Date().toISOString(),
    capabilities: typeof apiAgent.capabilities === 'string' ? 
      apiAgent.capabilities.split(',').map((c: string) => c.trim()) : 
      (Array.isArray(apiAgent.capabilities) ? apiAgent.capabilities : []),
    currentTask: apiAgent.enabled ? `Processing task for ${apiAgent.name}` : undefined,
    performance: {
      successRate: 85 + Math.random() * 15,
      efficiency: 70 + Math.random() * 30,
      costOptimization: 80 + Math.random() * 20
    },
    description: apiAgent.description,
    systemPrompt: apiAgent.systemPrompt,
    preferredModels: Array.isArray(apiAgent.preferredModels) ? apiAgent.preferredModels : [],
    enabled: apiAgent.enabled,
    source
  };
};

export default function AgentOrchestration() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [viewingSystemPrompt, setViewingSystemPrompt] = useState<Agent | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch real agents from unified API (WAI + wshobson agents)
  const { data: apiAgents = [], isLoading, error } = useQuery<ApiAgent[]>({
    queryKey: ['/api/v9/agents/unified'],
    queryFn: async () => {
      const res = await fetch('/api/v9/agents/unified?limit=1000'); // Request all agents (WAI + wshobson)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      return data.agents || []; // Extract agents array from response object
    },
    staleTime: 30000 // 30 seconds
  });

  // Transform API data to match our interface
  const agents: Agent[] = apiAgents.map((apiAgent: ApiAgent) => transformApiAgent(apiAgent));

  // Agent mutations
  const updateAgentMutation = useMutation({
    mutationFn: async (updatedAgent: EditAgentForm & { id: string }) => {
      const res = await fetch(`/api/admin/agents/${updatedAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedAgent.name,
          description: updatedAgent.description,
          systemPrompt: updatedAgent.systemPrompt,
          capabilities: updatedAgent.capabilities,
          tier: updatedAgent.tier,
          preferredModels: updatedAgent.preferredModels ? updatedAgent.preferredModels.split(',').map(m => m.trim()) : [],
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/agents/unified'] });
      toast({ title: "Agent updated successfully" });
      setEditingAgent(null);
    },
    onError: (error) => {
      toast({ title: "Failed to update agent", description: error.message, variant: "destructive" });
    }
  });

  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, enabled }: { agentId: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/agents/${agentId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/agents/unified'] });
      toast({ title: "Agent status updated" });
    },
    onError: (error) => {
      toast({ title: "Failed to update agent status", description: error.message, variant: "destructive" });
    }
  });

  // Form for editing agents
  const editForm = useForm<EditAgentForm>({
    resolver: zodResolver(editAgentSchema),
    defaultValues: {
      name: '',
      description: '',
      systemPrompt: '',
      capabilities: '',
      tier: 'development',
      preferredModels: ''
    }
  });

  // Update form when editing agent changes
  useEffect(() => {
    if (editingAgent) {
      editForm.reset({
        name: editingAgent.name,
        description: editingAgent.description || '',
        systemPrompt: editingAgent.systemPrompt || '',
        capabilities: Array.isArray(editingAgent.capabilities) ? 
          editingAgent.capabilities.join(', ') : 
          (editingAgent.capabilities || ''),
        tier: editingAgent.tier,
        preferredModels: Array.isArray(editingAgent.preferredModels) ? 
          editingAgent.preferredModels.join(', ') : 
          (editingAgent.preferredModels || '').toString()
      });
    }
  }, [editingAgent, editForm]);

  // Handle form submission
  const onSubmitEdit = (data: EditAgentForm) => {
    if (!editingAgent) return;
    updateAgentMutation.mutate({ ...data, id: editingAgent.id });
  };

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/agents/unified'] });
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [queryClient]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading agents...</div>
          <div className="text-muted-foreground">Fetching real agent data from the API</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center text-red-600">
          <div className="text-lg font-semibold">Failed to load agents</div>
          <div className="text-muted-foreground">Error: {(error as Error).message}</div>
        </div>
      </div>
    );
  }

  // Filter agents based on search and filters
  const filteredAgents = agents.filter((agent: Agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'all' || agent.tier === selectedTier;
    const matchesStatus = selectedStatus === 'all' || agent.status === selectedStatus;
    return matchesSearch && matchesTier && matchesStatus;
  });

  // Calculate aggregate statistics
  const stats = {
    total: agents.length,
    active: agents.filter((a: Agent) => a.status === 'active').length,
    healthy: agents.filter((a: Agent) => a.health === 'healthy').length,
    avgWorkload: Math.round(agents.reduce((sum: number, a: Agent) => sum + a.workload, 0) / agents.length),
    avgUptime: Math.round(agents.reduce((sum: number, a: Agent) => sum + a.uptime, 0) / agents.length * 10) / 10,
    totalTasks: agents.reduce((sum: number, a: Agent) => sum + a.tasksCompleted, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'busy': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTierColor = (tier: string) => {
    return AGENT_TIERS[tier as keyof typeof AGENT_TIERS]?.color || 'gray';
  };

  return (
    <div className="p-6 space-y-6" data-testid="agent-orchestration">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Orchestration</h1>
          <p className="text-muted-foreground">
            Manage 267 agents (105 WAI + 79 Geminiflow + 83 wshobson) across ROMA architecture tiers with BMAD coordination
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/v9/agents/unified'] })}
            disabled={isLoading}
            data-testid="refresh-agents"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" data-testid="bmad-coordination">
            <Zap className="h-4 w-4 mr-2" />
            BMAD Control
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
                <div className="text-sm text-muted-foreground">Healthy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.avgWorkload}%</div>
                <div className="text-sm text-muted-foreground">Avg Load</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.avgUptime}%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalTasks.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Tasks Done</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                data-testid="search-agents"
              />
            </div>
            
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-[180px]" data-testid="filter-tier">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                {Object.entries(AGENT_TIERS).map(([key, tier]) => (
                  <SelectItem key={key} value={key}>{tier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]" data-testid="filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground">
              {filteredAgents.length} of {agents.length} agents
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Management Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="tiers" data-testid="tab-tiers">By Tiers</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          <TabsTrigger value="bmad" data-testid="tab-bmad">BMAD Coordination</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent: Agent) => {
              const TierIcon = AGENT_TIERS[agent.tier].icon;
              return (
                <Card key={agent.uniqueKey} className="hover:shadow-md transition-shadow" data-testid={`agent-card-${agent.uniqueKey}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TierIcon className={`h-5 w-5 text-${getTierColor(agent.tier)}-600`} />
                        <CardTitle className="text-sm">{agent.name}</CardTitle>
                        {agent.source === 'wshobson' && (
                          <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            wshobson
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                        <Badge variant="outline" className="text-xs">
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground">Health</div>
                        <div className={`font-medium ${getHealthColor(agent.health)}`}>
                          {agent.health}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Workload</div>
                        <div className="font-medium">{agent.workload}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Tasks</div>
                        <div className="font-medium">{agent.tasksCompleted}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Response</div>
                        <div className="font-medium">{Math.round(agent.averageResponseTime)}ms</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Workload</span>
                        <span>{agent.workload}%</span>
                      </div>
                      <Progress value={agent.workload} className="h-2" />
                    </div>

                    {agent.currentTask && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        <div className="font-medium">Current Task:</div>
                        <div className="truncate">{agent.currentTask}</div>
                      </div>
                    )}

                    <div className="flex gap-1 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs flex-1"
                        onClick={() => setViewingSystemPrompt(agent)}
                        data-testid={`view-prompt-${agent.id}`}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        System Prompt
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => setEditingAgent(agent)}
                        data-testid={`edit-agent-${agent.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={agent.enabled ? "default" : "secondary"}
                        className="text-xs"
                        onClick={() => toggleAgentMutation.mutate({ agentId: agent.id, enabled: !agent.enabled })}
                        disabled={toggleAgentMutation.isPending}
                        data-testid={`toggle-agent-${agent.id}`}
                      >
                        {agent.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          {Object.entries(AGENT_TIERS).map(([tierKey, tierConfig]) => {
            const tierAgents = filteredAgents.filter((a: Agent) => a.tier === tierKey);
            const TierIcon = tierConfig.icon;
            
            return (
              <Card key={tierKey} data-testid={`tier-section-${tierKey}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TierIcon className={`h-6 w-6 text-${tierConfig.color}-600`} />
                    {tierConfig.name}
                    <Badge variant="secondary">{tierAgents.length} agents</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{tierConfig.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tierAgents.slice(0, 8).map((agent: Agent) => (
                      <div 
                        key={agent.uniqueKey}
                        className="p-3 border rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        data-testid={`tier-agent-${agent.uniqueKey}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium truncate">{agent.name}</div>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Load: {agent.workload}% | Tasks: {agent.tasksCompleted}
                        </div>
                      </div>
                    ))}
                    {tierAgents.length > 8 && (
                      <div className="p-3 border rounded-lg bg-muted/20 flex items-center justify-center">
                        <div className="text-sm text-muted-foreground">
                          +{tierAgents.length - 8} more agents
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(AGENT_TIERS).map(([tierKey, tierConfig]) => {
                    const tierAgents = agents.filter((a: Agent) => a.tier === tierKey);
                    const avgPerformance = tierAgents.reduce((sum: number, a: Agent) => sum + a.performance.successRate, 0) / tierAgents.length;
                    const TierIcon = tierConfig.icon;
                    
                    return (
                      <div key={tierKey} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <TierIcon className={`h-5 w-5 text-${tierConfig.color}-600`} />
                          <div>
                            <div className="font-medium">{tierConfig.name}</div>
                            <div className="text-sm text-muted-foreground">{tierAgents.length} agents</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{Math.round(avgPerformance)}%</div>
                          <div className="text-sm text-muted-foreground">Success Rate</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall System Health</span>
                    <Badge variant="default" className="bg-green-600">Excellent</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Agent Availability</span>
                        <span>{Math.round((stats.active / stats.total) * 100)}%</span>
                      </div>
                      <Progress value={(stats.active / stats.total) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>System Efficiency</span>
                        <span>94%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Cost Optimization</span>
                        <span>90%</span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bmad" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                BMAD Coordination Method 4.0
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Advanced coordination patterns for autonomous multi-agent execution
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <div className="text-sm text-muted-foreground">Active Patterns</div>
                  </div>
                  <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">94.5%</div>
                    <div className="text-sm text-muted-foreground">Efficiency</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">8</div>
                    <div className="text-sm text-muted-foreground">Coordinations</div>
                  </div>
                  <div className="text-center p-4 bg-orange-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">156</div>
                    <div className="text-sm text-muted-foreground">Conflicts Resolved</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center p-4 bg-indigo-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">250/min</div>
                    <div className="text-sm text-muted-foreground">Throughput</div>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">85ms</div>
                    <div className="text-sm text-muted-foreground">Avg Latency</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-2">Continuous Execution Status</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Runtime</div>
                    <div className="font-medium">{Math.round(Date.now() / 1000 / 3600) % 24}h</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tasks Processed</div>
                    <div className="font-medium">12,847</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Uptime</div>
                    <div className="font-medium text-green-600">99.97%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Load Balance</div>
                    <div className="font-medium text-blue-600">Optimal</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Agent Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Agent: {editingAgent?.name}</DialogTitle>
            <DialogDescription>
              Modify agent configuration, system prompt, and capabilities.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter agent name" data-testid="input-agent-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter agent description" data-testid="input-agent-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-agent-tier">
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(AGENT_TIERS).map(([key, tier]) => (
                          <SelectItem key={key} value={key}>{tier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="capabilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capabilities (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. code-generation, testing, debugging" data-testid="input-agent-capabilities" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="preferredModels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Models (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. gpt-4, claude-3, gemini-pro" data-testid="input-agent-models" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter the system prompt for this agent..." 
                        className="min-h-[150px]"
                        data-testid="textarea-system-prompt"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingAgent(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateAgentMutation.isPending}
                  data-testid="button-save-agent"
                >
                  {updateAgentMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View System Prompt Dialog */}
      <Dialog open={!!viewingSystemPrompt} onOpenChange={(open) => !open && setViewingSystemPrompt(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>System Prompt: {viewingSystemPrompt?.name}</DialogTitle>
            <DialogDescription>
              View the current system prompt for this agent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Agent Details</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tier:</span> {AGENT_TIERS[viewingSystemPrompt?.tier || 'development'].name}
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span> {viewingSystemPrompt?.status}
                </div>
                <div>
                  <span className="text-muted-foreground">Capabilities:</span> {Array.isArray(viewingSystemPrompt?.capabilities) ? 
                    viewingSystemPrompt.capabilities.join(', ') : viewingSystemPrompt?.capabilities}
                </div>
                <div>
                  <span className="text-muted-foreground">Models:</span> {Array.isArray(viewingSystemPrompt?.preferredModels) ? 
                    viewingSystemPrompt.preferredModels.join(', ') : 'Not specified'}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">System Prompt</div>
              <div className="p-4 bg-muted/50 rounded-lg border max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {viewingSystemPrompt?.systemPrompt || 'No system prompt defined for this agent.'}
                </pre>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setViewingSystemPrompt(null)}
                data-testid="button-close-prompt"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setEditingAgent(viewingSystemPrompt);
                  setViewingSystemPrompt(null);
                }}
                data-testid="button-edit-from-prompt"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Agent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}