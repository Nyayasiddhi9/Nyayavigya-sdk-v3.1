/**
 * Opik Monitoring and Observability System
 * Comprehensive observability for LLM applications and AI systems
 * Based on: https://github.com/comet-ml/opik
 * 
 * Features:
 * - Real-time performance monitoring
 * - Distributed tracing for AI workflows
 * - Cost tracking and optimization
 * - Quality metrics and evaluation
 * - Anomaly detection and alerting
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface OpikTrace {
  id: string;
  name: string;
  operation: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  parentTraceId?: string;
  spans: OpikSpan[];
  metadata: {
    model?: string;
    provider?: string;
    userId?: string;
    sessionId?: string;
    environment: string;
  };
  metrics: {
    tokensUsed?: number;
    cost?: number;
    latency: number;
    quality?: number;
    errors: OpikError[];
  };
  tags: string[];
}

export interface OpikSpan {
  id: string;
  traceId: string;
  name: string;
  operationType: 'llm' | 'embedding' | 'retrieval' | 'processing' | 'validation';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'completed' | 'failed';
  input?: any;
  output?: any;
  metadata: Record<string, any>;
  metrics: {
    tokens?: { input: number; output: number; total: number };
    cost?: number;
    latency: number;
    memory?: number;
    cpu?: number;
  };
}

export interface OpikError {
  id: string;
  type: string;
  message: string;
  stackTrace?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
}

export interface OpikMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  labels: Record<string, string>;
  aggregationType: 'sum' | 'avg' | 'count' | 'max' | 'min' | 'percentile';
}

export interface OpikAlert {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'warning' | 'error' | 'critical';
  status: 'active' | 'resolved' | 'suppressed';
  createdAt: Date;
  resolvedAt?: Date;
  description: string;
  actions: string[];
}

export interface OpikDashboard {
  id: string;
  name: string;
  widgets: OpikWidget[];
  filters: Record<string, any>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface OpikWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'heatmap';
  title: string;
  query: string;
  visualization: {
    chartType?: 'line' | 'bar' | 'pie' | 'scatter';
    groupBy?: string[];
    aggregations?: string[];
  };
}

export class OpikMonitoringSystem extends EventEmitter {
  private traces: Map<string, OpikTrace> = new Map();
  private spans: Map<string, OpikSpan> = new Map();
  private metrics: OpikMetric[] = [];
  private alerts: Map<string, OpikAlert> = new Map();
  private dashboards: Map<string, OpikDashboard> = new Map();
  
  private metricsCollectionInterval: NodeJS.Timeout | null = null;
  private alertsCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // Start metrics collection
    this.metricsCollectionInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 10000); // Every 10 seconds

    // Start alerts checking
    this.alertsCheckInterval = setInterval(() => {
      this.checkAlerts();
    }, 30000); // Every 30 seconds

    // Start cleanup of old data
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 300000); // Every 5 minutes

    // Create default dashboard
    this.createDefaultDashboard();

    console.log('📊 Opik Monitoring System initialized');
  }

  /**
   * Start a new trace for monitoring AI workflow
   */
  public startTrace(config: {
    name: string;
    operation: string;
    metadata?: Record<string, any>;
    tags?: string[];
  }): string {
    const trace: OpikTrace = {
      id: randomUUID(),
      name: config.name,
      operation: config.operation,
      startTime: new Date(),
      status: 'running',
      spans: [],
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        ...config.metadata
      },
      metrics: {
        latency: 0,
        errors: []
      },
      tags: config.tags || []
    };

    this.traces.set(trace.id, trace);
    this.emit('trace-started', trace);
    
    console.log(`🔍 Started trace: ${trace.name} (${trace.id})`);
    return trace.id;
  }

  /**
   * End a trace and calculate final metrics
   */
  public endTrace(traceId: string, status?: 'completed' | 'failed' | 'cancelled'): void {
    const trace = this.traces.get(traceId);
    if (!trace) {
      console.warn(`⚠️ Trace not found: ${traceId}`);
      return;
    }

    trace.endTime = new Date();
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime();
    trace.status = status || 'completed';
    trace.metrics.latency = trace.duration;

    // Calculate aggregate metrics from spans
    trace.metrics.tokensUsed = trace.spans.reduce((sum, span) => 
      sum + (span.metrics.tokens?.total || 0), 0
    );
    
    trace.metrics.cost = trace.spans.reduce((sum, span) => 
      sum + (span.metrics.cost || 0), 0
    );

    this.emit('trace-completed', trace);
    console.log(`✅ Trace completed: ${trace.name} (${trace.duration}ms)`);
  }

  /**
   * Start a new span within a trace
   */
  public startSpan(
    traceId: string,
    name: string,
    operationType: OpikSpan['operationType'],
    metadata?: Record<string, any>
  ): string {
    const trace = this.traces.get(traceId);
    if (!trace) {
      throw new Error(`Trace not found: ${traceId}`);
    }

    const span: OpikSpan = {
      id: randomUUID(),
      traceId,
      name,
      operationType,
      startTime: new Date(),
      status: 'running',
      metadata: metadata || {},
      metrics: {
        latency: 0
      }
    };

    this.spans.set(span.id, span);
    trace.spans.push(span);

    console.log(`📏 Started span: ${name} (${operationType})`);
    return span.id;
  }

  /**
   * End a span and record metrics
   */
  public endSpan(
    spanId: string,
    output?: any,
    metrics?: {
      tokens?: { input: number; output: number };
      cost?: number;
      quality?: number;
    }
  ): void {
    const span = this.spans.get(spanId);
    if (!span) {
      console.warn(`⚠️ Span not found: ${spanId}`);
      return;
    }

    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = 'completed';
    span.output = output;
    span.metrics.latency = span.duration;

    if (metrics) {
      if (metrics.tokens) {
        span.metrics.tokens = {
          input: metrics.tokens.input,
          output: metrics.tokens.output,
          total: metrics.tokens.input + metrics.tokens.output
        };
      }
      span.metrics.cost = metrics.cost;
    }

    console.log(`✅ Span completed: ${span.name} (${span.duration}ms)`);
    this.emit('span-completed', span);
  }

  /**
   * Record an error in the monitoring system
   */
  public recordError(
    traceId: string,
    error: {
      type: string;
      message: string;
      severity?: OpikError['severity'];
      context?: Record<string, any>;
    }
  ): void {
    const opikError: OpikError = {
      id: randomUUID(),
      type: error.type,
      message: error.message,
      timestamp: new Date(),
      severity: error.severity || 'medium',
      context: error.context || {}
    };

    const trace = this.traces.get(traceId);
    if (trace) {
      trace.metrics.errors.push(opikError);
      
      if (opikError.severity === 'critical') {
        trace.status = 'failed';
      }
    }

    this.emit('error-recorded', { traceId, error: opikError });
    console.log(`❌ Error recorded: ${error.type} - ${error.message}`);
  }

  /**
   * Record custom metrics
   */
  public recordMetric(
    name: string,
    value: number,
    unit: string = 'count',
    labels: Record<string, string> = {}
  ): void {
    const metric: OpikMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      labels,
      aggregationType: 'avg'
    };

    this.metrics.push(metric);
    this.emit('metric-recorded', metric);

    // Keep only recent metrics to avoid memory bloat
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  /**
   * Monitor LLM call with automatic span creation
   */
  public async monitorLLMCall<T>(
    traceId: string,
    operation: string,
    model: string,
    prompt: string,
    call: () => Promise<T>
  ): Promise<T> {
    const spanId = this.startSpan(traceId, `LLM Call: ${model}`, 'llm', {
      model,
      promptLength: prompt.length
    });

    const startTime = Date.now();
    let tokens = { input: 0, output: 0 };
    let cost = 0;

    try {
      const result = await call();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Estimate tokens (simplified)
      tokens.input = Math.ceil(prompt.length / 4);
      if (typeof result === 'string') {
        tokens.output = Math.ceil(result.length / 4);
      }

      // Estimate cost based on model and tokens
      cost = this.estimateCost(model, tokens.input + tokens.output);

      this.endSpan(spanId, result, { tokens, cost });
      
      // Record performance metric
      this.recordMetric(`llm.latency.${model}`, duration, 'ms', { 
        operation,
        model 
      });
      
      this.recordMetric(`llm.tokens.${model}`, tokens.input + tokens.output, 'tokens', {
        operation,
        model
      });

      return result;
    } catch (error) {
      this.recordError(traceId, {
        type: 'LLMCallError',
        message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'high',
        context: { model, operation, promptLength: prompt.length }
      });

      // Still end the span to maintain trace integrity
      const span = this.spans.get(spanId);
      if (span) {
        span.status = 'failed';
        span.endTime = new Date();
        span.duration = Date.now() - startTime;
      }

      throw error;
    }
  }

  /**
   * Get performance analytics for a time period
   */
  public getAnalytics(timeRange: { start: Date; end: Date }) {
    const tracesInRange = Array.from(this.traces.values()).filter(
      trace => trace.startTime >= timeRange.start && trace.startTime <= timeRange.end
    );

    const completedTraces = tracesInRange.filter(t => t.status === 'completed');
    const failedTraces = tracesInRange.filter(t => t.status === 'failed');

    const totalLatency = completedTraces.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalTokens = completedTraces.reduce((sum, t) => sum + (t.metrics.tokensUsed || 0), 0);
    const totalCost = completedTraces.reduce((sum, t) => sum + (t.metrics.cost || 0), 0);

    const errorsByType = tracesInRange
      .flatMap(t => t.metrics.errors)
      .reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      summary: {
        totalTraces: tracesInRange.length,
        completedTraces: completedTraces.length,
        failedTraces: failedTraces.length,
        successRate: tracesInRange.length > 0 
          ? (completedTraces.length / tracesInRange.length) * 100 
          : 0
      },
      performance: {
        averageLatency: completedTraces.length > 0 
          ? totalLatency / completedTraces.length 
          : 0,
        totalTokensUsed: totalTokens,
        totalCost: totalCost,
        averageCostPerTrace: completedTraces.length > 0 
          ? totalCost / completedTraces.length 
          : 0
      },
      errors: {
        totalErrors: tracesInRange.reduce((sum, t) => sum + t.metrics.errors.length, 0),
        errorsByType,
        errorRate: tracesInRange.length > 0 
          ? (failedTraces.length / tracesInRange.length) * 100 
          : 0
      },
      topOperations: this.getTopOperations(tracesInRange),
      modelUsage: this.getModelUsageStats(tracesInRange)
    };
  }

  /**
   * Create monitoring dashboard
   */
  public createDashboard(config: {
    name: string;
    widgets: Omit<OpikWidget, 'id'>[];
  }): string {
    const dashboard: OpikDashboard = {
      id: randomUUID(),
      name: config.name,
      widgets: config.widgets.map(w => ({ ...w, id: randomUUID() })),
      filters: {},
      timeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date()
      }
    };

    this.dashboards.set(dashboard.id, dashboard);
    console.log(`📊 Dashboard created: ${dashboard.name}`);
    
    return dashboard.id;
  }

  /**
   * Create alert for monitoring thresholds
   */
  public createAlert(config: {
    name: string;
    condition: string;
    threshold: number;
    severity: OpikAlert['severity'];
    description: string;
    actions?: string[];
  }): string {
    const alert: OpikAlert = {
      id: randomUUID(),
      name: config.name,
      condition: config.condition,
      threshold: config.threshold,
      severity: config.severity,
      status: 'active',
      createdAt: new Date(),
      description: config.description,
      actions: config.actions || []
    };

    this.alerts.set(alert.id, alert);
    console.log(`🚨 Alert created: ${alert.name}`);
    
    return alert.id;
  }

  /**
   * Check alerts against current metrics
   */
  private checkAlerts(): void {
    const now = new Date();
    const last30Minutes = new Date(now.getTime() - 30 * 60 * 1000);
    
    const recentTraces = Array.from(this.traces.values()).filter(
      t => t.startTime >= last30Minutes
    );

    for (const [alertId, alert] of this.alerts) {
      if (alert.status !== 'active') continue;

      let triggered = false;

      switch (alert.condition) {
        case 'error_rate':
          const errorRate = this.calculateErrorRate(recentTraces);
          triggered = errorRate > alert.threshold;
          break;

        case 'avg_latency':
          const avgLatency = this.calculateAverageLatency(recentTraces);
          triggered = avgLatency > alert.threshold;
          break;

        case 'failed_requests':
          const failedRequests = recentTraces.filter(t => t.status === 'failed').length;
          triggered = failedRequests > alert.threshold;
          break;

        case 'cost_per_hour':
          const costPerHour = this.calculateCostPerHour(recentTraces);
          triggered = costPerHour > alert.threshold;
          break;
      }

      if (triggered) {
        this.triggerAlert(alert);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: OpikAlert): void {
    console.log(`🚨 ALERT TRIGGERED: ${alert.name} - ${alert.description}`);
    
    this.emit('alert-triggered', alert);

    // Execute alert actions
    for (const action of alert.actions) {
      this.executeAlertAction(action, alert);
    }
  }

  /**
   * Execute alert action
   */
  private executeAlertAction(action: string, alert: OpikAlert): void {
    switch (action) {
      case 'log':
        console.log(`🚨 Alert: ${alert.name} - ${alert.description}`);
        break;
      case 'email':
        console.log(`📧 Email notification sent for alert: ${alert.name}`);
        break;
      case 'slack':
        console.log(`💬 Slack notification sent for alert: ${alert.name}`);
        break;
      case 'webhook':
        console.log(`🔗 Webhook triggered for alert: ${alert.name}`);
        break;
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const now = new Date();
    
    // Memory usage
    const memUsage = process.memoryUsage();
    this.recordMetric('system.memory.used', memUsage.heapUsed, 'bytes');
    this.recordMetric('system.memory.total', memUsage.heapTotal, 'bytes');

    // Active traces
    this.recordMetric('opik.traces.active', 
      Array.from(this.traces.values()).filter(t => t.status === 'running').length
    );

    // Total traces
    this.recordMetric('opik.traces.total', this.traces.size);
  }

  /**
   * Helper methods for calculations
   */
  private calculateErrorRate(traces: OpikTrace[]): number {
    if (traces.length === 0) return 0;
    const failedTraces = traces.filter(t => t.status === 'failed').length;
    return (failedTraces / traces.length) * 100;
  }

  private calculateAverageLatency(traces: OpikTrace[]): number {
    const completedTraces = traces.filter(t => t.duration !== undefined);
    if (completedTraces.length === 0) return 0;
    
    const totalLatency = completedTraces.reduce((sum, t) => sum + t.duration!, 0);
    return totalLatency / completedTraces.length;
  }

  private calculateCostPerHour(traces: OpikTrace[]): number {
    const totalCost = traces.reduce((sum, t) => sum + (t.metrics.cost || 0), 0);
    const hours = traces.length > 0 ? 0.5 : 0; // Last 30 minutes = 0.5 hours
    return hours > 0 ? totalCost / hours : 0;
  }

  private estimateCost(model: string, tokens: number): number {
    // Simplified cost estimation (per 1K tokens)
    const costPer1K: Record<string, number> = {
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.002,
      'claude-3-opus': 0.015,
      'claude-3-sonnet': 0.003,
      'gemini-pro': 0.00025
    };

    const baseCost = costPer1K[model] || 0.001; // Default cost
    return (tokens / 1000) * baseCost;
  }

  private getTopOperations(traces: OpikTrace[]) {
    const operationCounts = traces.reduce((acc, trace) => {
      acc[trace.operation] = (acc[trace.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(operationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([operation, count]) => ({ operation, count }));
  }

  private getModelUsageStats(traces: OpikTrace[]) {
    const modelStats = traces.reduce((acc, trace) => {
      const model = trace.metadata.model || 'unknown';
      if (!acc[model]) {
        acc[model] = { requests: 0, totalTokens: 0, totalCost: 0 };
      }
      acc[model].requests++;
      acc[model].totalTokens += trace.metrics.tokensUsed || 0;
      acc[model].totalCost += trace.metrics.cost || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(modelStats).map(([model, stats]) => ({
      model,
      ...stats
    }));
  }

  private createDefaultDashboard(): void {
    this.createDashboard({
      name: 'AI Operations Overview',
      widgets: [
        {
          type: 'chart',
          title: 'Request Volume',
          query: 'traces.count by time',
          visualization: { chartType: 'line' }
        },
        {
          type: 'metric',
          title: 'Average Latency',
          query: 'traces.latency.avg',
          visualization: {}
        },
        {
          type: 'chart',
          title: 'Error Rate',
          query: 'traces.error_rate by time',
          visualization: { chartType: 'line' }
        },
        {
          type: 'table',
          title: 'Top Operations',
          query: 'traces.operation.top',
          visualization: {}
        }
      ]
    });
  }

  private performCleanup(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Clean old traces
    let cleanedTraces = 0;
    for (const [traceId, trace] of this.traces) {
      if (trace.startTime < cutoffTime && trace.status !== 'running') {
        this.traces.delete(traceId);
        cleanedTraces++;
      }
    }

    // Clean old spans
    let cleanedSpans = 0;
    for (const [spanId, span] of this.spans) {
      if (!this.traces.has(span.traceId)) {
        this.spans.delete(spanId);
        cleanedSpans++;
      }
    }

    // Clean old metrics
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    if (cleanedTraces > 0 || cleanedSpans > 0) {
      console.log(`🧹 Cleanup: ${cleanedTraces} traces, ${cleanedSpans} spans removed`);
    }
  }

  /**
   * Get monitoring system status
   */
  public getSystemStatus() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return {
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        tracesActive: Array.from(this.traces.values()).filter(t => t.status === 'running').length,
        tracesTotal: this.traces.size,
        spansTotal: this.spans.size,
        alertsActive: Array.from(this.alerts.values()).filter(a => a.status === 'active').length
      },
      analytics: this.getAnalytics({ start: last24Hours, end: now })
    };
  }

  /**
   * Shutdown monitoring system
   */
  public shutdown(): void {
    if (this.metricsCollectionInterval) clearInterval(this.metricsCollectionInterval);
    if (this.alertsCheckInterval) clearInterval(this.alertsCheckInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    
    console.log('🔴 Opik Monitoring System shutdown');
  }
}

// Singleton instance for global access
export const opikMonitoring = new OpikMonitoringSystem();

// Default export
export default opikMonitoring;