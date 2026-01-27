import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import apiRequest from '@/lib/queryClient';
import { JourneyTimeline } from '@/components/wizards/journey-timeline';
import {
  Sparkles,
  Rocket,
  TrendingUp,
  Users,
  Code,
  Zap,
  Shield,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lightbulb,
  Palette,
  TestTube,
  Lock,
  Settings,
  HeartHandshake,
  Home,
  Circle,
} from 'lucide-react';

interface Startup {
  id: number;
  name: string;
  description: string;
  currentPhase: string;
  progress: number;
  creditsAllocated: number;
  creditsUsed: number;
}

interface Studio {
  id: number;
  studioId: string;
  name: string;
  description: string;
  icon: string;
  agentCount: number;
  isActive: boolean;
}

interface Artifact {
  id: number;
  artifactType: string;
  name: string;
  version: number;
}

interface DashboardData {
  startup: Startup;
  sessions: {
    total: number;
    active: number;
    completed: number;
  };
  artifacts: {
    total: number;
    byType: Record<string, number>;
  };
  orchestration: {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    runningJobs: number;
  };
  timeline: Array<{
    id: number;
    eventType: string;
    eventName: string;
    eventDescription: string | null;
    studioName: string | null;
    dayNumber: number | null;
    metadata: Record<string, any>;
    createdAt: string;
  }>;
  progress: {
    overall: number;
    phase: string;
    creditsUsed: number;
    creditsRemaining: number;
  };
}

const studioIcons: Record<string, any> = {
  'ideation_lab': Lightbulb,
  'design_studio': Palette,
  'code_factory': Code,
  'testing_arena': TestTube,
  'deployment_hub': Rocket,
  'analytics_engine': BarChart3,
  'security_vault': Lock,
  'integration_hub': Zap,
  'optimization_center': TrendingUp,
  'support_network': HeartHandshake,
};

