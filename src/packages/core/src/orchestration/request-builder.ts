/**
 * WAI Request Builder
 * 
 * Type-safe builder for WAI Orchestration requests using Zod validation.
 * Provides fluent API for constructing valid orchestration requests with compile-time
 * and runtime type safety.
 * 
 * Phase 2.3: Production-ready request builder with Zod schemas
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';
import WAIOrchestrationCoreV9 from '../orchestration/wai-orchestration-core-v9';
import { AGUIWAIIntegrationService } from '../services/agui-wai-integration-service';

// ================================================================================================
// ZOD SCHEMAS FOR VALIDATION
// ================================================================================================

/**
 * Orchestration request type schema
 */
export const orchestrationTypeSchema = z.enum([
  'development',
  'creative',
  'analysis',
  'enterprise',
  'hybrid'
]);

/**
 * Priority level schema
 */
export const prioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
  'quantum'
]);

/**
 * Orchestration preferences schema
 */
export const orchestrationPreferencesSchema = z.object({
  costOptimization: z.boolean().optional(),
  qualityThreshold: z.number().min(0).max(1).optional(),
  timeConstraint: z.number().positive().optional(),
  preferredProviders: z.array(z.string()).optional(),
  prohibitedProviders: z.array(z.string()).optional()
}).optional();

/**
 * Complete WAI Orchestration Request schema
 */
export const waiOrchestrationRequestSchema = z.object({
  id: z.string().uuid().optional(),
  type: orchestrationTypeSchema,
  task: z.string().min(1, 'Task description is required'),
  priority: prioritySchema.default('medium'),
  parameters: z.record(z.unknown()).optional(),
  context: z.record(z.unknown()).optional(),
  preferences: orchestrationPreferencesSchema,
  metadata: z.record(z.unknown()).optional()
});

/**
 * Inferred TypeScript types from Zod schemas
 */
export type WAIOrchestrationRequestInput = z.infer<typeof waiOrchestrationRequestSchema>;
export type OrchestrationTypeInput = z.infer<typeof orchestrationTypeSchema>;
export type PriorityInput = z.infer<typeof prioritySchema>;
export type OrchestrationPreferencesInput = z.infer<typeof orchestrationPreferencesSchema>;

// ================================================================================================
// REQUEST BUILDER CLASS
// ================================================================================================

/**
 * Fluent builder for constructing type-safe WAI Orchestration requests
 * 
 * @example
 * const request = new WAIRequestBuilder()
 *   .setType('development')
 *   .setTask('Create a React component for user authentication')
 *   .setPriority('high')
 *   .setPreferences({ costOptimization: true })
 *   .setContext({ projectId: '123', userId: 'user-456' })
 *   .build();
 */
export class WAIRequestBuilder {
  private request: Partial<WAIOrchestrationRequestInput> = {
    priority: 'medium'
  };
  private aguiSessionId?: string;
  private waiCore?: WAIOrchestrationCoreV9;
  private aguiService?: AGUIWAIIntegrationService;

  /**
   * Set the orchestration type
   */
  setType(type: OrchestrationTypeInput): this {
    this.request.type = type;
    return this;
  }

  /**
   * Set the task description (required)
   */
  setTask(task: string): this {
    this.request.task = task;
    return this;
  }

  /**
   * Set the priority level (default: medium)
   */
  setPriority(priority: PriorityInput): this {
    this.request.priority = priority;
    return this;
  }

  /**
   * Set request parameters
   */
  setParameters(parameters: Record<string, unknown>): this {
    this.request.parameters = parameters;
    return this;
  }

  /**
   * Add a single parameter
   */
  addParameter(key: string, value: unknown): this {
    if (!this.request.parameters) {
      this.request.parameters = {};
    }
    this.request.parameters[key] = value;
    return this;
  }

  /**
   * Set request context
   */
  setContext(context: Record<string, unknown>): this {
    this.request.context = context;
    return this;
  }

  /**
   * Add a single context value
   */
  addContext(key: string, value: unknown): this {
    if (!this.request.context) {
      this.request.context = {};
    }
    this.request.context[key] = value;
    return this;
  }

  /**
   * Set orchestration preferences
   */
  setPreferences(preferences: OrchestrationPreferencesInput): this {
    this.request.preferences = preferences;
    return this;
  }

