/**
 * WAI Comprehensive Orchestration Demo Page
 * 
 * Demonstrates the power of the WAI v7.0 Orchestration Backbone with
 * real project creation using 200+ features, 14+ LLMs, and 100+ agents.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Rocket, 
  Brain, 
  Zap, 
  DollarSign, 
  Users, 
  Code, 
  Smartphone, 
  Gamepad2, 
  Building, 
  BookOpen,
  Settings,
  BarChart3,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Globe,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrchestrationResult {
  success: boolean;
  projectId: string;
  status: string;
  orchestration: any;
  agents: any;
  llms: any;
  deliverables: any;
  metrics: any;
  context: any;
  timeline: any;
  analytics: any;
}

interface SystemHealth {
  orchestrationBackbone: string;
  llmProviders: any;
  agents: any;
  integrations: any;
  memory: any;
  totalCapabilities: number;
  activeCapabilities: number;
  utilizationRate: number;
}

export default function WAIOrchestrationDemo() {
  const { toast } = useToast();
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestrationResult | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [projectType, setProjectType] = useState('web-application');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [autonomousExecution, setAutonomousExecution] = useState(true);
  const [costOptimization, setCostOptimization] = useState(true);
  const [multiAgentCollaboration, setMultiAgentCollaboration] = useState(true);

  // Load system health on component mount
  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/wai/v7/backbone/health');
      const data = await response.json();
      if (data.success) {
        setSystemHealth(data.system_health);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  const handleQuickStart = async (type: string, name: string, description: string) => {
    setIsOrchestrating(true);
    try {
      const response = await fetch('/api/wai/v7/backbone/quick-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_type: type,
          name,
          description
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Project Created Successfully",
          description: `${name} created with ${result.summary.agents_used} agents and ${result.summary.cost_savings} cost savings`,
        });
        setOrchestrationResult(result);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Orchestration Failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsOrchestrating(false);
    }
  };

  const handleFullOrchestration = async () => {
    if (!projectName || !projectDescription) {
      toast({
        title: "Missing Information",
        description: "Please provide project name and description",
        variant: "destructive"
      });
      return;
    }

    setIsOrchestrating(true);
    try {
      const projectRequest = {
        id: `project-${Date.now()}`,
        name: projectName,
        type: projectType,
        description: projectDescription,
        requirements: {
          technical: ['modern-architecture', 'scalable-design', 'best-practices'],
          business: ['user-friendly', 'cost-effective', 'maintainable'],
          ui_ux: ['responsive-design', 'accessibility', 'modern-ui'],
          integrations: ['api-ready', 'database-integration'],
          performance: ['optimized-performance', 'fast-loading'],
          security: ['secure-authentication', 'data-protection']
        },
        budget: {
          llm_cost_preference: costOptimization ? 'free' : 'medium',
          development_budget: 5000,
          timeline_days: 14
        },
        priority: 'high',
        quality_threshold: 90,
        context: {},
        preferences: {
          autonomous_execution: autonomousExecution,
          multi_agent_collaboration: multiAgentCollaboration,
          cost_optimization: costOptimization,
          continuous_monitoring: true
        },
        stakeholders: ['user'],
        success_criteria: ['functional-application', 'deployed-successfully', 'documentation-complete']
      };

      const response = await fetch('/api/wai/v7/backbone/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectRequest)
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Full Orchestration Complete",
          description: `Project orchestrated with ${result.summary.quality_score}/100 quality score`,
        });
        setOrchestrationResult(result.orchestration_result);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Orchestration Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsOrchestrating(false);
    }
  };

  const quickStartProjects = [
    {
      type: 'web-application',
      name: 'Modern SaaS Dashboard',
      description: 'Create a full-featured SaaS dashboard with authentication, analytics, and user management',
      icon: Globe
    },
    {
      type: 'mobile-app',
      name: 'React Native App',
      description: 'Build a cross-platform mobile application with modern UI and backend integration',
      icon: Smartphone
    },
    {
      type: 'ai-assistant',
      name: 'Custom AI Assistant',
      description: 'Develop an intelligent AI assistant with RAG, voice capabilities, and specialized knowledge',
      icon: Brain
    },
    {
      type: 'content-platform',
      name: 'Content Management System',
      description: 'Create a powerful CMS with AI-powered content generation and workflow management',
      icon: BookOpen
    },
    {
      type: 'game-development',
      name: 'Indie Game Project',
      description: 'Develop a complete game with assets, mechanics, and monetization features',
      icon: Gamepad2
    },
    {
      type: 'enterprise-solution',
      name: 'Enterprise Platform',
      description: 'Build a scalable enterprise solution with security, compliance, and integration features',
      icon: Building
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Rocket className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WAI Orchestration Backbone v7.0
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The ultimate AI orchestration platform connecting 200+ features, 14+ LLMs, and 100+ agents 
            to create any project with intelligent routing and autonomous execution.
          </p>
        </div>

        {/* System Health Dashboard */}
        {systemHealth && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Health & Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{systemHealth.activeCapabilities}</div>
                  <div className="text-sm text-muted-foreground">Active Features</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(systemHealth.utilizationRate * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Utilization Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">14+</div>
                  <div className="text-sm text-muted-foreground">LLM Providers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">100+</div>
                  <div className="text-sm text-muted-foreground">Agents</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>System Readiness</span>
                  <span>{Math.round(systemHealth.utilizationRate * 100)}%</span>
                </div>
                <Progress value={systemHealth.utilizationRate * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="quick-start" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick-start">Quick Start Projects</TabsTrigger>
            <TabsTrigger value="custom">Custom Orchestration</TabsTrigger>
            <TabsTrigger value="results">Results & Analytics</TabsTrigger>
          </TabsList>

          {/* Quick Start Tab */}
          <TabsContent value="quick-start" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickStartProjects.map((project, index) => {
                const IconComponent = project.icon;
                return (
                  <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconComponent className="w-5 h-5" />
                        {project.name}
                      </CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handleQuickStart(project.type, project.name, project.description)}
                        disabled={isOrchestrating}
                        className="w-full"
                      >
                        {isOrchestrating ? 'Orchestrating...' : 'Create Project'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Quick Start projects use KIMI K2 as the default LLM for maximum cost optimization (85-90% savings).
                All projects include autonomous execution, multi-agent collaboration, and enterprise-grade features.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Custom Orchestration Tab */}
          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Project Orchestration</CardTitle>
                <CardDescription>
                  Configure your project with advanced orchestration options using the full WAI ecosystem.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="projectType">Project Type</Label>
                      <Select value={projectType} onValueChange={setProjectType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web-application">Web Application</SelectItem>
                          <SelectItem value="mobile-app">Mobile App</SelectItem>
                          <SelectItem value="ai-assistant">AI Assistant</SelectItem>
                          <SelectItem value="content-platform">Content Platform</SelectItem>
                          <SelectItem value="game-development">Game Development</SelectItem>
                          <SelectItem value="enterprise-solution">Enterprise Solution</SelectItem>
                          <SelectItem value="research-project">Research Project</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="projectDescription">Project Description</Label>
                    <Textarea
                      id="projectDescription"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Describe your project requirements..."
                      className="min-h-[120px]"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Orchestration Preferences</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autonomous"
                        checked={autonomousExecution}
                        onCheckedChange={setAutonomousExecution}
                      />
                      <Label htmlFor="autonomous" className="flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        Autonomous Execution
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cost"
                        checked={costOptimization}
                        onCheckedChange={setCostOptimization}
                      />
                      <Label htmlFor="cost" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Cost Optimization (KIMI K2)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="multiAgent"
                        checked={multiAgentCollaboration}
                        onCheckedChange={setMultiAgentCollaboration}
                      />
                      <Label htmlFor="multiAgent" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Multi-Agent Collaboration
                      </Label>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleFullOrchestration}
                  disabled={isOrchestrating}
                  className="w-full"
                  size="lg"
                >
                  {isOrchestrating ? 'Orchestrating Project...' : 'Start Full Orchestration'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {orchestrationResult ? (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Orchestration Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{orchestrationResult.metrics?.quality_score || 0}/100</div>
                        <div className="text-sm text-muted-foreground">Quality Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{orchestrationResult.agents?.total_used || 0}</div>
                        <div className="text-sm text-muted-foreground">Agents Used</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{orchestrationResult.llms?.cost_optimization_achieved || 0}%</div>
                        <div className="text-sm text-muted-foreground">Cost Optimization</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">${orchestrationResult.llms?.cost_savings?.toFixed(2) || '0.00'}</div>
                        <div className="text-sm text-muted-foreground">Cost Savings</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Deliverables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Files Created:</span>
                          <Badge variant="secondary">{orchestrationResult.deliverables?.codebase?.files_created || 0}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Lines of Code:</span>
                          <Badge variant="secondary">{orchestrationResult.deliverables?.codebase?.lines_of_code?.toLocaleString() || 0}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Test Coverage:</span>
                          <Badge variant="secondary">{orchestrationResult.deliverables?.codebase?.test_coverage || 0}%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Execution Time:</span>
                          <Badge variant="secondary">{Math.round(orchestrationResult.metrics?.execution_time || 0)}ms</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <Badge variant="secondary">{Math.round((orchestrationResult.metrics?.success_rate || 0) * 100)}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Enterprise Readiness:</span>
                          <Badge variant="secondary">{Math.round((orchestrationResult.analytics?.enterprise_readiness || 0) * 100)}%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                  <p className="text-muted-foreground">
                    Create a project using Quick Start or Custom Orchestration to see detailed results and analytics.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}