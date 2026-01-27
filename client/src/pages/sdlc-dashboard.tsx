import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Lightbulb,
  GitBranch,
  Code,
  TestTube,
  Package,
  Rocket,
  Activity,
  MessageSquare,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Layers,
  FileText,
  Users
} from "lucide-react";

interface SdlcWorkflow {
  workflowId: string;
  founderId: string;
  projectId: number;
  name: string;
  type: string;
  description: string;
  status: string;
  progress: number;
  scheduledStart: string;
  actualStart: string;
  actualEnd?: string;
  inputData: any;
  outputData?: any;
  errorCount: number;
  lastError?: any;
}

interface SdlcExecution {
  executionId: string;
  workflowId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  success: boolean;
  tasksExecuted: number;
  tasksSucceeded: number;
  artifactsGenerated: number;
  output?: any;
}

const workflowTypes = [
  { id: "discovery", name: "Discovery", icon: Lightbulb, color: "text-yellow-500", bgColor: "bg-yellow-50" },
  { id: "triage", name: "Triage", icon: GitBranch, color: "text-blue-500", bgColor: "bg-blue-50" },
  { id: "sprint", name: "Sprint", icon: Code, color: "text-purple-500", bgColor: "bg-purple-50" },
  { id: "quality", name: "Quality", icon: TestTube, color: "text-green-500", bgColor: "bg-green-50" },
  { id: "package", name: "Package", icon: Package, color: "text-orange-500", bgColor: "bg-orange-50" },
  { id: "deploy", name: "Deploy", icon: Rocket, color: "text-red-500", bgColor: "bg-red-50" },
  { id: "monitor", name: "Monitor", icon: Activity, color: "text-cyan-500", bgColor: "bg-cyan-50" },
  { id: "feedback", name: "Feedback", icon: MessageSquare, color: "text-pink-500", bgColor: "bg-pink-50" }
];

