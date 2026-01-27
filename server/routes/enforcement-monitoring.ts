/**
 * WAI SDK Enforcement Monitoring Routes
 * 
 * Dashboard and API endpoints for viewing enforcement metrics
 * Phase 2.5: Metrics and Monitoring Dashboard
 */

import { Router, Request, Response } from 'express';
import { enforcementMetrics } from '../enforcement/enforcement-metrics';

const router = Router();

/**
 * GET /api/enforcement/metrics
 * Get comprehensive enforcement metrics
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = enforcementMetrics.getMetrics();
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Metrics fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
});

/**
 * GET /api/enforcement/summary
 * Get metrics summary with key insights
 */
router.get('/summary', (req: Request, res: Response) => {
  try {
    const summary = enforcementMetrics.getSummary();
    res.json({
      success: true,
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Summary fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary'
    });
  }
});

/**
 * GET /api/enforcement/events
 * Get recent enforcement events with optional filtering
 */
router.get('/events', (req: Request, res: Response) => {
  try {
    const { action, provider, limit } = req.query;

    const events = enforcementMetrics.getRecentEvents({
      action: action as 'allowed' | 'blocked' | undefined,
      provider: provider as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      events,
      count: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

/**
 * GET /api/enforcement/blocked
 * Get only blocked requests
 */
router.get('/blocked', (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const events = enforcementMetrics.getRecentEvents({
      action: 'blocked',
      limit: limit ? parseInt(limit as string) : 100
    });

    res.json({
      success: true,
      blockedRequests: events,
      count: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Blocked requests fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blocked requests'
    });
  }
});

/**
 * GET /api/enforcement/compliance
 * Get compliance rate and WAI usage statistics
 */
router.get('/compliance', (req: Request, res: Response) => {
  try {
    const summary = enforcementMetrics.getSummary();
    
    res.json({
      success: true,
      compliance: {
        rate: summary.overview.complianceRate,
        waiUsageRate: summary.overview.waiUsageRate,
        totalRequests: summary.overview.totalRequests,
        allowedRequests: summary.overview.allowedRequests,
        blockedRequests: summary.overview.blockedRequests,
        waiOrchestrationRequests: summary.overview.waiOrchestrationRequests
      },
      status: parseFloat(summary.overview.complianceRate) >= 95 ? 'healthy' : 'attention_needed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Compliance fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance data'
    });
  }
});

/**
 * POST /api/enforcement/reset
 * Reset all metrics (admin only - in production would require auth)
 */
router.post('/reset', (req: Request, res: Response) => {
  try {
    enforcementMetrics.reset();
    
    res.json({
      success: true,
      message: 'Enforcement metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics'
    });
  }
});

/**
 * GET /api/enforcement/health
 * Health check endpoint for enforcement system
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const summary = enforcementMetrics.getSummary();
    const complianceRate = parseFloat(summary.overview.complianceRate);
    
    const health = {
      status: complianceRate >= 95 ? 'healthy' : complianceRate >= 80 ? 'warning' : 'critical',
      enforcementActive: true,
      complianceRate: summary.overview.complianceRate,
      totalRequests: summary.overview.totalRequests,
      recentIssues: summary.topBlockedProviders.slice(0, 3)
    };

    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export default router;
