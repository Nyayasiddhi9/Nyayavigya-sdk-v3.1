/**
 * Engineering Forge Studio Workspace
 * Studio 5: Full-stack code generation for any tech stack
 * Wizards Incubator Platform
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassmorphicCard } from '@/components/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Code, Database, Layers, Rocket, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import StudioBaseUI from '@/components/studio-base-ui';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAGUIStream } from '@/hooks/use-agui-stream';
import { ThinkingStepsPanel, type ThinkingStep } from '@/components/agui/ThinkingStepsPanel';
import { ToolCallsPanel, type ToolCall } from '@/components/agui/ToolCallsPanel';
import type { AGUIThinkingEvent, AGUIToolCallEvent, AGUIToolResultEvent } from '@shared/agui-event-types';
import { StudioOutcomesSection } from '@/components/wizards/studio-outcomes-section';
import { getStudioMessaging, getStudioCTA, SECTION_LABELS } from '@/constants/studios/messaging';
import { StudioReadinessGate } from '@/components/studio/StudioReadinessGate';

interface OrchestrationStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  message?: string;
  progress?: number;
}

interface TechStackOptions {
  frontend: {
    framework: string;
    stateManagement: string;
    styling: string;
    routing: string;
  };
  backend: {
    framework: string;
    language: string;
    orm: string;
    authentication: string;
  };
  database: {
    type: string;
    orm: string;
  };
  deployment: {
    platform: string;
    containerization: string;
  };
}

export function EngineeringForgeWorkspace() {
  const { toast } = useToast();
  
  // Get studio messaging configuration
  const studioMessaging = getStudioMessaging('engineering-forge');

  // Workflow selection
  const [activeWorkflow, setActiveWorkflow] = useState<'frontend' | 'backend' | 'database' | 'fullstack'>('frontend');

  // Form inputs
  const [specification, setSpecification] = useState('');
  const [projectName, setProjectName] = useState('');
  const [techStack, setTechStack] = useState<TechStackOptions>({
    frontend: {
      framework: 'React',
      stateManagement: 'TanStack Query',
      styling: 'Tailwind CSS',
      routing: 'Wouter',
    },
    backend: {
      framework: 'Express.js',
      language: 'TypeScript',
      orm: 'Drizzle',
      authentication: 'JWT',
    },
    database: {
      type: 'PostgreSQL',
      orm: 'Drizzle',
    },
    deployment: {
      platform: 'Vercel',
      containerization: 'Docker',
    },
  });

  // Get startup and session from backend
  const [startupId, setStartupId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionAttempted, setSessionAttempted] = useState(false);

  // Fetch or create startup and session for current user
  const { data: startupData, isLoading: loadingStartup } = useQuery({
    queryKey: ['/api/wizards/founders/me/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/wizards/founders/me/dashboard', {
        credentials: 'include',
      });
      return response.json();
    },
  });

  // Reusable session creation function
  const createSession = useCallback((startupIdToUse: number) => {
    setIsCreatingSession(true);
    setSessionAttempted(true);
    
    // Fetch or create session for this studio (backend handles idempotency)
    fetch('/api/wizards/studios/engineering-forge/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ startupId: startupIdToUse }),
    })
      .then(async res => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to create session');
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.session) {
          setSessionId(data.session.id);
        }
      })
      .catch(err => {
        console.error('Failed to create session:', err);
        toast({
          title: 'Session Creation Failed',
          description: err.message,
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsCreatingSession(false);
      });
  }, [toast]);

  // Initialize startup and session (only runs once per mount)
  useEffect(() => {
    if (startupData?.startups?.[0] && !sessionId && !sessionAttempted && !isCreatingSession) {
      const startup = startupData.startups[0];
      setStartupId(startup.id);
      createSession(startup.id);
    }
  }, [startupData, sessionId, sessionAttempted, isCreatingSession, createSession]);

  // Fetch studio data (only when we have a startup)
  const { data: studioData } = useQuery({
    queryKey: ['/api/wizards/studios', 'engineering-forge', 'detail', startupId],
    queryFn: async () => {
      const response = await fetch(`/api/wizards/studios/engineering-forge/detail?startupId=${startupId}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!startupId,
  });

  // Show loading state while fetching startup/session
  if (loadingStartup || !startupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-foreground-secondary">Loading startup data...</p>
        </div>
      </div>
    );
  }

  // Show error state if session creation failed
  if (!sessionId && !isCreatingSession && startupId && sessionAttempted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <GlassmorphicCard className="max-w-md">
          <CardHeader>
            <CardTitle>Session Initialization Failed</CardTitle>
            <CardDescription>Unable to create studio session. Please try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setSessionAttempted(false);
                createSession(startupId);
              }}
              className="w-full"
              data-testid="button-retry-session"
            >
              Retry
            </Button>
          </CardContent>
        </GlassmorphicCard>
      </div>
    );
  }

  // Still creating session
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-foreground-secondary">Creating studio session...</p>
        </div>
      </div>
    );
  }

  // Orchestration status tracking
  const [orchestrationStatus, setOrchestrationStatus] = useState<OrchestrationStatus>({
    status: 'idle',
  });

  // AG-UI streaming state
  const [aguiSessionId, setAguiSessionId] = useState<string | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

  // AG-UI stream with status guard pattern
  useAGUIStream(aguiSessionId, {
    includeHistory: true,
    reconnect: true,
    maxReconnectAttempts: 3,
    onEvent: (event) => {
      // Thinking steps visualization
      if (event.type === 'agent:thinking') {
        const thinkingEvent = event as AGUIThinkingEvent;
        setThinkingSteps(prev => {
          const stepId = `${thinkingEvent.agentId}-${thinkingEvent.timestamp}`;
          
          // Skip if this step already exists (replay event)
          if (prev.some(s => s.id === stepId)) {
            return prev;
          }
          
          // Mark all previous steps as completed
          const updatedPrev = prev.map(s => ({
            ...s,
            status: 'completed' as const,
            duration: s.duration || (Date.now() - s.timestamp)
          }));
          
          // Add new active step
          const newStep: ThinkingStep = {
            id: stepId,
            title: thinkingEvent.step || 'Thinking...',
            content: thinkingEvent.thought,
            timestamp: thinkingEvent.timestamp,
            status: 'active'
          };
          
          return [...updatedPrev, newStep];
        });
      }

      // Tool calls tracking
      if (event.type === 'tool:call') {
        const toolCallEvent = event as AGUIToolCallEvent;
        const newCall: ToolCall = {
          id: toolCallEvent.toolCallId,
          toolName: toolCallEvent.tool,
          parameters: toolCallEvent.parameters,
          timestamp: toolCallEvent.timestamp,
          status: 'pending'
        };
        setToolCalls(prev => [...prev, newCall]);
      }

      if (event.type === 'tool:result') {
        const toolResultEvent = event as AGUIToolResultEvent;
        setToolCalls(prev => prev.map(call => 
          call.id === toolResultEvent.toolCallId
            ? {
                ...call,
                status: toolResultEvent.success ? 'success' : 'error',
                result: toolResultEvent.success ? toolResultEvent.result : undefined,
                error: !toolResultEvent.success ? toolResultEvent.error : undefined,
                duration: toolResultEvent.timestamp - call.timestamp
              }
            : call
        ));
      }

      // Agent start - never overwrite terminal states (status guard)
      if (event.type === 'agent:start') {
        setOrchestrationStatus(prev => 
          prev.status === 'failed' || prev.status === 'completed' ? prev : {
            ...prev,
            status: 'running',
            message: 'AI agents are working...',
          }
        );
      }

      // Agent complete - finalize thinking steps
      if (event.type === 'agent:complete') {
        setThinkingSteps(prev => prev.map(s => ({
          ...s,
          status: 'completed',
          duration: s.duration || (Date.now() - s.timestamp)
        })));
      }

      // Agent error - log only (demo path), don't update production status
      if (event.type === 'agent:error') {
        console.warn('AG-UI demo error:', event);
      }
    }
  });

  // Frontend Generation Mutation
  const frontendMutation = useMutation({
    mutationFn: async (data: { specification: string; techStack: TechStackOptions['frontend'] }) => {
      return apiRequest(`/api/wizards/engineering-forge/generate-frontend`, {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          specification: data.specification,
          techStack: data.techStack,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null); // Detach from previous stream
      setThinkingSteps([]);
      setToolCalls([]);
      setOrchestrationStatus({ status: 'running', message: 'Starting frontend code generation...' });
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Engineering Forge] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      setOrchestrationStatus({ status: 'completed', message: 'Frontend code generated successfully' });
      toast({
        title: 'Frontend Generated',
        description: `Created ${data.code?.files?.length || 0} files`,
      });
      
      // Refresh studio data
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studios', 'engineering-forge', 'detail', startupId] });
    },
    onError: (error: Error) => {
      setOrchestrationStatus({
        status: 'failed',
        message: error.message || 'Failed to generate frontend code',
      });
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Backend Generation Mutation
  const backendMutation = useMutation({
    mutationFn: async (data: { specification: string; techStack: TechStackOptions['backend'] }) => {
      return apiRequest(`/api/wizards/engineering-forge/generate-backend`, {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          specification: data.specification,
          techStack: data.techStack,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null); // Detach from previous stream
      setThinkingSteps([]);
      setToolCalls([]);
      setOrchestrationStatus({ status: 'running', message: 'Starting backend code generation...' });
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Engineering Forge] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      setOrchestrationStatus({ status: 'completed', message: 'Backend code generated successfully' });
      toast({
        title: 'Backend Generated',
        description: `Created ${data.code?.files?.length || 0} files`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studios', 'engineering-forge', 'detail', startupId] });
    },
    onError: (error: Error) => {
      setOrchestrationStatus({
        status: 'failed',
        message: error.message || 'Failed to generate backend code',
      });
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Database Generation Mutation
  const databaseMutation = useMutation({
    mutationFn: async (data: { schema: string; databaseType: string; orm: string }) => {
      return apiRequest(`/api/wizards/engineering-forge/generate-database`, {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          schema: data.schema,
          databaseType: data.databaseType,
          orm: data.orm,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null); // Detach from previous stream
      setThinkingSteps([]);
      setToolCalls([]);
      setOrchestrationStatus({ status: 'running', message: 'Starting database code generation...' });
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Engineering Forge] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      setOrchestrationStatus({ status: 'completed', message: 'Database code generated successfully' });
      toast({
        title: 'Database Generated',
        description: `Created ${data.code?.tables?.length || 0} tables`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studios', 'engineering-forge', 'detail', startupId] });
    },
    onError: (error: Error) => {
      setOrchestrationStatus({
        status: 'failed',
        message: error.message || 'Failed to generate database code',
      });
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Full-Stack Generation Mutation
  const fullstackMutation = useMutation({
    mutationFn: async (data: { projectName: string; specification: string; techStack: TechStackOptions }) => {
      return apiRequest(`/api/wizards/engineering-forge/generate-fullstack`, {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          projectName: data.projectName,
          specification: data.specification,
          techStack: data.techStack,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null); // Detach from previous stream
      setThinkingSteps([]);
      setToolCalls([]);
      setOrchestrationStatus({ status: 'running', message: 'Starting full-stack application generation...' });
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Engineering Forge] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      setOrchestrationStatus({ status: 'completed', message: 'Full-stack application generated successfully' });
      toast({
        title: 'Application Generated',
        description: `Complete ${data.application?.projectName || 'project'} created`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studios', 'engineering-forge', 'detail', startupId] });
    },
    onError: (error: Error) => {
      setOrchestrationStatus({
        status: 'failed',
        message: error.message || 'Failed to generate full-stack application',
      });
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleExecute = () => {
    if (!specification.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a specification',
        variant: 'destructive',
      });
      return;
    }

    // Execute production mutation - AG-UI state reset and connection handled in onMutate/onSuccess
    if (activeWorkflow === 'frontend') {
      frontendMutation.mutate({ specification, techStack: techStack.frontend });
    } else if (activeWorkflow === 'backend') {
      backendMutation.mutate({ specification, techStack: techStack.backend });
    } else if (activeWorkflow === 'database') {
      databaseMutation.mutate({
        schema: specification,
        databaseType: techStack.database.type,
        orm: techStack.database.orm,
      });
    } else if (activeWorkflow === 'fullstack') {
      if (!projectName.trim()) {
        toast({
          title: 'Missing Information',
          description: 'Please provide a project name',
          variant: 'destructive',
        });
        return;
      }
      fullstackMutation.mutate({ projectName, specification, techStack });
    }
  };

  const isExecuting = frontendMutation.isPending || backendMutation.isPending || 
                     databaseMutation.isPending || fullstackMutation.isPending;

  return (
    <StudioReadinessGate studioId="engineering-forge" startupId={startupId}>
      <StudioBaseUI
      studioName="Engineering Forge"
      studioDescription={studioMessaging?.tagline || "Transform your product vision into production-ready code. Get a complete technical foundation built by expert AI agents."}
      studioIcon={<Code className="h-6 w-6" />}
      tasks={studioData?.tasks || []}
      artifacts={studioData?.artifacts || []}
    >
      <div className="space-y-6">
        {/* What You'll Create Section */}
        {studioMessaging && (
          <StudioOutcomesSection
            outcomes={studioMessaging.outcomes}
            title={SECTION_LABELS.OUTCOMES}
          />
        )}

        <div className="flex items-center gap-4">
          <Code className="h-8 w-8 text-purple-500" />
          <div>
            <h2 className="text-2xl font-bold">Build Your MVP</h2>
            <p className="text-foreground-secondary">Transform your product vision into production-ready code with AI-powered development</p>
          </div>
        </div>

        <Tabs value={activeWorkflow} onValueChange={(v) => setActiveWorkflow(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="frontend" data-testid="tab-frontend">
              <Layers className="h-4 w-4 mr-2" />
              Frontend
            </TabsTrigger>
            <TabsTrigger value="backend" data-testid="tab-backend">
              <Database className="h-4 w-4 mr-2" />
              Backend
            </TabsTrigger>
            <TabsTrigger value="database" data-testid="tab-database">
              <Database className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="fullstack" data-testid="tab-fullstack">
              <Rocket className="h-4 w-4 mr-2" />
              Full-Stack
            </TabsTrigger>
          </TabsList>

          <TabsContent value="frontend" className="space-y-4">
            <GlassmorphicCard className="">
              <CardHeader>
                <CardTitle>Frontend Code Generation</CardTitle>
                <CardDescription>Generate production-ready frontend code with your chosen stack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Framework</Label>
                    <Select value={techStack.frontend.framework} onValueChange={(v) => setTechStack({ ...techStack, frontend: { ...techStack.frontend, framework: v } })}>
                      <SelectTrigger data-testid="select-frontend-framework">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="React">React</SelectItem>
                        <SelectItem value="Vue">Vue</SelectItem>
                        <SelectItem value="Angular">Angular</SelectItem>
                        <SelectItem value="Svelte">Svelte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Styling</Label>
                    <Select value={techStack.frontend.styling} onValueChange={(v) => setTechStack({ ...techStack, frontend: { ...techStack.frontend, styling: v } })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tailwind CSS">Tailwind CSS</SelectItem>
                        <SelectItem value="styled-components">styled-components</SelectItem>
                        <SelectItem value="CSS Modules">CSS Modules</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Specification</Label>
                  <Textarea
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    placeholder="Describe the frontend you want to build..."
                    className="h-32"
                    data-testid="textarea-frontend-spec"
                  />
                </div>
              </CardContent>
            </GlassmorphicCard>
          </TabsContent>

          <TabsContent value="backend" className="space-y-4">
            <GlassmorphicCard className="">
              <CardHeader>
                <CardTitle>Backend Code Generation</CardTitle>
                <CardDescription>Generate production-ready API and server code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Framework</Label>
                    <Select value={techStack.backend.framework} onValueChange={(v) => setTechStack({ ...techStack, backend: { ...techStack.backend, framework: v } })}>
                      <SelectTrigger data-testid="select-backend-framework">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Express.js">Express.js</SelectItem>
                        <SelectItem value="Fastify">Fastify</SelectItem>
                        <SelectItem value="NestJS">NestJS</SelectItem>
                        <SelectItem value="Django">Django</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Language</Label>
                    <Select value={techStack.backend.language} onValueChange={(v) => setTechStack({ ...techStack, backend: { ...techStack.backend, language: v } })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TypeScript">TypeScript</SelectItem>
                        <SelectItem value="Python">Python</SelectItem>
                        <SelectItem value="Go">Go</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Specification</Label>
                  <Textarea
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    placeholder="Describe the API endpoints and backend logic..."
                    className="h-32"
                    data-testid="textarea-backend-spec"
                  />
                </div>
              </CardContent>
            </GlassmorphicCard>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <GlassmorphicCard className="">
              <CardHeader>
                <CardTitle>Database Schema Generation</CardTitle>
                <CardDescription>Generate database schema and migrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Database Type</Label>
                    <Select value={techStack.database.type} onValueChange={(v) => setTechStack({ ...techStack, database: { ...techStack.database, type: v } })}>
                      <SelectTrigger data-testid="select-database-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                        <SelectItem value="MySQL">MySQL</SelectItem>
                        <SelectItem value="MongoDB">MongoDB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ORM</Label>
                    <Select value={techStack.database.orm} onValueChange={(v) => setTechStack({ ...techStack, database: { ...techStack.database, orm: v } })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Drizzle">Drizzle</SelectItem>
                        <SelectItem value="Prisma">Prisma</SelectItem>
                        <SelectItem value="TypeORM">TypeORM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Database Schema</Label>
                  <Textarea
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    placeholder="Describe the database schema and relationships..."
                    className="h-32"
                    data-testid="textarea-database-schema"
                  />
                </div>
              </CardContent>
            </GlassmorphicCard>
          </TabsContent>

          <TabsContent value="fullstack" className="space-y-4">
            <GlassmorphicCard className="">
              <CardHeader>
                <CardTitle>Full-Stack Application Generation</CardTitle>
                <CardDescription>Generate a complete production-ready application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Project Name</Label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-awesome-app"
                    data-testid="input-project-name"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Frontend</Label>
                    <Badge variant="outline">{techStack.frontend.framework}</Badge>
                  </div>
                  <div>
                    <Label>Backend</Label>
                    <Badge variant="outline">{techStack.backend.framework}</Badge>
                  </div>
                  <div>
                    <Label>Database</Label>
                    <Badge variant="outline">{techStack.database.type}</Badge>
                  </div>
                </div>
                <div>
                  <Label>Application Specification</Label>
                  <Textarea
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    placeholder="Describe the complete application you want to build..."
                    className="h-32"
                    data-testid="textarea-fullstack-spec"
                  />
                </div>
              </CardContent>
            </GlassmorphicCard>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {orchestrationStatus.status === 'running' && (
              <div className="flex items-center gap-2 text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{orchestrationStatus.message}</span>
              </div>
            )}
            {orchestrationStatus.status === 'completed' && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>{orchestrationStatus.message}</span>
              </div>
            )}
            {orchestrationStatus.status === 'failed' && (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-4 w-4" />
                <span>{orchestrationStatus.message}</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-generate-code"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Generate Code
              </>
            )}
          </Button>
        </div>

        {/* AG-UI Real-Time Visualization Panels */}
        {aguiSessionId && (thinkingSteps.length > 0 || toolCalls.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Thinking Steps Panel */}
            <ThinkingStepsPanel steps={thinkingSteps} />
            
            {/* Tool Calls Panel */}
            <ToolCallsPanel toolCalls={toolCalls} />
          </div>
        )}
      </div>
    </StudioBaseUI>
    </StudioReadinessGate>
  );
}

// Lazy load wrapper for routing
const EngineeringForgeWorkspaceLazy = EngineeringForgeWorkspace;
export default EngineeringForgeWorkspaceLazy;
