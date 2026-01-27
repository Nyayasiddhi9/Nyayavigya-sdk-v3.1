/**
 * Wizards Platform KPI Dashboard
 * High-level platform metrics for investor demos and founder dashboards
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Cpu,
  Zap,
  Rocket,
  Users,
  TrendingUp,
  BarChart3,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  Target
} from 'lucide-react';

interface KPIDashboardProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function KPIDashboard({ variant = 'full', className = '' }: KPIDashboardProps) {
  // Platform metrics - these represent the Wizards Platform capabilities
  const platformMetrics = {
    totalAgents: 267,
    agentBreakdown: {
      waiCore: 105,
      geminiflow: 79,
      wshobson: 83,
    },
    llmProviders: 23,
    totalStudios: 10,
    deliveryTimeline: '14 days',
    featuresCount: 200,
  };

  // Agent tier breakdown for visual representation
  const agentTiers = [
    { name: 'Executive Tier', count: 5, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { name: 'Development Tier', count: 25, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { name: 'Creative Tier', count: 20, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { name: 'QA Tier', count: 15, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { name: 'DevOps Tier', count: 15, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { name: 'Domain Specialists', count: 25, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  ];

  // LLM providers showcase
  const llmProviders = [
    'OpenAI', 'Anthropic', 'Google Gemini', 'xAI', 'Groq', 'Perplexity',
    'Meta Llama', 'DeepSeek', 'Mistral', 'Cohere', 'ElevenLabs', 'Moonshot',
  ];

  // Studios overview
  const studios = [
    { id: 'ideation-lab', name: 'Ideation Lab', icon: '💡', status: 'active' },
    { id: 'engineering-forge', name: 'Engineering Forge', icon: '⚙️', status: 'active' },
    { id: 'market-intelligence', name: 'Market Intelligence', icon: '📊', status: 'active' },
    { id: 'product-blueprint', name: 'Product Blueprint', icon: '🗺️', status: 'active' },
    { id: 'experience-design', name: 'Experience Design', icon: '🎨', status: 'active' },
    { id: 'qa-lab', name: 'Quality Assurance', icon: '🧪', status: 'active' },
    { id: 'growth-engine', name: 'Growth Engine', icon: '📈', status: 'active' },
    { id: 'launch-command', name: 'Launch Command', icon: '🚀', status: 'active' },
    { id: 'operations-hub', name: 'Operations Hub', icon: '⚡', status: 'active' },
    { id: 'deployment-studio', name: 'Deployment Studio', icon: '☁️', status: 'active' },
  ];

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {/* Compact metrics cards */}
        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-compact-agents">
          <CardContent className="pt-6">
            <div className="text-center">
              <Bot className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-white">{platformMetrics.totalAgents}+</div>
              <p className="text-sm text-gray-400">AI Agents</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-compact-providers">
          <CardContent className="pt-6">
            <div className="text-center">
              <Cpu className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-white">{platformMetrics.llmProviders}+</div>
              <p className="text-sm text-gray-400">LLM Providers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-compact-studios">
          <CardContent className="pt-6">
            <div className="text-center">
              <Rocket className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-white">{platformMetrics.totalStudios}</div>
              <p className="text-sm text-gray-400">Specialized Studios</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-compact-delivery">
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold text-white">{platformMetrics.deliveryTimeline}</div>
              <p className="text-sm text-gray-400">MVP Delivery</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Platform Overview Header */}
      <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-platform-overview">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" data-testid="kpi-title">
                <Sparkles className="h-6 w-6 text-purple-500" />
                Wizards Platform Intelligence
              </CardTitle>
              <CardDescription className="mt-2">
                AI-powered startup accelerator with 267+ autonomous agents and 23+ LLM providers
              </CardDescription>
            </div>
            <Badge className="bg-green-500/10 text-green-500 border-green-500/50" data-testid="badge-platform-status">
              <CheckCircle className="h-3 w-3 mr-1" />
              Operational
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Core Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Agents */}
        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-card-agents">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-mono font-bold text-white" data-testid="text-total-agents">
                {platformMetrics.totalAgents}+
              </div>
              <p className="text-xs text-gray-500">Autonomous specialists</p>
              <div className="flex gap-1 mt-3">
                <Badge variant="outline" className="text-xs">
                  WAI Core: {platformMetrics.agentBreakdown.waiCore}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LLM Providers */}
        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-card-llm-providers">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              LLM Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-mono font-bold text-white" data-testid="text-llm-providers">
                {platformMetrics.llmProviders}+
              </div>
              <p className="text-xs text-gray-500">Model providers integrated</p>
              <div className="flex gap-1 mt-3">
                <Badge variant="outline" className="text-xs">752+ Models</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Studios */}
        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-card-studios">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Specialized Studios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-mono font-bold text-white" data-testid="text-total-studios">
                {platformMetrics.totalStudios}
              </div>
              <p className="text-xs text-gray-500">Full SDLC coverage</p>
              <div className="flex gap-1 mt-3">
                <Badge variant="outline" className="text-xs">100% Automated</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MVP Delivery */}
        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-card-delivery">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              MVP Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-mono font-bold text-white" data-testid="text-delivery-timeline">
                {platformMetrics.deliveryTimeline}
              </div>
              <p className="text-xs text-gray-500">Idea to production</p>
              <div className="flex gap-1 mt-3">
                <Badge variant="outline" className="text-xs">Guaranteed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Tiers Breakdown */}
      <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-agent-tiers">
        <CardHeader>
          <CardTitle className="text-lg">Agent Tier Distribution</CardTitle>
          <CardDescription>105 WAI Core agents across 6 specialized tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {agentTiers.map((tier, index) => (
              <div
                key={tier.name}
                className={`${tier.bgColor} rounded-lg p-4 text-center`}
                data-testid={`agent-tier-${index}`}
              >
                <div className={`text-2xl font-bold ${tier.color}`}>{tier.count}</div>
                <p className="text-xs text-gray-400 mt-1">{tier.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* LLM Providers Showcase */}
      <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-llm-showcase">
        <CardHeader>
          <CardTitle className="text-lg">Integrated LLM Providers</CardTitle>
          <CardDescription>23+ world-class AI providers with 752+ models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {llmProviders.map((provider, index) => (
              <Badge
                key={provider}
                variant="outline"
                className="bg-[hsl(222,47%,11%)] border-blue-500/30 text-blue-400"
                data-testid={`llm-provider-${index}`}
              >
                {provider}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-400"
            >
              +11 more
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Studios Grid */}
      <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-studios-grid">
        <CardHeader>
          <CardTitle className="text-lg">10 Specialized Studios</CardTitle>
          <CardDescription>Complete SDLC automation from ideation to deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {studios.map((studio, index) => (
              <div
                key={studio.id}
                className="bg-[hsl(222,47%,11%)] border border-gray-700 rounded-lg p-3 text-center hover:border-blue-500/50 transition-colors"
                data-testid={`studio-${index}`}
              >
                <div className="text-2xl mb-1">{studio.icon}</div>
                <p className="text-xs text-gray-300 font-medium">{studio.name}</p>
                <Badge
                  className="mt-2 bg-green-500/10 text-green-500 border-green-500/50 text-xs"
                >
                  Active
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-features">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-yellow-500" />
              Platform Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">{platformMetrics.featuresCount}+</div>
            <p className="text-xs text-gray-500">Production-ready capabilities</p>
            <Progress value={100} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-automation">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              SDLC Automation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">100%</div>
            <p className="text-xs text-gray-500">Automated development lifecycle</p>
            <Progress value={100} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="kpi-quality">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-green-500" />
              Quality Assurance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">Enterprise</div>
            <p className="text-xs text-gray-500">Production-grade standards</p>
            <Progress value={100} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
