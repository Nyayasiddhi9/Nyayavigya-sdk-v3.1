import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Key, 
  Users, 
  BarChart3, 
  Settings, 
  Copy, 
  Trash2, 
  Plus, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  description: string | null;
  plan: string;
  isActive: boolean;
  createdAt: string;
  maxMembers: number;
}

interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

interface UsageSummary {
  currentPeriod: {
    tokensUsed: number;
    requestCount: number;
    estimatedCost: number;
  };
  limits: {
    monthlyTokenLimit: number;
    requestsPerMinute: number;
  };
  periodStart: string;
  periodEnd: string;
}

interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
  isComplete: boolean;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    required: boolean;
    completed: boolean;
  }>;
}

interface Member {
  id: number;
  userId: string;
  role: string;
  joinedAt: string;
}

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800',
  starter: 'bg-blue-100 text-blue-800',
  professional: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-amber-100 text-amber-800',
};

const planLimits: Record<string, { agents: number; tokens: string; price: string }> = {
  free: { agents: 10, tokens: '100K', price: 'Free' },
  starter: { agents: 50, tokens: '1M', price: '$49/mo' },
  professional: { agents: 150, tokens: '10M', price: '$199/mo' },
  enterprise: { agents: -1, tokens: 'Unlimited', price: 'Custom' },
};

