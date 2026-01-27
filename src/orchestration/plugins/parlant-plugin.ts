/**
 * Parlant Plugin Adapter
 * 
 * Wraps ParlantWiringService as a UnifiedRoutingRegistry plugin
 * Demonstrates migration pattern from wiring service to plugin
 * 
 * Phase 2A Stage 0 - Example plugin implementation
 */

import type { IRoutingPlugin, PluginContext } from '../unified-routing-registry';
import type { WAIOrchestrationRequestInput } from '../../builders/wai-request-builder';
import type { OrchestrationResult } from '@shared/wizards-incubator-types';
import { ParlantWiringService } from '../../services/parlant-wiring-service';

/**
 * Parlant plugin for Unified Routing Registry
 * Applies Parlant standards to all orchestration requests
 */
export class ParlantPlugin implements IRoutingPlugin {
  readonly id = 'parlant';
  readonly name = 'Parlant Standards';
  readonly description = 'Applies Parlant prompt engineering standards with anti-hallucination safeguards';

  private parlantService: ParlantWiringService;

  constructor() {
    this.parlantService = new ParlantWiringService();
  }

  async initialize(): Promise<void> {
    console.log('🎯 Parlant plugin initialized');
  }

  /**
   * Pre-orchestration: Apply Parlant standards to prompt
   */
  async onPreOrchestration(
    request: WAIOrchestrationRequestInput,
    context: PluginContext
  ): Promise<WAIOrchestrationRequestInput> {
    const agentId = context.studioId || 'default';
    const workflowType = context.workflowName;
    const originalTask = request.task;

    // Apply Parlant standards to task prompt
    const optimizedTask = await this.parlantService.applyStandards(
      agentId,
      originalTask,
      context.metadata || {},
      workflowType
    );

    // Return modified request
    return {
      ...request,
      task: optimizedTask,
      metadata: {
        ...request.metadata,
        parlantApplied: true,
        originalTask,
      },
    };
  }

  /**
   * Post-orchestration: Validate response against Parlant standards
   */
  async onPostOrchestration(
    request: WAIOrchestrationRequestInput,
    result: OrchestrationResult,
    context: PluginContext
  ): Promise<OrchestrationResult> {
    // Validate output quality
    if (result.output) {
      const validation = await this.parlantService.validateOutput(
        result.output,
        context.studioId || 'default'
      );

      // Add validation metadata
      return {
        ...result,
        metadata: {
          ...result.metadata,
          parlantValidation: {
            passed: validation.passed,
            violations: validation.violations.length,
            score: validation.passed ? 1.0 : 0.5,
          },
        },
      };
    }

    return result;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Parlant plugin cleanup complete');
  }
}

/**
 * Factory function to create and configure Parlant plugin
 */
export function createParlantPlugin(): ParlantPlugin {
  return new ParlantPlugin();
}
