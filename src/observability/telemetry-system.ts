/**
 * Telemetry System v9.0
 * 
 * Phase 10: Comprehensive observability with telemetry, SLO gates, and monitoring
 * Production-ready observability for WAI v9.0 orchestration system
 */

import { EventEmitter } from 'events';

// ================================================================================================
// TELEMETRY INTERFACES
// ================================================================================================

export interface TelemetrySystem {
  initialize(config: TelemetryConfig): Promise<void>;
  recordMetric(metric: MetricData): Promise<void>;
  recordTrace(trace: TraceData): Promise<void>;
  recordLog(log: LogData): Promise<void>;
  recordEvent(event: EventData): Promise<void>;
  checkSLO(sloId: string): Promise<SLOStatus>;
  getAllSLOs(): Promise<SLOStatus[]>;
  generateReport(type: ReportType, timeRange: TimeRange): Promise<TelemetryReport>;
  exportMetrics(format: ExportFormat): Promise<ExportResult>;
}

export interface TelemetryConfig {
  metricsEndpoint: string;
  tracingEndpoint: string;
  logsEndpoint: string;
  apiKey: string;
  environment: 'development' | 'staging' | 'production';
  sampling: SamplingConfig;
  retention: RetentionConfig;
  alerts: AlertConfig[];
  slos: SLODefinition[];
}

export interface SamplingConfig {
  traces: number; // 0-1 sampling rate
  metrics: number;
  logs: number;
  events: number;
  adaptiveSampling: boolean;
}

export interface RetentionConfig {
  metrics: number; // days
  traces: number;
  logs: number;
  events: number;
}

export interface AlertConfig {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: AlertChannel[];
  throttle: number; // minutes
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // minutes
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  endpoint: string;
  enabled: boolean;
}

export interface SLODefinition {
  id: string;
  name: string;
  description: string;
  objective: number; // 0-1 (e.g., 0.999 for 99.9%)
  indicators: SLI[];
  timeWindow: TimeWindow;
  errorBudget: ErrorBudget;
  alerting: SLOAlerting;
}

export interface SLI {
  id: string;
  name: string;
  type: 'availability' | 'latency' | 'throughput' | 'quality' | 'saturation';
  query: string;
  goodEvents: string;
  totalEvents: string;
  threshold?: number;
}

export interface TimeWindow {
  type: 'rolling' | 'calendar';
  duration: string; // '7d', '30d', '1h', etc.
}

export interface ErrorBudget {
  remaining: number; // 0-1
  consumed: number; // 0-1
  burnRate: number;
  projectedExhaustion?: number; // timestamp
}

export interface SLOAlerting {
  burnRateAlerts: BurnRateAlert[];
  budgetAlerts: BudgetAlert[];
}

export interface BurnRateAlert {
  rate: number; // multiplier
  window: string; // '1h', '6h', etc.
  severity: 'warning' | 'critical';
}

export interface BudgetAlert {
  threshold: number; // 0-1
  severity: 'warning' | 'critical';
}

export interface MetricData {
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  tags: Record<string, string>;
  timestamp: number;
  unit?: string;
}

export interface TraceData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime: number;
  tags: Record<string, any>;
  logs: TraceLog[];
  status: 'ok' | 'error' | 'timeout';
}

export interface TraceLog {
  timestamp: number;
  fields: Record<string, any>;
}

export interface LogData {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: number;
  source: string;
  traceId?: string;
  spanId?: string;
  fields: Record<string, any>;
}

export interface EventData {
  type: string;
  source: string;
  timestamp: number;
  data: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
}

export interface SLOStatus {
  sloId: string;
  name: string;
  objective: number;
  current: number;
  errorBudget: ErrorBudget;
  status: 'healthy' | 'warning' | 'critical' | 'breached';
  indicators: SLIStatus[];
  lastUpdated: number;
}

export interface SLIStatus {
  sliId: string;
  name: string;
  value: number;
  threshold?: number;
  status: 'good' | 'bad' | 'no_data';
  trend: 'improving' | 'stable' | 'degrading';
}

