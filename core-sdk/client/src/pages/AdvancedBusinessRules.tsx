import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Zap, 
  Users, 
  Target, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Layers,
  Network,
  Cpu,
  Database
} from 'lucide-react';

interface LLMSelection {
  provider: string;
  model: string;
  reasoning: string;
  confidence: number;
  fallbackChain: Array<{
    provider: string;
    model: string;
    reasoning: string;
  }>;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  level: string;
  primaryLLM: string;
  fallbackLLMs: string[];
  specializations: string[];
  status: string;
  performance: {
    successRate: number;
    qualityScore: number;
    averageResponseTime: number;
  };
}

export default function AdvancedBusinessRules() {
  const [testPrompt, setTestPrompt] = useState('');
  const [taskType, setTaskType] = useState('');
  const [complexity, setComplexity] = useState('medium');

  // Get business rules overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/wai-orchestration-consolidated/business-rules-overview'],
  });

  // Test advanced business rules
  const testRulesMutation = useMutation({
    mutationFn: async (data: { prompt: string; taskType?: string }) => {
      const response = await fetch('/api/wai-orchestration-consolidated/advanced-business-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  // Test agent coordination
  const testAgentsMutation = useMutation({
    mutationFn: async (data: { prompt: string; taskType?: string; complexity: string }) => {
      const response = await fetch('/api/wai-orchestration-consolidated/agent-coordination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  const handleTestRules = () => {
    if (!testPrompt) return;
    testRulesMutation.mutate({ prompt: testPrompt, taskType: taskType || undefined });
  };

  const handleTestAgents = () => {
    if (!testPrompt) return;
    testAgentsMutation.mutate({ 
      prompt: testPrompt, 
      taskType: taskType || undefined, 
      complexity 
    });
  };

  const businessRules = overview?.overview?.businessRules || [];
  const agentHierarchy = overview?.overview?.agentHierarchy;
  const allAgents = [
    ...(agentHierarchy?.executives || []),
    ...(agentHierarchy?.seniors || []),
    ...(agentHierarchy?.specialists || []),
    ...(agentHierarchy?.juniors || [])
  ];

  const taskTypes = [
    'software-development',
    '3d-gaming', 
    'voice-synthesis',
    'video-generation',
    'website-creation',
    'creative-content',
    'data-analysis',
    'research',
    'image-generation',
    'speed-critical',
    'multilingual',
    'local-privacy'
  ];

  if (overviewLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading advanced business rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Business Rules & Agent Coordination</h1>
          <p className="text-muted-foreground">
            13 LLM providers with 3-level fallback system and intelligent agent hierarchy
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Database className="h-4 w-4 mr-1" />
            {businessRules.length} Rules
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Users className="h-4 w-4 mr-1" />
            {allAgents.length} Agents
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            <Network className="h-4 w-4 mr-1" />
            13 LLM Providers
          </Badge>
        </div>
      </div>

      {/* Test Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Test Advanced Business Rules & Agent Coordination
          </CardTitle>
          <CardDescription>
            Test how our system selects optimal LLMs and coordinates agents for your tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="prompt">Task Description</Label>
              <Textarea
                id="prompt"
                placeholder="Describe your task (e.g., 'Create a Unity VR game with 3D avatars')"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="taskType">Task Type (Optional)</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-detect or select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-detect</SelectItem>
                  {taskTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="complexity">Complexity</Label>
              <Select value={complexity} onValueChange={setComplexity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              onClick={handleTestRules} 
              disabled={!testPrompt || testRulesMutation.isPending}
              className="flex-1"
            >
              {testRulesMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Test LLM Selection
            </Button>
            <Button 
              onClick={handleTestAgents} 
              disabled={!testPrompt || testAgentsMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              {testAgentsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Test Agent Coordination
            </Button>
          </div>

          {/* Results */}
          {testRulesMutation.data?.success && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">LLM Selection Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{testRulesMutation.data.selection.provider}</h3>
                      <p className="text-sm text-muted-foreground">{testRulesMutation.data.selection.model}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {Math.round(testRulesMutation.data.selection.confidence * 100)}% Confidence
                    </Badge>
                  </div>
                  
                  <p className="text-sm">{testRulesMutation.data.selection.reasoning}</p>
                  
                  <div>
                    <h4 className="font-medium mb-2">3-Level Fallback Chain:</h4>
                    <div className="space-y-2">
                      {testRulesMutation.data.selection.fallbackChain?.map((fallback: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Badge variant="outline">Level {index + 1}</Badge>
                          <div className="flex-1">
                            <p className="font-medium">{fallback.provider}</p>
                            <p className="text-sm text-muted-foreground">{fallback.reasoning}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {testAgentsMutation.data?.success && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Agent Coordination Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Lead Agent</h3>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="font-medium">{testAgentsMutation.data.coordination.leadAgent.name}</p>
                        <p className="text-sm text-muted-foreground">{testAgentsMutation.data.coordination.leadAgent.role}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Badge variant="outline">{testAgentsMutation.data.coordination.leadAgent.level}</Badge>
                          <Badge variant="outline">{testAgentsMutation.data.coordination.leadAgent.primaryLLM}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Supporting Agents</h3>
                      <div className="space-y-2">
                        {testAgentsMutation.data.coordination.supportingAgents.map((agent: Agent, index: number) => (
                          <div key={index} className="p-2 bg-green-50 rounded text-sm">
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-muted-foreground">{agent.specializations.join(', ')}</p>
                          </div>
                        ))}
                        {testAgentsMutation.data.coordination.supportingAgents.length === 0 && (
                          <p className="text-sm text-muted-foreground">Working independently</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Coordination Plan:</h4>
                    <p className="text-sm p-3 bg-gray-50 rounded-lg">
                      {testAgentsMutation.data.coordination.coordinationPlan}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium">Estimated Time:</p>
                      <p className="text-lg font-semibold">{Math.round(testAgentsMutation.data.coordination.estimatedTime / 1000)}s</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">
            <Layers className="h-4 w-4 mr-2" />
            Business Rules
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Users className="h-4 w-4 mr-2" />
            Agent Hierarchy
          </TabsTrigger>
          <TabsTrigger value="providers">
            <Network className="h-4 w-4 mr-2" />
            LLM Providers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Rules with 3-Level Fallback System</CardTitle>
              <CardDescription>
                Comprehensive task-specific LLM selection with quality, cost, and speed optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessRules.map((rule: any, index: number) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold">{rule.taskType.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</h3>
                          {rule.contentSubtype && (
                            <p className="text-sm text-muted-foreground">{rule.contentSubtype}</p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Primary Provider</h4>
                          <div className="p-2 bg-blue-50 rounded text-sm">
                            <p className="font-medium">{rule.primary.provider}</p>
                            <p className="text-xs text-muted-foreground">{rule.primary.model}</p>
                            <div className="flex items-center mt-1 space-x-1">
                              {rule.primary.benchmarks.specialization?.slice(0, 3).map((spec: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{spec}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-1">Fallback Chain</h4>
                          <div className="space-y-1">
                            <div className="p-1 bg-yellow-50 rounded text-xs">
                              <span className="font-medium">{rule.fallback1.provider}</span>
                            </div>
                            <div className="p-1 bg-red-50 rounded text-xs">
                              <span className="font-medium">{rule.fallback2.provider}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="font-medium">Quality</p>
                            <Progress value={rule.primary.benchmarks.quality * 100} className="h-1" />
                          </div>
                          <div>
                            <p className="font-medium">Speed</p>
                            <Progress value={rule.primary.benchmarks.speed * 100} className="h-1" />
                          </div>
                          <div>
                            <p className="font-medium">Cost</p>
                            <Progress value={rule.primary.benchmarks.cost * 100} className="h-1" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Hierarchy & LLM Assignments</CardTitle>
              <CardDescription>
                39+ specialized agents with intelligent LLM routing and coordination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['executives', 'seniors', 'specialists', 'juniors'].map((level) => (
                  <div key={level}>
                    <h3 className="font-semibold text-lg mb-3 capitalize">
                      {level} ({agentHierarchy?.[level as keyof typeof agentHierarchy]?.length || 0})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {agentHierarchy?.[level as keyof typeof agentHierarchy]?.map((agent: Agent) => (
                        <Card key={agent.id} className="border">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold">{agent.name}</h4>
                                <p className="text-sm text-muted-foreground">{agent.role}</p>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">{agent.status}</Badge>
                                <Badge variant="outline" className="text-xs">{agent.primaryLLM}</Badge>
                              </div>
                              
                              <div>
                                <p className="text-xs font-medium mb-1">Specializations:</p>
                                <div className="flex flex-wrap gap-1">
                                  {agent.specializations.slice(0, 3).map((spec, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">{spec}</Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="font-medium">Success Rate</p>
                                  <Progress value={agent.performance.successRate * 100} className="h-1" />
                                </div>
                                <div>
                                  <p className="font-medium">Quality</p>
                                  <Progress value={agent.performance.qualityScore * 100} className="h-1" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>13 LLM Provider Ecosystem</CardTitle>
              <CardDescription>
                Complete integration with specialized selection and fallback chains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'KIMI K2', specialty: 'Software/3D/Gaming', cost: '95% savings', primary: true },
                  { name: 'Anthropic Claude', specialty: 'Analysis/Reasoning', cost: 'Premium', primary: true },
                  { name: 'OpenAI GPT-4o', specialty: 'General/Creative', cost: 'High', primary: true },
                  { name: 'Google Gemini', specialty: 'Video/Multimodal', cost: 'Medium', primary: true },
                  { name: 'ElevenLabs', specialty: 'Voice Synthesis', cost: 'Medium', primary: true },
                  { name: 'Replicate', specialty: 'Image Generation', cost: 'Medium', primary: true },
                  { name: 'Perplexity', specialty: 'Research/Search', cost: 'Medium', primary: true },
                  { name: 'X.AI Grok', specialty: 'Real-time/Speed', cost: 'Medium', primary: false },
                  { name: 'Groq', specialty: 'Ultra-fast Inference', cost: 'Low', primary: false },
                  { name: 'Together AI', specialty: 'Cost-optimized', cost: 'Very Low', primary: false },
                  { name: 'DeepSeek', specialty: 'Code/Reasoning', cost: 'Low', primary: false },
                  { name: 'Qwen', specialty: 'Multilingual', cost: 'Low', primary: false },
                  { name: 'Ollama', specialty: 'Local/Privacy', cost: 'Free', primary: false }
                ].map((provider, index) => (
                  <Card key={index} className={`border ${provider.primary ? 'border-blue-200 bg-blue-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{provider.name}</h3>
                          {provider.primary && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{provider.specialty}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">{provider.cost}</Badge>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}