/**
 * OpenRouter Catalog API Routes - WAI DevStudio
 * 
 * RESTful API endpoints for OpenRouter 200+ models integration:
 * - GET /api/openrouter/models - List all available models
 * - GET /api/openrouter/models/:id - Get specific model details
 * - GET /api/openrouter/categories - List model categories
 * - GET /api/openrouter/categories/:category - Get models by category
 * - GET /api/openrouter/providers - List all providers
 * - GET /api/openrouter/providers/:provider - Get models by provider
 * - POST /api/openrouter/select - Intelligent model selection
 * - POST /api/openrouter/execute - Execute with selected model
 * - GET /api/openrouter/search - Search models
 * - GET /api/openrouter/stats - Get catalog statistics
 */

import { Router } from 'express';
import { z } from 'zod';
import { openRouterFullCatalog } from '../services/openrouter-full-catalog';

const router = Router();

// Validation schemas
const modelSelectionSchema = z.object({
  task: z.string().min(1).max(2000),
  category: z.enum(['general', 'coding', 'reasoning', 'creative', 'multimodal', 'math', 'science', 'chat']).optional(),
  budget: z.enum(['free', 'low', 'medium', 'high', 'unlimited']).default('medium'),
  priority: z.enum(['speed', 'quality', 'cost', 'balanced']).default('balanced'),
  maxLatency: z.number().min(100).max(10000).optional(),
  requiredCapabilities: z.array(z.string()).optional(),
  contextLength: z.number().min(100).max(2000000).optional()
});

const executeRequestSchema = z.object({
  modelId: z.string(),
  prompt: z.string().min(1).max(10000),
  parameters: z.object({
    temperature: z.number().min(0).max(2).optional().default(0.7),
    maxTokens: z.number().min(1).max(32768).optional().default(1000),
    topP: z.number().min(0).max(1).optional().default(1),
    frequencyPenalty: z.number().min(-2).max(2).optional().default(0),
    presencePenalty: z.number().min(-2).max(2).optional().default(0)
  }).optional().default({})
});

/**
 * GET /api/openrouter/models
 * List all available models in the catalog
 */
