/**
 * Dyad AI Orchestration Framework Integration
 * Advanced AI agent coordination system with distributed intelligence
 * Based on: https://github.com/dyad-ai/dyad
 * 
 * Features:
 * - Distributed agent coordination
 * - Real-time agent communication
 * - Intelligent task distribution
 * - Agent health monitoring
 * - Dynamic scaling and load balancing
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface DyadAgent {
  id: string;
  name: string;
  type: 'coordinator' | 'worker' | 'specialist';
  status: 'idle' | 'active' | 'busy' | 'error';
  capabilities: string[];
  currentLoad: number;
  maxLoad: number;
  lastHeartbeat: Date;
  metrics: {
    tasksCompleted: number;
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export interface DyadTask {
  id: string;
  type: string;
  priority: number;
  payload: any;
  requirements: string[];
  assignedAgent?: string;
  status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface DyadCoordinationNetwork {
  nodes: Map<string, DyadAgent>;
  connections: Map<string, string[]>;
  taskQueue: DyadTask[];
  completedTasks: DyadTask[];
  metrics: {
    totalTasks: number;
    activeTasks: number;
    throughput: number;
    averageLatency: number;
  };
}

export class DyadOrchestrationEngine extends EventEmitter {
  private network: DyadCoordinationNetwork;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private taskScheduler: NodeJS.Timeout | null = null;
  private metricsCollector: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.network = {
      nodes: new Map(),
      connections: new Map(),
      taskQueue: [],
      completedTasks: [],
      metrics: {
        totalTasks: 0,
        activeTasks: 0,
        throughput: 0,
        averageLatency: 0
      }
    };
    
    this.initializeOrchestration();
  }

  private initializeOrchestration(): void {
    // Start heartbeat monitoring
    this.heartbeatInterval = setInterval(() => {
      this.monitorAgentHealth();
    }, 5000);

    // Start task scheduler
    this.taskScheduler = setInterval(() => {
      this.scheduleNextTasks();
    }, 1000);

    // Start metrics collection
    this.metricsCollector = setInterval(() => {
      this.updateNetworkMetrics();
    }, 10000);

    console.log('🔗 Dyad AI Orchestration Engine initialized');
  }

  /**
   * Register a new agent in the coordination network
   */
  public registerAgent(agent: Partial<DyadAgent>): DyadAgent {
    const newAgent: DyadAgent = {
      id: agent.id || randomUUID(),
      name: agent.name || `Agent-${Date.now()}`,
      type: agent.type || 'worker',
      status: 'idle',
      capabilities: agent.capabilities || [],
      currentLoad: 0,
      maxLoad: agent.maxLoad || 10,
      lastHeartbeat: new Date(),
      metrics: {
        tasksCompleted: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 0
      }
    };

    this.network.nodes.set(newAgent.id, newAgent);
    this.network.connections.set(newAgent.id, []);
    
    this.emit('agent-registered', newAgent);
    console.log(`✅ Dyad Agent registered: ${newAgent.name} (${newAgent.type})`);
    
    return newAgent;
  }

  /**
   * Submit a task for distributed execution
   */
  public async submitTask(task: Partial<DyadTask>): Promise<string> {
    const newTask: DyadTask = {
      id: task.id || randomUUID(),
      type: task.type || 'general',
      priority: task.priority || 1,
      payload: task.payload || {},
      requirements: task.requirements || [],
      status: 'pending',
      createdAt: new Date()
    };

    this.network.taskQueue.push(newTask);
    this.network.metrics.totalTasks++;
    
    this.emit('task-submitted', newTask);
    console.log(`📋 Dyad Task submitted: ${newTask.id} (${newTask.type})`);
    
    // Immediately try to schedule if agents available
    this.scheduleNextTasks();
    
    return newTask.id;
  }

  /**
   * Intelligent task scheduling with capability matching
   */
  private scheduleNextTasks(): void {
    const pendingTasks = this.network.taskQueue.filter(t => t.status === 'pending');
    const idleAgents = Array.from(this.network.nodes.values())
      .filter(a => a.status === 'idle' && a.currentLoad < a.maxLoad);

    for (const task of pendingTasks.slice(0, 5)) { // Process up to 5 tasks per cycle
      const suitableAgent = this.findBestAgent(task, idleAgents);
      
      if (suitableAgent) {
        this.assignTask(task, suitableAgent);
        idleAgents.splice(idleAgents.indexOf(suitableAgent), 1);
      }
    }
  }

  /**
   * Find the best agent for a task based on capabilities and load
   */
  private findBestAgent(task: DyadTask, availableAgents: DyadAgent[]): DyadAgent | null {
    if (availableAgents.length === 0) return null;

    // Score agents based on capability match and load
    const scoredAgents = availableAgents.map(agent => {
      let score = 0;
      
      // Capability matching
      const capabilityMatch = task.requirements.filter(req => 
        agent.capabilities.includes(req)
      ).length;
      score += capabilityMatch * 10;
      
      // Load balancing (prefer less loaded agents)
      score += (agent.maxLoad - agent.currentLoad) * 2;
      
      // Performance history
      score += Math.max(0, 100 - agent.metrics.errorRate);
      
      // Response time (prefer faster agents)
      score += Math.max(0, 100 - agent.metrics.averageResponseTime);

      return { agent, score };
    });

    // Sort by score and return the best agent
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0]?.agent || null;
  }

  /**
   * Assign a task to a specific agent
   */
  private assignTask(task: DyadTask, agent: DyadAgent): void {
    task.assignedAgent = agent.id;
    task.status = 'assigned';
    task.startedAt = new Date();
    
    agent.currentLoad++;
    agent.status = agent.currentLoad >= agent.maxLoad ? 'busy' : 'active';
    
    this.network.metrics.activeTasks++;
    
    this.emit('task-assigned', { task, agent });
    console.log(`🎯 Task ${task.id} assigned to ${agent.name}`);
    
    // Simulate task execution (in real implementation, this would send to actual agent)
    this.executeTask(task, agent);
  }

  /**
   * Execute task (simulates real agent execution)
   */
  private async executeTask(task: DyadTask, agent: DyadAgent): Promise<void> {
    const executionTime = Math.random() * 5000 + 1000; // 1-6 seconds
    
    try {
      task.status = 'executing';
      
      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, executionTime));
      
      // Simulate success/failure (95% success rate)
      if (Math.random() > 0.05) {
        task.status = 'completed';
        task.completedAt = new Date();
        task.result = {
          success: true,
          executionTime,
          agentId: agent.id,
          timestamp: new Date()
        };
        
        // Update agent metrics
        agent.metrics.tasksCompleted++;
        agent.metrics.averageResponseTime = 
          (agent.metrics.averageResponseTime * (agent.metrics.tasksCompleted - 1) + executionTime) 
          / agent.metrics.tasksCompleted;
        
        this.emit('task-completed', { task, agent });
        console.log(`✅ Task ${task.id} completed by ${agent.name}`);
      } else {
        throw new Error('Simulated execution failure');
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Update agent error metrics
      agent.metrics.errorRate = 
        (agent.metrics.errorRate * agent.metrics.tasksCompleted + 1) 
        / (agent.metrics.tasksCompleted + 1);
      
      this.emit('task-failed', { task, agent, error });
      console.log(`❌ Task ${task.id} failed on ${agent.name}: ${task.error}`);
    } finally {
      // Update agent status
      agent.currentLoad = Math.max(0, agent.currentLoad - 1);
      agent.status = agent.currentLoad === 0 ? 'idle' : 'active';
      
      // Move task from queue to completed
      const taskIndex = this.network.taskQueue.indexOf(task);
      if (taskIndex !== -1) {
        this.network.taskQueue.splice(taskIndex, 1);
      }
      this.network.completedTasks.push(task);
      
      this.network.metrics.activeTasks--;
    }
  }

  /**
   * Monitor agent health via heartbeat
   */
  private monitorAgentHealth(): void {
    const currentTime = new Date();
    const timeoutThreshold = 30000; // 30 seconds
    
    for (const [agentId, agent] of this.network.nodes) {
      const timeSinceLastHeartbeat = currentTime.getTime() - agent.lastHeartbeat.getTime();
      
      if (timeSinceLastHeartbeat > timeoutThreshold && agent.status !== 'error') {
        agent.status = 'error';
        this.emit('agent-timeout', agent);
        console.log(`⚠️ Agent ${agent.name} timed out`);
        
        // Reassign any tasks from failed agent
        this.reassignAgentTasks(agentId);
      }
      
      // Update agent uptime
      agent.metrics.uptime = currentTime.getTime() - 
        (currentTime.getTime() - timeSinceLastHeartbeat);
    }
  }

  /**
   * Reassign tasks from a failed agent
   */
  private reassignAgentTasks(failedAgentId: string): void {
    const tasksToReassign = this.network.taskQueue.filter(
      task => task.assignedAgent === failedAgentId && 
              (task.status === 'assigned' || task.status === 'executing')
    );
    
    for (const task of tasksToReassign) {
      task.status = 'pending';
      task.assignedAgent = undefined;
      task.startedAt = undefined;
      
      console.log(`🔄 Reassigning task ${task.id} from failed agent`);
    }
  }

  /**
   * Update network performance metrics
   */
  private updateNetworkMetrics(): void {
    const completedInLastInterval = this.network.completedTasks.filter(
      task => task.completedAt && 
               (new Date().getTime() - task.completedAt.getTime()) < 10000
    );
    
    this.network.metrics.throughput = completedInLastInterval.length;
    
    if (completedInLastInterval.length > 0) {
      const totalLatency = completedInLastInterval.reduce((sum, task) => {
        return sum + (task.completedAt!.getTime() - task.createdAt.getTime());
      }, 0);
      
      this.network.metrics.averageLatency = totalLatency / completedInLastInterval.length;
    }
    
    this.emit('metrics-updated', this.network.metrics);
  }

  /**
   * Agent heartbeat update
   */
  public updateAgentHeartbeat(agentId: string): boolean {
    const agent = this.network.nodes.get(agentId);
    if (!agent) return false;
    
    agent.lastHeartbeat = new Date();
    if (agent.status === 'error') {
      agent.status = 'idle';
      console.log(`🔄 Agent ${agent.name} recovered`);
    }
    
    return true;
  }

  /**
   * Get network status
   */
  public getNetworkStatus() {
    const agents = Array.from(this.network.nodes.values());
    const agentsByStatus = agents.reduce((acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAgents: agents.length,
      agentsByStatus,
      queuedTasks: this.network.taskQueue.length,
      completedTasks: this.network.completedTasks.length,
      metrics: this.network.metrics,
      topPerformers: agents
        .sort((a, b) => b.metrics.tasksCompleted - a.metrics.tasksCompleted)
        .slice(0, 5)
        .map(a => ({
          name: a.name,
          tasksCompleted: a.metrics.tasksCompleted,
          averageResponseTime: a.metrics.averageResponseTime,
          errorRate: a.metrics.errorRate
        }))
    };
  }

  /**
   * Shutdown orchestration system
   */
  public shutdown(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.taskScheduler) clearInterval(this.taskScheduler);
    if (this.metricsCollector) clearInterval(this.metricsCollector);
    
    console.log('🔴 Dyad AI Orchestration Engine shutdown');
  }
}

// Singleton instance for global access
export const dyadOrchestration = new DyadOrchestrationEngine();

// Default export
export default dyadOrchestration;