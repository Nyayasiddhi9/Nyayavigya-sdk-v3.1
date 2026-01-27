/**
 * WAI Unified Logging System
 * 
 * Centralized logging for the WAI orchestration system replacing all console.log statements
 * with structured, trackable logging with proper levels and context.
 */

import { EventEmitter } from 'events';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  integration?: string;
  message: string;
  context?: any;
  metrics?: {
    duration?: number;
    cost?: number;
    quality?: number;
    tokens?: number;
  };
  traceId?: string;
  userId?: string;
  sessionId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableMetrics: boolean;
  maxFileSize: number;
  retentionDays: number;
}

export class WAILogger extends EventEmitter {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private metricsBuffer: Map<string, any> = new Map();

  constructor(config: Partial<LoggerConfig> = {}) {
    super();
    
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableMetrics: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      retentionDays: 7,
      ...config
    };

    this.startFlushInterval();
  }

  /**
   * Log debug information
   */
  debug(component: string, message: string, context?: any, integration?: string): void {
    this.log(LogLevel.DEBUG, component, message, context, integration);
  }

  /**
   * Log general information
   */
  info(component: string, message: string, context?: any, integration?: string): void {
    this.log(LogLevel.INFO, component, message, context, integration);
  }

  /**
   * Log warnings
   */
  warn(component: string, message: string, context?: any, integration?: string): void {
    this.log(LogLevel.WARN, component, message, context, integration);
  }

  /**
   * Log errors
   */
  error(component: string, message: string, context?: any, integration?: string): void {
    this.log(LogLevel.ERROR, component, message, context, integration);
  }

  /**
   * Log critical errors
   */
  critical(component: string, message: string, context?: any, integration?: string): void {
    this.log(LogLevel.CRITICAL, component, message, context, integration);
  }

  /**
   * Log orchestration events with metrics
   */
  orchestration(event: string, data: any, metrics?: any): void {
    this.log(LogLevel.INFO, 'orchestration', event, {
      ...data,
      eventType: 'orchestration'
    }, undefined, metrics);
  }

  /**
   * Log integration events
   */
  integration(integrationName: string, event: string, data: any, metrics?: any): void {
    this.log(LogLevel.INFO, 'integration', event, {
      ...data,
      eventType: 'integration'
    }, integrationName, metrics);
  }

  /**
   * Log performance metrics
   */
  performance(component: string, operation: string, duration: number, additional?: any): void {
    this.log(LogLevel.INFO, component, `Performance: ${operation}`, {
      operation,
      ...additional
    }, undefined, {
      duration,
      ...additional
    });
  }

  /**
   * Log cost tracking
   */
  cost(component: string, operation: string, cost: number, provider?: string, tokens?: number): void {
    this.log(LogLevel.INFO, component, `Cost: ${operation}`, {
      operation,
      provider,
      eventType: 'cost'
    }, undefined, {
      cost,
      tokens
    });
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel, 
    component: string, 
    message: string, 
    context?: any, 
    integration?: string,
    metrics?: any
  ): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component,
      integration,
      message,
      context,
      metrics,
      traceId: this.generateTraceId(),
      userId: context?.userId,
      sessionId: context?.sessionId
    };

    this.logBuffer.push(entry);

    // Emit event for real-time processing
    this.emit('log', entry);

    // Console output if enabled
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    // Collect metrics if enabled
    if (this.config.enableMetrics && metrics) {
      this.collectMetrics(component, integration, metrics);
    }

    // Flush buffer if it gets too large
    if (this.logBuffer.length > 1000) {
      this.flush();
    }
  }

  /**
   * Write formatted log to console
   */
  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const integration = entry.integration ? `[${entry.integration}]` : '';
    const context = entry.context ? ` - ${JSON.stringify(entry.context)}` : '';
    const metrics = entry.metrics ? ` | Metrics: ${JSON.stringify(entry.metrics)}` : '';
    
    const logMessage = `${timestamp} [${levelName}] ${entry.component}${integration}: ${entry.message}${context}${metrics}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Collect metrics for analysis
   */
  private collectMetrics(component: string, integration: string | undefined, metrics: any): void {
    const key = integration ? `${component}:${integration}` : component;
    
    if (!this.metricsBuffer.has(key)) {
      this.metricsBuffer.set(key, {
        count: 0,
        totalDuration: 0,
        totalCost: 0,
        totalTokens: 0,
        avgQuality: 0,
        errors: 0
      });
    }

    const current = this.metricsBuffer.get(key)!;
    current.count++;
    
    if (metrics.duration) current.totalDuration += metrics.duration;
    if (metrics.cost) current.totalCost += metrics.cost;
    if (metrics.tokens) current.totalTokens += metrics.tokens;
    if (metrics.quality) {
      current.avgQuality = (current.avgQuality * (current.count - 1) + metrics.quality) / current.count;
    }
    if (metrics.error) current.errors++;
  }

  /**
   * Flush logs to storage
   */
  private flush(): void {
    if (this.logBuffer.length === 0) return;

    // Emit flush event with buffered logs
    this.emit('flush', [...this.logBuffer]);
    
    // Clear buffer
    this.logBuffer = [];
  }

  /**
   * Get current metrics
   */
  getMetrics(): any {
    return Object.fromEntries(this.metricsBuffer.entries());
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Start automatic flush interval
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Stop logging and clean up
   */
  shutdown(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    this.flush();
    this.removeAllListeners();
  }

  /**
   * Generate unique trace ID for request tracking
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global logger instance
export const waiLogger = new WAILogger({
  level: LogLevel.INFO,
  enableConsole: true,
  enableMetrics: true
});

// Convenience functions
export const logger = {
  debug: (component: string, message: string, context?: any, integration?: string) => 
    waiLogger.debug(component, message, context, integration),
  info: (component: string, message: string, context?: any, integration?: string) => 
    waiLogger.info(component, message, context, integration),
  warn: (component: string, message: string, context?: any, integration?: string) => 
    waiLogger.warn(component, message, context, integration),
  error: (component: string, message: string, context?: any, integration?: string) => 
    waiLogger.error(component, message, context, integration),
  critical: (component: string, message: string, context?: any, integration?: string) => 
    waiLogger.critical(component, message, context, integration),
  orchestration: (event: string, data: any, metrics?: any) => 
    waiLogger.orchestration(event, data, metrics),
  integration: (integrationName: string, event: string, data: any, metrics?: any) => 
    waiLogger.integration(integrationName, event, data, metrics),
  performance: (component: string, operation: string, duration: number, additional?: any) => 
    waiLogger.performance(component, operation, duration, additional),
  cost: (component: string, operation: string, cost: number, provider?: string, tokens?: number) => 
    waiLogger.cost(component, operation, cost, provider, tokens)
};