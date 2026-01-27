import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Cpu, Zap, Users, Brain, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface AgentCategory {
  name: string;
  count: number;
  active: number;
  idle: number;
}

interface AgentTask {
  agentId: string;
  agentName: string;
  category: string;
  task: string;
  status: 'running' | 'completed' | 'pending';
  progress: number;
}

interface AgentStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    idle: number;
    categories: AgentCategory[];
    metrics: {
      tasksCompleted24h: number;
      avgResponseTime: number;
      successRate: number;
    };
    recentTasks: AgentTask[];
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  "WAI Core Agents": "purple",
  "Geminiflow Agents": "blue",
  "wshobson Agents": "green"
};

export default function AgentActivityDashboard() {
  const { data: agentStats, isLoading } = useQuery<AgentStatsResponse>({
    queryKey: ['/api/agents/stats'],
    staleTime: 10000,
    refetchInterval: 5000,
  });

  const stats = agentStats?.data;
  const totalAgents = stats?.total || 0;
  const totalActive = stats?.active || 0;
  const totalIdle = stats?.idle || 0;
  const utilizationRate = totalAgents > 0 ? Math.round((totalActive / totalAgents) * 100) : 0;
  const categories = stats?.categories || [];
  const recentTasks = stats?.recentTasks || [];
  const metrics = stats?.metrics || { tasksCompleted24h: 0, avgResponseTime: 0, successRate: 0 };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-indigo-400 animate-pulse mx-auto mb-4" />
          <p className="text-xl text-gray-300">Loading agent activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4" data-testid="dashboard-header">
          <div className="flex items-center justify-center gap-3">
            <Activity className="w-12 h-12 text-indigo-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Agent Activity Dashboard
            </h1>
          </div>
          <p className="text-xl text-gray-300">
            Real-time monitoring of {totalAgents}+ AI agents working 24/7 on your MVP
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 border-indigo-500/30" data-testid="stat-total-agents">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Agents</p>
                  <p className="text-3xl font-bold text-white" data-testid="count-total-agents">{totalAgents}</p>
                </div>
                <Users className="w-10 h-10 text-indigo-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-green-500/30" data-testid="stat-active-agents">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Active Now</p>
                  <p className="text-3xl font-bold text-green-400" data-testid="count-active-agents">{totalActive}</p>
                </div>
                <Zap className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-blue-500/30" data-testid="stat-idle-agents">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Idle</p>
                  <p className="text-3xl font-bold text-blue-400" data-testid="count-idle-agents">{totalIdle}</p>
                </div>
                <Clock className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/30" data-testid="stat-utilization">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Utilization</p>
                  <p className="text-3xl font-bold text-purple-400" data-testid="utilization-percentage">{utilizationRate}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Categories */}
        <Card className="bg-slate-900/50 border-indigo-500/30" data-testid="categories-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              Agent Distribution by Category
            </CardTitle>
            <CardDescription className="text-gray-400">
              267+ specialized agents across 3 major categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((category) => {
              const color = CATEGORY_COLORS[category.name] || "gray";
              return (
                <div key={category.name} className="space-y-2" data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`text-${color}-400 border-${color}-500/50`}>
                        {category.name}
                      </Badge>
                    <span className="text-sm text-gray-400">
                      {category.active} active / {category.count} total
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-300" data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}-percentage`}>
                    {Math.round((category.active / category.count) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(category.active / category.count) * 100} 
                  className="h-2"
                  data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}-progress`}
                />
              </div>
            );
            })}
          </CardContent>
        </Card>

        {/* Live Agent Tasks */}
        <Card className="bg-slate-900/50 border-indigo-500/30" data-testid="tasks-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
              Live Agent Tasks
            </CardTitle>
            <CardDescription className="text-gray-400">
              Real-time view of active agent operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.map((task) => (
              <div 
                key={task.agentId}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-indigo-500/50 transition-colors"
                data-testid={`task-${task.agentId}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-indigo-400" data-testid={`task-${task.agentId}-id`}>
                        {task.agentId}
                      </span>
                      <span className="text-white font-semibold">{task.agentName}</span>
                      <Badge variant="outline" className="text-xs text-blue-300 border-blue-500/50">
                        {task.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{task.task}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === 'running' && (
                      <Activity className="w-4 h-4 text-green-400 animate-pulse" data-testid={`task-${task.agentId}-status-running`} />
                    )}
                    {task.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-400" data-testid={`task-${task.agentId}-status-completed`} />
                    )}
                    {task.status === 'pending' && (
                      <AlertCircle className="w-4 h-4 text-yellow-400" data-testid={`task-${task.agentId}-status-pending`} />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-indigo-400 font-semibold" data-testid={`task-${task.agentId}-progress`}>
                      {task.progress}%
                    </span>
                  </div>
                  <Progress value={task.progress} className="h-1.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Tasks Completed</h3>
              </div>
              <p className="text-3xl font-bold text-green-400 mb-1" data-testid="metric-tasks-completed">
                {metrics.tasksCompleted24h.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Avg Response Time</h3>
              </div>
              <p className="text-3xl font-bold text-blue-400 mb-1" data-testid="metric-response-time">
                {metrics.avgResponseTime}s
              </p>
              <p className="text-sm text-gray-400">Per agent task</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Success Rate</h3>
              </div>
              <p className="text-3xl font-bold text-purple-400 mb-1" data-testid="metric-success-rate">
                {metrics.successRate}%
              </p>
              <p className="text-sm text-gray-400">Task completion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <p className="text-gray-300 font-medium">Live monitoring • Updates every 5 seconds</p>
        </div>
      </div>
    </div>
  );
}
