/**
 * Kimi K2 API Routes
 * 12th LLM Provider integration with cost optimization and 3D capabilities
 */

import express from 'express';
import { z } from 'zod';
import { storage } from '../storage-enhanced';
import KimiK2Provider from '../services/kimi-k2-provider';
// import Avatar3DSystem from '../services/avatar-3d-system';
const Avatar3DSystem = { create: async () => ({ id: 'stub' }), configure: async () => ({}) };
// import ImmersiveExperienceEngine from '../services/immersive-experience-engine';

const router = express.Router();

// Validation schemas
const kimiK2ConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  modelPreferences: z.object({
    model: z.string().default('kimi-k2-instruct'),
    temperature: z.number().min(0).max(2).default(0.6)
  }).optional(),
  costLimits: z.object({
    dailyLimit: z.number().positive().default(100),
    monthlyLimit: z.number().positive().default(1000)
  }).optional(),
  multilingualSettings: z.object({
    primaryLanguage: z.string().default('en'),
    supportedLanguages: z.array(z.string()).default(['en', 'hi', 'ta', 'te', 'bn'])
  }).optional()
});

const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  language: z.string().optional(),
  agenticMode: z.boolean().default(false)
});

const avatar3DConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  style: z.enum(['3d-realistic', '3d-cartoon', 'holographic', 'minimal']),
  personality: z.object({
    name: z.string(),
    traits: z.array(z.string()),
    communicationStyle: z.enum(['professional', 'casual', 'friendly', 'technical']),
    expertise: z.array(z.string())
  }),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  voiceProfile: z.object({
    provider: z.enum(['elevenlabs', 'azure', 'google', 'custom']),
    voiceId: z.string(),
    emotionRange: z.enum(['minimal', 'moderate', 'full']),
    pitch: z.number().default(1.0),
    speed: z.number().default(1.0)
  }),
  immersiveFeatures: z.array(z.enum(['ar', 'vr', 'spatial-audio', 'gesture-control', 'eye-tracking'])),
  knowledgeBases: z.array(z.string()).default([])
});

const immersiveExperienceSchema = z.object({
  type: z.enum(['ar', 'vr', 'web3d', 'game']),
  environment: z.string().default('office'),
  assistantId: z.string().optional(),
  interactions: z.array(z.string()),
  features: z.array(z.string())
});

// Configure Kimi K2 provider
router.post('/config', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const configData = kimiK2ConfigSchema.parse(req.body);
    
    // Create Kimi K2 provider to test connection
    const kimiProvider = new KimiK2Provider({
      apiKey: configData.apiKey,
      ...configData.modelPreferences
    });

    // Test connection
    const connectionTest = await kimiProvider.testConnection();
    if (!connectionTest) {
      return res.status(400).json({ error: 'Invalid API key or connection failed' });
    }

    // Encrypt API key (simplified - in production use proper encryption)
    const encryptedKey = Buffer.from(configData.apiKey).toString('base64');

    // Save configuration to database
    const config = await storage.createKimiK2Config({
      userId,
      apiKeyEncrypted: encryptedKey,
      modelPreferences: configData.modelPreferences || {},
      costLimits: configData.costLimits || {},
      multilingualSettings: configData.multilingualSettings || {}
    });

    res.json({ 
      success: true, 
      message: 'Kimi K2 configured successfully',
      capabilities: kimiProvider.getProviderInfo()
    });
  } catch (error) {
    console.error('Kimi K2 configuration error:', error);
    res.status(500).json({ error: 'Failed to configure Kimi K2' });
  }
});

