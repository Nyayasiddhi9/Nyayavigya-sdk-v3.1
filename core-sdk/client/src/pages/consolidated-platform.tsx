import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Code2, 
  Bot, 
  Palette, 
  Gamepad2, 
  Building2,
  Sparkles,
  Wand2,
  Play,
  Settings,
  Users,
  BarChart3,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Download,
  Share,
  Edit,
  Trash2,
  Eye,
  Globe,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  type: 'software' | 'assistant' | 'content' | 'game' | 'enterprise';
  status: 'planning' | 'development' | 'testing' | 'completed' | 'deployed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
  assignedAgents?: string[];
  cost?: number;
  fileUrl?: string;
}

interface AgentStatus {
  id: string;
  name: string;
  type: 'executive' | 'development' | 'creative' | 'testing' | 'specialist';
  status: 'active' | 'busy' | 'idle' | 'offline';
  currentTask?: string;
  workload: number;
  efficiency: number;
}

interface PromptEnhancement {
  original: string;
  enhanced: string;
  suggestions: string[];
  agents: string[];
  projectPlan?: any;
}

export default function ConsolidatedPlatform() {
  const [activeComponent, setActiveComponent] = useState<'software' | 'assistant' | 'content' | 'game' | 'enterprise'>('software');
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [projectType, setProjectType] = useState('web-app');
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);
  const [currentEnhancement, setCurrentEnhancement] = useState<PromptEnhancement | null>(null);
  const [showProjectPlan, setShowProjectPlan] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agent status for orchestration monitoring
  const { data: agentStatus = [], isLoading: agentLoading } = useQuery<AgentStatus[]>({
    queryKey: ['/api/wai-orchestration/agents/status'],
    refetchInterval: 5000,
    initialData: []
  });

  // Fetch project history across all components
  const { data: projects = [], isLoading: projectsLoading, refetch } = useQuery<ProjectItem[]>({
    queryKey: ['/api/wai-orchestration/projects'],
    refetchInterval: 10000,
    initialData: []
  });

  // Fetch WAI providers
  const { data: waiProviders } = useQuery({
    queryKey: ['/api/wai-orchestration/providers'],
    refetchInterval: 30000
  });

  // Enhance prompt mutation
  const enhancePromptMutation = useMutation({
    mutationFn: async (data: { prompt: string; type: string }) => {
      return apiRequest('/api/wai-orchestration-consolidated/enhance-prompt', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      setCurrentEnhancement(data.data);
      setShowEnhancementModal(true);
    },
    onError: (error: any) => {
      toast({
        title: "Enhancement failed",
        description: error.message || "Failed to enhance prompt",
        variant: "destructive"
      });
    }
  });

  // Create project mutation using WAI orchestration
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/wai-orchestration-consolidated/create-project', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Project started",
        description: "WAI agents are now working on your project."
      });
      setPrompt('');
      setEnhancedPrompt('');
      setShowProjectPlan(true);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Project creation failed",
        description: error.message || "Failed to start project",
        variant: "destructive"
      });
    }
  });

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a project description to enhance",
        variant: "destructive"
      });
      return;
    }

    enhancePromptMutation.mutate({ prompt, type: activeComponent });
  };

  const applyEnhancement = () => {
    if (currentEnhancement) {
      setEnhancedPrompt(currentEnhancement.enhanced);
      setPrompt(currentEnhancement.enhanced);
      setShowEnhancementModal(false);
      toast({
        title: "Prompt enhanced",
        description: "Your prompt has been optimized for better results"
      });
    }
  };

  const handleCreateProject = () => {
    if (!prompt.trim()) {
      toast({
        title: "Description required",
        description: "Please describe what you want to create",
        variant: "destructive"
      });
      return;
    }

    const projectData = {
      type: activeComponent,
      prompt: enhancedPrompt || prompt,
      projectType,
      llmProvider: selectedProvider === 'auto' ? undefined : selectedProvider,
      userId: '1' // Get from user context in production
    };

    createProjectMutation.mutate(projectData);
  };

  const components = {
    software: {
      icon: Code2,
      title: 'Software Development',
      description: 'End-to-end software development using SDLC agents',
      placeholder: 'Describe your software project (e.g., "Build a social media platform with React and Node.js")',
      types: [
        { value: 'web-app', label: 'Web Application' },
        { value: 'mobile-app', label: 'Mobile App' },
        { value: 'api', label: 'API/Backend' },
        { value: 'desktop', label: 'Desktop App' },
        { value: 'microservice', label: 'Microservice' }
      ]
    },
    assistant: {
      icon: Bot,
      title: 'AI Assistant Builder',
      description: 'Create intelligent AI assistants with multimodal capabilities',
      placeholder: 'Describe your AI assistant (e.g., "Customer support bot for e-commerce with voice and 3D avatar")',
      types: [
        { value: 'chat', label: 'Chat Assistant' },
        { value: 'voice', label: 'Voice Assistant' },
        { value: '3d-avatar', label: '3D Avatar Assistant' },
        { value: 'enterprise', label: 'Enterprise Assistant' },
        { value: 'immersive', label: 'AR/VR Assistant' }
      ]
    },
    content: {
      icon: Palette,
      title: 'Content Creation',
      description: 'Generate all types of content using specialized creative agents',
      placeholder: 'Describe content to create (e.g., "Marketing video for tech startup with professional voiceover")',
      types: [
        { value: 'text', label: 'Text Content' },
        { value: 'image', label: 'Images' },
        { value: 'video', label: 'Videos' },
        { value: 'audio', label: 'Audio' },
        { value: 'presentation', label: 'Presentations' }
      ]
    },
    game: {
      icon: Gamepad2,
      title: 'AI Game Builder',
      description: 'Create therapeutic and engaging games with AI',
      placeholder: 'Describe your game idea (e.g., "Meditation game for anxiety relief with calming music")',
      types: [
        { value: 'therapeutic', label: 'Therapeutic Game' },
        { value: 'educational', label: 'Educational Game' },
        { value: 'casual', label: 'Casual Game' },
        { value: 'puzzle', label: 'Puzzle Game' },
        { value: 'adventure', label: 'Adventure Game' }
      ]
    },
    enterprise: {
      icon: Building2,
      title: 'Enterprise Solutions',
      description: 'Comprehensive enterprise AI solutions and integrations',
      placeholder: 'Describe your enterprise need (e.g., "CRM integration with AI-powered sales insights")',
      types: [
        { value: 'integration', label: 'System Integration' },
        { value: 'workflow', label: 'Workflow Automation' },
        { value: 'analytics', label: 'AI Analytics' },
        { value: 'crm', label: 'CRM Enhancement' },
        { value: 'erp', label: 'ERP Integration' }
      ]
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'deployed':
        return 'text-green-600';
      case 'development':
      case 'testing':
        return 'text-blue-600';
      case 'planning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'busy':
        return 'bg-blue-500';
      case 'idle':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const activeConfig = components[activeComponent];
  const Icon = activeConfig.icon;

  const filteredProjects = (projects || []).filter(p => p.type === activeComponent);
  const executiveAgents = (agentStatus || []).filter(a => a.type === 'executive');
  const activeAgents = (agentStatus || []).filter(a => a.status === 'active' || a.status === 'busy');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            WAI DevStudio - Intelligent AI Platform
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            World-class intelligent platform with autonomous agent orchestration
          </p>
        </motion.div>

        {/* Agent Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Agent Orchestration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{activeAgents.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{executiveAgents.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Executive Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{(projects || []).filter(p => p.status === 'development').length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {(waiProviders as any)?.data?.providers?.length || 13}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">LLM Providers</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Component Selection */}
        <Tabs value={activeComponent} onValueChange={(value: any) => setActiveComponent(value)} className="space-y-6">
          <TabsList className="grid grid-cols-5 gap-2 h-auto p-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            {Object.entries(components).map(([key, config]) => {
              const TabIcon = config.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                >
                  <TabIcon className="h-6 w-6" />
                  <span className="text-xs text-center">{config.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Component Content */}
          {Object.entries(components).map(([key, config]) => (
            <TabsContent key={key} value={key} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <config.icon className="h-6 w-6 text-purple-600" />
                      {config.title}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Project Creation Form */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="prompt">Project Description</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleEnhancePrompt}
                            disabled={!prompt.trim() || enhancePromptMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            {enhancePromptMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Wand2 className="h-3 w-3" />
                            )}
                            Enhance with AI
                          </Button>
                        </div>
                        <Textarea
                          id="prompt"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder={config.placeholder}
                          className="min-h-[120px] resize-none"
                        />
                        {enhancedPrompt && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-md text-sm">
                            <p className="text-purple-700 dark:text-purple-300 mb-1">✨ Enhanced description active</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{enhancedPrompt.substring(0, 150)}...</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Project Type</Label>
                          <Select value={projectType} onValueChange={setProjectType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {config.types.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>AI Provider</Label>
                          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4" />
                                  Auto (Best for task)
                                </div>
                              </SelectItem>
                              {((waiProviders as any)?.data?.providers || []).map((provider: string) => (
                                <SelectItem key={provider} value={provider}>
                                  {provider.replace('-', ' ').toUpperCase()}
                                </SelectItem>
                              )) || []}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        onClick={handleCreateProject}
                        disabled={createProjectMutation.isPending}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        size="lg"
                      >
                        {createProjectMutation.isPending ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Creating with WAI Agents...
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start Project with AI Agents
                          </>
                        )}
                      </Button>

                      <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertDescription>
                          Your project will be handled by specialized WAI agents including executive decision makers (CTO, CPO, CMO) and domain experts.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Project History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle>Recent Projects</CardTitle>
                    <CardDescription>Your {config.title.toLowerCase()} projects managed by WAI agents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projectsLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                      </div>
                    ) : filteredProjects.length === 0 ? (
                      <div className="text-center py-12">
                        <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No {config.title.toLowerCase()} projects yet. Start creating!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredProjects.map((project: ProjectItem) => (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                                  <Icon className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-medium truncate max-w-md">{project.title}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Badge variant="outline">{project.metadata?.llmProvider || 'auto'}</Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {project.assignedAgents?.length || 0} agents
                                    </Badge>
                                    <span className={getStatusColor(project.status)}>
                                      {project.status}
                                    </span>
                                    {project.cost && <span>${project.cost.toFixed(2)}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {project.status === 'development' && (
                                  <Progress value={project.progress} className="w-24" />
                                )}
                                {project.status === 'completed' && project.fileUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(project.fileUrl, '_blank')}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Prompt Enhancement Modal */}
        {showEnhancementModal && currentEnhancement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                AI-Enhanced Project Description
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Original Description:</h4>
                  <p className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded">{prompt}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Enhanced Description:</h4>
                  <p className="text-sm bg-purple-50 dark:bg-purple-900/30 p-3 rounded">{currentEnhancement.enhanced}</p>
                </div>
                
                {currentEnhancement.agents && currentEnhancement.agents.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Assigned Agents:</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentEnhancement.agents.map((agent, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentEnhancement.suggestions && currentEnhancement.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">AI Suggestions:</h4>
                    <ul className="space-y-2">
                      {currentEnhancement.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEnhancementModal(false);
                    setCurrentEnhancement(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={applyEnhancement}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Use Enhanced Description
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}