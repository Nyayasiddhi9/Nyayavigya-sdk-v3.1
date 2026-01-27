/**
 * AI Assistant Builder - Deprecated Compatibility Stub
 * 
 * DEPRECATION NOTICE: This file has been replaced with a minimal stub for compatibility.
 * The original implementation contained 28 TypeScript errors from calling non-existent methods
 * on services that were never fully implemented.
 * 
 * This stub maintains import compatibility for server/routes/assistants.ts while allowing
 * clean TypeScript compilation.
 * 
 * For AI assistant functionality, use the WAI SDK v1.0 orchestration APIs directly.
 */

import { Router, Request, Response } from 'express';

/**
 * Minimal AI Assistant Router (Compatibility Stub)
 * Exports empty router to satisfy imports without type errors
 */
export const aiAssistantRouter = Router();

// Placeholder health check endpoint
aiAssistantRouter.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'deprecated',
    message: 'AI Assistant Builder has been deprecated. Use WAI SDK v1.0 orchestration APIs.',
    recommendation: 'Migrate to /api/wai-sdk/v1/* endpoints'
  });
});

export default aiAssistantRouter;
