/**
 * Studio Readiness Gate Component
 * Higher-order wrapper that checks studio dependencies before rendering content
 */

import { ReactNode } from 'react';
import { useStudioReadiness } from '@/hooks/useStudioReadiness';
import { StudioDependencyBlocker } from './StudioDependencyBlocker';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface StudioReadinessGateProps {
  studioId: string;
  startupId: number | null | undefined;
  children: ReactNode;
  skipCheck?: boolean; // Allow bypassing the check for testing/admin
}

export function StudioReadinessGate({
  studioId,
  startupId,
  children,
  skipCheck = false,
}: StudioReadinessGateProps) {
  const { data: readiness, isLoading, error } = useStudioReadiness(
    studioId,
    startupId,
    { enabled: !skipCheck }
  );

  // Skip check if explicitly disabled
  if (skipCheck) {
    return <>{children}</>;
  }

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900"
        data-testid="readiness-loading"
      >
        <Card className="max-w-md w-full bg-gray-900/95 backdrop-blur-sm border-gray-700/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  Checking Studio Readiness
                </h3>
                <p className="text-sm text-gray-400">
                  Verifying dependencies and prerequisites...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - show children with error in console
  if (error) {
    console.error('Studio readiness check failed:', error);
    // Allow access on error to prevent blocking users
    return <>{children}</>;
  }

  // Dependency blocker - studio not ready
  if (readiness && !readiness.ready) {
    return (
      <StudioDependencyBlocker
        currentStudioId={studioId}
        missingDependencies={readiness.missingDependencies}
        message={readiness.message}
      />
    );
  }

  // Studio is ready - render children
  return <>{children}</>;
}
