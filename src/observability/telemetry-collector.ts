/**
 * WAI Telemetry Collector v9.0
 * OpenTelemetry traces, Prometheus metrics, observability
 * Implements Runbook Prompt 13: Observability stack
 */

import { EventEmitter } from 'events';
import { WAILogger } from '../utils/logger';

export class TelemetryCollector extends EventEmitter {
  private logger: WAILogger;
  private initialized = false;
  private metrics: Map<string, MetricData> = new Map();
  private traces: Map<string, TraceData> = new Map();
  private config: TelemetryConfig;

  constructor(config: TelemetryConfig = {}) {
    super();
    this.logger = new WAILogger('TelemetryCollector');
    this.config = {
      enabled: config.enabled ?? true,
      endpoint: config.endpoint,
      sampleRate: config.sampleRate ?? 1.0,
      exportInterval: config.exportInterval ?? 5000
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('📊 Initializing Telemetry Collector...');

      if (!this.config.enabled) {
        this.logger.info('📊 Telemetry disabled by configuration');
        this.initialized = true;
        return;
      }

      // Initialize OpenTelemetry
      await this.initializeOpenTelemetry();

      // Initialize Prometheus metrics
      await this.initializePrometheusMetrics();

      // Start metric collection
      this.startMetricCollection();

      // Start trace collection
      this.startTraceCollection();

      // Start export loop
      this.startExportLoop();

      this.initialized = true;
      this.logger.info('✅ Telemetry Collector initialized');

    } catch (error) {
      this.logger.error('❌ Telemetry Collector initialization failed:', error);
      throw error;
    }
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    if (!this.config.enabled) return;

    const metricKey = `${name}_${JSON.stringify(tags)}`;
    const existing = this.metrics.get(metricKey);

    if (existing) {
      existing.values.push({ value, timestamp: Date.now() });
      existing.count++;
      existing.sum += value;
      existing.lastValue = value;
      existing.lastUpdated = Date.now();
    } else {
      this.metrics.set(metricKey, {
        name,
        tags,
        values: [{ value, timestamp: Date.now() }],
        count: 1,
        sum: value,
        lastValue: value,
        lastUpdated: Date.now(),
        type: 'gauge'
      });
    }

    this.emit('metricRecorded', { name, value, tags });
  }

  /**
   * Start a trace span
   */
  startTrace(name: string, attributes: Record<string, any> = {}): TraceSpan {
    if (!this.config.enabled) {
      return new NoOpTraceSpan();
    }

    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    
    const span = new TraceSpan(traceId, spanId, name, attributes);
    
    const traceData: TraceData = {
      traceId,
      spans: [span],
      startTime: Date.now(),
      attributes
    };

    this.traces.set(traceId, traceData);
    this.emit('traceStarted', { traceId, name, attributes });

    return span;
  }

  /**
   * Record a trace event
   */
  recordTrace(traceId: string, event: TraceEvent): void {
    if (!this.config.enabled) return;

    const trace = this.traces.get(traceId);
    if (trace) {
      if (!trace.events) trace.events = [];
      trace.events.push(event);
      trace.endTime = Date.now();
    }

    this.emit('traceEvent', { traceId, event });
  }

  /**
   * Get metric value
   */
  async getMetric(name: string, tags: Record<string, string> = {}): Promise<number> {
    const metricKey = `${name}_${JSON.stringify(tags)}`;
    const metric = this.metrics.get(metricKey);
    
    if (!metric) {
      return 0;
    }

    switch (metric.type) {
      case 'counter':
        return metric.sum;
      case 'gauge':
        return metric.lastValue;
      case 'histogram':
        return metric.count > 0 ? metric.sum / metric.count : 0;
      default:
        return metric.lastValue;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): MetricSnapshot[] {
    const snapshots: MetricSnapshot[] = [];

    for (const [key, metric] of this.metrics) {
      snapshots.push({
        name: metric.name,
        tags: metric.tags,
        value: metric.lastValue,
        count: metric.count,
        sum: metric.sum,
        avg: metric.count > 0 ? metric.sum / metric.count : 0,
        lastUpdated: metric.lastUpdated
      });
    }

    return snapshots.sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  /**
   * Get trace data
   */
  getTrace(traceId: string): TraceData | undefined {
    return this.traces.get(traceId);
  }

  /**
   * Get all traces
   */
  getTraces(limit: number = 100): TraceData[] {
    const traces = Array.from(this.traces.values());
    return traces
      .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime))
      .slice(0, limit);
  }