export default function SDLCDashboard() {
  const { toast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState<SdlcWorkflow | null>(null);

  const { data: workflowsResponse, isLoading } = useQuery<{ success: boolean; data: SdlcWorkflow[] }>({
    queryKey: ["/api/sdlc/workflows"],
  });

  const { data: executionsResponse } = useQuery<{ success: boolean; data: SdlcExecution[] }>({
    queryKey: ["/api/sdlc/executions", selectedWorkflow?.workflowId],
    queryFn: async () => {
      if (!selectedWorkflow?.workflowId) return { success: true, data: [] };
      const response = await fetch(`/api/sdlc/executions?workflowId=${selectedWorkflow.workflowId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch executions');
      return response.json();
    },
    enabled: !!selectedWorkflow,
  });

  const workflows = workflowsResponse?.data;
  const executions = executionsResponse?.data;

  const executeWorkflowMutation = useMutation({
    mutationFn: async (type: string) => {
      return apiRequest(`/api/sdlc/workflows/${type}/execute`, "POST", {
        founderId: "founder_demo",
        projectId: 1,
        projectContext: {
          name: "Demo Project",
          description: "Testing SDLC automation"
        }
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Workflow execution started" });
      queryClient.invalidateQueries({ queryKey: ["/api/sdlc/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sdlc/executions"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      pending: { variant: "outline", className: "bg-gray-50" },
      in_progress: { variant: "default", className: "bg-blue-500" },
      completed: { variant: "default", className: "bg-green-500" },
      failed: { variant: "destructive", className: "" },
      paused: { variant: "secondary", className: "" }
    };
    return variants[status] || variants.pending;
  };

  const getWorkflowIcon = (type: string) => {
    const workflow = workflowTypes.find(w => w.id === type);
    if (!workflow) return Layers;
    return workflow.icon;
  };

  const getWorkflowColor = (type: string) => {
    const workflow = workflowTypes.find(w => w.id === type);
    return workflow?.color || "text-gray-500";
  };

  const getWorkflowBgColor = (type: string) => {
    const workflow = workflowTypes.find(w => w.id === type);
    return workflow?.bgColor || "bg-gray-50";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">SDLC Automation Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered Software Development Lifecycle orchestration with 8 specialized workflows
          </p>
        </div>
        <Badge variant="default" className="bg-purple-100 text-purple-800">
          <TrendingUp className="h-3 w-3 mr-1" />
          Production Ready
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows" data-testid="tab-workflows">Active Workflows</TabsTrigger>
          <TabsTrigger value="executions" data-testid="tab-executions">Execution History</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>8-Phase SDLC Automation</CardTitle>
              <CardDescription>
                Complete Software Development Lifecycle powered by WAI SDK v1.0 with 267+ AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {workflowTypes.map((workflow) => {
                  const Icon = workflow.icon;
                  return (
                    <Card 
                      key={workflow.id} 
                      className={`${workflow.bgColor} border-none transition-all hover:shadow-lg cursor-pointer`}
                      onClick={() => executeWorkflowMutation.mutate(workflow.id)}
                      data-testid={`card-workflow-${workflow.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-8 w-8 ${workflow.color}`} />
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{workflow.name}</h3>
                            <p className="text-xs text-muted-foreground">Click to execute</p>
                          </div>
                          <Play className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-workflows">
                  {workflows?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Across all projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600" data-testid="text-active-executions">
                  {workflows?.filter(w => w.status === "in_progress").length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600" data-testid="text-success-rate">
                  {workflows && workflows.length > 0 
                    ? Math.round((workflows.filter(w => w.status === "completed").length / workflows.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Completed successfully</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>Monitor all SDLC workflows in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading workflows...</div>
              ) : !workflows || workflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No workflows found. Execute a workflow to get started.
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {workflows.map((workflow) => {
                      const Icon = getWorkflowIcon(workflow.type);
                      const badge = getStatusBadge(workflow.status);
                      
                      return (
                        <Card 
                          key={workflow.workflowId}
                          className="hover:shadow-md transition-all cursor-pointer"
                          onClick={() => setSelectedWorkflow(workflow)}
                          data-testid={`card-workflow-${workflow.workflowId}`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getWorkflowBgColor(workflow.type)}`}>
                                  <Icon className={`h-5 w-5 ${getWorkflowColor(workflow.type)}`} />
                                </div>
                                <div>
                                  <h3 className="font-semibold" data-testid={`text-workflow-name-${workflow.workflowId}`}>
                                    {workflow.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                                </div>
                              </div>
                              <Badge {...badge} data-testid={`badge-status-${workflow.workflowId}`}>
                                {workflow.status.replace("_", " ")}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span>Progress</span>
                                  <span className="font-medium">{workflow.progress}%</span>
                                </div>
                                <Progress value={workflow.progress} className="h-2" />
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Started:</span>
                                  <span className="font-medium">
                                    {new Date(workflow.actualStart).toLocaleDateString()}
                                  </span>
                                </div>
                                {workflow.actualEnd && (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-muted-foreground">Completed:</span>
                                    <span className="font-medium">
                                      {new Date(workflow.actualEnd).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {workflow.errorCount > 0 && (
                                <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm">
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-red-700">
                                    {workflow.errorCount} error{workflow.errorCount > 1 ? 's' : ''} occurred
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                {selectedWorkflow 
                  ? `Execution history for ${selectedWorkflow.name}` 
                  : "Select a workflow to view execution history"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedWorkflow ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select a workflow from the Active Workflows tab to view execution history
                </div>
              ) : !executions || executions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No execution history found for this workflow
                </div>
              ) : (
                <div className="space-y-4">
                  {executions.map((execution) => (
                    <Card key={execution.executionId} data-testid={`card-execution-${execution.executionId}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={execution.success ? "default" : "destructive"}>
                              {execution.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {execution.executionId}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(execution.startedAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tasks Executed:</span>
                            <span className="ml-2 font-medium">{execution.tasksExecuted}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Succeeded:</span>
                            <span className="ml-2 font-medium text-green-600">{execution.tasksSucceeded}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Artifacts:</span>
                            <span className="ml-2 font-medium">{execution.artifactsGenerated}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Workflow Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowTypes.map((workflow) => {
                    const count = workflows?.filter(w => w.type === workflow.id).length || 0;
                    const completed = workflows?.filter(w => w.type === workflow.id && w.status === "completed").length || 0;
                    const successRate = count > 0 ? (completed / count) * 100 : 0;
                    
                    return (
                      <div key={workflow.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{workflow.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {completed}/{count} ({Math.round(successRate)}%)
                          </span>
                        </div>
                        <Progress value={successRate} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {workflows?.slice(0, 10).map((workflow) => (
                      <div key={workflow.workflowId} className="flex items-center gap-3 text-sm">
                        <Badge variant="outline" className="w-20 justify-center">
                          {workflow.type}
                        </Badge>
                        <span className="flex-1 truncate">{workflow.name}</span>
                        <Badge {...getStatusBadge(workflow.status)} className="w-24 justify-center">
                          {workflow.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
