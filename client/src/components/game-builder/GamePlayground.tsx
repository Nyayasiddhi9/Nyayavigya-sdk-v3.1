import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Share,
  Download,
  Code,
  Heart,
  Star,
  MessageCircle,
  Trophy,
  Users
} from 'lucide-react';

interface GamePlaygroundProps {
  gameId: number;
  gameName: string;
  gameUrl?: string;
  embedCode?: string;
  shareUrl?: string;
  category: string;
}

export function GamePlayground({ 
  gameId, 
  gameName, 
  gameUrl, 
  embedCode, 
  shareUrl, 
  category 
}: GamePlaygroundProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [likes, setLikes] = useState(342);
  const [comments, setComments] = useState(28);
  const [hasLiked, setHasLiked] = useState(false);
  const gameFrameRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // Simulate game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayTime(prev => prev + 1);
        // Simulate score increase
        if (Math.random() > 0.8) {
          setGameScore(prev => prev + Math.floor(Math.random() * 10) + 1);
        }
        // Simulate level up
        if (playTime > 0 && playTime % 60 === 0) {
          setPlayerLevel(prev => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playTime]);

  const handlePlay = () => {
    setIsPlaying(true);
    toast({
      title: "Game Started",
      description: `Playing ${gameName} - Good luck!`,
    });
  };

  const handlePause = () => {
    setIsPlaying(false);
    toast({
      title: "Game Paused",
      description: "Game progress has been saved.",
    });
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setGameScore(0);
    setPlayTime(0);
    setPlayerLevel(1);
    toast({
      title: "Game Restarted",
      description: "Starting fresh game session.",
    });
  };

  const handleLike = () => {
    if (hasLiked) {
      setLikes(prev => prev - 1);
      setHasLiked(false);
      toast({
        title: "Like Removed",
        description: "Thanks for your feedback!",
      });
    } else {
      setLikes(prev => prev + 1);
      setHasLiked(true);
      toast({
        title: "Game Liked!",
        description: "Thank you for supporting this game!",
      });
    }
  };

  const handleShare = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Share Link Copied",
        description: "Game link copied to clipboard!",
      });
    }
  };

  const handleEmbed = () => {
    if (embedCode) {
      navigator.clipboard.writeText(embedCode);
      toast({
        title: "Embed Code Copied",
        description: "HTML embed code copied to clipboard!",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'mental-health': return 'bg-green-100 text-green-800 border-green-200';
      case 'kids': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'seniors': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'casual': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{gameName}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <Badge className={getCategoryColor(category)}>
                  {category.replace('-', ' ')}
                </Badge>
                <span className="text-sm text-gray-600">
                  Level {playerLevel} • Score: {gameScore.toLocaleString()}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{likes}</div>
                <div className="text-xs text-gray-600">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{comments}</div>
                <div className="text-xs text-gray-600">Comments</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Game Viewport */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 aspect-video">
            {/* Game Simulation Canvas */}
            <div className="absolute inset-0 flex items-center justify-center">
              {gameUrl ? (
                <iframe
                  ref={gameFrameRef}
                  src={gameUrl}
                  className="w-full h-full border-0"
                  title={gameName}
                />
              ) : (
                <div className="text-center text-white">
                  <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-sm">
                    <Play className="h-16 w-16" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{gameName}</h3>
                  <p className="text-white/80 mb-4">
                    {category === 'mental-health' ? 'Therapeutic Gaming Experience' :
                     category === 'kids' ? 'Educational Fun for Kids' :
                     category === 'seniors' ? 'Gentle Brain Training' :
                     'Casual Gaming Fun'}
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-bold">Time</div>
                      <div>{formatTime(playTime)}</div>
                    </div>
                    <div>
                      <div className="font-bold">Score</div>
                      <div>{gameScore}</div>
                    </div>
                    <div>
                      <div className="font-bold">Level</div>
                      <div>{playerLevel}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Game Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!isPlaying ? (
                      <Button size="sm" onClick={handlePlay} className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handlePause} className="bg-yellow-600 hover:bg-yellow-700">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline" onClick={handleRestart}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restart
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleLike}
                      className={hasLiked ? 'bg-red-600 text-white hover:bg-red-700' : ''}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${hasLiked ? 'fill-current' : ''}`} />
                      {likes}
                    </Button>

                    <Button size="sm" variant="outline" onClick={handleShare}>
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>

                    <Button size="sm" variant="outline" onClick={handleEmbed}>
                      <Code className="h-4 w-4 mr-1" />
                      Embed
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar for Therapeutic Games */}
                {category === 'mental-health' && isPlaying && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-white mb-1">
                      <span>Stress Relief Progress</span>
                      <span>{Math.min(playTime * 2, 100)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(playTime * 2, 100)} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Stats and Social */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Game Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Play Time</span>
              <span className="font-medium">{formatTime(playTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Score</span>
              <span className="font-medium">{gameScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Level Reached</span>
              <span className="font-medium">{playerLevel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completion</span>
              <span className="font-medium">{Math.min(Math.floor(playTime / 3), 100)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { rank: 1, name: 'Alex M.', score: 15420, you: false },
                { rank: 2, name: 'Sarah K.', score: 14280, you: false },
                { rank: 3, name: 'You', score: gameScore, you: true },
                { rank: 4, name: 'Mike R.', score: 12150, you: false },
                { rank: 5, name: 'Emma L.', score: 11890, you: false },
              ].map((player) => (
                <div 
                  key={player.rank}
                  className={`flex items-center justify-between p-2 rounded ${
                    player.you ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      player.rank === 1 ? 'bg-yellow-500 text-white' :
                      player.rank === 2 ? 'bg-gray-400 text-white' :
                      player.rank === 3 ? 'bg-orange-500 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {player.rank}
                    </div>
                    <span className={`text-sm ${player.you ? 'font-medium text-blue-700' : ''}`}>
                      {player.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {player.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Recent Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                    J
                  </div>
                  <span className="text-sm font-medium">Jordan P.</span>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <p className="text-sm text-gray-700">
                  "Really helpful for managing anxiety. Love the calming colors!"
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="ghost" className="h-6 px-2">
                    <Heart className="h-3 w-3 mr-1" />
                    5
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                    M
                  </div>
                  <span className="text-sm font-medium">Maria S.</span>
                  <span className="text-xs text-gray-500">5h ago</span>
                </div>
                <p className="text-sm text-gray-700">
                  "Perfect difficulty level. My kids love this game!"
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="ghost" className="h-6 px-2">
                    <Heart className="h-3 w-3 mr-1" />
                    12
                  </Button>
                </div>
              </div>

              <Button size="sm" variant="outline" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}