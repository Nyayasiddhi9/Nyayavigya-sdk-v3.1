import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Bot
} from "lucide-react";

interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  complexity: string;
  estimatedTime: number;
  tags: string[];
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: string;
    config: any;
  };
  createdAt: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: string;
  startTime: string;
  endTime?: string;
  triggeredBy: string;
}

export default function WorkflowAutomation() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const { toast } = useToast();

  // Template customization form
  const [customization, setCustomization] = useState({
    name: '',
    description: '',
    trigger: {
      type: 'manual',
      config: {}
    },
    isActive: true
  });

  useEffect(() => {
    loadTemplates();
    loadWorkflows();
    loadExecutions();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows/templates');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load workflow templates",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load workflow templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      const result = await response.json();
      
      if (result.success) {
        setWorkflows(result.data);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch('/api/workflows/executions');
      const result = await response.json();
      
      if (result.success) {
        setExecutions(result.data);
      }
    } catch (error) {
      console.error('Failed to load executions:', error);
    }
  };

  const createFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      const response = await fetch('/api/workflows/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          customizations: customization
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Workflow "${result.data.name}" created successfully`,
        });
        setSelectedTemplate(null);
        setCustomization({
          name: '',
          description: '',
          trigger: { type: 'manual', config: {} },
          isActive: true
        });
        loadWorkflows();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create workflow",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredBy: 'manual' }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Workflow execution started successfully",
        });
        loadExecutions();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to execute workflow",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Zap className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'default',
      'running': 'default',
      'failed': 'destructive',
      'pending': 'secondary'
    };
    return (
      <Badge variant={variants[status] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'data_processing': '📊',
      'customer_service': '🤝',
      'marketing': '📢',
      'hr': '👥',
      'finance': '💰',
      'development': '⚡'
    };
    return (icons as any)[category] || '⚙️';
  };

  const getComplexityColor = (complexity: string) => {
    const colors = {
      'simple': 'bg-green-100 text-green-800',
      'moderate': 'bg-yellow-100 text-yellow-800',
      'complex': 'bg-red-100 text-red-800'
    };
    return (colors as any)[complexity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Automation</h1>
          <p className="text-muted-foreground">
            AI-powered business process automation with visual workflow designer
          </p>
        </div>
        <Badge variant="default" className="bg-purple-100 text-purple-800">
          <Bot className="h-3 w-3 mr-1" />
          AI-Driven Workflows
        </Badge>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Templates</CardTitle>
              <CardDescription>
                Choose from pre-built enterprise workflow templates and customize them for your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading templates...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <Card 
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-3xl">{getCategoryIcon(template.category)}</div>
                          <Badge className={getComplexityColor(template.complexity)}>
                            {template.complexity}
                          </Badge>
                        </div>
                        
                        <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{template.estimatedTime} minutes</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {template.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Customization Modal */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Customize Workflow: {selectedTemplate.name}</CardTitle>
                <CardDescription>
                  Configure the workflow settings before creation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workflow-name">Workflow Name</Label>
                    <Input
                      id="workflow-name"
                      placeholder={selectedTemplate.name}
                      value={customization.name}
                      onChange={(e) => setCustomization({ ...customization, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trigger-type">Trigger Type</Label>
                    <Select
                      value={customization.trigger.type}
                      onValueChange={(value) => setCustomization({ 
                        ...customization, 
                        trigger: { ...customization.trigger, type: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="database_change">Database Change</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="workflow-description">Description</Label>
                    <Input
                      id="workflow-description"
                      placeholder={selectedTemplate.description}
                      value={customization.description}
                      onChange={(e) => setCustomization({ ...customization, description: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2 flex items-center space-x-2">
                    <Switch
                      checked={customization.isActive}
                      onCheckedChange={(checked) => setCustomization({ ...customization, isActive: checked })}
                    />
                    <Label>Enable workflow immediately</Label>
                  </div>

                  <div className="col-span-2 flex gap-3">
                    <Button onClick={createFromTemplate} disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Workflow
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Workflows</CardTitle>
              <CardDescription>
                Manage your created workflows and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <Badge variant={workflow.isActive ? "default" : "secondary"}>
                            {workflow.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{workflow.trigger.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(workflow.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => executeWorkflow(workflow.id)}
                          disabled={loading}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Executions</CardTitle>
              <CardDescription>
                Monitor workflow execution history and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {executions.slice(0, 10).map((execution) => {
                  const workflow = workflows.find(w => w.id === execution.workflowId);
                  
                  return (
                    <div key={execution.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(execution.status)}
                            <h3 className="font-semibold">{workflow?.name || 'Unknown Workflow'}</h3>
                            {getStatusBadge(execution.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Triggered by: {execution.triggeredBy}</span>
                            <span>Started: {new Date(execution.startTime).toLocaleString()}</span>
                            {execution.endTime && (
                              <span>Duration: {Math.round((new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 1000)}s</span>
                            )}
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Analytics</CardTitle>
              <CardDescription>
                Monitor workflow performance and efficiency metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Total Workflows</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{workflows.length}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Active Workflows</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {workflows.filter(w => w.isActive).length}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Total Executions</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{executions.length}</p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {executions.length > 0 
                      ? Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {executions
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .slice(0, 5)
                    .map((execution) => {
                      const workflow = workflows.find(w => w.id === execution.workflowId);
                      return (
                        <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(execution.status)}
                            <span className="font-medium">{workflow?.name || 'Unknown'}</span>
                            {getStatusBadge(execution.status)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(execution.startTime).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}