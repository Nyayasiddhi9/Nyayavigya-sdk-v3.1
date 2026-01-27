import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  TestTube, 
  Zap, 
  Shield, 
  Accessibility, 
  Brain,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  Gauge
} from 'lucide-react';

interface GameTestingProps {
  gameId: number;
  category: string;
}

interface TestResult {
  gameId: number;
  testType: string;
  results: {
    performance: {
      fps: number;
      loadTime: number;
      memoryUsage: number;
      score: number;
    };
    accessibility: {
      colorContrast: boolean;
      keyboardNavigation: boolean;
      screenReader: boolean;
      fontSize: boolean;
      score: number;
    };
    security: {
      dataEncryption: boolean;
      inputValidation: boolean;
      xssProtection: boolean;
      csrfProtection: boolean;
      score: number;
    };
    therapeutic?: {
      stressReduction: number;
      engagementLevel: number;
      difficultyBalance: number;
      progressTracking: boolean;
      score: number;
    };
  };
  recommendations: string[];
  testedAt: string;
  overallScore: number;
}

export function GameTesting({ gameId, category }: GameTestingProps) {
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const { toast } = useToast();

  const testGameMutation = useMutation({
    mutationFn: async (testType: string) => {
      return apiRequest(`/api/game-projects/${gameId}/test`, {
        method: 'POST',
        body: JSON.stringify({ testType }),
      });
    },
    onSuccess: (data) => {
      setTestResults(data.data);
      setActiveTest(null);
      toast({
        title: "Testing Complete",
        description: `Overall score: ${data.data.overallScore}/100`,
      });
    },
    onError: () => {
      setActiveTest(null);
      toast({
        title: "Testing Failed",
        description: "Failed to run game tests. Please try again.",
        variant: "destructive",
      });
    },
  });

  const runTest = (testType: string) => {
    setActiveTest(testType);
    testGameMutation.mutate(testType);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const TestCard = ({ 
    title, 
    description, 
    icon: Icon, 
    testType, 
    score 
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    testType: string; 
    score?: number;
  }) => (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          {score && (
            <Badge variant={getScoreBadgeVariant(score)}>
              {score}/100
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={() => runTest(testType)}
          disabled={testGameMutation.isPending || activeTest === testType}
          className="w-full"
        >
          {activeTest === testType ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Run {title} Test
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TestCard
          title="Performance"
          description="FPS, load times, memory usage"
          icon={Gauge}
          testType="performance"
          score={testResults?.results.performance.score}
        />
        
        <TestCard
          title="Accessibility"
          description="WCAG compliance, inclusive design"
          icon={Accessibility}
          testType="accessibility"
          score={testResults?.results.accessibility.score}
        />
        
        <TestCard
          title="Security"
          description="Data protection, vulnerability scan"
          icon={Shield}
          testType="security"
          score={testResults?.results.security.score}
        />
        
        {category === 'mental-health' && (
          <TestCard
            title="Therapeutic"
            description="Mental health effectiveness"
            icon={Brain}
            testType="mental-health"
            score={testResults?.results.therapeutic?.score}
          />
        )}
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Test Results Summary
              </CardTitle>
              <CardDescription>
                Comprehensive quality assessment completed on {new Date(testResults.testedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(testResults.overallScore)}`}>
                    {testResults.overallScore}
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <Progress value={testResults.overallScore} className="flex-1 h-3" />
                <div className="text-right">
                  <Badge variant={getScoreBadgeVariant(testResults.overallScore)}>
                    {testResults.overallScore >= 90 ? 'Excellent' : 
                     testResults.overallScore >= 70 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              {testResults.results.therapeutic && (
                <TabsTrigger value="therapeutic">Therapeutic</TabsTrigger>
              )}
            </TabsList>

            {/* Performance Results */}
            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-blue-600" />
                    Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {testResults.results.performance.fps} FPS
                      </div>
                      <div className="text-sm text-gray-600">Frame Rate</div>
                      <Progress 
                        value={(testResults.results.performance.fps / 60) * 100} 
                        className="mt-2" 
                      />
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {testResults.results.performance.loadTime}s
                      </div>
                      <div className="text-sm text-gray-600">Load Time</div>
                      <Progress 
                        value={100 - (testResults.results.performance.loadTime / 5) * 100} 
                        className="mt-2" 
                      />
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {testResults.results.performance.memoryUsage} MB
                      </div>
                      <div className="text-sm text-gray-600">Memory Usage</div>
                      <Progress 
                        value={100 - (testResults.results.performance.memoryUsage / 100) * 100} 
                        className="mt-2" 
                      />
                    </div>

                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(testResults.results.performance.score)}`}>
                        {testResults.results.performance.score}/100
                      </div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                      <Progress 
                        value={testResults.results.performance.score} 
                        className="mt-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Accessibility Results */}
            <TabsContent value="accessibility">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility className="h-5 w-5 text-green-600" />
                    Accessibility Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">WCAG 2.1 Compliance</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Color Contrast</span>
                          {testResults.results.accessibility.colorContrast ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Keyboard Navigation</span>
                          {testResults.results.accessibility.keyboardNavigation ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Screen Reader</span>
                          {testResults.results.accessibility.screenReader ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Font Size</span>
                          {testResults.results.accessibility.fontSize ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(testResults.results.accessibility.score)}`}>
                        {testResults.results.accessibility.score}/100
                      </div>
                      <div className="text-sm text-gray-600 mb-3">Accessibility Score</div>
                      <Progress value={testResults.results.accessibility.score} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Results */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Security Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Security Checks</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Data Encryption</span>
                          {testResults.results.security.dataEncryption ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Input Validation</span>
                          {testResults.results.security.inputValidation ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">XSS Protection</span>
                          {testResults.results.security.xssProtection ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">CSRF Protection</span>
                          {testResults.results.security.csrfProtection ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(testResults.results.security.score)}`}>
                        {testResults.results.security.score}/100
                      </div>
                      <div className="text-sm text-gray-600 mb-3">Security Score</div>
                      <Progress value={testResults.results.security.score} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Therapeutic Results */}
            {testResults.results.therapeutic && (
              <TabsContent value="therapeutic">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-green-600" />
                      Therapeutic Effectiveness
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(testResults.results.therapeutic.stressReduction * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Stress Reduction</div>
                        <Progress 
                          value={testResults.results.therapeutic.stressReduction * 100} 
                          className="mt-2" 
                        />
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(testResults.results.therapeutic.engagementLevel * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Engagement</div>
                        <Progress 
                          value={testResults.results.therapeutic.engagementLevel * 100} 
                          className="mt-2" 
                        />
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(testResults.results.therapeutic.difficultyBalance * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Difficulty Balance</div>
                        <Progress 
                          value={testResults.results.therapeutic.difficultyBalance * 100} 
                          className="mt-2" 
                        />
                      </div>

                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(testResults.results.therapeutic.score)}`}>
                          {testResults.results.therapeutic.score}/100
                        </div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                        <Progress 
                          value={testResults.results.therapeutic.score} 
                          className="mt-2" 
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress Tracking</span>
                        {testResults.results.therapeutic.progressTracking ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Recommendations */}
          {testResults.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Suggested improvements to enhance game quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {testResults.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}