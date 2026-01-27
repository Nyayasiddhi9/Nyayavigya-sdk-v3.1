import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  Bot,
  Workflow,
  Mic,
  Palette,
  Settings,
  Zap,
  Globe,
  Cpu,
  Users,
  Activity,
  ChevronRight,
  Sparkles,
  FileText,
  Play,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ProjectRequest {
  title: string;
  description: string;
  type: string;
  priority: string;
  requirements: string[];
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  capabilities: string[];
  specializations: string[];
}

interface BusinessRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export function OrchestrationDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [projectForm, setProjectForm] = useState<ProjectRequest>({
    title: "",
    description: "",
    type: "web_application",
    priority: "medium",
    requirements: [],
  });
  const [config, setConfig] = useState({
    enableDynamicIntelligence: true,
    enableBusinessRules: true,
    enableVoiceFallback: true,
    enableCanvaIntegration: true,
    enableAdvancedCoordination: true,
    llmDecisionMaking: true,
    autoScaling: true,
    performanceMode: "balanced",
  });

  // Fetch agent status
  const { data: agents } = useQuery({
    queryKey: ["/api/orchestration-v3/agent-status"],
    refetchInterval: 5000,
  });

  // Fetch business rules
  const { data: businessRules } = useQuery({
    queryKey: ["/api/orchestration-v3/business-rules"],
  });

  // Fetch workflow templates
  const { data: workflowTemplates } = useQuery({
    queryKey: ["/api/orchestration-v3/workflow-templates"],
  });

  // Fetch voice providers
  const { data: voiceProviders } = useQuery({
    queryKey: ["/api/orchestration-v3/voice-providers"],
  });

  // Execute project mutation
  const executeProject = useMutation({
    mutationFn: async (project: ProjectRequest) => {
      const response = await fetch("/api/orchestration-v3/execute-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error("Failed to execute project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setProjectForm({
        title: "",
        description: "",
        type: "web_application",
        priority: "medium",
        requirements: [],
      });
    },
  });

  // Update configuration
  const updateConfig = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch("/api/orchestration-v3/configuration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update configuration");
      return response.json();
    },
  });

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateConfig.mutate(newConfig);
  };

  const handleExecuteProject = () => {
    const requirements = projectForm.description
      .split("\n")
      .filter((line) => line.trim());
    executeProject.mutate({ ...projectForm, requirements });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">LLM Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13</div>
            <p className="text-xs text-muted-foreground">Active & Ready</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">39+</div>
            <p className="text-xs text-muted-foreground">Specialized</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflowTemplates?.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>World-Class Features</CardTitle>
          <CardDescription>
            WAI Orchestration v3.0 - Best-in-class intelligent platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Brain className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Dynamic Intelligence</h4>
                <p className="text-sm text-muted-foreground">
                  Advanced task-based LLM selection with business rules
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Sophisticated Coordination</h4>
                <p className="text-sm text-muted-foreground">
                  Multi-agent orchestration with conflict resolution
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Workflow className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">LangChain Workflows</h4>
                <p className="text-sm text-muted-foreground">
                  Automated business process and content generation
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Mic className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Voice Synthesis</h4>
                <p className="text-sm text-muted-foreground">
                  ElevenLabs with Pipecat fallback for reliability
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Palette className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Claude-Canva Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Enhanced content creation and design automation
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Globe className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">13 LLM Providers</h4>
                <p className="text-sm text-muted-foreground">
                  OpenAI, Anthropic, Gemini, Grok, Perplexity, and more
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectExecution = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Execute New Project</CardTitle>
          <CardDescription>
            Launch a project with full AI orchestration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title</Label>
            <input
              id="title"
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={projectForm.title}
              onChange={(e) =>
                setProjectForm({ ...projectForm, title: e.target.value })
              }
              placeholder="My Amazing Project"
            />
          </div>
          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              value={projectForm.description}
              onChange={(e) =>
                setProjectForm({ ...projectForm, description: e.target.value })
              }
              placeholder="Describe your project requirements..."
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Project Type</Label>
              <Select
                value={projectForm.type}
                onValueChange={(value) =>
                  setProjectForm({ ...projectForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web_application">Web Application</SelectItem>
                  <SelectItem value="mobile_application">Mobile App</SelectItem>
                  <SelectItem value="ai_system">AI System</SelectItem>
                  <SelectItem value="enterprise_platform">Enterprise Platform</SelectItem>
                  <SelectItem value="creative_project">Creative Project</SelectItem>
                  <SelectItem value="content_generation">Content Generation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={projectForm.priority}
                onValueChange={(value) =>
                  setProjectForm({ ...projectForm, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleExecuteProject}
            disabled={!projectForm.title || !projectForm.description}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Execute Project
          </Button>
        </CardContent>
      </Card>

      {executeProject.isPending && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Project execution in progress...</AlertDescription>
        </Alert>
      )}

      {executeProject.isSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Project executed successfully! Check the results below.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderAgentCoordination = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active AI Agents</CardTitle>
          <CardDescription>
            39+ specialized agents with sophisticated coordination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {agents?.data?.agents?.map((agent: Agent) => (
                <div
                  key={agent.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bot className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium">{agent.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {agent.type}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        agent.status === "idle"
                          ? "secondary"
                          : agent.status === "working"
                          ? "default"
                          : "outline"
                      }
                    >
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.specializations?.map((spec, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderBusinessRules = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Rules Engine</CardTitle>
          <CardDescription>
            Configure task-based LLM selection and routing rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {businessRules?.data?.map((rule: BusinessRule) => (
                <div
                  key={rule.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        If: {rule.condition}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Then: {rule.action}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge>Priority {rule.priority}</Badge>
                      <Switch checked={rule.enabled} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfiguration = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Configuration</CardTitle>
          <CardDescription>
            Fine-tune the orchestration behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dynamic-intelligence">Dynamic Intelligence</Label>
              <Switch
                id="dynamic-intelligence"
                checked={config.enableDynamicIntelligence}
                onCheckedChange={(checked) =>
                  handleConfigChange("enableDynamicIntelligence", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="business-rules">Business Rules Engine</Label>
              <Switch
                id="business-rules"
                checked={config.enableBusinessRules}
                onCheckedChange={(checked) =>
                  handleConfigChange("enableBusinessRules", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="voice-fallback">Voice Fallback</Label>
              <Switch
                id="voice-fallback"
                checked={config.enableVoiceFallback}
                onCheckedChange={(checked) =>
                  handleConfigChange("enableVoiceFallback", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="canva-integration">Canva Integration</Label>
              <Switch
                id="canva-integration"
                checked={config.enableCanvaIntegration}
                onCheckedChange={(checked) =>
                  handleConfigChange("enableCanvaIntegration", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="advanced-coordination">
                Advanced Agent Coordination
              </Label>
              <Switch
                id="advanced-coordination"
                checked={config.enableAdvancedCoordination}
                onCheckedChange={(checked) =>
                  handleConfigChange("enableAdvancedCoordination", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="llm-decisions">LLM Decision Making</Label>
              <Switch
                id="llm-decisions"
                checked={config.llmDecisionMaking}
                onCheckedChange={(checked) =>
                  handleConfigChange("llmDecisionMaking", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-scaling">Auto Scaling</Label>
              <Switch
                id="auto-scaling"
                checked={config.autoScaling}
                onCheckedChange={(checked) =>
                  handleConfigChange("autoScaling", checked)
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="performance-mode">Performance Mode</Label>
            <Select
              value={config.performanceMode}
              onValueChange={(value) =>
                handleConfigChange("performanceMode", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="high_performance">High Performance</SelectItem>
                <SelectItem value="cost_optimized">Cost Optimized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Voice Providers Status */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Synthesis Providers</CardTitle>
          <CardDescription>
            ElevenLabs with Pipecat fallback system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {voiceProviders?.data?.map((provider: any) => (
              <div
                key={provider.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div className="flex items-center space-x-3">
                  <Mic className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {provider.models?.length || 0} models
                    </p>
                  </div>
                </div>
                <Badge
                  variant={provider.available ? "default" : "secondary"}
                >
                  {provider.available ? "Available" : "Not Configured"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WAI Orchestration v3.0</h1>
        <p className="text-muted-foreground">
          World-class intelligent 3D AI Assistant platform with 13 LLM providers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-[700px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="execute">Execute</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverview()}</TabsContent>
        <TabsContent value="execute">{renderProjectExecution()}</TabsContent>
        <TabsContent value="agents">{renderAgentCoordination()}</TabsContent>
        <TabsContent value="rules">{renderBusinessRules()}</TabsContent>
        <TabsContent value="config">{renderConfiguration()}</TabsContent>
      </Tabs>
    </div>
  );
}