export default function WizardsFounderDashboard() {
  const [, params] = useRoute("/startups/:id");
  const startupId = params?.id ? parseInt(params.id) : 1; // Fallback to 1 for testing

  const { data: dashboard, isLoading, error } = useQuery<DashboardData>({
    queryKey: [`/api/wizards/startups/${startupId}/dashboard`],
    queryFn: () => apiRequest(`/api/wizards/startups/${startupId}/dashboard`),
  });

  const { data: studiosData } = useQuery<{ studios: Studio[] }>({
    queryKey: ['/api/wizards/studios'],
    queryFn: () => apiRequest('/api/wizards/studios'),
  });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(222,47%,11%)]">
        <div className="text-center text-red-500">
          <p>Error loading dashboard: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(222,47%,11%)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(217,91%,60%)] mx-auto mb-4"></div>
          <p className="text-[hsl(220,9%,65%)]">Loading your startup dashboard...</p>
          <p className="text-xs mt-2">isLoading: {String(isLoading)}, dashboard: {String(!!dashboard)}</p>
        </div>
      </div>
    );
  }

  const phaseSteps = ['ideation', 'design', 'development', 'testing', 'launch'];
  const currentPhaseIndex = phaseSteps.indexOf(dashboard.progress.phase);

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-[hsl(0,0%,98%)]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[hsl(222,47%,15%)]/80 backdrop-blur-lg border-b border-[hsl(222,35%,20%)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/founder-dashboard">
              <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                <Home className="w-4 h-4 mr-2" />
                All Startups
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{dashboard.startup.name}</h1>
              <p className="text-sm text-[hsl(220,9%,65%)]">Wizards Incubator Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-[hsl(142,71%,45%)]/20 text-[hsl(142,71%,45%)] border-[hsl(142,71%,45%)]/30">
              <div className="w-2 h-2 rounded-full bg-[hsl(142,71%,45%)] mr-2 animate-pulse" />
              267+ Agents Active
            </Badge>
            <Button 
              data-testid="button-start-studio"
              className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] text-white"
            >
              Start New Studio <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Start Journey CTA - Show for new startups with low progress */}
        {dashboard.progress.overall < 10 && (
          <Card className="p-8 bg-gradient-to-br from-[hsl(217,91%,60%)]/20 to-[hsl(270,75%,65%)]/20 border-[hsl(217,91%,60%)]/50" data-testid="card-journey-cta">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center lg:text-left">
                <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Setup Complete
                </Badge>
                <h2 className="text-3xl font-bold mb-3">Start Your 14-Day Journey</h2>
                <p className="text-[hsl(220,9%,65%)] text-lg mb-6 max-w-2xl">
                  Transform your idea into a production-ready MVP with AI-powered assistance across 10 specialized studios. 
                  Your journey begins with validating your idea in the <strong className="text-[hsl(217,91%,60%)]">Ideation Lab</strong>.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Link to={`/studios/ideation-lab?startupId=${startupId}`}>
                    <Button 
                      size="lg"
                      className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] text-white px-8 py-6 text-lg"
                      data-testid="button-start-ideation"
                    >
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Start in Ideation Lab
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to={`/journey-guide/${startupId}`}>
                    <Button 
                      size="lg"
                      variant="outline"
                      className="bg-white/10 border-white/20 hover:bg-white/20 text-white px-8 py-6 text-lg backdrop-blur-sm"
                      data-testid="button-view-roadmap"
                    >
                      <BarChart3 className="w-5 h-5 mr-2" />
                      View Full Roadmap
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 min-w-[240px]">
                <Card className="p-4 bg-[hsl(222,47%,15%)]/80 backdrop-blur border-[hsl(222,35%,20%)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(217,91%,60%)]/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                    </div>
                    <div>
                      <div className="text-2xl font-mono font-bold">14</div>
                      <p className="text-xs text-[hsl(220,9%,65%)]">Days to MVP</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-[hsl(222,47%,15%)]/80 backdrop-blur border-[hsl(222,35%,20%)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-mono font-bold">267+</div>
                      <p className="text-xs text-[hsl(220,9%,65%)]">AI Agents</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        )}
        
        {/* 4-Phase Journey Overview - Show for new startups */}
        {dashboard.progress.overall < 10 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">Your 14-Day Roadmap</h3>
                <p className="text-[hsl(220,9%,65%)] mt-1">Four structured phases to transform your idea into a production MVP</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phase 1: Discovery & Planning */}
              <Card className="p-6 bg-[hsl(222,47%,15%)] border-[hsl(217,91%,60%)]/30" data-testid="card-phase-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="mb-2 bg-[hsl(217,91%,60%)]/10 text-[hsl(217,91%,60%)] border-[hsl(217,91%,60%)]/50">
                      Days 1-4
                    </Badge>
                    <h4 className="text-xl font-semibold">Phase 1: Discovery & Planning</h4>
                    <p className="text-[hsl(220,9%,65%)] text-sm mt-2">
                      Validate your idea, research the market, and create your product blueprint
                    </p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span>Ideation Lab</span>
                    <Badge className="ml-auto bg-green-500/10 text-green-500 text-xs">Ready</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[hsl(220,9%,65%)]">
                    <TrendingUp className="w-4 h-4" />
                    <span>Market Intelligence</span>
                    <Badge className="ml-auto bg-gray-700 text-gray-400 text-xs">Locked</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[hsl(220,9%,65%)]">
                    <Code className="w-4 h-4" />
                    <span>Product Blueprint</span>
                    <Badge className="ml-auto bg-gray-700 text-gray-400 text-xs">Locked</Badge>
                  </div>
                </div>
              </Card>

              {/* Phase 2: Design & Development */}
              <Card className="p-6 bg-[hsl(222,47%,15%)] border-gray-800" data-testid="card-phase-2">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="mb-2 bg-gray-700 text-gray-400 border-gray-600">
                      Days 5-9
                    </Badge>
                    <h4 className="text-xl font-semibold text-[hsl(220,9%,65%)]">Phase 2: Design & Development</h4>
                    <p className="text-[hsl(220,9%,46%)] text-sm mt-2">
                      Design the user experience and build your MVP features
                    </p>
                  </div>
                  <Circle className="w-6 h-6 text-gray-600" />
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-[hsl(220,9%,65%)]">
                    <Palette className="w-4 h-4" />
                    <span>Experience Design</span>
                    <Badge className="ml-auto bg-gray-700 text-gray-400 text-xs">Locked</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[hsl(220,9%,65%)]">
                    <Code className="w-4 h-4" />
                    <span>Engineering Forge</span>
                    <Badge className="ml-auto bg-gray-700 text-gray-400 text-xs">Locked</Badge>
                  </div>
                </div>
              </Card>

              {/* Phase 3: Testing & Growth */}
              <Card className="p-6 bg-[hsl(222,47%,15%)] border-gray-800" data-testid="card-phase-3">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="mb-2 bg-gray-700 text-gray-400 border-gray-600">
                      Days 10-12
                    </Badge>
                    <h4 className="text-xl font-semibold text-[hsl(220,9%,65%)]">Phase 3: QA & Growth</h4>
                    <p className="text-[hsl(220,9%,46%)] text-sm mt-2">
                      Test quality, plan growth strategies, and optimize operations
                    </p>
                  </div>
                  <Circle className="w-6 h-6 text-gray-600" />
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-[hsl(220,9%,65%)]">
                    <Shield className="w-4 h-4" />
                    <span>Quality Assurance Lab</span>
                    <Badge className="ml-auto bg-gray-700 text-gray-400 text-xs">Locked</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[hsl(220,9%,65%)]">
                    <Rocket className="w-4 h-4" />
                    <span>Growth Engine</span>
                    <Badge className="ml-auto bg-gray-700 text-gray-400 text-xs">Locked</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[hsl(220,9%,65%)]">
                    <Settings className="w-4 h-4" />
                    <span>Operations Hub</span>
                    <Badge className="ml-auto bg-gray-700 text-gray-400 text-xs">Locked</Badge>
                  </div>
                </div>
              </Card>

              {/* Phase 4: Launch & Deploy */}
              <Card className="p-6 bg-[hsl(222,47%,15%)] border-gray-800" data-testid="card-phase-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="mb-2 bg-gray-700 text-gray-400 border-gray-600">
                      Days 13-14
                    </Badge>
                    <h4 className="text-xl font-semibold text-[hsl(220,9%,65%)]">Phase 4: Launch & Deploy</h4>
                    <p className="text-[hsl(220,9%,46%)] text-sm mt-2">
                      Prepare for launch and deploy your production-ready MVP
                    </p>
                  </div>
                  <Circle className="w-6 h-6 text-gray-600" />
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-[hsl(220,9%,65%)]">
                    <BarChart3 className="w-4 h-4" />
                    <span>Launch Command</span>
                    <Badge className="ml-auto bg-gray-700 text-gray-400 text-xs">Locked</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[hsl(220,9%,65%)]">
                    <Zap className="w-4 h-4" />
                    <span>Deployment Studio</span>
                    <Badge className="ml-auto bg-gray-700 text-gray-400 text-xs">Locked</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
        
        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Progress Card */}
          <Card className="lg:col-span-2 p-6 bg-[hsl(222,47%,15%)] border-[hsl(222,35%,20%)]" data-testid="card-progress-overview">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">14-Day Journey Progress</h2>
                <p className="text-[hsl(220,9%,65%)]">Day {Math.ceil((dashboard.progress.overall / 100) * 14)} of 14</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-[hsl(217,91%,60%)]">
                  {dashboard.progress.overall}%
                </div>
                <p className="text-sm text-[hsl(220,9%,65%)]">Complete</p>
              </div>
            </div>

            <Progress 
              value={dashboard.progress.overall} 
              className="h-3 mb-6 bg-[hsl(222,35%,20%)]"
              data-testid="progress-overall"
            />

            {/* Phase Indicators */}
            <div className="flex justify-between items-center">
              {phaseSteps.map((phase, idx) => (
                <div key={phase} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    idx <= currentPhaseIndex 
                      ? 'bg-[hsl(217,91%,60%)] text-white' 
                      : 'bg-[hsl(222,35%,20%)] text-[hsl(220,9%,46%)]'
                  }`}>
                    {idx < currentPhaseIndex && <CheckCircle2 className="w-6 h-6" />}
                    {idx === currentPhaseIndex && <Clock className="w-6 h-6" />}
                  </div>
                  <p className={`text-xs capitalize ${
                    idx <= currentPhaseIndex 
                      ? 'text-[hsl(0,0%,98%)]' 
                      : 'text-[hsl(220,9%,46%)]'
                  }`}>
                    {phase}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Credits Card */}
          <Card className="p-6 bg-gradient-to-br from-[hsl(270,75%,65%)]/20 to-[hsl(217,91%,60%)]/20 border-[hsl(270,75%,65%)]/30" data-testid="card-credits">
            <h3 className="text-lg font-semibold mb-4">AI Credits</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[hsl(220,9%,65%)]">Used</span>
                  <span className="font-mono font-bold">{dashboard.progress.creditsUsed}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-[hsl(220,9%,65%)]">Remaining</span>
                  <span className="font-mono font-bold text-[hsl(142,71%,45%)]">{dashboard.progress.creditsRemaining}</span>
                </div>
                <Progress 
                  value={(dashboard.progress.creditsUsed / dashboard.startup.creditsAllocated) * 100} 
                  className="h-2 bg-[hsl(222,35%,20%)]"
                  data-testid="progress-credits"
                />
              </div>
              <Button variant="outline" className="w-full border-[hsl(270,75%,65%)] text-[hsl(270,75%,65%)] hover:bg-[hsl(270,75%,65%)]/10" data-testid="button-add-credits">
                Add More Credits
              </Button>
            </div>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-[hsl(222,47%,15%)] border-l-4 border-l-[hsl(217,91%,60%)] border-[hsl(222,35%,20%)]" data-testid="card-stat-sessions">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-[hsl(217,91%,60%)]" />
              <Badge variant="secondary">{dashboard.sessions.active} Active</Badge>
            </div>
            <div className="text-3xl font-mono font-bold">{dashboard.sessions.total}</div>
            <p className="text-sm text-[hsl(220,9%,65%)]">Studio Sessions</p>
          </Card>

          <Card className="p-4 bg-[hsl(222,47%,15%)] border-l-4 border-l-[hsl(142,71%,45%)] border-[hsl(222,35%,20%)]" data-testid="card-stat-orchestration">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-[hsl(142,71%,45%)]" />
              <TrendingUp className="w-4 h-4 text-[hsl(142,71%,45%)]" />
            </div>
            <div className="text-3xl font-mono font-bold">{dashboard.orchestration.completedJobs}</div>
            <p className="text-sm text-[hsl(220,9%,65%)]">AI Jobs Completed</p>
          </Card>

          <Card className="p-4 bg-[hsl(222,47%,15%)] border-l-4 border-l-[hsl(270,75%,65%)] border-[hsl(222,35%,20%)]" data-testid="card-stat-artifacts">
            <div className="flex items-center justify-between mb-2">
              <Code className="w-5 h-5 text-[hsl(270,75%,65%)]" />
              <Badge variant="secondary">{dashboard.artifacts.total}</Badge>
            </div>
            <div className="text-3xl font-mono font-bold">{Object.keys(dashboard.artifacts.byType).length}</div>
            <p className="text-sm text-[hsl(220,9%,65%)]">Artifact Types</p>
          </Card>

          <Card className="p-4 bg-[hsl(222,47%,15%)] border-l-4 border-l-[hsl(38,92%,50%)] border-[hsl(222,35%,20%)]" data-testid="card-stat-timeline">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)]" />
              <Badge variant="secondary">{dashboard.timeline.length} Events</Badge>
            </div>
            <div className="text-3xl font-mono font-bold">{dashboard.timeline.length}</div>
            <p className="text-sm text-[hsl(220,9%,65%)]">Milestones</p>
          </Card>
        </div>

        {/* Studios & Timeline */}
        <Tabs defaultValue="studios" className="w-full">
          <TabsList className="bg-[hsl(222,47%,15%)] border-[hsl(222,35%,20%)]">
            <TabsTrigger value="studios" data-testid="tab-studios">10 Studios</TabsTrigger>
            <TabsTrigger value="timeline" data-testid="tab-timeline">Journey Timeline</TabsTrigger>
            <TabsTrigger value="artifacts" data-testid="tab-artifacts">Artifacts</TabsTrigger>
          </TabsList>

          <TabsContent value="studios" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studiosData?.studios.map((studio) => {
                const Icon = studioIcons[studio.studioId] || Sparkles;
                return (
                  <Card 
                    key={studio.id} 
                    className="p-6 bg-[hsl(222,47%,15%)] border-[hsl(222,35%,20%)] hover:border-[hsl(217,91%,60%)]/50 transition-all hover:-translate-y-1 cursor-pointer"
                    data-testid={`card-studio-${studio.studioId}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[hsl(217,91%,60%)]/20 to-[hsl(270,75%,65%)]/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[hsl(217,91%,60%)]" />
                      </div>
                      <Badge variant="outline" className="text-xs">{studio.agentCount} agents</Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{studio.name}</h3>
                    <p className="text-sm text-[hsl(220,9%,65%)] mb-4 line-clamp-2">{studio.description}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-between hover:bg-[hsl(217,91%,60%)]/10"
                      data-testid={`button-start-${studio.studioId}`}
                    >
                      Start Session
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <JourneyTimeline startupId={startupId} />
          </TabsContent>

          <TabsContent value="artifacts" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(dashboard.artifacts.byType).map(([type, count]) => (
                <Card 
                  key={type} 
                  className="p-4 bg-[hsl(222,47%,15%)] border-[hsl(222,35%,20%)]"
                  data-testid={`card-artifact-${type}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold capitalize">{type.replace(/_/g, ' ')}</h4>
                      <p className="text-sm text-[hsl(220,9%,65%)]">{count} artifacts</p>
                    </div>
                    <Code className="w-6 h-6 text-[hsl(270,75%,65%)]" />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
