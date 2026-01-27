import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bot, Send, Mic, MicOff, Volume2, VolumeX, User, 
  Pause, Play, Settings, Languages, 
  MessageSquare, Video, Box
} from 'lucide-react';
import ChatDollKit3DAvatar from '@/components/ChatDollKit3DAvatar';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
}

interface AssistantInfo {
  id: string;
  name: string;
  description: string;
  avatarStyle: string;
  modelUrl: string;
  voiceConfig: {
    provider: string;
    voiceId: string;
    language: string;
    accent: string;
  };
  capabilities: string[];
}

export default function DynamicAssistantDemo() {
  const [match, params] = useRoute('/demo/:assistantId');
  const assistantId = params?.assistantId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [interactionType, setInteractionType] = useState<'text' | 'voice' | '3d' | 'ar' | 'vr'>('text');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [unityAvatarEnabled, setUnityAvatarEnabled] = useState(true);
  const [isLipSyncActive, setIsLipSyncActive] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarRef = useRef<any>(null);
  const lipSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load assistant info
  const { data: assistantInfo, isLoading: infoLoading, error: infoError } = useQuery({
    queryKey: [`/api/demos/${assistantId}/info`],
    queryFn: () => apiRequest(`/api/demos/${assistantId}/info`),
    enabled: !!assistantId,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false, // Prevent refetch when switching tabs
    refetchOnMount: false, // Prevent refetch on component remount
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debug logging
  React.useEffect(() => {
    console.log('Demo Debug Info:', {
      assistantId,
      isLoading: infoLoading,
      hasData: !!assistantInfo,
      error: infoError,
      data: assistantInfo
    });
  }, [assistantId, infoLoading, assistantInfo, infoError]);

  // Text chat mutation
  const textChatMutation = useMutation({
    mutationFn: async ({ message, language }: { message: string; language: string }) => {
      return apiRequest(`/api/demos/${assistantId}/chat/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language })
      });
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        language: data.language
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Chat Error",
        description: error?.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Voice chat mutation
  const voiceChatMutation = useMutation({
    mutationFn: async ({ audioData, language }: { audioData: string; language: string }) => {
      return apiRequest(`/api/demos/${assistantId}/chat/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData, language })
      });
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        language: data.language
      };

      setMessages(prev => [...prev, assistantMessage]);
      setVoiceState('idle');
    },
    onError: (error: any) => {
      setVoiceState('idle');
      toast({
        title: "Voice Chat Error",
        description: error?.message || "Failed to process voice message.",
        variant: "destructive",
      });
    }
  });

  // 3D interaction mutation
  const interaction3DMutation = useMutation({
    mutationFn: async ({ message, interactionType, language }: { 
      message: string; 
      interactionType: string; 
      language: string 
    }) => {
      return apiRequest(`/api/demos/${assistantId}/chat/3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, interactionType, language })
      });
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        language: data.language
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "3D Interaction Error",
        description: error?.message || "Failed to process 3D interaction.",
        variant: "destructive",
      });
    }
  });

  // Handle sending messages
  const handleSendMessage = useCallback(() => {
    if (!currentMessage.trim()) return;

    // Add user message immediately for better UX
    const userMessage: ChatMessage = {
      id: Date.now().toString() + '_user',
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMessage]);

    // Send to appropriate endpoint based on interaction type
    if (['3d', 'ar', 'vr'].includes(interactionType)) {
      interaction3DMutation.mutate({
        message: currentMessage,
        interactionType,
        language: selectedLanguage
      });
    } else {
      textChatMutation.mutate({
        message: currentMessage,
        language: selectedLanguage
      });
    }
  }, [currentMessage, selectedLanguage, interactionType, textChatMutation, interaction3DMutation]);

  // Voice recording functions
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64AudioMessage = reader.result as string;
          voiceChatMutation.mutate({
            audioData: base64AudioMessage,
            language: selectedLanguage
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setVoiceState('listening');
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [selectedLanguage, voiceChatMutation, toast]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && voiceState === 'listening') {
      mediaRecorderRef.current.stop();
      setVoiceState('processing');
    }
  }, [voiceState]);

  // Avatar configuration
  const avatarConfig = useMemo(() => {
    if (!assistantInfo) return null;

    return {
      model: assistantInfo.modelUrl,
      modelFormat: 'glb' as const,
      appearance: {
        gender: 'female' as const,
        style: assistantInfo.avatarStyle || 'professional'
      },
      ai_brain: {
        provider: 'kimi_k2' as const,
        personality: 'professional'
      },
      voice_synthesis: {
        provider: assistantInfo.voiceConfig.provider || 'elevenlabs',
        voice_id: assistantInfo.voiceConfig.voiceId || 'professional_female_warm',
        language: assistantInfo.voiceConfig.language || 'en-US'
      },
      behaviors: {
        natural_breathing: true,
        realistic_blinking: true,
        micro_expressions: true,
        eye_tracking: true,
        lip_sync: true
      }
    };
  }, [assistantInfo]);

  // Memoized interaction data for avatar
  const memoizedInteractionData = useMemo(() => ({
    lastMessage: messages[messages.length - 1]?.content || '',
    isResponding: textChatMutation.isPending || voiceChatMutation.isPending || interaction3DMutation.isPending,
    selectedLanguage,
    interactionType
  }), [messages, textChatMutation.isPending, voiceChatMutation.isPending, interaction3DMutation.isPending, selectedLanguage, interactionType]);

  // Avatar event handlers
  const handleAvatarReady = useCallback(() => {
    console.log('🎭 Dynamic Avatar ready for', assistantInfo?.name);
  }, [assistantInfo?.name]);

  const handleAnimationChange = useCallback((animation: string) => {
    console.log('🎬 Animation changed:', animation);
  }, []);

  const handleEmotionChange = useCallback((emotion: string) => {
    console.log('😊 Emotion changed:', emotion);
  }, []);

  const handleGestureComplete = useCallback((gesture: string) => {
    console.log('👋 Gesture completed:', gesture);
  }, []);

  // Loading state - only show on initial load
  if (infoLoading && !assistantInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <p>Loading Assistant Demo...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (infoError || !assistantInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">Assistant not found or failed to load</p>
        </div>
      </div>
    );
  }

  // Render the demo interface (similar to AVA Demo but using dynamic endpoints)
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-500" />
            {assistantInfo.name} - AI Assistant Demo
          </CardTitle>
          <CardDescription>
            {assistantInfo.description}
          </CardDescription>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {assistantInfo.capabilities.map((capability: string) => (
              <Badge key={capability} variant="secondary">
                {capability}
              </Badge>
            ))}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interaction Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chat with {assistantInfo.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="language">Language:</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                      <SelectItem value="fr-FR">Français</SelectItem>
                      <SelectItem value="de-DE">Deutsch</SelectItem>
                      <SelectItem value="ja-JP">日本語</SelectItem>
                      <SelectItem value="zh-CN">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={interactionType} onValueChange={(value: any) => setInteractionType(value)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="voice">Voice</TabsTrigger>
                  <TabsTrigger value="3d">3D</TabsTrigger>
                  <TabsTrigger value="ar">AR</TabsTrigger>
                  <TabsTrigger value="vr">VR</TabsTrigger>
                </TabsList>

                {/* Text Chat Tab */}
                <TabsContent value="text">
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Chat Messages */}
                    <ScrollArea className="h-[400px] border rounded-lg p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, x: message.type === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                              message.type === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              <div className="flex items-start gap-2">
                                {message.type === 'assistant' && (
                                  <Bot className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  {message.type === 'assistant' && (
                                    <p className="text-xs font-medium text-blue-700 mb-1">{assistantInfo.name}</p>
                                  )}
                                  <p className="text-sm">{message.content}</p>
                                  <p className="text-xs opacity-70 mt-1">
                                    {message.timestamp.toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        
                        {/* Show typing indicator when processing */}
                        {textChatMutation.isPending && (
                          <motion.div 
                            className="flex justify-start"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="bg-white border p-3 rounded-lg max-w-[80%]">
                              <div className="flex items-start gap-2">
                                <Bot className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-blue-700 mb-1">{assistantInfo.name}</p>
                                  <div className="flex items-center gap-1">
                                    <motion.div 
                                      className="w-2 h-2 bg-gray-400 rounded-full"
                                      animate={{ opacity: [0.4, 1, 0.4] }}
                                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                    />
                                    <motion.div 
                                      className="w-2 h-2 bg-gray-400 rounded-full"
                                      animate={{ opacity: [0.4, 1, 0.4] }}
                                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                    />
                                    <motion.div 
                                      className="w-2 h-2 bg-gray-400 rounded-full"
                                      animate={{ opacity: [0.4, 1, 0.4] }}
                                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Textarea
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder={`Ask ${assistantInfo.name} anything...`}
                        className="flex-1 min-h-[50px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={textChatMutation.isPending || !currentMessage.trim()}
                        size="lg"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Voice Chat Tab */}
                <TabsContent value="voice">
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Voice Chat with {assistantInfo.name}</h3>
                        <p className="text-muted-foreground">
                          Click the microphone to start speaking with your assistant
                        </p>
                      </div>

                      {/* Voice Status */}
                      <div className="flex justify-center">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                          voiceState === 'listening' 
                            ? 'bg-red-100 animate-pulse' 
                            : voiceState === 'processing'
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                        }`}>
                          <Button
                            variant="ghost"
                            size="lg"
                            onClick={voiceState === 'listening' ? stopListening : startListening}
                            disabled={voiceChatMutation.isPending}
                            className="w-20 h-20 rounded-full"
                          >
                            {voiceState === 'listening' ? (
                              <MicOff className="h-8 w-8 text-red-600" />
                            ) : voiceState === 'processing' ? (
                              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                            ) : (
                              <Mic className="h-8 w-8 text-gray-600" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Voice Status Text */}
                      <div className="text-center">
                        {voiceState === 'listening' && (
                          <p className="text-red-600 font-medium">Listening... Speak now</p>
                        )}
                        {voiceState === 'processing' && (
                          <p className="text-blue-600 font-medium">Processing your voice...</p>
                        )}
                        {voiceState === 'idle' && (
                          <p className="text-gray-600">Ready to listen</p>
                        )}
                      </div>
                    </div>

                    {voiceChatMutation.isPending && (
                      <div className="flex items-center justify-center gap-2">
                        <Bot className="h-4 w-4 animate-pulse" />
                        <span>Processing voice...</span>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                {/* 3D Avatar Tabs */}
                {['3d', 'ar', 'vr'].map((type) => (
                  <TabsContent key={type} value={type} className="space-y-4">
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Premium 3D Avatar Toggle */}
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          <span className="font-medium">Premium 3D Avatar</span>
                        </div>
                        <Button
                          variant={unityAvatarEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUnityAvatarEnabled(!unityAvatarEnabled)}
                        >
                          {unityAvatarEnabled ? 'Enabled' : 'Enable Premium Avatar'}
                        </Button>
                      </div>

                      {/* Premium 3D Avatar Component */}
                      {unityAvatarEnabled && avatarConfig ? (
                        <ChatDollKit3DAvatar 
                          ref={avatarRef}
                          key={`avatar-${type}-${selectedLanguage}`}
                          config={avatarConfig}
                          interactionData={memoizedInteractionData}
                          isLipSyncActive={isLipSyncActive}
                          disableCameraControls={type === '3d'}
                          onAvatarReady={handleAvatarReady}
                          onAnimationChange={handleAnimationChange}
                          onEmotionChange={handleEmotionChange}
                          onGestureComplete={handleGestureComplete}
                        />
                      ) : (
                        <div className="space-y-4">
                          <canvas
                            ref={canvasRef}
                            width={400}
                            height={400}
                            className="border rounded-lg w-full"
                            style={{ maxHeight: '300px' }}
                          />
                          <div className="text-center text-muted-foreground">
                            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Enable premium 3D avatar with intelligent AI for immersive experience</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Message for {type.toUpperCase()} Interaction</Label>
                        <Textarea
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          placeholder={`Ask ${assistantInfo.name} something for ${type.toUpperCase()} experience...`}
                          className="min-h-[80px]"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleSendMessage}
                        disabled={interaction3DMutation.isPending || !currentMessage.trim()}
                        className="w-full"
                      >
                        {interaction3DMutation.isPending ? `Processing ${type.toUpperCase()}...` : `Start ${type.toUpperCase()} Interaction`}
                      </Button>
                    </motion.div>
                  </TabsContent>
                ))}

              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Assistant Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assistant Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Model</span>
                  <span className="text-sm font-medium">{assistantInfo.avatarStyle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Voice</span>
                  <span className="text-sm font-medium">{assistantInfo.voiceConfig.language}</span>
                </div>
                
                {(textChatMutation.isPending || voiceChatMutation.isPending || interaction3DMutation.isPending) && (
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Processing
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Assistant Response History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Chat History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {messages.slice(-5).map((message) => (
                    <div key={message.id} className="text-xs">
                      <div className="flex items-center gap-1">
                        <Badge variant={message.type === 'user' ? 'default' : 'secondary'} className="text-xs">
                          {message.type === 'user' ? 'You' : assistantInfo.name}
                        </Badge>
                        <span className="text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {message.content.length > 50 
                          ? message.content.substring(0, 50) + '...' 
                          : message.content
                        }
                      </p>
                    </div>
                  ))}
                  
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No messages yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          </motion.div>

          {/* Audio Controls - Only visible in Voice mode */}
          {interactionType === 'voice' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Audio Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voice Playback</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <audio ref={audioRef} className="w-full" controls />
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}