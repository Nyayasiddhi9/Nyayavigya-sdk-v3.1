/**
 * WAI Budget Guard Middleware
 * Intelligent cost management and resource allocation
 */

import { Request, Response, NextFunction } from 'express';

interface BudgetConfig {
  dailyLimit: number;
  hourlyLimit: number;
  providerLimits: Record<string, number>;
  alertThresholds: {
    warning: number; // 70%
    critical: number; // 90%
  };
}

interface UsageMetrics {
  daily: number;
  hourly: number;
  providerUsage: Record<string, number>;
  requestCount: number;
  lastReset: Date;
}

class BudgetGuard {
  private config: BudgetConfig;
  private usage: UsageMetrics;

  constructor() {
    this.config = {
      dailyLimit: Number(process.env.DAILY_BUDGET_LIMIT) || 100.0, // $100 daily
      hourlyLimit: Number(process.env.HOURLY_BUDGET_LIMIT) || 10.0, // $10 hourly
      providerLimits: {
        openai: Number(process.env.OPENAI_BUDGET_LIMIT) || 50.0,
        anthropic: Number(process.env.ANTHROPIC_BUDGET_LIMIT) || 30.0,
        google: Number(process.env.GOOGLE_BUDGET_LIMIT) || 20.0,
        sarvam: Number(process.env.SARVAM_BUDGET_LIMIT) || 15.0
      },
      alertThresholds: {
        warning: 0.7,
        critical: 0.9
      }
    };

    this.usage = this.initializeUsage();
    this.startPeriodicReset();
  }

  private initializeUsage(): UsageMetrics {
    return {
      daily: 0,
      hourly: 0,
      providerUsage: {},
      requestCount: 0,
      lastReset: new Date()
    };
  }

