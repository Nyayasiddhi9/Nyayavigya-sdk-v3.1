import { Router } from 'express';
import { realTimeOrchestration } from '../services/real-time-ai-orchestration';

const router = Router();

// Start a new orchestration session
router.post('/start', async (req, res) => {
  try {
    const { projectType, requirements, preferences } = req.body;
    
    const sessionId = await realTimeOrchestration.startOrchestrationSession(
      projectType,
      requirements,
      preferences
    );
    
    res.json({
      success: true,
      sessionId,
      message: 'AI orchestration session started successfully'
    });
  } catch (error) {
    console.error('Error starting orchestration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start orchestration'
    });
  }
});

// Get session status
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = realTimeOrchestration.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: session.id,
        status: session.status,
        agents: session.agents,
        fileCount: session.files.size,
        messageCount: session.messages.length,
        startTime: session.startTime,
        estimatedCompletion: session.estimatedCompletion
      }
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session status'
    });
  }
});

// Get session messages
router.get('/messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;
    
    const messages = realTimeOrchestration.getSessionMessages(sessionId, Number(limit));
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting session messages:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session messages'
    });
  }
});

// Get generated files
router.get('/files/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const files = realTimeOrchestration.getGeneratedFiles(sessionId);
    
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Error getting generated files:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get generated files'
    });
  }
});

// Send user message to session
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and message are required'
      });
    }
    
    await realTimeOrchestration.sendUserMessage(sessionId, message);
    
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending user message:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    });
  }
});

export default router;