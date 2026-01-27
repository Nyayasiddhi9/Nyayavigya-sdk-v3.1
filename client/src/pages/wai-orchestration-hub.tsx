import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Activity, Bot, Brain, Building2, ChevronRight, ChevronDown, Clock, 
  Command, Cpu, Database, FileText, Globe, Home, Key, Layers, 
  LayoutDashboard, MessageSquare, Network, Plus, Search, Settings,
  Shield, Sparkles, Target, TrendingUp, Users, Workflow, Zap,
  PlayCircle, PauseCircle, CheckCircle2, AlertCircle, XCircle,
  GitBranch, Eye, Edit, Trash2, RefreshCw, ArrowRight, BarChart3,
  LineChart, PieChart, UserPlus, UserCheck, Link as LinkIcon,
  Vote, Lightbulb, MessageCircle, Scale, Merge, Microscope
} from 'lucide-react';
import { BarChart, Bar, LineChart as RechartsLineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const SIDEBAR_SECTIONS = [
  {
    id: 'mission-control',
    label: 'Mission Control',
    icon: LayoutDashboard,
    items: [
      { id: 'overview', label: 'Executive Overview', icon: Home },
      { id: 'live-ops', label: 'Live Operations', icon: Activity },
      { id: 'alerts', label: 'Alerts & Notifications', icon: AlertCircle },
      { id: 'chat', label: 'Universal Chat', icon: MessageSquare },
    ]
  },
  {
    id: 'orchestration',
    label: 'Intelligent Orchestration',
    icon: Network,
    items: [
      { id: 'teams', label: 'Agent Teams', icon: Users },
      { id: 'twins', label: 'Digital Twins', icon: UserCheck },
      { id: 'workflows', label: 'HITL Workflows', icon: Workflow },
      { id: 'collective', label: 'Collective Intelligence', icon: Brain },
      { id: 'breeding', label: 'Agent Breeding', icon: GitBranch },
      { id: 'routing', label: 'Adaptive Routing', icon: Target },
    ]
  },
  {
    id: 'assets',
    label: 'AI Assets',
    icon: Cpu,
    items: [
      { id: 'agents', label: 'Agent Registry', icon: Bot },
      { id: 'tools', label: 'MCP Tools', icon: Settings },
      { id: 'providers', label: 'LLM Providers', icon: Globe },
      { id: 'models', label: 'Model Catalog', icon: Layers },
    ]
  },
  {
    id: 'governance',
    label: 'Programs & Governance',
    icon: Shield,
    items: [
      { id: 'studios', label: 'Studios', icon: Building2 },
      { id: 'analytics', label: 'Analytics & Cost', icon: BarChart3 },
      { id: 'api-gateway', label: 'API Gateway', icon: Key },
      { id: 'settings', label: 'Platform Settings', icon: Settings },
    ]
  }
];

interface Team {
  id: string;
  name: string;
  type: string;
  status: string;
  memberCount: number;
  leadAgentId: string;
}

interface DigitalTwin {
  id: string;
  name: string;
  sourceType: string;
  status: string;
  lastSync: string;
}

interface HitlWorkflow {
  id: string;
  name: string;
  type: string;
  status: string;
  pendingApprovals: number;
}

export default function WAIOrchestrationHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('mission-control');
  const [activeItem, setActiveItem] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<string[]>(['mission-control', 'orchestration']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [showCreateTwinDialog, setShowCreateTwinDialog] = useState(false);
  const [showCreateWorkflowDialog, setShowCreateWorkflowDialog] = useState(false);

  const { data: orchestrationStatus } = useQuery({
    queryKey: ['/api/enterprise-orchestration/orchestration-status'],
    refetchInterval: 30000
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/enterprise-orchestration/teams'],
    refetchInterval: 60000
  });

  const { data: twinsData, isLoading: twinsLoading } = useQuery({
    queryKey: ['/api/enterprise-orchestration/twins'],
    refetchInterval: 60000
  });

  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ['/api/enterprise-orchestration/workflows'],
    refetchInterval: 60000
  });

  const { data: routingRulesData } = useQuery({
    queryKey: ['/api/enterprise-orchestration/routing-rules'],
    refetchInterval: 60000
  });

  const { data: templateData } = useQuery({
    queryKey: ['/api/enterprise-orchestration/team-templates']
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['/api/wai-admin/dashboard'],
    refetchInterval: 30000
  });

  const status = orchestrationStatus || { features: {}, phases: {} };
  const teams = teamsData?.teams || [];
  const twins = twinsData?.twins || [];
  const workflows = workflowsData?.workflows || [];
  const routingRules = routingRulesData?.rules || [];
  const templates = templateData?.templates || [];
  const dashboard = dashboardData?.data || { agents: { total: 267 }, tools: { total: 532 }, providers: { total: 17 } };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const selectItem = (sectionId: string, itemId: string) => {
    setActiveSection(sectionId);
    setActiveItem(itemId);
  };

  const metricsData = [
    { name: 'Mon', tasks: 120, success: 115 },
    { name: 'Tue', tasks: 150, success: 142 },
    { name: 'Wed', tasks: 180, success: 175 },
    { name: 'Thu', tasks: 140, success: 138 },
    { name: 'Fri', tasks: 200, success: 195 },
    { name: 'Sat', tasks: 90, success: 88 },
    { name: 'Sun', tasks: 85, success: 82 }
  ];

  const renderContent = () => {
    switch (activeItem) {
      case 'overview':
        return renderOverview();
      case 'teams':
        return renderTeams();
      case 'twins':
        return renderTwins();
      case 'workflows':
        return renderWorkflows();
      case 'collective':
        return renderCollectiveIntelligence();
      case 'breeding':
        return renderAgentBreeding();
      case 'routing':
        return renderAdaptiveRouting();
      case 'agents':
        return renderAgentsRegistry();
      case 'chat':
        return renderUniversalChat();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" data-testid="text-overview-title">Executive Overview</h2>
          <p className="text-slate-400 mt-1">Real-time platform health and orchestration status</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCreateTeamDialog(true)}
            className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
            data-testid="button-create-team"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
          <Button 
            variant="outline" 
            className="border-white/20 hover:bg-white/10"
            onClick={() => selectItem('mission-control', 'chat')}
            data-testid="button-open-chat"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Open Chat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl" data-testid="card-metric-agents">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Agents</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  {dashboard.agents?.total || 267}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400">+12</span>
              <span className="text-slate-500 ml-1">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl" data-testid="card-metric-teams">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Teams</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {teams.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-400">{status.features?.teamBuilder?.templatesAvailable || 5} templates</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl" data-testid="card-metric-workflows">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">HITL Workflows</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  {workflows.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <Workflow className="w-6 h-6 text-violet-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-400">Auto-approve: {(status.features?.hitlWorkflows?.autoApproveThreshold || 0.95) * 100}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl" data-testid="card-metric-routing">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Routing Rules</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {status.features?.adaptiveRouting?.activeRules || 10}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400">ML-optimized</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Orchestration Activity
            </CardTitle>
            <CardDescription>Weekly task execution overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="success" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start bg-slate-700/50 hover:bg-slate-700 border border-white/10"
              onClick={() => selectItem('orchestration', 'teams')}
              data-testid="button-quick-teams"
            >
              <Users className="w-4 h-4 mr-2 text-cyan-400" />
              Manage Agent Teams
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
            <Button 
              className="w-full justify-start bg-slate-700/50 hover:bg-slate-700 border border-white/10"
              onClick={() => selectItem('orchestration', 'workflows')}
              data-testid="button-quick-workflows"
            >
              <Workflow className="w-4 h-4 mr-2 text-violet-400" />
              HITL Workflows
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
            <Button 
              className="w-full justify-start bg-slate-700/50 hover:bg-slate-700 border border-white/10"
              onClick={() => selectItem('orchestration', 'collective')}
              data-testid="button-quick-collective"
            >
              <Brain className="w-4 h-4 mr-2 text-purple-400" />
              Collective Intelligence
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
            <Button 
              className="w-full justify-start bg-slate-700/50 hover:bg-slate-700 border border-white/10"
              onClick={() => selectItem('orchestration', 'breeding')}
              data-testid="button-quick-breeding"
            >
              <GitBranch className="w-4 h-4 mr-2 text-green-400" />
              Agent Breeding
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Phase Status</CardTitle>
              <CardDescription>Enterprise orchestration phases</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white">Phase 2: Team Builder</span>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {status.phases?.phase2 || 'active'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white">Phase 3: HITL Workflows</span>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {status.phases?.phase3 || 'active'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white">Phase 5: Collective Intelligence</span>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {status.phases?.phase5 || 'active'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Feature Capabilities</CardTitle>
            <CardDescription>Enabled enterprise features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Digital Twins</span>
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/50">
                {status.features?.digitalTwins?.privacyCompliant ? 'GDPR Compliant' : 'Enabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Agent Breeding</span>
              <Badge variant="outline" className="text-violet-400 border-violet-400/50">
                {status.features?.agentBreeding?.requiresApproval ? 'Approval Required' : 'Auto'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Collective Intelligence</span>
              <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                Max {status.features?.collectiveIntelligence?.maxRounds || 5} Rounds
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Adaptive Routing</span>
              <Badge variant="outline" className="text-green-400 border-green-400/50">
                {status.features?.adaptiveRouting?.activeRules || 10} Rules
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" data-testid="text-teams-title">Agent Teams</h2>
          <p className="text-slate-400 mt-1">Create and manage collaborative agent teams</p>
        </div>
        <Button 
          onClick={() => setShowCreateTeamDialog(true)}
          className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
          data-testid="button-create-team-main"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template: any) => (
          <Card 
            key={template.id} 
            className="bg-slate-800/50 border-white/10 backdrop-blur-xl hover:border-blue-500/50 transition-all cursor-pointer"
            data-testid={`card-template-${template.id}`}
          >
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                {template.name}
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Bot className="w-4 h-4" />
                <span>{template.defaultRoles?.length || 0} default roles</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {template.defaultRoles?.slice(0, 3).map((role: string) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
                {template.defaultRoles?.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.defaultRoles.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Active Teams</CardTitle>
          <CardDescription>{teams.length} teams configured</CardDescription>
        </CardHeader>
        <CardContent>
          {teamsLoading ? (
            <div className="text-center py-8 text-slate-400">Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No teams created yet</p>
              <p className="text-slate-500 text-sm mt-1">Create your first agent team using a template above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map((team: Team) => (
                <div 
                  key={team.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  data-testid={`row-team-${team.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{team.name}</p>
                      <p className="text-slate-400 text-sm">{team.type} • {team.memberCount || 0} members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={
                      team.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      team.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    }>
                      {team.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTwins = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" data-testid="text-twins-title">Digital Twins</h2>
          <p className="text-slate-400 mt-1">AI representations with behavior modeling and GDPR/CCPA compliance</p>
        </div>
        <Button 
          onClick={() => setShowCreateTwinDialog(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          data-testid="button-create-twin"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create Twin
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{twins.length}</p>
                <p className="text-slate-400 text-sm">Active Twins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">GDPR</p>
                <p className="text-slate-400 text-sm">Privacy Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">Real-time</p>
                <p className="text-slate-400 text-sm">Behavior Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Digital Twin Registry</CardTitle>
          <CardDescription>Manage AI representations of users and agents</CardDescription>
        </CardHeader>
        <CardContent>
          {twinsLoading ? (
            <div className="text-center py-8 text-slate-400">Loading twins...</div>
          ) : twins.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No digital twins created yet</p>
              <p className="text-slate-500 text-sm mt-1">Create digital twins for behavior modeling and decision capture</p>
            </div>
          ) : (
            <div className="space-y-3">
              {twins.map((twin: DigitalTwin) => (
                <div 
                  key={twin.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  data-testid={`row-twin-${twin.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white font-medium">{twin.name?.charAt(0) || 'T'}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{twin.name}</p>
                      <p className="text-slate-400 text-sm">{twin.sourceType} • Last sync: {twin.lastSync || 'Never'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={
                      twin.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      twin.status === 'learning' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-500/20 text-slate-400'
                    }>
                      {twin.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderWorkflows = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" data-testid="text-workflows-title">HITL Workflows</h2>
          <p className="text-slate-400 mt-1">Human-in-the-loop approval workflows with confidence-based escalation</p>
        </div>
        <Button 
          onClick={() => setShowCreateWorkflowDialog(true)}
          className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          data-testid="button-create-workflow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-white">95%</p>
            <p className="text-slate-400 text-sm">Auto-Approve Threshold</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-white">70%</p>
            <p className="text-slate-400 text-sm">Review Threshold</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-white">50%</p>
            <p className="text-slate-400 text-sm">Escalate Threshold</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-white">{workflows.length}</p>
            <p className="text-slate-400 text-sm">Active Workflows</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Workflow Registry</CardTitle>
          <CardDescription>Configure approval policies and escalation rules</CardDescription>
        </CardHeader>
        <CardContent>
          {workflowsLoading ? (
            <div className="text-center py-8 text-slate-400">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8">
              <Workflow className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No workflows created yet</p>
              <p className="text-slate-500 text-sm mt-1">Create workflows with confidence-based approval thresholds</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow: HitlWorkflow) => (
                <div 
                  key={workflow.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  data-testid={`row-workflow-${workflow.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                      <Workflow className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{workflow.name}</p>
                      <p className="text-slate-400 text-sm">{workflow.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {workflow.pendingApprovals > 0 && (
                      <Badge className="bg-yellow-500/20 text-yellow-400">
                        {workflow.pendingApprovals} pending
                      </Badge>
                    )}
                    <Badge className={
                      workflow.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      'bg-slate-500/20 text-slate-400'
                    }>
                      {workflow.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <PlayCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCollectiveIntelligence = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" data-testid="text-collective-title">Collective Intelligence</h2>
          <p className="text-slate-400 mt-1">Multi-agent collaborative thinking with 5 modes</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          data-testid="button-start-session"
        >
          <Brain className="w-4 h-4 mr-2" />
          Start Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { mode: 'brainstorm', icon: Lightbulb, color: 'yellow', desc: 'Generate ideas freely' },
          { mode: 'consensus', icon: MessageCircle, color: 'blue', desc: 'Reach agreement' },
          { mode: 'vote', icon: Vote, color: 'violet', desc: 'Democratic decision' },
          { mode: 'debate', icon: Scale, color: 'orange', desc: 'Argue positions' },
          { mode: 'synthesis', icon: Merge, color: 'green', desc: 'Combine insights' },
        ].map(({ mode, icon: Icon, color, desc }) => (
          <Card 
            key={mode}
            className="bg-slate-800/50 border-white/10 backdrop-blur-xl hover:border-blue-500/50 transition-all cursor-pointer"
            data-testid={`card-mode-${mode}`}
          >
            <CardContent className="pt-6 text-center">
              <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 flex items-center justify-center mb-3`}>
                <Icon className={`w-6 h-6 text-${color}-400`} />
              </div>
              <p className="text-white font-medium capitalize">{mode}</p>
              <p className="text-slate-400 text-xs mt-1">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Recent Sessions</CardTitle>
          <CardDescription>Collective intelligence session history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400">No collective sessions yet</p>
            <p className="text-slate-500 text-sm mt-1">Start a session to enable multi-agent collaborative thinking</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAgentBreeding = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" data-testid="text-breeding-title">Agent Breeding</h2>
          <p className="text-slate-400 mt-1">Autonomous agent creation with 4 strategies</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          data-testid="button-initiate-breeding"
        >
          <GitBranch className="w-4 h-4 mr-2" />
          Initiate Breeding
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { strategy: 'crossover', desc: 'Combine traits from parent agents', icon: Merge },
          { strategy: 'specialization', desc: 'Narrow focus on specific domain', icon: Target },
          { strategy: 'evolution', desc: 'Iterative improvement', icon: TrendingUp },
          { strategy: 'fusion', desc: 'Merge multiple agent capabilities', icon: Sparkles },
        ].map(({ strategy, desc, icon: Icon }) => (
          <Card 
            key={strategy}
            className="bg-slate-800/50 border-white/10 backdrop-blur-xl hover:border-green-500/50 transition-all cursor-pointer"
            data-testid={`card-strategy-${strategy}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white font-medium capitalize">{strategy}</span>
              </div>
              <p className="text-slate-400 text-sm">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Breeding History</CardTitle>
              <CardDescription>Agent lineage and evolution records</CardDescription>
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-400">
              Approval Required
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <GitBranch className="w-12 h-12 mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400">No breeding records yet</p>
            <p className="text-slate-500 text-sm mt-1">Initiate breeding to create specialized agent offspring</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAdaptiveRouting = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" data-testid="text-routing-title">Adaptive Routing</h2>
          <p className="text-slate-400 mt-1">ML-based task-to-agent matching with {routingRules.length || 10} active rules</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          data-testid="button-create-rule"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {routingRules.length || 10}
            </p>
            <p className="text-slate-400 text-sm">Active Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              ML
            </p>
            <p className="text-slate-400 text-sm">Optimization</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Auto
            </p>
            <p className="text-slate-400 text-sm">Fallback</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Routing Rules</CardTitle>
          <CardDescription>Configure task-to-agent matching rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(routingRules.length > 0 ? routingRules : [
              { id: '1', name: 'Code Tasks', pattern: 'code|program|develop', targetAgents: ['cto-agent', 'developer-agent'], priority: 100 },
              { id: '2', name: 'Design Tasks', pattern: 'design|ui|ux', targetAgents: ['designer-agent'], priority: 90 },
              { id: '3', name: 'Analysis Tasks', pattern: 'analyze|research', targetAgents: ['analyst-agent'], priority: 80 },
            ]).map((rule: any) => (
              <div 
                key={rule.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                data-testid={`row-rule-${rule.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{rule.name}</p>
                    <p className="text-slate-400 text-sm font-mono">{rule.pattern}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-slate-300">
                    Priority: {rule.priority}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAgentsRegistry = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" data-testid="text-agents-title">Agent Registry</h2>
          <p className="text-slate-400 mt-1">Manage {dashboard.agents?.total || 267} registered agents</p>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Search agents..." 
            className="w-64 bg-slate-800/50 border-white/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-agents"
          />
          <Button variant="outline" className="border-white/20">
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{dashboard.agents?.total || 267}</p>
                <p className="text-slate-400 text-sm">Total Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{dashboard.agents?.configured || 136}</p>
                <p className="text-slate-400 text-sm">Configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{dashboard.agents?.active || 89}</p>
                <p className="text-slate-400 text-sm">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">L4</p>
                <p className="text-slate-400 text-sm">Max ROMA Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Agent Tiers</CardTitle>
          <CardDescription>Agents organized by ROMA autonomy levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { tier: 'Executive', count: 34, color: 'violet' },
              { tier: 'Development', count: 160, color: 'blue' },
              { tier: 'Creative', count: 17, color: 'pink' },
              { tier: 'QA', count: 7, color: 'green' },
              { tier: 'DevOps', count: 11, color: 'cyan' },
              { tier: 'Domain', count: 38, color: 'orange' },
            ].map(({ tier, count, color }) => (
              <div 
                key={tier}
                className="p-4 rounded-lg bg-slate-700/30 text-center cursor-pointer hover:bg-slate-700/50 transition-colors"
              >
                <p className={`text-2xl font-bold text-${color}-400`}>{count}</p>
                <p className="text-slate-400 text-sm">{tier}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUniversalChat = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white" data-testid="text-chat-title">Global Agent Chat</h2>
          <p className="text-slate-400 mt-1">Interact with 267+ agents • 23 Languages • Voice I/O • Multimodal</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          onClick={() => setLocation('/global-chat')}
          data-testid="button-fullscreen-chat"
        >
          Open Global Chat
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      <Card className="flex-1 bg-slate-800/50 border-white/10 backdrop-blur-xl">
        <CardContent className="h-full flex items-center justify-center py-16">
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center mb-6">
              <Brain className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">World-Class Agent Chat Interface</h3>
            <p className="text-slate-400 text-sm mb-6">
              Choose from 267 agents, select teams or groups, upload documents & images, 
              use voice input/output, and export responses to PDF, DOCX, or XLSX.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <Badge variant="outline" className="border-violet-500/50 text-violet-400">267 Agents</Badge>
              <Badge variant="outline" className="border-blue-500/50 text-blue-400">23 Languages</Badge>
              <Badge variant="outline" className="border-green-500/50 text-green-400">Voice I/O</Badge>
              <Badge variant="outline" className="border-orange-500/50 text-orange-400">Multimodal</Badge>
            </div>
            <Button 
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              onClick={() => setLocation('/global-chat')}
              data-testid="button-launch-chat"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Launch Global Agent Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-64 bg-slate-900/50 border-r border-white/10 backdrop-blur-xl flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white" data-testid="text-logo">WAI SDK</h1>
              <p className="text-xs text-slate-400">v1.0 Orchestration</p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search..." 
              className="pl-9 bg-slate-800/50 border-white/10 text-sm"
              data-testid="input-sidebar-search"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2">
          <nav className="space-y-1 py-2">
            {SIDEBAR_SECTIONS.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors"
                  data-testid={`button-section-${section.id}`}
                >
                  <div className="flex items-center gap-2">
                    <section.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </div>
                  {expandedSections.includes(section.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {expandedSections.includes(section.id) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => selectItem(section.id, item.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeItem === item.id 
                            ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-white border border-blue-500/30' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                        data-testid={`button-item-${item.id}`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">Admin</p>
              <p className="text-xs text-slate-400 truncate">Platform Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">
              {SIDEBAR_SECTIONS.find(s => s.id === activeSection)?.items.find(i => i.id === activeItem)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setLocation('/wai-admin')}>
              <Settings className="w-4 h-4" />
            </Button>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
              All Systems Operational
            </Badge>
          </div>
        </header>

        <div className="p-6">
          {renderContent()}
        </div>
      </main>

      <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Create Agent Team</DialogTitle>
            <DialogDescription>Configure a new collaborative agent team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Team Name</Label>
              <Input className="mt-1 bg-slate-800/50 border-white/20" placeholder="Enter team name" data-testid="input-team-name" />
            </div>
            <div>
              <Label className="text-slate-300">Template</Label>
              <Select>
                <SelectTrigger className="mt-1 bg-slate-800/50 border-white/20">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {templates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Lead Agent</Label>
              <Input className="mt-1 bg-slate-800/50 border-white/20" placeholder="Agent ID" data-testid="input-lead-agent" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTeamDialog(false)}>Cancel</Button>
            <Button className="bg-gradient-to-r from-blue-500 to-violet-500">Create Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
