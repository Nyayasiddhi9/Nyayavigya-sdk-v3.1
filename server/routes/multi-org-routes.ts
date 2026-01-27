import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  organizationService,
  apiKeyService,
  organizationConfigService,
  usageTrackingService,
  onboardingService,
} from '../services/multi-org';
import { orgApiKeyAuth, requireScope, type OrgAuthRequest } from '../middleware/org-auth';

const router = Router();

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  domain: z.string().optional(),
});

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['admin', 'member']),
  permissions: z.array(z.string()).optional(),
});

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  rateLimit: z.number().min(1).max(10000).optional(),
  tokenLimit: z.number().min(1).optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
});

const updateConfigSchema = z.object({
  enabledAgents: z.array(z.string()).optional(),
  enabledProviders: z.array(z.string()).optional(),
  enabledTools: z.array(z.string()).optional(),
  defaultProvider: z.string().optional(),
  costOptimizationEnabled: z.boolean().optional(),
  maxTokensPerRequest: z.number().min(100).max(128000).optional(),
  features: z.record(z.boolean()).optional(),
  webhookUrl: z.string().url().optional(),
  webhookEvents: z.array(z.string()).optional(),
});

router.post('/organizations', async (req: Request, res: Response) => {
  try {
    const data = createOrganizationSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const org = await organizationService.createOrganization({
      name: data.name,
      description: data.description,
      ownerId: userId,
      plan: data.plan,
      domain: data.domain,
    });

    res.status(201).json({
      success: true,
      data: org,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create organization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create organization',
    });
  }
});

router.get('/organizations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const organizations = await organizationService.getUserOrganizations(userId);

    res.json({
      success: true,
      data: organizations,
    });
  } catch (error: any) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get organizations',
    });
  }
});

router.get('/organizations/:orgId', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const org = await organizationService.getOrganization(orgId);

    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    res.json({
      success: true,
      data: org,
    });
  } catch (error: any) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get organization',
    });
  }
});

router.patch('/organizations/:orgId', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const userId = (req as any).user?.id;
    const updates = req.body;

    const org = await organizationService.updateOrganization(orgId, updates, userId);

    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    res.json({
      success: true,
      data: org,
    });
  } catch (error: any) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update organization',
    });
  }
});

router.get('/organizations/:orgId/members', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const members = await organizationService.getOrganizationMembers(orgId);

    res.json({
      success: true,
      data: members,
    });
  } catch (error: any) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get members',
    });
  }
});

router.post('/organizations/:orgId/members', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const data = addMemberSchema.parse(req.body);

    await organizationService.addMember({
      organizationId: orgId,
      userId: data.userId,
      role: data.role,
      permissions: data.permissions,
    });

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add member',
    });
  }
});

router.delete('/organizations/:orgId/members/:userId', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const userId = req.params.userId;
    const removedBy = (req as any).user?.id;

    await organizationService.removeMember(orgId, userId, removedBy);

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove member',
    });
  }
});

router.get('/organizations/:orgId/api-keys', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const apiKeys = await apiKeyService.getOrganizationApiKeys(orgId);

    res.json({
      success: true,
      data: apiKeys,
    });
  } catch (error: any) {
    console.error('Get API keys error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get API keys',
    });
  }
});

router.post('/organizations/:orgId/api-keys', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const userId = (req as any).user?.id;
    const data = createApiKeySchema.parse(req.body);

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const apiKey = await apiKeyService.createApiKey({
      organizationId: orgId,
      name: data.name,
      description: data.description,
      scopes: data.scopes,
      rateLimit: data.rateLimit,
      tokenLimit: data.tokenLimit,
      expiresAt,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: apiKey,
      warning: 'Store this API key securely. It will not be shown again.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create API key error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create API key',
    });
  }
});

