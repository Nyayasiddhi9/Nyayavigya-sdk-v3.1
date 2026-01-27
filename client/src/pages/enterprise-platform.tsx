import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Building2, Users, Bot, Brain, Shield, Settings, BarChart3, 
  Plus, Search, Edit, Trash2, Check, X, Eye, Clock, AlertCircle,
  ChevronRight, Globe, Cpu, Key, Layers, ToggleLeft, Activity,
  MessageSquare, Image, Mic, Video, Lock, Zap, DollarSign,
  TrendingUp, UserPlus, Crown, FileText, Filter, RefreshCw
} from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo: string;
  plan: string;
  planTier: string;
  maxMembers: number;
  maxAgents: number;
  maxTeams: number;
  isActive: boolean;
  domain: string;
  industry: string;
  size: string;
  region: string;
  timezone: string;
  complianceLevel: string;
  apiQuota: number;
  monthlyTokenLimit: number;
  billingEmail: string;
  technicalContact: string;
  createdAt: string;
}

interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalAgentTeams: number;
  totalAdmins: number;
  totalApiCalls: number;
  totalTokensUsed: number;
}

interface OrganizationAdmin {
  id: number;
  organizationId: number;
  userId: string;
  role: string;
  department: string;
  canManageAgents: boolean;
  canManageTeams: boolean;
  canManageLLMs: boolean;
  canManageBilling: boolean;
  canManageSettings: boolean;
  isActive: boolean;
  user?: { email: string; firstName: string; lastName: string };
}

interface AgentTeam {
  id: number;
  organizationId: number;
  name: string;
  description: string;
  teamType: string;
  romaLevel: string;
  agentIds: string[];
  leadAgentId: string;
  coordinationMode: string;
  maxConcurrentTasks: number;
  priority: number;
  isActive: boolean;
}

interface IntelligenceRule {
  id: number;
  organizationId: number;
  ruleName: string;
  ruleType: string;
  description: string;
  conditions: any[];
  actions: any[];
  priority: number;
  isActive: boolean;
  triggerCount: number;
}

interface LLMSetting {
  id: number;
  organizationId: number;
  providerId: string;
  modelId: string;
  isEnabled: boolean;
  priority: number;
  costLimit: string;
  monthlyBudget: string;
  currentSpend: string;
  rateLimit: number;
  routingWeight: number;
}

interface PlatformFeature {
  id: number;
  organizationId: number;
  featureKey: string;
  featureName: string;
  category: string;
  isEnabled: boolean;
  usageCount: number;
}

const PLAN_TIERS = ['starter', 'professional', 'enterprise', 'unlimited'];
const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Legal', 'Government', 'Other'];
const SIZES = ['small', 'medium', 'large', 'enterprise'];
const COMPLIANCE_LEVELS = ['standard', 'hipaa', 'soc2', 'gdpr', 'iso27001'];
const TEAM_TYPES = ['general', 'development', 'creative', 'qa', 'devops', 'executive', 'support', 'sales'];
const ROMA_LEVELS = ['L1', 'L2', 'L3', 'L4'];
const COORDINATION_MODES = ['collaborative', 'hierarchical', 'swarm', 'debate', 'consensus'];
const RULE_TYPES = ['routing', 'escalation', 'approval', 'cost_limit', 'quality_gate', 'access_control'];
const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'viewer'];

const FEATURE_CATEGORIES = {
  language: { icon: Globe, label: 'Language Support', color: 'bg-blue-500' },
  chat: { icon: MessageSquare, label: 'Chat Features', color: 'bg-green-500' },
  multimodal: { icon: Image, label: 'Multimodal', color: 'bg-purple-500' },
  security: { icon: Shield, label: 'Security', color: 'bg-red-500' },
  integrations: { icon: Zap, label: 'Integrations', color: 'bg-amber-500' },
  agents: { icon: Bot, label: 'Agent Features', color: 'bg-cyan-500' }
};

