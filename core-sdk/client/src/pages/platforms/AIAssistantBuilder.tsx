import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, Mic, Globe, Brain, Sparkles, Upload, Database,
  CheckCircle, AlertCircle, Settings, Play, Users,
  Languages, Headphones, Layers, Activity, Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { aiAssistantBuilderWAI } from '@/services/wai-orchestration-client';
import PlatformAdminBar from '@/components/shared/PlatformAdminBar';

interface Assistant {
  id: string;
  name: string;
  description: string;
  avatar: string;
  status: 'active' | 'inactive' | 'testing';
  version: string;
  languages: string[];
  capabilities: string[];
  ragConfig: any;
  voiceConfig: any;
  metrics: {
    totalConversations: number;
    activeUsers: number;
    satisfactionScore: number;
    avgResponseTime: number;
    successRate: number;
  };
}

export default function AIAssistantBuilder() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Fetch assistants data
  const { data: assistants, isLoading, refetch } = useQuery<Assistant[]>({
    queryKey: ['/api/ai-assistants'],
    retry: 2
  });

  // New assistant form state
  const [newAssistant, setNewAssistant] = useState({
    name: '',
    description: '',
    primaryLanguage: 'English',
    capabilities: [] as string[],
    ragEnabled: false,
    voiceEnabled: false,
    voice3DEnabled: false
  });

  const handleCreateAssistant = async () => {
    if (!newAssistant.name) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your AI assistant',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest('/api/ai-assistants', {
        method: 'POST',
        body: JSON.stringify(newAssistant)
      });

      if (response.id) {
        toast({
          title: 'Assistant Created',
          description: `${newAssistant.name} has been created successfully`
        });
        refetch();
        setActiveTab('dashboard');
        setNewAssistant({
          name: '',
          description: '',
          primaryLanguage: 'English',
          capabilities: [],
          ragEnabled: false,
          voiceEnabled: false,
          voice3DEnabled: false
        });
      }
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create assistant. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const indianLanguages = [
    'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 
    'Urdu', 'Gujarati', 'Kannada', 'Malayalam', 'Odia',
    'Punjabi', 'Assamese'
  ];

  return (
    <>
      <PlatformAdminBar platformName="AI Assistant Builder" />
      <div className="container max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Bot className="h-10 w-10 text-blue-600" />
            AI Assistant Builder
          </h1>
          <p className="text-lg text-muted-foreground">
            Multi-Assistant Management with RAG, Voice Cloning & 3D Avatars
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="create">Create Assistant</TabsTrigger>
          <TabsTrigger value="rag">RAG Pipeline</TabsTrigger>
          <TabsTrigger value="voice">Voice & Avatar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <div className="grid gap-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Assistants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assistants?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {assistants?.filter((a: Assistant) => a.status === 'active').length || 0} active
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {assistants?.reduce((sum: number, a: Assistant) => 
                      sum + (a.metrics?.totalConversations || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {assistants?.reduce((sum: number, a: Assistant) => 
                      sum + (a.metrics?.activeUsers || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Unique users</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {assistants?.length ? 
                      (assistants.reduce((sum: number, a: Assistant) => 
                        sum + (a.metrics?.satisfactionScore || 0), 0) / assistants.length).toFixed(1) 
                      : '0.0'}%
                  </div>
                  <p className="text-xs text-muted-foreground">Overall rating</p>
                </CardContent>
              </Card>
            </div>

            {/* Assistants Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Your AI Assistants</CardTitle>
                <CardDescription>
                  Manage and monitor your AI assistants with real-time analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Activity className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading assistants...</span>
                  </div>
                ) : assistants?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assistants.map((assistant: Assistant) => (
                      <Card key={assistant.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedAssistant(assistant)}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Bot className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{assistant.name}</CardTitle>
                                <Badge variant={assistant.status === 'active' ? 'default' : 'secondary'} 
                                       className="mt-1">
                                  {assistant.status}
                                </Badge>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">v{assistant.version}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">{assistant.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Conversations</span>
                              <span className="font-medium">{assistant.metrics?.totalConversations || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Success Rate</span>
                              <span className="font-medium">{assistant.metrics?.successRate || 0}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Response Time</span>
                              <span className="font-medium">{assistant.metrics?.avgResponseTime || 0}ms</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-3">
                            {assistant.languages?.slice(0, 3).map((lang, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                            {assistant.languages?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{assistant.languages.length - 3}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Assistants Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first AI assistant to get started
                    </p>
                    <Button onClick={() => setActiveTab('create')}>
                      Create Assistant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New AI Assistant</CardTitle>
              <CardDescription>
                Step-by-step wizard to create a custom AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Assistant Name</label>
                    <Input
                      placeholder="e.g., Customer Support Bot"
                      value={newAssistant.name}
                      onChange={(e) => setNewAssistant({...newAssistant, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Primary Language</label>
                    <Select value={newAssistant.primaryLanguage} 
                            onValueChange={(value) => setNewAssistant({...newAssistant, primaryLanguage: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        {indianLanguages.map(lang => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    placeholder="Describe the purpose and capabilities of your assistant..."
                    value={newAssistant.description}
                    onChange={(e) => setNewAssistant({...newAssistant, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Capabilities */}
              <div className="space-y-4">
                <h3 className="font-semibold">Capabilities</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">RAG (Retrieval Augmented Generation)</label>
                      <p className="text-sm text-muted-foreground">Enable document-based responses</p>
                    </div>
                    <Switch
                      checked={newAssistant.ragEnabled}
                      onCheckedChange={(checked) => setNewAssistant({...newAssistant, ragEnabled: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Voice Capabilities</label>
                      <p className="text-sm text-muted-foreground">Enable voice cloning and TTS</p>
                    </div>
                    <Switch
                      checked={newAssistant.voiceEnabled}
                      onCheckedChange={(checked) => setNewAssistant({...newAssistant, voiceEnabled: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">3D Avatar</label>
                      <p className="text-sm text-muted-foreground">Enable AR/VR/XR support</p>
                    </div>
                    <Switch
                      checked={newAssistant.voice3DEnabled}
                      onCheckedChange={(checked) => setNewAssistant({...newAssistant, voice3DEnabled: checked})}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleCreateAssistant}
                  disabled={isCreating}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Create Assistant
                    </>
                  )}
                </Button>
                <Button variant="outline" size="lg" onClick={() => setActiveTab('dashboard')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rag" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>RAG Pipeline Configuration</CardTitle>
              <CardDescription>
                Advanced Retrieval Augmented Generation with vector database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Upload Section */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Upload Documents</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload PDFs, documents, or text files for RAG processing
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Files
                  </Button>
                </div>

                {/* Pipeline Visualization */}
                <div>
                  <h3 className="font-semibold mb-4">Pipeline Status</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <span className="text-sm">Document Upload</span>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                        <Layers className="h-8 w-8 text-purple-600" />
                      </div>
                      <span className="text-sm">Chunking</span>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                        <Database className="h-8 w-8 text-green-600" />
                      </div>
                      <span className="text-sm">Embedding</span>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                        <Brain className="h-8 w-8 text-orange-600" />
                      </div>
                      <span className="text-sm">Vector DB</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice & 3D Avatar Configuration</CardTitle>
              <CardDescription>
                Voice cloning and immersive 3D experiences with AR/VR support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Voice Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Voice Cloning</h3>
                  <div className="border rounded-lg p-4">
                    <Mic className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Record a voice sample for AI cloning
                    </p>
                    <Button>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Voice Provider</label>
                    <Select defaultValue="elevenlabs">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                        <SelectItem value="openai">OpenAI TTS</SelectItem>
                        <SelectItem value="azure">Azure Speech</SelectItem>
                        <SelectItem value="deepgram">Deepgram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 3D Avatar Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">3D Avatar</h3>
                  <div className="border rounded-lg p-4">
                    <Eye className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure 3D avatar with AR/VR/XR support
                    </p>
                    <Button>
                      <Eye className="h-4 w-4 mr-2" />
                      Configure Avatar
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Enable WebXR Support</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Enable AR Mode</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Enable VR Mode</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Performance</CardTitle>
              <CardDescription>
                Real-time analytics and A/B testing for your AI assistants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Detailed analytics will be available once assistants are active
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}