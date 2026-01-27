
import express from 'express';
import { z } from 'zod';
import { waiOrchestrator } from '../services/unified-orchestration-client'; import type { UnifiedOrchestrationRequest as WAIRequest } from '../services/unified-wai-orchestration-complete';
import { intelligentLLMSelector } from '../services/intelligent-llm-selector';

const router = express.Router();

// Request validation schemas
const waiRequestSchema = z.object({
  type: z.enum(['development', 'creative', 'analysis', 'enterprise', 'research', 'multimodal']),
  task: z.string().min(1, 'Task description is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  context: z.any().optional(),
  userPreferences: z.object({
    costPriority: z.enum(['low', 'medium', 'high']).optional(),
    qualityPriority: z.enum(['low', 'medium', 'high']).optional(),
    speedPriority: z.enum(['low', 'medium', 'high']).optional(),
    preferredProviders: z.array(z.string()).optional(),
    avoidProviders: z.array(z.string()).optional()
  }).optional(),
  constraints: z.object({
    maxCost: z.number().optional(),
    maxTime: z.number().optional(),
    minQuality: z.number().optional()
  }).optional(),
  metadata: z.any().optional()
});

// Main WAI processing endpoint with intelligent orchestration
router.post('/process', async (req, res) => {
  try {
    const validatedRequest = waiRequestSchema.parse(req.body);
    
    const waiRequest: WAIRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedRequest
    };

    console.log(`🎯 Processing WAI request: ${waiRequest.id}`);
    console.log(`📋 Task: ${waiRequest.task}`);
    console.log(`🔍 Type: ${waiRequest.type}`);

    const response = await waiOrchestrator.processRequest(waiRequest);

    res.json({
      success: true,
      data: response,
      processingInfo: {
        requestId: response.requestId,
        primaryLLM: response.metadata.primaryLLM,
        redundancyLevel: response.metadata.redundancyLevel,
        confidence: response.metadata.confidence,
        estimatedCost: response.metadata.estimatedCost,
        reasoning: response.reasoning
      }
    });

  } catch (error: any) {
    console.error('❌ WAI processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'WAI processing failed',
      details: error.issues || undefined
    });
  }
});

// Get optimal LLM recommendation for a task
router.post('/recommend-llm', async (req, res) => {
  try {
    const { task, type, userPreferences, context } = req.body;

    if (!task || !type) {
      return res.status(400).json({
        success: false,
        error: 'Task and type are required'
      });
    }

    const taskAnalysis = {
      taskType: type,
      complexity: task.length > 500 ? 'complex' : task.length > 200 ? 'medium' : 'simple',
      domain: type,
      urgency: 'medium',
      budgetConstraint: 'balanced',
      qualityRequirement: 'good',
      estimatedTokens: Math.ceil(task.length * 1.3),
      requiredCapabilities: [],
      contextRequired: task.length > 1000
    };

    const llmSelection = await intelligentLLMSelector.selectOptimalLLM(
      taskAnalysis,
      userPreferences,
      context
    );

    res.json({
      success: true,
      recommendation: llmSelection,
      taskAnalysis
    });

  } catch (error: any) {
    console.error('❌ LLM recommendation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'LLM recommendation failed'
    });
  }
});

// Get system status and health
router.get('/status', async (req, res) => {
  try {
    const status = await waiOrchestrator.getSystemStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Status check failed'
    });
  }
});

// Get performance metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await waiOrchestrator.getPerformanceMetrics();
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Metrics retrieval failed'
    });
  }
});

// Get LLM provider benchmarks and status
router.get('/providers/benchmarks', async (req, res) => {
  try {
    const providerStatus = await intelligentLLMSelector.getProviderStatus();
    
    res.json({
      success: true,
      providers: providerStatus,
      lastUpdated: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Provider benchmarks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Provider benchmarks retrieval failed'
    });
  }
});

// Test endpoint for 3-level redundancy
router.post('/test-redundancy', async (req, res) => {
  try {
    const { task = 'Test redundancy system', simulateFailures = [] } = req.body;

    const testRequest: WAIRequest = {
      id: `test_${Date.now()}`,
      type: 'development',
      task: 'Test redundancy',
      prompt: task,
      userPreferences: {
        avoidProviders: simulateFailures // Simulate failures by avoiding certain providers
      },
      metadata: { isTest: true }
    };

    const response = await waiOrchestrator.processRequest(testRequest);

    res.json({
      success: true,
      test: 'redundancy',
      result: {
        redundancyLevel: response.metadata.redundancyLevel,
        fallbacksUsed: response.metadata.fallbacksUsed,
        primaryLLM: response.metadata.primaryLLM,
        agentsInvolved: response.metadata.agentsInvolved,
        processingTime: response.metadata.processingTime,
        confidence: response.metadata.confidence
      },
      data: response.data,
      reasoning: response.reasoning
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Redundancy test failed',
      fallbacksAttempted: error.fallbacksAttempted || 0
    });
  }
});

// Enhanced task routing for all platform components
router.post('/route-task', async (req, res) => {
  try {
    const { 
      component, // 'software-dev', 'ai-assistant', 'content-creation', 'game-builder', 'enterprise'
      action,    // 'create', 'analyze', 'optimize', 'deploy', etc.
      payload,
      userPreferences 
    } = req.body;

    if (!component || !action || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Component, action, and payload are required'
      });
    }

    // Map component actions to WAI request types
    const taskMapping = {
      'software-dev': 'development',
      'ai-assistant': 'enterprise',
      'content-creation': 'creative',
      'game-builder': 'creative',
      'enterprise': 'enterprise',
      'analytics': 'analysis',
      'research': 'research'
    };

    const waiRequest: WAIRequest = {
      id: `route_${component}_${Date.now()}`,
      type: taskMapping[component] || 'development',
      task: `${component}: ${action}`,
      prompt: typeof payload === 'string' ? payload : JSON.stringify(payload),
      context: { component, action, originalPayload: payload },
      userPreferences,
      metadata: { routedFrom: component, action }
    };

    const response = await waiOrchestrator.processRequest(waiRequest);

    res.json({
      success: true,
      component,
      action,
      result: response.data,
      orchestration: {
        primaryLLM: response.metadata.primaryLLM,
        agentsUsed: response.metadata.agentsInvolved,
        redundancyLevel: response.metadata.redundancyLevel,
        confidence: response.metadata.confidence,
        processingTime: response.metadata.processingTime
      },
      reasoning: response.reasoning
    });

  } catch (error: any) {
    console.error(`❌ Task routing error for ${req.body.component}:`, error);
    res.status(500).json({
      success: false,
      component: req.body.component,
      action: req.body.action,
      error: error.message || 'Task routing failed'
    });
  }
});

export { router as enhancedWAIAPI };
