/**
 * WAI SDK v9.0 - Capabilities API Endpoint
 * Real-time capability matrix API for 19+ providers and 500+ models
 */

import { Router, Request, Response } from 'express';
import { capabilityMatrix } from '../capabilities/capability-matrix';
import { agentRegistry } from '../registry/agent-registry-loader';

const router = Router();

/**
 * GET /api/v9/capabilities
 * Get complete capability matrix overview
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const stats = capabilityMatrix.getCapabilityStats();
    const agentStats = agentRegistry.getRegistryStats();

    const overview = {
      metadata: {
        sdkVersion: '9.0.0',
        lastUpdated: new Date().toISOString(),
        status: 'production'
      },
      providers: {
        total: stats.totalProviders,
        active: capabilityMatrix.getAllProviders().filter(p => p.status === 'active').length,
        regions: Array.from(new Set(
          capabilityMatrix.getAllProviders().flatMap(p => p.regions)
        )).length
      },
      models: {
        total: stats.totalModels,
        byType: stats.modelsByType,
        byProvider: stats.modelsByProvider,
        performance: {
          avgLatencyP95: Math.round(stats.avgLatency),
          avgCost: Number(stats.avgCost.toFixed(6)),
          avgQuality: Number(stats.avgQuality.toFixed(3))
        }
      },
      agents: {
        total: agentStats.totalAgents,
        byCategory: agentStats.categoryCounts,
        byReadiness: agentStats.readinessCounts,
        avgSkillsPerAgent: Number(agentStats.averageSkillsPerAgent.toFixed(1))
      },
      realTimeData: true,
      cacheMaxAge: 300 // 5 minutes
    };

    res.set('Cache-Control', 'public, max-age=300');
    res.json(overview);
  } catch (error) {
    console.error('Capabilities overview error:', error);
    res.status(500).json({
      error: 'Failed to retrieve capabilities overview',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v9/capabilities/providers
 * Get all providers with their capabilities
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const { status, region, features } = req.query;
    
    let providers = capabilityMatrix.getAllProviders();

    // Filter by status
    if (status && typeof status === 'string') {
      providers = providers.filter(p => p.status === status);
    }

    // Filter by region
    if (region && typeof region === 'string') {
      providers = providers.filter(p => p.regions.includes(region));
    }

    // Filter by features
    if (features && typeof features === 'string') {
      const featureList = features.split(',');
      providers = providers.filter(p => 
        featureList.some(feature => p.features.includes(feature.trim()))
      );
    }

    const response = {
      providers: providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        status: provider.status,
        regions: provider.regions,
        modelCount: provider.models.length,
        features: provider.features,
        authentication: provider.authentication,
        rateLimit: provider.rateLimit,
        pricing: provider.pricing,
        reliability: {
          uptime: provider.reliability.uptime,
          avgResponseTime: provider.reliability.avgResponseTime
        },
        lastUpdated: provider.lastUpdated
      })),
      total: providers.length,
      filters: { status, region, features }
    };

    res.set('Cache-Control', 'public, max-age=300');
    res.json(response);
  } catch (error) {
    console.error('Providers endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve providers',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v9/capabilities/models
 * Get all models with filtering and sorting
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const { 
      type, 
      provider, 
      status, 
      maxLatency, 
      maxCost, 
      minQuality,
      features,
      sort = 'quality',
      limit = '50',
      offset = '0'
    } = req.query;

    let models = capabilityMatrix.getAllModels();

    // Apply filters
    if (type && typeof type === 'string') {
      models = models.filter(m => m.type === type);
    }

    if (provider && typeof provider === 'string') {
      models = models.filter(m => m.provider === provider);
    }

    if (status && typeof status === 'string') {
      models = models.filter(m => m.status === status);
    }

    if (maxLatency && typeof maxLatency === 'string') {
      const latencyThreshold = parseInt(maxLatency);
      models = models.filter(m => m.performance.latencyP95 <= latencyThreshold);
    }

    if (maxCost && typeof maxCost === 'string') {
      const costThreshold = parseFloat(maxCost);
      models = models.filter(m => m.pricing.output <= costThreshold);
    }

    if (minQuality && typeof minQuality === 'string') {
      const qualityThreshold = parseFloat(minQuality);
      models = models.filter(m => m.quality.accuracy >= qualityThreshold);
    }

    if (features && typeof features === 'string') {
      const featureList = features.split(',');
      models = models.filter(m => 
        featureList.some(feature => m.features.includes(feature.trim()))
      );
    }

    // Sort models
    if (sort === 'quality') {
      models.sort((a, b) => b.quality.accuracy - a.quality.accuracy);
    } else if (sort === 'cost') {
      models.sort((a, b) => a.pricing.output - b.pricing.output);
    } else if (sort === 'latency') {
      models.sort((a, b) => a.performance.latencyP95 - b.performance.latencyP95);
    } else if (sort === 'name') {
      models.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Apply pagination
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedModels = models.slice(offsetNum, offsetNum + limitNum);

    const response = {
      models: paginatedModels.map(model => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        category: model.category,
        type: model.type,
        contextLength: model.contextLength,
        pricing: model.pricing,
        performance: model.performance,
        limits: model.limits,
        features: model.features,
        quality: model.quality,
        status: model.status
      })),
      pagination: {
        total: models.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < models.length
      },
      filters: { type, provider, status, maxLatency, maxCost, minQuality, features },
      sort
    };

    res.set('Cache-Control', 'public, max-age=180');
    res.json(response);
  } catch (error) {
    console.error('Models endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve models',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v9/capabilities/providers/:providerId
 * Get detailed information about a specific provider
 */
