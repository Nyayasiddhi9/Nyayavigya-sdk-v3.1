'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Search, Settings, DollarSign, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLLMProviders } from '../../hooks/use-llm-providers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Utility functions
const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
const formatNumber = (num: number) => num.toLocaleString();
const getStatusColor = (status: string) => status === 'connected' ? 'green' : status === 'connecting' ? 'yellow' : 'red';

// WAI SDK API Client for LLM providers
const waiSDKClient = {
  toggleLLMProvider: (providerId: string, enabled: boolean) => 
    apiRequest(`/api/v9/llm/providers/${providerId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled })
    }),
  updateProviderConfig: (providerId: string, config: any) => 
    apiRequest(`/api/v9/llm/providers/${providerId}/config`, {
      method: 'PATCH',
      body: JSON.stringify(config)
    })
};

export function LLMProviderList() {
  const { data: providers, isLoading, error } = useLLMProviders();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleProviderMutation = useMutation({
    mutationFn: async ({ providerId, enabled }: { providerId: string; enabled: boolean }) => {
      return waiSDKClient.toggleLLMProvider(providerId, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/llm/providers'] });
      toast({
        title: 'Provider Updated',
        description: 'LLM provider status has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update provider status.',
        variant: 'destructive',
      });
    },
  });

  const updateLimitsMutation = useMutation({
    mutationFn: async ({ providerId, limits }: { providerId: string; limits: any }) => {
      return waiSDKClient.updateLLMProviderLimits(providerId, limits);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/llm/providers'] });
      toast({
        title: 'Limits Updated',
        description: 'Provider limits have been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update provider limits.',
        variant: 'destructive',
      });
    },
  });

  const handleToggleProvider = (providerId: string, enabled: boolean) => {
    toggleProviderMutation.mutate({ providerId, enabled });
  };

  const filteredProviders = providers?.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getProviderStats = () => {
    if (!providers) return { total: 0, healthy: 0, totalModels: 0, totalCost: 0 };
    
    return {
      total: providers.length,
      healthy: providers.filter(p => p.status === 'healthy').length,
      totalModels: providers.reduce((sum, p) => sum + p.models.length, 0),
      totalCost: providers.reduce((sum, p) => sum + p.costTracking.monthlySpent, 0),
    };
  };

  const stats = getProviderStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Model Catalog</h2>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Model Catalog</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <p className="text-red-500">Failed to load LLM providers</p>
              <p className="text-sm text-gray-500">{error.message}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="llm-provider-list">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Model Catalog</h2>
          <p className="text-muted-foreground">
            Manage LLM providers and monitor usage across {stats.totalModels} models
          </p>
        </div>
        <Button>
          <Settings className="w-4 h-4 mr-2" />
          Configure Provider
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Providers</p>
                <p className="text-2xl font-bold" data-testid="total-providers">{stats.total}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold text-green-600" data-testid="healthy-providers">{stats.healthy}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Models</p>
                <p className="text-2xl font-bold" data-testid="total-models">{stats.totalModels}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                <p className="text-2xl font-bold" data-testid="monthly-cost">{formatCurrency(stats.totalCost)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-providers"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Provider Cards */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="models">Model Details</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <Card key={provider.id} className="relative" data-testid={`provider-card-${provider.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{provider.displayName}</CardTitle>
                    <Switch
                      checked={provider.status === 'healthy'}
                      onCheckedChange={(checked) => handleToggleProvider(provider.id, checked)}
                      disabled={toggleProviderMutation.isPending}
                      data-testid={`toggle-provider-${provider.id}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(provider.status)}>
                      {provider.status}
                    </Badge>
                    <Badge variant="outline">{provider.models.length} models</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Usage Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Monthly Usage</span>
                      <span>{formatNumber(provider.usageStats.totalRequests)} requests</span>
                    </div>
                    <Progress value={Math.min((provider.costTracking.monthlySpent / 1000) * 100, 100)} />
                  </div>
                  
                  {/* Cost Tracking */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Daily Spent</p>
                      <p className="font-medium">{formatCurrency(provider.costTracking.dailySpent)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monthly Spent</p>
                      <p className="font-medium">{formatCurrency(provider.costTracking.monthlySpent)}</p>
                    </div>
                  </div>
                  
                  {/* Performance */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg Response Time</span>
                      <span>{provider.usageStats.averageResponseTime}ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="h-1 rounded-full bg-blue-500" 
                        style={{ width: `${Math.min((provider.usageStats.averageResponseTime / 3000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => updateLimitsMutation.mutate({ 
                        providerId: provider.id, 
                        limits: { dailyLimit: 1000, monthlyLimit: 30000 } 
                      })}
                      disabled={updateLimitsMutation.isPending}
                      data-testid={`configure-provider-${provider.id}`}
                    >
                      <Settings className="w-3 h-3 mr-2" />
                      Configure
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      data-testid={`monitor-provider-${provider.id}`}
                    >
                      <Activity className="w-3 h-3 mr-2" />
                      Monitor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="space-y-6">
            {filteredProviders.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {provider.displayName} Models
                    <Badge variant="secondary">{provider.models.length} models</Badge>
                  </CardTitle>
                  <CardDescription>
                    Available models and their configurations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {provider.models.slice(0, 12).map((model) => (
                      <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="font-medium text-sm">{model.name}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {provider.models.length > 12 && (
                      <div className="flex items-center justify-center p-3 border rounded-lg border-dashed">
                        <span className="text-sm text-muted-foreground">
                          +{provider.models.length - 12} more models
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}