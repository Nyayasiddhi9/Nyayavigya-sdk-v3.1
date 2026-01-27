/**
 * Studio Dependency Blocker Component
 * Displays a full-page overlay when a studio has unmet dependencies
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { Link } from 'wouter';
import { getStudioName, getStudioRoute, getStudioDescription } from '@/lib/studio-config';

interface StudioDependencyBlockerProps {
  currentStudioId: string;
  missingDependencies: string[];
  message: string;
}

export function StudioDependencyBlocker({
  currentStudioId,
  missingDependencies,
  message,
}: StudioDependencyBlockerProps) {
  const currentStudioName = getStudioName(currentStudioId);
  const nextStudioId = missingDependencies[0]; // Show first missing dependency as primary action
  const nextStudioName = nextStudioId ? getStudioName(nextStudioId) : '';
  const nextStudioRoute = nextStudioId ? getStudioRoute(nextStudioId) : '';
  const nextStudioDescription = nextStudioId ? getStudioDescription(nextStudioId) : '';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900"
      data-testid="dependency-blocker-overlay"
    >
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                <Lock className="h-6 w-6 text-yellow-500" data-testid="icon-lock" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-white">
                  Complete Prerequisites First
                </CardTitle>
                <CardDescription className="text-gray-400 mt-1">
                  {currentStudioName} requires completing other studios before you can start
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Primary Alert Message */}
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-gray-300">
                {message}
              </AlertDescription>
            </Alert>

            {/* Missing Dependencies List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Required Studios ({missingDependencies.length})
              </h3>
              <div className="space-y-2">
                {missingDependencies.map((depId, index) => {
                  const depName = getStudioName(depId);
                  const depDescription = getStudioDescription(depId);
                  const isFirst = index === 0;

                  return (
                    <div
                      key={depId}
                      className={`p-4 rounded-lg border transition-all ${
                        isFirst
                          ? 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20'
                          : 'border-gray-700/50 bg-gray-800/30'
                      }`}
                      data-testid={`dependency-${depId}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white">{depName}</h4>
                            {isFirst && (
                              <Badge 
                                variant="outline" 
                                className="border-blue-500/50 text-blue-400 text-xs"
                                data-testid="badge-next"
                              >
                                Start Here
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{depDescription}</p>
                        </div>
                        {isFirst && (
                          <Link href={getStudioRoute(depId)}>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              data-testid={`button-goto-${depId}`}
                            >
                              Start Now
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Steps Guidance */}
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-white">Recommended Next Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300">
                    <li>
                      Start with <strong className="text-white">{nextStudioName}</strong> to unlock this studio
                    </li>
                    <li>Complete all required workflows in {nextStudioName}</li>
                    <li>
                      Return to <strong className="text-white">{currentStudioName}</strong> once complete
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Primary CTA */}
            {nextStudioId && (
              <div className="pt-4 border-t border-gray-700/50">
                <Link href={nextStudioRoute}>
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
                    data-testid="button-primary-goto"
                  >
                    Go to {nextStudioName}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-gray-500 mt-3">
                  {nextStudioDescription}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
