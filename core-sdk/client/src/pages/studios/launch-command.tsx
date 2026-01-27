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
import { Rocket, Server, Code, Loader2, Activity } from 'lucide-react';
import { useAGUIStream } from '@/hooks/use-agui-stream';
import { ThinkingStepsPanel, type ThinkingStep } from '@/components/agui/ThinkingStepsPanel';
import { ToolCallsPanel, type ToolCall } from '@/components/agui/ToolCallsPanel';
import { StudioOutcomesSection } from '@/components/wizards/studio-outcomes-section';
import { getStudioMessaging, getStudioCTA, SECTION_LABELS } from '@/constants/studios/messaging';
import { StudioReadinessGate } from '@/components/studio/StudioReadinessGate';

export default function LaunchCommandStudio() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Get studio messaging configuration
  const studioMessaging = getStudioMessaging('launch-command');
  const queryParams = new URLSearchParams(window.location.search);
  const startupIdFromUrl = queryParams.get('startupId');

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
  const [deploymentForm, setDeploymentForm] = useState({
    appType: '',
    scalingNeeds: '',
    budgetConstraints: '',
    complianceRequirements: '',
  });

  const [devopsForm, setDevopsForm] = useState({
    teamSize: '',
    releaseFrequency: '',
    techStack: '',
    qualityStandards: '',
  });

  const [infrastructureForm, setInfrastructureForm] = useState({
    cloudProvider: '',
    resourceNeeds: '',
    securityRequirements: '',
    backupStrategy: '',
  });

  const [monitoringForm, setMonitoringForm] = useState({
    metricsNeeds: '',
    alertingRequirements: '',
    loggingStrategy: '',
    observabilityTools: '',
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
      return await apiRequest('/api/wizards/studios/launch-command/sessions', {
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

  // Deployment Strategy Mutation
  const deploymentMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/launch-command/generate-deployment-strategy', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          appType: deploymentForm.appType,
          scalingNeeds: deploymentForm.scalingNeeds,
          budgetConstraints: deploymentForm.budgetConstraints,
          complianceRequirements: deploymentForm.complianceRequirements,
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
        title: 'Deployment Strategy Generated',
        description: 'Your deployment strategy has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate deployment strategy',
        variant: 'destructive',
      });
    },
  });

  // DevOps Setup Mutation
  const devopsMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/launch-command/generate-devops-setup', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          teamSize: devopsForm.teamSize,
          releaseFrequency: devopsForm.releaseFrequency,
          techStack: devopsForm.techStack,
          qualityStandards: devopsForm.qualityStandards,
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
        title: 'DevOps Setup Generated',
        description: 'Your DevOps configuration has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate DevOps setup',
        variant: 'destructive',
      });
    },
  });

  // Infrastructure Code Mutation
  const infrastructureMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/launch-command/generate-infrastructure-code', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          cloudProvider: infrastructureForm.cloudProvider,
          resourceNeeds: infrastructureForm.resourceNeeds,
          securityRequirements: infrastructureForm.securityRequirements,
          backupStrategy: infrastructureForm.backupStrategy,
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
        title: 'Infrastructure Code Generated',
        description: 'Your infrastructure as code has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate infrastructure code',
        variant: 'destructive',
      });
    },
  });

  // Monitoring Setup Mutation
  const monitoringMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/launch-command/generate-monitoring-setup', {
        method: 'POST',
        body: JSON.stringify({
          startupId,
          sessionId,
          metricsNeeds: monitoringForm.metricsNeeds,
          alertingRequirements: monitoringForm.alertingRequirements,
          loggingStrategy: monitoringForm.loggingStrategy,
          observabilityTools: monitoringForm.observabilityTools,
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
        title: 'Monitoring Setup Generated',
        description: 'Your monitoring and observability setup has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate monitoring setup',
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
          <p className="text-foreground" data-testid="text-session-loading">Initializing Launch Command...</p>
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
    <StudioReadinessGate studioId="launch-command" startupId={startupId}>
      <StudioBaseUI
      title="Launch Command"
      description={studioMessaging?.tagline || "Prepare for launch. Get launch checklists, go-to-market strategy, and first customer acquisition plans."}
      icon={Rocket}
      iconColor="text-orange-500"
      startupId={startupId}
    >
      {/* What You'll Create Section */}
      {studioMessaging && (
        <StudioOutcomesSection
          outcomes={studioMessaging.outcomes}
          title={SECTION_LABELS.OUTCOMES}
        />
      )}
      
      <Tabs defaultValue="deployment" className="w-full" data-testid="tabs-launch-command">
        <TabsList className="grid w-full grid-cols-4 bg-background border border-purple-900/50">
          <TabsTrigger value="deployment" data-testid="tab-deployment">
            <Rocket className="h-4 w-4 mr-2" />
            Deployment Strategy
          </TabsTrigger>
          <TabsTrigger value="devops" data-testid="tab-devops">
            <Server className="h-4 w-4 mr-2" />
            DevOps Setup
          </TabsTrigger>
          <TabsTrigger value="infrastructure" data-testid="tab-infrastructure">
            <Code className="h-4 w-4 mr-2" />
            Infrastructure Code
          </TabsTrigger>
          <TabsTrigger value="monitoring" data-testid="tab-monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Monitoring Setup
          </TabsTrigger>
        </TabsList>

        {/* Deployment Strategy Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <div className="bg-background border border-purple-900/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Generate Deployment Strategy</h3>
            <p className="text-foreground-secondary mb-6">
              Get a comprehensive deployment strategy tailored to your application needs
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="appType" className="text-foreground">Application Type</Label>
                <Input
                  id="appType"
                  value={deploymentForm.appType}
                  onChange={(e) => setDeploymentForm({ ...deploymentForm, appType: e.target.value })}
                  placeholder="e.g., Web application, Mobile app, API service"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-app-type"
                />
              </div>
              <div>
                <Label htmlFor="scalingNeeds" className="text-foreground">Scaling Needs</Label>
                <Input
                  id="scalingNeeds"
                  value={deploymentForm.scalingNeeds}
                  onChange={(e) => setDeploymentForm({ ...deploymentForm, scalingNeeds: e.target.value })}
                  placeholder="e.g., High traffic, Low latency, Global distribution"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-scaling-needs"
                />
              </div>
              <div>
                <Label htmlFor="budgetConstraints" className="text-foreground">Budget Constraints</Label>
                <Input
                  id="budgetConstraints"
                  value={deploymentForm.budgetConstraints}
                  onChange={(e) => setDeploymentForm({ ...deploymentForm, budgetConstraints: e.target.value })}
                  placeholder="e.g., $500/month, Cost-optimized, Enterprise budget"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-budget-constraints"
                />
              </div>
              <div>
                <Label htmlFor="complianceRequirements" className="text-foreground">Compliance Requirements (Optional)</Label>
                <Textarea
                  id="complianceRequirements"
                  value={deploymentForm.complianceRequirements}
                  onChange={(e) => setDeploymentForm({ ...deploymentForm, complianceRequirements: e.target.value })}
                  placeholder="e.g., GDPR, HIPAA, SOC 2"
                  className="glass border-purple-900/50 text-foreground"
                  rows={3}
                  data-testid="input-compliance-requirements"
                />
              </div>
              <Button
                onClick={() => deploymentMutation.mutate()}
                disabled={!sessionId || !deploymentForm.appType || deploymentMutation.isPending}
                className="w-full"
                data-testid="button-generate-deployment"
              >
                {deploymentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Deployment Strategy'
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* DevOps Setup Tab */}
        <TabsContent value="devops" className="space-y-6">
          <div className="bg-background border border-purple-900/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Generate DevOps Setup</h3>
            <p className="text-foreground-secondary mb-6">
              Create a complete DevOps configuration with CI/CD pipelines and automation
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamSize" className="text-foreground">Team Size</Label>
                <Input
                  id="teamSize"
                  value={devopsForm.teamSize}
                  onChange={(e) => setDevopsForm({ ...devopsForm, teamSize: e.target.value })}
                  placeholder="e.g., 2-5 developers, 10+ team members"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-team-size"
                />
              </div>
              <div>
                <Label htmlFor="releaseFrequency" className="text-foreground">Release Frequency (Optional)</Label>
                <Input
                  id="releaseFrequency"
                  value={devopsForm.releaseFrequency}
                  onChange={(e) => setDevopsForm({ ...devopsForm, releaseFrequency: e.target.value })}
                  placeholder="e.g., Daily, Weekly, Continuous deployment"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-release-frequency"
                />
              </div>
              <div>
                <Label htmlFor="techStack" className="text-foreground">Tech Stack (Optional)</Label>
                <Input
                  id="techStack"
                  value={devopsForm.techStack}
                  onChange={(e) => setDevopsForm({ ...devopsForm, techStack: e.target.value })}
                  placeholder="e.g., React, Node.js, PostgreSQL"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-tech-stack"
                />
              </div>
              <div>
                <Label htmlFor="qualityStandards" className="text-foreground">Quality Standards (Optional)</Label>
                <Textarea
                  id="qualityStandards"
                  value={devopsForm.qualityStandards}
                  onChange={(e) => setDevopsForm({ ...devopsForm, qualityStandards: e.target.value })}
                  placeholder="e.g., 80% code coverage, Security scanning required"
                  className="glass border-purple-900/50 text-foreground"
                  rows={3}
                  data-testid="input-quality-standards"
                />
              </div>
              <Button
                onClick={() => devopsMutation.mutate()}
                disabled={!sessionId || !devopsForm.teamSize || devopsMutation.isPending}
                className="w-full"
                data-testid="button-generate-devops"
              >
                {devopsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate DevOps Setup'
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Infrastructure Code Tab */}
        <TabsContent value="infrastructure" className="space-y-6">
          <div className="bg-background border border-purple-900/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Generate Infrastructure as Code</h3>
            <p className="text-foreground-secondary mb-6">
              Get production-ready infrastructure code for your cloud platform
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cloudProvider" className="text-foreground">Cloud Provider</Label>
                <Input
                  id="cloudProvider"
                  value={infrastructureForm.cloudProvider}
                  onChange={(e) => setInfrastructureForm({ ...infrastructureForm, cloudProvider: e.target.value })}
                  placeholder="e.g., AWS, Azure, Google Cloud"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-cloud-provider"
                />
              </div>
              <div>
                <Label htmlFor="resourceNeeds" className="text-foreground">Resource Needs (Optional)</Label>
                <Input
                  id="resourceNeeds"
                  value={infrastructureForm.resourceNeeds}
                  onChange={(e) => setInfrastructureForm({ ...infrastructureForm, resourceNeeds: e.target.value })}
                  placeholder="e.g., Container-based, Serverless, VM-based"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-resource-needs"
                />
              </div>
              <div>
                <Label htmlFor="securityRequirements" className="text-foreground">Security Requirements (Optional)</Label>
                <Input
                  id="securityRequirements"
                  value={infrastructureForm.securityRequirements}
                  onChange={(e) => setInfrastructureForm({ ...infrastructureForm, securityRequirements: e.target.value })}
                  placeholder="e.g., CIS benchmarks, Zero trust architecture"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-security-requirements"
                />
              </div>
              <div>
                <Label htmlFor="backupStrategy" className="text-foreground">Backup Strategy (Optional)</Label>
                <Textarea
                  id="backupStrategy"
                  value={infrastructureForm.backupStrategy}
                  onChange={(e) => setInfrastructureForm({ ...infrastructureForm, backupStrategy: e.target.value })}
                  placeholder="e.g., Daily automated backups, Point-in-time recovery"
                  className="glass border-purple-900/50 text-foreground"
                  rows={3}
                  data-testid="input-backup-strategy"
                />
              </div>
              <Button
                onClick={() => infrastructureMutation.mutate()}
                disabled={!sessionId || !infrastructureForm.cloudProvider || infrastructureMutation.isPending}
                className="w-full"
                data-testid="button-generate-infrastructure"
              >
                {infrastructureMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Infrastructure Code'
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Monitoring Setup Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="bg-background border border-purple-900/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Generate Monitoring Setup</h3>
            <p className="text-foreground-secondary mb-6">
              Set up comprehensive monitoring, alerting, and observability for your application
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="metricsNeeds" className="text-foreground">Metrics Needs</Label>
                <Input
                  id="metricsNeeds"
                  value={monitoringForm.metricsNeeds}
                  onChange={(e) => setMonitoringForm({ ...monitoringForm, metricsNeeds: e.target.value })}
                  placeholder="e.g., Application performance, Infrastructure metrics, Business KPIs"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-metrics-needs"
                />
              </div>
              <div>
                <Label htmlFor="alertingRequirements" className="text-foreground">Alerting Requirements (Optional)</Label>
                <Input
                  id="alertingRequirements"
                  value={monitoringForm.alertingRequirements}
                  onChange={(e) => setMonitoringForm({ ...monitoringForm, alertingRequirements: e.target.value })}
                  placeholder="e.g., PagerDuty integration, Slack notifications, Email alerts"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-alerting-requirements"
                />
              </div>
              <div>
                <Label htmlFor="loggingStrategy" className="text-foreground">Logging Strategy (Optional)</Label>
                <Input
                  id="loggingStrategy"
                  value={monitoringForm.loggingStrategy}
                  onChange={(e) => setMonitoringForm({ ...monitoringForm, loggingStrategy: e.target.value })}
                  placeholder="e.g., Centralized logging, Log aggregation, Real-time analysis"
                  className="glass border-purple-900/50 text-foreground"
                  data-testid="input-logging-strategy"
                />
              </div>
              <div>
                <Label htmlFor="observabilityTools" className="text-foreground">Observability Tools (Optional)</Label>
                <Textarea
                  id="observabilityTools"
                  value={monitoringForm.observabilityTools}
                  onChange={(e) => setMonitoringForm({ ...monitoringForm, observabilityTools: e.target.value })}
                  placeholder="e.g., Prometheus, Grafana, Datadog, New Relic"
                  className="glass border-purple-900/50 text-foreground"
                  rows={3}
                  data-testid="input-observability-tools"
                />
              </div>
              <Button
                onClick={() => monitoringMutation.mutate()}
                disabled={!sessionId || !monitoringForm.metricsNeeds || monitoringMutation.isPending}
                className="w-full"
                data-testid="button-generate-monitoring"
              >
                {monitoringMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Monitoring Setup'
                )}
              </Button>
            </div>
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
