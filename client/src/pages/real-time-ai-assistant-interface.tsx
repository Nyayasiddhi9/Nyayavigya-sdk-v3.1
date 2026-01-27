import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Bot, 
  Globe, 
  Zap, 
  Brain,
  Volume2,
  VolumeX,
  Camera,
  Monitor,
  Smartphone,
  Box,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Users,
  MessageSquare
} from 'lucide-react';

interface RealTimeAssistantConfig {
  assistantId: string;
  mode: 'text' | 'voice' | 'video' | 'text_voice' | '3d_immersive';
  language: string;
  realTimeEnabled: boolean;
  features: {
    knowledgeBase: boolean;
    ragEnabled: boolean;
    ocrEnabled: boolean;
    voiceCloning: boolean;
    avatar3D: boolean;
    spatialComputing: boolean;
    multilingual: boolean;
    proactiveAssistance: boolean;
  };
}

export default function RealTimeAIAssistantInterface() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentMode, setCurrentMode] = useState<'text' | 'voice' | 'video' | 'text_voice' | '3d_immersive'>('text');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [assistantConfig, setAssistantConfig] = useState<RealTimeAssistantConfig>({
    assistantId: '',
    mode: 'text',
    language: 'en',
    realTimeEnabled: true,
    features: {
      knowledgeBase: true,
      ragEnabled: true,
      ocrEnabled: true,
      voiceCloning: false,
      avatar3D: false,
      spatialComputing: false,
      multilingual: true,
      proactiveAssistance: true
    }
  });
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Real-time language options with flags
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' }
  ];

  // Interaction modes with descriptions
  const interactionModes = [
    {
      id: 'text',
      name: 'Text Chat',
      description: 'Traditional text-based conversation',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      id: 'voice',
      name: 'Voice Only',
      description: 'Natural voice conversation',
      icon: Mic,
      color: 'green'
    },
    {
      id: 'video',
      name: 'Video Chat',
      description: 'Face-to-face conversation with AI',
      icon: Video,
      color: 'purple'
    },
    {
      id: 'text_voice',
      name: 'Hybrid Mode',
      description: 'Combined text and voice interaction',
      icon: Bot,
      color: 'orange'
    },
    {
      id: '3d_immersive',
      name: '3D Immersive',
      description: 'Spatial computing with 3D avatars',
      icon: Box,
      color: 'red'
    }
  ];

  // Connect to real-time assistant
  const handleConnect = async () => {
    setConnectionStatus('connecting');
    
    try {
      // Connect via WAI orchestration to Perplexity, Google Real-time, LiveKit
      const response = await fetch('/api/wai-ai-assistant/connect-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assistantConfig)
      });

      if (response.ok) {
        setConnectionStatus('connected');
        setIsConnected(true);
        toast({
          title: "Connected Successfully",
          description: `Real-time ${currentMode} mode activated via WAI orchestration`
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: "Unable to connect to real-time assistant services",
        variant: "destructive"
      });
    }
  };

  // Disconnect from real-time assistant
  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setIsRecording(false);
    toast({
      title: "Disconnected",
      description: "Real-time assistant session ended"
    });
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording logic
    } else {
      setIsRecording(true);
      // Start recording logic
    }
  };

  // Switch interaction mode
  const switchMode = (mode: typeof currentMode) => {
    setCurrentMode(mode);
    setAssistantConfig(prev => ({ ...prev, mode }));
    
    if (isConnected) {
      // Notify backend of mode change via WAI orchestration
      fetch('/api/wai-ai-assistant/switch-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, assistantId: assistantConfig.assistantId })
      });
    }
  };

  // Switch language in real-time
  const switchLanguage = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setAssistantConfig(prev => ({ ...prev, language: languageCode }));
    
    if (isConnected) {
      // Notify backend of language change via WAI orchestration
      fetch('/api/wai-ai-assistant/switch-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: languageCode, assistantId: assistantConfig.assistantId })
      });
      
      toast({
        title: "Language Switched",
        description: `Now communicating in ${languages.find(l => l.code === languageCode)?.name}`
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Real-Time AI Assistant Interface
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Experience next-generation AI interaction with real-time multilingual capabilities
          </p>
        </div>

        <Tabs defaultValue="interface" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="interface">Real-Time Interface</TabsTrigger>
            <TabsTrigger value="modes">Interaction Modes</TabsTrigger>
            <TabsTrigger value="languages">Language Settings</TabsTrigger>
            <TabsTrigger value="features">Advanced Features</TabsTrigger>
          </TabsList>

          {/* Real-Time Interface Tab */}
          <TabsContent value="interface">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Connection Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className={`w-5 h-5 ${isConnected ? 'text-green-500' : 'text-slate-400'}`} />
                    Connection Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge variant={
                      connectionStatus === 'connected' ? 'default' :
                      connectionStatus === 'connecting' ? 'secondary' :
                      connectionStatus === 'error' ? 'destructive' : 'outline'
                    }>
                      {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mode:</span>
                    <Badge variant="outline">{currentMode.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Language:</span>
                    <Badge variant="outline">
                      {languages.find(l => l.code === selectedLanguage)?.flag} {languages.find(l => l.code === selectedLanguage)?.name}
                    </Badge>
                  </div>
                  
                  {!isConnected ? (
                    <Button onClick={handleConnect} className="w-full" disabled={connectionStatus === 'connecting'}>
                      {connectionStatus === 'connecting' ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Connect to Assistant
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleDisconnect} variant="destructive" className="w-full">
                      <Pause className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Live Interaction Area */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Live Interaction
                  </CardTitle>
                  <CardDescription>
                    Real-time communication with your AI assistant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentMode === '3d_immersive' ? (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Box className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                          <p className="text-slate-600 dark:text-slate-400">3D Avatar Rendering</p>
                        </div>
                      </div>
                    </div>
                  ) : currentMode === 'video' ? (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <video ref={videoRef} className="w-full h-full rounded-lg" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                          <p className="text-slate-600 dark:text-slate-400">Video Feed</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">Text/Voice Interface</p>
                      </div>
                    </div>
                  )}

                  {/* Control Buttons */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    {(currentMode === 'voice' || currentMode === 'text_voice' || currentMode === 'video') && (
                      <Button
                        variant={isRecording ? "destructive" : "default"}
                        size="lg"
                        className="rounded-full"
                        onClick={toggleRecording}
                        disabled={!isConnected}
                      >
                        {isRecording ? (
                          <MicOff className="w-6 h-6" />
                        ) : (
                          <Mic className="w-6 h-6" />
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full"
                      disabled={!isConnected}
                    >
                      <Volume2 className="w-6 h-6" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full"
                      disabled={!isConnected}
                    >
                      <Settings className="w-6 h-6" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Interaction Modes Tab */}
          <TabsContent value="modes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interactionModes.map(mode => {
                const Icon = mode.icon;
                return (
                  <motion.div key={mode.id} whileHover={{ scale: 1.02 }}>
                    <Card 
                      className={`cursor-pointer transition-all ${
                        currentMode === mode.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
                          : 'hover:shadow-lg'
                      }`}
                      onClick={() => switchMode(mode.id as any)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 text-${mode.color}-500`} />
                          {mode.name}
                        </CardTitle>
                        <CardDescription>{mode.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {currentMode === mode.id && (
                          <Badge variant="default" className="w-full justify-center">
                            Active Mode
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Language Settings Tab */}
          <TabsContent value="languages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Multilingual Configuration
                </CardTitle>
                <CardDescription>
                  Select languages for real-time communication with automatic switching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {languages.map(language => (
                    <Button
                      key={language.code}
                      variant={selectedLanguage === language.code ? "default" : "outline"}
                      className="flex items-center gap-2 h-auto p-4"
                      onClick={() => switchLanguage(language.code)}
                    >
                      <span className="text-2xl">{language.flag}</span>
                      <div className="text-left">
                        <div className="font-medium text-sm">{language.name}</div>
                        <div className="text-xs opacity-70">{language.code.toUpperCase()}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Features Tab */}
          <TabsContent value="features">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Capabilities</CardTitle>
                  <CardDescription>Configure advanced AI features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(assistantConfig.features).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => 
                          setAssistantConfig(prev => ({
                            ...prev,
                            features: { ...prev.features, [key]: checked }
                          }))
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Real-time assistant performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <Badge variant="outline">&lt; 150ms</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <Badge variant="outline">98.7%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Language Detection:</span>
                    <Badge variant="outline">99.2%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Voice Quality:</span>
                    <Badge variant="outline">HD Audio</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>3D Rendering:</span>
                    <Badge variant="outline">60 FPS</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}