/**
 * Shared WAI Orchestration Core Instance
 * 
 * Single source of truth for orchestration components across all route modules.
 * Prevents isolated state and ensures consistent behavior.
 */

import { WAIOrchestrationCoreV9 } from '../orchestration/wai-orchestration-core-v9';

let sharedOrchestrationCore: WAIOrchestrationCoreV9 | null = null;

/**
 * Set the shared orchestration core instance (called from main server)
 */
export function setSharedOrchestrationCore(instance: WAIOrchestrationCoreV9): void {
  sharedOrchestrationCore = instance;
  console.log('✅ Shared WAI Orchestration Core v9.0 instance registered for unified access');
}

/**
 * Get the shared orchestration core instance
 * Must be set first via setSharedOrchestrationCore
 */
export async function getSharedOrchestrationCore(): Promise<WAIOrchestrationCoreV9> {
  if (!sharedOrchestrationCore) {
    throw new Error('Shared orchestration core not initialized. Call setSharedOrchestrationCore first from main server.');
  }
  return sharedOrchestrationCore;
}

/**
 * Get the runtime agent factory from the shared orchestration core
 */
export function getRuntimeAgentFactory() {
  if (!sharedOrchestrationCore) {
    throw new Error('Shared orchestration core not initialized. Call setSharedOrchestrationCore first from main server.');
  }
  return sharedOrchestrationCore.getRuntimeAgentFactory();
}

/**
 * Reset the shared orchestration core (for testing purposes)
 */
export function resetSharedOrchestrationCore(): void {
  sharedOrchestrationCore = null;
}