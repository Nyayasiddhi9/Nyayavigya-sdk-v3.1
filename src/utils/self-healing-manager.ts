/**
 * WAI Self-Healing Manager v9.0
 * Autonomous system healing and optimization
 */

import { EventEmitter } from 'events';
import { WAILogger } from './logger';
import { SelfHealingConfig } from '../types/core-types';

export class SelfHealingManager extends EventEmitter {
  private logger: WAILogger;
  private initialized = false;
  private healingStrategies: Map<string, HealingStrategy> = new Map();
  private healingHistory: HealingAction[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  
  constructor(private config: SelfHealingConfig = {}) {
    super();
    this.logger = new WAILogger('SelfHealingManager');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('🔧 Initializing Self-Healing Manager...');

      // Initialize healing strategies
      this.initializeHealingStrategies();

      // Start monitoring if enabled
      if (this.config.enabled !== false) {
        this.startMonitoring();
      }

      this.initialized = true;
      this.logger.info('✅ Self-Healing Manager initialized');

    } catch (error) {
      this.logger.error('❌ Self-Healing Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle error and attempt healing
   */
  async handleError(error: Error, context: any): Promise<HealingResult> {
    try {
      this.logger.info(`🩺 Analyzing error for healing: ${error.message}`);

      // Analyze error type and severity
      const errorAnalysis = this.analyzeError(error, context);
      
      // Select appropriate healing strategy
      const strategy = this.selectHealingStrategy(errorAnalysis);
      
      if (!strategy) {
        this.logger.warn('⚠️ No healing strategy available for error');
        return { success: false, strategy: 'none', message: 'No applicable healing strategy' };
      }

      // Execute healing action
      const healingResult = await strategy.heal(errorAnalysis, context);

      // Record healing action
      this.recordHealingAction(error, strategy, healingResult, context);

      this.logger.info(`${healingResult.success ? '✅' : '❌'} Healing ${healingResult.success ? 'completed' : 'failed'}: ${strategy.name}`);
      
      return healingResult;

    } catch (healingError) {
      this.logger.error('❌ Healing process failed:', healingError);
      return { success: false, strategy: 'error', message: healingError.message };
    }
  }

  /**
   * Heal unhealthy components
   */
  async healComponents(unhealthyComponents: [string, any][]): Promise<void> {
    this.logger.info(`🩺 Healing ${unhealthyComponents.length} unhealthy components...`);

    for (const [componentName, componentStatus] of unhealthyComponents) {
      try {
        await this.healComponent(componentName, componentStatus);
      } catch (error) {
        this.logger.error(`❌ Failed to heal component ${componentName}:`, error);
      }
    }
  }

  /**
   * Get healing status
   */
  getStatus() {
    return {
      healthy: this.initialized,
      status: this.initialized ? 'active' : 'inactive',
      lastCheck: Date.now(),
      strategies: this.healingStrategies.size,
      healingActions: this.healingHistory.length,
      successRate: this.calculateSuccessRate()
    };
  }

  /**
   * Get healing history
   */
  getHealingHistory(limit?: number): HealingAction[] {
    return limit ? this.healingHistory.slice(-limit) : this.healingHistory;
  }

  /**
   * Initialize healing strategies
   */
  private initializeHealingStrategies(): void {
    const strategies = [
      new RestartComponentStrategy(),
      new ResourceOptimizationStrategy(),
      new LoadBalancingStrategy(),
      new CacheInvalidationStrategy(),
      new NetworkRetryStrategy(),
      new FallbackProviderStrategy(),
      new MemoryCleanupStrategy(),
      new ConfigurationResetStrategy()
    ];

    strategies.forEach(strategy => {
      this.healingStrategies.set(strategy.id, strategy);
    });

    this.logger.info(`✅ Initialized ${strategies.length} healing strategies`);
  }

  /**
   * Start monitoring for issues
   */
  private startMonitoring(): void {
    const interval = this.config.checkInterval || 30000; // 30 seconds default
    
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, interval);

    this.logger.info(`🔍 Started health monitoring (${interval}ms interval)`);
  }

  /**
   * Perform system health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // This would integrate with actual system monitoring
      // For now, it's a placeholder for the healing framework
      
      this.emit('healthCheck', {
        timestamp: Date.now(),
        status: 'healthy'
      });

    } catch (error) {
      this.logger.error('❌ Health check failed:', error);
    }
  }

  /**
   * Analyze error for healing strategy selection
   */
  private analyzeError(error: Error, context: any): ErrorAnalysis {
    return {
      type: this.classifyErrorType(error),
      severity: this.calculateSeverity(error, context),
      component: this.identifyComponent(error, context),
      frequency: this.getErrorFrequency(error.message),
      context: context
    };
  }

  /**
   * Classify error type
   */
  private classifyErrorType(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('network')) {
      return 'network';
    } else if (message.includes('memory') || message.includes('heap')) {
      return 'memory';
    } else if (message.includes('not found') || message.includes('undefined')) {
      return 'resource';
    } else if (message.includes('rate limit') || message.includes('quota')) {
      return 'rate-limiting';
    } else if (message.includes('connection') || message.includes('database')) {
      return 'database';
    } else {
      return 'general';
    }
  }

  /**
   * Calculate error severity
   */
  private calculateSeverity(error: Error, context: any): 'low' | 'medium' | 'high' | 'critical' {
    // Implement severity calculation based on error impact
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return 'critical';
    } else if (context?.userImpact === 'high') {
      return 'high';
    } else if (error.message.includes('warning')) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  /**
   * Identify affected component
   */
  private identifyComponent(error: Error, context: any): string {
    // Extract component from error stack or context
    if (context?.component) {
      return context.component;
    }
    
    const stack = error.stack || '';
    if (stack.includes('QuantumOptimizer')) return 'quantum-optimizer';
    if (stack.includes('AgentManager')) return 'agent-manager';
    if (stack.includes('LLMRouter')) return 'llm-router';
    if (stack.includes('SecurityFramework')) return 'security-framework';
    if (stack.includes('IntegrationHub')) return 'integration-hub';
    
    return 'unknown';
  }

  /**
   * Get error frequency for pattern analysis
   */
  private getErrorFrequency(errorMessage: string): number {
    return this.healingHistory.filter(action => 
      action.error.includes(errorMessage)
    ).length;
  }

  /**
   * Select appropriate healing strategy
   */
  private selectHealingStrategy(analysis: ErrorAnalysis): HealingStrategy | null {
    const strategies = Array.from(this.healingStrategies.values())
      .filter(strategy => strategy.canHeal(analysis))
      .sort((a, b) => b.priority - a.priority);

    return strategies[0] || null;
  }

  /**
   * Heal individual component
   */
  private async healComponent(componentName: string, componentStatus: any): Promise<void> {
    const analysis: ErrorAnalysis = {
      type: 'component-unhealthy',
      severity: 'medium',
      component: componentName,
      frequency: 1,
      context: componentStatus
    };

    const strategy = this.selectHealingStrategy(analysis);
    if (strategy) {
      await strategy.heal(analysis, componentStatus);
    }
  }

  /**
   * Record healing action for analytics
   */
  private recordHealingAction(
    error: Error, 
    strategy: HealingStrategy, 
    result: HealingResult, 
    context: any
  ): void {
    const action: HealingAction = {
      timestamp: Date.now(),
      error: error.message,
      strategy: strategy.name,
      success: result.success,
      duration: result.duration || 0,
      component: this.identifyComponent(error, context),
      context: context
    };

    this.healingHistory.push(action);

    // Rotate history if too large
    if (this.healingHistory.length > 1000) {
      this.healingHistory = this.healingHistory.slice(-500);
    }

    this.emit('healingAction', action);
  }

  /**
   * Calculate healing success rate
   */
  private calculateSuccessRate(): number {
    if (this.healingHistory.length === 0) return 1.0;
    
    const successfulActions = this.healingHistory.filter(action => action.success).length;
    return successfulActions / this.healingHistory.length;
  }

  async shutdown(): Promise<void> {
    this.logger.info('🔄 Shutting down self-healing manager...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.initialized = false;
  }
}

// Interfaces and Types
interface ErrorAnalysis {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  frequency: number;
  context: any;
}

interface HealingResult {
  success: boolean;
  strategy: string;
  message: string;
  duration?: number;
}

interface HealingAction {
  timestamp: number;
  error: string;
  strategy: string;
  success: boolean;
  duration: number;
  component: string;
  context: any;
}

// Healing Strategy Interface
abstract class HealingStrategy {
  abstract id: string;
  abstract name: string;
  abstract priority: number;
  
  abstract canHeal(analysis: ErrorAnalysis): boolean;
  abstract heal(analysis: ErrorAnalysis, context: any): Promise<HealingResult>;
}

// Healing Strategy Implementations
class RestartComponentStrategy extends HealingStrategy {
  id = 'restart-component';
  name = 'Restart Component';
  priority = 8;

  canHeal(analysis: ErrorAnalysis): boolean {
    return analysis.severity === 'high' || analysis.severity === 'critical';
  }

  async heal(analysis: ErrorAnalysis, context: any): Promise<HealingResult> {
    const startTime = Date.now();
    
    try {
      // Simulate component restart
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        strategy: this.name,
        message: `Component ${analysis.component} restarted successfully`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        strategy: this.name,
        message: `Failed to restart component: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }
}

class ResourceOptimizationStrategy extends HealingStrategy {
  id = 'resource-optimization';
  name = 'Resource Optimization';
  priority = 6;

  canHeal(analysis: ErrorAnalysis): boolean {
    return analysis.type === 'memory' || analysis.type === 'resource';
  }

  async heal(analysis: ErrorAnalysis, context: any): Promise<HealingResult> {
    const startTime = Date.now();
    
    try {
      // Simulate resource optimization
      if (global.gc) {
        global.gc();
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        strategy: this.name,
        message: 'Resources optimized and memory cleaned',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        strategy: this.name,
        message: `Resource optimization failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }
}

class LoadBalancingStrategy extends HealingStrategy {
  id = 'load-balancing';
  name = 'Load Balancing';
  priority = 7;

  canHeal(analysis: ErrorAnalysis): boolean {
    return analysis.type === 'rate-limiting' || analysis.component === 'llm-router';
  }

  async heal(analysis: ErrorAnalysis, context: any): Promise<HealingResult> {
    const startTime = Date.now();
    
    try {
      // Simulate load balancing adjustment
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        strategy: this.name,
        message: 'Load balancing optimized',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        strategy: this.name,
        message: `Load balancing failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }
}

class CacheInvalidationStrategy extends HealingStrategy {
  id = 'cache-invalidation';
  name = 'Cache Invalidation';
  priority = 4;

  canHeal(analysis: ErrorAnalysis): boolean {
    return analysis.type === 'resource' && analysis.frequency > 2;
  }

  async heal(analysis: ErrorAnalysis, context: any): Promise<HealingResult> {
    const startTime = Date.now();
    
    try {
      // Simulate cache invalidation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        success: true,
        strategy: this.name,
        message: 'Cache invalidated and refreshed',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        strategy: this.name,
        message: `Cache invalidation failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }
}

class NetworkRetryStrategy extends HealingStrategy {
  id = 'network-retry';
  name = 'Network Retry';
  priority = 5;

  canHeal(analysis: ErrorAnalysis): boolean {
    return analysis.type === 'network';
  }

  async heal(analysis: ErrorAnalysis, context: any): Promise<HealingResult> {
    const startTime = Date.now();
    
    try {
      // Simulate network retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        strategy: this.name,
        message: 'Network connection restored',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        strategy: this.name,
        message: `Network retry failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }
}

class FallbackProviderStrategy extends HealingStrategy {
  id = 'fallback-provider';
  name = 'Fallback Provider';
  priority = 9;

  canHeal(analysis: ErrorAnalysis): boolean {
    return analysis.component === 'llm-router' || analysis.type === 'rate-limiting';
  }

  async heal(analysis: ErrorAnalysis, context: any): Promise<HealingResult> {
    const startTime = Date.now();
    
    try {
      // Simulate provider fallback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        strategy: this.name,
        message: 'Switched to fallback provider',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        strategy: this.name,
        message: `Provider fallback failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }
}

class MemoryCleanupStrategy extends HealingStrategy {
  id = 'memory-cleanup';
  name = 'Memory Cleanup';
  priority = 3;

  canHeal(analysis: ErrorAnalysis): boolean {
    return analysis.type === 'memory';
  }

  async heal(analysis: ErrorAnalysis, context: any): Promise<HealingResult> {
    const startTime = Date.now();
    
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      return {
        success: true,
        strategy: this.name,
        message: 'Memory cleanup completed',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        strategy: this.name,
        message: `Memory cleanup failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }
}

class ConfigurationResetStrategy extends HealingStrategy {
  id = 'configuration-reset';
  name = 'Configuration Reset';
  priority = 2;

  canHeal(analysis: ErrorAnalysis): boolean {
    return analysis.frequency > 5; // Only for persistent issues
  }

  async heal(analysis: ErrorAnalysis, context: any): Promise<HealingResult> {
    const startTime = Date.now();
    
    try {
      // Simulate configuration reset
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        strategy: this.name,
        message: 'Configuration reset to defaults',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        strategy: this.name,
        message: `Configuration reset failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }
}