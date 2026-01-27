import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import {
  Play,
  Bot,
  PersonStanding,
  Mic,
  Volume2,
  Eye,
  Camera,
  Layers,
  Sparkles,
  Globe,
  Languages,
  Brain,
  MessageCircle,
  Monitor,
  Smartphone,
  Tablet,
  User,
  Settings,
  Palette,
  Gamepad2,
  Box,
  Cpu,
  Wifi,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Clock,
  Heart,
  Target,
  Zap,
  Star,
  Trophy,
  Headphones,
  Video,
  Image,
  Music,
  FileText,
  Code,
  Database,
  Shield,
  Lock,
  Key,
  Loader2,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';

// AVA Assistant Configuration
interface AVAConfig {
  name: string;
  personality: string;
  attire: 'traditional' | 'modern' | 'festive';
  languages: string[];
  voiceEnabled: boolean;
  vrSupport: boolean;
  arSupport: boolean;
  motionDetection: boolean;
  lipSync: boolean;
  emotionSync: boolean;
  unityPlugin: boolean;
  realTimeGemini: boolean;
}

interface DemoFeature {
  id: string;
  name: string;
  description: string;
  status: 'ready' | 'demo' | 'building';
  progress: number;
  icon: any;
  color: string;
  features: string[];
}

export default function WizPlay() {
  const [activeDemo, setActiveDemo] = useState('ava');
  const [avaConfig, setAVAConfig] = useState<AVAConfig>({
    name: 'AVA',
    personality: 'friendly-cultural',
    attire: 'traditional',
    languages: ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati'],
    voiceEnabled: true,
    vrSupport: true,
    arSupport: true,
    motionDetection: true,
    lipSync: true,
    emotionSync: true,
    unityPlugin: true,
    realTimeGemini: true
  });
  
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [voiceInput, setVoiceInput] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('Hindi');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Demo features configuration
  const demoFeatures: DemoFeature[] = [
    {
      id: 'ava',
      name: 'AVA - 3D Indian AI Assistant',
      description: 'Meet AVA, your cultural AI companion with traditional Indian attire, multilingual support, and immersive VR/AR capabilities powered by Unity and Google Gemini real-time API.',
      status: 'ready',
      progress: 100,
      icon: PersonStanding,
      color: 'from-orange-500 to-red-500',
      features: ['Traditional Indian Attire', 'Auto Language Detection', 'Real-time Gemini API', 'Unity VR/AR/XR', 'Motion & Lip Sync', 'Voice in 7+ Indian Languages']
    },
    {
      id: 'echomimic',
      name: 'EchoMimic V2 Demo',
      description: 'Experience ultra-precise lip-sync technology with emotion synchronization, cultural gestures, and sub-50ms latency for realistic avatar interactions.',
      status: 'demo',
      progress: 95,
      icon: Volume2,
      color: 'from-blue-500 to-cyan-500',
      features: ['Ultra-precise Lip Sync', 'Hindi Retroflex Support', 'Emotion Sync', '<50ms Latency', 'Cultural Gestures', 'Real-time Audio Processing']
    },
    {
      id: 'chatdollkit',
      name: 'ChatDollKit Unity Integration',
      description: 'Comprehensive Unity SDK integration with VRM models, wake word detection, cultural gestures, and immersive 3D interactions.',
      status: 'demo',
      progress: 95,
      icon: Bot,
      color: 'from-green-500 to-emerald-500',
      features: ['Unity SDK Integration', 'VRM Cultural Models', 'Wake Word Detection', 'Namaste Gestures', 'Spatial Interaction', 'WebXR Support']
    },
    {
      id: 'gamestudio',
      name: 'WAI Game Studio 3D Demo',
      description: 'Interactive 3D game creation using our WAI platform with AI-generated assets, real-time building, and immersive gameplay.',
      status: 'demo',
      progress: 90,
      icon: Gamepad2,
      color: 'from-purple-500 to-pink-500',
      features: ['3D Game Creation', 'AI Asset Generation', 'Real-time Building', 'WAI Platform Integration', 'Therapeutic Games', 'Multiplayer Support']
    }
  ];

  // Initialize AVA Demo
  const initializeAVAMutation = useMutation({
    mutationFn: async (config: AVAConfig) => {
      return apiRequest('/api/wiz-play/ava/initialize', {
        method: 'POST',
        body: JSON.stringify(config)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "AVA Initialized",
        description: "3D Indian AI Assistant is ready for interaction!"
      });
      setIsDemoRunning(true);
    },
    onError: (error: any) => {
      toast({
        title: "Initialization Failed",
        description: error.message || "Failed to initialize AVA",
        variant: "destructive"
      });
    }
  });

  // Send message to AVA
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; language?: string; voice?: boolean }) => {
      return apiRequest('/api/wiz-play/ava/message', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      if (data.audio && audioRef.current) {
        audioRef.current.src = data.audio;
        audioRef.current.play();
      }
      setCurrentMessage('');
    }
  });

  // Start demo mutation
  const startDemoMutation = useMutation({
    mutationFn: async (demoType: string) => {
      return apiRequest(`/api/wiz-play/${demoType}/start`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      setIsDemoRunning(true);
      setDemoProgress(0);
      
      // Simulate demo progress
      const progressInterval = setInterval(() => {
        setDemoProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsDemoRunning(false);
            toast({
              title: "Demo Complete",
              description: "Demo finished successfully!"
            });
            return 100;
          }
          return prev + 10;
        });
      }, 500);
    }
  });

  // Voice recognition simulation
  const startVoiceInput = () => {
    setVoiceInput(true);
    // Simulate voice recognition
    setTimeout(() => {
      setVoiceInput(false);
      setDetectedLanguage('Hindi');
      setCurrentMessage('नमस्ते AVA, आप कैसे हैं?');
    }, 3000);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    sendMessageMutation.mutate({
      message: currentMessage,
      language: detectedLanguage,
      voice: avaConfig.voiceEnabled
    });
  };

  const handleStartDemo = (demoId: string) => {
    if (demoId === 'ava') {
      initializeAVAMutation.mutate(avaConfig);
    } else {
      startDemoMutation.mutate(demoId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
              WIZ play - Interactive AI Demos
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-6">
              Experience cutting-edge AI technologies with AVA, EchoMimic, ChatDollKit, and our Game Studio
            </p>
            
            {/* Status Bar */}
            <div className="flex justify-center items-center gap-4 mb-8">
              <Badge className="bg-green-500 text-white">
                <Zap className="w-4 h-4 mr-1" />
                All Systems Online
              </Badge>
              <Badge variant="outline">
                <Globe className="w-4 h-4 mr-1" />
                Real-time APIs Active
              </Badge>
              <Badge variant="outline">
                <Brain className="w-4 h-4 mr-1" />
                AI Models Loaded
              </Badge>
            </div>
          </motion.div>
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {demoFeatures.map((demo, index) => (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => setActiveDemo(demo.id)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${demo.color}`}>
                        <demo.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{demo.name}</CardTitle>
                        <Badge variant={demo.status === 'ready' ? 'default' : 'secondary'}>
                          {demo.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{demo.progress}%</div>
                      <div className="text-sm text-slate-500">Complete</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {demo.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {demo.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartDemo(demo.id);
                      }}
                      disabled={isDemoRunning}
                      className={`flex-1 bg-gradient-to-r ${demo.color} text-white`}
                    >
                      {isDemoRunning && activeDemo === demo.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {isDemoRunning && activeDemo === demo.id ? 'Running...' : 'Start Demo'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Active Demo Interface */}
        <AnimatePresence>
          {activeDemo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    {demoFeatures.find(d => d.id === activeDemo)?.name} - Live Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isDemoRunning && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Demo Progress</span>
                        <span className="text-sm text-slate-500">{demoProgress}%</span>
                      </div>
                      <Progress value={demoProgress} className="w-full" />
                    </div>
                  )}

                  {/* AVA Demo Interface */}
                  {activeDemo === 'ava' && (
                    <div className="space-y-6">
                      {/* AVA Avatar Display */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6 text-center">
                          <div className="w-32 h-32 mx-auto bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
                            <PersonStanding className="w-16 h-16 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">AVA</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            3D Indian AI Assistant with traditional attire
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            <Badge variant="outline">Unity 3D</Badge>
                            <Badge variant="outline">VR/AR Ready</Badge>
                            <Badge variant="outline">Voice Enabled</Badge>
                            <Badge variant="outline">Multilingual</Badge>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Detected Language</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Languages className="w-4 h-4 text-green-500" />
                              <span className="font-medium">{detectedLanguage}</span>
                              <Badge variant="outline" className="text-xs">Auto-detected</Badge>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Active Features</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {[
                                { name: 'Voice Input', active: avaConfig.voiceEnabled, icon: Mic },
                                { name: 'VR Support', active: avaConfig.vrSupport, icon: Eye },
                                { name: 'Motion Sync', active: avaConfig.motionDetection, icon: PersonStanding },
                                { name: 'Lip Sync', active: avaConfig.lipSync, icon: Volume2 },
                                { name: 'AR Mode', active: avaConfig.arSupport, icon: Camera },
                                { name: 'Unity Plugin', active: avaConfig.unityPlugin, icon: Box }
                              ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 rounded border">
                                  <feature.icon className={`w-4 h-4 ${feature.active ? 'text-green-500' : 'text-gray-400'}`} />
                                  <span className="text-sm">{feature.name}</span>
                                  {feature.active && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Chat Interface */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <MessageCircle className="w-5 h-5" />
                          <span className="font-medium">Chat with AVA</span>
                          <Badge variant="outline" className="text-xs">Real-time Gemini API</Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            placeholder="Type your message in any Indian language..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1"
                          />
                          <Button
                            onClick={startVoiceInput}
                            disabled={voiceInput}
                            variant="outline"
                            size="icon"
                          >
                            {voiceInput ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </Button>
                          <Button onClick={handleSendMessage} disabled={!currentMessage.trim()}>
                            Send
                          </Button>
                        </div>
                        
                        {voiceInput && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
                            🎤 Listening... Speak in any Indian language
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* EchoMimic Demo */}
                  {activeDemo === 'echomimic' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-semibold mb-4">EchoMimic V2 Features</h3>
                          <div className="space-y-3">
                            {[
                              { feature: 'Ultra-precise Lip Sync', value: '99.2%', icon: Volume2 },
                              { feature: 'Hindi Retroflex Support', value: 'Active', icon: Languages },
                              { feature: 'Emotion Synchronization', value: 'Real-time', icon: Heart },
                              { feature: 'Processing Latency', value: '<50ms', icon: Zap },
                              { feature: 'Cultural Gestures', value: 'Enabled', icon: PersonStanding },
                              { feature: 'Audio Quality', value: '48kHz', icon: Headphones }
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded border">
                                <div className="flex items-center gap-2">
                                  <item.icon className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm">{item.feature}</span>
                                </div>
                                <Badge variant="outline">{item.value}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="text-center p-6 border rounded-lg">
                            <Volume2 className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                            <h4 className="font-semibold mb-2">Live Audio Processing</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                              Watch real-time lip synchronization with Hindi retroflex consonants
                            </p>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              <Play className="w-4 h-4 mr-2" />
                              Start Audio Demo
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ChatDollKit Demo */}
                  {activeDemo === 'chatdollkit' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-semibold mb-4">Unity SDK Integration</h3>
                          <div className="space-y-3">
                            {[
                              'Unity SDK v2.1 Integrated',
                              'VRM Cultural Models Loaded',
                              'Wake Word Detection Active',
                              'Namaste Gesture Recognition',
                              'Spatial Interaction Enabled',
                              'WebXR Support Ready'
                            ].map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="text-center p-6 border rounded-lg">
                            <Bot className="w-16 h-16 mx-auto text-green-600 mb-4" />
                            <h4 className="font-semibold mb-2">Unity 3D Integration</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                              Experience immersive 3D interactions with cultural accuracy
                            </p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                VR Mode
                              </Button>
                              <Button variant="outline" size="sm">
                                <Camera className="w-4 h-4 mr-1" />
                                AR Mode
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Game Studio Demo */}
                  {activeDemo === 'gamestudio' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-semibold mb-4">WAI Game Studio</h3>
                          <div className="space-y-3">
                            {[
                              { name: '3D Environment', status: 'Generated' },
                              { name: 'Character Models', status: 'AI Created' },
                              { name: 'Game Physics', status: 'Active' },
                              { name: 'Sound Effects', status: 'Synthesized' },
                              { name: 'Multiplayer Support', status: 'Ready' },
                              { name: 'Analytics Tracking', status: 'Enabled' }
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded border">
                                <span className="text-sm">{item.name}</span>
                                <Badge variant="outline" className="text-xs">{item.status}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="text-center p-6 border rounded-lg">
                            <Gamepad2 className="w-16 h-16 mx-auto text-purple-600 mb-4" />
                            <h4 className="font-semibold mb-2">Interactive 3D Game</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                              Experience our AI-generated therapeutic game with real-time building
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm">
                                <Play className="w-4 h-4 mr-1" />
                                Play Demo
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4 mr-1" />
                                Edit Game
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trophy className="w-4 h-4 mr-1" />
                                Leaderboard
                              </Button>
                              <Button variant="outline" size="sm">
                                <Target className="w-4 h-4 mr-1" />
                                Analytics
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              WIZ play Demo Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Demo Runs', value: '1,247', icon: Play, color: 'text-blue-600' },
                { label: 'Average Rating', value: '4.9/5', icon: Star, color: 'text-yellow-600' },
                { label: 'Languages Tested', value: '15+', icon: Languages, color: 'text-green-600' },
                { label: 'Response Time', value: '<50ms', icon: Zap, color: 'text-purple-600' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center p-4 border rounded-lg">
                  <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hidden audio element for AVA voice responses */}
        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}