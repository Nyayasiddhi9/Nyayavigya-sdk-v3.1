/**
 * Continuous Learning Pipeline Wiring Service
 * 
 * Enables adaptive improvement through feedback loops:
 * - Performance tracking and analysis
 * - Automatic parameter tuning
 * - Feedback integration from results
 * - Model fine-tuning recommendations
 * 
 * Integration Points:
 * - Pre-orchestration: Load learned parameters
 * - During-orchestration: Track performance metrics
 * - Post-orchestration: Update learning model
 */

import type { StudioType } from '@shared/schema';

export interface LearningMetrics {
  orchestrationId: string;
  studioType: StudioType;
  successRate: number; // 0-1
  avgLatency: number;
  userSatisfaction: number; // 0-1
  costEfficiency: number; // 0-1
  timestamp: Date;
}

export interface LearnedPattern {
  pattern: string;
  studioType: StudioType;
  successRate: number;
  confidence: number; // 0-1
  observations: number;
  lastUpdated: Date;
}

export interface AdaptiveParameter {
  name: string;
  currentValue: number;
  optimalValue: number;
  adjustment: number;
  confidence: number;
}

export interface LearningStats {
  totalObservations: number;
  patternsLearned: number;
  avgSuccessRate: number;
  improvementRate: number; // Percent improvement over baseline
}

/**
 * Continuous Learning Pipeline Wiring Service
 */
class ContinuousLearningWiringService {
  private metricsHistory: LearningMetrics[] = [];
  private learnedPatterns: Map<string, LearnedPattern> = new Map();
  private adaptiveParams: Map<string, AdaptiveParameter> = new Map();
  private stats: LearningStats = {
    totalObservations: 0,
    patternsLearned: 0,
    avgSuccessRate: 0,
    improvementRate: 0,
  };

  private baselinePerformance: number = 0.7; // Initial baseline

  constructor() {
    this.initializeAdaptiveParameters();
    console.log('🧠 Continuous Learning Pipeline Wiring Service initialized');
    console.log('🎯 Features: Performance tracking, Parameter tuning, Feedback integration, Pattern recognition');
  }

  /**
   * Initialize adaptive parameters
   */
  private initializeAdaptiveParameters(): void {
    const params: AdaptiveParameter[] = [
      { name: 'timeout', currentValue: 30000, optimalValue: 30000, adjustment: 0, confidence: 0.5 },
      { name: 'max_retries', currentValue: 3, optimalValue: 3, adjustment: 0, confidence: 0.5 },
      { name: 'batch_size', currentValue: 5, optimalValue: 5, adjustment: 0, confidence: 0.5 },
      { name: 'cache_ttl', currentValue: 3600, optimalValue: 3600, adjustment: 0, confidence: 0.5 },
    ];

    params.forEach(param => this.adaptiveParams.set(param.name, param));
  }

  /**
   * Record orchestration metrics for learning
   */
  recordMetrics(metrics: LearningMetrics): void {
    this.metricsHistory.push(metrics);
    this.stats.totalObservations++;

    // Update average success rate
    this.stats.avgSuccessRate = this.metricsHistory.reduce((sum, m) => sum + m.successRate, 0) / this.metricsHistory.length;

    // Calculate improvement over baseline
    this.stats.improvementRate = ((this.stats.avgSuccessRate - this.baselinePerformance) / this.baselinePerformance) * 100;

    // Learn from patterns
    this.identifyPatterns(metrics);

    console.log(`🧠 [Learning] Recorded metrics for ${metrics.orchestrationId} - Success: ${(metrics.successRate * 100).toFixed(0)}%`);
  }

  /**
   * Identify and learn patterns from metrics
   */
  private identifyPatterns(metrics: LearningMetrics): void {
    const patternKey = `${metrics.studioType}_success`;
    
    let pattern = this.learnedPatterns.get(patternKey);
    if (!pattern) {
      pattern = {
        pattern: patternKey,
        studioType: metrics.studioType,
        successRate: 0,
        confidence: 0,
        observations: 0,
        lastUpdated: new Date(),
      };
      this.learnedPatterns.set(patternKey, pattern);
      this.stats.patternsLearned++;
    }

    // Update pattern with exponential moving average
    const alpha = 0.3;
    pattern.successRate = (alpha * metrics.successRate) + ((1 - alpha) * pattern.successRate);
    pattern.observations++;
    pattern.confidence = Math.min(1.0, pattern.observations / 100); // Confidence grows with observations
    pattern.lastUpdated = new Date();

    if (pattern.observations % 10 === 0) {
      console.log(`🧠 [Pattern] ${patternKey} - Success: ${(pattern.successRate * 100).toFixed(0)}% (Confidence: ${(pattern.confidence * 100).toFixed(0)}%)`);
    }
  }

