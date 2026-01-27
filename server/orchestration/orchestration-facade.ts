/**
 * Orchestration Facade
 * 
 * PURPOSE: Unified entrypoint for all WAI SDK orchestration requests
 * Replaces ad-hoc orchestration patterns across 120+ services with standardized approach
 * 
 * FEATURES:
 * - Wraps WAIRequestBuilder with type-safe fluent API
 * - Manages AG-UI session lifecycle automatically
 * - Standardized error handling, retries, and fallbacks
 * - Centralized telemetry and monitoring hooks
 * - Enforces WAI SDK as single source of truth
 * 
 * MIGRATION PATH:
 * ```typescript
 * // BEFORE: Direct provider calls
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const response = await openai.chat.completions.create({ ... });
 * 
 * // AFTER: Unified facade
 * const facade = new OrchestrationFacade({ 
 *   startupId, 
 *   userId,
 *   studioId: 'ideation-lab' 
 * });
 * const response = await facade.executeWorkflow('idea-validation', {
 *   ideaDescription: '...'
 * });
 * ```
 * 
 * Phase 2A Stage 0 - Foundation for refactoring 23+ services
 */

import { randomUUID } from 'crypto';
import { WAIRequestBuilder, type WAIOrchestrationRequestInput, type OrchestrationTypeInput, type PriorityInput } from '../builders/wai-request-builder';
import { sharedAGUIService } from '../services/shared-agui-service';
import WAIOrchestrationCoreV9 from './wai-orchestration-core-v9';
import type { OrchestrationResult } from '@shared/wizards-incubator-types';
import { camMonitoringService } from '../services/cam-monitoring-service';
import { romaAutonomyService } from '../services/roma-autonomy-service';
import type { RomaAutonomyLevel } from '../integrations/types/roma-types';
import { unifiedRoutingRegistry } from './unified-routing-registry';

/**
 * Orchestration Facade Configuration
 */
export interface OrchestrationFacadeConfig {
  /** Startup ID for context binding */
  startupId?: number;
  
  /** User ID for attribution and analytics */
  userId?: number;
  
  /** Studio ID for specialized routing (e.g., 'ideation-lab', 'engineering-forge') */
  studioId?: string;
  
  /** Session ID for AG-UI streaming (auto-generated if not provided) */
  sessionId?: string;
  
  /** ROMA autonomy level (default: L2 - supervised autonomy) */
  autonomyLevel?: RomaAutonomyLevel;
  
  /** Enable AG-UI streaming (default: true) */
  enableStreaming?: boolean;
  
  /** Enable CAM monitoring (default: true) */
  enableMonitoring?: boolean;
  
  /** Enable automatic retries on failure (default: true) */
  enableRetries?: boolean;
  
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
}

/**
 * Workflow execution options
 */
export interface WorkflowExecutionOptions {
  /** Orchestration type (default: 'hybrid') */
  type?: OrchestrationTypeInput;
  
  /** Priority level (default: 'medium') */
  priority?: PriorityInput;
  
  /** Additional parameters for workflow */
  parameters?: Record<string, unknown>;
  
  /** Additional context for workflow */
  context?: Record<string, unknown>;
  
  /** Cost optimization preference (default: true) */
  costOptimization?: boolean;
  
  /** Quality threshold 0-1 (default: 0.8) */
  qualityThreshold?: number;
  
  /** Time constraint in seconds (optional) */
  timeConstraint?: number;
  
  /** Preferred LLM providers (optional) */
  preferredProviders?: string[];
  
  /** Prohibited LLM providers (optional) */
  prohibitedProviders?: string[];
}

/**
 * Execution result with extended metadata
 */
export interface FacadeExecutionResult extends OrchestrationResult {
  /** AG-UI session ID for real-time event streaming */
  aguiSessionId?: string;
  
  /** CAM metrics tracking ID */
  camTrackingId?: string;
  
  /** Total execution time in milliseconds */
  executionTimeMs?: number;
  
  /** Number of retry attempts made */
  retryCount?: number;
  
  /** Providers used (in order of attempt) */
  providersUsed?: string[];
}

/**
 * Execution error with rich context
 */
export class OrchestrationExecutionError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
    public readonly context: {
      workflowName: string;
      startupId?: number;
      userId?: number;
      studioId?: string;
      retryCount: number;
      providersAttempted: string[];
    }
  ) {
    super(message);
    this.name = 'OrchestrationExecutionError';
  }
}

/**
 * Orchestration Facade
 * 
 * Unified entrypoint enforcing WAI SDK as single source of truth
 */
export class OrchestrationFacade {
  private config: Required<OrchestrationFacadeConfig>;
  private waiCore: WAIOrchestrationCoreV9;
  private aguiSessionId: string;

