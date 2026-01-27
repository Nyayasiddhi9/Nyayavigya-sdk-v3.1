import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
  Brain, 
  Target, 
  AlertTriangle, 
  Zap,
  BarChart3,
  LineChart,
  PieChart,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Settings,
  Download
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PredictiveModel {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  lastTrained: string;
}

interface UserBehaviorPrediction {
  userId: string;
  predictions: {
    churnProbability: number;
    nextPurchaseDate: string;
    lifetimeValue: number;
    engagementScore: number;
    preferredFeatures: string[];
    riskFactors: string[];
  };
  confidence: number;
  modelVersion: string;
  generatedAt: string;
}

interface BusinessTrendAnalysis {
  id: string;
  category: string;
  trend: {
    direction: string;
    strength: number;
    seasonality: any[];
    anomalies: any[];
  };
  forecasts: any[];
  insights: any[];
  recommendations: any[];
}

interface PerformanceForecast {
  component: string;
  predictions: {
    capacity: any;
    performance: any;
    costs: any;
    reliability: any;
  };
  recommendations: any[];
}

export default function PredictiveAnalyticsDemo() {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [userFeatures, setUserFeatures] = useState({
    daysSinceLastLogin: 3,
    featureUsageDecline: 20,
    engagementScore: 0.75,
    sessionDuration: 1800,
    supportTickets: 1,
    monthlySpend: 150
  });
  const [businessMetrics, setBusinessMetrics] = useState([
    {
      id: 'revenue-001',
      name: 'Monthly Revenue',
      type: 'revenue',
      value: 50000,
      unit: 'USD',
      timestamp: new Date().toISOString(),
      trend: 'increasing',
      confidence: 0.89,
      metadata: {}
    }
  ]);
  const [performanceComponents, setPerformanceComponents] = useState(['api-server', 'database', 'cache-layer']);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Fetch predictive models
  const { data: models = [], isLoading: modelsLoading } = useQuery<PredictiveModel[]>({
    queryKey: ['/api/analytics/models'],
    enabled: true
  });

  // Fetch analytics stats
  const { data: stats = { predictions: 0, trendAnalyses: 0, alerts: 0 } } = useQuery<{
    predictions: number;
    trendAnalyses: number;
    alerts: number;
  }>({
    queryKey: ['/api/analytics/stats'],
    enabled: true
  });

  // User behavior prediction mutation
  const userBehaviorMutation = useMutation({
    mutationFn: (data: { userId: string; features: any }) =>
      apiRequest('/api/analytics/predictions/user-behavior', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/predictions'] });
    }
  });

  // Business trend analysis mutation
  const trendAnalysisMutation = useMutation({
    mutationFn: (metrics: any[]) =>
      apiRequest('/api/analytics/trends/analyze', {
        method: 'POST',
        body: JSON.stringify({ metrics })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/trends'] });
    }
  });

  // Performance forecasting mutation
  const performanceForecastMutation = useMutation({
    mutationFn: (components: string[]) =>
      apiRequest('/api/analytics/forecasts/performance', {
        method: 'POST',
        body: JSON.stringify({ components })
      })
  });

  // Alert generation mutation
  const alertGenerationMutation = useMutation({
    mutationFn: (metrics: any[]) =>
      apiRequest('/api/analytics/alerts/generate', {
        method: 'POST',
        body: JSON.stringify({ metrics })
      })
  });

  const handleUserBehaviorPrediction = async () => {
    setError('');
    try {
      await userBehaviorMutation.mutateAsync({
        userId: 'demo-user-123',
        features: userFeatures
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    }
  };

  const handleTrendAnalysis = async () => {
    setError('');
    try {
      await trendAnalysisMutation.mutateAsync(businessMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trend analysis failed');
    }
  };

  const handlePerformanceForecast = async () => {
    setError('');
    try {
      await performanceForecastMutation.mutateAsync(performanceComponents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Performance forecasting failed');
    }
  };

  const handleAlertGeneration = async () => {
    setError('');
    try {
      await alertGenerationMutation.mutateAsync(businessMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Alert generation failed');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictive Analytics & AI Insights</h1>
          <p className="text-muted-foreground">
            Enterprise-grade business intelligence with machine learning predictions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            ✅ Phase 4 Epic E3
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Report
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Active Models</p>
                <p className="text-2xl font-bold">{models.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Predictions</p>
                <p className="text-2xl font-bold">{stats.predictions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Trend Analyses</p>
                <p className="text-2xl font-bold">{stats.trendAnalyses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Active Alerts</p>
                <p className="text-2xl font-bold">{stats.alerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="user-behavior" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="user-behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="business-trends">Business Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Predictive Alerts</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        {/* User Behavior Prediction Tab */}
        <TabsContent value="user-behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Behavior Prediction
                </CardTitle>
                <CardDescription>
                  Predict user churn, lifetime value, and engagement patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Days Since Last Login</Label>
                    <Input
                      type="number"
                      value={userFeatures.daysSinceLastLogin}
                      onChange={(e) => setUserFeatures(prev => ({
                        ...prev,
                        daysSinceLastLogin: Number(e.target.value)
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Feature Usage Decline (%)</Label>
                    <Input
                      type="number"
                      value={userFeatures.featureUsageDecline}
                      onChange={(e) => setUserFeatures(prev => ({
                        ...prev,
                        featureUsageDecline: Number(e.target.value)
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Engagement Score</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={userFeatures.engagementScore}
                      onChange={(e) => setUserFeatures(prev => ({
                        ...prev,
                        engagementScore: Number(e.target.value)
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Spend ($)</Label>
                    <Input
                      type="number"
                      value={userFeatures.monthlySpend}
                      onChange={(e) => setUserFeatures(prev => ({
                        ...prev,
                        monthlySpend: Number(e.target.value)
                      }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleUserBehaviorPrediction}
                  disabled={userBehaviorMutation.isPending}
                  className="w-full"
                >
                  {userBehaviorMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Prediction...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate User Behavior Prediction
                    </>
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction Results</CardTitle>
              </CardHeader>
              <CardContent>
                {userBehaviorMutation.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Churn Probability</Label>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={userBehaviorMutation.data?.predictions?.churnProbability ? userBehaviorMutation.data.predictions.churnProbability * 100 : 0} 
                            className="flex-1"
                          />
                          <span className="text-sm font-medium">
                            {userBehaviorMutation.data?.predictions?.churnProbability ? (userBehaviorMutation.data.predictions.churnProbability * 100).toFixed(1) : '0.0'}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Engagement Score</Label>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={userBehaviorMutation.data?.predictions?.engagementScore ? userBehaviorMutation.data.predictions.engagementScore * 100 : 0} 
                            className="flex-1"
                          />
                          <span className="text-sm font-medium">
                            {userBehaviorMutation.data?.predictions?.engagementScore ? (userBehaviorMutation.data.predictions.engagementScore * 100).toFixed(1) : '0.0'}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Lifetime Value</Label>
                        <p className="text-2xl font-bold text-green-600">
                          ${userBehaviorMutation.data?.predictions?.lifetimeValue ? userBehaviorMutation.data.predictions.lifetimeValue.toLocaleString() : '0'}
                        </p>
                      </div>
                      
                      <div>
                        <Label>Risk Factors</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {userBehaviorMutation.data?.predictions?.riskFactors?.map((factor: string, index: number) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {factor}
                            </Badge>
                          )) || <span className="text-sm text-muted-foreground">No risk factors identified</span>}
                        </div>
                      </div>

                      <div>
                        <Label>Preferred Features</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {userBehaviorMutation.data?.predictions?.preferredFeatures?.map((feature: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          )) || <span className="text-sm text-muted-foreground">No preferred features identified</span>}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Confidence: {userBehaviorMutation.data?.confidence ? (userBehaviorMutation.data.confidence * 100).toFixed(1) : '0.0'}%</span>
                        <span>Model: {userBehaviorMutation.data?.modelVersion || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4" />
                    <p>Generate a user behavior prediction to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Trends Tab */}
        <TabsContent value="business-trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Business Trend Analysis
                </CardTitle>
                <CardDescription>
                  Analyze business metrics for trends, patterns, and forecasting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Metric Name</Label>
                    <Input
                      value={businessMetrics[0]?.name || ''}
                      onChange={(e) => setBusinessMetrics(prev => [{
                        ...prev[0],
                        name: e.target.value
                      }])}
                      placeholder="e.g., Monthly Revenue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        type="number"
                        value={businessMetrics[0]?.value || ''}
                        onChange={(e) => setBusinessMetrics(prev => [{
                          ...prev[0],
                          value: Number(e.target.value)
                        }])}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confidence</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={businessMetrics[0]?.confidence || ''}
                        onChange={(e) => setBusinessMetrics(prev => [{
                          ...prev[0],
                          confidence: Number(e.target.value)
                        }])}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleTrendAnalysis}
                  disabled={trendAnalysisMutation.isPending}
                  className="w-full"
                >
                  {trendAnalysisMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Trends...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analyze Business Trends
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {trendAnalysisMutation.data ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {trendAnalysisMutation.data?.map((analysis: BusinessTrendAnalysis, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium capitalize">{analysis.category}</h4>
                            <Badge 
                              variant={analysis.trend.direction === 'increasing' ? 'default' : 
                                     analysis.trend.direction === 'decreasing' ? 'destructive' : 'secondary'}
                            >
                              {analysis.trend.direction}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Trend Strength:</span>
                              <Progress value={analysis.trend.strength * 100} className="mt-1" />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Forecasts:</span>
                              <p className="font-medium">{analysis.forecasts.length} generated</p>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-muted-foreground">Insights:</span>
                            <p className="text-sm">{analysis.insights.length} business insights identified</p>
                          </div>

                          <div>
                            <span className="text-sm text-muted-foreground">Recommendations:</span>
                            <p className="text-sm">{analysis.recommendations.length} actionable recommendations</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <LineChart className="h-16 w-16 mx-auto mb-4" />
                    <p>Run trend analysis to see business insights</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Forecasting Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Forecasting
              </CardTitle>
              <CardDescription>
                Predict system performance and resource requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Components to Analyze</Label>
                <Textarea
                  value={performanceComponents.join('\n')}
                  onChange={(e) => setPerformanceComponents(e.target.value.split('\n').filter(Boolean))}
                  placeholder="Enter components (one per line)"
                  rows={4}
                />
              </div>

              <Button 
                onClick={handlePerformanceForecast}
                disabled={performanceForecastMutation.isPending}
                className="w-full"
              >
                {performanceForecastMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Forecast...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Generate Performance Forecast
                  </>
                )}
              </Button>

              {performanceForecastMutation.data && (
                <div className="space-y-4 mt-6">
                  <h4 className="font-medium">Performance Forecasts</h4>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {performanceForecastMutation.data?.map((forecast: PerformanceForecast, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <h5 className="font-medium">{forecast.component}</h5>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>Capacity Analysis: Available</div>
                            <div>Performance Metrics: Tracked</div>
                            <div>Cost Predictions: Generated</div>
                            <div>Reliability Score: Calculated</div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {forecast.recommendations.length} optimization recommendations
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Predictive Alerts
              </CardTitle>
              <CardDescription>
                Generate early warning alerts for potential issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleAlertGeneration}
                disabled={alertGenerationMutation.isPending}
                className="w-full"
              >
                {alertGenerationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Alerts...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Predictive Alerts
                  </>
                )}
              </Button>

              {alertGenerationMutation.data && (
                <div className="space-y-4 mt-6">
                  <h4 className="font-medium">Generated Alerts</h4>
                  {alertGenerationMutation.data && alertGenerationMutation.data.length > 0 ? (
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {alertGenerationMutation.data.map((alert: any, index: number) => (
                          <Alert key={index}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{alert.title}</p>
                                  <p className="text-sm">{alert.description}</p>
                                </div>
                                <Badge variant={
                                  alert.severity === 'critical' ? 'destructive' :
                                  alert.severity === 'warning' ? 'default' : 'secondary'
                                }>
                                  {alert.severity}
                                </Badge>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>No alerts generated - systems are operating normally</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Predictive Models
              </CardTitle>
              <CardDescription>
                View and manage machine learning models
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modelsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading models...</span>
                </div>
              ) : models.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {models.map((model: PredictiveModel) => (
                      <div key={model.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{model.name}</h4>
                          <Badge variant="outline">{model.type}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Accuracy:</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <Progress value={model.accuracy * 100} className="flex-1" />
                              <span className="text-sm font-medium">
                                {(model.accuracy * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Last Trained:</span>
                            <p className="text-sm font-medium">
                              {new Date(model.lastTrained).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-16 w-16 mx-auto mb-4" />
                  <p>No predictive models available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}