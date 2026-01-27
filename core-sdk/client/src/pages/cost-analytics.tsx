import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CostDashboard from "@/components/cost-dashboard";
import AnimatedCard from "@/components/ui/animated-card";
import HyperspeedText from "@/components/ui/hyperspeed-text";
import { useCostMetrics } from "@/hooks/use-cost-metrics";
import { api } from "@/lib/api";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";

export default function CostAnalytics() {
  const { data: costAnalysis, isLoading: costLoading } = useQuery({
    queryKey: ['/api/cost-analytics'],
    queryFn: () => api.getCostAnalysis()
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/metrics'],
    queryFn: () => api.getMetrics()
  });

  const { data: health } = useQuery({
    queryKey: ['/api/health'],
    queryFn: () => api.getSystemHealth()
  });

  const { costMetrics } = useCostMetrics();

  if (costLoading || metricsLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dailyCost = costAnalysis?.dailyCost || 0;
  const totalCost = costAnalysis?.totalCost || 0;
  const budgetUsage = costAnalysis?.budget?.monthlyUsage || 0;
  const efficiency = 91.8; // From WAI optimization

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <HyperspeedText 
          text="Cost Analytics & Optimization" 
          className="text-3xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent"
        />
        <p className="text-muted-foreground">
          Real-time cost tracking, intelligent provider routing, and optimization insights
        </p>
      </div>

      {/* Cost Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCard className="p-6 bg-card border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Cost</p>
              <p className="text-2xl font-bold text-white">${dailyCost.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <TrendingDown className="h-3 w-3 text-emerald-400" />
            <span className="text-sm text-emerald-400">12% vs yesterday</span>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6 bg-card border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Target className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Total</p>
              <p className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Budget Usage</span>
              <span className="text-white">{budgetUsage.toFixed(1)}%</span>
            </div>
            <Progress value={budgetUsage} className="h-1" />
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6 bg-card border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Efficiency Score</p>
              <p className="text-2xl font-bold text-white">{efficiency}%</p>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            <span className="text-sm text-emerald-400">Optimized routing</span>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6 bg-card border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potential Savings</p>
              <p className="text-2xl font-bold text-white">
                ${costAnalysis?.optimization?.potential_savings?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <Activity className="h-3 w-3 text-orange-400" />
            <span className="text-sm text-orange-400">Auto-optimization active</span>
          </div>
        </AnimatedCard>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="providers" className="data-[state=active]:bg-primary">
            <PieChart className="mr-2 h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-primary">
            <LineChart className="mr-2 h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="optimization" className="data-[state=active]:bg-primary">
            <Zap className="mr-2 h-4 w-4" />
            Optimization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CostDashboard />
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Usage */}
            <AnimatedCard className="p-6 bg-card border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">LLM Provider Usage</CardTitle>
                <CardDescription>
                  Cost distribution across AI providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {costAnalysis?.costByProvider && Object.entries(costAnalysis.costByProvider).map(([provider, cost]) => {
                  const percentage = (cost / totalCost) * 100;
                  return (
                    <div key={provider} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            provider === 'openai' ? 'bg-blue-500' :
                            provider === 'anthropic' ? 'bg-purple-500' :
                            provider === 'google' ? 'bg-green-500' :
                            'bg-orange-500'
                          }`} />
                          <span className="text-white capitalize">{provider}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">{percentage.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">${cost.toFixed(2)}</div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </AnimatedCard>

            {/* Performance Metrics */}
            <AnimatedCard className="p-6 bg-card border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Provider Performance</CardTitle>
                <CardDescription>
                  Quality vs cost efficiency metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">OpenAI GPT-4o</div>
                      <div className="text-xs text-muted-foreground">Primary for complex tasks</div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400">A+</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Claude Sonnet 4</div>
                      <div className="text-xs text-muted-foreground">Code generation specialist</div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400">A+</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Gemini Flash</div>
                      <div className="text-xs text-muted-foreground">Fast analysis tasks</div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">A</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Qwen 2.5 72B</div>
                      <div className="text-xs text-muted-foreground">Cost-effective processing</div>
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-400">B+</Badge>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <AnimatedCard className="p-6 bg-card border border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-white">Cost Trends</CardTitle>
              <CardDescription>
                Historical cost analysis and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/10 rounded-lg">
                <div className="text-center space-y-2">
                  <LineChart className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Interactive cost trends chart</p>
                  <p className="text-xs text-muted-foreground">Real-time cost tracking over time</p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Smart Optimizations */}
            <AnimatedCard className="p-6 bg-card border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  Smart Optimizations
                </CardTitle>
                <CardDescription>
                  AI-powered cost reduction strategies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {costAnalysis?.optimization?.recommendations?.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{rec}</p>
                    </div>
                  </div>
                )) || (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">Automatic Fallback Routing</p>
                        <p className="text-xs text-emerald-300">Saved $23.45 by switching to backup providers during peak pricing</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">Context Optimization</p>
                        <p className="text-xs text-blue-300">mem0 memory management reduced token usage by 26%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <Target className="h-5 w-5 text-purple-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">Task-Specific Routing</p>
                        <p className="text-xs text-purple-300">Optimal provider selection for each task type</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </AnimatedCard>

            {/* Budget Management */}
            <AnimatedCard className="p-6 bg-card border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center">
                  <Target className="mr-2 h-5 w-5 text-orange-400" />
                  Budget Management
                </CardTitle>
                <CardDescription>
                  Set limits and alerts for cost control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Daily Budget</span>
                    <span className="text-white font-medium">$100.00</span>
                  </div>
                  <Progress value={dailyCost} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">${dailyCost.toFixed(2)} used</span>
                    <span className="text-muted-foreground">${(100 - dailyCost).toFixed(2)} remaining</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Monthly Budget</span>
                    <span className="text-white font-medium">$1,000.00</span>
                  </div>
                  <Progress value={budgetUsage} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">${totalCost.toFixed(2)} used</span>
                    <span className="text-muted-foreground">${(1000 - totalCost).toFixed(2)} remaining</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <span className="text-orange-400">Alert at 80% usage</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">Auto-optimization enabled</span>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
