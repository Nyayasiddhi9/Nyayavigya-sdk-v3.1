import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  BarChart3, 
  Brain, 
  Settings, 
  Zap, 
  Target, 
  Network, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Cpu,
  Gauge
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Cell, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface AgentCapability {
  name: string;
  score: number;
  category: 'technical' | 'creative' | 'analytical' | 'coordination' | 'domain-specific';
}

interface AgentRecommendation {
  agentId: string;
  confidence: number;
  reason: string;
  alternativeAgents: string[];
  estimatedPerformance: number;
  costImplication: number;
}

interface AgentHandoffPattern {
  fromAgent: string;
  toAgent: string;
  taskType: string;
  frequency: number;
  successRate: number;
  averageHandoffTime: number;
  contextPreservation: number;
}

interface AgentHeatmapData {
  agentId: string;
  agentName: string;
  x: number;
  y: number;
  performance: number;
  status: string;
  load: number;
}

const AgentOrchestrationSettings: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>('backend-architect');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('radar');

  // Fetch agent capabilities
  const { data: agentCapabilities } = useQuery({
    queryKey: ['/api/agent-analytics/capabilities', selectedAgent],
    queryFn: async () => {
      const response = await fetch(`/api/agent-analytics/capabilities/${selectedAgent}`);
      return response.json();
    }
  });

  // Fetch agent recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['/api/agent-analytics/recommendations', taskDescription],
    queryFn: async () => {
      if (!taskDescription.trim()) return [];
      const response = await fetch('/api/agent-analytics/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskDescription, userHistory: [] })
      });
      return response.json();
    },
    enabled: !!taskDescription.trim()
  });

  // Fetch handoff patterns
  const { data: handoffPatterns } = useQuery({
    queryKey: ['/api/agent-analytics/handoff-patterns'],
    queryFn: async () => {
      const response = await fetch('/api/agent-analytics/handoff-patterns');
      return response.json();
    }
  });

  // Fetch real-time heatmap data
  const { data: heatmapData, refetch: refetchHeatmap } = useQuery({
    queryKey: ['/api/agent-analytics/performance-heatmap'],
    queryFn: async () => {
      const response = await fetch('/api/agent-analytics/performance-heatmap');
      return response.json();
    },
    refetchInterval: 5000 // Update every 5 seconds
  });

  // Fetch agent configuration wizard data
  const { data: configWizard } = useQuery({
    queryKey: ['/api/agent-analytics/config-wizard', selectedAgent],
    queryFn: async () => {
      const response = await fetch(`/api/agent-analytics/config-wizard/${selectedAgent}`);
      return response.json();
    }
  });

  const availableAgents = [
    { id: 'backend-architect', name: 'Backend Architect' },
    { id: 'frontend-specialist', name: 'Frontend Specialist' },
    { id: 'ui-ux-designer', name: 'UI/UX Designer' },
    { id: 'database-specialist', name: 'Database Specialist' },
    { id: 'devops-engineer', name: 'DevOps Engineer' },
    { id: 'qa-engineer', name: 'QA Engineer' },
    { id: 'security-specialist', name: 'Security Specialist' },
    { id: 'data-scientist', name: 'Data Scientist' },
    { id: 'content-creator', name: 'Content Creator' },
    { id: '3d-designer', name: '3D Designer' }
  ];

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      technical: '#3b82f6',
      creative: '#8b5cf6',
      analytical: '#06b6d4',
      coordination: '#10b981',
      'domain-specific': '#f59e0b'
    };
    return colors[category] || '#6b7280';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      idle: '#6b7280',
      active: '#10b981',
      busy: '#f59e0b',
      offline: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const renderRadarChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Interactive AI Agent Capability Radar Chart
        </CardTitle>
        <CardDescription>
          Comprehensive visualization of agent capabilities across multiple dimensions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="agent-select">Select Agent</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an agent" />
            </SelectTrigger>
            <SelectContent>
              {availableAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {agentCapabilities && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={agentCapabilities}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Capability Score"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {agentCapabilities.map((capability: AgentCapability, index: number) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(capability.category) }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{capability.name}</div>
                    <div className="text-xs text-gray-500">{capability.score}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderRecommendationEngine = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Personalized Agent Recommendation Engine with Machine Learning
        </CardTitle>
        <CardDescription>
          AI-powered agent selection based on task analysis and historical performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="task-description">Describe Your Task</Label>
            <Input
              id="task-description"
              placeholder="e.g., Build a React dashboard with real-time data visualization"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full"
            />
          </div>

          {recommendations && recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Recommended Agents</h4>
              {recommendations.map((rec: AgentRecommendation, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{rec.agentId}</Badge>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">{(rec.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Performance: {rec.estimatedPerformance}%
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Alternatives:</span>
                    {rec.alternativeAgents.map((alt, altIndex) => (
                      <Badge key={altIndex} variant="outline" className="text-xs">
                        {alt}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Cost Impact:</span>
                      <span className="text-xs font-medium">${rec.costImplication.toFixed(3)}</span>
                    </div>
                    <Progress value={rec.confidence * 100} className="flex-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderHandoffVisualization = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          Contextual Agent Handoff Visualization
        </CardTitle>
        <CardDescription>
          Visual representation of agent collaboration patterns and handoff efficiency
        </CardDescription>
      </CardHeader>
      <CardContent>
        {handoffPatterns && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {handoffPatterns.slice(0, 6).map((pattern: AgentHandoffPattern, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm font-medium">{pattern.fromAgent}</div>
                    <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-2" />
                    <div className="text-sm font-medium">{pattern.toAgent}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Success Rate</div>
                      <div className="font-medium text-green-600">
                        {(pattern.successRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Frequency</div>
                      <div className="font-medium">{pattern.frequency} times</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Handoff Time</div>
                      <div className="font-medium">{pattern.averageHandoffTime.toFixed(0)}ms</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Context Preserved</div>
                      <div className="font-medium text-blue-600">
                        {(pattern.contextPreservation * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPerformanceHeatmap = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Real-time Agent Performance Heatmap
        </CardTitle>
        <CardDescription>
          Live monitoring of agent performance, status, and workload distribution
        </CardDescription>
      </CardHeader>
      <CardContent>
        {heatmapData && (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {heatmapData.map((agent: AgentHeatmapData, index: number) => (
                <div
                  key={index}
                  className="aspect-square p-2 rounded-lg border relative"
                  style={{
                    backgroundColor: `rgba(${agent.performance > 80 ? '16, 185, 129' : agent.performance > 60 ? '245, 158, 11' : '239, 68, 68'}, ${agent.performance / 100 * 0.2 + 0.1})`
                  }}
                >
                  <div className="text-xs font-medium mb-1 truncate">{agent.agentName}</div>
                  <div className="text-xs text-gray-600 mb-1">
                    Performance: {agent.performance.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    Load: {agent.load.toFixed(0)}%
                  </div>
                  <div className="absolute top-1 right-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(agent.status) }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>High Performance (80%+)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Medium Performance (60-80%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Low Performance (&lt;60%)</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderConfigurationWizard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Conversational Agent Configuration Wizard
        </CardTitle>
        <CardDescription>
          Interactive wizard for optimizing agent configuration and performance tuning
        </CardDescription>
      </CardHeader>
      <CardContent>
        {configWizard && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Model Configuration</h4>
                <div>
                  <Label>Primary Model</Label>
                  <Select value={configWizard.currentConfig?.primaryModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configWizard.availableModels?.map((model: string) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Max Concurrent Tasks</Label>
                  <Input
                    type="number"
                    value={configWizard.currentConfig?.maxConcurrentTasks || 3}
                    min={1}
                    max={10}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Performance Tuning</h4>
                <div>
                  <Label>Response Time Target (ms)</Label>
                  <Input
                    type="number"
                    value={configWizard.performanceTuning?.responseTimeTarget || 2000}
                  />
                </div>
                <div>
                  <Label>Accuracy Target (%)</Label>
                  <Input
                    type="number"
                    value={configWizard.performanceTuning?.accuracyTarget * 100 || 90}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </div>

            {configWizard.recommendations && (
              <div>
                <h4 className="font-semibold mb-3">Configuration Recommendations</h4>
                <div className="space-y-2">
                  {configWizard.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-1">
                        {rec.impact === 'high' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{rec.type.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-sm text-gray-600">{rec.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={rec.impact === 'high' ? 'destructive' : 'secondary'}>
                            {rec.impact} impact
                          </Badge>
                          <Badge variant="outline">{rec.effort} effort</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Agent Orchestration Settings
          </h1>
          <p className="text-gray-600">
            Configure and monitor your AI agent ecosystem with advanced analytics and machine learning
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="radar" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Capability Radar
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              ML Recommendations
            </TabsTrigger>
            <TabsTrigger value="handoff" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Handoff Patterns
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Heatmap
            </TabsTrigger>
            <TabsTrigger value="wizard" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Config Wizard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="radar">
            {renderRadarChart()}
          </TabsContent>

          <TabsContent value="recommendations">
            {renderRecommendationEngine()}
          </TabsContent>

          <TabsContent value="handoff">
            {renderHandoffVisualization()}
          </TabsContent>

          <TabsContent value="heatmap">
            {renderPerformanceHeatmap()}
          </TabsContent>

          <TabsContent value="wizard">
            {renderConfigurationWizard()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentOrchestrationSettings;