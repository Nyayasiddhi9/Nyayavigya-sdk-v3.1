import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import StudioBaseUI from '@/components/studio-base-ui';
import { StudioOutcomesSection } from '@/components/wizards/studio-outcomes-section';
import { getStudioMessaging } from '@/constants/studios/messaging';
import { StudioReadinessGate } from '@/components/studio/StudioReadinessGate';
import { TrendingUp, Users, Target, Loader2, BarChart3 } from 'lucide-react';
import { useAGUIStream } from '@/hooks/use-agui-stream';
import { ThinkingStepsPanel, type ThinkingStep } from '@/components/agui/ThinkingStepsPanel';
import { ToolCallsPanel, type ToolCall } from '@/components/agui/ToolCallsPanel';
import type { AGUIThinkingEvent, AGUIToolCallEvent, AGUIToolResultEvent } from '@shared/agui-event-types';

export default function MarketIntelligenceStudio() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(window.location.search);
  const startupIdFromUrl = queryParams.get('startupId');
  
  // Get studio messaging configuration
  const studioMessaging = getStudioMessaging('market-intelligence');

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionAttempted, setSessionAttempted] = useState(false);

  // Form states for different workflows
  const [competitorForm, setCompetitorForm] = useState({
    industry: '',
    competitors: '',
    targetMarket: '',
  });

  const [personaForm, setPersonaForm] = useState({
    targetMarket: '',
    numberOfPersonas: '3',
    focusAreas: '',
  });

  const [gtmForm, setGtmForm] = useState({
    productDescription: '',
    targetMarket: '',
    budget: '',
    launchTimeframe: '',
  });

  const [trendsForm, setTrendsForm] = useState({
    industry: '',
    timeframe: '6m',
    focusAreas: '',
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

      if (event.type === 'agent:complete') {
        setThinkingSteps(prev => prev.map(s => ({
          ...s,
          status: 'completed',
          duration: s.duration || (Date.now() - s.timestamp)
        })));
      }

      if (event.type === 'agent:error') {
        console.warn('AG-UI demo error:', event);
      }
    }
  });

  // Fetch user's startups
  const { data: startupsData, isLoading: startupsLoading } = useQuery({
    queryKey: ['/api/wizards/dashboard'],
  });

  const startupId = startupIdFromUrl ? parseInt(startupIdFromUrl) : startupsData?.startups?.[0]?.id;

  // Create session mutation (idempotent - returns existing if found)
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/wizards/studios/market-intelligence/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ startupId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.session) {
        setSessionId(data.session.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Session Creation Failed',
        description: error.message || 'Failed to create studio session',
        variant: 'destructive',
      });
    },
  });

  // Handle session creation when startupId changes
  useEffect(() => {
    if (!startupId) return;

    // Reset session state when startupId changes
    setSessionId(null);
    setSessionAttempted(true); // Mark as attempted to prevent render-time mutations

    // Create session for new startup
    createSessionMutation.mutate();
  }, [startupId]); // Reset and recreate when startupId changes

  // Competitor Analysis Mutation
  const competitorMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/market-intelligence/analyze-competitors', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          industry: competitorForm.industry,
          competitors: competitorForm.competitors.split(',').map(c => c.trim()).filter(Boolean),
          targetMarket: competitorForm.targetMarket,
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
        console.warn('[Market Intelligence] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      toast({
        title: 'Analysis Complete',
        description: 'Competitor analysis has been generated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze competitors',
        variant: 'destructive',
      });
    },
  });

  // Customer Persona Mutation
  const personaMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/market-intelligence/create-personas', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          targetMarket: personaForm.targetMarket,
          numberOfPersonas: parseInt(personaForm.numberOfPersonas),
          focusAreas: personaForm.focusAreas.split(',').map(f => f.trim()).filter(Boolean),
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
        console.warn('[Market Intelligence] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      toast({
        title: 'Personas Created',
        description: `${data.personas?.length || 0} customer personas have been generated`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create personas',
        variant: 'destructive',
      });
    },
  });

  // GTM Strategy Mutation
  const gtmMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/market-intelligence/generate-gtm', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          productDescription: gtmForm.productDescription,
          targetMarket: gtmForm.targetMarket,
          budget: gtmForm.budget ? parseFloat(gtmForm.budget) : undefined,
          launchTimeframe: gtmForm.launchTimeframe,
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
        console.warn('[Market Intelligence] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      toast({
        title: 'Strategy Generated',
        description: 'Go-to-Market strategy has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate GTM strategy',
        variant: 'destructive',
      });
    },
  });

  // Market Trends Analysis Mutation
  const analyzeTrendsMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/market-intelligence/analyze-trends', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          industry: trendsForm.industry,
          timeframe: trendsForm.timeframe,
          focusAreas: trendsForm.focusAreas.split(',').map(f => f.trim()).filter(Boolean),
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
        console.warn('[Market Intelligence] Backend response missing aguiSessionId - AG-UI streaming unavailable');
      }
      
      toast({
        title: 'Trends Analysis Complete',
        description: 'Market trends analysis has been generated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze market trends',
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
          <p className="text-foreground">Initializing Market Intelligence Studio...</p>
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
    <StudioReadinessGate studioId="market-intelligence" startupId={startupId}>
      <StudioBaseUI
        studioId="market-intelligence"
      studioName="Market Intelligence"
      studioDescription={studioMessaging.tagline}
      startupId={startupId}
      sessionId={sessionId!}
    >
      {/* Studio Outcomes Section */}
      <StudioOutcomesSection 
        outcomes={studioMessaging.outcomes}
        className="mb-8"
      />

      <Tabs defaultValue="competitors" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-card">
          <TabsTrigger value="competitors" className="data-[state=active]:bg-purple-600">
            <TrendingUp className="h-4 w-4 mr-2" />
            Competitor Analysis
          </TabsTrigger>
          <TabsTrigger value="personas" className="data-[state=active]:bg-purple-600">
            <Users className="h-4 w-4 mr-2" />
            Customer Personas
          </TabsTrigger>
          <TabsTrigger value="gtm" className="data-[state=active]:bg-purple-600">
            <Target className="h-4 w-4 mr-2" />
            GTM Strategy
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-purple-600">
            <BarChart3 className="h-4 w-4 mr-2" />
            Market Trends
          </TabsTrigger>
        </TabsList>

        {/* Competitor Analysis Tab */}
        <TabsContent value="competitors" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="industry" className="text-foreground">Industry</Label>
              <Input
                id="industry"
                data-testid="input-industry"
                placeholder="e.g., SaaS, E-commerce, FinTech"
                value={competitorForm.industry}
                onChange={(e) => setCompetitorForm({ ...competitorForm, industry: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="competitors" className="text-foreground">Known Competitors (optional, comma-separated)</Label>
              <Input
                id="competitors"
                data-testid="input-competitors"
                placeholder="e.g., Company A, Company B, Company C"
                value={competitorForm.competitors}
                onChange={(e) => setCompetitorForm({ ...competitorForm, competitors: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="target-market-comp" className="text-foreground">Target Market</Label>
              <Input
                id="target-market-comp"
                data-testid="input-target-market-comp"
                placeholder="e.g., Small businesses, Enterprise, Consumers"
                value={competitorForm.targetMarket}
                onChange={(e) => setCompetitorForm({ ...competitorForm, targetMarket: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <Button
              data-testid="button-analyze-competitors"
              onClick={() => competitorMutation.mutate()}
              disabled={!sessionId || !competitorForm.industry || competitorMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {competitorMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Competitors'
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Customer Personas Tab */}
        <TabsContent value="personas" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-market-persona" className="text-foreground">Target Market</Label>
              <Input
                id="target-market-persona"
                data-testid="input-target-market-persona"
                placeholder="e.g., Marketing managers at SMBs"
                value={personaForm.targetMarket}
                onChange={(e) => setPersonaForm({ ...personaForm, targetMarket: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="num-personas" className="text-foreground">Number of Personas</Label>
              <Input
                id="num-personas"
                data-testid="input-num-personas"
                type="number"
                min="1"
                max="5"
                value={personaForm.numberOfPersonas}
                onChange={(e) => setPersonaForm({ ...personaForm, numberOfPersonas: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="focus-areas" className="text-foreground">Focus Areas (optional, comma-separated)</Label>
              <Input
                id="focus-areas"
                data-testid="input-focus-areas"
                placeholder="e.g., Pain points, Goals, Behavior"
                value={personaForm.focusAreas}
                onChange={(e) => setPersonaForm({ ...personaForm, focusAreas: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <Button
              data-testid="button-create-personas"
              onClick={() => personaMutation.mutate()}
              disabled={!sessionId || !personaForm.targetMarket || personaMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {personaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Personas'
              )}
            </Button>
          </div>
        </TabsContent>

        {/* GTM Strategy Tab */}
        <TabsContent value="gtm" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-desc" className="text-foreground">Product Description</Label>
              <Textarea
                id="product-desc"
                data-testid="textarea-product-desc"
                placeholder="Describe your product, its key features, and value proposition..."
                value={gtmForm.productDescription}
                onChange={(e) => setGtmForm({ ...gtmForm, productDescription: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="target-market-gtm" className="text-foreground">Target Market</Label>
              <Input
                id="target-market-gtm"
                data-testid="input-target-market-gtm"
                placeholder="e.g., B2B SaaS companies"
                value={gtmForm.targetMarket}
                onChange={(e) => setGtmForm({ ...gtmForm, targetMarket: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="budget" className="text-foreground">Budget (optional)</Label>
              <Input
                id="budget"
                data-testid="input-budget"
                type="number"
                placeholder="e.g., 50000"
                value={gtmForm.budget}
                onChange={(e) => setGtmForm({ ...gtmForm, budget: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="timeframe" className="text-foreground">Launch Timeframe</Label>
              <Input
                id="timeframe"
                data-testid="input-timeframe"
                placeholder="e.g., 3 months, Q2 2024"
                value={gtmForm.launchTimeframe}
                onChange={(e) => setGtmForm({ ...gtmForm, launchTimeframe: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <Button
              data-testid="button-generate-gtm"
              onClick={() => gtmMutation.mutate()}
              disabled={!sessionId || !gtmForm.productDescription || gtmMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {gtmMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate GTM Strategy'
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Market Trends Tab */}
        <TabsContent value="trends" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="trends-industry" className="text-foreground">Industry</Label>
              <Input
                id="trends-industry"
                data-testid="input-trends-industry"
                placeholder="e.g., FinTech, HealthTech, AI/ML"
                value={trendsForm.industry}
                onChange={(e) => setTrendsForm({ ...trendsForm, industry: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <div>
              <Label htmlFor="timeframe-select" className="text-foreground">Timeframe</Label>
              <Select
                value={trendsForm.timeframe}
                onValueChange={(value) => setTrendsForm({ ...trendsForm, timeframe: value })}
              >
                <SelectTrigger
                  id="timeframe-select"
                  data-testid="select-timeframe"
                  className="glass-card border-border/50 text-foreground mt-2"
                >
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/50">
                  <SelectItem value="3m" className="text-foreground hover:glass-card">Last 3 months</SelectItem>
                  <SelectItem value="6m" className="text-foreground hover:glass-card">Last 6 months</SelectItem>
                  <SelectItem value="1y" className="text-foreground hover:glass-card">Last 1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="trends-focus" className="text-foreground">Focus Areas (optional, comma-separated)</Label>
              <Input
                id="trends-focus"
                data-testid="input-trends-focus"
                placeholder="e.g., Technology adoption, Investment trends, Consumer behavior"
                value={trendsForm.focusAreas}
                onChange={(e) => setTrendsForm({ ...trendsForm, focusAreas: e.target.value })}
                className="glass-card border-border/50 text-foreground mt-2"
              />
            </div>

            <Button
              data-testid="button-analyze-trends"
              onClick={() => analyzeTrendsMutation.mutate()}
              disabled={!sessionId || !trendsForm.industry || analyzeTrendsMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {analyzeTrendsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Market Trends'
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* AG-UI Real-Time Visualization Panels */}
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
