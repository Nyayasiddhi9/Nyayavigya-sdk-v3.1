// Advanced 3D Immersive Service - Frontend Integration
// Connects with WAI Orchestration and 3rd party components for real-time 3D experiences

export interface Unity3DConfig {
  enabled: boolean;
  ar: boolean;
  vr: boolean;
  xr: boolean;
  spatialTracking: boolean;
  handGestures: boolean;
  environment: string;
}

export interface ChatDollKitConfig {
  integration: boolean;
  echoMimicV2: boolean;
  motionCapture: boolean;
  emotionSync: boolean;
  culturalGestures: boolean;
  lipSyncAccuracy: string;
}

export interface KimiK2Config {
  enabled: boolean;
  spatialComputing: boolean;
  motionAnalysis: boolean;
  arVrSupport: boolean;
  realTimeTranslation: boolean;
  proactiveAssistance: boolean;
  emotionalIntelligence: boolean;
  contextualMemory: boolean;
  multiAgentCollaboration: boolean;
  analytics: boolean;
  renderingQuality: string;
  responseLatency: string;
}

export interface LiveKitConfig {
  enabled: boolean;
  realTimeAudio: boolean;
  realTimeVideo: boolean;
  spatialAudio: boolean;
  multiUser: boolean;
  voiceActivation: boolean;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  targetLatency: number;
  audioQuality: string;
}

export interface CulturalConfig {
  hindiSupport: { enabled: boolean; wakeWord: string };
  tamilSupport: { enabled: boolean; wakeWord: string };
  teluguSupport: { enabled: boolean; wakeWord: string };
  bengaliSupport: { enabled: boolean; wakeWord: string };
  marathiSupport: { enabled: boolean; wakeWord: string };
  gujaratiSupport: { enabled: boolean; wakeWord: string };
  traditionalGestures: boolean;
  regionalExpressions: boolean;
  festivalAwareness: boolean;
  culturalContext: boolean;
  culturalPersonality: string;
}

export interface Advanced3DAssistantConfig {
  unity3D: Unity3DConfig;
  chatDollKit: ChatDollKitConfig;
  kimiK2: KimiK2Config;
  liveKit: LiveKitConfig;
  cultural: CulturalConfig;
  waiOrchestration: {
    specializedAgents: number;
    llmProviders: number;
    agentIntegration: number;
    realTimeCommunication: boolean;
    multiAgentCoordination: boolean;
    intelligentTaskRouting: boolean;
  };
}

export class Advanced3DService {
  private baseUrl = '/api/advanced-3d';

  // Create configuration from form data
  createConfigFromForm(formData: any): Advanced3DAssistantConfig {
    return {
      unity3D: {
        enabled: formData.unity3d || false,
        ar: formData.ar || false,
        vr: formData.vr || false,
        xr: formData.xr || false,
        spatialTracking: formData.spatial || false,
        handGestures: formData.gesture || false,
        environment: formData.environment || 'professional-office'
      },
      chatDollKit: {
        integration: formData.chatdollkit || false,
        echoMimicV2: formData.echomimic || false,
        motionCapture: formData.motion || false,
        emotionSync: formData.emotion || false,
        culturalGestures: formData.cultural || false,
        lipSyncAccuracy: formData.lipSyncAccuracy || 'precise'
      },
      kimiK2: {
        enabled: formData.kimiK2 || false,
        spatialComputing: formData.spatialComputing || false,
        motionAnalysis: formData.motionAnalysis || false,
        arVrSupport: formData.arVrSupport || false,
        realTimeTranslation: formData.realTimeTranslation || false,
        proactiveAssistance: formData.proactiveAssistance || false,
        emotionalIntelligence: formData.emotionalIntelligence || false,
        contextualMemory: formData.contextualMemory || false,
        multiAgentCollaboration: formData.multiAgent || false,
        analytics: formData.analytics || false,
        renderingQuality: formData.renderQuality || 'high',
        responseLatency: formData.latencyMode || 'balanced'
      },
      liveKit: {
        enabled: formData.livekit || false,
        realTimeAudio: formData.realTimeAudio || false,
        realTimeVideo: formData.realTimeVideo || false,
        spatialAudio: formData.spatialAudio || false,
        multiUser: formData.multiUser || false,
        voiceActivation: formData.voiceActivation || false,
        noiseSuppression: formData.noiseSuppression || false,
        echoCancellation: formData.echoCancellation || false,
        targetLatency: 50,
        audioQuality: '48kHz / 16-bit'
      },
      cultural: {
        hindiSupport: { enabled: formData.hindiSupport || false, wakeWord: 'नमस्ते' },
        tamilSupport: { enabled: formData.tamilSupport || false, wakeWord: 'வணக்கம்' },
        teluguSupport: { enabled: formData.teluguSupport || false, wakeWord: 'నమస్కారం' },
        bengaliSupport: { enabled: formData.bengaliSupport || false, wakeWord: 'নমস্কার' },
        marathiSupport: { enabled: formData.marathiSupport || false, wakeWord: 'नमस्कार' },
        gujaratiSupport: { enabled: formData.gujaratiSupport || false, wakeWord: 'નમસ્તે' },
        traditionalGestures: formData.traditionalGestures || false,
        regionalExpressions: formData.regionalExpressions || false,
        festivalAwareness: formData.festivalAwareness || false,
        culturalContext: formData.culturalContext || false,
        culturalPersonality: formData.culturalPersonality || 'respectful-traditional'
      },
      waiOrchestration: {
        specializedAgents: 39,
        llmProviders: 13,
        agentIntegration: 100,
        realTimeCommunication: formData.realTimeCommunication || false,
        multiAgentCoordination: formData.multiAgentCoordination || false,
        intelligentTaskRouting: formData.intelligentTaskRouting || false
      }
    };
  }

