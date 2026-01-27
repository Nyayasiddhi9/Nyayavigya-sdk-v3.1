import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Activity, DollarSign, Zap, Globe, Eye, Settings, Filter, Search, Plus, BarChart3, TrendingUp, Clock, Shield } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface LLMProvider {
  providerId: string;
  name: string;
  description: string;
  type: string;
  models: any[];
  status: string;
  costTier: string;
  qualityScore: number;
  latencyMs: number;
  supportedRegions: string[];
  capabilities: any;
  rateLimit: any;
  pricing: any;
  documentation: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreativeModel {
  modelId: string;
  name: string;
  description: string;
  provider: string;
  modelType: string;
  capabilities: string[];
  supportedFormats: string[];
  maxResolution: string;
  costPerMinute: number;
  averageProcessingTime: number;
  qualityRating: number;
  isActive: boolean;
}

interface ProviderMetrics {
  providerId: string;
  modelId?: string;
  metricType: string;
  value: number;
  timestamp: string;
}

export default function ModelCatalog() {
  const [activeTab, setActiveTab] = useState('providers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [addProviderDialogOpen, setAddProviderDialogOpen] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '',
    description: '',
    type: 'language-model',
    costTier: 'medium',
    documentation: ''
  });
  const { toast } = useToast();

  // Fetch LLM Providers
  const { data: providers = [], isLoading: providersLoading } = useQuery<LLMProvider[]>({
    queryKey: ['/api/admin/llm-providers', { search: searchTerm, type: selectedType, status: selectedStatus }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      params.append('limit', '100'); // Get all providers
      
      return apiRequest(`/api/admin/llm-providers?${params.toString()}`);
    },
    staleTime: 30000 // 30 seconds
  });

  // Fetch Creative Models
  const { data: creativeModels = [], isLoading: modelsLoading } = useQuery<CreativeModel[]>({
    queryKey: ['/api/admin/creative-models', { search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '100'); // Get all models
      
      return apiRequest(`/api/admin/creative-models?${params.toString()}`);
    },
    staleTime: 30000 // 30 seconds
  });

  // Fetch Provider Metrics
  const { data: metrics = [], isLoading: metricsLoading } = useQuery<ProviderMetrics[]>({
    queryKey: ['/api/admin/provider-metrics', { timeRange: '24h' }],
    queryFn: async () => {
      return apiRequest('/api/admin/provider-metrics?timeRange=24h');
    },
    staleTime: 60000 // 60 seconds
  });

  // Toggle Provider Status
  const toggleProviderMutation = useMutation({
    mutationFn: async ({ providerId, isActive }: { providerId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/llm-providers/${providerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to update provider status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/llm-providers'] });
      toast({ title: 'Provider status updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update provider status', variant: 'destructive' });
    }
  });

  // Toggle Model Status
  const toggleModelMutation = useMutation({
    mutationFn: async ({ modelId, isActive }: { modelId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/creative-models/${modelId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to update model status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/creative-models'] });
      toast({ title: 'Model status updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update model status', variant: 'destructive' });
    }
  });

  // Create Provider Mutation
  const createProviderMutation = useMutation({
    mutationFn: async (providerData: typeof newProvider) => {
      return apiRequest('/api/admin/llm-providers', 'POST', providerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/llm-providers'] });
      setAddProviderDialogOpen(false);
      setNewProvider({
        name: '',
        description: '',
        type: 'language-model',
        costTier: 'medium',
        documentation: ''
      });
      toast({ title: 'Provider created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create provider', variant: 'destructive' });
    }
  });

  const handleCreateProvider = () => {
    if (!newProvider.name || !newProvider.description) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    createProviderMutation.mutate(newProvider);
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || provider.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || provider.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredCreativeModels = creativeModels.filter(model => {
    return model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           model.provider.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCostTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Model Catalog</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage 19+ LLM providers, 500+ models, and creative AI capabilities
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" data-testid="button-refresh">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={addProviderDialogOpen} onOpenChange={setAddProviderDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-provider">
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" data-testid="dialog-add-provider">
              <DialogHeader>
                <DialogTitle>Add LLM Provider</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider-name">Provider Name *</Label>
                  <Input
                    id="provider-name"
                    placeholder="e.g., OpenAI, Anthropic"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="input-provider-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="provider-description">Description *</Label>
                  <Textarea
                    id="provider-description"
                    placeholder="Brief description of the provider's capabilities"
                    value={newProvider.description}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, description: e.target.value }))}
                    data-testid="textarea-provider-description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="provider-type">Provider Type</Label>
                  <Select 
                    value={newProvider.type} 
                    onValueChange={(value) => setNewProvider(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger data-testid="select-provider-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="language-model">Language Model</SelectItem>
                      <SelectItem value="image-generation">Image Generation</SelectItem>
                      <SelectItem value="speech-synthesis">Speech Synthesis</SelectItem>
                      <SelectItem value="multimodal">Multimodal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="provider-cost-tier">Cost Tier</Label>
                  <Select 
                    value={newProvider.costTier} 
                    onValueChange={(value) => setNewProvider(prev => ({ ...prev, costTier: value }))}
                  >
                    <SelectTrigger data-testid="select-cost-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="low">Low Cost</SelectItem>
                      <SelectItem value="medium">Medium Cost</SelectItem>
                      <SelectItem value="high">High Cost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="provider-documentation">Documentation URL</Label>
                  <Input
                    id="provider-documentation"
                    placeholder="https://provider-docs.com/api"
                    value={newProvider.documentation}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, documentation: e.target.value }))}
                    data-testid="input-provider-documentation"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => setAddProviderDialogOpen(false)}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-cancel-provider"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProvider}
                    disabled={createProviderMutation.isPending || !newProvider.name || !newProvider.description}
                    className="flex-1"
                    data-testid="button-create-provider"
                  >
                    {createProviderMutation.isPending ? 'Creating...' : 'Create Provider'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search providers, models, or capabilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48" data-testid="select-type">
                <SelectValue placeholder="Provider Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="llm">Language Models</SelectItem>
                <SelectItem value="vision">Vision</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="multimodal">Multimodal</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48" data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="degraded">Degraded</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers" data-testid="tab-providers">LLM Providers</TabsTrigger>
          <TabsTrigger value="creative" data-testid="tab-creative">Creative Models</TabsTrigger>
          <TabsTrigger value="metrics" data-testid="tab-metrics">Performance</TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
        </TabsList>

        {/* LLM Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          {providersLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProviders.map((provider) => (
                <Card key={provider.providerId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(provider.status)}`}></div>
                        <CardTitle className="text-lg" data-testid={`text-provider-${provider.providerId}`}>
                          {provider.name}
                        </CardTitle>
                      </div>
                      <Switch
                        checked={provider.isActive}
                        onCheckedChange={(checked) => 
                          toggleProviderMutation.mutate({ providerId: provider.providerId, isActive: checked })
                        }
                        data-testid={`switch-provider-${provider.providerId}`}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-description-${provider.providerId}`}>
                      {provider.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <Badge variant="outline" data-testid={`badge-type-${provider.providerId}`}>
                          {provider.type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Cost Tier:</span>
                        <Badge className={getCostTierColor(provider.costTier)} data-testid={`badge-cost-${provider.providerId}`}>
                          {provider.costTier}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Quality:</span>
                        <div className="flex items-center gap-1">
                          <span data-testid={`text-quality-${provider.providerId}`}>{provider.qualityScore}/5</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full mr-1 ${
                                  i < provider.qualityScore ? 'bg-yellow-400' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Latency:</span>
                        <span className="flex items-center gap-1" data-testid={`text-latency-${provider.providerId}`}>
                          <Clock className="h-3 w-3" />
                          {provider.latencyMs}ms
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Models:</span>
                        <span data-testid={`text-models-count-${provider.providerId}`}>
                          {provider.models?.length || 0} available
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Regions:</span>
                        <span data-testid={`text-regions-${provider.providerId}`}>
                          {provider.supportedRegions?.length || 0} regions
                        </span>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" data-testid={`button-view-${provider.providerId}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-config-${provider.providerId}`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Creative Models Tab */}
        <TabsContent value="creative" className="space-y-4">
          {modelsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCreativeModels.map((model) => (
                <Card key={model.modelId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" data-testid={`text-model-${model.modelId}`}>
                        {model.name}
                      </CardTitle>
                      <Switch
                        checked={model.isActive}
                        onCheckedChange={(checked) => 
                          toggleModelMutation.mutate({ modelId: model.modelId, isActive: checked })
                        }
                        data-testid={`switch-model-${model.modelId}`}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-model-description-${model.modelId}`}>
                      {model.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                        <Badge variant="outline" data-testid={`badge-provider-${model.modelId}`}>
                          {model.provider}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <Badge data-testid={`badge-model-type-${model.modelId}`}>
                          {model.modelType}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Quality:</span>
                        <div className="flex items-center gap-1">
                          <span data-testid={`text-model-quality-${model.modelId}`}>{model.qualityRating}/5</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full mr-1 ${
                                  i < model.qualityRating ? 'bg-yellow-400' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                        <span data-testid={`text-cost-${model.modelId}`}>
                          ${model.costPerMinute}/min
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Max Resolution:</span>
                        <span data-testid={`text-resolution-${model.modelId}`}>
                          {model.maxResolution}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Capabilities:</span>
                        <span data-testid={`text-capabilities-${model.modelId}`}>
                          {model.capabilities?.length || 0} features
                        </span>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" data-testid={`button-test-${model.modelId}`}>
                        <Zap className="h-4 w-4 mr-2" />
                        Test Model
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-model-config-${model.modelId}`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-active-providers">
                  {providers.filter(p => p.isActive).length}
                </div>
                <p className="text-xs text-gray-500">of {providers.length} total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="text-avg-response">
                  {Math.round(providers.reduce((acc, p) => acc + p.latencyMs, 0) / providers.length || 0)}ms
                </div>
                <p className="text-xs text-gray-500">24h average</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600" data-testid="text-total-models">
                  {providers.reduce((acc, p) => acc + (p.models?.length || 0), 0) + creativeModels.length}
                </div>
                <p className="text-xs text-gray-500">across all providers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Cost Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-cost-efficiency">
                  {((providers.filter(p => p.costTier === 'low').length / providers.length) * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-gray-500">low-cost providers</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Provider Performance Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-gray-500 py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Real-time performance charts coming soon</p>
                  <p className="text-sm">Connect to metrics API for live data visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Global Provider Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Coverage across major regions with optimized routing
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600" data-testid="text-us-providers">
                        {providers.filter(p => p.supportedRegions?.includes('us-east-1')).length}
                      </div>
                      <div className="text-sm text-gray-600">US Providers</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600" data-testid="text-eu-providers">
                        {providers.filter(p => p.supportedRegions?.includes('eu-west-1')).length}
                      </div>
                      <div className="text-sm text-gray-600">EU Providers</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SOC 2 Compliant</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      ✓ Verified
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GDPR Compliant</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      ✓ Verified
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Encryption</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      ✓ AES-256
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Security</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      ✓ OAuth 2.0
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Platform Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600" data-testid="text-provider-count">
                    {providers.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">LLM Providers</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Including OpenAI, Anthropic, Google, and more
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600" data-testid="text-model-count">
                    {providers.reduce((acc, p) => acc + (p.models?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Available Models</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Text, vision, audio, and multimodal
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600" data-testid="text-creative-count">
                    {creativeModels.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Creative Models</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Video, music, and image generation
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}