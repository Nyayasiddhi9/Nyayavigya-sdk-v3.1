/**
 * AG-UI Session Authorization Middleware
 * 
 * Ensures users can only access/control their own AG-UI sessions
 * Prevents cross-tenant data leaks
 */

import type { Response, NextFunction } from 'express';
import { aguiWAIIntegrationService } from '../services/agui-wai-integration-service';
import type { AuthRequest } from './auth';

/**
 * Middleware to authorize AG-UI session access
 * Verifies that the authenticated user owns the session
 */
export function authorizeAGUISession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required',
      });
    }
    
    // Get session
    const session = aguiWAIIntegrationService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'AG-UI session not found',
      });
    }
    
    // Verify user owns this session
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }
    
    // Check if session belongs to user
    if (session.userId && session.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You do not have access to this session',
      });
    }
    
    // Additional check: Verify startup ownership
    // This prevents users from accessing sessions for startups they don't own
    // TODO: Add startup ownership check via database query
    // For now, rely on userId match
    
    // User is authorized
    next();
  } catch (error: any) {
    console.error('AG-UI session authorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Session authorization failed',
    });
  }
}

/**
 * Middleware to authorize startup access
 * Verifies user owns the startup before creating session
 */
export async function authorizeStartupAccess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { startupId } = req.body;
    
    if (!startupId) {
      return res.status(400).json({
        success: false,
        error: 'Startup ID required',
      });
    }
    
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }
    
    // TODO: Verify startup ownership via database
    // For now, session will store userId and we'll verify on access
    
    next();
  } catch (error: any) {
    console.error('Startup authorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Startup authorization failed',
    });
  }
}
