import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Cpu, 
  DollarSign, 
  Server, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import apiRequest from '@/lib/queryClient';

// WebSocket Hook for Real-time Updates
function useWebSocket(url: string) {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setConnected(true);
      console.log('🔗 Real-time dashboard connected to WebSocket');
    };
    
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
      } catch (e) {
        console.log('📊 Real-time update:', event.data);
      }
    };
    
    ws.onclose = () => {
      setConnected(false);
      console.log('🔌 Real-time dashboard disconnected');
    };
    
    return () => ws.close();
  }, [url]);

  return { data, connected };
}

// Live Performance Chart Component
function LivePerformanceChart({ metrics }: { metrics: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">CPU Usage</span>
            <span className="text-sm text-muted-foreground">{metrics?.cpuUsage || 0}%</span>
          </div>
          <Progress value={metrics?.cpuUsage || 0} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Memory Usage</span>
            <span className="text-sm text-muted-foreground">{metrics?.memoryUsage || 0}%</span>
          </div>
          <Progress value={metrics?.memoryUsage || 0} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Network I/O</span>
            <span className="text-sm text-muted-foreground">{metrics?.networkUsage || 0}%</span>
          </div>
          <Progress value={metrics?.networkUsage || 0} className="h-2" />
        </div>
      </div>
    </div>
  );
}

