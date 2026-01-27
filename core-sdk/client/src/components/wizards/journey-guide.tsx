import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Code,
  Palette,
  Wrench,
  Shield,
  Rocket,
  Settings,
  BarChart3,
  Zap,
  Lock,
  PlayCircle,
} from 'lucide-react';
import { Link } from 'wouter';

interface StudioInfo {
  id: string;
  name: string;
  icon: ReactNode;
  status: 'ready' | 'in_progress' | 'completed' | 'locked';
  progress?: number;
  route: string;
}

interface PhaseInfo {
  id: number;
  name: string;
  dayRange: string;
  description: string;
  status: 'ready' | 'in_progress' | 'completed' | 'locked';
  studios: StudioInfo[];
  progress: number;
}

interface JourneyGuideProps {
  startupId: number;
  currentPhase?: number;
  overallProgress?: number;
  phases?: PhaseInfo[];
  showRecommendations?: boolean;
  compact?: boolean;
}

const DEFAULT_PHASES: PhaseInfo[] = [
  {
    id: 1,
    name: 'Discovery & Planning',
    dayRange: 'Days 1-4',
    description: 'Validate your idea, research the market, and create your product blueprint',
    status: 'ready',
    progress: 0,
    studios: [
      {
        id: 'ideation-lab',
        name: 'Ideation Lab',
        icon: <Lightbulb className="w-4 h-4" />,
        status: 'ready',
        route: '/studios/ideation-lab',
      },
      {
        id: 'market-intelligence',
        name: 'Market Intelligence',
        icon: <TrendingUp className="w-4 h-4" />,
        status: 'locked',
        route: '/studios/market-intelligence',
      },
      {
        id: 'product-blueprint',
        name: 'Product Blueprint',
        icon: <Code className="w-4 h-4" />,
        status: 'locked',
        route: '/studios/product-blueprint',
      },
    ],
  },
  {
    id: 2,
    name: 'Design & Development',
    dayRange: 'Days 5-9',
    description: 'Design the user experience and build your MVP features',
    status: 'locked',
    progress: 0,
    studios: [
      {
        id: 'experience-design',
        name: 'Experience Design',
        icon: <Palette className="w-4 h-4" />,
        status: 'locked',
        route: '/studios/experience-design',
      },
      {
        id: 'engineering-forge',
        name: 'Engineering Forge',
        icon: <Wrench className="w-4 h-4" />,
        status: 'locked',
        route: '/studios/engineering-forge',
      },
    ],
  },
  {
    id: 3,
    name: 'QA & Growth',
    dayRange: 'Days 10-12',
    description: 'Test quality, plan growth strategies, and optimize operations',
    status: 'locked',
    progress: 0,
    studios: [
      {
        id: 'quality-assurance-lab',
        name: 'Quality Assurance Lab',
        icon: <Shield className="w-4 h-4" />,
        status: 'locked',
        route: '/studios/quality-assurance-lab',
      },
      {
        id: 'growth-engine',
        name: 'Growth Engine',
        icon: <Rocket className="w-4 h-4" />,
        status: 'locked',
        route: '/studios/growth-engine',
      },
      {
        id: 'operations-hub',
        name: 'Operations Hub',
        icon: <Settings className="w-4 h-4" />,
        status: 'locked',
        route: '/studios/operations-hub',
      },
    ],
  },
  {
    id: 4,
    name: 'Launch & Deploy',
    dayRange: 'Days 13-14',
    description: 'Prepare for launch and deploy your production-ready MVP',
    status: 'locked',
    progress: 0,
    studios: [
      {
        id: 'launch-command',
        name: 'Launch Command',
        icon: <BarChart3 className="w-4 h-4" />,
        status: 'locked',
        route: '/studios/launch-command',
      },
      {
        id: 'deployment-studio',
        name: 'Deployment Studio',
        icon: <Zap className="w-4 h-4" />,
        status: 'locked',
        route: '/studios/deployment-studio',
      },
    ],
  },
];