// Get Kimi K2 configuration
router.get('/config', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const config = await storage.getKimiK2Config(userId);
    if (!config) {
      return res.status(404).json({ error: 'Kimi K2 not configured' });
    }

    // Remove sensitive data
    const { apiKeyEncrypted, ...safeConfig } = config;
    
    res.json(safeConfig);
  } catch (error) {
    console.error('Get Kimi K2 config error:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Chat with Kimi K2
router.post('/chat', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const requestData = chatRequestSchema.parse(req.body);
    
    // Get user's Kimi K2 configuration
    const config = await storage.getKimiK2Config(userId);
    if (!config) {
      return res.status(400).json({ error: 'Kimi K2 not configured. Please configure first.' });
    }

    // Decrypt API key
    const apiKey = Buffer.from(config.apiKeyEncrypted, 'base64').toString();
    
    // Create Kimi K2 provider
    const kimiProvider = new KimiK2Provider({
      apiKey,
      ...config.modelPreferences
    });

    let response;

    if (requestData.language && requestData.language !== 'en') {
      // Use multilingual capabilities
      response = await kimiProvider.generateMultilingualContent(
        requestData.messages[requestData.messages.length - 1].content,
        [requestData.language],
        'chat'
      );
    } else if (requestData.agenticMode) {
      // Use agentic capabilities with tool calling
      response = await kimiProvider.generateAgenticWorkflow(
        requestData.messages[requestData.messages.length - 1].content,
        [] // Tools can be added based on context
      );
    } else {
      // Standard chat
      response = await kimiProvider.generateResponse({
        messages: requestData.messages,
        temperature: requestData.temperature,
        maxTokens: requestData.maxTokens
      });
    }

    // Update usage statistics
    await storage.updateKimiK2Usage(userId, response.usage.totalTokens, response.cost);

    res.json({
      content: response.content,
      cost: response.cost,
      usage: response.usage,
      responseTime: response.responseTime,
      provider: 'kimi-k2'
    });
  } catch (error) {
    console.error('Kimi K2 chat error:', error);
    res.status(500).json({ error: 'Chat request failed' });
  }
});

// Generate 3D code with Kimi K2
router.post('/generate-3d', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { prompt, type = '3d-scene' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get user's Kimi K2 configuration
    const config = await storage.getKimiK2Config(userId);
    if (!config) {
      return res.status(400).json({ error: 'Kimi K2 not configured' });
    }

    // Decrypt API key
    const apiKey = Buffer.from(config.apiKeyEncrypted, 'base64').toString();
    
    // Create Kimi K2 provider
    const kimiProvider = new KimiK2Provider({ apiKey });

    // Generate 3D code
    const response = await kimiProvider.generate3DCode(prompt, type);

    // Update usage
    await storage.updateKimiK2Usage(userId, response.usage.totalTokens, response.cost);

    res.json({
      code: response.content,
      cost: response.cost,
      usage: response.usage,
      type,
      provider: 'kimi-k2'
    });
  } catch (error) {
    console.error('3D generation error:', error);
    res.status(500).json({ error: 'Failed to generate 3D code' });
  }
});

// Create 3D Avatar Assistant
router.post('/avatar-3d', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const avatarConfig = avatar3DConfigSchema.parse(req.body);
    
    // Get user's Kimi K2 configuration
    const config = await storage.getKimiK2Config(userId);
    if (!config) {
      return res.status(400).json({ error: 'Kimi K2 not configured' });
    }

    // Decrypt API key
    const apiKey = Buffer.from(config.apiKeyEncrypted, 'base64').toString();
    
    // Create services
    const kimiProvider = new KimiK2Provider({ apiKey });
    const avatar3DSystem = new Avatar3DSystem(kimiProvider);

    // Create 3D assistant
    const assistant = await avatar3DSystem.createAssistant(userId, avatarConfig);

    res.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        config: assistant.config,
        capabilities: ['3D Avatar', 'Voice Synthesis', 'Multilingual Chat', 'Immersive Experiences']
      }
    });
  } catch (error) {
    console.error('Avatar creation error:', error);
    res.status(500).json({ error: 'Failed to create 3D avatar' });
  }
});