router.delete('/organizations/:orgId/api-keys/:keyId', async (req: Request, res: Response) => {
  try {
    const keyId = parseInt(req.params.keyId);
    const userId = (req as any).user?.id;

    await apiKeyService.revokeApiKey(keyId, userId);

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error: any) {
    console.error('Revoke API key error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to revoke API key',
    });
  }
});

router.get('/organizations/:orgId/config', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const config = await organizationConfigService.getConfig(orgId);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found',
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('Get config error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get configuration',
    });
  }
});

router.patch('/organizations/:orgId/config', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const userId = (req as any).user?.id;
    const data = updateConfigSchema.parse(req.body);

    const config = await organizationConfigService.updateConfig(orgId, data, userId);

    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update config error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update configuration',
    });
  }
});

router.get('/organizations/:orgId/usage', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const summary = await usageTrackingService.getUsageSummary(orgId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get usage',
    });
  }
});

router.get('/organizations/:orgId/usage/history', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const days = parseInt(req.query.days as string) || 30;
    const history = await usageTrackingService.getUsageHistory(orgId, days);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Get usage history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get usage history',
    });
  }
});

router.get('/organizations/:orgId/usage/by-provider', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const days = parseInt(req.query.days as string) || 30;
    const byProvider = await usageTrackingService.getUsageByProvider(orgId, days);

    res.json({
      success: true,
      data: byProvider,
    });
  } catch (error: any) {
    console.error('Get usage by provider error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get usage by provider',
    });
  }
});

router.get('/organizations/:orgId/usage/by-agent', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const days = parseInt(req.query.days as string) || 30;
    const byAgent = await usageTrackingService.getUsageByAgent(orgId, days);

    res.json({
      success: true,
      data: byAgent,
    });
  } catch (error: any) {
    console.error('Get usage by agent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get usage by agent',
    });
  }
});

router.get('/organizations/:orgId/audit-log', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const limit = parseInt(req.query.limit as string) || 50;
    const auditLog = await organizationService.getAuditLog(orgId, limit);

    res.json({
      success: true,
      data: auditLog,
    });
  } catch (error: any) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get audit log',
    });
  }
});

router.get('/organizations/:orgId/onboarding', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const progress = await onboardingService.getOnboardingProgress(orgId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('Get onboarding progress error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get onboarding progress',
    });
  }
});

router.post('/organizations/:orgId/onboarding/complete-step', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const { stepId } = req.body;

    if (!stepId) {
      return res.status(400).json({
        success: false,
        error: 'stepId is required',
      });
    }

    const progress = await onboardingService.completeStep(orgId, stepId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('Complete onboarding step error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete onboarding step',
    });
  }
});

router.post('/organizations/:orgId/onboarding/skip', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    await onboardingService.skipOnboarding(orgId);

    res.json({
      success: true,
      message: 'Onboarding skipped',
    });
  } catch (error: any) {
    console.error('Skip onboarding error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to skip onboarding',
    });
  }
});

router.post('/organizations/:orgId/onboarding/reset', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    await onboardingService.resetOnboarding(orgId);

    res.json({
      success: true,
      message: 'Onboarding reset',
    });
  } catch (error: any) {
    console.error('Reset onboarding error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reset onboarding',
    });
  }
});

router.post('/organizations/:orgId/onboarding/auto-complete', async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.orgId);
    const progress = await onboardingService.checkAndAutoCompleteSteps(orgId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('Auto-complete onboarding error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-complete onboarding',
    });
  }
});

export const multiOrgRouter = router;

export const sdkApiRouter = Router();

sdkApiRouter.use(orgApiKeyAuth);

sdkApiRouter.get('/me', (req: OrgAuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      organizationId: req.organizationId,
      scopes: req.scopes,
      rateLimit: req.rateLimit,
    },
  });
});

sdkApiRouter.get('/usage', async (req: OrgAuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const summary = await usageTrackingService.getUsageSummary(req.organizationId);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

sdkApiRouter.get('/config', async (req: OrgAuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const config = await organizationConfigService.getConfig(req.organizationId);
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
