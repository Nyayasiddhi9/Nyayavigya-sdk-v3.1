/**
 * AG-UI + WAI SDK v1.0 Integration Service
 * 
 * Purpose: Integrates AG-UI protocol INSIDE WAI orchestration for real-time agent-to-UI communication
 * Architecture: WAI SDK remains single source of truth, AG-UI provides frontend protocol layer
 * 
 * Features:
 * - Real-time SSE/WebSocket streaming (replaces 5s polling)
 * - Standardized AG-UI event protocol (~16 event types)
 * - Human-in-the-loop approval system
 * - Thinking steps visualization
 * - Frontend tool integration
 * - Sub-agent composition tracking
 * - Agent steering capabilities
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import type {
  AGUIEvent,
  AGUIMessageEvent,
  AGUIThinkingEvent,
  AGUIToolCallEvent,
  AGUIToolResultEvent,
  AGUIFrontendToolEvent,
  AGUIStateUpdateEvent,
  AGUIGenerativeUIEvent,
  AGUIInterruptEvent,
  AGUISubAgentStartEvent,
  AGUISubAgentCompleteEvent,
  AGUIStatusChangeEvent,
  AGUIErrorEvent,
  AGUIProgressEvent,
  AGUIArtifactCreatedEvent,
  AGUIStreamSession,
  AGUIStreamOptions,
  AGUIWAIConfig,
  AGUIInterruptResponse,
} from '@shared/agui-event-types';

// ================================================================================================
// AG-UI WAI INTEGRATION SERVICE
// ================================================================================================

export class AGUIWAIIntegrationService extends EventEmitter {
  private sessions: Map<string, AGUIStreamSession>;
  private sessionEvents: Map<string, AGUIEvent[]>;
  private config: AGUIWAIConfig;
  private heartbeatIntervals: Map<string, NodeJS.Timeout>;
  private pendingInterrupts: Map<string, AGUIInterruptEvent>;
  
  constructor(config?: Partial<AGUIWAIConfig>) {
    super();
    this.sessions = new Map();
    this.sessionEvents = new Map();
    this.heartbeatIntervals = new Map();
    this.pendingInterrupts = new Map();
    
    this.config = {
      enableStreaming: true,
      transport: 'sse',
      heartbeatInterval: 30000, // 30s
      reconnectAttempts: 3,
      eventBuffer: 1000,
      compression: false,
      ...config,
    };
    
    console.log('✅ AG-UI WAI Integration Service initialized');
    console.log(`📡 Transport: ${this.config.transport}, Streaming: ${this.config.enableStreaming}`);
  }

  // ============================================================================================
  // SESSION MANAGEMENT
  // ============================================================================================

  /**
   * Create new AG-UI streaming session
   */
  createSession(
    startupId: number,
    sessionId?: number,
    studioId?: string,
    userId?: number
  ): AGUIStreamSession {
    const streamSession: AGUIStreamSession = {
      id: randomUUID(),
      startupId,
      sessionId,
      studioId,
      userId,
      createdAt: Date.now(),
      status: 'active',
    };
    
    this.sessions.set(streamSession.id, streamSession);
    this.sessionEvents.set(streamSession.id, []);
    
    // Start heartbeat
    if (this.config.heartbeatInterval) {
      const interval = setInterval(() => {
        this.emitHeartbeat(streamSession.id);
      }, this.config.heartbeatInterval);
      
      this.heartbeatIntervals.set(streamSession.id, interval);
    }
    
    console.log(`📡 AG-UI session created: ${streamSession.id} (studio: ${studioId})`);
    
    return streamSession;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AGUIStreamSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Close AG-UI streaming session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // Update status
    session.status = 'completed';
    
    // Clear heartbeat
    const interval = this.heartbeatIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(sessionId);
    }
    
    // Emit close event
    this.emit(`session:${sessionId}:close`, { sessionId });
    
    // Cleanup after buffer retention
    setTimeout(() => {
      this.sessions.delete(sessionId);
      this.sessionEvents.delete(sessionId);
    }, 60000); // Keep for 1 minute after close
    
    console.log(`📡 AG-UI session closed: ${sessionId}`);
  }

  /**
   * Pause AG-UI session
   */
  pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      this.emitStatusChange(sessionId, 'paused', 'running', 'User paused execution');
    }
  }

  /**
   * Resume AG-UI session
   */
  resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'active';
      this.emitStatusChange(sessionId, 'running', 'paused', 'User resumed execution');
    }
  }

  /**
   * Update sessionId for AG-UI session (for auto-session creation)
   * This allows back-patching the studio sessionId after it's auto-created
   */
  updateSessionId(aguiSessionId: string, studioSessionId: number): void {
    const session = this.sessions.get(aguiSessionId);
    if (session) {
      session.sessionId = studioSessionId;
      console.log(`📡 AG-UI session ${aguiSessionId} linked to studio session ${studioSessionId}`);
      
      // Emit session update event with correct signature
      this.emitStateUpdate(
        aguiSessionId,
        'session',
        { sessionId: studioSessionId, linked: true },
        'merge'
      );
    }
  }

  // ============================================================================================
  // EVENT EMISSION (WAI Orchestration → AG-UI Events)
  // ============================================================================================

  /**
   * Emit message event
   */
  emitMessage(
    sessionId: string,
    content: string,
    role: 'agent' | 'user' | 'system' = 'agent',
    agentId?: string,
    metadata?: Record<string, any>
  ): void {
    const event: AGUIMessageEvent = {
      id: randomUUID(),
      type: 'message',
      timestamp: Date.now(),
      sessionId,
      agentId,
      content,
      role,
      format: 'markdown',
      metadata,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit thinking step event (agent reasoning)
   */
  emitThinking(
    sessionId: string,
    step: string,
    description: string,
    agentId?: string,
    confidence?: number,
    reasoning?: string
  ): void {
    const event: AGUIThinkingEvent = {
      id: randomUUID(),
      type: 'thinking',
      timestamp: Date.now(),
      sessionId,
      agentId,
      step,
      description,
      confidence,
      reasoning,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit tool call event
   */
  emitToolCall(
    sessionId: string,
    toolName: string,
    input: Record<string, any>,
    agentId?: string,
    executionType: 'backend' | 'frontend' = 'backend'
  ): void {
    const event: AGUIToolCallEvent = {
      id: randomUUID(),
      type: 'tool_call',
      timestamp: Date.now(),
      sessionId,
      agentId,
      toolName,
      input,
      executionType,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit tool result event
   */
  emitToolResult(
    sessionId: string,
    toolCallId: string,
    toolName: string,
    result: any,
    success: boolean,
    duration?: number,
    error?: string
  ): void {
    const event: AGUIToolResultEvent = {
      id: randomUUID(),
      type: 'tool_result',
      timestamp: Date.now(),
      sessionId,
      toolCallId,
      toolName,
      result,
      success,
      error,
      duration,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit frontend tool event (agent requests UI action)
   */
  emitFrontendTool(
    sessionId: string,
    toolName: string,
    action: 'open_url' | 'download_file' | 'show_preview' | 'trigger_action' | 'custom',
    payload: Record<string, any>,
    expectsResponse: boolean = false,
    agentId?: string
  ): void {
    const event: AGUIFrontendToolEvent = {
      id: randomUUID(),
      type: 'frontend_tool',
      timestamp: Date.now(),
      sessionId,
      agentId,
      toolName,
      description: `Agent requesting frontend action: ${action}`,
      action,
      payload,
      expectsResponse,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit state update event (shared state)
   */
  emitStateUpdate(
    sessionId: string,
    path: string,
    value: any,
    operation: 'set' | 'merge' | 'delete' = 'set',
    version?: number
  ): void {
    const event: AGUIStateUpdateEvent = {
      id: randomUUID(),
      type: 'state_update',
      timestamp: Date.now(),
      sessionId,
      path,
      value,
      operation,
      version,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit generative UI event (agent creates UI component)
   */
  emitGenerativeUI(
    sessionId: string,
    componentType: string,
    componentProps: Record<string, any>,
    renderLocation: 'inline' | 'modal' | 'sidebar' | 'fullscreen' = 'inline',
    replace: boolean = false,
    agentId?: string
  ): void {
    const event: AGUIGenerativeUIEvent = {
      id: randomUUID(),
      type: 'generative_ui',
      timestamp: Date.now(),
      sessionId,
      agentId,
      componentType,
      componentProps,
      renderLocation,
      replace,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit interrupt event (human-in-the-loop approval)
   */
  emitInterrupt(
    sessionId: string,
    reason: string,
    question: string,
    options: Array<{ id: string; label: string; action: string; description?: string }>,
    agentId?: string,
    requiredBy?: number,
    defaultOption?: string
  ): Promise<AGUIInterruptResponse> {
    return new Promise((resolve, reject) => {
      const event: AGUIInterruptEvent = {
        id: randomUUID(),
        type: 'interrupt',
        timestamp: Date.now(),
        sessionId,
        agentId,
        reason,
        question,
        options,
        requiredBy,
        defaultOption,
      };
      
      this.pendingInterrupts.set(event.id, event);
      this.emitEvent(sessionId, event);
      
      // Listen for response
      const responseHandler = (response: AGUIInterruptResponse) => {
        if (response.interruptId === event.id) {
          this.pendingInterrupts.delete(event.id);
          this.off(`interrupt:response:${sessionId}`, responseHandler);
          resolve(response);
        }
      };
      
      this.on(`interrupt:response:${sessionId}`, responseHandler);
      
      // Timeout if no response
      if (requiredBy) {
        const timeout = requiredBy - Date.now();
        setTimeout(() => {
          if (this.pendingInterrupts.has(event.id)) {
            this.pendingInterrupts.delete(event.id);
            this.off(`interrupt:response:${sessionId}`, responseHandler);
            reject(new Error('Interrupt timeout: No user response received'));
          }
        }, timeout);
      }
    });
  }

  /**
   * Handle interrupt response from user
   */
  handleInterruptResponse(sessionId: string, response: AGUIInterruptResponse): void {
    this.emit(`interrupt:response:${sessionId}`, response);
  }

  /**
   * Emit sub-agent start event
   */
  emitSubAgentStart(
    sessionId: string,
    subAgentId: string,
    subAgentName: string,
    task: string,
    parentAgentId: string,
    scopedState?: Record<string, any>
  ): void {
    const event: AGUISubAgentStartEvent = {
      id: randomUUID(),
      type: 'sub_agent_start',
      timestamp: Date.now(),
      sessionId,
      agentId: parentAgentId,
      subAgentId,
      subAgentName,
      task,
      parentAgentId,
      scopedState,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit sub-agent complete event
   */
  emitSubAgentComplete(
    sessionId: string,
    subAgentId: string,
    subAgentName: string,
    result: any,
    success: boolean,
    duration: number
  ): void {
    const event: AGUISubAgentCompleteEvent = {
      id: randomUUID(),
      type: 'sub_agent_complete',
      timestamp: Date.now(),
      sessionId,
      subAgentId,
      subAgentName,
      result,
      success,
      duration,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit status change event
   */
  emitStatusChange(
    sessionId: string,
    status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled',
    previousStatus?: string,
    reason?: string,
    agentId?: string
  ): void {
    const event: AGUIStatusChangeEvent = {
      id: randomUUID(),
      type: 'status_change',
      timestamp: Date.now(),
      sessionId,
      agentId,
      status,
      previousStatus,
      reason,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit error event
   */
  emitError(
    sessionId: string,
    error: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    recoverable: boolean = true,
    code?: string,
    suggestion?: string,
    agentId?: string
  ): void {
    const event: AGUIErrorEvent = {
      id: randomUUID(),
      type: 'error',
      timestamp: Date.now(),
      sessionId,
      agentId,
      error,
      code,
      severity,
      recoverable,
      suggestion,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit progress event
   */
  emitProgress(
    sessionId: string,
    percentage: number,
    currentStep?: string,
    totalSteps?: number,
    currentStepNumber?: number,
    estimatedTimeRemaining?: number,
    agentId?: string
  ): void {
    const event: AGUIProgressEvent = {
      id: randomUUID(),
      type: 'progress',
      timestamp: Date.now(),
      sessionId,
      agentId,
      percentage,
      currentStep,
      totalSteps,
      currentStepNumber,
      estimatedTimeRemaining,
    };
    
    this.emitEvent(sessionId, event);
  }

  /**
   * Emit artifact created event
   */
  emitArtifactCreated(
    sessionId: string,
    artifactId: number,
    artifactType: string,
    artifactName: string,
    artifactUrl?: string,
    preview?: string,
    agentId?: string
  ): void {
    const event: AGUIArtifactCreatedEvent = {
      id: randomUUID(),
      type: 'artifact_created',
      timestamp: Date.now(),
      sessionId,
      agentId,
      artifactId,
      artifactType,
      artifactName,
      artifactUrl,
      preview,
    };
    
    this.emitEvent(sessionId, event);
  }

  // ============================================================================================
  // HIGH-LEVEL ORCHESTRATION EVENTS (WAI SDK Integration)
  // ============================================================================================

  /**
   * Emit agent start event (orchestration begins)
   */
  emitAgentStart(
    sessionId: string,
    agentId: string,
    task: string,
    metadata?: Record<string, any>
  ): void {
    // Emit status change to running
    this.emitStatusChange(sessionId, 'running', 'queued', 'Agent orchestration started', agentId);
    
    // Emit message about agent start
    this.emitMessage(
      sessionId,
      `🚀 Starting orchestration: ${task}`,
      'agent',
      agentId,
      metadata
    );
    
    // Emit thinking step for initialization
    this.emitThinking(
      sessionId,
      'agent-initialization',
      'Agent initialized and ready to process task',
      agentId,
      1.0,
      `Task: ${task}`
    );
  }

  /**
   * Emit agent complete event (orchestration succeeds)
   */
  emitAgentComplete(
    sessionId: string,
    agentId: string,
    result: string,
    metadata?: Record<string, any>
  ): void {
    // Emit thinking step for completion
    this.emitThinking(
      sessionId,
      'agent-completion',
      'Orchestration completed successfully',
      agentId,
      1.0,
      `Result: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`
    );
    
    // Emit completion message
    this.emitMessage(
      sessionId,
      `✅ Orchestration complete: ${result}`,
      'agent',
      agentId,
      metadata
    );
    
    // Emit status change to completed
    this.emitStatusChange(sessionId, 'completed', 'running', 'Agent orchestration completed successfully', agentId);
  }

  /**
   * Emit agent error event (orchestration fails)
   */
  emitAgentError(
    sessionId: string,
    agentId: string,
    errorMessage: string,
    metadata?: Record<string, any>
  ): void {
    // Emit error event
    this.emitError(
      sessionId,
      errorMessage,
      'high',
      true,
      metadata?.errorType as string,
      'Check error details and retry orchestration',
      agentId
    );
    
    // Emit failure message
    this.emitMessage(
      sessionId,
      `❌ Orchestration failed: ${errorMessage}`,
      'system',
      agentId,
      metadata
    );
    
    // Emit status change to failed
    this.emitStatusChange(sessionId, 'failed', 'running', errorMessage, agentId);
  }

  // ============================================================================================
  // INTERNAL EVENT HANDLING
  // ============================================================================================

  /**
   * Emit event to session
   */
  private emitEvent(sessionId: string, event: AGUIEvent): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      console.warn(`⚠️ Cannot emit event to inactive session: ${sessionId}`);
      return;
    }
    
    // Store event in buffer
    const events = this.sessionEvents.get(sessionId) || [];
    events.push(event);
    
    // Trim buffer if needed
    if (this.config.eventBuffer && events.length > this.config.eventBuffer) {
      events.shift();
    }
    
    this.sessionEvents.set(sessionId, events);
    
    // Emit to listeners (SSE/WebSocket handlers will listen)
    this.emit(`event:${sessionId}`, event);
    this.emit('event', { sessionId, event });
    
    // Debug log
    console.log(`📡 AG-UI Event [${event.type}]: ${sessionId.slice(0, 8)}... (${event.agentId || 'system'})`);
  }

  /**
   * Emit heartbeat to keep connection alive
   */
  private emitHeartbeat(sessionId: string): void {
    this.emit(`heartbeat:${sessionId}`, { timestamp: Date.now() });
  }

  /**
   * Get session events (for history/reconnect)
   */
  getSessionEvents(sessionId: string, options?: AGUIStreamOptions): AGUIEvent[] {
    const events = this.sessionEvents.get(sessionId) || [];
    
    if (options?.eventFilter && options.eventFilter.length > 0) {
      return events.filter(e => options.eventFilter!.includes(e.type));
    }
    
    return events;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): AGUIStreamSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

// ================================================================================================
// SINGLETON EXPORT
// ================================================================================================

export const aguiWAIIntegrationService = new AGUIWAIIntegrationService({
  enableStreaming: true,
  transport: 'sse',
  heartbeatInterval: 30000,
  eventBuffer: 1000,
});
