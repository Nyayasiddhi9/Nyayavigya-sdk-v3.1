/**
 * Shared AG-UI WAI Integration Service Instance
 * 
 * CRITICAL: This ensures all components (routes, orchestration, builders) use the SAME
 * AG-UI service instance, so sessions created in routes are accessible during orchestration.
 * 
 * Without this singleton pattern, routes create sessions in one instance while orchestration
 * emits events to a different instance, breaking real-time streaming.
 */

import { AGUIWAIIntegrationService } from './agui-wai-integration-service';

/**
 * Global shared AG-UI service instance
 * Used across all routes, services, and orchestration layers
 */
export const sharedAGUIService = new AGUIWAIIntegrationService({
  enableStreaming: true,
  transport: 'sse',
  heartbeatInterval: 30000,
  reconnectAttempts: 3,
  eventBuffer: 1000,
  compression: false,
});

console.log('✅ Shared AG-UI Service initialized (singleton pattern)');