  /**
   * Enable cost optimization
   */
  enableCostOptimization(enable = true): this {
    if (!this.request.preferences) {
      this.request.preferences = {};
    }
    this.request.preferences.costOptimization = enable;
    return this;
  }

  /**
   * Set quality threshold (0-1)
   */
  setQualityThreshold(threshold: number): this {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Quality threshold must be between 0 and 1');
    }
    if (!this.request.preferences) {
      this.request.preferences = {};
    }
    this.request.preferences.qualityThreshold = threshold;
    return this;
  }

  /**
   * Set time constraint in milliseconds
   */
  setTimeConstraint(milliseconds: number): this {
    if (milliseconds <= 0) {
      throw new Error('Time constraint must be positive');
    }
    if (!this.request.preferences) {
      this.request.preferences = {};
    }
    this.request.preferences.timeConstraint = milliseconds;
    return this;
  }

  /**
   * Set preferred LLM providers
   */
  setPreferredProviders(providers: string[]): this {
    if (!this.request.preferences) {
      this.request.preferences = {};
    }
    this.request.preferences.preferredProviders = providers;
    return this;
  }

  /**
   * Set prohibited LLM providers
   */
  setProhibitedProviders(providers: string[]): this {
    if (!this.request.preferences) {
      this.request.preferences = {};
    }
    this.request.preferences.prohibitedProviders = providers;
    return this;
  }

  /**
   * Set request metadata
   */
  setMetadata(metadata: Record<string, unknown>): this {
    this.request.metadata = metadata;
    return this;
  }

  /**
   * Add a single metadata value
   */
  addMetadata(key: string, value: unknown): this {
    if (!this.request.metadata) {
      this.request.metadata = {};
    }
    this.request.metadata[key] = value;
    return this;
  }

  /**
   * Enable AG-UI real-time streaming for this orchestration
   * 
   * @param sessionId AG-UI session ID for real-time event streaming
   * @param aguiService Optional AG-UI service instance (uses global if not provided)
   * @returns this for method chaining
   * 
   * @example
   * const result = await new WAIRequestBuilder()
   *   .setType('development')
   *   .setTask('Build a login component')
   *   .withAGUISession(sessionId, aguiService)
   *   .execute();
   */
  withAGUISession(sessionId: string, aguiService?: AGUIWAIIntegrationService): this {
    this.aguiSessionId = sessionId;
    if (aguiService) {
      this.aguiService = aguiService;
    }
    return this;
  }

  /**
   * Set WAI Core instance for orchestration execution
   * 
   * @param waiCore WAI Orchestration Core instance
   * @returns this for method chaining
   */
  withWAICore(waiCore: WAIOrchestrationCoreV9): this {
    this.waiCore = waiCore;
    return this;
  }

  /**
   * Execute the orchestration with full WAI SDK + AG-UI integration
   * 
   * This method:
   * 1. Validates the request
   * 2. Emits AG-UI start event (if session configured)
   * 3. Executes WAI orchestration
   * 4. Emits thinking steps and tool calls (if session configured)
   * 5. Emits completion/error events (if session configured)
   * 
   * @returns Promise<OrchestrationResult> WAI orchestration result
   * @throws {Error} If validation fails or orchestration errors
   * 
   * @example
   * const result = await new WAIRequestBuilder()
   *   .setType('development')
   *   .setTask('Create authentication system')
   *   .withAGUISession(sessionId)
   *   .withWAICore(waiCore)
   *   .execute();
   */
  async execute(): Promise<any> {
    // Build and validate request
    const validatedRequest = this.build();
    
    // Require WAI Core for execution
    if (!this.waiCore) {
      throw new Error('WAI Core not configured. Use withWAICore() before calling execute()');
    }

    const agentId = this.request.metadata?.agentId as string || 'wai-orchestrator';
    const startTime = Date.now();

    try {
      // Emit AG-UI start event
      if (this.aguiSessionId && this.aguiService) {
        this.aguiService.emitAgentStart(
          this.aguiSessionId,
          agentId,
          validatedRequest.task,
          {
            type: validatedRequest.type,
            priority: validatedRequest.priority,
            preferences: validatedRequest.preferences,
          }
        );
        
        this.aguiService.emitThinking(
          this.aguiSessionId,
          'initialization',
          'Initializing WAI SDK orchestration...',
          agentId,
          0.95,
          `Starting ${validatedRequest.type} orchestration with priority: ${validatedRequest.priority}`
        );
      }

      // Execute WAI orchestration
      const result = await this.waiCore.processRequest({
        type: validatedRequest.type,
        task: validatedRequest.task,
        priority: validatedRequest.priority,
        preferences: validatedRequest.preferences,
        context: validatedRequest.context,
        metadata: validatedRequest.metadata,
      });

      // Emit AG-UI completion event
      if (this.aguiSessionId && this.aguiService) {
        this.aguiService.emitAgentComplete(
          this.aguiSessionId,
          agentId,
          result.result || 'Orchestration completed successfully',
          {
            providersUsed: result.providersUsed || [],
            modelsUsed: result.modelsUsed || [],
            creditsUsed: result.creditsUsed || 0,
            tokensUsed: result.tokensUsed || 0,
            duration: Date.now() - startTime,
            qualityScore: result.qualityScore,
          }
        );
      }

      return result;

    } catch (error) {
      // Emit AG-UI error event
      if (this.aguiSessionId && this.aguiService) {
        this.aguiService.emitAgentError(
          this.aguiSessionId,
          agentId,
          error instanceof Error ? error.message : 'Unknown orchestration error',
          {
            errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
            stack: error instanceof Error ? error.stack : undefined,
            duration: Date.now() - startTime,
          }
        );
      }

      throw error;
    }
  }

  /**
   * Build and validate the orchestration request
   * 
   * @throws {z.ZodError} If validation fails
   * @returns Validated WAI Orchestration Request
   */
  build(): WAIOrchestrationRequestInput {
    // Generate UUID if not provided
    if (!this.request.id) {
      this.request.id = randomUUID();
    }

    // Validate the complete request using Zod schema
    const validated = waiOrchestrationRequestSchema.parse(this.request);
    
    return validated;
  }

  /**
   * Build with safe parsing (returns result or error)
   */
  safeBuild(): z.SafeParseReturnType<unknown, WAIOrchestrationRequestInput> {
    // Generate UUID if not provided
    if (!this.request.id) {
      this.request.id = randomUUID();
    }

    return waiOrchestrationRequestSchema.safeParse(this.request);
  }

  /**
   * Reset the builder to initial state
   */
  reset(): this {
    this.request = {
      priority: 'medium'
    };
    return this;
  }

  /**
   * Clone the current builder state
   */
  clone(): WAIRequestBuilder {
    const cloned = new WAIRequestBuilder();
    cloned.request = { ...this.request };
    return cloned;
  }
}

