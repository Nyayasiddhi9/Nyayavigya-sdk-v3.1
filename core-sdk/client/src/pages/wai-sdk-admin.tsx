import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Bot, Settings, Zap, Database, BarChart3, Shield, Plus, Search, Edit, Save, Check, X, Cpu, Globe, Users, Activity, TrendingUp, Clock, AlertCircle, ChevronRight, Code, MessageSquare, Workflow, Brain, Sparkles, Key, FileText, Download, Copy, Eye, EyeOff, Trash2, ToggleLeft, BookOpen, Layers } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import EnhancedAgentConfigPanel from '@/components/admin/EnhancedAgentConfigPanel';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export default function WaiSdkAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [showCreateAgent, setShowCreateAgent] = useState(false);

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/wai-admin/dashboard'],
    refetchInterval: 30000
  });

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/wai-admin/agents'],
    enabled: activeTab === 'agents'
  });

  const { data: providersData, isLoading: providersLoading } = useQuery({
    queryKey: ['/api/wai-admin/providers'],
    enabled: activeTab === 'providers'
  });

  const { data: toolsData, isLoading: toolsLoading } = useQuery({
    queryKey: ['/api/wai-admin/tools'],
    enabled: activeTab === 'tools'
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/wai-admin/analytics/tokens', { groupBy: 'provider' }],
    enabled: activeTab === 'analytics'
  });

  const { data: promptTemplates } = useQuery({
    queryKey: ['/api/wai-admin/system-prompts/templates'],
    enabled: activeTab === 'create-agent'
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/wai-admin/settings'],
    enabled: activeTab === 'settings'
  });

  const { data: apiClientsData, isLoading: apiClientsLoading } = useQuery({
    queryKey: ['/api/wai-admin/api-gateway/clients'],
    enabled: activeTab === 'api-gateway'
  });

  const { data: documentationData } = useQuery({
    queryKey: ['/api/wai-admin/documentation'],
    enabled: activeTab === 'documentation'
  });

  const { data: guidesData } = useQuery({
    queryKey: ['/api/wai-admin/guides'],
    enabled: activeTab === 'documentation'
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ agentId, data }: { agentId: string; data: any }) =>
      apiRequest(`/api/wai-admin/agents/${agentId}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wai-admin/agents'] });
      toast({ title: 'Agent Updated', description: 'Agent configuration saved successfully.' });
      setSelectedAgent(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateProviderMutation = useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: any }) =>
      apiRequest(`/api/wai-admin/providers/${providerId}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wai-admin/providers'] });
      toast({ title: 'Provider Updated', description: 'Provider configuration saved.' });
    }
  });

  const updateToolMutation = useMutation({
    mutationFn: ({ toolId, data }: { toolId: string; data: any }) =>
      apiRequest(`/api/wai-admin/tools/${toolId}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wai-admin/tools'] });
      toast({ title: 'Tool Updated', description: 'Tool configuration saved.' });
    }
  });

  const createAgentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/wai-admin/agents/custom', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wai-admin/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wai-admin/dashboard'] });
      toast({ title: 'Agent Created', description: 'Custom agent created successfully.' });
      setShowCreateAgent(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const dashboard = dashboardData?.data || { agents: { total: 267 }, tools: { total: 532 }, providers: { total: 17 } };
  const agents = agentsData?.data || [];
  const providers = providersData?.data || [];
  const tools = toolsData?.data || [];
  const analytics = analyticsData?.data || { totals: {}, breakdown: [] };
  const templates = promptTemplates?.data || [];
  const settings = settingsData?.data || [];
  const apiClients = apiClientsData?.data || [];
  const documentation = documentationData?.data || {};
  const guides = guidesData?.data || [];

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      apiRequest(`/api/wai-admin/settings/${key}`, 'PATCH', { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wai-admin/settings'] });
      toast({ title: 'Setting Updated', description: 'Platform setting saved successfully.' });
    }
  });

  const createApiClientMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/wai-admin/api-gateway/clients', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wai-admin/api-gateway/clients'] });
      toast({ title: 'Client Created', description: 'API client created successfully.' });
    }
  });

  const generateApiKeyMutation = useMutation({
    mutationFn: ({ clientId, keyName, expiresInDays }: { clientId: string; keyName: string; expiresInDays: number | null }) =>
      apiRequest(`/api/wai-admin/api-gateway/clients/${clientId}/keys`, 'POST', { keyName, expiresInDays }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/wai-admin/api-gateway/clients'] });
      toast({
        title: 'API Key Generated',
        description: `Key: ${data?.data?.rawKey?.substring(0, 20)}... (copy it now, it won\'t be shown again)`,
      });
    }
  });

  const filteredAgents = agents.filter((a: any) =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTools = tools.filter((t: any) =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white" data-testid="text-page-title">
              WAI SDK v1.0 Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Comprehensive platform management for agents, providers, tools, and analytics
            </p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1" data-testid="badge-version">
            v1.0.0 Production
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <TabsList className="flex flex-wrap gap-1" data-testid="tabs-navigation">
              <TabsTrigger value="overview" data-testid="tab-overview" className="px-3 py-2">
                <Activity className="w-4 h-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="agents" data-testid="tab-agents" className="px-3 py-2">
                <Bot className="w-4 h-4 mr-1" />
                Agents
              </TabsTrigger>
              <TabsTrigger value="providers" data-testid="tab-providers" className="px-3 py-2">
                <Cpu className="w-4 h-4 mr-1" />
                Providers
              </TabsTrigger>
              <TabsTrigger value="tools" data-testid="tab-tools" className="px-3 py-2">
                <Settings className="w-4 h-4 mr-1" />
                MCP Tools
              </TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics" className="px-3 py-2">
                <BarChart3 className="w-4 h-4 mr-1" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings" className="px-3 py-2">
                <ToggleLeft className="w-4 h-4 mr-1" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="api-gateway" data-testid="tab-api-gateway" className="px-3 py-2">
                <Key className="w-4 h-4 mr-1" />
                API Gateway
              </TabsTrigger>
              <TabsTrigger value="documentation" data-testid="tab-documentation" className="px-3 py-2">
                <BookOpen className="w-4 h-4 mr-1" />
                Docs
              </TabsTrigger>
              <TabsTrigger value="create-agent" data-testid="tab-create-agent" className="px-3 py-2">
                <Plus className="w-4 h-4 mr-1" />
                Create Agent
              </TabsTrigger>
              <TabsTrigger value="enhanced-config" data-testid="tab-enhanced-config" className="px-3 py-2">
                <Layers className="w-4 h-4 mr-1" />
                Enhanced Config
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card data-testid="card-agents-summary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                  <Bot className="w-4 h-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboard.agents?.total || 267}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboard.agents?.enabled || 267} active, {dashboard.agents?.configured || 0} configured
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-providers-summary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">LLM Providers</CardTitle>
                  <Cpu className="w-4 h-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboard.providers?.total || 17}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboard.providers?.enabled || 17} enabled, {dashboard.providers?.healthy || 14} healthy
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-tools-summary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">MCP Tools</CardTitle>
                  <Settings className="w-4 h-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboard.tools?.total || 532}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {dashboard.tools?.categories || 26} categories
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-usage-summary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Token Usage (30d)</CardTitle>
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Number(dashboard.usage?.totalTokens || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${Number(dashboard.usage?.totalCost || 0).toFixed(2)} total cost
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-usage-chart">
                <CardHeader>
                  <CardTitle>Usage by Provider</CardTitle>
                  <CardDescription>Token distribution across LLM providers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboard.usageByProvider || []}
                          dataKey="totalTokens"
                          nameKey="providerId"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {(dashboard.usageByProvider || []).map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-agent-tiers">
                <CardHeader>
                  <CardTitle>Agent Distribution by Tier</CardTitle>
                  <CardDescription>267 agents across 6 specialized tiers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { tier: 'Executive', count: 34, color: 'bg-indigo-600' },
                      { tier: 'Development', count: 160, color: 'bg-green-600' },
                      { tier: 'Creative', count: 17, color: 'bg-pink-600' },
                      { tier: 'QA', count: 7, color: 'bg-amber-600' },
                      { tier: 'DevOps', count: 11, color: 'bg-cyan-600' },
                      { tier: 'Domain', count: 38, color: 'bg-purple-600' }
                    ].map((item) => (
                      <div key={item.tier} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium">{item.tier}</div>
                        <div className="flex-1">
                          <Progress value={(item.count / 267) * 100} className="h-2" />
                        </div>
                        <div className="w-12 text-sm text-right">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Agent Configuration Manager</CardTitle>
                    <CardDescription>Configure system prompts, behaviors, and tools for all 267 agents</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search agents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                        data-testid="input-search-agents"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {agentsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {filteredAgents.slice(0, 50).map((agent: any) => (
                        <div
                          key={agent.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setEditingPrompt(agent.config?.systemPrompt || '');
                          }}
                          data-testid={`card-agent-${agent.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">{agent.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{agent.tier || 'development'}</Badge>
                                <Badge variant="secondary" className="text-xs">{agent.romaLevel || 'L2'}</Badge>
                                {agent.hasCustomConfig && (
                                  <Badge className="text-xs bg-green-100 text-green-800">Configured</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Switch
                              checked={agent.config?.enabled ?? true}
                              onCheckedChange={(enabled) => {
                                updateAgentMutation.mutate({ agentId: agent.id, data: { enabled } });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`switch-agent-${agent.id}`}
                            />
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Configure Agent: {selectedAgent?.name}
                  </DialogTitle>
                  <DialogDescription>
                    Edit system prompt, behaviors, and collaboration settings
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div>
                    <Label>System Prompt</Label>
                    <Textarea
                      value={editingPrompt}
                      onChange={(e) => setEditingPrompt(e.target.value)}
                      className="mt-2 min-h-[300px] font-mono text-sm"
                      placeholder="Enter the system prompt for this agent..."
                      data-testid="textarea-system-prompt"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Communication Mode</Label>
                      <Select defaultValue={selectedAgent?.config?.communicationMode || 'standard'}>
                        <SelectTrigger className="mt-2" data-testid="select-communication-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="verbose">Verbose</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Collaboration Mode</Label>
                      <Select defaultValue={selectedAgent?.config?.collaborationMode || 'autonomous'}>
                        <SelectTrigger className="mt-2" data-testid="select-collaboration-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="autonomous">Autonomous</SelectItem>
                          <SelectItem value="swarm">Swarm</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="supervised">Supervised</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Preferred Provider</Label>
                      <Select defaultValue={selectedAgent?.config?.preferredProvider || ''}>
                        <SelectTrigger className="mt-2" data-testid="select-preferred-provider">
                          <SelectValue placeholder="Auto-select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Auto-select</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="groq">Groq</SelectItem>
                          <SelectItem value="deepseek">DeepSeek</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Max Tokens</Label>
                      <Input
                        type="number"
                        defaultValue={selectedAgent?.config?.maxTokens || 4096}
                        className="mt-2"
                        data-testid="input-max-tokens"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedAgent(null)} data-testid="button-cancel-agent">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      updateAgentMutation.mutate({
                        agentId: selectedAgent.id,
                        data: { systemPrompt: editingPrompt }
                      });
                    }}
                    disabled={updateAgentMutation.isPending}
                    data-testid="button-save-agent"
                  >
                    {updateAgentMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>LLM Provider Manager</CardTitle>
                <CardDescription>Enable/disable providers, configure defaults, and manage rate limits</CardDescription>
              </CardHeader>
              <CardContent>
                {providersLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {providers.map((provider: any) => (
                      <Card key={provider.id} className="relative" data-testid={`card-provider-${provider.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{provider.name}</CardTitle>
                            <Switch
                              checked={provider.enabled}
                              onCheckedChange={(enabled) => {
                                updateProviderMutation.mutate({ providerId: provider.id, data: { enabled } });
                              }}
                              data-testid={`switch-provider-${provider.id}`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={provider.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                              {provider.status || 'unknown'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Default Model</Label>
                            <Select
                              value={provider.defaultModel}
                              onValueChange={(model) => {
                                updateProviderMutation.mutate({ providerId: provider.id, data: { defaultModel: model } });
                              }}
                            >
                              <SelectTrigger className="mt-1" data-testid={`select-model-${provider.id}`}>
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent>
                                {provider.models?.map((model: string) => (
                                  <SelectItem key={model} value={model}>{model}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">Rate Limit (req/min)</Label>
                            <Input
                              type="number"
                              defaultValue={provider.config?.globalRateLimitPerMinute || 60}
                              className="mt-1"
                              onBlur={(e) => {
                                updateProviderMutation.mutate({
                                  providerId: provider.id,
                                  data: { globalRateLimitPerMinute: parseInt(e.target.value) }
                                });
                              }}
                              data-testid={`input-rate-limit-${provider.id}`}
                            />
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {provider.models?.length || 0} models available
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>MCP Tools Administration</CardTitle>
                    <CardDescription>Manage 532 tools across 26 categories</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tools..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-tools"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {toolsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredTools.slice(0, 100).map((tool: any) => (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                          data-testid={`card-tool-${tool.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{tool.name}</div>
                              <Badge variant="outline" className="text-xs">{tool.category}</Badge>
                            </div>
                          </div>
                          <Switch
                            checked={tool.enabled}
                            onCheckedChange={(enabled) => {
                              updateToolMutation.mutate({ toolId: tool.id, data: { enabled } });
                            }}
                            data-testid={`switch-tool-${tool.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card data-testid="card-total-tokens">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Number(analytics.totals?.totalTokens || 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-cost">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${Number(analytics.totals?.totalCost || 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-requests">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Number(analytics.totals?.totalRequests || 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-avg-latency">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg Latency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Number(analytics.totals?.avgLatency || 0).toFixed(0)}ms
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Token Usage by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.breakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="providerId" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalTokens" fill="#6366f1" name="Tokens" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ToggleLeft className="w-5 h-5" />
                  Platform Settings
                </CardTitle>
                <CardDescription>
                  Enable or disable platform features and configure global settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {['general', 'agents', 'providers', 'tools', 'security', 'memory', 'api'].map(category => {
                      const categorySettings = settings.filter((s: any) => s.category === category);
                      if (categorySettings.length === 0) return null;
                      return (
                        <div key={category} className="space-y-4">
                          <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                            {category === 'agents' && <Bot className="w-5 h-5" />}
                            {category === 'providers' && <Cpu className="w-5 h-5" />}
                            {category === 'tools' && <Settings className="w-5 h-5" />}
                            {category === 'security' && <Shield className="w-5 h-5" />}
                            {category === 'memory' && <Database className="w-5 h-5" />}
                            {category === 'api' && <Key className="w-5 h-5" />}
                            {category === 'general' && <Activity className="w-5 h-5" />}
                            {category}
                          </h3>
                          <div className="grid gap-4">
                            {categorySettings.map((setting: any) => (
                              <div key={setting.settingKey} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`setting-${setting.settingKey}`}>
                                <div className="flex-1">
                                  <div className="font-medium">{setting.settingName}</div>
                                  <div className="text-sm text-muted-foreground">{setting.description}</div>
                                </div>
                                <Switch
                                  checked={setting.settingValue === true || setting.settingValue === 'true'}
                                  onCheckedChange={(checked) => {
                                    updateSettingMutation.mutate({ key: setting.settingKey, value: checked });
                                  }}
                                  data-testid={`switch-${setting.settingKey}`}
                                />
                              </div>
                            ))}
                          </div>
                          <Separator />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Gateway Tab */}
          <TabsContent value="api-gateway" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      API Clients
                    </CardTitle>
                    <CardDescription>Manage external applications using WAI SDK APIs</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-client">
                        <Plus className="w-4 h-4 mr-2" />
                        New Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create API Client</DialogTitle>
                        <DialogDescription>Register a new application to access WAI SDK APIs</DialogDescription>
                      </DialogHeader>
                      <CreateApiClientForm onSave={(data) => createApiClientMutation.mutate(data)} isLoading={createApiClientMutation.isPending} />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {apiClientsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                  ) : apiClients.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No API clients yet. Create one to get started.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-4">
                        {apiClients.map((client: any) => (
                          <div key={client.id} className="border rounded-lg p-4" data-testid={`card-client-${client.clientId}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-medium">{client.clientName}</div>
                                <div className="text-sm text-muted-foreground">{client.clientDescription || 'No description'}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>{client.status}</Badge>
                                <Badge variant="outline">{client.environment}</Badge>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mb-3">
                              <span className="font-mono">ID: {client.clientId}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm mb-3">
                              <span>Rate Limits:</span>
                              <Badge variant="outline">{client.rateLimitPerMinute}/min</Badge>
                              <Badge variant="outline">{client.rateLimitPerHour}/hr</Badge>
                              <Badge variant="outline">{client.monthlyQuota} quota</Badge>
                            </div>
                            <div className="border-t pt-3 mt-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">API Keys ({client.apiKeys?.length || 0})</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateApiKeyMutation.mutate({
                                    clientId: client.clientId,
                                    keyName: `Key ${(client.apiKeys?.length || 0) + 1}`,
                                    expiresInDays: 90
                                  })}
                                  data-testid={`button-generate-key-${client.clientId}`}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Generate Key
                                </Button>
                              </div>
                              {client.apiKeys?.map((key: any) => (
                                <div key={key.keyId} className="flex items-center justify-between py-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{key.keyPrefix}...</code>
                                    <span>{key.keyName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>{key.status}</Badge>
                                    <span className="text-xs text-muted-foreground">Used: {key.usageCount || 0}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span>Total Clients</span>
                    <span className="font-bold">{apiClients.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span>Active Clients</span>
                    <span className="font-bold">{apiClients.filter((c: any) => c.status === 'active').length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span>Total API Keys</span>
                    <span className="font-bold">{apiClients.reduce((sum: number, c: any) => sum + (c.apiKeys?.length || 0), 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    API Documentation
                  </CardTitle>
                  <CardDescription>
                    {documentation.title} - {documentation.version}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Authentication</h4>
                      <p className="text-sm text-muted-foreground mb-2">{documentation.authentication?.description}</p>
                      <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-sm">
                        Header: {documentation.authentication?.header}
                      </code>
                    </div>

                    {documentation.endpoints?.map((group: any) => (
                      <div key={group.group} className="space-y-3">
                        <h4 className="font-semibold text-lg">{group.group}</h4>
                        <div className="space-y-2">
                          {group.endpoints?.map((endpoint: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={endpoint.method === 'GET' ? 'default' : endpoint.method === 'POST' ? 'secondary' : 'outline'}>
                                  {endpoint.method}
                                </Badge>
                                <code className="text-sm font-mono">{endpoint.path}</code>
                              </div>
                              <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                              {endpoint.request && (
                                <div className="mt-2 text-xs">
                                  <span className="font-medium">Request:</span>
                                  <code className="ml-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{endpoint.request}</code>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Rate Limits</h4>
                      <ul className="text-sm space-y-1">
                        <li>Default: {documentation.rateLimits?.default}</li>
                        <li>Burst: {documentation.rateLimits?.burst}</li>
                        <li>{documentation.rateLimits?.quotas}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Downloadable Guides
                  </CardTitle>
                  <CardDescription>Documentation and tutorials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {guides.map((guide: any) => (
                      <div key={guide.id} className="border rounded-lg p-3" data-testid={`guide-${guide.id}`}>
                        <div className="font-medium mb-1">{guide.title}</div>
                        <p className="text-sm text-muted-foreground mb-2">{guide.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{guide.format}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={guide.downloadUrl} download>
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="create-agent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Custom Agent Creator
                </CardTitle>
                <CardDescription>
                  Create a new agent with custom workflows, system prompts, behaviors, and collaboration modes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomAgentCreator
                  templates={templates}
                  tools={tools}
                  agents={agents}
                  onSave={(data) => createAgentMutation.mutate(data)}
                  isLoading={createAgentMutation.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enhanced-config" className="space-y-6">
            <EnhancedAgentConfigPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Create API Client Form Component
function CreateApiClientForm({ onSave, isLoading }: { onSave: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientDescription: '',
    clientType: 'application',
    environment: 'development',
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    monthlyQuota: 100000
  });

  const handleSubmit = () => {
    if (!formData.clientName) return;
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Client Name *</Label>
        <Input
          value={formData.clientName}
          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          placeholder="My Application"
          data-testid="input-client-name"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Input
          value={formData.clientDescription}
          onChange={(e) => setFormData({ ...formData, clientDescription: e.target.value })}
          placeholder="Description of the client application"
          data-testid="input-client-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select value={formData.clientType} onValueChange={(v) => setFormData({ ...formData, clientType: v })}>
            <SelectTrigger data-testid="select-client-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="application">Application</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Environment</Label>
          <Select value={formData.environment} onValueChange={(v) => setFormData({ ...formData, environment: v })}>
            <SelectTrigger data-testid="select-environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Rate/min</Label>
          <Input
            type="number"
            value={formData.rateLimitPerMinute}
            onChange={(e) => setFormData({ ...formData, rateLimitPerMinute: parseInt(e.target.value) || 60 })}
            data-testid="input-rate-minute"
          />
        </div>
        <div>
          <Label>Rate/hour</Label>
          <Input
            type="number"
            value={formData.rateLimitPerHour}
            onChange={(e) => setFormData({ ...formData, rateLimitPerHour: parseInt(e.target.value) || 1000 })}
            data-testid="input-rate-hour"
          />
        </div>
        <div>
          <Label>Monthly Quota</Label>
          <Input
            type="number"
            value={formData.monthlyQuota}
            onChange={(e) => setFormData({ ...formData, monthlyQuota: parseInt(e.target.value) || 100000 })}
            data-testid="input-monthly-quota"
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isLoading || !formData.clientName} data-testid="button-submit-client">
          {isLoading ? 'Creating...' : 'Create Client'}
        </Button>
      </DialogFooter>
    </div>
  );
}

function CustomAgentCreator({ templates, tools, agents, onSave, isLoading }: {
  templates: any[];
  tools: any[];
  agents: any[];
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    agentId: '',
    agentName: '',
    tier: 'development',
    romaLevel: 'L2',
    systemPrompt: '',
    communicationMode: 'standard',
    collaborationMode: 'autonomous',
    assignedTools: [] as string[],
    behaviors: {} as Record<string, any>,
    personality: {} as Record<string, any>,
    workflows: [] as any[],
    triggers: [] as any[],
    canCollaborateWith: [] as string[],
    preferredProvider: '',
    preferredModel: '',
    maxTokens: 4096,
    temperature: 0.7,
    description: '',
    category: '',
    tags: [] as string[]
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.agentId || !formData.agentName || !formData.systemPrompt) {
      return;
    }
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? 'bg-indigo-600 text-white'
                  : s < step
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-200 text-slate-600'
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Step {step} of 5
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Agent ID</Label>
              <Input
                value={formData.agentId}
                onChange={(e) => updateField('agentId', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="my-custom-agent"
                className="mt-2"
                data-testid="input-agent-id"
              />
              <p className="text-xs text-muted-foreground mt-1">Unique identifier (lowercase, no spaces)</p>
            </div>
            <div>
              <Label>Agent Name</Label>
              <Input
                value={formData.agentName}
                onChange={(e) => updateField('agentName', e.target.value)}
                placeholder="My Custom Agent"
                className="mt-2"
                data-testid="input-agent-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tier</Label>
              <Select value={formData.tier} onValueChange={(v) => updateField('tier', v)}>
                <SelectTrigger className="mt-2" data-testid="select-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                  <SelectItem value="devops">DevOps</SelectItem>
                  <SelectItem value="domain">Domain Specialist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ROMA Level</Label>
              <Select value={formData.romaLevel} onValueChange={(v) => updateField('romaLevel', v)}>
                <SelectTrigger className="mt-2" data-testid="select-roma-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">L1 - Basic Execution</SelectItem>
                  <SelectItem value="L2">L2 - Guided Autonomy</SelectItem>
                  <SelectItem value="L3">L3 - Supervised Autonomy</SelectItem>
                  <SelectItem value="L4">L4 - Full Autonomy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe what this agent does..."
              className="mt-2"
              data-testid="textarea-description"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            System Prompt
          </h3>

          <div>
            <Label>Use Template</Label>
            <Select onValueChange={(id) => {
              const template = templates.find((t: any) => t.id === id);
              if (template) {
                updateField('systemPrompt', template.template);
              }
            }}>
              <SelectTrigger className="mt-2" data-testid="select-template">
                <SelectValue placeholder="Select a template to start from..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>System Prompt</Label>
            <Textarea
              value={formData.systemPrompt}
              onChange={(e) => updateField('systemPrompt', e.target.value)}
              placeholder="Enter the system prompt that defines this agent's behavior..."
              className="mt-2 min-h-[400px] font-mono text-sm"
              data-testid="textarea-system-prompt-create"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Behavior & Collaboration
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Communication Mode</Label>
              <Select value={formData.communicationMode} onValueChange={(v) => updateField('communicationMode', v)}>
                <SelectTrigger className="mt-2" data-testid="select-comm-mode-create">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard - Balanced responses</SelectItem>
                  <SelectItem value="verbose">Verbose - Detailed explanations</SelectItem>
                  <SelectItem value="minimal">Minimal - Concise responses</SelectItem>
                  <SelectItem value="technical">Technical - Code-focused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Collaboration Mode</Label>
              <Select value={formData.collaborationMode} onValueChange={(v) => updateField('collaborationMode', v)}>
                <SelectTrigger className="mt-2" data-testid="select-collab-mode-create">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="autonomous">Autonomous - Works independently</SelectItem>
                  <SelectItem value="swarm">Swarm - Coordinates with multiple agents</SelectItem>
                  <SelectItem value="hybrid">Hybrid - Flexible collaboration</SelectItem>
                  <SelectItem value="supervised">Supervised - Requires approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Personality Traits (JSON)</Label>
            <Textarea
              value={JSON.stringify(formData.personality, null, 2)}
              onChange={(e) => {
                try {
                  updateField('personality', JSON.parse(e.target.value));
                } catch {}
              }}
              placeholder='{"tone": "professional", "approach": "analytical"}'
              className="mt-2 font-mono text-sm min-h-[100px]"
              data-testid="textarea-personality"
            />
          </div>

          <div>
            <Label>Behaviors (JSON)</Label>
            <Textarea
              value={JSON.stringify(formData.behaviors, null, 2)}
              onChange={(e) => {
                try {
                  updateField('behaviors', JSON.parse(e.target.value));
                } catch {}
              }}
              placeholder='{"errorHandling": "retry", "logging": "detailed"}'
              className="mt-2 font-mono text-sm min-h-[100px]"
              data-testid="textarea-behaviors"
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Tools & LLM Configuration
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preferred Provider</Label>
              <Select value={formData.preferredProvider} onValueChange={(v) => updateField('preferredProvider', v)}>
                <SelectTrigger className="mt-2" data-testid="select-provider-create">
                  <SelectValue placeholder="Auto-select best provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-select</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={formData.maxTokens}
                onChange={(e) => updateField('maxTokens', parseInt(e.target.value))}
                className="mt-2"
                data-testid="input-max-tokens-create"
              />
            </div>
          </div>

          <div>
            <Label>Temperature ({formData.temperature})</Label>
            <Input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
              className="mt-2"
              data-testid="input-temperature-create"
            />
          </div>

          <div>
            <Label>Assign Tools (select from 532 available)</Label>
            <ScrollArea className="h-48 border rounded-lg mt-2 p-2">
              <div className="grid grid-cols-2 gap-2">
                {tools.slice(0, 50).map((tool: any) => (
                  <label key={tool.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedTools.includes(tool.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateField('assignedTools', [...formData.assignedTools, tool.id]);
                        } else {
                          updateField('assignedTools', formData.assignedTools.filter((t: string) => t !== tool.id));
                        }
                      }}
                    />
                    <span className="text-sm">{tool.name}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Workflows & Triggers
          </h3>

          <div>
            <Label>Workflows (JSON Array)</Label>
            <Textarea
              value={JSON.stringify(formData.workflows, null, 2)}
              onChange={(e) => {
                try {
                  updateField('workflows', JSON.parse(e.target.value));
                } catch {}
              }}
              placeholder='[{"name": "main", "steps": [{"action": "analyze"}, {"action": "respond"}]}]'
              className="mt-2 font-mono text-sm min-h-[150px]"
              data-testid="textarea-workflows"
            />
          </div>

          <div>
            <Label>Triggers (JSON Array)</Label>
            <Textarea
              value={JSON.stringify(formData.triggers, null, 2)}
              onChange={(e) => {
                try {
                  updateField('triggers', JSON.parse(e.target.value));
                } catch {}
              }}
              placeholder='[{"event": "message", "condition": "contains code"}, {"event": "schedule", "cron": "0 9 * * *"}]'
              className="mt-2 font-mono text-sm min-h-[100px]"
              data-testid="textarea-triggers"
            />
          </div>

          <div>
            <Label>Can Collaborate With</Label>
            <ScrollArea className="h-32 border rounded-lg mt-2 p-2">
              <div className="grid grid-cols-3 gap-2">
                {agents.slice(0, 30).map((agent: any) => (
                  <label key={agent.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canCollaborateWith.includes(agent.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateField('canCollaborateWith', [...formData.canCollaborateWith, agent.id]);
                        } else {
                          updateField('canCollaborateWith', formData.canCollaborateWith.filter((a: string) => a !== agent.id));
                        }
                      }}
                    />
                    <span className="text-sm truncate">{agent.name}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Summary</h4>
            <div className="text-sm space-y-1">
              <p><strong>ID:</strong> {formData.agentId || 'Not set'}</p>
              <p><strong>Name:</strong> {formData.agentName || 'Not set'}</p>
              <p><strong>Tier:</strong> {formData.tier} | <strong>ROMA:</strong> {formData.romaLevel}</p>
              <p><strong>Mode:</strong> {formData.collaborationMode}</p>
              <p><strong>Tools:</strong> {formData.assignedTools.length} assigned</p>
              <p><strong>Collaborators:</strong> {formData.canCollaborateWith.length} agents</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          data-testid="button-prev-step"
        >
          Previous
        </Button>
        
        {step < 5 ? (
          <Button
            onClick={() => setStep(step + 1)}
            data-testid="button-next-step"
          >
            Next Step
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.agentId || !formData.agentName || !formData.systemPrompt}
            data-testid="button-create-agent"
          >
            {isLoading ? 'Creating...' : 'Create Agent'}
          </Button>
        )}
      </div>
    </div>
  );
}
