/**
 * Credit Usage Dashboard
 * Comprehensive view of credit allocation, usage, and optimization recommendations
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Coins, 
  TrendingUp, 
  Info, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  Lightbulb,
  BarChart3,
  Plus
} from 'lucide-react';

interface CreditUsageData {
  success: boolean;
  founder: {
    creditsBalance: number;
    totalAllocated: number;
    totalUsed: number;
  };
  startups: Array<{
    id: number;
    name: string;
    creditsAllocated: number;
    creditsUsed: number;
    sessions: Array<{
      id: number;
      studioId: string;
      studioName: string;
      creditsUsed: number;
      createdAt: string;
    }>;
  }>;
  usage: {
    byStudio: Record<string, number>;
    byDay: Record<string, number>;
  };
}

const WIZARDS_STUDIOS = [
  { id: 'ideation-lab', name: 'Ideation Lab', icon: '💡' },
  { id: 'engineering-forge', name: 'Engineering Forge', icon: '⚡' },
  { id: 'market-intelligence', name: 'Market Intelligence', icon: '📊' },
  { id: 'product-blueprint', name: 'Product Blueprint', icon: '📐' },
  { id: 'experience-design', name: 'Experience Design', icon: '🎨' },
  { id: 'quality-assurance-lab', name: 'Quality Assurance Lab', icon: '✅' },
  { id: 'growth-studio', name: 'Growth Engine', icon: '📈' },
  { id: 'launch-control', name: 'Launch Command', icon: '🚀' },
  { id: 'operations-cockpit', name: 'Operations Hub', icon: '⚙️' },
  { id: 'compliance-shield', name: 'Deployment Studio', icon: '🛡️' },
];

export default function CreditsDashboard() {
  const { data, isLoading } = useQuery<CreditUsageData>({
    queryKey: ['/api/wizards/credits/usage'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50 flex items-center justify-center">
        <Card className="max-w-md bg-[hsl(222,47%,15%)] border-gray-800">
          <CardHeader>
            <CardTitle>Credits Dashboard Not Available</CardTitle>
            <CardDescription>Unable to load your credit usage data.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { founder, startups, usage } = data;
  const usagePercentage = founder.totalAllocated > 0 
    ? Math.round((founder.totalUsed / founder.totalAllocated) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[hsl(222,47%,15%)]/80 backdrop-blur-lg border-b border-[hsl(222,35%,20%)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Credit Usage Dashboard</h1>
                <p className="text-sm text-[hsl(220,9%,65%)]">Track and optimize your AI credits</p>
              </div>
            </div>
            <Button asChild className="bg-[hsl(142,71%,45%)] hover:bg-[hsl(142,71%,40%)] text-white" data-testid="button-add-credits">
              <Link to="/pricing">
                <Plus className="w-4 h-4 mr-2" />
                Add Credits
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Credit Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-[hsl(142,71%,45%)]/20 to-[hsl(142,71%,30%)]/10 border-[hsl(142,71%,45%)]/30" data-testid="card-credits-balance">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-[hsl(220,9%,65%)] mb-1">Available Credits</p>
                <p className="text-4xl font-mono font-bold text-[hsl(142,71%,45%)]" data-testid="text-credits-balance">
                  {founder.creditsBalance.toLocaleString()}
                </p>
              </div>
              <Coins className="w-8 h-8 text-[hsl(142,71%,45%)]" />
            </div>
            <p className="text-xs text-[hsl(220,9%,65%)]">Ready to power your AI agents</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-[hsl(217,91%,60%)]/20 to-[hsl(217,91%,50%)]/10 border-[hsl(217,91%,60%)]/30" data-testid="card-credits-used">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-[hsl(220,9%,65%)] mb-1">Credits Used</p>
                <p className="text-4xl font-mono font-bold text-[hsl(217,91%,60%)]" data-testid="text-credits-used">
                  {founder.totalUsed.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-[hsl(217,91%,60%)]" />
            </div>
            <p className="text-xs text-[hsl(220,9%,65%)]">
              {usagePercentage}% of total allocation
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-[hsl(270,75%,65%)]/20 to-[hsl(270,75%,55%)]/10 border-[hsl(270,75%,65%)]/30" data-testid="card-credits-allocated">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-[hsl(220,9%,65%)] mb-1">Total Allocated</p>
                <p className="text-4xl font-mono font-bold text-[hsl(270,75%,65%)]" data-testid="text-credits-allocated">
                  {founder.totalAllocated.toLocaleString()}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-[hsl(270,75%,65%)]" />
            </div>
            <p className="text-xs text-[hsl(220,9%,65%)]">
              Across all your startups
            </p>
          </Card>
        </div>

        {/* Credit Explanation */}
        <Card className="bg-gradient-to-br from-[hsl(217,91%,60%)]/10 to-[hsl(270,75%,65%)]/10 border-[hsl(217,91%,60%)]/30" data-testid="card-credits-explanation">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-[hsl(217,91%,60%)]" />
              <CardTitle>What are AI Credits?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[hsl(220,9%,65%)]">
              AI Credits power your journey through the Wizards Incubator Platform. Each credit represents computational resources used by our 267+ AI agents to transform your idea into a production-ready MVP.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-3" data-testid="info-how-credits-work">
                <CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">How Credits Work</p>
                  <p className="text-sm text-[hsl(220,9%,65%)]">
                    Credits are consumed when AI agents generate code, analyze markets, design UX, or perform any studio workflow.
                  </p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="info-credit-allocation">
                <Zap className="w-5 h-5 text-[hsl(217,91%,60%)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Smart Allocation</p>
                  <p className="text-sm text-[hsl(220,9%,65%)]">
                    Each startup receives a credit allocation based on complexity. More complex features require more credits.
                  </p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="info-credit-optimization">
                <Target className="w-5 h-5 text-[hsl(270,75%,65%)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Optimization</p>
                  <p className="text-sm text-[hsl(220,9%,65%)]">
                    Our intelligent routing minimizes credit usage by selecting the most efficient AI models for each task.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage by Studio */}
        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="card-usage-by-studio">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[hsl(217,91%,60%)]" />
              Credit Usage by Studio
            </CardTitle>
            <CardDescription>See which studios are consuming your credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {WIZARDS_STUDIOS.map((studio) => {
                const studioUsage = usage.byStudio[studio.id] || 0;
                const percentage = founder.totalUsed > 0 
                  ? Math.round((studioUsage / founder.totalUsed) * 100) 
                  : 0;
                
                return (
                  <div key={studio.id} className="space-y-2" data-testid={`studio-usage-${studio.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{studio.icon}</span>
                        <span className="font-medium">{studio.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[hsl(220,9%,65%)]">{percentage}%</span>
                        <span className="font-mono font-bold" data-testid={`studio-credits-${studio.id}`}>
                          {studioUsage.toLocaleString()} credits
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Usage by Startup */}
        {startups.length > 0 && (
          <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="card-usage-by-startup">
            <CardHeader>
              <CardTitle>Credit Usage by Startup</CardTitle>
              <CardDescription>Detailed breakdown for each of your startups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {startups.map((startup) => {
                  const startupUsagePercent = startup.creditsAllocated > 0
                    ? Math.round((startup.creditsUsed / startup.creditsAllocated) * 100)
                    : 0;
                  
                  return (
                    <div key={startup.id} className="space-y-3" data-testid={`startup-usage-${startup.id}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{startup.name}</h4>
                        <Button asChild variant="ghost" size="sm" data-testid={`button-view-startup-${startup.id}`}>
                          <Link to={`/startups/${startup.id}`}>
                            View Details <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[hsl(220,9%,65%)]">
                          {startup.creditsUsed} / {startup.creditsAllocated} credits used
                        </span>
                        <span className="text-sm font-mono">{startupUsagePercent}%</span>
                      </div>
                      <Progress value={startupUsagePercent} className="h-2" data-testid={`progress-startup-${startup.id}`} />
                      
                      {startup.sessions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-[hsl(220,9%,65%)]">Recent Sessions:</p>
                          {startup.sessions.slice(0, 3).map((session) => (
                            <div key={session.id} className="flex items-center justify-between text-sm bg-[hsl(222,47%,20%)] rounded px-3 py-2" data-testid={`session-${session.id}`}>
                              <span className="text-[hsl(220,9%,65%)]">{session.studioName}</span>
                              <span className="font-mono">{session.creditsUsed} credits</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Optimization Tips */}
        <Card className="bg-gradient-to-br from-[hsl(270,75%,65%)]/10 to-[hsl(217,91%,60%)]/5 border-[hsl(270,75%,65%)]/30" data-testid="card-optimization-tips">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[hsl(270,75%,65%)]" />
              Credit Optimization Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3" data-testid="tip-1">
                <CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Be Specific with Requirements</p>
                  <p className="text-sm text-[hsl(220,9%,65%)]">
                    Clear, detailed requirements help agents work more efficiently, reducing iterations and credit usage.
                  </p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="tip-2">
                <CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Review Before Execution</p>
                  <p className="text-sm text-[hsl(220,9%,65%)]">
                    Double-check inputs and selections before running studio workflows to avoid wasted credits on incorrect outputs.
                  </p>
                </div>
              </div>
              <div className="flex gap-3" data-testid="tip-3">
                <CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Use Smaller Iterations</p>
                  <p className="text-sm text-[hsl(220,9%,65%)]">
                    Break large tasks into smaller steps to maintain control and prevent overconsumption of credits.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Credits Warning */}
        {founder.creditsBalance < 100 && (
          <Card className="bg-gradient-to-br from-[hsl(0,84%,60%)]/10 to-[hsl(0,84%,50%)]/5 border-[hsl(0,84%,60%)]/30" data-testid="card-low-credits-warning">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-[hsl(0,84%,60%)] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2 text-[hsl(0,84%,60%)]">Low Credit Balance</h4>
                  <p className="text-sm text-[hsl(220,9%,65%)] mb-4">
                    You're running low on credits. Add more now to continue your 14-day MVP journey without interruptions.
                  </p>
                  <Button asChild className="bg-[hsl(142,71%,45%)] hover:bg-[hsl(142,71%,40%)]" data-testid="button-add-credits-warning">
                    <Link to="/pricing">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Credits Now
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
