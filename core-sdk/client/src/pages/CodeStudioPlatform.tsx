/**
 * Code Studio Platform - Production Ready Software Development Interface
 * 
 * Global-quality UI/UX with intelligent project workflows and real-time collaboration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Code2, 
  Play, 
  GitBranch, 
  Database,
  Terminal,
  FileText,
  Settings,
  Zap,
  Users,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface CodeProject {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  status: 'planning' | 'development' | 'testing' | 'deployment' | 'live';
  progress: number;
  lastModified: string;
  collaborators: number;
  codeQuality: number;
  testCoverage: number;
}

const CodeStudioPlatform: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/code-studio/projects'],
    refetchInterval: 10000,
  });

  const { data: projectMetrics } = useQuery({
    queryKey: ['/api/code-studio/metrics'],
    refetchInterval: 30000,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await fetch('/api/code-studio/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/code-studio/projects'] });
    },
  });

  const handleCreateProject = () => {
    const projectData = {
      name: 'New AI Project',
      description: 'AI-powered application with intelligent features',
      techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      projectType: 'web'
    };
    createProjectMutation.mutate(projectData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    planning: 'bg-yellow-500',
    development: 'bg-blue-500',
    testing: 'bg-purple-500',
    deployment: 'bg-orange-500',
    live: 'bg-green-500'
  };

  const statusIcons = {
    planning: Clock,
    development: Code2,
    testing: CheckCircle,
    deployment: Play,
    live: Activity
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Code Studio</h1>
          <p className="text-gray-600">AI-powered software development platform</p>
        </div>
        <div className="flex space-x-4">
          <Button onClick={handleCreateProject} className="flex items-center space-x-2">
            <Code2 className="w-4 h-4" />
            <span>New Project</span>
          </Button>
          <Button variant="outline">
            <GitBranch className="w-4 h-4 mr-2" />
            Templates
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold">{projects?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Collaborators</p>
                <p className="text-2xl font-bold">{projectMetrics?.totalCollaborators || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Code Quality</p>
                <p className="text-2xl font-bold">{projectMetrics?.avgCodeQuality || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Deployment Success</p>
                <p className="text-2xl font-bold">{projectMetrics?.deploymentSuccess || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects?.map((project: CodeProject) => {
          const StatusIcon = statusIcons[project.status];
          return (
            <Card key={project.id} className="group hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${statusColors[project.status]} text-white`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {project.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Tech Stack */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Tech Stack</p>
                  <div className="flex flex-wrap gap-1">
                    {project.techStack?.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Quality</p>
                    <p className="font-semibold">{project.codeQuality}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Tests</p>
                    <p className="font-semibold">{project.testCoverage}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Team</p>
                    <p className="font-semibold">{project.collaborators}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <Button asChild className="w-full" size="sm">
                    <Link to={`/code-studio/project/${project.id}`}>
                      Open Project
                    </Link>
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm">
                      <Terminal className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Database className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Development Tools</span>
          </CardTitle>
          <CardDescription>
            Access powerful development features and AI-assisted coding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <Code2 className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <p className="font-medium">AI Code Generator</p>
                <p className="text-sm text-gray-600">Generate components with AI</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <Database className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <p className="font-medium">Database Designer</p>
                <p className="text-sm text-gray-600">Visual schema builder</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <GitBranch className="w-8 h-8 text-purple-600" />
              <div className="text-center">
                <p className="font-medium">Git Integration</p>
                <p className="text-sm text-gray-600">Version control workflows</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <Play className="w-8 h-8 text-orange-600" />
              <div className="text-center">
                <p className="font-medium">Deploy</p>
                <p className="text-sm text-gray-600">One-click deployment</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeStudioPlatform;