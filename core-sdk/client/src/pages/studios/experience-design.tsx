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
import { StudioOutcomesSection } from '@/components/wizards/studio-outcomes-section';
import { getStudioMessaging } from '@/constants/studios/messaging';
import { StudioReadinessGate } from '@/components/studio/StudioReadinessGate';
import { Palette, Layout, Layers, Loader2, Shield } from 'lucide-react';
import { useAGUIStream } from '@/hooks/use-agui-stream';
import { ThinkingStepsPanel, type ThinkingStep } from '@/components/agui/ThinkingStepsPanel';
import { ToolCallsPanel, type ToolCall } from '@/components/agui/ToolCallsPanel';

export default function ExperienceDesignStudio() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(window.location.search);
  const startupIdFromUrl = queryParams.get('startupId');
  
  // Get studio messaging configuration
  const studioMessaging = getStudioMessaging('experience-design');

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

  // Form states for different workflows
  const [uiuxForm, setUiuxForm] = useState({
    productDescription: '',
    targetAudience: '',
    designPreferences: '',
    brandGuidelines: '',
  });

  const [prototypeForm, setPrototypeForm] = useState({
    featureName: '',
    userFlow: '',
    interactionDetails: '',
  });

  const [designSystemForm, setDesignSystemForm] = useState({
    brandName: '',
    colorPreferences: '',
    typography: '',
    componentNeeds: '',
  });

  const [accessibilityForm, setAccessibilityForm] = useState({
    targetUrl: '',
    wcagLevel: 'AA',
    userGroups: '',
    specificConcerns: '',
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
      return await apiRequest('/api/wizards/studios/experience-design/sessions', {
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

  // UI/UX Design Mutation
  const uiuxMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/experience-design/generate-uiux', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          productDescription: uiuxForm.productDescription,
          targetAudience: uiuxForm.targetAudience,
          designPreferences: uiuxForm.designPreferences,
          brandGuidelines: uiuxForm.brandGuidelines,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      toast({
        title: 'UI/UX Design Generated',
        description: 'User interface design has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate UI/UX design',
        variant: 'destructive',
      });
    },
  });

  // Interactive Prototype Mutation
  const prototypeMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/experience-design/generate-prototype', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          featureName: prototypeForm.featureName,
          userFlow: prototypeForm.userFlow,
          interactionDetails: prototypeForm.interactionDetails,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      toast({
        title: 'Prototype Generated',
        description: 'Interactive prototype has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate prototype',
        variant: 'destructive',
      });
    },
  });

  // Design System Mutation
  const designSystemMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/experience-design/generate-design-system', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          brandName: designSystemForm.brandName,
          colorPreferences: designSystemForm.colorPreferences,
          typography: designSystemForm.typography,
          componentNeeds: designSystemForm.componentNeeds,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      toast({
        title: 'Design System Generated',
        description: 'Design system has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate design system',
        variant: 'destructive',
      });
    },
  });

  // Accessibility Audit Mutation
  const accessibilityMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/experience-design/generate-accessibility-audit', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          targetUrl: accessibilityForm.targetUrl,
          wcagLevel: accessibilityForm.wcagLevel,
          userGroups: accessibilityForm.userGroups,
          specificConcerns: accessibilityForm.specificConcerns,
        }),
      });
    },
    onMutate: () => {
      // Reset AG-UI state at mutation start (before orchestration runs)
      setAguiSessionId(null);
      setThinkingSteps([]);
      setToolCalls([]);
    },
    onSuccess: (data) => {
      // Extract aguiSessionId from response and trigger auto-connection
      if (data.aguiSessionId) {
        setAguiSessionId(data.aguiSessionId);
      }
      
      toast({
        title: 'Accessibility Audit Generated',
        description: 'Accessibility audit has been completed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate accessibility audit',
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
          <p className="text-foreground">Initializing Experience Design Studio...</p>
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
            onClick={() => createSessionMutation.mutate()}
            disabled={createSessionMutation.isPending}
            data-testid="button-retry-session"
          >
            {createSessionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              'Retry'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StudioReadinessGate studioId="experience-design" startupId={startupId}>
      <StudioBaseUI
      title="Experience Design Studio"
      description={studioMessaging.tagline}
      icon={<Palette className="h-6 w-6" />}
      startupId={startupId}
    >
      {/* Studio Outcomes Section */}
      <StudioOutcomesSection 
        outcomes={studioMessaging.outcomes}
        className="mb-8"
      />

      <Tabs defaultValue="uiux" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass">
          <TabsTrigger value="uiux" data-testid="tab-uiux-design">
            <Layout className="h-4 w-4 mr-2" />
            UI/UX Design
          </TabsTrigger>
          <TabsTrigger value="prototype" data-testid="tab-prototype">
            <Layers className="h-4 w-4 mr-2" />
            Interactive Prototype
          </TabsTrigger>
          <TabsTrigger value="design-system" data-testid="tab-design-system">
            <Palette className="h-4 w-4 mr-2" />
            Design System
          </TabsTrigger>
          <TabsTrigger value="accessibility" data-testid="tab-accessibility-audit">
            <Shield className="h-4 w-4 mr-2" />
            Accessibility Audit
          </TabsTrigger>
        </TabsList>

        {/* UI/UX Design Tab */}
        <TabsContent value="uiux" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="productDescription" className="text-foreground">Product Description</Label>
              <Textarea
                id="productDescription"
                placeholder="Describe your product and its key features..."
                value={uiuxForm.productDescription}
                onChange={(e) => setUiuxForm({ ...uiuxForm, productDescription: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                rows={4}
                data-testid="input-product-description"
              />
            </div>

            <div>
              <Label htmlFor="targetAudience" className="text-foreground">Target Audience</Label>
              <Input
                id="targetAudience"
                placeholder="Who are your primary users?"
                value={uiuxForm.targetAudience}
                onChange={(e) => setUiuxForm({ ...uiuxForm, targetAudience: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                data-testid="input-target-audience"
              />
            </div>

            <div>
              <Label htmlFor="designPreferences" className="text-foreground">Design Preferences</Label>
              <Textarea
                id="designPreferences"
                placeholder="Describe your design style preferences (modern, minimal, colorful, etc.)..."
                value={uiuxForm.designPreferences}
                onChange={(e) => setUiuxForm({ ...uiuxForm, designPreferences: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                rows={3}
                data-testid="input-design-preferences"
              />
            </div>

            <div>
              <Label htmlFor="brandGuidelines" className="text-foreground">Brand Guidelines (Optional)</Label>
              <Textarea
                id="brandGuidelines"
                placeholder="Any existing brand guidelines or constraints..."
                value={uiuxForm.brandGuidelines}
                onChange={(e) => setUiuxForm({ ...uiuxForm, brandGuidelines: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                rows={3}
                data-testid="input-brand-guidelines"
              />
            </div>

            <Button
              onClick={() => uiuxMutation.mutate()}
              disabled={!sessionId || !uiuxForm.productDescription || !uiuxForm.targetAudience || uiuxMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
              data-testid="button-generate-uiux"
            >
              {uiuxMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating UI/UX Design...
                </>
              ) : (
                <>
                  <Layout className="h-4 w-4 mr-2" />
                  Generate UI/UX Design
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Interactive Prototype Tab */}
        <TabsContent value="prototype" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="featureName" className="text-foreground">Feature Name</Label>
              <Input
                id="featureName"
                placeholder="Name of the feature to prototype"
                value={prototypeForm.featureName}
                onChange={(e) => setPrototypeForm({ ...prototypeForm, featureName: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                data-testid="input-feature-name"
              />
            </div>

            <div>
              <Label htmlFor="userFlow" className="text-foreground">User Flow</Label>
              <Textarea
                id="userFlow"
                placeholder="Describe the step-by-step user journey for this feature..."
                value={prototypeForm.userFlow}
                onChange={(e) => setPrototypeForm({ ...prototypeForm, userFlow: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                rows={4}
                data-testid="input-user-flow"
              />
            </div>

            <div>
              <Label htmlFor="interactionDetails" className="text-foreground">Interaction Details</Label>
              <Textarea
                id="interactionDetails"
                placeholder="Describe specific interactions, animations, and user feedback mechanisms..."
                value={prototypeForm.interactionDetails}
                onChange={(e) => setPrototypeForm({ ...prototypeForm, interactionDetails: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                rows={4}
                data-testid="input-interaction-details"
              />
            </div>

            <Button
              onClick={() => prototypeMutation.mutate()}
              disabled={!sessionId || !prototypeForm.featureName || !prototypeForm.userFlow || prototypeMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
              data-testid="button-generate-prototype"
            >
              {prototypeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Prototype...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4 mr-2" />
                  Generate Interactive Prototype
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Design System Tab */}
        <TabsContent value="design-system" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="brandName" className="text-foreground">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="Your brand/product name"
                value={designSystemForm.brandName}
                onChange={(e) => setDesignSystemForm({ ...designSystemForm, brandName: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                data-testid="input-brand-name"
              />
            </div>

            <div>
              <Label htmlFor="colorPreferences" className="text-foreground">Color Preferences</Label>
              <Textarea
                id="colorPreferences"
                placeholder="Describe your color palette preferences..."
                value={designSystemForm.colorPreferences}
                onChange={(e) => setDesignSystemForm({ ...designSystemForm, colorPreferences: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                rows={3}
                data-testid="input-color-preferences"
              />
            </div>

            <div>
              <Label htmlFor="typography" className="text-foreground">Typography Preferences</Label>
              <Textarea
                id="typography"
                placeholder="Font styles, headings, and text hierarchy preferences..."
                value={designSystemForm.typography}
                onChange={(e) => setDesignSystemForm({ ...designSystemForm, typography: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                rows={3}
                data-testid="input-typography"
              />
            </div>

            <div>
              <Label htmlFor="componentNeeds" className="text-foreground">Component Needs</Label>
              <Textarea
                id="componentNeeds"
                placeholder="List the UI components you need (buttons, cards, forms, etc.)..."
                value={designSystemForm.componentNeeds}
                onChange={(e) => setDesignSystemForm({ ...designSystemForm, componentNeeds: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                rows={3}
                data-testid="input-component-needs"
              />
            </div>

            <Button
              onClick={() => designSystemMutation.mutate()}
              disabled={!sessionId || !designSystemForm.brandName || !designSystemForm.colorPreferences || designSystemMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
              data-testid="button-generate-design-system"
            >
              {designSystemMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Design System...
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4 mr-2" />
                  Generate Design System
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Accessibility Audit Tab */}
        <TabsContent value="accessibility" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="targetUrl" className="text-foreground">Target URL or Page</Label>
              <Input
                id="targetUrl"
                placeholder="https://example.com or describe the page/feature to audit"
                value={accessibilityForm.targetUrl}
                onChange={(e) => setAccessibilityForm({ ...accessibilityForm, targetUrl: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                data-testid="input-target-url"
              />
            </div>

            <div>
              <Label htmlFor="wcagLevel" className="text-foreground">WCAG Compliance Level</Label>
              <Input
                id="wcagLevel"
                placeholder="A, AA, or AAA"
                value={accessibilityForm.wcagLevel}
                onChange={(e) => setAccessibilityForm({ ...accessibilityForm, wcagLevel: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                data-testid="input-wcag-level"
              />
            </div>

            <div>
              <Label htmlFor="userGroups" className="text-foreground">Target User Groups</Label>
              <Textarea
                id="userGroups"
                placeholder="Describe specific user groups (e.g., visually impaired, motor disabilities, cognitive impairments)..."
                value={accessibilityForm.userGroups}
                onChange={(e) => setAccessibilityForm({ ...accessibilityForm, userGroups: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                rows={3}
                data-testid="input-user-groups"
              />
            </div>

            <div>
              <Label htmlFor="specificConcerns" className="text-foreground">Specific Concerns (Optional)</Label>
              <Textarea
                id="specificConcerns"
                placeholder="Any specific accessibility issues or areas of concern..."
                value={accessibilityForm.specificConcerns}
                onChange={(e) => setAccessibilityForm({ ...accessibilityForm, specificConcerns: e.target.value })}
                className="mt-2 glass border-purple-600/20 text-foreground"
                rows={3}
                data-testid="input-specific-concerns"
              />
            </div>

            <Button
              onClick={() => accessibilityMutation.mutate()}
              disabled={!sessionId || !accessibilityForm.targetUrl || !accessibilityForm.userGroups || accessibilityMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
              data-testid="button-generate-accessibility-audit"
            >
              {accessibilityMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Accessibility Audit...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Generate Accessibility Audit
                </>
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
