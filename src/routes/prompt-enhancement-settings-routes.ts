
/**
 * Prompt Enhancement Settings Routes
 * API endpoints for configuring context engineering and multi-agent conversation features
 */

import express from 'express';
// import { enhancedPromptOrchestration } from '../services/enhanced-prompt-orchestration';
import { contextEngineeringService } from '../services/context-engineering-service';
import { multiAgentConversationSystem } from '../services/multi-agent-conversation-system';
import { storage } from '../storage';

const router = express.Router();

// Get current user settings
router.get('/settings/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Get user settings from database or use defaults
    const userSettings = await storage.getUserSettings(userId) || {
      contextEngineering: {
        enabled: true,
        maxTokensBudget: 4000,
        complexityThreshold: 'moderate',
        autoOptimize: true
      },
      multiAgentConversation: {
        enabled: true,
        maxRounds: 3,
        consensusThreshold: 0.8,
        costBudget: 100,
        requireForComplexTasks: true
      },
      fallbackStrategy: 'context-only',
      enableForAllComponents: true
    };
    
    // Get system configuration
    const systemConfig = {}; // enhancedPromptOrchestration.getConfig();
    
    // Get usage statistics
    const usageStats = {}; // enhancedPromptOrchestration.getUsageStats();
    const performanceMetrics = {}; // enhancedPromptOrchestration.getPerformanceMetrics();
    
    res.json({
      success: true,
      data: {
        userSettings,
        systemConfig,
        usageStats,
        performanceMetrics,
        availableTemplates: contextEngineeringService.getAvailableTemplates(),
        availableAgents: multiAgentConversationSystem.getAvailableAgents()
      }
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings'
    });
  }
});

// Update user settings
router.put('/settings/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const newSettings = req.body;
    
    // Validate settings
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid settings format'
      });
    }
    
    // Save user settings to database
    await storage.updateUserSettings(userId, newSettings);
    
    // Update system configuration if user is admin
    if (newSettings.updateSystemConfig && req.user?.role === 'admin') {
      enhancedPromptOrchestration.updateConfig(newSettings.systemConfig);
    }
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: newSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// Get cost estimation for configuration
router.post('/estimate-cost', async (req, res) => {
  try {
    const { prompt, taskType, complexity, settings } = req.body;
    
    if (!prompt || !taskType) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and task type are required'
      });
    }
    
    // Estimate tokens and cost for different configurations
    const estimates = {
      contextEngineering: {
        enabled: false,
        tokens: Math.ceil(prompt.length / 4),
        cost: 0.002
      },
      multiAgentConversation: {
        enabled: false,
        tokens: 0,
        cost: 0
      },
      hybrid: {
        enabled: false,
        tokens: 0,
        cost: 0
      }
    };
    
    if (settings?.contextEngineering?.enabled) {
      const ceTokens = Math.ceil(prompt.length / 4) * 2.5; // Context engineering multiplier
      estimates.contextEngineering = {
        enabled: true,
        tokens: ceTokens,
        cost: (ceTokens / 1000) * 0.002
      };
    }
    
    if (settings?.multiAgentConversation?.enabled) {
      const rounds = settings.multiAgentConversation.maxRounds || 3;
      const agents = 3; // Average number of agents
      const macTokens = Math.ceil(prompt.length / 4) * rounds * agents;
      estimates.multiAgentConversation = {
        enabled: true,
        tokens: macTokens,
        cost: (macTokens / 1000) * 0.003 // Slightly higher cost for conversation
      };
    }
    
    if (estimates.contextEngineering.enabled && estimates.multiAgentConversation.enabled) {
      estimates.hybrid = {
        enabled: true,
        tokens: estimates.contextEngineering.tokens + estimates.multiAgentConversation.tokens,
        cost: estimates.contextEngineering.cost + estimates.multiAgentConversation.cost
      };
    }
    
    res.json({
      success: true,
      data: {
        prompt: {
          length: prompt.length,
          words: prompt.split(' ').length,
          complexity
        },
        estimates,
        recommendations: {
          simple: 'Context engineering recommended for cost efficiency',
          moderate: 'Context engineering with selective multi-agent conversation',
          complex: 'Hybrid approach for best quality',
          enterprise: 'Full multi-agent conversation with context engineering'
        }
      }
    });
  } catch (error) {
    console.error('Error estimating cost:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate cost'
    });
  }
});

