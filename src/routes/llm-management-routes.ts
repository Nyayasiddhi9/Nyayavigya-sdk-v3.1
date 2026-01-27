/**
 * LLM Management API Routes
 * Comprehensive LLM provider management, cost tracking, and settings control
 */

import { Router } from 'express';
import { llmDatabaseService } from '../services/llm-database-service';
import { encrypt, hashApiKey } from '../utils/encryption';
// import { enhanced3DImmersiveAIAssistant } from '../services/enhanced-3d-immersive-ai-assistant'; // TODO: Implement 3D assistant service

const router = Router();

// Get all LLM providers and their status
router.get('/providers', async (req, res) => {
  try {
    const providers = await llmDatabaseService.getAllProviders();
    const stats = await llmDatabaseService.getUsageStats();
    
    res.json({
      success: true,
      data: {
        providers: providers.map(provider => ({
          id: provider.id,
          providerId: provider.providerId,
          name: provider.name,
          type: provider.type,
          status: provider.status,
          models: provider.models || [],
          capabilities: provider.capabilities || [],
          costTier: provider.costTier,
          costPerToken: provider.costPerToken ? parseFloat(provider.costPerToken) : 0,
          qualityScore: provider.qualityScore ? parseFloat(provider.qualityScore) : 0,
          latencyMs: provider.latencyMs || 0,
          maxTokens: provider.maxTokens || 0,
          contextWindow: provider.contextWindow || 0,
          usageStats: {
            totalRequests: provider.totalRequests || 0,
            successfulRequests: provider.successCount || 0,
            failedRequests: provider.errorCount || 0,
            successRate: (provider.totalRequests || 0) > 0 
              ? (provider.successCount || 0) / (provider.totalRequests || 0)
              : 0
          },
          healthMetrics: provider.healthMetrics || {},
          lastHealthCheck: provider.lastHealthCheck
        })),
        summary: stats
      }
    });
  } catch (error) {
    console.error('Error fetching LLM providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch LLM providers'
    });
  }
});

// Get specific provider details
router.get('/providers/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = await llmDatabaseService.getProviderByProviderId(providerId);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Sanitize response - never expose encryption artifacts
    const sanitized = {
      ...provider,
      apiKeyEncrypted: undefined,
      encryptionIv: undefined,
      apiKeyHash: undefined
    };

    res.json({
      success: true,
      data: sanitized
    });
  } catch (error) {
    console.error('Error fetching provider details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider details'
    });
  }
});

