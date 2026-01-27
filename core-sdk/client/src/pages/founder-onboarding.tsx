import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingProgress, useUpdateOnboardingStep } from "@/hooks/useOnboarding";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Sparkles, Rocket, Target, Users, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

import WelcomeStep from "@/components/onboarding/WelcomeStep";
import WorkspaceTourStep from "@/components/onboarding/WorkspaceTourStep";

export default function FounderOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: progressData, isLoading: loadingProgress } = useOnboardingProgress();
  const updateStep = useUpdateOnboardingStep();
  const { trackEvent } = useAnalytics();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    startupName: "",
    ideaDescription: "",
    industry: "",
    targetMarket: "",
    problemSolving: "",
    founderGoal: "",
    technicalLevel: "",
  });

  useEffect(() => {
    if (user?.onboardingCompleted) {
      setLocation('/founder-dashboard');
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (progressData?.data) {
      const progress = progressData.data;
      
      // If onboarding is complete, redirect to founder dashboard
      if (progress.completedAt) {
        setLocation('/founder-dashboard');
        return;
      }

      // Use currentStep for resumability (1-5 progression)
      if (progress.currentStep && progress.currentStep >= 1 && progress.currentStep <= 5) {
        setStep(progress.currentStep);
      }

      // Restore form data if available
      if (progress.founderGoal) {
        setFormData(prev => ({
          ...prev,
          founderGoal: progress.founderGoal || '',
          technicalLevel: progress.technicalLevel || '',
        }));
      }
    }
  }, [progressData, setLocation]);

  const handleWelcomeNext = async () => {
    try {
      trackEvent('onboarding_started');
      await updateStep.mutateAsync({ stepName: 'stepWelcome' });
      setStep(2);
    } catch (error) {
      console.error('Failed to update welcome step:', error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTourNext = async () => {
    try {
      await updateStep.mutateAsync({ stepName: 'stepWorkspaceTour' });
      setStep(3);
    } catch (error) {
      console.error('Failed to update tour step:', error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateStep.mutateAsync({
        stepName: 'stepGoalCapture',
        founderGoal: formData.founderGoal,
        technicalLevel: formData.technicalLevel,
      });

      const response = await apiRequest(
        "/api/wizards/startups",
        "POST",
        {
          name: formData.startupName,
          description: formData.ideaDescription,
          industry: formData.industry,
          targetMarket: formData.targetMarket,
          problemStatement: formData.problemSolving,
        }
      );

      if (response) {
        await updateStep.mutateAsync({ stepName: 'stepFirstStudioLaunch' });
        trackEvent('onboarding_completed', { startupId: response.id }, response.id);
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });

        toast({
          title: "Welcome to Wizards Incubator! 🎉",
          description: "Your startup has been created. Let's start building your MVP!",
        });
        setLocation('/founder-dashboard');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your startup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 3) return formData.startupName && formData.ideaDescription;
    if (step === 4) return formData.industry && formData.targetMarket;
    if (step === 5) return formData.problemSolving && formData.founderGoal && formData.technicalLevel;
    return false;
  };

  if (loadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,11%)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,47%,13%)] to-[hsl(222,47%,11%)] flex flex-col">
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
          <Card className="bg-[hsl(222,47%,15%)] border-[hsl(222,47%,20%)] p-8 md:p-12">
            <WelcomeStep onNext={handleWelcomeNext} />
          </Card>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,47%,13%)] to-[hsl(222,47%,11%)] flex flex-col">
        <div className="w-full max-w-5xl mx-auto px-6 py-12">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              className="text-muted-foreground hover:text-white"
              data-testid="button-back-to-welcome"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <Card className="bg-[hsl(222,47%,15%)] border-[hsl(222,47%,20%)] p-8 md:p-12">
            <WorkspaceTourStep onNext={handleTourNext} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[hsl(222,47%,11%)]">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Startup</h1>
          <p className="text-muted-foreground">Tell us about your idea and we'll help you build an MVP in 14 days</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {[3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    s <= step ? "bg-primary text-white" : "bg-[hsl(222,35%,20%)] text-muted-foreground"
                  )}
                  data-testid={`step-indicator-${s}`}
                >
                  {s - 2}
                </div>
                {s < 5 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-2",
                      s < step ? "bg-primary" : "bg-[hsl(222,35%,20%)]"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-[hsl(222,47%,15%)] border-[hsl(222,47%,20%)]">
          <CardHeader>
            <CardTitle className="text-white">
              {step === 3 && "Step 1: Your Idea"}
              {step === 4 && "Step 2: Market Context"}
              {step === 5 && "Step 3: Problem & Goals"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 3 && "What are you building?"}
              {step === 4 && "Who are you building for?"}
              {step === 5 && "What problem are you solving and what's your goal?"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="startupName" className="text-gray-300 flex items-center gap-2">
                      <Rocket className="w-4 h-4" />
                      Startup Name
                    </Label>
                    <Input
                      id="startupName"
                      type="text"
                      placeholder="e.g., TechFlow, AI Studio, DataViz Pro"
                      value={formData.startupName}
                      onChange={(e) => handleInputChange("startupName", e.target.value)}
                      required
                      data-testid="input-startupName"
                      className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ideaDescription" className="text-gray-300">
                      Describe your idea
                    </Label>
                    <Textarea
                      id="ideaDescription"
                      placeholder="Describe your startup idea in a few sentences. What are you building? What makes it unique?"
                      value={formData.ideaDescription}
                      onChange={(e) => handleInputChange("ideaDescription", e.target.value)}
                      required
                      rows={6}
                      data-testid="input-ideaDescription"
                      className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-500">Be specific about your value proposition</p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-gray-300 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Industry / Category
                    </Label>
                    <Input
                      id="industry"
                      type="text"
                      placeholder="e.g., FinTech, HealthTech, SaaS, E-commerce"
                      value={formData.industry}
                      onChange={(e) => handleInputChange("industry", e.target.value)}
                      required
                      data-testid="input-industry"
                      className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetMarket" className="text-gray-300 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Target Market
                    </Label>
                    <Textarea
                      id="targetMarket"
                      placeholder="Who are your target customers? Be specific about demographics, pain points, and behaviors."
                      value={formData.targetMarket}
                      onChange={(e) => handleInputChange("targetMarket", e.target.value)}
                      required
                      rows={4}
                      data-testid="input-targetMarket"
                      className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="problemSolving" className="text-gray-300">
                      What problem are you solving?
                    </Label>
                    <Textarea
                      id="problemSolving"
                      placeholder="Describe the specific problem your startup solves and how you're solving it differently."
                      value={formData.problemSolving}
                      onChange={(e) => handleInputChange("problemSolving", e.target.value)}
                      required
                      rows={6}
                      data-testid="input-problemSolving"
                      className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="founderGoal" className="text-gray-300">
                      What's your primary goal?
                    </Label>
                    <Select 
                      value={formData.founderGoal} 
                      onValueChange={(value) => handleInputChange("founderGoal", value)}
                      required
                    >
                      <SelectTrigger 
                        id="founderGoal"
                        className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white"
                        data-testid="select-founderGoal"
                      >
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="validate">Validate my idea</SelectItem>
                        <SelectItem value="mvp">Build an MVP</SelectItem>
                        <SelectItem value="launch">Launch my product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technicalLevel" className="text-gray-300">
                      Your technical experience
                    </Label>
                    <Select 
                      value={formData.technicalLevel} 
                      onValueChange={(value) => handleInputChange("technicalLevel", value)}
                      required
                    >
                      <SelectTrigger 
                        id="technicalLevel"
                        className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white"
                        data-testid="select-technicalLevel"
                      >
                        <SelectValue placeholder="Select your level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-technical">Non-technical founder</SelectItem>
                        <SelectItem value="beginner">Beginner developer</SelectItem>
                        <SelectItem value="intermediate">Intermediate developer</SelectItem>
                        <SelectItem value="advanced">Advanced developer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 rounded-lg bg-[hsl(222,35%,18%)]">
                    <h3 className="text-sm font-medium text-white mb-2">🚀 Next Steps</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• AI agents will validate your idea</li>
                      <li>• Market research will identify competitors</li>
                      <li>• Product blueprint will be generated</li>
                      <li>• Full-stack MVP code will be created</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                {step > 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    data-testid="button-back"
                    className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white hover:bg-[hsl(222,35%,25%)]"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}

                {step < 5 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    data-testid="button-next"
                    className="ml-auto bg-primary hover:bg-primary/90"
                  >
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || !canProceed()}
                    data-testid="button-complete"
                    className="ml-auto bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting your journey...
                      </>
                    ) : (
                      <>
                        Start Building <Rocket className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
