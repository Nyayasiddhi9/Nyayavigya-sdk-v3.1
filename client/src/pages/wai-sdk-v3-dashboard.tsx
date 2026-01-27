import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'wouter';
import {
  Mic, FileText, Globe, MessageSquare, Users, Eye, Activity,
  Cpu, Zap, BarChart3, Settings, CheckCircle2, AlertCircle,
  Brain, Network, Database, Shield, Workflow, Bot,
  Play, Pause, RefreshCw, ChevronRight, TrendingUp, Clock
} from 'lucide-react';

interface ServiceStatus {
  status: string;
  [key: string]: any;
}

interface DashboardOverview {
  success: boolean;
  timestamp: string;
  platform: { name: string; version: string; status: string };
  automation: {
    email: { accounts: number; rules: number; providers: string[] };
    voice: { agents: number; activeCalls: number; providers: string[]; templates: string[] };
    messaging: { channels: number; activeChannels: number; platforms: string[] };
  };
  intelligence: {
    orchestration: { subAgents: number; patterns: string[] };
    documents: { processed: number; formats: string[] };
    web: { providers: string[] };
  };
  twins: { total: number; active: number };
  observability: { traces: number; prompts: number; alerts: number };
}

interface HealthStatus {
  success: boolean;
  status: string;
  version: string;
  services: Record<string, ServiceStatus>;
}

const serviceIcons: Record<string, any> = {
  email: MessageSquare,
  voice: Mic,
  messaging: MessageSquare,
  digitalTwin: Users,
  orchestration: Network,
  documentIntelligence: FileText,
  observability: Eye,
  web: Globe
};

const serviceDescriptions: Record<string, string> = {
  email: 'Gmail, Outlook, IMAP automation',
  voice: '4 providers: ElevenLabs, Sarvam, Azure, Google',
  messaging: 'Slack, Teams, WhatsApp, Discord, Telegram',
  digitalTwin: 'ROMA L1-L5 autonomy, behavior modeling',
  orchestration: '5 sub-agents, 5 decomposition patterns',
  documentIntelligence: '15 formats, 7 categories, RAG chunking',
  observability: 'LangSmith-style tracing, A/B testing',
  web: '4 search providers, scraping, market analysis'
};

