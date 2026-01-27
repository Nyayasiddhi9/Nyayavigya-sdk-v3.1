import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JourneyTimeline } from "@/components/wizards/journey-timeline";
import { KPIDashboard } from "@/components/wizards/kpi-dashboard";
import { GlassmorphicCard, GradientButton, AnimatedMetric } from "@/components/animated";
import { useState, useEffect } from "react";
import { 
  Rocket, 
  TrendingUp, 
  Target, 
  Clock, 
  Sparkles, 
  ArrowRight,
  Plus,
  BarChart3,
  CheckCircle2,
  Circle,
  Lightbulb,
  Code,
  FileText,
  Palette,
  Bug,
  Settings,
  Cloud,
  AlertCircle
} from "lucide-react";

interface StartupDashboard {
  id: number;
  name: string;
  description: string;
  industry: string;
  currentPhase: string;
  progress: number;
  creditsAllocated: number;
  creditsUsed: number;
  createdAt: string;
  sessions: {
    total: number;
    active: number;
    completed: number;
  };
  timeline: Array<{
    id: number;
    eventType: string;
    eventName: string;
    dayNumber: number;
    studioName: string;
    createdAt: string;
  }>;
}

interface DashboardData {
  success: boolean;
  founder: {
    id: number;
    founderType: string;
    startupStage: string;
    journeyProgress: number;
    creditsBalance: number;
    subscriptionTier: string;
  };
  startups: StartupDashboard[];
}

const phaseDisplayNames: Record<string, string> = {
  ideation: "Ideation",
  design: "Design",
  development: "Development",
  testing: "Testing",
  deployment: "Deployment",
  launch: "Launch"
};

const phaseIcons: Record<string, React.ReactNode> = {
  ideation: <Sparkles className="w-5 h-5" />,
  design: <Target className="w-5 h-5" />,
  development: <Rocket className="w-5 h-5" />,
  testing: <CheckCircle2 className="w-5 h-5" />,
  deployment: <TrendingUp className="w-5 h-5" />,
  launch: <BarChart3 className="w-5 h-5" />
};

interface OrchestrationStats {
  success: boolean;
  stats: {
    agents: number;
    llmProviders: number;
    models: number;
    mcpTools: number;
    languages: number;
    platforms: number;
    uptime: string;
    costSavings: string;
  };
}