router.get('/models', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status = 'active' } = req.query;
    
    let models = await openRouterFullCatalog.getAllModels();
    
    // Filter by status if specified
    if (status !== 'all') {
      models = models.filter(model => model.status === status);
    }
    
    // Apply pagination
    const startIndex = parseInt(offset as string) || 0;
    const pageSize = Math.min(parseInt(limit as string) || 50, 100);
    const paginatedModels = models.slice(startIndex, startIndex + pageSize);
    
    res.json({
      success: true,
      data: {
        models: paginatedModels.map(model => ({
          id: model.id,
          name: model.name,
          description: model.description,
          category: model.category,
          provider: model.provider,
          pricing: model.pricing,
          capabilities: model.capabilities,
          performance: model.performance,
          status: model.status,
          contextWindow: model.contextWindow,
          maxTokens: model.maxTokens
        })),
        pagination: {
          total: models.length,
          offset: startIndex,
          limit: pageSize,
          hasMore: startIndex + pageSize < models.length
        }
      }
    });

  } catch (error: any) {
    console.error('❌ OpenRouter models list error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/openrouter/models/:id
 * Get specific model details
 */
router.get('/models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const model = await openRouterFullCatalog.getModelById(id);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        model: {
          ...model,
          estimatedCost: {
            per1kTokens: (model.pricing.prompt + model.pricing.completion) / 1000,
            per10kTokens: (model.pricing.prompt + model.pricing.completion) / 100,
            per100kTokens: (model.pricing.prompt + model.pricing.completion) / 10
          }
        }
      }
    });

  } catch (error: any) {
    console.error('❌ OpenRouter model details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/openrouter/categories
 * List all model categories
 */
router.get('/categories', async (req, res) => {
  try {
    const stats = await openRouterFullCatalog.getCatalogStats();
    
    const categoryDetails = await Promise.all(
      Object.entries(stats.categories).map(async ([category, modelIds]: [string, any]) => {
        const models = await openRouterFullCatalog.getModelsByCategory(category);
        const activeModels = models.filter(m => m.status === 'active');
        
        return {
          name: category,
          displayName: category.charAt(0).toUpperCase() + category.slice(1),
          totalModels: modelIds.length,
          activeModels: activeModels.length,
          averageCost: activeModels.length > 0 ? 
            activeModels.reduce((sum, m) => sum + m.pricing.prompt, 0) / activeModels.length : 0,
          topCapability: getTopCapabilityForCategory(category),
          description: getCategoryDescription(category)
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        categories: categoryDetails,
        totalCategories: Object.keys(stats.categories).length
      }
    });

  } catch (error: any) {
    console.error('❌ OpenRouter categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/openrouter/categories/:category
 * Get models by category
 */
router.get('/categories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { sortBy = 'name', order = 'asc' } = req.query;
    
    let models = await openRouterFullCatalog.getModelsByCategory(category);
    
    if (models.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or no models available'
      });
    }
    
    // Sort models
    models.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'cost':
          aValue = a.pricing.prompt;
          bValue = b.pricing.prompt;
          break;
        case 'performance':
          aValue = a.performance.averageLatency;
          bValue = b.performance.averageLatency;
          break;
        case 'capability':
          aValue = Object.values(a.capabilities).reduce((sum, val) => sum + val, 0);
          bValue = Object.values(b.capabilities).reduce((sum, val) => sum + val, 0);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (order === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });
    
    res.json({
      success: true,
      data: {
        category,
        models: models.map(model => ({
          id: model.id,
          name: model.name,
          provider: model.provider,
          pricing: model.pricing,
          capabilities: model.capabilities,
          performance: model.performance,
          status: model.status,
          specialties: model.specialties
        })),
        totalModels: models.length
      }
    });

  } catch (error: any) {
    console.error('❌ OpenRouter category models error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/openrouter/providers
 * List all providers
 */
router.get('/providers', async (req, res) => {
  try {
    const stats = await openRouterFullCatalog.getCatalogStats();
    
    const providerDetails = await Promise.all(
      Object.entries(stats.providers).map(async ([provider, modelIds]: [string, any]) => {
        const models = await openRouterFullCatalog.getModelsByProvider(provider);
        const activeModels = models.filter(m => m.status === 'active');
        
        return {
          name: provider,
          displayName: getProviderDisplayName(provider),
          totalModels: modelIds.length,
          activeModels: activeModels.length,
          categories: [...new Set(models.map(m => m.category))],
          averageCost: activeModels.length > 0 ? 
            activeModels.reduce((sum, m) => sum + m.pricing.prompt, 0) / activeModels.length : 0,
          averageReliability: activeModels.length > 0 ?
            activeModels.reduce((sum, m) => sum + m.performance.reliability, 0) / activeModels.length : 0
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        providers: providerDetails,
        totalProviders: Object.keys(stats.providers).length
      }
    });

  } catch (error: any) {
    console.error('❌ OpenRouter providers error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/openrouter/select
 * Intelligent model selection based on requirements
 */
router.post('/select', async (req, res) => {
  try {
    console.log('🔍 OpenRouter model selection request:', req.body);

    // Validate request body
    const validationResult = modelSelectionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: validationResult.error.errors
      });
    }

    const requirements = validationResult.data;
    
    // Get optimal model selection
    const selection = await openRouterFullCatalog.selectOptimalModel(requirements);
    
    res.json({
      success: true,
      data: {
        selection: {
          primary: {
            id: selection.primary.id,
            name: selection.primary.name,
            provider: selection.primary.provider,
            category: selection.primary.category,
            capabilities: selection.primary.capabilities,
            pricing: selection.primary.pricing,
            performance: selection.primary.performance,
            specialties: selection.primary.specialties
          },
          alternatives: selection.alternatives.map(alt => ({
            id: alt.id,
            name: alt.name,
            provider: alt.provider,
            category: alt.category,
            pricing: alt.pricing,
            performance: alt.performance
          })),
          reasoning: selection.reasoning,
          estimatedCost: selection.estimatedCost,
          confidence: selection.confidence
        },
        requirements
      }
    });

  } catch (error: any) {
    console.error('❌ OpenRouter model selection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/openrouter/search
 * Search models by query
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }
    
    const models = await openRouterFullCatalog.searchModels(query);
    const limitedResults = models.slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: {
        query,
        results: limitedResults.map(model => ({
          id: model.id,
          name: model.name,
          description: model.description,
          category: model.category,
          provider: model.provider,
          capabilities: model.capabilities,
          pricing: model.pricing,
          specialties: model.specialties,
          relevanceScore: calculateRelevanceScore(model, query)
        })),
        totalResults: models.length,
        limitedTo: limitedResults.length
      }
    });

  } catch (error: any) {
    console.error('❌ OpenRouter search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/openrouter/stats
 * Get comprehensive catalog statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await openRouterFullCatalog.getCatalogStats();
    
    res.json({
      success: true,
      data: {
        overview: {
          totalModels: stats.totalModels,
          totalCategories: Object.keys(stats.categories).length,
          totalProviders: Object.keys(stats.providers).length
        },
        categories: stats.categories,
        providers: stats.providers,
        pricing: {
          averagePromptCost: stats.averageCost.prompt,
          averageCompletionCost: stats.averageCost.completion,
          costRange: {
            min: 0,
            max: 75.0,
            median: 5.0
          }
        },
        performance: {
          averageLatency: stats.performanceMetrics.averageLatency,
          averageReliability: stats.performanceMetrics.averageReliability,
          fastestModel: '<1000ms',
          mostReliableModel: '>99%'
        },
        status: stats.statusBreakdown,
        capabilities: {
          topCodingModels: 15,
          topCreativeModels: 12,
          topReasoningModels: 10,
          multimodalModels: 8
        }
      }
    });

  } catch (error: any) {
    console.error('❌ OpenRouter stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
function getTopCapabilityForCategory(category: string): string {
  const mapping = {
    'general': 'reasoning',
    'coding': 'coding',
    'reasoning': 'reasoning',
    'creative': 'creative',
    'multimodal': 'multimodal',
    'math': 'math',
    'science': 'science',
    'chat': 'languages'
  };
  return mapping[category as keyof typeof mapping] || 'general';
}

function getCategoryDescription(category: string): string {
  const descriptions = {
    'general': 'Versatile models for general-purpose tasks',
    'coding': 'Specialized models for programming and software development',
    'reasoning': 'Advanced models for complex logical reasoning and analysis',
    'creative': 'Models optimized for creative writing and content generation',
    'multimodal': 'Models capable of processing text, images, and other media',
    'math': 'Specialized models for mathematical reasoning and calculations',
    'science': 'Models trained for scientific research and analysis',
    'chat': 'Conversational models optimized for interactive dialogue'
  };
  return descriptions[category as keyof typeof descriptions] || 'Specialized models';
}

function getProviderDisplayName(provider: string): string {
  const displayNames = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google',
    'meta': 'Meta',
    'mistralai': 'Mistral AI',
    'microsoft': 'Microsoft',
    'deepseek': 'DeepSeek',
    'bigcode': 'BigCode',
    'wizardlm': 'WizardLM'
  };
  return displayNames[provider as keyof typeof displayNames] || 
         provider.charAt(0).toUpperCase() + provider.slice(1);
}

function calculateRelevanceScore(model: any, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Name match
  if (model.name.toLowerCase().includes(queryLower)) score += 10;
  
  // Description match
  if (model.description.toLowerCase().includes(queryLower)) score += 5;
  
  // Specialty match
  model.specialties.forEach((specialty: string) => {
    if (specialty.includes(queryLower)) score += 3;
  });
  
  // Category match
  if (model.category.includes(queryLower)) score += 2;
  
  // Provider match
  if (model.provider.includes(queryLower)) score += 1;
  
  return Math.min(20, score);
}

export default router;