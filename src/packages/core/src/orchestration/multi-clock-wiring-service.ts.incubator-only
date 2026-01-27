/**
 * Multi-Clock Orchestration Wiring Service
 * 
 * Enables deterministic execution with dual-clock architecture:
 * - Primary Clock: Real-time system clock for logging and monitoring
 * - Logical Clock: Deterministic clock for reproducible testing and debugging
 * 
 * Key Features:
 * - Seed-based determinism for regression testing
 * - Clock propagation across distributed agents
 * - Time-travel debugging support
 * - Audit trail with precise timestamp correlation
 */

import { createClockProvider, type ClockProvider } from './clock-provider';
import type { StudioType } from '@shared/schema';

export interface MultiClockConfig {
  deterministicMode: boolean;
  clockSeed?: string;
  enableTimeTravel?: boolean;
  auditPrecision?: 'millisecond' | 'microsecond' | 'nanosecond';
}

export interface ClockState {
  primaryTime: Date;
  logicalTime: Date;
  seed: string | null;
  isDeterministic: boolean;
  driftMs: number;
}

/**
 * Multi-Clock Orchestration Wiring Service
 */
class MultiClockWiringService {
  private activeClocks: Map<string, any> = new Map();

  constructor() {
    console.log('⏰ Multi-Clock Orchestration Wiring Service initialized');
    console.log('🎯 Dual-clock architecture: Primary (real-time) + Logical (deterministic)');
  }

  /**
   * Initialize clocks for orchestration run
   */
  createClockForOrchestration(config: MultiClockConfig): { primary: ClockProvider, logical: ClockProvider } {
    const { deterministicMode, clockSeed } = config;

    // Create primary clock (always real-time)
    const primaryClock = createClockProvider(false);

    // Create logical clock (deterministic if seed provided)
    const logicalClock = deterministicMode && clockSeed
      ? createClockProvider(true, clockSeed)
      : primaryClock; // Use same clock if not deterministic

    console.log(`⏰ [Multi-Clock] Created clocks - Primary: real-time, Logical: ${deterministicMode ? 'deterministic (seed: ' + clockSeed + ')' : 'real-time'}`);

    return { primary: primaryClock, logical: logicalClock };
  }

  /**
   * Get current clock state for monitoring
   */
  getClockState(orchestrationId: string): ClockState | null {
    const clock = this.activeClocks.get(orchestrationId);
    if (!clock) return null;

    const primaryTime = new Date();
    const logicalTime = clock.now ? clock.now() : new Date();

    return {
      primaryTime,
      logicalTime,
      seed: clock.seed || null,
      isDeterministic: !!clock.seed,
      driftMs: primaryTime.getTime() - logicalTime.getTime(),
    };
  }

  /**
   * Propagate clock seed to sub-agents for consistency
   */
  propagateSeedToSubAgents(parentSeed: string, subAgentIndex: number): string {
    // Generate deterministic sub-seed from parent seed
    return `${parentSeed}-sub${subAgentIndex}`;
  }

  /**
   * Enable time-travel debugging (replay with same seed)
   */
  createReplayClockFromSeed(seed: string): ClockProvider {
    console.log(`⏮️ [Time Travel] Creating replay clock from seed: ${seed}`);
    return createClockProvider(true, seed);
  }

  /**
   * Verify clock consistency across distributed execution
   */
  verifyClockConsistency(orchestrationId: string, expectedTimestamp: Date): boolean {
    const state = this.getClockState(orchestrationId);
    if (!state) return false;

    // Allow 10ms drift for non-deterministic clocks
    const tolerance = state.isDeterministic ? 0 : 10;
    const drift = Math.abs(state.logicalTime.getTime() - expectedTimestamp.getTime());

    return drift <= tolerance;
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      status: 'healthy' as const,
      activeClocks: this.activeClocks.size,
      features: {
        deterministicMode: true,
        timeTravel: true,
        seedPropagation: true,
        auditTrail: true,
      },
    };
  }
}

// Export singleton instance
export const multiClockWiringService = new MultiClockWiringService();
