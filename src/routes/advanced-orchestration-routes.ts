/**
 * Advanced Orchestration API Routes
 * 
 * Exposes endpoints for:
 * - Hierarchical Task Allocation (HTA)
 * - Dynamic Coalition Formation
 * - Cascade Routing
 * - DAG Orchestration
 */

import { Router, Request, Response } from 'express';
import { hierarchicalTaskAllocator, type TaskSpecification } from '../services/hierarchical-task-allocator';
import { cascadeRoutingService, type CascadeRequest } from '../services/cascade-routing-service';
import { dagOrchestrationService } from '../services/dag-orchestration-service';
import { tieredMemoryStorage } from '../services/tiered-memory-storage';
import { selfImprovingAgentNetwork } from '../services/self-improving-agent-network';

const router = Router();

router.get('/hta/agents', async (req: Request, res: Response) => {
  try {
    await hierarchicalTaskAllocator.loadAgentProfiles();
    const profiles = hierarchicalTaskAllocator.getAllProfiles();
    const stats = hierarchicalTaskAllocator.getStats();
    
    res.json({
      success: true,
      data: {
        agents: profiles.map(p => ({
          id: p.agentId,
          name: p.name,
          romaLevel: p.romaLevel,
          tier: p.tier,
          domain: p.domain,
          specializations: p.specializations,
          performanceScore: p.performanceScore,
          currentLoad: p.currentLoad,
          costPerToken: p.costPerToken
        })),
        stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get HTA agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent profiles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/hta/allocate', async (req: Request, res: Response) => {
  try {
    const task: TaskSpecification = req.body;
    
    if (!task.id || !task.name || !task.requiredCapabilities) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task specification',
        required: ['id', 'name', 'requiredCapabilities']
      });
    }
    
    const complexity = await hierarchicalTaskAllocator.computeBayesianComplexity(task);
    const allocation = await hierarchicalTaskAllocator.allocateTask(task);
    
    res.json({
      success: true,
      data: {
        allocation: {
          taskId: allocation.taskId,
          strategy: allocation.allocationStrategy,
          primaryAgent: allocation.primaryAgent ? {
            id: allocation.primaryAgent.agentId,
            name: allocation.primaryAgent.name,
            romaLevel: allocation.primaryAgent.romaLevel
          } : null,
          coalition: allocation.coalition ? {
            id: allocation.coalition.id,
            name: allocation.coalition.name,
            leadAgent: allocation.coalition.lead.name,
            memberCount: allocation.coalition.members.length + 1,
            strategy: allocation.coalition.formationStrategy
          } : null,
          supportAgents: allocation.supportAgents.map(a => ({
            id: a.agentId,
            name: a.name,
            romaLevel: a.romaLevel
          })),
          estimatedDuration: allocation.estimatedDuration,
          estimatedCost: allocation.estimatedCost,
          confidenceScore: allocation.confidenceScore
        },
        complexity: {
          score: complexity.score,
          confidence: complexity.confidence,
          recommendedLevel: complexity.recommendedROMALevel,
          requiresCoalition: complexity.requiresCoalition,
          factors: complexity.factors
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to allocate task:', error);
    res.status(500).json({
      success: false,
      error: 'Task allocation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/hta/coalitions', async (req: Request, res: Response) => {
  try {
    const coalitions = hierarchicalTaskAllocator.getActiveCoalitions();
    
    res.json({
      success: true,
      data: {
        coalitions: coalitions.map(c => ({
          id: c.id,
          name: c.name,
          taskId: c.taskId,
          lead: { id: c.lead.agentId, name: c.lead.name, romaLevel: c.lead.romaLevel },
          members: c.members.map(m => ({ id: m.agentId, name: m.name, romaLevel: m.romaLevel })),
          strategy: c.formationStrategy,
          status: c.status,
          estimatedCost: c.estimatedCost,
          createdAt: c.createdAt
        })),
        activeCount: coalitions.filter(c => c.status === 'active' || c.status === 'executing').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get coalitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve coalitions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/hta/coalitions/:coalitionId/disband', async (req: Request, res: Response) => {
  try {
    const { coalitionId } = req.params;
    await hierarchicalTaskAllocator.disbandCoalition(coalitionId);
    
    res.json({
      success: true,
      message: `Coalition ${coalitionId} disbanded`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to disband coalition',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/cascade/models', async (req: Request, res: Response) => {
  try {
    const models = cascadeRoutingService.getModelTiers();
    const stats = cascadeRoutingService.getCascadeStats();
    
    res.json({
      success: true,
      data: {
        models: models.map(m => ({
          id: m.id,
          name: m.name,
          provider: m.provider,
          tier: m.tier,
          cost: m.costPer1kTokens,
          capabilities: m.capabilities,
          status: m.status
        })),
        stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get cascade models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve model tiers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/cascade/assess', async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }
    
    const complexity = await cascadeRoutingService.assessComplexity(prompt, context);
    
    res.json({
      success: true,
      data: {
        complexity
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to assess complexity:', error);
    res.status(500).json({
      success: false,
      error: 'Complexity assessment failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/cascade/route', async (req: Request, res: Response) => {
  try {
    const request: CascadeRequest = {
      id: req.body.id || `cascade-${Date.now()}`,
      prompt: req.body.prompt,
      context: req.body.context,
      requiredCapability: req.body.requiredCapability || 'general',
      minQualityThreshold: req.body.minQualityThreshold || 0.8,
      maxBudget: req.body.maxBudget || 1.0,
      maxLatencyMs: req.body.maxLatencyMs,
      preferredProviders: req.body.preferredProviders,
      allowFallback: req.body.allowFallback !== false
    };
    
    if (!request.prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }
    
    const result = await cascadeRoutingService.executeCascade(request);
    
    res.json({
      success: true,
      data: {
        requestId: result.requestId,
        response: result.response,
        modelUsed: {
          id: result.modelUsed.id,
          name: result.modelUsed.name,
          tier: result.modelUsed.tier
        },
        metrics: {
          tiersAttempted: result.tiersAttempted,
          totalCost: result.totalCost,
          latencyMs: result.latencyMs,
          qualityScore: result.qualityScore,
          budgetRemaining: result.budgetRemaining
        },
        cascadePath: result.cascadePath
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cascade routing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Cascade routing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/dag/plans', async (req: Request, res: Response) => {
  try {
    const { planId, planName, tasks, totalContextBudget } = req.body;
    
    if (!planId || !planName || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        required: ['planId', 'planName', 'tasks (array)']
      });
    }
    
    const plan = await dagOrchestrationService.createExecutionPlan(
      planId,
      planName,
      tasks,
      totalContextBudget || 500000
    );
    
    res.json({
      success: true,
      data: {
        plan: {
          id: plan.id,
          name: plan.name,
          nodeCount: plan.nodes.size,
          levels: plan.executionLevels.length,
          maxParallelism: Math.max(...plan.executionLevels.map(l => l.length)),
          totalContextBudget: plan.totalContextBudget,
          estimatedDuration: plan.estimatedDuration,
          status: plan.status,
          createdAt: plan.createdAt
        },
        executionLevels: plan.executionLevels
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to create DAG plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create execution plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/dag/plans/:planId/execute', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const result = await dagOrchestrationService.executePlan(planId);
    
    res.json({
      success: true,
      data: {
        planId: result.planId,
        summary: {
          totalNodes: result.totalNodes,
          completedNodes: result.completedNodes,
          failedNodes: result.failedNodes,
          parallelizationFactor: result.parallelizationFactor,
          totalDuration: result.totalDuration
        },
        tokenUsage: result.tokenUsage
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DAG execution failed:', error);
    res.status(500).json({
      success: false,
      error: 'Execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/dag/plans', async (req: Request, res: Response) => {
  try {
    const plans = dagOrchestrationService.getAllPlans();
    const stats = dagOrchestrationService.getOrchestrationStats();
    
    res.json({
      success: true,
      data: {
        plans: plans.map(p => ({
          id: p.id,
          name: p.name,
          nodeCount: p.nodes.size,
          levels: p.executionLevels.length,
          status: p.status,
          createdAt: p.createdAt,
          startedAt: p.startedAt,
          completedAt: p.completedAt
        })),
        stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get DAG plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plans',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/dag/plans/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const plan = dagOrchestrationService.getExecutionPlan(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        planId
      });
    }
    
    const contextBudget = dagOrchestrationService.getContextBudget(planId);
    
    res.json({
      success: true,
      data: {
        plan: {
          id: plan.id,
          name: plan.name,
          status: plan.status,
          nodes: Array.from(plan.nodes.values()).map(n => ({
            id: n.id,
            name: n.name,
            status: n.status,
            dependencies: n.dependencies,
            contextBudget: n.contextBudget
          })),
          executionLevels: plan.executionLevels,
          totalContextBudget: plan.totalContextBudget,
          estimatedDuration: plan.estimatedDuration
        },
        contextBudget: contextBudget ? {
          totalTokens: contextBudget.totalTokens,
          usedTokens: contextBudget.usedTokens,
          availableTokens: contextBudget.availableTokens
        } : null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get DAG plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/dag/plans/:planId/cancel', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    await dagOrchestrationService.cancelPlan(planId);
    
    res.json({
      success: true,
      message: `Plan ${planId} cancelled`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const htaStats = hierarchicalTaskAllocator.getStats();
    const cascadeStats = cascadeRoutingService.getCascadeStats();
    const dagStats = dagOrchestrationService.getOrchestrationStats();
    const memoryStats = tieredMemoryStorage.getStats();
    const learningStats = selfImprovingAgentNetwork.getNetworkStats();
    
    res.json({
      success: true,
      data: {
        hierarchicalTaskAllocator: htaStats,
        cascadeRouting: cascadeStats,
        dagOrchestration: dagStats,
        tieredMemory: memoryStats,
        selfImprovingNetwork: learningStats,
        overall: {
          totalAgents: learningStats.totalAgents,
          totalModels: cascadeStats.totalModels,
          activePlans: dagStats.activePlans,
          totalMemories: memoryStats.totalMemories,
          totalSkillsLearned: learningStats.totalSkillsLearned,
          evolutionGeneration: learningStats.currentGeneration,
          averageFitness: learningStats.averageFitness,
          systemHealth: 'healthy'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get orchestration stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/memory/store', async (req: Request, res: Response) => {
  try {
    const { content, context, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const memory = await tieredMemoryStorage.store(content, context || {}, metadata);
    
    res.json({
      success: true,
      data: {
        id: memory.id,
        tier: memory.tier,
        isDeduplicated: memory.isDeduplicated,
        createdAt: memory.createdAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to store memory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store memory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/memory/search', async (req: Request, res: Response) => {
  try {
    const { query, context, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const results = await tieredMemoryStorage.search(query, context, limit);
    
    res.json({
      success: true,
      data: {
        results: results.map(r => ({
          id: r.memory.id,
          content: r.memory.content,
          similarity: r.similarity,
          tier: r.tier,
          accessCount: r.memory.accessCount,
          lastAccessedAt: r.memory.lastAccessedAt
        })),
        count: results.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Memory search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/memory/stats', async (req: Request, res: Response) => {
  try {
    const stats = tieredMemoryStorage.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get memory stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/memory/clear', async (req: Request, res: Response) => {
  try {
    const { context } = req.body;
    const cleared = await tieredMemoryStorage.clear(context);
    
    res.json({
      success: true,
      data: {
        clearedCount: cleared
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear memories',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/learning/network', async (req: Request, res: Response) => {
  try {
    const stats = selfImprovingAgentNetwork.getNetworkStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get network stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/learning/agents', async (req: Request, res: Response) => {
  try {
    const profiles = selfImprovingAgentNetwork.getAllProfiles();
    
    res.json({
      success: true,
      data: {
        agents: profiles.map(p => ({
          agentId: p.agentId,
          agentName: p.agentName,
          tier: p.tier,
          romaLevel: p.romaLevel,
          fitnessScore: p.fitnessScore,
          evolutionGeneration: p.evolutionGeneration,
          adaptationRate: p.adaptationRate,
          learningMode: p.learningState.mode,
          skillCount: p.skillTree.length,
          knowledgeEdges: p.knowledgeGraph.length,
          lastImprovement: p.lastImprovement
        })),
        count: profiles.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get agent profiles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/learning/agents/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const profile = selfImprovingAgentNetwork.getAgentProfile(agentId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: `Agent ${agentId} not found`
      });
    }
    
    res.json({
      success: true,
      data: {
        profile: {
          agentId: profile.agentId,
          agentName: profile.agentName,
          tier: profile.tier,
          romaLevel: profile.romaLevel,
          fitnessScore: profile.fitnessScore,
          evolutionGeneration: profile.evolutionGeneration,
          adaptationRate: profile.adaptationRate,
          learningState: profile.learningState,
          skillTree: profile.skillTree,
          knowledgeGraph: profile.knowledgeGraph.slice(0, 20),
          recentPerformance: profile.performanceHistory.slice(-10),
          lastImprovement: profile.lastImprovement
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get agent profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/learning/record', async (req: Request, res: Response) => {
  try {
    const { agentId, taskType, successRate, latency, quality, cost, userSatisfaction, innovationScore } = req.body;
    
    if (!agentId || successRate === undefined) {
      return res.status(400).json({
        success: false,
        error: 'agentId and successRate are required'
      });
    }
    
    await selfImprovingAgentNetwork.recordPerformance(agentId, {
      taskType: taskType || 'general',
      successRate,
      latency: latency || 0,
      quality: quality || successRate,
      cost: cost || 0,
      userSatisfaction: userSatisfaction || successRate,
      innovationScore: innovationScore || 0
    });
    
    res.json({
      success: true,
      message: `Performance recorded for agent ${agentId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record performance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/learning/adapt', async (req: Request, res: Response) => {
  try {
    const { agentId, taskType, examples } = req.body;
    
    if (!agentId || !taskType) {
      return res.status(400).json({
        success: false,
        error: 'agentId and taskType are required'
      });
    }
    
    const adaptation = await selfImprovingAgentNetwork.adaptToNewTask(
      agentId, 
      taskType, 
      examples || []
    );
    
    res.json({
      success: true,
      data: adaptation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to adapt agent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/learning/behaviors', async (req: Request, res: Response) => {
  try {
    const behaviors = selfImprovingAgentNetwork.getEmergentBehaviors();
    
    res.json({
      success: true,
      data: {
        behaviors: behaviors.map(b => ({
          behaviorId: b.behaviorId,
          name: b.name,
          description: b.description,
          involvedAgents: b.involvedAgents,
          frequency: b.frequency,
          benefitScore: b.benefitScore,
          firstObserved: b.firstObserved,
          lastObserved: b.lastObserved
        })),
        count: behaviors.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get emergent behaviors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/learning/events', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const events = selfImprovingAgentNetwork.getRecentEvents(limit);
    
    res.json({
      success: true,
      data: {
        events,
        count: events.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get learning events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
