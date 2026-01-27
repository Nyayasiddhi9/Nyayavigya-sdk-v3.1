/**
 * Digital Twin Dashboard - "God Mode" View
 * Real-time organizational visualization with semantic zoom
 * 
 * Features:
 * - Live Pulse monitoring
 * - Semantic zoom (company → department → agent → conversation)
 * - Process mining visualization
 * - Real-time metrics streaming
 * - Predictive simulation ("What-If")
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Bot, 
  Building2, 
  Users, 
  Zap, 
  Brain,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Layers,
  GitBranch,
  Cpu,
  Database,
  Cloud,
  RefreshCw,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Shield,
  Workflow,
  MessageSquare
} from "lucide-react";

interface DepartmentStatus {
  id: string;
  name: string;
  icon: string;
  color: string;
  status: 'healthy' | 'degraded' | 'critical';
  capacity: number;
  activeAgents: number;
  totalAgents: number;
  activeWorkflows: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tokenUsage: number;
  costToday: number;
  errorRate: number;
}

interface AgentActivity {
  id: string;
  name: string;
  department: string;
  status: 'active' | 'idle' | 'processing' | 'error';
  currentTask?: string;
  tokensUsed: number;
  lastActive: string;
  responseTime: number;
}

interface LiveMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTokensToday: number;
  totalCostToday: number;
  successRate: number;
  avgResponseTime: number;
  activeWorkflows: number;
  pendingDecisions: number;
  errorCount: number;
}

interface WorkflowProcess {
  id: string;
  name: string;
  department: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime: string;
  estimatedCompletion?: string;
  steps: {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    duration?: number;
  }[];
}

const mockDepartments: DepartmentStatus[] = [
  { id: 'engineering', name: 'Engineering', icon: 'Code', color: '#3b82f6', status: 'healthy', capacity: 92, activeAgents: 12, totalAgents: 15, activeWorkflows: 8, tasksCompleted: 156, tasksInProgress: 23, tokenUsage: 245000, costToday: 12.45, errorRate: 0.02 },
  { id: 'marketing', name: 'Marketing', icon: 'Megaphone', color: '#f97316', status: 'healthy', capacity: 78, activeAgents: 8, totalAgents: 10, activeWorkflows: 5, tasksCompleted: 89, tasksInProgress: 12, tokenUsage: 156000, costToday: 8.23, errorRate: 0.01 },
  { id: 'finance', name: 'Finance', icon: 'DollarSign', color: '#22c55e', status: 'degraded', capacity: 65, activeAgents: 5, totalAgents: 8, activeWorkflows: 3, tasksCompleted: 67, tasksInProgress: 8, tokenUsage: 98000, costToday: 5.67, errorRate: 0.05 },
  { id: 'hr', name: 'HR', icon: 'Users', color: '#8b5cf6', status: 'healthy', capacity: 85, activeAgents: 6, totalAgents: 7, activeWorkflows: 4, tasksCompleted: 45, tasksInProgress: 6, tokenUsage: 78000, costToday: 4.12, errorRate: 0.01 },
  { id: 'legal', name: 'Legal', icon: 'Scale', color: '#64748b', status: 'healthy', capacity: 70, activeAgents: 3, totalAgents: 5, activeWorkflows: 2, tasksCompleted: 23, tasksInProgress: 4, tokenUsage: 45000, costToday: 2.89, errorRate: 0.02 },
  { id: 'operations', name: 'Operations', icon: 'Briefcase', color: '#06b6d4', status: 'critical', capacity: 45, activeAgents: 4, totalAgents: 9, activeWorkflows: 6, tasksCompleted: 78, tasksInProgress: 15, tokenUsage: 134000, costToday: 7.34, errorRate: 0.12 },
];

const mockAgentActivities: AgentActivity[] = [
  { id: 'agent-001', name: 'CTO Agent', department: 'Engineering', status: 'active', currentTask: 'Reviewing architecture proposal', tokensUsed: 45000, lastActive: new Date().toISOString(), responseTime: 234 },
  { id: 'agent-002', name: 'Solution Architect', department: 'Engineering', status: 'processing', currentTask: 'Generating system design', tokensUsed: 32000, lastActive: new Date().toISOString(), responseTime: 567 },
  { id: 'agent-003', name: 'CMO Agent', department: 'Marketing', status: 'active', currentTask: 'Analyzing campaign metrics', tokensUsed: 28000, lastActive: new Date().toISOString(), responseTime: 189 },
  { id: 'agent-004', name: 'CFO Agent', department: 'Finance', status: 'idle', tokensUsed: 15000, lastActive: new Date(Date.now() - 300000).toISOString(), responseTime: 145 },
  { id: 'agent-005', name: 'DevOps Engineer', department: 'Engineering', status: 'error', currentTask: 'Deployment failed - awaiting retry', tokensUsed: 12000, lastActive: new Date().toISOString(), responseTime: 890 },
];

const mockWorkflows: WorkflowProcess[] = [
  {
    id: 'wf-001',
    name: 'Sprint Planning',
    department: 'Engineering',
    status: 'running',
    progress: 65,
    startTime: new Date(Date.now() - 3600000).toISOString(),
    estimatedCompletion: new Date(Date.now() + 1800000).toISOString(),
    steps: [
      { name: 'Gather requirements', status: 'completed', duration: 15 },
      { name: 'Prioritize backlog', status: 'completed', duration: 22 },
      { name: 'Estimate stories', status: 'running', duration: 18 },
      { name: 'Assign tasks', status: 'pending' },
      { name: 'Create sprint board', status: 'pending' },
    ]
  },
  {
    id: 'wf-002',
    name: 'Campaign Launch',
    department: 'Marketing',
    status: 'running',
    progress: 40,
    startTime: new Date(Date.now() - 7200000).toISOString(),
    steps: [
      { name: 'Content creation', status: 'completed', duration: 45 },
      { name: 'Design review', status: 'running', duration: 30 },
      { name: 'A/B testing', status: 'pending' },
      { name: 'Launch', status: 'pending' },
    ]
  },
  {
    id: 'wf-003',
    name: 'Financial Report',
    department: 'Finance',
    status: 'paused',
    progress: 30,
    startTime: new Date(Date.now() - 10800000).toISOString(),
    steps: [
      { name: 'Data collection', status: 'completed', duration: 20 },
      { name: 'Analysis', status: 'failed' },
      { name: 'Report generation', status: 'pending' },
    ]
  },
];

export default function DigitalTwinDashboard() {
  const { toast } = useToast();
  const [zoomLevel, setZoomLevel] = useState<'organization' | 'department' | 'agent'>('organization');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [metrics, setMetrics] = useState<LiveMetrics>({
    totalAgents: 267,
    activeAgents: 38,
    totalTokensToday: 756000,
    totalCostToday: 40.70,
    successRate: 98.2,
    avgResponseTime: 342,
    activeWorkflows: 28,
    pendingDecisions: 4,
    errorCount: 3,
  });

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalTokensToday: prev.totalTokensToday + Math.floor(Math.random() * 1000),
        totalCostToday: parseFloat((prev.totalCostToday + Math.random() * 0.1).toFixed(2)),
        activeAgents: Math.max(30, Math.min(50, prev.activeAgents + Math.floor(Math.random() * 3) - 1)),
        avgResponseTime: Math.max(200, Math.min(500, prev.avgResponseTime + Math.floor(Math.random() * 50) - 25)),
      }));
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isLive, refreshInterval]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      healthy: 'bg-green-500',
      degraded: 'bg-yellow-500',
      critical: 'bg-red-500',
      active: 'bg-green-500',
      idle: 'bg-gray-400',
      processing: 'bg-blue-500',
      error: 'bg-red-500',
      running: 'bg-blue-500',
      completed: 'bg-green-500',
      failed: 'bg-red-500',
      paused: 'bg-yellow-500',
    };
    return colors[status] || 'bg-gray-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': case 'completed': case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': case 'paused': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': case 'failed': case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Digital Twin Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time organizational "God Mode" view
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="live-toggle" className="text-sm">Live</Label>
                <Switch
                  id="live-toggle"
                  checked={isLive}
                  onCheckedChange={setIsLive}
                  data-testid="switch-live"
                />
                {isLive && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Streaming
                  </span>
                )}
              </div>
              
              <Select value={zoomLevel} onValueChange={(v: any) => setZoomLevel(v)}>
                <SelectTrigger className="w-[180px]" data-testid="select-zoom">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization View
                    </div>
                  </SelectItem>
                  <SelectItem value="department">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Department View
                    </div>
                  </SelectItem>
                  <SelectItem value="agent">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Agent View
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" data-testid="button-refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Active Agents</p>
                  <p className="text-3xl font-bold">{metrics.activeAgents}</p>
                  <p className="text-xs opacity-70">of {metrics.totalAgents}</p>
                </div>
                <Bot className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Tokens Today</p>
                  <p className="text-3xl font-bold">{formatNumber(metrics.totalTokensToday)}</p>
                  <p className="text-xs opacity-70">+12% vs yesterday</p>
                </div>
                <Zap className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Cost Today</p>
                  <p className="text-3xl font-bold">${metrics.totalCostToday}</p>
                  <p className="text-xs opacity-70">Budget: $100</p>
                </div>
                <DollarSign className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Success Rate</p>
                  <p className="text-3xl font-bold">{metrics.successRate}%</p>
                  <p className="text-xs opacity-70">+0.5% this week</p>
                </div>
                <Target className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Avg Response</p>
                  <p className="text-3xl font-bold">{metrics.avgResponseTime}ms</p>
                  <p className="text-xs opacity-70">Target: &lt;500ms</p>
                </div>
                <Clock className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={`border-0 ${metrics.errorCount > 5 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-gray-500 to-slate-600'} text-white`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Errors</p>
                  <p className="text-3xl font-bold">{metrics.errorCount}</p>
                  <p className="text-xs opacity-70">{metrics.pendingDecisions} pending</p>
                </div>
                <AlertTriangle className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="departments" className="w-full">
          <TabsList>
            <TabsTrigger value="departments" data-testid="tab-departments">
              <Layers className="h-4 w-4 mr-2" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="agents" data-testid="tab-agents">
              <Bot className="h-4 w-4 mr-2" />
              Agent Activity
            </TabsTrigger>
            <TabsTrigger value="workflows" data-testid="tab-workflows">
              <Workflow className="h-4 w-4 mr-2" />
              Active Workflows
            </TabsTrigger>
            <TabsTrigger value="pulse" data-testid="tab-pulse">
              <Activity className="h-4 w-4 mr-2" />
              Live Pulse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockDepartments.map((dept) => (
                <Card 
                  key={dept.id}
                  className={`cursor-pointer hover:shadow-lg transition-all ${selectedDepartment === dept.id ? 'ring-2 ring-violet-500' : ''}`}
                  onClick={() => setSelectedDepartment(dept.id)}
                  data-testid={`card-dept-${dept.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${dept.color}20` }}
                        >
                          <Building2 className="h-5 w-5" style={{ color: dept.color }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{dept.name}</CardTitle>
                          <CardDescription>
                            {dept.activeAgents}/{dept.totalAgents} agents active
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusIcon(dept.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-medium">{dept.capacity}%</span>
                      </div>
                      <Progress value={dept.capacity} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tasks Done</p>
                        <p className="font-semibold">{dept.tasksCompleted}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">In Progress</p>
                        <p className="font-semibold">{dept.tasksInProgress}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tokens</p>
                        <p className="font-semibold">{formatNumber(dept.tokenUsage)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost</p>
                        <p className="font-semibold">${dept.costToday}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{dept.activeWorkflows} workflows</span>
                      </div>
                      <Badge variant={dept.errorRate > 0.05 ? 'destructive' : 'secondary'}>
                        {(dept.errorRate * 100).toFixed(1)}% error rate
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Activity Monitor</CardTitle>
                <CardDescription>Real-time status of all active agents</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {mockAgentActivities.map((agent) => (
                      <div 
                        key={agent.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        data-testid={`row-agent-${agent.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                              <Bot className="h-5 w-5" />
                            </div>
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(agent.status)}`} />
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-sm text-muted-foreground">{agent.department}</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 mx-6">
                          {agent.currentTask ? (
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                              <span className="text-sm">{agent.currentTask}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Idle</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground">Tokens</p>
                            <p className="font-medium">{formatNumber(agent.tokensUsed)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Response</p>
                            <p className="font-medium">{agent.responseTime}ms</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Last Active</p>
                            <p className="font-medium">{formatTimeAgo(agent.lastActive)}</p>
                          </div>
                          <Badge className={`${getStatusColor(agent.status)} text-white`}>
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mockWorkflows.map((workflow) => (
                <Card key={workflow.id} data-testid={`card-workflow-${workflow.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription>{workflow.department}</CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(workflow.status)} text-white`}>
                        {workflow.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{workflow.progress}%</span>
                      </div>
                      <Progress value={workflow.progress} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      {workflow.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-3">
                          {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {step.status === 'running' && <Activity className="h-4 w-4 text-blue-500 animate-pulse" />}
                          {step.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                          {step.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                          <span className={`text-sm ${step.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                            {step.name}
                          </span>
                          {step.duration && (
                            <span className="text-xs text-muted-foreground ml-auto">{step.duration}min</span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t text-sm">
                      <span className="text-muted-foreground">Started {formatTimeAgo(workflow.startTime)}</span>
                      {workflow.estimatedCompletion && (
                        <span className="text-muted-foreground">
                          ETA: {formatTimeAgo(workflow.estimatedCompletion)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pulse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                  Live Pulse Monitor
                </CardTitle>
                <CardDescription>Real-time organizational heartbeat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">System Health</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Cloud className="h-5 w-5 text-green-600" />
                          <span>API Gateway</span>
                        </div>
                        <Badge className="bg-green-500 text-white">Healthy</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-green-600" />
                          <span>Database</span>
                        </div>
                        <Badge className="bg-green-500 text-white">Healthy</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-yellow-600" />
                          <span>LLM Providers</span>
                        </div>
                        <Badge className="bg-yellow-500 text-white">7 Degraded</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          <span>Security</span>
                        </div>
                        <Badge className="bg-green-500 text-white">Secure</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Recent Events</h4>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-2">
                        {[
                          { type: 'success', message: 'Sprint Planning workflow completed', time: '2m ago' },
                          { type: 'info', message: 'New agent deployed: Marketing Analyst', time: '5m ago' },
                          { type: 'warning', message: 'Finance department at 65% capacity', time: '8m ago' },
                          { type: 'error', message: 'Deployment workflow failed - retrying', time: '12m ago' },
                          { type: 'success', message: 'HITL decision approved by John S.', time: '15m ago' },
                          { type: 'info', message: 'Token usage threshold 75% reached', time: '20m ago' },
                          { type: 'success', message: 'Customer refund processed', time: '25m ago' },
                        ].map((event, i) => (
                          <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                            {event.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                            {event.type === 'info' && <Activity className="h-4 w-4 text-blue-500 mt-0.5" />}
                            {event.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                            {event.type === 'error' && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                            <div className="flex-1">
                              <p className="text-sm">{event.message}</p>
                              <p className="text-xs text-muted-foreground">{event.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
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
