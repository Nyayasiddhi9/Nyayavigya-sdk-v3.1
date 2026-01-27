/**
 * Adaptive Routing Service - Phase 2
 * ML-based intelligent task-to-agent matching
 * 
 * Features:
 * - Pattern-based task matching
 * - Cost/speed/quality optimization
 * - Learning from successful executions
 * - Dynamic rule updates
 * - Fallback routing
 */

import { EventEmitter } from 'events';
import { db } from '../db';
import { adaptiveRoutingRules, AdaptiveRoutingRule } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { agentManifestLoader } from './agent-manifest-loader';
import { teamBuilderService } from './team-builder-service';

export interface RoutingRequest {
  task: string;
  context?: Record<string, any>;
  userId?: string;
  preferredModel?: string;
  costSensitive?: boolean;
  speedPriority?: boolean;
  qualityPriority?: boolean;
}

export interface RoutingDecision {
  targetType: 'agent' | 'team' | 'group' | 'collective';
  targetId: string;
  targetName: string;
  confidence: number;
  reasoning: string;
  matchedRules: string[];
  fallbackAvailable: boolean;
  estimatedCost: number;
  estimatedLatency: number;
}

export interface RoutingRuleDefinition {
  name: string;
  description?: string;
  taskPatterns: string[];
  contextPatterns?: string[];
  targetType: 'agent' | 'team' | 'group' | 'collective';
  targetId: string;
  fallbackTargetId?: string;
  priority?: number;
  costWeight?: number;
  speedWeight?: number;
  qualityWeight?: number;
}

class AdaptiveRoutingService extends EventEmitter {
  private static instance: AdaptiveRoutingService;
  private routingCache: Map<string, RoutingDecision> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000;

  private constructor() {
    super();
    this.initializeDefaultRules();
    console.log('🎯 Adaptive Routing Service initialized');
  }

  public static getInstance(): AdaptiveRoutingService {
    if (!AdaptiveRoutingService.instance) {
      AdaptiveRoutingService.instance = new AdaptiveRoutingService();
    }
    return AdaptiveRoutingService.instance;
  }

  private async initializeDefaultRules(): Promise<void> {
    const existingRules = await this.getAllRules();
    if (existingRules.length > 0) {
      console.log(`✅ Loaded ${existingRules.length} existing routing rules`);
      return;
    }

    const defaultRules: RoutingRuleDefinition[] = [
      {
        name: 'Financial Analysis',
        taskPatterns: ['financial', 'budget', 'investment', 'revenue', 'profit', 'cost analysis'],
        targetType: 'agent',
        targetId: 'financial-analyst',
        fallbackTargetId: 'cfo-agent',
        priority: 80,
        qualityWeight: 0.6,
      },
      {
        name: 'Code Development',
        taskPatterns: ['code', 'develop', 'implement', 'build', 'program', 'api', 'database'],
        targetType: 'agent',
        targetId: 'fullstack-developer',
        fallbackTargetId: 'cto-agent',
        priority: 85,
        speedWeight: 0.5,
      },
      {
        name: 'Marketing Strategy',
        taskPatterns: ['marketing', 'campaign', 'brand', 'seo', 'social media', 'content strategy'],
        targetType: 'agent',
        targetId: 'marketing-strategist',
        fallbackTargetId: 'cmo-agent',
        priority: 75,
      },
      {
        name: 'Legal Review',
        taskPatterns: ['legal', 'contract', 'compliance', 'terms', 'policy', 'regulation'],
        targetType: 'agent',
        targetId: 'legal-analyst',
        fallbackTargetId: 'corporate-counsel',
        priority: 90,
        qualityWeight: 0.8,
      },
      {
        name: 'HR Operations',
        taskPatterns: ['hr', 'hiring', 'recruit', 'employee', 'compensation', 'benefits'],
        targetType: 'agent',
        targetId: 'hr-specialist',
        priority: 70,
      },
      {
        name: 'Research & Analysis',
        taskPatterns: ['research', 'analyze', 'investigate', 'study', 'report', 'data analysis'],
        targetType: 'agent',
        targetId: 'research-analyst',
        fallbackTargetId: 'data-scientist',
        priority: 75,
      },
      {
        name: 'Content Creation',
        taskPatterns: ['write', 'content', 'article', 'blog', 'copy', 'creative writing'],
        targetType: 'agent',
        targetId: 'content-writer',
        fallbackTargetId: 'copywriter',
        priority: 70,
      },
      {
        name: 'Design Work',
        taskPatterns: ['design', 'ui', 'ux', 'interface', 'visual', 'graphic'],
        targetType: 'agent',
        targetId: 'ux-designer',
        fallbackTargetId: 'ui-designer',
        priority: 75,
      },
      {
        name: 'DevOps & Infrastructure',
        taskPatterns: ['deploy', 'infrastructure', 'ci/cd', 'kubernetes', 'docker', 'cloud'],
        targetType: 'agent',
        targetId: 'devops-engineer',
        fallbackTargetId: 'cloud-architect',
        priority: 80,
      },
      {
        name: 'Security Review',
        taskPatterns: ['security', 'vulnerability', 'audit', 'penetration', 'encryption'],
        targetType: 'agent',
        targetId: 'security-engineer',
        fallbackTargetId: 'security-auditor',
        priority: 90,
        qualityWeight: 0.9,
      },
    ];

    for (const rule of defaultRules) {
      await this.createRule(rule);
    }

    console.log(`✅ Created ${defaultRules.length} default routing rules`);
  }

