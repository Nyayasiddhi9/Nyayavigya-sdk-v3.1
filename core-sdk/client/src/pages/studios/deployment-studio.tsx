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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import StudioBaseUI from '@/components/studio-base-ui';
import { StudioOutcomesSection } from '@/components/wizards/studio-outcomes-section';
import { getStudioMessaging } from '@/constants/studios/messaging';
import { StudioReadinessGate } from '@/components/studio/StudioReadinessGate';
import { Rocket, GitBranch, Globe, Activity, Loader2 } from 'lucide-react';
import { useAGUIStream } from '@/hooks/use-agui-stream';
import { ThinkingStepsPanel, type ThinkingStep } from '@/components/agui/ThinkingStepsPanel';
import { ToolCallsPanel, type ToolCall } from '@/components/agui/ToolCallsPanel';

const cloudProviderSchema = z.object({
  provider: z.string().min(1, "Cloud provider is required"),
  projectType: z.string().min(1, "Project type is required"),
  buildCommand: z.string().optional(),
  environment: z.string().optional(),
});

const cicdSetupSchema = z.object({
  platform: z.string().min(1, "CI/CD platform is required"),
  triggers: z.string().min(1, "Deployment triggers are required"),
  testingStrategy: z.string().optional(),
  deploymentStages: z.string().optional(),
});

const domainConfigSchema = z.object({
  domainName: z.string().min(1, "Domain name is required"),
  provider: z.string().min(1, "DNS provider is required"),
  sslSetup: z.string().optional(),
  dnsRecords: z.string().optional(),
});

const monitoringSetupSchema = z.object({
  monitoringService: z.string().min(1, "Monitoring service is required"),
  metrics: z.string().optional(),
  alerting: z.string().optional(),
  logAggregation: z.string().optional(),
});

type CloudProviderForm = z.infer<typeof cloudProviderSchema>;
type CICDSetupForm = z.infer<typeof cicdSetupSchema>;
type DomainConfigForm = z.infer<typeof domainConfigSchema>;
type MonitoringSetupForm = z.infer<typeof monitoringSetupSchema>;