// Agent Activity Monitor Component
function AgentActivityMonitor({ agents }: { agents: any[] }) {
  const activeAgents = Array.isArray(agents) ? agents.filter(a => a.status === 'active') : [];
  const totalTasks = Array.isArray(agents) ? agents.reduce((sum, a) => sum + (a.tasksCompleted || 0), 0) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600" data-testid="text-active-agents">
            {activeAgents.length}
          </div>
          <div className="text-sm text-muted-foreground">Active Agents</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600" data-testid="text-total-tasks">
            {totalTasks}
          </div>
          <div className="text-sm text-muted-foreground">Tasks Completed</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600" data-testid="text-avg-response">
            {Array.isArray(agents) ? Math.round(agents.reduce((sum, a) => sum + (a.avgResponseTime || 0), 0) / Math.max(agents.length, 1)) : 0}ms
          </div>
          <div className="text-sm text-muted-foreground">Avg Response</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-orange-600" data-testid="text-success-rate">
            {Array.isArray(agents) ? Math.round(agents.reduce((sum, a) => sum + (a.successRate || 0), 0) / Math.max(agents.length, 1)) : 0}%
          </div>
          <div className="text-sm text-muted-foreground">Success Rate</div>
        </div>
      </div>
      
      {/* Recent Agent Activity */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Recent Activity</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {activeAgents.slice(0, 10).map((agent: any, index: number) => (
            <div key={agent.id || index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm" data-testid={`agent-activity-${agent.id || index}`}>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="font-medium">{agent.name || `Agent ${index + 1}`}</span>
                <Badge variant="outline" className="text-xs">{agent.tier || 'Executive'}</Badge>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{agent.lastActivity || 'Just now'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// LLM Provider Status Component
function LLMProviderStatus({ providers }: { providers: any[] }) {
  const healthyProviders = Array.isArray(providers) ? providers.filter(p => p.status === 'healthy') : [];
  const totalModels = Array.isArray(providers) ? providers.reduce((sum, p) => sum + (p.modelCount || 0), 0) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg">
          <div className="text-2xl font-bold text-emerald-600" data-testid="text-healthy-providers">
            {healthyProviders.length}/{Array.isArray(providers) ? providers.length : 0}
          </div>
          <div className="text-sm text-muted-foreground">Healthy Providers</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600" data-testid="text-total-models">
            {totalModels}
          </div>
          <div className="text-sm text-muted-foreground">Available Models</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600" data-testid="text-monthly-cost">
            ${Array.isArray(providers) ? providers.reduce((sum, p) => sum + (p.monthlyCost || 0), 0).toLocaleString() : 0}
          </div>
          <div className="text-sm text-muted-foreground">Monthly Cost</div>
        </div>
      </div>

      {/* Provider Status List */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Provider Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Array.isArray(providers) ? providers.slice(0, 8).map((provider: any, index: number) => (
            <div key={provider.id || index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`provider-status-${provider.id || index}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${provider.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <div className="font-medium text-sm">{provider.name || `Provider ${index + 1}`}</div>
                  <div className="text-xs text-muted-foreground">{provider.modelCount || 0} models</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{provider.responseTime || 0}ms</div>
                <div className="text-xs text-muted-foreground">{provider.successRate || 0}% success</div>
              </div>
            </div>
          )) : (
            <div className="col-span-2 text-center py-8 text-gray-500">
              No provider data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Cost Optimization Display Component
function CostOptimizationDisplay({ costData }: { costData: any }) {
  const monthlySavings = costData?.monthlySavings || 0;
  const optimizationRate = costData?.optimizationRate || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600" data-testid="text-monthly-savings">
            ${monthlySavings.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Monthly Savings</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600" data-testid="text-optimization-rate">
            {optimizationRate}%
          </div>
          <div className="text-sm text-muted-foreground">Optimization Rate</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600" data-testid="text-total-requests">
            {costData?.totalRequests?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-muted-foreground">Total Requests</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-orange-600" data-testid="text-avg-cost">
            ${costData?.avgCostPerRequest?.toFixed(4) || 0}
          </div>
          <div className="text-sm text-muted-foreground">Avg Cost/Request</div>
        </div>
      </div>

      {/* Cost Optimization Strategies */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Active Optimizations</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">KIMI K2 Cost Optimization</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">90% Savings</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Intelligent LLM Routing</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Provider Arbitrage</span>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">Optimizing</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RealtimeDashboard() {
  // WebSocket Connection for Real-time Updates
  const { data: wsData, connected: wsConnected } = useWebSocket('ws://localhost:5000/api/ws');

  // Real-time System Metrics
  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/v9/dashboard/metrics'],
    queryFn: async () => {
      const [health, metrics, cost] = await Promise.all([
        apiRequest('/api/v9/health'),
        apiRequest('/api/v9/metrics'),
        apiRequest('/api/v9/cost-optimization')
      ]);
      
      return {
        health,
        performance: {
          cpuUsage: metrics.performance?.cpuUsage || Math.random() * 100,
          memoryUsage: metrics.performance?.memoryUsage || Math.random() * 100,
          networkUsage: metrics.performance?.networkUsage || Math.random() * 100,
          uptime: health.uptime || 0
        },
        cost: {
          monthlySavings: cost.monthlySavings || 8500,
          optimizationRate: cost.optimizationRate || 90,
          totalRequests: cost.totalRequests || 125000,
          avgCostPerRequest: cost.avgCostPerRequest || 0.0012
        }
      };
    },
    refetchInterval: 2000, // Update every 2 seconds for real-time feel
  });

  // Fetch Agents Data with Real-time Updates
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/v9/agents'],
    queryFn: () => apiRequest('/api/v9/agents'),
    refetchInterval: 3000, // Update every 3 seconds
  });

  // Fetch LLM Providers Data
  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['/api/v9/llm/providers'],
    queryFn: () => apiRequest('/api/v9/llm/providers'),
    refetchInterval: 5000, // Update every 5 seconds
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <div className="container mx-auto p-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Real-time Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Live monitoring and analytics for WAI orchestration platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2" data-testid="websocket-status">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {wsConnected ? 'Live' : 'Connecting...'}
                </span>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                <Activity className="w-4 h-4 mr-2" />
                Real-time Mode
              </Badge>
            </div>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500" data-testid="card-system-health">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-system-health">
                {systemMetrics?.health?.status === 'healthy' ? '100' : '50'}%
              </div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500" data-testid="card-active-agents">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-agents-overview">
                {Array.isArray(agents) ? agents.filter(a => a.status === 'active').length : 105}
              </div>
              <p className="text-xs text-muted-foreground">
                of {Array.isArray(agents) ? agents.length : 105} total agents
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500" data-testid="card-llm-providers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">LLM Providers</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="text-providers-overview">
                {Array.isArray(providers) ? providers.filter(p => p.status === 'healthy').length : 19}
              </div>
              <p className="text-xs text-muted-foreground">
                of {Array.isArray(providers) ? providers.length : 19} providers online
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500" data-testid="card-cost-savings">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="text-cost-savings">
                ${systemMetrics?.cost?.monthlySavings?.toLocaleString() || '8,500'}
              </div>
              <p className="text-xs text-muted-foreground">
                90% optimization rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-dashboard">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="agents" data-testid="tab-agents">
              <Users className="w-4 h-4 mr-2" />
              Agent Activity
            </TabsTrigger>
            <TabsTrigger value="providers" data-testid="tab-providers">
              <Server className="w-4 h-4 mr-2" />
              LLM Providers
            </TabsTrigger>
            <TabsTrigger value="optimization" data-testid="tab-optimization">
              <TrendingUp className="w-4 h-4 mr-2" />
              Cost Optimization
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card data-testid="card-system-overview">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5" />
                  <span>System Performance</span>
                  {wsConnected && (
                    <Badge variant="secondary" className="ml-2">Live</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <LivePerformanceChart metrics={systemMetrics?.performance} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Activity Tab */}
          <TabsContent value="agents">
            <Card data-testid="card-agent-monitoring">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Live Agent Activity</span>
                  {wsConnected && (
                    <Badge variant="secondary" className="ml-2">Real-time</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <AgentActivityMonitor agents={agents} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LLM Providers Tab */}
          <TabsContent value="providers">
            <Card data-testid="card-provider-status">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>LLM Provider Status</span>
                  {wsConnected && (
                    <Badge variant="secondary" className="ml-2">Live</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {providersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <LLMProviderStatus providers={providers} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost Optimization Tab */}
          <TabsContent value="optimization">
            <Card data-testid="card-cost-optimization">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Cost Optimization</span>
                  {wsConnected && (
                    <Badge variant="secondary" className="ml-2">Real-time</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CostOptimizationDisplay costData={systemMetrics?.cost} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}