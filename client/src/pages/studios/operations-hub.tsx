import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import StudioBaseUI from '@/components/studio-base-ui';
import { StudioOutcomesSection } from '@/components/wizards/studio-outcomes-section';
import { getStudioMessaging } from '@/constants/studios/messaging';
import { StudioReadinessGate } from '@/components/studio/StudioReadinessGate';
import { Activity, BarChart3, RefreshCw, Loader2, Users } from 'lucide-react';
import { useAGUIStream } from '@/hooks/use-agui-stream';
import { ThinkingStepsPanel, type ThinkingStep } from '@/components/agui/ThinkingStepsPanel';
import { ToolCallsPanel, type ToolCall } from '@/components/agui/ToolCallsPanel';

// Zod schemas for form validation
const performanceAnalyticsSchema = z.object({
  metricsData: z.string().min(1, "Metrics data is required"),
  timeframe: z.string().optional(),
  focusAreas: z.string().optional(),
  benchmarks: z.string().optional(),
});

const processOptimizationSchema = z.object({
  currentProcesses: z.string().min(1, "Current processes description is required"),
  painPoints: z.string().min(1, "Pain points are required"),
  goals: z.string().optional(),
  constraints: z.string().optional(),
});

const continuousImprovementSchema = z.object({
  feedbackData: z.string().min(1, "Feedback data is required"),
  improvementAreas: z.string().min(1, "Improvement areas are required"),
  successMetrics: z.string().optional(),
  iterationCycle: z.string().optional(),
});

const resourceAllocationSchema = z.object({
  teamSize: z.string().min(1, "Team size is required"),
  currentResources: z.string().min(1, "Current resources description is required"),
  priorities: z.string().optional(),
  budget: z.string().optional(),
});

type PerformanceAnalyticsForm = z.infer<typeof performanceAnalyticsSchema>;
type ProcessOptimizationForm = z.infer<typeof processOptimizationSchema>;
type ContinuousImprovementForm = z.infer<typeof continuousImprovementSchema>;
type ResourceAllocationForm = z.infer<typeof resourceAllocationSchema>;

