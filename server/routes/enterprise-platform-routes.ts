import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { 
  organizations, organizationAdmins, organizationAgentTeams, 
  organizationIntelligenceRules, organizationLLMSettings, 
  organizationPlatformFeatures, organizationUsageMetrics, users,
  insertOrganizationAdminSchema, insertOrganizationAgentTeamSchema,
  insertOrganizationIntelligenceRuleSchema, insertOrganizationLLMSettingSchema,
  insertOrganizationPlatformFeatureSchema
} from '@shared/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  planTier: z.enum(['starter', 'professional', 'enterprise', 'unlimited']).optional(),
  size: z.enum(['small', 'medium', 'large', 'enterprise']).optional()
});

const updateOrgSchema = createOrgSchema.partial().extend({
  isActive: z.boolean().optional(),
  maxMembers: z.number().optional(),
  maxAgents: z.number().optional(),
  maxTeams: z.number().optional(),
  apiQuota: z.number().optional(),
  monthlyTokenLimit: z.number().optional(),
  domain: z.string().optional(),
  region: z.string().optional(),
  timezone: z.string().optional(),
  complianceLevel: z.string().optional(),
  billingEmail: z.string().email().optional(),
  technicalContact: z.string().optional()
});

const createAdminSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(['super_admin', 'admin', 'manager', 'viewer']).optional(),
  department: z.string().optional(),
  permissions: z.object({
    canManageAgents: z.boolean().optional(),
    canManageTeams: z.boolean().optional(),
    canManageLLMs: z.boolean().optional(),
    canManageBilling: z.boolean().optional(),
    canManageSettings: z.boolean().optional(),
    canInviteUsers: z.boolean().optional()
  }).optional()
});

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
  teamType: z.enum(['general', 'development', 'creative', 'qa', 'devops', 'executive', 'support', 'sales']).optional(),
  romaLevel: z.enum(['L1', 'L2', 'L3', 'L4']).optional(),
  coordinationMode: z.enum(['collaborative', 'hierarchical', 'swarm', 'debate', 'consensus']).optional(),
  maxConcurrentTasks: z.number().optional(),
  priority: z.number().min(1).max(10).optional()
});

const createRuleSchema = z.object({
  ruleName: z.string().min(1, "Rule name is required"),
  ruleType: z.enum(['routing', 'escalation', 'approval', 'cost_limit', 'quality_gate', 'access_control']).optional(),
  description: z.string().optional(),
  conditions: z.array(z.any()).optional(),
  actions: z.array(z.any()).optional(),
  priority: z.number().min(1).max(10).optional()
});

const createLLMSettingSchema = z.object({
  providerId: z.string().min(1),
  modelId: z.string().min(1),
  isEnabled: z.boolean().optional(),
  priority: z.number().optional(),
  costLimit: z.string().optional(),
  monthlyBudget: z.string().optional(),
  rateLimit: z.number().optional(),
  routingWeight: z.number().optional()
});

const createFeatureSchema = z.object({
  featureKey: z.string().min(1),
  featureName: z.string().min(1),
  category: z.string().min(1),
  isEnabled: z.boolean().optional(),
  configuration: z.record(z.any()).optional()
});

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; organizationId?: number };
}

const requirePlatformAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || !['super_admin', 'admin', 'platform_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Platform admin access required' });
  }
  next();
};

const validateRequest = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: result.error.errors 
      });
    }
    req.body = result.data;
    next();
  };
};

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [orgCount] = await db.select({ count: sql<number>`count(*)` }).from(organizations);
    const [activeOrgCount] = await db.select({ count: sql<number>`count(*)` }).from(organizations).where(eq(organizations.isActive, true));
    const [teamCount] = await db.select({ count: sql<number>`count(*)` }).from(organizationAgentTeams);
    const [adminCount] = await db.select({ count: sql<number>`count(*)` }).from(organizationAdmins);
    
    res.json({
      totalOrganizations: Number(orgCount?.count || 0),
      activeOrganizations: Number(activeOrgCount?.count || 0),
      totalAgentTeams: Number(teamCount?.count || 0),
      totalAdmins: Number(adminCount?.count || 0),
      totalApiCalls: 0,
      totalTokensUsed: 0
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.json({
      totalOrganizations: 0,
      activeOrganizations: 0,
      totalAgentTeams: 0,
      totalAdmins: 0,
      totalApiCalls: 0,
      totalTokensUsed: 0
    });
  }
});

router.get('/organizations', async (req: Request, res: Response) => {
  try {
    const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));
    res.json(orgs);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.json([]);
  }
});

