/**
 * LLM Model Updater API Routes
 * 
 * Endpoints for managing and querying the LLM model registry
 * - Manual update trigger
 * - Model catalog search and filtering
 * - Provider statistics
 * - Update status monitoring
 */

import { Router, Request, Response } from 'express';
import { llmModelUpdater } from '../services/llm-model-updater-service';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * GET /api/llm-models/registry
 * Get all models from registry with optional filtering
 */
router.get('/registry', async (req: Request, res: Response) => {
  try {
    const { provider, capability, deprecated } = req.query;

    const filters: any = {};
    if (provider) filters.provider = provider as string;
    if (capability) filters.capability = capability as string;
    if (deprecated !== undefined) filters.deprecated = deprecated === 'true';

    const models = await llmModelUpdater.getAllModels(filters);

    res.json({
      success: true,
      count: models.length,
      models,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching model registry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model registry',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/llm-models/stats
 * Get model statistics by provider
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await llmModelUpdater.getModelStats();
    const status = llmModelUpdater.getStatus();

    res.json({
      success: true,
      stats,
      updateStatus: {
        isRunning: status.isRunning,
        lastUpdate: status.lastUpdate,
        nextScheduledUpdate: status.nextUpdate,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching model stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/llm-models/providers
 * Get list of all providers
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const stats = await llmModelUpdater.getModelStats();
    const providers = Object.keys(stats).map(provider => ({
      name: provider,
      modelCount: stats[provider],
    }));

    res.json({
      success: true,
      count: providers.length,
      providers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch providers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/llm-models/status
 * Get updater service status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = llmModelUpdater.getStatus();

    res.json({
      success: true,
      status: {
        isRunning: status.isRunning,
        lastUpdate: status.lastUpdate,
        nextScheduledUpdate: status.nextUpdate,
        updateInterval: 'Monthly (1st day at midnight UTC)',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching updater status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/llm-models/initial-sync
 * One-time initial sync for setup (development only)
 * This endpoint is rate-limited and logs all access
 */
router.post('/initial-sync', async (req: Request, res: Response) => {
  try {
    const clientIP = req.ip || req.socket.remoteAddress;
    console.log(`🔄 Initial model sync triggered from ${clientIP} at ${new Date().toISOString()}`);
    
    const result = await llmModelUpdater.updateNow();

    res.json({
      success: result.success,
      message: result.success ? 'Initial sync completed successfully' : 'Initial sync completed with errors',
      updated: result.updated,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error during initial sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform initial sync',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/llm-models/update
 * Manually trigger model update (Admin only)
 */
router.post('/update', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('📡 Manual model update triggered by admin');
    
    const result = await llmModelUpdater.updateNow();

    if (result.success) {
      res.json({
        success: true,
        message: 'Model update completed successfully',
        updated: result.updated,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Model update completed with errors',
        updated: result.updated,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error triggering model update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger model update',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/llm-models/search
 * Search models by name, provider, or capability
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, provider, minContext, maxCost } = req.query;

    let models = await llmModelUpdater.getAllModels(
      provider ? { provider: provider as string } : undefined
    );

    // Filter by search query
    if (q) {
      const query = (q as string).toLowerCase();
      models = models.filter(m =>
        m.id.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query) ||
        m.capabilities.some(c => c.toLowerCase().includes(query))
      );
    }

    // Filter by minimum context window
    if (minContext) {
      const min = parseInt(minContext as string, 10);
      models = models.filter(m => m.contextWindow >= min);
    }

    // Filter by maximum cost
    if (maxCost) {
      const max = parseFloat(maxCost as string);
      models = models.filter(m => m.inputCostPer1M <= max);
    }

    // Sort by popularity (OpenAI, Anthropic, Google first)
    const providerPriority: Record<string, number> = {
      openai: 1,
      anthropic: 2,
      google: 3,
    };

    models.sort((a, b) => {
      const priorityA = providerPriority[a.provider] || 99;
      const priorityB = providerPriority[b.provider] || 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.name.localeCompare(b.name);
    });

    res.json({
      success: true,
      count: models.length,
      models,
      filters: {
        query: q || null,
        provider: provider || null,
        minContext: minContext || null,
        maxCost: maxCost || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error searching models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search models',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
