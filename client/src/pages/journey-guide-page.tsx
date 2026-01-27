import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { JourneyGuide } from "@/components/wizards/journey-guide";
import { ArrowLeft, AlertCircle, Home } from "lucide-react";

interface StartupDetail {
  id: number;
  name: string;
  description: string;
  industry: string;
  currentPhase: string;
  progress: {
    overall: number;
    byPhase: Record<string, number>;
  };
}

export default function JourneyGuidePage() {
  const { user } = useAuth();
  const [, params] = useRoute("/journey-guide/:startupId");
  const startupId = params?.startupId ? parseInt(params.startupId) : null;

  const { data: startup, isLoading } = useQuery<StartupDetail>({
    queryKey: [`/api/wizards/startups/${startupId}`],
    enabled: !!startupId && !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50">
        <div className="border-b border-gray-800 bg-[hsl(222,47%,15%)]">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!startup || !startupId) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50 flex items-center justify-center">
        <Card className="max-w-md bg-[hsl(222,47%,15%)] border-gray-800 p-6">
          <Alert className="bg-red-500/10 border-red-500/50 mb-4">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200">
              Journey guide not found. Please select a startup from your dashboard.
            </AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link to="/founder-dashboard">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Map API data to phase info format
  // Phase progression logic: ideation → design → development → testing → deployment
  const ideationProgress = startup.progress.byPhase?.ideation || 0;
  const designProgress = startup.progress.byPhase?.design || 0;
  const developmentProgress = startup.progress.byPhase?.development || 0;
  const testingProgress = startup.progress.byPhase?.testing || 0;
  const deploymentProgress = startup.progress.byPhase?.deployment || 0;
  
  // Phase gate logic - each phase requires previous phase completion
  const phase1Complete = ideationProgress >= 100;
  const phase2Complete = designProgress >= 100 && developmentProgress >= 100;
  const phase3Complete = testingProgress >= 100;
  
  const phaseMapping = [
    {
      id: 1,
      name: 'Discovery & Planning',
      dayRange: 'Days 1-4',
      description: 'Validate your idea, research the market, and create your product blueprint',
      status: (ideationProgress >= 100 ? 'completed' : ideationProgress > 0 ? 'in_progress' : 'ready') as const,
      progress: ideationProgress,
      studios: [
        {
          id: 'ideation-lab',
          name: 'Ideation Lab',
          icon: null,
          status: 'ready' as const,
          route: '/studios/ideation-lab',
          progress: 0,
        },
        {
          id: 'market-intelligence',
          name: 'Market Intelligence',
          icon: null,
          status: (ideationProgress > 30 ? 'ready' : 'locked') as const,
          route: '/studios/market-intelligence',
          progress: 0,
        },
        {
          id: 'product-blueprint',
          name: 'Product Blueprint',
          icon: null,
          status: (ideationProgress > 60 ? 'ready' : 'locked') as const,
          route: '/studios/product-blueprint',
          progress: 0,
        },
      ],
    },
    {
      id: 2,
      name: 'Design & Development',
      dayRange: 'Days 5-9',
      description: 'Design the user experience and build your MVP features',
      status: (!phase1Complete ? 'locked' : phase2Complete ? 'completed' : (designProgress > 0 || developmentProgress > 0) ? 'in_progress' : 'ready') as const,
      progress: Math.max(designProgress, developmentProgress),
      studios: [
        {
          id: 'experience-design',
          name: 'Experience Design',
          icon: null,
          status: (phase1Complete ? 'ready' : 'locked') as const,
          route: '/studios/experience-design',
          progress: 0,
        },
        {
          id: 'engineering-forge',
          name: 'Engineering Forge',
          icon: null,
          status: (phase1Complete ? 'ready' : 'locked') as const,
          route: '/studios/engineering-forge',
          progress: 0,
        },
      ],
    },
    {
      id: 3,
      name: 'QA & Growth',
      dayRange: 'Days 10-12',
      description: 'Test quality, plan growth strategies, and optimize operations',
      status: (!phase2Complete ? 'locked' : phase3Complete ? 'completed' : testingProgress > 0 ? 'in_progress' : 'ready') as const,
      progress: testingProgress,
      studios: [
        {
          id: 'quality-assurance-lab',
          name: 'Quality Assurance Lab',
          icon: null,
          status: (phase2Complete ? 'ready' : 'locked') as const,
          route: '/studios/quality-assurance-lab',
          progress: 0,
        },
        {
          id: 'growth-engine',
          name: 'Growth Engine',
          icon: null,
          status: (phase2Complete ? 'ready' : 'locked') as const,
          route: '/studios/growth-engine',
          progress: 0,
        },
        {
          id: 'operations-hub',
          name: 'Operations Hub',
          icon: null,
          status: (phase2Complete ? 'ready' : 'locked') as const,
          route: '/studios/operations-hub',
          progress: 0,
        },
      ],
    },
    {
      id: 4,
      name: 'Launch & Deploy',
      dayRange: 'Days 13-14',
      description: 'Prepare for launch and deploy your production-ready MVP',
      status: (!phase3Complete ? 'locked' : deploymentProgress >= 100 ? 'completed' : deploymentProgress > 0 ? 'in_progress' : 'ready') as const,
      progress: deploymentProgress,
      studios: [
        {
          id: 'launch-command',
          name: 'Launch Command',
          icon: null,
          status: (phase3Complete ? 'ready' : 'locked') as const,
          route: '/studios/launch-command',
          progress: 0,
        },
        {
          id: 'deployment-studio',
          name: 'Deployment Studio',
          icon: null,
          status: (phase3Complete ? 'ready' : 'locked') as const,
          route: '/studios/deployment-studio',
          progress: 0,
        },
      ],
    },
  ];

  const currentPhaseNum = startup.progress.overall < 25 ? 1 : startup.progress.overall < 50 ? 2 : startup.progress.overall < 75 ? 3 : 4;

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[hsl(222,47%,15%)]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={`/startups/${startupId}`}>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-100" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Startup
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              MVP Journey Guide
            </h1>
            <p className="text-gray-400 mt-1">
              {startup.name} • {startup.industry}
            </p>
          </div>
        </div>
      </div>

      {/* Journey Guide Component */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <JourneyGuide
          startupId={startupId}
          currentPhase={currentPhaseNum}
          overallProgress={startup.progress.overall}
          phases={phaseMapping}
          showRecommendations={true}
          compact={false}
        />
      </div>
    </div>
  );
}
