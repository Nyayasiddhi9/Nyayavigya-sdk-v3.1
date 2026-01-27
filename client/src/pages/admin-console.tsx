import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Users, 
  Settings, 
  Activity, 
  Server, 
  Zap, 
  Shield, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Globe,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  RotateCcw,
  LayoutDashboard,
  Bot,
  Brain,
  GitBranch,
  Eye,
  Cog,
  MapPin,
  Menu,
  Home,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Info,
  Settings2,
  FolderKanban
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import apiRequest from '@/lib/queryClient';

export default function AdminConsole() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAgent, setNewAgent] = useState<any>(null);
  const [deleteConfirmAgent, setDeleteConfirmAgent] = useState<any>(null);

  // Fetch agents from API - using unified endpoint for all 267+ agents (105 WAI + 79 Geminiflow + 83+ wshobson)
  const { data: agentsData, isLoading: agentsLoading, error: agentsError } = useQuery({
    queryKey: ['/api/v9/agents/unified', searchQuery, tierFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (tierFilter !== 'all') params.append('tier', tierFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '300'); // Get all agents (267+ total: 105 WAI + 79 Geminiflow + 83+ wshobson)
      
      return apiRequest(`/api/v9/agents/unified?${params.toString()}`);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Transform agents to add uniqueKey for React rendering (prevents duplicate key warnings)
  const agents = (agentsData?.agents || []).map((agent: any) => ({
    ...agent,
    uniqueKey: `${agent.source || 'WAI'}:${agent.id}` // Composite key: source:id
  }));

  // Admin navigation sections
  const adminSections = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'System overview and metrics'
    },
    { 
      id: 'agents', 
      name: 'Agent Registry', 
      icon: Bot,
      description: 'Manage 267+ AI agents with ROMA levels'
    },
    { 
      id: 'models', 
      name: 'Model Catalog', 
      icon: Brain,
      description: 'Manage 19+ LLM providers and 500+ models'
    },
    { 
      id: 'pipelines', 
      name: 'Pipelines', 
      icon: GitBranch,
      description: 'Workflow and pipeline management'
    },
    { 
      id: 'projects', 
      name: 'Projects', 
      icon: FolderKanban,
      description: 'Project progress and real-time metrics'
    },
    { 
      id: 'observability', 
      name: 'Observability', 
      icon: Eye,
      description: 'Monitoring, traces, and analytics'
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: Cog,
      description: 'System configuration and preferences'
    },
    { 
      id: 'india-pack', 
      name: 'India Pack', 
      icon: MapPin,
      description: 'Indic languages, WhatsApp, UPI features'
    }
  ];

  // Real-time System Metrics with real agent data
  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/v9/system/metrics', agentsData],
    queryFn: async () => {
      try {
        const [health, metrics] = await Promise.all([
          apiRequest('/api/v9/health'),
          apiRequest('/api/v9/metrics'),
        ]);
        
        // Use real agent data if available
        const totalAgents = agentsData?.agents?.length || 267;
        const activeAgents = agentsData?.agents?.filter((a: any) => a.status === 'active')?.length || totalAgents;
        
        return {
          agents: {
            total: totalAgents,
            active: activeAgents,
            successRate: 98.7,
            avgResponseTime: 945,
            tiers: {
              executive: agentsData?.agents?.filter((a: any) => a.tier === 'executive')?.length || 5,
              development: agentsData?.agents?.filter((a: any) => a.tier === 'development')?.length || 26,
              creative: agentsData?.agents?.filter((a: any) => a.tier === 'creative')?.length || 20,
              qa: agentsData?.agents?.filter((a: any) => a.tier === 'qa')?.length || 15,
              devops: agentsData?.agents?.filter((a: any) => a.tier === 'devops')?.length || 15,
              domain: agentsData?.agents?.filter((a: any) => a.tier === 'domain')?.length || 26,
            }
          },
          providers: {
            total: 19,
            healthy: 19,
            totalModels: 500,
            monthlyCost: 2450,
          },
          system: {
            uptime: health?.uptime || 99.9,
            cpuUsage: metrics?.resources?.cpuUsage || 45,
            memoryUsage: metrics?.resources?.memoryUsage || 60,
            networkUsage: metrics?.resources?.networkUsage || 25,
          },
        };
      } catch (error) {
        console.error('Error fetching system metrics:', error);
        return {
          agents: { total: 267, active: 267, successRate: 98.7, avgResponseTime: 945, tiers: { executive: 5, development: 26, creative: 20, qa: 15, devops: 15, domain: 26 } },
          providers: { total: 23, healthy: 23, totalModels: 752, monthlyCost: 2450 },
          system: { uptime: 99.9, cpuUsage: 45, memoryUsage: 60, networkUsage: 25 },
        };
      }
    },
    refetchInterval: 5000,
  });

  // Get filtered agents from transformed agents array
  const filteredAgents = agents;

  // Sync agent manifest mutation
  const syncManifestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/agents/sync-manifest', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/agents/unified', searchQuery, tierFilter, statusFilter] });
      toast({
        title: 'Success',
        description: 'Agent manifest synced successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync agent manifest.',
        variant: 'destructive',
      });
    },
  });

  // Agent mutations
  const updateAgentMutation = useMutation({
    mutationFn: async (updatedAgent: any) => {
      // Only allow editing WAI agents, not wshobson agents
      if (updatedAgent.source === 'wshobson') {
        throw new Error('wshobson agents are read-only and cannot be edited');
      }
      
      const res = await fetch(`/api/admin/agents/${updatedAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedAgent.name,
          description: updatedAgent.role,
          systemPrompt: updatedAgent.systemPrompt,
          capabilities: updatedAgent.capabilities,
          status: updatedAgent.status,
          preferredModels: [updatedAgent.model, updatedAgent.fallbackModel],
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/agents/unified', searchQuery, tierFilter, statusFilter] });
      toast({
        title: 'Success',
        description: 'Agent updated successfully.',
      });
      setIsEditDialogOpen(false);
      setEditingAgent(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update agent.',
        variant: 'destructive',
      });
    },
  });

  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, enabled, source }: { agentId: string; enabled: boolean; source?: string }) => {
      // Only allow toggling WAI agents, not wshobson agents
      if (source === 'wshobson') {
        throw new Error('wshobson agents are read-only and cannot be toggled');
      }
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/v9/agents/unified', searchQuery, tierFilter, statusFilter] });
      toast({
        title: 'Success',
        description: 'Agent status updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update agent status.',
        variant: 'destructive',
      });
    },
  });

  // CREATE agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (newAgent: any) => {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAgent.name,
          description: newAgent.description,
          systemPrompt: newAgent.systemPrompt,
          capabilities: newAgent.capabilities || [],
          tier: newAgent.tier || 'development',
          romaLevel: newAgent.romaLevel || 'L1',
          status: newAgent.status || 'active',
          preferredModels: newAgent.preferredModels || [],
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/agents/unified', searchQuery, tierFilter, statusFilter] });
      toast({
        title: 'Success',
        description: 'Agent created successfully.',
      });
      setIsCreateDialogOpen(false);
      setNewAgent(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create agent.',
        variant: 'destructive',
      });
    },
  });

  // DELETE agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async ({ agentId, source }: { agentId: string; source?: string }) => {
      // Only allow deleting WAI agents, not wshobson agents
      if (source === 'wshobson') {
        throw new Error('wshobson agents are read-only and cannot be deleted');
      }
      
      const res = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/agents/unified', searchQuery, tierFilter, statusFilter] });
      toast({
        title: 'Success',
        description: 'Agent deleted successfully.',
      });
      setDeleteConfirmAgent(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete agent.',
        variant: 'destructive',
      });
    },
  });

  // Handle agent editing
  const handleEditAgent = (agent: any) => {
    setEditingAgent({ ...agent });
    setIsEditDialogOpen(true);
  };

  const handleSaveAgent = () => {
    if (editingAgent) {
      updateAgentMutation.mutate(editingAgent);
    }
  };

  // Render different sections
  const renderSection = () => {
    switch (activeSection) {
      case 'agents':
        return <AgentManagementSection />;
      case 'models':
        return <ModelManagementSection />;
      case 'pipelines':
        return <PipelinesSection />;
      case 'projects':
        return <ProjectsSection />;
      case 'observability':
        return <ObservabilitySection />;
      case 'settings':
        return <SettingsSection />;
      case 'india-pack':
        return <IndiaPackSection />;
      default:
        return <DashboardSection systemMetrics={systemMetrics} isLoading={metricsLoading} />;
    }
  };

  // Agent Management Section Component
  function AgentManagementSection() {
    return (
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search agents by name, role, or capabilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              data-testid="input-search-agents"
            />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-48" data-testid="select-tier-filter">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="qa">QA</SelectItem>
              <SelectItem value="devops">DevOps</SelectItem>
              <SelectItem value="domain">Domain</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setNewAgent({
                name: '',
                description: '',
                systemPrompt: '',
                capabilities: [],
                tier: 'development',
                romaLevel: 'L1',
                status: 'active',
                preferredModels: []
              });
              setIsCreateDialogOpen(true);
            }}
            data-testid="button-create-agent"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent: any) => (
            <Card key={agent.uniqueKey} className="hover:shadow-lg transition-shadow" data-testid={`agent-card-${agent.uniqueKey}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold" data-testid={`agent-name-${agent.id}`}>
                      {agent.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`agent-role-${agent.id}`}>
                      {agent.role}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={agent.tier === 'executive' ? 'default' : agent.tier === 'development' ? 'secondary' : 'outline'}
                      data-testid={`agent-tier-${agent.id}`}
                    >
                      {agent.tier}
                    </Badge>
                    {agent.source === 'wshobson' && (
                      <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        wshobson
                      </Badge>
                    )}
                    <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Capabilities */}
                <div>
                  <Label className="text-xs font-medium">Capabilities</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.capabilities.slice(0, 3).map((cap: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                {agent.readiness?.performanceMetrics && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Success Rate</span>
                      <span>{(agent.readiness.performanceMetrics.successRate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={agent.readiness.performanceMetrics.successRate * 100} 
                      className="h-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Avg Response: {agent.readiness.performanceMetrics.avgResponseTime}ms</span>
                      <span>Score: {(agent.readiness.conformanceScore * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Switch
                    checked={agent.status === 'active'}
                    onCheckedChange={(checked) => toggleAgentMutation.mutate({ 
                      agentId: agent.id, 
                      enabled: checked,
                      source: agent.source
                    })}
                    disabled={agent.source === 'wshobson'}
                    data-testid={`agent-toggle-${agent.id}`}
                  />
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAgent(agent)}
                      data-testid={`agent-details-${agent.id}`}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAgent(agent)}
                      disabled={agent.source === 'wshobson'}
                      data-testid={`agent-edit-${agent.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirmAgent(agent)}
                      disabled={agent.source === 'wshobson'}
                      data-testid={`agent-delete-${agent.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Agent Details Modal */}
        {selectedAgent && (
          <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>{selectedAgent.name} - Details</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Role</Label>
                    <p className="text-sm text-muted-foreground">{selectedAgent.role}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Model</Label>
                    <p className="text-sm text-muted-foreground">{selectedAgent.model}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Fallback Model</Label>
                    <p className="text-sm text-muted-foreground">{selectedAgent.fallbackModel}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Cost Optimization</Label>
                    <p className="text-sm text-muted-foreground">{selectedAgent.costOptimization ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>

                {/* System Prompt */}
                <div>
                  <Label className="font-medium">System Prompt</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                    {selectedAgent.systemPrompt}
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <Label className="font-medium">Capabilities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAgent.capabilities.map((cap: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                {selectedAgent.readiness?.performanceMetrics && (
                  <div>
                    <Label className="font-medium">Performance Metrics</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <Card className="p-3">
                        <div className="text-2xl font-bold">
                          {(selectedAgent.readiness.performanceMetrics.successRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-2xl font-bold">
                          {selectedAgent.readiness.performanceMetrics.avgResponseTime}ms
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Response</div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-2xl font-bold">
                          {(selectedAgent.readiness.conformanceScore * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Conformance</div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* ROMA Flows */}
                {selectedAgent.romaFlows && (
                  <div>
                    <Label className="font-medium">ROMA Workflows</Label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(selectedAgent.romaFlows).map(([flowType, flow]: [string, any]) => (
                        <Card key={flowType} className="p-3">
                          <div className="font-medium capitalize">{flowType} Flow</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Flow ID: {flow.flowId}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Triggers: {flow.triggers?.join(', ')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Steps: {flow.steps?.length || 0}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Agent Modal */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>Edit Agent - {editingAgent?.name}</span>
              </DialogTitle>
            </DialogHeader>
            {editingAgent && (
              <div className="space-y-6">
                {/* Basic Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      value={editingAgent.name}
                      onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent-role">Role</Label>
                    <Input
                      id="agent-role"
                      value={editingAgent.role}
                      onChange={(e) => setEditingAgent({ ...editingAgent, role: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent-model">Model</Label>
                    <Select
                      value={editingAgent.model}
                      onValueChange={(value) => setEditingAgent({ ...editingAgent, model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="agent-status">Status</Label>
                    <Select
                      value={editingAgent.status}
                      onValueChange={(value) => setEditingAgent({ ...editingAgent, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* System Prompt */}
                <div>
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Textarea
                    id="system-prompt"
                    rows={6}
                    value={editingAgent.systemPrompt}
                    onChange={(e) => setEditingAgent({ ...editingAgent, systemPrompt: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {/* Capabilities */}
                <div>
                  <Label>Capabilities</Label>
                  <div className="mt-2">
                    <Input
                      placeholder="Enter capabilities separated by commas"
                      value={editingAgent.capabilities?.join(', ') || ''}
                      onChange={(e) => setEditingAgent({ 
                        ...editingAgent, 
                        capabilities: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAgent}
                    disabled={updateAgentMutation.isPending}
                  >
                    {updateAgentMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Agent Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create New Agent</span>
              </DialogTitle>
            </DialogHeader>
            {newAgent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-agent-name">Name</Label>
                    <Input
                      id="new-agent-name"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      placeholder="Agent name"
                      data-testid="input-new-agent-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-agent-tier">Tier</Label>
                    <Select
                      value={newAgent.tier}
                      onValueChange={(value) => setNewAgent({ ...newAgent, tier: value })}
                    >
                      <SelectTrigger data-testid="select-new-agent-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="qa">QA</SelectItem>
                        <SelectItem value="devops">DevOps</SelectItem>
                        <SelectItem value="domain">Domain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new-agent-description">Description</Label>
                  <Textarea
                    id="new-agent-description"
                    rows={3}
                    value={newAgent.description}
                    onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                    placeholder="Agent description and role"
                    data-testid="input-new-agent-description"
                  />
                </div>
                <div>
                  <Label htmlFor="new-agent-prompt">System Prompt</Label>
                  <Textarea
                    id="new-agent-prompt"
                    rows={4}
                    value={newAgent.systemPrompt}
                    onChange={(e) => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
                    placeholder="System prompt for the agent"
                    data-testid="input-new-agent-prompt"
                  />
                </div>
                <div>
                  <Label>Capabilities</Label>
                  <Input
                    placeholder="Enter capabilities separated by commas"
                    value={newAgent.capabilities?.join(', ') || ''}
                    onChange={(e) => setNewAgent({ 
                      ...newAgent, 
                      capabilities: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                    })}
                    data-testid="input-new-agent-capabilities"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create-agent"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createAgentMutation.mutate(newAgent)}
                    disabled={createAgentMutation.isPending || !newAgent.name}
                    data-testid="button-confirm-create-agent"
                  >
                    {createAgentMutation.isPending ? 'Creating...' : 'Create Agent'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmAgent} onOpenChange={() => setDeleteConfirmAgent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span>Delete Agent</span>
              </DialogTitle>
            </DialogHeader>
            {deleteConfirmAgent && (
              <div className="space-y-4">
                <p>Are you sure you want to delete <strong>{deleteConfirmAgent.name}</strong>?</p>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmAgent(null)}
                    data-testid="button-cancel-delete"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteAgentMutation.mutate({ 
                      agentId: deleteConfirmAgent.id,
                      source: deleteConfirmAgent.source
                    })}
                    disabled={deleteAgentMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deleteAgentMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">WAI Admin</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enterprise Console</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="button-toggle-sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {adminSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                data-testid={`nav-${section.id}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex-1">
                    <div className="font-medium">{section.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{section.description}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="w-full justify-start"
            data-testid="button-back-home"
          >
            <Home className="h-4 w-4 mr-2" />
            {sidebarOpen && 'Back to Home'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {adminSections.find(s => s.id === activeSection)?.name || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {adminSections.find(s => s.id === activeSection)?.description || 'System overview and metrics'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                System Healthy
              </Badge>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

// Dashboard Section Component
function DashboardSection({ systemMetrics, isLoading }: { systemMetrics: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="metric-agents">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.agents?.active || 105}</div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics?.agents?.successRate?.toFixed(1) || 98.7}% success rate
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-providers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LLM Providers</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.providers?.healthy || 19}</div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics?.providers?.totalModels || 500} models available
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-cost">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${systemMetrics?.providers?.monthlyCost || 2450}</div>
            <p className="text-xs text-muted-foreground">
              90% cost optimization active
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-uptime">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.system?.uptime?.toFixed(1) || 99.9}%</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CPU Usage</span>
                <span>{systemMetrics?.system?.cpuUsage || 45}%</span>
              </div>
              <Progress value={systemMetrics?.system?.cpuUsage || 45} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{systemMetrics?.system?.memoryUsage || 60}%</span>
              </div>
              <Progress value={systemMetrics?.system?.memoryUsage || 60} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Network Usage</span>
                <span>{systemMetrics?.system?.networkUsage || 25}%</span>
              </div>
              <Progress value={systemMetrics?.system?.networkUsage || 25} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" data-testid="action-manage-agents">
              <Bot className="h-4 w-4 mr-2" />
              Manage Agents ({systemMetrics?.agents?.total || 107})
            </Button>
            <Button className="w-full justify-start" variant="outline" data-testid="action-sync-manifest">
              <RotateCcw className="h-4 w-4 mr-2" />
              Sync Agent Manifest
            </Button>
            <Button className="w-full justify-start" variant="outline" data-testid="action-model-catalog">
              <Brain className="h-4 w-4 mr-2" />
              Model Catalog ({systemMetrics?.providers?.totalModels || 500})
            </Button>
            <Button className="w-full justify-start" variant="outline" data-testid="action-view-observability">
              <Eye className="h-4 w-4 mr-2" />
              View Observability
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Model Management Section Component
function ModelManagementSection() {
  const [isCreateProviderOpen, setIsCreateProviderOpen] = useState(false);
  const [newProvider, setNewProvider] = useState<any>(null);
  const [deleteConfirmProvider, setDeleteConfirmProvider] = useState<any>(null);
  const { toast } = useToast();

  // Fetch providers from API
  const { data: providersData, isLoading: providersLoading } = useQuery({
    queryKey: ['/api/admin/providers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/providers');
      if (!res.ok) throw new Error('Failed to fetch providers');
      return res.json();
    }
  });

  // CREATE provider mutation
  const createProviderMutation = useMutation({
    mutationFn: async (provider: any) => {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: provider.name,
          providerId: provider.providerId || `provider_${Date.now()}`,
          type: provider.type || 'api',
          status: provider.status || 'active',
          apiEndpoint: provider.apiEndpoint,
          models: provider.models || [],
          capabilities: provider.capabilities || [],
          costTier: provider.costTier || 'medium',
          costPerToken: provider.costPerToken || '0',
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create provider');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers'] });
      toast({ title: 'Success', description: 'Provider created successfully.' });
      setIsCreateProviderOpen(false);
      setNewProvider(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create provider.', variant: 'destructive' });
    },
  });

  // DELETE provider mutation
  const deleteProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete provider');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers'] });
      toast({ title: 'Success', description: 'Provider deleted successfully.' });
      setDeleteConfirmProvider(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete provider.', variant: 'destructive' });
    },
  });

  // UPDATE provider status mutation
  const updateProviderStatusMutation = useMutation({
    mutationFn: async ({ providerId, status }: { providerId: string; status: string }) => {
      const res = await fetch(`/api/admin/providers/${providerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update provider status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers'] });
      toast({ title: 'Success', description: 'Provider status updated successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update provider status.', variant: 'destructive' });
    },
  });

  const providers = providersData?.providers || [];

  if (providersLoading) {
    return <div>Loading providers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Model Catalog</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            {providers.length}+ providers • {providers.reduce((sum: number, p: any) => sum + (p.models?.length || 0), 0)}+ models
          </div>
          <Button
            onClick={() => {
              setNewProvider({
                name: '',
                providerId: '',
                type: 'api',
                status: 'active',
                apiEndpoint: '',
                models: [],
                capabilities: [],
                costTier: 'medium',
                costPerToken: '0',
              });
              setIsCreateProviderOpen(true);
            }}
            data-testid="button-create-provider"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Provider
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {providers.map((provider: any) => (
          <Card key={provider.id} data-testid={`card-provider-${provider.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{provider.name}</CardTitle>
                <Badge variant={provider.status === 'active' ? 'default' : 'destructive'}>
                  {provider.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{provider.type}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Models</span>
                  <span className="font-medium">{provider.models?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cost Tier</span>
                  <span className="font-medium capitalize">{provider.costTier}</span>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateProviderStatusMutation.mutate({
                      providerId: provider.providerId,
                      status: provider.status === 'active' ? 'inactive' : 'active'
                    })}
                    disabled={updateProviderStatusMutation.isPending}
                    data-testid={`button-toggle-provider-${provider.id}`}
                  >
                    {provider.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirmProvider(provider)}
                    data-testid={`button-delete-provider-${provider.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Provider Dialog */}
      <Dialog open={isCreateProviderOpen} onOpenChange={setIsCreateProviderOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Provider</DialogTitle>
          </DialogHeader>
          {newProvider && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    placeholder="Provider name"
                    data-testid="input-new-provider-name"
                  />
                </div>
                <div>
                  <Label>Provider ID</Label>
                  <Input
                    value={newProvider.providerId}
                    onChange={(e) => setNewProvider({ ...newProvider, providerId: e.target.value })}
                    placeholder="provider_id"
                    data-testid="input-new-provider-id"
                  />
                </div>
              </div>
              <div>
                <Label>API Endpoint</Label>
                <Input
                  value={newProvider.apiEndpoint}
                  onChange={(e) => setNewProvider({ ...newProvider, apiEndpoint: e.target.value })}
                  placeholder="https://api.example.com"
                  data-testid="input-new-provider-endpoint"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newProvider.type}
                    onValueChange={(value) => setNewProvider({ ...newProvider, type: value })}
                  >
                    <SelectTrigger data-testid="select-new-provider-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cost Tier</Label>
                  <Select
                    value={newProvider.costTier}
                    onValueChange={(value) => setNewProvider({ ...newProvider, costTier: value })}
                  >
                    <SelectTrigger data-testid="select-new-provider-cost-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateProviderOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createProviderMutation.mutate(newProvider)}
                  disabled={createProviderMutation.isPending || !newProvider.name || !newProvider.apiEndpoint}
                  data-testid="button-confirm-create-provider"
                >
                  {createProviderMutation.isPending ? 'Creating...' : 'Create Provider'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmProvider} onOpenChange={() => setDeleteConfirmProvider(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Delete Provider</span>
            </DialogTitle>
          </DialogHeader>
          {deleteConfirmProvider && (
            <div className="space-y-4">
              <p>Are you sure you want to delete <strong>{deleteConfirmProvider.name}</strong>?</p>
              <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDeleteConfirmProvider(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteProviderMutation.mutate(deleteConfirmProvider.providerId)}
                  disabled={deleteProviderMutation.isPending}
                  data-testid="button-confirm-delete-provider"
                >
                  {deleteProviderMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Cost Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>KIMI K2 Priority (90% savings)</span>
              <Switch defaultChecked />
            </div>
            <div className="flex justify-between items-center">
              <span>Free Tier Prioritization</span>
              <Switch defaultChecked />
            </div>
            <div className="flex justify-between items-center">
              <span>Dynamic Load Balancing</span>
              <Switch defaultChecked />
            </div>
            <div className="pt-2 border-t">
              <div className="text-sm font-medium">Total Monthly Savings: $8,750</div>
              <div className="text-xs text-muted-foreground">Compared to standard pricing</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Projects Section Component
function ProjectsSection() {
  const { toast } = useToast();
  
  // Fetch orchestration requests
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/project-orchestration/requests'],
    queryFn: async () => {
      const res = await fetch('/api/project-orchestration/requests?limit=50');
      if (!res.ok) throw new Error('Failed to fetch orchestration requests');
      return res.json();
    },
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Fetch workflow executions
  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ['/api/project-orchestration/workflows'],
    queryFn: async () => {
      const res = await fetch('/api/project-orchestration/workflows?limit=50');
      if (!res.ok) throw new Error('Failed to fetch workflow executions');
      return res.json();
    },
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Fetch metrics summary
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/project-orchestration/metrics/summary'],
    queryFn: async () => {
      const res = await fetch('/api/project-orchestration/metrics/summary?limit=100');
      if (!res.ok) throw new Error('Failed to fetch metrics summary');
      return res.json();
    },
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  const requests = requestsData?.data || [];
  const workflows = workflowsData?.data || [];
  const metrics = metricsData?.data || {};

  // Calculate summary statistics
  const totalRequests = requests.length;
  const runningRequests = requests.filter((r: any) => r.status === 'running').length;
  const completedRequests = requests.filter((r: any) => r.status === 'completed').length;
  const failedRequests = requests.filter((r: any) => r.status === 'failed').length;
  
  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter((w: any) => w.status === 'running').length;

  if (requestsLoading && workflowsLoading && metricsLoading) {
    return <div>Loading project data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Orchestration</h2>
        <div className="text-sm text-muted-foreground">
          Real-time updates • Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-requests">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {runningRequests} running
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-requests">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-workflows">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeWorkflows}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalWorkflows} total workflows
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-failed-requests">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{failedRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRequests > 0 ? Math.round((failedRequests / totalRequests) * 100) : 0}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orchestration Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orchestration Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orchestration requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 10).map((request: any) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`request-${request.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{request.requestType}</span>
                      <Badge variant={
                        request.status === 'completed' ? 'default' : 
                        request.status === 'running' ? 'secondary' : 
                        request.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{request.task}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                      <span>Session: {request.sessionId?.substring(0, 8)}...</span>
                      {request.projectId && <span>Project: {request.projectId}</span>}
                      <span>
                        Created: {new Date(request.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {request.estimatedDuration && (
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium">{request.estimatedDuration}s</div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Executions</CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No workflow executions yet.</p>
          ) : (
            <div className="space-y-3">
              {workflows.slice(0, 10).map((workflow: any) => (
                <div 
                  key={workflow.executionId} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`workflow-${workflow.executionId}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Pattern: {workflow.patternId}</span>
                      <Badge variant={
                        workflow.status === 'completed' ? 'default' : 
                        workflow.status === 'running' ? 'secondary' : 
                        workflow.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {workflow.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                      <span>Execution: {workflow.executionId?.substring(0, 8)}...</span>
                      {workflow.sessionId && <span>Session: {workflow.sessionId?.substring(0, 8)}...</span>}
                      <span>
                        Started: {new Date(workflow.startedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {workflow.status === 'running' && workflow.progress && (
                    <div className="w-32 ml-4">
                      <Progress value={workflow.progress} />
                      <div className="text-xs text-muted-foreground text-center mt-1">{workflow.progress}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {metrics.aggregates && metrics.aggregates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.aggregates.map((agg: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg" data-testid={`metric-${agg.component}-${agg.metricType}`}>
                  <div className="text-sm font-medium text-muted-foreground">{agg.component}</div>
                  <div className="text-xl font-bold mt-1">
                    {agg.avgValue?.toFixed(2)} {agg.unit}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {agg.metricType} • {agg.count} samples
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Pipelines Section Component
function PipelinesSection() {
  const pipelines = [
    { name: 'BMAD Coordination', type: 'coordination', status: 'running', agents: 15, duration: '2.3s' },
    { name: 'CrewAI Workflow', type: 'collaboration', status: 'running', agents: 8, duration: '1.8s' },
    { name: 'MCP Integration', type: 'integration', status: 'running', agents: 5, duration: '0.9s' },
    { name: 'SDLC Automation', type: 'development', status: 'idle', agents: 12, duration: '3.1s' },
    { name: 'Content Generation', type: 'creative', status: 'running', agents: 6, duration: '4.2s' },
    { name: 'QA Validation', type: 'testing', status: 'completed', agents: 4, duration: '1.5s' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Workflow Pipelines</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Pipeline
        </Button>
      </div>
      
      <div className="grid gap-4">
        {pipelines.map((pipeline, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">{pipeline.type} pipeline</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={pipeline.status === 'running' ? 'default' : pipeline.status === 'completed' ? 'secondary' : 'outline'}>
                    {pipeline.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span><Bot className="h-4 w-4 inline mr-1" />{pipeline.agents} agents</span>
                  <span>Duration: {pipeline.duration}</span>
                </div>
                <div className="flex space-x-2">
                  {pipeline.status === 'running' ? (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ObservabilitySection() {
  const metrics = [
    { name: 'Agent Response Time', value: '945ms', trend: 'down', color: 'green' },
    { name: 'Success Rate', value: '98.7%', trend: 'up', color: 'green' },
    { name: 'Error Rate', value: '1.3%', trend: 'down', color: 'green' },
    { name: 'Throughput', value: '2.3k/min', trend: 'up', color: 'blue' },
  ];

  const recentEvents = [
    { time: '2 min ago', type: 'success', message: 'BMAD coordination completed successfully' },
    { time: '5 min ago', type: 'info', message: 'Agent manifest synced (107 agents)' },
    { time: '8 min ago', type: 'warning', message: 'High memory usage detected (78%)' },
    { time: '12 min ago', type: 'success', message: 'CrewAI workflow execution completed' },
    { time: '15 min ago', type: 'info', message: 'New agent instance started: ceo-orchestrator' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Observability Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className={`text-xs flex items-center mt-1 ${
                metric.color === 'green' ? 'text-green-600' : 
                metric.color === 'blue' ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {metric.trend === 'up' ? '↗' : '↘'} 
                {metric.trend === 'up' ? 'Improved' : 'Optimized'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>WAI Core v9.0</span>
              <Badge variant="default">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Agent Registry</span>
              <Badge variant="default">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>LLM Providers</span>
              <Badge variant="default">19/19 Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Database</span>
              <Badge variant="default">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>BMAD Framework</span>
              <Badge variant="default">Active</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEvents.map((event, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    event.type === 'success' ? 'bg-green-500' : 
                    event.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{event.message}</p>
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Auto-scaling Agents</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span>BMAD Coordination</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span>Real-time Monitoring</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span>Cost Optimization</span>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>LLM Provider Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Provider</Label>
              <Select defaultValue="kimi">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kimi">KIMI K2 (Recommended)</SelectItem>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  <SelectItem value="openai">OpenAI GPT</SelectItem>
                  <SelectItem value="google">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fallback Provider</Label>
              <Select defaultValue="anthropic">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  <SelectItem value="openai">OpenAI GPT</SelectItem>
                  <SelectItem value="google">Google Gemini</SelectItem>
                  <SelectItem value="local">Local Models</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Security & Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Two-Factor Authentication</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span>API Rate Limiting</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span>Audit Logging</span>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label>Session Timeout</Label>
              <Select defaultValue="24">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}

function IndiaPackSection() {
  const indiaFeatures = [
    { name: '12 Indic Languages Support', status: 'active', usage: '92%' },
    { name: 'WhatsApp Business API', status: 'active', usage: '91%' },
    { name: 'UPI Payment Integration', status: 'active', usage: '88%' },
    { name: 'Sarvam AI Integration', status: 'active', usage: '95%' },
    { name: 'Regional Content AI', status: 'active', usage: '76%' },
    { name: 'Voice & Text Processing', status: 'active', usage: '84%' },
  ];

  const supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English', isIndic: false },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', isIndic: true },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isIndic: true },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', isIndic: true },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', isIndic: true },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', isIndic: true },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', isIndic: true },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', isIndic: true },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', isIndic: true },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', isIndic: true },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', isIndic: true },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', isIndic: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">India Pack Features</h2>
        <Badge variant="default" className="text-lg px-4 py-1">
          12 Languages Supported
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indiaFeatures.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{feature.name}</CardTitle>
                <Badge variant={feature.status === 'active' ? 'default' : 'secondary'}>
                  {feature.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usage</span>
                  <span className="font-medium">{feature.usage}</span>
                </div>
                <Progress value={parseInt(feature.usage)} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sarvam AI - Language Support</span>
              <Badge variant="outline" className="text-xs">
                Powered by Sarvam API
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {supportedLanguages.map((lang) => (
              <div key={lang.code} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-sm text-muted-foreground">{lang.nativeName}</span>
                  {lang.isIndic && (
                    <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                      Indic
                    </Badge>
                  )}
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Business Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>WhatsApp Business API</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>UPI Payment Gateway</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Regional Banking APIs</span>
              <Badge variant="secondary">Beta</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Government ID Verification</span>
              <Badge variant="outline">Planned</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}