export default function OperationsHubStudio() {
  const [location] = useLocation();
  const { toast} = useToast();
  const queryParams = new URLSearchParams(window.location.search);
  const startupIdFromUrl = queryParams.get('startupId');
  
  // Get studio messaging configuration
  const studioMessaging = getStudioMessaging('operations-hub');

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionAttempted, setSessionAttempted] = useState(false);
  const [aguiSessionId, setAguiSessionId] = useState<string | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

  useAGUIStream(aguiSessionId, {
    includeHistory: true,
    reconnect: true,
    maxReconnectAttempts: 3,
    onEvent: (event) => {
      if (event.type === 'agent:thinking' && event.data.step) {
        const stepId = event.data.step.id || `${Date.now()}-${Math.random()}`;
        setThinkingSteps(prev => !prev.find(s => s.id === stepId) ? [...prev, { ...event.data.step, id: stepId }] : prev);
      } else if (event.type === 'tool:call') {
        setToolCalls(prev => [...prev, { id: event.data.callId, name: event.data.toolName, arguments: event.data.arguments, status: 'running', timestamp: new Date() }]);
      } else if (event.type === 'tool:result') {
        setToolCalls(prev => prev.map(tc => tc.id === event.data.callId ? { ...tc, result: event.data.result, status: 'success' } : tc));
      } else if (event.type === 'agent:complete') {
        setToolCalls(prev => prev.map(tc => tc.status === 'running' ? { ...tc, status: 'success' } : tc));
      }
    },
  });

  // Form setup with react-hook-form and zodResolver
  const performanceForm = useForm<PerformanceAnalyticsForm>({
    resolver: zodResolver(performanceAnalyticsSchema),
    defaultValues: {
      metricsData: '',
      timeframe: '',
      focusAreas: '',
      benchmarks: '',
    },
  });

  const processForm = useForm<ProcessOptimizationForm>({
    resolver: zodResolver(processOptimizationSchema),
    defaultValues: {
      currentProcesses: '',
      painPoints: '',
      goals: '',
      constraints: '',
    },
  });

  const improvementForm = useForm<ContinuousImprovementForm>({
    resolver: zodResolver(continuousImprovementSchema),
    defaultValues: {
      feedbackData: '',
      improvementAreas: '',
      successMetrics: '',
      iterationCycle: '',
    },
  });

  const resourceForm = useForm<ResourceAllocationForm>({
    resolver: zodResolver(resourceAllocationSchema),
    defaultValues: {
      teamSize: '',
      currentResources: '',
      priorities: '',
      budget: '',
    },
  });

  // Get startups data
  const { data: startups, isLoading: startupsLoading } = useQuery({
    queryKey: ['/api/wizards/startups'],
  });

  const startupId = startupIdFromUrl ? parseInt(startupIdFromUrl) : startups?.[0]?.id;

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!startupId) {
        throw new Error('No startup selected');
      }
      return await apiRequest('/api/wizards/sessions', {
        method: 'POST',
        body: JSON.stringify({
          studioId: 'operations-hub',
          wizardsStartupId: startupId,
        }),
      });
    },
    onSuccess: (data) => {
      setSessionId(data.session.id);
      setSessionAttempted(true);
    },
    onError: (error: any) => {
      setSessionAttempted(true);
      toast({
        title: 'Session Creation Failed',
        description: error.message || 'Failed to create studio session',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (startupId && !sessionId && !sessionAttempted) {
      createSessionMutation.mutate();
    }
  }, [startupId]);

  // Performance Analytics Mutation
  const generatePerformanceAnalyticsMutation = useMutation({
    mutationFn: async (data: PerformanceAnalyticsForm) => {
      if (!startupId) {
        throw new Error('Startup not initialized');
      }
      return await apiRequest(`/api/wizards/operations-hub/generate-performance-analytics`, {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          ...data,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      toast({
        title: 'Performance Analytics Generated',
        description: 'Your performance analysis report has been created successfully',
      });
      performanceForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate performance analytics',
        variant: 'destructive',
      });
    },
  });

  // Process Optimization Mutation
  const generateProcessOptimizationMutation = useMutation({
    mutationFn: async (data: ProcessOptimizationForm) => {
      if (!startupId) {
        throw new Error('Startup not initialized');
      }
      return await apiRequest(`/api/wizards/operations-hub/generate-process-optimization`, {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          ...data,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      toast({
        title: 'Process Optimization Generated',
        description: 'Your process optimization plan has been created successfully',
      });
      processForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate process optimization',
        variant: 'destructive',
      });
    },
  });

  // Continuous Improvement Mutation
  const generateContinuousImprovementMutation = useMutation({
    mutationFn: async (data: ContinuousImprovementForm) => {
      if (!startupId) {
        throw new Error('Startup not initialized');
      }
      return await apiRequest(`/api/wizards/operations-hub/generate-continuous-improvement`, {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          ...data,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      toast({
        title: 'Improvement Framework Generated',
        description: 'Your continuous improvement framework has been created successfully',
      });
      improvementForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate continuous improvement framework',
        variant: 'destructive',
      });
    },
  });

  // Resource Allocation Mutation
  const generateResourceAllocationMutation = useMutation({
    mutationFn: async (data: ResourceAllocationForm) => {
      if (!startupId) {
        throw new Error('Startup not initialized');
      }
      return await apiRequest(`/api/wizards/operations-hub/generate-resource-allocation`, {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          ...data,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      toast({
        title: 'Resource Allocation Generated',
        description: 'Your resource allocation plan has been created successfully',
      });
      resourceForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate resource allocation plan',
        variant: 'destructive',
      });
    },
  });

  // Loading state
  if (startupsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" data-testid="loader-startups" />
      </div>
    );
  }

  // No startup state
  if (!startupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-lg mb-4" data-testid="text-no-startup">No startup found</p>
          <Button 
            onClick={() => window.location.href = '/founder/dashboard'}
            data-testid="button-go-dashboard"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Session creation loading
  if (!sessionId && createSessionMutation.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" data-testid="loader-session-init" />
          <p className="text-foreground" data-testid="text-session-loading">Initializing Operations Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <StudioReadinessGate studioId="operations-hub" startupId={startupId}>
      <StudioBaseUI
      studioTitle="Operations Hub"
      studioDescription={studioMessaging.tagline}
      studioIcon={Activity}
    >
      {/* Studio Outcomes Section */}
      <StudioOutcomesSection 
        outcomes={studioMessaging.outcomes}
        className="mb-8"
      />

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass border-b border-teal-900/30">
          <TabsTrigger 
            value="performance"
            data-testid="tab-performance-analytics"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-foreground"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="process"
            data-testid="tab-process-optimization"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-foreground"
          >
            <Activity className="w-4 h-4 mr-2" />
            Process Optimization
          </TabsTrigger>
          <TabsTrigger 
            value="improvement"
            data-testid="tab-continuous-improvement"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Continuous Improvement
          </TabsTrigger>
          <TabsTrigger 
            value="resources"
            data-testid="tab-resource-allocation"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-foreground"
          >
            <Users className="w-4 h-4 mr-2" />
            Resource Allocation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6 space-y-6">
          <Form {...performanceForm}>
            <form onSubmit={performanceForm.handleSubmit((data) => {
              generatePerformanceAnalyticsMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={performanceForm.control}
                name="metricsData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Metrics Data</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-metrics-data"
                        placeholder="Describe your current metrics (revenue, users, performance indicators, etc.)"
                        className="glass border-teal-900/30 text-foreground"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={performanceForm.control}
                name="timeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Timeframe (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-timeframe"
                        placeholder="e.g., Last 30 days, Q4 2024"
                        className="glass border-teal-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={performanceForm.control}
                name="focusAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Focus Areas (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-focus-areas"
                        placeholder="e.g., User acquisition, revenue growth, system performance"
                        className="glass border-teal-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={performanceForm.control}
                name="benchmarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Benchmarks (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-benchmarks"
                        placeholder="e.g., Industry averages, competitor performance"
                        className="glass border-teal-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={generatePerformanceAnalyticsMutation.isPending}
                className="w-full bg-teal-600 hover:bg-teal-700 text-foreground"
                data-testid="button-generate-performance"
              >
                {generatePerformanceAnalyticsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Generate Performance Analytics'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="process" className="mt-6 space-y-6">
          <Form {...processForm}>
            <form onSubmit={processForm.handleSubmit((data) => {
              generateProcessOptimizationMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={processForm.control}
                name="currentProcesses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Current Processes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-current-processes"
                        placeholder="Describe your current business processes and workflows"
                        className="glass border-teal-900/30 text-foreground"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={processForm.control}
                name="painPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Pain Points</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-pain-points"
                        placeholder="What are the main challenges and bottlenecks in your current processes?"
                        className="glass border-teal-900/30 text-foreground"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={processForm.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Optimization Goals (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-goals"
                        placeholder="What do you want to achieve? (e.g., reduce costs, increase efficiency)"
                        className="glass border-teal-900/30 text-foreground"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={processForm.control}
                name="constraints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Constraints (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-constraints"
                        placeholder="e.g., Budget limitations, team size, technical debt"
                        className="glass border-teal-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={generateProcessOptimizationMutation.isPending}
                className="w-full bg-teal-600 hover:bg-teal-700 text-foreground"
                data-testid="button-generate-process"
              >
                {generateProcessOptimizationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  'Generate Optimization Plan'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="improvement" className="mt-6 space-y-6">
          <Form {...improvementForm}>
            <form onSubmit={improvementForm.handleSubmit((data) => {
              generateContinuousImprovementMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={improvementForm.control}
                name="feedbackData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Feedback Data</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-feedback-data"
                        placeholder="User feedback, stakeholder input, team insights"
                        className="glass border-teal-900/30 text-foreground"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={improvementForm.control}
                name="improvementAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Improvement Areas</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-improvement-areas"
                        placeholder="What aspects need improvement? (product quality, UX, operations, etc.)"
                        className="glass border-teal-900/30 text-foreground"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={improvementForm.control}
                name="successMetrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Success Metrics (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-success-metrics"
                        placeholder="e.g., Customer satisfaction score, NPS, efficiency gains"
                        className="glass border-teal-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={improvementForm.control}
                name="iterationCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Iteration Cycle (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-iteration-cycle"
                        placeholder="e.g., Weekly sprints, monthly reviews"
                        className="glass border-teal-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={generateContinuousImprovementMutation.isPending}
                className="w-full bg-teal-600 hover:bg-teal-700 text-foreground"
                data-testid="button-generate-improvement"
              >
                {generateContinuousImprovementMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Framework...
                  </>
                ) : (
                  'Generate Improvement Framework'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="resources" className="mt-6 space-y-6">
          <Form {...resourceForm}>
            <form onSubmit={resourceForm.handleSubmit((data) => {
              generateResourceAllocationMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={resourceForm.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Team Size</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-team-size"
                        placeholder="e.g., 5 developers, 2 designers, 1 PM"
                        className="glass border-teal-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={resourceForm.control}
                name="currentResources"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Current Resources</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-current-resources"
                        placeholder="Describe your current team allocation, tools, and infrastructure"
                        className="glass border-teal-900/30 text-foreground"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={resourceForm.control}
                name="priorities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Priorities (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-priorities"
                        placeholder="What are your key priorities? (features, quality, speed, etc.)"
                        className="glass border-teal-900/30 text-foreground"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={resourceForm.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Budget (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-budget"
                        placeholder="e.g., $50k/month, $200k total"
                        className="glass border-teal-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={generateResourceAllocationMutation.isPending}
                className="w-full bg-teal-600 hover:bg-teal-700 text-foreground"
                data-testid="button-generate-resources"
              >
                {generateResourceAllocationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Allocating...
                  </>
                ) : (
                  'Generate Allocation Plan'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      {aguiSessionId && (thinkingSteps.length > 0 || toolCalls.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <ThinkingStepsPanel steps={thinkingSteps} />
          <ToolCallsPanel toolCalls={toolCalls} />
        </div>
      )}
    </StudioBaseUI>
    </StudioReadinessGate>
  );
}
