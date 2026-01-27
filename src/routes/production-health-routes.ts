/**
 * Production Health Check Routes
 * Cloud-native health endpoints for AWS/GCP/Azure deployments
 */

import { Router, Request, Response } from 'express';
import { performHealthCheck, performReadinessCheck, performLivenessCheck } from '../health/production-health-check';

const router = Router();

/**
 * Main health check endpoint
 * GET /health
 * Used by load balancers and monitoring systems
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await performHealthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Kubernetes/Cloud readiness probe
 * GET /health/ready
 * Returns 200 when service is ready to accept traffic
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const readiness = await performReadinessCheck();
    
    if (readiness.ready) {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        ready: false,
        reason: readiness.reason,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Kubernetes/Cloud liveness probe
 * GET /health/live
 * Returns 200 when process is alive
 */
router.get('/health/live', async (req: Request, res: Response) => {
  try {
    const liveness = await performLivenessCheck();
    
    res.status(200).json({
      alive: liveness.alive,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      alive: false,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Detailed health metrics for monitoring dashboards
 * GET /health/metrics
 */
router.get('/health/metrics', async (req: Request, res: Response) => {
  try {
    const health = await performHealthCheck();
    const memUsage = process.memoryUsage();
    
    res.json({
      ...health,
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        cpu: process.cpuUsage(),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
