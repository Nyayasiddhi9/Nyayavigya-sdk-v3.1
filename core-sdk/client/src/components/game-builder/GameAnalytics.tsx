import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Star, 
  Heart,
  Brain,
  Target,
  Download
} from 'lucide-react';

interface GameAnalyticsProps {
  gameId: number;
}

export function GameAnalytics({ gameId }: GameAnalyticsProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: [`/api/game-projects/${gameId}/analytics`],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(8).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const data = analytics?.data;
  if (!data) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Plays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPlays?.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +18% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Unique Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.uniquePlayers?.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(data.averageSessionTime || 0)}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Star className="h-4 w-4" />
              User Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {data.userRating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +0.2 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Therapeutic Metrics (if applicable) */}
      {data.therapeuticMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-600" />
              Therapeutic Effectiveness
            </CardTitle>
            <CardDescription>
              Mental health and wellness impact metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Stress Reduction</span>
                  <span className="text-sm text-green-600 font-semibold">
                    {(parseFloat(data.therapeuticMetrics.stressReduction) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={parseFloat(data.therapeuticMetrics.stressReduction) * 100} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Mindfulness Score</span>
                  <span className="text-sm text-blue-600 font-semibold">
                    {(parseFloat(data.therapeuticMetrics.mindfulnessScore) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={parseFloat(data.therapeuticMetrics.mindfulnessScore) * 100} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Session Frequency</span>
                  <span className="text-sm text-purple-600 font-semibold">
                    {data.therapeuticMetrics.sessionFrequency}/week
                  </span>
                </div>
                <Progress 
                  value={(data.therapeuticMetrics.sessionFrequency / 7) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Daily Engagement
            </CardTitle>
            <CardDescription>Player activity over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.engagement?.daily?.map((value: number, index: number) => {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-8 text-sm text-gray-600">{days[index]}</span>
                    <Progress value={(value / Math.max(...data.engagement.daily)) * 100} className="flex-1" />
                    <span className="w-8 text-sm font-medium">{value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Demographics
            </CardTitle>
            <CardDescription>Player demographics breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Age Groups</h4>
              <div className="space-y-2">
                {Object.entries(data.demographics?.ageGroups || {}).map(([age, percentage]) => (
                  <div key={age} className="flex items-center gap-3">
                    <span className="w-12 text-sm text-gray-600">{age}</span>
                    <Progress value={percentage as number} className="flex-1" />
                    <span className="w-8 text-sm font-medium">{percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Platforms</h4>
              <div className="space-y-2">
                {Object.entries(data.demographics?.platforms || {}).map(([platform, percentage]) => (
                  <div key={platform} className="flex items-center gap-3">
                    <span className="w-16 text-sm text-gray-600 capitalize">{platform}</span>
                    <Progress value={percentage as number} className="flex-1" />
                    <span className="w-8 text-sm font-medium">{percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Performance Summary
          </CardTitle>
          <CardDescription>
            Key insights and recommended actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-600">✅ Strengths</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• High user engagement and retention</li>
                <li>• Excellent therapeutic effectiveness scores</li>
                <li>• Strong mobile platform adoption</li>
                <li>• Positive user rating trends</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-orange-600">⚠️ Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Increase desktop user engagement</li>
                <li>• Optimize session length for older users</li>
                <li>• Enhance social sharing features</li>
                <li>• Improve loading times on slower devices</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Detailed Analytics
            </Button>
            <Button size="sm" variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Set Performance Goals
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}