router.post('/organizations', validateRequest(createOrgSchema), async (req: Request, res: Response) => {
  try {
    const { name, slug, description, industry, planTier, size } = req.body;
    
    const [newOrg] = await db.insert(organizations).values({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      industry,
      planTier: planTier || 'starter',
      size: size || 'small',
      plan: 'alpha',
      isActive: true,
      maxMembers: planTier === 'enterprise' ? 100 : planTier === 'professional' ? 25 : 5,
      maxAgents: planTier === 'enterprise' ? 100 : planTier === 'professional' ? 50 : 10,
      maxTeams: planTier === 'enterprise' ? 20 : planTier === 'professional' ? 10 : 3,
      apiQuota: planTier === 'enterprise' ? 100000 : planTier === 'professional' ? 50000 : 10000,
      monthlyTokenLimit: planTier === 'enterprise' ? 10000000 : planTier === 'professional' ? 5000000 : 1000000
    }).returning();
    
    res.json(newOrg);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

router.patch('/organizations/:orgId', validateRequest(updateOrgSchema), async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const updates = req.body;
    
    const [updated] = await db.update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, parseInt(orgId)))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

router.delete('/organizations/:orgId', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    await db.delete(organizations).where(eq(organizations.id, parseInt(orgId)));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

router.get('/organizations/:orgId/admins', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const admins = await db.select({
      id: organizationAdmins.id,
      organizationId: organizationAdmins.organizationId,
      userId: organizationAdmins.userId,
      role: organizationAdmins.role,
      department: organizationAdmins.department,
      canManageAgents: organizationAdmins.canManageAgents,
      canManageTeams: organizationAdmins.canManageTeams,
      canManageLLMs: organizationAdmins.canManageLLMs,
      canManageBilling: organizationAdmins.canManageBilling,
      canManageSettings: organizationAdmins.canManageSettings,
      isActive: organizationAdmins.isActive,
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(organizationAdmins)
    .leftJoin(users, eq(organizationAdmins.userId, users.id))
    .where(eq(organizationAdmins.organizationId, parseInt(orgId)));
    
    res.json(admins);
  } catch (error) {
    console.error('Error fetching organization admins:', error);
    res.json([]);
  }
});

router.post('/organizations/:orgId/admins', validateRequest(createAdminSchema), async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { email, role, department, permissions } = req.body;
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email' });
    }
    
    const [newAdmin] = await db.insert(organizationAdmins).values({
      organizationId: parseInt(orgId),
      userId: user.id,
      role: role || 'admin',
      department,
      canManageAgents: permissions?.canManageAgents ?? true,
      canManageTeams: permissions?.canManageTeams ?? true,
      canManageLLMs: permissions?.canManageLLMs ?? false,
      canManageBilling: permissions?.canManageBilling ?? false,
      canManageSettings: permissions?.canManageSettings ?? false,
      canInviteUsers: permissions?.canInviteUsers ?? true,
      isActive: true
    }).returning();
    
    res.json(newAdmin);
  } catch (error) {
    console.error('Error creating organization admin:', error);
    res.status(500).json({ error: 'Failed to add admin' });
  }
});

router.patch('/organizations/:orgId/admins/:adminId', async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const updates = req.body;
    
    const [updated] = await db.update(organizationAdmins)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizationAdmins.id, parseInt(adminId)))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

router.delete('/organizations/:orgId/admins/:adminId', async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    await db.delete(organizationAdmins).where(eq(organizationAdmins.id, parseInt(adminId)));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

router.get('/organizations/:orgId/teams', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const teams = await db.select()
      .from(organizationAgentTeams)
      .where(eq(organizationAgentTeams.organizationId, parseInt(orgId)))
      .orderBy(desc(organizationAgentTeams.priority));
    
    res.json(teams);
  } catch (error) {
    console.error('Error fetching agent teams:', error);
    res.json([]);
  }
});

