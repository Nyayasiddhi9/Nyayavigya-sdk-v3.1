import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Zap, 
  Globe, 
  Box, 
  Glasses, 
  MessageCircle, 
  Code, 
  Users, 
  TrendingDown,
  Sparkles,
  Eye,
  Mic,
  Settings,
  Play,
  Download
} from 'lucide-react';

export default function KimiK2Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);

  // Get Kimi K2 configuration
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['/api/kimi-k2/config'],
    retry: false
  });

  // Get Kimi K2 capabilities
  const { data: capabilities } = useQuery({
    queryKey: ['/api/kimi-k2/capabilities']
  });

  // Get user's 3D avatars
  const { data: avatarsData } = useQuery({
    queryKey: ['/api/kimi-k2/avatars'],
    enabled: !!config
  });

  // Configure Kimi K2
  const configMutation = useMutation({
    mutationFn: async (configData: any) => {
      return apiRequest('/api/kimi-k2/config', {
        method: 'POST',
        body: JSON.stringify(configData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Kimi K2 Configured",
        description: "12th LLM provider successfully integrated with 95% cost savings!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kimi-k2/config'] });
      setIsConfiguring(false);
      setApiKey('');
    },
    onError: (error) => {
      toast({
        title: "Configuration Failed",
        description: "Please check your API key and try again",
        variant: "destructive"
      });
    }
  });

  // Chat with Kimi K2
  const chatMutation = useMutation({
    mutationFn: async (chatData: any) => {
      return apiRequest('/api/kimi-k2/chat', {
        method: 'POST',
        body: JSON.stringify(chatData)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Response Generated",
        description: `Cost: $${data.cost.toFixed(6)} | Response Time: ${data.responseTime}ms`
      });
    }
  });

  // Create 3D Avatar
  const avatarMutation = useMutation({
    mutationFn: async (avatarData: any) => {
      return apiRequest('/api/kimi-k2/avatar-3d', {
        method: 'POST',
        body: JSON.stringify(avatarData)
      });
    },
    onSuccess: () => {
      toast({
        title: "3D Avatar Created",
        description: "Your immersive AI assistant is ready!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kimi-k2/avatars'] });
    }
  });

  // Generate 3D code
  const generate3DMutation = useMutation({
    mutationFn: async (data: { prompt: string; type: string }) => {
      return apiRequest('/api/kimi-k2/generate-3d', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "3D Code Generated",
        description: `Generated ${data.type} code with Kimi K2`
      });
    }
  });

  const handleConfigure = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Kimi K2 API key",
        variant: "destructive"
      });
      return;
    }

    configMutation.mutate({
      apiKey,
      modelPreferences: {
        model: 'kimi-k2-instruct',
        temperature: 0.6
      },
      costLimits: {
        dailyLimit: 100,
        monthlyLimit: 1000
      },
      multilingualSettings: {
        primaryLanguage: 'en',
        supportedLanguages: ['en', 'hi', 'ta', 'te', 'bn', 'es', 'fr']
      }
    });
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    chatMutation.mutate({
      messages: [
        { role: 'user', content: chatMessage }
      ],
      language: selectedLanguage,
      agenticMode: true
    });
    setChatMessage('');
  };

  const handleCreateAvatar = async () => {
    avatarMutation.mutate({
      name: 'AI Development Assistant',
      style: '3d-realistic',
      personality: {
        name: 'DevBot',
        traits: ['intelligent', 'helpful', 'multilingual', 'innovative'],
        communicationStyle: 'professional',
        expertise: ['coding', '3d-development', 'webxr', 'ar-vr']
      },
      languages: ['en', 'hi', 'ta', 'te', 'bn'],
      voiceProfile: {
        provider: 'elevenlabs',
        voiceId: 'default',
        emotionRange: 'full',
        pitch: 1.0,
        speed: 1.0
      },
      immersiveFeatures: ['ar', 'vr', 'spatial-audio', 'gesture-control'],
      knowledgeBases: []
    });
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading Kimi K2 configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Kimi K2 Integration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          12th LLM Provider with 3D AI Assistants, AR/VR Capabilities, and 95% Cost Savings
        </p>
      </div>

      {!config && !isConfiguring && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Configure Kimi K2 Provider
            </CardTitle>
            <CardDescription>
              Get started with the most cost-effective LLM provider featuring advanced 3D capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingDown className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cost Reduction</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">65.8%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">SWE-bench Score</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Globe className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">47.3%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Multilingual Coding</div>
              </div>
            </div>
            <Button onClick={() => setIsConfiguring(true)} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Configure Kimi K2
            </Button>
          </CardContent>
        </Card>
      )}

      {isConfiguring && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Kimi K2 API Configuration</CardTitle>
            <CardDescription>
              Enter your Kimi K2 API key to enable the 12th LLM provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Kimi K2 API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Kimi K2 API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleConfigure} 
                disabled={configMutation.isPending}
                className="flex-1"
              >
                {configMutation.isPending ? "Configuring..." : "Configure"}
              </Button>
              <Button variant="outline" onClick={() => setIsConfiguring(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {config && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
            <TabsTrigger value="avatars">3D Avatars</TabsTrigger>
            <TabsTrigger value="3d-code">3D Development</TabsTrigger>
            <TabsTrigger value="immersive">AR/VR</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Cost Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Input Cost:</span>
                      <span className="font-mono">$0.15/1M tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Output Cost:</span>
                      <span className="font-mono">$2.50/1M tokens</span>
                    </div>
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>Savings vs GPT-4:</span>
                      <span>95%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>SWE-bench Score:</span>
                      <span className="font-semibold">65.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Context Window:</span>
                      <span>128K tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Multilingual:</span>
                      <span className="font-semibold">47.3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Glasses className="h-5 w-5 text-purple-500" />
                    3D Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="secondary">WebXR Development</Badge>
                    <Badge variant="secondary">3D Avatar Creation</Badge>
                    <Badge variant="secondary">AR/VR Experiences</Badge>
                    <Badge variant="secondary">Spatial Computing</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {capabilities && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Supported Languages & Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Languages:</h4>
                      <div className="flex flex-wrap gap-2">
                        {capabilities?.supportedLanguages?.map((lang: string) => (
                          <Badge key={lang} variant="outline">{lang}</Badge>
                        )) || <Badge variant="outline">No languages configured</Badge>}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Immersive Features:</h4>
                      <div className="flex flex-wrap gap-2">
                        {capabilities?.immersiveFeatures?.map((feature: string) => (
                          <Badge key={feature} variant="secondary">{feature}</Badge>
                        )) || <Badge variant="secondary">No features configured</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Multilingual AI Chat
                </CardTitle>
                <CardDescription>
                  Chat with Kimi K2 in multiple languages with agentic capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="language">Language</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="ta">Tamil</SelectItem>
                        <SelectItem value="te">Telugu</SelectItem>
                        <SelectItem value="bn">Bengali</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Ask about 3D development, coding, or any technical topic..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleChat} 
                  disabled={chatMutation.isPending || !chatMessage.trim()}
                  className="w-full"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {chatMutation.isPending ? "Generating..." : "Send Message"}
                </Button>

                {chatMutation.data && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-sm">Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{chatMutation.data.content}</p>
                      <div className="mt-2 text-xs text-gray-500 flex gap-4">
                        <span>Cost: ${chatMutation.data.cost.toFixed(6)}</span>
                        <span>Time: {chatMutation.data.responseTime}ms</span>
                        <span>Tokens: {chatMutation.data.usage.totalTokens}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="avatars">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    3D AI Avatars
                  </CardTitle>
                  <CardDescription>
                    Create immersive 3D AI assistants with voice synthesis and multilingual support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleCreateAvatar} disabled={avatarMutation.isPending}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {avatarMutation.isPending ? "Creating Avatar..." : "Create 3D Avatar"}
                  </Button>
                </CardContent>
              </Card>

              {avatarsData && Array.isArray(avatarsData) && avatarsData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {avatarsData.map((avatar: any) => (
                    <Card key={avatar.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          {avatar.name}
                        </CardTitle>
                        <CardDescription>{avatar.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4" />
                            <span className="text-sm">Voice: {avatar.voiceProfile?.provider}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span className="text-sm">{avatar.languages?.length} languages</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Glasses className="h-4 w-4" />
                            <span className="text-sm">{avatar.immersiveFeatures?.length} AR/VR features</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Used {avatar.usageCount} times
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="3d-code">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  3D Code Generation
                </CardTitle>
                <CardDescription>
                  Generate Three.js, WebXR, and game development code with Kimi K2
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => generate3DMutation.mutate({ 
                      prompt: "Create an interactive 3D avatar with realistic materials and animations", 
                      type: "3d-scene" 
                    })}
                    disabled={generate3DMutation.isPending}
                    variant="outline"
                  >
                    <Box className="mr-2 h-4 w-4" />
                    3D Scene
                  </Button>
                  <Button 
                    onClick={() => generate3DMutation.mutate({ 
                      prompt: "Create WebXR VR experience with hand tracking", 
                      type: "webxr" 
                    })}
                    disabled={generate3DMutation.isPending}
                    variant="outline"
                  >
                    <Glasses className="mr-2 h-4 w-4" />
                    WebXR
                  </Button>
                </div>

                {generate3DMutation.data && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        Generated Code
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-xs">
                        <code>{generate3DMutation.data.code}</code>
                      </pre>
                      <div className="mt-2 text-xs text-gray-500">
                        Cost: ${generate3DMutation.data.cost.toFixed(6)} | 
                        Type: {generate3DMutation.data.type}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="immersive">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Glasses className="h-5 w-5" />
                  Immersive Experiences
                </CardTitle>
                <CardDescription>
                  Create AR/VR experiences and immersive 3D environments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Glasses className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Advanced AR/VR experience builder with Kimi K2 integration
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}