  // Initialize 3D Immersive Assistant with real-time WAI integration
  async initialize3DAssistant(config: Advanced3DAssistantConfig): Promise<any> {
    try {
      console.log('🚀 Initializing Advanced 3D Immersive Assistant with WAI Orchestration...');
      
      const response = await fetch(`${this.baseUrl}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ 3D Immersive Assistant initialized successfully:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ Failed to initialize 3D Assistant:', error);
      throw error;
    }
  }

  // Get available 3D avatar models
  async getAvatarModels(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/avatar-models`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch avatar models:', error);
      throw error;
    }
  }

  // Get immersive environments
  async getEnvironments(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/environments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch environments:', error);
      throw error;
    }
  }

  // Test 3D assistant capabilities
  async testCapabilities(assistantId: string, testType: string = 'comprehensive'): Promise<any> {
    try {
      console.log(`🧪 Testing 3D Assistant capabilities: ${testType}`);
      
      const response = await fetch(`${this.baseUrl}/test-capabilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ assistantId, testType })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Capability testing completed:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ Capability testing failed:', error);
      throw error;
    }
  }

  // Real-time WAI Agent Communication
  async connectToWAIAgents(assistantId: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/3d-assistant/${assistantId}`;
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('🔗 Connected to WAI Agents for 3D Assistant');
          resolve(ws);
        };
        
        ws.onerror = (error) => {
          console.error('❌ WebSocket connection error:', error);
          reject(error);
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('📨 Real-time update from WAI Agents:', data);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get performance metrics in real-time
  async getPerformanceMetrics(assistantId: string): Promise<{
    responseTime: number;
    renderingFPS: number;
    avatarAnimationLatency: number;
    audioLatency: number;
    activeAgents: number;
    llmProviderStatus: string[];
  }> {
    // Simulate real-time metrics (in production, this would connect to actual monitoring)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          responseTime: Math.floor(Math.random() * 100) + 400, // 400-500ms
          renderingFPS: Math.floor(Math.random() * 10) + 55,   // 55-65 FPS
          avatarAnimationLatency: Math.floor(Math.random() * 20) + 35, // 35-55ms
          audioLatency: Math.floor(Math.random() * 15) + 30,   // 30-45ms
          activeAgents: Math.floor(Math.random() * 5) + 35,    // 35-40 agents
          llmProviderStatus: [
            'OpenAI: Active',
            'Anthropic: Active', 
            'Google Gemini: Active',
            'KIMI K2: Active',
            'ElevenLabs: Active'
          ]
        });
      }, 1000);
    });
  }

  // Start immersive session
  async startImmersiveSession(assistantId: string, sessionConfig: any): Promise<{
    sessionId: string;
    webxrSupport: boolean;
    unity3dStatus: string;
    chatDollKitStatus: string;
    liveKitStatus: string;
  }> {
    console.log('🚀 Starting immersive 3D session...');
    
    // Simulate immersive session startup
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          sessionId: `session_${Date.now()}`,
          webxrSupport: true,
          unity3dStatus: 'Ready',
          chatDollKitStatus: 'Avatar Loaded',
          liveKitStatus: 'Audio/Video Active'
        });
      }, 2000);
    });
  }
}

// Export singleton instance
export const advanced3DService = new Advanced3DService();

// Configuration validation
export const validateAdvanced3DConfig = (config: Advanced3DAssistantConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Unity 3D validation
  if (config.unity3D.enabled && !config.unity3D.environment) {
    errors.push('Unity 3D environment is required when Unity 3D is enabled');
  }

  // ChatDollKit validation
  if (config.chatDollKit.integration && !config.chatDollKit.lipSyncAccuracy) {
    errors.push('Lip-sync accuracy setting is required for ChatDollKit');
  }

  // KIMI K2 validation
  if (config.kimiK2.enabled && !config.kimiK2.renderingQuality) {
    errors.push('Rendering quality setting is required for KIMI K2');
  }

  // LiveKit validation
  if (config.liveKit.enabled && config.liveKit.realTimeAudio && !config.liveKit.noiseSuppression) {
    console.warn('LiveKit real-time audio is recommended with noise suppression enabled');
  }

  // Cultural validation
  const enabledLanguages = [
    config.cultural.hindiSupport.enabled,
    config.cultural.tamilSupport.enabled,
    config.cultural.teluguSupport.enabled,
    config.cultural.bengaliSupport.enabled,
    config.cultural.marathiSupport.enabled,
    config.cultural.gujaratiSupport.enabled
  ].filter(Boolean);

  if (enabledLanguages.length === 0) {
    console.warn('No multilingual support enabled - consider enabling at least one language');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default Advanced3DService;