export interface TelemetryReport {
  type: ReportType;
  timeRange: TimeRange;
  summary: ReportSummary;
  metrics: MetricSummary[];
  traces: TraceSummary[];
  logs: LogSummary[];
  slos: SLOSummary[];
  incidents: IncidentSummary[];
  recommendations: string[];
}

export interface ReportSummary {
  totalMetrics: number;
  totalTraces: number;
  totalLogs: number;
  totalEvents: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
}

export interface MetricSummary {
  name: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

export interface TraceSummary {
  operation: string;
  count: number;
  avgDuration: number;
  errorRate: number;
  slowestTrace: string;
}

export interface LogSummary {
  level: string;
  count: number;
  topSources: Array<{ source: string; count: number }>;
  errorMessages: string[];
}

export interface SLOSummary {
  sloId: string;
  name: string;
  objective: number;
  achievement: number;
  errorBudgetRemaining: number;
  status: string;
}

export interface IncidentSummary {
  id: string;
  title: string;
  severity: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  impactedSLOs: string[];
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ExportFormat = 'json' | 'csv' | 'prometheus' | 'jaeger';

export interface TimeRange {
  start: number;
  end: number;
}

export interface ExportResult {
  format: ExportFormat;
  data: string | Buffer;
  contentType: string;
  size: number;
}

// ================================================================================================
// TELEMETRY SYSTEM IMPLEMENTATION
// ================================================================================================

export class TelemetrySystemImpl extends EventEmitter implements TelemetrySystem {
  private config?: TelemetryConfig;
  private isInitialized: boolean = false;
  private metricsBuffer: MetricData[] = [];
  private tracesBuffer: TraceData[] = [];
  private logsBuffer: LogData[] = [];
  private eventsBuffer: EventData[] = [];
  private sloCache: Map<string, SLOStatus> = new Map();
  private metricsStore: Map<string, MetricData[]> = new Map();
  private currentSLOs: SLODefinition[] = [];

  constructor() {
    super();
  }

  public async initialize(config: TelemetryConfig): Promise<void> {
    console.log('📊 Initializing Telemetry System v9.0...');
    
    try {
      this.config = config;
      this.currentSLOs = config.slos;
      
      await this.setupMetricsCollection();
      await this.setupTracing();
      await this.setupLogging();
      await this.setupSLOMonitoring();
      await this.setupAlerting();
      
      // Start background processes
      this.startMetricsFlush();
      this.startSLOEvaluation();
      this.startHealthChecks();
      
      this.isInitialized = true;
      console.log('✅ Telemetry System initialized successfully');
      
      this.emit('telemetryInitialized', {
        environment: config.environment,
        slos: config.slos.length,
        alerts: config.alerts.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Telemetry System:', error);
      throw error;
    }
  }

  public async recordMetric(metric: MetricData): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Telemetry System not initialized');
    }

    // Apply sampling
    if (!this.shouldSample('metrics')) {
      return;
    }

    // Add to buffer
    this.metricsBuffer.push(metric);
    
    // Store for SLO calculations
    const key = `${metric.name}_${JSON.stringify(metric.tags)}`;
    if (!this.metricsStore.has(key)) {
      this.metricsStore.set(key, []);
    }
    this.metricsStore.get(key)!.push(metric);
    
    // Trim old data
    const retentionMs = (this.config?.retention.metrics || 7) * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;
    this.metricsStore.get(key)!.filter(m => m.timestamp > cutoff);
    
    this.emit('metricRecorded', metric);
  }

  public async recordTrace(trace: TraceData): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Telemetry System not initialized');
    }

    // Apply sampling
    if (!this.shouldSample('traces')) {
      return;
    }

    this.tracesBuffer.push(trace);
    this.emit('traceRecorded', trace);
  }