const DEFAULT_PLATFORM_FEATURES = [
  { key: 'language_english', name: 'English Support', category: 'language' },
  { key: 'language_hindi', name: 'Hindi Support', category: 'language' },
  { key: 'language_spanish', name: 'Spanish Support', category: 'language' },
  { key: 'language_french', name: 'French Support', category: 'language' },
  { key: 'language_german', name: 'German Support', category: 'language' },
  { key: 'language_chinese', name: 'Chinese Support', category: 'language' },
  { key: 'language_japanese', name: 'Japanese Support', category: 'language' },
  { key: 'chat_streaming', name: 'Real-time Streaming', category: 'chat' },
  { key: 'chat_memory', name: 'Conversation Memory', category: 'chat' },
  { key: 'chat_context', name: 'Context Awareness', category: 'chat' },
  { key: 'chat_history', name: 'Chat History', category: 'chat' },
  { key: 'multimodal_image', name: 'Image Generation', category: 'multimodal' },
  { key: 'multimodal_vision', name: 'Vision Analysis', category: 'multimodal' },
  { key: 'multimodal_voice', name: 'Voice Synthesis', category: 'multimodal' },
  { key: 'multimodal_audio', name: 'Audio Processing', category: 'multimodal' },
  { key: 'security_sso', name: 'Single Sign-On', category: 'security' },
  { key: 'security_2fa', name: 'Two-Factor Auth', category: 'security' },
  { key: 'security_audit', name: 'Audit Logging', category: 'security' },
  { key: 'security_encryption', name: 'Data Encryption', category: 'security' },
  { key: 'integration_slack', name: 'Slack Integration', category: 'integrations' },
  { key: 'integration_teams', name: 'Teams Integration', category: 'integrations' },
  { key: 'integration_api', name: 'REST API Access', category: 'integrations' },
  { key: 'integration_webhook', name: 'Webhooks', category: 'integrations' },
  { key: 'agents_custom', name: 'Custom Agents', category: 'agents' },
  { key: 'agents_breeding', name: 'Agent Breeding', category: 'agents' },
  { key: 'agents_orchestration', name: 'Queen Orchestration', category: 'agents' },
  { key: 'agents_grpo', name: 'GRPO Learning', category: 'agents' }
];

const LLM_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-opus', 'claude-3-haiku'] },
  { id: 'google', name: 'Google', models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  { id: 'xai', name: 'xAI', models: ['grok-2', 'grok-beta'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { id: 'groq', name: 'Groq', models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] },
  { id: 'together', name: 'Together AI', models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'mistralai/Mixtral-8x22B'] }
];