// ================================================================================================
// CONVENIENCE FACTORY FUNCTIONS
// ================================================================================================

/**
 * Create a development orchestration request
 */
export function createDevelopmentRequest(task: string): WAIRequestBuilder {
  return new WAIRequestBuilder()
    .setType('development')
    .setTask(task);
}

/**
 * Create a creative orchestration request
 */
export function createCreativeRequest(task: string): WAIRequestBuilder {
  return new WAIRequestBuilder()
    .setType('creative')
    .setTask(task);
}

/**
 * Create an analysis orchestration request
 */
export function createAnalysisRequest(task: string): WAIRequestBuilder {
  return new WAIRequestBuilder()
    .setType('analysis')
    .setTask(task);
}

/**
 * Create an enterprise orchestration request
 */
export function createEnterpriseRequest(task: string): WAIRequestBuilder {
  return new WAIRequestBuilder()
    .setType('enterprise')
    .setTask(task);
}

/**
 * Create a hybrid orchestration request
 */
export function createHybridRequest(task: string): WAIRequestBuilder {
  return new WAIRequestBuilder()
    .setType('hybrid')
    .setTask(task);
}

/**
 * Validate an existing orchestration request object
 */
export function validateOrchestrationRequest(request: unknown): WAIOrchestrationRequestInput {
  return waiOrchestrationRequestSchema.parse(request);
}

/**
 * Safe validation of orchestration request
 */
export function safeValidateOrchestrationRequest(
  request: unknown
): z.SafeParseReturnType<unknown, WAIOrchestrationRequestInput> {
  return waiOrchestrationRequestSchema.safeParse(request);
}
