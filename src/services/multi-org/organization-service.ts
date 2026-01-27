import { db } from '../../db';
import { eq, and, desc } from 'drizzle-orm';
import {
  organizations,
  userOrganizations,
  subscriptions,
  organizationConfigs,
  organizationOnboarding,
  organizationAuditLog,
  users,
  type InsertOrganizationConfig,
  type InsertSubscription,
  type InsertOrganizationOnboarding,
} from '@shared/schema';
import crypto from 'crypto';

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  ownerId: string;
  plan?: string;
  domain?: string;
}

export interface OrganizationWithDetails {
  id: number;
  name: string;
  description: string | null;
  logo: string | null;
  plan: string;
  settings: any;
  maxMembers: number | null;
  ownerId: number | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  memberCount?: number;
  subscription?: any;
  config?: any;
}

export interface AddMemberInput {
  organizationId: number;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  permissions?: string[];
}

class OrganizationService {
  private static instance: OrganizationService;

  private constructor() {}

  public static getInstance(): OrganizationService {
    if (!OrganizationService.instance) {
      OrganizationService.instance = new OrganizationService();
    }
    return OrganizationService.instance;
  }

  async createOrganization(input: CreateOrganizationInput): Promise<OrganizationWithDetails> {
    const { name, description, ownerId, plan = 'free', domain } = input;

    return await db.transaction(async (tx) => {
      const ownerIdNum = ownerId ? parseInt(ownerId, 10) : null;
      const [org] = await tx.insert(organizations).values({
        name,
        description: description || null,
        plan,
        ownerId: !isNaN(ownerIdNum as number) ? ownerIdNum : null,
        settings: { domain },
        maxMembers: this.getMaxMembersForPlan(plan),
        isActive: true,
      }).returning();

      await tx.insert(userOrganizations).values({
        userId: ownerId,
        organizationId: org.id,
        role: 'owner',
        permissions: ['*'],
      });

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await tx.insert(subscriptions).values({
        organizationId: org.id,
        planId: plan,
        planName: this.getPlanDisplayName(plan),
        billingCycle: 'monthly',
        status: plan === 'free' ? 'active' : 'trialing',
        currentPeriodEnd: periodEnd,
        trialStart: plan !== 'free' ? new Date() : null,
        trialEnd: plan !== 'free' ? trialEnd : null,
        amount: this.getPlanPrice(plan),
        currency: 'USD',
        limits: this.getPlanLimits(plan),
      });

      await tx.insert(organizationConfigs).values({
        organizationId: org.id,
        enabledAgents: this.getDefaultAgentsForPlan(plan),
        enabledProviders: this.getDefaultProvidersForPlan(plan),
        enabledTools: [],
        features: this.getDefaultFeaturesForPlan(plan),
      });

      await tx.insert(organizationOnboarding).values({
        organizationId: org.id,
        currentStep: 1,
        completedSteps: [],
        profileCompleted: true,
      });

      await this.logAuditEvent(tx, {
        organizationId: org.id,
        userId: ownerId,
        action: 'organization.created',
        resource: 'organization',
        resourceId: String(org.id),
        newValue: { name, plan },
      });

      return {
        ...org,
        memberCount: 1,
      };
    });
  }

  async getOrganization(orgId: number): Promise<OrganizationWithDetails | null> {
    const [org] = await db.select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) return null;

    const members = await db.select()
      .from(userOrganizations)
      .where(eq(userOrganizations.organizationId, orgId));

