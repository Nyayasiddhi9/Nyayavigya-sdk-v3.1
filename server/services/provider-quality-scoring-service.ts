/**
 * Provider Quality Scoring Service
 * 
 * Tracks provider performance metrics and intelligently routes requests.
 * Integrates with GRPO for continuous learning and AG-UI for real-time visualization.
 * 
 * Features:
 * - Success rate, latency, cost tracking per provider
 * - Quality feedback loops
 * - Auto-adjust routing weights
 * - Circuit breakers for failing providers
 * - Real-time health monitoring
 */

import { EventEmitter } from 'events';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// ================================================================================================
// TYPES
// ================================================================================================

export interface ProviderQualityMetrics {
  providerId: string;
  providerName: string;
  successRate: number; // 0-1 scale
  avgLatencyMs: number;
  avgCost: number;
  errorCount: number;
  totalRequests: number;
  lastUpdated: Date;
  healthStatus: 'healthy' | 'degraded' | 'failing' | 'circuit-open';
  circuitBreakerOpen: boolean;
}

export interface ProviderExecutionResult {
  providerId: string;
  success: boolean;
  latencyMs: number;
  cost: number;
  tokens: { input: number; output: number };
  qualityScore?: number; // 0-1 scale, optional
  errorMessage?: string;
}

export interface RoutingWeights {
  providerId: string;
  weight: number; // 0-1 scale, higher = more likely to be selected
  reason: string;
}

// ================================================================================================
// PROVIDER QUALITY SCORING SERVICE
// ================================================================================================

export class ProviderQualityScoringService extends EventEmitter {
  private metrics: Map<string, ProviderQualityMetrics> = new Map();
  private circuitBreakers: Map<string, {
    failureCount: number;
    lastFailure: Date;
    openedAt?: Date;
  }> = new Map();

  // Circuit breaker configuration
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5; // Failures before opening
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
  private readonly CIRCUIT_BREAKER_HALF_OPEN_REQUESTS = 3;

  // Quality thresholds
  private readonly MIN_SUCCESS_RATE = 0.80; // 80%
  private readonly MAX_LATENCY_MS = 10000; // 10 seconds
  private readonly DEGRADED_SUCCESS_RATE = 0.90; // 90%

  constructor() {
    super();
    this.initializeProviders();
    console.log('📊 Provider Quality Scoring Service initialized');
  }

  /**
   * Initialize provider metrics
   */
  private initializeProviders() {
    const providers = [
      { id: 'openai', name: 'OpenAI' },
      { id: 'anthropic', name: 'Anthropic' },
      { id: 'google', name: 'Google' },
      { id: 'xai', name: 'xAI' },
      { id: 'perplexity', name: 'Perplexity' },
      { id: 'cohere', name: 'Cohere' },
      { id: 'mistral', name: 'Mistral AI' }
    ];

    for (const provider of providers) {
      this.metrics.set(provider.id, {
        providerId: provider.id,
        providerName: provider.name,
        successRate: 1.0,
        avgLatencyMs: 2000,
        avgCost: 0.001,
        errorCount: 0,
        totalRequests: 0,
        lastUpdated: new Date(),
        healthStatus: 'healthy',
        circuitBreakerOpen: false
      });

      this.circuitBreakers.set(provider.id, {
        failureCount: 0,
        lastFailure: new Date(0)
      });
    }
  }