// Get usage analytics
router.get('/analytics/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { timeRange = '7d' } = req.query;
    
    // Get user-specific usage data
    const executions = await storage.getAgentExecutions(userId);
    const promptEnhancementExecutions = executions.filter(e => e.agentType === 'prompt_enhancer');
    
    // Calculate analytics
    const analytics = {
      totalEnhancements: promptEnhancementExecutions.length,
      totalCost: promptEnhancementExecutions.reduce((sum, e) => sum + (e.result?.cost || 0), 0),
      averageQualityScore: promptEnhancementExecutions.length > 0 
        ? promptEnhancementExecutions.reduce((sum, e) => sum + (e.result?.qualityScore || 70), 0) / promptEnhancementExecutions.length
        : 0,
      methodBreakdown: promptEnhancementExecutions.reduce((acc, e) => {
        const method = e.result?.method || 'unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      componentUsage: promptEnhancementExecutions.reduce((acc, e) => {
        const component = e.result?.usageTracking?.componentUsage || 'unknown';
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      timeSeriesData: this.generateTimeSeriesData(promptEnhancementExecutions, timeRange)
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

// Test prompt enhancement with current settings
router.post('/test-enhancement', async (req, res) => {
  try {
    const { prompt, taskType, complexity = 'moderate', settings } = req.body;
    
    if (!prompt || !taskType) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and task type are required'
      });
    }
    
    // Update configuration temporarily for testing
    const originalConfig = enhancedPromptOrchestration.getConfig();
    if (settings) {
      enhancedPromptOrchestration.updateConfig(settings);
    }
    
    try {
      // Test enhancement
      const result = await enhancedPromptOrchestration.enhancePrompt({
        originalPrompt: prompt,
        taskType,
        complexity,
        component: 'test-enhancement',
        userPreferences: settings
      });
      
      // Restore original configuration
      enhancedPromptOrchestration.updateConfig(originalConfig);
      
      res.json({
        success: true,
        data: {
          original: result.original,
          enhanced: result.enhanced,
          method: result.method,
          improvements: result.improvements,
          qualityScore: result.qualityScore,
          tokenEstimate: result.tokenEstimate,
          cost: result.cost,
          processingTime: result.processingTime,
          recommendations: result.recommendations
        }
      });
    } catch (enhancementError) {
      // Restore original configuration on error
      enhancedPromptOrchestration.updateConfig(originalConfig);
      throw enhancementError;
    }
  } catch (error) {
    console.error('Error testing enhancement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test enhancement'
    });
  }
});

// Get system health and status
router.get('/health', async (req, res) => {
  try {
    const health = {
      contextEngineering: {
        status: 'healthy',
        templatesLoaded: contextEngineeringService.getAvailableTemplates().length,
        usageStats: contextEngineeringService.getUsageStats()
      },
      multiAgentConversation: {
        status: 'healthy',
        agentsAvailable: multiAgentConversationSystem.getAvailableAgents().length,
        conversationStats: multiAgentConversationSystem.getConversationStats()
      },
      orchestration: {
        status: 'healthy',
        config: enhancedPromptOrchestration.getConfig(),
        performanceMetrics: enhancedPromptOrchestration.getPerformanceMetrics()
      }
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health status'
    });
  }
});

// Helper method to generate time series data
function generateTimeSeriesData(executions: any[], timeRange: string): any[] {
  const days = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 1;
  const now = new Date();
  const timeSeriesData = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayExecutions = executions.filter(e => {
      const execDate = new Date(e.completedAt || e.createdAt);
      return execDate >= dayStart && execDate < dayEnd;
    });
    
    timeSeriesData.push({
      date: dayStart.toISOString().split('T')[0],
      enhancements: dayExecutions.length,
      totalCost: dayExecutions.reduce((sum, e) => sum + (e.result?.cost || 0), 0),
      averageQuality: dayExecutions.length > 0 
        ? dayExecutions.reduce((sum, e) => sum + (e.result?.qualityScore || 70), 0) / dayExecutions.length
        : 0
    });
  }
  
  return timeSeriesData;
}

export default router;
