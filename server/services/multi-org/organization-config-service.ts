import { db } from '../../db';
import { eq } from 'drizzle-orm';
import {
  organizationConfigs,
  subscriptions,
  organizationAuditLog,
  type OrganizationConfig,
} from '@shared/schema';

export interface UpdateConfigInput {
  enabledAgents?: string[];
  agentPreferences?: Record<string, any>;
  defaultAgentTier?: string;
  enabledProviders?: string[];
  providerPreferences?: Record<string, any>;
  defaultProvider?: string;
  costOptimizationEnabled?: boolean;
  maxTokensPerRequest?: number;
  enabledTools?: string[];
  toolPermissions?: Record<string, any>;
  features?: Record<string, boolean>;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEvents?: string[];
}

class OrganizationConfigService {
  private static instance: OrganizationConfigService;

  private constructor() {}

  public static getInstance(): OrganizationConfigService {
    if (!OrganizationConfigService.instance) {
      OrganizationConfigService.instance = new OrganizationConfigService();
    }
    return OrganizationConfigService.instance;
  }

  async getConfig(organizationId: number): Promise<OrganizationConfig | null> {
    const [config] = await db.select()
      .from(organizationConfigs)
      .where(eq(organizationConfigs.organizationId, organizationId))
      .limit(1);

    return config || null;
  }

  async updateConfig(
    organizationId: number,
    updates: UpdateConfigInput,
    updatedBy?: string
  ): Promise<OrganizationConfig> {
    const existing = await this.getConfig(organizationId);
    
    if (!existing) {
      const [created] = await db.insert(organizationConfigs).values({
        organizationId,
        ...updates,
      }).returning();
      return created;
    }

    const [updated] = await db.update(organizationConfigs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(organizationConfigs.organizationId, organizationId))
      .returning();

    if (updatedBy) {
      await db.insert(organizationAuditLog).values({
        organizationId,
        userId: updatedBy,
        action: 'config.updated',
        resource: 'config',
        resourceId: String(existing.id),
        previousValue: this.getChangedFields(existing, updates),
        newValue: updates,
      });
    }

    return updated;
  }

  async isAgentEnabled(organizationId: number, agentId: string): Promise<boolean> {
    const config = await this.getConfig(organizationId);
    if (!config) return false;

    const enabledAgents = config.enabledAgents as string[];
    
    if (enabledAgents.length === 0) {
      const [sub] = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.organizationId, organizationId))
        .limit(1);
      
      if (sub && (sub.planId === 'professional' || sub.planId === 'enterprise')) {
        return true;
      }
    }

    return enabledAgents.includes(agentId);
  }

  async isProviderEnabled(organizationId: number, providerId: string): Promise<boolean> {
    const config = await this.getConfig(organizationId);
    if (!config) return false;

    const enabledProviders = config.enabledProviders as string[];
    
    if (enabledProviders.length === 0) {
      const [sub] = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.organizationId, organizationId))
        .limit(1);
      
      if (sub && (sub.planId === 'professional' || sub.planId === 'enterprise')) {
        return true;
      }
    }

    return enabledProviders.includes(providerId);
  }

  async isToolEnabled(organizationId: number, toolId: string): Promise<boolean> {
    const config = await this.getConfig(organizationId);
    if (!config) return false;

    const enabledTools = config.enabledTools as string[];
    
    if (enabledTools.length === 0) {
      const [sub] = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.organizationId, organizationId))
        .limit(1);
      
      if (sub && (sub.planId === 'professional' || sub.planId === 'enterprise')) {
        return true;
      }
    }

    return enabledTools.includes(toolId);
  }

  async isFeatureEnabled(organizationId: number, feature: string): Promise<boolean> {
    const config = await this.getConfig(organizationId);
    if (!config) return false;

    const features = config.features as Record<string, boolean>;
    return features?.[feature] === true;
  }

  async getEnabledAgents(organizationId: number): Promise<string[]> {
    const config = await this.getConfig(organizationId);
    if (!config) return [];

    return config.enabledAgents as string[];
  }

  async getEnabledProviders(organizationId: number): Promise<string[]> {
    const config = await this.getConfig(organizationId);
    if (!config) return [];

    return config.enabledProviders as string[];
  }

  async getWebhookConfig(organizationId: number): Promise<{
    url: string | null;
    secret: string | null;
    events: string[];
  }> {
    const config = await this.getConfig(organizationId);
    if (!config) return { url: null, secret: null, events: [] };

    return {
      url: config.webhookUrl,
      secret: config.webhookSecret,
      events: config.webhookEvents as string[] || [],
    };
  }

  async setWebhookConfig(
    organizationId: number,
    webhookUrl: string,
    webhookSecret: string,
    webhookEvents: string[],
    updatedBy?: string
  ): Promise<void> {
    await this.updateConfig(organizationId, {
      webhookUrl,
      webhookSecret,
      webhookEvents,
    }, updatedBy);
  }

  private getChangedFields(existing: OrganizationConfig, updates: UpdateConfigInput): Record<string, any> {
    const changed: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if ((existing as any)[key] !== value) {
        changed[key] = (existing as any)[key];
      }
    }
    return changed;
  }
}

export const organizationConfigService = OrganizationConfigService.getInstance();
