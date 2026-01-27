
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { waiOrchestration } from '../../lib/api';
import { 
  Brain, 
  Zap, 
  Target, 
  Shield, 
  TrendingUp, 
  Activity,
  Cpu,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface SystemStatus {
  providers: any[];
  agents: any[];
  activeRequests: number;
  totalProcessed: number;
  averageRedundancyLevel: number;
  systemHealth: string;
}

interface PerformanceMetrics {
  totalRequests: number;
  averageProcessingTime: number;
  averageRedundancyLevel: number;
  fallbackUsageRate: number;
  averageCost: number;
  averageQuality: number;
}

interface LLMBenchmark {
  providerId: string;
  modelId: string;
  avgResponseTime: number;
  successRate: number;
  status: string;
  lastUsed?: Date;
}

export function EnhancedOrchestrationDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [providers, setProviders] = useState<LLMBenchmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState('');
  const [llmRecommendation, setLlmRecommendation] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const [statusRes, metricsRes, providersRes] = await Promise.all([
        waiOrchestration.getAgentStatus(),
        waiOrchestration.getMetrics(),
        waiOrchestration.getProviders()
      ]);

      setSystemStatus(statusRes.data.status || statusRes.data);
      setMetrics(metricsRes.data.metrics || metricsRes.data);
      setProviders(providersRes.data.providers || providersRes.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch system data:', error);
      setIsLoading(false);
    }
  };

  const handleLLMRecommendation = async () => {
    if (!selectedTask) return;

    try {
      const response = await waiOrchestration.recommendLLM({
        task: selectedTask,
        type: 'development',
        userPreferences: { qualityPriority: 'high' }
      });

      setLlmRecommendation(response.data.recommendation);
    } catch (error) {
      console.error('Failed to get LLM recommendation:', error);
    }
  };

  const testRedundancy = async () => {
    try {
      const response = await waiOrchestration.testRedundancy({
        task: 'Test the 3-level redundancy system with intelligent fallback',
        simulateFailures: ['openai'] // Simulate OpenAI failure
      });

      setTestResult(response.data.result);
    } catch (error) {
      console.error('Redundancy test failed:', error);
      setTestResult({ error: error.message });
    }
  };

  const getHealthBadgeColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'degraded': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Enhanced WAI Orchestration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced WAI Orchestration v4.0</h1>
          <p className="text-muted-foreground">
            Intelligent LLM selection with 3-level redundancy and benchmark-based routing
          </p>
        </div>
        <Badge className={getHealthBadgeColor(systemStatus?.systemHealth || 'unknown')}>
          System Health: {systemStatus?.systemHealth || 'Unknown'}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="providers">LLM Providers</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="intelligence">AI Intelligence</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStatus?.activeRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total processed: {systemStatus?.totalProcessed || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Redundancy</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.averageRedundancyLevel?.toFixed(1) || '1.0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Fallback rate: {((metrics?.fallbackUsageRate || 0) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.averageProcessingTime?.toFixed(0) || '0'}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Quality: {((metrics?.averageQuality || 0) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(metrics?.averageCost || 0).toFixed(4)}
                </div>
                <p className="text-xs text-muted-foreground">Per request</p>
              </CardContent>
            </Card>
          </div>

          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  System performance over the last 100 requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quality Score</span>
                    <span>{((metrics.averageQuality || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(metrics.averageQuality || 0) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{((1 - (metrics.fallbackUsageRate || 0)) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(1 - (metrics.fallbackUsageRate || 0)) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cost Efficiency</span>
                    <span>{Math.max(0, 100 - (metrics.averageCost || 0) * 10000).toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.max(0, 100 - (metrics.averageCost || 0) * 10000)} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LLM Provider Benchmarks & Status</CardTitle>
              <CardDescription>
                Real-time performance metrics for all 13 LLM providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider) => (
                  <Card key={provider.providerId} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{provider.providerId}</h3>
                      <Badge className={getStatusBadgeColor(provider.status)}>
                        {provider.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Response Time:</span>
                        <span>{provider.avgResponseTime?.toFixed(0) || 'N/A'}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span>{((provider.successRate || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Model:</span>
                        <span className="truncate">{provider.modelId}</span>
                      </div>
                      {provider.lastUsed && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Last Used:</span>
                          <span>{new Date(provider.lastUsed).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Agent Status</CardTitle>
              <CardDescription>
                39 specialized agents with performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemStatus?.agents?.map((agent) => (
                  <Card key={agent.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <Badge variant={agent.status === 'available' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                    </div>
                    {agent.performance && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Tasks:</span>
                          <span>{agent.performance.tasksCompleted || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span>{((agent.performance.successRate || 0) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quality:</span>
                          <span>{((agent.performance.qualityScore || 0) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Time:</span>
                          <span>{agent.performance.averageResponseTime?.toFixed(0) || 'N/A'}ms</span>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Intelligent LLM Recommendation
              </CardTitle>
              <CardDescription>
                Get AI-powered LLM recommendations based on task analysis and benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter your task description..."
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button onClick={handleLLMRecommendation} disabled={!selectedTask}>
                  <Target className="h-4 w-4 mr-2" />
                  Get Recommendation
                </Button>
              </div>

              {llmRecommendation && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-600">Primary Choice</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="font-semibold">
                        {llmRecommendation.primary.providerId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confidence: {(llmRecommendation.primary.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Est. Cost: ${llmRecommendation.primary.estimatedCost.toFixed(4)}
                      </div>
                      <div className="text-xs">
                        {llmRecommendation.primary.reasoning}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-600">Secondary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="font-semibold">
                        {llmRecommendation.secondary.providerId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confidence: {(llmRecommendation.secondary.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs">
                        {llmRecommendation.secondary.reasoning}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-orange-600">Tertiary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="font-semibold">
                        {llmRecommendation.tertiary.providerId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confidence: {(llmRecommendation.tertiary.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs">
                        {llmRecommendation.tertiary.reasoning}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                3-Level Redundancy Testing
              </CardTitle>
              <CardDescription>
                Test the intelligent fallback system and redundancy mechanisms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testRedundancy} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Test Redundancy System
              </Button>

              {testResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Test Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResult.error ? (
                      <div className="text-red-600">
                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                        Error: {testResult.error}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Redundancy test successful
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Redundancy Level:</span> {testResult.redundancyLevel}
                          </div>
                          <div>
                            <span className="font-medium">Processing Time:</span> {testResult.processingTime}ms
                          </div>
                          <div>
                            <span className="font-medium">Primary LLM:</span> {testResult.primaryLLM}
                          </div>
                          <div>
                            <span className="font-medium">Confidence:</span> {(testResult.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                        {testResult.fallbacksUsed.length > 0 && (
                          <div>
                            <span className="font-medium">Fallbacks Used:</span> {testResult.fallbacksUsed.join(' → ')}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {testResult.reasoning || 'No additional reasoning provided'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
