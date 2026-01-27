/**
 * WAI Rate Limiting & Quota System v8.0
 * Comprehensive rate limiting with per-platform controls
 */

import { EventEmitter } from 'events';
import { randomUUID as uuidv4 } from 'crypto';

// ================================================================================================
// RATE LIMITING SYSTEM V8.0
// ================================================================================================

export interface RateLimitRule {
  id: string;
  name: string;
  pattern: string; // API endpoint pattern
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  platform?: string; // Platform-specific rule
  userType?: 'free' | 'pro' | 'enterprise'; // User tier specific
  skipIf?: (req: any) => boolean; // Skip condition
  onLimitReached?: (req: any) => void; // Callback when limit reached
  priority: number; // Rule priority (higher = more important)
  isActive: boolean;
}

export interface QuotaRule {
  id: string;
  name: string;
  platform: string;
  userType: 'free' | 'pro' | 'enterprise';
  quotas: {
    daily: {
      requests: number;
      tokens: number;
      cost: number; // USD
    };
    monthly: {
      requests: number;
      tokens: number;
      cost: number; // USD
    };
  };
  overagePolicy: 'block' | 'throttle' | 'charge';
  resetTime: 'midnight' | 'rolling';
  isActive: boolean;
}

export interface RateLimitEntry {
  key: string;
  platform: string;
  userId?: string;
  requests: number;
  tokens: number;
  cost: number;
  windowStart: Date;
  lastRequest: Date;
  isBlocked: boolean;
  blockUntil?: Date;
}

export interface QuotaUsage {
  userId: string;
  platform: string;
  userType: 'free' | 'pro' | 'enterprise';
  daily: {
    requests: number;
    tokens: number;
    cost: number;
    lastReset: Date;
  };
  monthly: {
    requests: number;
    tokens: number;
    cost: number;
    lastReset: Date;
  };
  overageCount: number;
  isBlocked: boolean;
}

export class WAIRateLimitingSystem extends EventEmitter {
  public readonly version = '8.0.0';
  
