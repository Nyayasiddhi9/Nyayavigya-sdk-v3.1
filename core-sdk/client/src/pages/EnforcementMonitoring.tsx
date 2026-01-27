import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, CheckCircle, Activity, TrendingUp, BarChart3 } from 'lucide-react';

interface EnforcementSummary {
  overview: {
    totalRequests: number;
    aiRequests: number;
    nonAiRequests: number;
    allowedRequests: number;
    blockedRequests: number;
    waiOrchestrationRequests: number;
    complianceRate: string;
    waiUsageRate: string;
  };
  topBlockedProviders: Array<{ provider: string; count: number }>;
  topPaths: Array<{ path: string; allowed: number; blocked: number }>;
  hourlyTrend: Array<{ hour: string; allowed: number; blocked: number }>;
}

interface EnforcementEvent {
  timestamp: string;
  path: string;
  method: string;
  action: 'allowed' | 'blocked';
  reason: string;
  provider?: string;
  ip?: string;
}

export default function EnforcementMonitoring() {
  const { data: summary, isLoading: summaryLoading } = useQuery<{ summary: EnforcementSummary }>({
    queryKey: ['/api/enforcement/summary'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const { data: blockedEvents } = useQuery<{ blockedRequests: EnforcementEvent[] }>({
    queryKey: ['/api/enforcement/blocked'],
    refetchInterval: 5000
  });

  const { data: compliance } = useQuery<{ compliance: any; status: string }>({
    queryKey: ['/api/enforcement/compliance'],
    refetchInterval: 5000
  });

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading enforcement metrics...</p>
        </div>
      </div>
    );
  }

  const overview = summary?.summary.overview;
  const complianceRate = parseFloat(overview?.complianceRate || '0');

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="enforcement-monitoring-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Shield className="h-8 w-8 text-primary" />
            WAI SDK Enforcement Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of AI orchestration enforcement and compliance
          </p>
        </div>
        <Badge 
          variant={complianceRate >= 95 ? 'default' : complianceRate >= 80 ? 'secondary' : 'destructive'}
          className="text-lg px-4 py-2"
          data-testid="badge-compliance-status"
        >
          {compliance?.status === 'healthy' ? (
            <CheckCircle className="h-4 w-4 mr-2" />
          ) : (
            <AlertTriangle className="h-4 w-4 mr-2" />
          )}
          {compliance?.status || 'Unknown'}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card data-testid="card-total-requests">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-requests">
              {overview?.totalRequests.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI: {overview?.aiRequests || 0} | Non-AI: {overview?.nonAiRequests || 0}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-ai-requests">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-ai-requests">
              {overview?.aiRequests.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enforcement target
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-wai-requests">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">WAI Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-wai-requests">
              {overview?.waiOrchestrationRequests.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Using WAI SDK
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-blocked-requests">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-blocked-requests">
              {overview?.blockedRequests.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Direct SDK calls
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-compliance-rate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-compliance-rate">
              {overview?.complianceRate || '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              WAI Usage: {overview?.waiUsageRate || '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Detailed Views */}
      <Tabs defaultValue="blocked" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blocked" data-testid="tab-blocked">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Blocked Requests
          </TabsTrigger>
          <TabsTrigger value="providers" data-testid="tab-providers">
            <BarChart3 className="h-4 w-4 mr-2" />
            Provider Analysis
          </TabsTrigger>
          <TabsTrigger value="paths" data-testid="tab-paths">
            <TrendingUp className="h-4 w-4 mr-2" />
            Path Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Blocked Requests</CardTitle>
              <CardDescription>
                Direct provider calls and bypass attempts blocked by enforcement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blockedEvents?.blockedRequests.slice(0, 10).map((event, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid={`blocked-event-${idx}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" data-testid={`badge-method-${idx}`}>
                          {event.method}
                        </Badge>
                        <code className="text-sm font-mono" data-testid={`text-path-${idx}`}>
                          {event.path}
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-reason-${idx}`}>
                        {event.reason}
                      </p>
                      {event.provider && (
                        <p className="text-xs text-red-600 mt-1" data-testid={`text-provider-${idx}`}>
                          Provider: {event.provider}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p data-testid={`text-timestamp-${idx}`}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                      {event.ip && (
                        <p className="text-xs" data-testid={`text-ip-${idx}`}>
                          {event.ip}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {(!blockedEvents?.blockedRequests || blockedEvents.blockedRequests.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-blocked">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>No blocked requests - All traffic is WAI-compliant!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Blocked Providers</CardTitle>
              <CardDescription>
                Direct provider access attempts blocked by enforcement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary?.summary.topBlockedProviders.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`provider-stat-${idx}`}
                  >
                    <span className="font-medium" data-testid={`text-provider-name-${idx}`}>
                      {item.provider}
                    </span>
                    <Badge variant="outline" data-testid={`badge-provider-count-${idx}`}>
                      {item.count} blocked
                    </Badge>
                  </div>
                ))}
                {(!summary?.summary.topBlockedProviders || summary.summary.topBlockedProviders.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-providers">
                    <p>No provider bypass attempts detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paths" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Request Paths</CardTitle>
              <CardDescription>
                Most active API endpoints and their enforcement status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary?.summary.topPaths.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`path-stat-${idx}`}
                  >
                    <code className="font-mono text-sm" data-testid={`text-path-name-${idx}`}>
                      {item.path}
                    </code>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-50" data-testid={`badge-allowed-${idx}`}>
                        ✓ {item.allowed}
                      </Badge>
                      {item.blocked > 0 && (
                        <Badge variant="outline" className="bg-red-50" data-testid={`badge-blocked-${idx}`}>
                          ✗ {item.blocked}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