  private startPeriodicReset(): void {
    // Reset hourly usage every hour
    setInterval(() => {
      this.usage.hourly = 0;
      console.log('🔄 Hourly budget usage reset');
    }, 60 * 60 * 1000);

    // Reset daily usage every day
    setInterval(() => {
      this.usage.daily = 0;
      this.usage.lastReset = new Date();
      console.log('🔄 Daily budget usage reset');
    }, 24 * 60 * 60 * 1000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Check budget limits before processing
        const budgetCheck = this.checkBudgetLimits(req);
        
        if (!budgetCheck.allowed) {
          return res.status(429).json({
            error: 'Budget limit exceeded',
            message: budgetCheck.reason,
            usage: this.getUsageSummary(),
            resetTime: this.getNextResetTime()
          });
        }

        // Track the request
        this.trackRequest(req);

        // Add budget info to response headers
        res.setHeader('X-Budget-Daily-Used', this.usage.daily.toFixed(2));
        res.setHeader('X-Budget-Daily-Limit', this.config.dailyLimit.toString());
        res.setHeader('X-Budget-Hourly-Used', this.usage.hourly.toFixed(2));
        res.setHeader('X-Budget-Hourly-Limit', this.config.hourlyLimit.toString());

        // Check for alert thresholds
        this.checkAlertThresholds();

        next();
      } catch (error) {
        console.error('❌ Budget Guard Error:', error);
        next(error);
      }
    };
  }

  private checkBudgetLimits(req: Request): { allowed: boolean; reason?: string } {
    // Check daily limit
    if (this.usage.daily >= this.config.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily budget limit of $${this.config.dailyLimit} exceeded`
      };
    }

    // Check hourly limit
    if (this.usage.hourly >= this.config.hourlyLimit) {
      return {
        allowed: false,
        reason: `Hourly budget limit of $${this.config.hourlyLimit} exceeded`
      };
    }

    // Check provider-specific limits
    const provider = this.getProviderFromRequest(req);
    if (provider && this.config.providerLimits[provider]) {
      const providerUsage = this.usage.providerUsage[provider] || 0;
      if (providerUsage >= this.config.providerLimits[provider]) {
        return {
          allowed: false,
          reason: `${provider} budget limit of $${this.config.providerLimits[provider]} exceeded`
        };
      }
    }

    return { allowed: true };
  }

  private trackRequest(req: Request): void {
    this.usage.requestCount++;
    
    // Estimate cost based on request type and provider
    const estimatedCost = this.estimateRequestCost(req);
    
    this.usage.daily += estimatedCost;
    this.usage.hourly += estimatedCost;

    const provider = this.getProviderFromRequest(req);
    if (provider) {
      this.usage.providerUsage[provider] = (this.usage.providerUsage[provider] || 0) + estimatedCost;
    }
  }

  private estimateRequestCost(req: Request): number {
    const path = req.path;
    const provider = this.getProviderFromRequest(req);

    // Base cost estimation
    let baseCost = 0.01; // $0.01 base

    // Adjust based on endpoint complexity
    if (path.includes('/enterprise/')) baseCost *= 3;
    else if (path.includes('/content/')) baseCost *= 2;
    else if (path.includes('/assistant/')) baseCost *= 2.5;
    else if (path.includes('/game/')) baseCost *= 1.5;

    // Adjust based on provider
    const providerMultipliers: Record<string, number> = {
      openai: 1.2,
      anthropic: 1.0,
      google: 0.8,
      sarvam: 0.6
    };

    if (provider && providerMultipliers[provider]) {
      baseCost *= providerMultipliers[provider];
    }

    // Add premium features cost
    const body = req.body || {};
    if (body.qualityLevel === 'premium') baseCost *= 2;
    else if (body.qualityLevel === 'quality') baseCost *= 1.5;

    if (body.sarvamAPIEnabled) baseCost *= 1.3;
    if (body.securityLevel === 'government') baseCost *= 1.8;

    return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
  }

  private getProviderFromRequest(req: Request): string | null {
    const userAgent = req.headers['user-agent'] || '';
    const path = req.path;
    const body = req.body || {};

    // Extract provider from various sources
    if (body.provider) return body.provider;
    if (path.includes('/openai/')) return 'openai';
    if (path.includes('/anthropic/')) return 'anthropic';
    if (path.includes('/google/')) return 'google';
    if (path.includes('/sarvam/') || body.sarvamAPIEnabled) return 'sarvam';

    return null;
  }

  private checkAlertThresholds(): void {
    const dailyUsagePercent = this.usage.daily / this.config.dailyLimit;
    const hourlyUsagePercent = this.usage.hourly / this.config.hourlyLimit;

    if (dailyUsagePercent >= this.config.alertThresholds.critical) {
      console.warn(`🚨 CRITICAL: Daily budget usage at ${(dailyUsagePercent * 100).toFixed(1)}%`);
    } else if (dailyUsagePercent >= this.config.alertThresholds.warning) {
      console.warn(`⚠️ WARNING: Daily budget usage at ${(dailyUsagePercent * 100).toFixed(1)}%`);
    }

    if (hourlyUsagePercent >= this.config.alertThresholds.critical) {
      console.warn(`🚨 CRITICAL: Hourly budget usage at ${(hourlyUsagePercent * 100).toFixed(1)}%`);
    } else if (hourlyUsagePercent >= this.config.alertThresholds.warning) {
      console.warn(`⚠️ WARNING: Hourly budget usage at ${(hourlyUsagePercent * 100).toFixed(1)}%`);
    }
  }

  getUsageSummary() {
    return {
      daily: {
        used: this.usage.daily,
        limit: this.config.dailyLimit,
        remaining: this.config.dailyLimit - this.usage.daily,
        percentage: (this.usage.daily / this.config.dailyLimit * 100).toFixed(1)
      },
      hourly: {
        used: this.usage.hourly,
        limit: this.config.hourlyLimit,
        remaining: this.config.hourlyLimit - this.usage.hourly,
        percentage: (this.usage.hourly / this.config.hourlyLimit * 100).toFixed(1)
      },
      providers: Object.entries(this.usage.providerUsage).map(([provider, used]) => ({
        provider,
        used,
        limit: this.config.providerLimits[provider] || 0,
        remaining: Math.max(0, (this.config.providerLimits[provider] || 0) - used)
      })),
      requests: this.usage.requestCount,
      lastReset: this.usage.lastReset
    };
  }

  private getNextResetTime(): { hourly: Date; daily: Date } {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);

    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);

    return {
      hourly: nextHour,
      daily: nextDay
    };
  }
}

// Create and export the budget guard instance
export const budgetGuard = new BudgetGuard();
export const budgetGuardMiddleware = budgetGuard.middleware();