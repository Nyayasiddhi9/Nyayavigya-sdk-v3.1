/**
 * CAM 2.0 Dashboard Page
 * Wrapper page for CAM Monitoring Dashboard that fetches startup context
 */

import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CAMMonitoringDashboard } from '@/components/CAMMonitoringDashboard';

export default function CAMDashboardPage() {
  const [_, setLocation] = useLocation();

  // Fetch founder's startup data
  const { data: founderData, isLoading, error } = useQuery({
    queryKey: ['/api/wizards/founders/me/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/wizards/founders/me/dashboard', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch founder data');
      return response.json();
    },
  });

  const startup = founderData?.startups?.[0];
  const startupId = startup?.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading CAM Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !startup) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              CAM Dashboard Unavailable
            </CardTitle>
            <CardDescription>
              {error ? 'Failed to load dashboard data' : 'No startup found for your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {error 
                ? 'Please try again later or contact support if the problem persists.'
                : 'You need to be enrolled in the Wizards Incubator program to access the CAM dashboard.'}
            </p>
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)]">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/orchestration')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="h-6 w-6 text-purple-600" />
                CAM 2.0 Monitoring Dashboard
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Continuous Agent Monitoring for {startup.name}
              </p>
            </div>
          </div>
        </div>

        {/* CAM Dashboard Component */}
        <CAMMonitoringDashboard startupId={startupId} />
      </div>
    </div>
  );
}
