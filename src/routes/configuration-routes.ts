/**
 * Configuration Routes - WAI SDK v3.1
 * 
 * API endpoints for configuration management:
 * - View configuration status
 * - Run guardrail checks
 * - Reload configurations
 * - Backup/restore operations
 * 
 * @version 3.1.0
 * @date January 25, 2026
 */

import { Router, Request, Response } from 'express';
import { centralConfig, CONFIG_PATHS, LATEST_MODELS } from '../config/central-configuration';
import { configGuardrails } from '../config/configuration-guardrails';
import { AgentRegistryService } from '../services/agent-registry-service';
import { legalAgentRegistry } from '../services/legal-agent-registry-service';

const router = Router();

/**
 * GET /api/config/status
 * Get current configuration status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const configStatus = centralConfig.getStatus();
    const waiStats = AgentRegistryService.getInstance().getStats();
    
    let legalStats = null;
    if (legalAgentRegistry.isInitializedState()) {
      legalStats = legalAgentRegistry.getStats();
    }

    res.json({
      success: true,
      config: configStatus,
      agents: {
        wai: waiStats,
        legal: legalStats
      },
      paths: CONFIG_PATHS,
      latestModels: LATEST_MODELS
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/config/guardrails
 * Run guardrail checks
 */
router.get('/guardrails', async (_req: Request, res: Response) => {
  try {
    const result = await configGuardrails.runAllChecks();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/config/reload
 * Reload all configurations
 */
router.post('/reload', async (_req: Request, res: Response) => {
  try {
    console.log('🔄 Reloading configurations...');
    const result = await centralConfig.initialize();
    
    res.json({
      success: true,
      message: 'Configurations reloaded',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/config/backup
 * Create configuration backup
 */
router.post('/backup', async (_req: Request, res: Response) => {
  try {
    const result = await configGuardrails.createBackup();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/config/restore
 * Restore from backup
 */
router.post('/restore', async (_req: Request, res: Response) => {
  try {
    const result = await configGuardrails.restoreFromBackup();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/config/agents/wai
 * Get WAI agent statistics
 */
router.get('/agents/wai', async (_req: Request, res: Response) => {
  try {
    const registry = AgentRegistryService.getInstance();
    const stats = registry.getStats();
    
    res.json({
      success: true,
      ...stats,
      source: CONFIG_PATHS.WAI_AGENTS_REGISTRY
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/config/agents/legal
 * Get legal agent statistics
 */
router.get('/agents/legal', async (_req: Request, res: Response) => {
  try {
    if (!legalAgentRegistry.isInitializedState()) {
      await legalAgentRegistry.initialize();
    }
    
    const stats = legalAgentRegistry.getStats();
    const metadata = legalAgentRegistry.getMetadata();
    
    res.json({
      success: true,
      ...stats,
      metadata,
      source: CONFIG_PATHS.LEGAL_AGENTS_REGISTRY
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/config/models/latest
 * Get latest model versions
 */
router.get('/models/latest', (_req: Request, res: Response) => {
  res.json({
    success: true,
    models: LATEST_MODELS,
    lastUpdated: 'January 25, 2026'
  });
});

export default router;
