import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Lightbulb,
  Rocket,
  BarChart3,
  FileText,
  Palette,
  TestTube,
  TrendingUp,
  Play,
  Cog,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Book,
  Video,
  Users,
} from "lucide-react";

export default function QuickStartGuide() {
  const [, setLocation] = useLocation();

  const studios = [
    {
      icon: Lightbulb,
      name: "Ideation Lab",
      description: "Refine and validate your startup concept",
      workflows: ["Concept Refinement", "Value Proposition", "Elevator Pitch"],
      color: "hsl(48, 96%, 53%)",
    },
    {
      icon: BarChart3,
      name: "Market Intelligence",
      description: "Competitive analysis and market sizing",
      workflows: ["Competitor Analysis", "Market Trends", "Sizing Research"],
      color: "hsl(142, 71%, 45%)",
    },
    {
      icon: FileText,
      name: "Product Blueprint",
      description: "PRDs, user stories, and specifications",
      workflows: ["Create PRD", "User Stories", "Technical Specs"],
      color: "hsl(217, 91%, 60%)",
    },
    {
      icon: Palette,
      name: "Experience Design",
      description: "UI/UX wireframes and mockups",
      workflows: ["Generate Mockups", "Design System", "User Flows"],
      color: "hsl(280, 85%, 60%)",
    },
    {
      icon: Rocket,
      name: "Engineering Forge",
      description: "Full-stack application generation",
      workflows: ["Generate App", "API Development", "Database Schema"],
      color: "hsl(14, 90%, 53%)",
    },
    {
      icon: TestTube,
      name: "Quality Assurance Lab",
      description: "Testing and debugging automation",
      workflows: ["Test Generation", "Bug Detection", "Performance Testing"],
      color: "hsl(340, 82%, 52%)",
    },
    {
      icon: TrendingUp,
      name: "Growth Engine",
      description: "Marketing and SEO strategies",
      workflows: ["SEO Optimization", "Content Strategy", "Growth Hacks"],
      color: "hsl(168, 76%, 42%)",
    },
    {
      icon: Play,
      name: "Launch Command",
      description: "Go-to-market and launch planning",
      workflows: ["Launch Plan", "PR Strategy", "Beta Testing"],
      color: "hsl(24, 95%, 53%)",
    },
    {
      icon: Cog,
      name: "Operations Hub",
      description: "Process automation and workflows",
      workflows: ["Workflow Automation", "Process Optimization", "Team Setup"],
      color: "hsl(200, 98%, 39%)",
    },
    {
      icon: Cloud,
      name: "Deployment Studio",
      description: "Production deployment and scaling",
      workflows: ["Deploy to Cloud", "CI/CD Setup", "Scaling Strategy"],
      color: "hsl(258, 90%, 66%)",
    },
  ];

  const journey = [
    {
      day: "Days 1-2",
      phase: "Ideation & Validation",
      studios: ["Ideation Lab", "Market Intelligence"],
      outcome: "Validated concept with market analysis",
    },
    {
      day: "Days 3-4",
      phase: "Product Design",
      studios: ["Product Blueprint", "Experience Design"],
      outcome: "Complete PRD and UI/UX mockups",
    },
    {
      day: "Days 5-9",
      phase: "Development",
      studios: ["Engineering Forge", "QA Lab"],
      outcome: "Functional MVP, tested and debugged",
    },
    {
      day: "Days 10-11",
      phase: "Go-to-Market",
      studios: ["Growth Engine", "Launch Command"],
      outcome: "Marketing strategy and launch plan",
    },
    {
      day: "Days 12-13",
      phase: "Operations & Deployment",
      studios: ["Operations Hub", "Deployment Studio"],
      outcome: "Production deployment with scaling",
    },
    {
      day: "Day 14",
      phase: "Launch",
      studios: ["All Studios"],
      outcome: "Production-ready MVP goes live! 🚀",
    },
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: "hsl(222, 47%, 11%)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: "hsl(217, 91%, 60%)" }}>
            <Book className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Beta Quick Start Guide</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Wizards Incubator
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Transform your startup idea into a production-ready MVP in just 14 days.
            Here's everything you need to get started.
          </p>
        </div>

        {/* Quick Start Steps */}
        <Card className="mb-8" style={{ background: "hsl(222, 47%, 15%)", border: "1px solid hsl(222, 35%, 20%)" }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Rocket className="w-6 h-6" style={{ color: "hsl(217, 91%, 60%)" }} />
              Getting Started (3 Steps)
            </CardTitle>
            <CardDescription className="text-gray-400">
              Follow these steps to begin your 14-day MVP journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(217, 91%, 60%)" }}>
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Complete Onboarding</h3>
                </div>
                <p className="text-gray-400 text-sm ml-13">
                  Fill out the startup details form to create your project and initialize AI agents
                </p>
                <Button
                  onClick={() => setLocation("/founder-onboarding")}
                  variant="outline"
                  size="sm"
                  data-testid="button-start-onboarding"
                  className="ml-13 bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white hover:bg-[hsl(222,35%,25%)]"
                >
                  Start Onboarding <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(142, 71%, 45%)" }}>
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Explore Studios</h3>
                </div>
                <p className="text-gray-400 text-sm ml-13">
                  Visit each studio to understand the AI workflows available for your MVP development
                </p>
                <Button
                  onClick={() => setLocation("/studios/ideation-lab")}
                  variant="outline"
                  size="sm"
                  data-testid="button-explore-studios"
                  className="ml-13 bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white hover:bg-[hsl(222,35%,25%)]"
                >
                  Visit Studios <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(280, 85%, 60%)" }}>
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Run First Workflow</h3>
                </div>
                <p className="text-gray-400 text-sm ml-13">
                  Launch Ideation Lab workspace to refine your concept with AI agents in real-time
                </p>
                <Button
                  onClick={() => setLocation("/studios/ideation-lab/work")}
                  variant="outline"
                  size="sm"
                  data-testid="button-first-workflow"
                  className="ml-13 bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white hover:bg-[hsl(222,35%,25%)]"
                >
                  Launch Workflow <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 14-Day Journey */}
        <Card className="mb-8" style={{ background: "hsl(222, 47%, 15%)", border: "1px solid hsl(222, 35%, 20%)" }}>
          <CardHeader>
            <CardTitle className="text-white">The 14-Day MVP Journey</CardTitle>
            <CardDescription className="text-gray-400">
              Your roadmap from idea to production-ready MVP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {journey.map((phase, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: index === journey.length - 1 ? "hsl(142, 71%, 45%)" : "hsl(217, 91%, 60%)" }}
                    >
                      {index === journey.length - 1 ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-white font-bold">{index + 1}</span>
                      )}
                    </div>
                    {index < journey.length - 1 && (
                      <div className="w-0.5 h-full mt-2" style={{ background: "hsl(222, 35%, 30%)" }} />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: "hsl(217, 91%, 60%)" }}>
                        {phase.day}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-white font-semibold">{phase.phase}</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{phase.studios.join(", ")}</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm" style={{ background: "hsl(222, 35%, 20%)" }}>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">{phase.outcome}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Studios Overview */}
        <Card className="mb-8" style={{ background: "hsl(222, 47%, 15%)", border: "1px solid hsl(222, 35%, 20%)" }}>
          <CardHeader>
            <CardTitle className="text-white">10 Specialized Studios</CardTitle>
            <CardDescription className="text-gray-400">
              Each studio is powered by AI agents specialized in their domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {studios.map((studio, index) => {
                const Icon = studio.icon;
                return (
                  <div
                    key={index}
                    className="p-4 rounded-lg border transition-colors hover:border-opacity-50"
                    style={{
                      background: "hsl(222, 35%, 18%)",
                      border: "1px solid hsl(222, 35%, 25%)",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: studio.color, opacity: 0.2 }}
                      >
                        <Icon className="w-5 h-5" style={{ color: studio.color }} />
                      </div>
                      <h3 className="font-semibold text-white">{studio.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{studio.description}</p>
                    <div className="space-y-1">
                      {studio.workflows.map((workflow, wIndex) => (
                        <div key={wIndex} className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="w-1 h-1 rounded-full" style={{ background: studio.color }} />
                          {workflow}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card style={{ background: "hsl(222, 47%, 15%)", border: "1px solid hsl(222, 35%, 20%)" }}>
          <CardHeader>
            <CardTitle className="text-white">Additional Resources</CardTitle>
            <CardDescription className="text-gray-400">
              Helpful guides and documentation to maximize your success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg" style={{ background: "hsl(222, 35%, 18%)" }}>
                <Book className="w-8 h-8 mb-3" style={{ color: "hsl(217, 91%, 60%)" }} />
                <h3 className="font-semibold text-white mb-2">Founder User Guide</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Complete guide to using the platform and all studio workflows
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-400 hover:text-blue-300"
                  onClick={() => window.open('/docs/FOUNDER_USER_GUIDE.md', '_blank')}
                  data-testid="link-founder-guide"
                >
                  Read Guide →
                </Button>
              </div>

              <div className="p-4 rounded-lg" style={{ background: "hsl(222, 35%, 18%)" }}>
                <Video className="w-8 h-8 mb-3" style={{ color: "hsl(280, 85%, 60%)" }} />
                <h3 className="font-semibold text-white mb-2">Demo Video</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Watch a full walkthrough of the platform and AG-UI streaming
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-400 hover:text-blue-300"
                  data-testid="link-demo-video"
                >
                  Watch Demo →
                </Button>
              </div>

              <div className="p-4 rounded-lg" style={{ background: "hsl(222, 35%, 18%)" }}>
                <Users className="w-8 h-8 mb-3" style={{ color: "hsl(142, 71%, 45%)" }} />
                <h3 className="font-semibold text-white mb-2">Community & Support</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Join our community of founders and get help from the team
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-400 hover:text-blue-300"
                  data-testid="link-community"
                >
                  Join Community →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={() => setLocation("/founder-onboarding")}
            data-testid="button-get-started"
            style={{ background: "hsl(217, 91%, 60%)" }}
            className="text-white"
          >
            <Rocket className="mr-2 w-5 h-5" />
            Get Started Now
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            Already completed onboarding?{" "}
            <button
              onClick={() => setLocation("/dashboard")}
              className="text-blue-400 hover:text-blue-300 underline"
              data-testid="link-dashboard"
            >
              Go to Dashboard
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