export default function FounderDashboard() {
  const { user } = useAuth();
  
  // Global startup context - persist selected startup with user namespace
  const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/wizards/founders/me/dashboard'],
    enabled: !!user,
  });

  // Fetch orchestration telemetry stats
  const { data: orchestrationStats } = useQuery<OrchestrationStats>({
    queryKey: ['/api/orchestration/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Initialize and validate selection when data loads
  useEffect(() => {
    if (!data?.startups || !user) return;
    
    const startupIds = data.startups.map(s => String(s.id));
    
    if (data.startups.length === 0) {
      // No startups available - clear selection
      setSelectedStartupId(null);
      if (user.id) {
        localStorage.removeItem(`selectedStartupId_${user.id}`);
      }
      return;
    }
    
    // Try to restore user's previous selection
    const storageKey = `selectedStartupId_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored && startupIds.includes(stored)) {
      // Valid stored selection - restore it
      setSelectedStartupId(stored);
    } else {
      // No valid stored selection - default to first startup
      const firstStartupId = String(data.startups[0].id);
      setSelectedStartupId(firstStartupId);
      localStorage.setItem(storageKey, firstStartupId);
    }
  }, [data, user]);
  
  // Validate selection whenever it changes
  useEffect(() => {
    if (!selectedStartupId || !data?.startups || !user) return;
    
    // Handle zero-startup case - clear selection completely
    if (data.startups.length === 0) {
      setSelectedStartupId(null);
      localStorage.removeItem(`selectedStartupId_${user.id}`);
      return;
    }
    
    const startupIds = data.startups.map(s => String(s.id));
    
    if (!startupIds.includes(selectedStartupId)) {
      // Current selection is invalid (deleted or changed) - reset to first
      const firstStartupId = String(data.startups[0].id);
      setSelectedStartupId(firstStartupId);
      localStorage.setItem(`selectedStartupId_${user.id}`, firstStartupId);
    } else {
      // Selection is valid - persist it
      localStorage.setItem(`selectedStartupId_${user.id}`, selectedStartupId);
    }
  }, [selectedStartupId, data, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.success || !data.founder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GlassmorphicCard variant="bordered" className="max-w-md">
          <CardHeader>
            <CardTitle className="text-foreground">Dashboard Not Available</CardTitle>
            <CardDescription>Unable to load your dashboard data.</CardDescription>
          </CardHeader>
          <CardContent>
            <GradientButton asChild>
              <Link to="/founder-onboarding">Complete Onboarding</Link>
            </GradientButton>
          </CardContent>
        </GlassmorphicCard>
      </div>
    );
  }

  const { founder, startups = [] } = data;
  const hasStartups = startups && startups.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white">
      {/* Header */}
      <div className="border-b border-border/50 glass">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight gradient-text" data-testid="text-dashboard-title">
                Founder Dashboard
              </h1>
              <p className="text-foreground-secondary mt-1">Welcome back, {user?.name}!</p>
            </div>
            <GradientButton asChild data-testid="button-new-startup">
              <Link to="/founder-onboarding">
                <Plus className="w-4 h-4 mr-2" />
                New Startup
              </Link>
            </GradientButton>
          </div>
          
          {/* Startup Selector */}
          {hasStartups && startups.length > 1 && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-foreground-secondary font-medium">Active Startup:</label>
              <Select value={selectedStartupId || undefined} onValueChange={setSelectedStartupId}>
                <SelectTrigger className="w-[300px] glass-card border-border" data-testid="select-startup">
                  <SelectValue placeholder="Select a startup" />
                </SelectTrigger>
                <SelectContent>
                  {startups.map((startup) => (
                    <SelectItem key={startup.id} value={String(startup.id)}>
                      {startup.name} - {startup.industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStartupId && (
                <Badge variant="outline" className="border-primary text-primary">
                  {startups.find(s => String(s.id) === selectedStartupId)?.currentPhase || 'Active'}
                </Badge>
              )}
            </div>
          )}
          
          {hasStartups && startups.length === 1 && selectedStartupId && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary text-primary">
                <Rocket className="w-3 h-3 mr-1" />
                {startups[0].name}
              </Badge>
              <span className="text-sm text-muted">•</span>
              <span className="text-sm text-foreground-secondary">{startups[0].currentPhase}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Founder Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <GlassmorphicCard data-testid="card-stats-progress">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground-secondary">Journey Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-mono font-bold gradient-text" data-testid="text-journey-progress">
                    {founder.journeyProgress || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Overall completion</p>
                </div>
              </div>
            </CardContent>
          </GlassmorphicCard>

          <GlassmorphicCard data-testid="card-stats-credits">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground-secondary">Credits Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-mono font-bold gradient-text" data-testid="text-credits-balance">
                    {founder.creditsBalance || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">{founder.subscriptionTier || 'free'} plan</p>
                </div>
              </div>
            </CardContent>
          </GlassmorphicCard>

          <GlassmorphicCard data-testid="card-stats-startups">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground-secondary">Active Startups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-mono font-bold gradient-text" data-testid="text-startups-count">
                    {startups?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">In accelerator</p>
                </div>
              </div>
            </CardContent>
          </GlassmorphicCard>
        </div>

        {/* WAI Orchestration Engine Metrics */}
        {orchestrationStats?.success && (
          <GlassmorphicCard className="mb-12" data-testid="card-orchestration-metrics">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 gradient-text">
                    <Sparkles className="w-5 h-5" />
                    WAI Orchestration Engine
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Powered by 267+ autonomous agents across 23+ LLM providers
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  {orchestrationStats.stats.uptime} Uptime
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center" data-testid="metric-agents">
                  <AnimatedMetric value={orchestrationStats.stats.agents} className="text-4xl font-mono font-bold gradient-text mb-1" />
                  <p className="text-sm text-foreground-secondary">Autonomous Agents</p>
                </div>
                <div className="text-center" data-testid="metric-llm-providers">
                  <AnimatedMetric value={orchestrationStats.stats.llmProviders} className="text-4xl font-mono font-bold gradient-text mb-1" />
                  <p className="text-sm text-foreground-secondary">LLM Providers</p>
                </div>
                <div className="text-center" data-testid="metric-models">
                  <AnimatedMetric value={orchestrationStats.stats.models} className="text-4xl font-mono font-bold gradient-text mb-1" />
                  <p className="text-sm text-foreground-secondary">AI Models</p>
                </div>
                <div className="text-center" data-testid="metric-mcp-tools">
                  <AnimatedMetric value={orchestrationStats.stats.mcpTools} className="text-4xl font-mono font-bold gradient-text mb-1" />
                  <p className="text-sm text-foreground-secondary">MCP Tools</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">{orchestrationStats.stats.languages} Languages</Badge>
                  <Badge variant="secondary">{orchestrationStats.stats.platforms} Platforms</Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {orchestrationStats.stats.costSavings} Cost Savings
                  </Badge>
                </div>
                <Link to="/orchestration/cam">
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </GlassmorphicCard>
        )}

        {/* 14-Day MVP Journey Timeline */}
        {user && selectedStartupId && !isNaN(parseInt(selectedStartupId)) && (
          <div className="mb-12">
            <JourneyTimeline startupId={parseInt(selectedStartupId)} />
          </div>
        )}

        {/* Studios Navigation */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold gradient-text">Launch Studios</h2>
              <p className="text-foreground-secondary text-sm mt-1">Access specialized AI studios to build your startup</p>
            </div>
          </div>
          
          {!selectedStartupId && hasStartups && (
            <Alert className="mb-6 bg-warning/10 border-warning/50">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-foreground">
                Please select a startup above to access the studios and start building your MVP.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link to={selectedStartupId ? `/studios/ideation-lab?startupId=${selectedStartupId}` : "#"}>
              <GlassmorphicCard className=" hover:shadow-lg transition-all cursor-pointer h-full" data-testid="card-studio-ideation-lab">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Ideation Lab</h3>
                      <p className="text-xs text-muted-foreground mt-1">Validate ideas</p>
                    </div>
                  </div>
                </CardContent>
              </GlassmorphicCard>
            </Link>

            <Link to={selectedStartupId ? `/studios/engineering-forge?startupId=${selectedStartupId}` : "#"}>
              <GlassmorphicCard className=" hover:shadow-lg transition-all cursor-pointer h-full" data-testid="card-studio-engineering-forge">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Code className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Engineering Forge</h3>
                      <p className="text-xs text-muted-foreground mt-1">Build features</p>
                    </div>
                  </div>
                </CardContent>
              </GlassmorphicCard>
            </Link>

            <Link to={selectedStartupId ? `/studios/market-intelligence?startupId=${selectedStartupId}` : "#"}>
              <GlassmorphicCard className=" hover:shadow-lg transition-all cursor-pointer h-full" data-testid="card-studio-market-intelligence">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Market Intel</h3>
                      <p className="text-xs text-muted-foreground mt-1">Research market</p>
                    </div>
                  </div>
                </CardContent>
              </GlassmorphicCard>
            </Link>

            <Link to={selectedStartupId ? `/studios/product-blueprint?startupId=${selectedStartupId}` : "#"}>
              <GlassmorphicCard className=" hover:shadow-lg transition-all cursor-pointer h-full" data-testid="card-studio-product-blueprint">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Product Blueprint</h3>
                      <p className="text-xs text-muted-foreground mt-1">Plan product</p>
                    </div>
                  </div>
                </CardContent>
              </GlassmorphicCard>
            </Link>

            <Link to={selectedStartupId ? `/studios/experience-design?startupId=${selectedStartupId}` : "#"}>
              <GlassmorphicCard className=" hover:shadow-lg transition-all cursor-pointer h-full" data-testid="card-studio-experience-design">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                      <Palette className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Experience Design</h3>
                      <p className="text-xs text-muted-foreground mt-1">Design UX/UI</p>
                    </div>
                  </div>
                </CardContent>
              </GlassmorphicCard>
            </Link>

            <Link to={selectedStartupId ? `/studios/quality-assurance-lab?startupId=${selectedStartupId}` : "#"}>
              <GlassmorphicCard className=" hover:shadow-lg transition-all cursor-pointer h-full" data-testid="card-studio-qa-lab">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Bug className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">QA Lab</h3>
                      <p className="text-xs text-muted-foreground mt-1">Test quality</p>
                    </div>
                  </div>
                </CardContent>
              </GlassmorphicCard>
            </Link>

            <Link to={selectedStartupId ? `/studios/growth-engine?startupId=${selectedStartupId}` : "#"}>
              <GlassmorphicCard className=" hover:shadow-lg transition-all cursor-pointer h-full" data-testid="card-studio-growth-engine">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Growth Engine</h3>
                      <p className="text-xs text-muted-foreground mt-1">Scale growth</p>
                    </div>
                  </div>
                </CardContent>
              </GlassmorphicCard>
            </Link>

            <Link to={selectedStartupId ? `/studios/launch-command?startupId=${selectedStartupId}` : "#"}>
              <GlassmorphicCard className=" hover:shadow-lg transition-all cursor-pointer h-full" data-testid="card-studio-launch-command">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Launch Command</h3>
                      <p className="text-xs text-muted-foreground mt-1">Go to market</p>
                    </div>
                  </div>
                </CardContent>
              </GlassmorphicCard>
            </Link>

            <Link to={selectedStartupId ? `/studios/operations-hub?startupId=${selectedStartupId}` : "#"}>
              <GlassmorphicCard className=" hover:shadow-lg transition-all cursor-pointer h-full" data-testid="card-studio-operations-hub">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-teal-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Operations Hub</h3>
                      <p className="text-xs text-muted-foreground mt-1">Optimize ops</p>
                    </div>
                  </div>
                </CardContent>
              </GlassmorphicCard>
            </Link>

            <Link to={selectedStartupId ? `/studios/deployment-studio?startupId=${selectedStartupId}` : "#"}>
              <GlassmorphicCard className=" hover:shadow-lg transition-all cursor-pointer h-full" data-testid="card-studio-deployment">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <Cloud className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Deployment Studio</h3>
                      <p className="text-xs text-muted-foreground mt-1">Deploy apps</p>
                    </div>
                  </div>
                </CardContent>
              </GlassmorphicCard>
            </Link>
          </div>
        </div>

        {/* Startups List */}
        {!hasStartups ? (
          <GlassmorphicCard data-testid="card-empty-state">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 rounded-full gradient-primary/10 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 gradient-text">Start Your First Startup</h3>
              <p className="text-foreground-secondary mb-6 max-w-md mx-auto">
                Transform your idea into a production MVP in just 14 days with AI-powered assistance.
              </p>
              <GradientButton asChild data-testid="button-start-journey">
                <Link to="/founder-onboarding">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Your Journey
                </Link>
              </GradientButton>
            </CardContent>
          </GlassmorphicCard>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Your Startups</h2>
            
            {startups.map((startup) => (
              <GlassmorphicCard key={startup.id} className="hover:shadow-lg transition-colors" data-testid={`card-startup-${startup.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl" data-testid={`text-startup-name-${startup.id}`}>
                          {startup.name}
                        </CardTitle>
                        <Badge variant="outline" className="border-primary text-primary" data-testid={`badge-industry-${startup.id}`}>
                          {startup.industry}
                        </Badge>
                      </div>
                      <CardDescription className="text-base" data-testid={`text-startup-description-${startup.id}`}>
                        {startup.description}
                      </CardDescription>
                    </div>
                    <Button asChild variant="outline" data-testid={`button-view-startup-${startup.id}`}>
                      <Link to={`/startups/${startup.id}`}>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {phaseIcons[startup.currentPhase] || <Circle className="w-5 h-5" />}
                          <span className="text-sm font-medium" data-testid={`text-current-phase-${startup.id}`}>
                            {phaseDisplayNames[startup.currentPhase] || startup.currentPhase}
                          </span>
                        </div>
                        <span className="text-sm font-mono text-foreground-secondary" data-testid={`text-progress-${startup.id}`}>
                          {startup.progress || 0}%
                        </span>
                      </div>
                      <Progress value={startup.progress || 0} className="h-2" data-testid={`progress-bar-${startup.id}`} />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="glass-card rounded-lg p-4" data-testid={`stats-sessions-${startup.id}`}>
                        <div className="text-2xl font-mono font-bold text-primary">
                          {startup.sessions.total}
                        </div>
                        <div className="text-xs text-foreground-secondary mt-1">Studio Sessions</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {startup.sessions.active} active, {startup.sessions.completed} done
                        </div>
                      </div>

                      <div className="glass-card rounded-lg p-4" data-testid={`stats-timeline-${startup.id}`}>
                        <div className="text-2xl font-mono font-bold text-purple-600">
                          {startup.timeline.length}
                        </div>
                        <div className="text-xs text-foreground-secondary mt-1">Timeline Events</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Day {Math.max(...startup.timeline.map(t => t.dayNumber || 1), 1)} of 14
                        </div>
                      </div>

                      <div className="glass-card rounded-lg p-4" data-testid={`stats-credits-${startup.id}`}>
                        <div className="text-2xl font-mono font-bold text-green-600">
                          {(startup.creditsAllocated || 0) - (startup.creditsUsed || 0)}
                        </div>
                        <div className="text-xs text-foreground-secondary mt-1">Credits Left</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {startup.creditsUsed} of {startup.creditsAllocated} used
                        </div>
                      </div>
                    </div>

                    {/* Recent Timeline Events */}
                    {startup.timeline.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Recent Activity
                        </h4>
                        <div className="space-y-2">
                          {startup.timeline.slice(-3).reverse().map((event, idx) => (
                            <div 
                              key={event.id} 
                              className="flex items-start gap-3 text-sm border-l-2 border-primary pl-3 py-1"
                              data-testid={`timeline-event-${startup.id}-${idx}`}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{event.eventName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Day {event.dayNumber} • {event.studioName}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </GlassmorphicCard>
            ))}
          </div>
        )}

        {/* Platform Intelligence - KPI Dashboard */}
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Platform Intelligence
            </h2>
            <p className="text-foreground-secondary text-sm mt-1">
              Powered by 267+ AI agents, 23+ LLM providers, and 10 specialized studios
            </p>
          </div>
          <KPIDashboard variant="full" data-testid="kpi-dashboard-full" />
        </div>
      </div>
    </div>
  );
}