  /**
   * Track execution result and update metrics
   * @param aguiSessionId - Optional AG-UI session for real-time streaming
   */
  async trackExecution(
    result: ProviderExecutionResult,
    aguiSessionId?: string
  ): Promise<void> {
    
    const metrics = this.metrics.get(result.providerId);
    if (!metrics) {
      console.warn(`Provider ${result.providerId} not found in metrics`);
      return;
    }

    // Emit AG-UI thinking event
    if (aguiSessionId) {
      this.emit('agui:thinking', {
        sessionId: aguiSessionId,
        step: 'Updating provider metrics',
        details: `Recording execution result for ${metrics.providerName}`
      });
    }

    // Update metrics
    const totalRequests = metrics.totalRequests + 1;
    const successCount = (metrics.successRate * metrics.totalRequests) + (result.success ? 1 : 0);
    const newSuccessRate = successCount / totalRequests;

    // Running average for latency and cost
    const newAvgLatency = ((metrics.avgLatencyMs * metrics.totalRequests) + result.latencyMs) / totalRequests;
    const newAvgCost = ((metrics.avgCost * metrics.totalRequests) + result.cost) / totalRequests;
    const newErrorCount = metrics.errorCount + (result.success ? 0 : 1);

    // Update metrics
    metrics.successRate = newSuccessRate;
    metrics.avgLatencyMs = newAvgLatency;
    metrics.avgCost = newAvgCost;
    metrics.errorCount = newErrorCount;
    metrics.totalRequests = totalRequests;
    metrics.lastUpdated = new Date();

    // Handle failures for circuit breaker
    if (!result.success) {
      await this.handleFailure(result.providerId, result.errorMessage || 'Unknown error');
    } else {
      await this.handleSuccess(result.providerId);
    }

    // Update health status
    this.updateHealthStatus(result.providerId);

    // Emit AG-UI message with updated metrics
    if (aguiSessionId) {
      this.emit('agui:message', {
        sessionId: aguiSessionId,
        message: `📊 Provider metrics updated: ${metrics.providerName} - ${(newSuccessRate * 100).toFixed(1)}% success rate`,
        metadata: {
          providerId: result.providerId,
          successRate: newSuccessRate,
          avgLatency: newAvgLatency,
          healthStatus: metrics.healthStatus
        }
      });
    }

    // Emit for GRPO learning
    this.emit('metricsUpdated', {
      providerId: result.providerId,
      metrics: { ...metrics }
    });

    console.log(`📊 Updated metrics for ${metrics.providerName}: ${(newSuccessRate * 100).toFixed(1)}% success, ${newAvgLatency.toFixed(0)}ms latency`);
  }

  /**
   * Handle provider failure
   */
  private async handleFailure(providerId: string, errorMessage: string): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(providerId);
    if (!circuitBreaker) return;

    circuitBreaker.failureCount++;
    circuitBreaker.lastFailure = new Date();

