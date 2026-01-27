import { db } from '../../db';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { organizationUsage, subscriptions } from '@shared/schema';

export interface UsageSummary {
  today: DailyUsage;
  thisMonth: MonthlyUsage;
  limits: UsageLimits;
  percentages: UsagePercentages;
}

export interface DailyUsage {
  date: Date;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
}

export interface MonthlyUsage {
  month: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalRequests: number;
  totalCost: number;
  dailyAverage: number;
}

export interface UsageLimits {
  tokensPerMonth: number;
  requestsPerMinute: number;
  agents: number;
  providers: number;
  tools: number;
}

export interface UsagePercentages {
  tokensUsed: number;
  estimatedMonthlyTokens: number;
  isOverLimit: boolean;
  daysRemaining: number;
}

class UsageTrackingService {
  private static instance: UsageTrackingService;

  private constructor() {}

  public static getInstance(): UsageTrackingService {
    if (!UsageTrackingService.instance) {
      UsageTrackingService.instance = new UsageTrackingService();
    }
    return UsageTrackingService.instance;
  }

  async getUsageSummary(organizationId: number): Promise<UsageSummary> {
    const today = await this.getTodayUsage(organizationId);
    const thisMonth = await this.getMonthlyUsage(organizationId);
    const limits = await this.getUsageLimits(organizationId);
    const percentages = this.calculatePercentages(thisMonth, limits);

    return {
      today,
      thisMonth,
      limits,
      percentages,
    };
  }

  async getTodayUsage(organizationId: number): Promise<DailyUsage> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [usage] = await db.select()
      .from(organizationUsage)
      .where(and(
        eq(organizationUsage.organizationId, organizationId),
        gte(organizationUsage.date, today)
      ))
      .limit(1);

    return {
      date: today,
      totalTokens: usage?.totalTokens || 0,
      inputTokens: usage?.inputTokens || 0,
      outputTokens: usage?.outputTokens || 0,
      totalRequests: usage?.totalRequests || 0,
      successfulRequests: usage?.successfulRequests || 0,
      failedRequests: usage?.failedRequests || 0,
      totalCost: (usage?.totalCost || 0) / 100,
    };
  }

  async getMonthlyUsage(organizationId: number): Promise<MonthlyUsage> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const usageRecords = await db.select()
      .from(organizationUsage)
      .where(and(
        eq(organizationUsage.organizationId, organizationId),
        gte(organizationUsage.date, startOfMonth)
      ));

    const totals = usageRecords.reduce((acc, record) => {
      acc.totalTokens += record.totalTokens || 0;
      acc.inputTokens += record.inputTokens || 0;
      acc.outputTokens += record.outputTokens || 0;
      acc.totalRequests += record.totalRequests || 0;
      acc.totalCost += record.totalCost || 0;
      return acc;
    }, {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalRequests: 0,
      totalCost: 0,
    });

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();

    return {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      ...totals,
      totalCost: totals.totalCost / 100,
      dailyAverage: dayOfMonth > 0 ? Math.round(totals.totalTokens / dayOfMonth) : 0,
    };
  }

  async getUsageLimits(organizationId: number): Promise<UsageLimits> {
    const [sub] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
      .limit(1);

    if (!sub) {
      return {
        tokensPerMonth: 100000,
        requestsPerMinute: 60,
        agents: 10,
        providers: 3,
        tools: 50,
      };
    }

    const limits = sub.limits as any;
    return {
      tokensPerMonth: limits?.tokensPerMonth || 100000,
      requestsPerMinute: limits?.requestsPerMinute || 60,
      agents: limits?.agents || 10,
      providers: limits?.providers || 3,
      tools: limits?.tools || 50,
    };
  }

  async getUsageHistory(
    organizationId: number,
    days: number = 30
  ): Promise<DailyUsage[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const records = await db.select()
      .from(organizationUsage)
      .where(and(
        eq(organizationUsage.organizationId, organizationId),
        gte(organizationUsage.date, startDate)
      ))
      .orderBy(desc(organizationUsage.date));

    return records.map(record => ({
      date: record.date,
      totalTokens: record.totalTokens || 0,
      inputTokens: record.inputTokens || 0,
      outputTokens: record.outputTokens || 0,
      totalRequests: record.totalRequests || 0,
      successfulRequests: record.successfulRequests || 0,
      failedRequests: record.failedRequests || 0,
      totalCost: (record.totalCost || 0) / 100,
    }));
  }

  async getUsageByProvider(organizationId: number, days: number = 30): Promise<Record<string, {
    tokens: number;
    cost: number;
    requests: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const records = await db.select()
      .from(organizationUsage)
      .where(and(
        eq(organizationUsage.organizationId, organizationId),
        gte(organizationUsage.date, startDate)
      ));

    const byProvider: Record<string, { tokens: number; cost: number; requests: number }> = {};

    for (const record of records) {
      const providerUsage = record.usageByProvider as Record<string, any>;
      if (providerUsage) {
        for (const [provider, usage] of Object.entries(providerUsage)) {
          if (!byProvider[provider]) {
            byProvider[provider] = { tokens: 0, cost: 0, requests: 0 };
          }
          byProvider[provider].tokens += usage.tokens || 0;
          byProvider[provider].cost += usage.cost || 0;
          byProvider[provider].requests += 1;
        }
      }
    }

    return byProvider;
  }

  async getUsageByAgent(organizationId: number, days: number = 30): Promise<Record<string, {
    executions: number;
    tokens: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const records = await db.select()
      .from(organizationUsage)
      .where(and(
        eq(organizationUsage.organizationId, organizationId),
        gte(organizationUsage.date, startDate)
      ));

    const byAgent: Record<string, { executions: number; tokens: number }> = {};

    for (const record of records) {
      const agentUsage = record.usageByAgent as Record<string, any>;
      if (agentUsage) {
        for (const [agentId, usage] of Object.entries(agentUsage)) {
          if (!byAgent[agentId]) {
            byAgent[agentId] = { executions: 0, tokens: 0 };
          }
          byAgent[agentId].executions += usage.executions || 0;
          byAgent[agentId].tokens += usage.tokens || 0;
        }
      }
    }

    return byAgent;
  }

  private calculatePercentages(monthly: MonthlyUsage, limits: UsageLimits): UsagePercentages {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const tokensUsedPercent = limits.tokensPerMonth === -1 
      ? 0 
      : (monthly.totalTokens / limits.tokensPerMonth) * 100;

    const estimatedMonthlyTokens = dayOfMonth > 0 
      ? Math.round((monthly.totalTokens / dayOfMonth) * daysInMonth)
      : 0;

    const estimatedPercent = limits.tokensPerMonth === -1
      ? 0
      : (estimatedMonthlyTokens / limits.tokensPerMonth) * 100;

    return {
      tokensUsed: Math.round(tokensUsedPercent * 100) / 100,
      estimatedMonthlyTokens: estimatedPercent,
      isOverLimit: limits.tokensPerMonth !== -1 && monthly.totalTokens > limits.tokensPerMonth,
      daysRemaining,
    };
  }
}

export const usageTrackingService = UsageTrackingService.getInstance();
