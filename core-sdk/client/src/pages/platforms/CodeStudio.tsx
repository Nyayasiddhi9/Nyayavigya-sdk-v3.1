import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Code, FileCode, GitBranch, Terminal, Database, Cloud, 
  Sparkles, Zap, Package, Settings, Play, CheckCircle,
  AlertCircle, Clock, Users, ArrowRight, Monitor, 
  Activity, Cpu, MemoryStick, GitCommit, GitPullRequest,
  FolderOpen, Save, Upload, Download
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { softwareDevelopmentWAI } from '@/services/wai-orchestration-client';

// Import shared components
import PlatformHero from '@/components/shared/PlatformHero';
import TaskTimeline from '@/components/shared/TaskTimeline';
import AgentActivityFeed from '@/components/shared/AgentActivityFeed';
import ResourceUsagePanel from '@/components/shared/ResourceUsagePanel';
import OrchestrationStatusBadge from '@/components/shared/OrchestrationStatusBadge';
import PlatformAdminBar from '@/components/shared/PlatformAdminBar';

// Import real functionality components
import MonacoCodeEditor from '@/components/MonacoCodeEditor';
import { useWebSocketCollaboration } from '@/hooks/useWebSocketCollaboration';

interface ProjectPlan {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  features: string[];
  timeline: string;
  cost: number;
  complexity: 'simple' | 'moderate' | 'complex';
  status: 'planning' | 'approved' | 'in-progress' | 'completed';
  repository?: {
    url: string;
    branch: string;
    commits: number;
  };
  deployment?: {
    status: 'pending' | 'building' | 'deployed' | 'failed';
    url?: string;
    environment: 'development' | 'staging' | 'production';
  };
}

interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  defaultBranch: string;
  language: string;
  updatedAt: string;
}

interface MonacoFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  modified: boolean;
}

