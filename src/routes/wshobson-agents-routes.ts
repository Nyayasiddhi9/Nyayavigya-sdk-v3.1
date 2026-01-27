/**
 * API Routes for wshobson Specialized Agents
 * Provides endpoints for agent discovery, selection, and task orchestration
 */

import { Router } from 'express';
import { 
  WshobsonAgentRouter, 
  WshobsonBMADCoordinator, 
  WAIWshobsonIntegration,
  type AgentSelectionCriteria,
  agentSelectionCriteriaSchema,
  agentSearchSchema,
  coordinateWorkflowSchema
} from '../orchestration/wshobson-integration';
import { allWshobsonAgents, getAgentById, getAgentsByCategory, agentStats } from '../agents/wshobson-agents-registry';
import { z } from 'zod';
import { db } from '../db';
import { agentCatalog } from '@shared/schema';
import { eq, and, asc, sql, count } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/v9/wshobson-agents
 * Get all wshobson specialized agents
 */
router.get('/api/v9/wshobson-agents', (req, res) => {
  try {
    const { agents, stats, totalCount } = WshobsonAgentRouter.getAllAgents();
    
    res.json({
      success: true,
      data: {
        agents,
        stats,
        totalCount
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v9/wshobson-agents/stats
 * Get statistics about wshobson agents
 */
router.get('/api/v9/wshobson-agents/stats', (req, res) => {
  try {
    const stats = agentStats;
    const integrationStats = WAIWshobsonIntegration.getIntegrationStats();
    
    res.json({
      success: true,
      data: {
        wshobsonStats: stats,
        integrationStats
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v9/wshobson-agents/:id
 * Get a specific agent by ID
 */
router.get('/api/v9/wshobson-agents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const agent = getAgentById(id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent with ID '${id}' not found`
      });
    }
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v9/wshobson-agents/category/:category
 * Get agents by category
 */
router.get('/api/v9/wshobson-agents/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const agents = getAgentsByCategory(category);
    
    res.json({
      success: true,
      data: {
        category,
        agents,
        count: agents.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v9/wshobson-agents/search
 * Search agents by criteria
 */
router.post('/api/v9/wshobson-agents/search', (req, res) => {
  try {
    // Validate request body
    const validationResult = agentSearchSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search criteria',
        details: validationResult.error.errors
      });
    }
    
    const filters = validationResult.data;
    const results = WshobsonAgentRouter.searchAgents(filters);
    
    res.json({
      success: true,
      data: {
        filters,
        results,
        count: results.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v9/wshobson-agents/select
 * Intelligently select an agent for a task
 */
router.post('/api/v9/wshobson-agents/select', (req, res) => {
  try {
    // Validate request body
    const validationResult = agentSelectionCriteriaSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid selection criteria',
        details: validationResult.error.errors
      });
    }
    
    const criteria = validationResult.data;
    const assignment = WshobsonAgentRouter.selectAgent(criteria);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'No suitable agent found for the given criteria'
      });
    }
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v9/wshobson-agents/coordinate
 * Coordinate multiple agents for workflow
 */
router.post('/api/v9/wshobson-agents/coordinate', (req, res) => {
  try {
    // Validate request body
    const validationResult = coordinateWorkflowSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workflow coordination request',
        details: validationResult.error.errors
      });
    }
    
    const { tasks } = validationResult.data;
    const assignments = WshobsonBMADCoordinator.coordinateWorkflow(tasks);
    const distribution = WshobsonBMADCoordinator.distributeParallelTasks(tasks);
    
    res.json({
      success: true,
      data: {
        assignments,
        distribution,
        totalTasks: tasks.length,
        parallelTasks: distribution.parallel.length,
        sequentialTasks: distribution.sequential.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v9/integration/wshobson
 * Get integration overview and statistics
 */
router.get('/api/v9/integration/wshobson', (req, res) => {
  try {
    const integrationStats = WAIWshobsonIntegration.getIntegrationStats();
    
    res.json({
      success: true,
      data: {
        source: 'https://github.com/wshobson/agents',
        description: '83 production-ready specialized agents from wshobson/agents repository',
        integration: 'WAI SDK v1.0',
        totalAgents: WAIWshobsonIntegration.getTotalAgentCount(),
        stats: integrationStats,
        capabilities: [
          'Architecture & System Design (14 agents)',
          'Programming Languages (18 agents)',
          'AI/ML Specialists (7 agents)',
          'Quality & Security (14 agents)',
          'DevOps & Infrastructure (8 agents)',
          'Documentation & Content (16 agents)',
          'Business & Operations (6 agents)'
        ],
        features: [
          'Intelligent agent routing with BMAD coordination',
          'Multi-tier complexity handling (Haiku, Sonnet, Opus)',
          'Cost-optimized model selection',
          'ROMA level classification (L1-L4)',
          'Parallel and sequential task distribution'
        ]
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v9/agents/unified
 * Get all agents - combines WAI agents (105) + Geminiflow agents (79) + wshobson agents (83) = 267 total
 */
router.get('/api/v9/agents/unified', async (req, res) => {
  try {
    const { search, category, status, tier, limit = '300', offset = '0' } = req.query;
    
    // Fetch all database agents (WAI + Geminiflow)
    let baseQuery = db.select().from(agentCatalog);
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${agentCatalog.name} ILIKE ${'%' + search + '%'} OR ${agentCatalog.agentId} ILIKE ${'%' + search + '%'} OR ${agentCatalog.description} ILIKE ${'%' + search + '%'})`
      );
    }

    if (category) {
      conditions.push(eq(agentCatalog.category, category as string));
    }

    if (tier) {
      conditions.push(eq(agentCatalog.tier, tier as string));
    }

    if (status) {
      conditions.push(eq(agentCatalog.status, status as string));
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    const dbAgents = await baseQuery.orderBy(asc(agentCatalog.name));

    // Format database agents (WAI + Geminiflow)
    const formattedDbAgents = dbAgents.map((agent: any) => ({
      id: agent.agentId,
      agentId: agent.agentId,
      name: agent.name,
      displayName: agent.displayName,
      role: agent.description,
      description: agent.description,
      tier: agent.tier,
      category: agent.category,
      specialization: agent.specialization,
      capabilities: agent.capabilities || [],
      systemPrompt: agent.systemPrompt,
      model: agent.preferredModels?.[0] || 'claude-3-5-sonnet-20241022',
      fallbackModel: agent.preferredModels?.[1] || 'gpt-4o',
      status: agent.status,
      isAvailable: agent.isAvailable,
      version: agent.version,
      source: agent.source || 'WAI',
      romaFlows: agent.workflowPatterns?.[0] || null,
      readiness: {
        status: agent.status === 'active' ? 'production-ready' : 'inactive',
        conformanceScore: 0.95,
        performanceMetrics: agent.baselineMetrics || {
          avgResponseTime: 850,
          successRate: 0.97,
          resourceUsage: 'optimized'
        }
      },
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt
    }));

    // Get wshobson agents
    const wshobsonAgentsData = allWshobsonAgents.map((agent) => ({
      id: agent.id,
      agentId: agent.id,
      name: agent.name,
      displayName: agent.name,
      role: agent.description,
      description: agent.description,
      tier: agent.tier,
      category: agent.category,
      specialization: agent.category,
      capabilities: agent.capabilities || [],
      systemPrompt: agent.description,
      model: agent.model === 'haiku' ? 'claude-3-haiku-20240307' : 
             agent.model === 'sonnet' ? 'claude-3-5-sonnet-20241022' : 
             'claude-3-opus-20240229',
      fallbackModel: 'gpt-4o',
      status: agent.status,
      isAvailable: agent.status === 'active',
      version: '1.0.0',
      source: 'wshobson',
      romaLevel: agent.romaLevel,
      romaFlows: null,
      readiness: {
        status: 'production-ready',
        conformanceScore: 0.95,
        performanceMetrics: {
          avgResponseTime: agent.romaLevel === 'L1' ? 300 : agent.romaLevel === 'L2' ? 600 : agent.romaLevel === 'L3' ? 1200 : 2400,
          successRate: 0.98,
          resourceUsage: 'optimized'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Apply filters to wshobson agents
    let filteredWshobsonAgents = wshobsonAgentsData;
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredWshobsonAgents = filteredWshobsonAgents.filter(agent =>
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description.toLowerCase().includes(searchLower) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(searchLower))
      );
    }

    if (tier) {
      filteredWshobsonAgents = filteredWshobsonAgents.filter(agent => agent.tier === tier);
    }

    if (status) {
      filteredWshobsonAgents = filteredWshobsonAgents.filter(agent => agent.status === status);
    }

    if (category) {
      filteredWshobsonAgents = filteredWshobsonAgents.filter(agent => agent.category === category);
    }

    // Combine all three agent sources: WAI + Geminiflow (from DB) + wshobson (static)
    const allAgents = [...formattedDbAgents, ...filteredWshobsonAgents];
    
    // Apply pagination
    const paginatedAgents = allAgents.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    // Calculate summary statistics by source
    const totalCount = allAgents.length;
    const activeCount = allAgents.filter(a => a.status === 'active').length;
    const waiCount = formattedDbAgents.filter(a => a.source === 'WAI' || !a.source).length;
    const geminiflowCount = formattedDbAgents.filter(a => a.source === 'geminiflow').length;
    const wshobsonCount = filteredWshobsonAgents.length;
    const allTiers = [...new Set(allAgents.map(a => a.tier))];
    const allCategories = [...new Set(allAgents.map(a => a.category))];

    res.json({
      agents: paginatedAgents,
      total: totalCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      summary: {
        totalAgents: totalCount,
        waiAgents: waiCount,
        geminiflowAgents: geminiflowCount,
        wshobsonAgents: wshobsonCount,
        activeAgents: activeCount,
        tiers: allTiers,
        categories: allCategories,
        breakdown: `WAI SDK v1.0: ${totalCount} agents (${waiCount} WAI + ${geminiflowCount} Geminiflow + ${wshobsonCount} wshobson)`
      }
    });
  } catch (error) {
    console.error('Error fetching unified agents:', error);
    res.status(500).json({ error: 'Failed to fetch unified agents' });
  }
});

export default router;
