import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Lightbulb, Code, TrendingUp, FileText, Palette, Bug,
  Rocket, BarChart3, Settings, Cloud, ArrowRight, Lock
} from "lucide-react";

interface Studio {
  id: string;
  name: string;
  description: string;
  icon: typeof Lightbulb;
  color: string;
  features: string[];
  demoAvailable: boolean;
}

const studios: Studio[] = [
  {
    id: "ideation-lab",
    name: "Ideation Lab",
    description: "Transform your startup idea into a validated business model with AI-powered market research and competitive analysis.",
    icon: Lightbulb,
    color: "text-yellow-600",
    features: ["Business Model Canvas", "Market Research", "Competitor Analysis"],
    demoAvailable: true
  },
  {
    id: "engineering-forge",
    name: "Engineering Forge",
    description: "Generate production-ready code with AI architects selecting optimal tech stacks and implementing features.",
    icon: Code,
    color: "text-blue-600",
    features: ["Code Generation", "Tech Stack Selection", "Architecture Design"],
    demoAvailable: true
  },
  {
    id: "market-intelligence",
    name: "Market Intelligence",
    description: "AI-powered market analysis providing deep insights into industry trends, customer needs, and opportunities.",
    icon: TrendingUp,
    color: "text-green-600",
    features: ["Industry Analysis", "Customer Discovery", "Trend Forecasting"],
    demoAvailable: true
  },
  {
    id: "product-blueprint",
    name: "Product Blueprint",
    description: "Create comprehensive product specifications with user stories, features prioritization, and roadmaps.",
    icon: FileText,
    color: "text-purple-600",
    features: ["Feature Specs", "User Stories", "Product Roadmap"],
    demoAvailable: true
  },
  {
    id: "experience-design",
    name: "Experience Design",
    description: "Design stunning UX/UI with AI-generated mockups, design systems, and interactive prototypes.",
    icon: Palette,
    color: "text-pink-600",
    features: ["UI/UX Design", "Design Systems", "Prototyping"],
    demoAvailable: true
  },
  {
    id: "quality-assurance-lab",
    name: "Quality Assurance Lab",
    description: "Automated testing and quality control with AI-generated test suites and code review.",
    icon: Bug,
    color: "text-orange-600",
    features: ["Test Generation", "Code Review", "Quality Metrics"],
    demoAvailable: true
  },
  {
    id: "growth-engine",
    name: "Growth Engine",
    description: "AI-powered growth strategies including GTM planning, content marketing, and growth hacking.",
    icon: Rocket,
    color: "text-red-600",
    features: ["GTM Strategy", "Content Marketing", "Growth Hacking"],
    demoAvailable: true
  },
  {
    id: "launch-command",
    name: "Launch Command",
    description: "Execute your product launch with AI-driven launch planning, beta testing, and go-to-market execution.",
    icon: BarChart3,
    color: "text-indigo-600",
    features: ["Launch Planning", "Beta Testing", "GTM Execution"],
    demoAvailable: true
  },
  {
    id: "operations-hub",
    name: "Operations Hub",
    description: "Optimize business operations with AI-powered analytics, process automation, and performance tracking.",
    icon: Settings,
    color: "text-teal-600",
    features: ["Process Optimization", "Performance Analytics", "Workflow Automation"],
    demoAvailable: true
  },
  {
    id: "deployment-studio",
    name: "Deployment Studio",
    description: "Automate cloud deployment with CI/CD pipelines, infrastructure as code, and domain configuration.",
    icon: Cloud,
    color: "text-cyan-600",
    features: ["Cloud Deployment", "CI/CD Setup", "Infrastructure Management"],
    demoAvailable: true
  }
];

export default function DemoStudios() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Explore Wizards Studios
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Try our AI-powered studios with sample data (no signup required)
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/founder-login">
                <Button variant="outline" data-testid="button-login">
                  Login
                </Button>
              </Link>
              <Link to="/founder-signup">
                <Button data-testid="button-signup">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Studios Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Demo Mode - Read-Only Access
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You're exploring with sample data. Sign up free to create your own projects, save results, and access all 267+ AI agents working on your startup 24/7.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio) => {
            const Icon = studio.icon;
            return (
              <Card 
                key={studio.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                data-testid={`card-studio-${studio.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800 ${studio.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {studio.demoAvailable && (
                      <Badge variant="secondary" className="text-xs">
                        Demo Available
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {studio.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 min-h-[60px]">
                    {studio.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Features List */}
                    <div className="space-y-2">
                      {studio.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Link to={`/demo/studios/${studio.id}`}>
                      <Button 
                        className="w-full group-hover:shadow-md transition-all"
                        data-testid={`button-try-${studio.id}`}
                      >
                        Try Demo
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <Card className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-3">
              Ready to Build Your Startup?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Sign up free to access all 10 studios, 267+ AI agents, and transform your idea into a production-ready MVP in 14 days.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/founder-signup">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  data-testid="button-signup-bottom"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  data-testid="button-learn-more"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
