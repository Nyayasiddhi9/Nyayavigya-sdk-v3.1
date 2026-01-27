import { db } from '../../db';
import { eq, and, desc } from 'drizzle-orm';
import {
  organizationApiKeys,
  organizationAuditLog,
  type InsertOrganizationApiKey,
  type OrganizationApiKey,
} from '@shared/schema';
import crypto from 'crypto';

export interface CreateApiKeyInput {
  organizationId: number;
  name: string;
  description?: string;
  scopes?: string[];
  rateLimit?: number;
  tokenLimit?: number;
  expiresAt?: Date;
  createdBy?: string;
}

export interface ApiKeyResponse {
  id: number;
  organizationId: number;
  keyPrefix: string;
  name: string;
  description: string | null;
  scopes: string[];
  rateLimit: number;
  tokenLimit: number | null;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  usageCount: number | null;
  isActive: boolean | null;
  createdAt: Date | null;
}

export interface CreateApiKeyResponse extends ApiKeyResponse {
  apiKey: string;
}

class ApiKeyService {
  private static instance: ApiKeyService;
  private readonly keyPrefix = 'wai_';

  private constructor() {}

  public static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService();
    }
    return ApiKeyService.instance;
  }

  async createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResponse> {
    const {
      organizationId,
      name,
      description,
      scopes = ['agents:read', 'agents:execute'],
      rateLimit = 60,
      tokenLimit,
      expiresAt,
      createdBy,
    } = input;

    const rawKey = this.generateApiKey();
    const keyHash = this.hashKey(rawKey);
    const keyPrefixPart = rawKey.substring(0, 12);

    const [apiKey] = await db.insert(organizationApiKeys).values({
      organizationId,
      keyHash,
      keyPrefix: keyPrefixPart,
      name,
      description,
      scopes,
      rateLimit,
      tokenLimit,
      expiresAt,
      createdBy,
      isActive: true,
      usageCount: 0,
    }).returning();

    await this.logAuditEvent({
      organizationId,
      userId: createdBy,
      action: 'api_key.created',
      resource: 'api_key',
      resourceId: String(apiKey.id),
      newValue: { name, scopes, rateLimit },
    });

    return {
      id: apiKey.id,
      organizationId: apiKey.organizationId,
      keyPrefix: keyPrefixPart,
      name: apiKey.name,
      description: apiKey.description,
      scopes: apiKey.scopes as string[],
      rateLimit: apiKey.rateLimit,
      tokenLimit: apiKey.tokenLimit,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: apiKey.usageCount,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
      apiKey: rawKey,
    };
  }

  async validateApiKey(rawKey: string): Promise<{
    valid: boolean;
    organizationId?: number;
    apiKeyId?: number;
    scopes?: string[];
    rateLimit?: number;
    error?: string;
  }> {
    if (!rawKey || !rawKey.startsWith(this.keyPrefix)) {
      return { valid: false, error: 'Invalid API key format' };
    }

    const keyHash = this.hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12);

    const [apiKey] = await db.select()
      .from(organizationApiKeys)
      .where(and(
        eq(organizationApiKeys.keyHash, keyHash),
        eq(organizationApiKeys.keyPrefix, keyPrefix)
      ))
      .limit(1);

    if (!apiKey) {
      return { valid: false, error: 'API key not found' };
    }

    if (!apiKey.isActive) {
      return { valid: false, error: 'API key is inactive' };
    }

    if (apiKey.revokedAt) {
      return { valid: false, error: 'API key has been revoked' };
    }

    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    await db.update(organizationApiKeys)
      .set({
        lastUsedAt: new Date(),
        usageCount: (apiKey.usageCount || 0) + 1,
      })
      .where(eq(organizationApiKeys.id, apiKey.id));

    return {
      valid: true,
      organizationId: apiKey.organizationId,
      apiKeyId: apiKey.id,
      scopes: apiKey.scopes as string[],
      rateLimit: apiKey.rateLimit,
    };
  }

  async getOrganizationApiKeys(organizationId: number): Promise<ApiKeyResponse[]> {
    const keys = await db.select()
      .from(organizationApiKeys)
      .where(eq(organizationApiKeys.organizationId, organizationId))
      .orderBy(desc(organizationApiKeys.createdAt));

    return keys.map(key => ({
      id: key.id,
      organizationId: key.organizationId,
      keyPrefix: key.keyPrefix,
      name: key.name,
      description: key.description,
      scopes: key.scopes as string[],
      rateLimit: key.rateLimit,
      tokenLimit: key.tokenLimit,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      isActive: key.isActive,
      createdAt: key.createdAt,
    }));
  }

  async revokeApiKey(apiKeyId: number, revokedBy?: string): Promise<void> {
    const [apiKey] = await db.select()
      .from(organizationApiKeys)
      .where(eq(organizationApiKeys.id, apiKeyId))
      .limit(1);

    if (!apiKey) {
      throw new Error('API key not found');
    }

    await db.update(organizationApiKeys)
      .set({
        isActive: false,
        revokedAt: new Date(),
      })
      .where(eq(organizationApiKeys.id, apiKeyId));

    await this.logAuditEvent({
      organizationId: apiKey.organizationId,
      userId: revokedBy,
      action: 'api_key.revoked',
      resource: 'api_key',
      resourceId: String(apiKeyId),
      previousValue: { name: apiKey.name, isActive: true },
      newValue: { isActive: false },
    });
  }

  async updateApiKey(
    apiKeyId: number,
    updates: Partial<{
      name: string;
      description: string;
      scopes: string[];
      rateLimit: number;
      tokenLimit: number;
    }>,
    updatedBy?: string
  ): Promise<ApiKeyResponse | null> {
    const [existing] = await db.select()
      .from(organizationApiKeys)
      .where(eq(organizationApiKeys.id, apiKeyId))
      .limit(1);

    if (!existing) return null;

    const [updated] = await db.update(organizationApiKeys)
      .set(updates)
      .where(eq(organizationApiKeys.id, apiKeyId))
      .returning();

    await this.logAuditEvent({
      organizationId: existing.organizationId,
      userId: updatedBy,
      action: 'api_key.updated',
      resource: 'api_key',
      resourceId: String(apiKeyId),
      previousValue: { name: existing.name, scopes: existing.scopes, rateLimit: existing.rateLimit },
      newValue: updates,
    });

    return {
      id: updated.id,
      organizationId: updated.organizationId,
      keyPrefix: updated.keyPrefix,
      name: updated.name,
      description: updated.description,
      scopes: updated.scopes as string[],
      rateLimit: updated.rateLimit,
      tokenLimit: updated.tokenLimit,
      expiresAt: updated.expiresAt,
      lastUsedAt: updated.lastUsedAt,
      usageCount: updated.usageCount,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
    };
  }

  async recordUsage(apiKeyId: number, ip?: string): Promise<void> {
    const [existing] = await db.select()
      .from(organizationApiKeys)
      .where(eq(organizationApiKeys.id, apiKeyId))
      .limit(1);

    if (existing) {
      await db.update(organizationApiKeys)
        .set({
          lastUsedAt: new Date(),
          lastUsedIp: ip,
          usageCount: (existing.usageCount || 0) + 1,
        })
        .where(eq(organizationApiKeys.id, apiKeyId));
    }
  }

  private generateApiKey(): string {
    const envSuffix = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const randomPart = crypto.randomBytes(32).toString('base64url');
    return `${this.keyPrefix}${envSuffix}_${randomPart}`;
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private async logAuditEvent(event: {
    organizationId: number;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    previousValue?: any;
    newValue?: any;
  }): Promise<void> {
    await db.insert(organizationAuditLog).values({
      organizationId: event.organizationId,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      previousValue: event.previousValue,
      newValue: event.newValue,
    });
  }
}

export const apiKeyService = ApiKeyService.getInstance();
