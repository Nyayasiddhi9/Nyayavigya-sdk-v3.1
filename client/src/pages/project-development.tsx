/**
 * Project Development Flow - Complete SDLC Process with Agent Orchestration
 * Takes user from prompt/document input to deployed project with real-time progress
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Pause, 
  Square, 
  Code, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Upload,
  Monitor,
  Rocket,
  GitBranch,
  Database,
  Cog,
  Target,
  BarChart3,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PromptEnhancer } from '@/components/PromptEnhancer';
import { apiRequest } from '@/lib/queryClient';

interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  agents: string[];
  startTime?: Date;
  endTime?: Date;
  output?: any;
}

interface ActiveAgent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'waiting' | 'completed';
  currentTask: string;
  progress: number;
}

export default function ProjectDevelopment() {
  const [projectPrompt, setProjectPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState(null);
  const [showEnhancer, setShowEnhancer] = useState(false);
  const [isProjectActive, setIsProjectActive] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [activeAgents, setActiveAgents] = useState<ActiveAgent[]>([]);
  const [projectOutput, setProjectOutput] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('input');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const queryClient = useQueryClient();

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isProjectActive) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Connected to WAI Orchestration');
      socket.send(JSON.stringify({
        type: 'project.development.subscribe',
        projectId: currentProjectId
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketUpdate(data);
    };

    socket.onclose = () => {
      console.log('Disconnected from WAI Orchestration');
    };

    return () => {
      socket.close();
    };
  }, [isProjectActive, currentProjectId]);

  const handleWebSocketUpdate = (data: any) => {
    switch (data.type) {
      case 'phase.updated':
        setPhases(prev => prev.map(phase => 
          phase.id === data.phaseId ? { ...phase, ...data.updates } : phase
        ));
        break;
      case 'agent.status.updated':
        setActiveAgents(prev => prev.map(agent => 
          agent.id === data.agentId ? { ...agent, ...data.updates } : agent
        ));
        break;
      case 'project.completed':
        setProjectOutput(data.output);
        setIsProjectActive(false);
        toast({
          title: "Project Completed!",
          description: "Your project has been successfully built and deployed."
        });
        break;
    }
  };

  const startProjectDevelopment = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/projects/develop', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: (data) => {
      setCurrentProjectId(data.projectId);
      setPhases(data.phases);
      setActiveAgents(data.initialAgents);
      setIsProjectActive(true);
      setSelectedTab('progress');
      
      toast({
        title: "Project Development Started",
        description: "WAI agents are now building your project..."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Development",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    }
  });

  const handleStartDevelopment = () => {
    if (!enhancedPrompt && !projectPrompt.trim()) {
      toast({
        title: "Project Description Required",
        description: "Please provide a project description or enhance your prompt first.",
        variant: "destructive"
      });
      return;
    }

    const developmentData = {
      prompt: enhancedPrompt?.enhanced || projectPrompt,
      projectPlan: enhancedPrompt?.projectPlan,
      analysis: enhancedPrompt?.analysis,
      riskAssessment: enhancedPrompt?.riskAssessment,
      successMetrics: enhancedPrompt?.successMetrics,
      uploadedFiles: uploadedFiles.map(f => f.name)
    };

    startProjectDevelopment.mutate(developmentData);
  };

  const handleEnhancedPrompt = (data: any) => {
    setEnhancedPrompt(data);
    setShowEnhancer(false);
    toast({
      title: "Prompt Enhanced",
      description: "Your project requirements have been optimized for better results."
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getOverallProgress = () => {
    if (phases.length === 0) return 0;
    const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
    return Math.round(totalProgress / phases.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            WAI Project Development Studio
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Transform your ideas into production-ready software with AI-powered SDLC automation
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="input">Project Input</TabsTrigger>
            <TabsTrigger value="progress" disabled={!isProjectActive && !projectOutput}>Development Progress</TabsTrigger>
            <TabsTrigger value="agents" disabled={!isProjectActive && !projectOutput}>Active Agents</TabsTrigger>
            <TabsTrigger value="output" disabled={!projectOutput}>Project Output</TabsTrigger>
          </TabsList>

          {/* Project Input Tab */}
          <TabsContent value="input" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Project Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={projectPrompt}
                    onChange={(e) => setProjectPrompt(e.target.value)}
                    placeholder="Describe your project idea, requirements, and goals..."
                    className="min-h-[200px] resize-none"
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowEnhancer(true)}
                      disabled={!projectPrompt.trim()}
                    >
                      Enhance with AI
                    </Button>
                    
                    {enhancedPrompt && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Enhanced
                      </Badge>
                    )}
                  </div>

                  {/* File Upload */}
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6">
                    <div className="text-center space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-slate-400" />
                      <div>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500">Upload files</span>
                          <span className="text-slate-500"> or drag and drop</span>
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.txt,.fig,.jpg,.jpeg,.png"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        PRD, BRD, Figma, Screenshots, Documents
                      </p>
                    </div>
                    
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right Column - Enhancement Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Project Planning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {enhancedPrompt ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                          Enhanced Requirements
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {enhancedPrompt.enhanced.substring(0, 200)}...
                        </p>
                      </div>
                      
                      {enhancedPrompt.projectPlan && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Project Plan</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {enhancedPrompt.projectPlan.totalEstimatedHours || 0}h estimated
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {enhancedPrompt.projectPlan.recommendedTeamSize || 1} agents
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enhance your prompt to see detailed project planning</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Start Development Button */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleStartDevelopment}
                disabled={startProjectDevelopment.isPending || isProjectActive}
                className="px-8 py-3 text-lg"
              >
                {startProjectDevelopment.isPending ? (
                  <>
                    <Cog className="mr-2 h-5 w-5 animate-spin" />
                    Initializing WAI Agents...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Start AI Development
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Development Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Development Progress
                  </div>
                  <Badge variant={isProjectActive ? "default" : "secondary"}>
                    {isProjectActive ? "In Progress" : "Completed"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Overall Progress</span>
                    <span className="text-2xl font-bold text-blue-600">{getOverallProgress()}%</span>
                  </div>
                  <Progress value={getOverallProgress()} className="h-3" />
                  
                  <div className="space-y-4">
                    {phases.map((phase, index) => (
                      <motion.div
                        key={phase.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {phase.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : phase.status === 'in_progress' ? (
                              <Cog className="h-5 w-5 text-blue-500 animate-spin" />
                            ) : phase.status === 'failed' ? (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-slate-400" />
                            )}
                            <div>
                              <h4 className="font-medium">{phase.name}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {phase.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">{phase.progress}%</div>
                            <div className="text-xs text-slate-500">
                              {phase.agents.length} agents
                            </div>
                          </div>
                        </div>
                        <Progress value={phase.progress} className="h-2" />
                        
                        {phase.agents.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {phase.agents.map(agent => (
                              <Badge key={agent} variant="outline" className="text-xs">
                                {agent}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  AI Agents Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeAgents.map((agent) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{agent.name}</h4>
                        <Badge 
                          variant={
                            agent.status === 'active' ? 'default' : 
                            agent.status === 'completed' ? 'secondary' : 'outline'
                          }
                        >
                          {agent.status}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          {agent.role}
                        </p>
                        <p className="text-xs text-slate-500">
                          {agent.currentTask}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{agent.progress}%</span>
                        </div>
                        <Progress value={agent.progress} className="h-2" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Output Tab */}
          <TabsContent value="output" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Project Deliverables
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectOutput ? (
                  <div className="space-y-6">
                    {/* Project Preview */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
                      <div className="aspect-video bg-white dark:bg-slate-700 rounded border flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <Monitor className="h-12 w-12 mx-auto text-slate-400" />
                          <p className="text-slate-600 dark:text-slate-400">
                            Project Preview Loading...
                          </p>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in New Tab
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Deployment Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <GitBranch className="h-4 w-4" />
                            Source Code
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Repository</span>
                            <Button variant="outline" size="sm">
                              <GitBranch className="mr-2 h-4 w-4" />
                              View on GitHub
                            </Button>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            <p>Files: 42 • Commits: 15 • Branch: main</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Database
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Connection</span>
                            <Badge variant="default">Connected</Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            <p>Tables: 8 • Records: 1,247 • Type: PostgreSQL</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Deployment Actions */}
                    <div className="flex justify-center gap-4">
                      <Button variant="outline">
                        <Code className="mr-2 h-4 w-4" />
                        Edit Source
                      </Button>
                      <Button variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        Run Tests
                      </Button>
                      <Button>
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy to Production
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Project output will appear here once development is complete</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Prompt Enhancer Modal */}
      <PromptEnhancer
        open={showEnhancer}
        onClose={() => setShowEnhancer(false)}
        onEnhanced={handleEnhancedPrompt}
        initialPrompt={projectPrompt}
      />
    </div>
  );
}