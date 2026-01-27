// Toolhouse.ai Marketplace Routes - Tool Ecosystem Management
// Integrates with Toolhouse Integration Service for comprehensive tool management

import express from 'express';
import { toolhouseIntegration } from '../services/toolhouse-integration';

const router = express.Router();

// Tool Discovery and Management Routes
router.get('/actions', async (req, res) => {
  try {
    const category = req.query.category as string;
    const search = req.query.search as string;
    
    let actions;
    
    if (category) {
      actions = toolhouseIntegration.getActionsByCategory(category);
    } else if (search) {
      actions = toolhouseIntegration.searchActions(search);
    } else {
      actions = toolhouseIntegration.getAvailableActions();
    }
    
    res.json({
      success: true,
      actions: actions,
      count: actions.length,
      filters: {
        category: category || null,
        search: search || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch actions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/bundles', async (req, res) => {
  try {
    const bundles = toolhouseIntegration.getBundles();
    
    res.json({
      success: true,
      bundles: bundles,
      count: bundles.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bundles'
    });
  }
});

router.get('/bundles/:bundleId', async (req, res) => {
  try {
    const { bundleId } = req.params;
    const bundle = toolhouseIntegration.getBundle(bundleId);
    
    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }
    
    res.json({
      success: true,
      bundle: bundle,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bundle details'
    });
  }
});

// Tool Execution Routes
router.post('/execute/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;
    const parameters = req.body.parameters || {};
    
    const result = await toolhouseIntegration.executeAction(actionId, parameters);
    
    if (result.success) {
      res.json({
        success: true,
        result: result.result,
        execution_time: result.execution_time,
        cost: result.cost,
        metadata: result.metadata,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        execution_time: result.execution_time,
        metadata: result.metadata
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute action',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Batch execution for multiple actions
router.post('/execute/batch', async (req, res) => {
  try {
    const { executions } = req.body;
    
    if (!Array.isArray(executions)) {
      return res.status(400).json({
        success: false,
        error: 'executions must be an array of {actionId, parameters} objects'
      });
    }
    
    const results = await Promise.all(
      executions.map(async (execution: any) => {
        try {
          const result = await toolhouseIntegration.executeAction(
            execution.actionId,
            execution.parameters || {}
          );
          return {
            action_id: execution.actionId,
            ...result
          };
        } catch (error) {
          return {
            action_id: execution.actionId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            execution_time: 0,
            cost: 0
          };
        }
      })
    );
    
    const successful = results.filter(r => r.success).length;
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const totalTime = results.reduce((sum, r) => sum + r.execution_time, 0);
    
    res.json({
      success: true,
      results: results,
      summary: {
        total_executions: results.length,
        successful_executions: successful,
        failed_executions: results.length - successful,
        total_cost: totalCost,
        total_execution_time: totalTime
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute batch actions'
    });
  }
});

// Analytics and Usage Routes
router.get('/analytics/usage', async (req, res) => {
  try {
    const analytics = toolhouseIntegration.getUsageAnalytics();
    
    res.json({
      success: true,
      analytics: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage analytics'
    });
  }
});

router.get('/analytics/cost', async (req, res) => {
  try {
    const costAnalysis = toolhouseIntegration.getCostAnalysis();
    
    res.json({
      success: true,
      cost_analysis: costAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cost analysis'
    });
  }
});

router.get('/analytics/performance', async (req, res) => {
  try {
    const performanceMetrics = toolhouseIntegration.getPerformanceMetrics();
    
    res.json({
      success: true,
      performance: performanceMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance metrics'
    });
  }
});

router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const popularActions = toolhouseIntegration.getPopularActions(limit);
    
    res.json({
      success: true,
      popular_actions: popularActions,
      limit: limit,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular actions'
    });
  }
});

// Tool Installation and Configuration Routes
router.post('/bundles/:bundleId/install', async (req, res) => {
  try {
    const { bundleId } = req.params;
    const installed = await toolhouseIntegration.installBundle(bundleId);
    
    if (installed) {
      res.json({
        success: true,
        message: `Bundle ${bundleId} installed successfully`,
        bundle_id: bundleId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Bundle not found or installation failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to install bundle'
    });
  }
});

router.post('/actions/:actionId/configure', async (req, res) => {
  try {
    const { actionId } = req.params;
    const config = req.body.config || {};
    
    const configured = await toolhouseIntegration.configureAction(actionId, config);
    
    if (configured) {
      res.json({
        success: true,
        message: `Action ${actionId} configured successfully`,
        action_id: actionId,
        config: config,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Action not found or configuration failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to configure action'
    });
  }
});

// Custom Tool Integration Routes
router.post('/actions/custom', async (req, res) => {
  try {
    const action = req.body;
    
    // Validate required fields
    const requiredFields = ['id', 'name', 'description', 'category', 'provider', 'version'];
    const missingFields = requiredFields.filter(field => !action[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    const added = await toolhouseIntegration.addCustomAction(action);
    
    if (added) {
      res.json({
        success: true,
        message: `Custom action ${action.name} added successfully`,
        action_id: action.id,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Action already exists or failed to add'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add custom action'
    });
  }
});

// Tool Categories and Marketplace Information
router.get('/categories', async (req, res) => {
  try {
    const actions = toolhouseIntegration.getAvailableActions();
    const categories = [...new Set(actions.map(action => action.category))];
    
    const categoryStats = categories.map(category => {
      const categoryActions = actions.filter(action => action.category === category);
      return {
        category: category,
        action_count: categoryActions.length,
        free_actions: categoryActions.filter(action => action.cost_tier === 'free').length,
        premium_actions: categoryActions.filter(action => action.cost_tier === 'premium').length,
        enterprise_actions: categoryActions.filter(action => action.cost_tier === 'enterprise').length
      };
    });
    
    res.json({
      success: true,
      categories: categoryStats,
      total_categories: categories.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Marketplace Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const actions = toolhouseIntegration.getAvailableActions();
    const bundles = toolhouseIntegration.getBundles();
    const analytics = toolhouseIntegration.getUsageAnalytics();
    const costAnalysis = toolhouseIntegration.getCostAnalysis();
    const performance = toolhouseIntegration.getPerformanceMetrics();
    
    const dashboard = {
      overview: {
        total_actions: actions.length,
        total_bundles: bundles.length,
        total_executions: costAnalysis.total_executions,
        total_cost: costAnalysis.total_cost,
        success_rate: performance.overall_success_rate,
        average_execution_time: performance.average_execution_time
      },
      popular_actions: toolhouseIntegration.getPopularActions(5),
      cost_breakdown: costAnalysis.cost_by_category,
      recent_usage: analytics.slice(0, 10),
      performance_highlights: performance.performance_trends
    };
    
    res.json({
      success: true,
      dashboard: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard data'
    });
  }
});

// Health Check for Toolhouse Integration
router.get('/health', async (req, res) => {
  try {
    const actions = toolhouseIntegration.getAvailableActions();
    const bundles = toolhouseIntegration.getBundles();
    
    res.json({
      success: true,
      service: 'Toolhouse Integration',
      status: 'operational',
      stats: {
        available_actions: actions.length,
        available_bundles: bundles.length,
        categories: [...new Set(actions.map(a => a.category))].length
      },
      features: {
        action_execution: true,
        batch_execution: true,
        usage_analytics: true,
        cost_tracking: true,
        custom_tools: true,
        bundle_management: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Toolhouse integration health check failed'
    });
  }
});

export default router;