import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Shield, Zap, Globe } from 'lucide-react';

interface AuditResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface ProviderAuditResult {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  apiKeyConfigured: boolean;
  lastTested: string;
  responseTime?: number;
  errorMessage?: string;
}

interface PlatformAuditReport {
  overallStatus: 'production-ready' | 'issues-found' | 'critical-failures';
  score: number;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  results: AuditResult[];
  providerStatus: ProviderAuditResult[];
  recommendations: string[];
}

export default function PlatformAudit() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: auditData, isLoading, refetch } = useQuery({
    queryKey: ['/api/wai-orchestration-consolidated/audit', refreshKey],
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'online':
      case 'production-ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
      case 'error':
      case 'critical-failures':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
      case 'offline':
      case 'issues-found':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
      case 'online':
      case 'production-ready':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'fail':
      case 'error':
      case 'critical-failures':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
      case 'offline':
      case 'issues-found':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Running comprehensive platform audit...</p>
        </div>
      </div>
    );
  }

  const audit: PlatformAuditReport = auditData?.audit;

  if (!audit) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Failed to load audit data</p>
            <Button onClick={handleRefresh} className="mt-4 w-full">
              Retry Audit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive audit of WAI orchestration, 13 LLM providers, and business rules
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Audit
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(audit.overallStatus)}
            Overall Platform Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge variant="outline" className={getStatusColor(audit.overallStatus)}>
                {audit.overallStatus.replace('-', ' ').toUpperCase()}
              </Badge>
              <p className="text-2xl font-bold mt-2">{audit.score}%</p>
              <p className="text-sm text-muted-foreground">
                {audit.passed}/{audit.totalTests} tests passed
              </p>
            </div>
            <div className="text-right">
              <Progress value={audit.score} className="w-32 mb-2" />
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Passed:</span>
                  <span className="text-green-600">{audit.passed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Warnings:</span>
                  <span className="text-yellow-600">{audit.warnings}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="text-red-600">{audit.failed}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers">
            <Globe className="h-4 w-4 mr-2" />
            LLM Providers
          </TabsTrigger>
          <TabsTrigger value="business-rules">
            <Shield className="h-4 w-4 mr-2" />
            Business Rules
          </TabsTrigger>
          <TabsTrigger value="results">
            <Zap className="h-4 w-4 mr-2" />
            All Results
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <CheckCircle className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>13 LLM Provider Status</CardTitle>
              <CardDescription>
                Real-time status of all configured LLM providers with API connectivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {audit.providerStatus?.map((provider) => (
                  <Card key={provider.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{provider.name}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(provider.status)}
                          <Badge variant="outline" className={getStatusColor(provider.status)}>
                            {provider.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>API Key:</span>
                          <span className={provider.apiKeyConfigured ? 'text-green-600' : 'text-red-600'}>
                            {provider.apiKeyConfigured ? 'Configured' : 'Missing'}
                          </span>
                        </div>
                        
                        {provider.responseTime && (
                          <div className="flex justify-between">
                            <span>Response Time:</span>
                            <span>{provider.responseTime}ms</span>
                          </div>
                        )}
                        
                        {provider.errorMessage && (
                          <div className="text-red-600 text-xs mt-2">
                            {provider.errorMessage}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business-rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Rules Validation</CardTitle>
              <CardDescription>
                KIMI K2 defaults for software/3D/gaming tasks and intelligent routing rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {audit.results?.filter(r => r.category === 'Business Rules' || r.category === 'KIMI K2 Rules').map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <p className="font-medium">{result.message}</p>
                        <p className="text-sm text-muted-foreground">{result.category}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Audit Results</CardTitle>
              <CardDescription>
                Detailed results from all platform audits and tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {audit.results?.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <p className="font-medium">{result.message}</p>
                        <p className="text-sm text-muted-foreground">{result.category}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Recommendations</CardTitle>
              <CardDescription>
                Action items to improve platform performance and compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {audit.recommendations?.length > 0 ? (
                <div className="space-y-3">
                  {audit.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <p className="text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-green-700">Platform Optimized</p>
                  <p className="text-green-600">All systems are functioning optimally with no recommendations needed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}