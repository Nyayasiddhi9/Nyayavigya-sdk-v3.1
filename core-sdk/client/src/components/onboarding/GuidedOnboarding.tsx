import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCelebration } from '@/hooks/useCelebration';
import SuccessModal from '@/components/celebrations/SuccessModal';
import { 
  CheckCircle, Circle, ArrowRight, ArrowLeft, Play, Sparkles, 
  Gamepad2, FileText, Bot, Palette, Code2, Rocket, 
  Target, Trophy, Gift, Star, Lightbulb, Zap,
  ChevronRight, Users, Building, Globe
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'platform' | 'game' | 'content' | 'assistant';
  completed: boolean;
  action?: () => void;
  tips: string[];
}

interface GuidedOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function GuidedOnboarding({ isOpen, onClose, onNavigate }: GuidedOnboardingProps) {
  const { toast } = useToast();
  const { isOpen: celebrationOpen, config, close: closeCelebration, celebrateOnboarding } = useCelebration();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to WAI DevSphere',
      description: 'Discover the power of AI-driven development with 5 core platforms in one comprehensive suite.',
      icon: Rocket,
      category: 'platform',
      completed: false,
      tips: [
        'Access 39+ specialized AI agents working together',
        '13 LLM providers with intelligent routing',
        '95% cost savings vs traditional platforms',
        'Enterprise-ready with real-time collaboration'
      ]
    },
    {
      id: 'game-studio',
      title: 'Create Your First Game',
      description: 'Build therapeutic games for mental health, education, and accessibility with zero coding required.',
      icon: Gamepad2,
      category: 'game',
      completed: false,
      action: () => onNavigate('/ai-game-builder'),
      tips: [
        'Choose from therapeutic game templates',
        'AI generates sprites, sounds, and textures automatically',
        'Real-time build process with progress tracking',
        'Deploy to web, mobile, and VR platforms'
      ]
    },
    {
      id: 'ai-assistant',
      title: 'Build 3D AI Assistants',
      description: 'Create immersive AI assistants with Unity 3D avatars, voice synthesis, and cultural awareness.',
      icon: Bot,
      category: 'assistant',
      completed: false,
      action: () => onNavigate('/ai-assistant-builder'),
      tips: [
        'Unity 3D integration with ChatDollKit',
        'EchoMimic V2 for ultra-precise lip-sync',
        'Multilingual support (50+ languages)',
        'AR/VR/XR spatial computing capabilities'
      ]
    },
    {
      id: 'content-creation',
      title: 'Generate Content',
      description: 'Create professional content including images, videos, audio, presentations, and 3D models.',
      icon: Palette,
      category: 'content',
      completed: false,
      action: () => onNavigate('/content-creation'),
      tips: [
        '12+ content types supported',
        'Bulk generation from documents',
        'Direct Google Docs export',
        'Advanced content management system'
      ]
    },
    {
      id: 'software-dev',
      title: 'Develop Software',
      description: 'Build complete applications with AI-powered development workflows and real-time collaboration.',
      icon: Code2,
      category: 'platform',
      completed: false,
      action: () => onNavigate('/develop'),
      tips: [
        'Full SDLC automation from requirements to deployment',
        'GitHub integration with real-time sync',
        'Multi-agent coordination for complex projects',
        'Database ecosystem connectivity'
      ]
    },
    {
      id: 'enterprise',
      title: 'Enterprise Integration',
      description: 'Connect with CRM, ERP, marketing tools, and cloud platforms for enterprise workflows.',
      icon: Building,
      category: 'platform',
      completed: false,
      tips: [
        '14 pre-built enterprise integrations',
        'Custom workflow automation',
        'Role-based access control',
        'Real-time data synchronization'
      ]
    }
  ];

  const totalSteps = onboardingSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => [...prev, stepId]);
    onboardingSteps[currentStep].completed = true;
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepAction = () => {
    const step = onboardingSteps[currentStep];
    if (step.action) {
      step.action();
      markStepCompleted(step.id);
      toast({
        title: "Step Completed!",
        description: `You've completed: ${step.title}`
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      platform: 'bg-blue-500/10 text-blue-600 border-blue-200',
      game: 'bg-purple-500/10 text-purple-600 border-purple-200',
      content: 'bg-green-500/10 text-green-600 border-green-200',
      assistant: 'bg-orange-500/10 text-orange-600 border-orange-200'
    };
    return colors[category as keyof typeof colors] || colors.platform;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      platform: Globe,
      game: Gamepad2,
      content: FileText,
      assistant: Bot
    };
    const Icon = icons[category as keyof typeof icons] || Globe;
    return <Icon className="h-4 w-4" />;
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Getting Started Guide</DialogTitle>
              <DialogDescription className="text-base mt-1">
                Let's explore the key features that make WAI DevSphere unique
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Step {currentStep + 1} of {totalSteps}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* Step Navigation Sidebar */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">ALL STEPS</h3>
            {onboardingSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  index === currentStep 
                    ? 'bg-primary/5 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  completedSteps.includes(step.id)
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    index === currentStep ? 'text-primary' : ''
                  }`}>
                    {step.title}
                  </p>
                  <Badge className={`text-xs ${getCategoryColor(step.category)}`}>
                    {getCategoryIcon(step.category)}
                    <span className="ml-1">{step.category}</span>
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="col-span-2 space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <currentStepData.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                      <Badge className={getCategoryColor(currentStepData.category)}>
                        {currentStepData.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">
                      {currentStepData.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Key Features & Benefits
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {currentStepData.tips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  {currentStepData.action && (
                    <Button onClick={handleStepAction} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Try {currentStepData.title}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => markStepCompleted(currentStepData.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Success Stories / Social Proof */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Success Highlight</p>
                    <p className="text-sm text-green-700">
                      {currentStep === 0 && "Join 10,000+ developers saving 95% on development costs"}
                      {currentStep === 1 && "Users create therapeutic games 10x faster than traditional methods"}
                      {currentStep === 2 && "3D AI assistants achieve 98.5% user engagement rates"}
                      {currentStep === 3 && "Content creators save 15+ hours per week with AI automation"}
                      {currentStep === 4 && "Development teams ship features 5x faster with AI orchestration"}
                      {currentStep === 5 && "Enterprise clients reduce integration time by 80%"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{completedSteps.length} of {totalSteps} completed</span>
            <div className="flex gap-1">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    completedSteps.includes(onboardingSteps[index].id)
                      ? 'bg-green-500'
                      : index === currentStep
                        ? 'bg-primary'
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {currentStep === totalSteps - 1 ? (
            <Button 
              onClick={() => {
                celebrateOnboarding('WAI DevSphere', {
                  label: 'View My Journey',
                  onClick: () => {
                    closeCelebration();
                    onClose();
                    onNavigate('/founder-dashboard');
                  }
                });
              }} 
              className="flex items-center gap-2"
              data-testid="button-finish-onboarding"
            >
              <Zap className="h-4 w-4" />
              Start Building
            </Button>
          ) : (
            <Button onClick={nextStep} className="flex items-center gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
      
      {config && (
        <SuccessModal
          isOpen={celebrationOpen}
          onClose={() => {
            closeCelebration();
            onClose();
          }}
          config={config}
        />
      )}
    </Dialog>
  );
}