    // Open circuit breaker if threshold exceeded
    if (circuitBreaker.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreaker.openedAt = new Date();
      
      const metrics = this.metrics.get(providerId);
      if (metrics) {
        metrics.circuitBreakerOpen = true;
        metrics.healthStatus = 'circuit-open';
      }

      console.warn(`🔴 Circuit breaker OPENED for ${providerId} after ${circuitBreaker.failureCount} failures`);
      
      this.emit('circuitBreakerOpened', {
        providerId,
        failureCount: circuitBreaker.failureCount,
        errorMessage
      });

      // Auto-close after timeout
      setTimeout(() => {
        this.attemptCircuitBreakerClose(providerId);
      }, this.CIRCUIT_BREAKER_TIMEOUT);
    }
  }

  /**
   * Handle provider success
   */
  private async handleSuccess(providerId: string): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(providerId);
    if (!circuitBreaker) return;

    // Reset failure count on success
    if (circuitBreaker.failureCount > 0) {
      circuitBreaker.failureCount = Math.max(0, circuitBreaker.failureCount - 1);
    }

    // Close circuit breaker if it was open
    if (circuitBreaker.openedAt) {
      const metrics = this.metrics.get(providerId);
      if (metrics) {
        metrics.circuitBreakerOpen = false;
        this.updateHealthStatus(providerId);
      }

      console.log(`✅ Circuit breaker CLOSED for ${providerId} after successful request`);
      
      this.emit('circuitBreakerClosed', {
        providerId
      });

      circuitBreaker.openedAt = undefined;
    }
  }

  /**
   * Attempt to close circuit breaker (half-open state)
   */
  private attemptCircuitBreakerClose(providerId: string): void {
    const circuitBreaker = this.circuitBreakers.get(providerId);
    const metrics = this.metrics.get(providerId);
    
    if (!circuitBreaker || !metrics) return;

    // Don't close if still seeing failures
    if (circuitBreaker.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      console.warn(`⚠️ Circuit breaker for ${providerId} remains open - still seeing failures`);
      return;
    }

    // Transition to half-open
    console.log(`🟡 Circuit breaker for ${providerId} entering half-open state`);
    metrics.healthStatus = 'degraded';
    // circuitBreakerOpen remains true but allows limited requests
  }

  /**
   * Update health status based on metrics
   */
  private updateHealthStatus(providerId: string): void {
    const metrics = this.metrics.get(providerId);
    if (!metrics) return;

    if (metrics.circuitBreakerOpen) {
      metrics.healthStatus = 'circuit-open';
    } else if (metrics.successRate < this.MIN_SUCCESS_RATE || metrics.avgLatencyMs > this.MAX_LATENCY_MS) {
      metrics.healthStatus = 'failing';
    } else if (metrics.successRate < this.DEGRADED_SUCCESS_RATE) {
      metrics.healthStatus = 'degraded';
    } else {
      metrics.healthStatus = 'healthy';
    }
  }

  /**
   * Calculate routing weights based on quality metrics
   * @param aguiSessionId - Optional AG-UI session for streaming routing decisions
   */
  calculateRoutingWeights(
    requiredQuality?: number,
    budgetLimit?: number,
    aguiSessionId?: string
  ): RoutingWeights[] {
    
    if (aguiSessionId) {
      this.emit('agui:thinking', {
        sessionId: aguiSessionId,
        step: 'Calculating intelligent routing weights',
        details: `Analyzing ${this.metrics.size} providers for optimal selection`
      });
    }

    const weights: RoutingWeights[] = [];

    for (const [providerId, metrics] of this.metrics) {
      // Skip providers with open circuit breakers
      if (metrics.circuitBreakerOpen) {
        weights.push({
          providerId,
          weight: 0,
          reason: 'Circuit breaker open - provider unavailable'
        });
        continue;
      }

      // Skip if below required quality
      if (requiredQuality && metrics.successRate < requiredQuality) {
        weights.push({
          providerId,
          weight: 0,
          reason: `Quality ${(metrics.successRate * 100).toFixed(1)}% below required ${(requiredQuality * 100).toFixed(1)}%`
        });
        continue;
      }

      // Skip if above budget
      if (budgetLimit && metrics.avgCost > budgetLimit) {
        weights.push({
          providerId,
          weight: 0,
          reason: `Avg cost $${metrics.avgCost.toFixed(4)} exceeds budget $${budgetLimit.toFixed(4)}`
        });
        continue;
      }

      // Calculate weight (70% success rate, 20% latency, 10% cost)
      const successWeight = metrics.successRate * 0.7;
      const latencyWeight = (1 - Math.min(metrics.avgLatencyMs / this.MAX_LATENCY_MS, 1)) * 0.2;
      const costWeight = budgetLimit ? (1 - metrics.avgCost / budgetLimit) * 0.1 : 0.1;
      
      const totalWeight = successWeight + latencyWeight + costWeight;

      weights.push({
        providerId,
        weight: Math.max(0, Math.min(1, totalWeight)),
        reason: `${(metrics.successRate * 100).toFixed(1)}% success, ${metrics.avgLatencyMs.toFixed(0)}ms latency, $${metrics.avgCost.toFixed(4)} avg cost`
      });
    }

    // Sort by weight descending
    weights.sort((a, b) => b.weight - a.weight);

    // Emit AG-UI message with routing decision
    if (aguiSessionId && weights.length > 0) {
      this.emit('agui:message', {
        sessionId: aguiSessionId,
        message: `🎯 Routing recommendation: ${this.getProviderName(weights[0].providerId)} (weight: ${(weights[0].weight * 100).toFixed(1)}%)`,
        metadata: {
          topProvider: weights[0].providerId,
          weight: weights[0].weight,
          reason: weights[0].reason
        }
      });
    }

    return weights;
  }

  /**
   * Select best provider based on weights
   */
  selectProvider(
    requiredQuality?: number,
    budgetLimit?: number,
    aguiSessionId?: string
  ): string | null {
    
    const weights = this.calculateRoutingWeights(requiredQuality, budgetLimit, aguiSessionId);
    
    // Filter out zero-weight providers
    const available = weights.filter(w => w.weight > 0);
    
    if (available.length === 0) {
      console.warn('⚠️ No providers available matching criteria');
      return null;
    }

    // Weighted random selection (favor higher weights)
    const totalWeight = available.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const weight of available) {
      random -= weight.weight;
      if (random <= 0) {
        console.log(`✅ Selected provider: ${this.getProviderName(weight.providerId)} (${weight.reason})`);
        return weight.providerId;
      }
    }

    // Fallback to highest weight
    return available[0].providerId;
  }

  /**
   * Get all provider metrics
   */
  getAllMetrics(): ProviderQualityMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics for specific provider
   */
  getMetrics(providerId: string): ProviderQualityMetrics | undefined {
    return this.metrics.get(providerId);
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(providerId: string): boolean {
    const metrics = this.metrics.get(providerId);
    return metrics ? !metrics.circuitBreakerOpen : false;
  }

  /**
   * Get provider health status
   */
  getProviderHealth(providerId: string): 'healthy' | 'degraded' | 'failing' | 'circuit-open' | 'unknown' {
    const metrics = this.metrics.get(providerId);
    return metrics?.healthStatus || 'unknown';
  }

  /**
   * Submit quality feedback for GRPO learning
   * @param providerId - Provider that executed the task
   * @param qualityScore - Quality rating (0-1 scale)
   * @param feedbackType - Type of feedback (human, automated, or system)
   * @param aguiSessionId - Optional AG-UI session for streaming
   */
  async submitQualityFeedback(
    providerId: string,
    qualityScore: number,
    feedbackType: 'human' | 'automated' | 'system',
    metadata?: {
      taskType?: string;
      expectation?: string;
      actualResult?: string;
      costEffectiveness?: number;
    },
    aguiSessionId?: string
  ): Promise<void> {
    
    const metrics = this.metrics.get(providerId);
    if (!metrics) {
      console.warn(`Provider ${providerId} not found for feedback`);
      return;
    }

    if (aguiSessionId) {
      this.emit('agui:thinking', {
        sessionId: aguiSessionId,
        step: 'Processing quality feedback',
        details: `Recording ${feedbackType} feedback for ${metrics.providerName} (score: ${(qualityScore * 100).toFixed(0)}%)`
      });
    }

    // Weight feedback based on type
    const feedbackWeight = {
      human: 1.0,      // Human feedback is most valuable
      automated: 0.7,   // Automated metrics are reliable but less nuanced
      system: 0.5      // System metrics are baseline
    }[feedbackType];

    // Adjust success rate based on quality feedback
    // Use exponential moving average for smooth adjustments
    const alpha = 0.1; // Learning rate
    const adjustedQuality = qualityScore * feedbackWeight;
    metrics.successRate = (1 - alpha) * metrics.successRate + alpha * adjustedQuality;

    // Update health status
    this.updateHealthStatus(providerId);

    // Emit for GRPO learning system
    this.emit('grpoFeedback', {
      providerId,
      providerName: metrics.providerName,
      qualityScore,
      feedbackType,
      feedbackWeight,
      adjustedSuccessRate: metrics.successRate,
      metadata,
      timestamp: new Date()
    });

    if (aguiSessionId) {
      this.emit('agui:message', {
        sessionId: aguiSessionId,
        message: `✅ Quality feedback recorded: ${metrics.providerName} adjusted to ${(metrics.successRate * 100).toFixed(1)}% success rate`,
        metadata: {
          providerId,
          newSuccessRate: metrics.successRate,
          feedbackType
        }
      });
    }

    console.log(`📊 Quality feedback for ${metrics.providerName}: ${(qualityScore * 100).toFixed(0)}% (${feedbackType}) → Success rate now ${(metrics.successRate * 100).toFixed(1)}%`);
  }

  /**
   * Batch process multiple feedback submissions
   */
  async submitBatchFeedback(
    feedbackBatch: Array<{
      providerId: string;
      qualityScore: number;
      feedbackType: 'human' | 'automated' | 'system';
      metadata?: any;
    }>,
    aguiSessionId?: string
  ): Promise<void> {
    
    if (aguiSessionId) {
      this.emit('agui:progress', {
        sessionId: aguiSessionId,
        progress: 0,
        message: `Processing ${feedbackBatch.length} feedback submissions`
      });
    }

    for (let i = 0; i < feedbackBatch.length; i++) {
      const feedback = feedbackBatch[i];
      await this.submitQualityFeedback(
        feedback.providerId,
        feedback.qualityScore,
        feedback.feedbackType,
        feedback.metadata,
        aguiSessionId
      );

      if (aguiSessionId) {
        this.emit('agui:progress', {
          sessionId: aguiSessionId,
          progress: (i + 1) / feedbackBatch.length,
          message: `Processed ${i + 1}/${feedbackBatch.length} feedback items`
        });
      }
    }

    console.log(`✅ Batch processed ${feedbackBatch.length} feedback submissions`);
  }

  /**
   * Get feedback statistics for analysis
   */
  getFeedbackStats(): {
    totalProviders: number;
    healthyProviders: number;
    degradedProviders: number;
    failingProviders: number;
    circuitOpenProviders: number;
    avgSuccessRate: number;
    avgLatency: number;
    avgCost: number;
  } {
    const allMetrics = Array.from(this.metrics.values());
    
    return {
      totalProviders: allMetrics.length,
      healthyProviders: allMetrics.filter(m => m.healthStatus === 'healthy').length,
      degradedProviders: allMetrics.filter(m => m.healthStatus === 'degraded').length,
      failingProviders: allMetrics.filter(m => m.healthStatus === 'failing').length,
      circuitOpenProviders: allMetrics.filter(m => m.circuitBreakerOpen).length,
      avgSuccessRate: allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length,
      avgLatency: allMetrics.reduce((sum, m) => sum + m.avgLatencyMs, 0) / allMetrics.length,
      avgCost: allMetrics.reduce((sum, m) => sum + m.avgCost, 0) / allMetrics.length
    };
  }

  /**
   * Reset metrics for provider (for testing)
   */
  resetMetrics(providerId: string): void {
    const metrics = this.metrics.get(providerId);
    if (metrics) {
      metrics.successRate = 1.0;
      metrics.avgLatencyMs = 2000;
      metrics.avgCost = 0.001;
      metrics.errorCount = 0;
      metrics.totalRequests = 0;
      metrics.lastUpdated = new Date();
      metrics.healthStatus = 'healthy';
      metrics.circuitBreakerOpen = false;
    }

    const circuitBreaker = this.circuitBreakers.get(providerId);
    if (circuitBreaker) {
      circuitBreaker.failureCount = 0;
      circuitBreaker.openedAt = undefined;
    }
  }

  /**
   * Get provider name from ID
   */
  private getProviderName(providerId: string): string {
    return this.metrics.get(providerId)?.providerName || providerId;
  }
}

// Singleton instance
export const providerQualityScoringService = new ProviderQualityScoringService();