// Get user's 3D avatars
router.get('/avatars', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const avatars = await storage.getUserAvatar3Ds(userId);
    
    res.json({ avatars });
  } catch (error) {
    console.error('Get avatars error:', error);
    res.status(500).json({ error: 'Failed to get avatars' });
  }
});

// Chat with 3D Avatar in specific language
router.post('/avatar/:id/chat', async (req, res) => {
  try {
    const userId = req.user?.id;
    const assistantId = req.params.id;
    const { message, language = 'en' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user's Kimi K2 configuration
    const config = await storage.getKimiK2Config(userId);
    if (!config) {
      return res.status(400).json({ error: 'Kimi K2 not configured' });
    }

    // Decrypt API key
    const apiKey = Buffer.from(config.apiKeyEncrypted, 'base64').toString();
    
    // Create services
    const kimiProvider = new KimiK2Provider({ apiKey });
    const avatar3DSystem = new Avatar3DSystem(kimiProvider);

    // Generate multilingual response
    const response = await avatar3DSystem.generateMultilingualChat(assistantId, message, language);

    // Increment usage
    await storage.incrementAvatar3DUsage(parseInt(assistantId));

    res.json(response);
  } catch (error) {
    console.error('Avatar chat error:', error);
    res.status(500).json({ error: 'Avatar chat failed' });
  }
});

// Create immersive experience
router.post('/immersive-experience', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const experienceConfig = immersiveExperienceSchema.parse(req.body);
    
    // Get user's Kimi K2 configuration
    const config = await storage.getKimiK2Config(userId);
    if (!config) {
      return res.status(400).json({ error: 'Kimi K2 not configured' });
    }

    // Decrypt API key
    const apiKey = Buffer.from(config.apiKeyEncrypted, 'base64').toString();
    
    // Create services
    const kimiProvider = new KimiK2Provider({ apiKey });
    const immersiveEngine = new ImmersiveExperienceEngine(kimiProvider);

    // Create immersive experience
    let experience;
    
    switch (experienceConfig.type) {
      case 'ar':
        experience = await immersiveEngine.generateARExperience({
          targetSurface: 'horizontal',
          objects: experienceConfig.features,
          interactions: experienceConfig.interactions,
          assistantBehavior: 'helpful_guide'
        });
        break;
      case 'vr':
      case 'web3d':
        experience = await immersiveEngine.createWebXRExperience(experienceConfig);
        break;
      case 'game':
        experience = await immersiveEngine.generateGameExperience({
          gameType: 'educational',
          assistantRole: 'guide',
          mechanics: experienceConfig.features,
          difficulty: 'medium'
        });
        break;
      default:
        experience = await immersiveEngine.createWebXRExperience(experienceConfig);
    }

    // Save to database
    const savedExperience = await storage.createImmersiveExperience({
      assistantId: experienceConfig.assistantId ? parseInt(experienceConfig.assistantId) : null,
      name: `${experienceConfig.type.toUpperCase()} Experience`,
      experienceType: experienceConfig.type,
      sceneConfig: experience,
      interactionMap: { interactions: experienceConfig.interactions },
      spatialElements: [],
      voiceCommands: [],
      webXRSupport: true,
      deploymentTargets: ['web']
    });

    res.json({
      success: true,
      experience: savedExperience,
      code: experience
    });
  } catch (error) {
    console.error('Immersive experience error:', error);
    res.status(500).json({ error: 'Failed to create immersive experience' });
  }
});