  constructor(config: OrchestrationFacadeConfig = {}) {
    // Set defaults
    this.config = {
      startupId: config.startupId ?? 0,
      userId: config.userId ?? 0,
      studioId: config.studioId ?? 'unknown',
      sessionId: config.sessionId ?? randomUUID(),
      autonomyLevel: config.autonomyLevel ?? 'L2',
      enableStreaming: config.enableStreaming ?? true,
      enableMonitoring: config.enableMonitoring ?? true,
      enableRetries: config.enableRetries ?? true,
      maxRetries: config.maxRetries ?? 3,
    };

    // Initialize WAI Core
    this.waiCore = new WAIOrchestrationCoreV9();

    // Create AG-UI session for real-time streaming
    if (this.config.enableStreaming) {
      const session = sharedAGUIService.createSession(
        this.config.startupId,
        this.config.sessionId,
        this.config.studioId
      );
      this.aguiSessionId = session.id;
    } else {
      this.aguiSessionId = '';
    }

    console.log(`✅ OrchestrationFacade initialized [studio=${this.config.studioId}, session=${this.aguiSessionId.substring(0, 8)}...]`);
  }

  /**
   * Execute a workflow with unified orchestration pattern
   * 
   * @param workflowName - Name of the workflow to execute
   * @param workflowParams - Workflow-specific parameters
   * @param options - Execution options (type, priority, preferences)
   * @returns Execution result with AG-UI session ID and metadata
   * 
   * @example
   * ```typescript
   * const facade = new OrchestrationFacade({ startupId: 123, studioId: 'ideation-lab' });
   * const result = await facade.executeWorkflow('idea-validation', {
   *   ideaDescription: 'AI-powered recipe generator',
   *   targetMarket: 'Home cooks'
   * }, {
   *   type: 'analysis',
   *   priority: 'high',
   *   costOptimization: true
   * });
   * ```
   */
  async executeWorkflow(
    workflowName: string,
    workflowParams: Record<string, unknown> = {},
    options: WorkflowExecutionOptions = {}
  ): Promise<FacadeExecutionResult> {
    const startTime = Date.now();
    const requestId = randomUUID();
    let retryCount = 0;
    const providersUsed: string[] = [];
    let camTrackingId: string | undefined;

    try {
      // Emit AG-UI status event
      if (this.config.enableStreaming && this.aguiSessionId) {
        sharedAGUIService.emitEvent(this.aguiSessionId, {
          type: 'status_change',
          status: 'executing',
          workflow: workflowName,
          timestamp: new Date().toISOString(),
        });
      }

      // Start CAM monitoring
      if (this.config.enableMonitoring) {
        camTrackingId = `cam_${workflowName}_${Date.now()}`;
        camMonitoringService.trackOperationStart({
          operationId: camTrackingId,
          operationType: 'workflow_execution',
          metadata: {
            workflowName,
            studioId: this.config.studioId,
            startupId: this.config.startupId,
          },
        });
      }

      // Default optional bags to empty objects before spreading
      const extraParams = options.parameters ?? {};
      const extraContext = options.context ?? {};

      // Build orchestration request using WAIRequestBuilder
      const requestBuilder = new WAIRequestBuilder()
        .setType(options.type ?? 'hybrid')
        .setTask(`Execute ${workflowName} workflow`)
        .setPriority(options.priority ?? 'medium')
        .setParameters({
          workflowName,
          ...workflowParams,
          ...extraParams,
        })
        .setContext({
          startupId: this.config.startupId,
          userId: this.config.userId,
          studioId: this.config.studioId,
          sessionId: this.config.sessionId,
          ...extraContext,
        })
        .setPreferences({
          costOptimization: options.costOptimization ?? true,
          qualityThreshold: options.qualityThreshold ?? 0.8,
          timeConstraint: options.timeConstraint,
          preferredProviders: options.preferredProviders,
          prohibitedProviders: options.prohibitedProviders,
        });

      // Attach AG-UI session for real-time streaming
      if (this.config.enableStreaming && this.aguiSessionId) {
        requestBuilder.withAGUISession(this.aguiSessionId, sharedAGUIService);
      }

      // Build and validate request
      let orchestrationRequest = requestBuilder.build();

      // APPLY PRE-ORCHESTRATION PLUGINS (Unified Routing Registry)
      const pluginContext = {
        requestId,
        startupId: this.config.startupId,
        userId: this.config.userId,
        studioId: this.config.studioId,
        workflowName,
        metadata: options.context,
      };

      try {
        const { modifiedRequest, pluginResults: prePluginResults } = 
          await unifiedRoutingRegistry.applyPreOrchestrationPlugins(orchestrationRequest, pluginContext);
        
        orchestrationRequest = modifiedRequest;
        
        // Log plugin modifications
        const modifiedPlugins = prePluginResults.filter(p => p.modified);
        if (modifiedPlugins.length > 0) {
          console.log(`🔌 ${modifiedPlugins.length} plugins modified request: ${modifiedPlugins.map(p => p.pluginId).join(', ')}`);
        }
      } catch (error) {
        console.warn('⚠️  Pre-orchestration plugins failed, continuing without plugins:', error);
        // Continue without plugins on failure
      }

      // Execute with retry logic
      let result: OrchestrationResult | null = null;
      let lastError: Error | null = null;

      while (retryCount <= (this.config.enableRetries ? this.config.maxRetries : 0)) {
        try {
          // Execute through WAI Core
          result = await this.waiCore.orchestrate(orchestrationRequest);
          
          // Track provider used
          if (result.metadata?.provider) {
            providersUsed.push(result.metadata.provider);
          }

          // Success - break retry loop
          break;
        } catch (error) {
          lastError = error as Error;
          retryCount++;

          if (retryCount > this.config.maxRetries) {
            throw error; // Max retries reached
          }

          // Emit retry event
          if (this.config.enableStreaming && this.aguiSessionId) {
            sharedAGUIService.emitEvent(this.aguiSessionId, {
              type: 'status_change',
              status: 'retrying',
              attempt: retryCount,
              maxAttempts: this.config.maxRetries,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString(),
            });
          }

          // Exponential backoff
          await this.sleep(Math.pow(2, retryCount) * 1000);
        }
      }

      if (!result) {
        throw lastError ?? new Error('Orchestration failed with no result');
      }

      // Calculate execution time
      const executionTimeMs = Date.now() - startTime;

      // APPLY POST-ORCHESTRATION PLUGINS (Unified Routing Registry)
      let finalResult = result;
      let postPluginResults: any[] = [];
      
      try {
        const postResult = await unifiedRoutingRegistry.applyPostOrchestrationPlugins(orchestrationRequest, result, pluginContext);
        finalResult = postResult.modifiedResult;
        postPluginResults = postResult.pluginResults;

        // Log plugin modifications
        const modifiedPostPlugins = postPluginResults.filter(p => p.modified);
        if (modifiedPostPlugins.length > 0) {
          console.log(`🔌 ${modifiedPostPlugins.length} plugins modified result: ${modifiedPostPlugins.map(p => p.pluginId).join(', ')}`);
        }
      } catch (error) {
        console.warn('⚠️  Post-orchestration plugins failed, continuing without plugins:', error);
        // Continue with original result on failure
        finalResult = result;
      }

      // Complete CAM monitoring
      if (this.config.enableMonitoring && camTrackingId) {
        camMonitoringService.trackOperationComplete({
          operationId: camTrackingId,
          success: finalResult.success,
          durationMs: executionTimeMs,
          metadata: {
            providersUsed,
            retryCount,
            prePlugins: prePluginResults.length,
            postPlugins: postPluginResults.length,
          },
        });
      }

      // Emit completion event
      if (this.config.enableStreaming && this.aguiSessionId) {
        sharedAGUIService.emitEvent(this.aguiSessionId, {
          type: 'status_change',
          status: finalResult.success ? 'completed' : 'failed',
          workflow: workflowName,
          timestamp: new Date().toISOString(),
        });
      }

      // Return enriched result
      return {
        ...finalResult,
        aguiSessionId: this.aguiSessionId,
        camTrackingId,
        executionTimeMs,
        retryCount,
        providersUsed,
      };
    } catch (error) {
      // Emit error event
      if (this.config.enableStreaming && this.aguiSessionId) {
        sharedAGUIService.emitEvent(this.aguiSessionId, {
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          workflow: workflowName,
          timestamp: new Date().toISOString(),
        });
      }

      // Complete CAM monitoring with failure
      if (this.config.enableMonitoring && camTrackingId) {
        camMonitoringService.trackOperationComplete({
          operationId: camTrackingId,
          success: false,
          durationMs: Date.now() - startTime,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            providersUsed,
            retryCount,
          },
        });
      }

      // Throw enriched error
      throw new OrchestrationExecutionError(
        `Workflow execution failed: ${workflowName}`,
        error as Error,
        {
          workflowName,
          startupId: this.config.startupId,
          userId: this.config.userId,
          studioId: this.config.studioId,
          retryCount,
          providersAttempted: providersUsed,
        }
      );
    }
  }

  /**
   * Get AG-UI session ID for client-side event streaming
   */
  getAGUISessionId(): string {
    return this.aguiSessionId;
  }

  /**
   * Close AG-UI session and cleanup resources
   */
  close(): void {
    if (this.aguiSessionId) {
      sharedAGUIService.closeSession(this.aguiSessionId);
    }
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