router.get('/providers/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const provider = capabilityMatrix.getProvider(providerId);

    if (!provider) {
      return res.status(404).json({
        error: `Provider '${providerId}' not found`,
        timestamp: new Date().toISOString()
      });
    }

    const models = capabilityMatrix.getModelsByProvider(providerId);
    
    const response = {
      provider: {
        ...provider,
        models: models.map(model => ({
          id: model.id,
          name: model.name,
          type: model.type,
          pricing: model.pricing,
          performance: model.performance,
          quality: model.quality,
          status: model.status
        }))
      },
      stats: {
        totalModels: models.length,
        modelsByType: models.reduce((acc, model) => {
          acc[model.type] = (acc[model.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        avgLatency: models.reduce((sum, m) => sum + m.performance.latencyP95, 0) / models.length,
        avgCost: models.reduce((sum, m) => sum + m.pricing.output, 0) / models.length,
        avgQuality: models.reduce((sum, m) => sum + m.quality.accuracy, 0) / models.length
      }
    };

    res.set('Cache-Control', 'public, max-age=600');
    res.json(response);
  } catch (error) {
    console.error('Provider detail error:', error);
    res.status(500).json({
      error: 'Failed to retrieve provider details',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v9/capabilities/models/:modelId
 * Get detailed information about a specific model
 */
router.get('/models/:modelId', async (req: Request, res: Response) => {
  try {
    const { modelId } = req.params;
    const model = capabilityMatrix.getModel(modelId);

    if (!model) {
      return res.status(404).json({
        error: `Model '${modelId}' not found`,
        timestamp: new Date().toISOString()
      });
    }

    const provider = capabilityMatrix.getProvider(model.provider);
    const similarModels = capabilityMatrix.getModelsByType(model.type)
      .filter(m => m.id !== modelId)
      .slice(0, 5);

    const response = {
      model,
      provider: provider ? {
        id: provider.id,
        name: provider.name,
        website: provider.website,
        apiDocs: provider.apiDocs,
        status: provider.status,
        authentication: provider.authentication
      } : null,
      similarModels: similarModels.map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        pricing: m.pricing,
        quality: m.quality
      })),
      benchmark: {
        costRank: capabilityMatrix.getAllModels()
          .filter(m => m.type === model.type)
          .sort((a, b) => a.pricing.output - b.pricing.output)
          .findIndex(m => m.id === modelId) + 1,
        qualityRank: capabilityMatrix.getAllModels()
          .filter(m => m.type === model.type)
          .sort((a, b) => b.quality.accuracy - a.quality.accuracy)
          .findIndex(m => m.id === modelId) + 1,
        latencyRank: capabilityMatrix.getAllModels()
          .filter(m => m.type === model.type)
          .sort((a, b) => a.performance.latencyP95 - b.performance.latencyP95)
          .findIndex(m => m.id === modelId) + 1
      }
    };

    res.set('Cache-Control', 'public, max-age=600');
    res.json(response);
  } catch (error) {
    console.error('Model detail error:', error);
    res.status(500).json({
      error: 'Failed to retrieve model details',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/v9/capabilities/recommend
 * Get model recommendations based on requirements
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const {
      task,
      type,
      maxLatency,
      maxCost,
      minQuality = 0.8,
      features = [],
      providers = [],
      limit = 10
    } = req.body;

    if (!task && !type) {
      return res.status(400).json({
        error: 'Either task description or model type is required',
        timestamp: new Date().toISOString()
      });
    }

    // Find best models based on criteria
    const recommendations = capabilityMatrix.findBestModels({
      type,
      maxLatency,
      maxCost,
      minQuality,
      features,
      providers
    }).slice(0, limit);

    const response = {
      recommendations: recommendations.map((model, index) => ({
        rank: index + 1,
        model: {
          id: model.id,
          name: model.name,
          provider: model.provider,
          type: model.type,
          pricing: model.pricing,
          performance: model.performance,
          quality: model.quality,
          features: model.features
        },
        matchScore: this.calculateMatchScore(model, req.body),
        reasoning: this.generateRecommendationReasoning(model, req.body)
      })),
      criteria: req.body,
      total: recommendations.length
    };

    res.json(response);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v9/capabilities/agents
 * Get agent registry information
 */
router.get('/agents', async (req: Request, res: Response) => {
  try {
    await agentRegistry.loadAgents();
    
    const { category, skill, readiness, limit = '20', offset = '0' } = req.query;
    
    let agents = agentRegistry.getAllAgents();

    // Apply filters
    if (category && typeof category === 'string') {
      agents = agentRegistry.getAgentsByCategory(category);
    }

    if (skill && typeof skill === 'string') {
      agents = agentRegistry.getAgentsBySkill(skill);
    }

    if (readiness && typeof readiness === 'string') {
      agents = agentRegistry.getAgentsByReadiness(readiness);
    }

    // Apply pagination
    const limitNum = parseInt(limit as string) || 20;
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedAgents = agents.slice(offsetNum, offsetNum + limitNum);

    const stats = agentRegistry.getRegistryStats();

    const response = {
      agents: paginatedAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        category: agent.category,
        description: agent.description,
        skills: agent.skills,
        readiness: agent.readiness,
        apiEndpoint: agent.apiEndpoint,
        romaAlignment: agent.romaAlignment
      })),
      stats,
      pagination: {
        total: agents.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < agents.length
      },
      filters: { category, skill, readiness }
    };

    res.set('Cache-Control', 'public, max-age=300');
    res.json(response);
  } catch (error) {
    console.error('Agents endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve agents',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/v9/capabilities/agents/find
 * Find agents for a specific task
 */
router.post('/agents/find', async (req: Request, res: Response) => {
  try {
    await agentRegistry.loadAgents();
    
    const { task, category, maxResults = 10, readinessLevel = 'production' } = req.body;

    if (!task) {
      return res.status(400).json({
        error: 'Task description is required',
        timestamp: new Date().toISOString()
      });
    }

    const agents = agentRegistry.findAgentsForTask(task, {
      category,
      maxResults,
      readinessLevel
    });

    const response = {
      task,
      agents: agents.map((agent, index) => ({
        rank: index + 1,
        agent: {
          id: agent.id,
          name: agent.name,
          category: agent.category,
          description: agent.description,
          skills: agent.skills,
          apiEndpoint: agent.apiEndpoint,
          romaAlignment: agent.romaAlignment
        }
      })),
      criteria: { task, category, readinessLevel },
      total: agents.length
    };

    res.json(response);
  } catch (error) {
    console.error('Agent finding error:', error);
    res.status(500).json({
      error: 'Failed to find agents for task',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper methods
function calculateMatchScore(model: any, criteria: any): number {
  let score = 0;
  let maxScore = 0;

  // Quality score (0-40 points)
  if (criteria.minQuality) {
    maxScore += 40;
    if (model.quality.accuracy >= criteria.minQuality) {
      score += 40 * (model.quality.accuracy / 1.0);
    }
  }

  // Cost score (0-30 points, lower cost = higher score)
  if (criteria.maxCost) {
    maxScore += 30;
    if (model.pricing.output <= criteria.maxCost) {
      score += 30 * (1 - (model.pricing.output / criteria.maxCost));
    }
  }

  // Latency score (0-30 points, lower latency = higher score)
  if (criteria.maxLatency) {
    maxScore += 30;
    if (model.performance.latencyP95 <= criteria.maxLatency) {
      score += 30 * (1 - (model.performance.latencyP95 / criteria.maxLatency));
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 80;
}

function generateRecommendationReasoning(model: any, criteria: any): string {
  const reasons = [];

  if (model.quality.accuracy >= 0.9) {
    reasons.push('High accuracy');
  }

  if (model.performance.latencyP95 <= 1000) {
    reasons.push('Low latency');
  }

  if (model.pricing.output <= 0.01) {
    reasons.push('Cost-effective');
  }

  if (criteria.features?.length > 0) {
    const matchingFeatures = criteria.features.filter((f: string) => model.features.includes(f));
    if (matchingFeatures.length > 0) {
      reasons.push(`Supports ${matchingFeatures.join(', ')}`);
    }
  }

  return reasons.join(', ') || 'Meets basic requirements';
}

export default router;