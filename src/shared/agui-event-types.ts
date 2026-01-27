/**
 * AG-UI Event Types for WAI SDK v1.0
 * Standardized event protocol for real-time agent-to-UI communication
 * 
 * Integration: AG-UI protocol layer inside WAI orchestration
 * Purpose: Replace polling with SSE/WebSocket streaming
 */

// ================================================================================================
// AG-UI STANDARD EVENT TYPES (~16 core events)
// ================================================================================================

/**
 * Base AG-UI Event Interface
 * All AG-UI events extend this base structure
 */
export interface AGUIBaseEvent {
  id: string;
  type: AGUIEventType;
  timestamp: number;
  sessionId?: string;
  agentId?: string;
  metadata?: Record<string, any>;
}

/**
 * AG-UI Event Types (Standard Protocol)
 */
export type AGUIEventType =
  | 'connection'           // SSE connection established (control event)
  | 'session_closed'       // Session closed (control event)
  | 'heartbeat'            // Keepalive heartbeat (control event)
  | 'message'              // Chat message from agent
  | 'thinking'             // Agent reasoning/planning step
  | 'tool_call'            // Agent calling a tool
  | 'tool_result'          // Tool execution result
  | 'frontend_tool'        // Agent requesting frontend action
  | 'state_update'         // Shared state change
  | 'generative_ui'        // Agent creating UI component
  | 'interrupt'            // Human-in-the-loop approval request
  | 'sub_agent_start'      // Sub-agent delegation begins
  | 'sub_agent_complete'   // Sub-agent delegation ends
  | 'agent_steer'          // User steering agent direction
  | 'status_change'        // Agent/job status update
  | 'error'                // Error occurred
  | 'progress'             // Progress update
  | 'artifact_created'     // New artifact generated
  | 'custom'               // Custom event type

// ================================================================================================
// SPECIFIC EVENT INTERFACES
// ================================================================================================

/**
 * Message Event - Agent sends text/content to user
 */
export interface AGUIMessageEvent extends AGUIBaseEvent {
  type: 'message';
  content: string;
  role: 'agent' | 'user' | 'system';
  format?: 'text' | 'markdown' | 'html';
  attachments?: AGUIAttachment[];
}

/**
 * Thinking Event - Agent shows reasoning/planning steps
 */
export interface AGUIThinkingEvent extends AGUIBaseEvent {
  type: 'thinking';
  step: string;
  description: string;
  confidence?: number;
  reasoning?: string;
}

/**
 * Tool Call Event - Agent executes a tool
 */
export interface AGUIToolCallEvent extends AGUIBaseEvent {
  type: 'tool_call';
  toolName: string;
  toolDescription?: string;
  input: Record<string, any>;
  executionType: 'backend' | 'frontend';
}

/**
 * Tool Result Event - Tool execution completed
 */
export interface AGUIToolResultEvent extends AGUIBaseEvent {
  type: 'tool_result';
  toolCallId: string;
  toolName: string;
  result: any;
  success: boolean;
  error?: string;
  duration?: number;
}

/**
 * Frontend Tool Event - Agent requests frontend action
 */
export interface AGUIFrontendToolEvent extends AGUIBaseEvent {
  type: 'frontend_tool';
  toolName: string;
  description: string;
  action: 'open_url' | 'download_file' | 'show_preview' | 'trigger_action' | 'custom';
  payload: Record<string, any>;
  expectsResponse: boolean;
}

/**
 * State Update Event - Shared state between agent and UI
 */
export interface AGUIStateUpdateEvent extends AGUIBaseEvent {
  type: 'state_update';
  path: string;
  value: any;
  operation: 'set' | 'merge' | 'delete';
  version?: number;
}

/**
 * Generative UI Event - Agent creates UI component
 */
export interface AGUIGenerativeUIEvent extends AGUIBaseEvent {
  type: 'generative_ui';
  componentType: string;
  componentProps: Record<string, any>;
  renderLocation: 'inline' | 'modal' | 'sidebar' | 'fullscreen';
  replace?: boolean;
}

/**
 * Interrupt Event - Human-in-the-loop approval/decision
 */
export interface AGUIInterruptEvent extends AGUIBaseEvent {
  type: 'interrupt';
  reason: string;
  question: string;
  options: AGUIInterruptOption[];
  requiredBy?: number; // Timestamp deadline
  defaultOption?: string;
}

export interface AGUIInterruptOption {
  id: string;
  label: string;
  description?: string;
  action: 'approve' | 'reject' | 'modify' | 'cancel' | 'custom';
}

/**
 * Interrupt Response - User's response to interrupt
 */
export interface AGUIInterruptResponse {
  interruptId: string;
  selectedOption: string;
  modifiedData?: Record<string, any>;
  feedback?: string;
}

/**
 * Sub-Agent Events - Nested agent delegation
 */
export interface AGUISubAgentStartEvent extends AGUIBaseEvent {
  type: 'sub_agent_start';
  subAgentId: string;
  subAgentName: string;
  task: string;
  parentAgentId: string;
  scopedState?: Record<string, any>;
}

