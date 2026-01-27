/**
 * Enhanced Agent Orchestration API Routes
 * Multi-LLM agent coordination and task orchestration endpoints
 */

import { Router } from 'express';
import { multiLLMOrchestrator, TaskContext } from '../services/enhanced-multi-llm-agent-orchestration';

const router = Router();

/**
 * POST /api/enhanced-agents/orchestrate
 * Orchestrate a task with optimal agent and LLM selection
 */
router.post('/orchestrate', async (req, res) => {
  try {
    const {
      description,
      type,
      requirements = [],
      constraints = {
        timeframe: 'normal',
        budget: 'medium',
        quality: 'medium'
      },
      priority = 'medium',
      userPreferences = {}
    } = req.body;

    if (!description || !type) {
      return res.status(400).json({
        success: false,
        error: 'Description and type are required'
      });
    }

    const taskContext: TaskContext = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      requirements,
      constraints,
      complexity: 'medium', // Will be analyzed by orchestrator
      priority,
      userPreferences
    };

    const executionPlan = await multiLLMOrchestrator.orchestrateTask(taskContext);

    res.json({
      success: true,
      data: {
        taskId: taskContext.id,
        executionPlan,
        orchestrationStrategy: 'multi-llm-agent-coordination',
        estimatedCompletion: '15-30 minutes',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error orchestrating task:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to orchestrate task'
    });
  }
});

/**
 * GET /api/enhanced-agents/recommend
 * Get agent recommendations for a task description
 */
router.get('/recommend', async (req, res) => {
  try {
    const { description } = req.query;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Task description is required'
      });
    }

    const recommendations = multiLLMOrchestrator.getRecommendedAgents(description as string);

    res.json({
      success: true,
      data: {
        recommendations,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recommendations'
    });
  }
});

/**
 * GET /api/enhanced-agents/status
 * Get orchestration system status
 */
router.get('/status', async (req, res) => {
  try {
    const status = multiLLMOrchestrator.getOrchestrationStatus();

    res.json({
      success: true,
      data: {
        ...status,
        systemStatus: 'operational',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error getting status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get status'
    });
  }
});

/**
 * GET /api/enhanced-agents/agents
 * Get all available agents with their capabilities
 */
router.get('/agents', async (req, res) => {
  try {
    const { category } = req.query;
    
    // Get agents from orchestrator (would need to expose this method)
    const realAgents = [
      {
        id: 'rapid-prototyper',
        name: 'Rapid Prototyper',
        category: 'engineering',
        description: 'Build functional MVPs in days, not weeks',
        expertise: ['react', 'nodejs', 'apis', 'deployment', 'mvp'],
        preferredLLMs: ['kimi-k2', 'openai-gpt4o', 'anthropic-claude-sonnet'],
        proactive: true
      },
      {
        id: 'feedback-synthesizer', 
        name: 'Feedback Synthesizer',
        category: 'product',
        description: 'Transform user feedback into actionable insights',
        expertise: ['user-research', 'data-analysis', 'prioritization', 'sentiment-analysis'],
        preferredLLMs: ['anthropic-claude-sonnet', 'google-gemini-pro', 'perplexity-sonar'],
        proactive: true
      },
      {
        id: 'ui-designer',
        name: 'UI Designer', 
        category: 'design',
        description: 'Create beautiful, implementable interfaces',
        expertise: ['interface-design', 'design-systems', 'user-experience', 'visual-design'],
        preferredLLMs: ['anthropic-claude-sonnet', 'openai-gpt4o', 'kimi-k2'],
        proactive: false
      },
      {
        id: 'growth-hacker',
        name: 'Growth Hacker',
        category: 'marketing', 
        description: 'Find and exploit viral growth loops',
        expertise: ['growth-strategies', 'viral-mechanics', 'conversion-optimization'],
        preferredLLMs: ['xai-grok', 'kimi-k2', 'anthropic-claude-sonnet'],
        proactive: true
      },
      {
        id: 'studio-coach',
        name: 'Studio Coach',
        category: 'bonus',
        description: 'Orchestrate and optimize multi-agent performance', 
        expertise: ['agent-coordination', 'performance-optimization', 'strategic-planning'],
        preferredLLMs: ['anthropic-claude-sonnet', 'openai-gpt4o'],
        proactive: true
      }
    ];

    const filteredAgents = category 
      ? realAgents.filter(agent => agent.category === category)
      : realAgents;

    res.json({
      success: true,
      data: {
        agents: filteredAgents,
        total: filteredAgents.length,
        categories: [...new Set(realAgents.map(a => a.category))]
      }
    });

  } catch (error: any) {
    console.error('Error getting agents:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get agents'
    });
  }
});