export function JourneyGuide({
  startupId,
  currentPhase = 1,
  overallProgress = 0,
  phases = DEFAULT_PHASES,
  showRecommendations = true,
  compact = false,
}: JourneyGuideProps) {
  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="w-6 h-6 text-[hsl(217,91%,60%)]" />;
      case 'ready':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      default:
        return <Circle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStudioStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/50 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Done
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-[hsl(217,91%,60%)]/10 text-[hsl(217,91%,60%)] border-[hsl(217,91%,60%)]/50 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'ready':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/50 text-xs">
            Ready
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-700 text-gray-400 text-xs">
            <Lock className="w-3 h-3 mr-1" />
            Locked
          </Badge>
        );
    }
  };

  const getNextAction = () => {
    for (const phase of phases) {
      for (const studio of phase.studios) {
        if (studio.status === 'ready' || studio.status === 'in_progress') {
          return {
            phase: phase.name,
            studio: studio.name,
            route: `${studio.route}?startupId=${startupId}`,
            isNext: studio.status === 'ready',
          };
        }
      }
    }
    return null;
  };

  const nextAction = getNextAction();

  if (compact) {
    return (
      <Card className="p-6 bg-[hsl(222,47%,15%)] border-[hsl(222,35%,20%)]" data-testid="card-journey-guide-compact">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">14-Day MVP Journey</h3>
            <p className="text-sm text-[hsl(220,9%,65%)]">
              Phase {currentPhase} of 4 • {Math.round(overallProgress)}% Complete
            </p>
          </div>
          {nextAction && (
            <Link to={nextAction.route}>
              <Button size="sm" className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)]" data-testid="button-next-action">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
        <Progress value={overallProgress} className="h-2" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Overall Progress */}
      <Card className="p-6 bg-[hsl(222,47%,15%)] border-[hsl(222,35%,20%)]" data-testid="card-journey-header">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-2">Your 14-Day MVP Journey</h2>
            <p className="text-[hsl(220,9%,65%)]">
              Transform your startup idea into a production-ready MVP through 4 structured phases
            </p>
          </div>
          <div className="text-center min-w-[120px]">
            <div className="text-4xl font-mono font-bold">{Math.round(overallProgress)}%</div>
            <p className="text-sm text-[hsl(220,9%,65%)]">Overall Progress</p>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={overallProgress} className="h-3" />
        </div>
      </Card>

      {/* Recommended Next Action */}
      {showRecommendations && nextAction && (
        <Card className="p-6 bg-gradient-to-r from-[hsl(217,91%,60%)]/20 to-purple-500/20 border-[hsl(217,91%,60%)]/50" data-testid="card-next-action">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <Badge className="mb-2 bg-[hsl(217,91%,60%)]/20 text-[hsl(217,91%,60%)] border-[hsl(217,91%,60%)]/50">
                {nextAction.isNext ? 'Next Step' : 'Continue'}
              </Badge>
              <h3 className="text-xl font-semibold mb-1">{nextAction.studio}</h3>
              <p className="text-[hsl(220,9%,65%)]">{nextAction.phase}</p>
            </div>
            <Link to={nextAction.route}>
              <Button size="lg" className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)]" data-testid="button-continue-journey">
                {nextAction.isNext ? 'Start Now' : 'Continue'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Phase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {phases.map((phase) => {
          const isActive = phase.status === 'in_progress' || phase.status === 'ready';
          const isCompleted = phase.status === 'completed';
          const borderColor = isActive
            ? 'border-[hsl(217,91%,60%)]/50'
            : isCompleted
              ? 'border-green-500/50'
              : 'border-gray-800';

          return (
            <Card
              key={phase.id}
              className={`p-6 bg-[hsl(222,47%,15%)] ${borderColor} transition-all hover:border-[hsl(217,91%,60%)]/70`}
              data-testid={`card-phase-${phase.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Badge
                    className={`mb-2 ${
                      isActive
                        ? 'bg-[hsl(217,91%,60%)]/10 text-[hsl(217,91%,60%)] border-[hsl(217,91%,60%)]/50'
                        : isCompleted
                          ? 'bg-green-500/10 text-green-500 border-green-500/50'
                          : 'bg-gray-700 text-gray-400 border-gray-600'
                    }`}
                  >
                    {phase.dayRange}
                  </Badge>
                  <h3
                    className={`text-xl font-semibold ${
                      isActive || isCompleted ? '' : 'text-[hsl(220,9%,65%)]'
                    }`}
                  >
                    Phase {phase.id}: {phase.name}
                  </h3>
                  <p className="text-sm text-[hsl(220,9%,65%)] mt-2">{phase.description}</p>
                </div>
                {getPhaseIcon(phase.status)}
              </div>

              {/* Phase Progress */}
              {phase.progress > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[hsl(220,9%,65%)]">Phase Progress</span>
                    <span className="text-sm font-mono font-semibold">{Math.round(phase.progress)}%</span>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                </div>
              )}

              {/* Studios List */}
              <div className="space-y-2 mt-4">
                {phase.studios.map((studio) => (
                  <div
                    key={studio.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      studio.status === 'locked'
                        ? 'bg-gray-900/30'
                        : 'bg-[hsl(217,91%,60%)]/5 hover:bg-[hsl(217,91%,60%)]/10'
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`${
                          studio.status === 'locked' ? 'text-gray-600' : 'text-[hsl(217,91%,60%)]'
                        }`}
                      >
                        {studio.icon}
                      </div>
                      <span
                        className={`text-sm ${
                          studio.status === 'locked' ? 'text-[hsl(220,9%,65%)]' : ''
                        }`}
                      >
                        {studio.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {studio.progress !== undefined && studio.progress > 0 && (
                        <span className="text-xs font-mono text-[hsl(220,9%,65%)]">
                          {Math.round(studio.progress)}%
                        </span>
                      )}
                      {getStudioStatusBadge(studio.status)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
