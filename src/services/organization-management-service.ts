import { db } from '../db';
import {
  organizations,
  orgAgentAllocations,
  orgFeatureToggles,
  orgSettings,
  orgTestSessions,
  waiApiClients,
  waiApiKeys,
  users,
  type Organization,
  type OrgAgentAllocation,
  type OrgFeatureToggle,
  type OrgSettings,
  type OrgTestSession,
  type WaiApiClient,
  type WaiApiKey,
} from '@shared/schema';
import { eq, desc, and, sql, count, inArray } from 'drizzle-orm';
import { agentRegistry } from './agent-registry-service';
import crypto from 'crypto';

interface CreateOrganizationInput {
  name: string;
  description?: string;
  plan?: string;
  ownerId?: string;
  logo?: string;
}

interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  plan?: string;
  logo?: string;
  isActive?: boolean;
}

interface AllocateAgentsInput {
  organizationId: number;
  agentIds: string[];
  userId: string;
}

interface CreateApiKeyInput {
  organizationId: number;
  clientName: string;
  clientDescription?: string;
  environment?: string;
  userId: string;
}

class OrganizationManagementService {
  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const [org] = await db.insert(organizations).values({
      name: input.name,
      description: input.description,
      plan: input.plan || 'alpha',
      ownerId: input.ownerId ? parseInt(input.ownerId) : null,
      logo: input.logo,
      isActive: true,
    }).returning();

