/**
 * AVA Demo - Comprehensive 3D AI Assistant Demo
 * Features: Text/Voice/Video Chat, 3D Avatar, AR/VR, Multi-language
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import RecordRTC from 'recordrtc';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bot, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MessageSquare, 
  Volume2, 
  VolumeX,
  Headphones,
  Eye,
  Globe,
  Zap,
  Brain,
  Sparkles,
  Settings,
  Play,
  Pause,
  RotateCcw,
  User
} from "lucide-react";
import Unity3DAvatar from "@/components/Unity3DAvatar";
import ChatDollKit3DAvatar from "@/components/ChatDollKit3DAvatar";

interface AVAInteraction {
  id: string;
  type: 'text' | 'voice' | 'video' | '3d' | 'ar' | 'vr';
  user_input: string;
  user_language: string;
  response: string;
  response_language: string;
  emotions: string[];
  gestures: string[];
  voice_synthesis?: any;
  lip_sync_data?: any;
  real_time_processing: boolean;
  timestamp: Date;
}

interface Language {
  code: string;
  name: string;
  voice: string;
}

interface LanguagesResponse {
  success: boolean;
  data: Language[];
  count: number;
  timestamp: string;
}

export default function AVADemo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Translation dictionary for language switching confirmations (only supported languages)
  const confirmationSnippets = {
    en: "I noticed you mentioned [Language]. Would you like to switch the conversation to [Language]?",
    hi: "मैंने देखा कि आपने [Language] का उल्लेख किया है। क्या आप बातचीत को [Language] में बदलना चाहते हैं?",
    bn: "আমি লক্ষ্য করেছি যে আপনি [Language] উল্লেখ করেছেন। আপনি কি কথোপকথন [Language] এ পরিবর্তন করতে চান?",
    te: "మీరు [Language] గురించి ప్రస్తావించినట్లు నేను గమనించాను. మీరు సంభాషణను [Language]కి మార్చాలని అనుకుంటున్నారా?",
    mr: "मी लक्षात घेतले की तुम्ही [Language] चा उल्लेख केला आहे. तुम्हाला संभाषण [Language] मध्ये बदलायला आवडेल का?",
    ta: "நீங்கள் [Language] பற்றி குறிப்பிட்டுள்ளதை நான் கவனித்தேன். நீங்கள் உரையாடலை [Language] க்கு மாற்ற விரும்புகிறீர்களா?",
    gu: "મેં નોંધ્યું છે કે તમે [Language] નો ઉલ્લેખ કર્યો છે. શું તમે વાતચીત [Language] માં બદલવા માંગો છો?",
    ur: "میں نے دیکھا ہے کہ آپ نے [Language] کا ذکر کیا ہے۔ کیا آپ بات چیت کو [Language] میں تبدیل کرنا چاہتے ہیں؟",
    kn: "ನೀವು [Language] ಬಗ್ಗೆ ಉಲ್ಲೇಖಿಸಿದ್ದನ್ನು ನಾನು ಗಮನಿಸಿದೆ. ನೀವು ಸಂಭಾಷಣೆಯನ್ನು [Language] ಗೆ ಬದಲಾಯಿಸಲು ಬಯಸುತ್ತೀರಾ?",
    od: "ମୁଁ ଲକ୍ଷ୍ୟ କରିଛି ଯେ ଆପଣ [Language] ବିଷୟରେ ଉଲ୍ଲେଖ କରିଛନ୍ତି। ଆପଣ କଥାବାର୍ତ୍ତାକୁ [Language] ରେ ପରିବର୍ତ୍ତନ କରିବାକୁ ଚାହାଁନ୍ତି କି?",
    pa: "ਮੈਂ ਦੇਖਿਆ ਹੈ ਕਿ ਤੁਸੀਂ [Language] ਦਾ ਜ਼ਿਕਰ ਕੀਤਾ ਹੈ। ਕੀ ਤੁਸੀਂ ਗੱਲਬਾਤ ਨੂੰ [Language] ਵਿੱਚ ਬਦਲਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
    ml: "നിങ്ങൾ [Language] പരാമർശിച്ചത് ഞാൻ ശ്രദ്ധിച്ചു. നിങ്ങൾ സംഭാഷണം [Language] ലേക്ക് മാറ്റാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?"
  };
  
  // State management
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [currentMessage, setCurrentMessage] = useState('');
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [interactionType, setInteractionType] = useState<'text' | 'voice' | '3d' | 'ar' | 'vr'>('text');
  const [realTimeActive, setRealTimeActive] = useState(false);
  const [unityAvatarEnabled, setUnityAvatarEnabled] = useState(true);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{user: string, ava: string, timestamp: Date}>>([]);
  const [pendingLanguageSwitch, setPendingLanguageSwitch] = useState<{ languageCode: string; originalQuery: string } | null>(null);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // New refs for hands-free voice chat
  const recordRTCRef = useRef<RecordRTC | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const voiceDetectionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Fetch AVA info
  const { data: avaInfo, isLoading: infoLoading } = useQuery({
    queryKey: ['/api/ava-demo/info'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent refetch when switching tabs
    refetchOnMount: false, // Prevent refetch on component remount
    retry: 1 // Reduce retry attempts
  });

  // Fetch supported languages with custom fetcher to avoid TanStack issues
  const { data: languagesData, isLoading: languagesLoading, error: languagesError } = useQuery<LanguagesResponse>({
    queryKey: ['/api/ava-demo/languages'],
    queryFn: async () => {
      const response = await fetch('/api/ava-demo/languages');
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });
  
  // Debug logging
  useEffect(() => {
    if (languagesData) {
      console.log('✅ Languages loaded successfully:', languagesData);
    }
    if (languagesError) {
      console.error('❌ Languages loading error:', languagesError);
    }
  }, [languagesData, languagesError]);

  // Fetch interactions history
  const { data: interactionsData, refetch: refetchInteractions } = useQuery({
    queryKey: ['/api/ava-demo/interactions'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch when switching tabs
    retry: 1
  });
  
  // Greeting mutation for language changes
  const greetingMutation = useMutation({
    mutationFn: async ({ language }: { language: string }) => {
      const response = await fetch('/api/ava-demo/greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch greeting');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const greeting = data.greeting;
      
      // Clear chat history and show new greeting
      setChatHistory([{
        user: '',
        ava: greeting,
        timestamp: new Date()
      }]);
      
      toast({
        title: "Language Changed",
        description: "AVA is now speaking in the selected language"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update greeting language",
        variant: "destructive"
      });
    }
  });

  // Add initial greeting from AVA on component mount
  useEffect(() => {
    greetingMutation.mutate({ language: selectedLanguage });
  }, []); // Only run once on mount

  // Text chat mutation
  const textChatMutation = useMutation({
    mutationFn: async ({ message, language }: { message: string; language: string }) => {
      const response = await fetch('/api/ava-demo/chat/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Get the actual dynamic response from KIMI K2 - no fallback to let real responses through
      const response = data.data.response;
      
      if (response) {
        setCurrentResponse(response);
        
        // Update the last entry in chat history with AVA's response
        setChatHistory(prev => {
          const newHistory = [...prev];
          if (newHistory.length > 0) {
            newHistory[newHistory.length - 1] = {
              ...newHistory[newHistory.length - 1],
              ava: response
            };
          }
          return newHistory;
        });
        
        toast({
          title: "AVA Response",
          description: response.substring(0, 100) + (response.length > 100 ? "..." : "")
        });
        refetchInteractions();
        
        // Play voice synthesis if available
        if (data.data.voice_synthesis?.audio_url) {
          playAudio(data.data.voice_synthesis.audio_url);
        }
      } else {
        // Handle case where API response is empty
        toast({
          title: "Error",
          description: "No response received from AVA. Please try again.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process message",
        variant: "destructive"
      });
    }
  });

  // Voice chat mutation
  const voiceChatMutation = useMutation({
    mutationFn: async ({ audioBlob, language }: { audioBlob: Blob; language: string }) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('language', language);
      
      const response = await fetch('/api/ava-demo/chat/voice', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to process voice');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Get the direct response from Gemini multimodal processing
      const response = data.data.response;
      const userInput = data.data.user_input; // Now "[voice message]" from backend
      
      if (response && userInput) {
        setCurrentResponse(response);
        
        // Add to chat history using user_input from API response (displays "[voice message]")
        setChatHistory(prev => [...prev, {
          user: userInput, // Use user_input from API response - will show "[voice message]"
          ava: response,
          timestamp: new Date()
        }]);
        
        toast({
          title: "AVA Voice Response",
          description: response.substring(0, 100) + (response.length > 100 ? "..." : "")
        });
        refetchInteractions();
        
        // Play voice response automatically in voice mode using consistent playAudio function
        if (data.data.voice_synthesis?.audio_url) {
          playAudio(data.data.voice_synthesis.audio_url);
        }
        
        // Return to listening state after successful processing (hands-free mode)
        if (voiceState === 'processing') {
          vadStateRef.current.currentState = 'listening';
          setVoiceState('listening');
          console.log('✅ Response processed, returning to listening mode');
        }
      } else {
        // Handle case where API response is empty
        toast({
          title: "Error", 
          description: "Voice processing failed. Please try again or use text chat.",
          variant: "destructive"
        });
        
        // Return to listening state even on error
        if (voiceState === 'processing') {
          vadStateRef.current.currentState = 'listening';
          setVoiceState('listening');
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process voice",
        variant: "destructive"
      });
    }
  });

  // 3D interaction mutation
  const interaction3DMutation = useMutation({
    mutationFn: async ({ message, type, language }: { message: string; type: '3d' | 'ar' | 'vr'; language: string }) => {
      const response = await fetch('/api/ava-demo/chat/3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, interaction_type: type, language })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process 3D interaction');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Get the actual dynamic response from KIMI K2 - no fallback to let real responses through
      const response = data.data.response;
      
      if (response) {
        setCurrentResponse(response);
        
        // Add to chat history with proper user message
        setChatHistory(prev => [...prev, {
          user: variables.message, // Use the actual user message from the mutation
          ava: response,
          timestamp: new Date()
        }]);
        
        toast({
          title: `AVA ${variables.type.toUpperCase()} Response`,
          description: response.substring(0, 100) + (response.length > 100 ? "..." : "")
        });
        refetchInteractions();
        
        // Render 3D avatar response
        render3DResponse(data.data);
        
        // Play voice synthesis if available for 3D interactions
        const audioUrl = data.data.voice_response?.audio_url || data.data.audio || data.data.voice_synthesis?.audio_url;
        const lipSyncData = data.data.voice_response?.lip_sync_data || data.data.lip_sync_data;
        
        console.log('🔍 Checking for audio in 3D response:', {
          has_voice_response: !!data.data.voice_response,
          has_audio: !!data.data.audio,
          has_voice_synthesis: !!data.data.voice_synthesis,
          found_audio_url: !!audioUrl,
          lip_sync_available: !!lipSyncData
        });
        
        if (audioUrl) {
          console.log('🎤 3D interaction has audio, playing...');
          playAudio(audioUrl, lipSyncData);
        } else {
          console.log('⚠️ No audio URL found in 3D response - checking response structure...');
          console.log('📊 Response data keys:', Object.keys(data.data || {}));
        }
      } else {
        // Handle case where API response is empty
        toast({
          title: "Error",
          description: "No response received from AVA. Please try again.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process 3D interaction",
        variant: "destructive"
      });
    }
  });

  // Auto-scroll to bottom when chat history changes or typing indicator appears/disappears
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatHistory, textChatMutation.isPending]);

  // Send text message with language switching suggestion
  const handleSendMessage = async () => {
    // Guard clause: Check if message is empty or contains only whitespace
    if (!currentMessage.trim()) {
      console.log("Message is empty. Aborting send.");
      return;
    }
    
    // Store message and clear input immediately for better UX
    const userMessage = currentMessage;
    setCurrentMessage('');
    
    // Handle pending language switch confirmation
    if (pendingLanguageSwitch) {
      const isAffirmative = /^(yes|ya|si|sí|oui|ja|да|はい|네|是|نعم|हाँ|evet|ano|tak|sim)$/i.test(userMessage.trim()) ||
                           /^(y|s|o|j|д|は|네|是|ن|हा|e|a|t)$/i.test(userMessage.trim());
      
      if (isAffirmative) {
        // User confirmed language switch
        setSelectedLanguage(pendingLanguageSwitch.languageCode);
        setPendingLanguageSwitch(null);
        
        // Refresh chat with greeting in new language
        greetingMutation.mutate({ language: pendingLanguageSwitch.languageCode });
        return;
      } else {
        // User declined language switch, process original query
        const originalQuery = pendingLanguageSwitch.originalQuery;
        setPendingLanguageSwitch(null);
        
        // Add original query to chat history
        setChatHistory(prev => [...prev, {
          user: originalQuery,
          ava: '',
          timestamp: new Date()
        }]);
        
        // Process the original query
        if (interactionType === 'text') {
          textChatMutation.mutate({
            message: originalQuery,
            language: selectedLanguage
          });
        } else if (['3d', 'ar', 'vr'].includes(interactionType)) {
          interaction3DMutation.mutate({
            message: originalQuery,
            type: interactionType as '3d' | 'ar' | 'vr',
            language: selectedLanguage
          });
        }
        return;
      }
    }
    
    // Language detection logic for supported languages only
    if (languagesData?.data && Array.isArray(languagesData.data)) {
      const detectedLanguage = languagesData.data.find((lang: Language) => {
        const languageName = lang.name.toLowerCase();
        const userMessageLower = userMessage.toLowerCase();
        
        // Check for exact language name match or common variations for supported languages
        return userMessageLower.includes(languageName) ||
               (lang.code === 'hi' && (userMessageLower.includes('hindi') || userMessageLower.includes('हिंदी'))) ||
               (lang.code === 'bn' && (userMessageLower.includes('bengali') || userMessageLower.includes('বাংলা'))) ||
               (lang.code === 'te' && (userMessageLower.includes('telugu') || userMessageLower.includes('తెలుగు'))) ||
               (lang.code === 'mr' && (userMessageLower.includes('marathi') || userMessageLower.includes('मराठी'))) ||
               (lang.code === 'ta' && (userMessageLower.includes('tamil') || userMessageLower.includes('தமிழ்'))) ||
               (lang.code === 'gu' && (userMessageLower.includes('gujarati') || userMessageLower.includes('ગુજરાતી'))) ||
               (lang.code === 'ur' && (userMessageLower.includes('urdu') || userMessageLower.includes('اردو'))) ||
               (lang.code === 'kn' && (userMessageLower.includes('kannada') || userMessageLower.includes('ಕನ್ನಡ'))) ||
               (lang.code === 'od' && (userMessageLower.includes('odia') || userMessageLower.includes('ଓଡ଼ିଆ'))) ||
               (lang.code === 'pa' && (userMessageLower.includes('punjabi') || userMessageLower.includes('ਪੰਜਾਬੀ'))) ||
               (lang.code === 'ml' && (userMessageLower.includes('malayalam') || userMessageLower.includes('മലയാളം')));
      });
      
      // If a different language is detected and it's not the current language
      if (detectedLanguage && detectedLanguage.code !== selectedLanguage) {
        const confirmationTemplate = confirmationSnippets[selectedLanguage as keyof typeof confirmationSnippets] || confirmationSnippets.en;
        const confirmationMessage = confirmationTemplate.replace(/\[Language\]/g, detectedLanguage.name);
        
        // Add confirmation question to chat history
        setChatHistory(prev => [...prev, {
          user: userMessage,
          ava: confirmationMessage,
          timestamp: new Date()
        }]);
        
        // Set pending language switch state
        setPendingLanguageSwitch({
          languageCode: detectedLanguage.code,
          originalQuery: userMessage
        });
        
        return; // Don't process the message further
      }
    }
    
    // Normal message processing (no language detected or same language)
    // Immediately add user's message to chat history for instant feedback
    setChatHistory(prev => [...prev, {
      user: userMessage,
      ava: '',
      timestamp: new Date()
    }]);
    
    if (interactionType === 'text') {
      textChatMutation.mutate({
        message: userMessage,
        language: selectedLanguage
      });
    } else if (['3d', 'ar', 'vr'].includes(interactionType)) {
      interaction3DMutation.mutate({
        message: userMessage,
        type: interactionType as '3d' | 'ar' | 'vr',
        language: selectedLanguage
      });
    }
  };

  // Voice Activity Detection parameters
  const VAD_CONFIG = {
    silenceThreshold: 0.005,    // Lowered threshold for better voice detection
    silenceDuration: 2000,      // Increased to 2 seconds for more reliable detection
    minRecordingDuration: 800,  // Minimum recording duration in ms
    maxRecordingDuration: 30000 // Maximum recording duration in ms
  };

  // Cleanup voice session resources
  const cleanupVoiceSession = useCallback(() => {
    // Clear timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Stop RecordRTC
    if (recordRTCRef.current) {
      recordRTCRef.current.stopRecording();
      recordRTCRef.current.destroy();
      recordRTCRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    console.log('🧹 Voice session cleanup completed');
  }, []);

  // Enhanced Voice Activity Detection using Web Audio API
  const detectVoiceActivity = useCallback((audioData: Float32Array): boolean => {
    let sum = 0;
    let peak = 0;
    
    // Calculate both RMS and peak values for better detection
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.abs(audioData[i]);
      sum += sample * sample;
      if (sample > peak) peak = sample;
    }
    
    const rms = Math.sqrt(sum / audioData.length);
    
    // Use both RMS and peak detection for more accurate VAD
    const isVoiceByRMS = rms > VAD_CONFIG.silenceThreshold;
    const isVoiceByPeak = peak > VAD_CONFIG.silenceThreshold * 2;
    
    const hasVoice = isVoiceByRMS || isVoiceByPeak;
    
    // Debug logging (remove in production)
    if (hasVoice) {
      console.log('🔊 Voice detected - RMS:', rms.toFixed(4), 'Peak:', peak.toFixed(4));
    }
    
    return hasVoice;
  }, []);

  // Process audio for voice activity detection with state tracking
  const vadStateRef = useRef({ isMonitoring: false, currentState: 'idle' as 'idle' | 'listening' | 'speaking' | 'processing' });
  
  // Stop voice recording and process audio
  const stopVoiceRecording = useCallback(() => {
    // Clear any pending silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (!recordRTCRef.current) {
      console.log('⚠️ No recorder available to stop');
      setVoiceState('listening');
      return;
    }

    console.log('⏹️ Stopping voice recording...');
    vadStateRef.current.currentState = 'processing';
    setVoiceState('processing');

    try {
      recordRTCRef.current.stopRecording(() => {
        const audioBlob = recordRTCRef.current?.getBlob();
        console.log('🎤 Recording stopped, blob size:', audioBlob?.size || 0, 'bytes');
        
        if (audioBlob && audioBlob.size > 1000) { // Minimum 1KB for valid audio
          // Process the audio through voice chat mutation
          voiceChatMutation.mutate({
            audioBlob,
            language: selectedLanguage
          });
        } else {
          console.log('⚠️ Audio blob too small or invalid');
          vadStateRef.current.currentState = 'listening';
          setVoiceState('listening');
          toast({
            title: "Audio Too Short",
            description: "Please speak for a longer duration",
            variant: "destructive"
          });
        }
        
        // Restart recording for continuous listening
        if (vadStateRef.current.isMonitoring && recordRTCRef.current) {
          recordRTCRef.current.startRecording();
          console.log('🔄 Restarted recording for continuous listening');
        }
      });
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      vadStateRef.current.currentState = 'listening';
      setVoiceState('listening');
    }
  }, [selectedLanguage, voiceChatMutation]);

  const processAudioForVAD = useCallback(() => {
    try {
      if (!analyserRef.current || !vadStateRef.current?.isMonitoring) {
        console.log('⚠️ VAD stopped - analyser or monitoring disabled');
        return;
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      analyserRef.current.getFloatTimeDomainData(dataArray);

      const isVoiceDetected = detectVoiceActivity(dataArray);
      const currentState = vadStateRef.current.currentState;
      
      if (isVoiceDetected) {
        // Voice detected - clear any existing silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
          console.log('🔄 Cleared silence timeout - voice still active');
        }
        
        // If we were listening, switch to speaking
        if (currentState === 'listening') {
          vadStateRef.current.currentState = 'speaking';
          setVoiceState('speaking');
          console.log('🗣️ Voice detected, switching to speaking state');
        }
      } else if (currentState === 'speaking') {
        // No voice detected while speaking - start silence countdown
        if (!silenceTimeoutRef.current) {
          console.log('🤐 Starting silence countdown...');
          silenceTimeoutRef.current = setTimeout(() => {
            console.log('⏹️ Silence timeout reached, stopping recording');
            stopVoiceRecording();
          }, VAD_CONFIG.silenceDuration);
        }
      }

      // Continue monitoring if session is active
      if (vadStateRef.current?.isMonitoring && (currentState === 'listening' || currentState === 'speaking')) {
        setTimeout(() => processAudioForVAD(), 50); // Check every 50ms instead of requestAnimationFrame
      }
    } catch (error) {
      console.error('❌ Error in VAD processing:', error);
      vadStateRef.current.isMonitoring = false;
      setVoiceState('idle');
    }
  }, [detectVoiceActivity, stopVoiceRecording]);

  // Main voice session manager - replaces old start/stop recording
  const manageVoiceSession = useCallback(async () => {
    try {
      if (voiceState === 'idle') {
        // Start hands-free voice session
        console.log('🎤 Starting hands-free voice session...');
        
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        audioStreamRef.current = stream;

        // Setup Web Audio API for voice activity detection
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        source.connect(analyserRef.current);

        // Setup RecordRTC for continuous recording with compression
        recordRTCRef.current = new RecordRTC(stream, {
          type: 'audio',
          mimeType: 'audio/webm',
          bitsPerSecond: 64000, // 64 kbps for voice compression
          recorderType: RecordRTC.StereoAudioRecorder,
          timeSlice: 1000, // Get data every second
          ondataavailable: () => {
            // This fires every second but we handle stopping based on VAD
          }
        });

        recordRTCRef.current.startRecording();
        vadStateRef.current.isMonitoring = true;
        vadStateRef.current.currentState = 'listening';
        setVoiceState('listening');
        
        // Start voice activity detection with delay to ensure recording is active
        setTimeout(() => {
          console.log('🎧 Starting VAD monitoring...');
          processAudioForVAD();
        }, 500);

        toast({
          title: "Voice Session Started",
          description: "I'm listening... Speak when ready"
        });

      } else {
        // Stop hands-free voice session
        console.log('🛑 Stopping hands-free voice session...');
        vadStateRef.current.isMonitoring = false;
        vadStateRef.current.currentState = 'idle';
        cleanupVoiceSession();
        setVoiceState('idle');
        
        toast({
          title: "Voice Session Ended",
          description: "Conversation session stopped"
        });
      }
    } catch (error) {
      console.error('❌ Error managing voice session:', error);
      cleanupVoiceSession();
      setVoiceState('idle');
      
      toast({
        title: "Voice Session Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [voiceState, cleanupVoiceSession, processAudioForVAD, selectedLanguage]);

  // Cleanup on unmount and when switching away from voice mode
  useEffect(() => {
    return () => {
      cleanupVoiceSession();
    };
  }, [cleanupVoiceSession]);

  // Auto cleanup when switching away from voice interaction
  useEffect(() => {
    if (interactionType !== 'voice' && voiceState !== 'idle') {
      console.log('🔄 Switching away from voice mode, cleaning up...');
      vadStateRef.current.isMonitoring = false;
      vadStateRef.current.currentState = 'idle';
      cleanupVoiceSession();
      setVoiceState('idle');
    }
  }, [interactionType, voiceState, cleanupVoiceSession]);

  // Play audio response with lip sync support
  const playAudio = (audioUrl: string, lipSyncData?: any) => {
    if (audioRef.current) {
      console.log('🔊 Playing audio:', audioUrl?.substring(0, 50) + '...');
      
      audioRef.current.src = audioUrl;
      setIsPlaying(true);
      
      // Start lip sync animation if 3D avatar is enabled and lip sync data is available
      if (unityAvatarEnabled && lipSyncData && lipSyncData.keyframes) {
        console.log('🎬 Starting professional lip sync with audio playback');
        console.log('📊 Keyframes available:', lipSyncData.keyframes.length);
        console.log('⏱️ Duration:', lipSyncData.duration || 'unknown');
        
        // Use the new lip sync system
        startLipSync(lipSyncData);
      }
      
      audioRef.current.onloadeddata = () => {
        console.log('🎵 Audio loaded successfully, duration:', audioRef.current?.duration);
        
        // If we have lip sync data but no duration, use audio duration
        if (unityAvatarEnabled && lipSyncData && lipSyncData.keyframes && !lipSyncData.duration) {
          lipSyncData.duration = audioRef.current?.duration || 3.0;
          console.log('🔄 Updated lip sync duration from audio:', lipSyncData.duration);
        }
      };
      
      audioRef.current.onplay = () => {
        console.log('▶️ Audio playback started');
        setIsLipSyncActive(true);
      };
      
      audioRef.current.onended = () => {
        console.log('⏹️ Audio playback ended');
        setIsPlaying(false);
        setIsLipSyncActive(false);
        
        // Stop lip sync when audio ends
        if (unityAvatarEnabled) {
          stopLipSync();
        }
      };
      
      audioRef.current.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        setIsPlaying(false);
        setIsLipSyncActive(false);
        
        // Stop lip sync on error
        if (unityAvatarEnabled) {
          stopLipSync();
        }
        
        toast({
          title: "Audio Error",
          description: "Could not play audio response. But text response is available.",
          variant: "destructive"
        });
      };
      
      // Start playback
      audioRef.current.play().catch(error => {
        console.error('❌ Audio play() failed:', error);
        setIsPlaying(false);
        setIsLipSyncActive(false);
        
        toast({
          title: "Audio Playback Failed", 
          description: "Audio could not be played. Check browser permissions.",
          variant: "destructive"
        });
      });
    }
  };

  // Render 3D response with error handling
  const render3DResponse = (interaction: any) => {
    try {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw gradient background
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          gradient.addColorStop(0, '#1e3a8a');
          gradient.addColorStop(1, '#7c3aed');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw AVA avatar placeholder
          ctx.fillStyle = '#3B82F6';
          ctx.fillRect(50, 50, 200, 300);
          
          // Add text overlay
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '16px Arial';
          ctx.fillText('AVA 3D Avatar', 100, 100);
          ctx.fillText(`Mode: ${interaction.type?.toUpperCase() || '3D'}`, 100, 120);
          if (interaction.emotions) {
            ctx.fillText(`Emotions: ${interaction.emotions.join(', ')}`, 100, 140);
          }
          if (interaction.gestures) {
            ctx.fillText(`Gestures: ${interaction.gestures.join(', ')}`, 100, 160);
          }
          
          toast({
            title: "Avatar Rendered",
            description: `${interaction.type?.toUpperCase()} mode activated successfully`
          });
        }
      }
    } catch (error) {
      console.error('Error rendering 3D response:', error);
      toast({
        title: "3D Rendering Error",
        description: "3D avatar encountered an issue, but text response is available",
        variant: "destructive"
      });
    }
  };

  // Get interaction type color
  const getInteractionTypeColor = (type: string) => {
    const colors = {
      text: 'bg-blue-500',
      voice: 'bg-green-500',
      video: 'bg-purple-500',
      '3d': 'bg-orange-500',
      ar: 'bg-pink-500',
      vr: 'bg-red-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Stable avatar ready callback to prevent infinite re-renders
  const handleAvatarReady = useCallback(() => {
    toast({
      title: "Avatar Ready",
      description: "Premium 3D avatar with intelligent AI initialized successfully"
    });
  }, [toast]);

  // Memoized animation callback to prevent infinite re-renders
  const handleAnimationChange = useCallback((animation: string) => {
    console.log(`Animation: ${animation}`);
  }, []);

  // Memoized emotion callback to prevent infinite re-renders
  const handleEmotionChange = useCallback((emotion: string) => {
    console.log('Emotion:', emotion);
  }, []);

  // Memoized gesture callback to prevent infinite re-renders
  const handleGestureComplete = useCallback((gesture: string) => {
    console.log('Gesture completed:', gesture);
  }, []);

  // Memoize the config object to prevent recreation on every render
  const avatarConfig = useMemo(() => ({
    model: 'ava_new_model.fbx',
    modelFormat: 'fbx' as const,
    appearance: {
      gender: 'female' as const,
      style: 'professional_business',
      clothing: 'navy_business_suit',
      hair: 'professional_bob_brown',
      facial_features: 'friendly_approachable'
    },
    animations: {
      idle: ['professional_stance', 'subtle_breathing', 'natural_blinking'],
      speaking: ['lip_sync_precise', 'hand_gestures', 'facial_expressions'],
      gestures: ['explaining_hands', 'pointing_professional', 'welcoming_arms'],
      emotions: ['confident_smile', 'empathetic_nod', 'focused_attention'],
      walking: ['professional_stride', 'confident_approach'],
      interactions: ['handshake_warm', 'presentation_mode']
    },
    ai_brain: {
      provider: 'kimi_k2' as const,
      model_version: 'kimi-k2-instruct',
      personality: 'professional_empathetic_intelligent',
      response_style: 'detailed_thoughtful_engaging'
    },
    voice_synthesis: {
      provider: 'elevenlabs',
      voice_id: 'professional_female_warm',
      language: selectedLanguage || 'en',
      emotion_range: 0.8
    },
    behaviors: {
      natural_breathing: true,
      realistic_blinking: true,
      micro_expressions: true,
      eye_tracking: true,
      lip_sync: true,
      enhanced_lip_sync: true,
      fbx_model_support: true,
      gesture_frequency: 0.7
    }
  }), [selectedLanguage]); // Only recreate when selectedLanguage changes

  // Memoize interaction data to prevent unnecessary re-renders
  const memoizedInteractionData = useMemo(() => {
    return (interactionsData as any)?.data?.[0] || null;
  }, [interactionsData]);

  // Lip sync state for 3D avatar
  const [isLipSyncActive, setIsLipSyncActive] = useState(false);
  const lipSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const avatarRef = useRef<any>(null);
  
  // Enhanced lip sync command callback for 3D avatar communication with FBX support
  const sendLipSyncCommand = (command: any) => {
    if (avatarRef.current) {
      // Use new enhanced lip sync interface
      if (typeof avatarRef.current.performLipSync === 'function' && command.keyframes) {
        console.log('🎭 Using enhanced FBX lip sync with phoneme data');
        const phonemeData = command.keyframes.map((frame: any) => ({
          phoneme: frame.viseme || frame.phoneme || 'sil',
          intensity: frame.intensity || 1.0,
          time: frame.time || 0
        }));
        avatarRef.current.performLipSync(phonemeData);
      } else if (typeof avatarRef.current.animatePhoneme === 'function') {
        console.log('🎭 Using single phoneme animation');
        avatarRef.current.animatePhoneme(command.phoneme || 'sil', command.intensity || 1.0);
      } else if (typeof avatarRef.current.handleLipSyncCommand === 'function') {
        // Fallback to legacy interface
        avatarRef.current.handleLipSyncCommand(command);
      }
    }
  };

  // Start professional lip sync animation with keyframe data
  const startLipSync = (lipSyncData: any) => {
    console.log('👄 Starting professional lip sync animation with keyframes');
    console.log('🎬 Lip sync data:', lipSyncData);
    setIsLipSyncActive(true);
    
    // Use the professional keyframe-based lip sync from the backend
    if (lipSyncData?.keyframes && Array.isArray(lipSyncData.keyframes)) {
      const keyframes = lipSyncData.keyframes;
      const duration = lipSyncData.duration || 3;
      const startTime = Date.now();
      
      console.log(`🎭 Processing ${keyframes.length} lip sync keyframes over ${duration}s`);
      
      // Debug: Check keyframe structure to verify viseme field is present
      if (keyframes.length > 0) {
        const sampleFrame = keyframes[0];
        console.log('🔍 Sample keyframe structure:', {
          viseme: sampleFrame.viseme,
          viseme_id: sampleFrame.viseme_id,
          mouth_shape: sampleFrame.mouth_shape,
          intensity: sampleFrame.intensity,
          time: sampleFrame.time
        });
      }
      
      // Send keyframes to 3D avatar for professional animation
      sendLipSyncCommand({
        type: 'start_lip_sync',
        keyframes: keyframes,
        duration: duration,
        startTime: startTime
      });
      
      // Real-time keyframe processing for precise timing
      lipSyncIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000; // Convert to seconds
        const currentKeyframe = keyframes.find((frame: any, index: number) => {
          const nextFrame = keyframes[index + 1];
          return frame.time <= elapsed && (!nextFrame || nextFrame.time > elapsed);
        });
        
        if (currentKeyframe) {
          console.log(`🗣️ Current viseme: ${currentKeyframe.viseme} (${currentKeyframe.mouth_shape}) - Intensity: ${currentKeyframe.intensity.toFixed(2)}`);
          
          // Update 3D avatar lip sync in real-time
          avatarRef.current?.updateViseme(currentKeyframe.viseme, currentKeyframe.intensity);
          
          // Send current frame to 3D avatar (legacy support)
          sendLipSyncCommand({
            type: 'update_lip_sync',
            viseme: currentKeyframe.viseme,
            viseme_id: currentKeyframe.viseme_id,
            mouth_shape: currentKeyframe.mouth_shape,
            intensity: currentKeyframe.intensity,
            time: elapsed
          });
        }
        
        // Stop when animation is complete
        if (elapsed >= duration) {
          stopLipSync();
        }
      }, 33); // ~30 FPS for smooth animation
    } else {
      console.warn('⚠️ No valid keyframe data available for lip sync');
      // Fallback to basic timing-based animation
      setTimeout(() => stopLipSync(), 3000);
    }
  };

  // Stop professional lip sync animation
  const stopLipSync = () => {
    console.log('🤐 Stopping professional lip sync animation');
    setIsLipSyncActive(false);
    
    if (lipSyncIntervalRef.current) {
      clearInterval(lipSyncIntervalRef.current);
      lipSyncIntervalRef.current = null;
    }
    
    // Reset avatar mouth to neutral state
    avatarRef.current?.updateViseme('sil', 1.0);
    
    // Send stop signal to 3D avatar (legacy support)
    sendLipSyncCommand({
      type: 'stop_lip_sync'
    });
  };

  // Show loading only on initial load, not on subsequent queries
  if (infoLoading && !avaInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <p>Loading AVA Demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-500" />
            AVA - Advanced Virtual Assistant Demo
          </CardTitle>
          <CardDescription>
            Experience comprehensive AI interaction with text, voice, video, 3D avatars, AR/VR, and multi-language support
          </CardDescription>
          
          {(avaInfo as any)?.data?.capabilities && (
            <div className="flex flex-wrap gap-2 mt-4">
              {(avaInfo as any).data.capabilities.map((capability: string) => (
                <Badge key={capability} variant="secondary">
                  {capability}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interaction Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chat with AVA</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedLanguage} onValueChange={(newLanguage) => {
                    setSelectedLanguage(newLanguage);
                    greetingMutation.mutate({ language: newLanguage });
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select Language">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {languagesData?.data?.find((lang: Language) => lang.code === selectedLanguage)?.name || 'English'}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {languagesLoading ? (
                        <SelectItem value="loading" disabled>Loading languages...</SelectItem>
                      ) : languagesError ? (
                        <SelectItem value="error" disabled>Error loading languages</SelectItem>
                      ) : languagesData?.data && Array.isArray(languagesData.data) && languagesData.data.length > 0 ? (
                        languagesData.data.map((lang: Language) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              {lang.name}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No languages available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={interactionType} onValueChange={(value) => setInteractionType(value as any)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="text">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="voice">
                    <Mic className="h-4 w-4 mr-1" />
                    Voice
                  </TabsTrigger>
                  <TabsTrigger value="3d">
                    <Eye className="h-4 w-4 mr-1" />
                    3D
                  </TabsTrigger>
                  <TabsTrigger value="ar">
                    <Sparkles className="h-4 w-4 mr-1" />
                    AR
                  </TabsTrigger>
                  <TabsTrigger value="vr">
                    <Zap className="h-4 w-4 mr-1" />
                    VR
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                  {/* Live Chat Area */}
                  <div ref={scrollAreaRef} className="bg-muted/20 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                    {chatHistory.length > 0 ? (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {chatHistory.map((chat, index) => (
                            <motion.div 
                              key={index} 
                              className="space-y-2"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                duration: 0.4, 
                                delay: index * 0.1,
                                ease: "easeOut"
                              }}
                            >
                              {/* User Message */}
                              {chat.user && (
                                <motion.div 
                                  className="flex justify-end"
                                  initial={{ opacity: 0, x: 50 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3, delay: 0.1 }}
                                >
                                  <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[80%]">
                                    <p className="text-sm">{chat.user}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                      {chat.timestamp.toLocaleTimeString()}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                              {/* AVA Response */}
                              {chat.ava && (
                                <motion.div 
                                  className="flex justify-start"
                                  initial={{ opacity: 0, x: -50 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                  <div className="bg-white border p-3 rounded-lg max-w-[80%]">
                                    <div className="flex items-start gap-2">
                                      <Bot className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-medium text-blue-700 mb-1">AVA</p>
                                        <p className="text-sm leading-relaxed">{chat.ava}</p>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {/* Typing Indicator */}
                        {textChatMutation.isPending && <TypingIndicator />}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Bot className="h-12 w-12 mx-auto mb-4 opacity-40" />
                          <p className="font-medium mb-2">Welcome to AVA - Your AI Logistics Assistant</p>
                          <p className="text-sm mb-1">Intelligent AI with advanced conversation capabilities</p>
                          <p className="text-xs">Ask me about logistics, shipping, or any business questions!</p>
                        </div>
                      </div>
                    )}
                    {/* Show typing indicator even when chat history is empty */}
                    {chatHistory.length === 0 && textChatMutation.isPending && (
                      <div className="space-y-4">
                        <TypingIndicator />
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="space-y-2">
                    <Label>Message to AVA</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Ask AVA about logistics, shipping, or any other topic..."
                        className="min-h-[80px] flex-1"
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
                        className="self-end"
                      >
                        {textChatMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 animate-pulse" />
                            <span>Sending...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span>Send</span>
                          </div>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
                  </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="voice" className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                  {/* Chat History for Voice Tab */}
                  <div className="bg-muted/20 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                    {chatHistory.length > 0 ? (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {chatHistory.map((chat, index) => (
                            <motion.div 
                              key={index} 
                              className="space-y-2"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                duration: 0.4, 
                                delay: index * 0.1,
                                ease: "easeOut"
                              }}
                            >
                              {/* User Message - only show if there's a user message */}
                              {chat.user && (
                                <motion.div 
                                  className="flex justify-end"
                                  initial={{ opacity: 0, x: 50 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3, delay: 0.1 }}
                                >
                                  <div className="bg-green-500 text-white p-3 rounded-lg max-w-[80%]">
                                    <p className="text-sm">{chat.user}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                      {chat.timestamp.toLocaleTimeString()}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                              {/* AVA Response */}
                              {chat.ava && (
                                <motion.div 
                                  className="flex justify-start"
                                  initial={{ opacity: 0, x: -50 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                  <div className="bg-white border p-3 rounded-lg max-w-[80%]">
                                    <div className="flex items-start gap-2">
                                      <Bot className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-medium text-green-700 mb-1">AVA</p>
                                        <p className="text-sm leading-relaxed">{chat.ava}</p>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Bot className="h-12 w-12 mx-auto mb-4 opacity-40" />
                          <p className="font-medium mb-2">Voice Chat with AVA</p>
                          <p className="text-sm mb-1">Start speaking to interact with your AI assistant</p>
                          <p className="text-xs">Voice conversations are also saved here!</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hands-Free Voice Chat Controls */}
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <Button
                        size="lg"
                        variant={voiceState === 'idle' ? "default" : "destructive"}
                        onClick={manageVoiceSession}
                        disabled={voiceChatMutation.isPending}
                        className={`h-20 w-20 rounded-full transition-all duration-200 ${
                          voiceState === 'listening' ? 'animate-slow-pulse bg-green-500 hover:bg-green-600' :
                          voiceState === 'speaking' ? 'animate-gentle-bounce bg-blue-500 hover:bg-blue-600' :
                          voiceState === 'processing' ? 'animate-spin bg-orange-500 hover:bg-orange-600' :
                          ''
                        }`}
                      >
                        {voiceState === 'idle' && <Mic className="h-8 w-8" />}
                        {voiceState === 'listening' && <Mic className="h-8 w-8" />}
                        {voiceState === 'speaking' && <MicOff className="h-8 w-8" />}
                        {voiceState === 'processing' && <Bot className="h-8 w-8" />}
                      </Button>
                    </div>
                    
                    {/* Voice State Indicator */}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {voiceState === 'idle' && 'Click to start hands-free conversation'}
                        {voiceState === 'listening' && 'I\'m listening... Speak when ready'}
                        {voiceState === 'speaking' && 'Speaking detected... Keep talking'}
                        {voiceState === 'processing' && 'Processing your voice...'}
                      </p>
                      
                      {/* Voice State Badge */}
                      <div className="flex justify-center">
                        <Badge 
                          variant={voiceState === 'idle' ? 'outline' : 'default'}
                          className={`
                            ${voiceState === 'listening' ? 'bg-green-100 text-green-800' : ''}
                            ${voiceState === 'speaking' ? 'bg-blue-100 text-blue-800' : ''}
                            ${voiceState === 'processing' ? 'bg-orange-100 text-orange-800' : ''}
                          `}
                        >
                          {voiceState === 'idle' && 'Ready'}
                          {voiceState === 'listening' && 'Listening'}
                          {voiceState === 'speaking' && 'Speaking'}
                          {voiceState === 'processing' && 'Processing'}
                        </Badge>
                      </div>
                    </div>
                    
                    {voiceChatMutation.isPending && (
                      <div className="flex items-center justify-center gap-2">
                        <Bot className="h-4 w-4 animate-pulse" />
                        <span>Processing voice...</span>
                      </div>
                    )}
                    
                    {/* Voice Activity Tips */}
                    {voiceState !== 'idle' && (
                      <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Hands-free mode active</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Auto-detects when you start/stop speaking</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>2 second pause triggers processing</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                      {unityAvatarEnabled ? (
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
                          placeholder={`Ask AVA something for ${type.toUpperCase()} experience...`}
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
          {/* AVA Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AVA Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Active
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Language</span>
                  <span className="text-sm font-medium">
                    {(languagesData as any)?.data?.find((l: Language) => l.code === selectedLanguage)?.name || 'English'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mode</span>
                  <Badge variant="outline" className={getInteractionTypeColor(interactionType)}>
                    {interactionType.toUpperCase()}
                  </Badge>
                </div>
                
                {(avaInfo as any)?.data?.knowledge_base && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Knowledge Base</span>
                    <Badge variant="outline">
                      <Brain className="h-3 w-3 mr-1" />
                      Ready
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* AVA Response */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AVA Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[120px] p-3 bg-muted/30 rounded-lg">
                {currentResponse ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Bot className="h-5 w-5 mt-0.5 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-700 mb-1">AVA</p>
                        <p className="text-sm leading-relaxed">{currentResponse}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Bot className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Message processed successfully</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Chat History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conversation History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60">
                <div className="space-y-3">
                  {chatHistory.length > 0 ? (
                    chatHistory.slice(-5).reverse().map((chat, index) => (
                      <div key={index} className="space-y-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-0.5 text-blue-600" />
                            <p className="text-sm">{chat.user}</p>
                          </div>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Bot className="h-4 w-4 mt-0.5 text-green-600" />
                            <p className="text-sm">{chat.ava}</p>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No conversation yet</p>
                      <p className="text-xs">Start chatting with AVA to see history</p>
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
                  
                  <audio className="w-full" controls />
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}


        </div>
      </div>
      
      {/* Global Audio Element for All Interaction Modes */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}

// Typing Indicator Component with animation
function TypingIndicator() {
  return (
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
            <p className="text-xs font-medium text-blue-700 mb-1">AVA</p>
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
  );
}