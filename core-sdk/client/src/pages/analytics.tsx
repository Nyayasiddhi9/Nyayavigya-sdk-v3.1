import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CostChart } from '@/components/cost-chart';
import { Link } from 'wouter';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  
  // Enterprise Analytics Queries
  const { data: analyticsOverview, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics/overview'],
    refetchInterval: 30000
  });

  const { data: customerBehavior } = useQuery({
    queryKey: ['/api/analytics/customer-behavior'],
    refetchInterval: 60000
  });

  const { data: databaseMetrics } = useQuery({
    queryKey: ['/api/database/metrics'],
    refetchInterval: 15000
  });

  // Phase 2 Enterprise Queries
  const { data: securityFramework } = useQuery({
    queryKey: ['/api/security/framework'],
    refetchInterval: 120000
  });

  const { data: performanceMetrics } = useQuery({
    queryKey: ['/api/performance/metrics'],
    refetchInterval: 30000
  });

  const { data: testingStrategies } = useQuery({
    queryKey: ['/api/testing/strategies'],
    refetchInterval: 300000
  });

  // Original queries  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/orchestration/metrics'],
    refetchInterval: 30000
  });

  const { data: costs } = useQuery({
    queryKey: ['/api/orchestration/costs'],
    refetchInterval: 30000
  });

  const { data: status } = useQuery({
    queryKey: ['/api/orchestration/status'],
    refetchInterval: 15000
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <i className="fas fa-arrow-left mr-2"></i>
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Analytics & Cost Optimization</h1>
                <p className="text-slate-400">Real-time insights into your AI development platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button className="wai-gradient">
                <i className="fas fa-download mr-2"></i>
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-chart-line text-blue-400 text-xl"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {metrics?.requests?.total || 0}
                  </div>
                  <div className="text-slate-400 text-sm">Total Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-400 text-xl"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {metrics?.requests?.successful || 0}
                  </div>
                  <div className="text-slate-400 text-sm">Successful</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-purple-400 text-xl"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    ${costs?.totalCost?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-slate-400 text-sm">Total Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-tachometer-alt text-orange-400 text-xl"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {metrics?.performance?.averageLatency?.toFixed(0) || 0}ms
                  </div>
                  <div className="text-slate-400 text-sm">Avg Latency</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800 border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Distribution */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Request Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(metrics?.requests?.byType || {}).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                          <span className="text-slate-300 capitalize">{type}</span>
                        </div>
                        <span className="text-white font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Overall Status</span>
                      <Badge 
                        variant={status?.health?.overall === 'healthy' ? 'default' : 'destructive'}
                        className="capitalize"
                      >
                        {status?.health?.overall || 'Unknown'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-bold text-green-400">
                          {status?.health?.healthyComponents || 0}
                        </div>
                        <div className="text-xs text-slate-400">Healthy Components</div>
                      </div>
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-bold text-slate-300">
                          {status?.health?.totalComponents || 0}
                        </div>
                        <div className="text-xs text-slate-400">Total Components</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Trends */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <CostChart data={metrics?.trends || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cost Summary */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CostChart data={costs?.costTrends || []} type="cost" />
                  </CardContent>
                </Card>
              </div>

              {/* Provider Costs */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Cost by Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(costs?.costByProvider || {}).map(([provider, cost]) => (
                      <div key={provider} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          <span className="text-slate-300 capitalize">{provider}</span>
                        </div>
                        <span className="text-white font-medium">${(cost as number).toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Optimization Recommendations */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Cost Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Potential Savings</h4>
                    <div className="text-3xl font-bold text-emerald-400 mb-2">
                      ${costs?.optimization?.potential_savings?.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-slate-400 text-sm">Estimated monthly savings with optimization</p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {costs?.optimization?.recommendations?.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-slate-300 text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {metrics?.performance?.averageLatency?.toFixed(0) || 0}ms
                  </div>
                  <div className="text-slate-400">Average Latency</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {metrics?.performance?.throughput || 0}
                  </div>
                  <div className="text-slate-400">Requests/min</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {(metrics?.performance?.qualityScore * 100)?.toFixed(1) || 0}%
                  </div>
                  <div className="text-slate-400">Quality Score</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <CostChart data={metrics?.trends || []} type="performance" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Provider Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {status?.providers?.map((provider: any) => (
                    <div key={provider.provider} className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white capitalize">{provider.provider}</h4>
                        <Badge 
                          variant={provider.status === 'healthy' ? 'default' : 'destructive'}
                          className="capitalize"
                        >
                          {provider.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Latency</span>
                          <span className="text-white">{provider.latency}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Error Rate</span>
                          <span className="text-white">{(provider.errorRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cost Efficiency</span>
                          <span className="text-white">{provider.costEfficiency?.toFixed(1)}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phase 2 Enterprise Tabs */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <i className="fas fa-shield-alt text-green-400"></i>
                  Enterprise Security Framework
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Security Protocols</h3>
                    {securityFramework?.data?.protocols?.map((protocol: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">{protocol.name}</span>
                        <Badge variant="secondary">{protocol.level}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Compliance Status</h3>
                    <div className="text-sm text-slate-400">
                      {securityFramework?.data?.protocols?.length || 0} security protocols active
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <i className="fas fa-flask text-blue-400"></i>
                  Advanced Testing Automation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {testingStrategies?.data?.strategies?.length || 0}
                    </div>
                    <div className="text-sm text-slate-400">Testing Strategies</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {testingStrategies?.data?.capabilities?.length || 0}
                    </div>
                    <div className="text-sm text-slate-400">Capabilities</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">Active</div>
                    <div className="text-sm text-slate-400">System Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enterprise" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <i className="fas fa-rocket text-orange-400"></i>
                  Enterprise Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {performanceMetrics?.data?.responseTime?.toFixed(0) || 0}ms
                    </div>
                    <div className="text-sm text-slate-400">Response Time</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {performanceMetrics?.data?.throughput?.toFixed(0) || 0}
                    </div>
                    <div className="text-sm text-slate-400">Throughput</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">
                      {performanceMetrics?.data?.cpuUsage?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-slate-400">CPU Usage</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-400">
                      {performanceMetrics?.data?.memoryUsage?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-slate-400">Memory Usage</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
