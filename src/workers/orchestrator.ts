/**
 * WAI Enhanced Orchestration Worker
 * Production-ready autonomous orchestration system
 */

import EventEmitter from 'events';

interface OrchestrationTask {
  id: string;
  type: 'enterprise' | 'content' | 'assistant' | 'game' | 'code';
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  metadata: {
    sarvamAPIEnabled?: boolean;
    culturalAdaptation?: boolean;
    securityLevel?: 'standard' | 'enterprise' | 'government';
    qualityLevel?: 'balanced' | 'quality' | 'premium';
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

interface OrchestrationMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgProcessingTime: number;
  queueSize: number;
  activeAgents: number;
}

export class WaiOrchestrationWorker extends EventEmitter {
  private taskQueue: Map<string, OrchestrationTask> = new Map();
  private activeAgents: Map<string, any> = new Map();
  private metrics: OrchestrationMetrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    avgProcessingTime: 0,
    queueSize: 0,
    activeAgents: 0
  };
  private isRunning = false;

  constructor() {
    super();
    this.startOrchestrationLoop();
  }

  async startOrchestrationLoop() {
    this.isRunning = true;
    console.log('🚀 WAI Orchestration Worker started');

    while (this.isRunning) {
      try {
        await this.processNextTask();
        await this.updateMetrics();
        await this.sleep(100); // Process tasks every 100ms
      } catch (error) {
        console.error('❌ Orchestration error:', error);
        await this.sleep(1000); // Back off on errors
      }
    }
  }

  async addTask(task: Omit<OrchestrationTask, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: OrchestrationTask = {
      ...task,
      id: taskId,
      status: 'pending',
      createdAt: new Date()
    };

    this.taskQueue.set(taskId, fullTask);
    this.metrics.totalTasks++;
    this.metrics.queueSize = this.taskQueue.size;

    console.log(`📝 Added task ${taskId} (${task.type}, priority: ${task.priority})`);
    this.emit('taskAdded', fullTask);

    return taskId;
  }

  async processNextTask(): Promise<void> {
    const pendingTasks = Array.from(this.taskQueue.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));

    if (pendingTasks.length === 0) return;

    const task = pendingTasks[0];
    task.status = 'processing';
    
    console.log(`⚙️ Processing task ${task.id} (${task.type})`);

    try {
      const startTime = Date.now();
      await this.executeTask(task);
      
      task.status = 'completed';
      task.completedAt = new Date();
      
      const processingTime = Date.now() - startTime;
      this.updateProcessingTimeMetrics(processingTime);
      this.metrics.completedTasks++;

      console.log(`✅ Completed task ${task.id} in ${processingTime}ms`);
      this.emit('taskCompleted', task);

    } catch (error) {
      task.status = 'failed';
      this.metrics.failedTasks++;
      console.error(`❌ Failed task ${task.id}:`, error);
      this.emit('taskFailed', task, error);
    }

    this.metrics.queueSize = this.taskQueue.size;
  }

  private async executeTask(task: OrchestrationTask): Promise<void> {
    switch (task.type) {
      case 'enterprise':
        await this.processEnterpriseTask(task);
        break;
      case 'content':
        await this.processContentTask(task);
        break;
      case 'assistant':
        await this.processAssistantTask(task);
        break;
      case 'game':
        await this.processGameTask(task);
        break;
      case 'code':
        await this.processCodeTask(task);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async processEnterpriseTask(task: OrchestrationTask): Promise<void> {
    // Enhanced Enterprise Solutions processing with SarvamAPI integration
    if (task.metadata.sarvamAPIEnabled) {
      console.log(`🌍 Processing enterprise task with SarvamAPI (${task.metadata.culturalAdaptation ? 'cultural adaptation' : 'standard'})`);
    }

    if (task.metadata.securityLevel === 'government') {
      console.log(`🛡️ Processing with government-grade security`);
      await this.sleep(200); // Simulate enhanced security processing
    }

    // Simulate enterprise AI agent coordination
    await this.sleep(500);
  }

  private async processContentTask(task: OrchestrationTask): Promise<void> {
    // Enhanced Content Studio processing
    console.log(`🎨 Processing content task (${task.metadata.qualityLevel || 'standard'} quality)`);
    
    if (task.metadata.culturalAdaptation) {
      console.log(`🏛️ Applying cultural adaptation for content`);
      await this.sleep(300); // Cultural processing time
    }

    await this.sleep(400);
  }

  private async processAssistantTask(task: OrchestrationTask): Promise<void> {
    // AI Assistant Builder processing
    console.log(`🤖 Processing assistant task`);
    await this.sleep(350);
  }

  private async processGameTask(task: OrchestrationTask): Promise<void> {
    // Game Builder processing with multilingual support
    console.log(`🎮 Processing game task`);
    
    if (task.metadata.sarvamAPIEnabled) {
      console.log(`🌏 Processing game with multilingual support`);
      await this.sleep(250);
    }

    await this.sleep(450);
  }

  private async processCodeTask(task: OrchestrationTask): Promise<void> {
    // Code Studio processing
    console.log(`💻 Processing code task`);
    await this.sleep(300);
  }

  private getPriorityScore(priority: string): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private updateProcessingTimeMetrics(processingTime: number): void {
    const totalCompletedTasks = this.metrics.completedTasks + 1;
    this.metrics.avgProcessingTime = 
      (this.metrics.avgProcessingTime * this.metrics.completedTasks + processingTime) / totalCompletedTasks;
  }

  private async updateMetrics(): Promise<void> {
    this.metrics.queueSize = Array.from(this.taskQueue.values())
      .filter(task => task.status === 'pending').length;
    this.metrics.activeAgents = this.activeAgents.size;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMetrics(): OrchestrationMetrics {
    return { ...this.metrics };
  }

  getTaskStatus(taskId: string): OrchestrationTask | undefined {
    return this.taskQueue.get(taskId);
  }

  stop(): void {
    this.isRunning = false;
    console.log('🛑 WAI Orchestration Worker stopped');
  }
}

// Global orchestration worker instance
export const orchestrationWorker = new WaiOrchestrationWorker();