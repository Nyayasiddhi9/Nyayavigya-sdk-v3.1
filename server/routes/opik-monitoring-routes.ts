// Opik Monitoring Routes - Production LLM Monitoring & Evaluation Dashboard
// Integrates with Opik Integration Service for comprehensive monitoring

import express from 'express';
import { opikIntegration } from '../services/opik-integration';

const router = express.Router();

// Dashboard and Analytics Routes
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = await opikIntegration.getDashboardData();
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/performance/insights', async (req, res) => {
  try {
    const insights = await opikIntegration.getPerformanceInsights();
    res.json({
      success: true,
      insights: insights,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance insights'
    });
  }
});

router.get('/errors/analysis', async (req, res) => {
  try {
    const timeRange = req.query.timeRange as string || '1h';
    const errorAnalysis = await opikIntegration.getErrorAnalysis(timeRange);
    
    res.json({
      success: true,
      analysis: errorAnalysis,
      time_range: timeRange,
      analyzed_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze errors'
    });
  }
});

// A/B Testing Routes
router.post('/ab-tests', async (req, res) => {
  try {
    const { name, agent_a, agent_b, traffic_split, evaluation_criteria, duration_hours } = req.body;
    
    if (!name || !agent_a || !agent_b) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, agent_a, agent_b'
      });
    }

    const testConfig = {
      test_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      agent_a,
      agent_b,
      traffic_split: traffic_split || 50,
      evaluation_criteria: evaluation_criteria || ['response_quality', 'latency', 'cost'],
      duration_hours: duration_hours || 24
    };

    const testId = await opikIntegration.createABTest(testConfig);
    
    res.json({
      success: true,
      test_id: testId,
      message: `A/B test "${name}" created successfully`,
      config: testConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create A/B test'
    });
  }
});

router.get('/ab-tests/:testId/results', async (req, res) => {
  try {
    const { testId } = req.params;
    const results = await opikIntegration.getABTestResults(testId);
    
    if (!results) {
      return res.status(404).json({
        success: false,
        error: 'A/B test not found'
      });
    }

    res.json({
      success: true,
      results: results,
      retrieved_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve A/B test results'
    });
  }
});

// Trace Management Routes
router.post('/traces/start', async (req, res) => {
  try {
    const { agent_name, llm_provider, model, input } = req.body;
    
    if (!agent_name || !llm_provider || !model || !input) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agent_name, llm_provider, model, input'
      });
    }

    const traceId = await opikIntegration.startTrace(agent_name, llm_provider, model, input);
    
    res.json({
      success: true,
      trace_id: traceId,
      message: 'Trace started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start trace'
    });
  }
});

router.post('/traces/:traceId/end', async (req, res) => {
  try {
    const { traceId } = req.params;
    const { output, metrics } = req.body;
    
    if (!output) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: output'
      });
    }

    await opikIntegration.endTrace(traceId, output, metrics || {});
    
    res.json({
      success: true,
      message: 'Trace completed successfully',
      trace_id: traceId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to end trace'
    });
  }
});

// Real-time Monitoring Routes
router.get('/real-time/status', async (req, res) => {
  try {
    const dashboardData = await opikIntegration.getDashboardData();
    
    res.json({
      success: true,
      status: {
        active_agents: dashboardData.real_time_performance.active_agents,
        requests_per_minute: dashboardData.real_time_performance.requests_per_minute,
        average_latency: dashboardData.real_time_performance.average_latency,
        success_rate: dashboardData.real_time_performance.success_rate,
        cost_per_hour: dashboardData.real_time_performance.cost_per_hour
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time status'
    });
  }
});

router.get('/agents/performance', async (req, res) => {
  try {
    const dashboardData = await opikIntegration.getDashboardData();
    
    res.json({
      success: true,
      agent_performance: dashboardData.agent_performance,
      llm_provider_stats: dashboardData.llm_provider_stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent performance data'
    });
  }
});

router.get('/evaluation/results', async (req, res) => {
  try {
    const dashboardData = await opikIntegration.getDashboardData();
    
    res.json({
      success: true,
      evaluation_results: dashboardData.evaluation_results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch evaluation results'
    });
  }
});

// Health Check for Opik Integration
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      service: 'Opik Integration',
      status: 'operational',
      features: {
        real_time_monitoring: true,
        evaluation_framework: true,
        ab_testing: true,
        error_analysis: true,
        performance_insights: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Opik integration health check failed'
    });
  }
});

// Export for middleware integration with WAI orchestration
router.use('/middleware', (req: any, res, next) => {
  // Middleware for automatic trace creation in WAI orchestration
  req.opikIntegration = opikIntegration;
  next();
});

export default router;