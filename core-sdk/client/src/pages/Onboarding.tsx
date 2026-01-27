import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Star, Zap, Crown, Building, Key, Settings, User, Rocket } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: string;
  currency: string;
  billingCycle: string;
  features: string[];
  limits: any;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('alpha');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    role: '',
    experience: ''
  });
  const [apiKeyData, setApiKeyData] = useState({
    provider: 'openai',
    keyName: 'Primary Key',
    apiKey: ''
  });
  const { toast } = useToast();

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Welcome to WAI DevStudio",
      description: "Complete your profile to get started",
      icon: User,
      completed: false
    },
    {
      id: 2,
      title: "Choose Your Plan",
      description: "Select the subscription plan that fits your needs",
      icon: Crown,
      completed: false
    },
    {
      id: 3,
      title: "Configure API Keys",
      description: "Add your AI provider API keys to unlock full functionality",
      icon: Key,
      completed: false
    },
    {
      id: 4,
      title: "Ready to Go!",
      description: "Your WAI DevStudio is ready for action",
      icon: Rocket,
      completed: false
    }
  ];

  useEffect(() => {
    loadOnboardingData();
    loadSubscriptionPlans();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const response = await fetch('/api/user/onboarding', {
        headers: { Authorization: 'Bearer mock-token' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data.data);
        setCurrentStep(data.data.currentStep || 1);
      }
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    }
  };

  const loadSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionPlans(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load subscription plans:', error);
    }
  };

  const updateOnboardingProgress = async (stepData: any) => {
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token'
        },
        body: JSON.stringify(stepData)
      });

      if (!response.ok) {
        throw new Error('Failed to update onboarding progress');
      }
    } catch (error) {
      console.error('Failed to update onboarding:', error);
    }
  };

  const completeStep = async (stepId: number, additionalData: any = {}) => {
    const updatedSteps = [...(onboardingData?.completedSteps || [])];
    if (!updatedSteps.includes(stepId)) {
      updatedSteps.push(stepId);
    }

    const updateData = {
      currentStep: stepId + 1,
      completedSteps: updatedSteps,
      ...additionalData
    };

    await updateOnboardingProgress(updateData);
    setOnboardingData({ ...onboardingData, ...updateData });
  };

  const handleNextStep = async () => {
    switch (currentStep) {
      case 1:
        // Complete profile step
        if (!profileData.firstName || !profileData.lastName) {
          toast({
            title: "Error",
            description: "Please fill in your name to continue",
            variant: "destructive"
          });
          return;
        }
        await completeStep(1, { profileCompleted: true });
        break;

      case 2:
        // Complete plan selection
        await completeStep(2, { planSelected: true });
        
        // Upgrade subscription
        try {
          const response = await fetch('/api/user/subscription/upgrade', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer mock-token'
            },
            body: JSON.stringify({ planId: selectedPlan })
          });

          if (response.ok) {
            toast({
              title: "Success",
              description: `Successfully selected ${selectedPlan} plan`
            });
          }
        } catch (error) {
          console.error('Failed to upgrade subscription:', error);
        }
        break;

      case 3:
        // Complete API key configuration
        if (apiKeyData.apiKey) {
          try {
            const response = await fetch('/api/user/api-keys', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer mock-token'
              },
              body: JSON.stringify(apiKeyData)
            });

            if (response.ok) {
              await completeStep(3, { apiKeysConfigured: true });
              toast({
                title: "Success",
                description: "API key added successfully"
              });
            } else {
              const errorData = await response.json();
              toast({
                title: "Error",
                description: errorData.error || "Failed to add API key",
                variant: "destructive"
              });
              return;
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to add API key",
              variant: "destructive"
            });
            return;
          }
        } else {
          // Skip API key step
          await completeStep(3, { apiKeysConfigured: false });
        }
        break;

      case 4:
        // Complete onboarding
        await updateOnboardingProgress({ onboardingCompleted: true });
        toast({
          title: "Welcome to WAI DevStudio!",
          description: "Your setup is complete. Let's start building!"
        });
        // Redirect to main app
        window.location.href = '/';
        return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'alpha': return <Star className="h-5 w-5" />;
      case 'beta': return <Zap className="h-5 w-5" />;
      case 'gamma': return <Crown className="h-5 w-5" />;
      case 'enterprise': return <Building className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'alpha': return 'border-blue-200 bg-blue-50';
      case 'beta': return 'border-purple-200 bg-purple-50';
      case 'gamma': return 'border-yellow-200 bg-yellow-50';
      case 'enterprise': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to WAI DevStudio</h1>
          <p className="text-xl text-muted-foreground">Your AI-powered software development ecosystem</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = onboardingData?.completedSteps?.includes(step.id);
              const isCurrent = step.id === currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    p-3 rounded-full border-2 mb-2
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                      isCurrent ? 'bg-primary border-primary text-white' : 
                      'bg-white border-gray-300 text-gray-400'}
                  `}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isCurrent ? 'text-primary' : 'text-gray-600'}`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1]?.icon, { className: "h-6 w-6" })}
              {steps[currentStep - 1]?.title}
            </CardTitle>
            <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={profileData.role} onValueChange={(value) => setProfileData({...profileData, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="product-manager">Product Manager</SelectItem>
                        <SelectItem value="founder">Founder</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="experience">Development Experience</Label>
                  <Select value={profileData.experience} onValueChange={(value) => setProfileData({...profileData, experience: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (5+ years)</SelectItem>
                      <SelectItem value="expert">Expert (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {subscriptionPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`
                        relative cursor-pointer border-2 rounded-lg p-4 transition-all
                        ${selectedPlan === plan.id ? 
                          'border-primary bg-primary/5 shadow-lg scale-105' : 
                          `border-gray-200 hover:border-gray-300 ${getPlanColor(plan.id)}`
                        }
                      `}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          {getPlanIcon(plan.id)}
                        </div>
                        <h3 className="font-bold text-lg">{plan.displayName}</h3>
                        <div className="text-2xl font-bold text-primary">
                          {plan.price === 'Contact Us' ? plan.price : `$${plan.price}`}
                          {plan.price !== 'Contact Us' && (
                            <span className="text-sm font-normal text-muted-foreground">/{plan.billingCycle}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                      </div>

                      <div className="space-y-1 mt-4">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                        {plan.features.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{plan.features.length - 3} more features
                          </div>
                        )}
                      </div>

                      {selectedPlan === plan.id && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-primary">Selected</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  You can change your plan anytime from your settings
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Configure Your AI Provider</h3>
                  <p className="text-muted-foreground">
                    Add an API key to unlock AI-powered development features. You can skip this step and add it later.
                  </p>
                </div>
                
                <div className="max-w-md mx-auto space-y-4">
                  <div>
                    <Label htmlFor="provider">AI Provider</Label>
                    <Select value={apiKeyData.provider} onValueChange={(value) => setApiKeyData({...apiKeyData, provider: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI (Recommended)</SelectItem>
                        <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                        <SelectItem value="google">Google Gemini</SelectItem>
                        <SelectItem value="grok">X.AI Grok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      value={apiKeyData.keyName}
                      onChange={(e) => setApiKeyData({...apiKeyData, keyName: e.target.value})}
                      placeholder="e.g., Primary Key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apiKey">API Key (Optional)</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKeyData.apiKey}
                      onChange={(e) => setApiKeyData({...apiKeyData, apiKey: e.target.value})}
                      placeholder="Enter your API key or skip for now"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Don't have an API key? You can get one from your provider's dashboard and add it later in settings.
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">You're All Set!</h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    Welcome to WAI DevStudio! Your AI-powered development environment is ready.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 border rounded-lg">
                      <User className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="font-semibold">Profile Complete</div>
                      <div className="text-muted-foreground">Ready to personalize your experience</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Crown className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <div className="font-semibold">Plan Selected</div>
                      <div className="text-muted-foreground">Access to your plan features</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Rocket className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <div className="font-semibold">Ready to Build</div>
                      <div className="text-muted-foreground">Start creating amazing projects</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={handleNextStep}
            className="flex items-center gap-2"
          >
            {currentStep === 4 ? 'Get Started' : 'Continue'}
            {currentStep !== 4 && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}