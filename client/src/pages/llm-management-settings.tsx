/**
 * LLM Management Settings Page
 * Comprehensive interface for managing LLM providers, cost tracking, and usage statistics
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  DollarSign, 
  Settings, 
  TrendingUp, 
  Zap, 
  Brain, 
  Globe,
  CheckCircle,
  AlertCircle,
  XCircle,
  TestTube,
  BarChart3,
  Cpu,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LLMProvider {
  id: string;
  name: string;
  enabled: boolean;
  status: 'active' | 'disabled' | 'error' | 'rate_limited';
  models: any[];
  capabilities: string[];
  costTracking: {
    totalSpent: number;
    dailySpent: number;
    monthlySpent: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  usageStats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    successRate: number;
  };
  priority: number;
  lastHealthCheck: string;
}

interface UsageSummary {
  totalProviders: number;
  activeProviders: number;
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  providers: any[];
}

export default function LLMManagementSettings() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch LLM providers data
  const { data: providersData, isLoading: loadingProviders, error: providersError } = useQuery({
    queryKey: ['/api/llm/providers'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch usage analytics
  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['/api/llm/analytics/usage'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch cost optimization recommendations
  const { data: optimizationData } = useQuery({
    queryKey: ['/api/llm/analytics/cost-optimization'],
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Fetch model comparison
  const { data: modelsData } = useQuery({
    queryKey: ['/api/llm/models/comparison']
  });

  // Toggle provider mutation
  const toggleProviderMutation = useMutation({
    mutationFn: async ({ providerId, enabled }: { providerId: string; enabled: boolean }) => {
      const response = await fetch(`/api/llm/providers/${providerId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (!response.ok) throw new Error('Failed to toggle provider');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/llm/providers'] });
      toast({
        title: "Provider Updated",
        description: "Provider status has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update provider: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Test provider mutation
  const testProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const response = await fetch(`/api/llm/providers/${providerId}/test`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Provider test failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Successful",
        description: `${data.data.providerName} is working correctly. Response time: ${data.data.responseTime}ms`
      });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: `Provider test failed: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleToggleProvider = (providerId: string, enabled: boolean) => {
    toggleProviderMutation.mutate({ providerId, enabled });
  };

  const handleTestProvider = async (providerId: string) => {
    setTestingProvider(providerId);
    try {
      await testProviderMutation.mutateAsync(providerId);
    } finally {
      setTestingProvider(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'disabled': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'rate_limited': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disabled': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'rate_limited': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loadingProviders) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading LLM Management...</span>
          </div>
        </div>
      </div>
    );
  }

  if (providersError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load LLM providers. Please check your connection and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const providers: LLMProvider[] = providersData?.data?.providers || [];
  const summary: UsageSummary = providersData?.data?.summary || {};
  const analytics = analyticsData?.data || {};
  const optimization = optimizationData?.data || {};
  const models = modelsData?.data || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              LLM Management & Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage AI providers, track costs, and optimize performance for 3D Immersive AI Assistants
            </p>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {summary.activeProviders}/{summary.totalProviders} Active Providers
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalCost?.toFixed(4) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">All time spending</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalRequests?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">Across all providers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTokens?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">Processing capacity</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.metrics?.averageSuccessRate ? 
                  `${(analytics.metrics.averageSuccessRate * 100).toFixed(1)}%` : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">Reliability metric</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="providers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="assistants" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              3D Assistants
            </TabsTrigger>
          </TabsList>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <Card key={provider.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(provider.status)}`} />
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(provider.status)}
                        <Switch 
                          checked={provider.enabled}
                          onCheckedChange={(enabled) => handleToggleProvider(provider.id, enabled)}
                          disabled={toggleProviderMutation.isPending}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Capabilities */}
                    <div>
                      <Label className="text-sm font-medium">Capabilities</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {provider.capabilities.slice(0, 4).map((cap) => (
                          <Badge key={cap} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                        {provider.capabilities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{provider.capabilities.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Requests</Label>
                        <div className="font-semibold">{provider.usageStats.totalRequests.toLocaleString()}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Success Rate</Label>
                        <div className="font-semibold">{(provider.usageStats.successRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* Cost Tracking */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-xs text-muted-foreground">Daily Cost</Label>
                        <span className="text-xs">${provider.costTracking.dailySpent.toFixed(4)}</span>
                      </div>
                      <Progress 
                        value={(provider.costTracking.dailySpent / provider.costTracking.dailyLimit) * 100}
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Limit: ${provider.costTracking.dailyLimit}
                      </div>
                    </div>

                    {/* Response Time */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Avg Response Time</Label>
                      <div className="font-semibold">{provider.usageStats.averageResponseTime.toFixed(0)}ms</div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={!provider.enabled || testingProvider === provider.id}
                        className="flex-1"
                      >
                        {testingProvider === provider.id ? (
                          <>
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-b-transparent mr-2" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube className="w-4 h-4 mr-1" />
                            Test
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProvider(provider.id)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Provider Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {providers.map((provider) => (
                      <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(provider.status)}`} />
                          <span className="font-medium">{provider.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{provider.usageStats.totalRequests}</div>
                          <div className="text-sm text-muted-foreground">requests</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {providers.map((provider) => (
                      <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{provider.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${provider.costTracking.totalSpent.toFixed(4)}</div>
                          <div className="text-sm text-muted-foreground">
                            {summary.totalCost > 0 
                              ? `${((provider.costTracking.totalSpent / summary.totalCost) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Models Comparison</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Compare capabilities, costs, and performance across all LLM models
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.models?.map((model: any, index: number) => (
                    <div key={`${model.providerId}-${model.modelId}`} 
                         className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={model.enabled ? "default" : "secondary"}>
                            {model.providerName}
                          </Badge>
                          <span className="font-semibold">{model.modelName}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ${model.inputCost.toFixed(5)}/1K in, ${model.outputCost.toFixed(5)}/1K out
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Context Window</Label>
                          <div className="font-medium">{model.contextWindow.toLocaleString()}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Max Tokens</Label>
                          <div className="font-medium">{model.maxTokens.toLocaleString()}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Languages</Label>
                          <div className="font-medium">{model.languages?.length || 0}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(model.status)}
                            <span className="capitalize">{model.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Label className="text-xs text-muted-foreground">Capabilities</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {model.capabilities?.map((cap: any, capIndex: number) => (
                            <Badge key={capIndex} variant="outline" className="text-xs">
                              {cap.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Cost Optimization Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {optimization.recommendations?.length > 0 ? (
                    <div className="space-y-3">
                      {optimization.recommendations.map((rec: any, index: number) => (
                        <Alert key={index} className={`border-l-4 ${
                          rec.impact === 'high' ? 'border-l-red-500' : 
                          rec.impact === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                        }`}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-medium mb-1">{rec.message}</div>
                            <div className="text-sm text-muted-foreground">
                              <strong>Action:</strong> {rec.action}
                            </div>
                            <Badge variant="outline" className="mt-2">
                              {rec.impact} impact
                            </Badge>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No optimization recommendations at this time.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Potential Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      ${optimization.potentialSavings?.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-muted-foreground">Estimated monthly savings</p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Quick Actions:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Route simple requests to cost-effective providers</li>
                      <li>• Use faster providers for time-critical responses</li>
                      <li>• Monitor daily/monthly spending limits</li>
                      <li>• Enable intelligent request routing</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 3D Assistants Tab */}
          <TabsContent value="assistants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  3D Immersive AI Assistants
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your human-like 3D AI assistants with voice, motion, and multilingual capabilities
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
                      <h3 className="font-medium mb-2">Arya - Cultural AI Assistant</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Advanced multilingual 3D assistant with cultural awareness
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">Hindi</Badge>
                        <Badge variant="outline">Tamil</Badge>
                        <Badge variant="outline">Voice</Badge>
                        <Badge variant="outline">3D Avatar</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-blue-200 dark:border-blue-800">
                    <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                      <Globe className="w-12 h-12 text-blue-500 mb-3" />
                      <h3 className="font-medium mb-2">Enterprise Assistant</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Business-focused AI with CRM integration
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">Professional</Badge>
                        <Badge variant="outline">CRM</Badge>
                        <Badge variant="outline">Analytics</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-200 dark:border-green-800">
                    <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                      <Brain className="w-12 h-12 text-green-500 mb-3" />
                      <h3 className="font-medium mb-2">Gaming Assistant</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Specialized for game development with KIMI K2
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">Gaming</Badge>
                        <Badge variant="outline">3D</Badge>
                        <Badge variant="outline">Spatial</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Platform Features
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <li>• Human-like 3D avatars with realistic animations</li>
                    <li>• Real-time voice synthesis and lip-sync</li>
                    <li>• 175+ language support with cultural context</li>
                    <li>• Advanced RAG knowledge base integration</li>
                    <li>• AR/VR deployment capabilities</li>
                    <li>• Emotion recognition and response</li>
                    <li>• Multi-platform embedding (web, mobile, API)</li>
                    <li>• Enterprise integrations (CRM, ERP, etc.)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}