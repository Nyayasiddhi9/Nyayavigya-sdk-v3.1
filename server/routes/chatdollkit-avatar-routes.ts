/**
 * ChatDollKit Avatar API Routes
 * RESTful API for ChatDollKit 3D Avatar with KIMI K2 integration
 */

import { Router } from 'express';
import { chatDollKitAvatarService } from '../services/chatdollkit-avatar-service';

const router = Router();

/**
 * POST /api/chatdollkit-avatar/process-interaction
 * Process interaction through ChatDollKit avatar with KIMI K2
 */
router.post('/process-interaction', async (req, res) => {
  try {
    const interactionData = req.body;
    
    if (!interactionData.user_input && !interactionData.response_text) {
      return res.status(400).json({
        error: 'user_input or response_text is required'
      });
    }
    
    console.log(`🎭 Processing ChatDollKit ${interactionData.type || 'text'} interaction`);
    
    const interaction = await chatDollKitAvatarService.processAVAInteraction(interactionData);
    
    res.json({
      success: true,
      interaction,
      processing_time: interaction.processing_time,
      avatar_state: chatDollKitAvatarService.getCurrentState()
    });
    
  } catch (error) {
    console.error('❌ Error in ChatDollKit avatar interaction:', error);
    res.status(500).json({
      error: 'Failed to process ChatDollKit avatar interaction',
      details: error.message
    });
  }
});

/**
 * GET /api/chatdollkit-avatar/state
 * Get current avatar state
 */
router.get('/state', (req, res) => {
  try {
    const state = chatDollKitAvatarService.getCurrentState();
    res.json({
      success: true,
      state
    });
  } catch (error) {
    console.error('❌ Error getting avatar state:', error);
    res.status(500).json({
      error: 'Failed to get avatar state',
      details: error.message
    });
  }
});

/**
 * GET /api/chatdollkit-avatar/config
 * Get avatar configuration
 */
router.get('/config', (req, res) => {
  try {
    const config = chatDollKitAvatarService.getConfig();
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('❌ Error getting avatar config:', error);
    res.status(500).json({
      error: 'Failed to get avatar config',
      details: error.message
    });
  }
});

/**
 * PUT /api/chatdollkit-avatar/config
 * Update avatar configuration
 */
router.put('/config', (req, res) => {
  try {
    const updates = req.body;
    
    chatDollKitAvatarService.updateConfig(updates);
    const updatedConfig = chatDollKitAvatarService.getConfig();
    
    res.json({
      success: true,
      config: updatedConfig,
      message: 'Avatar configuration updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating avatar config:', error);
    res.status(500).json({
      error: 'Failed to update avatar config',
      details: error.message
    });
  }
});

/**
 * GET /api/chatdollkit-avatar/interactions
 * Get all avatar interactions
 */
router.get('/interactions', (req, res) => {
  try {
    const interactions = chatDollKitAvatarService.getAllInteractions();
    res.json({
      success: true,
      interactions,
      count: interactions.length
    });
  } catch (error) {
    console.error('❌ Error getting avatar interactions:', error);
    res.status(500).json({
      error: 'Failed to get avatar interactions',
      details: error.message
    });
  }
});

/**
 * GET /api/chatdollkit-avatar/interactions/:id
 * Get specific avatar interaction
 */
router.get('/interactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const interaction = chatDollKitAvatarService.getInteraction(id);
    
    if (!interaction) {
      return res.status(404).json({
        error: 'Interaction not found'
      });
    }
    
    res.json({
      success: true,
      interaction
    });
    
  } catch (error) {
    console.error('❌ Error getting avatar interaction:', error);
    res.status(500).json({
      error: 'Failed to get avatar interaction',
      details: error.message
    });
  }
});

/**
 * POST /api/chatdollkit-avatar/trigger-animation
 * Manually trigger avatar animation
 */
router.post('/trigger-animation', (req, res) => {
  try {
    const { animation, duration } = req.body;
    
    if (!animation) {
      return res.status(400).json({
        error: 'animation is required'
      });
    }
    
    // Emit animation trigger event
    chatDollKitAvatarService.emit('manual_animation_trigger', {
      animation,
      duration: duration || 2000,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: `Animation "${animation}" triggered successfully`
    });
    
  } catch (error) {
    console.error('❌ Error triggering animation:', error);
    res.status(500).json({
      error: 'Failed to trigger animation',
      details: error.message
    });
  }
});

/**
 * POST /api/chatdollkit-avatar/trigger-emotion
 * Manually trigger avatar emotion
 */
router.post('/trigger-emotion', (req, res) => {
  try {
    const { emotion, intensity, duration } = req.body;
    
    if (!emotion) {
      return res.status(400).json({
        error: 'emotion is required'
      });
    }
    
    // Emit emotion trigger event
    chatDollKitAvatarService.emit('manual_emotion_trigger', {
      emotion,
      intensity: intensity || 0.7,
      duration: duration || 3000,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: `Emotion "${emotion}" triggered successfully`
    });
    
  } catch (error) {
    console.error('❌ Error triggering emotion:', error);
    res.status(500).json({
      error: 'Failed to trigger emotion',
      details: error.message
    });
  }
});

/**
 * GET /api/chatdollkit-avatar/health
 * Get avatar health metrics
 */
router.get('/health', (req, res) => {
  try {
    const state = chatDollKitAvatarService.getCurrentState();
    const config = chatDollKitAvatarService.getConfig();
    
    res.json({
      success: true,
      health: {
        status: 'healthy',
        avatar_initialized: !!state,
        current_animation: state?.current_animation || 'unknown',
        current_emotion: state?.current_emotion || 'unknown',
        ai_provider: config.ai_integration.provider,
        voice_provider: config.voice_system.provider,
        behaviors_active: Object.values(config.human_behaviors).filter(Boolean).length,
        uptime: process.uptime(),
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting avatar health:', error);
    res.status(500).json({
      error: 'Failed to get avatar health',
      details: error.message
    });
  }
});

export default router;