// Get Kimi K2 provider capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      name: 'Kimi K2',
      model: 'kimi-k2-instruct',
      contextWindow: '128K tokens',
      capabilities: [
        'Agentic Intelligence',
        'Tool Calling',
        'Multilingual Support (47.3% multilingual coding)',
        '3D Development (65.8% SWE-bench performance)',
        'WebXR/AR/VR Development',
        'Game Development',
        'Spatial Computing',
        'Real-time 3D Scene Generation',
        'Voice-enabled 3D Assistants'
      ],
      pricing: {
        input: '$0.15 per 1M tokens',
        output: '$2.50 per 1M tokens',
        costAdvantage: '95% cheaper than GPT-4/Claude'
      },
      supportedLanguages: [
        'English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 
        'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese'
      ],
      immersiveFeatures: [
        '3D Avatar Creation',
        'WebXR Experience Generation',
        'AR Object Placement',
        'VR Environment Design',
        'Spatial UI Development',
        'Game Mechanics Creation',
        'Voice Synthesis Integration',
        'Multi-platform Deployment'
      ]
    };

    res.json(capabilities);
  } catch (error) {
    console.error('Get capabilities error:', error);
    res.status(500).json({ error: 'Failed to get capabilities' });
  }
});

// Advanced 3D AI Assistant Test Case Routes (ChatdollKit + EchoMimic Integration)
router.post('/3d-assistant/test-case', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('🇮🇳 Creating comprehensive 3D AI Assistant test case...');
    
    // Import the enhanced service
    const { default: ImmersiveAIAssistantBuilderService } = await import('../services/immersive-ai-assistant-builder');
    const assistantBuilder = new ImmersiveAIAssistantBuilderService();

    // Create the comprehensive test case
    const testResult = await assistantBuilder.createTestCase3DAssistant();
    
    if (testResult.status === 'success') {
      // Generate demo script
      const demoScript = assistantBuilder.generateDemoScript();
      
      res.json({
        success: true,
        testCase: {
          id: testResult.id,
          assistant: testResult.assistant,
          immersiveScene: testResult.immersiveScene,
          deploymentUrl: testResult.deploymentUrl,
          features: {
            chatdollKitIntegration: true,
            echoMimicV2: true,
            multilingualSupport: ['hindi', 'english', 'tamil', 'bengali'],
            arvrCapabilities: true,
            knowledgeBaseRAG: true,
            culturalCustomization: true
          },
          customizations: {
            indianVRMModels: true,
            hindiWakeWords: ['नमस्ते', 'आर्या'],
            tamilWakeWords: ['வணக்கம்', 'ஆர்யா'],
            lipSyncRetroflexConsonants: ['ड', 'ढ', 'ण', 'ट', 'ठ'],
            ttsOptimization: 'completed',
            culturalGestures: true
          },
          demoScript
        },
        message: 'Comprehensive 3D AI Assistant test case created successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: testResult.error || 'Failed to create test case'
      });
    }
  } catch (error) {
    console.error('3D Assistant test case creation error:', error);
    res.status(500).json({ error: 'Failed to create test case' });
  }
});

// Validate 3D AI Assistant Test Case
router.get('/3d-assistant/test-case/:id/validate', async (req, res) => {
  try {
    const userId = req.user?.id;
    const assistantId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log(`🧪 Validating 3D AI Assistant test case: ${assistantId}`);
    
    const { default: ImmersiveAIAssistantBuilderService } = await import('../services/immersive-ai-assistant-builder');
    const assistantBuilder = new ImmersiveAIAssistantBuilderService();

    // Validate the test case
    const validationResult = await assistantBuilder.validateTestCase(assistantId);
    
    res.json({
      success: true,
      validation: validationResult,
      message: 'Test case validation completed'
    });
  } catch (error) {
    console.error('Test case validation error:', error);
    res.status(500).json({ error: 'Failed to validate test case' });
  }
});

// Get Demo Script for Test Case
router.get('/3d-assistant/demo-script', async (req, res) => {
  try {
    const { default: ImmersiveAIAssistantBuilderService } = await import('../services/immersive-ai-assistant-builder');
    const assistantBuilder = new ImmersiveAIAssistantBuilderService();

    const demoScript = assistantBuilder.generateDemoScript();
    
    res.json({
      success: true,
      demoScript,
      message: 'Demo script generated successfully'
    });
  } catch (error) {
    console.error('Demo script generation error:', error);
    res.status(500).json({ error: 'Failed to generate demo script' });
  }
});

