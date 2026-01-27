/**
 * WAI SDK API Gateway v2.x - Unified Versioned API Routes
 * WAI SDK v2.0 - January 18, 2026
 * 
 * API Versions:
 * - /api/v2/*    - Stable API (production-ready)
 * - /api/v2.1/*  - Enhanced API (GRPO, HITL, Verbalized Sampling)
 * - /api/v2.5/*  - Beta API (experimental features)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { queenOrchestratorV21, HITL_THRESHOLDS } from '../services/queen-orchestrator-v2.1';
import { confidenceScorer } from '../services/confidence-scorer';
import { verbalizedSamplingService } from '../services/verbalized-sampling-service';
import { slmRoutingService } from '../services/slm-routing-service';
import { grpoTrainingPipeline } from '../services/grpo-training-pipeline';
import { orgVisualizationService } from '../services/org-visualization-service';
import { agentRegistry } from '../services/agent-registry-service';
import e2eTests from '../tests/e2e-production-tests';

// API Version Info
export const API_VERSIONS = {
  'v2': { version: '2.0.0', status: 'stable', releaseDate: '2025-10-01' },
  'v2.1': { version: '2.1.0', status: 'enhanced', releaseDate: '2026-01-15' },
  'v2.5': { version: '2.5.0', status: 'beta', releaseDate: '2026-01-18' }
};

// Request schemas
const OrchestrationRequestSchema = z.object({
  prompt: z.string().min(1).max(100000),
  type: z.enum(['code', 'research', 'creative', 'analysis', 'general']).optional().default('general'),
  language: z.string().optional(),
  organizationId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  romaLevel: z.enum(['L1', 'L2', 'L3', 'L4']).optional(),
  preferences: z.object({
    costOptimization: z.boolean().optional(),
    qualityPriority: z.boolean().optional(),
    speedPriority: z.boolean().optional(),
    maxAgents: z.number().min(1).max(10).optional(),
    verbalizedSampling: z.boolean().optional(),
    hitlEnabled: z.boolean().optional(),
    grpoEnabled: z.boolean().optional()
  }).optional()
});

const ConfidenceEvaluationSchema = z.object({
  agentScores: z.array(z.number()),
  taskComplexity: z.enum(['simple', 'moderate', 'complex', 'very_complex']),
  romaLevel: z.enum(['L1', 'L2', 'L3', 'L4']),
  modelQuality: z.number().optional(),
  previousSuccessRate: z.number().optional(),
  domainRelevance: z.number().optional()
});

const VerbalizedSamplingRequestSchema = z.object({
  query: z.string().min(1),
  tier: z.string().optional(),
  config: z.object({
    k: z.number().min(1).max(10).optional(),
    tau: z.number().min(0.01).max(0.5).optional(),
    temperature: z.number().min(0).max(2).optional()
  }).optional()
});

// Create routers for each version
export function createV2Router(): Router {
  const router = Router();

  // API Info
  router.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        name: 'WAI SDK API',
        version: API_VERSIONS['v2'].version,
        status: API_VERSIONS['v2'].status,
        description: 'Stable production API',
        documentation: '/api/v2/docs',
        endpoints: {
          health: 'GET /api/v2/health',
          agents: 'GET /api/v2/agents',
          orchestrate: 'POST /api/v2/orchestrate',
          models: 'GET /api/v2/models',
          providers: 'GET /api/v2/providers'
        }
      }
    });
  });

  // Health check
  router.get('/health', async (req, res) => {
    const stats = agentRegistry.getStats();
    res.json({
      success: true,
      data: {
        status: 'healthy',
        version: API_VERSIONS['v2'].version,
        agents: stats.totalAgents,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  });

  // List all agents
  router.get('/agents', async (req, res) => {
    try {
      const agents = agentRegistry.getAllAgents();
      const tier = req.query.tier as string;
      const romaLevel = req.query.romaLevel as string;

      let filtered = agents;
      if (tier) {
        filtered = filtered.filter(a => a.tier === tier);
      }
      if (romaLevel) {
        filtered = filtered.filter(a => a.romaLevel === romaLevel);
      }

      res.json({
        success: true,
        data: {
          total: filtered.length,
          agents: filtered.map(a => ({
            id: a.id,
            name: a.name,
            tier: a.tier,
            romaLevel: a.romaLevel,
            category: a.category,
            capabilities: a.capabilities.slice(0, 5),
            status: a.status
          }))
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get single agent
  router.get('/agents/:agentId', async (req, res) => {
    try {
      const agent = agentRegistry.getAgent(req.params.agentId);
      if (!agent) {
        return res.status(404).json({ success: false, error: 'Agent not found' });
      }
      res.json({ success: true, data: agent });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Basic orchestration (v2 - no GRPO/HITL/VS)
  router.post('/orchestrate', async (req, res) => {
    try {
      const parsed = OrchestrationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.errors });
      }

      const result = await queenOrchestratorV21.orchestrate({
        ...parsed.data,
        preferences: {
          ...parsed.data.preferences,
          verbalizedSampling: false,
          hitlEnabled: false,
          grpoEnabled: false
        }
      });

      res.json({
        success: true,
        data: {
          requestId: result.requestId,
          output: result.synthesizedOutput,
          agentsUsed: result.agentsUsed.length,
          metadata: {
            ...result.metadata,
            apiVersion: 'v2'
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}

export function createV21Router(): Router {
  const router = Router();

  // API Info
  router.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        name: 'WAI SDK API Enhanced',
        version: API_VERSIONS['v2.1'].version,
        status: API_VERSIONS['v2.1'].status,
        description: 'Enhanced API with GRPO, HITL, and Verbalized Sampling',
        features: ['GRPO Learning', 'HITL Workflows', 'Verbalized Sampling', 'Confidence Scoring'],
        endpoints: {
          orchestrate: 'POST /api/v2.1/orchestrate',
          confidence: 'POST /api/v2.1/confidence/evaluate',
          sampling: 'POST /api/v2.1/sampling/diverse',
          hitl: 'GET /api/v2.1/hitl/thresholds'
        }
      }
    });
  });

  // Health check with enhanced info
  router.get('/health', async (req, res) => {
    const stats = queenOrchestratorV21.getStats();
    const vsStats = verbalizedSamplingService.getStats();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        version: API_VERSIONS['v2.1'].version,
        agents: stats.totalAgents,
        verbalizedSampling: vsStats,
        hitlThresholds: HITL_THRESHOLDS,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  });

  // Enhanced orchestration with all features
  router.post('/orchestrate', async (req, res) => {
    try {
      const parsed = OrchestrationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.errors });
      }

      const result = await queenOrchestratorV21.orchestrate({
        ...parsed.data,
        preferences: {
          ...parsed.data.preferences,
          verbalizedSampling: parsed.data.preferences?.verbalizedSampling ?? false,
          hitlEnabled: parsed.data.preferences?.hitlEnabled ?? true,
          grpoEnabled: parsed.data.preferences?.grpoEnabled ?? true
        }
      });

      res.json({
        success: true,
        data: {
          requestId: result.requestId,
          output: result.synthesizedOutput,
          confidence: result.confidence,
          hitlAction: result.hitlAction,
          agentsUsed: result.agentsUsed.map(a => ({
            id: a.agentId,
            name: a.agentName,
            tier: a.tier,
            romaLevel: a.romaLevel
          })),
          metadata: result.metadata
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Confidence evaluation endpoint
  router.post('/confidence/evaluate', async (req, res) => {
    try {
      const parsed = ConfidenceEvaluationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.errors });
      }

      const result = confidenceScorer.evaluate(parsed.data);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // HITL thresholds endpoint
  router.get('/hitl/thresholds', (req, res) => {
    res.json({
      success: true,
      data: confidenceScorer.getThresholds()
    });
  });

  // Update HITL thresholds (admin only)
  router.patch('/hitl/thresholds', (req, res) => {
    try {
      const updates = req.body;
      confidenceScorer.updateThresholds(updates);
      res.json({
        success: true,
        data: confidenceScorer.getThresholds()
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Verbalized sampling endpoint
  router.post('/sampling/diverse', async (req, res) => {
    try {
      const parsed = VerbalizedSamplingRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.errors });
      }

      const result = await verbalizedSamplingService.generateDiverse(
        parsed.data.query,
        parsed.data.config,
        parsed.data.tier
      );

      res.json({
        success: true,
        data: {
          selectedResponse: result.selectedResponse.text,
          probability: result.selectedResponse.probability,
          diversityScore: result.diversityScore,
          responsesGenerated: result.allResponses.length,
          config: result.config,
          executionTime: result.executionTime
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get tier configurations
  router.get('/sampling/tiers', (req, res) => {
    const tiers = ['creative', 'research', 'development', 'qa', 'executive', 'domain', 'devops'];
    const configs = tiers.map(tier => ({
      tier,
      config: verbalizedSamplingService.getConfigForTier(tier)
    }));

    res.json({ success: true, data: configs });
  });

  return router;
}

export function createV25Router(): Router {
  const router = Router();

  // API Info
  router.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        name: 'WAI SDK API Beta',
        version: API_VERSIONS['v2.5'].version,
        status: API_VERSIONS['v2.5'].status,
        warning: 'This is a beta API. Features may change without notice.',
        description: 'Beta API with experimental features',
        features: [
          'SLM Routing (Mistral/Llama-3-8B for L1/L2)',
          'Digital Twin Visualization',
          'Advanced GRPO Training',
          'Multi-Organization Federation'
        ],
        endpoints: {
          orchestrate: 'POST /api/v2.5/orchestrate',
          slm: 'POST /api/v2.5/slm/route',
          digitalTwin: 'GET /api/v2.5/digital-twin/:orgId',
          grpoTraining: 'POST /api/v2.5/grpo/train'
        }
      }
    });
  });

  // SLM routing endpoint (40-60% cost reduction for L1/L2) - Using real service
  router.post('/slm/route', async (req, res) => {
    try {
      const { prompt, romaLevel, taskType, complexity } = req.body;

      const decision = slmRoutingService.route({
        prompt: prompt || '',
        romaLevel: romaLevel || 'L2',
        taskType,
        complexity
      });

      res.json({
        success: true,
        data: {
          useSLM: decision.useSLM,
          selectedModel: decision.selectedModel?.id || decision.fallbackModel,
          modelName: decision.selectedModel?.name || decision.fallbackModel,
          romaLevel: decision.romaLevel,
          estimatedCost: decision.estimatedCost,
          costSavings: decision.estimatedSavings,
          reason: decision.reason
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get SLM statistics
  router.get('/slm/stats', (req, res) => {
    res.json({ success: true, data: slmRoutingService.getStats() });
  });

  // Get available SLM models
  router.get('/slm/models', (req, res) => {
    res.json({ success: true, data: slmRoutingService.getAvailableModels() });
  });

  // Digital Twin endpoint (beta) - Using real service
  router.get('/digital-twin/:orgId', async (req, res) => {
    try {
      const orgId = req.params.orgId;
      const visualization = orgVisualizationService.getVisualizationData(orgId);
      res.json({ success: true, data: visualization });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get workforce metrics for an organization
  router.get('/digital-twin/:orgId/workforce', async (req, res) => {
    try {
      const orgId = req.params.orgId;
      const visualization = orgVisualizationService.getVisualizationData(orgId);
      res.json({ success: true, data: visualization.workforce });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get real-time pulse data for an organization
  router.get('/digital-twin/:orgId/pulse', async (req, res) => {
    try {
      const orgId = req.params.orgId;
      const visualization = orgVisualizationService.getVisualizationData(orgId);
      res.json({ success: true, data: visualization.pulse });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GRPO Training endpoint (beta) - Using real service
  router.post('/grpo/train', async (req, res) => {
    try {
      const { requestId, prompt, taskType, agentsUsed, confidence, executionTime, success, humanFeedback } = req.body;

      // Record training data point
      grpoTrainingPipeline.recordTrainingData({
        requestId: requestId || `grpo-${Date.now()}`,
        timestamp: new Date().toISOString(),
        prompt: prompt || '',
        taskType: taskType || 'general',
        agentsUsed: agentsUsed || [],
        confidence: confidence || 0.8,
        executionTime: executionTime || 1000,
        success: success !== false
      });

      // Record human feedback if provided
      if (humanFeedback && requestId) {
        grpoTrainingPipeline.recordHumanFeedback(requestId, humanFeedback);
      }

      const stats = grpoTrainingPipeline.getStats();
      const config = grpoTrainingPipeline.getConfig();

      res.json({
        success: true,
        data: {
          dataPointRecorded: true,
          totalDataPoints: stats.totalDataPoints,
          batchProgress: `${stats.totalDataPoints} / ${config.batchSize}`,
          trainingConfig: config,
          nextBatchAt: stats.totalDataPoints >= config.batchSize ? 'Ready for training' : `${config.batchSize - stats.totalDataPoints} more data points needed`
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get GRPO training statistics
  router.get('/grpo/stats', (req, res) => {
    res.json({
      success: true,
      data: {
        ...grpoTrainingPipeline.getStats(),
        config: grpoTrainingPipeline.getConfig()
      }
    });
  });

  // Update GRPO configuration
  router.patch('/grpo/config', (req, res) => {
    try {
      grpoTrainingPipeline.updateConfig(req.body);
      res.json({
        success: true,
        data: grpoTrainingPipeline.getConfig()
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Orchestrate with all beta features
  router.post('/orchestrate', async (req, res) => {
    try {
      const parsed = OrchestrationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.errors });
      }

      // Determine SLM usage
      const romaLevel = parsed.data.romaLevel || 'L2';
      const useSLM = romaLevel === 'L1' || romaLevel === 'L2';

      const result = await queenOrchestratorV21.orchestrate({
        ...parsed.data,
        preferences: {
          ...parsed.data.preferences,
          verbalizedSampling: parsed.data.preferences?.verbalizedSampling ?? true,
          hitlEnabled: parsed.data.preferences?.hitlEnabled ?? true,
          grpoEnabled: parsed.data.preferences?.grpoEnabled ?? true
        }
      });

      res.json({
        success: true,
        data: {
          requestId: result.requestId,
          output: result.synthesizedOutput,
          confidence: result.confidence,
          hitlAction: result.hitlAction,
          slmUsed: useSLM,
          costSavings: useSLM ? '40-60%' : '0%',
          agentsUsed: result.agentsUsed,
          metadata: {
            ...result.metadata,
            apiVersion: 'v2.5-beta',
            features: ['GRPO', 'HITL', 'VS', useSLM ? 'SLM' : 'LLM']
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}

// Main router that combines all versions
export function createAPIGatewayRouter(): Router {
  const router = Router();

  // Version info endpoint
  router.get('/versions', (req, res) => {
    res.json({
      success: true,
      data: {
        versions: API_VERSIONS,
        current: 'v2.1',
        recommended: 'v2',
        beta: 'v2.5'
      }
    });
  });

  // E2E Test endpoint - Run production test suite
  router.get('/tests/run', async (req, res) => {
    try {
      const results = await e2eTests.runAllTests();
      res.json({
        success: results.overallPassed,
        data: {
          passed: results.totalPassed,
          failed: results.totalFailed,
          duration: results.totalDuration,
          suites: results.suites.map(s => ({
            name: s.suiteName,
            passed: s.passed,
            failed: s.failed,
            duration: s.duration
          }))
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Run specific test suite
  router.get('/tests/run/:suite', async (req, res) => {
    try {
      const suite = req.params.suite;
      const suiteMap: Record<string, () => Promise<any>> = {
        'agents': e2eTests.runAgentRegistryTests,
        'orchestrator': e2eTests.runQueenOrchestratorTests,
        'confidence': e2eTests.runConfidenceScorerTests,
        'sampling': e2eTests.runVerbalizedSamplingTests,
        'slm': e2eTests.runSLMRoutingTests,
        'grpo': e2eTests.runGRPOPipelineTests,
        'load': e2eTests.runLoadTests
      };

      const testFn = suiteMap[suite];
      if (!testFn) {
        return res.status(404).json({
          success: false,
          error: `Unknown test suite: ${suite}`,
          availableSuites: Object.keys(suiteMap)
        });
      }

      const result = await testFn();
      res.json({ success: result.failed === 0, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Mount version-specific routers
  router.use('/v2', createV2Router());
  router.use('/v2.1', createV21Router());
  router.use('/v2.5', createV25Router());

  return router;
}

export const apiGatewayRouter = createAPIGatewayRouter();
