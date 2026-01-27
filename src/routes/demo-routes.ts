import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Assistants directory path
const ASSISTANTS_DIR = path.join(process.cwd(), 'server', 'assistants');

// Helper function to load assistant configuration
async function loadAssistantConfig(assistantId: string) {
  const configPath = path.join(ASSISTANTS_DIR, `${assistantId}.json`);
  
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load assistant ${assistantId}:`, error);
    throw new Error(`Assistant ${assistantId} not found`);
  }
}

// GET /api/demos/:assistantId/info - Get assistant info for demo page
router.get('/:assistantId/info', async (req, res) => {
  try {
    const { assistantId } = req.params;
    const config = await loadAssistantConfig(assistantId);
    
    // Return public info suitable for demo page
    res.json({
      id: config.id,
      name: config.name,
      description: config.description,
      avatarStyle: config.avatarStyle,
      modelUrl: config.modelUrl,
      voiceConfig: config.voiceConfig,
      capabilities: [
        'Text Chat',
        'Voice Interaction',
        '3D Avatar',
        'Multi-language Support',
        'Real-time Responses'
      ]
    });
    
  } catch (error) {
    console.error('Error getting assistant info:', error);
    res.status(404).json({ 
      error: 'Assistant not found',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/demos/:assistantId/chat/text - Handle text chat for specific assistant
router.post('/:assistantId/chat/text', async (req, res) => {
  try {
    const { assistantId } = req.params;
    const { message, language = 'en-US' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Load assistant configuration
    const config = await loadAssistantConfig(assistantId);
    
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Create enhanced prompt with assistant's system prompt
    const enhancedPrompt = `${config.systemPrompt}

Language: Please respond in ${language}

User: ${message}

Assistant (${config.name}):`;
    
    // Generate response
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response.text();
    
    console.log(`🤖 ${config.name} responded to: "${message}"`);
    
    res.json({
      response,
      assistantName: config.name,
      language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in text chat:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/demos/:assistantId/chat/voice - Handle voice chat for specific assistant  
router.post('/:assistantId/chat/voice', async (req, res) => {
  try {
    const { assistantId } = req.params;
    const { audioData, language = 'en-US' } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }
    
    // Load assistant configuration
    const config = await loadAssistantConfig(assistantId);
    
    // Initialize Gemini model for audio processing
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Convert base64 audio to buffer for processing
    const audioBuffer = Buffer.from(audioData.split(',')[1], 'base64');
    
    // For now, we'll use a placeholder transcription
    // In a real implementation, you would use Whisper or another STT service
    const transcription = "Voice message received"; // Placeholder
    
    // Create enhanced prompt with assistant's system prompt
    const enhancedPrompt = `${config.systemPrompt}

Language: Please respond in ${language}
Voice Input: ${transcription}

Provide a natural, conversational response as ${config.name}:`;
    
    // Generate response
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response.text();
    
    console.log(`🎤 ${config.name} responded to voice input`);
    
    res.json({
      response,
      transcription,
      assistantName: config.name,
      language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in voice chat:', error);
    res.status(500).json({ 
      error: 'Failed to process voice message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/demos/:assistantId/chat/3d - Handle 3D interaction for specific assistant
router.post('/:assistantId/chat/3d', async (req, res) => {
  try {
    const { assistantId } = req.params;
    const { message, interactionType = '3d', language = 'en-US' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Load assistant configuration
    const config = await loadAssistantConfig(assistantId);
    
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Create enhanced prompt for 3D interaction
    const enhancedPrompt = `${config.systemPrompt}

Interaction Mode: ${interactionType.toUpperCase()} Experience
Language: Please respond in ${language}

You are currently in an immersive ${interactionType} environment. Provide responses that acknowledge this immersive context and enhance the user's experience with spatial and interactive elements when appropriate.

User: ${message}

${config.name} (in ${interactionType} mode):`;
    
    // Generate response
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response.text();
    
    console.log(`🎭 ${config.name} responded in ${interactionType} mode: "${message}"`);
    
    res.json({
      response,
      assistantName: config.name,
      interactionType,
      language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in 3D chat:', error);
    res.status(500).json({ 
      error: 'Failed to process 3D message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;