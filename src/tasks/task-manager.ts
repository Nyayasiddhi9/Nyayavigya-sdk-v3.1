/**
 * WAI Task Manager v9.0
 * Advanced task orchestration and execution management
 */

import { EventEmitter } from 'events';
import { WAILogger } from '../utils/logger';
import { TaskConfig } from '../types/core-types';

export class TaskManager extends EventEmitter {
  private logger: WAILogger;
  private initialized = false;
  private activeTasks: Map<string, Task> = new Map();
  private taskQueue: TaskQueue;
  private taskHistory: TaskExecution[] = [];
  
  constructor(private config: TaskConfig = {}) {
    super();
    this.logger = new WAILogger('TaskManager');
    this.taskQueue = new TaskQueue(config.maxConcurrent || 100);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('📋 Initializing Task Manager...');

      // Initialize task queue
      await this.taskQueue.initialize();

      // Start task monitoring
      this.startTaskMonitoring();

      this.initialized = true;
      this.logger.info('✅ Task Manager initialized');

    } catch (error) {
      this.logger.error('❌ Task Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute a task using the orchestration system
   */
  async execute(taskRequest: TaskRequest): Promise<TaskResult> {
    if (!this.initialized) {
      throw new Error('Task Manager not initialized');
    }

    const taskId = this.generateTaskId();
    const startTime = Date.now();

    try {
      this.logger.info(`🔄 Starting task execution: ${taskId}`);

      // Create task instance
      const task = new Task({
        id: taskId,
        type: taskRequest.type,
        payload: taskRequest.payload,
        agents: taskRequest.agents,
        llmProvider: taskRequest.llmProvider,
        optimizationPlan: taskRequest.optimizationPlan,
        priority: taskRequest.priority || 'medium',
        timeout: this.config.timeoutMs || 300000
      });

      // Add to active tasks
      this.activeTasks.set(taskId, task);

      // Execute task through queue
      const result = await this.taskQueue.execute(task);

      // Calculate execution metrics
      const executionTime = Date.now() - startTime;
      
      const taskResult: TaskResult = {
        taskId,
        success: true,
        result: result.data,
        executionTime,
        qualityScore: result.qualityScore || 0.9,
        actualCost: result.cost || 0,
        feedbackScore: result.feedbackScore || 0.9,
        usedAgents: taskRequest.agents?.map(a => a.id) || [],
        usedLLM: taskRequest.llmProvider?.id || '',
        optimizationEffectiveness: result.optimizationEffectiveness || 0.8,
        metadata: result.metadata || {}
      };

      // Record task execution
      this.recordTaskExecution(task, taskResult);

      // Remove from active tasks
      this.activeTasks.delete(taskId);

      this.logger.info(`✅ Task completed: ${taskId} (${executionTime}ms)`);
      this.emit('taskCompleted', taskResult);

      return taskResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`❌ Task failed: ${taskId}`, error);
      
      // Record failed execution
      const failedResult: TaskResult = {
        taskId,
        success: false,
        error: error.message,
        executionTime,
        qualityScore: 0,
        actualCost: 0,
        feedbackScore: 0,
        usedAgents: [],
        usedLLM: '',
        optimizationEffectiveness: 0,
        metadata: { error: error.message }
      };

      this.recordTaskExecution(this.activeTasks.get(taskId), failedResult);
      this.activeTasks.delete(taskId);

      this.emit('taskFailed', failedResult);
      throw error;
    }
  }

  /**
   * Get task status
   */
  getStatus() {
    return {
      healthy: this.initialized,
      status: this.initialized ? 'active' : 'inactive',
      lastCheck: Date.now(),
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.getQueueSize(),
      completedTasks: this.taskHistory.filter(t => t.result.success).length,
      failedTasks: this.taskHistory.filter(t => !t.result.success).length
    };
  }

  /**
   * Get task execution history
   */
  getTaskHistory(limit?: number): TaskExecution[] {
    return limit ? this.taskHistory.slice(-limit) : this.taskHistory;
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return false;
    }

    try {
      await task.cancel();
      this.activeTasks.delete(taskId);
      this.logger.info(`🛑 Task cancelled: ${taskId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to cancel task: ${taskId}`, error);
      return false;
    }
  }

  /**
   * Get active task information
   */
  getActiveTask(taskId: string): Task | undefined {
    return this.activeTasks.get(taskId);
  }

