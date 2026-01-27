/**
 * Standalone Orchestration API
 * Minimal API for standalone WAI SDK usage
 * Full OrchestrationFacade, Core, and Routing available in Incubator integration
 */

export interface OrchestrationConfig {
  apiKeys?: Record<string, string>;
  defaultProvider?: string;
  defaultModel?: string;
}

export interface OrchestrationRequest {
  prompt: string;
  context?: Record<string, any>;
  provider?: string;
  model?: string;
}

export interface OrchestrationResponse {
  success: boolean;
  result?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Standalone Orchestration Client
 * Lightweight client for direct LLM orchestration without Incubator platform
 */
export class StandaloneOrchestrationClient {
  private config: OrchestrationConfig;

  constructor(config: OrchestrationConfig = {}) {
    this.config = config;
  }

  async execute(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    // Minimal implementation - will be enhanced in future versions
    return {
      success: false,
      error: 'Standalone orchestration not yet implemented. Use @wai/providers directly or integrate with Incubator platform.',
    };
  }
}

// Re-export request builder for advanced users
export * from './request-builder';
