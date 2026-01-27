import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import StudioBaseUI from '@/components/studio-base-ui';
import { Map, FileText, Code, Loader2, BookOpen } from 'lucide-react';
import { useAGUIStream } from '@/hooks/use-agui-stream';
import { ThinkingStepsPanel, type ThinkingStep } from '@/components/agui/ThinkingStepsPanel';
import { ToolCallsPanel, type ToolCall } from '@/components/agui/ToolCallsPanel';
import type { AGUIThinkingEvent, AGUIToolCallEvent, AGUIToolResultEvent } from '@shared/agui-event-types';
import { StudioOutcomesSection } from '@/components/wizards/studio-outcomes-section';
import { getStudioMessaging, getStudioCTA, SECTION_LABELS } from '@/constants/studios/messaging';
import { StudioReadinessGate } from '@/components/studio/StudioReadinessGate';

export default function ProductBlueprintStudio() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Get studio messaging configuration
  const studioMessaging = getStudioMessaging('product-blueprint');
  const queryParams = new URLSearchParams(window.location.search);
  const startupIdFromUrl = queryParams.get('startupId');

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionAttempted, setSessionAttempted] = useState(false);

  // Form states for different workflows
  const [roadmapForm, setRoadmapForm] = useState({
    productVision: '',
    targetUsers: '',
    timeframe: '',
    constraints: '',
  });

  const [storiesForm, setStoriesForm] = useState({
    featureDescription: '',
    userType: '',
    requirements: '',
  });

  const [specsForm, setSpecsForm] = useState({
    productDescription: '',
    technicalConstraints: '',
    scalabilityNeeds: '',
  });

  const [prdForm, setPrdForm] = useState({
    productOverview: '',
    targetMarket: '',
    keyFeatures: '',
    successMetrics: '',
  });

  // AG-UI streaming state
  const [aguiSessionId, setAguiSessionId] = useState<string | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

  useAGUIStream(aguiSessionId, {
    includeHistory: true,
    reconnect: true,
    onEvent: (event) => {
      if (event.type === 'agent:thinking') {
        const thinkingEvent = event as AGUIThinkingEvent;
        setThinkingSteps(prev => {
          const stepId = `${thinkingEvent.agentId}-${thinkingEvent.timestamp}`;
          if (prev.some(s => s.id === stepId)) return prev;
          const updatedPrev = prev.map(s => ({...s, status: 'completed' as const, duration: s.duration || (Date.now() - s.timestamp)}));
          return [...updatedPrev, {id: stepId, title: thinkingEvent.step || 'Thinking...', content: thinkingEvent.thought, timestamp: thinkingEvent.timestamp, status: 'active'}];
        });
      }
      if (event.type === 'tool:call') {
        const e = event as AGUIToolCallEvent;
        setToolCalls(prev => [...prev, {id: e.toolCallId, toolName: e.tool, parameters: e.parameters, timestamp: e.timestamp, status: 'pending'}]);
      }
      if (event.type === 'tool:result') {
        const e = event as AGUIToolResultEvent;
        setToolCalls(prev => prev.map(c => c.id === e.toolCallId ? {...c, status: e.success ? 'success' : 'error', result: e.success ? e.result : undefined, error: !e.success ? e.error : undefined, duration: e.timestamp - c.timestamp} : c));
      }
      if (event.type === 'agent:complete') {
        setThinkingSteps(prev => prev.map(s => ({...s, status: 'completed', duration: s.duration || (Date.now() - s.timestamp)})));
      }
    }
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
      return await apiRequest('/api/wizards/studios/product-blueprint/sessions', {
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

  // Feature Roadmap Mutation
  const roadmapMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/product-blueprint/generate-roadmap', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          productVision: roadmapForm.productVision,
          targetUsers: roadmapForm.targetUsers,
          timeframe: roadmapForm.timeframe,
          constraints: roadmapForm.constraints,
        }),
      });
    },
    onMutate: () => {
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Product Blueprint] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }

      toast({
        title: 'Roadmap Generated',
        description: 'Feature roadmap has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate feature roadmap',
        variant: 'destructive',
      });
    },
  });

  // User Stories Mutation
  const storiesMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/product-blueprint/generate-user-stories', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          featureDescription: storiesForm.featureDescription,
          userType: storiesForm.userType,
          requirements: storiesForm.requirements,
        }),
      });
    },
    onMutate: () => {
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Product Blueprint] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }

      toast({
        title: 'Stories Generated',
        description: 'User stories have been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate user stories',
        variant: 'destructive',
      });
    },
  });

  // Technical Specs Mutation
  const specsMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/product-blueprint/generate-specs', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          productDescription: specsForm.productDescription,
          technicalConstraints: specsForm.technicalConstraints,
          scalabilityNeeds: specsForm.scalabilityNeeds,
        }),
      });
    },
    onMutate: () => {
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Product Blueprint] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }

      toast({
        title: 'Specs Generated',
        description: 'Technical specifications have been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate technical specs',
        variant: 'destructive',
      });
    },
  });

  // PRD Generation Mutation
  const prdMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/product-blueprint/generate-prd', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          productOverview: prdForm.productOverview,
          targetMarket: prdForm.targetMarket,
          keyFeatures: prdForm.keyFeatures,
          successMetrics: prdForm.successMetrics,
        }),
      });
    },
    onMutate: () => {
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      } else {
        console.warn('[Product Blueprint] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }

      toast({
        title: 'PRD Generated',
        description: 'Product Requirements Document has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate PRD',
        variant: 'destructive',
      });
    },
  });

  // Loading state
  if (startupsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // No startup state
  if (!startupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-lg mb-4">No startup found</p>
          <Button onClick={() => window.location.href = '/founder/dashboard'}>
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
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-foreground">Initializing Product Blueprint Studio...</p>
        </div>
      </div>
    );
  }

  // Session error state
  if (!sessionId && sessionAttempted && createSessionMutation.isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-lg mb-4">Failed to initialize studio session</p>
          <Button 
            onClick={() => {
              setSessionAttempted(true);
              createSessionMutation.mutate();
            }}
            data-testid="button-retry-session"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StudioReadinessGate studioId="product-blueprint" startupId={startupId}>
      <StudioBaseUI
      studioId="product-blueprint"
      studioName="Product Blueprint"
      studioDescription={studioMessaging?.tagline || "Design your product roadmap. Define features, user stories, and build your MVP scope."}
      startupId={startupId}
      sessionId={sessionId!}
    >
      {/* What You'll Create Section */}
      {studioMessaging && (
        <StudioOutcomesSection
          outcomes={studioMessaging.outcomes}
          title={SECTION_LABELS.OUTCOMES}
        />
      )}
      
      <Tabs defaultValue="roadmap" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-card">
          <TabsTrigger value="roadmap" className="data-[state=active]:bg-purple-600">
            <Map className="h-4 w-4 mr-2" />
            Feature Roadmap
          </TabsTrigger>
          <TabsTrigger value="stories" className="data-[state=active]:bg-purple-600">
            <FileText className="h-4 w-4 mr-2" />
            User Stories
          </TabsTrigger>
          <TabsTrigger value="specs" className="data-[state=active]:bg-purple-600">
            <Code className="h-4 w-4 mr-2" />
            Technical Specs
          </TabsTrigger>
          <TabsTrigger value="prd" className="data-[state=active]:bg-purple-600">
            <BookOpen className="h-4 w-4 mr-2" />
            PRD
          </TabsTrigger>
        </TabsList>

        {/* Feature Roadmap Tab */}
        <TabsContent value="roadmap" className="mt-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="product-vision" className="text-foreground">Product Vision</Label>
              <Textarea
                id="product-vision"
                data-testid="input-product-vision"
                placeholder="What is your product vision and goals?"
                value={roadmapForm.productVision}
                onChange={(e) => setRoadmapForm({ ...roadmapForm, productVision: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="target-users" className="text-foreground">Target Users</Label>
              <Input
                id="target-users"
                data-testid="input-target-users"
                placeholder="Who are your target users?"
                value={roadmapForm.targetUsers}
                onChange={(e) => setRoadmapForm({ ...roadmapForm, targetUsers: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="timeframe" className="text-foreground">Development Timeframe</Label>
              <Input
                id="timeframe"
                data-testid="input-timeframe"
                placeholder="e.g., 3 months, 6 months"
                value={roadmapForm.timeframe}
                onChange={(e) => setRoadmapForm({ ...roadmapForm, timeframe: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="constraints" className="text-foreground">Constraints (Optional)</Label>
              <Textarea
                id="constraints"
                data-testid="input-constraints"
                placeholder="Any technical or business constraints?"
                value={roadmapForm.constraints}
                onChange={(e) => setRoadmapForm({ ...roadmapForm, constraints: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <Button
              data-testid="button-generate-roadmap"
              onClick={() => roadmapMutation.mutate()}
              disabled={!sessionId || !roadmapForm.productVision || roadmapMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {roadmapMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Feature Roadmap'
              )}
            </Button>
          </div>
        </TabsContent>

        {/* User Stories Tab */}
        <TabsContent value="stories" className="mt-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="feature-description" className="text-foreground">Feature Description</Label>
              <Textarea
                id="feature-description"
                data-testid="input-feature-description"
                placeholder="Describe the feature you want user stories for"
                value={storiesForm.featureDescription}
                onChange={(e) => setStoriesForm({ ...storiesForm, featureDescription: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="user-type" className="text-foreground">User Type</Label>
              <Input
                id="user-type"
                data-testid="input-user-type"
                placeholder="e.g., End User, Admin, Developer"
                value={storiesForm.userType}
                onChange={(e) => setStoriesForm({ ...storiesForm, userType: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="requirements" className="text-foreground">Requirements (Optional)</Label>
              <Textarea
                id="requirements"
                data-testid="input-requirements"
                placeholder="Any specific requirements or acceptance criteria?"
                value={storiesForm.requirements}
                onChange={(e) => setStoriesForm({ ...storiesForm, requirements: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <Button
              data-testid="button-generate-stories"
              onClick={() => storiesMutation.mutate()}
              disabled={!sessionId || !storiesForm.featureDescription || storiesMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {storiesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate User Stories'
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Technical Specs Tab */}
        <TabsContent value="specs" className="mt-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="product-description" className="text-foreground">Product Description</Label>
              <Textarea
                id="product-description"
                data-testid="input-product-description"
                placeholder="Describe your product and its core functionality"
                value={specsForm.productDescription}
                onChange={(e) => setSpecsForm({ ...specsForm, productDescription: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="technical-constraints" className="text-foreground">Technical Constraints (Optional)</Label>
              <Textarea
                id="technical-constraints"
                data-testid="input-technical-constraints"
                placeholder="Any technical constraints or requirements?"
                value={specsForm.technicalConstraints}
                onChange={(e) => setSpecsForm({ ...specsForm, technicalConstraints: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="scalability-needs" className="text-foreground">Scalability Needs (Optional)</Label>
              <Textarea
                id="scalability-needs"
                data-testid="input-scalability-needs"
                placeholder="Expected scale and performance requirements"
                value={specsForm.scalabilityNeeds}
                onChange={(e) => setSpecsForm({ ...specsForm, scalabilityNeeds: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <Button
              data-testid="button-generate-specs"
              onClick={() => specsMutation.mutate()}
              disabled={!sessionId || !specsForm.productDescription || specsMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {specsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Technical Specs'
              )}
            </Button>
          </div>
        </TabsContent>

        {/* PRD Tab */}
        <TabsContent value="prd" className="mt-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="product-overview" className="text-foreground">Product Overview</Label>
              <Textarea
                id="product-overview"
                data-testid="input-product-overview"
                placeholder="Provide a comprehensive overview of your product"
                value={prdForm.productOverview}
                onChange={(e) => setPrdForm({ ...prdForm, productOverview: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="target-market" className="text-foreground">Target Market</Label>
              <Textarea
                id="target-market"
                data-testid="input-target-market"
                placeholder="Describe your target market and customer segments"
                value={prdForm.targetMarket}
                onChange={(e) => setPrdForm({ ...prdForm, targetMarket: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="key-features" className="text-foreground">Key Features</Label>
              <Textarea
                id="key-features"
                data-testid="input-key-features"
                placeholder="List the key features and capabilities"
                value={prdForm.keyFeatures}
                onChange={(e) => setPrdForm({ ...prdForm, keyFeatures: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="success-metrics" className="text-foreground">Success Metrics (Optional)</Label>
              <Textarea
                id="success-metrics"
                data-testid="input-success-metrics"
                placeholder="Define success metrics and KPIs"
                value={prdForm.successMetrics}
                onChange={(e) => setPrdForm({ ...prdForm, successMetrics: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <Button
              data-testid="button-generate-prd"
              onClick={() => prdMutation.mutate()}
              disabled={!sessionId || !prdForm.productOverview || prdMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {prdMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate PRD'
              )}
            </Button>
          </div>
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
