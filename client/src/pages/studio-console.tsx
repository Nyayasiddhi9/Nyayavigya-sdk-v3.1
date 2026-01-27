import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import apiRequest, { queryClient } from '@/lib/queryClient';
import { 
  Code2, 
  Palette, 
  Workflow,
  File,
  Play,
  Square,
  Settings,
  Users,
  FolderOpen,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Share,
  Eye,
  Edit,
  Trash2,
  Copy,
  Layers,
  GitBranch,
  Cpu,
  Zap,
  Sparkles,
  Wand2,
  Boxes,
  PaintBucket,
  Monitor
} from 'lucide-react';

// Studio Console - Creative/Builder UX Interface
export default function StudioConsole() {
  const { toast } = useToast();
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Studio Projects Query
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/v9/studio/projects'],
    refetchInterval: 10000, // Real-time updates every 10 seconds
  });

  // Studio Templates Query  
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/v9/studio/templates'],
    refetchInterval: 30000, // Update templates every 30 seconds
  });

  // Studio Workflows Query
  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['/api/v9/studio/workflows'],
    refetchInterval: 5000, // Real-time workflow status
  });

  // Studio Metrics Query
  const { data: studioMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/v9/studio/metrics'],
    refetchInterval: 5000, // Real-time metrics
  });

  // Create Project Mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { name: string; type: string; template?: string }) => {
      return apiRequest('/api/v9/studio/projects', 'POST', projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/studio/projects'] });
      toast({
        title: 'Project Created',
        description: 'New project created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create project.',
        variant: 'destructive',
      });
    },
  });

  // Deploy Project Mutation
  const deployProjectMutation = useMutation({
    mutationFn: async ({ projectId, environment }: { projectId: string; environment: string }) => {
      return apiRequest(`/api/v9/studio/projects/${projectId}/deploy`, 'POST', { environment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/studio/projects'] });
      toast({
        title: 'Deployment Started',
        description: 'Project deployment initiated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Deployment Failed',
        description: 'Failed to start project deployment.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <div className="container mx-auto p-6">
        {/* Studio Console Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Studio Console
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Creative workflow management and builder UX for WAI platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                <Sparkles className="w-4 h-4 mr-2" />
                Creator Mode
              </Badge>
              <Button data-testid="button-new-project">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* Studio Console Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5" data-testid="tabs-studio">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <Monitor className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="project-builder" data-testid="tab-project-builder">
              <Code2 className="w-4 h-4 mr-2" />
              Project Builder
            </TabsTrigger>
            <TabsTrigger value="pipeline-editor" data-testid="tab-pipeline-editor">
              <Workflow className="w-4 h-4 mr-2" />
              Pipeline Editor
            </TabsTrigger>
            <TabsTrigger value="template-library" data-testid="tab-template-library">
              <File className="w-4 h-4 mr-2" />
              Template Library
            </TabsTrigger>
            <TabsTrigger value="deployment" data-testid="tab-deployment">
              <Zap className="w-4 h-4 mr-2" />
              Deployment
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card data-testid="card-active-projects">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-project-count">
                    {Array.isArray(projects) ? projects.length : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Array.isArray(projects) ? projects.filter((p: any) => p.status === 'active').length : 0} running
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-templates-available">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Templates</CardTitle>
                  <File className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-template-count">
                    {Array.isArray(templates) ? templates.length : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ready-to-use templates
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-active-workflows">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-workflow-count">
                    {Array.isArray(workflows) ? workflows.filter((w: any) => w.status === 'running').length : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pipelines executing
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-studio-health">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Studio Health</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-health-score">
                    {(studioMetrics as any)?.healthScore || 85}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    System performance
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Projects */}
            <Card data-testid="card-recent-projects">
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Your latest creative projects and workflows</CardDescription>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(projects) ? projects.slice(0, 5).map((project: any) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-4">
                          <Avatar data-testid={`avatar-project-${project.id}`}>
                            <AvatarFallback>{project.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-gray-500">{project.type} • {project.lastModified}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-project-${project.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        No projects yet. Create your first project to get started.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Builder Tab */}
          <TabsContent value="project-builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Types */}
              <Card data-testid="card-project-types">
                <CardHeader>
                  <CardTitle>Project Types</CardTitle>
                  <CardDescription>Choose from various project templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-web-app-project">
                    <Code2 className="w-4 h-4 mr-2" />
                    Web Application
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-mobile-app-project">
                    <Monitor className="w-4 h-4 mr-2" />
                    Mobile App
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-api-project">
                    <Boxes className="w-4 h-4 mr-2" />
                    API Service
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-ai-project">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Project
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card data-testid="card-quick-actions">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common development tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" data-testid="button-new-project">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-import-project">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Project
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-clone-template">
                    <Copy className="w-4 h-4 mr-2" />
                    Clone Template
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-browse-gallery">
                    <Eye className="w-4 h-4 mr-2" />
                    Browse Gallery
                  </Button>
                </CardContent>
              </Card>

              {/* Project Statistics */}
              <Card data-testid="card-project-stats">
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                  <CardDescription>Your development metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Projects</span>
                    <span className="font-medium" data-testid="text-total-projects">
                      {Array.isArray(projects) ? projects.length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Completed</span>
                    <span className="font-medium" data-testid="text-completed-projects">
                      {Array.isArray(projects) ? projects.filter((p: any) => p.status === 'completed').length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">In Progress</span>
                    <span className="font-medium" data-testid="text-inprogress-projects">
                      {Array.isArray(projects) ? projects.filter((p: any) => p.status === 'active').length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Success Rate</span>
                    <span className="font-medium text-green-600" data-testid="text-success-rate">95%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pipeline Editor Tab */}
          <TabsContent value="pipeline-editor" className="space-y-6">
            <Card data-testid="card-pipeline-editor">
              <CardHeader>
                <CardTitle>Pipeline Editor</CardTitle>
                <CardDescription>Design and manage your AI workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Pipeline Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button data-testid="button-new-pipeline">
                        <Plus className="w-4 h-4 mr-2" />
                        New Pipeline
                      </Button>
                      <Button variant="outline" data-testid="button-import-pipeline">
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                      <Button variant="outline" data-testid="button-export-pipeline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" data-testid="button-save-pipeline">
                        Save
                      </Button>
                      <Button size="sm" data-testid="button-run-pipeline">
                        <Play className="w-4 h-4 mr-2" />
                        Run
                      </Button>
                    </div>
                  </div>

                  {/* Active Workflows */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(workflows) ? workflows.map((workflow: any) => (
                      <Card key={workflow.id} data-testid={`card-workflow-${workflow.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{workflow.name}</CardTitle>
                            <Badge variant={workflow.status === 'running' ? 'default' : 'secondary'}>
                              {workflow.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Progress</span>
                              <span>{workflow.progress || 0}%</span>
                            </div>
                            <Progress value={workflow.progress || 0} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    )) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Template Library Tab */}
          <TabsContent value="template-library" className="space-y-6">
            <Card data-testid="card-template-library">
              <CardHeader>
                <CardTitle>Template Library</CardTitle>
                <CardDescription>Pre-built templates to accelerate your development</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Template Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                      data-testid="input-search-templates"
                    />
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-48" data-testid="select-template-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Templates</SelectItem>
                        <SelectItem value="web">Web Apps</SelectItem>
                        <SelectItem value="mobile">Mobile Apps</SelectItem>
                        <SelectItem value="api">APIs</SelectItem>
                        <SelectItem value="ai">AI Projects</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Template Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templatesLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <CardHeader>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </CardHeader>
                          <CardContent>
                            <div className="h-32 bg-gray-200 rounded"></div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      Array.isArray(templates) ? templates.map((template: any) => (
                        <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-template-${template.id}`}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <Badge variant="outline">{template.category}</Badge>
                            </div>
                            <CardDescription>{template.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="h-32 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg flex items-center justify-center">
                                <PaintBucket className="w-8 h-8 text-purple-600" />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Users className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">{template.usage || 0} uses</span>
                                </div>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" data-testid={`button-preview-template-${template.id}`}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" data-testid={`button-use-template-${template.id}`}>
                                    Use Template
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          No templates available. Check back later for new templates.
                        </div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployment Tab */}
          <TabsContent value="deployment" className="space-y-6">
            <Card data-testid="card-deployment-center">
              <CardHeader>
                <CardTitle>Deployment Center</CardTitle>
                <CardDescription>Deploy and manage your projects across environments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Quick Deploy */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-dashed">
                      <CardContent className="pt-6 text-center">
                        <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <h3 className="font-medium mb-2">Development</h3>
                        <p className="text-sm text-gray-500 mb-4">Deploy to dev environment</p>
                        <Button variant="outline" size="sm" data-testid="button-deploy-dev">Deploy</Button>
                      </CardContent>
                    </Card>
                    <Card className="border-dashed">
                      <CardContent className="pt-6 text-center">
                        <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <h3 className="font-medium mb-2">Staging</h3>
                        <p className="text-sm text-gray-500 mb-4">Deploy to staging environment</p>
                        <Button variant="outline" size="sm" data-testid="button-deploy-staging">Deploy</Button>
                      </CardContent>
                    </Card>
                    <Card className="border-dashed">
                      <CardContent className="pt-6 text-center">
                        <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <h3 className="font-medium mb-2">Production</h3>
                        <p className="text-sm text-gray-500 mb-4">Deploy to production</p>
                        <Button variant="outline" size="sm" data-testid="button-deploy-prod">Deploy</Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Deployment History */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Recent Deployments</h3>
                    <div className="space-y-3">
                      {[
                        { id: 1, project: 'AI Chat App', environment: 'Production', status: 'Success', time: '2 hours ago' },
                        { id: 2, project: 'Data Pipeline', environment: 'Staging', status: 'Running', time: '4 hours ago' },
                        { id: 3, project: 'Web Dashboard', environment: 'Development', status: 'Success', time: '1 day ago' },
                      ].map((deployment) => (
                        <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`deployment-${deployment.id}`}>
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${deployment.status === 'Success' ? 'bg-green-500' : deployment.status === 'Running' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                            <div>
                              <div className="font-medium">{deployment.project}</div>
                              <div className="text-sm text-gray-500">{deployment.environment} • {deployment.time}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={deployment.status === 'Success' ? 'secondary' : deployment.status === 'Running' ? 'default' : 'destructive'}>
                              {deployment.status}
                            </Badge>
                            <Button variant="ghost" size="sm" data-testid={`button-deployment-details-${deployment.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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