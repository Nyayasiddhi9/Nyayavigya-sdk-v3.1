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
  Sparkles, 
  Brain, 
  Heart, 
  Users, 
  Accessibility,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  ArrowUp,
  Lightbulb
} from 'lucide-react';

interface GameEnhancementProps {
  gameId: number;
  category: string;
}

interface EnhancementResult {
  gameId: number;
  enhancementType: string;
  suggestions: string[];
  improvements: Record<string, string>;
  aiAnalysis: {
    currentScore: number;
    potentialScore: number;
    improvementAreas: string[];
  };
  processedAt: string;
}

export function GameEnhancement({ gameId, category }: GameEnhancementProps) {
  const [enhancementResults, setEnhancementResults] = useState<EnhancementResult | null>(null);
  const [activeEnhancement, setActiveEnhancement] = useState<string | null>(null);
  const { toast } = useToast();

  const enhanceGameMutation = useMutation({
    mutationFn: async (enhancementType: string) => {
      return apiRequest(`/api/game-projects/${gameId}/enhance`, {
        method: 'POST',
        body: JSON.stringify({ enhancementType }),
      });
    },
    onSuccess: (data) => {
      setEnhancementResults(data.data);
      setActiveEnhancement(null);
      toast({
        title: "Enhancement Analysis Complete",
        description: `Potential improvement: ${data.data.aiAnalysis.potentialScore - data.data.aiAnalysis.currentScore} points`,
      });
    },
    onError: () => {
      setActiveEnhancement(null);
      toast({
        title: "Enhancement Failed",
        description: "Failed to analyze game enhancements. Please try again.",
        variant: "destructive",
      });
    },
  });

  const runEnhancement = (enhancementType: string) => {
    setActiveEnhancement(enhancementType);
    enhanceGameMutation.mutate(enhancementType);
  };

  const EnhancementCard = ({ 
    title, 
    description, 
    icon: Icon, 
    enhancementType,
    color = "blue"
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    enhancementType: string;
    color?: string;
  }) => {
    const isActive = activeEnhancement === enhancementType;
    const isCompleted = enhancementResults?.enhancementType === enhancementType;
    
    return (
      <Card className={`transition-all hover:shadow-md ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 text-${color}-600`} />
            <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
            {isCompleted && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Button 
            onClick={() => runEnhancement(enhancementType)}
            disabled={enhanceGameMutation.isPending || isActive}
            className="w-full"
            variant={isCompleted ? "outline" : "default"}
          >
            {isActive ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : isCompleted ? (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Re-analyze
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance {title}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhancement Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnhancementCard
          title="Therapeutic"
          description="Mental health effectiveness and wellbeing impact"
          icon={Brain}
          enhancementType="therapeutic"
          color="green"
        />
        
        <EnhancementCard
          title="Engagement"
          description="User retention, social features, and gamification"
          icon={Heart}
          enhancementType="engagement"
          color="red"
        />
        
        <EnhancementCard
          title="Accessibility"
          description="Inclusive design and universal access"
          icon={Accessibility}
          enhancementType="accessibility"
          color="purple"
        />
      </div>

      {/* Enhancement Results */}
      {enhancementResults && (
        <div className="space-y-6">
          {/* AI Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Enhancement Analysis
              </CardTitle>
              <CardDescription>
                Analysis completed on {new Date(enhancementResults.processedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">
                    {enhancementResults.aiAnalysis.currentScore}
                  </div>
                  <div className="text-sm text-gray-500">Current Score</div>
                  <Progress value={enhancementResults.aiAnalysis.currentScore} className="mt-2" />
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <ArrowUp className="h-6 w-6 text-green-600" />
                    <span className="text-3xl font-bold text-green-600">
                      +{enhancementResults.aiAnalysis.potentialScore - enhancementResults.aiAnalysis.currentScore}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">Potential Improvement</div>
                  <div className="mt-2 text-xs text-green-600">
                    {((enhancementResults.aiAnalysis.potentialScore - enhancementResults.aiAnalysis.currentScore) / enhancementResults.aiAnalysis.currentScore * 100).toFixed(1)}% increase
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {enhancementResults.aiAnalysis.potentialScore}
                  </div>
                  <div className="text-sm text-gray-500">Potential Score</div>
                  <Progress value={enhancementResults.aiAnalysis.potentialScore} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="suggestions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="improvements">Impact</TabsTrigger>
              <TabsTrigger value="areas">Focus Areas</TabsTrigger>
            </TabsList>

            {/* Suggestions */}
            <TabsContent value="suggestions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    AI-Powered Suggestions
                  </CardTitle>
                  <CardDescription>
                    Recommended enhancements for {enhancementResults.enhancementType} optimization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {enhancementResults.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{suggestion}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {enhancementResults.enhancementType}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Priority: {index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Improvements */}
            <TabsContent value="improvements">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Expected Improvements
                  </CardTitle>
                  <CardDescription>
                    Quantified impact metrics from implementing suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(enhancementResults.improvements).map(([metric, value]) => (
                      <div key={metric} className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {value}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </div>
                        <div className="mt-2">
                          <TrendingUp className="h-4 w-4 text-green-600 mx-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Focus Areas */}
            <TabsContent value="areas">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Improvement Focus Areas
                  </CardTitle>
                  <CardDescription>
                    Key areas identified for enhancement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enhancementResults.aiAnalysis.improvementAreas.map((area, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <span className="text-sm text-gray-700">{area}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Implementation Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Next Steps
              </CardTitle>
              <CardDescription>
                Recommended actions to implement improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apply Auto-Enhancements
                </Button>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Schedule Team Review
                </Button>
                <Button variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Create Enhancement Plan
                </Button>
                <Button variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Track Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhancement Tips */}
      {!enhancementResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Enhancement Tips
            </CardTitle>
            <CardDescription>
              Best practices for game improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">🧠 Therapeutic Games</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Focus on stress reduction mechanics</li>
                  <li>• Include mindfulness elements</li>
                  <li>• Track therapeutic progress</li>
                  <li>• Balance challenge and relaxation</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-red-600">❤️ Engagement</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Add social features</li>
                  <li>• Implement achievement systems</li>
                  <li>• Create personalization options</li>
                  <li>• Design meaningful rewards</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-purple-600">♿ Accessibility</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ensure color contrast compliance</li>
                  <li>• Add keyboard navigation</li>
                  <li>• Include audio descriptions</li>
                  <li>• Provide text scaling options</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}