  /**
   * Start task monitoring system
   */
  private startTaskMonitoring(): void {
    setInterval(() => {
      this.monitorActiveTasks();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Monitor active tasks for timeouts and issues
   */
  private monitorActiveTasks(): void {
    const now = Date.now();
    
    for (const [taskId, task] of this.activeTasks) {
      // Check for timeouts
      if (task.hasTimedOut(now)) {
        this.logger.warn(`⏰ Task timeout detected: ${taskId}`);
        this.cancelTask(taskId);
      }

      // Emit progress updates
      this.emit('taskProgress', {
        taskId,
        progress: task.getProgress(),
        status: task.getStatus()
      });
    }
  }

  /**
   * Record task execution for analytics
   */
  private recordTaskExecution(task: Task | undefined, result: TaskResult): void {
    if (!task) return;

    const execution: TaskExecution = {
      task: {
        id: task.id,
        type: task.type,
        priority: task.priority,
        createdAt: task.createdAt
      },
      result,
      timestamp: Date.now()
    };

    this.taskHistory.push(execution);

    // Rotate history if too large
    if (this.taskHistory.length > 10000) {
      this.taskHistory = this.taskHistory.slice(-5000);
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown(): Promise<void> {
    this.logger.info('🔄 Shutting down task manager...');
    
    // Cancel all active tasks
    const cancelPromises = Array.from(this.activeTasks.keys())
      .map(taskId => this.cancelTask(taskId));
    
    await Promise.all(cancelPromises);
    
    // Shutdown task queue
    await this.taskQueue.shutdown();
    
    this.initialized = false;
  }
}

/**
 * Task class representing an individual task
 */
class Task {
  public id: string;
  public type: string;
  public payload: any;
  public agents: any[];
  public llmProvider: any;
  public optimizationPlan: any;
  public priority: 'low' | 'medium' | 'high' | 'urgent';
  public timeout: number;
  public createdAt: number;
  private status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' = 'pending';
  private progress = 0;
  private startedAt?: number;

  constructor(config: {
    id: string;
    type: string;
    payload: any;
    agents?: any[];
    llmProvider?: any;
    optimizationPlan?: any;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    timeout: number;
  }) {
    this.id = config.id;
    this.type = config.type;
    this.payload = config.payload;
    this.agents = config.agents || [];
    this.llmProvider = config.llmProvider;
    this.optimizationPlan = config.optimizationPlan;
    this.priority = config.priority;
    this.timeout = config.timeout;
    this.createdAt = Date.now();
  }

  start(): void {
    this.status = 'running';
    this.startedAt = Date.now();
  }

  complete(): void {
    this.status = 'completed';
    this.progress = 100;
  }

  fail(): void {
    this.status = 'failed';
  }

  async cancel(): Promise<void> {
    this.status = 'cancelled';
  }

  updateProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(100, progress));
  }

  getProgress(): number {
    return this.progress;
  }

  getStatus(): string {
    return this.status;
  }

  hasTimedOut(currentTime: number): boolean {
    if (!this.startedAt || this.status !== 'running') {
      return false;
    }
    return (currentTime - this.startedAt) > this.timeout;
  }

  getExecutionTime(): number {
    if (!this.startedAt) return 0;
    return Date.now() - this.startedAt;
  }
}

/**
 * Task Queue for managing concurrent task execution
 */
class TaskQueue {
  private queue: Task[] = [];
  private running: Map<string, Task> = new Map();
  private maxConcurrent: number;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  async initialize(): Promise<void> {
    // Initialize queue processor
    this.startQueueProcessor();
  }

  async execute(task: Task): Promise<any> {
    return new Promise((resolve, reject) => {
      task.start();
      
      // Simulate task execution (replace with actual agent coordination)
      const executionPromise = this.simulateTaskExecution(task);
      
      executionPromise
        .then(result => {
          task.complete();
          resolve(result);
        })
        .catch(error => {
          task.fail();
          reject(error);
        });
    });
  }

  /**
   * Simulate task execution (replace with actual agent coordination)
   */
  private async simulateTaskExecution(task: Task): Promise<any> {
    // Simulate processing time based on task complexity
    const processingTime = this.calculateProcessingTime(task);
    
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Simulate different outcomes based on task type
    const success = Math.random() > 0.1; // 90% success rate
    
    if (!success) {
      throw new Error(`Task execution failed: ${task.type}`);
    }

    return {
      data: `Task ${task.type} completed successfully`,
      qualityScore: 0.85 + Math.random() * 0.15,
      cost: Math.random() * 10,
      feedbackScore: 0.8 + Math.random() * 0.2,
      optimizationEffectiveness: 0.7 + Math.random() * 0.3,
      metadata: {
        processingTime,
        agentsUsed: task.agents?.length || 0
      }
    };
  }

  private calculateProcessingTime(task: Task): number {
    const baseTime = 1000; // 1 second base
    const complexityMultiplier = {
      'low': 1,
      'medium': 2,
      'high': 4,
      'urgent': 0.5
    };
    
    return baseTime * (complexityMultiplier[task.priority] || 2);
  }

  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 100); // Process every 100ms
  }

  private processQueue(): void {
    while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      const task = this.queue.shift();
      if (task) {
        this.running.set(task.id, task);
        this.execute(task).finally(() => {
          this.running.delete(task.id);
        });
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  async shutdown(): Promise<void> {
    // Wait for running tasks to complete or timeout
    const timeout = 30000; // 30 seconds
    const start = Date.now();
    
    while (this.running.size > 0 && (Date.now() - start) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Type definitions
interface TaskRequest {
  type: string;
  payload: any;
  agents?: any[];
  llmProvider?: any;
  optimizationPlan?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  qualityScore: number;
  actualCost: number;
  feedbackScore: number;
  usedAgents: string[];
  usedLLM: string;
  optimizationEffectiveness: number;
  metadata: Record<string, any>;
}

interface TaskExecution {
  task: {
    id: string;
    type: string;
    priority: string;
    createdAt: number;
  };
  result: TaskResult;
  timestamp: number;
}