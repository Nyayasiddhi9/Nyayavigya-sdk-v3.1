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
import { FlaskConical, Shield, Cog, Loader2 } from 'lucide-react';
import { useAGUIStream } from '@/hooks/use-agui-stream';
import { ThinkingStepsPanel, type ThinkingStep } from '@/components/agui/ThinkingStepsPanel';
import { ToolCallsPanel, type ToolCall } from '@/components/agui/ToolCallsPanel';

export default function QualityAssuranceLabStudio() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(window.location.search);
  const startupIdFromUrl = queryParams.get('startupId');
  
  // Get studio messaging configuration
  const studioMessaging = getStudioMessaging('quality-assurance-lab');

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
  const [testCasesForm, setTestCasesForm] = useState({
    productDescription: '',
    featureList: '',
    testingScope: '',
    criticalFlows: '',
  });

  const [qaStrategyForm, setQaStrategyForm] = useState({
    projectType: '',
    teamSize: '',
    timeline: '',
    qualityGoals: '',
  });

  const [automationForm, setAutomationForm] = useState({
    techStack: '',
    testingFramework: '',
    cicdPlatform: '',
    coverageGoals: '',
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
      return await apiRequest('/api/wizards/studios/quality-assurance-lab/sessions', {
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

  // Test Cases Mutation
  const testCasesMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/quality-assurance-lab/generate-test-cases', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          productDescription: testCasesForm.productDescription,
          featureList: testCasesForm.featureList,
          testingScope: testCasesForm.testingScope,
          criticalFlows: testCasesForm.criticalFlows,
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
      }
      
      toast({
        title: 'Test Cases Generated',
        description: 'Comprehensive test cases have been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate test cases',
        variant: 'destructive',
      });
    },
  });

  // QA Strategy Mutation
  const qaStrategyMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/quality-assurance-lab/generate-qa-strategy', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          projectType: qaStrategyForm.projectType,
          teamSize: qaStrategyForm.teamSize,
          timeline: qaStrategyForm.timeline,
          qualityGoals: qaStrategyForm.qualityGoals,
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
      }
      
      toast({
        title: 'QA Strategy Generated',
        description: 'Quality assurance strategy has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate QA strategy',
        variant: 'destructive',
      });
    },
  });

  // Automation Setup Mutation
  const automationMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/quality-assurance-lab/generate-automation-setup', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          techStack: automationForm.techStack,
          testingFramework: automationForm.testingFramework,
          cicdPlatform: automationForm.cicdPlatform,
          coverageGoals: automationForm.coverageGoals,
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
      }
      
      toast({
        title: 'Automation Setup Generated',
        description: 'Test automation setup has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate automation setup',
        variant: 'destructive',
      });
    },
  });

  // Complete QA Suite Mutation
  const generateCompleteQASuiteMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/quality-assurance-lab/generate-complete-qa-suite', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          productDescription: testCasesForm.productDescription,
          featureList: testCasesForm.featureList,
          testingScope: testCasesForm.testingScope,
          criticalFlows: testCasesForm.criticalFlows,
          projectType: qaStrategyForm.projectType,
          teamSize: qaStrategyForm.teamSize,
          timeline: qaStrategyForm.timeline,
          qualityGoals: qaStrategyForm.qualityGoals,
          techStack: automationForm.techStack,
          testingFramework: automationForm.testingFramework,
          cicdPlatform: automationForm.cicdPlatform,
          coverageGoals: automationForm.coverageGoals,
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
      }
      
      toast({
        title: 'Complete QA Suite Generated',
        description: 'Full QA suite with test cases, strategy, and automation has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate complete QA suite',
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
          <p className="text-foreground" data-testid="text-session-loading">Initializing Quality Assurance Lab...</p>
        </div>
      </div>
    );
  }

  // Session error state
  if (!sessionId && sessionAttempted && createSessionMutation.isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-lg mb-4" data-testid="text-session-error">Failed to initialize studio session</p>
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
    <StudioReadinessGate studioId="quality-assurance-lab" startupId={startupId}>
      <StudioBaseUI
      title="Quality Assurance Lab"
      description={studioMessaging.tagline}
      icon={<FlaskConical className="h-6 w-6" />}
      startupId={startupId}
    >
      {/* Studio Outcomes Section */}
      <StudioOutcomesSection 
        outcomes={studioMessaging.outcomes}
        className="mb-8"
      />

      <Tabs defaultValue="test-cases" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass">
          <TabsTrigger value="test-cases" data-testid="tab-test-cases">
            <FlaskConical className="h-4 w-4 mr-2" />
            Test Cases
          </TabsTrigger>
          <TabsTrigger value="qa-strategy" data-testid="tab-qa-strategy">
            <Shield className="h-4 w-4 mr-2" />
            QA Strategy
          </TabsTrigger>
          <TabsTrigger value="automation" data-testid="tab-automation">
            <Cog className="h-4 w-4 mr-2" />
            Automation Setup
          </TabsTrigger>
        </TabsList>

        {/* Test Cases Tab */}
        <TabsContent value="test-cases" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-description">Product Description</Label>
              <Textarea
                id="product-description"
                placeholder="Describe your product and its main functionality..."
                value={testCasesForm.productDescription}
                onChange={(e) => setTestCasesForm({ ...testCasesForm, productDescription: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                rows={4}
                data-testid="input-product-description"
              />
            </div>

            <div>
              <Label htmlFor="feature-list">Feature List</Label>
              <Textarea
                id="feature-list"
                placeholder="List the key features that need testing..."
                value={testCasesForm.featureList}
                onChange={(e) => setTestCasesForm({ ...testCasesForm, featureList: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                rows={3}
                data-testid="input-feature-list"
              />
            </div>

            <div>
              <Label htmlFor="testing-scope">Testing Scope</Label>
              <Input
                id="testing-scope"
                placeholder="e.g., Functional, Integration, E2E, Security"
                value={testCasesForm.testingScope}
                onChange={(e) => setTestCasesForm({ ...testCasesForm, testingScope: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                data-testid="input-testing-scope"
              />
            </div>

            <div>
              <Label htmlFor="critical-flows">Critical User Flows (Optional)</Label>
              <Textarea
                id="critical-flows"
                placeholder="Describe critical user journeys that must be tested..."
                value={testCasesForm.criticalFlows}
                onChange={(e) => setTestCasesForm({ ...testCasesForm, criticalFlows: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                rows={3}
                data-testid="input-critical-flows"
              />
            </div>

            <Button
              onClick={() => testCasesMutation.mutate()}
              disabled={!sessionId || testCasesMutation.isPending || !testCasesForm.productDescription || !testCasesForm.featureList || !testCasesForm.testingScope}
              className="w-full bg-purple-600 hover:bg-purple-700"
              data-testid="button-generate-test-cases"
            >
              {testCasesMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Test Cases...
                </>
              ) : (
                'Generate Test Cases'
              )}
            </Button>
          </div>
        </TabsContent>

        {/* QA Strategy Tab */}
        <TabsContent value="qa-strategy" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-type">Project Type</Label>
              <Input
                id="project-type"
                placeholder="e.g., Web App, Mobile App, SaaS Platform"
                value={qaStrategyForm.projectType}
                onChange={(e) => setQaStrategyForm({ ...qaStrategyForm, projectType: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                data-testid="input-project-type"
              />
            </div>

            <div>
              <Label htmlFor="team-size">Team Size</Label>
              <Input
                id="team-size"
                placeholder="e.g., 5 developers, 2 QA engineers"
                value={qaStrategyForm.teamSize}
                onChange={(e) => setQaStrategyForm({ ...qaStrategyForm, teamSize: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                data-testid="input-team-size"
              />
            </div>

            <div>
              <Label htmlFor="timeline">Project Timeline</Label>
              <Input
                id="timeline"
                placeholder="e.g., 14 days to MVP, 3 months to production"
                value={qaStrategyForm.timeline}
                onChange={(e) => setQaStrategyForm({ ...qaStrategyForm, timeline: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                data-testid="input-timeline"
              />
            </div>

            <div>
              <Label htmlFor="quality-goals">Quality Goals</Label>
              <Textarea
                id="quality-goals"
                placeholder="Define your quality objectives and acceptance criteria..."
                value={qaStrategyForm.qualityGoals}
                onChange={(e) => setQaStrategyForm({ ...qaStrategyForm, qualityGoals: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                rows={4}
                data-testid="input-quality-goals"
              />
            </div>

            <Button
              onClick={() => qaStrategyMutation.mutate()}
              disabled={!sessionId || qaStrategyMutation.isPending || !qaStrategyForm.projectType || !qaStrategyForm.teamSize || !qaStrategyForm.timeline || !qaStrategyForm.qualityGoals}
              className="w-full bg-purple-600 hover:bg-purple-700"
              data-testid="button-generate-qa-strategy"
            >
              {qaStrategyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating QA Strategy...
                </>
              ) : (
                'Generate QA Strategy'
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Automation Setup Tab */}
        <TabsContent value="automation" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="tech-stack">Technology Stack</Label>
              <Input
                id="tech-stack"
                placeholder="e.g., React, Node.js, PostgreSQL"
                value={automationForm.techStack}
                onChange={(e) => setAutomationForm({ ...automationForm, techStack: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                data-testid="input-tech-stack"
              />
            </div>

            <div>
              <Label htmlFor="testing-framework">Preferred Testing Framework</Label>
              <Input
                id="testing-framework"
                placeholder="e.g., Playwright, Cypress, Jest, Vitest"
                value={automationForm.testingFramework}
                onChange={(e) => setAutomationForm({ ...automationForm, testingFramework: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                data-testid="input-testing-framework"
              />
            </div>

            <div>
              <Label htmlFor="cicd-platform">CI/CD Platform</Label>
              <Input
                id="cicd-platform"
                placeholder="e.g., GitHub Actions, GitLab CI, Jenkins"
                value={automationForm.cicdPlatform}
                onChange={(e) => setAutomationForm({ ...automationForm, cicdPlatform: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                data-testid="input-cicd-platform"
              />
            </div>

            <div>
              <Label htmlFor="coverage-goals">Coverage Goals</Label>
              <Textarea
                id="coverage-goals"
                placeholder="Define your code coverage and testing goals..."
                value={automationForm.coverageGoals}
                onChange={(e) => setAutomationForm({ ...automationForm, coverageGoals: e.target.value })}
                className="mt-2 glass border-purple-500/30 text-foreground"
                rows={3}
                data-testid="input-coverage-goals"
              />
            </div>

            <Button
              onClick={() => automationMutation.mutate()}
              disabled={!sessionId || automationMutation.isPending || !automationForm.techStack || !automationForm.testingFramework || !automationForm.cicdPlatform || !automationForm.coverageGoals}
              className="w-full bg-purple-600 hover:bg-purple-700"
              data-testid="button-generate-automation"
            >
              {automationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Automation Setup...
                </>
              ) : (
                'Generate Automation Setup'
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
