/**
 * Agent Communication System - Standardized JSON-based messaging for autonomous agents
 * Implements self-healing, independent agents that coordinate effectively
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface AgentMessage {
  message_id: string;
  timestamp: string;
  sender_id: string;
  receiver_id: string | string[];
  conversation_id: string;
  message_type: MessageType;
  priority: Priority;
  context_id: string;
  payload: any;
}

export enum MessageType {
  TASK_ASSIGNMENT = 'TASK_ASSIGNMENT',
  STATUS_UPDATE = 'STATUS_UPDATE',
  QUERY = 'QUERY',
  INFORMATION_RESPONSE = 'INFORMATION_RESPONSE',
  CONFLICT_RESOLUTION_REQUEST = 'CONFLICT_RESOLUTION_REQUEST',
  GUIDANCE_REQUEST = 'GUIDANCE_REQUEST',
  ERROR_REPORT = 'ERROR_REPORT',
  PROJECT_BREAKDOWN_STATUS = 'PROJECT_BREAKDOWN_STATUS',
  RESOURCE_REQUEST = 'RESOURCE_REQUEST',
  RESOURCE_ALLOCATION = 'RESOURCE_ALLOCATION',
  HEALTH_CHECK = 'HEALTH_CHECK',
  COORDINATION_UPDATE = 'COORDINATION_UPDATE',
  CONFLICT_RESOLUTION = 'CONFLICT_RESOLUTION',
  AGENT_HANDOFF = 'AGENT_HANDOFF',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum Priority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  WAITING_FOR_DEPENDENCY = 'WAITING_FOR_DEPENDENCY'
}

export interface TaskAssignmentPayload {
  task_id: string;
  task_name: string;
  description: string;
  parent_task_id?: string;
  assigned_to: string;
  due_date: string;
  dependencies: TaskDependency[];
  expected_output_format: string;
  acceptance_criteria: string[];
  resources_needed: string[];
  guidance_notes?: string;
  complexity_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimated_hours: number;
}

export interface TaskDependency {
  task_id: string;
  status_required: TaskStatus;
}

export interface StatusUpdatePayload {
  task_id: string;
  status: TaskStatus;
  progress_percentage: number;
  notes: string;
  eta?: string;
  blocker_details?: BlockerDetails;
  issues_identified: IssueReport[];
  completed_deliverables?: string[];
  next_actions?: string[];
}

export interface BlockerDetails {
  blocker_type: 'DEPENDENCY_NOT_MET' | 'RESOURCE_UNAVAILABLE' | 'TECHNICAL_ISSUE' | 'EXTERNAL_DEPENDENCY';
  blocked_by_task_id?: string;
  blocked_by_agent_id?: string;
  required_action: string;
  estimated_resolution_time?: string;
}

export interface IssueReport {
  issue_id: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  description: string;
  impact_assessment?: string;
  suggested_resolution?: string;
}

export interface ConflictResolutionPayload {
  conflict_id: string;
  involved_agents: string[];
  conflict_type: 'DESIGN_DISAGREEMENT' | 'RESOURCE_CONTENTION' | 'PRIORITY_CONFLICT' | 'TECHNICAL_APPROACH';
  description: string;
  proposed_solutions: string[];
  escalation_level: 'PEER' | 'SUPERIOR' | 'EXECUTIVE';
  related_tasks: string[];
  business_impact: string;
}

export interface ResourceRequestPayload {
  request_id: string;
  requesting_agent_id: string;
  resource_type: 'COMPUTATIONAL' | 'STORAGE' | 'NETWORK' | 'AGENT_CAPACITY' | 'EXTERNAL_SERVICE';
  resource_details: any;
  required_duration: string;
  justification: string;
  alternatives_considered: string[];
}

export interface CoordinationUpdatePayload {
  coordination_id: string;
  project_phase: string;
  participating_agents: string[];
  synchronization_points: SynchronizationPoint[];
  next_milestone: string;
  risk_assessment: RiskAssessment[];
}

export interface SynchronizationPoint {
  sync_id: string;
  description: string;
  required_agents: string[];
  deadline: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
}

export interface RiskAssessment {
  risk_id: string;
  description: string;
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigation_strategy: string;
  owner_agent_id: string;
}

export class AgentCommunicationSystem extends EventEmitter {
  private messageQueue: Map<string, AgentMessage[]> = new Map();
  private conversationHistory: Map<string, AgentMessage[]> = new Map();
  private agentStates: Map<string, AgentState> = new Map();
  private pendingResponses: Map<string, PendingResponse> = new Map();
  private messageRetryQueue: Map<string, RetryMessage> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeHealthChecks();
    this.initializeMessageProcessing();
  }

  // Add processMessage method for routes compatibility
  async processMessage(messageData: any): Promise<{ success: boolean; messageId: string; response?: any }> {
    try {
      const message: AgentMessage = {
        message_id: uuidv4(),
        timestamp: new Date().toISOString(),
        sender_id: messageData.senderId || 'system',
        receiver_id: messageData.receiverId || 'broadcast',
        conversation_id: messageData.conversationId || uuidv4(),
        message_type: messageData.messageType || MessageType.QUERY,
        priority: messageData.priority || Priority.MEDIUM,
        context_id: messageData.contextId || uuidv4(),
        payload: messageData.payload || {}
      };

      // Use existing sendMessage method
      const messageId = await this.sendMessage(message);

      return {
        success: true,
        messageId,
        response: { acknowledged: true, messageType: message.message_type }
      };
    } catch (error: any) {
      return {
        success: false,
        messageId: 'error',
        response: { error: error.message }
      };
    }
  }

  /**
   * Send a message between agents
   */
  async sendMessage(message: Partial<AgentMessage>): Promise<string> {
    const fullMessage: AgentMessage = {
      message_id: message.message_id || uuidv4(),
      timestamp: new Date().toISOString(),
      sender_id: message.sender_id!,
      receiver_id: message.receiver_id!,
      conversation_id: message.conversation_id || uuidv4(),
      message_type: message.message_type!,
      priority: message.priority || Priority.MEDIUM,
      context_id: message.context_id!,
      payload: message.payload || {}
    };

    // Validate message
    if (!this.validateMessage(fullMessage)) {
      throw new Error('Invalid message format');
    }

    // Route message
    await this.routeMessage(fullMessage);

    // Store in conversation history
    this.storeMessage(fullMessage);

    // Set up response tracking if needed
    if (this.requiresResponse(fullMessage)) {
      this.trackPendingResponse(fullMessage);
    }

    this.emit('message.sent', fullMessage);
    return fullMessage.message_id;
  }

  /**
   * Route message to appropriate agents
   */
  private async routeMessage(message: AgentMessage): Promise<void> {
    const receivers = Array.isArray(message.receiver_id) ? message.receiver_id : [message.receiver_id];

    for (const receiverId of receivers) {
      if (receiverId === 'ALL') {
        // Broadcast to all agents
        await this.broadcastMessage(message);
      } else {
        // Send to specific agent
        await this.deliverToAgent(receiverId, message);
      }
    }
  }

  /**
   * Deliver message to specific agent
   */
  private async deliverToAgent(agentId: string, message: AgentMessage): Promise<void> {
    try {
      // Get agent's message queue
      if (!this.messageQueue.has(agentId)) {
        this.messageQueue.set(agentId, []);
      }

      const queue = this.messageQueue.get(agentId)!;
      
      // Add message to queue based on priority
      this.insertMessageByPriority(queue, message);

      // Update agent state
      this.updateAgentState(agentId, 'message_received', message);

      // Emit event for agent to process
      this.emit(`agent.${agentId}.message`, message);
      this.emit('message.delivered', { agentId, message });

    } catch (error) {
      console.error(`Failed to deliver message to agent ${agentId}:`, error);
      
      // Add to retry queue
      this.addToRetryQueue(agentId, message);
    }
  }

  /**
   * Broadcast message to all agents
   */
  private async broadcastMessage(message: AgentMessage): Promise<void> {
    const allAgents = Array.from(this.agentStates.keys());
    
    for (const agentId of allAgents) {
      await this.deliverToAgent(agentId, message);
    }
  }

  /**
   * Insert message into queue based on priority
   */
  private insertMessageByPriority(queue: AgentMessage[], message: AgentMessage): void {
    const priorityOrder = {
      [Priority.CRITICAL]: 0,
      [Priority.URGENT]: 1,
      [Priority.HIGH]: 2,
      [Priority.MEDIUM]: 3,
      [Priority.LOW]: 4
    };

    const messageIndex = queue.findIndex(
      m => priorityOrder[m.priority] > priorityOrder[message.priority]
    );

    if (messageIndex === -1) {
      queue.push(message);
    } else {
      queue.splice(messageIndex, 0, message);
    }
  }

  /**
   * Get messages for specific agent
   */
  getMessagesForAgent(agentId: string): AgentMessage[] {
    return this.messageQueue.get(agentId) || [];
  }

  /**
   * Mark message as processed
   */
  markMessageProcessed(agentId: string, messageId: string): void {
    const queue = this.messageQueue.get(agentId);
    if (queue) {
      const index = queue.findIndex(m => m.message_id === messageId);
      if (index !== -1) {
        const message = queue.splice(index, 1)[0];
        this.emit('message.processed', { agentId, message });
      }
    }
  }

  /**
   * Handle task assignment
   */
  async assignTask(
    fromAgent: string,
    toAgent: string,
    taskData: TaskAssignmentPayload,
    contextId: string
  ): Promise<string> {
    return this.sendMessage({
      sender_id: fromAgent,
      receiver_id: toAgent,
      message_type: MessageType.TASK_ASSIGNMENT,
      priority: Priority.HIGH,
      context_id: contextId,
      payload: taskData
    });
  }

  /**
   * Handle status updates
   */
  async updateTaskStatus(
    agentId: string,
    statusData: StatusUpdatePayload,
    contextId: string
  ): Promise<string> {
    const message = await this.sendMessage({
      sender_id: agentId,
      receiver_id: 'ALL', // Broadcast status updates
      message_type: MessageType.STATUS_UPDATE,
      priority: statusData.status === TaskStatus.BLOCKED ? Priority.HIGH : Priority.MEDIUM,
      context_id: contextId,
      payload: statusData
    });

    // Handle blocked status
    if (statusData.status === TaskStatus.BLOCKED && statusData.blocker_details) {
      await this.handleBlockedTask(agentId, statusData, contextId);
    }

    return message;
  }

  /**
   * Handle blocked tasks
   */
  private async handleBlockedTask(
    agentId: string,
    statusData: StatusUpdatePayload,
    contextId: string
  ): Promise<void> {
    const blockerDetails = statusData.blocker_details!;

    // Notify the blocking agent or resource owner
    if (blockerDetails.blocked_by_agent_id) {
      await this.sendMessage({
        sender_id: agentId,
        receiver_id: blockerDetails.blocked_by_agent_id,
        message_type: MessageType.QUERY,
        priority: Priority.HIGH,
        context_id: contextId,
        payload: {
          query_id: uuidv4(),
          related_task_id: statusData.task_id,
          question: `Task ${statusData.task_id} is blocked. ${blockerDetails.required_action}`,
          information_needed: 'Status update and resolution timeline',
          urgency: 'IMMEDIATE'
        }
      });
    }

    // Escalate to executive agents if critical
    if (blockerDetails.blocker_type === 'RESOURCE_UNAVAILABLE') {
      await this.escalateToExecutive(agentId, statusData, contextId);
    }
  }

  /**
   * Escalate to executive agents
   */
  private async escalateToExecutive(
    agentId: string,
    statusData: StatusUpdatePayload,
    contextId: string
  ): Promise<void> {
    const executiveAgents = ['cto', 'cpo', 'cmo', 'program-manager'];

    for (const executive of executiveAgents) {
      await this.sendMessage({
        sender_id: agentId,
        receiver_id: executive,
        message_type: MessageType.CONFLICT_RESOLUTION_REQUEST,
        priority: Priority.CRITICAL,
        context_id: contextId,
        payload: {
          conflict_id: uuidv4(),
          involved_agents: [agentId],
          conflict_type: 'RESOURCE_CONTENTION',
          description: `Agent ${agentId} is blocked on task ${statusData.task_id}`,
          proposed_solutions: ['Allocate additional resources', 'Adjust timeline', 'Reassign task'],
          escalation_level: 'EXECUTIVE',
          related_tasks: [statusData.task_id],
          business_impact: 'Project timeline at risk'
        }
      });
    }
  }

  /**
   * Handle conflict resolution
   */
  async resolveConflict(
    conflictData: ConflictResolutionPayload,
    contextId: string
  ): Promise<string> {
    // Determine the appropriate resolver based on escalation level
    let resolver: string;
    switch (conflictData.escalation_level) {
      case 'EXECUTIVE':
        resolver = 'cto'; // CTO handles executive-level conflicts
        break;
      case 'SUPERIOR':
        resolver = 'program-manager'; // Program manager handles superior-level conflicts
        break;
      default:
        resolver = 'system-architect'; // System architect handles peer-level conflicts
    }

    return this.sendMessage({
      sender_id: 'system',
      receiver_id: resolver,
      message_type: MessageType.CONFLICT_RESOLUTION_REQUEST,
      priority: Priority.CRITICAL,
      context_id: contextId,
      payload: conflictData
    });
  }

  /**
   * Initialize health checks for agents
   */
  private initializeHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const allAgents = Array.from(this.agentStates.keys());
      
      for (const agentId of allAgents) {
        const agentState = this.agentStates.get(agentId);
        if (agentState && this.isAgentUnhealthy(agentState)) {
          await this.healAgent(agentId, agentState);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check if agent is unhealthy
   */
  private isAgentUnhealthy(agentState: AgentState): boolean {
    const now = Date.now();
    const lastHeartbeat = new Date(agentState.last_heartbeat).getTime();
    const timeSinceHeartbeat = now - lastHeartbeat;

    // Agent is unhealthy if no heartbeat for 2 minutes
    return timeSinceHeartbeat > 120000;
  }

  /**
   * Heal unhealthy agent
   */
  private async healAgent(agentId: string, agentState: AgentState): Promise<void> {
    console.log(`🏥 Healing unhealthy agent: ${agentId}`);

    // 1. Redistribute tasks from unhealthy agent
    const pendingTasks = agentState.assigned_tasks.filter(t => t.status !== TaskStatus.COMPLETED);
    
    for (const task of pendingTasks) {
      await this.redistributeTask(agentId, task);
    }

    // 2. Reset agent state
    agentState.status = 'healing';
    agentState.current_load = 0;
    agentState.assigned_tasks = [];

    // 3. Attempt to restart agent
    await this.restartAgent(agentId);

    // 4. Notify other agents about healing
    await this.sendMessage({
      sender_id: 'system',
      receiver_id: 'ALL',
      message_type: MessageType.SYSTEM_ALERT,
      priority: Priority.HIGH,
      context_id: 'system',
      payload: {
        alert_type: 'AGENT_HEALING',
        agent_id: agentId,
        description: `Agent ${agentId} is being healed due to unresponsiveness`,
        action_taken: 'Tasks redistributed and agent restart initiated'
      }
    });
  }

  /**
   * Redistribute task from unhealthy agent
   */
  private async redistributeTask(fromAgent: string, task: any): Promise<void> {
    // Find suitable alternative agent
    const alternativeAgent = this.findAlternativeAgent(fromAgent, task);
    
    if (alternativeAgent) {
      await this.sendMessage({
        sender_id: 'system',
        receiver_id: alternativeAgent,
        message_type: MessageType.TASK_ASSIGNMENT,
        priority: Priority.HIGH,
        context_id: task.context_id,
        payload: {
          ...task,
          task_id: `${task.task_id}-redistributed`,
          description: `[REDISTRIBUTED] ${task.description}`,
          guidance_notes: `Original agent ${fromAgent} became unresponsive. Task redistributed.`
        }
      });
    }
  }

  /**
   * Find alternative agent for task
   */
  private findAlternativeAgent(originalAgent: string, task: any): string | null {
    const agentCapabilities = {
      'fullstack-developer': ['frontend', 'backend', 'api', 'database'],
      'frontend-developer': ['frontend', 'ui', 'user-interface'],
      'backend-developer': ['backend', 'api', 'database', 'server'],
      'system-architect': ['architecture', 'design', 'planning'],
      'qa-engineer': ['testing', 'quality', 'validation'],
      'devops-engineer': ['deployment', 'infrastructure', 'ci-cd']
    };

    // Find agents with similar capabilities
    const originalCapabilities = agentCapabilities[originalAgent as keyof typeof agentCapabilities] || [];
    
    for (const [agentId, capabilities] of Object.entries(agentCapabilities)) {
      if (agentId !== originalAgent && 
          capabilities.some(cap => originalCapabilities.includes(cap))) {
        const agentState = this.agentStates.get(agentId);
        if (agentState && agentState.status === 'active' && agentState.current_load < 0.8) {
          return agentId;
        }
      }
    }

    return null;
  }

  /**
   * Restart agent
   */
  private async restartAgent(agentId: string): Promise<void> {
    // In a real implementation, this would restart the agent process
    console.log(`🔄 Restarting agent: ${agentId}`);
    
    // Simulate restart by resetting agent state
    this.agentStates.set(agentId, {
      agent_id: agentId,
      status: 'active',
      current_load: 0,
      assigned_tasks: [],
      last_heartbeat: new Date().toISOString(),
      health_status: 'healthy'
    });

    this.emit('agent.restarted', { agentId });
  }

  /**
   * Initialize message processing
   */
  private initializeMessageProcessing(): void {
    // Process retry queue
    setInterval(() => {
      this.processRetryQueue();
    }, 10000); // Process retries every 10 seconds

    // Clean up old messages
    setInterval(() => {
      this.cleanupOldMessages();
    }, 300000); // Cleanup every 5 minutes
  }

  /**
   * Process retry queue
   */
  private processRetryQueue(): void {
    const now = Date.now();
    
    for (const [retryId, retryMessage] of this.messageRetryQueue.entries()) {
      if (now >= retryMessage.next_retry_time) {
        this.deliverToAgent(retryMessage.agent_id, retryMessage.message)
          .then(() => {
            this.messageRetryQueue.delete(retryId);
          })
          .catch(() => {
            // Increment retry count
            retryMessage.retry_count++;
            
            if (retryMessage.retry_count >= 3) {
              // Max retries reached, escalate
              this.escalateFailedMessage(retryMessage);
              this.messageRetryQueue.delete(retryId);
            } else {
              // Schedule next retry with exponential backoff
              retryMessage.next_retry_time = now + (Math.pow(2, retryMessage.retry_count) * 1000);
            }
          });
      }
    }
  }

  /**
   * Add message to retry queue
   */
  private addToRetryQueue(agentId: string, message: AgentMessage): void {
    const retryId = uuidv4();
    const retryMessage: RetryMessage = {
      retry_id: retryId,
      agent_id: agentId,
      message,
      retry_count: 0,
      next_retry_time: Date.now() + 5000 // Initial retry after 5 seconds
    };

    this.messageRetryQueue.set(retryId, retryMessage);
  }

  /**
   * Escalate failed message
   */
  private escalateFailedMessage(retryMessage: RetryMessage): void {
    console.error(`Failed to deliver message after 3 retries: ${retryMessage.message.message_id}`);
    
    // Notify system administrators
    this.emit('message.delivery.failed', {
      agent_id: retryMessage.agent_id,
      message: retryMessage.message,
      retry_count: retryMessage.retry_count
    });
  }

  /**
   * Clean up old messages
   */
  private cleanupOldMessages(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [conversationId, messages] of this.conversationHistory.entries()) {
      const filteredMessages = messages.filter(m => 
        new Date(m.timestamp).getTime() > cutoffTime
      );
      
      if (filteredMessages.length === 0) {
        this.conversationHistory.delete(conversationId);
      } else {
        this.conversationHistory.set(conversationId, filteredMessages);
      }
    }
  }

  /**
   * Update agent state
   */
  private updateAgentState(agentId: string, event: string, data: any): void {
    if (!this.agentStates.has(agentId)) {
      this.agentStates.set(agentId, {
        agent_id: agentId,
        status: 'active',
        current_load: 0,
        assigned_tasks: [],
        last_heartbeat: new Date().toISOString(),
        health_status: 'healthy'
      });
    }

    const state = this.agentStates.get(agentId)!;
    state.last_heartbeat = new Date().toISOString();

    if (event === 'task_assigned') {
      state.assigned_tasks.push(data);
      state.current_load = Math.min(state.current_load + 0.1, 1.0);
    } else if (event === 'task_completed') {
      state.assigned_tasks = state.assigned_tasks.filter(t => t.task_id !== data.task_id);
      state.current_load = Math.max(state.current_load - 0.1, 0);
    }

    this.emit('agent.state.updated', { agentId, state });
  }

  /**
   * Validate message format
   */
  private validateMessage(message: AgentMessage): boolean {
    const required = ['message_id', 'sender_id', 'receiver_id', 'message_type', 'context_id'];
    return required.every(field => message[field as keyof AgentMessage] !== undefined);
  }

  /**
   * Check if message requires response
   */
  private requiresResponse(message: AgentMessage): boolean {
    return [
      MessageType.QUERY,
      MessageType.CONFLICT_RESOLUTION_REQUEST,
      MessageType.GUIDANCE_REQUEST,
      MessageType.RESOURCE_REQUEST
    ].includes(message.message_type);
  }

  /**
   * Track pending response
   */
  private trackPendingResponse(message: AgentMessage): void {
    const timeout = setTimeout(() => {
      this.handleResponseTimeout(message);
    }, 300000); // 5 minute timeout

    this.pendingResponses.set(message.message_id, {
      original_message: message,
      timeout,
      created_at: new Date().toISOString()
    });
  }

  /**
   * Handle response timeout
   */
  private handleResponseTimeout(message: AgentMessage): void {
    console.warn(`Response timeout for message: ${message.message_id}`);
    
    // Escalate or resend
    this.escalateTimeoutMessage(message);
    
    // Clean up
    this.pendingResponses.delete(message.message_id);
  }

  /**
   * Escalate timeout message
   */
  private escalateTimeoutMessage(message: AgentMessage): void {
    // Notify sender about timeout
    this.emit('response.timeout', {
      original_message: message,
      timeout_duration: 300000
    });
  }

  /**
   * Store message in conversation history
   */
  private storeMessage(message: AgentMessage): void {
    if (!this.conversationHistory.has(message.conversation_id)) {
      this.conversationHistory.set(message.conversation_id, []);
    }
    
    this.conversationHistory.get(message.conversation_id)!.push(message);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): AgentMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Get agent statistics
   */
  getAgentStats(): Map<string, AgentState> {
    return new Map(this.agentStates);
  }

  /**
   * Shutdown communication system
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Clear all timeouts
    for (const [messageId, pendingResponse] of this.pendingResponses.entries()) {
      clearTimeout(pendingResponse.timeout);
    }
    
    this.removeAllListeners();
  }
}

// Supporting interfaces
interface AgentState {
  agent_id: string;
  status: 'active' | 'busy' | 'idle' | 'healing' | 'offline';
  current_load: number;
  assigned_tasks: any[];
  last_heartbeat: string;
  health_status: 'healthy' | 'degraded' | 'unhealthy';
}

interface PendingResponse {
  original_message: AgentMessage;
  timeout: NodeJS.Timeout;
  created_at: string;
}

interface RetryMessage {
  retry_id: string;
  agent_id: string;
  message: AgentMessage;
  retry_count: number;
  next_retry_time: number;
}

// Export singleton instance
export const agentCommunicationSystem = new AgentCommunicationSystem();