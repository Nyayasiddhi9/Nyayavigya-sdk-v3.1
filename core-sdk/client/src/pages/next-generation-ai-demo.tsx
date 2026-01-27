import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Brain, 
  Code, 
  MessageSquare, 
  FileText, 
  Users,
  Sparkles,
  Cpu,
  Network,
  BookOpen,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Settings,
  Download,
  Upload,
  Eye,
  GitBranch,
  Shield,
  Gauge,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface GeneratedCode {
  id: string;
  code: string;
  language: string;
  framework: string;
  metadata: {
    complexity: number;
    maintainability: number;
    performance: number;
    security: number;
    estimatedLines: number;
    generationTime: number;
  };
  quality: {
    score: number;
    issues: any[];
    suggestions: any[];
  };
  execution: {
    executable: boolean;
    errors: any[];
  };
}

interface ConversationalAI {
  id: string;
  type: string;
  personality: {
    tone: string;
    style: string;
    expertise: string[];
  };
  capabilities: any[];
}

interface CodeReview {
  id: string;
  findings: any[];
  suggestions: any[];
  metrics: {
    linesReviewed: number;
    issuesFound: number;
    testCoverage: number;
    maintainabilityRating: string;
  };
}

export default function NextGenerationAIDemo() {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [codeContext, setCodeContext] = useState({
    projectType: 'web-api',
    framework: 'express',
    language: 'typescript',
    dependencies: ['express', 'typescript'],
    architecture: 'mvc'
  });
  const [codeForReview, setCodeForReview] = useState('');
  const [conversationInput, setConversationInput] = useState('');
  const [selectedAI, setSelectedAI] = useState('');
  const [multiAgentTask, setMultiAgentTask] = useState('');
  const [multiAgentRequirements, setMultiAgentRequirements] = useState({});
  const [documentationSource, setDocumentationSource] = useState('');
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Fetch AI capabilities
  const { data: capabilities } = useQuery({
    queryKey: ['/api/ai/capabilities'],
    enabled: true
  });

  // Fetch AI stats
  const { data: stats } = useQuery({
    queryKey: ['/api/ai/stats'],
    enabled: true
  });

  // Fetch active conversations
  const { data: conversations } = useQuery({
    queryKey: ['/api/ai/conversations'],
    enabled: true
  });

  // Code generation mutation
  const codeGenerationMutation = useMutation({
    mutationFn: (request: any) =>
      apiRequest('/api/ai/code/generate', {
        method: 'POST',
        body: JSON.stringify(request)
      })
  });

  // Code review mutation
  const codeReviewMutation = useMutation({
    mutationFn: (code: string) =>
      apiRequest('/api/ai/code/review', {
        method: 'POST',
        body: JSON.stringify({ code })
      })
  });

  // Automated QA mutation
  const automatedQAMutation = useMutation({
    mutationFn: (data: { code: string; config?: any }) =>
      apiRequest('/api/ai/qa/automated', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  });

  // Multi-agent orchestration mutation
  const multiAgentMutation = useMutation({
    mutationFn: (data: { task: string; requirements: any }) =>
      apiRequest('/api/ai/multi-agent/orchestrate', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  });

  // Conversational AI creation mutation
  const createAIMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/ai/conversation/create', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversations'] });
    }
  });

  // Conversation turn mutation
  const conversationMutation = useMutation({
    mutationFn: (data: { aiId: string; userInput: string; context?: any }) =>
      apiRequest(`/api/ai/conversation/${data.aiId}/turn`, {
        method: 'POST',
        body: JSON.stringify({ userInput: data.userInput, context: data.context })
      })
  });

  // Documentation generation mutation
  const documentationMutation = useMutation({
    mutationFn: (data: { target: string; source: any; format: string }) =>
      apiRequest('/api/ai/documentation/generate', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  });

  const handleCodeGeneration = async () => {
    setError('');
    if (!naturalLanguageInput.trim()) {
      setError('Please provide a natural language description');
      return;
    }

    try {
      await codeGenerationMutation.mutateAsync({
        naturalLanguage: naturalLanguageInput,
        context: codeContext,
        preferences: {
          style: 'enterprise',
          patterns: ['mvc', 'clean-architecture'],
          testGeneration: true,
          documentation: true,
          errorHandling: 'comprehensive',
          security: true
        },
        constraints: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code generation failed');
    }
  };

  const handleCodeReview = async () => {
    setError('');
    if (!codeForReview.trim()) {
      setError('Please provide code to review');
      return;
    }

    try {
      await codeReviewMutation.mutateAsync(codeForReview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code review failed');
    }
  };

  const handleMultiAgentTask = async () => {
    setError('');
    if (!multiAgentTask.trim()) {
      setError('Please provide a task description');
      return;
    }

    try {
      await multiAgentMutation.mutateAsync({
        task: multiAgentTask,
        requirements: multiAgentRequirements
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Multi-agent orchestration failed');
    }
  };

  const handleCreateAI = async () => {
    setError('');
    try {
      await createAIMutation.mutateAsync({
        type: 'assistant',
        personality: {
          tone: 'professional',
          style: 'conversational',
          expertise: ['software-development', 'ai-assistance'],
          preferences: {}
        },
        capabilities: [
          { name: 'code-assistance', description: 'Code-related help', enabled: true, confidence: 0.9, parameters: {} },
          { name: 'general-conversation', description: 'General conversation', enabled: true, confidence: 0.85, parameters: {} }
        ]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI creation failed');
    }
  };

  const handleConversation = async () => {
    setError('');
    if (!selectedAI || !conversationInput.trim()) {
      setError('Please select an AI and provide input');
      return;
    }

    try {
      await conversationMutation.mutateAsync({
        aiId: selectedAI,
        userInput: conversationInput,
        context: { domain: 'software-development' }
      });
      setConversationInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversation failed');
    }
  };

  const handleDocumentationGeneration = async () => {
    setError('');
    if (!documentationSource.trim()) {
      setError('Please provide source material for documentation');
      return;
    }

    try {
      await documentationMutation.mutateAsync({
        target: 'api',
        source: documentationSource,
        format: 'markdown'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Documentation generation failed');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Next-Generation AI Features</h1>
          <p className="text-muted-foreground">
            Cutting-edge AI capabilities with multi-agent orchestration and advanced automation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            ✅ Phase 4 Epic E4
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Results
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Multi-Agent Systems</p>
                <p className="text-2xl font-bold">{stats?.data?.multiAgentSystems || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active Conversations</p>
                <p className="text-2xl font-bold">{stats?.data?.activeConversations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Code Generation Queue</p>
                <p className="text-2xl font-bold">{stats?.data?.codeGenerationQueue || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Documentation</p>
                <p className="text-2xl font-bold">{stats?.data?.documentation || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="code-generation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="code-generation">Code Generation</TabsTrigger>
          <TabsTrigger value="multi-agent">Multi-Agent</TabsTrigger>
          <TabsTrigger value="conversation">Conversational AI</TabsTrigger>
          <TabsTrigger value="code-review">Code Review</TabsTrigger>
          <TabsTrigger value="qa">Automated QA</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        {/* Code Generation Tab */}
        <TabsContent value="code-generation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Natural Language to Code
                </CardTitle>
                <CardDescription>
                  Generate production-ready code from natural language descriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Natural Language Description</Label>
                  <Textarea
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    placeholder="Describe what you want to build... e.g., 'Create a REST API endpoint for user authentication with JWT tokens'"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={codeContext.language} onValueChange={(value) => 
                      setCodeContext(prev => ({ ...prev, language: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Framework</Label>
                    <Select value={codeContext.framework} onValueChange={(value) => 
                      setCodeContext(prev => ({ ...prev, framework: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="express">Express.js</SelectItem>
                        <SelectItem value="react">React</SelectItem>
                        <SelectItem value="nextjs">Next.js</SelectItem>
                        <SelectItem value="fastapi">FastAPI</SelectItem>
                        <SelectItem value="spring">Spring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleCodeGeneration}
                  disabled={codeGenerationMutation.isPending}
                  className="w-full"
                >
                  {codeGenerationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Code...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Code
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
                <CardTitle>Generated Code</CardTitle>
              </CardHeader>
              <CardContent>
                {codeGenerationMutation.data ? (
                  <div className="space-y-4">
                    <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                      <pre>{codeGenerationMutation.data.data.code}</pre>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quality Score</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={codeGenerationMutation.data.data.quality.score * 100} className="flex-1" />
                          <span className="text-sm font-medium">
                            {(codeGenerationMutation.data.data.quality.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Complexity</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={codeGenerationMutation.data.data.metadata.complexity * 100} className="flex-1" />
                          <span className="text-sm font-medium">
                            {(codeGenerationMutation.data.data.metadata.complexity * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{codeGenerationMutation.data.data.metadata.estimatedLines}</p>
                        <p className="text-muted-foreground">Lines of Code</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{codeGenerationMutation.data.data.metadata.generationTime}ms</p>
                        <p className="text-muted-foreground">Generation Time</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">
                          {codeGenerationMutation.data.data.execution.executable ? 'Yes' : 'No'}
                        </p>
                        <p className="text-muted-foreground">Executable</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Run Code
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <GitBranch className="h-4 w-4 mr-1" />
                        Create PR
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Code className="h-16 w-16 mx-auto mb-4" />
                    <p>Generate code from natural language to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Multi-Agent Orchestration Tab */}
        <TabsContent value="multi-agent" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Multi-Agent Orchestration
                </CardTitle>
                <CardDescription>
                  Coordinate specialized AI agents for complex tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Task Description</Label>
                  <Textarea
                    value={multiAgentTask}
                    onChange={(e) => setMultiAgentTask(e.target.value)}
                    placeholder="Describe a complex task... e.g., 'Design a scalable microservices architecture for an e-commerce platform'"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Requirements (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(multiAgentRequirements, null, 2)}
                    onChange={(e) => {
                      try {
                        setMultiAgentRequirements(JSON.parse(e.target.value));
                      } catch {}
                    }}
                    placeholder='{"scalability": "high", "budget": "medium", "timeline": "6 months"}'
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleMultiAgentTask}
                  disabled={multiAgentMutation.isPending}
                  className="w-full"
                >
                  {multiAgentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Orchestrating Agents...
                    </>
                  ) : (
                    <>
                      <Network className="h-4 w-4 mr-2" />
                      Orchestrate Multi-Agent Task
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orchestration Results</CardTitle>
              </CardHeader>
              <CardContent>
                {multiAgentMutation.data ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Task Status:</span>
                      <Badge variant={multiAgentMutation.data.data.status === 'completed' ? 'default' : 'secondary'}>
                        {multiAgentMutation.data.data.status}
                      </Badge>
                    </div>

                    <div>
                      <Label>Agent Contributions</Label>
                      <ScrollArea className="h-32 mt-2">
                        <div className="space-y-2">
                          {multiAgentMutation.data.data.agents?.map((agent: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{agent.id}</span>
                              <div className="flex items-center space-x-2">
                                <Progress value={agent.confidence * 100} className="w-16" />
                                <span className="text-xs">{(agent.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div>
                      <Label>Synthesis</Label>
                      <p className="text-sm mt-1 p-3 bg-muted rounded">
                        {multiAgentMutation.data.data.synthesis}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Task ID: {multiAgentMutation.data.data.taskId}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4" />
                    <p>Orchestrate multi-agent task to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversational AI Tab */}
        <TabsContent value="conversation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Advanced Conversational AI
                </CardTitle>
                <CardDescription>
                  Create and interact with context-aware AI assistants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleCreateAI}
                  disabled={createAIMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {createAIMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating AI...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Create New AI Assistant
                    </>
                  )}
                </Button>

                <div className="space-y-2">
                  <Label>Select AI Assistant</Label>
                  <Select value={selectedAI} onValueChange={setSelectedAI}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an AI assistant" />
                    </SelectTrigger>
                    <SelectContent>
                      {conversations?.data?.map((ai: ConversationalAI) => (
                        <SelectItem key={ai.id} value={ai.id}>
                          {ai.type} - {ai.personality.tone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Your Message</Label>
                  <Textarea
                    value={conversationInput}
                    onChange={(e) => setConversationInput(e.target.value)}
                    placeholder="Ask me anything about software development..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleConversation}
                  disabled={conversationMutation.isPending || !selectedAI}
                  className="w-full"
                >
                  {conversationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent>
                {conversationMutation.data ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[80%]">
                          {conversationMutation.data.data.userInput}
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                          {conversationMutation.data.data.aiResponse}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                    <p>Start a conversation with an AI assistant</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Code Review Tab */}
        <TabsContent value="code-review" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Intelligent Code Review
                </CardTitle>
                <CardDescription>
                  AI-powered code analysis with optimization suggestions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Code to Review</Label>
                  <Textarea
                    value={codeForReview}
                    onChange={(e) => setCodeForReview(e.target.value)}
                    placeholder="Paste your code here for review..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <Button 
                  onClick={handleCodeReview}
                  disabled={codeReviewMutation.isPending}
                  className="w-full"
                >
                  {codeReviewMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Reviewing Code...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Review Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Results</CardTitle>
              </CardHeader>
              <CardContent>
                {codeReviewMutation.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Lines Reviewed</Label>
                        <p className="text-2xl font-bold">{codeReviewMutation.data.data.metrics.linesReviewed}</p>
                      </div>
                      <div>
                        <Label>Issues Found</Label>
                        <p className="text-2xl font-bold text-orange-600">{codeReviewMutation.data.data.metrics.issuesFound}</p>
                      </div>
                      <div>
                        <Label>Test Coverage</Label>
                        <p className="text-2xl font-bold text-green-600">{codeReviewMutation.data.data.metrics.testCoverage}%</p>
                      </div>
                      <div>
                        <Label>Maintainability</Label>
                        <p className="text-2xl font-bold">{codeReviewMutation.data.data.metrics.maintainabilityRating}</p>
                      </div>
                    </div>

                    <div>
                      <Label>Findings</Label>
                      <ScrollArea className="h-32 mt-2">
                        {codeReviewMutation.data.data.findings.length > 0 ? (
                          <div className="space-y-2">
                            {codeReviewMutation.data.data.findings.map((finding: any, index: number) => (
                              <div key={index} className="p-2 border rounded text-sm">
                                <div className="flex justify-between items-start">
                                  <span>{finding.description}</span>
                                  <Badge variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}>
                                    {finding.severity}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-4 text-muted-foreground">No issues found</p>
                        )}
                      </ScrollArea>
                    </div>

                    <div>
                      <Label>Suggestions</Label>
                      <ScrollArea className="h-32 mt-2">
                        {codeReviewMutation.data.data.suggestions.length > 0 ? (
                          <div className="space-y-2">
                            {codeReviewMutation.data.data.suggestions.map((suggestion: any, index: number) => (
                              <div key={index} className="p-2 border rounded text-sm">
                                <p className="font-medium">{suggestion.type}</p>
                                <p>{suggestion.description}</p>
                                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                  <span>Impact: {suggestion.impact}</span>
                                  <span>Confidence: {(suggestion.confidence * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-4 text-muted-foreground">No suggestions available</p>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Eye className="h-16 w-16 mx-auto mb-4" />
                    <p>Submit code for review to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automated QA Tab */}
        <TabsContent value="qa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Automated Quality Assurance
              </CardTitle>
              <CardDescription>
                Comprehensive automated testing and quality checks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Code for QA Testing</Label>
                <Textarea
                  value={codeForReview}
                  onChange={(e) => setCodeForReview(e.target.value)}
                  placeholder="Paste code for automated QA testing..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <Button 
                onClick={() => automatedQAMutation.mutate({ code: codeForReview })}
                disabled={automatedQAMutation.isPending}
                className="w-full"
              >
                {automatedQAMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running QA Tests...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Run Automated QA
                  </>
                )}
              </Button>

              {automatedQAMutation.data && (
                <div className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-sm font-medium">Tests Passed</p>
                        <p className="text-2xl font-bold">
                          {automatedQAMutation.data.data.testResults?.length || 0}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium">Security Score</p>
                        <p className="text-2xl font-bold">
                          {(automatedQAMutation.data.data.securityScan?.securityScore * 100 || 90).toFixed(0)}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Gauge className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm font-medium">Performance</p>
                        <p className="text-2xl font-bold">
                          {(automatedQAMutation.data.data.performanceAnalysis?.performanceScore * 100 || 85).toFixed(0)}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Eye className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                        <p className="text-sm font-medium">Accessibility</p>
                        <p className="text-2xl font-bold">
                          {(automatedQAMutation.data.data.accessibilityCheck?.score * 100 || 90).toFixed(0)}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  AI Documentation Generation
                </CardTitle>
                <CardDescription>
                  Generate comprehensive documentation from source code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Source Material</Label>
                  <Textarea
                    value={documentationSource}
                    onChange={(e) => setDocumentationSource(e.target.value)}
                    placeholder="Paste code, API endpoints, or project structure for documentation..."
                    rows={8}
                  />
                </div>

                <Button 
                  onClick={handleDocumentationGeneration}
                  disabled={documentationMutation.isPending}
                  className="w-full"
                >
                  {documentationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Documentation...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Generate Documentation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                {documentationMutation.data ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Target:</span>
                      <Badge>{documentationMutation.data.data.target}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Format:</span>
                      <Badge variant="outline">{documentationMutation.data.data.format}</Badge>
                    </div>

                    <div>
                      <Label>Sections Generated</Label>
                      <ScrollArea className="h-32 mt-2">
                        <div className="space-y-2">
                          {documentationMutation.data.data.content.sections.map((section: any, index: number) => (
                            <div key={index} className="p-2 border rounded">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{section.title}</span>
                                <Badge variant="secondary">{section.type}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Accuracy:</span>
                        <Progress value={documentationMutation.data.data.content.metadata.accuracy * 100} className="mt-1" />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completeness:</span>
                        <Progress value={documentationMutation.data.data.content.metadata.completeness * 100} className="mt-1" />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-16 w-16 mx-auto mb-4" />
                    <p>Generate documentation to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}