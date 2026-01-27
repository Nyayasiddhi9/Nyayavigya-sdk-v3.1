/**
 * Enhanced Agent Orchestration Interface
 * Multi-LLM agent coordination inspired by Contains Studio
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Zap, 
  Brain,
  Users,
  Activity,
  Target,
  Cpu,
  Clock,
  DollarSign,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  category: string;
  description: string;
  expertise: string[];
  preferredLLMs: string[];
  proactive: boolean;
}

interface LLMProvider {
  id: string;
  name: string;
  strengths: string[];
  costTier: string;
  speedTier: string;
  contextWindow: number;
  multimodal: boolean;
  codeGeneration: boolean;
  reasoning: boolean;
  creative: boolean;
}

const categoryColors = {
  engineering: 'bg-blue-100 text-blue-800',
  product: 'bg-green-100 text-green-800',
  design: 'bg-purple-100 text-purple-800',
  marketing: 'bg-orange-100 text-orange-800',
  'project-management': 'bg-indigo-100 text-indigo-800',
  'studio-operations': 'bg-gray-100 text-gray-800',
  testing: 'bg-red-100 text-red-800',
  bonus: 'bg-yellow-100 text-yellow-800'
};

const costTierColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600'
};

const speedTierColors = {
  fast: 'text-green-600',
  medium: 'text-yellow-600',
  slow: 'text-red-600'
};

export default function EnhancedAgentOrchestration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('orchestrate');
  const [taskForm, setTaskForm] = useState({
    description: '',
    type: 'development',
    requirements: [],
    constraints: {
      timeframe: 'normal',
      budget: 'medium',
      quality: 'medium'
    },
    priority: 'medium',
    userPreferences: {}
  });
  const [newRequirement, setNewRequirement] = useState('');

  // Fetch orchestration status
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/enhanced-agents/status']
  });

  // Fetch available agents
  const { data: agentsData } = useQuery({
    queryKey: ['/api/enhanced-agents/agents']
  });

  // Fetch LLM providers
  const { data: providersData } = useQuery({
    queryKey: ['/api/enhanced-agents/llm-providers']
  });

  // Get recommendations mutation
  const getRecommendationsMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await fetch(`/api/enhanced-agents/recommend?description=${encodeURIComponent(description)}`);
      if (!response.ok) throw new Error('Failed to get recommendations');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Recommendations Generated",
        description: `Primary agent: ${data.data.recommendations.primary}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Recommendation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Orchestrate task mutation
  const orchestrateTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/enhanced-agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error('Failed to orchestrate task');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Task Orchestrated Successfully",
        description: `Task ID: ${data.data.taskId}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Orchestration Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setTaskForm({
        ...taskForm,
        requirements: [...taskForm.requirements, newRequirement.trim()]
      });
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setTaskForm({
      ...taskForm,
      requirements: taskForm.requirements.filter((_, i) => i !== index)
    });
  };

  const handleGetRecommendations = () => {
    if (!taskForm.description) {
      toast({
        title: "Description Required",
        description: "Please describe your task first",
        variant: "destructive"
      });
      return;
    }
    getRecommendationsMutation.mutate(taskForm.description);
  };

  const handleOrchestrateTask = () => {
    if (!taskForm.description || !taskForm.type) {
      toast({
        title: "Required Fields Missing",
        description: "Please provide task description and type",
        variant: "destructive"
      });
      return;
    }
    orchestrateTaskMutation.mutate(taskForm);
  };

  const agents = agentsData?.data?.agents || [];
  const providers = providersData?.data?.providers || [];
  const status = statusData?.data;

  if (statusLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading orchestration system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Enhanced Agent Orchestration
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Multi-LLM agent coordination system with intelligent task distribution
        </p>
      </div>

      {/* Status Overview */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{status.totalAgents}</div>
                <div className="text-sm text-muted-foreground">Total Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.totalLLMs}</div>
                <div className="text-sm text-muted-foreground">LLM Providers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{status.activeExecutions}</div>
                <div className="text-sm text-muted-foreground">Active Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{status.categories.length}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{status.averageTaskTime}</div>
                <div className="text-sm text-muted-foreground">Avg Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orchestrate" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Orchestrate
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="llms" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            LLM Providers
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Monitor
          </TabsTrigger>
        </TabsList>

        {/* Task Orchestration */}
        <TabsContent value="orchestrate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Task Orchestration
              </CardTitle>
              <CardDescription>
                Describe your task and let our AI orchestration system select optimal agents and LLMs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Description</label>
                <Textarea
                  placeholder="Describe what you want to accomplish (e.g., 'Build a viral TikTok app with AI avatars')"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Type</label>
                  <Select value={taskForm.type} onValueChange={(value) => setTaskForm({...taskForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">🛠️ Development</SelectItem>
                      <SelectItem value="design">🎨 Design</SelectItem>
                      <SelectItem value="analysis">📊 Analysis</SelectItem>
                      <SelectItem value="marketing">📈 Marketing</SelectItem>
                      <SelectItem value="research">🔍 Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({...taskForm, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="high">🟠 High</SelectItem>
                      <SelectItem value="critical">🔴 Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quality Level</label>
                  <Select 
                    value={taskForm.constraints.quality} 
                    onValueChange={(value) => setTaskForm({
                      ...taskForm, 
                      constraints: {...taskForm.constraints, quality: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast">⚡ Fast</SelectItem>
                      <SelectItem value="medium">⚖️ Balanced</SelectItem>
                      <SelectItem value="high">💎 High Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Requirements</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a requirement..."
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRequirement()}
                  />
                  <Button onClick={handleAddRequirement} variant="outline">Add</Button>
                </div>
                {taskForm.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {taskForm.requirements.map((req, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveRequirement(index)}>
                        {req} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleGetRecommendations}
                  disabled={getRecommendationsMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  {getRecommendationsMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Getting Recommendations...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Get Recommendations
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleOrchestrateTask}
                  disabled={orchestrateTaskMutation.isPending}
                  className="flex-1"
                >
                  {orchestrateTaskMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Orchestrating...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Orchestrate Task
                    </>
                  )}
                </Button>
              </div>

              {/* Results */}
              {getRecommendationsMutation.data?.success && (
                <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Recommended Primary Agent:</strong> {getRecommendationsMutation.data.data.recommendations.primary}</p>
                      <p><strong>Supporting Agents:</strong> {getRecommendationsMutation.data.data.recommendations.supporting.join(', ')}</p>
                      <p><strong>Reasoning:</strong> {getRecommendationsMutation.data.data.recommendations.reasoning}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {orchestrateTaskMutation.data?.success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Task Orchestrated Successfully!</strong></p>
                      <p>Task ID: {orchestrateTaskMutation.data.data.taskId}</p>
                      <p>Estimated Completion: {orchestrateTaskMutation.data.data.estimatedCompletion}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">Primary: {orchestrateTaskMutation.data.data.executionPlan.primaryAgent}</Badge>
                        <Badge variant="outline">LLM: {orchestrateTaskMutation.data.data.executionPlan.llmAssignments[orchestrateTaskMutation.data.data.executionPlan.primaryAgent]}</Badge>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents View */}
        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent: Agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={categoryColors[agent.category as keyof typeof categoryColors]}
                    >
                      {agent.category}
                    </Badge>
                  </div>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Expertise</div>
                    <div className="flex flex-wrap gap-1">
                      {agent.expertise.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {agent.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.expertise.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Preferred LLMs</div>
                    <div className="flex flex-wrap gap-1">
                      {agent.preferredLLMs.slice(0, 2).map((llm) => (
                        <Badge key={llm} variant="outline" className="text-xs">
                          {llm.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {agent.proactive ? 'Proactive' : 'On-demand'}
                    </span>
                    {agent.proactive && <Zap className="h-3 w-3 text-yellow-500" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* LLM Providers View */}
        <TabsContent value="llms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider: LLMProvider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {provider.name}
                    <div className="flex gap-2">
                      <Badge variant="outline" className={costTierColors[provider.costTier as keyof typeof costTierColors]}>
                        <DollarSign className="h-3 w-3 mr-1" />
                        {provider.costTier}
                      </Badge>
                      <Badge variant="outline" className={speedTierColors[provider.speedTier as keyof typeof speedTierColors]}>
                        <Clock className="h-3 w-3 mr-1" />
                        {provider.speedTier}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Context:</span> {provider.contextWindow.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Capabilities:</span>
                      {provider.multimodal && <Badge variant="outline" className="text-xs">📷</Badge>}
                      {provider.codeGeneration && <Badge variant="outline" className="text-xs">💻</Badge>}
                      {provider.reasoning && <Badge variant="outline" className="text-xs">🧠</Badge>}
                      {provider.creative && <Badge variant="outline" className="text-xs">🎨</Badge>}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Strengths</div>
                    <div className="flex flex-wrap gap-1">
                      {provider.strengths.map((strength) => (
                        <Badge key={strength} variant="secondary" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Monitor View */}
        <TabsContent value="monitor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>System Health</span>
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Agent Utilization</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>LLM Performance</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">24</div>
                    <div className="text-sm text-muted-foreground">Tasks Completed Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">8.5min</div>
                    <div className="text-sm text-muted-foreground">Average Response Time</div>
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