export default function OrgAdminDashboard() {
  const { toast } = useToast();
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['agents:read', 'agents:execute']);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const { data: organizations, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['/api/v2/orgs/organizations'],
    select: (res: any) => res?.data || res || [],
  });

  const activeOrg = selectedOrg || organizations?.[0]?.id;

  const { data: apiKeys, isLoading: keysLoading } = useQuery<ApiKey[]>({
    queryKey: ['/api/v2/orgs/organizations', activeOrg, 'api-keys'],
    enabled: !!activeOrg,
    select: (res: any) => res?.data || res || [],
  });

  const { data: usage, isLoading: usageLoading } = useQuery<UsageSummary>({
    queryKey: ['/api/v2/orgs/organizations', activeOrg, 'usage'],
    enabled: !!activeOrg,
    select: (res: any) => res?.data || res,
  });

  const { data: onboarding } = useQuery<OnboardingProgress>({
    queryKey: ['/api/v2/orgs/organizations', activeOrg, 'onboarding'],
    enabled: !!activeOrg,
    select: (res: any) => res?.data || res,
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ['/api/v2/orgs/organizations', activeOrg, 'members'],
    enabled: !!activeOrg,
    select: (res: any) => res?.data || res || [],
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data: { name: string; scopes: string[] }) => {
      const response = await apiRequest('POST', `/api/v2/orgs/organizations/${activeOrg}/api-keys`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/v2/orgs/organizations', activeOrg, 'api-keys'] });
      setShowNewKey(data.data?.key || null);
      setNewKeyName('');
      toast({ title: 'API Key Created', description: 'Your new API key has been generated.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create API key', variant: 'destructive' });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      await apiRequest('DELETE', `/api/v2/orgs/organizations/${activeOrg}/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v2/orgs/organizations', activeOrg, 'api-keys'] });
      toast({ title: 'API Key Revoked', description: 'The API key has been revoked.' });
    },
  });

  const completeStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      await apiRequest('POST', `/api/v2/orgs/organizations/${activeOrg}/onboarding/complete-step`, { stepId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v2/orgs/organizations', activeOrg, 'onboarding'] });
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      await apiRequest('POST', `/api/v2/orgs/organizations/${activeOrg}/members`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v2/orgs/organizations', activeOrg, 'members'] });
      setInviteEmail('');
      setIsInviteOpen(false);
      toast({ title: 'Invitation Sent', description: 'Team member has been invited.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to invite member', variant: 'destructive' });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('DELETE', `/api/v2/orgs/organizations/${activeOrg}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v2/orgs/organizations', activeOrg, 'members'] });
      toast({ title: 'Member Removed', description: 'Team member has been removed.' });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      await apiRequest('PATCH', `/api/v2/orgs/organizations/${activeOrg}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v2/orgs/organizations'] });
      toast({ title: 'Settings Updated', description: 'Organization settings have been saved.' });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  const currentOrg = organizations?.find(o => o.id === activeOrg);
  const planInfo = currentOrg ? planLimits[currentOrg.plan] || planLimits.free : planLimits.free;

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-spinner">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3" data-testid="page-title">
              <Building2 className="h-8 w-8 text-primary" />
              Organization Admin
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your WAI SDK organization, API keys, and usage
            </p>
          </div>
          
          {organizations && organizations.length > 1 && (
            <Select value={String(activeOrg)} onValueChange={(v) => setSelectedOrg(Number(v))}>
              <SelectTrigger className="w-[250px]" data-testid="org-selector">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {onboarding && !onboarding.isComplete && (
          <Card className="mb-8 border-primary/20 bg-primary/5" data-testid="onboarding-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Getting Started
              </CardTitle>
              <CardDescription>Complete these steps to unlock the full power of WAI SDK</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>{onboarding.percentComplete}% complete</span>
                  <span>{onboarding.currentStep} of {onboarding.totalSteps} steps</span>
                </div>
                <Progress value={onboarding.percentComplete} className="h-2" data-testid="onboarding-progress" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {onboarding.steps.map((step) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border text-center ${
                      step.completed 
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                    data-testid={`onboarding-step-${step.id}`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 mx-auto text-green-600 mb-1" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                    )}
                    <p className="text-xs font-medium">{step.name}</p>
                    {!step.completed && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="mt-1 h-6 text-xs"
                        onClick={() => completeStepMutation.mutate(step.id)}
                        data-testid={`complete-step-${step.id}`}
                      >
                        Mark Done
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card data-testid="stat-plan">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Current Plan</p>
                  <p className="text-2xl font-bold capitalize">{currentOrg?.plan || 'Free'}</p>
                  <p className="text-sm text-slate-600">{planInfo.price}</p>
                </div>
                <Badge className={planColors[currentOrg?.plan || 'free']}>
                  {planInfo.agents === -1 ? 'Unlimited' : `${planInfo.agents} agents`}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-tokens">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Tokens Used</p>
                  <p className="text-2xl font-bold">
                    {usage?.currentPeriod?.tokensUsed?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-slate-600">
                    of {planInfo.tokens} monthly
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
              {usage?.limits?.monthlyTokenLimit && usage.limits.monthlyTokenLimit > 0 && (
                <Progress 
                  value={(usage.currentPeriod.tokensUsed / usage.limits.monthlyTokenLimit) * 100} 
                  className="mt-3 h-1.5" 
                />
              )}
            </CardContent>
          </Card>

          <Card data-testid="stat-requests">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">API Requests</p>
                  <p className="text-2xl font-bold">
                    {usage?.currentPeriod?.requestCount?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-slate-600">this period</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-cost">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Estimated Cost</p>
                  <p className="text-2xl font-bold">
                    ${usage?.currentPeriod?.estimatedCost?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-slate-600">this billing cycle</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="api-keys" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4" data-testid="admin-tabs">
            <TabsTrigger value="api-keys" className="flex items-center gap-2" data-testid="tab-api-keys">
              <Key className="h-4 w-4" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2" data-testid="tab-usage">
              <BarChart3 className="h-4 w-4" /> Usage
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2" data-testid="tab-members">
              <Users className="h-4 w-4" /> Members
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2" data-testid="tab-settings">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage your WAI SDK API keys for programmatic access</CardDescription>
                </div>
                <Dialog open={isCreateKeyOpen} onOpenChange={setIsCreateKeyOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-key">
                      <Plus className="h-4 w-4 mr-2" /> Create Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create API Key</DialogTitle>
                      <DialogDescription>
                        Generate a new API key for your organization
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName">Key Name</Label>
                        <Input
                          id="keyName"
                          placeholder="e.g., Production API Key"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          data-testid="input-key-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Scopes</Label>
                        <div className="flex flex-wrap gap-2">
                          {['agents:read', 'agents:execute', 'agents:write', 'usage:read', 'config:read', 'config:write'].map((scope) => (
                            <Badge
                              key={scope}
                              variant={newKeyScopes.includes(scope) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                setNewKeyScopes(prev => 
                                  prev.includes(scope) 
                                    ? prev.filter(s => s !== scope)
                                    : [...prev, scope]
                                );
                              }}
                              data-testid={`scope-${scope}`}
                            >
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => {
                          createKeyMutation.mutate({ name: newKeyName, scopes: newKeyScopes });
                          setIsCreateKeyOpen(false);
                        }}
                        disabled={!newKeyName || createKeyMutation.isPending}
                        data-testid="button-confirm-create-key"
                      >
                        {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {showNewKey && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg" data-testid="new-key-display">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          New API Key Created
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Copy this key now. You won't be able to see it again.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          copyToClipboard(showNewKey);
                          setShowNewKey(null);
                        }}
                        data-testid="button-copy-new-key"
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copy & Dismiss
                      </Button>
                    </div>
                    <code className="block mt-2 p-2 bg-white dark:bg-slate-800 rounded text-sm font-mono break-all">
                      {showNewKey}
                    </code>
                  </div>
                )}

                {keysLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : apiKeys && apiKeys.length > 0 ? (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`api-key-${key.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${key.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Key className={`h-4 w-4 ${key.isActive ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{key.name}</p>
                            <p className="text-sm text-slate-500 font-mono">{key.keyPrefix}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <p className="text-slate-500">
                              {key.lastUsedAt ? `Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}` : 'Never used'}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {key.scopes.slice(0, 3).map((scope) => (
                                <Badge key={scope} variant="outline" className="text-xs">
                                  {scope}
                                </Badge>
                              ))}
                              {key.scopes.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{key.scopes.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => revokeKeyMutation.mutate(key.id)}
                            disabled={revokeKeyMutation.isPending}
                            data-testid={`button-revoke-key-${key.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500" data-testid="no-keys-message">
                    <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No API keys yet</p>
                    <p className="text-sm">Create your first API key to start using WAI SDK</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>Monitor your API usage and costs</CardDescription>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg" data-testid="usage-tokens">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">Token Usage</span>
                        </div>
                        <p className="text-2xl font-bold">{usage?.currentPeriod?.tokensUsed?.toLocaleString() || 0}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {usage?.limits?.monthlyTokenLimit 
                            ? `${((usage.currentPeriod.tokensUsed / usage.limits.monthlyTokenLimit) * 100).toFixed(1)}% of limit`
                            : 'Unlimited'
                          }
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg" data-testid="usage-requests">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">API Requests</span>
                        </div>
                        <p className="text-2xl font-bold">{usage?.currentPeriod?.requestCount?.toLocaleString() || 0}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {usage?.limits?.requestsPerMinute} req/min limit
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg" data-testid="usage-cost">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium">Estimated Cost</span>
                        </div>
                        <p className="text-2xl font-bold">${usage?.currentPeriod?.estimatedCost?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Billing period: {usage?.periodStart ? new Date(usage.periodStart).toLocaleDateString() : 'N/A'} - {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Rate Limits</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <span className="text-sm">Requests per Minute</span>
                          <Badge variant="outline">{usage?.limits?.requestsPerMinute || 60}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <span className="text-sm">Monthly Token Limit</span>
                          <Badge variant="outline">
                            {usage?.limits?.monthlyTokenLimit 
                              ? usage.limits.monthlyTokenLimit.toLocaleString()
                              : 'Unlimited'
                            }
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage who has access to your organization ({members?.length || 0} / {currentOrg?.maxMembers || 5} members)
                  </CardDescription>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-invite-member">
                      <Plus className="h-4 w-4 mr-2" /> Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your organization
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="colleague@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          data-testid="input-invite-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger data-testid="select-invite-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole })}
                        disabled={!inviteEmail || inviteMemberMutation.isPending}
                        data-testid="button-confirm-invite"
                      >
                        {inviteMemberMutation.isPending ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {members && members.length > 0 ? (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`member-${member.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">User {member.userId.slice(0, 8)}...</p>
                            <p className="text-sm text-slate-500">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role === 'owner' ? 'default' : 'outline'}>
                            {member.role}
                          </Badge>
                          {member.role !== 'owner' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeMemberMutation.mutate(member.userId)}
                              disabled={removeMemberMutation.isPending}
                              data-testid={`button-remove-member-${member.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500" data-testid="no-members-message">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No team members yet</p>
                    <p className="text-sm">Invite colleagues to collaborate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Configure your organization preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input 
                      value={currentOrg?.name || ''} 
                      disabled 
                      data-testid="input-org-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={currentOrg?.plan?.toUpperCase() || 'FREE'} 
                        disabled 
                        className="capitalize"
                      />
                      <Button variant="outline" data-testid="button-upgrade-plan">Upgrade</Button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" /> Security Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium">API Key Rotation</p>
                        <p className="text-sm text-slate-500">Automatically rotate API keys every 90 days</p>
                      </div>
                      <Button variant="outline" size="sm" data-testid="button-toggle-rotation">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium">IP Allowlist</p>
                        <p className="text-sm text-slate-500">Restrict API access to specific IP addresses</p>
                      </div>
                      <Button variant="outline" size="sm" data-testid="button-configure-ip">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium">Webhook Notifications</p>
                        <p className="text-sm text-slate-500">Get notified about usage and security events</p>
                      </div>
                      <Button variant="outline" size="sm" data-testid="button-configure-webhooks">Configure</Button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Billing Period
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-500">Current Period</p>
                        <p className="font-medium">
                          {usage?.periodStart ? new Date(usage.periodStart).toLocaleDateString() : 'N/A'} - {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Button variant="outline" data-testid="button-view-invoices">View Invoices</Button>
                    </div>
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
