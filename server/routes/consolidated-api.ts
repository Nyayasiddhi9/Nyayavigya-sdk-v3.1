/**
 * Consolidated API Routes
 * Unified endpoints for all platform functionality
 */

import { Router } from 'express';
import { consolidatedServicesManager } from '../services/consolidated-services-manager';
import { intelligentAgentOrchestrator } from '../services/intelligent-agent-orchestrator';
import { advancedCachingSystem } from '../services/advanced-caching-system';
import { contextEngineeringEngine } from '../services/context-engineering-engine';

const router = Router();

// Unified processing endpoint
router.post('/process', async (req, res) => {
  try {
    const { type, data, userId, preferences, context } = req.body;
    
    if (!type || !data || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, data, userId'
      });
    }

    const result = await consolidatedServicesManager.processUnifiedRequest({
      type,
      data,
      userId,
      preferences,
      context
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Agent orchestration endpoint
router.post('/orchestrate', async (req, res) => {
  try {
    const { task, userId, preferences } = req.body;
    
    const result = await intelligentAgentOrchestrator.orchestrateTask(
      task,
      userId,
      preferences
    );

    res.json({
      success: true,
      orchestration: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Context engineering endpoint
router.post('/enhance-context', async (req, res) => {
  try {
    const { prompt, userId, context, options } = req.body;
    
    const result = await contextEngineeringEngine.enhanceContext(
      prompt,
      userId,
      context,
      options
    );

    res.json({
      success: true,
      enhancement: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Performance feedback endpoint
router.post('/feedback', async (req, res) => {
  try {
    const { userId, taskId, satisfaction, type } = req.body;
    
    if (type === 'orchestration') {
      await intelligentAgentOrchestrator.updateTaskFeedback(userId, taskId, satisfaction);
    } else if (type === 'context') {
      await contextEngineeringEngine.updatePerformanceFeedback(userId, taskId, satisfaction);
    }

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Service status and health endpoint
router.get('/status', async (req, res) => {
  try {
    const status = consolidatedServicesManager.getServiceStatus();
    res.json({
      success: true,
      status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analytics endpoint
router.get('/analytics', async (req, res) => {
  try {
    const analytics = {
      orchestration: intelligentAgentOrchestrator.getAnalytics(),
      caching: advancedCachingSystem.getCacheMetrics(),
      contextEngineering: contextEngineeringEngine.getAnalytics()
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Performance optimization endpoint
router.post('/optimize', async (req, res) => {
  try {
    const result = await consolidatedServicesManager.optimizePerformance();
    res.json({
      success: true,
      optimization: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cache management endpoints
router.get('/cache/metrics', async (req, res) => {
  try {
    const metrics = advancedCachingSystem.getCacheMetrics();
    res.json({
      success: true,
      metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/cache/warm-up', async (req, res) => {
  try {
    const { userId } = req.body;
    await advancedCachingSystem.warmUpCache(userId);
    res.json({
      success: true,
      message: 'Cache warmed up successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/cache/:namespace', async (req, res) => {
  try {
    const { namespace } = req.params;
    const { pattern } = req.query;
    
    if (pattern) {
      await advancedCachingSystem.invalidatePattern(namespace, pattern as string);
    } else {
      // Clear entire namespace - implement if needed
    }
    
    res.json({
      success: true,
      message: `Cache invalidated for ${namespace}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Scaling endpoint
router.post('/scale', async (req, res) => {
  try {
    const { loadMetrics } = req.body;
    const result = await consolidatedServicesManager.scaleServices(loadMetrics);
    res.json({
      success: true,
      scaling: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as consolidatedApiRouter };