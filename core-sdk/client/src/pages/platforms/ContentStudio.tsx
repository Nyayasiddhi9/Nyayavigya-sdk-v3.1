import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, Image, Video, Mic, Presentation, Box,
  Sparkles, Upload, Download, FolderOpen, Clock,
  CheckCircle, AlertCircle, Settings, Play, Layers,
  Copy, Trash2, Edit, Share2, Globe, TrendingUp
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation} from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import PlatformAdminBar from '@/components/shared/PlatformAdminBar';
import { contentStudioWAI } from '@/services/wai-orchestration-client';

interface ContentItem {
  id: string;
  title: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'presentation' | '3d';
  content: string;
  status: 'draft' | 'published' | 'scheduled';
  folder?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  tags: string[];
  metrics?: {
    views: number;
    shares: number;
    engagement: number;
  };
  brandVoice?: string;
  styleGuide?: string;
}

interface ContentFolder {
  id: string;
  name: string;
  path: string;
  itemCount: number;
  lastModified: string;
  color: string;
}

export default function ContentStudio() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Content generation form state with enhanced features
  const [generationForm, setGenerationForm] = useState({
    type: 'text',
    prompt: '',
    brandVoice: '',
    styleGuide: '',
    format: 'article',
    length: 'medium',
    bulkGenerate: false,
    csvFile: null as File | null,
    multiLanguage: false,
    languages: [] as string[],
    sarvamAPIEnabled: false,
    culturalAdaptation: false,
    enhancedOrchestration: true,
    qualityLevel: 'quality' as 'balanced' | 'quality' | 'premium'
  });

  // Fetch content data
  const { data: contentData, isLoading, refetch } = useQuery({
    queryKey: ['/api/content'],
    retry: 2
  });

  // Fetch folders
  const { data: folders = [] } = useQuery<ContentFolder[]>({
    queryKey: ['/api/content/folders'],
    retry: 2
  });

  // Enhanced content generation with WAI orchestration and SarvamAPI
  const generateContent = useMutation({
    mutationFn: async (data: any) => {
      // Use WAI orchestration for enhanced content generation
      const waiResult = await contentStudioWAI.processContentTask(
        `Generate ${data.type} content: ${data.prompt}. Format: ${data.format}, Length: ${data.length}`,
        {
          enhancedMode: data.enhancedOrchestration,
          budget: data.qualityLevel,
          priority: 'high',
          userContext: {
            brandVoice: data.brandVoice,
            styleGuide: data.styleGuide,
            multiLanguage: data.multiLanguage,
            languages: data.languages,
            culturalAdaptation: data.culturalAdaptation,
            sarvamAPIEnabled: data.sarvamAPIEnabled
          }
        }
      );

      // Enhanced API call with orchestration results
      const response = await apiRequest('/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          waiOrchestrationResults: waiResult,
          orchestrationAgent: waiResult.agentUsed.name,
          qualityScore: waiResult.qualityScore
        })
      });
      
      return { response, waiResult };
    },
    onSuccess: (data) => {
      toast({
        title: 'Enhanced Content Generated',
        description: `Content created with ${data.waiResult.agentUsed.name} agent. Quality: ${data.waiResult.qualityScore}/10`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      setActiveTab('library');
    },
    onError: () => {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleGenerateContent = () => {
    if (!generationForm.prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt for content generation',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    generateContent.mutate(generationForm, {
      onSettled: () => setIsGenerating(false)
    });
  };

  const contentTypes = [
    { value: 'text', label: 'Text Content', icon: FileText },
    { value: 'image', label: 'Image', icon: Image },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'audio', label: 'Audio', icon: Mic },
    { value: 'presentation', label: 'Presentation', icon: Presentation },
    { value: '3d', label: '3D Model', icon: Box }
  ];

  const contentStats = {
    total: contentData?.items?.length || 0,
    published: contentData?.items?.filter((i: ContentItem) => i.status === 'published').length || 0,
    drafts: contentData?.items?.filter((i: ContentItem) => i.status === 'draft').length || 0,
    scheduled: contentData?.items?.filter((i: ContentItem) => i.status === 'scheduled').length || 0,
    totalViews: contentData?.items?.reduce((sum: number, i: ContentItem) => sum + (i.metrics?.views || 0), 0) || 0,
    engagement: contentData?.items?.reduce((sum: number, i: ContentItem) => sum + (i.metrics?.engagement || 0), 0) || 0
  };

  return (
    <>
      <PlatformAdminBar platformName="Content Studio" />
      <div className="container max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Layers className="h-10 w-10 text-purple-600" />
            Content Studio (AuraGen)
          </h1>
          <p className="text-lg text-muted-foreground">
            Million-Scale Content Management with AI Generation & Publishing Workflows
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Process</TabsTrigger>
          <TabsTrigger value="brand">Brand Voice</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentStats.total}</div>
                  <p className="text-xs text-muted-foreground">All items</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentStats.published}</div>
                  <p className="text-xs text-muted-foreground">Live items</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentStats.drafts}</div>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentStats.scheduled}</div>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contentStats.totalViews > 1000 
                      ? `${(contentStats.totalViews / 1000).toFixed(1)}K`
                      : contentStats.totalViews}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentStats.engagement}%</div>
                  <p className="text-xs text-muted-foreground">Average</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Content */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Content</CardTitle>
                <CardDescription>Your latest generated content</CardDescription>
              </CardHeader>
              <CardContent>
                {contentData?.items?.slice(0, 5).map((item: ContentItem) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {React.createElement(
                        contentTypes.find(t => t.value === item.type)?.icon || FileText,
                        { className: "h-5 w-5 text-muted-foreground" }
                      )}
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()} • v{item.version}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    No content yet. Start generating!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generate" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Content</CardTitle>
              <CardDescription>
                AI-powered content generation for text, images, videos, audio, and more
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Content Type</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {contentTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setGenerationForm({...generationForm, type: type.value})}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        generationForm.type === type.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generation Prompt */}
              <div>
                <label className="text-sm font-medium mb-2 block">Generation Prompt</label>
                <Textarea
                  placeholder={`Describe the ${generationForm.type} content you want to generate...`}
                  value={generationForm.prompt}
                  onChange={(e) => setGenerationForm({...generationForm, prompt: e.target.value})}
                  className="min-h-[120px]"
                />
              </div>

              {/* Format and Length */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Format</label>
                  <Select 
                    value={generationForm.format}
                    onValueChange={(value) => setGenerationForm({...generationForm, format: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="script">Script</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Length</label>
                  <Select 
                    value={generationForm.length}
                    onValueChange={(value) => setGenerationForm({...generationForm, length: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Enhanced Advanced Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Multi-Language Generation</label>
                    <p className="text-sm text-muted-foreground">Generate in multiple languages</p>
                  </div>
                  <Switch
                    checked={generationForm.multiLanguage}
                    onCheckedChange={(checked) => setGenerationForm({...generationForm, multiLanguage: checked})}
                  />
                </div>

                {/* SarvamAPI Integration for Indian Languages */}
                {generationForm.multiLanguage && (
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-green-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-orange-600" />
                        <label className="text-sm font-medium text-orange-800">SarvamAPI - Indian Languages</label>
                      </div>
                      <Switch
                        checked={generationForm.sarvamAPIEnabled}
                        onCheckedChange={(checked) => setGenerationForm({...generationForm, sarvamAPIEnabled: checked})}
                      />
                    </div>
                    {generationForm.sarvamAPIEnabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {['Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia'].map((lang) => (
                            <Button
                              key={lang}
                              variant={generationForm.languages.includes(lang) ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                const updatedLanguages = generationForm.languages.includes(lang)
                                  ? generationForm.languages.filter(l => l !== lang)
                                  : [...generationForm.languages, lang];
                                setGenerationForm({...generationForm, languages: updatedLanguages});
                              }}
                            >
                              {lang}
                            </Button>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-orange-800">Cultural Adaptation</label>
                          <Switch
                            checked={generationForm.culturalAdaptation}
                            onCheckedChange={(checked) => setGenerationForm({...generationForm, culturalAdaptation: checked})}
                          />
                        </div>
                        {generationForm.culturalAdaptation && (
                          <p className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                            Content will be culturally adapted with local context, festivals, traditions, and cultural nuances.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Bulk Generate</label>
                    <p className="text-sm text-muted-foreground">Generate multiple variations</p>
                  </div>
                  <Switch
                    checked={generationForm.bulkGenerate}
                    onCheckedChange={(checked) => setGenerationForm({...generationForm, bulkGenerate: checked})}
                  />
                </div>

                {/* WAI Orchestration Quality Settings */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <label className="text-sm font-medium text-purple-800">WAI Enhanced Orchestration</label>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-purple-800">Enhanced Generation Mode</label>
                    <Switch
                      checked={generationForm.enhancedOrchestration}
                      onCheckedChange={(checked) => setGenerationForm({...generationForm, enhancedOrchestration: checked})}
                    />
                  </div>
                  {generationForm.enhancedOrchestration && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-purple-800">Quality Level</label>
                      <Select 
                        value={generationForm.qualityLevel}
                        onValueChange={(value: 'balanced' | 'quality' | 'premium') => 
                          setGenerationForm({...generationForm, qualityLevel: value})
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balanced">Balanced (Fast & Cost-effective)</SelectItem>
                          <SelectItem value="quality">Quality (Higher accuracy)</SelectItem>
                          <SelectItem value="premium">Premium (Best quality)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
                        Enhanced mode uses multiple AI agents and intelligent routing for superior content quality.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Powered by 14 LLM providers with AgentZero
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Folders Sidebar */}
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Folders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    All Content
                  </Button>
                  {folders.map((folder) => (
                    <Button 
                      key={folder.id}
                      variant={selectedFolder === folder.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setSelectedFolder(folder.id)}
                    >
                      <div 
                        className="h-3 w-3 rounded-full mr-2" 
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="flex-1 text-left">{folder.name}</span>
                      <span className="text-xs text-muted-foreground">{folder.itemCount}</span>
                    </Button>
                  ))}
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Create Folder
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Content Grid */}
            <div className="col-span-9">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Content Library</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-12">
                      <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Loading content library...</p>
                    </div>
                  ) : contentData?.items?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contentData.items.map((item: ContentItem) => (
                        <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => setSelectedContent(item)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {React.createElement(
                                  contentTypes.find(t => t.value === item.type)?.icon || FileText,
                                  { className: "h-5 w-5 text-muted-foreground" }
                                )}
                                <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                                  {item.status}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">v{item.version}</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <h4 className="font-medium mb-2 line-clamp-2">{item.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                              {item.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                              <div className="flex items-center gap-3">
                                <span>{item.metrics?.views || 0} views</span>
                                <span>{item.metrics?.engagement || 0}% eng</span>
                              </div>
                            </div>
                            {item.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Content Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start generating content to build your library
                      </p>
                      <Button onClick={() => setActiveTab('generate')}>
                        Generate Content
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Content Processing</CardTitle>
              <CardDescription>
                Generate multiple content pieces at scale with CSV import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* CSV Upload */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV with prompts and parameters for bulk generation
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Select CSV File
                  </Button>
                </div>

                {/* Processing Queue */}
                <div>
                  <h3 className="font-semibold mb-4">Processing Queue</h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Batch {i} - Marketing Content</p>
                            <p className="text-sm text-muted-foreground">50 items • Processing...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={33 * i} className="w-24" />
                          <Badge>{33 * i}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice Management</CardTitle>
              <CardDescription>
                Define and maintain consistent brand voice across all content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Brand Voice Guidelines</label>
                <Textarea
                  placeholder="Define your brand's tone, personality, and communication style..."
                  className="min-h-[150px]"
                  defaultValue={generationForm.brandVoice}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Style Guide</label>
                <Textarea
                  placeholder="Specify formatting rules, vocabulary preferences, and writing standards..."
                  className="min-h-[150px]"
                  defaultValue={generationForm.styleGuide}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">Multi-Brand Support</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['Brand A', 'Brand B', 'Brand C', 'Brand D'].map((brand) => (
                    <Card key={brand} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{brand}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Professional, authoritative, trustworthy
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Button size="lg">
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Brand Guidelines
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Analytics</CardTitle>
              <CardDescription>
                Performance metrics and insights for your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Performance Chart */}
                <div className="col-span-2">
                  <h3 className="font-semibold mb-4">Performance Trends</h3>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Performance chart</span>
                  </div>
                </div>

                {/* Top Content */}
                <div>
                  <h3 className="font-semibold mb-4">Top Performing</h3>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{i}.</span>
                          <span className="text-sm">Content Item {i}</span>
                        </div>
                        <Badge variant="outline">{1000 - i * 100} views</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}