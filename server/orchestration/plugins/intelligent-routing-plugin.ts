/**
 * Intelligent Routing Plugin Adapter
 * 
 * Wraps IntelligentRoutingWiringService as a UnifiedRoutingRegistry plugin
 * Selects optimal LLM provider based on cost, quality, and speed
 * 
 * Phase 2A Stage 0 - Example plugin implementation
 */

import type { IRoutingPlugin, PluginContext } from '../unified-routing-registry';
import type { WAIOrchestrationRequestInput } from '../../builders/wai-request-builder';
import type { OrchestrationResult } from '@shared/wizards-incubator-types';
import { intelligentRoutingWiringService } from '../../services/intelligent-routing-wiring-service';
import type { StudioType } from '@shared/schema';

/**
 * Intelligent Routing plugin for Unified Routing Registry
 * Optimizes provider selection for cost, quality, and speed
 */
export class IntelligentRoutingPlugin implements IRoutingPlugin {
  readonly id = 'intelligent-routing';
  readonly name = 'Intelligent Provider Routing';
  readonly description = 'Selects optimal LLM provider based on cost optimization, quality requirements, and speed constraints';

  async initialize(): Promise<void> {
    console.log('🧭 Intelligent Routing plugin initialized');
  }

  /**
   * Pre-orchestration: Select optimal provider
   */
  async onPreOrchestration(
    request: WAIOrchestrationRequestInput,
    context: PluginContext
  ): Promise<WAIOrchestrationRequestInput> {
    const studioType = context.studioId as StudioType || 'ideation_lab';

    // Extract routing preferences from request
    const costPriority = request.preferences?.costOptimization ? 0.8 : 0.5;
    const qualityPriority = request.preferences?.qualityThreshold || 0.7;
    const speedPriority = request.preferences?.timeConstraint ? 0.9 : 0.6;

    // Select optimal provider
    const selection = await intelligentRoutingWiringService.selectOptimalProvider(
      request.task,
      studioType,
      {
        costPriority,
        qualityPriority,
        speedPriority,
        enableFallback: true,
      }
    );

    // Update request preferences with selected provider
    return {
      ...request,
      preferences: {
        ...request.preferences,
        preferredProviders: [selection.provider],
        prohibitedProviders: [],
      },
      metadata: {
        ...request.metadata,
        intelligentRouting: {
          selectedProvider: selection.provider,
          selectedModel: selection.model,
          estimatedCost: selection.estimatedCost,
          estimatedQuality: selection.estimatedQuality,
          estimatedTime: selection.estimatedTime,
          reasoning: selection.reasoning,
          fallbackChain: selection.fallbackChain,
        },
      },
    };
  }

  /**
   * Post-orchestration: Update provider metrics
   */
  async onPostOrchestration(
    request: WAIOrchestrationRequestInput,
    result: OrchestrationResult,
    context: PluginContext
  ): Promise<OrchestrationResult> {
    const routing = request.metadata?.intelligentRouting as any;
    
    if (routing && result.metadata?.provider) {
      const actualProvider = result.metadata.provider;
      const actualCost = result.metadata.cost || routing.estimatedCost;
      const actualTime = result.metadata.executionTime || routing.estimatedTime;
      const actualQuality = result.success ? 1.0 : 0.5;

      // Update provider metrics for future routing decisions
      await intelligentRoutingWiringService.updateProviderMetrics(
        actualProvider,
        actualCost,
        actualTime,
        actualQuality,
        result.success
      );

      // Add accuracy metrics
      return {
        ...result,
        metadata: {
          ...result.metadata,
          routingAccuracy: {
            costAccuracy: this.calculateAccuracy(routing.estimatedCost, actualCost),
            timeAccuracy: this.calculateAccuracy(routing.estimatedTime, actualTime),
            qualityAccuracy: this.calculateAccuracy(routing.estimatedQuality, actualQuality),
          },
        },
      };
    }

    return result;
  }

  /**
   * Calculate prediction accuracy
   */
  private calculateAccuracy(estimated: number, actual: number): number {
    if (estimated === 0) return 1.0;
    const error = Math.abs(estimated - actual) / estimated;
    return Math.max(0, 1 - error);
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Intelligent Routing plugin cleanup complete');
  }
}

/**
 * Factory function to create and configure Intelligent Routing plugin
 */
export function createIntelligentRoutingPlugin(): IntelligentRoutingPlugin {
  return new IntelligentRoutingPlugin();
}