  /**
   * Get optimal parameters for studio
   */
  getOptimalParameters(studioType: StudioType): Record<string, number> {
    const pattern = this.learnedPatterns.get(`${studioType}_success`);
    
    // If we have high confidence in this studio, use learned parameters
    if (pattern && pattern.confidence > 0.7) {
      // Adjust parameters based on learned performance
      if (pattern.successRate > 0.9) {
        // High success - can be more aggressive (lower timeout, fewer retries)
        return {
          timeout: 20000,
          max_retries: 2,
          batch_size: 10,
          cache_ttl: 7200,
        };
      } else if (pattern.successRate < 0.7) {
        // Low success - be more conservative (higher timeout, more retries)
        return {
          timeout: 45000,
          max_retries: 5,
          batch_size: 3,
          cache_ttl: 1800,
        };
      }
    }

    // Default parameters
    return {
      timeout: 30000,
      max_retries: 3,
      batch_size: 5,
      cache_ttl: 3600,
    };
  }

  /**
   * Tune adaptive parameter based on feedback
   */
  tuneParameter(
    parameterName: string,
    performanceMetric: number // 0-1, higher is better
  ): void {
    const param = this.adaptiveParams.get(parameterName);
    if (!param) return;

    // Simple gradient descent-like adjustment
    if (performanceMetric > 0.85) {
      // Good performance - reinforce current direction
      param.adjustment = param.adjustment * 1.1;
    } else if (performanceMetric < 0.70) {
      // Poor performance - reverse direction
      param.adjustment = -param.adjustment * 1.2;
    }

    // Apply adjustment
    const newValue = param.currentValue + param.adjustment;
    
    // Update if improvement is significant
    if (Math.abs(newValue - param.optimalValue) > Math.abs(param.currentValue - param.optimalValue)) {
      param.optimalValue = newValue;
      param.confidence = Math.min(1.0, param.confidence + 0.1);
      
      console.log(`🧠 [Tuning] ${parameterName} adjusted to ${newValue.toFixed(0)} (Confidence: ${(param.confidence * 100).toFixed(0)}%)`);
    }
  }

  /**
   * Get learning recommendations
   */
  getRecommendations(studioType: StudioType): string[] {
    const pattern = this.learnedPatterns.get(`${studioType}_success`);
    const recommendations: string[] = [];

    if (!pattern || pattern.observations < 10) {
      recommendations.push('Insufficient data - continue collecting metrics');
      return recommendations;
    }

    if (pattern.successRate < 0.7) {
      recommendations.push('Low success rate detected - consider reviewing workflow configuration');
      recommendations.push('Increase timeout and retry limits for better reliability');
    }

    if (pattern.successRate > 0.9) {
      recommendations.push('High success rate - can optimize for cost by reducing retries');
      recommendations.push('Consider aggressive caching to improve performance');
    }

    const avgLatency = this.metricsHistory
      .filter(m => m.studioType === studioType)
      .reduce((sum, m) => sum + m.avgLatency, 0) / (this.metricsHistory.filter(m => m.studioType === studioType).length || 1);

    if (avgLatency > 5000) {
      recommendations.push('High latency detected - consider parallel processing or faster models');
    }

    return recommendations;
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): LearningStats {
    return { ...this.stats };
  }

  /**
   * Get learned pattern for studio
   */
  getLearnedPattern(studioType: StudioType): LearnedPattern | null {
    return this.learnedPatterns.get(`${studioType}_success`) || null;
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      status: 'healthy' as const,
      totalObservations: this.stats.totalObservations,
      patternsLearned: this.stats.patternsLearned,
      avgSuccessRate: this.stats.avgSuccessRate,
      improvementRate: this.stats.improvementRate,
      features: {
        performanceTracking: true,
        parameterTuning: true,
        feedbackIntegration: true,
        patternRecognition: true,
      },
    };
  }
}

// Export singleton instance
export const continuousLearningWiringService = new ContinuousLearningWiringService();