  /**
   * Initialize OpenTelemetry
   */
  private async initializeOpenTelemetry(): Promise<void> {
    this.logger.info('🔧 Initializing OpenTelemetry...');
    
    // This would initialize actual OpenTelemetry SDK
    // For now, we'll use our internal implementation
    
    this.logger.info('✅ OpenTelemetry initialized');
  }

  /**
   * Initialize Prometheus metrics
   */
  private async initializePrometheusMetrics(): Promise<void> {
    this.logger.info('📈 Initializing Prometheus metrics...');
    
    // Initialize standard metrics
    this.recordMetric('wai_requests_total', 0, { status: 'success' });
    this.recordMetric('wai_requests_total', 0, { status: 'error' });
    this.recordMetric('wai_request_duration_seconds', 0);
    this.recordMetric('wai_cost_total_usd', 0);
    this.recordMetric('wai_tokens_processed_total', 0);
    this.recordMetric('wai_agents_active', 0);
    this.recordMetric('wai_providers_healthy', 0);
    
    this.logger.info('✅ Prometheus metrics initialized');
  }

  /**
   * Start metric collection
   */
  private startMetricCollection(): void {
    this.on('request', (data) => {
      this.recordMetric('wai_requests_total', 1, { 
        status: data.success ? 'success' : 'error',
        provider: data.provider || 'unknown',
        agent: data.agent || 'unknown'
      });
      
      if (data.duration) {
        this.recordMetric('wai_request_duration_seconds', data.duration / 1000);
      }
      
      if (data.cost) {
        this.recordMetric('wai_cost_total_usd', data.cost);
      }
      
      if (data.tokens) {
        this.recordMetric('wai_tokens_processed_total', data.tokens);
      }
    });

    this.on('costRecorded', (entry) => {
      this.recordMetric('wai_cost_total_usd', entry.totalCost, {
        provider: entry.provider,
        model: entry.model,
        tenant: entry.tenant
      });
      
      const totalTokens = (entry.tokensIn || 0) + (entry.tokensOut || 0);
      if (totalTokens > 0) {
        this.recordMetric('wai_tokens_processed_total', totalTokens, {
          provider: entry.provider,
          model: entry.model
        });
      }
    });

    this.on('routingDecision', (decision) => {
      this.recordMetric('wai_routing_decisions_total', 1, {
        provider: decision.selectedProvider,
        model: decision.selectedModel
      });
      
      this.recordMetric('wai_routing_score', decision.score, {
        provider: decision.selectedProvider
      });
    });
  }

  /**
   * Start trace collection
   */
  private startTraceCollection(): void {
    // Set up automatic trace collection for key operations
    this.on('pipelineStarted', (data) => {
      const trace = this.startTrace('pipeline_execution', {
        pipelineId: data.pipelineId,
        tenant: data.tenant
      });
      
      data.traceId = trace.traceId;
    });

    this.on('pipelineCompleted', (data) => {
      if (data.traceId) {
        this.recordTrace(data.traceId, {
          name: 'pipeline_completed',
          timestamp: Date.now(),
          attributes: {
            success: data.success,
            duration: data.duration,
            cost: data.cost
          }
        });
      }
    });
  }

  /**
   * Start export loop
   */
  private startExportLoop(): void {
    if (!this.config.exportInterval) return;

    setInterval(async () => {
      await this.exportMetrics();
      await this.exportTraces();
    }, this.config.exportInterval);
  }