export default function EnterprisePlatform() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('organizations');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newOrg, setNewOrg] = useState({ name: '', slug: '', description: '', industry: 'Technology', planTier: 'starter', size: 'small' });
  const [newAdmin, setNewAdmin] = useState({ email: '', role: 'admin', department: '', permissions: {} });
  const [newTeam, setNewTeam] = useState({ name: '', description: '', teamType: 'general', romaLevel: 'L2', coordinationMode: 'collaborative' });
  const [newRule, setNewRule] = useState({ ruleName: '', ruleType: 'routing', description: '', priority: 5 });

  const { data: organizations = [], isLoading: orgsLoading, refetch: refetchOrgs } = useQuery<Organization[]>({
    queryKey: ['/api/enterprise/organizations']
  });

  const { data: orgAdmins = [], isLoading: adminsLoading } = useQuery<OrganizationAdmin[]>({
    queryKey: ['/api/enterprise/organizations', selectedOrg?.id, 'admins'],
    enabled: !!selectedOrg
  });

  const { data: agentTeams = [], isLoading: teamsLoading } = useQuery<AgentTeam[]>({
    queryKey: ['/api/enterprise/organizations', selectedOrg?.id, 'teams'],
    enabled: !!selectedOrg
  });

  const { data: intelligenceRules = [], isLoading: rulesLoading } = useQuery<IntelligenceRule[]>({
    queryKey: ['/api/enterprise/organizations', selectedOrg?.id, 'rules'],
    enabled: !!selectedOrg
  });

  const { data: llmSettings = [], isLoading: llmLoading } = useQuery<LLMSetting[]>({
    queryKey: ['/api/enterprise/organizations', selectedOrg?.id, 'llm-settings'],
    enabled: !!selectedOrg
  });

  const { data: platformFeatures = [], isLoading: featuresLoading } = useQuery<PlatformFeature[]>({
    queryKey: ['/api/enterprise/organizations', selectedOrg?.id, 'features'],
    enabled: !!selectedOrg
  });

  const { data: platformStats } = useQuery<PlatformStats>({
    queryKey: ['/api/enterprise/stats']
  });

  const createOrgMutation = useMutation({
    mutationFn: (data: typeof newOrg) => apiRequest('/api/enterprise/organizations', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/organizations'] });
      toast({ title: 'Organization Created', description: 'New organization has been created successfully.' });
      setShowCreateOrg(false);
      setNewOrg({ name: '', slug: '', description: '', industry: 'Technology', planTier: 'starter', size: 'small' });
    },
    onError: (error: any) => toast({ title: 'Error', description: error.message, variant: 'destructive' })
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ orgId, data }: { orgId: number; data: Partial<Organization> }) => 
      apiRequest(`/api/enterprise/organizations/${orgId}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/organizations'] });
      toast({ title: 'Organization Updated', description: 'Organization settings have been saved.' });
    }
  });

  const createAdminMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/enterprise/organizations/${selectedOrg?.id}/admins`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/organizations', selectedOrg?.id, 'admins'] });
      toast({ title: 'Admin Added', description: 'New admin has been added to the organization.' });
      setShowCreateAdmin(false);
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/enterprise/organizations/${selectedOrg?.id}/teams`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/organizations', selectedOrg?.id, 'teams'] });
      toast({ title: 'Team Created', description: 'New agent team has been created.' });
      setShowCreateTeam(false);
    }
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/enterprise/organizations/${selectedOrg?.id}/rules`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/organizations', selectedOrg?.id, 'rules'] });
      toast({ title: 'Rule Created', description: 'New intelligence rule has been created.' });
      setShowCreateRule(false);
    }
  });

  const toggleLLMMutation = useMutation({
    mutationFn: ({ settingId, isEnabled }: { settingId: number; isEnabled: boolean }) =>
      apiRequest(`/api/enterprise/organizations/${selectedOrg?.id}/llm-settings/${settingId}`, 'PATCH', { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/organizations', selectedOrg?.id, 'llm-settings'] });
      toast({ title: 'LLM Setting Updated' });
    }
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: ({ featureId, isEnabled }: { featureId: number; isEnabled: boolean }) =>
      apiRequest(`/api/enterprise/organizations/${selectedOrg?.id}/features/${featureId}`, 'PATCH', { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/organizations', selectedOrg?.id, 'features'] });
      toast({ title: 'Feature Updated' });
    }
  });

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = platformStats || {
    totalOrganizations: organizations.length,
    activeOrganizations: organizations.filter(o => o.isActive).length,
    totalAgentTeams: 0,
    totalAdmins: 0,
    totalApiCalls: 0,
    totalTokensUsed: 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-slate-900/80 border-r border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Enterprise Platform</h1>
              <p className="text-xs text-slate-400">Multi-Org Management</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'organizations', label: 'Organizations', icon: Building2 },
              { id: 'admins', label: 'Admin Users', icon: Users },
              { id: 'teams', label: 'Agent Teams', icon: Bot },
              { id: 'rules', label: 'Intelligence Rules', icon: Brain },
              { id: 'llm', label: 'LLM Control', icon: Cpu },
              { id: 'features', label: 'Platform Features', icon: Layers },
              { id: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Global Settings', icon: Settings }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                data-testid={`nav-${item.id}`}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id 
                    ? 'bg-purple-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <div className="mb-6 grid grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Organizations</p>
                    <p className="text-2xl font-bold text-white">{stats.totalOrganizations}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Active Organizations</p>
                    <p className="text-2xl font-bold text-green-400">{stats.activeOrganizations}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Agent Teams</p>
                    <p className="text-2xl font-bold text-cyan-400">{stats.totalAgentTeams}</p>
                  </div>
                  <Bot className="h-8 w-8 text-cyan-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Platform Admins</p>
                    <p className="text-2xl font-bold text-amber-400">{stats.totalAdmins}</p>
                  </div>
                  <Crown className="h-8 w-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {activeTab === 'organizations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Organizations</h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search organizations..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-600 text-white w-64"
                      data-testid="input-search-orgs"
                    />
                  </div>
                  <Button onClick={() => refetchOrgs()} variant="outline" className="border-slate-600" data-testid="button-refresh-orgs">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-create-org">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Organization
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create New Organization</DialogTitle>
                        <DialogDescription>Add a new organization to the platform</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label className="text-white">Organization Name</Label>
                          <Input 
                            value={newOrg.name}
                            onChange={(e) => setNewOrg({...newOrg, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                            placeholder="Acme Corporation"
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-org-name"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Slug (URL identifier)</Label>
                          <Input 
                            value={newOrg.slug}
                            onChange={(e) => setNewOrg({...newOrg, slug: e.target.value})}
                            placeholder="acme-corp"
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-org-slug"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Description</Label>
                          <Textarea 
                            value={newOrg.description}
                            onChange={(e) => setNewOrg({...newOrg, description: e.target.value})}
                            placeholder="Brief description of the organization"
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-org-description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Industry</Label>
                            <Select value={newOrg.industry} onValueChange={(v) => setNewOrg({...newOrg, industry: v})}>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-org-industry">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-white">Plan Tier</Label>
                            <Select value={newOrg.planTier} onValueChange={(v) => setNewOrg({...newOrg, planTier: v})}>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-org-plan">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PLAN_TIERS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-white">Organization Size</Label>
                          <Select value={newOrg.size} onValueChange={(v) => setNewOrg({...newOrg, size: v})}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-org-size">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SIZES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateOrg(false)} className="border-slate-600">Cancel</Button>
                        <Button 
                          onClick={() => createOrgMutation.mutate(newOrg)}
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={!newOrg.name || createOrgMutation.isPending}
                          data-testid="button-submit-org"
                        >
                          {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid gap-4">
                {orgsLoading ? (
                  <Card className="bg-slate-800/50 border-slate-700 p-8">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
                    </div>
                  </Card>
                ) : filteredOrgs.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700 p-8">
                    <div className="text-center text-slate-400">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No organizations found. Create your first organization to get started.</p>
                    </div>
                  </Card>
                ) : (
                  filteredOrgs.map(org => (
                    <Card 
                      key={org.id}
                      className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-all hover:border-purple-500 ${
                        selectedOrg?.id === org.id ? 'border-purple-500 ring-1 ring-purple-500' : ''
                      }`}
                      onClick={() => setSelectedOrg(org)}
                      data-testid={`card-org-${org.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                              {org.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-white">{org.name}</h3>
                                {org.isActive ? (
                                  <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                                ) : (
                                  <Badge className="bg-red-500/20 text-red-400">Inactive</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-400">{org.slug} · {org.industry}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-slate-400">Plan</p>
                              <Badge className="bg-purple-500/20 text-purple-400 capitalize">{org.planTier || org.plan}</Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-400">Limits</p>
                              <p className="text-sm text-white">{org.maxAgents} agents · {org.maxTeams} teams</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-400">API Quota</p>
                              <p className="text-sm text-white">{org.apiQuota?.toLocaleString() || '10,000'}/mo</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'admins' && selectedOrg && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Admin Users</h2>
                  <p className="text-slate-400">Managing admins for: {selectedOrg.name}</p>
                </div>
                <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-add-admin">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add Organization Admin</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-white">Email Address</Label>
                        <Input 
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                          placeholder="admin@example.com"
                          className="bg-slate-700 border-slate-600 text-white"
                          data-testid="input-admin-email"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Role</Label>
                        <Select value={newAdmin.role} onValueChange={(v) => setNewAdmin({...newAdmin, role: v})}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-admin-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ADMIN_ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Department</Label>
                        <Input 
                          value={newAdmin.department}
                          onChange={(e) => setNewAdmin({...newAdmin, department: e.target.value})}
                          placeholder="Engineering"
                          className="bg-slate-700 border-slate-600 text-white"
                          data-testid="input-admin-department"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-white">Permissions</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'canManageAgents', label: 'Manage Agents' },
                            { key: 'canManageTeams', label: 'Manage Teams' },
                            { key: 'canManageLLMs', label: 'Manage LLMs' },
                            { key: 'canManageBilling', label: 'Manage Billing' },
                            { key: 'canManageSettings', label: 'Manage Settings' },
                            { key: 'canInviteUsers', label: 'Invite Users' }
                          ].map(perm => (
                            <div key={perm.key} className="flex items-center gap-2">
                              <Switch 
                                checked={newAdmin.permissions[perm.key as keyof typeof newAdmin.permissions] || false}
                                onCheckedChange={(checked) => setNewAdmin({
                                  ...newAdmin, 
                                  permissions: {...newAdmin.permissions, [perm.key]: checked}
                                })}
                                data-testid={`switch-${perm.key}`}
                              />
                              <Label className="text-slate-300 text-sm">{perm.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateAdmin(false)} className="border-slate-600">Cancel</Button>
                      <Button 
                        onClick={() => createAdminMutation.mutate(newAdmin)}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={!newAdmin.email}
                        data-testid="button-submit-admin"
                      >
                        Add Admin
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="bg-slate-800/50 border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">User</TableHead>
                      <TableHead className="text-slate-400">Role</TableHead>
                      <TableHead className="text-slate-400">Department</TableHead>
                      <TableHead className="text-slate-400">Permissions</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-purple-400" />
                        </TableCell>
                      </TableRow>
                    ) : orgAdmins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                          No admins configured. Add your first admin to manage this organization.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orgAdmins.map(admin => (
                        <TableRow key={admin.id} className="border-slate-700" data-testid={`row-admin-${admin.id}`}>
                          <TableCell className="text-white">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Users className="h-4 w-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="font-medium">{admin.user?.firstName} {admin.user?.lastName}</p>
                                <p className="text-xs text-slate-400">{admin.user?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-500/20 text-purple-400 capitalize">
                              {admin.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{admin.department || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {admin.canManageAgents && <Badge className="bg-blue-500/20 text-blue-400 text-xs">Agents</Badge>}
                              {admin.canManageTeams && <Badge className="bg-green-500/20 text-green-400 text-xs">Teams</Badge>}
                              {admin.canManageLLMs && <Badge className="bg-amber-500/20 text-amber-400 text-xs">LLMs</Badge>}
                              {admin.canManageBilling && <Badge className="bg-red-500/20 text-red-400 text-xs">Billing</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {admin.isActive ? (
                              <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                            ) : (
                              <Badge className="bg-slate-500/20 text-slate-400">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-slate-600" data-testid={`button-edit-admin-${admin.id}`}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-500/20" data-testid={`button-delete-admin-${admin.id}`}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'teams' && selectedOrg && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Agent Teams</h2>
                  <p className="text-slate-400">Configure agent teams for: {selectedOrg.name}</p>
                </div>
                <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-create-team">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create Agent Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-white">Team Name</Label>
                        <Input 
                          value={newTeam.name}
                          onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                          placeholder="Development Team"
                          className="bg-slate-700 border-slate-600 text-white"
                          data-testid="input-team-name"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Description</Label>
                        <Textarea 
                          value={newTeam.description}
                          onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                          className="bg-slate-700 border-slate-600 text-white"
                          data-testid="input-team-description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Team Type</Label>
                          <Select value={newTeam.teamType} onValueChange={(v) => setNewTeam({...newTeam, teamType: v})}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-team-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TEAM_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-white">ROMA Level</Label>
                          <Select value={newTeam.romaLevel} onValueChange={(v) => setNewTeam({...newTeam, romaLevel: v})}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-team-roma">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROMA_LEVELS.map(l => <SelectItem key={l} value={l}>{l} - {l === 'L1' ? 'Basic' : l === 'L2' ? 'Standard' : l === 'L3' ? 'Advanced' : 'Executive'}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-white">Coordination Mode</Label>
                        <Select value={newTeam.coordinationMode} onValueChange={(v) => setNewTeam({...newTeam, coordinationMode: v})}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-team-coordination">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COORDINATION_MODES.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateTeam(false)} className="border-slate-600">Cancel</Button>
                      <Button 
                        onClick={() => createTeamMutation.mutate(newTeam)}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={!newTeam.name}
                        data-testid="button-submit-team"
                      >
                        Create Team
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {teamsLoading ? (
                  <Card className="bg-slate-800/50 border-slate-700 p-8 col-span-2">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
                    </div>
                  </Card>
                ) : agentTeams.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700 p-8 col-span-2">
                    <div className="text-center text-slate-400">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No agent teams configured. Create your first team to organize agents.</p>
                    </div>
                  </Card>
                ) : (
                  agentTeams.map(team => (
                    <Card key={team.id} className="bg-slate-800/50 border-slate-700" data-testid={`card-team-${team.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/20">
                              <Bot className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div>
                              <CardTitle className="text-white">{team.name}</CardTitle>
                              <CardDescription>{team.description}</CardDescription>
                            </div>
                          </div>
                          {team.isActive ? (
                            <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                          ) : (
                            <Badge className="bg-slate-500/20 text-slate-400">Inactive</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Type</p>
                            <p className="text-white capitalize">{team.teamType}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">ROMA Level</p>
                            <Badge className="bg-purple-500/20 text-purple-400">{team.romaLevel}</Badge>
                          </div>
                          <div>
                            <p className="text-slate-400">Coordination</p>
                            <p className="text-white capitalize">{team.coordinationMode}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-sm text-slate-400">{team.agentIds?.length || 0} agents assigned</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-slate-600" data-testid={`button-edit-team-${team.id}`}>
                              <Edit className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" className="border-cyan-600 text-cyan-400" data-testid={`button-manage-agents-${team.id}`}>
                              <Bot className="h-3 w-3 mr-1" /> Manage Agents
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'rules' && selectedOrg && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Intelligence Rules</h2>
                  <p className="text-slate-400">Business logic and routing rules for: {selectedOrg.name}</p>
                </div>
                <Dialog open={showCreateRule} onOpenChange={setShowCreateRule}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-create-rule">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Rule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create Intelligence Rule</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-white">Rule Name</Label>
                        <Input 
                          value={newRule.ruleName}
                          onChange={(e) => setNewRule({...newRule, ruleName: e.target.value})}
                          placeholder="Cost Threshold Alert"
                          className="bg-slate-700 border-slate-600 text-white"
                          data-testid="input-rule-name"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Rule Type</Label>
                        <Select value={newRule.ruleType} onValueChange={(v) => setNewRule({...newRule, ruleType: v})}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-rule-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RULE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Description</Label>
                        <Textarea 
                          value={newRule.description}
                          onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                          className="bg-slate-700 border-slate-600 text-white"
                          data-testid="input-rule-description"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Priority (1-10)</Label>
                        <Input 
                          type="number"
                          min={1}
                          max={10}
                          value={newRule.priority}
                          onChange={(e) => setNewRule({...newRule, priority: parseInt(e.target.value) || 5})}
                          className="bg-slate-700 border-slate-600 text-white"
                          data-testid="input-rule-priority"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateRule(false)} className="border-slate-600">Cancel</Button>
                      <Button 
                        onClick={() => createRuleMutation.mutate(newRule)}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={!newRule.ruleName}
                        data-testid="button-submit-rule"
                      >
                        Create Rule
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {rulesLoading ? (
                  <Card className="bg-slate-800/50 border-slate-700 p-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-400" />
                  </Card>
                ) : intelligenceRules.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700 p-8">
                    <div className="text-center text-slate-400">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No intelligence rules configured. Create rules to automate routing and decisions.</p>
                    </div>
                  </Card>
                ) : (
                  intelligenceRules.map(rule => (
                    <Card key={rule.id} className="bg-slate-800/50 border-slate-700" data-testid={`card-rule-${rule.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-amber-500/20">
                              <Brain className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{rule.ruleName}</h3>
                              <p className="text-sm text-slate-400">{rule.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-slate-400">Type</p>
                              <Badge className="bg-blue-500/20 text-blue-400 capitalize">{rule.ruleType.replace('_', ' ')}</Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-400">Priority</p>
                              <Badge className="bg-purple-500/20 text-purple-400">{rule.priority}/10</Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-400">Triggered</p>
                              <p className="text-white">{rule.triggerCount || 0} times</p>
                            </div>
                            <Switch checked={rule.isActive} data-testid={`switch-rule-${rule.id}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'llm' && selectedOrg && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">LLM Model Control</h2>
                  <p className="text-slate-400">Enable/disable models and configure routing for: {selectedOrg.name}</p>
                </div>
              </div>

              <div className="grid gap-6">
                {LLM_PROVIDERS.map(provider => (
                  <Card key={provider.id} className="bg-slate-800/50 border-slate-700" data-testid={`card-provider-${provider.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                            <Cpu className="h-5 w-5 text-white" />
                          </div>
                          <CardTitle className="text-white">{provider.name}</CardTitle>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {provider.models.map(model => {
                          const setting = llmSettings.find(s => s.providerId === provider.id && s.modelId === model);
                          const isEnabled = setting?.isEnabled ?? true;
                          return (
                            <div 
                              key={model} 
                              className={`p-4 rounded-lg border ${isEnabled ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-800/50 border-slate-700 opacity-60'}`}
                              data-testid={`model-${provider.id}-${model}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-medium">{model}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {setting && (
                                      <>
                                        <span className="text-xs text-slate-400">Priority: {setting.priority}</span>
                                        <span className="text-xs text-slate-400">·</span>
                                        <span className="text-xs text-slate-400">Weight: {setting.routingWeight}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Switch 
                                  checked={isEnabled}
                                  onCheckedChange={(checked) => {
                                    if (setting) {
                                      toggleLLMMutation.mutate({ settingId: setting.id, isEnabled: checked });
                                    }
                                  }}
                                  data-testid={`switch-model-${provider.id}-${model}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'features' && selectedOrg && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Platform Features</h2>
                  <p className="text-slate-400">Enable/disable platform features for: {selectedOrg.name}</p>
                </div>
              </div>

              <div className="grid gap-6">
                {Object.entries(FEATURE_CATEGORIES).map(([category, config]) => {
                  const Icon = config.icon;
                  const categoryFeatures = DEFAULT_PLATFORM_FEATURES.filter(f => f.category === category);
                  return (
                    <Card key={category} className="bg-slate-800/50 border-slate-700" data-testid={`card-category-${category}`}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <CardTitle className="text-white">{config.label}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          {categoryFeatures.map(feature => {
                            const featureSetting = platformFeatures.find(f => f.featureKey === feature.key);
                            const isEnabled = featureSetting?.isEnabled ?? false;
                            return (
                              <div 
                                key={feature.key}
                                className={`p-4 rounded-lg border ${isEnabled ? 'bg-slate-700/50 border-green-500/50' : 'bg-slate-800/50 border-slate-700'}`}
                                data-testid={`feature-${feature.key}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-white text-sm">{feature.name}</span>
                                  <Switch 
                                    checked={isEnabled}
                                    onCheckedChange={(checked) => {
                                      if (featureSetting) {
                                        toggleFeatureMutation.mutate({ featureId: featureSetting.id, isEnabled: checked });
                                      }
                                    }}
                                    data-testid={`switch-feature-${feature.key}`}
                                  />
                                </div>
                                {featureSetting && (
                                  <p className="text-xs text-slate-400 mt-2">Used {featureSetting.usageCount || 0} times</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'settings' && selectedOrg && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Organization Settings</h2>
                  <p className="text-slate-400">Configure limits, quotas, and advanced settings for: {selectedOrg.name}</p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-save-settings">
                  <Check className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Organization Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Organization Name</Label>
                      <Input defaultValue={selectedOrg.name} className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-name" />
                    </div>
                    <div>
                      <Label className="text-white">Domain</Label>
                      <Input defaultValue={selectedOrg.domain || ''} placeholder="example.com" className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-domain" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Industry</Label>
                        <Select defaultValue={selectedOrg.industry || 'Technology'}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-settings-industry">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Size</Label>
                        <Select defaultValue={selectedOrg.size || 'small'}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-settings-size">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SIZES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Compliance & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Compliance Level</Label>
                      <Select defaultValue={selectedOrg.complianceLevel || 'standard'}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-settings-compliance">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPLIANCE_LEVELS.map(c => <SelectItem key={c} value={c} className="uppercase">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Region</Label>
                      <Input defaultValue={selectedOrg.region || 'global'} className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-region" />
                    </div>
                    <div>
                      <Label className="text-white">Timezone</Label>
                      <Input defaultValue={selectedOrg.timezone || 'UTC'} className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-timezone" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Resource Limits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-white">Max Members</Label>
                        <Input type="number" defaultValue={selectedOrg.maxMembers} className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-max-members" />
                      </div>
                      <div>
                        <Label className="text-white">Max Agents</Label>
                        <Input type="number" defaultValue={selectedOrg.maxAgents} className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-max-agents" />
                      </div>
                      <div>
                        <Label className="text-white">Max Teams</Label>
                        <Input type="number" defaultValue={selectedOrg.maxTeams} className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-max-teams" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">API Quota (monthly)</Label>
                        <Input type="number" defaultValue={selectedOrg.apiQuota} className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-api-quota" />
                      </div>
                      <div>
                        <Label className="text-white">Token Limit (monthly)</Label>
                        <Input type="number" defaultValue={selectedOrg.monthlyTokenLimit} className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-token-limit" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Subscription & Billing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Plan Tier</Label>
                      <Select defaultValue={selectedOrg.planTier || 'starter'}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-settings-plan">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAN_TIERS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Billing Email</Label>
                      <Input defaultValue={selectedOrg.billingEmail || ''} placeholder="billing@example.com" className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-billing-email" />
                    </div>
                    <div>
                      <Label className="text-white">Technical Contact</Label>
                      <Input defaultValue={selectedOrg.technicalContact || ''} placeholder="tech@example.com" className="bg-slate-700 border-slate-600 text-white" data-testid="input-settings-tech-contact" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {!selectedOrg && activeTab !== 'organizations' && (
            <Card className="bg-slate-800/50 border-slate-700 p-12">
              <div className="text-center text-slate-400">
                <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">Select an Organization</h3>
                <p>Go to Organizations tab and select an organization to manage its settings.</p>
                <Button 
                  onClick={() => setActiveTab('organizations')} 
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                  data-testid="button-go-to-orgs"
                >
                  Go to Organizations
                </Button>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