  async createRule(definition: RoutingRuleDefinition): Promise<AdaptiveRoutingRule> {
    const ruleId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const ruleData = {
      ruleId,
      name: definition.name,
      description: definition.description,
      taskPatterns: definition.taskPatterns,
      contextPatterns: definition.contextPatterns || [],
      userPatterns: [],
      targetType: definition.targetType,
      targetId: definition.targetId,
      fallbackTargetId: definition.fallbackTargetId,
      priority: definition.priority || 50,
      confidenceThreshold: 0.7,
      costWeight: definition.costWeight || 0.3,
      speedWeight: definition.speedWeight || 0.3,
      qualityWeight: definition.qualityWeight || 0.4,
      isLearnable: true,
      learningData: {},
      successRate: 0,
      usageCount: 0,
      isActive: true,
    };

    const [rule] = await db.insert(adaptiveRoutingRules).values(ruleData).returning();

    this.emit('rule-created', rule);
    return rule;
  }

  async route(request: RoutingRequest): Promise<RoutingDecision> {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.routingCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const rules = await this.getAllActiveRules();
    const matchedRules: { rule: AdaptiveRoutingRule; score: number }[] = [];

    for (const rule of rules) {
      const score = this.calculateMatchScore(request, rule);
      if (score > 0) {
        matchedRules.push({ rule, score });
      }
    }

    matchedRules.sort((a, b) => {
      const priorityDiff = (b.rule.priority || 0) - (a.rule.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return b.score - a.score;
    });

    let decision: RoutingDecision;

    if (matchedRules.length > 0) {
      const bestMatch = matchedRules[0];
      const targetAgent = agentManifestLoader.getEnterpriseAgent(bestMatch.rule.targetId);

      decision = {
        targetType: bestMatch.rule.targetType as 'agent' | 'team' | 'group' | 'collective',
        targetId: bestMatch.rule.targetId,
        targetName: targetAgent?.name || bestMatch.rule.targetId,
        confidence: Math.min(bestMatch.score / 10, 0.99),
        reasoning: `Matched ${matchedRules.length} rule(s). Best match: ${bestMatch.rule.name}`,
        matchedRules: matchedRules.map(m => m.rule.name),
        fallbackAvailable: !!bestMatch.rule.fallbackTargetId,
        estimatedCost: this.estimateCost(bestMatch.rule),
        estimatedLatency: this.estimateLatency(bestMatch.rule),
      };

      await this.recordUsage(bestMatch.rule.ruleId);
    } else {
      decision = this.getDefaultRouting(request);
    }

    this.routingCache.set(cacheKey, decision);
    setTimeout(() => this.routingCache.delete(cacheKey), this.cacheTimeout);

    this.emit('routing-decision', { request, decision });

    return decision;
  }

  private calculateMatchScore(request: RoutingRequest, rule: AdaptiveRoutingRule): number {
    let score = 0;
    const taskLower = request.task.toLowerCase();
    const taskPatterns = (rule.taskPatterns as string[]) || [];

    for (const pattern of taskPatterns) {
      if (taskLower.includes(pattern.toLowerCase())) {
        score += 3;
      }
    }

    if (request.costSensitive && rule.costWeight && rule.costWeight > 0.5) {
      score += 1;
    }
    if (request.speedPriority && rule.speedWeight && rule.speedWeight > 0.5) {
      score += 1;
    }
    if (request.qualityPriority && rule.qualityWeight && rule.qualityWeight > 0.5) {
      score += 1;
    }

    if (rule.successRate && rule.successRate > 0.8) {
      score += 2;
    }

    return score;
  }

  private generateCacheKey(request: RoutingRequest): string {
    const normalized = request.task.toLowerCase().trim().substring(0, 100);
    return `route:${normalized}:${request.costSensitive}:${request.speedPriority}:${request.qualityPriority}`;
  }

  private getDefaultRouting(request: RoutingRequest): RoutingDecision {
    const orchestrator = agentManifestLoader.getEnterpriseAgent('orchestrator') ||
                         agentManifestLoader.getEnterpriseAgent('ceo-agent');

    return {
      targetType: 'agent',
      targetId: orchestrator?.id || 'orchestrator',
      targetName: orchestrator?.name || 'Master Orchestrator',
      confidence: 0.5,
      reasoning: 'No specific rules matched. Routing to default orchestrator.',
      matchedRules: [],
      fallbackAvailable: true,
      estimatedCost: 0.05,
      estimatedLatency: 2000,
    };
  }

  private estimateCost(rule: AdaptiveRoutingRule): number {
    const baseCost = 0.01;
    const qualityMultiplier = 1 + (rule.qualityWeight || 0.4);
    return baseCost * qualityMultiplier;
  }

  private estimateLatency(rule: AdaptiveRoutingRule): number {
    const baseLatency = 1000;
    const speedFactor = 1 - (rule.speedWeight || 0.3);
    return baseLatency * (1 + speedFactor);
  }

  private async recordUsage(ruleId: string): Promise<void> {
    const [rule] = await db.select()
      .from(adaptiveRoutingRules)
      .where(eq(adaptiveRoutingRules.ruleId, ruleId));

    if (rule) {
      await db.update(adaptiveRoutingRules)
        .set({
          usageCount: (rule.usageCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(adaptiveRoutingRules.ruleId, ruleId));
    }
  }

  async recordSuccess(ruleId: string): Promise<void> {
    const [rule] = await db.select()
      .from(adaptiveRoutingRules)
      .where(eq(adaptiveRoutingRules.ruleId, ruleId));

    if (rule) {
      const usageCount = (rule.usageCount || 0) + 1;
      const currentSuccessRate = rule.successRate || 0;
      const newSuccessRate = (currentSuccessRate * (usageCount - 1) + 1) / usageCount;

      await db.update(adaptiveRoutingRules)
        .set({
          successRate: newSuccessRate,
          updatedAt: new Date(),
        })
        .where(eq(adaptiveRoutingRules.ruleId, ruleId));
    }
  }

  async recordFailure(ruleId: string): Promise<void> {
    const [rule] = await db.select()
      .from(adaptiveRoutingRules)
      .where(eq(adaptiveRoutingRules.ruleId, ruleId));

    if (rule) {
      const usageCount = (rule.usageCount || 0) + 1;
      const currentSuccessRate = rule.successRate || 0;
      const newSuccessRate = (currentSuccessRate * (usageCount - 1)) / usageCount;

      await db.update(adaptiveRoutingRules)
        .set({
          successRate: newSuccessRate,
          updatedAt: new Date(),
        })
        .where(eq(adaptiveRoutingRules.ruleId, ruleId));
    }
  }

  async getAllRules(): Promise<AdaptiveRoutingRule[]> {
    return db.select().from(adaptiveRoutingRules);
  }

  async getAllActiveRules(): Promise<AdaptiveRoutingRule[]> {
    return db.select()
      .from(adaptiveRoutingRules)
      .where(eq(adaptiveRoutingRules.isActive, true));
  }

  async getRule(ruleId: string): Promise<AdaptiveRoutingRule | null> {
    const [rule] = await db.select()
      .from(adaptiveRoutingRules)
      .where(eq(adaptiveRoutingRules.ruleId, ruleId));
    return rule || null;
  }

  async updateRule(ruleId: string, updates: Partial<RoutingRuleDefinition>): Promise<AdaptiveRoutingRule | null> {
    const updateData: any = { updatedAt: new Date() };
    
    if (updates.taskPatterns) updateData.taskPatterns = updates.taskPatterns;
    if (updates.targetId) updateData.targetId = updates.targetId;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.costWeight !== undefined) updateData.costWeight = updates.costWeight;
    if (updates.speedWeight !== undefined) updateData.speedWeight = updates.speedWeight;
    if (updates.qualityWeight !== undefined) updateData.qualityWeight = updates.qualityWeight;

    const [rule] = await db.update(adaptiveRoutingRules)
      .set(updateData)
      .where(eq(adaptiveRoutingRules.ruleId, ruleId))
      .returning();

    this.emit('rule-updated', rule);
    return rule || null;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    await db.delete(adaptiveRoutingRules)
      .where(eq(adaptiveRoutingRules.ruleId, ruleId));
    
    this.emit('rule-deleted', { ruleId });
    return true;
  }

  async getTopPerformingRules(limit: number = 10): Promise<AdaptiveRoutingRule[]> {
    return db.select()
      .from(adaptiveRoutingRules)
      .where(and(
        eq(adaptiveRoutingRules.isActive, true),
        gte(adaptiveRoutingRules.usageCount, 1)
      ))
      .orderBy(desc(adaptiveRoutingRules.successRate))
      .limit(limit);
  }
}

export const adaptiveRoutingService = AdaptiveRoutingService.getInstance();
