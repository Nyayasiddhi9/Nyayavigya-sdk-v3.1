import { db } from '../db';
import { waiObservabilityTraces, waiPromptVersions, waiAlertRules, waiAlerts } from '@shared/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

export interface TraceEvent {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationType: 'llm_call' | 'agent_execution' | 'tool_invocation' | 'orchestration' | 'memory_access' | 'embedding';
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'success' | 'error' | 'timeout';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: TraceError;
  metadata: TraceMetadata;
  tokens?: TokenUsage;
  cost?: CostInfo;
}

export interface TraceError {
  type: string;
  message: string;
  stack?: string;
  retryCount?: number;
}

export interface TraceMetadata {
  userId?: string;
  sessionId?: string;
  organizationId?: number;
  agentId?: string;
  agentName?: string;
  modelId?: string;
  providerId?: string;
  environment?: string;
  version?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens?: number;
}

export interface CostInfo {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

export interface PromptVersion {
  id: string;
  name: string;
  version: string;
  systemPrompt: string;
  userPromptTemplate?: string;
  variables: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  performanceMetrics?: PromptPerformanceMetrics;
}

export interface PromptPerformanceMetrics {
  totalRuns: number;
  avgLatency: number;
  avgTokens: number;
  avgCost: number;
  successRate: number;
  userSatisfaction: number;
}

export interface EvaluationResult {
  id: string;
  promptVersionId: string;
  testCaseId: string;
  input: Record<string, any>;
  expectedOutput: string;
  actualOutput: string;
  score: number;
  metrics: EvaluationMetrics;
  timestamp: Date;
}

export interface EvaluationMetrics {
  relevance: number;
  accuracy: number;
  coherence: number;
  fluency: number;
  toxicity: number;
  hallucination: number;
  latency: number;
  tokenEfficiency: number;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  channels: string[];
  isEnabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export interface AlertCondition {
  metric: 'error_rate' | 'latency' | 'cost' | 'token_usage' | 'success_rate';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  timeWindowMinutes: number;
  aggregation: 'avg' | 'sum' | 'max' | 'min' | 'count';
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface DashboardMetrics {
  totalTraces: number;
  successRate: number;
  avgLatency: number;
  totalTokens: number;
  totalCost: number;
  errorRate: number;
  topAgents: { agentId: string; count: number; avgLatency: number }[];
  topModels: { modelId: string; count: number; avgCost: number }[];
  tracesByHour: { hour: string; count: number }[];
  costByProvider: { provider: string; cost: number }[];
}

class WizardSmithObservability {
  private traces: Map<string, TraceEvent[]> = new Map();
  private promptVersions: Map<string, PromptVersion> = new Map();
  private evaluations: Map<string, EvaluationResult[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  private metricsCache: Map<string, any> = new Map();

  async startTrace(event: Omit<TraceEvent, 'id' | 'startTime' | 'status'>): Promise<string> {
    const traceEvent: TraceEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      status: 'running'
    };

    const traceEvents = this.traces.get(event.traceId) || [];
    traceEvents.push(traceEvent);
    this.traces.set(event.traceId, traceEvents);

    console.log(`🔍 Trace started: ${traceEvent.name} (${event.operationType})`);
    return traceEvent.id;
  }

  async endTrace(
    traceId: string, 
    eventId: string, 
    result: { 
      status: 'success' | 'error' | 'timeout'; 
      output?: Record<string, any>; 
      error?: TraceError;
      tokens?: TokenUsage;
      cost?: CostInfo;
    }
  ): Promise<void> {
    const traceEvents = this.traces.get(traceId);
    if (!traceEvents) return;

    const event = traceEvents.find(e => e.id === eventId);
    if (!event) return;

    event.endTime = new Date();
    event.duration = event.endTime.getTime() - event.startTime.getTime();
    event.status = result.status;
    event.output = result.output;
    event.error = result.error;
    event.tokens = result.tokens;
    event.cost = result.cost;

    this.traces.set(traceId, traceEvents);

    await this.checkAlertRules(event);
    await this.persistTrace(event);

    console.log(`✅ Trace ended: ${event.name} - ${result.status} (${event.duration}ms)`);
  }

  private async persistTrace(event: TraceEvent): Promise<void> {
    try {
      await db.insert(waiObservabilityTraces).values({
        traceId: event.traceId,
        spanId: event.spanId,
        parentSpanId: event.parentSpanId,
        operationName: event.name,
        startTime: event.startTime,
        endTime: event.endTime,
        duration: event.duration ? Math.round(event.duration * 1000) : undefined,
        status: event.status,
        inputs: event.input,
        outputs: event.output,
        errorMessage: event.error?.message,
        errorStack: event.error?.stack,
        tokenUsage: event.tokens,
        tags: { operationType: event.operationType },
        annotations: event.metadata,
        userId: event.metadata.userId,
        sessionId: event.metadata.sessionId
      });
    } catch (error) {
      console.error('Failed to persist trace:', error);
    }
  }

  async getTrace(traceId: string): Promise<TraceEvent[]> {
    return this.traces.get(traceId) || [];
  }

  private async persistPromptVersion(version: PromptVersion): Promise<void> {
    try {
      await db.insert(waiPromptVersions).values({
        promptId: version.id,
        name: version.name,
        version: version.version,
        systemPrompt: version.systemPrompt,
        userPromptTemplate: version.userPromptTemplate,
        variables: version.variables,
        metadata: version.metadata,
        performanceMetrics: version.performanceMetrics || {},
        isActive: version.isActive
      }).onConflictDoUpdate({
        target: waiPromptVersions.promptId,
        set: {
          performanceMetrics: version.performanceMetrics || {},
          isActive: version.isActive,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to persist prompt version:', error);
    }
  }

  async createPromptVersion(prompt: Omit<PromptVersion, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptVersion> {
    const version: PromptVersion = {
      ...prompt,
      id: `prompt-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.promptVersions.set(version.id, version);
    await this.persistPromptVersion(version);
    console.log(`📝 Prompt version created: ${version.name} v${version.version}`);
    return version;
  }

  async getPromptVersion(id: string): Promise<PromptVersion | null> {
    return this.promptVersions.get(id) || null;
  }

  async getActivePromptVersions(): Promise<PromptVersion[]> {
    return Array.from(this.promptVersions.values()).filter(p => p.isActive);
  }

  async comparePromptVersions(versionIds: string[]): Promise<{
    versions: PromptVersion[];
    comparison: Record<string, any>;
  }> {
    const versions = versionIds
      .map(id => this.promptVersions.get(id))
      .filter((v): v is PromptVersion => v !== undefined);

    const comparison: Record<string, any> = {
      avgLatency: {},
      avgCost: {},
      successRate: {},
      tokenEfficiency: {}
    };

    versions.forEach(v => {
      if (v.performanceMetrics) {
        comparison.avgLatency[v.id] = v.performanceMetrics.avgLatency;
        comparison.avgCost[v.id] = v.performanceMetrics.avgCost;
        comparison.successRate[v.id] = v.performanceMetrics.successRate;
        comparison.tokenEfficiency[v.id] = v.performanceMetrics.avgTokens;
      }
    });

    return { versions, comparison };
  }

  async recordEvaluation(result: Omit<EvaluationResult, 'id' | 'timestamp'>): Promise<EvaluationResult> {
    const evaluation: EvaluationResult = {
      ...result,
      id: `eval-${Date.now()}`,
      timestamp: new Date()
    };

    const evals = this.evaluations.get(result.promptVersionId) || [];
    evals.push(evaluation);
    this.evaluations.set(result.promptVersionId, evals);

    await this.updatePromptMetrics(result.promptVersionId);
    
    console.log(`📊 Evaluation recorded: Score ${result.score.toFixed(2)}`);
    return evaluation;
  }

  private async updatePromptMetrics(promptVersionId: string): Promise<void> {
    const version = this.promptVersions.get(promptVersionId);
    if (!version) return;

    const evals = this.evaluations.get(promptVersionId) || [];
    if (evals.length === 0) return;

    const metrics: PromptPerformanceMetrics = {
      totalRuns: evals.length,
      avgLatency: evals.reduce((sum, e) => sum + e.metrics.latency, 0) / evals.length,
      avgTokens: evals.reduce((sum, e) => sum + e.metrics.tokenEfficiency, 0) / evals.length,
      avgCost: 0,
      successRate: evals.filter(e => e.score >= 0.7).length / evals.length,
      userSatisfaction: evals.reduce((sum, e) => sum + e.score, 0) / evals.length
    };

    version.performanceMetrics = metrics;
    version.updatedAt = new Date();
    this.promptVersions.set(promptVersionId, version);
    await this.persistPromptVersion(version);
  }

  private async persistAlertRule(rule: AlertRule): Promise<void> {
    try {
      await db.insert(waiAlertRules).values({
        ruleId: rule.id,
        name: rule.name,
        condition: rule.condition,
        threshold: rule.threshold,
        severity: rule.severity,
        channels: rule.channels,
        isEnabled: rule.isEnabled,
        cooldownMinutes: rule.cooldownMinutes,
        lastTriggered: rule.lastTriggered
      }).onConflictDoUpdate({
        target: waiAlertRules.ruleId,
        set: {
          isEnabled: rule.isEnabled,
          lastTriggered: rule.lastTriggered
        }
      });
    } catch (error) {
      console.error('Failed to persist alert rule:', error);
    }
  }

  private async persistAlertFull(alert: Alert): Promise<void> {
    try {
      await db.insert(waiAlerts).values({
        alertId: alert.id,
        ruleId: alert.ruleId,
        severity: alert.severity,
        message: alert.message,
        value: alert.value,
        threshold: alert.threshold,
        acknowledged: alert.acknowledged,
        resolvedAt: alert.resolvedAt,
        createdAt: alert.timestamp
      }).onConflictDoUpdate({
        target: waiAlerts.alertId,
        set: {
          acknowledged: alert.acknowledged,
          resolvedAt: alert.resolvedAt
        }
      });
    } catch (error) {
      console.error('Failed to persist alert:', error);
    }
  }

  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    const alertRule: AlertRule = {
      ...rule,
      id: `alert-rule-${Date.now()}`
    };

    this.alertRules.set(alertRule.id, alertRule);
    await this.persistAlertRule(alertRule);
    console.log(`🔔 Alert rule created: ${rule.name}`);
    return alertRule;
  }

  async getAlertRules(): Promise<AlertRule[]> {
    return Array.from(this.alertRules.values());
  }

  private async checkAlertRules(event: TraceEvent): Promise<void> {
    const rules = Array.from(this.alertRules.values());
    for (const rule of rules) {
      if (!rule.isEnabled) continue;
      
      if (rule.lastTriggered) {
        const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownMinutes * 60000);
        if (new Date() < cooldownEnd) continue;
      }

      const shouldAlert = await this.evaluateAlertCondition(rule, event);
      if (shouldAlert) {
        await this.triggerAlert(rule, event);
      }
    }
  }

  private async evaluateAlertCondition(rule: AlertRule, event: TraceEvent): Promise<boolean> {
    const { condition, threshold } = rule;
    let value: number = 0;

    switch (condition.metric) {
      case 'latency':
        value = event.duration || 0;
        break;
      case 'error_rate':
        value = event.status === 'error' ? 1 : 0;
        break;
      case 'cost':
        value = event.cost?.totalCost || 0;
        break;
      case 'token_usage':
        value = event.tokens?.totalTokens || 0;
        break;
    }

    switch (condition.operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private async triggerAlert(rule: AlertRule, event: TraceEvent): Promise<void> {
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: `Alert: ${rule.name} triggered for ${event.name}`,
      value: event.duration || 0,
      threshold: rule.threshold,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(alert);
    rule.lastTriggered = new Date();
    this.alertRules.set(rule.id, rule);
    
    await this.persistAlertFull(alert);
    await this.persistAlertRule(rule);

    console.log(`🚨 Alert triggered: ${rule.name} (${rule.severity})`);
  }

  async getAlerts(options?: { severity?: string; acknowledged?: boolean; limit?: number }): Promise<Alert[]> {
    let filtered = this.alerts;

    if (options?.severity) {
      filtered = filtered.filter(a => a.severity === options.severity);
    }
    if (options?.acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === options.acknowledged);
    }

    filtered = filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      await this.persistAlertFull(alert);
    }
  }

  async getDashboardMetrics(timeRangeMinutes: number = 60): Promise<DashboardMetrics> {
    const cacheKey = `dashboard-${timeRangeMinutes}`;
    const cached = this.metricsCache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - 60000) {
      return cached.data;
    }

    const allEvents: TraceEvent[] = [];
    this.traces.forEach(events => allEvents.push(...events));

    const cutoff = new Date(Date.now() - timeRangeMinutes * 60000);
    const recentEvents = allEvents.filter(e => e.startTime >= cutoff);

    const successCount = recentEvents.filter(e => e.status === 'success').length;
    const errorCount = recentEvents.filter(e => e.status === 'error').length;
    const totalLatency = recentEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalTokens = recentEvents.reduce((sum, e) => sum + (e.tokens?.totalTokens || 0), 0);
    const totalCost = recentEvents.reduce((sum, e) => sum + (e.cost?.totalCost || 0), 0);

    const agentCounts = new Map<string, { count: number; totalLatency: number }>();
    const modelCounts = new Map<string, { count: number; totalCost: number }>();
    const providerCosts = new Map<string, number>();
    const hourCounts = new Map<string, number>();

    recentEvents.forEach(e => {
      if (e.metadata.agentId) {
        const current = agentCounts.get(e.metadata.agentId) || { count: 0, totalLatency: 0 };
        current.count++;
        current.totalLatency += e.duration || 0;
        agentCounts.set(e.metadata.agentId, current);
      }

      if (e.metadata.modelId) {
        const current = modelCounts.get(e.metadata.modelId) || { count: 0, totalCost: 0 };
        current.count++;
        current.totalCost += e.cost?.totalCost || 0;
        modelCounts.set(e.metadata.modelId, current);
      }

      if (e.metadata.providerId) {
        const current = providerCosts.get(e.metadata.providerId) || 0;
        providerCosts.set(e.metadata.providerId, current + (e.cost?.totalCost || 0));
      }

      const hour = e.startTime.getHours().toString().padStart(2, '0') + ':00';
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const metrics: DashboardMetrics = {
      totalTraces: recentEvents.length,
      successRate: recentEvents.length > 0 ? successCount / recentEvents.length : 0,
      avgLatency: recentEvents.length > 0 ? totalLatency / recentEvents.length : 0,
      totalTokens,
      totalCost,
      errorRate: recentEvents.length > 0 ? errorCount / recentEvents.length : 0,
      topAgents: Array.from(agentCounts.entries())
        .map(([agentId, data]) => ({
          agentId,
          count: data.count,
          avgLatency: data.totalLatency / data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topModels: Array.from(modelCounts.entries())
        .map(([modelId, data]) => ({
          modelId,
          count: data.count,
          avgCost: data.totalCost / data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      tracesByHour: Array.from(hourCounts.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
      costByProvider: Array.from(providerCosts.entries())
        .map(([provider, cost]) => ({ provider, cost }))
        .sort((a, b) => b.cost - a.cost)
    };

    this.metricsCache.set(cacheKey, { data: metrics, timestamp: Date.now() });
    return metrics;
  }

  async getTokenAnalytics(timeRangeMinutes: number = 1440): Promise<{
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    avgTokensPerRequest: number;
    tokensByModel: Record<string, number>;
    tokensByAgent: Record<string, number>;
    costBreakdown: {
      inputCost: number;
      outputCost: number;
      totalCost: number;
    };
  }> {
    const allEvents: TraceEvent[] = [];
    this.traces.forEach(events => allEvents.push(...events));

    const cutoff = new Date(Date.now() - timeRangeMinutes * 60000);
    const recentEvents = allEvents.filter(e => e.startTime >= cutoff && e.tokens);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let inputCost = 0;
    let outputCost = 0;
    const tokensByModel: Record<string, number> = {};
    const tokensByAgent: Record<string, number> = {};

    recentEvents.forEach(e => {
      if (e.tokens) {
        totalInputTokens += e.tokens.inputTokens;
        totalOutputTokens += e.tokens.outputTokens;
      }
      if (e.cost) {
        inputCost += e.cost.inputCost;
        outputCost += e.cost.outputCost;
      }
      if (e.metadata.modelId && e.tokens) {
        tokensByModel[e.metadata.modelId] = (tokensByModel[e.metadata.modelId] || 0) + e.tokens.totalTokens;
      }
      if (e.metadata.agentId && e.tokens) {
        tokensByAgent[e.metadata.agentId] = (tokensByAgent[e.metadata.agentId] || 0) + e.tokens.totalTokens;
      }
    });

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      avgTokensPerRequest: recentEvents.length > 0 ? (totalInputTokens + totalOutputTokens) / recentEvents.length : 0,
      tokensByModel,
      tokensByAgent,
      costBreakdown: {
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost
      }
    };
  }

  async getStats(): Promise<{
    totalTraces: number;
    totalEvents: number;
    promptVersions: number;
    activeAlertRules: number;
    unresolvedAlerts: number;
  }> {
    let totalEvents = 0;
    this.traces.forEach(events => totalEvents += events.length);

    return {
      totalTraces: this.traces.size,
      totalEvents,
      promptVersions: this.promptVersions.size,
      activeAlertRules: Array.from(this.alertRules.values()).filter(r => r.isEnabled).length,
      unresolvedAlerts: this.alerts.filter(a => !a.acknowledged).length
    };
  }
}

export const wizardSmithObservability = new WizardSmithObservability();
