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
import { Slider } from '@/components/ui/slider';
import { 
  Gamepad2, Sparkles, Code, Image, Music, Users,
  Trophy, DollarSign, Globe, Wifi, Shield, Zap,
  Play, Pause, Settings, Upload, Download, Save,
  Layers, Box, Palette, Volume2, Target, Star
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import PlatformAdminBar from '@/components/shared/PlatformAdminBar';

interface Game {
  id: string;
  title: string;
  genre: string;
  platform: string[];
  status: 'concept' | 'development' | 'testing' | 'published';
  progress: number;
  assets: {
    models: number;
    textures: number;
    sounds: number;
    scripts: number;
  };
  features: {
    multiplayer: boolean;
    leaderboards: boolean;
    achievements: boolean;
    monetization: boolean;
  };
  metrics?: {
    players: number;
    revenue: number;
    rating: number;
    playtime: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface GameAsset {
  id: string;
  type: 'model' | 'texture' | 'sound' | 'animation' | 'script';
  name: string;
  size: string;
  format: string;
  thumbnail?: string;
  aiGenerated: boolean;
}

export default function GameBuilder() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Enhanced game creation form with multilingual support
  const [gameForm, setGameForm] = useState({
    title: '',
    genre: 'action',
    description: '',
    platform: [] as string[],
    artStyle: 'realistic',
    targetAudience: 'teen',
    multiplayer: false,
    monetization: 'free',
    aiAssistLevel: 50,
    // Enhanced multilingual features
    multiLanguage: false,
    languages: [] as string[],
    sarvamAPIEnabled: false,
    culturalAdaptation: false,
    enhancedOrchestration: true,
    qualityLevel: 'quality' as 'balanced' | 'quality' | 'premium',
    localizedContent: false,
    regionalGameplay: false
  });

  // Asset generation form
  const [assetForm, setAssetForm] = useState({
    type: 'model',
    prompt: '',
    style: 'realistic',
    quantity: 1,
    variation: false
  });

  // Fetch games data
  const { data: games, isLoading, refetch } = useQuery<Game[]>({
    queryKey: ['/api/games'],
    retry: 2
  });

  // Fetch assets
  const { data: assets } = useQuery<GameAsset[]>({
    queryKey: ['/api/games/assets'],
    retry: 2
  });

  // Enhanced game creation with WAI orchestration and SarvamAPI
  const createGame = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/platforms/game/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: data.title,
          description: data.description,
          category: data.genre,
          type: data.platform.includes('vr') ? 'vr' : data.platform.includes('ar') ? 'ar' : '2d',
          targetAudience: data.targetAudience,
          features: [],
          // Enhanced orchestration data
          enhancedOrchestration: data.enhancedOrchestration,
          qualityLevel: data.qualityLevel,
          multiLanguage: data.multiLanguage,
          languages: data.languages,
          sarvamAPIEnabled: data.sarvamAPIEnabled,
          culturalAdaptation: data.culturalAdaptation,
          localizedContent: data.localizedContent,
          regionalGameplay: data.regionalGameplay
        })
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Enhanced Game Project Created',
        description: `${data.project?.name || 'Game'} initialized with WAI orchestration${data.sarvamAPIUsed ? ' and SarvamAPI' : ''}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      setActiveTab('development');
    },
    onError: () => {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create game project. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Generate asset mutation
  const generateAsset = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/games/assets/generate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Asset Generated',
        description: `Successfully generated ${data.type} asset`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games/assets'] });
    }
  });

  const handleCreateGame = () => {
    if (!gameForm.title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title for your game',
        variant: 'destructive'
      });
      return;
    }

    createGame.mutate(gameForm);
  };

  const handleGenerateAsset = () => {
    if (!assetForm.prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please describe the asset you want to generate',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    generateAsset.mutate(assetForm, {
      onSettled: () => setIsGenerating(false)
    });
  };

  const genres = [
    'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
    'Puzzle', 'Racing', 'Sports', 'Fighting', 'Platformer'
  ];

  const platforms = [
    { value: 'web', label: 'Web Browser', icon: Globe },
    { value: 'mobile', label: 'Mobile', icon: Gamepad2 },
    { value: 'desktop', label: 'Desktop', icon: Box },
    { value: 'console', label: 'Console', icon: Gamepad2 },
    { value: 'vr', label: 'VR/AR', icon: Box }
  ];

  return (
    <>
      <PlatformAdminBar platformName="Game Builder" />
      <div className="container max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Gamepad2 className="h-10 w-10 text-green-600" />
            Game Builder Platform
          </h1>
          <p className="text-lg text-muted-foreground">
            AI-Assisted Game Development with Asset Generation & Multiplayer Support
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="create">Create Game</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="assets">Asset Library</TabsTrigger>
          <TabsTrigger value="multiplayer">Multiplayer</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{games?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">All projects</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {games?.filter(g => g.status === 'published').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Live games</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {games?.reduce((sum, g) => sum + (g.metrics?.players || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Active users</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${games?.reduce((sum, g) => sum + (g.metrics?.revenue || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Total earnings</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center">
                    {games?.length ? 
                      (games.reduce((sum, g) => sum + (g.metrics?.rating || 0), 0) / games.length).toFixed(1)
                      : '0.0'}
                    <Star className="h-4 w-4 ml-1 text-yellow-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">User rating</p>
                </CardContent>
              </Card>
            </div>

            {/* Games Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Your Games</CardTitle>
                <CardDescription>Manage your game development projects</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <Gamepad2 className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading games...</p>
                  </div>
                ) : games?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games.map((game) => (
                      <Card key={game.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedGame(game)}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{game.title}</CardTitle>
                              <Badge variant="outline" className="mt-1">{game.genre}</Badge>
                            </div>
                            <Badge variant={game.status === 'published' ? 'default' : 'secondary'}>
                              {game.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Progress */}
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Development Progress</span>
                                <span>{game.progress}%</span>
                              </div>
                              <Progress value={game.progress} />
                            </div>

                            {/* Assets */}
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <Box className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                <span className="text-xs">{game.assets.models}</span>
                              </div>
                              <div>
                                <Image className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                <span className="text-xs">{game.assets.textures}</span>
                              </div>
                              <div>
                                <Volume2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                <span className="text-xs">{game.assets.sounds}</span>
                              </div>
                              <div>
                                <Code className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                <span className="text-xs">{game.assets.scripts}</span>
                              </div>
                            </div>

                            {/* Features */}
                            <div className="flex flex-wrap gap-1">
                              {game.features.multiplayer && (
                                <Badge variant="outline" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  Multiplayer
                                </Badge>
                              )}
                              {game.features.monetization && (
                                <Badge variant="outline" className="text-xs">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Monetized
                                </Badge>
                              )}
                              {game.features.leaderboards && (
                                <Badge variant="outline" className="text-xs">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Leaderboards
                                </Badge>
                              )}
                            </div>

                            {/* Metrics */}
                            {game.metrics && (
                              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <span>{game.metrics.players} players</span>
                                <span>${game.metrics.revenue} revenue</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Games Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start creating your first game with AI assistance
                    </p>
                    <Button onClick={() => setActiveTab('create')}>
                      Create Game
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
              <CardTitle>Create New Game</CardTitle>
              <CardDescription>
                AI-powered game concept generation and project initialization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Game Title</label>
                  <Input
                    placeholder="Enter your game title..."
                    value={gameForm.title}
                    onChange={(e) => setGameForm({...gameForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Genre</label>
                  <Select
                    value={gameForm.genre}
                    onValueChange={(value) => setGameForm({...gameForm, genre: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map(genre => (
                        <SelectItem key={genre.toLowerCase()} value={genre.toLowerCase()}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 block">Game Description</label>
                <Textarea
                  placeholder="Describe your game concept, mechanics, and unique features..."
                  value={gameForm.description}
                  onChange={(e) => setGameForm({...gameForm, description: e.target.value})}
                  className="min-h-[120px]"
                />
              </div>

              {/* Platform Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Target Platforms</label>
                <div className="grid grid-cols-5 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.value}
                      onClick={() => {
                        const updated = gameForm.platform.includes(platform.value)
                          ? gameForm.platform.filter(p => p !== platform.value)
                          : [...gameForm.platform, platform.value];
                        setGameForm({...gameForm, platform: updated});
                      }}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        gameForm.platform.includes(platform.value)
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <platform.icon className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-xs">{platform.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Art Style and Audience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Art Style</label>
                  <Select
                    value={gameForm.artStyle}
                    onValueChange={(value) => setGameForm({...gameForm, artStyle: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="cartoon">Cartoon</SelectItem>
                      <SelectItem value="pixel">Pixel Art</SelectItem>
                      <SelectItem value="low-poly">Low Poly</SelectItem>
                      <SelectItem value="anime">Anime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Audience</label>
                  <Select
                    value={gameForm.targetAudience}
                    onValueChange={(value) => setGameForm({...gameForm, targetAudience: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="teen">Teen</SelectItem>
                      <SelectItem value="mature">Mature</SelectItem>
                      <SelectItem value="kids">Kids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Multiplayer Support</label>
                    <p className="text-sm text-muted-foreground">Enable online multiplayer features</p>
                  </div>
                  <Switch
                    checked={gameForm.multiplayer}
                    onCheckedChange={(checked) => setGameForm({...gameForm, multiplayer: checked})}
                  />
                </div>
              </div>

              {/* AI Assistance Level */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  AI Assistance Level: {gameForm.aiAssistLevel}%
                </label>
                <Slider
                  value={[gameForm.aiAssistLevel]}
                  onValueChange={(value) => setGameForm({...gameForm, aiAssistLevel: value[0]})}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Manual</span>
                  <span>Balanced</span>
                  <span>Full AI</span>
                </div>
              </div>

              {/* Enhanced Multilingual Game Development */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Multilingual Game Support</label>
                    <p className="text-sm text-muted-foreground">Enable multiple language support for your game</p>
                  </div>
                  <Switch
                    checked={gameForm.multiLanguage}
                    onCheckedChange={(checked) => setGameForm({...gameForm, multiLanguage: checked})}
                  />
                </div>

                {/* SarvamAPI Integration for Indian Gaming Market */}
                {gameForm.multiLanguage && (
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-green-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-orange-600" />
                        <label className="text-sm font-medium text-orange-800">SarvamAPI - Indian Gaming Market</label>
                      </div>
                      <Switch
                        checked={gameForm.sarvamAPIEnabled}
                        onCheckedChange={(checked) => setGameForm({...gameForm, sarvamAPIEnabled: checked})}
                      />
                    </div>
                    {gameForm.sarvamAPIEnabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {['Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia'].map((lang) => (
                            <Button
                              key={lang}
                              variant={gameForm.languages.includes(lang) ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                const updatedLanguages = gameForm.languages.includes(lang)
                                  ? gameForm.languages.filter(l => l !== lang)
                                  : [...gameForm.languages, lang];
                                setGameForm({...gameForm, languages: updatedLanguages});
                              }}
                            >
                              {lang}
                            </Button>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-orange-800">Cultural Adaptation</label>
                          <Switch
                            checked={gameForm.culturalAdaptation}
                            onCheckedChange={(checked) => setGameForm({...gameForm, culturalAdaptation: checked})}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-orange-800">Localized Content</label>
                          <Switch
                            checked={gameForm.localizedContent}
                            onCheckedChange={(checked) => setGameForm({...gameForm, localizedContent: checked})}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-orange-800">Regional Gameplay Elements</label>
                          <Switch
                            checked={gameForm.regionalGameplay}
                            onCheckedChange={(checked) => setGameForm({...gameForm, regionalGameplay: checked})}
                          />
                        </div>
                        {gameForm.culturalAdaptation && (
                          <p className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                            Game will include Indian cultural elements, festivals, mythology, and regional preferences.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* WAI Enhanced Orchestration */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <label className="text-sm font-medium text-purple-800">WAI Enhanced Game Development</label>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-purple-800">Enhanced Orchestration Mode</label>
                    <Switch
                      checked={gameForm.enhancedOrchestration}
                      onCheckedChange={(checked) => setGameForm({...gameForm, enhancedOrchestration: checked})}
                    />
                  </div>
                  {gameForm.enhancedOrchestration && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-purple-800">Development Quality Level</label>
                      <Select 
                        value={gameForm.qualityLevel}
                        onValueChange={(value: 'balanced' | 'quality' | 'premium') => 
                          setGameForm({...gameForm, qualityLevel: value})
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balanced">Balanced (Fast development)</SelectItem>
                          <SelectItem value="quality">Quality (Enhanced features)</SelectItem>
                          <SelectItem value="premium">Premium (AAA-grade quality)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
                        Enhanced mode uses AI agents for game design, asset generation, code optimization, and playtesting.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Create Button */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleCreateGame}
                  disabled={createGame.isPending}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {createGame.isPending ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Create Game Project
                    </>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  AI will generate concept art and initial assets
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="development" className="mt-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Visual Editor */}
            <div className="col-span-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Visual Editor</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Test Play
                      </Button>
                      <Button variant="outline" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                    <div className="text-center">
                      <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Visual game editor</p>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop game elements, design levels, and configure gameplay
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tools Panel */}
            <div className="col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Development Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Box className="h-4 w-4 mr-2" />
                    3D Model Editor
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Palette className="h-4 w-4 mr-2" />
                    Texture Editor
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Sound Designer
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Code className="h-4 w-4 mr-2" />
                    Script Editor
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Physics Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Game Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asset Library</CardTitle>
                  <CardDescription>AI-generated and imported game assets</CardDescription>
                </div>
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
              {/* Asset Generation */}
              <div className="mb-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Generate New Asset</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <Input
                      placeholder="Describe the asset you want to generate..."
                      value={assetForm.prompt}
                      onChange={(e) => setAssetForm({...assetForm, prompt: e.target.value})}
                    />
                  </div>
                  <Select
                    value={assetForm.type}
                    onValueChange={(value) => setAssetForm({...assetForm, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="model">3D Model</SelectItem>
                      <SelectItem value="texture">Texture</SelectItem>
                      <SelectItem value="sound">Sound</SelectItem>
                      <SelectItem value="animation">Animation</SelectItem>
                      <SelectItem value="script">Script</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleGenerateAsset}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {assets?.map((asset) => (
                  <Card key={asset.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                        {asset.type === 'model' && <Box className="h-8 w-8 text-muted-foreground" />}
                        {asset.type === 'texture' && <Image className="h-8 w-8 text-muted-foreground" />}
                        {asset.type === 'sound' && <Volume2 className="h-8 w-8 text-muted-foreground" />}
                        {asset.type === 'animation' && <Zap className="h-8 w-8 text-muted-foreground" />}
                        {asset.type === 'script' && <Code className="h-8 w-8 text-muted-foreground" />}
                      </div>
                      <p className="text-xs font-medium truncate">{asset.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{asset.format}</span>
                        {asset.aiGenerated && (
                          <Badge variant="outline" className="text-xs px-1">
                            AI
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multiplayer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Multiplayer Configuration</CardTitle>
              <CardDescription>
                Set up real-time multiplayer networking and matchmaking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Network Settings */}
              <div>
                <h3 className="font-semibold mb-4">Network Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Server Region</label>
                    <Select defaultValue="auto">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-select</SelectItem>
                        <SelectItem value="us-east">US East</SelectItem>
                        <SelectItem value="us-west">US West</SelectItem>
                        <SelectItem value="europe">Europe</SelectItem>
                        <SelectItem value="asia">Asia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Players</label>
                    <Input type="number" defaultValue="16" />
                  </div>
                </div>
              </div>

              {/* Matchmaking */}
              <div>
                <h3 className="font-semibold mb-4">Matchmaking Rules</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Skill-based Matchmaking</label>
                      <p className="text-sm text-muted-foreground">Match players by skill level</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Region Lock</label>
                      <p className="text-sm text-muted-foreground">Restrict to same region</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Cross-platform Play</label>
                      <p className="text-sm text-muted-foreground">Allow different platforms</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div>
                <h3 className="font-semibold mb-4">Connection Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Wifi className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Online</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Server connected</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">0 Players</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Currently online</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">Secure</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Anti-cheat active</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monetization" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monetization Settings</CardTitle>
              <CardDescription>
                Configure revenue models and in-game purchases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Revenue Model */}
              <div>
                <label className="text-sm font-medium mb-3 block">Revenue Model</label>
                <div className="grid grid-cols-4 gap-3">
                  {['Free', 'Premium', 'Freemium', 'Subscription'].map((model) => (
                    <button
                      key={model.toLowerCase()}
                      onClick={() => setGameForm({...gameForm, monetization: model.toLowerCase()})}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        gameForm.monetization === model.toLowerCase()
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <DollarSign className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-xs">{model}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* In-App Purchases */}
              <div>
                <h3 className="font-semibold mb-4">In-App Purchases</h3>
                <div className="space-y-3">
                  {['Premium Currency', 'Character Skins', 'Level Packs', 'Power-ups', 'Ad Removal'].map((item) => (
                    <div key={item} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item}</p>
                        <p className="text-sm text-muted-foreground">Configure pricing and availability</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Analytics */}
              <div>
                <h3 className="font-semibold mb-4">Revenue Analytics</h3>
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Revenue tracking will appear here</p>
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