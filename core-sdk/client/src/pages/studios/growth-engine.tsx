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
import { TrendingUp, Target, Zap, Loader2 } from 'lucide-react';
import { useAGUIStream } from '@/hooks/use-agui-stream';
import { ThinkingStepsPanel, type ThinkingStep } from '@/components/agui/ThinkingStepsPanel';
import { ToolCallsPanel, type ToolCall } from '@/components/agui/ToolCallsPanel';

// Zod schemas for form validation
const marketingStrategySchema = z.object({
  targetMarket: z.string().min(1, "Target market is required"),
  channels: z.string().min(1, "Marketing channels are required"),
  budget: z.string().min(1, "Budget is required"),
  goals: z.string().min(1, "Growth goals are required"),
});

const seoOptimizationSchema = z.object({
  keywords: z.string().min(1, "Target keywords are required"),
  competitors: z.string().optional(),
  contentStrategy: z.string().optional(),
  technicalRequirements: z.string().optional(),
});

const growthHackingSchema = z.object({
  productType: z.string().min(1, "Product type is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  viralGoals: z.string().optional(),
  experimentBudget: z.string().optional(),
});

const contentMarketingSchema = z.object({
  contentType: z.string().min(1, "Content type is required"),
  audience: z.string().min(1, "Target audience is required"),
  topics: z.string().optional(),
  distribution: z.string().optional(),
});

type MarketingStrategyForm = z.infer<typeof marketingStrategySchema>;
type SEOOptimizationForm = z.infer<typeof seoOptimizationSchema>;
type GrowthHackingForm = z.infer<typeof growthHackingSchema>;
type ContentMarketingForm = z.infer<typeof contentMarketingSchema>;

export default function GrowthEngineStudio() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(window.location.search);
  const startupIdFromUrl = queryParams.get('startupId');
  
  // Get studio messaging configuration
  const studioMessaging = getStudioMessaging('growth-engine');

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
  const marketingForm = useForm<MarketingStrategyForm>({
    resolver: zodResolver(marketingStrategySchema),
    defaultValues: {
      targetMarket: '',
      channels: '',
      budget: '',
      goals: '',
    },
  });

  const seoForm = useForm<SEOOptimizationForm>({
    resolver: zodResolver(seoOptimizationSchema),
    defaultValues: {
      keywords: '',
      competitors: '',
      contentStrategy: '',
      technicalRequirements: '',
    },
  });

  const growthHackingForm = useForm<GrowthHackingForm>({
    resolver: zodResolver(growthHackingSchema),
    defaultValues: {
      productType: '',
      targetAudience: '',
      viralGoals: '',
      experimentBudget: '',
    },
  });

  const contentMarketingForm = useForm<ContentMarketingForm>({
    resolver: zodResolver(contentMarketingSchema),
    defaultValues: {
      contentType: '',
      audience: '',
      topics: '',
      distribution: '',
    },
  });

  // Get startups data
  const { data: startups, isLoading: startupsLoading } = useQuery({
    queryKey: ['/api/wizards/startups'],
  });

  const startupId = startupIdFromUrl 
    ? parseInt(startupIdFromUrl) 
    : startups?.[0]?.id;

  // Session creation mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/wizards/studios/growth-engine/sessions', {
        method: 'POST',
        body: JSON.stringify({ startupId }),
      });
    },
    onSuccess: (data) => {
      setSessionId(data.id);
    },
    onError: (error: any) => {
      toast({
        title: 'Session Error',
        description: error.message || 'Failed to initialize studio session',
        variant: 'destructive',
      });
    },
  });

  // Handle session creation when startupId changes
  useEffect(() => {
    if (!startupId) return;

    // Reset session state when startupId changes
    setSessionId(null);
    setSessionAttempted(true);

    // Create session for new startup
    createSessionMutation.mutate();
  }, [startupId]);

  // Marketing Strategy Mutation
  const marketingMutation = useMutation({
    mutationFn: async (data: MarketingStrategyForm) => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest(`/api/wizards/growth-engine/sessions/${sessionId}/workflows/marketing-strategy`, {
        method: 'POST',
        body: JSON.stringify({
          startupContext: data,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null); // Detach from previous stream
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Growth Engine] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      toast({
        title: 'Marketing Strategy Generated',
        description: 'Your growth marketing strategy has been created successfully',
      });
      marketingForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate marketing strategy',
        variant: 'destructive',
      });
    },
  });

  // SEO Optimization Mutation
  const seoMutation = useMutation({
    mutationFn: async (data: SEOOptimizationForm) => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest(`/api/wizards/growth-engine/sessions/${sessionId}/workflows/seo-optimization`, {
        method: 'POST',
        body: JSON.stringify({
          startupContext: data,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null); // Detach from previous stream
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Growth Engine] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      toast({
        title: 'SEO Plan Generated',
        description: 'Your SEO optimization plan has been created successfully',
      });
      seoForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate SEO plan',
        variant: 'destructive',
      });
    },
  });

  // Growth Hacking Mutation
  const growthHackingMutation = useMutation({
    mutationFn: async (data: GrowthHackingForm) => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest(`/api/wizards/growth-engine/sessions/${sessionId}/workflows/growth-hacking`, {
        method: 'POST',
        body: JSON.stringify({
          startupContext: data,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null); // Detach from previous stream
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Growth Engine] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      toast({
        title: 'Growth Tactics Generated',
        description: 'Your growth hacking playbook has been created successfully',
      });
      growthHackingForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate growth tactics',
        variant: 'destructive',
      });
    },
  });

  // Content Marketing Mutation
  const contentMarketingMutation = useMutation({
    mutationFn: async (data: ContentMarketingForm) => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest(`/api/wizards/growth-engine/sessions/${sessionId}/workflows/content-marketing`, {
        method: 'POST',
        body: JSON.stringify({
          startupContext: data,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null); // Detach from previous stream
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Growth Engine] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      toast({
        title: 'Content Marketing Plan Generated',
        description: 'Your content marketing strategy has been created successfully',
      });
      contentMarketingForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate content marketing plan',
        variant: 'destructive',
      });
    },
  });

  // Loading state
  if (startupsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" data-testid="loader-startups" />
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
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" data-testid="loader-session-init" />
          <p className="text-foreground" data-testid="text-session-loading">Initializing Growth Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <StudioReadinessGate studioId="growth-engine" startupId={startupId}>
      <StudioBaseUI
      studioTitle="Growth Engine"
      studioDescription={studioMessaging.tagline}
      studioIcon={TrendingUp}
    >
      {/* Studio Outcomes Section */}
      <StudioOutcomesSection 
        outcomes={studioMessaging.outcomes}
        className="mb-8"
      />

      <Tabs defaultValue="marketing" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass border-b border-purple-900/30">
          <TabsTrigger 
            value="marketing"
            data-testid="tab-marketing-strategy"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-foreground"
          >
            <Target className="w-4 h-4 mr-2" />
            Marketing Strategy
          </TabsTrigger>
          <TabsTrigger 
            value="seo"
            data-testid="tab-seo-optimization"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-foreground"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            SEO Optimization
          </TabsTrigger>
          <TabsTrigger 
            value="growth-hacking"
            data-testid="tab-growth-hacking"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-foreground"
          >
            <Zap className="w-4 h-4 mr-2" />
            Growth Hacking
          </TabsTrigger>
          <TabsTrigger 
            value="content-marketing"
            data-testid="tab-content-marketing"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-foreground"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Content Marketing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketing" className="mt-6 space-y-6">
          <Form {...marketingForm}>
            <form onSubmit={marketingForm.handleSubmit((data) => {
              marketingMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={marketingForm.control}
                name="targetMarket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Target Market</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-target-market"
                        placeholder="e.g., B2B SaaS founders, small businesses, developers"
                        className="glass border-purple-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={marketingForm.control}
                name="channels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Marketing Channels</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-channels"
                        placeholder="e.g., Content marketing, social media, paid ads"
                        className="glass border-purple-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={marketingForm.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Monthly Budget</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-budget"
                        placeholder="e.g., $5,000/month"
                        className="glass border-purple-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={marketingForm.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Growth Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-goals"
                        placeholder="Describe your growth goals and KPIs"
                        className="glass border-purple-900/30 text-foreground"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={marketingMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-foreground"
                data-testid="button-generate-marketing"
              >
                {marketingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Marketing Strategy'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="seo" className="mt-6 space-y-6">
          <Form {...seoForm}>
            <form onSubmit={seoForm.handleSubmit((data) => {
              seoMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={seoForm.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Target Keywords</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-keywords"
                        placeholder="e.g., SaaS startup, MVP development, AI tools"
                        className="glass border-purple-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={seoForm.control}
                name="competitors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Competitors (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-competitors"
                        placeholder="e.g., competitor1.com, competitor2.com"
                        className="glass border-purple-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={seoForm.control}
                name="contentStrategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Content Strategy (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-content-strategy"
                        placeholder="Describe your content marketing goals and themes"
                        className="glass border-purple-900/30 text-foreground"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={seoForm.control}
                name="technicalRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Technical Requirements (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-technical-requirements"
                        placeholder="Any specific SEO technical requirements or constraints"
                        className="glass border-purple-900/30 text-foreground"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={seoMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-foreground"
                data-testid="button-generate-seo"
              >
                {seoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate SEO Plan'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="growth-hacking" className="mt-6 space-y-6">
          <Form {...growthHackingForm}>
            <form onSubmit={growthHackingForm.handleSubmit((data) => {
              growthHackingMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={growthHackingForm.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Product Type</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-product-type"
                        placeholder="e.g., SaaS platform, mobile app, marketplace"
                        className="glass border-purple-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={growthHackingForm.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Target Audience</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-target-audience"
                        placeholder="e.g., Tech-savvy millennials, startup founders"
                        className="glass border-purple-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={growthHackingForm.control}
                name="viralGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Viral Growth Goals (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-viral-goals"
                        placeholder="What viral mechanisms do you want to explore?"
                        className="glass border-purple-900/30 text-foreground"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={growthHackingForm.control}
                name="experimentBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Experiment Budget (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-experiment-budget"
                        placeholder="e.g., $2,000 for growth experiments"
                        className="glass border-purple-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={growthHackingMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-foreground"
                data-testid="button-generate-growth-hacking"
              >
                {growthHackingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Growth Tactics'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="content-marketing" className="mt-6 space-y-6">
          <Form {...contentMarketingForm}>
            <form onSubmit={contentMarketingForm.handleSubmit((data) => {
              contentMarketingMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={contentMarketingForm.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Content Type</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-content-type"
                        placeholder="e.g., Blog posts, videos, podcasts, infographics"
                        className="glass border-purple-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={contentMarketingForm.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Target Audience</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-content-audience"
                        placeholder="e.g., Tech professionals, entrepreneurs, developers"
                        className="glass border-purple-900/30 text-foreground"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={contentMarketingForm.control}
                name="topics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Content Topics (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-content-topics"
                        placeholder="What topics do you want to cover in your content?"
                        className="glass border-purple-900/30 text-foreground"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={contentMarketingForm.control}
                name="distribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Distribution Channels (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-content-distribution"
                        placeholder="e.g., Social media, email newsletter, website blog"
                        className="glass border-purple-900/30 text-foreground"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={contentMarketingMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-foreground"
                data-testid="button-generate-content-marketing"
              >
                {contentMarketingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Content Marketing Plan'
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
