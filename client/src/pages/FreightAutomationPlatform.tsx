import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Truck, Package, Map, BarChart3, Settings, Users, FileText, Zap } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FreightProject {
  id: number;
  name: string;
  description: string;
  status: string;
  progress: number;
  createdAt: string;
  tags: string[];
  configuration: any;
}

interface WAITask {
  id: string;
  taskType: string;
  status: string;
  progress: number;
  result?: any;
  agentType: string;
  description: string;
}

export default function FreightAutomationPlatform() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<FreightProject | null>(null);
  const [activeAgents, setActiveAgents] = useState<WAITask[]>([]);

  // Fetch freight automation projects
  const { data: projectsResponse, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/software-development/projects'],
    queryFn: () => apiRequest('/api/software-development/projects?category=freight-automation'),
  });

  // Ensure projects is always an array
  const projects = projectsResponse?.data || projectsResponse || [];

  // Create new freight project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      return apiRequest('/api/software-development/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/software-development/projects']);
      toast({
        title: "Project Created",
        description: "AVAGlobal freight automation project created successfully",
      });
    },
  });

  // Execute WAI orchestration for freight automation
  const executeWAIMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return apiRequest('/api/software-development/execute-wai-task', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });
    },
    onSuccess: (data) => {
      setActiveAgents(prev => [...prev, data]);
      toast({
        title: "WAI Agent Deployed",
        description: `${data.agentType} agent is now working on freight automation`,
      });
    },
  });

  const createAVAGlobalProject = () => {
    createProjectMutation.mutate({
      name: "AVAGlobal Freight Automation Platform",
      description: "Comprehensive freight management and automation platform for AVAGlobal logistics operations",
      requirements: `
        # AVAGlobal Freight Automation Platform - PRD/BRD

        ## Business Requirements
        - Real-time shipment tracking across global routes
        - Automated route optimization using AI algorithms
        - Integration with customs and regulatory systems
        - Cost analysis and budget forecasting
        - Client portal for shipment visibility
        - Mobile app for drivers and warehouse staff
        - API integration with existing ERP systems

        ## Technical Requirements
        - Microservices architecture with Docker containers
        - Real-time WebSocket connections for live tracking
        - PostgreSQL database with spatial data support
        - Redis for caching and session management
        - RESTful APIs with OpenAPI documentation
        - Mobile-responsive React frontend
        - Node.js backend with TypeScript
        - AWS/GCP cloud deployment
        - CI/CD pipeline with automated testing

        ## Functional Features
        1. Shipment Management System
        2. Route Optimization Engine
        3. Real-time GPS Tracking
        4. Customs Documentation Automation
        5. Cost Calculator and Billing System
        6. Customer Portal and Notifications
        7. Driver Mobile Application
        8. Warehouse Management Integration
        9. Analytics and Reporting Dashboard
        10. Multi-language Support (English, Hindi, Tamil)

        ## Compliance Requirements
        - GDPR compliance for EU operations
        - Indian logistics regulations
        - International shipping documentation
        - Security protocols for cargo tracking
        - Data encryption for sensitive information
      `,
      tags: ["freight", "logistics", "automation", "avaglobal", "real-time-tracking"],
      templateId: "freight-automation-enterprise",
      configuration: {
        platform: "web-mobile",
        database: "postgresql",
        deployment: "aws-kubernetes",
        integrations: ["erp", "customs", "gps", "mobile"],
        features: ["real-time-tracking", "route-optimization", "cost-analysis", "mobile-app"]
      }
    });
  };

  const executeWAITask = (taskType: string, description: string) => {
    executeWAIMutation.mutate({
      projectId: selectedProject?.id,
      taskType,
      description,
      agentType: taskType,
      configuration: {
        llmProvider: "claude-4.0-sonnet",
        priority: "high",
        realTimeUpdates: true
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AVAGlobal Freight Automation Platform
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            End-to-end testing of CodeStudio Enterprise with WAI orchestration for real-world freight automation
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button 
            onClick={createAVAGlobalProject}
            disabled={createProjectMutation.isPending}
            className="h-16 flex flex-col gap-2"
          >
            <FileText className="h-5 w-5" />
            Create Project
          </Button>
          <Button 
            variant="outline" 
            onClick={() => executeWAITask('source-code-generation', 'Generate freight tracking system components')}
            disabled={!selectedProject}
            className="h-16 flex flex-col gap-2"
          >
            <Zap className="h-5 w-5" />
            Generate Code
          </Button>
          <Button 
            variant="outline"
            onClick={() => executeWAITask('route-optimization', 'Implement AI-based route optimization algorithms')}
            disabled={!selectedProject}
            className="h-16 flex flex-col gap-2"
          >
            <Map className="h-5 w-5" />
            Route Optimization
          </Button>
          <Button 
            variant="outline"
            onClick={() => executeWAITask('testing-automation', 'Run comprehensive testing suite for freight platform')}
            disabled={!selectedProject}
            className="h-16 flex flex-col gap-2"
          >
            <BarChart3 className="h-5 w-5" />
            Run Tests
          </Button>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="wai-agents">WAI Agents</TabsTrigger>
            <TabsTrigger value="code-editor">Code Editor</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Freight Automation Projects
                </CardTitle>
                <CardDescription>
                  CodeStudio Enterprise projects for freight automation development
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.isArray(projects) && projects.map((project: FreightProject) => (
                      <div 
                        key={project.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedProject?.id === project.id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{project.name}</h3>
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">{project.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            {project.tags?.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-sm text-gray-500">
                            Progress: {project.progress || 0}%
                          </div>
                        </div>
                        {project.progress && (
                          <Progress value={project.progress} className="mt-2" />
                        )}
                      </div>
                    ))}
                    {(!Array.isArray(projects) || projects.length === 0) && (
                      <div className="text-center py-12">
                        <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          No freight projects yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Create your first AVAGlobal freight automation project to get started
                        </p>
                        <Button onClick={createAVAGlobalProject}>
                          Create AVAGlobal Project
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WAI Agents Tab */}
          <TabsContent value="wai-agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active WAI Agents
                </CardTitle>
                <CardDescription>
                  AI agents working on freight automation tasks with 14+ LLM providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAgents.map((agent) => (
                    <div key={agent.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{agent.agentType}</h3>
                        <Badge variant={agent.status === 'running' ? 'default' : 'secondary'}>
                          {agent.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{agent.description}</p>
                      <Progress value={agent.progress} className="mb-2" />
                      <div className="text-sm text-gray-500">
                        Progress: {agent.progress}%
                      </div>
                    </div>
                  ))}
                  {activeAgents.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-300">
                        No active agents. Start a task to deploy WAI agents.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Editor Tab */}
          <TabsContent value="code-editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Source Code Navigation
                </CardTitle>
                <CardDescription>
                  Real-time code editing and GitHub integration for freight platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm">
                  <div className="mb-2">// CodeStudio Enterprise - Source Code Editor</div>
                  <div className="mb-2">// Project: AVAGlobal Freight Automation Platform</div>
                  <div className="mb-4">// Real-time collaborative editing with WAI integration</div>
                  
                  <div className="mb-2">📁 freight-automation-platform/</div>
                  <div className="ml-4">
                    <div>├── 📁 src/</div>
                    <div className="ml-4">
                      <div>├── 📁 components/</div>
                      <div>├── 📁 services/</div>
                      <div>├── 📁 utils/</div>
                      <div>└── 📄 index.ts</div>
                    </div>
                    <div>├── 📁 api/</div>
                    <div>├── 📁 database/</div>
                    <div>├── 📁 tests/</div>
                    <div>└── 📄 README.md</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Open in VS Code
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    GitHub Integration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployment Tab */}
          <TabsContent value="deployment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Continuous Deployment
                </CardTitle>
                <CardDescription>
                  Preview and deploy freight automation platform to production
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Development</h3>
                      <Badge variant="outline" className="mb-2">Running</Badge>
                      <p className="text-sm text-gray-600">localhost:3000</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Staging</h3>
                      <Badge variant="secondary" className="mb-2">Pending</Badge>
                      <p className="text-sm text-gray-600">staging.avaglobal.in</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Production</h3>
                      <Badge variant="secondary" className="mb-2">Ready</Badge>
                      <p className="text-sm text-gray-600">app.avaglobal.in</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button>Deploy to Staging</Button>
                    <Button variant="outline">Run Tests</Button>
                    <Button variant="outline">View Logs</Button>
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