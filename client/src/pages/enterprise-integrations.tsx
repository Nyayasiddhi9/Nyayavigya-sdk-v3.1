import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Plug, 
  Plus, 
  Star, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Settings,
  TrendingUp,
  Activity,
  Zap,
  Cloud,
  Code,
  Database,
  Webhook
} from "lucide-react";
import { SSOAuthenticationSystem } from '@/components/enterprise/SSOAuthenticationSystem';
import { WorkflowAutomationSystem } from '@/components/enterprise/WorkflowAutomationSystem';
import { ComplianceSecurityFramework } from '@/components/enterprise/ComplianceSecurityFramework';

interface IntegrationTemplate {
  id: string;
  name: string;
  provider: string;
  type: string;
  description: string;
  features: string[];
  requiredCredentials: string[];
  optionalSettings: Record<string, any>;
  webhookSupport: boolean;
  realTimeSync: boolean;
  popularity: number;
}

interface IntegrationConfig {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: string;
  lastSync?: string;
  syncEnabled: boolean;
  createdAt: string;
}

export default function EnterpriseIntegrations() {
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [popularIntegrations, setPopularIntegrations] = useState<IntegrationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();

  // Integration creation form
  const [integrationForm, setIntegrationForm] = useState({
    name: '',
    credentials: {},
    settings: {},
    syncEnabled: true,
    webhookUrl: ''
  });

  useEffect(() => {
    loadTemplates();
    loadIntegrations();
    loadPopularIntegrations();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/templates');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load integration templates",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load integration templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      const result = await response.json();
      
      if (result.success) {
        setIntegrations(result.data);
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
  };

  const loadPopularIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations/popular?limit=6');
      const result = await response.json();
      
      if (result.success) {
        setPopularIntegrations(result.data);
      }
    } catch (error) {
      console.error('Failed to load popular integrations:', error);
    }
  };

  const createIntegration = async () => {
    if (!selectedTemplate || !integrationForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please select a template and provide a name",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: integrationForm.name,
          type: selectedTemplate.type,
          provider: selectedTemplate.provider,
          credentials: integrationForm.credentials,
          settings: integrationForm.settings,
          syncEnabled: integrationForm.syncEnabled,
          webhookUrl: integrationForm.webhookUrl
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Integration "${result.data.name}" created successfully`,
        });
        setSelectedTemplate(null);
        setIntegrationForm({
          name: '',
          credentials: {},
          settings: {},
          syncEnabled: true,
          webhookUrl: ''
        });
        loadIntegrations();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create integration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create integration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const performSync = async (integrationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: 'bidirectional' }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Data synchronization completed successfully",
        });
        loadIntegrations();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to perform sync",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform sync",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline" | null | undefined> = {
      'connected': 'default',
      'disconnected': 'secondary',
      'error': 'destructive',
      'configuring': 'secondary'
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      'crm': '👥',
      'erp': '🏢',
      'marketing': '📢',
      'communication': '💬',
      'cloud': '☁️',
      'analytics': '📊',
      'productivity': '⚡',
      'ecommerce': '🛒'
    };
    return (icons as any)[type] || '🔗';
  };

  const filteredTemplates = filterType === 'all' 
    ? templates 
    : templates.filter(t => t.type === filterType);

  const updateCredential = (key: string, value: string) => {
    setIntegrationForm(prev => ({
      ...prev,
      credentials: { ...prev.credentials, [key]: value }
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Integrations</h1>
          <p className="text-muted-foreground">
            Connect with CRM, ERP, marketing automation, and third-party services
          </p>
        </div>
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          <Plug className="h-3 w-3 mr-1" />
          Enterprise Hub
        </Badge>
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="my-integrations">My Integrations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          {/* Popular Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Popular Integrations
              </CardTitle>
              <CardDescription>
                Most used enterprise integrations by businesses worldwide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularIntegrations.map((template) => (
                  <Card 
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-2xl">{getTypeIcon(template.type)}</div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-muted-foreground">{template.popularity}</span>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold mb-1">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{template.provider}</p>
                      
                      <div className="flex items-center gap-2 text-xs">
                        {template.realTimeSync && (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="h-2 w-2 mr-1" />
                            Real-time
                          </Badge>
                        )}
                        {template.webhookSupport && (
                          <Badge variant="outline" className="text-xs">
                            Webhooks
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Integration Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Integration Templates</CardTitle>
                  <CardDescription>
                    Browse and configure enterprise integrations
                  </CardDescription>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="erp">ERP</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="cloud">Cloud Services</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading templates...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <Card 
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-3xl">{getTypeIcon(template.type)}</div>
                          <Badge variant="outline" className="capitalize">{template.type}</Badge>
                        </div>
                        
                        <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Features:</span>
                            <span className="text-muted-foreground">{template.features.length}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {template.features.slice(0, 3).map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {template.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Configuration Modal */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Configure Integration: {selectedTemplate.name}</CardTitle>
                <CardDescription>
                  Set up your {selectedTemplate.provider} integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="integration-name">Integration Name</Label>
                    <Input
                      id="integration-name"
                      placeholder={`My ${selectedTemplate.name} Integration`}
                      value={integrationForm.name}
                      onChange={(e) => setIntegrationForm({ ...integrationForm, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://your-app.com/webhooks/integration"
                      value={integrationForm.webhookUrl}
                      onChange={(e) => setIntegrationForm({ ...integrationForm, webhookUrl: e.target.value })}
                    />
                  </div>

                  {/* Credentials Section */}
                  <div className="col-span-2">
                    <h4 className="font-semibold mb-3">Required Credentials</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTemplate.requiredCredentials.map((credential) => (
                        <div key={credential} className="space-y-2">
                          <Label htmlFor={credential}>
                            {credential.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                          <Input
                            id={credential}
                            type={credential.includes('secret') || credential.includes('password') ? 'password' : 'text'}
                            placeholder={`Enter ${credential}`}
                            onChange={(e) => updateCredential(credential, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="col-span-2">
                    <h4 className="font-semibold mb-3">Available Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTemplate.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center space-x-2">
                    <Switch
                      checked={integrationForm.syncEnabled}
                      onCheckedChange={(checked) => setIntegrationForm({ ...integrationForm, syncEnabled: checked })}
                    />
                    <Label>Enable automatic data synchronization</Label>
                  </div>

                  <div className="col-span-2 flex gap-3">
                    <Button onClick={createIntegration} disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Integration
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Integrations</CardTitle>
              <CardDescription>
                Manage your configured enterprise integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(integration.status)}
                          <h3 className="font-semibold">{integration.name}</h3>
                          <Badge variant="outline">{integration.provider}</Badge>
                          {getStatusBadge(integration.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Type: {integration.type.toUpperCase()}</span>
                          {integration.lastSync && (
                            <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>
                          )}
                          <span>Created: {new Date(integration.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => performSync(integration.id)}
                          disabled={loading || integration.status !== 'connected'}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Analytics</CardTitle>
              <CardDescription>
                Monitor integration performance and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Plug className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Total Integrations</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{integrations.length}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Connected</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {integrations.filter(i => i.status === 'connected').length}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Sync Enabled</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {integrations.filter(i => i.syncEnabled).length}
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold">Cloud Services</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {integrations.filter(i => i.type === 'cloud').length}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-4">Integration Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['crm', 'erp', 'marketing', 'communication'].map((type) => {
                    const count = integrations.filter(i => i.type === type).length;
                    return (
                      <div key={type} className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-2xl mb-1">{getTypeIcon(type)}</div>
                        <div className="font-semibold">{type.toUpperCase()}</div>
                        <div className="text-lg font-bold text-blue-600">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Events</CardTitle>
              <CardDescription>
                Monitor real-time webhook events from your integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent webhook events</p>
                  <p className="text-sm">Events will appear here when integrations send data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}