/**
 * GET /api/enhanced-agents/llm-providers
 * Get all available LLM providers with their capabilities
 */
router.get('/llm-providers', async (req, res) => {
  try {
    const providers = [
      {
        id: 'openai-gpt4o',
        name: 'OpenAI GPT-4o',
        strengths: ['coding', 'reasoning', 'multimodal', 'general'],
        costTier: 'high',
        speedTier: 'medium',
        contextWindow: 128000,
        multimodal: true,
        codeGeneration: true,
        reasoning: true,
        creative: true
      },
      {
        id: 'anthropic-claude-sonnet',
        name: 'Anthropic Claude Sonnet 4.0',
        strengths: ['reasoning', 'analysis', 'writing', 'coding'],
        costTier: 'high',
        speedTier: 'medium',
        contextWindow: 200000,
        multimodal: true,
        codeGeneration: true,
        reasoning: true,
        creative: true
      },
      {
        id: 'kimi-k2',
        name: 'KIMI K2 Trillion Parameter',
        strengths: ['cost-efficiency', 'speed', 'coding', 'creative'],
        costTier: 'low',
        speedTier: 'fast',
        contextWindow: 128000,
        multimodal: false,
        codeGeneration: true,
        reasoning: true,
        creative: true
      },
      {
        id: 'google-gemini-pro',
        name: 'Google Gemini Pro',
        strengths: ['multimodal', 'reasoning', 'speed'],
        costTier: 'medium',
        speedTier: 'fast',
        contextWindow: 1000000,
        multimodal: true,
        codeGeneration: true,
        reasoning: true,
        creative: true
      },
      {
        id: 'perplexity-sonar',
        name: 'Perplexity Sonar',
        strengths: ['research', 'real-time-data', 'analysis'],
        costTier: 'medium',
        speedTier: 'fast',
        contextWindow: 32000,
        multimodal: false,
        codeGeneration: false,
        reasoning: true,
        creative: false
      }
    ];

    res.json({
      success: true,
      data: {
        providers,
        total: providers.length,
        costTiers: ['low', 'medium', 'high'],
        speedTiers: ['fast', 'medium', 'slow']
      }
    });

  } catch (error: any) {
    console.error('Error getting LLM providers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get LLM providers'
    });
  }
});

/**
 * POST /api/enhanced-agents/execute
 * Execute an orchestrated task
 */
router.post('/execute/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { executionPlan } = req.body;

    if (!taskId || !executionPlan) {
      return res.status(400).json({
        success: false,
        error: 'Task ID and execution plan are required'
      });
    }

    // Simulate task execution
    const execution = {
      taskId,
      status: 'executing',
      currentStep: 'primary-agent-execution',
      progress: 0.2,
      estimatedCompletion: '12 minutes',
      executingAgent: executionPlan.primaryAgent,
      llmProvider: executionPlan.llmAssignments[executionPlan.primaryAgent],
      startedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: execution
    });

  } catch (error: any) {
    console.error('Error executing task:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute task'
    });
  }
});

/**
 * GET /api/enhanced-agents/execution/:taskId
 * Get execution status for a task
 */
router.get('/execution/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    // Simulate execution monitoring
    const execution = {
      taskId,
      status: 'completed',
      progress: 1.0,
      completedSteps: 5,
      totalSteps: 5,
      results: {
        primaryOutput: 'Task completed successfully',
        supportingOutputs: ['Analysis completed', 'Design created', 'Code generated'],
        qualityScore: 0.92,
        executionTime: '8 minutes'
      },
      completedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: execution
    });

  } catch (error: any) {
    console.error('Error getting execution status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get execution status'
    });
  }
});

export default router;