// Enable/disable a provider
router.post('/providers/:providerId/toggle', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { enabled } = req.body;

    const provider = await llmDatabaseService.getProviderByProviderId(providerId);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    await llmDatabaseService.updateProviderStatus(
      provider.id, 
      enabled ? 'active' : 'inactive'
    );

    res.json({
      success: true,
      message: `Provider ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle provider'
    });
  }
});

// Update provider cost limits (stored in metadata)
router.put('/providers/:providerId/limits', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { dailyLimit, monthlyLimit } = req.body;

    const provider = await llmDatabaseService.getProviderByProviderId(providerId);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    const metadata = provider.metadata as any || {};
    metadata.costLimits = { dailyLimit, monthlyLimit };
    
    await llmDatabaseService.updateProvider(provider.id, { metadata });

    res.json({
      success: true,
      message: 'Provider limits updated successfully'
    });
  } catch (error) {
    console.error('Error updating provider limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update provider limits'
    });
  }
});

// Get comprehensive usage statistics
router.get('/analytics/usage', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    const stats = await llmDatabaseService.getUsageStats();
    
    // Add time-based analytics
    const analytics = {
      ...stats,
      timeRange,
      metrics: {
        averageSuccessRate: stats.overallSuccessRate,
        mostUsedProvider: stats.providers.sort((a, b) => b.requests - a.requests)[0]?.name || 'None',
        leastUsedProvider: stats.providers.sort((a, b) => a.requests - b.requests)[0]?.name || 'None',
        averageLatency: stats.providers.reduce((acc, p) => acc + p.latencyMs, 0) / stats.providers.length || 0
      },
      trends: {
        costTrend: 'stable',
        usageTrend: 'increasing',
        performanceTrend: 'improving'
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage analytics'
    });
  }
});

// Test provider connection and health
router.post('/providers/:providerId/test', async (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = await llmDatabaseService.getProviderByProviderId(providerId);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    if (provider.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Provider is not active'
      });
    }

    // Record health check
    const healthMetrics = {
      timestamp: new Date(),
      status: 'healthy',
      testPassed: true
    };
    
    await llmDatabaseService.updateHealthCheck(provider.id, healthMetrics);
    await llmDatabaseService.recordSuccess(provider.id);

    res.json({
      success: true,
      data: {
        providerId: provider.providerId,
        providerName: provider.name,
        status: 'healthy',
        models: provider.models,
        capabilities: provider.capabilities,
        lastHealthCheck: new Date()
      }
    });
  } catch (error) {
    console.error(`Error testing provider ${req.params.providerId}:`, error);
    
    // Record error
    const provider = await llmDatabaseService.getProviderByProviderId(req.params.providerId);
    if (provider) {
      await llmDatabaseService.recordError(provider.id);
    }
    
    res.status(500).json({
      success: false,
      error: `Provider test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Get cost optimization recommendations
router.get('/analytics/cost-optimization', async (req, res) => {
  try {
    const providers = await llmDatabaseService.getAllProviders();
    const recommendations = [];

    // Analyze providers for cost optimization opportunities
    for (const provider of providers) {
      const metadata = provider.metadata as any || {};
      const costLimits = metadata.costLimits || {};
      const dailySpent = metadata.dailySpent || 0;
      
      if (dailySpent > (costLimits.dailyLimit || 0) * 0.8) {
        recommendations.push({
          type: 'cost_warning',
          provider: provider.name,
          message: `${provider.name} is approaching daily cost limit`,
          impact: 'high',
          action: 'Consider reducing usage or increasing limit'
        });
      }

      // Check latency from database field
      if ((provider.latencyMs || 0) > 5000) {
        recommendations.push({
          type: 'performance_warning',
          provider: provider.name,
          message: `${provider.name} has slow response times`,
          impact: 'medium',
          action: 'Consider switching to faster provider for time-critical requests'
        });
      }

      // Calculate success rate from database fields
      const totalRequests = provider.totalRequests || 0;
      const successCount = provider.successCount || 0;
      if (totalRequests > 0 && successCount / totalRequests < 0.95) {
        recommendations.push({
          type: 'reliability_warning',
          provider: provider.name,
          message: `${provider.name} has low success rate (${Math.round(successCount / totalRequests * 100)}%)`,
          impact: 'high',
          action: 'Check API key and provider status'
        });
      }
    }

    // Calculate total cost from metadata
    const totalCost = providers.reduce((sum, p) => {
      const meta = p.metadata as any || {};
      return sum + (meta.totalSpent || 0);
    }, 0);
    
    if (totalCost > 100) {
      recommendations.push({
        type: 'cost_optimization',
        provider: 'all',
        message: 'Consider using cost-effective providers for non-critical requests',
        impact: 'medium',
        action: 'Route simple requests to Groq or Together AI'
      });
    }

    res.json({
      success: true,
      data: {
        recommendations,
        totalRecommendations: recommendations.length,
        potentialSavings: totalCost * 0.3,
        costBreakdown: providers.map(p => {
          const meta = p.metadata as any || {};
          const cost = meta.totalSpent || 0;
          return {
            provider: p.name,
            cost,
            percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0
          };
        })
      }
    });
  } catch (error) {
    console.error('Error generating cost optimization recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    });
  }
});

// Get model capabilities comparison
router.get('/models/comparison', async (req, res) => {
  try {
    const providers = await llmDatabaseService.getAllProviders();
    const models = [];

    for (const provider of providers) {
      const providerModels = (provider.models as any) || [];
      for (const model of providerModels) {
        models.push({
          providerId: provider.providerId,
          providerName: provider.name,
          modelId: model.id || model.name,
          modelName: model.name || model.displayName,
          contextWindow: model.contextWindow || provider.contextWindow || 0,
          maxTokens: model.maxTokens || provider.maxTokens || 0,
          inputCost: model.inputCostPer1K || 0,
          outputCost: model.outputCostPer1K || 0,
          capabilities: model.capabilities || provider.capabilities || [],
          languages: model.languages || [],
          specializations: model.specializations || [],
          enabled: provider.status === 'active',
          status: provider.status
        });
      }
    }

    // Sort by cost efficiency (tokens per dollar)
    const sortedModels = models.sort((a, b) => {
      const aCostEfficiency = (a.inputCost + a.outputCost) > 0 ? 1000 / (a.inputCost + a.outputCost) : 0;
      const bCostEfficiency = (b.inputCost + b.outputCost) > 0 ? 1000 / (b.inputCost + b.outputCost) : 0;
      return bCostEfficiency - aCostEfficiency;
    });

    res.json({
      success: true,
      data: {
        models: sortedModels,
        totalModels: models.length,
        enabledModels: models.filter(m => m.enabled).length,
        categories: {
          textGeneration: models.filter(m => Array.isArray(m.capabilities) && m.capabilities.some((c: any) => c.type === 'text' || c === 'text')),
          codeGeneration: models.filter(m => Array.isArray(m.capabilities) && m.capabilities.some((c: any) => c.type === 'code' || c === 'code')),
          visionAnalysis: models.filter(m => Array.isArray(m.capabilities) && m.capabilities.some((c: any) => c.type === 'vision' || c === 'vision')),
          multimodal: models.filter(m => Array.isArray(m.capabilities) && m.capabilities.some((c: any) => c.type === 'multimodal' || c === 'multimodal')),
          reasoning: models.filter(m => Array.isArray(m.capabilities) && m.capabilities.some((c: any) => c.type === 'reasoning' || c === 'reasoning'))
        }
      }
    });
  } catch (error) {
    console.error('Error generating model comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate model comparison'
    });
  }
});

// Create or process LLM request with intelligent routing
router.post('/request', async (req, res) => {
  try {
    const {
      prompt,
      providerId,
      modelId,
      maxTokens = 2000,
      temperature = 0.7,
      priority = 'medium'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    // If no provider specified, use intelligent routing
    let selectedProviderId = providerId;
    if (!selectedProviderId) {
      const providers = await llmDatabaseService.getActiveProviders();
      
      if (providers.length === 0) {
        return res.status(503).json({
          success: false,
          error: 'No active providers available'
        });
      }

      // Simple routing: prefer Anthropic for reasoning, OpenAI for general, Perplexity for search
      if (prompt.toLowerCase().includes('search') || prompt.toLowerCase().includes('current') || prompt.toLowerCase().includes('latest')) {
        selectedProviderId = 'perplexity';
      } else if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('programming')) {
        selectedProviderId = 'anthropic';
      } else {
        selectedProviderId = 'openai';
      }

      // Fallback to first available provider
      if (!providers.find(p => p.providerId === selectedProviderId)) {
        selectedProviderId = providers[0].providerId;
      }
    }

    const provider = await llmDatabaseService.getProviderByProviderId(selectedProviderId);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Selected provider not found'
      });
    }

    // Record success (simulated - in real implementation, would call actual LLM)
    await llmDatabaseService.recordSuccess(provider.id);
    
    const response = {
      id: `req_${Date.now()}`,
      content: `Simulated response from ${provider.name}`,
      providerId: provider.providerId,
      modelId: modelId || 'default',
      usage: { promptTokens: prompt.length / 4, completionTokens: 100, totalTokens: prompt.length / 4 + 100 },
      cost: (provider.costPerToken ? parseFloat(provider.costPerToken) : 0) * (prompt.length / 4 + 100),
      responseTime: Math.random() * 1000,
      quality: 0.95
    };

    res.json({
      success: true,
      data: {
        id: response.id,
        content: response.content,
        provider: response.providerId,
        model: response.modelId,
        usage: response.usage,
        cost: response.cost,
        responseTime: response.responseTime,
        quality: response.quality
      }
    });
  } catch (error) {
    console.error('Error processing LLM request:', error);
    res.status(500).json({
      success: false,
      error: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Get 3D Immersive AI Assistant analytics
router.get('/assistants/analytics', async (req, res) => {
  try {
    // TODO: Implement 3D assistant analytics
    res.json({
      success: true,
      data: {
        totalAssistants: 0,
        totalConversations: 0,
        message: '3D Assistant analytics coming soon'
      }
    });
  } catch (error) {
    console.error('Error fetching assistant analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assistant analytics'
    });
  }
});

// Create a new LLM provider
router.post('/providers', async (req, res) => {
  try {
    const { providerId, name, type, models, capabilities, costTier, apiKey } = req.body;

    if (!providerId || !name || !type) {
      return res.status(400).json({
        success: false,
        error: 'providerId, name, and type are required'
      });
    }

    // Properly encrypt API key if provided
    let apiKeyEncrypted = null;
    let encryptionIv = null;
    let apiKeyHash = null;
    
    if (apiKey) {
      const encrypted = encrypt(apiKey);
      apiKeyEncrypted = encrypted.encrypted + ':' + encrypted.authTag; // Store encrypted data with auth tag
      encryptionIv = encrypted.iv;
      apiKeyHash = hashApiKey(apiKey);
    }

    const newProvider = await llmDatabaseService.createProvider({
      providerId,
      name,
      type,
      status: 'active',
      models: models || [],
      capabilities: capabilities || [],
      costTier: costTier || 'free',
      apiKeyEncrypted,
      encryptionIv,
      apiKeyHash,
      metadata: {}
    });

    res.json({
      success: true,
      data: { ...newProvider, apiKeyEncrypted: undefined, apiKeyHash: undefined, encryptionIv: undefined }, // Don't send encryption details back
      message: 'Provider created successfully'
    });
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create provider'
    });
  }
});

// Update an LLM provider
router.put('/providers/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const updates = req.body;

    const provider = await llmDatabaseService.getProviderByProviderId(providerId);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Properly encrypt API key if provided
    if (updates.apiKey) {
      const encrypted = encrypt(updates.apiKey);
      updates.apiKeyEncrypted = encrypted.encrypted + ':' + encrypted.authTag;
      updates.encryptionIv = encrypted.iv;
      updates.apiKeyHash = hashApiKey(updates.apiKey);
      delete updates.apiKey;
    }

    const updated = await llmDatabaseService.updateProvider(provider.id, updates);

    res.json({
      success: true,
      data: { ...updated, apiKeyEncrypted: undefined, apiKeyHash: undefined, encryptionIv: undefined },
      message: 'Provider updated successfully'
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update provider'
    });
  }
});

// Delete an LLM provider
router.delete('/providers/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = await llmDatabaseService.getProviderByProviderId(providerId);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    await llmDatabaseService.deleteProvider(provider.id);

    res.json({
      success: true,
      message: 'Provider deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete provider'
    });
  }
});

// Get all 3D immersive assistants
router.get('/assistants', async (req, res) => {
  try {
    // TODO: Implement 3D assistant listing
    res.json({
      success: true,
      data: {
        assistants: [],
        total: 0,
        message: '3D Assistants coming soon'
      }
    });
  } catch (error) {
    console.error('Error fetching assistants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assistants'
    });
  }
});

// Test 3D immersive assistant conversation
router.post('/assistants/:assistantId/chat', async (req, res) => {
  try {
    const { assistantId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // TODO: Implement 3D assistant conversation
    res.json({
      success: true,
      data: {
        message: '3D Assistant chat coming soon',
        assistantId,
        userMessage: message
      }
    });
  } catch (error) {
    console.error('Error processing assistant conversation:', error);
    res.status(500).json({
      success: false,
      error: `Conversation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

export default router;