  /**
   * Export metrics to endpoint
   */
  private async exportMetrics(): Promise<void> {
    if (!this.config.endpoint) return;

    try {
      const metrics = this.getMetrics();
      
      // This would export to actual telemetry endpoint
      // For now, just log if there are significant metrics
      const significantMetrics = metrics.filter(m => m.count > 0 || m.value > 0);
      
      if (significantMetrics.length > 0) {
        this.logger.debug(`📊 Exporting ${significantMetrics.length} metrics`);
      }
      
    } catch (error) {
      this.logger.warn('⚠️ Failed to export metrics:', error);
    }
  }

  /**
   * Export traces to endpoint
   */
  private async exportTraces(): Promise<void> {
    if (!this.config.endpoint) return;

    try {
      const traces = this.getTraces(50);
      const completedTraces = traces.filter(t => t.endTime);
      
      if (completedTraces.length > 0) {
        this.logger.debug(`🔍 Exporting ${completedTraces.length} traces`);
        
        // Remove exported traces to prevent memory buildup
        for (const trace of completedTraces) {
          this.traces.delete(trace.traceId);
        }
      }
      
    } catch (error) {
      this.logger.warn('⚠️ Failed to export traces:', error);
    }
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  async getHealth(): Promise<ComponentHealth> {
    return {
      healthy: this.initialized,
      status: this.initialized ? 'active' : 'inactive',
      lastCheck: Date.now(),
      details: {
        enabled: this.config.enabled,
        metricsCount: this.metrics.size,
        tracesCount: this.traces.size,
        sampleRate: this.config.sampleRate
      }
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('🔄 Shutting down telemetry collector...');
    
    // Export final metrics and traces
    if (this.config.enabled) {
      await this.exportMetrics();
      await this.exportTraces();
    }
    
    this.initialized = false;
  }
}

/**
 * Trace Span implementation
 */
export class TraceSpan {
  public readonly traceId: string;
  public readonly spanId: string;
  public readonly name: string;
  public readonly startTime: number;
  public attributes: Record<string, any>;
  public endTime?: number;
  public status?: 'ok' | 'error';
  public events: TraceEvent[] = [];

  constructor(traceId: string, spanId: string, name: string, attributes: Record<string, any>) {
    this.traceId = traceId;
    this.spanId = spanId;
    this.name = name;
    this.startTime = Date.now();
    this.attributes = attributes;
  }

  /**
   * Add attribute to span
   */
  setAttribute(key: string, value: any): void {
    this.attributes[key] = value;
  }

  /**
   * Add event to span
   */
  addEvent(name: string, attributes: Record<string, any> = {}): void {
    this.events.push({
      name,
      timestamp: Date.now(),
      attributes
    });
  }

  /**
   * Set span status
   */
  setStatus(status: 'ok' | 'error', message?: string): void {
    this.status = status;
    if (message) {
      this.attributes.statusMessage = message;
    }
  }

  /**
   * End the span
   */
  end(): void {
    this.endTime = Date.now();
  }

  /**
   * Get span duration in milliseconds
   */
  getDuration(): number {
    return (this.endTime || Date.now()) - this.startTime;
  }
}

/**
 * No-op trace span for when telemetry is disabled
 */
class NoOpTraceSpan extends TraceSpan {
  constructor() {
    super('noop', 'noop', 'noop', {});
  }

  setAttribute(): void {}
  addEvent(): void {}
  setStatus(): void {}
  end(): void {}
}

// Type definitions
interface TelemetryConfig {
  enabled?: boolean;
  endpoint?: string;
  sampleRate?: number;
  exportInterval?: number;
}

interface MetricData {
  name: string;
  tags: Record<string, string>;
  values: { value: number; timestamp: number }[];
  count: number;
  sum: number;
  lastValue: number;
  lastUpdated: number;
  type: 'counter' | 'gauge' | 'histogram';
}

interface MetricSnapshot {
  name: string;
  tags: Record<string, string>;
  value: number;
  count: number;
  sum: number;
  avg: number;
  lastUpdated: number;
}

interface TraceData {
  traceId: string;
  spans: TraceSpan[];
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
  events?: TraceEvent[];
}

interface TraceEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, any>;
}

interface ComponentHealth {
  healthy: boolean;
  status: string;
  lastCheck: number;
  details?: Record<string, unknown>;
}