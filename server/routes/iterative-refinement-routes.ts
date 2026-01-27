
import express from 'express';
import { iterativeRefinementService } from '../services/iterative-refinement-service';

const router = express.Router();

// Start a new refinement session
router.post('/refinement/start', async (req, res) => {
  try {
    const { prompt, type, context, userId } = req.body;
    
    if (!prompt || !type) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and type are required'
      });
    }

    const session = await iterativeRefinementService.startRefinementSession(
      userId || 1,
      prompt,
      type,
      context || {}
    );

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        initialIteration: session.iterations[0],
        status: session.status
      }
    });
  } catch (error: any) {
    console.error('Failed to start refinement session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start refinement session'
    });
  }
});

// Add user feedback and generate new iteration
router.post('/refinement/:sessionId/feedback', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { feedback, conversationMessage } = req.body;

    if (!feedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback is required'
      });
    }

    const newIteration = await iterativeRefinementService.addUserFeedback(
      sessionId,
      feedback,
      conversationMessage
    );

    res.json({
      success: true,
      data: {
        iteration: newIteration,
        sessionId
      }
    });
  } catch (error: any) {
    console.error('Failed to process feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process feedback'
    });
  }
});

// Handle conversational interaction
router.post('/refinement/:sessionId/chat', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const agentResponse = await iterativeRefinementService.handleConversation(
      sessionId,
      message
    );

    res.json({
      success: true,
      data: {
        agentResponse,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Failed to handle conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to handle conversation'
    });
  }
});

// Get session details with all iterations
router.get('/refinement/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = iterativeRefinementService.getSessionDetails(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const conversationHistory = iterativeRefinementService.getConversationHistory(sessionId);

    res.json({
      success: true,
      data: {
        session,
        conversationHistory
      }
    });
  } catch (error: any) {
    console.error('Failed to get session details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get session details'
    });
  }
});

// Compare two iterations
router.post('/refinement/:sessionId/compare', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { iteration1Id, iteration2Id } = req.body;

    if (!iteration1Id || !iteration2Id) {
      return res.status(400).json({
        success: false,
        error: 'Both iteration IDs are required'
      });
    }

    const result = iterativeRefinementService.compareIterations(
      sessionId,
      iteration1Id,
      iteration2Id
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Failed to compare iterations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compare iterations'
    });
  }
});

// Get conversation history
router.get('/refinement/:sessionId/conversation', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const conversationHistory = iterativeRefinementService.getConversationHistory(sessionId);

    res.json({
      success: true,
      data: {
        conversation: conversationHistory,
        sessionId
      }
    });
  } catch (error: any) {
    console.error('Failed to get conversation history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get conversation history'
    });
  }
});

export default router;