router.post('/organizations/:orgId/teams', validateRequest(createTeamSchema), async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { name, description, teamType, romaLevel, coordinationMode, maxConcurrentTasks, priority } = req.body;
    
    const [newTeam] = await db.insert(organizationAgentTeams).values({
      organizationId: parseInt(orgId),
      name,
      description,
      teamType: teamType || 'general',
      romaLevel: romaLevel || 'L2',
      coordinationMode: coordinationMode || 'collaborative',
      maxConcurrentTasks: maxConcurrentTasks || 5,
      priority: priority || 5,
      isActive: true,
      agentIds: []
    }).returning();
    
    res.json(newTeam);
  } catch (error) {
    console.error('Error creating agent team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

router.patch('/organizations/:orgId/teams/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const updates = req.body;
    
    const [updated] = await db.update(organizationAgentTeams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizationAgentTeams.id, parseInt(teamId)))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

router.delete('/organizations/:orgId/teams/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    await db.delete(organizationAgentTeams).where(eq(organizationAgentTeams.id, parseInt(teamId)));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

router.get('/organizations/:orgId/rules', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const rules = await db.select()
      .from(organizationIntelligenceRules)
      .where(eq(organizationIntelligenceRules.organizationId, parseInt(orgId)))
      .orderBy(desc(organizationIntelligenceRules.priority));
    
    res.json(rules);
  } catch (error) {
    console.error('Error fetching intelligence rules:', error);
    res.json([]);
  }
});

router.post('/organizations/:orgId/rules', validateRequest(createRuleSchema), async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { ruleName, ruleType, description, conditions, actions, priority } = req.body;
    
    const [newRule] = await db.insert(organizationIntelligenceRules).values({
      organizationId: parseInt(orgId),
      ruleName,
      ruleType: ruleType || 'routing',
      description,
      conditions: conditions || [],
      actions: actions || [],
      priority: priority || 5,
      isActive: true,
      triggerCount: 0
    }).returning();
    
    res.json(newRule);
  } catch (error) {
    console.error('Error creating intelligence rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

router.patch('/organizations/:orgId/rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    
    const [updated] = await db.update(organizationIntelligenceRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizationIntelligenceRules.id, parseInt(ruleId)))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

router.delete('/organizations/:orgId/rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    await db.delete(organizationIntelligenceRules).where(eq(organizationIntelligenceRules.id, parseInt(ruleId)));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

router.get('/organizations/:orgId/llm-settings', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const settings = await db.select()
      .from(organizationLLMSettings)
      .where(eq(organizationLLMSettings.organizationId, parseInt(orgId)));
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching LLM settings:', error);
    res.json([]);
  }
});

router.post('/organizations/:orgId/llm-settings', validateRequest(createLLMSettingSchema), async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { providerId, modelId, isEnabled, priority, costLimit, monthlyBudget, rateLimit, routingWeight } = req.body;
    
    const [newSetting] = await db.insert(organizationLLMSettings).values({
      organizationId: parseInt(orgId),
      providerId,
      modelId,
      isEnabled: isEnabled ?? true,
      priority: priority || 5,
      costLimit: costLimit || null,
      monthlyBudget: monthlyBudget || null,
      currentSpend: '0',
      rateLimit: rateLimit || null,
      routingWeight: routingWeight || 1,
      preferredFor: [],
      blockedFor: []
    }).returning();
    
    res.json(newSetting);
  } catch (error) {
    console.error('Error creating LLM setting:', error);
    res.status(500).json({ error: 'Failed to create LLM setting' });
  }
});

router.patch('/organizations/:orgId/llm-settings/:settingId', async (req: Request, res: Response) => {
  try {
    const { settingId } = req.params;
    const updates = req.body;
    
    const [updated] = await db.update(organizationLLMSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizationLLMSettings.id, parseInt(settingId)))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating LLM setting:', error);
    res.status(500).json({ error: 'Failed to update LLM setting' });
  }
});

router.get('/organizations/:orgId/features', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const features = await db.select()
      .from(organizationPlatformFeatures)
      .where(eq(organizationPlatformFeatures.organizationId, parseInt(orgId)));
    
    res.json(features);
  } catch (error) {
    console.error('Error fetching platform features:', error);
    res.json([]);
  }
});

router.post('/organizations/:orgId/features', validateRequest(createFeatureSchema), async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { featureKey, featureName, category, isEnabled, configuration } = req.body;
    
    const [newFeature] = await db.insert(organizationPlatformFeatures).values({
      organizationId: parseInt(orgId),
      featureKey,
      featureName,
      category,
      isEnabled: isEnabled ?? false,
      configuration: configuration || {},
      usageCount: 0
    }).returning();
    
    res.json(newFeature);
  } catch (error) {
    console.error('Error creating platform feature:', error);
    res.status(500).json({ error: 'Failed to create feature' });
  }
});

router.patch('/organizations/:orgId/features/:featureId', async (req: Request, res: Response) => {
  try {
    const { featureId } = req.params;
    const updates = req.body;
    
    const [updated] = await db.update(organizationPlatformFeatures)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizationPlatformFeatures.id, parseInt(featureId)))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating feature:', error);
    res.status(500).json({ error: 'Failed to update feature' });
  }
});

router.post('/organizations/:orgId/init-features', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { features } = req.body;
    
    const insertedFeatures = [];
    for (const feature of features) {
      try {
        const [inserted] = await db.insert(organizationPlatformFeatures).values({
          organizationId: parseInt(orgId),
          featureKey: feature.key,
          featureName: feature.name,
          category: feature.category,
          isEnabled: false,
          configuration: {},
          usageCount: 0
        }).returning();
        insertedFeatures.push(inserted);
      } catch (e) {
      }
    }
    
    res.json(insertedFeatures);
  } catch (error) {
    console.error('Error initializing features:', error);
    res.status(500).json({ error: 'Failed to initialize features' });
  }
});

router.get('/organizations/:orgId/usage-metrics', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { period } = req.query;
    
    let query = db.select()
      .from(organizationUsageMetrics)
      .where(eq(organizationUsageMetrics.organizationId, parseInt(orgId)));
    
    if (period) {
      query = db.select()
        .from(organizationUsageMetrics)
        .where(and(
          eq(organizationUsageMetrics.organizationId, parseInt(orgId)),
          eq(organizationUsageMetrics.period, period as string)
        ));
    }
    
    const metrics = await query;
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    res.json([]);
  }
});

export default router;
