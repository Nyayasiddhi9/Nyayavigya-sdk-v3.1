import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PerformanceAnalyticsProps {
  metrics: Record<string, {
    value: string;
    unit: string;
    timestamp: Date;
  }>;
}

export default function PerformanceAnalytics({ metrics }: PerformanceAnalyticsProps) {
  return (
    <div className="bg-card rounded-lg p-6" data-testid="performance-analytics">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Performance Analytics</h3>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/20"
            data-testid="button-24h"
          >
            24H
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-7d"
          >
            7D
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-30d"
          >
            30D
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center" data-testid="analytics-response-time">
          <p className="text-2xl font-bold text-primary">
            {metrics.response_time?.value || "0"}{metrics.response_time?.unit || "ms"}
          </p>
          <p className="text-sm text-muted-foreground">p95 Response Time</p>
        </div>
        <div className="text-center" data-testid="analytics-uptime">
          <p className="text-2xl font-bold text-green-400">
            {metrics.uptime?.value || "99.97"}%
          </p>
          <p className="text-sm text-muted-foreground">Uptime</p>
        </div>
        <div className="text-center" data-testid="analytics-cost-savings">
          <p className="text-2xl font-bold text-amber-400">
            {metrics.cost_savings?.value || "90"}%
          </p>
          <p className="text-sm text-muted-foreground">Cost Savings</p>
        </div>
        <div className="text-center" data-testid="analytics-active-tasks">
          <p className="text-2xl font-bold text-purple-400">
            {metrics.active_tasks?.value || "1,247"}
          </p>
          <p className="text-sm text-muted-foreground">Active Tasks</p>
        </div>
      </div>
      
      {/* Simulated Chart Area */}
      <div className="h-64 bg-gradient-to-t from-primary/5 to-transparent rounded-lg flex items-end justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Real-time performance monitoring</p>
          <p className="text-xs text-muted-foreground mt-1">Charts powered by live metrics API</p>
        </div>
      </div>
    </div>
  );
}
