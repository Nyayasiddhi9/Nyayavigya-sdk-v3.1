import { db } from '../../db';
import { eq, and, gte } from 'drizzle-orm';
import { subscriptions, organizationUsage } from '@shared/schema';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfter?: number;
}

interface TokenLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  resetAt: Date;
}

class RateLimiter {
  private static instance: RateLimiter;
  private requestCounts: Map<string, { count: number; windowStart: number }> = new Map();
  private readonly windowSizeMs = 60000;

  private constructor() {
    setInterval(() => this.cleanupOldWindows(), this.windowSizeMs);
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  async checkRateLimit(
    organizationId: number,
    apiKeyId: number,
    customLimit?: number
  ): Promise<RateLimitResult> {
    const key = `org:${organizationId}:key:${apiKeyId}`;
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowSizeMs) * this.windowSizeMs;
    const windowEnd = windowStart + this.windowSizeMs;

    let entry = this.requestCounts.get(key);
    if (!entry || entry.windowStart !== windowStart) {
      entry = { count: 0, windowStart };
      this.requestCounts.set(key, entry);
    }

    const limit = customLimit || await this.getOrganizationRateLimit(organizationId);

    if (entry.count >= limit) {
      const retryAfter = Math.ceil((windowEnd - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        limit,
        resetAt: new Date(windowEnd),
        retryAfter,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: limit - entry.count,
      limit,
      resetAt: new Date(windowEnd),
    };
  }

  async checkTokenLimit(
    organizationId: number,
    tokensRequested: number
  ): Promise<TokenLimitResult> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [usage] = await db.select()
      .from(organizationUsage)
      .where(and(
        eq(organizationUsage.organizationId, organizationId),
        gte(organizationUsage.date, today)
      ))
      .limit(1);

    const usedTokens = usage?.totalTokens || 0;
    const limit = await this.getOrganizationTokenLimit(organizationId);

    if (limit === -1) {
      return {
        allowed: true,
        remaining: -1,
        limit: -1,
        used: usedTokens,
        resetAt: this.getEndOfDay(),
      };
    }

    const wouldExceed = usedTokens + tokensRequested > limit;
    return {
      allowed: !wouldExceed,
      remaining: Math.max(0, limit - usedTokens),
      limit,
      used: usedTokens,
      resetAt: this.getEndOfDay(),
    };
  }

  async recordTokenUsage(
    organizationId: number,
    inputTokens: number,
    outputTokens: number,
    cost: number,
    provider?: string,
    agentId?: string
  ): Promise<void> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [existing] = await db.select()
      .from(organizationUsage)
      .where(and(
        eq(organizationUsage.organizationId, organizationId),
        eq(organizationUsage.date, today)
      ))
      .limit(1);

    if (existing) {
      const usageByProvider = (existing.usageByProvider || {}) as Record<string, any>;
      const usageByAgent = (existing.usageByAgent || {}) as Record<string, any>;

      if (provider) {
        usageByProvider[provider] = usageByProvider[provider] || { tokens: 0, cost: 0 };
        usageByProvider[provider].tokens += inputTokens + outputTokens;
        usageByProvider[provider].cost += cost;
      }

      if (agentId) {
        usageByAgent[agentId] = usageByAgent[agentId] || { executions: 0, tokens: 0 };
        usageByAgent[agentId].executions += 1;
        usageByAgent[agentId].tokens += inputTokens + outputTokens;
      }

      await db.update(organizationUsage)
        .set({
          inputTokens: (existing.inputTokens || 0) + inputTokens,
          outputTokens: (existing.outputTokens || 0) + outputTokens,
          totalTokens: (existing.totalTokens || 0) + inputTokens + outputTokens,
          totalRequests: (existing.totalRequests || 0) + 1,
          successfulRequests: (existing.successfulRequests || 0) + 1,
          totalCost: (existing.totalCost || 0) + Math.round(cost * 100),
          usageByProvider,
          usageByAgent,
          updatedAt: new Date(),
        })
        .where(eq(organizationUsage.id, existing.id));
    } else {
      const usageByProvider: Record<string, any> = {};
      const usageByAgent: Record<string, any> = {};

      if (provider) {
        usageByProvider[provider] = { tokens: inputTokens + outputTokens, cost };
      }

      if (agentId) {
        usageByAgent[agentId] = { executions: 1, tokens: inputTokens + outputTokens };
      }

      await db.insert(organizationUsage).values({
        organizationId,
        date: today,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        totalRequests: 1,
        successfulRequests: 1,
        totalCost: Math.round(cost * 100),
        usageByProvider,
        usageByAgent,
      });
    }
  }

  async recordFailedRequest(organizationId: number): Promise<void> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [existing] = await db.select()
      .from(organizationUsage)
      .where(and(
        eq(organizationUsage.organizationId, organizationId),
        eq(organizationUsage.date, today)
      ))
      .limit(1);

    if (existing) {
      await db.update(organizationUsage)
        .set({
          totalRequests: (existing.totalRequests || 0) + 1,
          failedRequests: (existing.failedRequests || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(organizationUsage.id, existing.id));
    } else {
      await db.insert(organizationUsage).values({
        organizationId,
        date: today,
        totalRequests: 1,
        failedRequests: 1,
      });
    }
  }

  private async getOrganizationRateLimit(organizationId: number): Promise<number> {
    const [sub] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
      .limit(1);

    if (!sub) return 60;

    const limits = sub.limits as any;
    return limits?.requestsPerMinute || 60;
  }

  private async getOrganizationTokenLimit(organizationId: number): Promise<number> {
    const [sub] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
      .limit(1);

    if (!sub) return 100000;

    const limits = sub.limits as any;
    const monthlyLimit = limits?.tokensPerMonth || 100000;
    return monthlyLimit === -1 ? -1 : Math.floor(monthlyLimit / 30);
  }

  private getEndOfDay(): Date {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }

  private cleanupOldWindows(): void {
    const now = Date.now();
    const cutoff = now - this.windowSizeMs * 2;

    const entries = Array.from(this.requestCounts.entries());
    for (const [key, entry] of entries) {
      if (entry.windowStart < cutoff) {
        this.requestCounts.delete(key);
      }
    }
  }
}

export const rateLimiter = RateLimiter.getInstance();
