/**
 * Business Studio Platform - Enterprise Solutions Interface
 * 
 * Comprehensive business intelligence and enterprise AI assistant deployment
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
  Building2, 
  TrendingUp, 
  Users, 
  Target,
  Shield,
  Globe,
  BarChart3,
  Settings,
  Download,
  Share2,
  Brain,
  Zap
} from 'lucide-react';

interface BusinessProject {
  id: string;
  name: string;
  description: string;
  sector: string[];
  type: 'analytics' | 'automation' | 'assistant' | 'integration';
  status: 'planning' | 'implementation' | 'testing' | 'production';
  progress: number;
  metrics: {
    efficiency: number;
    cost_savings: number;
    user_adoption: number;
  };
  deployment: {
    environments: string[];
    users: number;
    departments: number;
  };
  compliance: string[];
  lastModified: string;
}

const BusinessStudioPlatform: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState('all');
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/business-studio/projects'],
    refetchInterval: 10000,
  });

  const { data: platformMetrics } = useQuery({
    queryKey: ['/api/business-studio/metrics'],
    refetchInterval: 30000,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await fetch('/api/business-studio/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-studio/projects'] });
    },
  });

  const handleCreateProject = () => {
    const projectData = {
      name: 'New Enterprise Solution',
      description: 'AI-powered business automation and intelligence platform',
      sector: ['operations', 'analytics'],
      type: 'assistant',
      businessType: 'enterprise'
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
    implementation: 'bg-blue-500',
    testing: 'bg-purple-500',
    production: 'bg-green-500'
  };

  const typeIcons = {
    analytics: BarChart3,
    automation: Zap,
    assistant: Brain,
    integration: Globe
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Studio</h1>
          <p className="text-gray-600">Enterprise AI solutions and business intelligence platform</p>
        </div>
        <div className="flex space-x-4">
          <Button onClick={handleCreateProject} className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>New Solution</span>
          </Button>
          <Button variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            Compliance
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Solutions</p>
                <p className="text-2xl font-bold">{Array.isArray(projects) ? projects.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                <p className="text-2xl font-bold">{platformMetrics?.totalSavings || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Enterprise Users</p>
                <p className="text-2xl font-bold">{platformMetrics?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                <p className="text-2xl font-bold">{platformMetrics?.avgEfficiency || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Type Filter */}
      <Tabs value={businessType} onValueChange={setBusinessType} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Solutions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="assistant">AI Assistants</TabsTrigger>
          <TabsTrigger value="integration">Integrations</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Project Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.isArray(projects) ? projects.filter((project: BusinessProject) => 
          businessType === 'all' || project.type === businessType
        ).map((project: BusinessProject) => {
          const TypeIcon = typeIcons[project.type];
          return (
            <Card key={project.id} className="group hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${statusColors[project.status]} text-white`}>
                      <TypeIcon className="w-4 h-4" />
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
                {/* Sector & Compliance */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {project.sector?.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {project.compliance?.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs">
                        <Shield className="w-2 h-2 mr-1" />
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Implementation</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2" />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Efficiency</p>
                    <p className="font-semibold">{project.metrics?.efficiency || 0}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Savings</p>
                    <p className="font-semibold">{project.metrics?.cost_savings || 0}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Adoption</p>
                    <p className="font-semibold">{project.metrics?.user_adoption || 0}%</p>
                  </div>
                </div>

                {/* Deployment */}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>👥 {project.deployment?.users || 0} users</span>
                  <span>🏢 {project.deployment?.departments || 0} depts</span>
                  <span>🌐 {project.deployment?.environments?.length || 0} envs</span>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <Button asChild className="w-full" size="sm">
                    <Link to={`/business-studio/project/${project.id}`}>
                      Manage Solution
                    </Link>
                  </Button>
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }) : []}
      </div>

      {/* Business Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Enterprise AI Solutions</span>
          </CardTitle>
          <CardDescription>
            Professional business intelligence and automation tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <p className="font-medium">Business Intelligence</p>
                <p className="text-sm text-gray-600">Advanced analytics & insights</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <Zap className="w-8 h-8 text-orange-600" />
              <div className="text-center">
                <p className="font-medium">Process Automation</p>
                <p className="text-sm text-gray-600">Workflow optimization</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <Brain className="w-8 h-8 text-purple-600" />
              <div className="text-center">
                <p className="font-medium">AI Assistants</p>
                <p className="text-sm text-gray-600">Enterprise chatbots</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <Shield className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <p className="font-medium">Compliance</p>
                <p className="text-sm text-gray-600">Security & governance</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessStudioPlatform;