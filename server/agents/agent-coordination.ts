/**
 * Agent Coordination System - WAI SDK 9.0 Multi-Agent Coordination Infrastructure
 * Comprehensive system for agent registration, task routing, event-based communication, and coordination patterns
 */

import { EventEmitter } from 'events';
import { 
  AgentConfig, 
  AgentTask, 
  AgentCoordination, 
  QualityMetrics,
  CoordinationType,
  TaskType,
  Priority,
  TaskStatus,
  MemoryEntry,
  MonitoringEntry,
  BaseAgent
} from '../services/comprehensive-agent-system';

// Additional type definitions for agent coordination
export enum AgentTier {
  EXECUTIVE = 'executive',
  DEVELOPMENT = 'development',
  CREATIVE = 'creative',
  QA = 'qa',
  DEVOPS = 'devops',
  SPECIALIST = 'specialist'
}

export enum AgentSpecialization {
  ORCHESTRATION = 'orchestration',
  REQUIREMENTS_ANALYSIS = 'requirements-analysis',
  FULLSTACK_DEVELOPMENT = 'fullstack-development'
}

export interface AgentStatus {
  id: string;
  status: 'inactive' | 'active' | 'busy' | 'error';
  lastActivity: Date;
  activeTasks: number;
  totalTasksCompleted: number;
  averageResponseTime: number;
  healthScore: number;
}

export interface PerformanceMetrics {
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  errorCount: number;
  lastExecution: Date;
  resourceUtilization: number;
}

export interface RoutingStrategy {
  name: string;
  selectAgent: (candidates: string[], task: AgentTask, runtime: AgentRuntime) => Promise<string>;
}

export interface Channel {
  name: string;
  config: ChannelConfig;
  created: Date;
  messageCount: number;
  subscribers: Set<string>;
}

export interface ChannelConfig {
  persistent: boolean;
  maxSubscribers: number;
}

export interface Message {
  id: string;
  fromAgent: string;
  channelName: string;
  messageType: string;
  payload: any;
  timestamp: Date;
  delivered: boolean;
}

import { ComprehensiveAgentCatalog } from './agent-catalog';
import { WorkflowPatternRegistry } from './workflow-patterns';

/**
 * Agent Runtime - Registration, execution, status tracking, performance monitoring
 */
export class AgentRuntime {
  private agents: Map<string, BaseAgent> = new Map();
  private agentConfigs: Map<string, AgentConfig> = new Map();
  private agentStatus: Map<string, AgentStatus> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private eventBus: AgentEventBus;

  constructor(eventBus: AgentEventBus) {
    this.eventBus = eventBus;
    this.initializeRuntime();
  }

  /**
   * Initialize the agent runtime system
   */
  private initializeRuntime(): void {
    // Initialize agent catalog
    ComprehensiveAgentCatalog.initializeAgentCatalog();
    
    // Load all agent configurations
    const allConfigs = ComprehensiveAgentCatalog.getAllAgentConfigs();
    allConfigs.forEach((config, agentId) => {
      this.agentConfigs.set(agentId, config);
      this.agentStatus.set(agentId, {
        id: agentId,
        status: 'inactive',
        lastActivity: new Date(),
        activeTasks: 0,
        totalTasksCompleted: 0,
        averageResponseTime: 0,
        healthScore: 1.0
      });
      this.performanceMetrics.set(agentId, {
        executionCount: 0,
        successRate: 1.0,
        averageExecutionTime: 0,
        errorCount: 0,
        lastExecution: new Date(),
        resourceUtilization: 0
      });
    });

    console.log(`Agent Runtime initialized with ${allConfigs.size} agents`);
  }

  /**
   * Register an agent instance
   */
  async registerAgent(agentId: string): Promise<boolean> {
    try {
      const config = this.agentConfigs.get(agentId);
      if (!config) {
        throw new Error(`Agent configuration not found for ${agentId}`);
      }

      const agentInstance = ComprehensiveAgentCatalog.createAgentInstance(agentId);
      this.agents.set(agentId, agentInstance);
      
      // Update agent status
      this.updateAgentStatus(agentId, 'active');

      // Emit registration event
      this.eventBus.emit('agent:registered', {
        agentId,
        timestamp: new Date(),
        config
      });

      return true;
    } catch (error) {
      console.error(`Failed to register agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (agent && typeof agent.shutdown === 'function') {
        await agent.shutdown();
      }

      this.agents.delete(agentId);
      this.updateAgentStatus(agentId, 'inactive');

      // Emit unregistration event
      this.eventBus.emit('agent:unregistered', {
        agentId,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      console.error(`Failed to unregister agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Execute task with specific agent
   */
  async executeTask(agentId: string, task: AgentTask): Promise<Record<string, any>> {
    const startTime = Date.now();
    
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        // Auto-register agent if not found
        const registered = await this.registerAgent(agentId);
        if (!registered) {
          throw new Error(`Agent ${agentId} not available`);
        }
      }

      // Update task status
      this.updateAgentStatus(agentId, 'busy', 1);

      // Emit task start event
      this.eventBus.emit('task:started', {
        agentId,
        taskId: task.taskId,
        timestamp: new Date()
      });

      // Execute the task - ensure type compatibility
      const result = await this.agents.get(agentId)!.executeTask(task as any);
      
      // Update performance metrics
      this.updatePerformanceMetrics(agentId, Date.now() - startTime, true);
      
      // Emit task completion event
      this.eventBus.emit('task:completed', {
        agentId,
        taskId: task.taskId,
        result,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      // Update performance metrics for failure
      this.updatePerformanceMetrics(agentId, Date.now() - startTime, false);
      
      // Emit task error event
      this.eventBus.emit('task:failed', {
        agentId,
        taskId: task.taskId,
        error: (error as Error).message,
        timestamp: new Date()
      });

      throw error;
    } finally {
      // Update agent status
      this.updateAgentStatus(agentId, 'active', -1);
    }
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agentStatus.get(agentId);
  }

  /**
   * Get all agent statuses
   */
  getAllAgentStatuses(): Map<string, AgentStatus> {
    return this.agentStatus;
  }

  /**
   * Get performance metrics for agent
   */
  getPerformanceMetrics(agentId: string): PerformanceMetrics | undefined {
    return this.performanceMetrics.get(agentId);
  }

  /**
   * Health check for all agents
   */
  async performHealthCheck(): Promise<Map<string, boolean>> {
    const healthResults = new Map<string, boolean>();

    for (const [agentId, agent] of this.agents) {
      try {
        const status = await agent.getStatus();
        const isHealthy = status.status === 'operational' || status.status === 'active';
        healthResults.set(agentId, isHealthy);
        
        // Update health score
        const currentStatus = this.agentStatus.get(agentId);
        if (currentStatus) {
          currentStatus.healthScore = isHealthy ? 1.0 : 0.5;
          this.agentStatus.set(agentId, currentStatus);
        }
      } catch (error) {
        healthResults.set(agentId, false);
        
        // Update health score for failed agent
        const currentStatus = this.agentStatus.get(agentId);
        if (currentStatus) {
          currentStatus.healthScore = 0.0;
          this.agentStatus.set(agentId, currentStatus);
        }
      }
    }

    return healthResults;
  }

  /**
   * Get runtime statistics
   */
  getRuntimeStatistics(): Record<string, any> {
    const totalAgents = this.agentConfigs.size;
    const activeAgents = Array.from(this.agentStatus.values()).filter(s => s.status === 'active').length;
    const busyAgents = Array.from(this.agentStatus.values()).filter(s => s.status === 'busy').length;
    
    return {
      totalAgents,
      activeAgents,
      busyAgents,
      inactiveAgents: totalAgents - activeAgents - busyAgents,
      totalTasksCompleted: Array.from(this.agentStatus.values()).reduce((sum, s) => sum + s.totalTasksCompleted, 0),
      averageHealthScore: Array.from(this.agentStatus.values()).reduce((sum, s) => sum + s.healthScore, 0) / totalAgents
    };
  }

  // Helper methods
  private updateAgentStatus(agentId: string, status: AgentStatus['status'], taskDelta: number = 0): void {
    const currentStatus = this.agentStatus.get(agentId);
    if (currentStatus) {
      currentStatus.status = status;
      currentStatus.lastActivity = new Date();
      currentStatus.activeTasks = Math.max(0, currentStatus.activeTasks + taskDelta);
      if (taskDelta < 0) { // Task completed
        currentStatus.totalTasksCompleted++;
      }
      this.agentStatus.set(agentId, currentStatus);
    }
  }

  private updatePerformanceMetrics(agentId: string, executionTime: number, success: boolean): void {
    const metrics = this.performanceMetrics.get(agentId);
    if (metrics) {
      metrics.executionCount++;
      metrics.averageExecutionTime = (metrics.averageExecutionTime * (metrics.executionCount - 1) + executionTime) / metrics.executionCount;
      metrics.successRate = success ? 
        (metrics.successRate * (metrics.executionCount - 1) + 1) / metrics.executionCount :
        (metrics.successRate * (metrics.executionCount - 1)) / metrics.executionCount;
      if (!success) {
        metrics.errorCount++;
      }
      metrics.lastExecution = new Date();
      this.performanceMetrics.set(agentId, metrics);
    }
  }
}

/**
 * Task Router - Intelligent task assignment based on agent specializations
 */
export class TaskRouter {
  private runtime: AgentRuntime;
  private eventBus: AgentEventBus;
  private routingStrategies: Map<string, RoutingStrategy> = new Map();

  constructor(runtime: AgentRuntime, eventBus: AgentEventBus) {
    this.runtime = runtime;
    this.eventBus = eventBus;
    this.initializeRoutingStrategies();
  }

  /**
   * Route task to most suitable agent
   */
  async routeTask(task: AgentTask): Promise<string> {
    const strategy = this.routingStrategies.get(task.type) || this.routingStrategies.get('default')!;
    const candidates = await this.findCandidateAgents(task);
    
    if (candidates.length === 0) {
      throw new Error(`No suitable agents found for task type: ${task.type}`);
    }

    const selectedAgent = await strategy.selectAgent(candidates, task, this.runtime);
    
    // Emit routing event
    this.eventBus.emit('task:routed', {
      taskId: task.taskId,
      selectedAgent,
      candidates: candidates.length,
      strategy: strategy.name,
      timestamp: new Date()
    });

    return selectedAgent;
  }

  /**
   * Route task to multiple agents (for parallel execution)
   */
  async routeTaskToMultiple(task: AgentTask, count: number): Promise<string[]> {
    const candidates = await this.findCandidateAgents(task);
    
    if (candidates.length < count) {
      console.warn(`Requested ${count} agents but only ${candidates.length} candidates available`);
    }

    const selectedAgents = candidates
      .sort((a, b) => this.calculateAgentScore(b, task) - this.calculateAgentScore(a, task))
      .slice(0, Math.min(count, candidates.length));

    // Emit multi-routing event
    this.eventBus.emit('task:routed-multiple', {
      taskId: task.taskId,
      selectedAgents,
      requestedCount: count,
      actualCount: selectedAgents.length,
      timestamp: new Date()
    });

    return selectedAgents;
  }

  /**
   * Execute task with automatic routing
   */
  async executeTaskWithRouting(task: AgentTask): Promise<Record<string, any>> {
    const agentId = await this.routeTask(task);
    return await this.runtime.executeTask(agentId, task);
  }

  /**
   * Execute task with multiple agents (parallel execution)
   */
  async executeTaskWithMultipleAgents(task: AgentTask, count: number): Promise<Record<string, any>[]> {
    const agentIds = await this.routeTaskToMultiple(task, count);
    
    const results = await Promise.all(
      agentIds.map(agentId => this.runtime.executeTask(agentId, {
        ...task,
        taskId: `${task.taskId}-${agentId}`
      }))
    );

    return results;
  }

  // Helper methods
  private async findCandidateAgents(task: AgentTask): Promise<string[]> {
    const allStatuses = this.runtime.getAllAgentStatuses();
    const candidates: string[] = [];

    for (const [agentId, status] of allStatuses) {
      if (this.isAgentSuitable(agentId, task) && status.healthScore > 0.5) {
        candidates.push(agentId);
      }
    }

    return candidates;
  }

  private isAgentSuitable(agentId: string, task: AgentTask): boolean {
    const config = ComprehensiveAgentCatalog.getAgentConfig(agentId);
    if (!config) return false;

    // Check if agent supports the task type
    if (!config.taskTypes.includes(task.type)) return false;

    // Check if agent has required capabilities
    if (task.requirements?.requiredCapabilities) {
      const hasCapabilities = task.requirements.requiredCapabilities.every((cap: string) =>
        config.capabilities.includes(cap)
      );
      if (!hasCapabilities) return false;
    }

    return true;
  }

  private calculateAgentScore(agentId: string, task: AgentTask): number {
    const config = ComprehensiveAgentCatalog.getAgentConfig(agentId);
    const status = this.runtime.getAgentStatus(agentId);
    const metrics = this.runtime.getPerformanceMetrics(agentId);
    
    if (!config || !status || !metrics) return 0;

    let score = 0;

    // Base suitability score
    if (config.taskTypes.includes(task.type)) score += 50;
    if (config.specialization === task.type) score += 30;

    // Performance score (0-20 points)
    score += metrics.successRate * 15;
    score += Math.min(5, 5 - (metrics.averageExecutionTime / 10000)); // Faster is better

    // Availability score (0-20 points) 
    score += status.healthScore * 10;
    score += Math.max(0, 10 - status.activeTasks * 2); // Less busy is better

    // Priority alignment (0-10 points)
    if (task.priority === Priority.CRITICAL && config.tier === 'executive') score += 10;
    else if (task.priority === Priority.HIGH && config.tier !== 'specialist') score += 5;

    return score;
  }

  private initializeRoutingStrategies(): void {
    // Performance-based routing (default)
    this.routingStrategies.set('default', {
      name: 'performance-based',
      selectAgent: async (candidates: string[], task: AgentTask, runtime: AgentRuntime) => {
        return candidates
          .map(agentId => ({ agentId, score: this.calculateAgentScore(agentId, task) }))
          .sort((a, b) => b.score - a.score)[0].agentId;
      }
    });

    // Load balancing routing
    this.routingStrategies.set('load-balancing', {
      name: 'load-balancing',
      selectAgent: async (candidates: string[], task: AgentTask, runtime: AgentRuntime) => {
        return candidates
          .map(agentId => ({ 
            agentId, 
            load: runtime.getAgentStatus(agentId)?.activeTasks || 0 
          }))
          .sort((a, b) => a.load - b.load)[0].agentId;
      }
    });

    // Round-robin routing
    let roundRobinIndex = 0;
    this.routingStrategies.set('round-robin', {
      name: 'round-robin',
      selectAgent: async (candidates: string[], task: AgentTask, runtime: AgentRuntime) => {
        const selectedAgent = candidates[roundRobinIndex % candidates.length];
        roundRobinIndex++;
        return selectedAgent;
      }
    });

    // Specialization-first routing
    this.routingStrategies.set('specialization-first', {
      name: 'specialization-first',
      selectAgent: async (candidates: string[], task: AgentTask, runtime: AgentRuntime) => {
        // First try to find agents with exact specialization match
        const specializedCandidates = candidates.filter(agentId => {
          const config = ComprehensiveAgentCatalog.getAgentConfig(agentId);
          return config?.specialization === task.type;
        });

        const finalCandidates = specializedCandidates.length > 0 ? specializedCandidates : candidates;
        return finalCandidates
          .map(agentId => ({ agentId, score: this.calculateAgentScore(agentId, task) }))
          .sort((a, b) => b.score - a.score)[0].agentId;
      }
    });
  }
}

/**
 * Agent Event Bus - Inter-agent communication with channels and message history
 */
export class AgentEventBus extends EventEmitter {
  private channels: Map<string, Channel> = new Map();
  private messageHistory: Map<string, Message[]> = new Map();
  private subscribers: Map<string, Set<string>> = new Map();
  private maxHistorySize: number = 1000;

  constructor() {
    super();
    this.initializeDefaultChannels();
  }

  /**
   * Create a communication channel
   */
  createChannel(channelName: string, config?: ChannelConfig): void {
    if (this.channels.has(channelName)) {
      throw new Error(`Channel ${channelName} already exists`);
    }

    const channel: Channel = {
      name: channelName,
      config: config || { persistent: true, maxSubscribers: 100 },
      created: new Date(),
      messageCount: 0,
      subscribers: new Set()
    };

    this.channels.set(channelName, channel);
    this.messageHistory.set(channelName, []);
    this.subscribers.set(channelName, new Set());

    this.emit('channel:created', { channelName, channel });
  }

  /**
   * Subscribe agent to channel
   */
  subscribeToChannel(agentId: string, channelName: string): void {
    if (!this.channels.has(channelName)) {
      throw new Error(`Channel ${channelName} does not exist`);
    }

    const channel = this.channels.get(channelName)!;
    const channelSubscribers = this.subscribers.get(channelName)!;

    if (channelSubscribers.size >= channel.config.maxSubscribers) {
      throw new Error(`Channel ${channelName} has reached maximum subscribers`);
    }

    channelSubscribers.add(agentId);
    channel.subscribers.add(agentId);

    this.emit('agent:subscribed', { agentId, channelName });
  }

  /**
   * Unsubscribe agent from channel
   */
  unsubscribeFromChannel(agentId: string, channelName: string): void {
    const channelSubscribers = this.subscribers.get(channelName);
    const channel = this.channels.get(channelName);

    if (channelSubscribers && channel) {
      channelSubscribers.delete(agentId);
      channel.subscribers.delete(agentId);

      this.emit('agent:unsubscribed', { agentId, channelName });
    }
  }

  /**
   * Send message to channel
   */
  sendMessage(fromAgent: string, channelName: string, messageType: string, payload: any): void {
    if (!this.channels.has(channelName)) {
      throw new Error(`Channel ${channelName} does not exist`);
    }

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromAgent,
      channelName,
      messageType,
      payload,
      timestamp: new Date(),
      delivered: false
    };

    // Add to history
    const history = this.messageHistory.get(channelName)!;
    history.push(message);

    // Maintain history size limit
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    // Update channel stats
    const channel = this.channels.get(channelName)!;
    channel.messageCount++;

    // Deliver to subscribers
    const subscribers = this.subscribers.get(channelName)!;
    subscribers.forEach(subscriberId => {
      if (subscriberId !== fromAgent) { // Don't send to sender
        this.emit(`agent:${subscriberId}:message`, message);
      }
    });

    // Emit general message event
    this.emit('message:sent', message);
    message.delivered = true;
  }

  /**
   * Broadcast message to all channels
   */
  broadcastMessage(fromAgent: string, messageType: string, payload: any): void {
    this.channels.forEach((_, channelName) => {
      try {
        this.sendMessage(fromAgent, channelName, messageType, payload);
      } catch (error) {
        // Continue broadcasting to other channels even if one fails
        console.warn(`Failed to broadcast to channel ${channelName}:`, error);
      }
    });
  }

  /**
   * Get channel history
   */
  getChannelHistory(channelName: string, limit?: number): Message[] {
    const history = this.messageHistory.get(channelName) || [];
    if (limit) {
      return history.slice(-limit);
    }
    return [...history];
  }

  /**
   * Get channel information
   */
  getChannelInfo(channelName: string): Channel | undefined {
    return this.channels.get(channelName);
  }

  /**
   * Get all channels
   */
  getAllChannels(): Map<string, Channel> {
    return this.channels;
  }

  /**
   * Get event bus statistics
   */
  getEventBusStatistics(): Record<string, any> {
    const totalMessages = Array.from(this.messageHistory.values())
      .reduce((sum, history) => sum + history.length, 0);
    
    const totalSubscribers = Array.from(this.subscribers.values())
      .reduce((sum, subs) => sum + subs.size, 0);

    return {
      totalChannels: this.channels.size,
      totalMessages,
      totalSubscribers,
      averageMessagesPerChannel: totalMessages / this.channels.size,
      averageSubscribersPerChannel: totalSubscribers / this.channels.size,
      channelDetails: Array.from(this.channels.entries()).map(([name, channel]) => ({
        name,
        subscribers: channel.subscribers.size,
        messages: channel.messageCount,
        created: channel.created
      }))
    };
  }

  // Helper methods
  private initializeDefaultChannels(): void {
    // System events channel
    this.createChannel('system', { persistent: true, maxSubscribers: 1000 });
    
    // Task coordination channel
    this.createChannel('task-coordination', { persistent: true, maxSubscribers: 100 });
    
    // Performance monitoring channel
    this.createChannel('performance', { persistent: false, maxSubscribers: 50 });
    
    // Error reporting channel
    this.createChannel('errors', { persistent: true, maxSubscribers: 200 });

    // Inter-agent communication channel
    this.createChannel('agent-communication', { persistent: true, maxSubscribers: 500 });
  }
}

/**
 * Coordination Controller - Main orchestration system
 */
export class CoordinationController {
  private runtime: AgentRuntime;
  private taskRouter: TaskRouter;
  private eventBus: AgentEventBus;
  private coordinationPatterns: Map<string, any> = new Map();

  constructor() {
    this.eventBus = new AgentEventBus();
    this.runtime = new AgentRuntime(this.eventBus);
    this.taskRouter = new TaskRouter(this.runtime, this.eventBus);
    this.initializeCoordinationPatterns();
    this.setupEventHandlers();
  }

  /**
   * Execute workflow pattern with multiple agents
   */
  async executeWorkflowPattern(
    patternType: string, 
    task: AgentTask, 
    config?: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      // Get required agents for this pattern
      const pattern = WorkflowPatternRegistry.getPattern(patternType);
      if (!pattern) {
        throw new Error(`Workflow pattern ${patternType} not found`);
      }

      // Get required agents for this pattern
      const requiredAgents = await pattern.getRequiredAgents(task as any);
      
      // Ensure required agents are registered
      await this.ensureAgentsRegistered(requiredAgents);
      
      // Execute the pattern
      const result = await WorkflowPatternRegistry.executePattern(patternType, requiredAgents, task, config);

      // Emit workflow completion event
      this.eventBus.emit('workflow:completed', {
        patternType,
        taskId: task.taskId,
        result,
        agents: requiredAgents,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      // Emit workflow error event
      this.eventBus.emit('workflow:failed', {
        patternType,
        taskId: task.taskId,
        error: (error as Error).message,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Execute task with intelligent coordination
   */
  async executeCoordinatedTask(task: AgentTask): Promise<Record<string, any>> {
    const coordinationType = this.determineCoordinationType(task);
    
    switch (coordinationType) {
      case 'single-agent':
        return await this.taskRouter.executeTaskWithRouting(task);
      
      case 'parallel':
        const parallelCount = this.calculateOptimalParallelism(task);
        const parallelResults = await this.taskRouter.executeTaskWithMultipleAgents(task, parallelCount);
        return this.aggregateParallelResults(parallelResults);
      
      case 'workflow':
        const workflowType = this.selectWorkflowPattern(task);
        return await this.executeWorkflowPattern(workflowType, task);
      
      default:
        return await this.taskRouter.executeTaskWithRouting(task);
    }
  }

  /**
   * Get coordination system statistics
   */
  getCoordinationStatistics(): Record<string, any> {
    return {
      runtime: this.runtime.getRuntimeStatistics(),
      eventBus: this.eventBus.getEventBusStatistics(),
      patterns: WorkflowPatternRegistry.getPatternStatistics(),
      coordinationPatterns: Array.from(this.coordinationPatterns.keys())
    };
  }

  // Helper methods
  private async ensureAgentsRegistered(agentIds: string[]): Promise<void> {
    for (const agentId of agentIds) {
      const status = this.runtime.getAgentStatus(agentId);
      if (!status || status.status === 'inactive') {
        await this.runtime.registerAgent(agentId);
      }
    }
  }

  private determineCoordinationType(task: AgentTask): string {
    // Determine if task needs single agent, parallel execution, or workflow
    if (task.type.includes('optimization') && task.inputData?.files?.length > 5) {
      return 'parallel';
    }
    
    if (task.type === 'bmad-analysis' || task.type.includes('complex')) {
      return 'workflow';
    }
    
    return 'single-agent';
  }

  private calculateOptimalParallelism(task: AgentTask): number {
    // Calculate optimal number of parallel agents
    const baseParallelism = Math.min(5, Math.ceil((task.inputData?.files?.length || 1) / 2));
    const availableAgents = Array.from(this.runtime.getAllAgentStatuses().values())
      .filter(status => status.healthScore > 0.7 && status.activeTasks < 3).length;
    
    return Math.min(baseParallelism, availableAgents);
  }

  private selectWorkflowPattern(task: AgentTask): string {
    if (task.type === 'bmad-analysis') return 'bmad-greenfield';
    if (task.type === 'optimization' && task.inputData?.files?.length > 20) return 'parallel-optimization-farm';
    if (task.type === 'content-creation') return 'content-automation-pipeline';
    if (task.inputData?.complexity === 'high') return 'hive-mind-swarm';
    
    return 'bmad-greenfield'; // Default workflow
  }

  private aggregateParallelResults(results: Record<string, any>[]): Record<string, any> {
    return {
      success: results.every(r => r.success),
      results: results.map(r => r.result || r),
      totalResults: results.length,
      aggregatedMetrics: {
        averageExecutionTime: results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length,
        totalProcessingTime: Math.max(...results.map(r => r.executionTime || 0)),
        successRate: results.filter(r => r.success).length / results.length
      }
    };
  }

  private initializeCoordinationPatterns(): void {
    // Initialize different coordination patterns
    this.coordinationPatterns.set('hierarchical', {
      name: 'Hierarchical Coordination',
      description: 'Top-down coordination with clear command structure'
    });

    this.coordinationPatterns.set('mesh', {
      name: 'Mesh Coordination',
      description: 'Peer-to-peer coordination with distributed decision making'
    });

    this.coordinationPatterns.set('sequential', {
      name: 'Sequential Coordination',
      description: 'Step-by-step execution with handoffs between agents'
    });

    this.coordinationPatterns.set('parallel', {
      name: 'Parallel Coordination',
      description: 'Simultaneous execution of independent tasks'
    });
  }

  private setupEventHandlers(): void {
    // Setup event handlers for system monitoring
    this.eventBus.on('agent:registered', (data) => {
      console.log(`Agent registered: ${data.agentId}`);
    });

    this.eventBus.on('task:completed', (data) => {
      console.log(`Task completed: ${data.taskId} by ${data.agentId} in ${data.executionTime}ms`);
    });

    this.eventBus.on('task:failed', (data) => {
      console.error(`Task failed: ${data.taskId} by ${data.agentId} - ${data.error}`);
    });

    this.eventBus.on('workflow:completed', (data) => {
      console.log(`Workflow completed: ${data.patternType} for task ${data.taskId}`);
    });
  }
}

// Export the main coordination system classes
// Note: Classes are already exported with their class declarations above