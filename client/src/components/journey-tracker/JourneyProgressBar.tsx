import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, Rocket, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface JourneyProgressBarProps {
  startupId: number;
  compact?: boolean;
}

interface MilestoneData {
  id: number;
  title: string;
  description: string | null;
  dayNumber: number;
  studioId: string;
  isOptional: boolean;
  orderInJourney: number;
}

interface ProgressData {
  id: number;
  userId: string;
  startupId: number;
  milestoneId: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  startedAt: Date | null;
  completedAt: Date | null;
  qualityScore: number | null;
  timeSpent: number | null;
}

interface JourneyData {
  milestones: MilestoneData[];
  progress: ProgressData[];
  completionRate: number;
  currentDay: number;
  nextMilestone: MilestoneData | null;
  statistics: {
    totalDays: number;
    daysCompleted: number;
    studiosCompleted: number;
    totalStudios: number;
    estimatedCompletion: string;
    averageQualityScore: number;
  };
}

export function JourneyProgressBar({ startupId, compact = false }: JourneyProgressBarProps) {
  const { data, isLoading } = useQuery<{ success: boolean; data: JourneyData }>({
    queryKey: ['/api/wizards/journey/progress', startupId],
    enabled: !!startupId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.success || !data.data) {
    return null;
  }

  const journey = data.data;
  const { milestones, progress, completionRate, currentDay, nextMilestone, statistics } = journey;

  const getMilestoneStatus = (milestoneId: number) => {
    return progress.find(p => p.milestoneId === milestoneId)?.status || 'pending';
  };

  const getMilestoneQuality = (milestoneId: number) => {
    return progress.find(p => p.milestoneId === milestoneId)?.qualityScore || null;
  };

  if (compact) {
    return (
      <div className="space-y-2" data-testid="journey-progress-compact">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Journey Progress</span>
          <span className="text-sm text-muted-foreground">
            Day {currentDay} of {statistics.totalDays}
          </span>
        </div>
        <Progress value={completionRate} className="h-2" data-testid="progress-bar" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{statistics.studiosCompleted} of {statistics.totalStudios} studios complete</span>
          <span>{statistics.estimatedCompletion}</span>
        </div>
      </div>
    );
  }

  return (
    <Card data-testid="journey-progress-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              14-Day MVP Journey
            </CardTitle>
            <CardDescription>
              Day {currentDay} of {statistics.totalDays} • {statistics.estimatedCompletion}
            </CardDescription>
          </div>
          <Badge variant="default" className="text-lg font-semibold">
            {completionRate}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {statistics.studiosCompleted}/{statistics.totalStudios} studios
            </span>
          </div>
          <Progress value={completionRate} className="h-3" data-testid="progress-bar-full" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{statistics.daysCompleted}</div>
            <div className="text-xs text-muted-foreground">Days Complete</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{statistics.averageQualityScore}%</div>
            <div className="text-xs text-muted-foreground">Avg Quality</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{14 - statistics.daysCompleted}</div>
            <div className="text-xs text-muted-foreground">Days Remaining</div>
          </div>
        </div>

        {nextMilestone && (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="font-medium">Next Milestone</div>
                <div className="text-sm text-muted-foreground">{nextMilestone.title}</div>
                <div className="text-xs text-muted-foreground">
                  Day {nextMilestone.dayNumber} • {nextMilestone.studioId}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium mb-3">All Milestones</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {milestones.map((milestone) => {
              const status = getMilestoneStatus(milestone.id);
              const quality = getMilestoneQuality(milestone.id);
              
              return (
                <div
                  key={milestone.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    status === 'completed' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                    status === 'in_progress' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
                    status === 'pending' && "bg-muted/30 border-muted",
                    status === 'blocked' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  )}
                  data-testid={`milestone-${milestone.id}`}
                >
                  <div className="mt-0.5">
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : status === 'in_progress' ? (
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{milestone.title}</span>
                      {milestone.isOptional && (
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      )}
                    </div>
                    {milestone.description && (
                      <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">Day {milestone.dayNumber}</span>
                      {quality !== null && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Quality: {quality}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