    const [sub] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, orgId))
      .limit(1);

    const [config] = await db.select()
      .from(organizationConfigs)
      .where(eq(organizationConfigs.organizationId, orgId))
      .limit(1);

    return {
      ...org,
      memberCount: members.length,
      subscription: sub,
      config,
    };
  }

  async getOrganizationByDomain(domain: string): Promise<OrganizationWithDetails | null> {
    const orgs = await db.select()
      .from(organizations)
      .where(eq(organizations.isActive, true));

    const org = orgs.find(o => (o.settings as any)?.domain === domain);
    if (!org) return null;

    return this.getOrganization(org.id);
  }

  async getUserOrganizations(userId: string): Promise<OrganizationWithDetails[]> {
    const memberships = await db.select({
      org: organizations,
      membership: userOrganizations,
    })
      .from(userOrganizations)
      .innerJoin(organizations, eq(organizations.id, userOrganizations.organizationId))
      .where(eq(userOrganizations.userId, userId));

    const results: OrganizationWithDetails[] = [];
    for (const { org } of memberships) {
      const details = await this.getOrganization(org.id);
      if (details) results.push(details);
    }

    return results;
  }

  async updateOrganization(orgId: number, updates: Partial<{
    name: string;
    description: string;
    logo: string;
    settings: any;
  }>, userId?: string): Promise<OrganizationWithDetails | null> {
    const existing = await this.getOrganization(orgId);
    if (!existing) return null;

    const [updated] = await db.update(organizations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();

    if (userId) {
      await this.logAuditEvent(db, {
        organizationId: orgId,
        userId,
        action: 'organization.updated',
        resource: 'organization',
        resourceId: String(orgId),
        previousValue: { name: existing.name, description: existing.description },
        newValue: updates,
      });
    }

    return this.getOrganization(orgId);
  }

  async addMember(input: AddMemberInput): Promise<void> {
    const { organizationId, userId, role, permissions = [] } = input;

    const org = await this.getOrganization(organizationId);
    if (!org) throw new Error('Organization not found');

    const existingMember = await db.select()
      .from(userOrganizations)
      .where(and(
        eq(userOrganizations.organizationId, organizationId),
        eq(userOrganizations.userId, userId)
      ))
      .limit(1);

    if (existingMember.length > 0) {
      throw new Error('User is already a member of this organization');
    }

    if (org.maxMembers && org.memberCount && org.memberCount >= org.maxMembers) {
      throw new Error('Organization has reached maximum member limit');
    }

    await db.insert(userOrganizations).values({
      organizationId,
      userId,
      role,
      permissions,
    });

    await this.logAuditEvent(db, {
      organizationId,
      action: 'member.added',
      resource: 'member',
      resourceId: userId,
      newValue: { role, permissions },
    });
  }

  async removeMember(organizationId: number, userId: string, removedBy?: string): Promise<void> {
    const [membership] = await db.select()
      .from(userOrganizations)
      .where(and(
        eq(userOrganizations.organizationId, organizationId),
        eq(userOrganizations.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      throw new Error('User is not a member of this organization');
    }

    if (membership.role === 'owner') {
      throw new Error('Cannot remove owner from organization');
    }

    await db.delete(userOrganizations)
      .where(and(
        eq(userOrganizations.organizationId, organizationId),
        eq(userOrganizations.userId, userId)
      ));

    await this.logAuditEvent(db, {
      organizationId,
      userId: removedBy,
      action: 'member.removed',
      resource: 'member',
      resourceId: userId,
      previousValue: { role: membership.role },
    });
  }

  async updateMemberRole(
    organizationId: number,
    userId: string,
    newRole: 'admin' | 'member',
    updatedBy?: string
  ): Promise<void> {
    const [membership] = await db.select()
      .from(userOrganizations)
      .where(and(
        eq(userOrganizations.organizationId, organizationId),
        eq(userOrganizations.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      throw new Error('User is not a member of this organization');
    }

    if (membership.role === 'owner') {
      throw new Error('Cannot change owner role');
    }

    await db.update(userOrganizations)
      .set({ role: newRole })
      .where(and(
        eq(userOrganizations.organizationId, organizationId),
        eq(userOrganizations.userId, userId)
      ));

    await this.logAuditEvent(db, {
      organizationId,
      userId: updatedBy,
      action: 'member.role_changed',
      resource: 'member',
      resourceId: userId,
      previousValue: { role: membership.role },
      newValue: { role: newRole },
    });
  }

  async getOrganizationMembers(organizationId: number): Promise<any[]> {
    const memberships = await db.select({
      membership: userOrganizations,
      user: users,
    })
      .from(userOrganizations)
      .innerJoin(users, eq(users.id, userOrganizations.userId))
      .where(eq(userOrganizations.organizationId, organizationId));

    return memberships.map(({ membership, user }) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: membership.role,
      permissions: membership.permissions,
      joinedAt: membership.joinedAt,
    }));
  }

  async getAuditLog(organizationId: number, limit = 50): Promise<any[]> {
    return db.select()
      .from(organizationAuditLog)
      .where(eq(organizationAuditLog.organizationId, organizationId))
      .orderBy(desc(organizationAuditLog.createdAt))
      .limit(limit);
  }

  private async logAuditEvent(txOrDb: any, event: {
    organizationId: number;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    previousValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await txOrDb.insert(organizationAuditLog).values({
      organizationId: event.organizationId,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      previousValue: event.previousValue,
      newValue: event.newValue,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    });
  }

  private getMaxMembersForPlan(plan: string): number {
    switch (plan) {
      case 'free': return 2;
      case 'starter': return 5;
      case 'professional': return 20;
      case 'enterprise': return 1000;
      default: return 2;
    }
  }

  private getPlanDisplayName(plan: string): string {
    switch (plan) {
      case 'free': return 'Free';
      case 'starter': return 'Starter';
      case 'professional': return 'Professional';
      case 'enterprise': return 'Enterprise';
      default: return 'Free';
    }
  }

  private getPlanPrice(plan: string): number {
    switch (plan) {
      case 'free': return 0;
      case 'starter': return 4900;
      case 'professional': return 19900;
      case 'enterprise': return 0;
      default: return 0;
    }
  }

  private getPlanLimits(plan: string): any {
    switch (plan) {
      case 'free':
        return { agents: 10, providers: 3, tools: 50, tokensPerMonth: 100000, requestsPerMinute: 60 };
      case 'starter':
        return { agents: 50, providers: 10, tools: 200, tokensPerMonth: 1000000, requestsPerMinute: 300 };
      case 'professional':
        return { agents: 150, providers: 20, tools: 400, tokensPerMonth: 10000000, requestsPerMinute: 1000 };
      case 'enterprise':
        return { agents: 275, providers: 23, tools: 530, tokensPerMonth: -1, requestsPerMinute: -1 };
      default:
        return { agents: 10, providers: 3, tools: 50, tokensPerMonth: 100000, requestsPerMinute: 60 };
    }
  }

  private getDefaultAgentsForPlan(plan: string): string[] {
    const freeAgents = [
      'code-review-agent', 'documentation-agent', 'test-writer-agent',
      'bug-fixer-agent', 'code-optimizer-agent', 'api-designer-agent',
      'database-architect-agent', 'frontend-specialist-agent',
      'backend-developer-agent', 'fullstack-developer-agent'
    ];

    switch (plan) {
      case 'free': return freeAgents;
      case 'starter': return [...freeAgents]; // Will be expanded from registry
      case 'professional': return []; // All agents enabled
      case 'enterprise': return []; // All agents enabled
      default: return freeAgents;
    }
  }

  private getDefaultProvidersForPlan(plan: string): string[] {
    switch (plan) {
      case 'free': return ['openai', 'anthropic', 'google'];
      case 'starter': return ['openai', 'anthropic', 'google', 'groq', 'mistral', 'cohere', 'perplexity', 'deepseek', 'together', 'fireworks'];
      case 'professional': return []; // All providers
      case 'enterprise': return []; // All providers
      default: return ['openai', 'anthropic', 'google'];
    }
  }

  private getDefaultFeaturesForPlan(plan: string): any {
    switch (plan) {
      case 'free':
        return { multimodal: false, voice: false, analytics: true, costTracking: true, webhooks: false, streaming: true };
      case 'starter':
        return { multimodal: true, voice: false, analytics: true, costTracking: true, webhooks: true, streaming: true };
      case 'professional':
        return { multimodal: true, voice: true, analytics: true, costTracking: true, webhooks: true, streaming: true };
      case 'enterprise':
        return { multimodal: true, voice: true, analytics: true, costTracking: true, webhooks: true, streaming: true };
      default:
        return { multimodal: false, voice: false, analytics: true, costTracking: true, webhooks: false, streaming: true };
    }
  }
}

export const organizationService = OrganizationService.getInstance();