export interface AGUISubAgentCompleteEvent extends AGUIBaseEvent {
  type: 'sub_agent_complete';
  subAgentId: string;
  subAgentName: string;
  result: any;
  success: boolean;
  duration: number;
}

/**
 * Agent Steering Event - User guides agent execution
 */
export interface AGUIAgentSteerEvent extends AGUIBaseEvent {
  type: 'agent_steer';
  direction: string;
  guidance: string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Status Change Event - Agent/job status updates
 */
export interface AGUIStatusChangeEvent extends AGUIBaseEvent {
  type: 'status_change';
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  previousStatus?: string;
  reason?: string;
}

/**
 * Error Event - Error occurred during execution
 */
export interface AGUIErrorEvent extends AGUIBaseEvent {
  type: 'error';
  error: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestion?: string;
}

/**
 * Progress Event - Execution progress update
 */
export interface AGUIProgressEvent extends AGUIBaseEvent {
  type: 'progress';
  percentage: number;
  currentStep?: string;
  totalSteps?: number;
  currentStepNumber?: number;
  estimatedTimeRemaining?: number;
}

/**
 * Artifact Created Event - New artifact generated
 */
export interface AGUIArtifactCreatedEvent extends AGUIBaseEvent {
  type: 'artifact_created';
  artifactId: number;
  artifactType: string;
  artifactName: string;
  artifactUrl?: string;
  preview?: string;
}

/**
 * Custom Event - Application-specific events
 */
export interface AGUICustomEvent extends AGUIBaseEvent {
  type: 'custom';
  customType: string;
  data: Record<string, any>;
}

// ================================================================================================
// CONTROL EVENTS (SSE Stream Management)
// ================================================================================================

/**
 * Connection Event - SSE connection established
 */
export interface AGUIConnectionEvent extends AGUIBaseEvent {
  type: 'connection';
}

/**
 * Session Closed Event - Session terminated
 */
export interface AGUISessionClosedEvent extends AGUIBaseEvent {
  type: 'session_closed';
}

/**
 * Heartbeat Event - Keepalive signal
 */
export interface AGUIHeartbeatEvent extends AGUIBaseEvent {
  type: 'heartbeat';
}

// ================================================================================================
// UNION TYPE FOR ALL EVENTS
// ================================================================================================

/**
 * All AG-UI events including control events
 */
export type AGUIEvent =
  | AGUIConnectionEvent
  | AGUISessionClosedEvent
  | AGUIHeartbeatEvent
  | AGUIMessageEvent
  | AGUIThinkingEvent
  | AGUIToolCallEvent
  | AGUIToolResultEvent
  | AGUIFrontendToolEvent
  | AGUIStateUpdateEvent
  | AGUIGenerativeUIEvent
  | AGUIInterruptEvent
  | AGUISubAgentStartEvent
  | AGUISubAgentCompleteEvent
  | AGUIAgentSteerEvent
  | AGUIStatusChangeEvent
  | AGUIErrorEvent
  | AGUIProgressEvent
  | AGUIArtifactCreatedEvent
  | AGUICustomEvent;

/**
 * Control events (for SSE stream management)
 */
export type AGUIControlEvent = AGUIConnectionEvent | AGUISessionClosedEvent | AGUIHeartbeatEvent;

/**
 * Data events (orchestration events, excluding control)
 */
export type AGUIDataEvent = Exclude<AGUIEvent, AGUIControlEvent>;

// ================================================================================================
// ATTACHMENT & MEDIA TYPES
// ================================================================================================

export interface AGUIAttachment {
  id: string;
  type: 'file' | 'image' | 'video' | 'audio' | 'document';
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
}

// ================================================================================================
// STREAMING SESSION TYPES
// ================================================================================================

export interface AGUIStreamSession {
  id: string;
  startupId: number;
  sessionId?: number;
  studioId?: string;
  userId?: number;
  createdAt: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface AGUIStreamOptions {
  sessionId?: string;
  reconnect?: boolean;
  includeHistory?: boolean;
  eventFilter?: AGUIEventType[];
}

// ================================================================================================
// WAI SDK INTEGRATION TYPES
// ================================================================================================

/**
 * Maps WAI orchestration events to AG-UI events
 */
export interface WAIToAGUIEventMap {
  orchestration_start: 'status_change';
  orchestration_progress: 'progress';
  orchestration_complete: 'status_change';
  agent_thinking: 'thinking';
  agent_tool_call: 'tool_call';
  agent_tool_result: 'tool_result';
  agent_message: 'message';
  agent_error: 'error';
  artifact_generated: 'artifact_created';
  approval_required: 'interrupt';
  sub_agent_spawn: 'sub_agent_start';
  sub_agent_result: 'sub_agent_complete';
}

/**
 * AG-UI Configuration for WAI SDK
 */
export interface AGUIWAIConfig {
  enableStreaming: boolean;
  transport: 'sse' | 'websocket';
  heartbeatInterval?: number;
  reconnectAttempts?: number;
  eventBuffer?: number;
  compression?: boolean;
}