export default function WAISDKv3Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery<HealthStatus>({
    queryKey: ['/api/wai-v3/v3/health'],
    refetchInterval: 30000
  });

  const { data: overviewData, isLoading: overviewLoading } = useQuery<DashboardOverview>({
    queryKey: ['/api/wai-v3/dashboard/overview'],
    refetchInterval: 60000
  });

  const { data: integrationsData } = useQuery<{ success: boolean; integrations: Record<string, any[]> }>({
    queryKey: ['/api/wai-v3/dashboard/integrations']
  });

  const { data: workflowsData } = useQuery<{ success: boolean; templates: any[]; triggers: any[]; actions: any[] }>({
    queryKey: ['/api/wai-v3/dashboard/workflows']
  });

  const isHealthy = healthData?.status === 'healthy';
  const services = healthData?.services || {};
  const overview = overviewData || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">WAI SDK v3.0</h1>
                <p className="text-sm text-slate-400">Enterprise ERP Orchestration Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isHealthy ? "default" : "destructive"} className="text-sm py-1">
                {isHealthy ? (
                  <><CheckCircle2 className="w-4 h-4 mr-1" /> All Systems Operational</>
                ) : (
                  <><AlertCircle className="w-4 h-4 mr-1" /> Degraded</>
                )}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => refetchHealth()} data-testid="button-refresh">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-slate-700" data-testid="tab-services">
              <Cpu className="w-4 h-4 mr-2" /> Services
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-slate-700" data-testid="tab-agents">
              <Bot className="w-4 h-4 mr-2" /> Agents
            </TabsTrigger>
            <TabsTrigger value="orchestration" className="data-[state=active]:bg-slate-700" data-testid="tab-orchestration">
              <Network className="w-4 h-4 mr-2" /> Orchestration
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-slate-700" data-testid="tab-integrations">
              <Zap className="w-4 h-4 mr-2" /> Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Platform Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-2xl font-bold text-white">{healthData?.version || 'v3.0.0'}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {Object.keys(services).length} services active
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Voice Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Mic className="w-6 h-6 text-purple-400" />
                    <span className="text-2xl font-bold text-white">{services.voice?.agents || 0}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {services.voice?.activeCalls || 0} active calls
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Digital Twins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-400" />
                    <span className="text-2xl font-bold text-white">{services.digitalTwin?.twins || 0}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {services.digitalTwin?.interactions || 0} interactions
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Observability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Eye className="w-6 h-6 text-green-400" />
                    <span className="text-2xl font-bold text-white">{services.observability?.traces || 0}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {services.observability?.prompts || 0} prompts tracked
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Platform Capabilities
                  </CardTitle>
                  <CardDescription>WAI SDK v3.0 Enterprise Features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FeatureCard icon={Mic} title="Voice AI" description="4 providers, 14 languages" color="purple" />
                    <FeatureCard icon={FileText} title="Document Intelligence" description="15 formats, RAG chunking" color="blue" />
                    <FeatureCard icon={Globe} title="Web Intelligence" description="Search, scrape, analyze" color="green" />
                    <FeatureCard icon={MessageSquare} title="Messaging" description="5 platforms integrated" color="yellow" />
                    <FeatureCard icon={Users} title="Digital Twin" description="ROMA L1-L5 autonomy" color="pink" />
                    <FeatureCard icon={Eye} title="WizardSmith" description="Tracing, A/B testing" color="cyan" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StatRow label="LLM Providers" value="23" icon={Brain} />
                  <StatRow label="WAI Agents" value="257" icon={Bot} />
                  <StatRow label="Protocols" value="6" icon={Network} />
                  <StatRow label="MCP Tools" value="530+" icon={Workflow} />
                  <StatRow label="Automation Rate" value="75%" icon={Zap} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(services).map(([name, status]) => {
                const Icon = serviceIcons[name] || Cpu;
                const isOperational = status.status === 'operational';
                return (
                  <Card key={name} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isOperational ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <Icon className={`w-5 h-5 ${isOperational ? 'text-green-400' : 'text-red-400'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-white capitalize text-lg">
                              {name.replace(/([A-Z])/g, ' $1').trim()}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge variant={isOperational ? "default" : "destructive"} className="text-xs">
                          {status.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-400 mb-3">{serviceDescriptions[name] || 'Service operational'}</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(status).filter(([k]) => k !== 'status').slice(0, 3).map(([key, val]) => (
                          <Badge key={key} variant="outline" className="text-xs text-slate-300">
                            {key}: {typeof val === 'number' ? val : Array.isArray(val) ? val.length : String(val)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  WAI SDK Agent Registry
                </CardTitle>
                <CardDescription>257 Generic AI Agents with 22-Section System Prompts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  <AgentTierCard tier="Executive" count={24} color="amber" />
                  <AgentTierCard tier="Development" count={77} color="blue" />
                  <AgentTierCard tier="Domain" count={104} color="purple" />
                  <AgentTierCard tier="Creative" count={20} color="pink" />
                  <AgentTierCard tier="QA" count={15} color="green" />
                  <AgentTierCard tier="DevOps" count={17} color="cyan" />
                </div>
                <div className="flex gap-4">
                  <Link href="/agent-chat">
                    <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-open-agent-chat">
                      <Bot className="w-4 h-4 mr-2" /> Open Agent Chat
                    </Button>
                  </Link>
                  <Link href="/orchestration-hub">
                    <Button variant="outline" data-testid="button-agent-orchestration">
                      <Network className="w-4 h-4 mr-2" /> Agent Orchestration
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orchestration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Network className="w-5 h-5 text-blue-400" />
                    Sub-Agent System
                  </CardTitle>
                  <CardDescription>5 specialized sub-agents for task decomposition</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SubAgentRow name="Research Agent" role="Information gathering" status="idle" />
                  <SubAgentRow name="Analysis Agent" role="Data analysis" status="idle" />
                  <SubAgentRow name="Execution Agent" role="Task execution" status="idle" />
                  <SubAgentRow name="Review Agent" role="Quality review" status="idle" />
                  <SubAgentRow name="Synthesis Agent" role="Result aggregation" status="idle" />
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-green-400" />
                    Decomposition Patterns
                  </CardTitle>
                  <CardDescription>5 task decomposition strategies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PatternRow name="Sequential" description="Step-by-step execution" />
                  <PatternRow name="Parallel" description="Concurrent processing" />
                  <PatternRow name="Hierarchical" description="Tree-based delegation" />
                  <PatternRow name="DAG" description="Dependency-aware workflow" />
                  <PatternRow name="Hybrid" description="Dynamic pattern selection" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Platform Integrations
                </CardTitle>
                <CardDescription>{Object.values(integrationsData?.integrations || {}).flat().length || 0} integrations configured</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(integrationsData?.integrations || {}).map(([category, integrations]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-slate-300 mb-3 capitalize">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(integrations as any[]).map((integration: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="p-1.5 bg-slate-600 rounded">
                                <Zap className="w-3 h-3 text-yellow-400" />
                              </div>
                              <span className="font-medium text-white text-sm">{integration.name || integration.id}</span>
                            </div>
                            <Badge variant={integration.status === 'configured' ? 'default' : 'outline'} className="text-xs">
                              {integration.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: { icon: any; title: string; description: string; color: string }) {
  const colorClasses: Record<string, string> = {
    purple: 'text-purple-400 bg-purple-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
    green: 'text-green-400 bg-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/20',
    pink: 'text-pink-400 bg-pink-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/20'
  };
  return (
    <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="font-medium text-white mb-1">{title}</h4>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );
}

function StatRow({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}

function AgentTierCard({ tier, count, color }: { tier: string; count: number; color: string }) {
  const colorClasses: Record<string, string> = {
    amber: 'border-amber-500/50 bg-amber-500/10',
    blue: 'border-blue-500/50 bg-blue-500/10',
    purple: 'border-purple-500/50 bg-purple-500/10',
    pink: 'border-pink-500/50 bg-pink-500/10',
    green: 'border-green-500/50 bg-green-500/10',
    cyan: 'border-cyan-500/50 bg-cyan-500/10'
  };
  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} text-center`}>
      <div className="text-2xl font-bold text-white">{count}</div>
      <div className="text-xs text-slate-400">{tier}</div>
    </div>
  );
}

function SubAgentRow({ name, role, status }: { name: string; role: string; status: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Bot className="w-5 h-5 text-blue-400" />
        <div>
          <div className="font-medium text-white">{name}</div>
          <div className="text-xs text-slate-400">{role}</div>
        </div>
      </div>
      <Badge variant="outline" className="text-slate-300">{status}</Badge>
    </div>
  );
}

function PatternRow({ name, description }: { name: string; description: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Workflow className="w-5 h-5 text-green-400" />
        <div>
          <div className="font-medium text-white">{name}</div>
          <div className="text-xs text-slate-400">{description}</div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500" />
    </div>
  );
}
