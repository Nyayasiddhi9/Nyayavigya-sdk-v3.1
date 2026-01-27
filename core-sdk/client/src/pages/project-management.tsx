import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  GitBranch, 
  Users, 
  BarChart3, 
  Clock, 
  Target, 
  Zap,
  Brain,
  Settings,
  Home,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Link } from 'wouter';
import { ProjectManagement } from '@/components/ProjectManagement';

interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  boardId?: string;
  memoryContextCreated?: boolean;
}

export default function ProjectManagementPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    select: (data: any) => data?.data || data?.projects || []
  });

  const selectedProject = projects?.find((p: Project) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      {/* Navigation Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4" />
                <ChevronRight className="h-4 w-4" />
                <GitBranch className="h-4 w-4" />
                <span className="font-medium text-foreground">Project Management</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Project Management
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Intelligent project orchestration with autonomous AI agents, real-time collaboration, 
                and comprehensive memory management for seamless development workflows.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Badge variant="secondary" className="gap-2">
                <Brain className="h-4 w-4" />
                39 AI Agents Ready
              </Badge>
              <Badge variant="secondary" className="gap-2">
                <Zap className="h-4 w-4" />
                Real-time Orchestration
              </Badge>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        {!selectedProjectId && (
          <div className="space-y-6">
            <Card className="border-dashed border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Select Project
                </CardTitle>
                <CardDescription>
                  Choose a project to view its management board, agent activities, and memory context
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : projects && projects.length > 0 ? (
                  <div className="space-y-4">
                    <Select onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a project to manage" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project: Project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{project.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={project.status === 'active' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {project.status}
                                </Badge>
                                {project.boardId && (
                                  <Badge variant="outline" className="text-xs">
                                    Board Ready
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.map((project: Project) => (
                        <Card 
                          key={project.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedProjectId(project.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg">{project.name}</CardTitle>
                              <Badge 
                                variant={project.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {project.status}
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-2">
                              {project.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {project.boardId ? 'Management Ready' : 'Setup Required'}
                                </span>
                              </div>
                              {project.memoryContextCreated && (
                                <div className="flex items-center gap-1">
                                  <Brain className="h-4 w-4 text-purple-600" />
                                  <span className="text-xs text-purple-600">Memory Active</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first project to start using AI-powered project management.
                    </p>
                    <Link to="/">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Agent Orchestration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Intelligent task assignment and coordination across 39 specialized AI agents 
                    for optimal project execution and resource utilization.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Memory Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Project-specific memory contexts that track agent activities, learnings, 
                    and solutions for enhanced decision-making and continuous improvement.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Real-time Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive insights into project progress, agent performance, 
                    and resource utilization with live updates and predictive analytics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Project Management Interface */}
        {selectedProjectId && selectedProject && (
          <div className="space-y-6">
            {/* Project Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                  <Badge 
                    variant={selectedProject.status === 'active' ? 'default' : 'secondary'}
                  >
                    {selectedProject.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{selectedProject.description}</p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setSelectedProjectId(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </div>

            {/* Project Management Component */}
            <ProjectManagement 
              projectId={selectedProjectId}
              onTaskUpdate={(task) => {
                console.log('Task updated:', task);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}