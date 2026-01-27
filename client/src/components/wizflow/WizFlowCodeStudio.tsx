/**
 * WizFlow Code Studio Dashboard Component
 * 
 * Zenflow-style AI Code Orchestration UI for WAI SDK v3.1
 * Enterprise-grade software development from idea to production
 * 
 * Features:
 * - Project Canvas: Visual project management
 * - Specification Editor: Create and verify technical specs
 * - Code Preview: View generated code with syntax highlighting
 * - Agent Status Panel: Monitor AI agents in real-time
 * - Deployment Panel: One-click cloud deployment
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Code2, 
  FileText, 
  Play, 
  Rocket, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Bot,
  GitBranch,
  TestTube,
  Cloud,
  Plus,
  Sparkles,
  Loader2
} from 'lucide-react';

interface WizFlowProject {
  id: string;
  name: string;
  type: string;
  status: string;
  specs: number;
  artifacts: number;
  coverage: number;
  createdAt: string;
  updatedAt: string;
}

interface WizFlowStats {
  totalProjects: number;
  projectsByStatus: Record<string, number>;
  totalSpecifications: number;
  totalCodeArtifacts: number;
  totalTests: number;
  averageCoverage: number;
}

const PROJECT_TYPES = [
  { value: 'web-app', label: 'Web Application' },
  { value: 'full-stack', label: 'Full-Stack App' },
  { value: 'api-service', label: 'API Service' },
  { value: 'mobile-app', label: 'Mobile App' },
  { value: 'microservices', label: 'Microservices' },
  { value: 'cli-tool', label: 'CLI Tool' },
  { value: 'library', label: 'Library/SDK' },
  { value: 'data-pipeline', label: 'Data Pipeline' },
  { value: 'ml-model', label: 'ML Model' },
  { value: 'enterprise-saas', label: 'Enterprise SaaS' }
];

const CLOUD_PROVIDERS = [
  { value: 'vercel', label: 'Vercel', icon: '▲' },
  { value: 'netlify', label: 'Netlify', icon: '◈' },
  { value: 'aws', label: 'AWS', icon: '☁' },
  { value: 'gcp', label: 'Google Cloud', icon: '◉' },
  { value: 'azure', label: 'Azure', icon: '◆' },
  { value: 'railway', label: 'Railway', icon: '🚂' }
];

const AI_MODELS = [
  { id: 'claude-opus-4.5', name: 'Claude 4.5 Opus', provider: 'Anthropic' },
  { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro', provider: 'OpenAI' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', provider: 'Google' },
  { id: 'grok-4', name: 'Grok 4', provider: 'xAI' },
  { id: 'deepseek-r2', name: 'DeepSeek R2', provider: 'DeepSeek' }
];

export function WizFlowCodeStudio() {
  const [activeTab, setActiveTab] = useState('projects');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    type: 'full-stack'
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/wizflow/health']
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/wizflow/projects']
  });

  const createProjectMutation = useMutation({
    mutationFn: async (project: typeof newProject) => {
      return apiRequest('/api/wizflow/projects', 'POST', {
        ...project,
        owner: 'current-user'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizflow/projects'] });
      setShowNewProject(false);
      setNewProject({ name: '', description: '', type: 'full-stack' });
    }
  });

  const stats: WizFlowStats = (healthData as any)?.stats || {
    totalProjects: 0,
    projectsByStatus: {},
    totalSpecifications: 0,
    totalCodeArtifacts: 0,
    totalTests: 0,
    averageCoverage: 0
  };

  const projects: WizFlowProject[] = (projectsData as any)?.projects || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'production': return 'bg-green-500';
      case 'development': return 'bg-blue-500';
      case 'testing': return 'bg-yellow-500';
      case 'review': return 'bg-purple-500';
      case 'deployment': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'production': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'development': return <Code2 className="h-4 w-4 text-blue-500" />;
      case 'testing': return <TestTube className="h-4 w-4 text-yellow-500" />;
      case 'review': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'deployment': return <Rocket className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (healthLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="wizflow-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading WizFlow Code Studio...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="wizflow-container">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="wizflow-title">
            <Sparkles className="h-8 w-8 text-primary" />
            WizFlow Code Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-Powered Software Development from Idea to Production
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Bot className="h-3 w-3 mr-1" />
            {AI_MODELS.length} AI Models
          </Badge>
          <Badge variant="outline" className="text-sm">
            <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
            {(healthData as any)?.status || 'unknown'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card data-testid="stat-projects">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
              <GitBranch className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-specs">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Specifications</p>
                <p className="text-2xl font-bold">{stats.totalSpecifications}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-artifacts">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Code Files</p>
                <p className="text-2xl font-bold">{stats.totalCodeArtifacts}</p>
              </div>
              <Code2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-tests">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tests</p>
                <p className="text-2xl font-bold">{stats.totalTests}</p>
              </div>
              <TestTube className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-coverage">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Coverage</p>
                <p className="text-2xl font-bold">{stats.averageCoverage.toFixed(1)}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects" data-testid="tab-projects">
            <GitBranch className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="workflow" data-testid="tab-workflow">
            <Play className="h-4 w-4 mr-2" />
            SDD Workflow
          </TabsTrigger>
          <TabsTrigger value="agents" data-testid="tab-agents">
            <Bot className="h-4 w-4 mr-2" />
            AI Models
          </TabsTrigger>
          <TabsTrigger value="deploy" data-testid="tab-deploy">
            <Cloud className="h-4 w-4 mr-2" />
            Deploy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            <Button onClick={() => setShowNewProject(true)} data-testid="btn-new-project">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          {showNewProject && (
            <Card className="border-primary" data-testid="new-project-form">
              <CardHeader>
                <CardTitle>Create New Project</CardTitle>
                <CardDescription>
                  Start a new Spec-Driven Development project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    placeholder="My Awesome App"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    data-testid="input-project-name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe what you want to build..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                    data-testid="input-project-description"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Type</label>
                  <Select
                    value={newProject.type}
                    onValueChange={(value) => setNewProject({ ...newProject, type: value })}
                  >
                    <SelectTrigger data-testid="select-project-type">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewProject(false)}
                    data-testid="btn-cancel-project"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createProjectMutation.mutate(newProject)}
                    disabled={!newProject.name || !newProject.description || createProjectMutation.isPending}
                    data-testid="btn-create-project"
                  >
                    {createProjectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {projectsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed" data-testid="empty-projects">
              <CardContent className="flex flex-col items-center justify-center h-48">
                <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No projects yet. Create your first project to start building with AI.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:border-primary transition-colors" data-testid={`project-card-${project.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {getStatusIcon(project.status)}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {project.type}
                      </Badge>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                      {project.status}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Specifications</span>
                        <span className="font-medium">{project.specs}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Code Files</span>
                        <span className="font-medium">{project.artifacts}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Test Coverage</span>
                          <span className="font-medium">{project.coverage.toFixed(1)}%</span>
                        </div>
                        <Progress value={project.coverage} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card data-testid="sdd-workflow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Spec-Driven Development Workflow
              </CardTitle>
              <CardDescription>
                Transform ideas into production-ready code with AI verification at every step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <h3 className="font-semibold">1. Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Create technical specifications with AI assistance
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Code2 className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <h3 className="font-semibold">2. Implement</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate code with multi-model verification
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <TestTube className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <h3 className="font-semibold">3. Test</h3>
                  <p className="text-sm text-muted-foreground">
                    Automated testing with coverage analysis
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Rocket className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <h3 className="font-semibold">4. Review & Deploy</h3>
                  <p className="text-sm text-muted-foreground">
                    Cross-model review and one-click deployment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Multi-Agent Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Claude, GPT-5.2, Gemini 3, and Grok 4 cross-verify all code
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Parallel Execution</h4>
                    <p className="text-sm text-muted-foreground">
                      Work on multiple features simultaneously with isolated environments
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Automated Testing</h4>
                    <p className="text-sm text-muted-foreground">
                      AI-generated tests with Vitest, Playwright integration
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">One-Click Deploy</h4>
                    <p className="text-sm text-muted-foreground">
                      Deploy to Vercel, Netlify, AWS, GCP, or Azure instantly
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card data-testid="ai-models-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Models for Code Generation
              </CardTitle>
              <CardDescription>
                Multiple AI models work together to verify and improve code quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AI_MODELS.map((model) => (
                  <Card key={model.id} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{model.name}</p>
                          <p className="text-sm text-muted-foreground">{model.provider}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-4">
          <Card data-testid="deploy-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Cloud Deployment
              </CardTitle>
              <CardDescription>
                One-click deployment to major cloud providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {CLOUD_PROVIDERS.map((provider) => (
                  <Card 
                    key={provider.value} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    data-testid={`deploy-provider-${provider.value}`}
                  >
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl mb-2">{provider.icon}</div>
                      <p className="font-medium">{provider.label}</p>
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

export default WizFlowCodeStudio;
