import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  Code, 
  TrendingUp, 
  FileText, 
  Palette, 
  CheckCircle, 
  Rocket, 
  Zap, 
  Settings, 
  Cloud,
  ArrowRight 
} from 'lucide-react';

interface WorkspaceTourStepProps {
  onNext: () => void;
}

const studios = [
  {
    id: 'ideation-lab',
    name: 'Ideation Lab',
    icon: Lightbulb,
    color: 'from-yellow-500 to-yellow-600',
    description: 'Validate your startup idea',
    day: 'Day 1',
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
    description: 'Deep competitive analysis',
    day: 'Day 2',
  },
  {
    id: 'product-blueprint',
    name: 'Product Blueprint',
    icon: FileText,
    color: 'from-purple-500 to-purple-600',
    description: 'Define product requirements',
    day: 'Day 3',
  },
  {
    id: 'experience-design',
    name: 'Experience Design',
    icon: Palette,
    color: 'from-pink-500 to-pink-600',
    description: 'Create user interfaces',
    day: 'Day 4',
  },
  {
    id: 'engineering-forge',
    name: 'Engineering Forge',
    icon: Code,
    color: 'from-blue-500 to-blue-600',
    description: 'Build production-ready code',
    day: 'Days 5-8',
  },
  {
    id: 'quality-assurance-lab',
    name: 'Quality Assurance',
    icon: CheckCircle,
    color: 'from-cyan-500 to-cyan-600',
    description: 'Automated testing & QA',
    day: 'Day 9',
  },
  {
    id: 'growth-engine',
    name: 'Growth Engine',
    icon: Rocket,
    color: 'from-orange-500 to-orange-600',
    description: 'Marketing & growth strategy',
    day: 'Day 10',
  },
  {
    id: 'operations-hub',
    name: 'Operations Hub',
    icon: Settings,
    color: 'from-indigo-500 to-indigo-600',
    description: 'Business infrastructure',
    day: 'Day 11',
  },
  {
    id: 'launch-command',
    name: 'Launch Command',
    icon: Zap,
    color: 'from-red-500 to-red-600',
    description: 'Launch coordination',
    day: 'Day 12',
  },
  {
    id: 'deployment-studio',
    name: 'Deployment Studio',
    icon: Cloud,
    color: 'from-teal-500 to-teal-600',
    description: 'Production deployment',
    day: 'Day 14',
  },
];

export default function WorkspaceTourStep({ onNext }: WorkspaceTourStepProps) {
  return (
    <div className="space-y-8" data-testid="workspace-tour-step">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Your 14-Day Journey
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Complete these 10 specialized studios in order. Each one builds on the previous, 
          guiding you from idea to production MVP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studios.map((studio, index) => {
          const Icon = studio.icon;
          return (
            <div
              key={studio.id}
              className="p-5 rounded-lg bg-[hsl(222,47%,13%)] border border-[hsl(222,47%,20%)] hover:border-primary/50 transition-all group"
              data-testid={`studio-card-${studio.id}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${studio.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {studio.name}
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium ml-2 flex-shrink-0">
                      {studio.day}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {studio.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20">
        <h3 className="text-lg font-semibold text-white mb-3">💡 How It Works</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-start">
            <span className="text-primary mr-2 mt-0.5">1.</span>
            <span><strong className="text-white">Studios unlock in sequence</strong> - Complete dependencies to access the next studio</span>
          </p>
          <p className="flex items-start">
            <span className="text-primary mr-2 mt-0.5">2.</span>
            <span><strong className="text-white">AI agents collaborate</strong> - Watch real-time thinking and tool usage via AG-UI streaming</span>
          </p>
          <p className="flex items-start">
            <span className="text-primary mr-2 mt-0.5">3.</span>
            <span><strong className="text-white">Artifacts are generated</strong> - Each studio produces tangible outputs for the next phase</span>
          </p>
          <p className="flex items-start">
            <span className="text-primary mr-2 mt-0.5">4.</span>
            <span><strong className="text-white">Track your progress</strong> - Visual timeline shows completion status and what's next</span>
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold px-8"
          data-testid="button-continue-tour"
        >
          Continue to Create Your Startup
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
