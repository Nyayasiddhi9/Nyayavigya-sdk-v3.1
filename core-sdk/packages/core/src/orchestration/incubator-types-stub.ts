/**
 * Incubator Types Stub
 * Minimal type definitions for standalone SDK builds
 * Full types from @shared/wizards-incubator-types when integrated
 */

export interface OrchestrationResult {
  success: boolean;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface StartupContext {
  startupId?: number;
  userId?: number;
}

export interface StudioType {
  id: string;
  name: string;
}