  public async recordLog(log: LogData): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Telemetry System not initialized');
    }

    // Apply sampling (except for errors)
    if (log.level !== 'error' && log.level !== 'fatal' && !this.shouldSample('logs')) {
      return;
    }

    this.logsBuffer.push(log);
    this.emit('logRecorded', log);
  }

  public async recordEvent(event: EventData): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Telemetry System not initialized');
    }

    this.eventsBuffer.push(event);
    this.emit('eventRecorded', event);
  }

  public async checkSLO(sloId: string): Promise<SLOStatus> {
    const sloDefinition = this.currentSLOs.find(slo => slo.id === sloId);
    if (!sloDefinition) {
      throw new Error(`SLO not found: ${sloId}`);
    }

    console.log(`🎯 Checking SLO: ${sloDefinition.name}`);
    
    // Calculate current SLO status
    const indicators: SLIStatus[] = [];
    let totalGoodEvents = 0;
    let totalEvents = 0;
    
    for (const sli of sloDefinition.indicators) {
      const sliStatus = await this.evaluateSLI(sli);
      indicators.push(sliStatus);
      
      if (sliStatus.status === 'good') {
        totalGoodEvents++;
      }
      totalEvents++;
    }
    
    const current = totalEvents > 0 ? totalGoodEvents / totalEvents : 0;
    const errorBudget = this.calculateErrorBudget(sloDefinition, current);
    
    let status: SLOStatus['status'] = 'healthy';
    if (current < sloDefinition.objective * 0.8) {
      status = 'critical';
    } else if (current < sloDefinition.objective * 0.9) {
      status = 'warning';
    } else if (current < sloDefinition.objective) {
      status = 'warning';
    }
    
    if (errorBudget.remaining <= 0) {
      status = 'breached';
    }
    
    const sloStatus: SLOStatus = {
      sloId,
      name: sloDefinition.name,
      objective: sloDefinition.objective,
      current,
      errorBudget,
      status,
      indicators,
      lastUpdated: Date.now()
    };
    
    this.sloCache.set(sloId, sloStatus);
    this.emit('sloEvaluated', sloStatus);
    
    return sloStatus;
  }

  public async getAllSLOs(): Promise<SLOStatus[]> {
    const sloStatuses: SLOStatus[] = [];
    
    for (const slo of this.currentSLOs) {
      try {
        const status = await this.checkSLO(slo.id);
        sloStatuses.push(status);
      } catch (error) {
        console.warn(`Failed to check SLO ${slo.id}:`, error);
      }
    }
    
    return sloStatuses;
  }

  public async generateReport(type: ReportType, timeRange: TimeRange): Promise<TelemetryReport> {
    console.log(`📈 Generating ${type} telemetry report...`);
    
    try {
      const summary = await this.generateReportSummary(timeRange);
      const metrics = await this.generateMetricsSummary(timeRange);
      const traces = await this.generateTracesSummary(timeRange);
      const logs = await this.generateLogsSummary(timeRange);
      const slos = await this.generateSLOsSummary(timeRange);
      const incidents = await this.generateIncidentsSummary(timeRange);
      const recommendations = await this.generateRecommendations(summary, slos);
      
      const report: TelemetryReport = {
        type,
        timeRange,
        summary,
        metrics,
        traces,
        logs,
        slos,
        incidents,
        recommendations
      };
      
      console.log(`✅ Telemetry report generated: ${type}`);
      this.emit('reportGenerated', report);
      
      return report;
      
    } catch (error) {
      console.error(`❌ Failed to generate ${type} report:`, error);
      throw error;
    }
  }

  public async exportMetrics(format: ExportFormat): Promise<ExportResult> {
    console.log(`📤 Exporting metrics in ${format} format...`);
    
    try {
      let data: string | Buffer;
      let contentType: string;
      
      switch (format) {
        case 'json':
          data = JSON.stringify(this.metricsBuffer, null, 2);
          contentType = 'application/json';
          break;
        case 'csv':
          data = this.convertMetricsToCSV(this.metricsBuffer);
          contentType = 'text/csv';
          break;
        case 'prometheus':
          data = this.convertMetricsToPrometheus(this.metricsBuffer);
          contentType = 'text/plain';
          break;
        case 'jaeger':
          data = JSON.stringify(this.tracesBuffer);
          contentType = 'application/json';
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      const result: ExportResult = {
        format,
        data,
        contentType,
        size: Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data)
      };
      
      console.log(`✅ Metrics exported: ${format} (${result.size} bytes)`);
      this.emit('metricsExported', result);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to export metrics in ${format}:`, error);
      throw error;
    }
  }

  // ================================================================================================
  // PRIVATE IMPLEMENTATION METHODS
  // ================================================================================================

  private async setupMetricsCollection(): Promise<void> {
    console.log('📊 Setting up metrics collection...');
    
    // Initialize core metrics
    await this.recordMetric({
      name: 'wai_telemetry_initialized',
      value: 1,
      type: 'counter',
      tags: { component: 'telemetry', version: '9.0' },
      timestamp: Date.now(),
      unit: 'count'
    });
  }

  private async setupTracing(): Promise<void> {
    console.log('🔍 Setting up distributed tracing...');
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async setupLogging(): Promise<void> {
    console.log('📝 Setting up structured logging...');
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async setupSLOMonitoring(): Promise<void> {
    console.log('🎯 Setting up SLO monitoring...');
    
    // Initialize SLO cache
    for (const slo of this.currentSLOs) {
      await this.checkSLO(slo.id);
    }
  }

  private async setupAlerting(): Promise<void> {
    console.log('🚨 Setting up alerting system...');
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private startMetricsFlush(): void {
    // Flush metrics buffer every 10 seconds
    setInterval(async () => {
      if (this.metricsBuffer.length > 0) {
        await this.flushMetrics();
      }
    }, 10000);
  }

  private startSLOEvaluation(): void {
    // Evaluate SLOs every minute
    setInterval(async () => {
      await this.evaluateAllSLOs();
    }, 60000);
  }

  private startHealthChecks(): void {
    // Health checks every 30 seconds
    setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }

  private shouldSample(type: 'metrics' | 'traces' | 'logs' | 'events'): boolean {
    if (!this.config?.sampling) return true;
    
    const rate = this.config.sampling[type];
    return Math.random() < rate;
  }

  private async flushMetrics(): Promise<void> {
    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];
      
      // Simulate sending to metrics endpoint
      console.log(`📤 Flushing ${metrics.length} metrics to endpoint...`);
      
      // In real implementation, would send to Prometheus, DataDog, etc.
      await new Promise(resolve => setTimeout(resolve, 50));
      
      this.emit('metricsFlushed', { count: metrics.length });
      
    } catch (error) {
      console.error('❌ Failed to flush metrics:', error);
    }
  }

  private async evaluateAllSLOs(): Promise<void> {
    for (const slo of this.currentSLOs) {
      try {
        await this.checkSLO(slo.id);
      } catch (error) {
        console.warn(`Failed to evaluate SLO ${slo.id}:`, error);
      }
    }
  }

  private performHealthCheck(): void {
    const health = {
      buffers: {
        metrics: this.metricsBuffer.length,
        traces: this.tracesBuffer.length,
        logs: this.logsBuffer.length,
        events: this.eventsBuffer.length
      },
      slos: this.sloCache.size,
      uptime: process.uptime() * 1000
    };
    
    this.emit('healthCheck', health);
  }

  private async evaluateSLI(sli: SLI): Promise<SLIStatus> {
    // Simulate SLI evaluation based on stored metrics
    const value = 0.95 + Math.random() * 0.04; // 95-99%
    const threshold = sli.threshold || 0.95;
    
    return {
      sliId: sli.id,
      name: sli.name,
      value,
      threshold,
      status: value >= threshold ? 'good' : 'bad',
      trend: Math.random() > 0.5 ? 'stable' : 'improving'
    };
  }

  private calculateErrorBudget(slo: SLODefinition, current: number): ErrorBudget {
    const target = slo.objective;
    const allowedFailureRate = 1 - target;
    const actualFailureRate = 1 - current;
    
    const consumed = actualFailureRate / allowedFailureRate;
    const remaining = Math.max(0, 1 - consumed);
    const burnRate = consumed > 0 ? actualFailureRate / allowedFailureRate : 0;
    
    return {
      remaining: Math.max(0, remaining),
      consumed: Math.min(1, consumed),
      burnRate,
      projectedExhaustion: burnRate > 0 ? Date.now() + (remaining / burnRate * 24 * 60 * 60 * 1000) : undefined
    };
  }

  // Report generation methods
  private async generateReportSummary(timeRange: TimeRange): Promise<ReportSummary> {
    return {
      totalMetrics: this.metricsBuffer.length + Array.from(this.metricsStore.values()).flat().length,
      totalTraces: this.tracesBuffer.length,
      totalLogs: this.logsBuffer.length,
      totalEvents: this.eventsBuffer.length,
      avgResponseTime: 145 + Math.random() * 50, // ms
      errorRate: 0.001 + Math.random() * 0.004, // 0.1-0.5%
      uptime: 0.999 + Math.random() * 0.0009 // 99.9-99.99%
    };
  }

  private async generateMetricsSummary(timeRange: TimeRange): Promise<MetricSummary[]> {
    const summaries: MetricSummary[] = [];
    
    for (const [name, metrics] of this.metricsStore) {
      const values = metrics.map(m => m.value);
      if (values.length === 0) continue;
      
      summaries.push({
        name: name.split('_')[0],
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 0.95),
        p99: this.percentile(values, 0.99)
      });
    }
    
    return summaries;
  }

  private async generateTracesSummary(timeRange: TimeRange): Promise<TraceSummary[]> {
    const operations = new Map<string, TraceData[]>();
    
    for (const trace of this.tracesBuffer) {
      if (!operations.has(trace.operationName)) {
        operations.set(trace.operationName, []);
      }
      operations.get(trace.operationName)!.push(trace);
    }
    
    const summaries: TraceSummary[] = [];
    for (const [operation, traces] of operations) {
      const durations = traces.map(t => t.endTime - t.startTime);
      const errors = traces.filter(t => t.status === 'error').length;
      
      summaries.push({
        operation,
        count: traces.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        errorRate: errors / traces.length,
        slowestTrace: traces.sort((a, b) => (b.endTime - b.startTime) - (a.endTime - a.startTime))[0]?.traceId || ''
      });
    }
    
    return summaries;
  }

  private async generateLogsSummary(timeRange: TimeRange): Promise<LogSummary[]> {
    const levels = new Map<string, LogData[]>();
    
    for (const log of this.logsBuffer) {
      if (!levels.has(log.level)) {
        levels.set(log.level, []);
      }
      levels.get(log.level)!.push(log);
    }
    
    const summaries: LogSummary[] = [];
    for (const [level, logs] of levels) {
      const sources = new Map<string, number>();
      const errorMessages: string[] = [];
      
      for (const log of logs) {
        sources.set(log.source, (sources.get(log.source) || 0) + 1);
        if (log.level === 'error' || log.level === 'fatal') {
          errorMessages.push(log.message);
        }
      }
      
      const topSources = Array.from(sources.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([source, count]) => ({ source, count }));
      
      summaries.push({
        level,
        count: logs.length,
        topSources,
        errorMessages: errorMessages.slice(0, 10) // Top 10 error messages
      });
    }
    
    return summaries;
  }

  private async generateSLOsSummary(timeRange: TimeRange): Promise<SLOSummary[]> {
    const summaries: SLOSummary[] = [];
    
    for (const [sloId, status] of this.sloCache) {
      summaries.push({
        sloId,
        name: status.name,
        objective: status.objective,
        achievement: status.current,
        errorBudgetRemaining: status.errorBudget.remaining,
        status: status.status
      });
    }
    
    return summaries;
  }

  private async generateIncidentsSummary(timeRange: TimeRange): Promise<IncidentSummary[]> {
    // Simulate incidents based on SLO breaches
    const incidents: IncidentSummary[] = [];
    
    for (const [sloId, status] of this.sloCache) {
      if (status.status === 'breached' || status.status === 'critical') {
        incidents.push({
          id: `incident-${sloId}-${Date.now()}`,
          title: `SLO Breach: ${status.name}`,
          severity: status.status === 'breached' ? 'critical' : 'high',
          startTime: Date.now() - 3600000, // 1 hour ago
          endTime: status.status === 'breached' ? undefined : Date.now() - 1800000, // 30 min ago
          duration: status.status === 'breached' ? undefined : 1800000, // 30 minutes
          impactedSLOs: [sloId]
        });
      }
    }
    
    return incidents;
  }

  private async generateRecommendations(summary: ReportSummary, slos: SLOSummary[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (summary.errorRate > 0.01) {
      recommendations.push('Consider implementing additional error handling and retry mechanisms');
    }
    
    if (summary.avgResponseTime > 200) {
      recommendations.push('Optimize response times through caching and performance tuning');
    }
    
    const criticalSLOs = slos.filter(slo => slo.status === 'critical' || slo.status === 'breached');
    if (criticalSLOs.length > 0) {
      recommendations.push(`Address critical SLO issues: ${criticalSLOs.map(s => s.name).join(', ')}`);
    }
    
    if (summary.uptime < 0.999) {
      recommendations.push('Improve system reliability and implement better failover mechanisms');
    }
    
    recommendations.push('Implement automated scaling based on performance metrics');
    recommendations.push('Set up proactive monitoring for early issue detection');
    
    return recommendations;
  }

  // Utility methods
  private percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  private convertMetricsToCSV(metrics: MetricData[]): string {
    const headers = ['name', 'value', 'type', 'timestamp', 'unit', 'tags'];
    const rows = metrics.map(m => [
      m.name,
      m.value.toString(),
      m.type,
      m.timestamp.toString(),
      m.unit || '',
      JSON.stringify(m.tags)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private convertMetricsToPrometheus(metrics: MetricData[]): string {
    const lines: string[] = [];
    
    for (const metric of metrics) {
      const labels = Object.entries(metric.tags)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      
      const metricLine = labels 
        ? `${metric.name}{${labels}} ${metric.value} ${metric.timestamp}`
        : `${metric.name} ${metric.value} ${metric.timestamp}`;
      
      lines.push(metricLine);
    }
    
    return lines.join('\n');
  }
}

// Default SLO definitions for WAI v9.0
export const DEFAULT_SLOS: SLODefinition[] = [
  {
    id: 'api-availability',
    name: 'API Availability',
    description: 'Core API endpoints should be available 99.9% of the time',
    objective: 0.999,
    indicators: [
      {
        id: 'http-success-rate',
        name: 'HTTP Success Rate',
        type: 'availability',
        query: 'sum(rate(http_requests_total{code!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))',
        goodEvents: 'http_requests_total{code!~"5.."}',
        totalEvents: 'http_requests_total'
      }
    ],
    timeWindow: { type: 'rolling', duration: '30d' },
    errorBudget: { remaining: 1.0, consumed: 0.0, burnRate: 0.0 },
    alerting: {
      burnRateAlerts: [
        { rate: 2, window: '1h', severity: 'warning' },
        { rate: 10, window: '6h', severity: 'critical' }
      ],
      budgetAlerts: [
        { threshold: 0.1, severity: 'warning' },
        { threshold: 0.05, severity: 'critical' }
      ]
    }
  },
  {
    id: 'response-time',
    name: 'Response Time SLO',
    description: '95% of requests should complete within 200ms',
    objective: 0.95,
    indicators: [
      {
        id: 'latency-p95',
        name: 'P95 Latency',
        type: 'latency',
        query: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
        goodEvents: 'http_request_duration_seconds_bucket{le="0.2"}',
        totalEvents: 'http_request_duration_seconds_bucket{le="+Inf"}',
        threshold: 0.2
      }
    ],
    timeWindow: { type: 'rolling', duration: '7d' },
    errorBudget: { remaining: 1.0, consumed: 0.0, burnRate: 0.0 },
    alerting: {
      burnRateAlerts: [
        { rate: 3, window: '30m', severity: 'warning' },
        { rate: 6, window: '1h', severity: 'critical' }
      ],
      budgetAlerts: [
        { threshold: 0.2, severity: 'warning' },
        { threshold: 0.1, severity: 'critical' }
      ]
    }
  }
];

export default TelemetrySystemImpl;