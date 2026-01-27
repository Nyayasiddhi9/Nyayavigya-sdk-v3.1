import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, Database, Settings, Users, Eye, Edit3, Trash2, 
  FileText, Image, Video, Calendar, Link, Hash, ToggleLeft,
  Layout, Code, Globe, ChevronRight, Save, X, Copy, ExternalLink,
  Sparkles, Zap, Shield, Key, Layers, Workflow, CheckCircle2,
  AlertTriangle, Info, HelpCircle, BookOpen, Target, Award,
  Crown, Rocket, Wand2, Star, TrendingUp, Clock, Activity,
  Search, Filter, SortAsc, Grid, List, Bookmark, BarChart3, Send, Box,
  Bot, Download
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  author: string;
  views?: number;
  metadata?: Record<string, any>;
}

interface ContentType {
  id: string;
  name: string;
  description: string;
  fields: ContentField[];
  permissions: string[];
  status: 'draft' | 'published';
  createdAt: string;
  itemCount?: number;
}

interface ContentField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'image' | 'video' | 'url' | 'relation' | 'json' | 'select' | 'multiselect';
  required: boolean;
  validation?: any;
  defaultValue?: any;
  description?: string;
  options?: string[];
}

export default function WizardsCMS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('content');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [selectedContentType, setSelectedContentType] = useState<string>('all');

  // Fetch content with proper typing and error handling
  const { data: cmsContent = [], isLoading: isLoadingContent, error: contentError } = useQuery<ContentItem[]>({
    queryKey: ['/api/wizards-cms/content'],
    queryFn: async () => {
      const response = await apiRequest('/api/wizards-cms/content');
      return Array.isArray(response) ? response : (response?.data || []);
    },
    initialData: [
      {
        id: '1',
        title: 'Getting Started with WAI DevStudio',
        type: 'blog-post',
        status: 'published',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        author: 'John Doe',
        views: 1250,
        metadata: { featured: true, category: 'tutorial' }
      },
      {
        id: '2',
        title: 'Advanced AI Assistant Configuration',
        type: 'documentation',
        status: 'draft',
        createdAt: '2024-01-14T15:30:00Z',
        updatedAt: '2024-01-14T15:30:00Z',
        author: 'Jane Smith',
        views: 890,
        metadata: { difficulty: 'advanced', category: 'guide' }
      },
      {
        id: '3',
        title: 'Product Launch Video',
        type: 'media',
        status: 'published',
        createdAt: '2024-01-13T09:15:00Z',
        updatedAt: '2024-01-13T09:15:00Z',
        author: 'Marketing Team',
        views: 3420,
        metadata: { duration: '5:30', resolution: '4K' }
      }
    ]
  });

  // Fetch content types with proper typing
  const { data: contentTypes = [], isLoading: isLoadingTypes } = useQuery<ContentType[]>({
    queryKey: ['/api/wizards-cms/content-types'],
    queryFn: async () => {
      const response = await apiRequest('/api/wizards-cms/content-types');
      return Array.isArray(response) ? response : (response?.data || []);
    },
    initialData: [
      {
        id: 'blog-post',
        name: 'Blog Post',
        description: 'Rich blog content with SEO optimization',
        fields: [
          { id: '1', name: 'title', type: 'text', required: true, description: 'SEO-friendly title' },
          { id: '2', name: 'content', type: 'textarea', required: true, description: 'Main blog content' },
          { id: '3', name: 'featured_image', type: 'image', required: false, description: 'Hero image' }
        ],
        permissions: ['admin', 'editor', 'author'],
        status: 'published',
        createdAt: '2024-01-15',
        itemCount: 15
      },
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'Technical documentation and guides',
        fields: [
          { id: '1', name: 'title', type: 'text', required: true },
          { id: '2', name: 'content', type: 'textarea', required: true },
          { id: '3', name: 'category', type: 'select', required: true, options: ['guide', 'tutorial', 'reference'] }
        ],
        permissions: ['admin', 'editor'],
        status: 'published',
        createdAt: '2024-01-10',
        itemCount: 8
      }
    ]
  });

  // Filter content based on search and filters
  const filteredContent = React.useMemo(() => {
    if (!cmsContent || !Array.isArray(cmsContent)) {
      return [];
    }
    
    return cmsContent.filter(item => {
      if (!item || typeof item !== 'object') return false;
      
      const matchesSearch = !searchQuery || (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesType = selectedContentType === 'all' || item.type === selectedContentType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [cmsContent, searchQuery, filterStatus, selectedContentType]);

  // Enhanced mutations with WAI Orchestration
  const createContentMutation = useMutation({
    mutationFn: (contentData: Partial<ContentItem>) =>
      apiRequest('/api/wizards-cms/content', {
        method: 'POST',
        body: JSON.stringify(contentData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizards-cms/content'] });
      toast({
        title: "✨ Content Created",
        description: "Your content has been created successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create content.",
        variant: "destructive"
      });
    }
  });

  // AI Content Generation with WAI Orchestration
  const generateContentMutation = useMutation({
    mutationFn: async (prompt: { title: string; type: string; description: string; useWAI?: boolean }) => {
      return apiRequest('/api/wizards-cms/generate-content', {
        method: 'POST',
        body: JSON.stringify({
          prompt: prompt.description,
          contentType: prompt.type,
          title: prompt.title,
          useWAI: prompt.useWAI || true,
          provider: 'claude-sonnet-4-20250514'
        })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizards-cms/content'] });
      toast({
        title: "🤖 AI Content Generated",
        description: `Generated using ${data.provider}. Cost: $${data.cost}`,
      });
    }
  });

  // Create Content Type with WAI assistance
  const createContentTypeMutation = useMutation({
    mutationFn: async (typeData: { name: string; description: string; fields?: any[] }) => {
      return apiRequest('/api/wizards-cms/content-types', {
        method: 'POST',
        body: JSON.stringify(typeData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizards-cms/content-types'] });
      toast({
        title: "🗄️ Content Type Created",
        description: "New content type created successfully.",
      });
    }
  });

  // Enhanced content enhancement with AI
  const enhanceContentMutation = useMutation({
    mutationFn: async (data: { contentId: string; enhancementType: string }) => {
      return apiRequest('/api/wizards-cms/enhance-content', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizards-cms/content'] });
      toast({
        title: "✨ Content Enhanced",
        description: `Enhanced with AI. Cost: $${data.cost}`,
      });
    }
  });

  const ContentCard = ({ item }: { item: ContentItem }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group cursor-pointer"
    >
      <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-blue-600" />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2">
            <Badge variant={item.status === 'published' ? 'default' : item.status === 'draft' ? 'secondary' : 'destructive'}>
              {item.status}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              {item.views || 0}
            </div>
          </div>
          <CardTitle className="text-lg font-bold group-hover:text-purple-600 transition-colors duration-300 line-clamp-2">
            {item.title}
          </CardTitle>
          <CardDescription className="text-sm">
            <div className="flex items-center gap-4 text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {item.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {contentTypes.find(ct => ct.id === item.type)?.name || item.type}
            </Badge>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const QuickStatsCard = ({ title, value, change, icon: Icon, color }: {
    title: string;
    value: string | number;
    change: string;
    icon: React.ElementType;
    color: string;
  }) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className={`text-sm font-medium ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last month
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (contentError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load content</h3>
          <p className="text-gray-600 mb-4">There was an error loading the CMS content.</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/strapi/content'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Wizards CMS Studio
            </h1>
            <Badge variant="secondary" className="mt-1">
              <Crown className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Create, manage, and publish content with Wizards CMS - powered by advanced AI orchestration and enterprise-grade features
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <QuickStatsCard
          title="Total Content"
          value={filteredContent.length}
          change="+12%"
          icon={FileText}
          color="from-blue-500 to-blue-600"
        />
        <QuickStatsCard
          title="Published"
          value={filteredContent.filter(item => item.status === 'published').length}
          change="+8%"
          icon={Globe}
          color="from-green-500 to-green-600"
        />
        <QuickStatsCard
          title="Content Types"
          value={contentTypes.length}
          change="+2"
          icon={Layers}
          color="from-purple-500 to-purple-600"
        />
        <QuickStatsCard
          title="Total Views"
          value={filteredContent.reduce((sum, item) => sum + (item.views || 0), 0).toLocaleString()}
          change="+24%"
          icon={TrendingUp}
          color="from-orange-500 to-orange-600"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 gap-2 h-auto p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <TabsTrigger value="content" className="flex items-center gap-2 p-3">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2 p-3">
            <Database className="h-4 w-4" />
            Content Types
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2 p-3">
            <Image className="h-4 w-4" />
            Media Library
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 p-3">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Enhanced Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex-1 flex gap-4 items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {contentTypes && Array.isArray(contentTypes) && contentTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                    <Plus className="h-4 w-4" />
                    Create Content
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid/List */}
          {isLoadingContent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredContent.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredContent.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <FileText className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                <CardTitle className="text-2xl mb-4">No Content Found</CardTitle>
                <CardDescription className="text-lg mb-6 max-w-md mx-auto">
                  {searchQuery || filterStatus !== 'all' || selectedContentType !== 'all'
                    ? "No content matches your current filters. Try adjusting your search criteria."
                    : "Create your first piece of content to get started with the CMS."
                  }
                </CardDescription>
                <div className="flex justify-center gap-4">
                  <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                    <Plus className="h-5 w-5" />
                    Create First Content
                  </Button>
                  {(searchQuery || filterStatus !== 'all' || selectedContentType !== 'all') && (
                    <Button variant="outline" onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                      setSelectedContentType('all');
                    }}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          {/* Content Types Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Content Types
                  </CardTitle>
                  <CardDescription>
                    Manage your content structure and field definitions
                  </CardDescription>
                </div>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 gap-2"
                  onClick={() => {
                    // AI-powered content type creation
                    const prompt = window.prompt("Describe the content type you want to create:");
                    if (prompt) {
                      createContentTypeMutation.mutate({
                        name: "Auto-Generated Type",
                        description: prompt
                      });
                    }
                  }}
                >
                  <Wand2 className="h-4 w-4" />
                  AI Create Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contentTypes.map((type) => (
                  <Card key={type.id} className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{type.status}</Badge>
                        <span className="text-sm text-gray-500">{type.itemCount || 0} items</span>
                      </div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Fields ({type.fields?.length || 0})</h4>
                          <div className="flex flex-wrap gap-1">
                            {type.fields?.slice(0, 3).map((field: any) => (
                              <Badge key={field.id} variant="secondary" className="text-xs">
                                {field.name}
                              </Badge>
                            ))}
                            {(type.fields?.length || 0) > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(type.fields?.length || 0) - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs">
                            View API
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          {/* Media Library */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Media Library
                  </CardTitle>
                  <CardDescription>
                    Manage images, videos, and other media assets with AI generation
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      generateContentMutation.mutate({
                        title: "AI Generated Image",
                        type: "media",
                        description: "Generate an image using AI"
                      });
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    AI Generate
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                    <Plus className="h-4 w-4" />
                    Upload Media
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Sample media items */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Content Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Content Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Views</span>
                    <span className="font-semibold">{filteredContent.reduce((sum, item) => sum + (item.views || 0), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Engagement</span>
                    <span className="font-semibold">+24%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Published Rate</span>
                    <span className="font-semibold">
                      {Math.round((filteredContent.filter(item => item.status === 'published').length / filteredContent.length) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Content Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm">Blog Posts</span>
                    <Badge variant="outline">Weekly</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm">Documentation</span>
                    <Badge variant="outline">Monthly</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm">Media Content</span>
                    <Badge variant="outline">Bi-weekly</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm font-medium mb-1">Content Optimization</p>
                    <p className="text-xs text-gray-600">SEO improvements suggested for 3 articles</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium mb-1">Trending Topics</p>
                    <p className="text-xs text-gray-600">AI recommends content on "DevOps automation"</p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    View All Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI-Enhanced Content Workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Content Workflow
              </CardTitle>
              <CardDescription>
                Generate, enhance, and optimize content using WAI orchestration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="p-6 h-auto flex-col gap-3"
                  onClick={() => {
                    const prompt = window.prompt("Describe the content you want to generate:");
                    if (prompt) {
                      generateContentMutation.mutate({
                        title: "AI Generated Content",
                        type: "blog-post",
                        description: prompt,
                        useWAI: true
                      });
                    }
                  }}
                >
                  <Bot className="h-8 w-8 text-blue-600" />
                  <div className="text-center">
                    <h3 className="font-semibold">Generate Content</h3>
                    <p className="text-sm text-gray-500">Create content with AI assistance</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="p-6 h-auto flex-col gap-3"
                  onClick={() => {
                    const contentId = window.prompt("Enter content ID to enhance:");
                    if (contentId) {
                      enhanceContentMutation.mutate({
                        contentId,
                        enhancementType: "seo_optimization"
                      });
                    }
                  }}
                >
                  <Sparkles className="h-8 w-8 text-purple-600" />
                  <div className="text-center">
                    <h3 className="font-semibold">Enhance Content</h3>
                    <p className="text-sm text-gray-500">Improve existing content with AI</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="p-6 h-auto flex-col gap-3"
                >
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <div className="text-center">
                    <h3 className="font-semibold">Analyze Performance</h3>
                    <p className="text-sm text-gray-500">Get AI insights on content performance</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}