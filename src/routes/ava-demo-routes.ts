/**
 * AVA Demo Assistant API Routes
 * Comprehensive routes for text/voice/video/3D/AR/VR interactions
 */

import express from 'express';
import multer from 'multer';
import { avaDemoAssistant } from '../services/ava-demo-assistant';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /api/ava-demo/info - Get AVA information
 */
router.get('/info', async (req, res) => {
  try {
    const info = {
      name: "AVA - Advanced Virtual Assistant",
      company: "AVA Global Logistics",
      capabilities: [
        "Text Chat",
        "Voice Chat", 
        "Video Chat",
        "3D Avatar Interaction",
        "AR/VR Experience",
        "Multi-language Support",
        "Real-time Voice Processing",
        "Emotions & Gestures",
        "Lip Sync",
        "Smart Knowledge Base"
      ],
      supported_languages: avaDemoAssistant.getSupportedLanguages(),
      personality: avaDemoAssistant.getPersonality(),
      avatar_3d: avaDemoAssistant.get3DAvatar(),
      knowledge_base: avaDemoAssistant.getKnowledgeBase()
    };

    res.json({
      success: true,
      data: info,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error getting AVA info:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ava-demo/chat/text - Text chat with AVA
 */
router.post('/chat/text', async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`💬 AVA text chat: "${message.substring(0, 50)}..." in ${language}`);
    
    const interaction = await avaDemoAssistant.processTextChat(message, language);
    
    res.json({
      success: true,
      data: interaction,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error in AVA text chat:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ava-demo/chat/voice - Voice chat with AVA
 */
router.post('/chat/voice', upload.single('audio'), async (req, res) => {
  try {
    const { language = 'en' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    console.log(`🎤 AVA voice chat in ${language}`);
    console.log('📁 File details:', {
      originalname: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size
    });
    
    const interaction = await avaDemoAssistant.processVoiceChat(req.file.buffer, language);
    
    console.log('🎯 Voice processing result:', {
      transcription: interaction.transcription?.substring(0, 100),
      response: interaction.response?.substring(0, 100)
    });
    
    res.json({
      success: true,
      data: interaction,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error in AVA voice chat:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ava-demo/chat/3d - 3D Avatar interaction
 */
router.post('/chat/3d', async (req, res) => {
  try {
    const { message, interaction_type = '3d', language = 'en' } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    if (!['3d', 'ar', 'vr'].includes(interaction_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid interaction type. Must be 3d, ar, or vr'
      });
    }

    console.log(`🥽 AVA ${interaction_type.toUpperCase()} interaction: "${message.substring(0, 50)}..." in ${language}`);
    
    const interaction = await avaDemoAssistant.process3DInteraction(message, interaction_type as any, language);
    
    res.json({
      success: true,
      data: interaction,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error in AVA 3D interaction:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ava-demo/voice/realtime/start - Start real-time voice
 */
router.post('/voice/realtime/start', async (req, res) => {
  try {
    const { connection_id, language = 'en' } = req.body;
    
    if (!connection_id) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID is required'
      });
    }

    await avaDemoAssistant.startRealTimeVoice(connection_id, language);
    
    res.json({
      success: true,
      message: 'Real-time voice started',
      connection_id,
      language,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error starting real-time voice:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ava-demo/voice/realtime/chunk - Process real-time voice chunk
 */
router.post('/voice/realtime/chunk', upload.single('audio'), async (req, res) => {
  try {
    const { connection_id } = req.body;
    
    if (!connection_id || !req.file) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID and audio file are required'
      });
    }

    const result = await avaDemoAssistant.processRealTimeVoiceChunk(connection_id, req.file.buffer);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error processing voice chunk:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/ava-demo/greeting - Get localized greeting message
 */
router.post('/greeting', async (req, res) => {
  try {
    const { language = 'en' } = req.body;
    
    console.log(`🌍 Getting greeting for language: ${language}`);
    
    const greeting = avaDemoAssistant.getGreeting(language);
    
    res.json({
      success: true,
      greeting,
      language,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error getting greeting:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ava-demo/interactions - Get all interactions
 */
router.get('/interactions', async (req, res) => {
  try {
    const interactions = await avaDemoAssistant.getAllInteractions();
    
    res.json({
      success: true,
      data: interactions,
      count: interactions.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error getting interactions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ava-demo/interactions/:id - Get specific interaction
 */
router.get('/interactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const interaction = await avaDemoAssistant.getInteraction(id);
    
    if (!interaction) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found'
      });
    }
    
    res.json({
      success: true,
      data: interaction,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error getting interaction:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ava-demo/languages - Get supported languages
 */
router.get('/languages', async (req, res) => {
  try {
    const languages = avaDemoAssistant.getSupportedLanguages();
    
    res.json({
      success: true,
      data: languages,
      count: languages.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error getting languages:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ava-demo/avatar/3d - Get 3D avatar configuration
 */
router.get('/avatar/3d', async (req, res) => {
  try {
    const avatar = avaDemoAssistant.get3DAvatar();
    
    res.json({
      success: true,
      data: avatar,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error getting 3D avatar:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/ava-demo/knowledge-base - Get knowledge base information
 */
router.get('/knowledge-base', async (req, res) => {
  try {
    const knowledgeBase = avaDemoAssistant.getKnowledgeBase();
    
    res.json({
      success: true,
      data: knowledgeBase,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error getting knowledge base:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;