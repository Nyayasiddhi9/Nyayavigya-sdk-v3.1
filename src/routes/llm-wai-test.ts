/**
 * WAI-Compliant LLM Test Routes
 * 
 * Migrated from llm-providers-real-api-test.ts to use WAI orchestration
 * Demonstrates proper SDK usage through WAI Request Builder
 * 
 * Phase 2.4: Migration Example
 */

import { Request, Response, Router } from 'express';
import { createDevelopmentRequest, createAnalysisRequest } from '../builders/wai-request-builder';
import { WAIOrchestrationCoreV9 } from '../orchestration/wai-orchestration-core-v9';

const router = Router();

// Initialize WAI orchestration core
const waiCore = new WAIOrchestrationCoreV9();

/**
 * POST /api/wai-test/chat
 * Test endpoint for chat completions using WAI orchestration
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, provider = 'gpt-4', priority = 'medium' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // ✅ MIGRATED: Using WAI Request Builder instead of direct SDK
    const request = createDevelopmentRequest(message)
      .setPriority(priority as any)
      .setPreferredProviders([provider])
      .setContext({
        testRoute: true,
        timestamp: new Date().toISOString()
      })
      .addMetadata('source', 'wai-test-endpoint')
      .build();

    // Execute through WAI orchestration
    const result = await waiCore.orchestrateProject(request);

    res.json({
      success: true,
      message,
      provider,
      result: result.result,
      orchestration: {
        requestId: result.metadata?.orchestrationId,
        executionTime: result.performance?.responseTime,
        qualityScore: result.performance?.qualityScore,
        totalCost: result.cost?.totalCost
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('WAI Test Error:', error);
    res.status(500).json({ 
      error: 'Test request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/wai-test/analyze
 * Test endpoint for code analysis using WAI orchestration
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { code, analysisType = 'security', provider } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required for analysis' });
    }

    // ✅ MIGRATED: Using WAI Request Builder for analysis
    const builder = createAnalysisRequest(`Perform ${analysisType} analysis on the following code: ${code}`)
      .setPriority('high')
      .setQualityThreshold(0.9)
      .setContext({
        analysisType,
        codeLength: code.length,
        testRoute: true
      })
      .addMetadata('source', 'wai-test-analyze');

    // Optionally set provider preference
    if (provider) {
      builder.setPreferredProviders([provider]);
    }

    const request = builder.build();

    // Execute through WAI orchestration
    const result = await waiCore.orchestrateProject(request);

    res.json({
      success: true,
      analysisType,
      codeSnippet: code.substring(0, 100) + '...',
      analysis: result.result,
      orchestration: {
        requestId: result.metadata?.orchestrationId,
        executionTime: result.performance?.responseTime,
        qualityScore: result.performance?.qualityScore,
        totalCost: result.cost?.totalCost
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('WAI Analysis Test Error:', error);
    res.status(500).json({ 
      error: 'Analysis test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/wai-test/providers
 * List available providers through WAI orchestration
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    // Return WAI-supported providers
    const providers = [
      {
        id: 'gpt-4',
        name: 'OpenAI GPT-4',
        status: 'WAI-Orchestrated',
        enforcement: 'Active - All requests through WAI SDK'
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Anthropic Claude 3.5 Sonnet',
        status: 'WAI-Orchestrated',
        enforcement: 'Active - All requests through WAI SDK'
      },
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Google Gemini 2.0 Flash',
        status: 'WAI-Orchestrated',
        enforcement: 'Active - All requests through WAI SDK'
      }
    ];

    res.json({
      success: true,
      providers,
      enforcement: {
        status: 'Active',
        message: 'All AI requests must go through WAI orchestration',
        whitelistedRoutes: ['/api/v9/', '/api/v10/', '/api/wai-sdk/', '/api/orchestration/']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('WAI Providers Test Error:', error);
    res.status(500).json({ 
      error: 'Failed to list providers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/wai-test/multi-provider
 * Test multiple providers in parallel using WAI orchestration
 */
router.post('/multi-provider', async (req: Request, res: Response) => {
  try {
    const { task, providers = ['gpt-4', 'claude-3-5-sonnet'] } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    // Execute same task with multiple providers for comparison
    const results = await Promise.all(
      providers.map(async (provider: string) => {
        const request = createDevelopmentRequest(task)
          .setPriority('medium')
          .setPreferredProviders([provider])
          .setContext({ multiProviderTest: true })
          .build();

        const result = await waiCore.orchestrateProject(request);

        return {
          provider,
          result: result.result,
          executionTime: result.performance?.responseTime,
          totalCost: result.cost?.totalCost
        };
      })
    );

    res.json({
      success: true,
      task,
      results,
      comparison: {
        totalProviders: results.length,
        avgExecutionTime: results.reduce((acc, r) => acc + (r.executionTime || 0), 0) / results.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('WAI Multi-Provider Test Error:', error);
    res.status(500).json({ 
      error: 'Multi-provider test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
