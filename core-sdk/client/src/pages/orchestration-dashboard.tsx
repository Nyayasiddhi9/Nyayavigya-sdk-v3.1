import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import MetricCard from "@/components/metric-card";
import AgentRegistry from "@/components/agent-registry";
import ProviderStatus from "@/components/provider-status";
import IndiaFeatures from "@/components/india-features";
import PerformanceAnalytics from "@/components/performance-analytics";
import RecentOrchestrations from "@/components/recent-orchestrations";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Play, Settings } from "lucide-react";
import type { DashboardOverview } from "@/lib/types";

export default function Dashboard() {
  const { data: overview, isLoading } = useQuery<DashboardOverview>({
    queryKey: ["/api/dashboard/overview"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <main className="flex-1 p-6 space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Failed to load dashboard</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <main className="flex-1 p-6 space-y-6 gradient-bg">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Production Dashboard</h2>
              <p className="text-muted-foreground mt-1">
                Global AI orchestration platform monitoring {overview.activeAgents} agents across {overview.activeProviders} providers
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-new-orchestration"
              >
                <Play className="w-4 h-4 mr-2" />
                New Orchestration
              </Button>
              <Button variant="secondary" data-testid="button-settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Response Time"
              value={overview.metrics.response_time?.value || "0"}
              unit={overview.metrics.response_time?.unit || "ms"}
              target="≤250ms"
              icon="stopwatch"
              status="healthy"
              change={{ value: "48%", direction: "down" }}
              progress={52}
            />
            
            <MetricCard
              title="Success Rate"
              value={overview.metrics.success_rate?.value || "0"}
              unit={overview.metrics.success_rate?.unit || "%"}
              target="≥95%"
              icon="check-circle"
              status="healthy"
              change={{ value: "2.3%", direction: "up" }}
              progress={97}
            />
            
            <MetricCard
              title="Cost Savings"
              value={overview.metrics.cost_savings?.value || "0"}
              unit={overview.metrics.cost_savings?.unit || "%"}
              target="vs Traditional routing"
              icon="dollar-sign"
              status="healthy"
              change={{ value: "15%", direction: "up" }}
              progress={90}
            />
            
            <MetricCard
              title="Active Tasks"
              value={overview.metrics.active_tasks?.value || "0"}
              unit="count"
              target="Concurrent executions"
              icon="network-wired"
              status="healthy"
              change={{ value: "23%", direction: "up" }}
              progress={75}
            />
          </div>

          {/* Agent Registry and Provider Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AgentRegistry />
            <ProviderStatus />
          </div>

          {/* India-First Features */}
          <IndiaFeatures indiaFeatures={overview.indiaFeatures} />

          {/* Performance Analytics Chart */}
          <PerformanceAnalytics metrics={overview.metrics} />

          {/* Recent Orchestrations */}
          <RecentOrchestrations orchestrations={overview.recentOrchestrations} />

          {/* Footer Info */}
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              WAI SDK v1.0 Production • {overview.totalAgents} Agents • {overview.totalProviders} Providers • {overview.totalModels} Models
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Built for India 🇮🇳 • Deployed Globally 🌍 • Quantum-Ready ⚛️
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
