import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Building, Bot, Globe, Shield, Users, BarChart3,
  MessageSquare, Phone, Mail, Calendar, Target, TrendingUp,
  Settings, Lock, CheckCircle, AlertTriangle, Activity,
  DollarSign, Briefcase, Award, Zap, Database, Cloud
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import PlatformAdminBar from '@/components/shared/PlatformAdminBar';

interface BusinessAssistant {
  id: string;
  name: string;
  department: string;
  type: 'sales' | 'support' | 'hr' | 'finance' | 'marketing' | 'operations';
  status: 'active' | 'inactive' | 'training';
  deployments: {
    web: boolean;
    mobile: boolean;
    whatsapp: boolean;
    slack: boolean;
    teams: boolean;
    email: boolean;
  };
  metrics: {
    interactions: number;
    resolutionRate: number;
    avgResponseTime: number;
    satisfaction: number;
    costSaved: number;
  };
  compliance: {
    gdpr: boolean;
    hipaa: boolean;
    sox: boolean;
    iso27001: boolean;
  };
  integrations: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  accessLevel: 'admin' | 'manager' | 'user' | 'viewer';
  lastActive: string;
}

export default function BusinessStudio() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAssistant, setSelectedAssistant] = useState<BusinessAssistant | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  // Enhanced Enterprise Solutions form with SarvamAPI and WAI orchestration
  const [assistantForm, setAssistantForm] = useState({
    name: '',
    department: '',
    type: 'support',
    description: '',
    knowledgeBase: '',
    channels: [] as string[],
    compliance: [] as string[],
    integrations: [] as string[],
    ssoEnabled: false,
    multiTenant: false,
    // Enhanced multilingual enterprise features
    multiLanguage: false,
    languages: [] as string[],
    sarvamAPIEnabled: false,
    culturalAdaptation: false,
    enhancedOrchestration: true,
    qualityLevel: 'quality' as 'balanced' | 'quality' | 'premium',
    securityLevel: 'enterprise' as 'standard' | 'enterprise' | 'government',
    roiTracking: true,
    complianceMonitoring: true,
    riskAssessment: true
  });

  // Fetch business assistants
  const { data: assistants, isLoading, refetch } = useQuery<BusinessAssistant[]>({
    queryKey: ['/api/business/assistants'],
    retry: 2
  });

  // Fetch team members
  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ['/api/business/team'],
    retry: 2
  });

  // Enhanced Enterprise Solutions deployment with WAI orchestration and SarvamAPI
  const deployAssistant = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/platforms/enterprise/applications', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          industry: data.department,
          type: data.type,
          scale: 'enterprise',
          // Enhanced enterprise features
          enhancedOrchestration: data.enhancedOrchestration,
          qualityLevel: data.qualityLevel,
          securityLevel: data.securityLevel,
          multiLanguage: data.multiLanguage,
          languages: data.languages,
          sarvamAPIEnabled: data.sarvamAPIEnabled,
          culturalAdaptation: data.culturalAdaptation,
          roiTracking: data.roiTracking,
          complianceMonitoring: data.complianceMonitoring,
          riskAssessment: data.riskAssessment,
          integrations: data.integrations,
          compliance: data.compliance
        })
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Enterprise Solution Deployed',
        description: `${data.application?.name || 'Enterprise assistant'} deployed with${data.sarvamAPIUsed ? ' SarvamAPI and' : ''} enhanced security`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/business/assistants'] });
      setActiveTab('deployments');
    },
    onError: () => {
      toast({
        title: 'Deployment Failed',
        description: 'Failed to deploy enterprise solution. Please check compliance and security settings.',
        variant: 'destructive'
      });
    }
  });

  const handleDeployAssistant = () => {
    if (!assistantForm.name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for the business assistant',
        variant: 'destructive'
      });
      return;
    }

    setIsDeploying(true);
    deployAssistant.mutate(assistantForm, {
      onSettled: () => setIsDeploying(false)
    });
  };

  const departments = [
    { value: 'sales', label: 'Sales', icon: DollarSign },
    { value: 'support', label: 'Customer Support', icon: MessageSquare },
    { value: 'hr', label: 'Human Resources', icon: Users },
    { value: 'finance', label: 'Finance', icon: BarChart3 },
    { value: 'marketing', label: 'Marketing', icon: Target },
    { value: 'operations', label: 'Operations', icon: Settings }
  ];

  const channels = [
    { value: 'web', label: 'Web Chat', icon: Globe },
    { value: 'mobile', label: 'Mobile App', icon: Phone },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'slack', label: 'Slack', icon: MessageSquare },
    { value: 'teams', label: 'MS Teams', icon: Users },
    { value: 'email', label: 'Email', icon: Mail }
  ];

  const businessStats = {
    totalAssistants: assistants?.length || 0,
    activeAssistants: assistants?.filter(a => a.status === 'active').length || 0,
    totalInteractions: assistants?.reduce((sum, a) => sum + (a.metrics?.interactions || 0), 0) || 0,
    avgSatisfaction: assistants?.length ? 
      (assistants.reduce((sum, a) => sum + (a.metrics?.satisfaction || 0), 0) / assistants.length).toFixed(1) 
      : '0.0',
    costSaved: assistants?.reduce((sum, a) => sum + (a.metrics?.costSaved || 0), 0) || 0,
    teamSize: teamMembers?.length || 0
  };

  return (
    <>
      <PlatformAdminBar platformName="Business Studio" />
      <div className="container max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Building className="h-10 w-10 text-blue-600" />
            Business Studio Enterprise
          </h1>
          <p className="text-lg text-muted-foreground">
            Enterprise AI Assistants with Multi-Channel Deployment & Compliance
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="create">Create Assistant</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="team">Team Management</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <div className="space-y-6">
            {/* Enterprise Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Assistants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{businessStats.totalAssistants}</div>
                  <p className="text-xs text-muted-foreground">Deployed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{businessStats.activeAssistants}</div>
                  <p className="text-xs text-muted-foreground">Running now</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Interactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {businessStats.totalInteractions > 1000 
                      ? `${(businessStats.totalInteractions / 1000).toFixed(1)}K`
                      : businessStats.totalInteractions}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{businessStats.avgSatisfaction}%</div>
                  <p className="text-xs text-muted-foreground">Average</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Cost Saved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${businessStats.costSaved > 1000 
                      ? `${(businessStats.costSaved / 1000).toFixed(0)}K`
                      : businessStats.costSaved}
                  </div>
                  <p className="text-xs text-muted-foreground">This quarter</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{businessStats.teamSize}</div>
                  <p className="text-xs text-muted-foreground">Members</p>
                </CardContent>
              </Card>
            </div>

            {/* Department Assistants */}
            <Card>
              <CardHeader>
                <CardTitle>Department Assistants</CardTitle>
                <CardDescription>AI assistants deployed across your organization</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading business assistants...</p>
                  </div>
                ) : assistants?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assistants.map((assistant) => (
                      <Card key={assistant.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedAssistant(assistant)}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{assistant.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{assistant.department}</Badge>
                                <Badge variant={assistant.status === 'active' ? 'default' : 'secondary'}>
                                  {assistant.status}
                                </Badge>
                              </div>
                            </div>
                            {React.createElement(
                              departments.find(d => d.value === assistant.type)?.icon || Building,
                              { className: "h-5 w-5 text-muted-foreground" }
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Deployment Channels */}
                          <div className="mb-3">
                            <p className="text-xs font-medium mb-2">Active Channels</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(assistant.deployments)
                                .filter(([_, active]) => active)
                                .map(([channel]) => (
                                  <Badge key={channel} variant="outline" className="text-xs">
                                    {channel}
                                  </Badge>
                                ))}
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Interactions</span>
                              <p className="font-medium">{assistant.metrics.interactions}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Resolution</span>
                              <p className="font-medium">{assistant.metrics.resolutionRate}%</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Response</span>
                              <p className="font-medium">{assistant.metrics.avgResponseTime}ms</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Satisfaction</span>
                              <p className="font-medium">{assistant.metrics.satisfaction}%</p>
                            </div>
                          </div>

                          {/* Compliance Badges */}
                          {Object.entries(assistant.compliance).some(([_, compliant]) => compliant) && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-muted-foreground">Compliant:</span>
                                {Object.entries(assistant.compliance)
                                  .filter(([_, compliant]) => compliant)
                                  .map(([standard]) => (
                                    <Badge key={standard} variant="outline" className="text-xs">
                                      {standard.toUpperCase()}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Business Assistants Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Deploy your first enterprise AI assistant
                    </p>
                    <Button onClick={() => setActiveTab('create')}>
                      Create Assistant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Business Assistant</CardTitle>
              <CardDescription>
                Deploy enterprise-grade AI assistants with compliance and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Assistant Name</label>
                  <Input
                    placeholder="e.g., Sales Support Bot"
                    value={assistantForm.name}
                    onChange={(e) => setAssistantForm({...assistantForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Department</label>
                  <Select
                    value={assistantForm.type}
                    onValueChange={(value) => setAssistantForm({...assistantForm, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 block">Description & Purpose</label>
                <Textarea
                  placeholder="Describe the assistant's role, responsibilities, and business objectives..."
                  value={assistantForm.description}
                  onChange={(e) => setAssistantForm({...assistantForm, description: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>

              {/* Knowledge Base */}
              <div>
                <label className="text-sm font-medium mb-2 block">Knowledge Base</label>
                <Textarea
                  placeholder="Enter training data, company policies, FAQs, and domain knowledge..."
                  value={assistantForm.knowledgeBase}
                  onChange={(e) => setAssistantForm({...assistantForm, knowledgeBase: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>

              {/* Deployment Channels */}
              <div>
                <label className="text-sm font-medium mb-2 block">Deployment Channels</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {channels.map((channel) => (
                    <button
                      key={channel.value}
                      onClick={() => {
                        const updated = assistantForm.channels.includes(channel.value)
                          ? assistantForm.channels.filter(c => c !== channel.value)
                          : [...assistantForm.channels, channel.value];
                        setAssistantForm({...assistantForm, channels: updated});
                      }}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        assistantForm.channels.includes(channel.value)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <channel.icon className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs">{channel.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Compliance Requirements */}
              <div>
                <label className="text-sm font-medium mb-2 block">Compliance Standards</label>
                <div className="grid grid-cols-4 gap-3">
                  {['GDPR', 'HIPAA', 'SOX', 'ISO27001'].map((standard) => (
                    <label key={standard} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={assistantForm.compliance.includes(standard.toLowerCase())}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...assistantForm.compliance, standard.toLowerCase()]
                            : assistantForm.compliance.filter(c => c !== standard.toLowerCase());
                          setAssistantForm({...assistantForm, compliance: updated});
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">{standard}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Enhanced Multilingual Enterprise Solutions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Multilingual Enterprise Support</label>
                    <p className="text-sm text-muted-foreground">Enable global enterprise language support</p>
                  </div>
                  <Switch
                    checked={assistantForm.multiLanguage}
                    onCheckedChange={(checked) => setAssistantForm({...assistantForm, multiLanguage: checked})}
                  />
                </div>

                {/* SarvamAPI Integration for Enterprise Indian Market */}
                {assistantForm.multiLanguage && (
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-green-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-orange-600" />
                        <label className="text-sm font-medium text-orange-800">SarvamAPI - Indian Enterprise Market</label>
                      </div>
                      <Switch
                        checked={assistantForm.sarvamAPIEnabled}
                        onCheckedChange={(checked) => setAssistantForm({...assistantForm, sarvamAPIEnabled: checked})}
                      />
                    </div>
                    {assistantForm.sarvamAPIEnabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {['Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia'].map((lang) => (
                            <Button
                              key={lang}
                              variant={assistantForm.languages.includes(lang) ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                const updatedLanguages = assistantForm.languages.includes(lang)
                                  ? assistantForm.languages.filter(l => l !== lang)
                                  : [...assistantForm.languages, lang];
                                setAssistantForm({...assistantForm, languages: updatedLanguages});
                              }}
                            >
                              {lang}
                            </Button>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-orange-800">Cultural Business Adaptation</label>
                          <Switch
                            checked={assistantForm.culturalAdaptation}
                            onCheckedChange={(checked) => setAssistantForm({...assistantForm, culturalAdaptation: checked})}
                          />
                        </div>
                        {assistantForm.culturalAdaptation && (
                          <p className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                            Enterprise solution will adapt to Indian business practices, cultural communication styles, and regional preferences.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* WAI Enhanced Enterprise Orchestration */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <label className="text-sm font-medium text-blue-800">WAI Enhanced Enterprise Security</label>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-blue-800">Enhanced Orchestration Mode</label>
                      <Switch
                        checked={assistantForm.enhancedOrchestration}
                        onCheckedChange={(checked) => setAssistantForm({...assistantForm, enhancedOrchestration: checked})}
                      />
                    </div>
                    {assistantForm.enhancedOrchestration && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-blue-800">Quality Level</label>
                            <Select 
                              value={assistantForm.qualityLevel}
                              onValueChange={(value: 'balanced' | 'quality' | 'premium') => 
                                setAssistantForm({...assistantForm, qualityLevel: value})
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="balanced">Balanced (Cost-optimized)</SelectItem>
                                <SelectItem value="quality">Quality (Enhanced features)</SelectItem>
                                <SelectItem value="premium">Premium (Enterprise-grade)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-blue-800">Security Level</label>
                            <Select 
                              value={assistantForm.securityLevel}
                              onValueChange={(value: 'standard' | 'enterprise' | 'government') => 
                                setAssistantForm({...assistantForm, securityLevel: value})
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                                <SelectItem value="government">Government</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-blue-800">ROI Tracking</label>
                            <Switch
                              checked={assistantForm.roiTracking}
                              onCheckedChange={(checked) => setAssistantForm({...assistantForm, roiTracking: checked})}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-blue-800">Compliance</label>
                            <Switch
                              checked={assistantForm.complianceMonitoring}
                              onCheckedChange={(checked) => setAssistantForm({...assistantForm, complianceMonitoring: checked})}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-blue-800">Risk Assessment</label>
                            <Switch
                              checked={assistantForm.riskAssessment}
                              onCheckedChange={(checked) => setAssistantForm({...assistantForm, riskAssessment: checked})}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                          Enterprise orchestration provides advanced AI agents for compliance monitoring, security assessment, and ROI optimization.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Traditional Enterprise Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Single Sign-On (SSO)</label>
                      <p className="text-sm text-muted-foreground">Enable SSO authentication</p>
                    </div>
                    <Switch
                      checked={assistantForm.ssoEnabled}
                      onCheckedChange={(checked) => setAssistantForm({...assistantForm, ssoEnabled: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Multi-Tenant Support</label>
                      <p className="text-sm text-muted-foreground">Support multiple organizations</p>
                    </div>
                    <Switch
                      checked={assistantForm.multiTenant}
                      onCheckedChange={(checked) => setAssistantForm({...assistantForm, multiTenant: checked})}
                    />
                  </div>
                </div>
              </div>

              {/* Business Integrations */}
              <div>
                <label className="text-sm font-medium mb-2 block">Business Integrations</label>
                <div className="grid grid-cols-4 gap-3">
                  {['Salesforce', 'SAP', 'Oracle', 'Microsoft 365', 'Slack', 'Jira', 'ServiceNow', 'Zendesk'].map((integration) => (
                    <label key={integration} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={assistantForm.integrations.includes(integration)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...assistantForm.integrations, integration]
                            : assistantForm.integrations.filter(i => i !== integration);
                          setAssistantForm({...assistantForm, integrations: updated});
                        }}
                        className="rounded"
                      />
                      <span className="text-xs">{integration}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Deploy Button */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleDeployAssistant}
                  disabled={isDeploying}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isDeploying ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Deploy Assistant
                    </>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Enterprise deployment with security and compliance
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Deployments</CardTitle>
              <CardDescription>
                Monitor and manage deployed assistants across channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.value} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <channel.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{channel.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {assistants?.filter(a => a.deployments[channel.value as keyof typeof a.deployments]).length || 0} assistants deployed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>Manage team access and permissions</CardDescription>
                </div>
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role} • {member.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.accessLevel === 'admin' ? 'default' : 'secondary'}>
                        {member.accessLevel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Active {member.lastActive}
                      </span>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    No team members yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Security</CardTitle>
              <CardDescription>
                Enterprise compliance standards and security configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Compliance Status */}
              <div>
                <h3 className="font-semibold mb-4">Compliance Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['GDPR', 'HIPAA', 'SOX', 'ISO27001'].map((standard) => (
                    <Card key={standard}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium">{standard}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Compliant</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Security Features */}
              <div>
                <h3 className="font-semibold mb-4">Security Features</h3>
                <div className="space-y-3">
                  {[
                    { name: 'End-to-End Encryption', status: 'Enabled', icon: Lock },
                    { name: 'Data Residency Control', status: 'EU Region', icon: Globe },
                    { name: 'Access Control (RBAC)', status: 'Active', icon: Shield },
                    { name: 'Audit Logging', status: 'Enabled', icon: Activity },
                    { name: 'API Rate Limiting', status: 'Configured', icon: AlertTriangle }
                  ].map((feature) => (
                    <div key={feature.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <feature.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{feature.name}</span>
                      </div>
                      <Badge variant="outline">{feature.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Analytics</CardTitle>
              <CardDescription>
                Performance metrics and business insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Chart */}
                <div>
                  <h3 className="font-semibold mb-4">Performance Trends</h3>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">Performance analytics</span>
                  </div>
                </div>

                {/* ROI Metrics */}
                <div>
                  <h3 className="font-semibold mb-4">ROI Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Cost Reduction</span>
                      <span className="text-green-600 font-bold">-32%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Efficiency Gain</span>
                      <span className="text-blue-600 font-bold">+45%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium">Customer Satisfaction</span>
                      <span className="text-purple-600 font-bold">+28%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium">Response Time</span>
                      <span className="text-orange-600 font-bold">-65%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}