/**
 * Conversation Routes
 * API endpoints for multi-conversation chat system
 */

import { Router } from 'express';
import { multiConversationChatSystem } from '../services/multi-conversation-chat-system';

const router = Router();

// Create new conversation
router.post('/conversations', async (req, res) => {
  try {
    const { projectId, initialMessage } = req.body;
    const userId = req.user?.id || '1'; // Default user for demo

    if (!projectId || !initialMessage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, initialMessage'
      });
    }

    const conversation = await multiConversationChatSystem.createConversation(
      userId,
      projectId,
      initialMessage
    );

    res.json({
      success: true,
      data: conversation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send message to conversation
router.post('/conversations/message', async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: conversationId, content'
      });
    }

    const responses = await multiConversationChatSystem.processUserMessage(
      conversationId,
      content
    );

    res.json({
      success: true,
      data: responses
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get conversation statistics
router.get('/conversations/stats', async (req, res) => {
  try {
    const stats = multiConversationChatSystem.getConversationStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Archive conversation
router.post('/conversations/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    await multiConversationChatSystem.archiveConversation(id);
    
    res.json({
      success: true,
      message: 'Conversation archived successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export conversation
router.get('/conversations/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const conversationData = multiConversationChatSystem.exportConversation(id);
    
    res.json({
      success: true,
      data: conversationData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as conversationRouter };