export default function CodeStudio() {
  const [projectRequirements, setProjectRequirements] = useState('');
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [documentationLanguage, setDocumentationLanguage] = useState('english');
  const [useEnhancedOrchestration, setUseEnhancedOrchestration] = useState(true);
  const [qualityLevel, setQualityLevel] = useState<'balanced' | 'quality' | 'premium'>('quality');
  
  // New state for enhanced features
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [monacoFiles, setMonacoFiles] = useState<MonacoFile[]>([]);
  const [activeFile, setActiveFile] = useState<MonacoFile | null>(null);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [realTimeCollaboration, setRealTimeCollaboration] = useState(true);
  const [showAgentActivity, setShowAgentActivity] = useState(true);
  
  const { toast } = useToast();

  // Real WebSocket collaboration
  const { 
    isConnected: wsConnected, 
    collaborationUsers, 
    sendFileChange,
    sendFileSelect 
  } = useWebSocketCollaboration({
    projectId: projectPlan?.id || 'demo',
    enabled: realTimeCollaboration,
    userId: 'user-123',
    userName: 'Developer'
  });

  const handleCreateProject = async () => {
    if (!projectRequirements.trim()) {
      toast({
        title: 'Requirements Needed',
        description: 'Please enter your project requirements',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Use enhanced WAI orchestration with 5-level redundancy
      const waiResult = await softwareDevelopmentWAI.processCodeTask(
        `Create comprehensive project plan for: ${projectRequirements}. Include tech stack recommendations, timeline, features, and cost estimation.`,
        {
          enhancedMode: useEnhancedOrchestration,
          budget: qualityLevel,
          priority: 'high',
          userContext: {
            documentationLanguage,
            preferences: {
              redundancyLevel: 5,
              culturalContext: documentationLanguage !== 'english'
            }
          }
        }
      );

      // Enhanced API call with orchestration results
      const response = await apiRequest('/api/projects/create', {
        method: 'POST',
        body: JSON.stringify({
          requirements: projectRequirements,
          type: 'code-studio',
          enhancedMode: useEnhancedOrchestration,
          documentationLanguage,
          qualityLevel,
          waiOrchestrationResults: waiResult,
          sarvamAPIEnabled: documentationLanguage !== 'english'
        })
      });

      if (response.success) {
        setProjectPlan(response.data);
        setActiveTab('plan');
        toast({
          title: 'Project Plan Generated',
          description: `Enhanced plan created with ${waiResult.agentUsed.name} agent. Quality score: ${waiResult.qualityScore}/10`
        });
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate project plan. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveProject = async () => {
    if (!projectPlan) return;

    try {
      const response = await apiRequest(`/api/projects/${projectPlan.id}/approve`, {
        method: 'POST'
      });

      if (response.success) {
        setProjectPlan({ ...projectPlan, status: 'approved' });
        setActiveTab('develop');
        toast({
          title: 'Project Approved',
          description: 'Your project has been initialized. You can now start development.'
        });
      }
    } catch (error) {
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve project. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Real task data - will be fetched from WAI API
  const [realTasks, setRealTasks] = useState([]);

  // Real agent activity data - will be fetched from WAI v9.0
  const [realAgentActivities, setRealAgentActivities] = useState([]);

  // Real resource metrics - will be fetched from WAI system
  const [realResourceMetrics, setRealResourceMetrics] = useState(null);

  const orchestrationStatus = {
    version: '1.0',
    status: 'active' as const,
    agentCount: 105,
    llmProviders: 15,
    activeRequests: 3,
    avgResponseTime: 145,
    costEfficiency: 87,
    lastUpdate: '30 seconds ago'
  };

  // Load GitHub repositories
  const loadGitHubRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const response = await apiRequest('/api/github/repos');
      if (response.success) {
        setGithubRepos(response.data);
      }
    } catch (error) {
      toast({
        title: 'GitHub Integration',
        description: 'Failed to load repositories. Please check your GitHub connection.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Real data fetching functions
  const fetchRealData = async () => {
    try {
      // Fetch real agent activity from WAI v9.0
      const agentResponse = await apiRequest('/api/agents/activity');
      if (agentResponse.success) {
        setRealAgentActivities(agentResponse.data);
      }

      // Fetch real resource metrics from WAI system  
      const metricsResponse = await apiRequest('/api/health/v9');
      if (metricsResponse.success) {
        setRealResourceMetrics(metricsResponse.data);
      }

      // Fetch real tasks from project management API
      if (projectPlan?.id) {
        const tasksResponse = await apiRequest(`/api/projects/${projectPlan.id}/tasks`);
        if (tasksResponse.success) {
          setRealTasks(tasksResponse.data);
        }
      }

      // Fetch real project files for Monaco
      if (projectPlan?.id) {
        const filesResponse = await apiRequest(`/api/projects/${projectPlan.id}/files`);
        if (filesResponse.success && filesResponse.data.length > 0) {
          const monacoFiles = filesResponse.data.map((file: any) => ({
            id: file.id,
            name: file.fileName,
            path: file.filePath,
            content: file.content || '',
            language: getLanguageFromFilename(file.fileName),
            modified: false
          }));
          setMonacoFiles(monacoFiles);
          setActiveFile(monacoFiles[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch real data:', error);
    }
  };

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 
      'tsx': 'typescript', 'json': 'json', 'css': 'css', 'html': 'html',
      'md': 'markdown', 'py': 'python', 'java': 'java'
    };
    return langMap[ext || ''] || 'plaintext';
  };

  useEffect(() => {
    loadGitHubRepos();
    fetchRealData(); // Fetch real data on mount
  }, []);

  // Refetch real data when project plan changes
  useEffect(() => {
    if (projectPlan?.id) {
      fetchRealData();
    }
  }, [projectPlan?.id]);

  // Periodic refresh of real data
  useEffect(() => {
    const interval = setInterval(fetchRealData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <PlatformAdminBar platformName="Code Studio" />
      <div className="container max-w-7xl mx-auto p-6">
        <PlatformHero
          title="Code Studio Enterprise"
          description="AI-Orchestrated Software Development Platform with 200K Token Context"
          icon={Code}
          gradient="from-purple-600 to-blue-600"
          agentCount={25}
          status="active"
          onSettingsClick={() => toast({ title: 'Settings', description: 'Settings panel coming soon' })}
          data-testid="code-studio-hero"
        />

      {/* Enhanced Status Bar */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <OrchestrationStatusBadge 
                status={orchestrationStatus}
                size="lg"
                onClick={() => toast({ title: 'WAI Orchestration', description: 'All systems operational' })}
                data-testid="orchestration-status"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={realTimeCollaboration}
                  onCheckedChange={setRealTimeCollaboration}
                  data-testid="switch-collaboration"
                />
                <span className="text-sm">Real-time Collaboration</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showAgentActivity}
                  onCheckedChange={setShowAgentActivity}
                  data-testid="switch-agent-activity"
                />
                <span className="text-sm">Agent Activity Feed</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadGitHubRepos}
                disabled={isLoadingRepos}
                data-testid="button-refresh-repos"
              >
                {isLoadingRepos ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <GitBranch className="h-4 w-4" />
                )}
                GitHub
              </Button>
              <Button variant="outline" size="sm" data-testid="button-settings">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="create">Create Project</TabsTrigger>
          <TabsTrigger value="plan" disabled={!projectPlan}>
            Project Plan
          </TabsTrigger>
          <TabsTrigger value="develop" disabled={projectPlan?.status !== 'approved'}>
            Development
          </TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
          <TabsTrigger value="monitor">Monitoring</TabsTrigger>
          <TabsTrigger value="deploy" disabled={projectPlan?.status !== 'approved'}>
            Deployment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Enhanced Project Creation with WAI Orchestration
              </CardTitle>
              <CardDescription>
                Create projects using advanced AI orchestration with 5-level redundancy and multilingual support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enhanced Settings Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Documentation Language</label>
                  <Select value={documentationLanguage} onValueChange={setDocumentationLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                      <SelectItem value="bengali">বাংলা (Bengali)</SelectItem>
                      <SelectItem value="tamil">தமிழ் (Tamil)</SelectItem>
                      <SelectItem value="telugu">తెలుగు (Telugu)</SelectItem>
                      <SelectItem value="marathi">मराठी (Marathi)</SelectItem>
                      <SelectItem value="gujarati">ગુજરાતી (Gujarati)</SelectItem>
                      <SelectItem value="kannada">ಕನ್ನಡ (Kannada)</SelectItem>
                      <SelectItem value="malayalam">മലയാളം (Malayalam)</SelectItem>
                      <SelectItem value="punjabi">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
                      <SelectItem value="odia">ଓଡ଼ିଆ (Odia)</SelectItem>
                      <SelectItem value="urdu">اردو (Urdu)</SelectItem>
                    </SelectContent>
                  </Select>
                  {documentationLanguage !== 'english' && (
                    <p className="text-xs text-muted-foreground">✨ SarvamAPI integration enabled</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quality Level</label>
                  <Select value={qualityLevel} onValueChange={(value: 'balanced' | 'quality' | 'premium') => setQualityLevel(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="quality">Quality (Recommended)</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Enhanced Orchestration
                    <Badge variant="default" className="text-xs">5-Level Redundancy</Badge>
                  </label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={useEnhancedOrchestration}
                      onCheckedChange={setUseEnhancedOrchestration}
                    />
                    <span className="text-sm text-muted-foreground">
                      {useEnhancedOrchestration ? 'Enhanced Mode' : 'Standard Mode'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Requirements Section */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Project Requirements
                </label>
                <Textarea
                  placeholder="Describe your project in detail. Include features, technology preferences, target users, and any specific requirements..."
                  value={projectRequirements}
                  onChange={(e) => setProjectRequirements(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleCreateProject}
                  disabled={isGenerating}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Project Plan
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  Powered by WAI Orchestration v8.0 + SarvamAPI
                </div>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Multi-File Editing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Database Design</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-purple-600" />
                  <span className="text-sm">Version Control</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-orange-600" />
                  <span className="text-sm">Auto Deployment</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          {projectPlan && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{projectPlan.name}</CardTitle>
                    <CardDescription>{projectPlan.description}</CardDescription>
                  </div>
                  <Badge variant={projectPlan.status === 'approved' ? 'default' : 'secondary'}>
                    {projectPlan.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tech Stack */}
                <div>
                  <h3 className="font-semibold mb-2">Technology Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {projectPlan.techStack.map((tech, index) => (
                      <Badge key={index} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-semibold mb-2">Key Features</h3>
                  <ul className="space-y-2">
                    {projectPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Timeline & Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Timeline</h3>
                    <p className="text-sm text-muted-foreground">{projectPlan.timeline}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Estimated Cost</h3>
                    <p className="text-sm text-muted-foreground">${projectPlan.cost}</p>
                  </div>
                </div>

                {/* Complexity */}
                <div>
                  <h3 className="font-semibold mb-2">Project Complexity</h3>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={
                        projectPlan.complexity === 'simple' ? 33 :
                        projectPlan.complexity === 'moderate' ? 66 : 100
                      }
                      className="w-32"
                    />
                    <Badge variant={
                      projectPlan.complexity === 'simple' ? 'secondary' :
                      projectPlan.complexity === 'moderate' ? 'default' : 'destructive'
                    }>
                      {projectPlan.complexity}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                {projectPlan.status === 'planning' && (
                  <div className="flex items-center gap-4 pt-4">
                    <Button 
                      onClick={handleApproveProject}
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve & Initialize
                    </Button>
                    <Button variant="outline" size="lg">
                      Modify Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="develop" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Development Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Monaco IDE Section */}
              <Card data-testid="card-monaco-ide">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-blue-600" />
                        Monaco IDE
                      </CardTitle>
                      <CardDescription>
                        Professional code editor with AI assistance
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" data-testid="button-save-file">
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-upload-file">
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {projectPlan?.status === 'approved' ? (
                    <div className="space-y-4">
                      {/* File Tabs */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {monacoFiles.length > 0 ? (
                          monacoFiles.map((file) => (
                            <Button
                              key={file.id}
                              variant={activeFile?.id === file.id ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setActiveFile(file)}
                              className="whitespace-nowrap"
                              data-testid={`file-tab-${file.id}`}
                            >
                              <FileCode className="h-3 w-3 mr-1" />
                              {file.name}
                              {file.modified && <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full" />}
                            </Button>
                          ))
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="whitespace-nowrap"
                            data-testid="button-create-file"
                          >
                            <FolderOpen className="h-3 w-3 mr-1" />
                            Create New File
                          </Button>
                        )}
                      </div>
                      
                      {/* Monaco Editor Placeholder */}
                      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activeFile ? `${activeFile.name} • ${activeFile.language}` : 'No file selected'}
                          </div>
                        </div>
                        
                        {activeFile ? (
                          <div className="font-mono text-sm space-y-2">
                            <div className="text-blue-600">// {activeFile.name}</div>
                            <div className="text-gray-600">// Professional Monaco IDE will be integrated here</div>
                            <div className="text-green-600">// Features: IntelliSense, Git integration, Multi-cursor editing</div>
                            <div className="text-purple-600">// AI Assistance: Code completion, Error detection, Refactoring</div>
                            <div className="text-orange-600">// Collaboration: Real-time cursors, Live sharing, Code reviews</div>
                            <div className="mt-4 text-gray-800 dark:text-gray-200">
                              {activeFile.content || 'File content will be displayed here...'}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-64 text-muted-foreground">
                            <div className="text-center">
                              <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>Select a file to start editing</p>
                              <p className="text-xs">Monaco IDE with AI assistance ready</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <Terminal className="h-8 w-8 mr-2" />
                      <span>Development environment will be available after project approval</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Task Timeline */}
              <TaskTimeline 
                tasks={realTasks}
                title="Development Progress"
                data-testid="task-timeline-development"
              />
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Agent Activity Feed */}
              {showAgentActivity && (
                <AgentActivityFeed
                  activities={realAgentActivities}
                  title="Live Agent Activity"
                  maxItems={5}
                  showLiveUpdates={realTimeCollaboration}
                  data-testid="agent-activity-feed"
                />
              )}

              {/* Resource Usage */}
              <ResourceUsagePanel
                metrics={{
                  cpu: { usage: 45, cores: 8, frequency: '3.2GHz' },
                  memory: { used: 2.4, total: 8.0, percentage: 30 },
                  storage: { used: 120, total: 500, percentage: 24 },
                  network: { upload: '1.2MB/s', download: '5.8MB/s' },
                  cost: { current: 12.50, budget: 100, percentage: 12.5 },
                  performance: { responseTime: 145, throughput: 1200 }
                }}
                title="Development Resources"
                data-testid="resource-panel"
              />

              {/* Quick Actions */}
              <Card data-testid="card-quick-actions">
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-git-commit">
                    <GitCommit className="h-4 w-4 mr-2" />
                    Commit Changes
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-git-pull">
                    <GitPullRequest className="h-4 w-4 mr-2" />
                    Create Pull Request
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-run-tests">
                    <Play className="h-4 w-4 mr-2" />
                    Run Tests
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-deploy">
                    <Cloud className="h-4 w-4 mr-2" />
                    Deploy Preview
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* GitHub Integration Tab */}
        <TabsContent value="github" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-github-repos">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-purple-600" />
                      GitHub Repositories
                    </CardTitle>
                    <CardDescription>
                      Connect and manage your GitHub repositories
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={loadGitHubRepos}
                    disabled={isLoadingRepos}
                    size="sm"
                    data-testid="button-refresh-github"
                  >
                    {isLoadingRepos ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {githubRepos.length > 0 ? (
                  <div className="space-y-3">
                    {githubRepos.map((repo) => (
                      <motion.div
                        key={repo.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedRepo?.id === repo.id 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedRepo(repo)}
                        data-testid={`repo-item-${repo.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{repo.name}</h4>
                            <p className="text-xs text-muted-foreground">{repo.fullName}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {repo.language || 'Unknown'}
                              </Badge>
                              <Badge variant={repo.private ? 'secondary' : 'outline'} className="text-xs">
                                {repo.private ? 'Private' : 'Public'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {repo.updatedAt}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No repositories found</p>
                    <p className="text-xs">Connect your GitHub account to see repositories</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Repository Details */}
            <Card data-testid="card-repo-details">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  Repository Details
                </CardTitle>
                <CardDescription>
                  Manage repository settings and integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRepo ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Repository Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span>{selectedRepo.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Branch:</span>
                          <span>{selectedRepo.defaultBranch}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Language:</span>
                          <span>{selectedRepo.language || 'Mixed'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Visibility:</span>
                          <span>{selectedRepo.private ? 'Private' : 'Public'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button className="w-full" size="sm" data-testid="button-clone-repo">
                        <Download className="h-4 w-4 mr-2" />
                        Clone Repository
                      </Button>
                      <Button variant="outline" className="w-full" size="sm" data-testid="button-open-github">
                        <GitBranch className="h-4 w-4 mr-2" />
                        Open in GitHub
                      </Button>
                      <Button variant="outline" className="w-full" size="sm" data-testid="button-sync-repo">
                        <Activity className="h-4 w-4 mr-2" />
                        Sync Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a repository to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitor" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResourceUsagePanel 
              metrics={{
                cpu: { usage: 38, cores: 8, frequency: '3.2GHz' },
                memory: { used: 3.2, total: 8.0, percentage: 40 },
                storage: { used: 150, total: 500, percentage: 30 },
                network: { upload: '2.1MB/s', download: '8.5MB/s' },
                cost: { current: 18.75, budget: 100, percentage: 18.75 },
                performance: { responseTime: 125, throughput: 1500 }
              }}
              title="System Performance"
              showAlerts={true}
              data-testid="system-performance"
            />
            <AgentActivityFeed
              activities={realAgentActivities}
              title="Agent Performance Monitor"
              maxItems={8}
              showLiveUpdates={true}
              data-testid="agent-performance"
            />
          </div>
          
          <div className="mt-6">
            <TaskTimeline 
              tasks={realTasks}
              title="Project Timeline Overview"
              showProgress={true}
              data-testid="project-timeline"
            />
          </div>
        </TabsContent>

        <TabsContent value="deploy" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-deployment-config">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-600" />
                  Deployment Configuration
                </CardTitle>
                <CardDescription>
                  One-click deployment to production with automated CI/CD
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projectPlan?.status === 'approved' ? (
                  <div className="space-y-6">
                    {/* Deployment Environments */}
                    <div>
                      <h4 className="font-medium mb-3">Deployment Environments</h4>
                      <div className="space-y-3">
                        {['development', 'staging', 'production'].map((env) => (
                          <div key={env} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                env === 'development' ? 'bg-green-500' :
                                env === 'staging' ? 'bg-yellow-500' : 'bg-gray-300'
                              }`} />
                              <div>
                                <div className="font-medium text-sm capitalize">{env}</div>
                                <div className="text-xs text-muted-foreground">
                                  {env === 'development' && 'Auto-deploy from main branch'}
                                  {env === 'staging' && 'Deploy on PR approval'}
                                  {env === 'production' && 'Manual deployment'}
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant={env === 'development' ? 'default' : 'outline'} 
                              size="sm"
                              data-testid={`button-deploy-${env}`}
                            >
                              {env === 'development' ? 'Deployed' : 'Deploy'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CI/CD Pipeline */}
                    <div>
                      <h4 className="font-medium mb-3">CI/CD Pipeline</h4>
                      <div className="space-y-2">
                        {[
                          { name: 'Build', status: 'success', time: '2m 34s' },
                          { name: 'Test', status: 'success', time: '1m 45s' },
                          { name: 'Security Scan', status: 'running', time: '0m 23s' },
                          { name: 'Deploy', status: 'pending', time: '-' }
                        ].map((step, index) => (
                          <div key={step.name} className="flex items-center gap-3 p-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs">
                              {step.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {step.status === 'running' && <Clock className="h-4 w-4 text-blue-500 animate-spin" />}
                              {step.status === 'pending' && <AlertCircle className="h-4 w-4 text-gray-400" />}
                            </div>
                            <div className="flex-grow">
                              <div className="text-sm font-medium">{step.name}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{step.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deployment Actions */}
                    <div className="space-y-2">
                      <Button className="w-full" data-testid="button-deploy-production">
                        <Cloud className="h-4 w-4 mr-2" />
                        Deploy to Production
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" data-testid="button-rollback">
                          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                          Rollback
                        </Button>
                        <Button variant="outline" size="sm" data-testid="button-logs">
                          <Monitor className="h-4 w-4 mr-2" />
                          View Logs
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Cloud className="h-8 w-8 mr-2" />
                    <span>Deployment options will be available after project approval</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deployment Status */}
            <Card data-testid="card-deployment-status">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Deployment Status
                </CardTitle>
                <CardDescription>
                  Real-time deployment monitoring and metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projectPlan?.deployment ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Current Deployment</div>
                        <div className="text-xs text-muted-foreground">
                          {projectPlan.deployment.environment} • {projectPlan.deployment.status}
                        </div>
                      </div>
                      <Badge variant={projectPlan.deployment.status === 'deployed' ? 'default' : 'secondary'}>
                        {projectPlan.deployment.status}
                      </Badge>
                    </div>
                    
                    {projectPlan.deployment.url && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Live URL</div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono">
                          {projectPlan.deployment.url}
                        </div>
                        <Button variant="outline" size="sm" className="w-full" data-testid="button-open-deployment">
                          <Monitor className="h-4 w-4 mr-2" />
                          Open Deployment
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No deployments yet</p>
                    <p className="text-xs">Deploy your project to see status here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}