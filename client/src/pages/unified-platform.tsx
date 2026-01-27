import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Code2, 
  Bot, 
  Palette, 
  Gamepad2, 
  Building2,
  Sparkles,
  Upload,
  FileText,
  Image,
  Wand2,
  BarChart3,
  Settings,
  Github,
  Database,
  Workflow,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function UnifiedPlatform() {
  const [prompt, setPrompt] = useState('');
  const [activeModule, setActiveModule] = useState<'software' | 'assistant' | 'content' | 'games' | 'enterprise'>('software');
  const [showTools, setShowTools] = useState(false);
  const { toast } = useToast();

  // Auto-detect module based on prompt
  const detectModule = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('game') || lowerText.includes('play') || lowerText.includes('therapeutic')) return 'games';
    if (lowerText.includes('assistant') || lowerText.includes('chatbot') || lowerText.includes('ai helper')) return 'assistant';
    if (lowerText.includes('content') || lowerText.includes('article') || lowerText.includes('video') || lowerText.includes('image')) return 'content';
    if (lowerText.includes('enterprise') || lowerText.includes('business') || lowerText.includes('crm') || lowerText.includes('erp')) return 'enterprise';
    return 'software'; // default
  };

  // Enhanced prompt mutation
  const enhancePromptMutation = useMutation({
    mutationFn: async (data: { prompt: string; type: string }) => {
      return apiRequest('/api/wai-orchestration-consolidated/enhance-prompt', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      setPrompt(data.data.enhanced);
      toast({
        title: "Prompt Enhanced",
        description: "Your prompt has been optimized for better results"
      });
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/wai-orchestration-consolidated/create-project', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Project Started",
        description: "WAI agents are now working on your project."
      });
      setPrompt('');
    },
    onError: (error: any) => {
      toast({
        title: "Project creation failed",
        description: error.message || "Failed to start project",
        variant: "destructive"
      });
    }
  });

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    // Auto-detect and switch module
    if (value.length > 10) {
      const detectedModule = detectModule(value);
      setActiveModule(detectedModule as any);
    }
  };

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description to enhance",
        variant: "destructive"
      });
      return;
    }
    enhancePromptMutation.mutate({ prompt, type: activeModule });
  };

  const handleCreateProject = () => {
    if (!prompt.trim()) {
      toast({
        title: "Description required",
        description: "Please describe what you want to build",
        variant: "destructive"
      });
      return;
    }

    createProjectMutation.mutate({
      type: activeModule,
      prompt: prompt,
      userId: 1
    });
  };

  // Enhanced with Phase 2 & 3 features
  const { data: warpTerminalCapabilities } = useQuery({
    queryKey: ['/api/warp-terminal/status'],
    refetchInterval: 30000
  });

  const { data: flowMakerStatus } = useQuery({
    queryKey: ['/api/flow-maker/status'],
    refetchInterval: 30000
  });

  const { data: motiaBackendTemplates } = useQuery({
    queryKey: ['/api/motia-backend/templates'],
    refetchInterval: 60000
  });

  const { data: reactBitsComponents } = useQuery({
    queryKey: ['/api/reactbits-ui/components'],
    refetchInterval: 60000
  });

  const modules = {
    software: {
      icon: Code2,
      title: 'Enhanced Software Development',
      description: '57+ AI agents with Warp Terminal (6-7hr weekly savings), Flow Maker workflows, Motia backends, ReactBits UI',
      color: 'text-blue-600',
      placeholder: 'Describe your web app, mobile app, or API... (Enhanced with Phase 1-3 integrations)'
    },
    assistant: {
      icon: Bot,
      title: 'Enhanced AI Assistant',
      description: 'Create intelligent assistants with 3D avatars, visual workflows, and enterprise monitoring',
      color: 'text-green-600',
      placeholder: 'Describe your AI assistant\'s personality and purpose... (Enhanced with Opik monitoring + Flow Maker)'
    },
    content: {
      icon: Palette,
      title: 'Enhanced Content Creation',
      description: 'Generate all content types with AI, ReactBits UI components, and professional monitoring',
      color: 'text-purple-600',
      placeholder: 'Describe the content you want to create... (Enhanced with ReactBits components + Toolhouse tools)'
    },
    games: {
      icon: Gamepad2,
      title: 'Game Builder',
      description: 'Create therapeutic and educational games',
      color: 'text-orange-600',
      placeholder: 'Describe your game concept and target audience...'
    },
    enterprise: {
      icon: Building2,
      title: 'Enterprise Solutions',
      description: 'Business integrations and compliance',
      color: 'text-red-600',
      placeholder: 'Describe your enterprise integration needs...'
    }
  };

  const currentModule = modules[activeModule];
  const ModuleIcon = currentModule.icon;

  const tools = [
    { icon: Github, title: 'GitHub', description: 'Repository management' },
    { icon: Database, title: 'Database', description: 'Data ecosystem' },
    { icon: Workflow, title: 'Workflows', description: 'Automation' },
    { icon: BarChart3, title: 'Analytics', description: 'Performance tracking' },
    { icon: Settings, title: 'Settings', description: 'Configuration' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            WAI DevStudio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            What do you want to build?
          </p>
        </div>

        {/* Unified Prompt Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ModuleIcon className={`w-6 h-6 ${currentModule.color}`} />
              {currentModule.title}
            </CardTitle>
            <CardDescription>{currentModule.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Prompt Input */}
            <div className="space-y-2">
              <Textarea
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder={currentModule.placeholder}
                className="min-h-[120px] text-base"
              />
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Attach
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  PRD
                </Button>
                <Button variant="outline" size="sm">
                  <Image className="w-4 h-4 mr-2" />
                  Images
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEnhancePrompt}
                  disabled={enhancePromptMutation.isPending}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Enhance
                </Button>
                
                {/* Main Create Button */}
                <Button 
                  onClick={handleCreateProject}
                  disabled={createProjectMutation.isPending || !prompt.trim()}
                  className="ml-auto"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {createProjectMutation.isPending ? 'Building...' : 'Build'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5 Core Modules Tabs */}
        <Tabs value={activeModule} onValueChange={(value) => setActiveModule(value as any)} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            {Object.entries(modules).map(([key, module]) => {
              const Icon = module.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{module.title.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(modules).map(([key, module]) => (
            <TabsContent key={key} value={key} className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <module.icon className={`w-12 h-12 ${module.color} mx-auto mb-4`} />
                    <h3 className="text-xl font-semibold mb-2">{module.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{module.description}</p>
                    <Badge variant="outline" className="text-sm">
                      Ready for input above ↑
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Dashboard Options & Additional Features */}
        <div className="space-y-4">
          {/* Dashboard Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Dashboard Options
              </CardTitle>
              <CardDescription>Choose your preferred interface for A/B testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 border-2 border-blue-500">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <div className="text-center">
                    <div className="font-medium text-sm">Unified Platform</div>
                    <div className="text-xs text-gray-500">Current: All-in-one interface</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <BarChart3 className="w-6 h-6 text-green-600" />
                  <div className="text-center">
                    <div className="font-medium text-sm">Individual Components</div>
                    <div className="text-xs text-gray-500">Traditional: Separate flows</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Features (Collapsible) */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setShowTools(!showTools)}>
              <CardTitle className="flex items-center justify-between">
                <span>Additional Features</span>
                {showTools ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardTitle>
              <CardDescription>GitHub • Database • Workflows • Analytics</CardDescription>
            </CardHeader>
            {showTools && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {tools.map((tool) => (
                    <Button key={tool.title} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <tool.icon className="w-6 h-6" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{tool.title}</div>
                        <div className="text-xs text-gray-500">{tool.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}