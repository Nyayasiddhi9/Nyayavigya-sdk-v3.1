/**
 * WAI SDK API Routes
 * Production-ready API endpoints for the WAI SDK
 */

import { Router, Request, Response } from 'express';
import { waiProductionSDK, WAIProductionConfig, SDKLLMRequest, OrchestrationRequest } from '../sdk/wai-production-sdk-v9';
import { z } from 'zod';

const router = Router();

// Validation schemas
const LLMRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  provider: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
  requirements: z.object({
    domain: z.enum(['coding', 'reasoning', 'creative', 'analytical', 'multimodal']),
    qualityLevel: z.enum(['standard', 'professional', 'expert']),
    costBudget: z.enum(['minimal', 'balanced', 'premium']),
    urgency: z.enum(['low', 'medium', 'high', 'critical'])
  }),
  metadata: z.record(z.any()).optional()
});

const AgentTaskSchema = z.object({
  agentType: z.string().min(1),
  task: z.string().min(1),
  options: z.object({
    provider: z.string().optional(),
    model: z.string().optional(),
    autonomous: z.boolean().optional(),
    requirements: z.any().optional()
  }).optional()
});

const OrchestrationRequestSchema = z.object({
  type: z.enum(['project', 'task', 'workflow', 'analysis']),
  description: z.string().min(1),
  requirements: z.array(z.string()),
  constraints: z.object({
    budget: z.number().optional(),
    timeline: z.string().optional(),
    quality: z.enum(['standard', 'professional', 'expert']).optional(),
    resources: z.array(z.string()).optional()
  }).optional(),
  autonomous: z.boolean()
});

// Initialize SDK endpoint
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Initializing WAI Production SDK via API...');
    
    const config = req.body as Partial<WAIProductionConfig>;
    
    // Initialize with provided config
    if (config && Object.keys(config).length > 0) {
      // Update SDK config
      (waiProductionSDK as any).config = (waiProductionSDK as any).createDefaultConfig(config);
    }
    
    // Initialize SDK
    await waiProductionSDK.initialize();
    
    res.json({
      success: true,
      message: 'WAI Production SDK initialized successfully',
      data: {
        version: '1.0.0',
        providers: waiProductionSDK.getAvailableProviders(),
        agents: waiProductionSDK.getAvailableAgentCategories(),
        features: waiProductionSDK.getAvailableFeatures()
      },
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ SDK initialization failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'SDK initialization failed',
      timestamp: new Date()
    });
  }
});

// Execute LLM request
router.post('/llm/execute', async (req: Request, res: Response) => {
  try {
    const validatedData = LLMRequestSchema.parse(req.body);
    
    const request: SDKLLMRequest = {
      id: `api-${Date.now()}`,
      ...validatedData
    };
    
    console.log(`🧠 Executing LLM request: ${request.requirements.domain} - ${request.requirements.qualityLevel}`);
    
    const response = await waiProductionSDK.executeLLMRequest(request);
    
    res.json({
      success: true,
      data: response,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ LLM request failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: error.errors,
        timestamp: new Date()
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'LLM request failed',
        timestamp: new Date()
      });
    }
  }
});

// Execute agent task
router.post('/agents/execute', async (req: Request, res: Response) => {
  try {
    const validatedData = AgentTaskSchema.parse(req.body);
    
    console.log(`🤖 Executing agent task: ${validatedData.agentType} - ${validatedData.task.substring(0, 50)}...`);
    
    const response = await waiProductionSDK.executeAgentTask(
      validatedData.agentType,
      validatedData.task,
      validatedData.options
    );
    
    res.json({
      success: true,
      data: response,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Agent task failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: error.errors,
        timestamp: new Date()
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Agent task failed',
        timestamp: new Date()
      });
    }
  }
});

// Execute orchestration
router.post('/orchestration/execute', async (req: Request, res: Response) => {
  try {
    const validatedData = OrchestrationRequestSchema.parse(req.body);
    
    const request: OrchestrationRequest = {
      id: `orch-${Date.now()}`,
      type: validatedData.type,
      description: validatedData.description,
      requirements: validatedData.requirements,
      constraints: validatedData.constraints ? {
        ...validatedData.constraints,
        timeline: validatedData.constraints.timeline ? new Date(validatedData.constraints.timeline) : undefined
      } : undefined,
      autonomous: validatedData.autonomous
    };
    
    console.log(`🎯 Executing orchestration: ${request.type} - ${request.description.substring(0, 50)}...`);
    
    const response = await waiProductionSDK.executeOrchestration(request);
    
    res.json({
      success: true,
      data: response,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: error.errors,
        timestamp: new Date()
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Orchestration failed',
        timestamp: new Date()
      });
    }
  }
});

// Get analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = waiProductionSDK.getAnalytics();
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Analytics failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analytics failed',
      timestamp: new Date()
    });
  }
});

// Get available providers
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const providers = waiProductionSDK.getAvailableProviders();
    
    res.json({
      success: true,
      data: {
        providers,
        total: providers.length,
        categories: {
          primary: ['openai', 'anthropic', 'google'],
          costOptimized: ['groq', 'deepseek', 'together-ai'],
          specialized: ['perplexity', 'elevenlabs', 'replicate']
        }
      },
      timestamp: new Date()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get providers',
      timestamp: new Date()
    });
  }
});

// Get available agents
router.get('/agents', async (req: Request, res: Response) => {
  try {
    const agents = waiProductionSDK.getAvailableAgentCategories();
    
    res.json({
      success: true,
      data: {
        agents,
        total: agents.length,
        categories: {
          executive: ['project-analyst', 'resource-planner'],
          development: ['code-architect', 'ai-engineer'],
          creative: ['content-creator', 'marketing-specialist'],
          qa: ['qa-specialist', 'execution-planner']
        }
      },
      timestamp: new Date()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agents',
      timestamp: new Date()
    });
  }
});

// Get available features
router.get('/features', async (req: Request, res: Response) => {
  try {
    const features = waiProductionSDK.getAvailableFeatures();
    
    res.json({
      success: true,
      data: {
        features,
        total: features.length,
        categories: {
          core: ['intelligent-routing', 'cost-optimization', 'quality-assurance'],
          analytics: ['real-time-analytics', 'performance-monitoring'],
          automation: ['autonomous-execution', 'multi-agent-coordination'],
          advanced: ['quantum-computing-support', 'enterprise-deployment']
        }
      },
      timestamp: new Date()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get features',
      timestamp: new Date()
    });
  }
});

// Health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await waiProductionSDK.healthCheck();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date()
    });
  }
});

// Get SDK status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = {
      version: '1.0.0',
      initialized: (waiProductionSDK as any).initialized,
      providers: {
        total: waiProductionSDK.getAvailableProviders().length,
        active: waiProductionSDK.getAvailableProviders().length
      },
      agents: {
        categories: waiProductionSDK.getAvailableAgentCategories().length,
        active: waiProductionSDK.getAvailableAgentCategories().length
      },
      features: {
        total: waiProductionSDK.getAvailableFeatures().length,
        enabled: waiProductionSDK.getAvailableFeatures().length
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed',
      timestamp: new Date()
    });
  }
});

export default router;