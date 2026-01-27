/**
 * Health Monitor - Provider health checking and system monitoring
 */
import { EventEmitter } from 'events';

export interface HealthStatus {
  component: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  latency?: number;
  lastChecked: Date;
  errorRate: number;
  uptime: number;
  details?: any;
}

export class HealthMonitor extends EventEmitter {
  private orchestrator: any;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthHistory: Map<string, HealthStatus[]> = new Map();
  private isMonitoring: boolean = false;

  constructor(orchestrator: any) {
    super();
    this.orchestrator = orchestrator;
  }

  /**
   * Start health monitoring
   */
  startHealthChecks(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.log('Health monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting health monitoring (interval: ${intervalMs}ms)`);

    // Run initial health check
    this.runHealthCheck();

    // Set up periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.runHealthCheck();
    }, intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log('Health monitoring stopped');
  }

  /**
   * Run comprehensive health check
   */
  async runHealthCheck(): Promise<void> {
    try {
      // Check all providers
      await this.checkProviderHealth();
      
      // Check system resources
      await this.checkSystemHealth();
      
      // Check orchestrator health
      await this.checkOrchestratorHealth();
      
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * Check provider health
   */
  private async checkProviderHealth(): Promise<void> {
    const providers = ['openai', 'anthropic', 'google', 'llama-3.3-70b', 'llama-3.1-405b', 'qwen-2.5-72b'];
    
    for (const provider of providers) {
      try {
        const startTime = Date.now();
        const isHealthy = await this.checkSingleProvider(provider);
        const latency = Date.now() - startTime;
        
        const status: HealthStatus = {
          component: provider,
          status: isHealthy ? 'healthy' : 'unavailable',
          latency,
          lastChecked: new Date(),
          errorRate: this.calculateErrorRate(provider),
          uptime: this.calculateUptime(provider)
        };

        this.recordHealthStatus(provider, status);
        
        if (!isHealthy) {
          this.orchestrator?.emit('health.degraded', provider, status);
        }
        
      } catch (error) {
        const status: HealthStatus = {
          component: provider,
          status: 'unavailable',
          lastChecked: new Date(),
          errorRate: 1.0,
          uptime: 0,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        };

        this.recordHealthStatus(provider, status);
        this.orchestrator?.emit('health.degraded', provider, status);
      }
    }
  }

  /**
   * Check individual provider health
   */
  private async checkSingleProvider(provider: string): Promise<boolean> {
    try {
      // Simulate a simple health check request
      // In real implementation, this would make a lightweight API call
      
      switch (provider) {
        case 'openai':
          return this.checkOpenAIHealth();
        case 'anthropic':
          return this.checkAnthropicHealth();
        case 'google':
          return this.checkGoogleHealth();
        case 'llama-3.3-70b':
        case 'llama-3.1-405b':
        case 'qwen-2.5-72b':
          return this.checkTogetherHealth();
        default:
          return true; // Unknown providers assumed healthy
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Provider-specific health checks
   */
  private async checkOpenAIHealth(): Promise<boolean> {
    // Simulate OpenAI health check
    // In real implementation: await openai.models.list()
    return Math.random() > 0.1; // 90% uptime simulation
  }

  private async checkAnthropicHealth(): Promise<boolean> {
    // Simulate Anthropic health check
    return Math.random() > 0.05; // 95% uptime simulation
  }

  private async checkGoogleHealth(): Promise<boolean> {
    // Simulate Google health check
    return Math.random() > 0.08; // 92% uptime simulation
  }

  private async checkTogetherHealth(): Promise<boolean> {
    // Simulate Together AI health check
    return Math.random() > 0.15; // 85% uptime simulation
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<void> {
    const systemStatus: HealthStatus = {
      component: 'system',
      status: 'healthy',
      lastChecked: new Date(),
      errorRate: 0,
      uptime: this.getSystemUptime(),
      details: {
        memory: this.getMemoryUsage(),
        cpu: this.getCPUUsage(),
        disk: this.getDiskUsage()
      }
    };

    // Check if system is under stress
    if (systemStatus.details.memory > 0.9 || systemStatus.details.cpu > 0.9) {
      systemStatus.status = 'degraded';
    }

    this.recordHealthStatus('system', systemStatus);
  }

  /**
   * Check orchestrator health
   */
  private async checkOrchestratorHealth(): Promise<void> {
    const orchestratorStatus: HealthStatus = {
      component: 'orchestrator',
      status: 'healthy',
      lastChecked: new Date(),
      errorRate: 0,
      uptime: 1.0,
      details: {
        activeConnections: this.getActiveConnections(),
        requestsPerMinute: this.getRequestRate(),
        averageResponseTime: this.getAverageResponseTime()
      }
    };

    this.recordHealthStatus('orchestrator', orchestratorStatus);
  }

  /**
   * Calculate error rate for a provider
   */
  private calculateErrorRate(provider: string): number {
    const history = this.healthHistory.get(provider) || [];
    if (history.length === 0) return 0;

    const recentHistory = history.slice(-10); // Last 10 checks
    const errors = recentHistory.filter(status => status.status !== 'healthy').length;
    
    return errors / recentHistory.length;
  }

  /**
   * Calculate uptime for a provider
   */
  private calculateUptime(provider: string): number {
    const history = this.healthHistory.get(provider) || [];
    if (history.length === 0) return 1.0;

    const recentHistory = history.slice(-100); // Last 100 checks
    const healthyChecks = recentHistory.filter(status => status.status === 'healthy').length;
    
    return healthyChecks / recentHistory.length;
  }

  /**
   * Record health status
   */
  private recordHealthStatus(component: string, status: HealthStatus): void {
    if (!this.healthHistory.has(component)) {
      this.healthHistory.set(component, []);
    }

    const history = this.healthHistory.get(component)!;
    history.push(status);

    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.splice(0, history.length - 500);
    }
  }

  /**
   * Get provider status
   */
  async getProviderStatus(): Promise<any[]> {
    const providers = ['openai', 'anthropic', 'google', 'llama-3.3-70b', 'llama-3.1-405b', 'qwen-2.5-72b'];
    
    return providers.map(provider => {
      const history = this.healthHistory.get(provider) || [];
      const latestStatus = history[history.length - 1];
      
      return {
        provider,
        status: latestStatus?.status || 'unknown',
        latency: latestStatus?.latency || 0,
        lastChecked: latestStatus?.lastChecked || new Date(),
        errorRate: this.calculateErrorRate(provider),
        costEfficiency: this.calculateCostEfficiency(provider)
      };
    });
  }

  /**
   * Get overall health status
   */
  getOverallHealth(): any {
    const allComponents = Array.from(this.healthHistory.keys());
    let healthyCount = 0;
    let totalCount = 0;

    for (const component of allComponents) {
      const history = this.healthHistory.get(component) || [];
      const latestStatus = history[history.length - 1];
      
      if (latestStatus) {
        totalCount++;
        if (latestStatus.status === 'healthy') {
          healthyCount++;
        }
      }
    }

    const healthPercentage = totalCount > 0 ? (healthyCount / totalCount) : 1.0;
    
    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (healthPercentage >= 0.9) {
      overallStatus = 'healthy';
    } else if (healthPercentage >= 0.5) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'critical';
    }

    return {
      overall: overallStatus,
      healthPercentage: healthPercentage * 100,
      healthyComponents: healthyCount,
      totalComponents: totalCount,
      lastUpdated: new Date()
    };
  }

  /**
   * System metrics simulation
   */
  private getSystemUptime(): number {
    return 0.99; // 99% uptime simulation
  }

  private getMemoryUsage(): number {
    return Math.random() * 0.8; // 0-80% memory usage
  }

  private getCPUUsage(): number {
    return Math.random() * 0.6; // 0-60% CPU usage
  }

  private getDiskUsage(): number {
    return Math.random() * 0.5; // 0-50% disk usage
  }

  private getActiveConnections(): number {
    return Math.floor(Math.random() * 100) + 10; // 10-110 connections
  }

  private getRequestRate(): number {
    return Math.floor(Math.random() * 1000) + 100; // 100-1100 requests/min
  }

  private getAverageResponseTime(): number {
    return Math.random() * 2000 + 500; // 500-2500ms response time
  }

  private calculateCostEfficiency(provider: string): number {
    // Simulate cost efficiency calculation
    return Math.random() * 10 + 5; // 5-15 efficiency score
  }

  /**
   * Get health history for a component
   */
  getHealthHistory(component: string, limit: number = 100): HealthStatus[] {
    const history = this.healthHistory.get(component) || [];
    return history.slice(-limit);
  }

  /**
   * Clear health history
   */
  clearHistory(component?: string): void {
    if (component) {
      this.healthHistory.delete(component);
    } else {
      this.healthHistory.clear();
    }
  }
}
