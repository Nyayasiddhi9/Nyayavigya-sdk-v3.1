import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Brain, Cpu, DollarSign, Star, Zap, Code, Search, MessageCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Provider {
  id: string;
  name: string;
  strengths: string[];
  cost: number;
  quality: number;
  models: string[];
  available: boolean;
}

interface TestResult {
  success: boolean;
  result?: {
    content: string;
    tokens: number;
    provider: string;
    model: string;
    cost: number;
    quality: number;
  };
  error?: string;
}

export default function MultiLLMDemo() {
  const [selectedTask, setSelectedTask] = useState('analysis');
  const [prompt, setPrompt] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Fetch WAI orchestration providers
  const { data: providersData, isLoading } = useQuery({
    queryKey: ['/api/wai-orchestration-consolidated/providers'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Test WAI orchestration providers
  const testMutation = useMutation({
    mutationFn: (data: { prompt: string }) => 
      apiRequest('/api/wai-orchestration-consolidated/test-providers', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: (result) => {
      setTestResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
    }
  });

  const providers = providersData?.providers || [];
  const availableProviders = providers.filter((p: Provider) => p.available);

  const taskTypes = [
    { value: 'analysis', label: 'Analysis & Research', icon: Search },
    { value: 'development', label: 'Code Development', icon: Code },
    { value: 'creative', label: 'Creative Writing', icon: MessageCircle },
    { value: 'optimization', label: 'Optimization', icon: Zap }
  ];

  const samplePrompts = {
    analysis: 'Analyze the current trends in AI and machine learning for 2025',
    development: 'Create a React component for a responsive navigation bar with dark mode support',
    creative: 'Write a brief product description for an AI-powered development platform',
    optimization: 'Suggest performance optimizations for a Node.js Express application'
  };

  const handleTestProvider = () => {
    if (!prompt.trim()) return;
    
    testMutation.mutate({
      prompt: prompt.trim()
    });
  };

  const getStrengthColor = (strength: string) => {
    const colors = {
      'general': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'reasoning': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'code': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'analysis': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'speed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'cost': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'multimodal': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'research': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
    };
    return colors[strength as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  useEffect(() => {
    if (selectedTask && samplePrompts[selectedTask as keyof typeof samplePrompts]) {
      setPrompt(samplePrompts[selectedTask as keyof typeof samplePrompts]);
    }
  }, [selectedTask]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
            <p>Loading multi-LLM provider data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          WAI Orchestration Multi-LLM System
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Experience the power of WAI orchestration with intelligent provider selection across multiple LLM providers. 
          Our system automatically routes requests to optimal providers based on task requirements, cost optimization, and quality metrics.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            WAI Orchestration v3.0
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Intelligent Routing
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Cost Optimized
          </Badge>
        </div>
      </div>

      {/* Provider Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{providers.length}</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{availableProviders.length}</p>
                <p className="text-sm text-green-700 dark:text-green-300">Active Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Star className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {(availableProviders.reduce((sum, p) => sum + p.quality, 0) / availableProviders.length * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">Avg Quality</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  ${(availableProviders.reduce((sum, p) => sum + p.cost, 0) / availableProviders.length).toFixed(3)}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">Avg Cost/1K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cpu className="h-5 w-5" />
            <span>Available LLM Providers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {providers.map((provider: Provider) => (
              <div
                key={provider.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  provider.available
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{provider.name}</h3>
                  <Badge variant={provider.available ? 'default' : 'secondary'}>
                    {provider.available ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Quality</span>
                    <span>{(provider.quality * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={provider.quality * 100} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Cost</span>
                    <span>${provider.cost}/1K tokens</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Strengths:</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.strengths.map((strength) => (
                      <Badge key={strength} variant="outline" className={getStrengthColor(strength)}>
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">
                    Models: {provider.models.join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Test Multi-LLM Provider Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Type</label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((task) => (
                    <SelectItem key={task.value} value={task.value}>
                      <div className="flex items-center space-x-2">
                        <task.icon className="h-4 w-4" />
                        <span>{task.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={4}
              className="resize-none"
            />
          </div>

          <Button 
            onClick={handleTestProvider}
            disabled={!prompt.trim() || testMutation.isPending}
            className="w-full md:w-auto"
          >
            {testMutation.isPending ? (
              <>
                <Cpu className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Test Provider Selection
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                }`}
              >
                {result.success && result.result ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">
                          {result.result.provider}
                        </Badge>
                        <Badge variant="outline">
                          {result.result.model}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {result.result.tokens} tokens • ${result.result.cost.toFixed(4)} cost
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{(result.result.quality * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                      <p className="text-sm whitespace-pre-wrap">{result.result.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600 dark:text-red-400">
                    <p className="font-medium">Error:</p>
                    <p className="text-sm">{result.error}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}