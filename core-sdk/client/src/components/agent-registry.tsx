import { useQuery } from "@tanstack/react-query";
import { Code, Palette, BarChart, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentStats } from "@/lib/types";

const categoryIcons = {
  development: Code,
  content: Palette,
  analysis: BarChart,
  communication: MoreHorizontal,
  automation: MoreHorizontal,
  specialized: MoreHorizontal,
};

const categoryColors = {
  development: "bg-blue-500/10 text-blue-400",
  content: "bg-purple-500/10 text-purple-400",
  analysis: "bg-emerald-500/10 text-emerald-400",
  communication: "bg-orange-500/10 text-orange-400",
  automation: "bg-indigo-500/10 text-indigo-400",
  specialized: "bg-pink-500/10 text-pink-400",
};

export default function AgentRegistry() {
  const { data: stats, isLoading } = useQuery<AgentStats>({
    queryKey: ["/api/agents/stats/by-category"],
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-card rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Agent Registry Status</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load agent statistics</p>
        </div>
      </div>
    );
  }

  const allCategories = Object.entries(stats)
    .sort(([,a], [,b]) => b.total - a.total);

  return (
    <div className="bg-card rounded-lg p-6" data-testid="agent-registry">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Agent Registry Status</h3>
        <span className="text-sm text-muted-foreground" data-testid="total-agents">
          {Object.values(stats).reduce((sum, cat) => sum + cat.total, 0)} Total Agents
        </span>
      </div>
      
      <div className="space-y-4">
        {allCategories.map(([category, data]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons] || MoreHorizontal;
          const colorClass = categoryColors[category as keyof typeof categoryColors] || "bg-gray-500/10 text-gray-400";
          
          return (
            <div 
              key={category} 
              className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
              data-testid={`agent-category-${category}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center agent-pulse ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()} Agents
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {category === 'development' && 'Code generation, testing, deployment'}
                    {category === 'content' && 'Text, image, video, audio generation'}
                    {category === 'analysis' && 'Data analysis, research, insights'}
                    {category === 'communication' && 'Messaging, notifications, alerts'}
                    {category === 'automation' && 'Workflow automation, scheduling'}
                    {category === 'specialized' && 'Domain-specific specialized tasks'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-foreground" data-testid={`count-${category}`}>
                  {data.active}
                </span>
                <p className="text-xs text-green-400">Active</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