export default function DeploymentStudio() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(window.location.search);
  const startupIdFromUrl = queryParams.get('startupId');
  
  // Get studio messaging configuration
  const studioMessaging = getStudioMessaging('deployment-studio');

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

  const cloudProviderForm = useForm<CloudProviderForm>({
    resolver: zodResolver(cloudProviderSchema),
    defaultValues: {
      provider: '',
      projectType: '',
      buildCommand: '',
      environment: '',
    },
  });

  const cicdForm = useForm<CICDSetupForm>({
    resolver: zodResolver(cicdSetupSchema),
    defaultValues: {
      platform: '',
      triggers: '',
      testingStrategy: '',
      deploymentStages: '',
    },
  });

  const domainForm = useForm<DomainConfigForm>({
    resolver: zodResolver(domainConfigSchema),
    defaultValues: {
      domainName: '',
      provider: '',
      sslSetup: '',
      dnsRecords: '',
    },
  });

  const monitoringForm = useForm<MonitoringSetupForm>({
    resolver: zodResolver(monitoringSetupSchema),
    defaultValues: {
      monitoringService: '',
      metrics: '',
      alerting: '',
      logAggregation: '',
    },
  });

  const { data: startups, isLoading: startupsLoading } = useQuery({
    queryKey: ['/api/wizards/startups'],
  });

  const startupId = startupIdFromUrl ? parseInt(startupIdFromUrl) : startups?.[0]?.id;

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!startupId) {
        throw new Error('No startup selected');
      }
      return await apiRequest('/api/wizards/sessions', {
        method: 'POST',
        body: JSON.stringify({
          studioId: 'deployment-studio',
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

  const cloudProviderMutation = useMutation({
    mutationFn: async (data: CloudProviderForm) => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/deployment-studio/cloud-provider-deploy', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          ...data,
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
        title: 'Deployment Configuration Generated',
        description: 'Your cloud deployment configuration is ready',
      });
      cloudProviderForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate deployment configuration',
        variant: 'destructive',
      });
    },
  });

  const cicdMutation = useMutation({
    mutationFn: async (data: CICDSetupForm) => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/deployment-studio/cicd-setup', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          ...data,
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
        title: 'CI/CD Pipeline Generated',
        description: 'Your CI/CD pipeline configuration is ready',
      });
      cicdForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate CI/CD pipeline',
        variant: 'destructive',
      });
    },
  });

  const domainMutation = useMutation({
    mutationFn: async (data: DomainConfigForm) => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/deployment-studio/domain-configuration', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          ...data,
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
        title: 'Domain Configuration Generated',
        description: 'Your domain configuration guide is ready',
      });
      domainForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/studio-tasks', startupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/artifacts', startupId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate domain configuration',
        variant: 'destructive',
      });
    },
  });

  const monitoringSetupMutation = useMutation({
    mutationFn: async (data: MonitoringSetupForm) => {
      if (!sessionId) {
        throw new Error('Session not initialized');
      }
      return await apiRequest('/api/wizards/deployment-studio/monitoring-setup', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          ...data,
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
        description: 'Your monitoring and observability configuration is ready',
      });
      monitoringForm.reset();
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

  if (startupsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center" data-testid="loader-startups">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!startupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center">
        <div className="text-center" data-testid="text-no-startup">
          <p className="text-foreground-secondary">No startup found. Please create a startup first.</p>
          <Button
            onClick={() => window.location.href = '/founder/dashboard'}
            className="mt-4"
            data-testid="button-go-dashboard"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (createSessionMutation.isPending || (!sessionId && !sessionAttempted)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center" data-testid="loader-session-init">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-foreground-secondary mt-4" data-testid="text-session-loading">Initializing studio session...</p>
        </div>
      </div>
    );
  }

  return (
    <StudioReadinessGate studioId="deployment-studio" startupId={startupId}>
      <StudioBaseUI
      studioName="Deployment Studio"
      studioIcon={<Rocket className="h-6 w-6" />}
      studioDescription={studioMessaging.tagline}
      studioColor="indigo"
    >
      {/* Studio Outcomes Section */}
      <StudioOutcomesSection 
        outcomes={studioMessaging.outcomes}
        className="mb-8"
      />

      <Tabs defaultValue="cloud-deploy" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass">
          <TabsTrigger value="cloud-deploy" data-testid="tab-cloud-deploy">
            <Rocket className="h-4 w-4 mr-2" />
            Cloud Provider Deploy
          </TabsTrigger>
          <TabsTrigger value="cicd-setup" data-testid="tab-cicd-setup">
            <GitBranch className="h-4 w-4 mr-2" />
            CI/CD Setup
          </TabsTrigger>
          <TabsTrigger value="domain-config" data-testid="tab-domain-config">
            <Globe className="h-4 w-4 mr-2" />
            Domain Configuration
          </TabsTrigger>
          <TabsTrigger value="monitoring-setup" data-testid="tab-monitoring-setup">
            <Activity className="h-4 w-4 mr-2" />
            Monitoring Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cloud-deploy" className="mt-6">
          <Form {...cloudProviderForm}>
            <form onSubmit={cloudProviderForm.handleSubmit((data) => {
              cloudProviderMutation.mutate(data);
            })} className="space-y-6">
              <FormField
                control={cloudProviderForm.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cloud Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-provider">
                          <SelectValue placeholder="Select a cloud provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="vercel">Vercel</SelectItem>
                        <SelectItem value="netlify">Netlify</SelectItem>
                        <SelectItem value="railway">Railway</SelectItem>
                        <SelectItem value="render">Render</SelectItem>
                        <SelectItem value="aws-amplify">AWS Amplify</SelectItem>
                        <SelectItem value="heroku">Heroku</SelectItem>
                        <SelectItem value="digitalocean">DigitalOcean App Platform</SelectItem>
                        <SelectItem value="fly-io">Fly.io</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={cloudProviderForm.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Next.js, React + Node.js, Full-stack" data-testid="input-project-type" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={cloudProviderForm.control}
                name="buildCommand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Build Command (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., npm run build" data-testid="input-build-command" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={cloudProviderForm.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Production, Staging" data-testid="input-environment" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={cloudProviderMutation.isPending}
                className="w-full"
                data-testid="button-generate-cloud-deploy"
              >
                {cloudProviderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Configuration...
                  </>
                ) : (
                  'Generate Deployment Configuration'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="cicd-setup" className="mt-6">
          <Form {...cicdForm}>
            <form onSubmit={cicdForm.handleSubmit((data) => {
              cicdMutation.mutate(data);
            })} className="space-y-6">
              <FormField
                control={cicdForm.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CI/CD Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-cicd-platform">
                          <SelectValue placeholder="Select CI/CD platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="github-actions">GitHub Actions</SelectItem>
                        <SelectItem value="gitlab-ci">GitLab CI/CD</SelectItem>
                        <SelectItem value="circleci">CircleCI</SelectItem>
                        <SelectItem value="jenkins">Jenkins</SelectItem>
                        <SelectItem value="travis-ci">Travis CI</SelectItem>
                        <SelectItem value="azure-pipelines">Azure Pipelines</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={cicdForm.control}
                name="triggers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deployment Triggers</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="e.g., Push to main branch, Pull request merged, Tag created" rows={3} data-testid="input-triggers" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={cicdForm.control}
                name="testingStrategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testing Strategy (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="e.g., Unit tests + Integration tests + E2E tests" rows={3} data-testid="input-testing-strategy" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={cicdForm.control}
                name="deploymentStages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deployment Stages (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Staging → Production" data-testid="input-deployment-stages" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={cicdMutation.isPending}
                className="w-full"
                data-testid="button-generate-cicd"
              >
                {cicdMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Pipeline...
                  </>
                ) : (
                  'Generate CI/CD Pipeline'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="domain-config" className="mt-6">
          <Form {...domainForm}>
            <form onSubmit={domainForm.handleSubmit((data) => {
              domainMutation.mutate(data);
            })} className="space-y-6">
              <FormField
                control={domainForm.control}
                name="domainName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., yourstartup.com" data-testid="input-domain-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={domainForm.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNS Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-dns-provider">
                          <SelectValue placeholder="Select DNS provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cloudflare">Cloudflare</SelectItem>
                        <SelectItem value="aws-route53">AWS Route 53</SelectItem>
                        <SelectItem value="google-cloud-dns">Google Cloud DNS</SelectItem>
                        <SelectItem value="namecheap">Namecheap</SelectItem>
                        <SelectItem value="godaddy">GoDaddy</SelectItem>
                        <SelectItem value="vercel-dns">Vercel DNS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={domainForm.control}
                name="sslSetup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SSL Setup (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Auto SSL with Let's Encrypt" data-testid="input-ssl-setup" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={domainForm.control}
                name="dnsRecords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNS Records (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="e.g., A record, CNAME, MX records" rows={3} data-testid="input-dns-records" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={domainMutation.isPending}
                className="w-full"
                data-testid="button-generate-domain-config"
              >
                {domainMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Configuration...
                  </>
                ) : (
                  'Generate Domain Configuration'
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="monitoring-setup" className="mt-6">
          <Form {...monitoringForm}>
            <form onSubmit={monitoringForm.handleSubmit((data) => {
              monitoringSetupMutation.mutate(data);
            })} className="space-y-6">
              <FormField
                control={monitoringForm.control}
                name="monitoringService"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monitoring Service</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-monitoring-service">
                          <SelectValue placeholder="Select monitoring service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="datadog">Datadog</SelectItem>
                        <SelectItem value="new-relic">New Relic</SelectItem>
                        <SelectItem value="sentry">Sentry</SelectItem>
                        <SelectItem value="loggly">Loggly</SelectItem>
                        <SelectItem value="prometheus-grafana">Prometheus + Grafana</SelectItem>
                        <SelectItem value="elastic-stack">Elastic Stack (ELK)</SelectItem>
                        <SelectItem value="cloudwatch">AWS CloudWatch</SelectItem>
                        <SelectItem value="google-cloud-monitoring">Google Cloud Monitoring</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={monitoringForm.control}
                name="metrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metrics to Track (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="e.g., Response time, Error rate, CPU usage, Memory usage" rows={3} data-testid="input-metrics" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={monitoringForm.control}
                name="alerting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alerting Rules (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="e.g., Alert when error rate > 5%, Alert when response time > 2s" rows={3} data-testid="input-alerting" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={monitoringForm.control}
                name="logAggregation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Log Aggregation Setup (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Centralized logging with ELK, CloudWatch Logs" data-testid="input-log-aggregation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={monitoringSetupMutation.isPending}
                className="w-full"
                data-testid="button-generate-monitoring-setup"
              >
                {monitoringSetupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Setup...
                  </>
                ) : (
                  'Generate Monitoring Setup'
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
