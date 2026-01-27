import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CodeEditor } from '@/components/code-editor';
import { LivePreview } from '@/components/live-preview';
import { AgentStatus } from '@/components/agent-status';
import { useWebSocket, useWebSocketListener } from '@/hooks/use-websocket';
import { useAgents } from '@/hooks/use-agents';

export default function Workspace() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const { isConnected, subscribe } = useWebSocket();

  const { data: project, isLoading } = useQuery({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId
  });

  const { agents, communications, assignTask } = useAgents(parseInt(projectId || '0'));

  useEffect(() => {
    if (projectId && isConnected) {
      subscribe(parseInt(projectId));
    }
  }, [projectId, isConnected, subscribe]);

  // Listen for real-time updates
  useWebSocketListener('agent.task.completed', (data) => {
    console.log('Task completed:', data);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
          <p className="text-slate-400">Project not found</p>
          <Link to="/">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getProjectProgress = () => {
    const totalPhases = project.config?.phases?.length || 5;
    const currentPhase = project.status === 'planning' ? 1 :
                       project.status === 'development' ? 3 :
                       project.status === 'testing' ? 4 :
                       project.status === 'deployed' ? 5 : 1;
    return (currentPhase / totalPhases) * 100;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <i className="fas fa-arrow-left mr-2"></i>
                  Dashboard
                </Button>
              </Link>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{project.name}</h1>
                <p className="text-sm text-slate-400 capitalize">{project.status} Mode</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm text-slate-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <Button size="sm" className="wai-gradient">
                <i className="fas fa-play mr-2"></i>
                Deploy
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Project Progress */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Development Progress</h3>
                <p className="text-slate-400 text-sm">Overall project completion</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{getProjectProgress().toFixed(0)}%</div>
                <Badge variant="outline" className="capitalize">
                  {project.status}
                </Badge>
              </div>
            </div>
            <Progress value={getProjectProgress()} className="h-2 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              {['Planning', 'Design', 'Development', 'Testing', 'Deployment'].map((phase, index) => (
                <div key={index} className={`p-2 rounded-lg ${
                  index < (getProjectProgress() / 20) ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-700/50 text-slate-400'
                }`}>
                  <div className="text-sm font-medium">{phase}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Workspace */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="code">Code Editor</TabsTrigger>
            <TabsTrigger value="preview">Live Preview</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Info */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Project Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">Description</label>
                    <p className="text-white">{project.description || 'No description provided'}</p>
                  </div>
                  {project.config?.analysis && (
                    <>
                      <div>
                        <label className="text-sm text-slate-400">Complexity</label>
                        <Badge className="ml-2 capitalize">{project.config.analysis.complexity}</Badge>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Estimated Timeline</label>
                        <p className="text-white">{project.config.analysis.estimatedTimeline}</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Technologies</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.config.analysis.technologies.map((tech: string, index: number) => (
                            <Badge key={index} variant="outline">{tech}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.config?.analysis?.requirements ? (
                    <div className="space-y-2">
                      {project.config.analysis.requirements.map((req: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-slate-300 text-sm">{req}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">No requirements extracted yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Active Agents */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {agents.slice(0, 6).map((agent) => (
                    <AgentStatus key={agent.id} agent={agent} showDetails />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
              <CodeEditor projectId={parseInt(projectId || '0')} />
              <LivePreview projectId={parseInt(projectId || '0')} />
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="h-[calc(100vh-250px)]">
              <LivePreview projectId={parseInt(projectId || '0')} fullscreen />
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agent Status */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Agent Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {agents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <AgentStatus agent={agent} showDetails />
                        <Button
                          size="sm"
                          onClick={() => assignTask(agent.id, {
                            type: 'general_task',
                            description: 'Continue working on current objectives',
                            input: {}
                          })}
                          disabled={agent.status === 'busy'}
                        >
                          <i className="fas fa-play mr-2"></i>
                          Assign Task
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Agent Communications */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Agent Communications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {communications.map((comm) => (
                      <div key={comm.id} className="p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-white">
                            {agents.find(a => a.id === comm.fromAgentId)?.name || 'System'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(comm.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{comm.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deploy">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Deployment Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'AWS', icon: 'fab fa-aws', color: 'orange' },
                    { name: 'Google Cloud', icon: 'fab fa-google', color: 'blue' },
                    { name: 'Azure', icon: 'fab fa-microsoft', color: 'cyan' }
                  ].map((platform) => (
                    <div key={platform.name} className="p-4 bg-slate-700/50 rounded-xl border border-slate-600 hover:border-primary-500 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3 mb-3">
                        <i className={`${platform.icon} text-${platform.color}-400 text-xl`}></i>
                        <span className="font-medium text-white">{platform.name}</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">Deploy to {platform.name} with automated setup</p>
                      <Button className="w-full" variant="outline">
                        Deploy to {platform.name}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
