/**
 * Compliance Framework API Routes
 * 
 * SOC 2 Type II and SSO/SAML endpoints for enterprise certification
 * 
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { complianceFrameworkService } from '../services/compliance-framework-service';

const router = Router();

const handleZodError = (error: ZodError, res: Response) => {
  const errors = error.errors.map(e => ({
    path: e.path.join('.'),
    message: e.message
  }));
  res.status(400).json({ 
    success: false, 
    error: 'Validation failed', 
    details: errors 
  });
};

router.get('/health', (_req: Request, res: Response) => {
  const stats = complianceFrameworkService.getStats();
  res.json({
    status: 'healthy',
    version: '1.0.0',
    soc2ComplianceScore: `${stats.soc2ComplianceScore}%`,
    ssoProviders: stats.ssoProvidersCount,
    enabledProviders: stats.enabledProviders,
    auditLogsCount: stats.auditLogsCount,
    timestamp: new Date().toISOString()
  });
});

router.get('/soc2/controls', (_req: Request, res: Response) => {
  try {
    const controls = complianceFrameworkService.getSOC2Controls();
    res.json({ success: true, controls });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get SOC 2 controls' });
  }
});

router.get('/soc2/controls/:category', (req: Request, res: Response) => {
  try {
    const category = req.params.category as 'security' | 'availability' | 'processing_integrity' | 'confidentiality' | 'privacy';
    const controls = complianceFrameworkService.getSOC2ControlsByCategory(category);
    res.json({ success: true, category, controls });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get SOC 2 controls by category' });
  }
});

router.get('/soc2/score', (_req: Request, res: Response) => {
  try {
    const score = complianceFrameworkService.getSOC2ComplianceScore();
    res.json({ success: true, ...score });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get SOC 2 compliance score' });
  }
});

const auditLogSchema = z.object({
  userId: z.string(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string(),
  ipAddress: z.string().optional().default('unknown'),
  userAgent: z.string().optional().default('unknown'),
  status: z.enum(['success', 'failure']),
  details: z.record(z.any()).optional()
});

router.post('/audit/log', async (req: Request, res: Response) => {
  try {
    const data = auditLogSchema.parse(req.body);
    const log = await complianceFrameworkService.logAudit(
      data.userId,
      data.action,
      data.resource,
      data.resourceId,
      data.ipAddress,
      data.userAgent,
      data.status,
      data.details
    );
    res.json({ success: true, log });
  } catch (error) {
    if (error instanceof ZodError) {
      handleZodError(error, res);
    } else {
      res.status(500).json({ success: false, error: 'Failed to create audit log' });
    }
  }
});

const auditQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  status: z.enum(['success', 'failure']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().positive().optional()
});

router.post('/audit/query', async (req: Request, res: Response) => {
  try {
    const filters = auditQuerySchema.parse(req.body);
    const logs = await complianceFrameworkService.getAuditLogs(
      {
        userId: filters.userId,
        action: filters.action,
        resource: filters.resource,
        status: filters.status,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined
      },
      filters.limit || 100
    );
    res.json({ success: true, logs, count: logs.length });
  } catch (error) {
    if (error instanceof ZodError) {
      handleZodError(error, res);
    } else {
      res.status(500).json({ success: false, error: 'Failed to query audit logs' });
    }
  }
});

router.get('/sso/providers', (_req: Request, res: Response) => {
  try {
    const providers = complianceFrameworkService.getSSOProviders();
    res.json({ success: true, providers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get SSO providers' });
  }
});

const samlConfigSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  ssoUrl: z.string().url(),
  sloUrl: z.string().url().optional(),
  certificate: z.string(),
  nameIdFormat: z.string().optional(),
  attributes: z.record(z.string()).optional(),
  domains: z.array(z.string())
});

router.post('/sso/saml/configure', async (req: Request, res: Response) => {
  try {
    const data = samlConfigSchema.parse(req.body);
    const provider = await complianceFrameworkService.configureSAMLProvider(
      data.id,
      {
        entityId: data.entityId,
        ssoUrl: data.ssoUrl,
        sloUrl: data.sloUrl || '',
        certificate: data.certificate,
        nameIdFormat: data.nameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        attributes: data.attributes || {}
      },
      data.domains
    );
    res.json({ success: true, provider });
  } catch (error) {
    if (error instanceof ZodError) {
      handleZodError(error, res);
    } else {
      res.status(500).json({ success: false, error: 'Failed to configure SAML provider' });
    }
  }
});

router.post('/sso/saml/login', async (req: Request, res: Response) => {
  try {
    const { providerId, returnUrl } = z.object({
      providerId: z.string(),
      returnUrl: z.string().url()
    }).parse(req.body);
    
    const result = await complianceFrameworkService.initiateSAMLLogin(providerId, returnUrl);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      handleZodError(error, res);
    } else {
      res.status(500).json({ success: false, error: 'Failed to initiate SAML login' });
    }
  }
});

router.post('/sso/saml/callback', async (req: Request, res: Response) => {
  try {
    const { SAMLResponse } = req.body;
    const result = await complianceFrameworkService.validateSAMLResponse(SAMLResponse);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to validate SAML response' });
  }
});

router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = complianceFrameworkService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get compliance stats' });
  }
});

export default router;
