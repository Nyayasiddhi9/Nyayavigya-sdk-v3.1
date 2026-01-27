/**
 * BMAD Plugin Adapter
 * 
 * Wraps BMADWiringService as a UnifiedRoutingRegistry plugin
 * Applies agent personality and behavioral patterns
 * 
 * Phase 2A Stage 0 - Example plugin implementation
 */

import type { IRoutingPlugin, PluginContext } from '../unified-routing-registry';
import type { WAIOrchestrationRequestInput } from '../../builders/wai-request-builder';
import type { OrchestrationResult } from '@shared/wizards-incubator-types';
import { bmadWiringService } from '../../services/bmad-wiring-service';

/**
 * BMAD plugin for Unified Routing Registry
 * Applies behavioral patterns and personality traits
 */
export class BMADPlugin implements IRoutingPlugin {
  readonly id = 'bmad';
  readonly name = 'BMAD Behavioral Design';
  readonly description = 'Applies agent personality traits and behavioral patterns for human-like interaction';

  async initialize(): Promise<void> {
    console.log('🎭 BMAD plugin initialized');
  }

  /**
   * Pre-orchestration: Apply personality to prompt
   */
  async onPreOrchestration(
    request: WAIOrchestrationRequestInput,
    context: PluginContext
  ): Promise<WAIOrchestrationRequestInput> {
    const agentId = context.studioId || 'default';
    const originalTask = request.task;

    // Determine personality based on studio/workflow type
    const personality = this.selectPersonality(request.type, context.studioId);

    // Apply personality to task
    const enhancedTask = await bmadWiringService.applyPersonality(
      agentId,
      originalTask,
      personality,
      context.metadata || {}
    );

    // Return modified request
    return {
      ...request,
      task: enhancedTask,
      metadata: {
        ...request.metadata,
        bmadPersonality: personality,
        bmadApplied: true,
      },
    };
  }

  /**
   * Post-orchestration: Analyze behavioral consistency
   */
  async onPostOrchestration(
    request: WAIOrchestrationRequestInput,
    result: OrchestrationResult,
    context: PluginContext
  ): Promise<OrchestrationResult> {
    // Analyze if output matches expected personality
    const personality = request.metadata?.bmadPersonality as string;
    
    if (personality && result.output) {
      const consistency = await bmadWiringService.analyzeBehavioralConsistency(
        result.output,
        personality
      );

      return {
        ...result,
        metadata: {
          ...result.metadata,
          bmadConsistency: {
            score: consistency.score,
            matched: consistency.matched,
            deviations: consistency.deviations,
          },
        },
      };
    }

    return result;
  }

  /**
   * Select personality based on orchestration type and studio
   */
  private selectPersonality(
    orchestrationType: string,
    studioId?: string
  ): string {
    if (orchestrationType === 'development' || studioId === 'engineering-forge') {
      return 'analytical';
    }
    if (orchestrationType === 'creative' || studioId === 'design-studio') {
      return 'creative';
    }
    if (studioId === 'ideation-lab' || studioId === 'market-validation') {
      return 'pragmatic';
    }
    return 'empathetic'; // Default for customer-facing
  }

  async cleanup(): Promise<void> {
    console.log('🧹 BMAD plugin cleanup complete');
  }
}

/**
 * Factory function to create and configure BMAD plugin
 */
export function createBMADPlugin(): BMADPlugin {
  return new BMADPlugin();
}
