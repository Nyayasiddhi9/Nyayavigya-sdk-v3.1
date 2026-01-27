/**
 * WAI SDK v10.0 - Agent API Endpoints
 * 
 * RESTful API endpoints for multi-agent orchestration:
 * - Agent discovery and querying
 * - Task submission and execution
 * - Real-time status monitoring
 * - Statistics and analytics
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getOrchestrator, TaskRequest, COMPLETE_AGENT_REGISTRY } from '../orchestration/unified-agent-orchestrator';
import { getLLMAgentIntegration } from '../orchestration/llm-agent-integration';

const router = Router();
const orchestrator = getOrchestrator();
const llmIntegration = getLLMAgentIntegration();

// ============================================================================
// AGENT DISCOVERY ENDPOINTS
// ============================================================================

/**
 * GET /agents
 * List all agents with optional filtering
 */
router.get('/agents', (req: Request, res: Response) => {
  try {
    const { tier, category, capability, limit = 50, offset = 0 } = req.query;
    
    let agents = orchestrator.getAllAgents();
    
    // Apply filters
    if (tier) {
      agents = agents.filter(a => a.tier === tier);
    }
    if (category) {
      agents = agents.filter(a => a.category.toLowerCase().includes(String(category).toLowerCase()));
    }
    if (capability) {
      agents = agents.filter(a => 
        a.capabilities.some(c => c.toLowerCase().includes(String(capability).toLowerCase()))
      );
    }
    
    // Pagination
    const total = agents.length;
    const paginatedAgents = agents.slice(Number(offset), Number(offset) + Number(limit));
    
    res.json({
      success: true,
      data: {
        agents: paginatedAgents.map(a => ({
          id: a.id,
          name: a.name,
          tier: a.tier,
          romaLevel: a.romaLevel,
          category: a.category,
          description: a.description,
          capabilities: a.capabilities,
          status: a.status
        })),
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /agents/:id
 * Get detailed agent information
 */
router.get('/agents/:id', (req: Request, res: Response) => {
  try {
    const agent = orchestrator.getAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${req.params.id}`
      });
    }
    
    res.json({
      success: true,
      data: {
        ...agent,
        systemPrompt: undefined // Don't expose full system prompt in API
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /agents/stats
 * Get agent statistics
 */
router.get('/stats/agents', (req: Request, res: Response) => {
  try {
    const stats = orchestrator.getAgentStats();
    const llmStats = llmIntegration.getStats();
    
    res.json({
      success: true,
      data: {
        agents: stats,
        llm: {
          totalModels: llmStats.totalModels,
          totalExecutions: llmStats.totalExecutions,
          successRate: llmStats.successRate,
          topAgents: llmStats.topAgents,
          topModels: llmStats.topModels
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// TASK EXECUTION ENDPOINTS
// ============================================================================

/**
 * POST /tasks
 * Submit a new task for execution
 */
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { description, requirements, priority = 'medium', context = {}, constraints } = req.body;
    
    if (!description || !requirements || !Array.isArray(requirements)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: description, requirements (array)'
      });
    }
    
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const task: TaskRequest = {
      id: taskId,
      type: inferTaskType(requirements),
      description,
      requirements,
      priority,
      context,
      constraints
    };
    
    // Route and execute task
    const result = await llmIntegration.executeTask(task);
    
    res.json({
      success: true,
      data: {
        taskId,
        status: result.success ? 'completed' : 'failed',
        primaryAgent: result.primaryAgent,
        primaryModel: result.primaryModel,
        supportAgents: result.supportAgents,
        executionPlan: result.executionPlan?.map(s => ({
          id: s.id,
          agentId: s.agentId,
          action: s.action,
          parallel: s.parallel
        })),
        duration: result.duration,
        cost: result.cost,
        output: result.output,
        error: result.error
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /tasks/route
 * Route a task without executing (planning only)
 */
router.post('/tasks/route', (req: Request, res: Response) => {
  try {
    const { description, requirements, priority = 'medium', context = {}, constraints } = req.body;
    
    if (!description || !requirements || !Array.isArray(requirements)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: description, requirements (array)'
      });
    }
    
    const task: TaskRequest = {
      id: `route-${Date.now()}`,
      type: inferTaskType(requirements),
      description,
      requirements,
      priority,
      context,
      constraints
    };
    
    // Route task (plan only, don't execute)
    const routing = llmIntegration.routeTask(task);
    
    res.json({
      success: routing.success,
      data: {
        primaryAgent: routing.primaryAgent ? {
          id: routing.primaryAgent.id,
          name: routing.primaryAgent.name,
          tier: routing.primaryAgent.tier,
          romaLevel: routing.primaryAgent.romaLevel
        } : null,
        primaryModel: routing.primaryModel ? {
          id: routing.primaryModel.model.id,
          name: routing.primaryModel.model.name,
          provider: routing.primaryModel.provider,
          estimatedCost: routing.primaryModel.estimatedCost
        } : null,
        supportAgents: routing.supportAgents?.map(p => ({
          id: p.agent.id,
          name: p.agent.name,
          model: p.model.model.id
        })),
        executionPlan: routing.executionPlan?.map(s => ({
          id: s.id,
          agentId: s.agentId,
          action: s.action,
          parallel: s.parallel,
          dependencies: s.dependencies
        })),
        totalEstimatedCost: routing.totalEstimatedCost,
        suggestions: routing.suggestions
      },
      error: routing.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /tasks/match
 * Find matching agents for requirements
 */
router.post('/tasks/match', (req: Request, res: Response) => {
  try {
    const { requirements, priority = 'medium', limit = 10, constraints } = req.body;
    
    if (!requirements || !Array.isArray(requirements)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: requirements (array)'
      });
    }
    
    const task: TaskRequest = {
      id: `match-${Date.now()}`,
      type: inferTaskType(requirements),
      description: 'Agent matching query',
      requirements,
      priority,
      context: {},
      constraints
    };
    
    const matches = orchestrator.findMatchingAgents(task).slice(0, Number(limit));
    
    res.json({
      success: true,
      data: {
        matches: matches.map(m => ({
          agent: {
            id: m.agent.id,
            name: m.agent.name,
            tier: m.agent.tier,
            romaLevel: m.agent.romaLevel,
            category: m.agent.category
          },
          score: m.score,
          matchedCapabilities: m.matchedCapabilities,
          estimatedCost: m.estimatedCost,
          confidence: m.confidence
        })),
        totalMatches: matches.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// MODEL SELECTION ENDPOINTS
// ============================================================================

/**
 * GET /models
 * List available LLM models
 */
router.get('/models', (req: Request, res: Response) => {
  try {
    const models = [
      { id: 'claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'anthropic', tier: 'premium' },
      { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'openai', tier: 'premium' },
      { id: 'o3-pro', name: 'o3-pro', provider: 'openai', tier: 'premium' },
      { id: 'gemini-3-pro', name: 'Gemini 3 Pro', provider: 'google', tier: 'premium' },
      { id: 'grok-4', name: 'Grok 4', provider: 'xai', tier: 'premium' },
      { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'anthropic', tier: 'standard' },
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 'standard' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', tier: 'standard' },
      { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'deepseek', tier: 'budget' },
      { id: 'claude-haiku-4', name: 'Claude Haiku 4', provider: 'anthropic', tier: 'fast' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', tier: 'fast' }
    ];
    
    res.json({
      success: true,
      data: { models }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /models/select
 * Select optimal model for agent and task
 */
router.post('/models/select', (req: Request, res: Response) => {
  try {
    const { agentId, requirements, priority = 'medium', constraints } = req.body;
    
    if (!agentId || !requirements) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, requirements'
      });
    }
    
    const agent = orchestrator.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentId}`
      });
    }
    
    const task: TaskRequest = {
      id: `model-select-${Date.now()}`,
      type: inferTaskType(requirements),
      description: 'Model selection query',
      requirements: Array.isArray(requirements) ? requirements : [requirements],
      priority,
      context: {},
      constraints
    };
    
    const selection = llmIntegration.selectModelForAgent(agent, task);
    
    res.json({
      success: true,
      data: {
        model: {
          id: selection.model.id,
          name: selection.model.name,
          contextWindow: selection.model.contextWindow,
          maxTokens: selection.model.maxTokens
        },
        provider: selection.provider,
        reason: selection.reason,
        estimatedCost: selection.estimatedCost,
        confidence: selection.confidence,
        fallbackChain: selection.fallbackChain
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// HEALTH AND STATUS ENDPOINTS
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const agentCount = orchestrator.getAgentCount();
    const llmStats = llmIntegration.getStats();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        version: '10.0.0',
        agents: {
          total: agentCount,
          target: 267,
          achieved: agentCount >= 267
        },
        llm: {
          modelsAvailable: llmStats.totalModels,
          executionsCompleted: llmStats.totalExecutions
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function inferTaskType(requirements: string[]): string {
  const typeKeywords: Record<string, string[]> = {
    development: ['coding', 'programming', 'api', 'backend', 'frontend', 'database', 'code'],
    marketing: ['marketing', 'content', 'seo', 'social', 'campaign', 'brand'],
    finance: ['financial', 'accounting', 'budget', 'investment', 'tax'],
    sales: ['sales', 'crm', 'pipeline', 'leads', 'deal'],
    hr: ['hr', 'hiring', 'recruitment', 'employee', 'talent'],
    operations: ['operations', 'supply-chain', 'logistics', 'inventory'],
    legal: ['legal', 'contract', 'compliance', 'privacy'],
    research: ['research', 'analysis', 'data', 'market']
  };
  
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (requirements.some(r => keywords.some(k => r.toLowerCase().includes(k)))) {
      return type;
    }
  }
  
  return 'general';
}

// ============================================================================
// EXPORTS
// ============================================================================

export { router as agentApiRouter };

export function createAgentApiRouter(): Router {
  return router;
}

console.log('✅ Agent API Endpoints loaded');