  private rateLimitRules: Map<string, RateLimitRule> = new Map();
  private quotaRules: Map<string, QuotaRule> = new Map();
  private rateLimitEntries: Map<string, RateLimitEntry> = new Map();
  private quotaUsage: Map<string, QuotaUsage> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeRateLimitingSystem();
  }

  private async initializeRateLimitingSystem(): Promise<void> {
    console.log('⚡ Initializing WAI Rate Limiting System v8.0...');
    
    await this.setupDefaultRateLimitRules();
    await this.setupDefaultQuotaRules();
    await this.startCleanupInterval();
    
    console.log('✅ Rate limiting system initialized with comprehensive controls');
  }

  // ================================================================================================
  // DEFAULT RATE LIMIT RULES
  // ================================================================================================

  private async setupDefaultRateLimitRules(): Promise<void> {
    console.log('📊 Setting up default rate limit rules...');
    
    const defaultRules: RateLimitRule[] = [
      // Global API limits
      {
        id: 'global-basic',
        name: 'Global Basic Rate Limit',
        pattern: '/api/v8/*',
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        priority: 1,
        isActive: true
      },

      // Authentication endpoints
      {
        id: 'auth-strict',
        name: 'Authentication Strict Limit',
        pattern: '/api/v8/auth/*',
        windowMs: 300000, // 5 minutes
        maxRequests: 5,
        priority: 10,
        isActive: true
      },

      // Orchestration endpoints - tier-based
      {
        id: 'orchestration-free',
        name: 'Orchestration Free Tier',
        pattern: '/api/v8/orchestration/*',
        windowMs: 60000, // 1 minute
        maxRequests: 10,
        userType: 'free',
        priority: 5,
        isActive: true
      },
      {
        id: 'orchestration-pro',
        name: 'Orchestration Pro Tier',
        pattern: '/api/v8/orchestration/*',
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        userType: 'pro',
        priority: 5,
        isActive: true
      },
      {
        id: 'orchestration-enterprise',
        name: 'Orchestration Enterprise Tier',
        pattern: '/api/v8/orchestration/*',
        windowMs: 60000, // 1 minute
        maxRequests: 1000,
        userType: 'enterprise',
        priority: 5,
        isActive: true
      },

      // LLM routing - cost-based limits
      {
        id: 'llm-free',
        name: 'LLM Free Tier',
        pattern: '/api/v8/llm/*',
        windowMs: 3600000, // 1 hour
        maxRequests: 50,
        userType: 'free',
        priority: 8,
        isActive: true
      },
      {
        id: 'llm-pro',
        name: 'LLM Pro Tier',
        pattern: '/api/v8/llm/*',
        windowMs: 3600000, // 1 hour
        maxRequests: 500,
        userType: 'pro',
        priority: 8,
        isActive: true
      },

      // Integration endpoints
      {
        id: 'integrations-free',
        name: 'Integrations Free Tier',
        pattern: '/api/v8/integrations/*',
        windowMs: 300000, // 5 minutes
        maxRequests: 20,
        userType: 'free',
        priority: 6,
        isActive: true
      },
      {
        id: 'integrations-enterprise',
        name: 'Integrations Enterprise',
        pattern: '/api/v8/integrations/*',
        windowMs: 60000, // 1 minute
        maxRequests: 200,
        userType: 'enterprise',
        priority: 6,
        isActive: true
      },

      // Agent deployment
      {
        id: 'agents-free',
        name: 'Agent Deployment Free',
        pattern: '/api/v8/agents/*',
        windowMs: 3600000, // 1 hour
        maxRequests: 5,
        userType: 'free',
        priority: 7,
        isActive: true
      },
      {
        id: 'agents-pro',
        name: 'Agent Deployment Pro',
        pattern: '/api/v8/agents/*',
        windowMs: 3600000, // 1 hour
        maxRequests: 50,
        userType: 'pro',
        priority: 7,
        isActive: true
      },

      // Analytics endpoints
      {
        id: 'analytics-basic',
        name: 'Analytics Basic Limit',
        pattern: '/api/v8/analytics/*',
        windowMs: 300000, // 5 minutes
        maxRequests: 20,
        priority: 3,
        isActive: true
      },

      // Platform-specific limits
      {
        id: 'platform-codestudio',
        name: 'CodeStudio Platform Limit',
        pattern: '/api/v8/*',
        platform: 'codestudio',
        windowMs: 60000, // 1 minute
        maxRequests: 200,
        priority: 4,
        isActive: true
      },
      {
        id: 'platform-contentstudio',
        name: 'ContentStudio Platform Limit',
        pattern: '/api/v8/*',
        platform: 'contentstudio',
        windowMs: 60000, // 1 minute
        maxRequests: 150,
        priority: 4,
        isActive: true
      }
    ];

    defaultRules.forEach(rule => {
      this.rateLimitRules.set(rule.id, rule);
    });

    console.log(`✅ Configured ${defaultRules.length} rate limit rules`);
  }

  // ================================================================================================
  // DEFAULT QUOTA RULES
  // ================================================================================================

  private async setupDefaultQuotaRules(): Promise<void> {
    console.log('💰 Setting up default quota rules...');
    
    const defaultQuotas: QuotaRule[] = [
      // Free tier quotas
      {
        id: 'free-tier-global',
        name: 'Free Tier Global Quota',
        platform: '*',
        userType: 'free',
        quotas: {
          daily: {
            requests: 1000,
            tokens: 50000,
            cost: 1.0 // $1 per day
          },
          monthly: {
            requests: 25000,
            tokens: 1000000,
            cost: 25.0 // $25 per month
          }
        },
        overagePolicy: 'block',
        resetTime: 'midnight',
        isActive: true
      },

      // Pro tier quotas
      {
        id: 'pro-tier-global',
        name: 'Pro Tier Global Quota',
        platform: '*',
        userType: 'pro',
        quotas: {
          daily: {
            requests: 10000,
            tokens: 1000000,
            cost: 20.0 // $20 per day
          },
          monthly: {
            requests: 250000,
            tokens: 25000000,
            cost: 500.0 // $500 per month
          }
        },
        overagePolicy: 'throttle',
        resetTime: 'midnight',
        isActive: true
      },

      // Enterprise tier quotas
      {
        id: 'enterprise-tier-global',
        name: 'Enterprise Tier Global Quota',
        platform: '*',
        userType: 'enterprise',
        quotas: {
          daily: {
            requests: 100000,
            tokens: 10000000,
            cost: 200.0 // $200 per day
          },
          monthly: {
            requests: 2500000,
            tokens: 250000000,
            cost: 5000.0 // $5000 per month
          }
        },
        overagePolicy: 'charge',
        resetTime: 'midnight',
        isActive: true
      },

      // Platform-specific quotas
      {
        id: 'codestudio-free',
        name: 'CodeStudio Free Quota',
        platform: 'codestudio',
        userType: 'free',
        quotas: {
          daily: {
            requests: 500,
            tokens: 25000,
            cost: 0.5
          },
          monthly: {
            requests: 12000,
            tokens: 500000,
            cost: 12.0
          }
        },
        overagePolicy: 'block',
        resetTime: 'midnight',
        isActive: true
      },

      {
        id: 'ai-assistant-pro',
        name: 'AI Assistant Pro Quota',
        platform: 'ai-assistant',
        userType: 'pro',
        quotas: {
          daily: {
            requests: 5000,
            tokens: 500000,
            cost: 10.0
          },
          monthly: {
            requests: 125000,
            tokens: 12500000,
            cost: 250.0
          }
        },
        overagePolicy: 'throttle',
        resetTime: 'midnight',
        isActive: true
      }
    ];

    defaultQuotas.forEach(quota => {
      this.quotaRules.set(quota.id, quota);
    });

    console.log(`✅ Configured ${defaultQuotas.length} quota rules`);
  }

  // ================================================================================================
  // RATE LIMITING LOGIC
  // ================================================================================================

  public async checkRateLimit(request: {
    path: string;
    platform: string;
    userId?: string;
    userType?: 'free' | 'pro' | 'enterprise';
    ip: string;
  }): Promise<{
    allowed: boolean;
    rule?: RateLimitRule;
    remaining?: number;
    resetTime?: Date;
    reason?: string;
  }> {
    
    // Find applicable rules
    const applicableRules = this.findApplicableRules(request.path, request.platform, request.userType);
    
    if (applicableRules.length === 0) {
      return { allowed: true };
    }

    // Check each rule (highest priority first)
    for (const rule of applicableRules) {
      const result = await this.checkSingleRule(rule, request);
      
      if (!result.allowed) {
        return result;
      }
    }

    return { allowed: true };
  }

  private findApplicableRules(path: string, platform: string, userType?: string): RateLimitRule[] {
    const rules = Array.from(this.rateLimitRules.values())
      .filter(rule => rule.isActive)
      .filter(rule => {
        // Check path pattern
        if (!this.matchesPattern(path, rule.pattern)) {
          return false;
        }

        // Check platform
        if (rule.platform && rule.platform !== '*' && rule.platform !== platform) {
          return false;
        }

        // Check user type
        if (rule.userType && rule.userType !== userType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    return rules;
  }

  private matchesPattern(path: string, pattern: string): boolean {
    // Simple pattern matching - in production, use more sophisticated matching
    if (pattern === '*') return true;
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return path.startsWith(prefix);
    }
    return path === pattern;
  }

  private async checkSingleRule(rule: RateLimitRule, request: any): Promise<{
    allowed: boolean;
    rule?: RateLimitRule;
    remaining?: number;
    resetTime?: Date;
    reason?: string;
  }> {
    
    // Generate rate limit key
    const key = this.generateRateLimitKey(rule, request);
    
    // Get or create rate limit entry
    let entry = this.rateLimitEntries.get(key);
    const now = new Date();

    if (!entry) {
      entry = {
        key,
        platform: request.platform,
        userId: request.userId,
        requests: 0,
        tokens: 0,
        cost: 0,
        windowStart: now,
        lastRequest: now,
        isBlocked: false
      };
      this.rateLimitEntries.set(key, entry);
    }

    // Check if window has expired
    if (now.getTime() - entry.windowStart.getTime() >= rule.windowMs) {
      // Reset window
      entry.requests = 0;
      entry.tokens = 0;
      entry.cost = 0;
      entry.windowStart = now;
      entry.isBlocked = false;
      entry.blockUntil = undefined;
    }

    // Check if currently blocked
    if (entry.isBlocked && entry.blockUntil && now < entry.blockUntil) {
      return {
        allowed: false,
        rule,
        remaining: 0,
        resetTime: entry.blockUntil,
        reason: 'Rate limit exceeded - blocked'
      };
    }

    // Check if limit would be exceeded
    if (entry.requests >= rule.maxRequests) {
      entry.isBlocked = true;
      entry.blockUntil = new Date(entry.windowStart.getTime() + rule.windowMs);
      
      // Trigger callback if configured
      if (rule.onLimitReached) {
        rule.onLimitReached(request);
      }

      this.emit('rateLimitExceeded', { rule, request, entry });

      return {
        allowed: false,
        rule,
        remaining: 0,
        resetTime: entry.blockUntil,
        reason: 'Rate limit exceeded'
      };
    }

    // Allow request and increment counter
    entry.requests++;
    entry.lastRequest = now;

    const remaining = rule.maxRequests - entry.requests;
    const resetTime = new Date(entry.windowStart.getTime() + rule.windowMs);

    return {
      allowed: true,
      rule,
      remaining,
      resetTime
    };
  }

  private generateRateLimitKey(rule: RateLimitRule, request: any): string {
    const parts = [rule.id];
    
    if (request.userId) {
      parts.push(`user:${request.userId}`);
    } else {
      parts.push(`ip:${request.ip}`);
    }
    
    if (request.platform) {
      parts.push(`platform:${request.platform}`);
    }

    return parts.join('|');
  }

  // ================================================================================================
  // QUOTA MANAGEMENT
  // ================================================================================================

  public async checkQuota(request: {
    userId: string;
    platform: string;
    userType: 'free' | 'pro' | 'enterprise';
    tokens?: number;
    cost?: number;
  }): Promise<{
    allowed: boolean;
    quota?: QuotaRule;
    remaining?: {
      daily: { requests: number; tokens: number; cost: number };
      monthly: { requests: number; tokens: number; cost: number };
    };
    reason?: string;
  }> {

    // Find applicable quota rule
    const quotaRule = this.findApplicableQuota(request.platform, request.userType);
    
    if (!quotaRule) {
      return { allowed: true };
    }

    // Get or create quota usage
    const usageKey = `${request.userId}|${request.platform}`;
    let usage = this.quotaUsage.get(usageKey);
    
    if (!usage) {
      usage = this.createQuotaUsage(request.userId, request.platform, request.userType);
      this.quotaUsage.set(usageKey, usage);
    }

    // Check if quotas need reset
    this.checkAndResetQuotas(usage, quotaRule);

    // Check daily quota
    const dailyExceeded = (
      usage.daily.requests >= quotaRule.quotas.daily.requests ||
      usage.daily.tokens >= quotaRule.quotas.daily.tokens ||
      usage.daily.cost >= quotaRule.quotas.daily.cost
    );

    // Check monthly quota
    const monthlyExceeded = (
      usage.monthly.requests >= quotaRule.quotas.monthly.requests ||
      usage.monthly.tokens >= quotaRule.quotas.monthly.tokens ||
      usage.monthly.cost >= quotaRule.quotas.monthly.cost
    );

    if (dailyExceeded || monthlyExceeded) {
      // Apply overage policy
      switch (quotaRule.overagePolicy) {
        case 'block':
          return {
            allowed: false,
            quota: quotaRule,
            reason: dailyExceeded ? 'Daily quota exceeded' : 'Monthly quota exceeded'
          };
        
        case 'throttle':
          // Allow but mark for throttling
          usage.overageCount++;
          this.emit('quotaOverage', { type: 'throttle', usage, quota: quotaRule });
          break;
        
        case 'charge':
          // Allow and charge overage
          usage.overageCount++;
          this.emit('quotaOverage', { type: 'charge', usage, quota: quotaRule });
          break;
      }
    }

    // Update usage
    usage.daily.requests++;
    usage.monthly.requests++;
    
    if (request.tokens) {
      usage.daily.tokens += request.tokens;
      usage.monthly.tokens += request.tokens;
    }
    
    if (request.cost) {
      usage.daily.cost += request.cost;
      usage.monthly.cost += request.cost;
    }

    // Calculate remaining quotas
    const remaining = {
      daily: {
        requests: Math.max(0, quotaRule.quotas.daily.requests - usage.daily.requests),
        tokens: Math.max(0, quotaRule.quotas.daily.tokens - usage.daily.tokens),
        cost: Math.max(0, quotaRule.quotas.daily.cost - usage.daily.cost)
      },
      monthly: {
        requests: Math.max(0, quotaRule.quotas.monthly.requests - usage.monthly.requests),
        tokens: Math.max(0, quotaRule.quotas.monthly.tokens - usage.monthly.tokens),
        cost: Math.max(0, quotaRule.quotas.monthly.cost - usage.monthly.cost)
      }
    };

    return {
      allowed: true,
      quota: quotaRule,
      remaining
    };
  }

  private findApplicableQuota(platform: string, userType: string): QuotaRule | null {
    // Find most specific rule first
    let rule = Array.from(this.quotaRules.values()).find(
      q => q.isActive && q.platform === platform && q.userType === userType
    );

    // Fallback to global rule
    if (!rule) {
      rule = Array.from(this.quotaRules.values()).find(
        q => q.isActive && q.platform === '*' && q.userType === userType
      );
    }

    return rule || null;
  }

  private createQuotaUsage(userId: string, platform: string, userType: 'free' | 'pro' | 'enterprise'): QuotaUsage {
    const now = new Date();
    
    return {
      userId,
      platform,
      userType,
      daily: {
        requests: 0,
        tokens: 0,
        cost: 0,
        lastReset: now
      },
      monthly: {
        requests: 0,
        tokens: 0,
        cost: 0,
        lastReset: now
      },
      overageCount: 0,
      isBlocked: false
    };
  }

  private checkAndResetQuotas(usage: QuotaUsage, quotaRule: QuotaRule): void {
    const now = new Date();
    
    // Check daily reset
    if (quotaRule.resetTime === 'midnight') {
      const lastResetDay = usage.daily.lastReset.toDateString();
      const currentDay = now.toDateString();
      
      if (lastResetDay !== currentDay) {
        usage.daily.requests = 0;
        usage.daily.tokens = 0;
        usage.daily.cost = 0;
        usage.daily.lastReset = now;
      }
    } else if (quotaRule.resetTime === 'rolling') {
      // 24-hour rolling window
      if (now.getTime() - usage.daily.lastReset.getTime() >= 86400000) {
        usage.daily.requests = 0;
        usage.daily.tokens = 0;
        usage.daily.cost = 0;
        usage.daily.lastReset = now;
      }
    }

    // Check monthly reset (first day of month)
    const currentMonth = now.getMonth();
    const lastResetMonth = usage.monthly.lastReset.getMonth();
    
    if (currentMonth !== lastResetMonth) {
      usage.monthly.requests = 0;
      usage.monthly.tokens = 0;
      usage.monthly.cost = 0;
      usage.monthly.lastReset = now;
    }
  }

  // ================================================================================================
  // CLEANUP AND MANAGEMENT
  // ================================================================================================

  private async startCleanupInterval(): Promise<void> {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 300000); // 5 minutes
  }

  private cleanupExpiredEntries(): void {
    const now = new Date();
    
    // Clean up rate limit entries
    for (const [key, entry] of this.rateLimitEntries.entries()) {
      // Remove entries older than 24 hours
      if (now.getTime() - entry.lastRequest.getTime() > 86400000) {
        this.rateLimitEntries.delete(key);
      }
    }

    console.log(`🧹 Cleaned up rate limiting entries: ${this.rateLimitEntries.size} active entries`);
  }

  // ================================================================================================
  // ADMIN METHODS
  // ================================================================================================

  public addRateLimitRule(rule: RateLimitRule): void {
    this.rateLimitRules.set(rule.id, rule);
    this.emit('ruleDefined', { type: 'rateLimit', rule });
  }

  public addQuotaRule(quota: QuotaRule): void {
    this.quotaRules.set(quota.id, quota);
    this.emit('ruleDefined', { type: 'quota', quota });
  }

  public removeRateLimitRule(ruleId: string): boolean {
    const deleted = this.rateLimitRules.delete(ruleId);
    if (deleted) {
      this.emit('ruleRemoved', { type: 'rateLimit', ruleId });
    }
    return deleted;
  }

  public removeQuotaRule(quotaId: string): boolean {
    const deleted = this.quotaRules.delete(quotaId);
    if (deleted) {
      this.emit('ruleRemoved', { type: 'quota', quotaId });
    }
    return deleted;
  }

  public getRateLimitStatus(): any {
    return {
      version: this.version,
      rules: {
        rateLimit: this.rateLimitRules.size,
        quota: this.quotaRules.size
      },
      activeEntries: this.rateLimitEntries.size,
      activeQuotas: this.quotaUsage.size,
      lastCleanup: new Date().toISOString()
    };
  }

  public getUserQuotaStatus(userId: string, platform: string): QuotaUsage | null {
    return this.quotaUsage.get(`${userId}|${platform}`) || null;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const waiRateLimitingSystem = new WAIRateLimitingSystem();
export default waiRateLimitingSystem;