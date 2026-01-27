/**
 * Natural Language Database API Routes
 * 
 * RESTful endpoints for NL-to-SQL database operations
 * Phase 3 Track B: NL Database Tool Suite
 */

import { Router, Request, Response } from 'express';
import { nlDatabaseService, nlDatabaseQuerySchema } from '../services/nl-database-tool-service';
import { z } from 'zod';

const router = Router();

/**
 * POST /api/nl-database/query
 * Execute a natural language database query
 * 
 * Request body:
 * {
 *   query: string,
 *   safetyLevel?: 'read-only' | 'safe-write' | 'admin',
 *   maxRows?: number,
 *   dryRun?: boolean
 * }
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    // Extract user info from session/auth
    const userId = req.user?.id;
    const userRole = req.user?.role || 'user';

    // Build query request
    const queryRequest = {
      ...req.body,
      userId,
      metadata: {
        userRole,
        requestedAt: new Date().toISOString()
      }
    };

    // SECURITY: Force read-only for non-admin users (no override allowed)
    if (userRole !== 'admin') {
      queryRequest.safetyLevel = 'read-only';
    } else if (queryRequest.safetyLevel === 'admin' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin safety level requires admin role'
      });
    }

    // Execute query
    const result = await nlDatabaseService.executeNLQuery(queryRequest);

    // SECURITY: Block execution if safety checks failed
    if (!result.safetyChecks.passed) {
      return res.status(403).json({
        ...result,
        success: false,
        error: result.safetyChecks.blocked || 'Query blocked by safety checks'
      });
    }

    // Return result
    return res.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/nl-database/schema
 * Get database schema information
 * 
 * Returns:
 * {
 *   tables: Array<{
 *     name: string,
 *     columns: string[],
 *     rowCount?: number
 *   }>
 * }
 */
router.get('/schema', async (req: Request, res: Response) => {
  try {
    const schema = await nlDatabaseService.getDatabaseSchema();
    return res.json({
      success: true,
      ...schema
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch schema'
    });
  }
});

/**
 * GET /api/nl-database/suggestions
 * Get query suggestions for users
 * 
 * Returns:
 * {
 *   suggestions: string[]
 * }
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const suggestions = await nlDatabaseService.getQuerySuggestions();
    return res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch suggestions'
    });
  }
});

/**
 * POST /api/nl-database/validate
 * Validate a natural language query without executing
 * (Always uses dryRun mode)
 * 
 * Request body:
 * {
 *   query: string
 * }
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    // Execute in dry-run mode
    const result = await nlDatabaseService.executeNLQuery({
      query,
      safetyLevel: 'read-only',
      dryRun: true,
      maxRows: 100
    });

    return res.json({
      success: true,
      sql: result.sql,
      operation: result.operation,
      safetyChecks: result.safetyChecks,
      warnings: result.safetyChecks.warnings
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    });
  }
});

export default router;
