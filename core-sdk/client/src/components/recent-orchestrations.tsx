import { Clock, Code, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Orchestration } from "@shared/schema";

interface RecentOrchestrationsProps {
  orchestrations: Orchestration[];
}

const getOrchestrationIcon = (title: string) => {
  if (title.toLowerCase().includes("code") || title.toLowerCase().includes("development")) {
    return Code;
  }
  if (title.toLowerCase().includes("video") || title.toLowerCase().includes("marketing")) {
    return Video;
  }
  if (title.toLowerCase().includes("documentation") || title.toLowerCase().includes("docs")) {
    return FileText;
  }
  return Code;
};

const getOrchestrationColor = (title: string) => {
  if (title.toLowerCase().includes("code") || title.toLowerCase().includes("development")) {
    return "bg-primary/10 text-primary";
  }
  if (title.toLowerCase().includes("video") || title.toLowerCase().includes("marketing")) {
    return "bg-purple-500/10 text-purple-400";
  }
  if (title.toLowerCase().includes("documentation") || title.toLowerCase().includes("docs")) {
    return "bg-emerald-500/10 text-emerald-400";
  }
  return "bg-blue-500/10 text-blue-400";
};

const getAgentBadgeColor = (title: string) => {
  if (title.toLowerCase().includes("code") || title.toLowerCase().includes("development")) {
    return "bg-primary/20 text-primary";
  }
  if (title.toLowerCase().includes("video") || title.toLowerCase().includes("marketing")) {
    return "bg-purple-500/20 text-purple-400";
  }
  if (title.toLowerCase().includes("documentation") || title.toLowerCase().includes("docs")) {
    return "bg-emerald-500/20 text-emerald-400";
  }
  return "bg-blue-500/20 text-blue-400";
};

function formatTimeAgo(date: Date | null): string {
  if (!date) return "Unknown";
  const now = new Date();
  const actualDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - actualDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 60) {
    return `${diffMins}min ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}

function calculateRemainingTime(progress: number, estimatedDurationMs?: number | null): string {
  if (!estimatedDurationMs || progress >= 100) {
    return "Completed";
  }
  
  const remainingProgress = 100 - progress;
  const remainingMs = (estimatedDurationMs * remainingProgress) / 100;
  const remainingMins = Math.floor(remainingMs / (1000 * 60));
  
  if (remainingMins < 60) {
    return `${remainingMins}min remaining`;
  } else {
    const remainingHours = Math.floor(remainingMins / 60);
    return `${remainingHours}h remaining`;
  }
}

export default function RecentOrchestrations({ orchestrations }: RecentOrchestrationsProps) {
  return (
    <div className="bg-card rounded-lg p-6" data-testid="recent-orchestrations">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Orchestrations</h3>
        <Button variant="link" className="text-primary hover:text-primary/80 text-sm" data-testid="button-view-all">
          View All
        </Button>
      </div>
      
      <div className="space-y-4">
        {orchestrations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent orchestrations</p>
          </div>
        ) : (
          orchestrations.map((orchestration) => {
            const Icon = getOrchestrationIcon(orchestration.title);
            const iconColor = getOrchestrationColor(orchestration.title);
            const badgeColor = getAgentBadgeColor(orchestration.title);
            const agentCount = Array.isArray(orchestration.agentIds) ? orchestration.agentIds.length : 0;
            
            return (
              <div 
                key={orchestration.id} 
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                data-testid={`orchestration-${orchestration.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{orchestration.title}</p>
                    <p className="text-sm text-muted-foreground">{orchestration.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${badgeColor}`}>
                        {agentCount} Agent{agentCount !== 1 ? 's' : ''} Active
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Started {formatTimeAgo(orchestration.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="status-indicator status-healthy"></span>
                    <span className="text-sm font-medium text-green-400">
                      {orchestration.progress}% Complete
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {calculateRemainingTime(orchestration.progress, orchestration.estimatedDurationMs)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
