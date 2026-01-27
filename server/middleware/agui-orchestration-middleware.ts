/**
 * AG-UI Orchestration Middleware
 * 
 * PURPOSE: Centralized AG-UI session management for all streaming routes
 * Replaces scattered session creation with unified middleware pattern
 * 
 * FEATURES:
 * - Automatic session creation and lifecycle management
 * - Standardized SSE response handling
 * - Request context enrichment with AG-UI session
 * - Cleanup on connection close
 * 
 * MIGRATION PATH:
 * ```typescript
 * // BEFORE: Manual session creation in each route
 * router.post('/api/studio/execute', async (req, res) => {
 *   const session = aguiWAIIntegrationService.createSession(startupId, sessionId, studioId);
 *   // ... manual SSE setup
 *   // ... manual cleanup
 * });
 * 
 * // AFTER: Middleware handles it
 * router.post('/api/studio/execute', 
 *   aguiOrchestrationMiddleware({ studioId: 'ideation-lab' }),
 *   async (req, res) => {
 *     // Session already created and attached to req.agui
 *     const { aguiSession } = req.agui;
 *     // SSE already configured
 *     // Cleanup automatic on connection close
 *   }
 * );
 * ```
 * 
 * Phase 2A Stage 0 - Consolidation of AG-UI session management
 */

import type { Request, Response, NextFunction } from 'express';
import { aguiWAIIntegrationService } from '../services/agui-wai-integration-service';
import type { AuthRequest } from './auth';
import type { AGUIEvent } from '@shared/agui-event-types';

/**
 * AG-UI middleware configuration
 */
export interface AGUIMiddlewareConfig {
  /** Studio ID for session context */
  studioId?: string;
  
  /** Whether to enable SSE streaming */
  enableStreaming?: boolean;
  
  /** Whether to include event history in initial SSE response */
  includeHistory?: boolean;
  
  /** Custom session ID generator */
  sessionIdGenerator?: () => string;
}

/**
 * Extended request with AG-UI context
 */
export interface AGUIRequest extends AuthRequest {
  agui: {
    /** AG-UI session */
    aguiSession: {
      id: string;
      startupId: number;
      studioId?: string;
      userId?: number;
      createdAt: Date;
    };
    
    /** Emit event to AG-UI stream */
    emitEvent: (event: Omit<AGUIEvent, 'sessionId' | 'timestamp'>) => void;
    
    /** Close AG-UI session */
    closeSession: () => void;
  };
}

/**
 * AG-UI Orchestration Middleware
 * 
 * Automatically creates AG-UI session and configures SSE streaming
 * for routes that need real-time agent-to-UI communication
 * 
 * @param config - Middleware configuration
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * router.post('/api/ideation/validate',
 *   authenticateToken,
 *   authorizeStartupAccess,
 *   aguiOrchestrationMiddleware({ studioId: 'ideation-lab', enableStreaming: true }),
 *   async (req: AGUIRequest, res) => {
 *     const { aguiSession, emitEvent } = req.agui;
 *     
 *     emitEvent({ type: 'status_change', status: 'processing' });
 *     // ... do work
 *     emitEvent({ type: 'status_change', status: 'completed' });
 *     
 *     res.json({ success: true, sessionId: aguiSession.id });
 *   }
 * );
 * ```
 */
export function aguiOrchestrationMiddleware(
  config: AGUIMiddlewareConfig = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    studioId,
    enableStreaming = true,
    includeHistory = false,
    sessionIdGenerator,
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      
      // Extract startup ID from request body or params
      const startupId = req.body?.startupId || req.params?.startupId || authReq.startup?.id;
      const userId = authReq.user?.id;
      
      if (!startupId) {
        return res.status(400).json({
          success: false,
          error: 'startupId is required for AG-UI orchestration',
        });
      }

      // Generate or use provided session ID
      const customSessionId = sessionIdGenerator ? sessionIdGenerator() : undefined;

      // Create AG-UI session (using WAI-integrated service)
      const aguiSession = aguiWAIIntegrationService.createSession(
        Number(startupId),
        customSessionId,
        studioId,
        userId
      );

      console.log(`🔌 AG-UI session created: ${aguiSession.id.substring(0, 8)}... [studio=${studioId || 'unknown'}]`);

      // Configure SSE if enabled
      if (enableStreaming) {
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

        // Send initial connection event
        res.write(`data: ${JSON.stringify({ 
          type: 'connection', 
          sessionId: aguiSession.id, 
          studioId,
          timestamp: Date.now() 
        })}\n\n`);

        // Send event history if requested
        if (includeHistory) {
          const history = aguiWAIIntegrationService.getSessionEvents(aguiSession.id);
          history.forEach(event => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          });
        }

        // Set up event forwarding from AG-UI service to SSE
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
            res.write(`data: ${JSON.stringify({ 
              type: 'session_closed', 
              sessionId: aguiSession.id, 
              timestamp: Date.now() 
            })}\n\n`);
            res.end();
          }
        };

        aguiWAIIntegrationService.on(`event:${aguiSession.id}`, eventHandler);
        aguiWAIIntegrationService.on(`heartbeat:${aguiSession.id}`, heartbeatHandler);
        aguiWAIIntegrationService.on(`session:${aguiSession.id}:close`, closeHandler);

        // Cleanup on client disconnect
        req.on('close', () => {
          aguiWAIIntegrationService.off(`event:${aguiSession.id}`, eventHandler);
          aguiWAIIntegrationService.off(`heartbeat:${aguiSession.id}`, heartbeatHandler);
          aguiWAIIntegrationService.off(`session:${aguiSession.id}:close`, closeHandler);
          aguiWAIIntegrationService.closeSession(aguiSession.id);
          
          if (!res.writableEnded) {
            res.end();
          }
          
          console.log(`🔌 AG-UI session closed: ${aguiSession.id.substring(0, 8)}...`);
        });
      }

      // Attach AG-UI context to request
      const aguiReq = req as AGUIRequest;
      aguiReq.agui = {
        aguiSession,
        emitEvent: (event: Omit<AGUIEvent, 'sessionId' | 'timestamp'>) => {
          aguiWAIIntegrationService.emitEvent(aguiSession.id, event);
        },
        closeSession: () => {
          aguiWAIIntegrationService.closeSession(aguiSession.id);
        },
      };

      // Continue to route handler
      next();
    } catch (error) {
      console.error('❌ AG-UI middleware error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to initialize AG-UI session',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}

/**
 * Lightweight middleware for routes that need AG-UI context but not SSE streaming
 * 
 * @example
 * ```typescript
 * router.post('/api/studio/task',
 *   authenticateToken,
 *   aguiContextMiddleware({ studioId: 'engineering-forge' }),
 *   async (req: AGUIRequest, res) => {
 *     req.agui.emitEvent({ type: 'task_started', taskId: '123' });
 *     // ... do work
 *     req.agui.closeSession();
 *     res.json({ success: true });
 *   }
 * );
 * ```
 */
export function aguiContextMiddleware(
  config: Omit<AGUIMiddlewareConfig, 'enableStreaming'> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  return aguiOrchestrationMiddleware({
    ...config,
    enableStreaming: false,
  });
}