// Enhanced Immersive Assistant Creation with ChatdollKit + EchoMimic
router.post('/immersive-assistant/create-enhanced', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate request body
    if (!req.body.basic?.name || !req.body.avatar3D?.enabled) {
      return res.status(400).json({ 
        error: 'Invalid request: basic.name and avatar3D.enabled are required' 
      });
    }

    console.log('🚀 Creating enhanced immersive AI assistant with ChatdollKit + EchoMimic...');
    
    const { default: ImmersiveAIAssistantBuilderService } = await import('../services/immersive-ai-assistant-builder');
    const assistantBuilder = new ImmersiveAIAssistantBuilderService();

    // Create the enhanced assistant
    const result = await assistantBuilder.createAssistant(req.body, userId);
    
    if (result.status === 'success') {
      res.json({
        success: true,
        assistant: result.assistant,
        immersiveScene: result.immersiveScene,
        deploymentUrl: result.deploymentUrl,
        features: {
          chatdollKitEnabled: req.body.avatar3D?.chatdollKit?.enabled || false,
          echoMimicEnabled: req.body.avatar3D?.echoMimic?.enabled || false,
          multilingualSupport: req.body.basic?.languages || [],
          arvrCapabilities: req.body.immersiveExperience?.arvrCapabilities || {},
          autoLanguageDetection: req.body.basic?.autoLanguageDetection || false
        },
        message: 'Enhanced immersive AI assistant created successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to create assistant'
      });
    }
  } catch (error) {
    console.error('Enhanced assistant creation error:', error);
    res.status(500).json({ error: 'Failed to create enhanced assistant' });
  }
});

// Get Indian Language Configuration
router.get('/indian-languages/config', async (req, res) => {
  try {
    const indianLanguageConfig = {
      supportedLanguages: [
        'hindi', 'english', 'tamil', 'telugu', 'bengali', 
        'marathi', 'gujarati', 'kannada', 'punjabi', 'malayalam', 'assamese'
      ],
      wakeWords: {
        'hindi': ['नमस्ते', 'सुनो', 'हैलो', 'आर्या', 'असिस्टेंट'],
        'tamil': ['வணக்கம்', 'கேள்', 'ஆர்யா', 'உதவியாளர்'],
        'telugu': ['నమస్కారం', 'వినండి', 'ఆర్య', 'సహాయకుడు'],
        'bengali': ['নমস্কার', 'শোন', 'আর্যা', 'সহায়ক'],
        'english': ['hello', 'namaste', 'arya', 'assistant']
      },
      ttsVoices: {
        'hindi': 'hi-IN-MadhurNeural',
        'tamil': 'ta-IN-PallaviNeural',
        'telugu': 'te-IN-ShrutiNeural',
        'bengali': 'bn-IN-BashkarNeural',
        'english': 'en-IN-NeerjaNeural'
      },
      retroflexConsonants: {
        'hindi': ['ड', 'ढ', 'ण', 'ट', 'ठ'],
        'description': 'Special consonants requiring custom lip-sync curves'
      },
      vrmModels: {
        'hindi': 'indian_female_hindi_professional.vrm',
        'tamil': 'indian_female_tamil_traditional.vrm',
        'english': 'indian_female_english_modern.vrm'
      },
      culturalFeatures: {
        gestures: ['namaste', 'indian_head_nod', 'respectful_bow'],
        expressions: ['bollywood_expressions', 'festival_awareness'],
        contexts: ['Indian festivals', 'regional customs', 'business etiquette']
      }
    };

    res.json({
      success: true,
      config: indianLanguageConfig,
      message: 'Indian language configuration retrieved successfully'
    });
  } catch (error) {
    console.error('Indian language config error:', error);
    res.status(500).json({ error: 'Failed to get language configuration' });
  }
});

export default router;