import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  Clock, 
  Code, 
  Database, 
  TestTube, 
  Rocket,
  GitBranch,
  Users,
  BarChart3,
  Settings,
  Zap
} from "lucide-react";

interface SDLCWorkflowTemplate {
  id: string;
  name: string;
  category: string;
  phase: string;
  description: string;
  complexity: string;
  estimatedDuration: number;
  teamSize: string;
  technologies: string[];
  deliverables: string[];
  steps: any[];
  prerequisites: string[];
  successCriteria: string[];
  riskMitigation: string[];
}

interface WorkflowExecution {
  id: string;
  templateName: string;
  status: string;
  progress: {
    completedSteps: number;
    totalSteps: number;
    currentStep: string | null;
    estimatedCompletion: string;
  };
  createdAt: string;
}

export default function SoftwareDevelopmentWorkflows() {
  const [templates, setTemplates] = useState<SDLCWorkflowTemplate[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SDLCWorkflowTemplate | null>(null);
  const [activeExecution, setActiveExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, [filterCategory, filterPhase]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterPhase !== 'all') params.append('phase', filterPhase);
      
      const response = await fetch(`/api/sdlc/templates?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load SDLC templates",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load SDLC templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createExecutionPlan = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/sdlc/execution-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Execution plan created for ${result.data.templateName}`,
        });
        setExecutions(prev => [...prev, result.data]);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create execution plan",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create execution plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeStep = async (executionId: string, stepId: string) => {
    try {
      const response = await fetch('/api/sdlc/execute-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId, stepId }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Step Completed",
          description: "Workflow step executed successfully",
        });
        // Refresh execution status
        loadExecutionStatus(executionId);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to execute step",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute step",
        variant: "destructive",
      });
    }
  };

  const loadExecutionStatus = async (executionId: string) => {
    try {
      const response = await fetch(`/api/sdlc/execution/${executionId}/status`);
      const result = await response.json();
      
      if (result.success && result.data.execution) {
        setExecutions(prev => 
          prev.map(exec => exec.id === executionId ? result.data.execution : exec)
        );
      }
    } catch (error) {
      console.error('Failed to load execution status:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'planning': '📋',
      'development': '⚡',
      'testing': '🧪',
      'deployment': '🚀',
      'maintenance': '🔧',
      'analysis': '📊'
    };
    return (icons as any)[category] || '📋';
  };

  const getPhaseIcon = (phase: string) => {
    const icons = {
      'requirements': <Settings className="h-4 w-4" />,
      'design': <Code className="h-4 w-4" />,
      'implementation': <GitBranch className="h-4 w-4" />,
      'testing': <TestTube className="h-4 w-4" />,
      'deployment': <Rocket className="h-4 w-4" />,
      'maintenance': <Settings className="h-4 w-4" />
    };
    return (icons as any)[phase] || <Settings className="h-4 w-4" />;
  };

  const getComplexityColor = (complexity: string) => {
    const colors = {
      'simple': 'bg-green-100 text-green-800',
      'moderate': 'bg-yellow-100 text-yellow-800',
      'complex': 'bg-orange-100 text-orange-800',
      'enterprise': 'bg-red-100 text-red-800'
    };
    return (colors as any)[complexity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Software Development Workflows</h1>
          <p className="text-muted-foreground">
            Comprehensive SDLC automation with AI-powered workflows for every development phase
          </p>
        </div>
        <Badge variant="default" className="bg-purple-100 text-purple-800">
          <Zap className="h-3 w-3 mr-1" />
          SDLC Automation
        </Badge>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">SDLC Templates</TabsTrigger>
          <TabsTrigger value="executions">Active Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* SDLC Phase Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Software Development Lifecycle Phases</CardTitle>
              <CardDescription>
                Comprehensive workflows covering all aspects of software development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="text-center">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold text-sm">Requirements</h3>
                    <p className="text-xs text-muted-foreground">Analysis & Planning</p>
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="text-center">
                    <Code className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-semibold text-sm">Design</h3>
                    <p className="text-xs text-muted-foreground">Architecture & UI/UX</p>
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <div className="text-center">
                    <GitBranch className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-semibold text-sm">Implementation</h3>
                    <p className="text-xs text-muted-foreground">Coding & Development</p>
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                  <div className="text-center">
                    <TestTube className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <h3 className="font-semibold text-sm">Testing</h3>
                    <p className="text-xs text-muted-foreground">QA & Validation</p>
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <div className="text-center">
                    <Rocket className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <h3 className="font-semibold text-sm">Deployment</h3>
                    <p className="text-xs text-muted-foreground">CI/CD & Release</p>
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <div className="text-center">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-red-600" />
                    <h3 className="font-semibold text-sm">Maintenance</h3>
                    <p className="text-xs text-muted-foreground">Monitoring & Updates</p>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div>
                  <label className="text-sm font-medium">Category:</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="ml-2 px-3 py-1 border rounded"
                  >
                    <option value="all">All Categories</option>
                    <option value="planning">Planning</option>
                    <option value="development">Development</option>
                    <option value="testing">Testing</option>
                    <option value="deployment">Deployment</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Phase:</label>
                  <select
                    value={filterPhase}
                    onChange={(e) => setFilterPhase(e.target.value)}
                    className="ml-2 px-3 py-1 border rounded"
                  >
                    <option value="all">All Phases</option>
                    <option value="requirements">Requirements</option>
                    <option value="design">Design</option>
                    <option value="implementation">Implementation</option>
                    <option value="testing">Testing</option>
                    <option value="deployment">Deployment</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Available SDLC Templates</CardTitle>
              <CardDescription>
                Production-ready workflows for comprehensive software development
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading SDLC templates...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="hover:shadow-lg transition-all"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-3xl">{getCategoryIcon(template.category)}</div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getComplexityColor(template.complexity)}>
                              {template.complexity}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {getPhaseIcon(template.phase)}
                              <span>{template.phase}</span>
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Duration:
                            </span>
                            <span className="font-medium">{Math.floor(template.estimatedDuration / 60)}h {template.estimatedDuration % 60}m</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Team Size:
                            </span>
                            <span className="font-medium">{template.teamSize}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Steps:</span>
                            <span className="font-medium">{template.steps.length}</span>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-xs font-medium mb-2">Technologies:</div>
                          <div className="flex flex-wrap gap-1">
                            {template.technologies.slice(0, 3).map((tech) => (
                              <Badge key={tech} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                            {template.technologies.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.technologies.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemplate(template);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              createExecutionPlan(template.id);
                            }}
                            disabled={loading}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Details & Editor */}
          {selectedTemplate && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(selectedTemplate.category)}
                      {selectedTemplate.name}
                    </CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowWorkflowDetails(!showWorkflowDetails)}
                    >
                      {showWorkflowDetails ? 'Hide Details' : 'Show Steps'}
                    </Button>
                    <Button onClick={() => setSelectedTemplate(null)} variant="outline">
                      Close
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="workflow">Workflow Steps</TabsTrigger>
                    <TabsTrigger value="customize">Customize</TabsTrigger>
                    <TabsTrigger value="execute">Execute</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">Duration</span>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                          {Math.floor(selectedTemplate.estimatedDuration / 60)}h {selectedTemplate.estimatedDuration % 60}m
                        </p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-sm">Team Size</span>
                        </div>
                        <p className="text-lg font-bold text-green-600">{selectedTemplate.teamSize}</p>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <GitBranch className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-sm">Steps</span>
                        </div>
                        <p className="text-lg font-bold text-purple-600">{selectedTemplate.steps.length}</p>
                      </div>
                      
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-sm">Complexity</span>
                        </div>
                        <p className="text-lg font-bold text-orange-600 capitalize">{selectedTemplate.complexity}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Deliverables
                        </h4>
                        <ul className="space-y-2">
                          {selectedTemplate.deliverables.map((deliverable, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-green-500 rounded-full" />
                              <span className="text-sm">{deliverable}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Settings className="h-4 w-4 text-blue-500" />
                          Prerequisites
                        </h4>
                        <ul className="space-y-2">
                          {selectedTemplate.prerequisites.map((prerequisite, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                              <span className="text-sm">{prerequisite}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Code className="h-4 w-4 text-purple-500" />
                          Technologies
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.technologies.map((tech, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TestTube className="h-4 w-4 text-orange-500" />
                          Success Criteria
                        </h4>
                        <ul className="space-y-2">
                          {selectedTemplate.successCriteria.map((criteria, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-orange-500 rounded-full" />
                              <span className="text-sm">{criteria}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="workflow" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Workflow Steps</h3>
                        <Badge variant="outline">{selectedTemplate.steps.length} Steps</Badge>
                      </div>
                      
                      <div className="space-y-4">
                        {selectedTemplate.steps.map((step, index) => (
                          <Card key={step.id} className="p-4 border-l-4 border-l-blue-500">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    Step {index + 1}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {step.type}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      step.automationLevel === 'fully-automated' 
                                        ? 'bg-green-100 text-green-800' 
                                        : step.automationLevel === 'human-in-loop'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {step.automationLevel.replace('-', ' ')}
                                  </Badge>
                                </div>
                                
                                <h4 className="font-semibold mb-2">{step.name}</h4>
                                <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Duration:</span>
                                    <p className="text-muted-foreground">{step.estimatedDuration} minutes</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Skills Required:</span>
                                    <p className="text-muted-foreground">{step.requiredSkills.join(', ')}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Outputs:</span>
                                    <p className="text-muted-foreground">{step.outputs.join(', ')}</p>
                                  </div>
                                </div>
                                
                                {step.dependencies.length > 0 && (
                                  <div className="mt-3">
                                    <span className="text-xs font-medium">Dependencies:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {step.dependencies.map((dep, depIndex) => (
                                        <Badge key={depIndex} variant="outline" className="text-xs">
                                          {dep}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                <div className="text-right text-sm">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {step.estimatedDuration}m
                                </div>
                                {step.config.model && (
                                  <Badge variant="outline" className="text-xs">
                                    AI: {step.config.model}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="customize" className="space-y-6">
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Customize Workflow</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Workflow Name</label>
                          <input 
                            type="text" 
                            className="w-full mt-1 px-3 py-2 border rounded-lg"
                            defaultValue={selectedTemplate.name}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Team Size</label>
                          <select className="w-full mt-1 px-3 py-2 border rounded-lg">
                            <option value="small">1-3 people</option>
                            <option value="medium">4-8 people</option>
                            <option value="large">9+ people</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Priority Level</label>
                          <select className="w-full mt-1 px-3 py-2 border rounded-lg">
                            <option value="normal">Normal</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Additional Requirements</label>
                          <textarea 
                            className="w-full mt-1 px-3 py-2 border rounded-lg h-24"
                            placeholder="Add any specific requirements or customizations..."
                          />
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="execute" className="space-y-6">
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Execute Workflow</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium mb-2">Ready to Start</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            This workflow will guide you through {selectedTemplate.steps.length} steps 
                            over approximately {Math.floor(selectedTemplate.estimatedDuration / 60)} hours.
                          </p>
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => createExecutionPlan(selectedTemplate.id)} 
                              disabled={loading}
                              className="flex-1"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Workflow Execution
                            </Button>
                            <Button variant="outline">
                              <Settings className="h-4 w-4 mr-2" />
                              Schedule Later
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Pre-execution Checklist</h4>
                          <div className="space-y-2">
                            {selectedTemplate.prerequisites.map((prereq, index) => (
                              <label key={index} className="flex items-center gap-2">
                                <input type="checkbox" className="rounded" />
                                <span className="text-sm">{prereq}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflow Executions</CardTitle>
              <CardDescription>
                Monitor and manage running SDLC workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Rocket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active workflow executions</p>
                  <p className="text-sm">Start a workflow from the Templates tab</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {executions.map((execution) => (
                    <Card key={execution.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{execution.templateName}</h3>
                        <Badge variant="outline">{execution.status}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress:</span>
                          <span>{execution.progress.completedSteps}/{execution.progress.totalSteps} steps</span>
                        </div>
                        <Progress 
                          value={(execution.progress.completedSteps / execution.progress.totalSteps) * 100} 
                          className="h-2"
                        />
                        {execution.progress.currentStep && (
                          <div className="text-sm text-muted-foreground">
                            Current: {execution.progress.currentStep}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActiveExecution(execution)}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          Continue
                        </Button>
                        <Button size="sm" variant="outline">
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Square className="h-3 w-3 mr-1" />
                          Stop
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Execution Details */}
          {activeExecution && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Execution Details: {activeExecution.templateName}</span>
                  <Button variant="outline" onClick={() => setActiveExecution(null)}>
                    Close
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium">Status</div>
                      <div className="text-lg font-bold capitalize">{activeExecution.status}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium">Progress</div>
                      <div className="text-lg font-bold">
                        {Math.round((activeExecution.progress.completedSteps / activeExecution.progress.totalSteps) * 100)}%
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium">Started</div>
                      <div className="text-lg font-bold">
                        {new Date(activeExecution.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Current Progress</h4>
                    <Progress 
                      value={(activeExecution.progress.completedSteps / activeExecution.progress.totalSteps) * 100} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{activeExecution.progress.completedSteps} completed</span>
                      <span>{activeExecution.progress.totalSteps} total steps</span>
                    </div>
                  </div>
                  
                  {activeExecution.progress.currentStep && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Current Step</h4>
                      <p className="text-sm">{activeExecution.progress.currentStep}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Analytics</CardTitle>
              <CardDescription>
                Performance metrics and insights for SDLC workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Total Templates</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{templates.length}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Active Workflows</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{executions.length}</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {executions.filter(e => e.status === 'completed').length}
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold">Avg Duration</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {templates.length > 0 
                      ? Math.floor(templates.reduce((acc, t) => acc + t.estimatedDuration, 0) / templates.length / 60) 
                      : 0}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Workflow Recommendations</CardTitle>
              <CardDescription>
                Get personalized workflow recommendations based on your project context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>AI Recommendations Coming Soon</p>
                <p className="text-sm">Intelligent workflow suggestions based on project analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}