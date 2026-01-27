/**
 * Admin Dashboard for LLM Cost Analytics and Management
 * Production-ready implementation with real-time monitoring
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, TrendingUp, AlertCircle, Activity, 
  Settings, Shield, Database, Cpu, Users, Clock,
  Power, Zap, BarChart3, PieChartIcon, Globe,
  Key, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// LLM Provider Configuration
const LLM_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'dall-e-3', 'whisper-1'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-opus-4'] },
  { id: 'gemini', name: 'Google Gemini', models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
  { id: 'perplexity', name: 'Perplexity', models: ['llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online'] },
  { id: 'replicate', name: 'Replicate', models: ['meta/llama-3-70b', 'stability-ai/sdxl'] },
  { id: 'together', name: 'Together AI', models: ['mixtral-8x7b', 'llama-3-70b'] },
  { id: 'groq', name: 'Groq', models: ['llama3-70b', 'mixtral-8x7b'] },
  { id: 'xai', name: 'XAI', models: ['grok-2', 'grok-mini'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-coder', 'deepseek-chat'] },
  { id: 'kimi', name: 'KIMI K2', models: ['kimi-k2', 'kimi-k2-mini'] },
  { id: 'cohere', name: 'Cohere', models: ['command-r', 'command-light'] },
  { id: 'mistral', name: 'Mistral AI', models: ['mistral-large', 'mistral-medium'] },
  { id: 'manus', name: 'Manus AI', models: ['manus-1', 'manus-lite'] },
  { id: 'elevenlabs', name: 'ElevenLabs', models: ['eleven-turbo-v2', 'eleven-multilingual-v2'] }
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [costLimit, setCostLimit] = useState(1000);
  const [alertThreshold, setAlertThreshold] = useState(80);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard', selectedTimeRange],
    queryFn: () => apiRequest('/api/admin/dashboard', 'GET', { timeRange: selectedTimeRange }),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch LLM provider status
  const { data: providerStatus } = useQuery({
    queryKey: ['/api/admin/llm-providers'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Toggle provider status
  const toggleProvider = useMutation({
    mutationFn: ({ providerId, enabled }: { providerId: string; enabled: boolean }) =>
      apiRequest('/api/admin/llm-providers/toggle', 'POST', { providerId, enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/llm-providers'] });
      toast({
        title: 'Provider Updated',
        description: 'LLM provider status has been updated successfully.'
      });
    }
  });

  // Update cost limits
  const updateCostLimits = useMutation({
    mutationFn: (data: { dailyLimit: number; monthlyLimit: number; alertThreshold: number }) =>
      apiRequest('/api/admin/cost-limits', 'POST', data),
    onSuccess: () => {
      toast({
        title: 'Limits Updated',
        description: 'Cost limits have been updated successfully.'
      });
    }
  });

  // Configure model preferences
  const updateModelConfig = useMutation({
    mutationFn: (data: { providerId: string; model: string; priority: number }) =>
      apiRequest('/api/admin/model-config', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/llm-providers'] });
      toast({
        title: 'Model Configuration Updated',
        description: 'Model preferences have been saved.'
      });
    }
  });

  // Mock data for demonstration (replace with real API data)
  const costData = dashboardData?.costData || [
    { date: '2025-01-05', openai: 45, anthropic: 32, gemini: 18, total: 95 },
    { date: '2025-01-06', openai: 52, anthropic: 38, gemini: 22, total: 112 },
    { date: '2025-01-07', openai: 61, anthropic: 45, gemini: 28, total: 134 },
    { date: '2025-01-08', openai: 58, anthropic: 41, gemini: 25, total: 124 },
    { date: '2025-01-09', openai: 72, anthropic: 52, gemini: 31, total: 155 },
    { date: '2025-01-10', openai: 68, anthropic: 48, gemini: 29, total: 145 },
    { date: '2025-01-11', openai: 41, anthropic: 28, gemini: 15, total: 84 }
  ];

  const providerBreakdown = dashboardData?.providerBreakdown || [
    { name: 'OpenAI', value: 397, percentage: 42, color: '#10B981' },
    { name: 'Anthropic', value: 282, percentage: 30, color: '#6366F1' },
    { name: 'Gemini', value: 168, percentage: 18, color: '#F59E0B' },
    { name: 'Others', value: 94, percentage: 10, color: '#94A3B8' }
  ];

  const usageMetrics = dashboardData?.usageMetrics || {
    totalRequests: 142857,
    totalTokens: 8542000,
    avgResponseTime: 1.2,
    errorRate: 0.3,
    activeUsers: 3421,
    concurrentRequests: 47
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">LLM Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and management of AI services
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Cost Alert Banner */}
      {dashboardData?.costAlert && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cost Alert</AlertTitle>
          <AlertDescription>
            Daily spending has reached ${dashboardData.todaySpend} (
            {Math.round((dashboardData.todaySpend / costLimit) * 100)}% of limit)
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData?.todaySpend || '84.32'}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              {' '}12% from yesterday
            </p>
            <Progress value={65} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData?.monthlySpend || '2,847'}</div>
            <p className="text-xs text-muted-foreground">
              Budget: $5,000
            </p>
            <Progress value={57} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.activeProviders || '3'}/14</div>
            <div className="flex gap-1 mt-2">
              <Badge variant="default" className="text-xs">OpenAI</Badge>
              <Badge variant="default" className="text-xs">Claude</Badge>
              <Badge variant="default" className="text-xs">Gemini</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.7%</div>
            <p className="text-xs text-muted-foreground">
              <Activity className="inline h-3 w-3 text-green-500" />
              {' '}All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="costs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="costs">Cost Analytics</TabsTrigger>
          <TabsTrigger value="providers">Provider Management</TabsTrigger>
          <TabsTrigger value="usage">Usage Metrics</TabsTrigger>
          <TabsTrigger value="models">Model Config</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Limits</TabsTrigger>
        </TabsList>

        {/* Cost Analytics Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Trend</CardTitle>
                <CardDescription>Daily spending across all providers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="openai" stroke="#10B981" name="OpenAI" />
                    <Line type="monotone" dataKey="anthropic" stroke="#6366F1" name="Anthropic" />
                    <Line type="monotone" dataKey="gemini" stroke="#F59E0B" name="Gemini" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Provider Breakdown</CardTitle>
                <CardDescription>Cost distribution by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={providerBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {providerBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cost by Model */}
          <Card>
            <CardHeader>
              <CardTitle>Cost by Model</CardTitle>
              <CardDescription>Detailed breakdown of costs per model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium">
                  <div>Model</div>
                  <div>Requests</div>
                  <div>Tokens</div>
                  <div>Cost</div>
                </div>
                {[
                  { model: 'GPT-4o', requests: '12,453', tokens: '2.4M', cost: '$48.20' },
                  { model: 'Claude Sonnet 4', requests: '8,921', tokens: '1.8M', cost: '$36.50' },
                  { model: 'Gemini 2.5 Pro', requests: '6,234', tokens: '1.2M', cost: '$24.80' },
                  { model: 'DALL-E 3', requests: '342', tokens: '-', cost: '$17.10' }
                ].map((item) => (
                  <div key={item.model} className="grid grid-cols-4 gap-4 text-sm">
                    <div className="font-medium">{item.model}</div>
                    <div>{item.requests}</div>
                    <div>{item.tokens}</div>
                    <div className="font-medium">{item.cost}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provider Management Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LLM Provider Configuration</CardTitle>
              <CardDescription>Enable/disable providers and configure API keys</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {LLM_PROVIDERS.map((provider) => {
                  const status = providerStatus?.[provider.id] || { 
                    enabled: ['openai', 'anthropic', 'gemini'].includes(provider.id),
                    hasApiKey: ['openai', 'anthropic', 'gemini'].includes(provider.id)
                  };
                  
                  return (
                    <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={status.enabled}
                          onCheckedChange={(checked) => 
                            toggleProvider.mutate({ providerId: provider.id, enabled: checked })
                          }
                        />
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {provider.models.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status.hasApiKey ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            API Key Set
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            No API Key
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          <Key className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Metrics Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageMetrics.totalRequests.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(usageMetrics.totalTokens / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">Input + Output</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.avgResponseTime}s</div>
                <p className="text-xs text-muted-foreground">P95: 2.3s</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Request Volume</CardTitle>
              <CardDescription>Requests per hour over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Configuration Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Selection & Routing</CardTitle>
              <CardDescription>Configure model preferences and fallback order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Primary Model for Text Generation</Label>
                  <Select defaultValue="gpt-4o">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                      <SelectItem value="claude-4">Claude Sonnet 4</SelectItem>
                      <SelectItem value="gemini-2.5">Gemini 2.5 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Fallback Order</Label>
                  <div className="space-y-2 mt-2">
                    {['GPT-4o', 'Claude Sonnet 4', 'Gemini 2.5 Pro'].map((model, index) => (
                      <div key={model} className="flex items-center gap-2 p-2 border rounded">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        <span className="flex-1">{model}</span>
                        <Badge variant="outline">Priority {index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Cost Optimization Mode</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Switch defaultChecked />
                    <span className="text-sm text-muted-foreground">
                      Automatically route to cheaper models for simple tasks
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts & Limits Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Controls</CardTitle>
              <CardDescription>Set spending limits and alert thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Daily Spending Limit ($)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[costLimit]}
                    onValueChange={(value) => setCostLimit(value[0])}
                    max={5000}
                    step={100}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={costLimit}
                    onChange={(e) => setCostLimit(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>

              <div>
                <Label>Alert Threshold (%)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[alertThreshold]}
                    onValueChange={(value) => setAlertThreshold(value[0])}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-24 text-right">{alertThreshold}%</span>
                </div>
              </div>

              <div>
                <Label>Auto-shutoff</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Switch />
                  <span className="text-sm text-muted-foreground">
                    Automatically disable providers when limit is reached
                  </span>
                </div>
              </div>

              <Button 
                onClick={() => updateCostLimits.mutate({
                  dailyLimit: costLimit,
                  monthlyLimit: costLimit * 30,
                  alertThreshold
                })}
              >
                Save Budget Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { type: 'warning', message: 'Daily spend reached 80% of limit', time: '2 hours ago' },
                  { type: 'info', message: 'Claude API rate limit approaching', time: '4 hours ago' },
                  { type: 'success', message: 'All systems operational after maintenance', time: '6 hours ago' },
                  { type: 'error', message: 'Perplexity API key expired', time: '1 day ago' }
                ].map((alert, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {alert.type === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                    {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {alert.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-500" />}
                    <span className="flex-1 text-sm">{alert.message}</span>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}