/**
 * Wizards Journey Timeline Component
 * Visual 14-day journey tracker with phase progression and milestones
 */

import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Circle, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WIZARDS_STUDIOS } from '@shared/wizards-incubator-types';

interface TimelineProps {
  startupId: number;
}

interface StudioProgress {
  studioId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: Date;
  creditsUsed: number;
  qualityScore?: number;
}

interface JourneyData {
  currentDay: number;
  totalDays: number;
  currentPhase: string;
  studioProgress: StudioProgress[];
  overallProgress: number;
}

export function JourneyTimeline({ startupId }: TimelineProps) {
  const { data: journey, isLoading, isError, error, refetch } = useQuery<JourneyData>({
    queryKey: ['/api/wizards/journey/timeline', startupId],
    queryFn: async () => {
      const response = await fetch(`/api/wizards/journey/timeline/${startupId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch journey data');
      const data = await response.json();
      return data.journey;
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card data-testid="timeline-loading">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 animate-spin" />
            <span>Loading journey timeline...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card data-testid="timeline-error" className="border-red-500/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-red-400">Failed to load journey timeline</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Unable to fetch progress data'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
              data-testid="button-retry-timeline"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!journey) {
    return (
      <Card data-testid="timeline-no-data">
        <CardContent className="p-6">
          <p className="text-muted-foreground">No journey data available</p>
        </CardContent>
      </Card>
    );
  }

  const getStudioStatus = (studioId: string): StudioProgress | undefined => {
    return journey.studioProgress.find(s => s.studioId === studioId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" data-testid="icon-completed" />;
      case 'in_progress':
        return <Clock className="h-6 w-6 text-blue-500 animate-pulse" data-testid="icon-in-progress" />;
      default:
        return <Circle className="h-6 w-6 text-gray-300" data-testid="icon-not-started" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'completed': 'default',
      'in_progress': 'secondary',
      'not_started': 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'} data-testid={`badge-${status}`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Card className="w-full" data-testid="journey-timeline-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2" data-testid="timeline-title">
              <Sparkles className="h-5 w-5 text-purple-500" />
              14-Day MVP Journey
            </CardTitle>
            <CardDescription data-testid="timeline-description">
              Day {journey.currentDay} of {journey.totalDays} • {journey.currentPhase} Phase
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600" data-testid="overall-progress">
              {journey.overallProgress}%
            </p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <Progress value={journey.overallProgress} className="h-2" data-testid="progress-bar" />
          <p className="text-xs text-muted-foreground text-center">
            {Math.round((journey.currentDay / journey.totalDays) * 100)}% time elapsed
          </p>
        </div>

        {/* Studio Timeline */}
        <div className="relative space-y-4">
          {/* Vertical connector line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          {WIZARDS_STUDIOS.map((studio, index) => {
            const progress = getStudioStatus(studio.id);
            const status = progress?.status || 'not_started';
            const isActive = status === 'in_progress';
            const isCompleted = status === 'completed';

            return (
              <div
                key={studio.id}
                className={`relative pl-12 ${isActive ? 'bg-blue-50 dark:bg-blue-950/20 -mx-4 px-4 py-2 rounded-lg' : ''}`}
                data-testid={`studio-item-${studio.id}`}
              >
                {/* Icon */}
                <div className="absolute left-0 top-1 z-10 bg-white dark:bg-gray-900 rounded-full p-0.5">
                  {getStatusIcon(status)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" data-testid={`studio-icon-${studio.id}`}>{studio.icon}</span>
                        <h4 className="font-semibold" data-testid={`studio-name-${studio.id}`}>
                          {studio.name}
                        </h4>
                        {getStatusBadge(status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`studio-day-range-${studio.id}`}>
                        Days {studio.dayRange} • {studio.estimatedDays} day{studio.estimatedDays > 1 ? 's' : ''}
                      </p>
                    </div>

                    {isCompleted && progress?.qualityScore && (
                      <div className="text-right" data-testid={`quality-score-${studio.id}`}>
                        <p className="text-lg font-bold text-green-600">{progress.qualityScore}%</p>
                        <p className="text-xs text-muted-foreground">Quality</p>
                      </div>
                    )}
                  </div>

                  {progress && progress.creditsUsed > 0 && (
                    <p className="text-xs text-muted-foreground" data-testid={`credits-used-${studio.id}`}>
                      {progress.creditsUsed} credits used
                    </p>
                  )}

                  {isCompleted && progress?.completedAt && (
                    <p className="text-xs text-green-600" data-testid={`completed-at-${studio.id}`}>
                      ✓ Completed {new Date(progress.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Steps */}
        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg" data-testid="next-steps-card">
          <h4 className="font-semibold mb-2" data-testid="next-steps-title">🎯 Next Steps</h4>
          <p className="text-sm text-muted-foreground" data-testid="next-steps-description">
            {journey.overallProgress === 100
              ? '🎉 Congratulations! Your MVP is ready for launch!'
              : `Continue with ${WIZARDS_STUDIOS.find(s => getStudioStatus(s.id)?.status === 'in_progress')?.name || 'the next studio'} to keep building your MVP.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
