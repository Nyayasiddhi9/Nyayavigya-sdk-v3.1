/**
 * Agent-as-API Routes
 * RESTful API endpoints for WAI Agent-as-API functionality
 */

import { Router } from 'express';
import { AgentAsAPIService, AgentInstance } from '../services/agent-as-api';
import { WAIOrchestration3 } from '../services/unified-orchestration-client';

// Initialize Agent-as-API service (will be injected)
let agentService: AgentAsAPIService;

export function initializeAgentAPIRoutes(wai: WAIOrchestration3): Router {
  const router = Router();
  agentService = new AgentAsAPIService(wai);
  
  // Add all the routes below to this router
  addAgentRoutes(router);
  
  return router;
}

function addAgentRoutes(router: Router): void {

/**
 * GET /api/agents
 * Get all available agents
 */
router.get('/agents', async (req, res) => {
  try {
    const agents = agentService.getAvailableAgents();
    res.json({
      success: true,
      data: agents,
      total: agents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/agents/search
 * Search agents by capabilities, category, or tags
 */
router.get('/agents/search', async (req, res) => {
  try {
    const { category, capabilities, tags, q } = req.query;
    
    const searchQuery: any = {};
    if (category) searchQuery.category = category as string;
    if (capabilities) searchQuery.capabilities = (capabilities as string).split(',');
    if (tags) searchQuery.tags = (tags as string).split(',');

    let results = agentService.searchAgents(searchQuery);

    // Text search if 'q' parameter provided
    if (q) {
      const query = (q as string).toLowerCase();
      results = results.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    res.json({
      success: true,
      data: results,
      total: results.length,
      query: { category, capabilities, tags, q }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/agents/:agentId
 * Get specific agent configuration
 */
router.get('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agents = agentService.getAvailableAgents();
    const agent = agents.find(a => a.id === agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent ${agentId} not found`
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/agents/:agentId/instances
 * Create a new agent instance
 */
router.post('/agents/:agentId/instances', async (req, res) => {
  try {
    const { agentId } = req.params;
    const customConfig = req.body.config || {};

    const instance = await agentService.createAgentInstance(agentId, customConfig);

    res.status(201).json({
      success: true,
      data: {
        instanceId: instance.id,
        agentId: agentId,
        config: instance.getConfig(),
        endpoints: instance.getConfig().endpoints.map(ep => ({
          path: `/api/agent-instances/${instance.id}${ep.path}`,
          method: ep.method,
          description: ep.description
        }))
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/agent-instances/:instanceId
 * Get agent instance details and stats
 */
router.get('/agent-instances/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = agentService.getAgentInstance(instanceId);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: `Agent instance ${instanceId} not found`
      });
    }

    res.json({
      success: true,
      data: {
        config: instance.getConfig(),
        stats: instance.getStats(),
        endpoints: instance.getConfig().endpoints.map(ep => ({
          path: `/api/agent-instances/${instanceId}${ep.path}`,
          method: ep.method,
          description: ep.description,
          rateLimit: ep.rateLimit
        }))
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
 * Dynamic endpoint handler for agent instances
 * Handles all agent-specific endpoints
 */
router.all('/agent-instances/:instanceId/*', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const endpoint = '/' + req.params[0]; // Get the remaining path
    const method = req.method;

    const instance = agentService.getAgentInstance(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: `Agent instance ${instanceId} not found`
      });
    }

    // Check if endpoint exists and method matches
    const endpointConfig = instance.getConfig().endpoints.find(ep => 
      ep.path === endpoint && ep.method === method
    );

    if (!endpointConfig) {
      return res.status(404).json({
        success: false,
        error: `Endpoint ${method} ${endpoint} not found for agent instance ${instanceId}`
      });
    }

    // Extract parameters from request
    const parameters = {
      ...req.query,
      ...req.body,
      ...req.params
    };

    // Execute the endpoint
    const result = await agentService.executeEndpoint(instanceId, endpoint, parameters);

    // Handle different response types
    switch (endpointConfig.response.type) {
      case 'sync':
        res.json({
          success: true,
          data: result,
          metadata: {
            instanceId,
            endpoint,
            timestamp: new Date().toISOString()
          }
        });
        break;

      case 'async':
        res.status(202).json({
          success: true,
          message: 'Request accepted for processing',
          data: {
            jobId: result.jobId || `job_${Date.now()}`,
            status: 'processing',
            estimatedDuration: endpointConfig.response.estimatedDuration || 'unknown'
          },
          metadata: {
            instanceId,
            endpoint,
            timestamp: new Date().toISOString()
          }
        });
        break;

      case 'stream':
        // Set up streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Send initial response
        res.write(`data: ${JSON.stringify({
          type: 'start',
          instanceId,
          endpoint,
          timestamp: new Date().toISOString()
        })}\n\n`);

        // Stream the result (implementation depends on agent response)
        if (result && typeof result.pipe === 'function') {
          result.pipe(res);
        } else {
          res.write(`data: ${JSON.stringify(result)}\n\n`);
          res.end();
        }
        break;

      default:
        res.json({
          success: true,
          data: result,
          metadata: {
            instanceId,
            endpoint,
            timestamp: new Date().toISOString()
          }
        });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        instanceId: req.params.instanceId,
        endpoint: '/' + req.params[0],
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/marketplace
 * Browse the agent marketplace
 */
router.get('/marketplace', async (req, res) => {
  try {
    const { search, category, popular } = req.query;

    let results;
    if (search) {
      results = agentService.marketplace.searchMarketplace(search as string);
    } else if (popular) {
      const limit = parseInt(popular as string) || 10;
      results = agentService.marketplace.getPopularAgents(limit);
    } else if (category) {
      results = agentService.marketplace.getAgentsByCategory(category as string);
    } else {
      results = agentService.getAvailableAgents();
    }

    res.json({
      success: true,
      data: results,
      categories: agentService.marketplace.getCategories(),
      total: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/marketplace/categories
 * Get all marketplace categories
 */
router.get('/marketplace/categories', async (req, res) => {
  try {
    const categories = agentService.marketplace.getCategories();
    
    const categoriesWithCounts = categories.map(category => ({
      name: category,
      count: agentService.marketplace.getAgentsByCategory(category).length,
      agents: agentService.marketplace.getAgentsByCategory(category).slice(0, 3) // Preview
    }));

    res.json({
      success: true,
      data: categoriesWithCounts,
      total: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/agents/custom
 * Create a custom agent (for future implementation)
 */
router.post('/agents/custom', async (req, res) => {
  try {
    // Future implementation for custom agent creation
    res.status(501).json({
      success: false,
      error: 'Custom agent creation not yet implemented',
      message: 'This feature will be available in a future release'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/agents/health
 * Get overall agent system health
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      agents: {
        total: agentService.getAvailableAgents().length,
        categories: agentService.marketplace.getCategories().length
      },
      instances: {
        active: agentService.instances.size,
        // Add more instance metrics here
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '3.0.0'
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

} // End of addAgentRoutes function