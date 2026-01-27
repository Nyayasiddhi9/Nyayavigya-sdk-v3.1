import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  Palette,
  Code,
  TestTube,
  Rocket,
  BarChart3,
  Lock,
  Zap,
  TrendingUp,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  Users,
  Layers,
  Activity,
} from 'lucide-react';

const studios = [
  {
    id: 'ideation_lab',
    name: 'Ideation Lab',
    description: 'Transform ideas into validated concepts with AI-powered market research and business modeling',
    icon: Lightbulb,
    agents: 28,
    color: 'from-yellow-500/20 to-yellow-600/20',
    status: 'active',
  },
  {
    id: 'design_studio',
    name: 'Design Studio',
    description: 'Create stunning UI/UX designs with AI-powered mockups, prototypes, and brand identity',
    icon: Palette,
    agents: 24,
    color: 'from-pink-500/20 to-purple-600/20',
    status: 'active',
  },
  {
    id: 'code_factory',
    name: 'Code Factory',
    description: 'Generate production-ready code across frontend, backend, and infrastructure layers',
    icon: Code,
    agents: 42,
    color: 'from-blue-500/20 to-cyan-600/20',
    status: 'active',
  },
  {
    id: 'testing_arena',
    name: 'Testing Arena',
    description: 'Automated testing, QA, and quality assurance with comprehensive coverage',
    icon: TestTube,
    agents: 22,
    color: 'from-green-500/20 to-emerald-600/20',
    status: 'active',
  },
  {
    id: 'deployment_hub',
    name: 'Deployment Hub',
    description: 'Deploy to production with CI/CD pipelines, infrastructure setup, and monitoring',
    icon: Rocket,
    agents: 18,
    color: 'from-orange-500/20 to-red-600/20',
    status: 'active',
  },
  {
    id: 'analytics_engine',
    name: 'Analytics Engine',
    description: 'Track metrics, user behavior, and business KPIs with real-time dashboards',
    icon: BarChart3,
    agents: 20,
    color: 'from-indigo-500/20 to-purple-600/20',
    status: 'active',
  },
  {
    id: 'security_vault',
    name: 'Security Vault',
    description: 'Enterprise-grade security, compliance, and vulnerability management',
    icon: Lock,
    agents: 25,
    color: 'from-red-500/20 to-rose-600/20',
    status: 'active',
  },
  {
    id: 'integration_hub',
    name: 'Integration Hub',
    description: 'Connect with 500+ services, APIs, and third-party integrations seamlessly',
    icon: Zap,
    agents: 32,
    color: 'from-yellow-500/20 to-orange-600/20',
    status: 'active',
  },
  {
    id: 'optimization_center',
    name: 'Optimization Center',
    description: 'AI-driven performance optimization, cost reduction, and resource management',
    icon: TrendingUp,
    agents: 28,
    color: 'from-green-500/20 to-teal-600/20',
    status: 'active',
  },
  {
    id: 'support_network',
    name: 'Support Network',
    description: '24/7 AI support, documentation, training, and community assistance',
    icon: HeartHandshake,
    agents: 28,
    color: 'from-blue-500/20 to-indigo-600/20',
    status: 'active',
  },
];

export default function WizardsIncubatorPlatform() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 bg-[hsl(222,47%,11%)]/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-[hsl(217,91%,60%)]" />
              <div>
                <h1 className="text-xl font-bold">Wizards Incubator Platform</h1>
                <p className="text-xs text-gray-400">Powered by WAI SDK v1.0</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <Badge variant="outline" className="border-green-500/50 text-green-400 gap-2">
                <Activity className="w-3 h-3 animate-pulse" />
                WAI v10.0 Active
              </Badge>
              <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                <Users className="w-3 h-3" />
                267+ Agents
              </Badge>
              <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                <Layers className="w-3 h-3" />
                23+ LLMs
              </Badge>
              <Link to="/founder-dashboard">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Founder Dashboard
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(217,91%,60%)]/10 via-transparent to-[hsl(270,75%,65%)]/10" />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles className="w-4 h-4 text-[hsl(217,91%,60%)]" />
            <span className="text-sm text-gray-300">Transform Ideas into Production MVPs in 14 Days</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Build Your Startup with
            <br />
            <span className="bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] bg-clip-text text-transparent">
              AI-Powered Acceleration
            </span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            10 specialized studios, 267+ AI agents, and comprehensive support to take your idea from concept to launched MVP in just 14 days.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <Link to="/founder-dashboard">
              <Button size="lg" className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] text-white px-8" data-testid="button-start-journey">
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/founder-dashboard">
              <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5" data-testid="button-view-dashboard">
                View Dashboard
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white/5 border-white/10 p-6">
              <div className="text-4xl font-bold text-[hsl(217,91%,60%)] font-mono mb-2">267+</div>
              <div className="text-gray-400">AI Agents</div>
              <div className="text-xs text-gray-500 mt-1">Across 10 Studios</div>
            </Card>
            <Card className="bg-white/5 border-white/10 p-6">
              <div className="text-4xl font-bold text-[hsl(270,75%,65%)] font-mono mb-2">10</div>
              <div className="text-gray-400">Specialized Studios</div>
              <div className="text-xs text-gray-500 mt-1">End-to-End Coverage</div>
            </Card>
            <Card className="bg-white/5 border-white/10 p-6">
              <div className="text-4xl font-bold text-[hsl(142,71%,45%)] font-mono mb-2">14</div>
              <div className="text-gray-400">Days to Launch</div>
              <div className="text-xs text-gray-500 mt-1">From Idea to MVP</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Studios Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">10 Specialized Studios</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Each studio is powered by specialized AI agents working together to accelerate your startup journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studios.map((studio) => {
              const Icon = studio.icon;
              return (
                <Card
                  key={studio.id}
                  className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 hover:border-white/20 transition-all duration-300 hover:translate-y-[-4px] group cursor-pointer"
                  data-testid={`card-studio-${studio.id}`}
                >
                  <div className="p-6">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${studio.color} mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-xl font-semibold">{studio.name}</h4>
                      <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                        {studio.status}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-4 min-h-[60px]">
                      {studio.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{studio.agents} agents</span>
                      </div>
                      <Link to={`/studios/${studio.id}/work`}>
                        <Button variant="ghost" size="sm" className="text-[hsl(217,91%,60%)] hover:text-[hsl(217,91%,70%)] p-0">
                          Launch
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-br from-[hsl(217,91%,60%)]/20 to-[hsl(270,75%,65%)]/20 border-white/20 p-12">
            <Sparkles className="w-12 h-12 text-[hsl(217,91%,60%)] mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-4">Ready to Build Your Startup?</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join founders who are launching production-ready MVPs in 14 days with AI-powered acceleration
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/founder-dashboard">
                <Button size="lg" className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] text-white px-8">
                  Get Started Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/admin">
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5">
                  Admin Console
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <div>
            <p>© 2025 Wizards Incubator Platform. Powered by WAI SDK v1.0</p>
          </div>
          <div className="flex items-center gap-6">
            <span>267+ AI Agents</span>
            <span>23+ LLM Providers</span>
            <span>10 Specialized Studios</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
