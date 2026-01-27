/**
 * Ideation Lab Studio Interface
 * Studio 1: Idea validation, market research, and business model canvas generation
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassmorphicCard } from '@/components/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCelebration } from '@/hooks/useCelebration';
import SuccessModal from '@/components/celebrations/SuccessModal';
import { ArrowLeft, Brain, Sparkles } from 'lucide-react';
import StudioBaseUI, { type StudioTask, type Artifact, type OrchestrationStatus } from '@/components/studio-base-ui';
import { queryClient } from '@/lib/queryClient';
import { useAGUIStream } from '@/hooks/use-agui-stream';
import { StudioOutcomesSection } from '@/components/wizards/studio-outcomes-section';
import { WorkflowSelector } from '@/components/wizards/workflow-selector';
import { getStudioMessaging, getStudioCTA, SECTION_LABELS } from '@/constants/studios/messaging';
import { StudioReadinessGate } from '@/components/studio/StudioReadinessGate';

interface IdeaValidationInputs {
  ideaDescription: string;
  industry?: string;
  targetMarket?: string;
}

interface MarketResearchInputs {
  marketDescription: string;
  industry?: string;
  geography?: string;
}

interface BusinessModelInputs {
  ideaDescription: string;
  valueProposition?: string;
}

export default function IdeationLabStudio() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { isOpen: celebrationOpen, config: celebrationConfig, close: closeCelebration, celebrateWorkflowSuccess } = useCelebration();
  const [activeWorkflow, setActiveWorkflow] = useState<'idea-validation' | 'market-research' | 'business-model'>('idea-validation');
  
  // Get studio messaging configuration
  const studioMessaging = getStudioMessaging('ideation-lab');
  
  // Form states
  const [ideaValidationForm, setIdeaValidationForm] = useState<IdeaValidationInputs>({
    ideaDescription: '',
    industry: '',
    targetMarket: '',
  });
  
  const [marketResearchForm, setMarketResearchForm] = useState<MarketResearchInputs>({
    marketDescription: '',
    industry: '',
    geography: '',
  });
  
  const [businessModelForm, setBusinessModelForm] = useState<BusinessModelInputs>({
    ideaDescription: '',
    valueProposition: '',
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
      if (!response.ok) throw new Error('Failed to fetch founder data');
      return response.json();
    },
  });

  // Reusable session creation function
  const createSession = useCallback((startupIdToUse: number) => {
    setIsCreatingSession(true);
    setSessionAttempted(true);
    
    // Fetch or create session for this studio (backend handles idempotency)
    fetch('/api/wizards/studios/ideation-lab/sessions', {
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
    queryKey: ['/api/wizards/studios', 'ideation-lab', 'detail', startupId],
    queryFn: async () => {
      const response = await fetch('/api/wizards/studios/ideation-lab/detail', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch studio data');
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
                setSessionAttempted(false); // Reset flag so effect can retry
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

  // AG-UI Streaming state
  const [aguiSessionId, setAguiSessionId] = useState<string | null>(null);
  const [showAgentActivity, setShowAgentActivity] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [toolCalls, setToolCalls] = useState<Array<{ tool: string; args: any; result?: any }>>([]);
  
  // Connect to AG-UI stream when session is created
  const { events, status, error } = useAGUIStream(aguiSessionId, {
    includeHistory: true,
    reconnect: true,
    maxReconnectAttempts: 3,
    onEvent: (event) => {
      // Handle different event types
      switch (event.type) {
        case 'agent:start':
          // Only update if not already in final state (failed or success) from backend
          setOrchestrationStatus(prev => 
            prev.status === 'failed' || prev.status === 'success' ? prev : {
              ...prev,
              status: 'running',
              currentStep: `Agent ${(event as any).agentId} started (demo stream)`,
              agentsInvolved: [...(prev.agentsInvolved || []), (event as any).agentId],
            }
          );
          break;
        case 'agent:thinking':
          setThinkingSteps(prev => [...prev, (event as any).thought]);
          break;
        case 'tool:call':
          setToolCalls(prev => [...prev, { 
            tool: (event as any).toolName, 
            args: (event as any).arguments 
          }]);
          break;
        case 'tool:result':
          setToolCalls(prev => prev.map((tc, i) => 
            i === prev.length - 1 ? { ...tc, result: (event as any).result } : tc
          ));
          break;
        case 'agent:complete':
          // NEVER overwrite backend failure - only update if still running
          setOrchestrationStatus(prev => 
            prev.status === 'failed' || prev.status === 'success' ? prev : {
              ...prev,
              progress: 100,
              currentStep: 'Demo stream completed',
            }
          );
          break;
        case 'agent:error':
          // AG-UI errors are demo-only, don't overwrite real backend failures
          console.warn('AG-UI demo error:', (event as any).error);
          break;
      }
    },
    onError: (err) => {
      console.error('AG-UI stream error (non-critical):', err);
    },
  });
  
  // Derive connection status
  const isConnected = status === 'connected';

  // Idea Validation Mutation
  const ideaValidationMutation = useMutation({
    mutationFn: async (inputs: IdeaValidationInputs) => {
      const response = await fetch('/api/wizards/ideation-lab/validate-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          startupId,
          sessionId,
          ideaDescription: inputs.ideaDescription,
          industry: inputs.industry,
          targetMarket: inputs.targetMarket,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Validation failed');
      }
      
      return response.json();
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
      
      setOrchestrationStatus({
        status: 'running',
        progress: 0,
        currentStep: 'Analyzing idea viability...',
      });
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      setOrchestrationStatus({
        status: 'success',
        progress: 100,
        currentStep: 'Idea validation completed',
        creditsConsumed: data.creditsUsed,
      });
      
      toast({
        title: 'Idea Validated!',
        description: `Viability score: ${data.validation?.viabilityScore || 'N/A'}/100`,
      });
      
      // Trigger celebration
      celebrateWorkflowSuccess(
        'Idea Validation',
        'Ideation Lab',
        {
          label: 'View Insights',
          onClick: () => {
            closeCelebration();
            // Scroll to artifacts section or stay on current page
          }
        }
      );
      
      // Refresh studio data
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studios', 'ideation-lab', 'detail', startupId] });
    },
    onError: (error: Error) => {
      setOrchestrationStatus({
        status: 'failed',
        errorMessage: error.message,
      });
      
      toast({
        title: 'Validation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Market Research Mutation
  const marketResearchMutation = useMutation({
    mutationFn: async (inputs: MarketResearchInputs) => {
      const response = await fetch('/api/wizards/ideation-lab/market-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          startupId,
          sessionId,
          marketDescription: inputs.marketDescription,
          industry: inputs.industry,
          geography: inputs.geography,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Research failed');
      }
      
      return response.json();
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
      
      setOrchestrationStatus({
        status: 'running',
        progress: 0,
        currentStep: 'Conducting market research...',
      });
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      setOrchestrationStatus({
        status: 'success',
        progress: 100,
        currentStep: 'Market research completed',
        creditsConsumed: data.creditsUsed,
      });
      
      toast({
        title: 'Market Research Complete!',
        description: 'Analysis ready for review',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studios', 'ideation-lab', 'detail', startupId] });
    },
    onError: (error: Error) => {
      setOrchestrationStatus({
        status: 'failed',
        errorMessage: error.message,
      });
      
      toast({
        title: 'Research Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Business Model Canvas Mutation
  const businessModelMutation = useMutation({
    mutationFn: async (inputs: BusinessModelInputs) => {
      const response = await fetch('/api/wizards/ideation-lab/business-model-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          startupId,
          sessionId,
          ideaDescription: inputs.ideaDescription,
          valueProposition: inputs.valueProposition,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Canvas generation failed');
      }
      
      return response.json();
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
      
      setOrchestrationStatus({
        status: 'running',
        progress: 0,
        currentStep: 'Generating business model canvas...',
      });
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      setOrchestrationStatus({
        status: 'success',
        progress: 100,
        currentStep: 'Business model canvas created',
        creditsConsumed: data.creditsUsed,
      });
      
      toast({
        title: 'Business Model Canvas Created!',
        description: 'Canvas is ready for download',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studios', 'ideation-lab', 'detail', startupId] });
    },
    onError: (error: Error) => {
      setOrchestrationStatus({
        status: 'failed',
        errorMessage: error.message,
      });
      
      toast({
        title: 'Canvas Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleExecute = async () => {
    if (activeWorkflow === 'idea-validation') {
      if (!ideaValidationForm.ideaDescription.trim()) {
        toast({
          title: 'Missing Information',
          description: 'Please describe your idea',
          variant: 'destructive',
        });
        return;
      }
      
      // Execute backend mutation (AG-UI auto-connects on success)
      ideaValidationMutation.mutate(ideaValidationForm);
    } else if (activeWorkflow === 'market-research') {
      if (!marketResearchForm.marketDescription.trim()) {
        toast({
          title: 'Missing Information',
          description: 'Please describe the market',
          variant: 'destructive',
        });
        return;
      }
      
      // Execute backend mutation (AG-UI auto-connects on success)
      marketResearchMutation.mutate(marketResearchForm);
    } else if (activeWorkflow === 'business-model') {
      if (!businessModelForm.ideaDescription.trim()) {
        toast({
          title: 'Missing Information',
          description: 'Please describe your idea',
          variant: 'destructive',
        });
        return;
      }
      
      // Execute backend mutation (AG-UI auto-connects on success)
      businessModelMutation.mutate(businessModelForm);
    }
  };

  const isExecuting = orchestrationStatus.status === 'running' || orchestrationStatus.status === 'queued';

  const tasks: StudioTask[] = studioData?.tasks || [];
  const artifacts: Artifact[] = studioData?.deliverables?.map((d: any) => ({
    id: d.id,
    name: d.deliverableName,
    artifactType: d.deliverableType === 'business-model-canvas' ? 'document' : 'document',
    category: 'business-plan',
    description: null,
    content: d.content,
    fileUrl: d.fileUrl,
    version: d.version,
    createdAt: d.createdAt,
    metadata: {},
    tags: [],
  })) || [];

  return (
    <StudioReadinessGate studioId="ideation-lab" startupId={startupId}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white">
      {/* Header */}
      <div className="border-b border-border glass">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button asChild variant="ghost" className="mb-4" data-testid="button-back-studios">
            <Link to="/studios">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Studios
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StudioBaseUI
          studioId="ideation-lab"
          studioName="Ideation Lab"
          studioDescription="Turn your idea into a validated business concept. Get expert insights on market fit, viability, and your path forward."
          sessionId={sessionId}
          startupId={startupId}
          tasks={tasks}
          artifacts={artifacts}
          orchestrationStatus={orchestrationStatus}
          isExecuting={isExecuting}
        >
          {/* What You'll Create Section */}
          {studioMessaging && (
            <StudioOutcomesSection
              outcomes={studioMessaging.outcomes}
              title={SECTION_LABELS.OUTCOMES}
            />
          )}
          {/* Real-time Agent Activity (AG-UI Streaming) */}
          {showAgentActivity && aguiSessionId && (
            <GlassmorphicCard className="">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Real-time Agent Activity
                  {isConnected && (
                    <span className="ml-auto flex items-center gap-2 text-sm text-green-600">
                      <span className="w-2 h-2 bg-[hsl(142,71%,45%)] rounded-full animate-pulse"></span>
                      Live
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  AG-UI streaming session: {aguiSessionId.substring(0, 8)}...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Thinking Steps */}
                {thinkingSteps.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-foreground-secondary mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Agent Thinking Steps
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {thinkingSteps.map((thought, idx) => (
                        <div
                          key={idx}
                          className="text-sm bg-background p-3 rounded-lg border border-border"
                          data-testid={`text-thinking-step-${idx}`}
                        >
                          {thought}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tool Calls */}
                {toolCalls.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-foreground-secondary mb-2">Tool Calls</div>
                    <div className="space-y-2">
                      {toolCalls.map((tc, idx) => (
                        <div
                          key={idx}
                          className="text-sm bg-background p-3 rounded-lg border border-border"
                          data-testid={`card-tool-call-${idx}`}
                        >
                          <div className="font-mono text-primary">{tc.tool}</div>
                          {tc.result && (
                            <div className="mt-1 text-xs text-foreground-secondary">
                              ✓ Completed
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Stream Status */}
                {error && (
                  <div className="text-sm text-[hsl(0,84%,60%)]">
                    Stream error: {error.message}
                  </div>
                )}
              </CardContent>
            </GlassmorphicCard>
          )}

          {/* Workflow Selector */}
          {studioMessaging?.workflows && (
            <WorkflowSelector
              workflows={studioMessaging.workflows}
              activeWorkflow={activeWorkflow}
              onWorkflowChange={(workflowId) => setActiveWorkflow(workflowId as typeof activeWorkflow)}
              variant="multi"
              title={SECTION_LABELS.WORKFLOWS}
            />
          )}

          {/* Workflow Forms */}
          <GlassmorphicCard className="">
            <CardHeader>
              <CardTitle>
                {activeWorkflow === 'idea-validation' && 'Idea Validation'}
                {activeWorkflow === 'market-research' && 'Market Research'}
                {activeWorkflow === 'business-model' && 'Business Model Canvas'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeWorkflow === 'idea-validation' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="idea-description">Idea Description *</Label>
                    <Textarea
                      id="idea-description"
                      placeholder="Describe your startup idea in detail..."
                      value={ideaValidationForm.ideaDescription}
                      onChange={(e) => setIdeaValidationForm({ ...ideaValidationForm, ideaDescription: e.target.value })}
                      rows={5}
                      className="bg-background border-border/50"
                      data-testid="input-idea-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry (Optional)</Label>
                      <Input
                        id="industry"
                        placeholder="e.g., SaaS, E-commerce"
                        value={ideaValidationForm.industry}
                        onChange={(e) => setIdeaValidationForm({ ...ideaValidationForm, industry: e.target.value })}
                        className="bg-background border-border/50"
                        data-testid="input-industry"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target-market">Target Market (Optional)</Label>
                      <Input
                        id="target-market"
                        placeholder="e.g., Small businesses"
                        value={ideaValidationForm.targetMarket}
                        onChange={(e) => setIdeaValidationForm({ ...ideaValidationForm, targetMarket: e.target.value })}
                        className="bg-background border-border/50"
                        data-testid="input-target-market"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeWorkflow === 'market-research' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="market-description">Market Description *</Label>
                    <Textarea
                      id="market-description"
                      placeholder="Describe the market you want to research..."
                      value={marketResearchForm.marketDescription}
                      onChange={(e) => setMarketResearchForm({ ...marketResearchForm, marketDescription: e.target.value })}
                      rows={5}
                      className="bg-background border-border/50"
                      data-testid="input-market-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="market-industry">Industry (Optional)</Label>
                      <Input
                        id="market-industry"
                        placeholder="e.g., Technology"
                        value={marketResearchForm.industry}
                        onChange={(e) => setMarketResearchForm({ ...marketResearchForm, industry: e.target.value })}
                        className="bg-background border-border/50"
                        data-testid="input-market-industry"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="geography">Geography (Optional)</Label>
                      <Input
                        id="geography"
                        placeholder="e.g., North America"
                        value={marketResearchForm.geography}
                        onChange={(e) => setMarketResearchForm({ ...marketResearchForm, geography: e.target.value })}
                        className="bg-background border-border/50"
                        data-testid="input-geography"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeWorkflow === 'business-model' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bmc-idea">Idea Description *</Label>
                    <Textarea
                      id="bmc-idea"
                      placeholder="Describe your startup idea..."
                      value={businessModelForm.ideaDescription}
                      onChange={(e) => setBusinessModelForm({ ...businessModelForm, ideaDescription: e.target.value })}
                      rows={4}
                      className="bg-background border-border/50"
                      data-testid="input-bmc-idea"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value-prop">Value Proposition (Optional)</Label>
                    <Textarea
                      id="value-prop"
                      placeholder="What unique value do you provide?"
                      value={businessModelForm.valueProposition}
                      onChange={(e) => setBusinessModelForm({ ...businessModelForm, valueProposition: e.target.value })}
                      rows={3}
                      className="bg-background border-border/50"
                      data-testid="input-value-proposition"
                    />
                  </div>
                </>
              )}

              <Button
                onClick={handleExecute}
                disabled={isExecuting}
                className="w-full"
                size="lg"
                data-testid="button-execute-workflow"
              >
                {isExecuting ? 'Working on it...' : getStudioCTA('ideation-lab', activeWorkflow === 'idea-validation' ? 'Idea Validation' : activeWorkflow === 'market-research' ? 'Market Research' : 'Business Model')}
              </Button>
            </CardContent>
          </GlassmorphicCard>
        </StudioBaseUI>
      </div>
    </div>
    
    {celebrationConfig && (
      <SuccessModal
        isOpen={celebrationOpen}
        onClose={closeCelebration}
        config={celebrationConfig}
      />
    )}
    </StudioReadinessGate>
  );
}
