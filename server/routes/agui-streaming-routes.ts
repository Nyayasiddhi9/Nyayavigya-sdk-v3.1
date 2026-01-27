/**
 * AG-UI Streaming Routes
 * SSE/WebSocket endpoints for real-time agent-to-UI communication
 * 
 * Replaces polling-based architecture with streaming for 10x faster responses
 */

import express, { type Request, type Response } from 'express';
import { aguiWAIIntegrationService } from '../services/agui-wai-integration-service';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { authorizeAGUISession, authorizeStartupAccess } from '../middleware/agui-session-authorization';
import type { AGUIEvent, AGUIInterruptResponse } from '@shared/agui-event-types';
import { z } from 'zod';

const router = express.Router();

// ================================================================================================
// SSE STREAMING ENDPOINTS
// ================================================================================================

/**
 * GET /api/agui/stream/:sessionId
 * Server-Sent Events (SSE) stream for real-time agent events
 * Protected: User must own the session
 */
router.get('/stream/:sessionId', authenticateToken, authorizeAGUISession, (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  
  const session = aguiWAIIntegrationService.getSession(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'AG-UI session not found',
    });
  }
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connection', sessionId, timestamp: Date.now() })}\n\n`);
  
  // Send event history if requested
  const includeHistory = req.query.includeHistory === 'true';
  if (includeHistory) {
    const history = aguiWAIIntegrationService.getSessionEvents(sessionId);
    history.forEach(event => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });
  }
  
  // Listen for new events
  const eventHandler = (event: AGUIEvent) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  };
  
  const heartbeatHandler = (data: { timestamp: number }) => {
    if (!res.writableEnded) {
      res.write(`: heartbeat ${data.timestamp}\n\n`);
    }
  };
  
  const closeHandler = () => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'session_closed', sessionId, timestamp: Date.now() })}\n\n`);
      res.end();
    }
  };
  
  aguiWAIIntegrationService.on(`event:${sessionId}`, eventHandler);
  aguiWAIIntegrationService.on(`heartbeat:${sessionId}`, heartbeatHandler);
  aguiWAIIntegrationService.on(`session:${sessionId}:close`, closeHandler);
  
  // Cleanup on client disconnect
  req.on('close', () => {
    aguiWAIIntegrationService.off(`event:${sessionId}`, eventHandler);
    aguiWAIIntegrationService.off(`heartbeat:${sessionId}`, heartbeatHandler);
    aguiWAIIntegrationService.off(`session:${sessionId}:close`, closeHandler);
    res.end();
    console.log(`📡 SSE client disconnected: ${sessionId.slice(0, 8)}...`);
  });
  
  console.log(`📡 SSE stream connected: ${sessionId.slice(0, 8)}...`);
});

// ================================================================================================
// SESSION MANAGEMENT
// ================================================================================================

/**
 * POST /api/agui/sessions
 * Create new AG-UI streaming session
 * Protected: User must own the startup
 */
router.post('/sessions', authenticateToken, authorizeStartupAccess, (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number(),
      sessionId: z.number().optional(),
      studioId: z.string().optional(),
    });
    
    const validated = schema.parse(req.body);
    const userId = req.user?.id;
    
    const streamSession = aguiWAIIntegrationService.createSession(
      validated.startupId,
      validated.sessionId,
      validated.studioId,
      userId
    );
    
    res.json({
      success: true,
      session: streamSession,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/agui/sessions/:sessionId
 * Get AG-UI session details
 * Protected: User must own the session
 */
router.get('/sessions/:sessionId', authenticateToken, authorizeAGUISession, (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  
  const session = aguiWAIIntegrationService.getSession(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found',
    });
  }
  
  res.json({
    success: true,
    session,
  });
});

/**
 * DELETE /api/agui/sessions/:sessionId
 * Close AG-UI streaming session
 * Protected: User must own the session
 */
router.delete('/sessions/:sessionId', authenticateToken, authorizeAGUISession, (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  
  aguiWAIIntegrationService.closeSession(sessionId);
  
  res.json({
    success: true,
    message: 'Session closed',
  });
});

/**
 * POST /api/agui/sessions/:sessionId/pause
 * Pause AG-UI session
 * Protected: User must own the session
 */
router.post('/sessions/:sessionId/pause', authenticateToken, authorizeAGUISession, (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  
  aguiWAIIntegrationService.pauseSession(sessionId);
  
  res.json({
    success: true,
    message: 'Session paused',
  });
});

/**
 * POST /api/agui/sessions/:sessionId/resume
 * Resume AG-UI session
 * Protected: User must own the session
 */
router.post('/sessions/:sessionId/resume', authenticateToken, authorizeAGUISession, (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  
  aguiWAIIntegrationService.resumeSession(sessionId);
  
  res.json({
    success: true,
    message: 'Session resumed',
  });
});

// ================================================================================================
// EVENT MANAGEMENT
// ================================================================================================

/**
 * GET /api/agui/sessions/:sessionId/events
 * Get session event history
 * Protected: User must own the session
 */
router.get('/sessions/:sessionId/events', authenticateToken, authorizeAGUISession, (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const eventFilter = req.query.eventFilter as string | undefined;
  
  const events = aguiWAIIntegrationService.getSessionEvents(sessionId, {
    eventFilter: eventFilter ? eventFilter.split(',') as any : undefined,
  });
  
  res.json({
    success: true,
    events,
    count: events.length,
  });
});

// ================================================================================================
// HUMAN-IN-THE-LOOP (INTERRUPT HANDLING)
// ================================================================================================

/**
 * POST /api/agui/sessions/:sessionId/interrupts/respond
 * User responds to interrupt (approval/rejection)
 * Protected: User must own the session
 */
router.post('/sessions/:sessionId/interrupts/respond', authenticateToken, authorizeAGUISession, (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const schema = z.object({
      interruptId: z.string(),
      selectedOption: z.string(),
      modifiedData: z.record(z.any()).optional(),
      feedback: z.string().optional(),
    });
    
    const response: AGUIInterruptResponse = schema.parse(req.body);
    
    aguiWAIIntegrationService.handleInterruptResponse(sessionId, response);
    
    res.json({
      success: true,
      message: 'Interrupt response received',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ================================================================================================
// AGENT STEERING
// ================================================================================================

/**
 * POST /api/agui/sessions/:sessionId/steer
 * User steers agent direction in real-time
 * Protected: User must own the session
 */
router.post('/sessions/:sessionId/steer', authenticateToken, authorizeAGUISession, (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const schema = z.object({
      direction: z.string(),
      guidance: z.string(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
    });
    
    const validated = schema.parse(req.body);
    
    // Emit steering event through AG-UI service
    aguiWAIIntegrationService.emit(`steer:${sessionId}`, validated);
    
    res.json({
      success: true,
      message: 'Agent steering applied',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ================================================================================================
// SYSTEM STATUS
// ================================================================================================

/**
 * GET /api/agui/status
 * Get AG-UI system status
 */
router.get('/status', authenticateToken, (req: AuthRequest, res: Response) => {
  const activeSessions = aguiWAIIntegrationService.getActiveSessions();
  const sessionCount = aguiWAIIntegrationService.getSessionCount();
  
  res.json({
    success: true,
    status: {
      healthy: true,
      activeSessions: activeSessions.length,
      totalSessions: sessionCount,
      transport: 'sse',
      version: '1.0.0',
    },
  });
});

export default router;