    await this.initializeOrgDefaults(org.id);
    return org;
  }

  private async initializeOrgDefaults(orgId: number): Promise<void> {
    await db.insert(orgFeatureToggles).values({ organizationId: orgId }).onConflictDoNothing();
    await db.insert(orgSettings).values({ organizationId: orgId }).onConflictDoNothing();
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: number): Promise<Organization | null> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return org || null;
  }

  async updateOrganization(id: number, input: UpdateOrganizationInput): Promise<Organization> {
    const [updated] = await db.update(organizations)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async deleteOrganization(id: number): Promise<void> {
    await db.update(organizations).set({ isActive: false }).where(eq(organizations.id, id));
  }

  async getOrganizationStats(orgId: number): Promise<{
    allocatedAgents: number;
    activeApiKeys: number;
    totalTests: number;
    passedTests: number;
  }> {
    const [agentCount] = await db.select({ count: count() })
      .from(orgAgentAllocations)
      .where(and(eq(orgAgentAllocations.organizationId, orgId), eq(orgAgentAllocations.status, 'active')));

    const [apiKeyCount] = await db.select({ count: count() })
      .from(waiApiKeys)
      .innerJoin(waiApiClients, eq(waiApiKeys.clientId, waiApiClients.id))
      .where(and(eq(waiApiClients.organizationId, orgId), eq(waiApiKeys.status, 'active')));

    const [testStats] = await db.select({
      total: count(),
      passed: sql<number>`SUM(CASE WHEN ${orgTestSessions.status} = 'completed' AND ${orgTestSessions.approved} = true THEN 1 ELSE 0 END)`,
    }).from(orgTestSessions).where(eq(orgTestSessions.organizationId, orgId));

    return {
      allocatedAgents: agentCount?.count || 0,
      activeApiKeys: apiKeyCount?.count || 0,
      totalTests: testStats?.total || 0,
      passedTests: Number(testStats?.passed) || 0,
    };
  }

  async allocateAgents(input: AllocateAgentsInput): Promise<OrgAgentAllocation[]> {
    const allocations: OrgAgentAllocation[] = [];
    for (const agentId of input.agentIds) {
      const [allocation] = await db.insert(orgAgentAllocations).values({
        organizationId: input.organizationId,
        agentId,
        status: 'active',
        testStatus: 'pending',
      }).onConflictDoUpdate({
        target: [orgAgentAllocations.organizationId, orgAgentAllocations.agentId],
        set: { status: 'active', updatedAt: new Date() },
      }).returning();
      allocations.push(allocation);
    }
    return allocations;
  }

  async deallocateAgents(orgId: number, agentIds: string[]): Promise<void> {
    await db.update(orgAgentAllocations)
      .set({ status: 'suspended', updatedAt: new Date() })
      .where(and(
        eq(orgAgentAllocations.organizationId, orgId),
        inArray(orgAgentAllocations.agentId, agentIds)
      ));
  }

  async getOrganizationAgents(orgId: number): Promise<any[]> {
    const allocations = await db.select()
      .from(orgAgentAllocations)
      .where(eq(orgAgentAllocations.organizationId, orgId));

    const allAgents = await agentRegistry.getAllAgents();
    const allocatedIds = new Set(allocations.map(a => a.agentId));

    return allAgents.map(agent => ({
      ...agent,
      allocated: allocatedIds.has(agent.id),
      allocation: allocations.find(a => a.agentId === agent.id) || null,
    }));
  }

  async getAllocatedAgents(orgId: number): Promise<any[]> {
    const allocations = await db.select()
      .from(orgAgentAllocations)
      .where(and(eq(orgAgentAllocations.organizationId, orgId), eq(orgAgentAllocations.status, 'active')));

    const allAgents = await agentRegistry.getAllAgents();
    const agentMap = new Map(allAgents.map(a => [a.id, a]));

    return allocations.map(allocation => ({
      ...agentMap.get(allocation.agentId),
      allocation,
    })).filter(a => a.id);
  }

  async getFeatureToggles(orgId: number): Promise<OrgFeatureToggle | null> {
    const [toggles] = await db.select()
      .from(orgFeatureToggles)
      .where(eq(orgFeatureToggles.organizationId, orgId))
      .limit(1);
    return toggles || null;
  }

  async updateFeatureToggles(orgId: number, toggles: Partial<OrgFeatureToggle>): Promise<OrgFeatureToggle> {
    const existing = await this.getFeatureToggles(orgId);
    if (existing) {
      const [updated] = await db.update(orgFeatureToggles)
        .set({ ...toggles, updatedAt: new Date() })
        .where(eq(orgFeatureToggles.organizationId, orgId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(orgFeatureToggles)
        .values({ organizationId: orgId, ...toggles })
        .returning();
      return created;
    }
  }

  async getOrgSettings(orgId: number): Promise<OrgSettings | null> {
    const [settings] = await db.select()
      .from(orgSettings)
      .where(eq(orgSettings.organizationId, orgId))
      .limit(1);
    return settings || null;
  }

  async updateOrgSettings(orgId: number, settings: Partial<OrgSettings>): Promise<OrgSettings> {
    const existing = await this.getOrgSettings(orgId);
    if (existing) {
      const [updated] = await db.update(orgSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(orgSettings.organizationId, orgId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(orgSettings)
        .values({ organizationId: orgId, ...settings })
        .returning();
      return created;
    }
  }

  async createApiClient(input: CreateApiKeyInput): Promise<{ client: WaiApiClient; apiKey: string }> {
    const [client] = await db.insert(waiApiClients).values({
      clientName: input.clientName,
      clientDescription: input.clientDescription,
      organizationId: input.organizationId,
      ownerId: input.userId,
      environment: input.environment || 'production',
      status: 'active',
    }).returning();

    const rawApiKey = `wai_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawApiKey.substring(0, 12);
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    await db.insert(waiApiKeys).values({
      keyPrefix,
      keyHash,
      keyName: `${input.clientName} API Key`,
      clientId: client.id,
      status: 'active',
      createdBy: input.userId,
    });

    return { client, apiKey: rawApiKey };
  }

  async getApiClients(orgId: number): Promise<WaiApiClient[]> {
    return db.select()
      .from(waiApiClients)
      .where(eq(waiApiClients.organizationId, orgId))
      .orderBy(desc(waiApiClients.createdAt));
  }

  async revokeApiClient(orgId: number, clientId: number): Promise<void> {
    await db.update(waiApiClients)
      .set({ status: 'revoked' })
      .where(and(eq(waiApiClients.id, clientId), eq(waiApiClients.organizationId, orgId)));
    await db.update(waiApiKeys)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(eq(waiApiKeys.clientId, clientId));
  }

  async revokeApiKey(keyId: number): Promise<void> {
    await db.update(waiApiKeys)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(eq(waiApiKeys.id, keyId));
  }

  async createTestSession(input: {
    organizationId: number;
    testType: string;
    targetId: string;
    targetName: string;
    testConfig?: any;
    userId: string;
  }): Promise<OrgTestSession> {
    const [session] = await db.insert(orgTestSessions).values({
      organizationId: input.organizationId,
      testType: input.testType,
      targetId: input.targetId,
      targetName: input.targetName,
      testConfig: input.testConfig || {},
      status: 'pending',
      createdBy: input.userId,
    }).returning();
    return session;
  }

  async getTestSessions(orgId: number): Promise<OrgTestSession[]> {
    return db.select()
      .from(orgTestSessions)
      .where(eq(orgTestSessions.organizationId, orgId))
      .orderBy(desc(orgTestSessions.createdAt));
  }

  async updateTestSession(sessionId: string, update: Partial<OrgTestSession>): Promise<OrgTestSession> {
    const [updated] = await db.update(orgTestSessions)
      .set(update)
      .where(eq(orgTestSessions.sessionId, sessionId))
      .returning();
    return updated;
  }

  async getAgentCatalog(): Promise<any[]> {
    const agents = await agentRegistry.getAllAgents();
    return agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      tier: agent.tier,
      romaLevel: agent.romaLevel,
      category: agent.category,
      capabilities: agent.capabilities || [],
      status: agent.status,
    }));
  }

  async getLlmProviders(): Promise<any[]> {
    return [
      { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1'], status: 'healthy' },
      { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet'], status: 'healthy' },
      { id: 'google', name: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro'], status: 'healthy' },
      { id: 'xai', name: 'xAI', models: ['grok-3', 'grok-2'], status: 'healthy' },
      { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-r1'], status: 'healthy' },
      { id: 'groq', name: 'Groq', models: ['llama-3.3-70b', 'mixtral-8x7b'], status: 'healthy' },
      { id: 'mistral', name: 'Mistral', models: ['mistral-large', 'mistral-medium'], status: 'degraded' },
      { id: 'together', name: 'Together AI', models: ['meta-llama/Llama-3.3-70B'], status: 'healthy' },
      { id: 'perplexity', name: 'Perplexity', models: ['sonar-pro', 'sonar'], status: 'healthy' },
      { id: 'cohere', name: 'Cohere', models: ['command-r-plus', 'command-r'], status: 'degraded' },
      { id: 'replicate', name: 'Replicate', models: ['sdxl', 'llama-3.1'], status: 'healthy' },
      { id: 'elevenlabs', name: 'ElevenLabs', models: ['eleven_turbo_v2'], status: 'healthy' },
      { id: 'sarvam', name: 'Sarvam AI', models: ['sarvam-2b'], status: 'healthy', languages: 22 },
      { id: 'kimi', name: 'KIMI K2', models: ['kimi-k2'], status: 'healthy' },
      { id: 'openrouter', name: 'OpenRouter', models: ['auto', '200+ models'], status: 'healthy' },
    ];
  }

  async getPlatformCapabilities(): Promise<any> {
    const agents = await agentRegistry.getAllAgents();
    return {
      totalAgents: agents.length,
      agentsByTier: {
        executive: agents.filter(a => a.tier === 'executive').length,
        development: agents.filter(a => a.tier === 'development').length,
        creative: agents.filter(a => a.tier === 'creative').length,
        qa: agents.filter(a => a.tier === 'qa').length,
        devops: agents.filter(a => a.tier === 'devops').length,
        domain: agents.filter(a => a.tier === 'domain').length,
      },
      agentsByRoma: {
        L2: agents.filter(a => a.romaLevel === 'L2').length,
        L3: agents.filter(a => a.romaLevel === 'L3').length,
        L4: agents.filter(a => a.romaLevel === 'L4').length,
      },
      llmProviders: 17,
      languages: 23,
      mcpTools: 530,
      features: {
        intelligentRouting: true,
        costOptimization: true,
        autoFallback: true,
        documentParsing: true,
        dataAnalytics: true,
        voiceAi: true,
        multilingual: true,
        memoryManagement: true,
        codeGeneration: true,
        contentCreation: true,
        ragPipeline: true,
        digitalTwin: true,
        agentBreeding: true,
        collectiveIntelligence: true,
      },
    };
  }
}

export const organizationManagementService = new OrganizationManagementService();
