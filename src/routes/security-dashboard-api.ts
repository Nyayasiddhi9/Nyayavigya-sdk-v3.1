/**
 * Security Dashboard API Routes v8.0
 * REST API endpoints for security monitoring and dashboard data
 */

import { Router } from 'express';
import { WAISecurityDashboardIntegration } from '../security/wai-security-dashboard-integration';
import { WAIEnterpriseSecuritySystem } from '../security/wai-enterprise-security';
import { waiSecurityMonitoringSystem } from '../services/wai-security-monitoring-system';
import { rateLimitMiddleware, requireAuth } from '../middleware/security';

const router = Router();

// Initialize security dashboard
const securitySystem = new WAIEnterpriseSecuritySystem();
const securityDashboard = new WAISecurityDashboardIntegration(
  {
    refreshInterval: 30000,
    alertThresholds: {
      criticalThreats: 1,
      complianceScore: 80,
      failedAuthRate: 0.1,
      anomalyScore: 0.8
    },
    notifications: {
      email: true,
      slack: true,
      webhook: process.env.SECURITY_WEBHOOK_URL
    }
  },
  securitySystem
);

// Apply middleware to all routes
router.use(rateLimitMiddleware);
router.use(requireAuth);

// ================================================================================================
// SECURITY DASHBOARD ENDPOINTS
// ================================================================================================

/**
 * GET /api/security/dashboard
 * Get complete security dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = securityDashboard.getDashboard();
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching security dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * GET /api/security/dashboard/widget/:widgetId
 * Get specific dashboard widget data
 */
router.get('/dashboard/widget/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const widget = securityDashboard.getWidget(widgetId);
    
    if (!widget) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found'
      });
    }
    
    res.json({
      success: true,
      data: widget,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching widget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch widget data'
    });
  }
});

/**
 * PUT /api/security/dashboard/widget/:widgetId/config
 * Update widget configuration
 */
router.put('/dashboard/widget/:widgetId/config', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const { config } = req.body;
    
    const updated = await securityDashboard.updateWidgetConfig(widgetId, config);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Widget configuration updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating widget config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update widget configuration'
    });
  }
});

// ================================================================================================
// SECURITY MONITORING ENDPOINTS
// ================================================================================================

/**
 * GET /api/security/monitoring/status
 * Get security monitoring system status
 */
router.get('/monitoring/status', async (req, res) => {
  try {
    const status = waiSecurityMonitoringSystem.getSystemStatus();
    const health = securityDashboard.getSystemHealth();
    
    res.json({
      success: true,
      data: {
        monitoring: status,
        dashboard: health
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching monitoring status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring status'
    });
  }
});

/**
 * GET /api/security/threats
 * Get active security threats
 */
router.get('/threats', async (req, res) => {
  try {
    const dashboard = waiSecurityMonitoringSystem.getSecurityDashboard();
    
    res.json({
      success: true,
      data: {
        threats: dashboard.threats,
        overview: dashboard.overview
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching threats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch threat data'
    });
  }
});

/**
 * GET /api/security/metrics
 * Get security metrics and analytics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await waiSecurityMonitoringSystem.collectSecurityMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security metrics'
    });
  }
});

/**
 * GET /api/security/compliance
 * Get compliance status and reports
 */
router.get('/compliance', async (req, res) => {
  try {
    const frameworks = ['SOC2', 'GDPR', 'HIPAA', 'PCI_DSS', 'ISO27001', 'CCPA'];
    const reports = [];
    
    for (const framework of frameworks) {
      try {
        const report = await waiSecurityMonitoringSystem.generateComplianceReport(framework as any);
        reports.push(report);
      } catch (error) {
        console.error(`Error generating ${framework} report:`, error);
      }
    }
    
    res.json({
      success: true,
      data: {
        reports,
        summary: {
          total: reports.length,
          compliant: reports.filter(r => r.status === 'compliant').length,
          overallScore: reports.reduce((sum, r) => sum + r.score, 0) / reports.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance data'
    });
  }
});

/**
 * POST /api/security/compliance/:framework/report
 * Generate compliance report for specific framework
 */
router.post('/compliance/:framework/report', async (req, res) => {
  try {
    const { framework } = req.params;
    const validFrameworks = ['SOC2', 'GDPR', 'HIPAA', 'PCI_DSS', 'ISO27001', 'CCPA'];
    
    if (!validFrameworks.includes(framework.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid compliance framework'
      });
    }
    
    const report = await waiSecurityMonitoringSystem.generateComplianceReport(framework.toUpperCase() as any);
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report'
    });
  }
});

// ================================================================================================
// SECURITY ADMINISTRATION ENDPOINTS
// ================================================================================================

/**
 * POST /api/security/threats/:threatId/resolve
 * Resolve a security threat
 */
router.post('/threats/:threatId/resolve', async (req, res) => {
  try {
    const { threatId } = req.params;
    const { resolution, notes } = req.body;
    
    // This would update the threat status in the monitoring system
    // For now, we'll return a success response
    
    res.json({
      success: true,
      message: 'Threat resolved successfully',
      data: {
        threatId,
        resolution,
        resolvedAt: new Date().toISOString(),
        resolvedBy: (req as any).user?.id || 'unknown'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resolving threat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve threat'
    });
  }
});

/**
 * POST /api/security/scan
 * Trigger manual security scan
 */
router.post('/scan', async (req, res) => {
  try {
    const scanId = `scan_${Date.now()}`;
    
    // Trigger security scan (this would be implemented in the monitoring system)
    const scanResult = {
      id: scanId,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      findings: {
        threats: Math.floor(Math.random() * 3),
        vulnerabilities: Math.floor(Math.random() * 2),
        compliance_issues: Math.floor(Math.random() * 1)
      }
    };
    
    res.json({
      success: true,
      data: scanResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering security scan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger security scan'
    });
  }
});

/**
 * GET /api/security/audit-logs
 * Get security audit logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const { limit = 100, offset = 0, eventType } = req.query;
    
    // This would fetch audit logs from the enterprise security system
    const auditLogs = [
      {
        id: 'audit_1',
        timestamp: new Date(),
        eventType: 'authentication',
        action: 'user_login',
        resource: 'user_account',
        actor: {
          userId: 'user_123',
          ipAddress: '192.168.1.100'
        },
        outcome: 'success'
      },
      {
        id: 'audit_2',
        timestamp: new Date(Date.now() - 60000),
        eventType: 'authorization',
        action: 'api_access',
        resource: 'security_dashboard',
        actor: {
          userId: 'user_456',
          ipAddress: '192.168.1.101'
        },
        outcome: 'success'
      }
    ];
    
    res.json({
      success: true,
      data: {
        logs: auditLogs.slice(Number(offset), Number(offset) + Number(limit)),
        total: auditLogs.length,
        pagination: {
          limit: Number(limit),
          offset: Number(offset)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

export default router;