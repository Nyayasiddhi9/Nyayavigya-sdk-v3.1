import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DeploymentPipeline } from '@/components/deployment-pipeline';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Deployment() {
  const { projectId } = useParams();
  const [selectedPlatform, setSelectedPlatform] = useState('aws');
  const [selectedEnvironment, setSelectedEnvironment] = useState('production');
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId
  });

  const { data: deployments, isLoading } = useQuery({
    queryKey: ['/api/projects', projectId, 'deployments'],
    enabled: !!projectId,
    refetchInterval: 5000 // Refresh every 5 seconds for real-time updates
  });

  const deployMutation = useMutation({
    mutationFn: async ({ platform, environment }: { platform: string; environment: string }) => {
      const response = await apiRequest('POST', `/api/projects/${projectId}/deploy`, {
        platform,
        environment
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Deployment Started',
        description: 'Your deployment has been initiated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'deployments'] });
    },
    onError: () => {
      toast({
        title: 'Deployment Failed',
        description: 'There was an error starting your deployment.',
        variant: 'destructive',
      });
    }
  });

  const handleDeploy = () => {
    deployMutation.mutate({
      platform: selectedPlatform,
      environment: selectedEnvironment
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-500/20';
      case 'in_progress': return 'text-blue-400 bg-blue-500/20 animate-pulse';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'aws': return 'fab fa-aws text-orange-400';
      case 'gcp': return 'fab fa-google text-blue-400';
      case 'azure': return 'fab fa-microsoft text-cyan-400';
      default: return 'fas fa-server text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading deployment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to={`/workspace/${projectId}`}>
                <Button variant="ghost" size="sm">
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Workspace
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Deployment</h1>
                <p className="text-slate-400">{project?.name || 'Project'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="capitalize">
                {project?.status || 'Unknown'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Deployment Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Choose Your Cloud Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'aws', name: 'Amazon Web Services', icon: 'fab fa-aws', color: 'orange', cost: '$45/month' },
                  { id: 'gcp', name: 'Google Cloud Platform', icon: 'fab fa-google', color: 'blue', cost: '$42/month' },
                  { id: 'azure', name: 'Microsoft Azure', icon: 'fab fa-microsoft', color: 'cyan', cost: '$48/month' }
                ].map((platform) => (
                  <div
                    key={platform.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedPlatform === platform.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    onClick={() => setSelectedPlatform(platform.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <i className={`${platform.icon} text-${platform.color}-400 text-xl`}></i>
                        <div>
                          <div className="text-white font-medium">{platform.name}</div>
                          <div className="text-slate-400 text-sm">Estimated {platform.cost}</div>
                        </div>
                      </div>
                      {selectedPlatform === platform.id && (
                        <i className="fas fa-check text-primary-400"></i>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Environment
                </label>
                <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleDeploy}
                disabled={deployMutation.isPending}
                className="w-full wai-gradient py-3"
              >
                <i className="fas fa-rocket mr-2"></i>
                {deployMutation.isPending ? 'Deploying...' : 'Deploy Now'}
              </Button>
            </CardContent>
          </Card>

          {/* Deployment Features */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Deployment Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: 'fas fa-code-branch', title: 'CI/CD Pipeline', desc: 'Automated deployment' },
                  { icon: 'fas fa-shield-alt', title: 'Security Scan', desc: 'Vulnerability assessment' },
                  { icon: 'fas fa-chart-line', title: 'Monitoring', desc: 'Real-time metrics' },
                  { icon: 'fas fa-backup', title: 'Auto Backup', desc: 'Automated backups' },
                  { icon: 'fas fa-expand-arrows-alt', title: 'Auto Scaling', desc: 'Dynamic scaling' },
                  { icon: 'fas fa-tachometer-alt', title: 'Performance', desc: 'Optimization tools' }
                ].map((feature, index) => (
                  <div key={index} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className={`${feature.icon} text-primary-400 text-sm`}></i>
                      <span className="text-white text-sm font-medium">{feature.title}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-primary-500/10 to-purple-500/10 border border-primary-500/20 rounded-xl">
                <h4 className="text-white font-medium mb-2">Production Ready</h4>
                <p className="text-slate-300 text-sm">
                  Your application will be deployed with enterprise-grade security, monitoring, and scaling capabilities.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deployment History */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Deployment History</CardTitle>
          </CardHeader>
          <CardContent>
            {deployments && deployments.length > 0 ? (
              <div className="space-y-4">
                {deployments.map((deployment: any) => (
                  <div key={deployment.id} className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <i className={getPlatformIcon(deployment.platform)}></i>
                        <div>
                          <div className="text-white font-medium capitalize">
                            {deployment.platform} Deployment
                          </div>
                          <div className="text-slate-400 text-sm">
                            {new Date(deployment.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(deployment.status)}>
                        {deployment.status}
                      </Badge>
                    </div>

                    {deployment.status === 'in_progress' && (
                      <DeploymentPipeline deploymentId={deployment.id} />
                    )}

                    {deployment.url && (
                      <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-slate-300 text-sm">Deployment URL</div>
                            <a
                              href={deployment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-400 hover:text-primary-300 transition-colors"
                            >
                              {deployment.url}
                            </a>
                          </div>
                          <Button size="sm" variant="outline">
                            <i className="fas fa-external-link-alt mr-2"></i>
                            Visit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-rocket text-4xl text-slate-500 mb-3"></i>
                <p className="text-slate-400 mb-4">No deployments yet</p>
                <p className="text-slate-500 text-sm">Deploy your project to see deployment history here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Estimation */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Cost Estimation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                <div className="text-2xl font-bold text-green-400 mb-2">$45</div>
                <div className="text-slate-400 text-sm">Monthly Infrastructure</div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                <div className="text-2xl font-bold text-blue-400 mb-2">$12</div>
                <div className="text-slate-400 text-sm">AI Services</div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                <div className="text-2xl font-bold text-purple-400 mb-2">$57</div>
                <div className="text-slate-400 text-sm">Total Monthly</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
