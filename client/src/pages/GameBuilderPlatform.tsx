/**
 * Game Builder Platform - Production Ready Game Development
 * 
 * AI-assisted game creation with asset generation and multiplayer support
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Gamepad2, 
  Palette, 
  Volume2, 
  Zap,
  Users,
  Trophy,
  Play,
  Settings,
  Download,
  Share2,
  Code,
  Layers
} from 'lucide-react';

interface GameProject {
  id: string;
  title: string;
  description: string;
  genre: string[];
  platform: string[];
  status: 'concept' | 'development' | 'testing' | 'published';
  progress: number;
  assets: {
    sprites: number;
    sounds: number;
    music: number;
    scripts: number;
  };
  team: number;
  playtesters: number;
  rating: number;
  lastModified: string;
}

const GameBuilderPlatform: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameType, setGameType] = useState('all');
  const queryClient = useQueryClient();

  const { data: games, isLoading } = useQuery({
    queryKey: ['/api/game-builder/games'],
    refetchInterval: 10000,
  });

  const { data: platformMetrics } = useQuery({
    queryKey: ['/api/game-builder/metrics'],
    refetchInterval: 30000,
  });

  const createGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await fetch('/api/game-builder/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-builder/games'] });
    },
  });

  const handleCreateGame = () => {
    const gameData = {
      title: 'New Game Project',
      description: 'AI-assisted game with dynamic content generation',
      genre: ['adventure', 'puzzle'],
      platform: ['web', 'mobile'],
      gameType: 'indie'
    };
    createGameMutation.mutate(gameData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    concept: 'bg-yellow-500',
    development: 'bg-blue-500',
    testing: 'bg-purple-500',
    published: 'bg-green-500'
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Game Builder</h1>
          <p className="text-gray-600">AI-powered game development and asset creation</p>
        </div>
        <div className="flex space-x-4">
          <Button onClick={handleCreateGame} className="flex items-center space-x-2">
            <Gamepad2 className="w-4 h-4" />
            <span>New Game</span>
          </Button>
          <Button variant="outline">
            <Palette className="w-4 h-4 mr-2" />
            Asset Store
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Games</p>
                <p className="text-2xl font-bold">{Array.isArray(games) ? games.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Players</p>
                <p className="text-2xl font-bold">{(platformMetrics as any)?.totalPlayers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{(platformMetrics as any)?.avgRating || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Assets Created</p>
                <p className="text-2xl font-bold">{(platformMetrics as any)?.totalAssets || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Type Filter */}
      <Tabs value={gameType} onValueChange={setGameType} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Games</TabsTrigger>
          <TabsTrigger value="indie">Indie</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="web">Web</TabsTrigger>
          <TabsTrigger value="vr">VR/AR</TabsTrigger>
          <TabsTrigger value="multiplayer">Multiplayer</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Game Project Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.isArray(games) ? games.map((game: GameProject) => (
          <Card key={game.id} className="group hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${statusColors[game.status]} text-white`}>
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{game.title}</CardTitle>
                    <Badge variant="outline">{game.status}</Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="text-sm">
                {game.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Genre & Platform */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {game.genre?.map((g) => (
                    <Badge key={g} variant="secondary" className="text-xs">
                      {g}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {game.platform?.map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Development</span>
                  <span>{game.progress}%</span>
                </div>
                <Progress value={game.progress} className="h-2" />
              </div>

              {/* Assets */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Palette className="w-3 h-3 text-blue-600" />
                  <span>{game.assets?.sprites || 0} Sprites</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Volume2 className="w-3 h-3 text-green-600" />
                  <span>{game.assets?.sounds || 0} Sounds</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Code className="w-3 h-3 text-purple-600" />
                  <span>{game.assets?.scripts || 0} Scripts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-orange-600" />
                  <span>{game.team || 0} Team</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-1">
                  <Trophy className="w-3 h-3 text-yellow-600" />
                  <span>Rating: {game.rating || 0}/5</span>
                </span>
                <span>{game.playtesters || 0} testers</span>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-2">
                <Button asChild className="w-full" size="sm">
                  <Link to={`/game-builder/game/${game.id}`}>
                    Open Game
                  </Link>
                </Button>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm">
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : []}
      </div>

      {/* Game Development Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>AI Game Development Tools</span>
          </CardTitle>
          <CardDescription>
            Professional game creation with AI assistance and asset generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <Palette className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <p className="font-medium">Asset Generator</p>
                <p className="text-sm text-gray-600">Sprites, textures, models</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <Volume2 className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <p className="font-medium">Audio Studio</p>
                <p className="text-sm text-gray-600">Music and sound effects</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <Code className="w-8 h-8 text-purple-600" />
              <div className="text-center">
                <p className="font-medium">Logic Builder</p>
                <p className="text-sm text-gray-600">Visual scripting system</p>
              </div>
            </Button>
            
            <Button variant="outline" className="p-6 h-auto flex-col space-y-2">
              <Users className="w-8 h-8 text-orange-600" />
              <div className="text-center">
                <p className="font-medium">Multiplayer</p>
                <p className="text-sm text-gray-600">Networking & matchmaking</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameBuilderPlatform;