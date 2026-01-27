/**
 * Intelligent Routing Wiring Service
 * 
 * Enables optimal LLM provider selection based on:
 * - Cost optimization (minimize expenses)
 * - Quality requirements (meet accuracy targets)
 * - Response time constraints (meet latency SLAs)
 * - Load balancing (distribute across providers)
 * 
 * Integration Points:
 * - Pre-orchestration: Select optimal provider
 * - During-orchestration: Fallback to alternatives if needed
 * - Post-orchestration: Update provider metrics
 */

import { IntelligentRoutingService } from './intelligent-routing';
import type { RoutingRequest, RoutingDecision } from './intelligent-routing';
import type { StudioType } from '@shared/schema';

export interface RoutingWiringConfig {
  costPriority: number; // 0-1, higher = more cost-sensitive
  qualityPriority: number; // 0-1, higher = prioritize quality
  speedPriority: number; // 0-1, higher = prioritize speed
  enableFallback: boolean;
}

export interface ProviderSelection {
  provider: string;
  model: string;
  estimatedCost: number;
  estimatedQuality: number;
  estimatedTime: number;
  reasoning: string;
  fallbackChain: string[];
}

/**
 * Intelligent Routing Wiring Service
 */
class IntelligentRoutingWiringService {
  private routingService: IntelligentRoutingService;
  private selectionHistory: ProviderSelection[] = [];

  constructor() {
    this.routingService = new IntelligentRoutingService();
    console.log('🧭 Intelligent Routing Wiring Service initialized');
    console.log('🎯 Features: Cost optimization, Quality selection, Load balancing, Auto-fallback');
  }

  /**
   * Select optimal LLM provider for orchestration
   */
  async selectOptimalProvider(
    task: string,
    studioType: StudioType,
    config: Partial<RoutingWiringConfig> = {}
  ): Promise<ProviderSelection> {
    const fullConfig: RoutingWiringConfig = {
      costPriority: 0.5,
      qualityPriority: 0.7,
      speedPriority: 0.6,
      enableFallback: true,
      ...config,
    };

    // Determine task type based on studio
    const taskType = this.determineTaskType(studioType);

    // Build routing request
    const request: RoutingRequest = {
      id: `route-${Date.now()}`,
      type: 'llm',
      prompt: task,
      parameters: {
        costPriority: fullConfig.costPriority,
        qualityPriority: fullConfig.qualityPriority,
        speedPriority: fullConfig.speedPriority,
      },
      priority: this.determinePriority(studioType),
      fallbackEnabled: fullConfig.enableFallback,
    };

    // Route the request
    const decision = await this.routingService.route(request);

    // Convert to provider selection
    const selection: ProviderSelection = {
      provider: decision.selectedProvider,
      model: this.extractModel(decision.selectedProvider),
      estimatedCost: decision.estimatedCost,
      estimatedQuality: decision.estimatedQuality,
      estimatedTime: decision.estimatedTime,
      reasoning: decision.reasoning,
      fallbackChain: decision.fallbackChain,
    };

    // Record selection
    this.selectionHistory.push(selection);

    console.log(`🧭 [Routing] Selected: ${selection.provider} for ${studioType}`);
    console.log(`  💰 Cost: $${selection.estimatedCost.toFixed(4)} | ⭐ Quality: ${(selection.estimatedQuality * 100).toFixed(0)}% | ⚡ Time: ${selection.estimatedTime}ms`);

    return selection;
  }

  /**
   * Update provider metrics after execution
   */
  async updateProviderMetrics(
    provider: string,
    actualCost: number,
    actualTime: number,
    actualQuality: number,
    success: boolean
  ): Promise<void> {
    await this.routingService.updateMetrics(provider, {
      cost: actualCost,
      responseTime: actualTime,
      quality: actualQuality,
      success,
    });

    console.log(`📊 [Routing] Updated metrics for ${provider} - Success: ${success}`);
  }

  /**
   * Get routing statistics
   */
  getRoutingStatistics() {
    const totalSelections = this.selectionHistory.length;
    if (totalSelections === 0) {
      return {
        totalSelections: 0,
        avgCost: 0,
        avgQuality: 0,
        avgTime: 0,
        providerDistribution: {},
      };
    }

    const avgCost = this.selectionHistory.reduce((sum, s) => sum + s.estimatedCost, 0) / totalSelections;
    const avgQuality = this.selectionHistory.reduce((sum, s) => sum + s.estimatedQuality, 0) / totalSelections;
    const avgTime = this.selectionHistory.reduce((sum, s) => sum + s.estimatedTime, 0) / totalSelections;

    // Provider distribution
    const providerCounts: Record<string, number> = {};
    this.selectionHistory.forEach(s => {
      providerCounts[s.provider] = (providerCounts[s.provider] || 0) + 1;
    });

    return {
      totalSelections,
      avgCost,
      avgQuality,
      avgTime,
      providerDistribution: providerCounts,
    };
  }

  /**
   * Determine task type from studio
   */
  private determineTaskType(studioType: StudioType): 'code' | 'text' | 'analysis' | 'creative' {
    const studioTypeMap: Record<string, 'code' | 'text' | 'analysis' | 'creative'> = {
      'ideation_lab': 'creative',
      'market_validation': 'analysis',
      'product_development': 'code',
      'growth_hacking': 'analysis',
      'monetization': 'analysis',
      'operations': 'analysis',
      'legal_compliance': 'text',
      'finance': 'analysis',
      'hr_recruiting': 'text',
      'enterprise_readiness': 'code',
    };

    return studioTypeMap[studioType] || 'text';
  }

  /**
   * Determine priority from studio
   */
  private determinePriority(studioType: StudioType): 'low' | 'medium' | 'high' | 'urgent' {
    const criticalStudios = ['product_development', 'enterprise_readiness'];
    return criticalStudios.includes(studioType) ? 'high' : 'medium';
  }

  /**
   * Extract model name from provider ID
   */
  private extractModel(providerId: string): string {
    // Extract model from provider ID (e.g., "openai_gpt4o" -> "gpt-4o")
    const parts = providerId.split('_');
    return parts.length > 1 ? parts.slice(1).join('-') : providerId;
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const stats = this.getRoutingStatistics();
    return {
      status: 'healthy' as const,
      totalSelections: stats.totalSelections,
      avgCostPerRequest: stats.avgCost,
      avgQualityScore: stats.avgQuality,
      features: {
        costOptimization: true,
        qualitySelection: true,
        loadBalancing: true,
        autoFallback: true,
      },
    };
  }
}

// Export singleton instance
export const intelligentRoutingWiringService = new IntelligentRoutingWiringService();
