/**
 * Clock Provider
 * Stub for multi-clock orchestration
 */

export interface ClockProvider {
  getPrimaryTime(): Date;
  getLogicalTime(): Date;
  getSeed(): string | null;
  isDeterministic(): boolean;
}

export function createClockProvider(config?: { seed?: string }): ClockProvider {
  return {
    getPrimaryTime: () => new Date(),
    getLogicalTime: () => new Date(),
    getSeed: () => config?.seed || null,
    isDeterministic: () => !!config?.seed,
  };
}
