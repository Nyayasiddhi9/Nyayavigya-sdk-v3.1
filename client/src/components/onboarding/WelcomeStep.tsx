import { Sparkles, Rocket, Code, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="space-y-8" data-testid="welcome-step">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 blur-xl opacity-50 animate-pulse" />
            <Sparkles className="w-16 h-16 text-primary relative" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Welcome to <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Wizards Incubator</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform your startup idea into a production-ready MVP in just 14 days, powered by 267+ specialized AI agents working 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
        <div className="p-6 rounded-lg bg-[hsl(222,47%,13%)] border border-[hsl(222,47%,20%)]">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">10 Specialized Studios</h3>
          <p className="text-sm text-muted-foreground">
            From idea validation to deployment, each studio handles a specific phase of your journey
          </p>
        </div>

        <div className="p-6 rounded-lg bg-[hsl(222,47%,13%)] border border-[hsl(222,47%,20%)]">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
            <Code className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">267+ AI Agents</h3>
          <p className="text-sm text-muted-foreground">
            Expert agents working collaboratively across 23+ LLM providers for optimal results
          </p>
        </div>

        <div className="p-6 rounded-lg bg-[hsl(222,47%,13%)] border border-[hsl(222,47%,20%)]">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Real-Time Insights</h3>
          <p className="text-sm text-muted-foreground">
            Watch AI agents think and collaborate in real-time with our AG-UI streaming technology
          </p>
        </div>
      </div>

      <div className="p-6 rounded-lg bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20">
        <h3 className="text-lg font-semibold text-white mb-2">🎯 What You'll Achieve</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Validated startup idea with market research and competitive analysis</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Complete product specification and technical architecture</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Production-ready MVP code with automated testing and deployment</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">✓</span>
            <span>Growth strategy and go-to-market execution plan</span>
          </li>
        </ul>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold px-8"
          data-testid="button-get-started"
        >
          Get Started
          <Sparkles className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
