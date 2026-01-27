/**
 * Main Routes Index - Mount all route modules
 * WAI Orchestration System v8.0 - Production Routes
 */

import { Router } from 'express';
import securityDashboardRouter from './security-dashboard-api';
import { healthRouter } from './health';
import { coreInterfacesRouter } from './core-interfaces';
import wizardsRouter from './wizards-platform-routes';
import authRouter from './auth-routes';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Mount authentication routes (PUBLIC - no auth required)
router.use('/api/auth', authRouter);

// Mount Wizards Incubator Platform routes - DISABLED (mounted in main routes.ts instead)
// router.use('/api/wizards', wizardsRouter);

// Mount security dashboard routes (ADMIN - admin access required)
router.use('/api/security', authenticateToken, requireAdmin, securityDashboardRouter);

// Mount comprehensive health check endpoints
router.use('/api/health', healthRouter);

// Mount core interfaces endpoints  
router.use('/api/core', coreInterfacesRouter);

// Mount provider status endpoint (alias for health/providers)
router.use('/api/providers', (req, res, next) => {
  req.url = '/providers';
  healthRouter(req, res, next);
});

// Legacy simple health check (maintained for compatibility)
router.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'WAI Orchestration System v8.0',
    version: '8.0.0',
    uptime: process.uptime()
  });
});

export default router;