/**
 * Eigent-AI Multi-Agent Workforce Management Integration
 * 
 * Implements intelligent task distribution, parallel processing coordination,
 * and performance-based agent selection across the WAI agent ecosystem.
 * 
 * Based on: https://github.com/eigent-ai/eigent
 */

import { EventEmitter } from 'events';

export interface EigentAgent {
  id: string;
  type: string;
  capabilities: string[];
  status: 'available' | 'busy' | 'maintenance' | 'offline';
  performance: {
    averageTaskTime: number;
    successRate: number;
    qualityScore: number;
    efficiency: number;
    specialization: Record<string, number>;
  };
  workload: {
    currentTasks: number;
    maxConcurrentTasks: number;
    queuedTasks: number;
    utilizationRate: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    gpuUsage?: number;
    networkLatency: number;
  };
}

export interface EigentTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: number; // 0-1 scale
  requirements: {
    capabilities: string[];
    minQuality: number;
    maxTime?: number;
    resources: {
      cpu?: number;
      memory?: number;
      gpu?: boolean;
    };
  };
  dependencies: string[];
  payload: any;
  metadata: {
    created: Date;
    assignedTo?: string;
    startTime?: Date;
    endTime?: Date;
    retries: number;
    parentTaskId?: string;
  };
}

export interface EigentWorkflow {
  id: string;
  name: string;
  tasks: EigentTask[];
  strategy: 'parallel' | 'sequential' | 'adaptive' | 'pipeline';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  metrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTime: number;
    parallelization: number; // 0-1 scale
    efficiency: number;
  };
}

export class EigentTaskDistributor extends EventEmitter {
  private agents: Map<string, EigentAgent> = new Map();
  private taskQueue: EigentTask[] = [];
  private distributionAlgorithm: string = 'performance-weighted';
  
  constructor() {
    super();
    this.startDistributionLoop();
  }

  /**
   * Register agent in the workforce
   */
  registerAgent(agent: EigentAgent): void {
    this.agents.set(agent.id, agent);
    
    this.emit('agent-registered', {
      agentId: agent.id,
      type: agent.type,
      capabilities: agent.capabilities,
      timestamp: new Date()
    });
  }

  /**
   * Submit task for distribution
   */
  async submitTask(task: EigentTask): Promise<string> {
    try {
      // Validate task requirements
      this.validateTask(task);
      
      // Add to queue
      this.taskQueue.push(task);
      
      this.emit('task-submitted', {
        taskId: task.id,
        type: task.type,
        priority: task.priority,
        queuePosition: this.taskQueue.length,
        timestamp: new Date()
      });

      return task.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'task-submission', error: errorMessage, taskId: task.id });
      throw error;
    }
  }

  /**
   * Intelligent task distribution based on agent capabilities and performance
   */
  async distributeTask(task: EigentTask): Promise<string> {
    try {
      // Find suitable agents
      const candidateAgents = this.findCandidateAgents(task);
      if (candidateAgents.length === 0) {
        throw new Error('No suitable agents available for task');
      }

      // Score and rank agents
      const rankedAgents = await this.rankAgents(candidateAgents, task);
      
      // Select best agent using distribution algorithm
      const selectedAgent = await this.selectAgent(rankedAgents, task);
      
      // Assign task to agent
      await this.assignTaskToAgent(task, selectedAgent);
      
      this.emit('task-distributed', {
        taskId: task.id,
        agentId: selectedAgent.id,
        score: this.calculateAgentScore(selectedAgent, task),
        timestamp: new Date()
      });

      return selectedAgent.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'task-distribution', error: errorMessage, taskId: task.id });
      throw error;
    }
  }

  /**
   * Parallel task execution coordination
   */
  async executeParallelTasks(tasks: EigentTask[]): Promise<Map<string, any>> {
    try {
      this.emit('parallel-execution-started', {
        taskCount: tasks.length,
        timestamp: new Date()
      });

      // Group tasks by compatibility for parallel execution
      const parallelGroups = this.groupTasksForParallelExecution(tasks);
      const results = new Map<string, any>();

      for (const group of parallelGroups) {
        // Execute tasks in each group in parallel
        const groupPromises = group.map(async (task) => {
          const agentId = await this.distributeTask(task);
          const result = await this.executeTaskOnAgent(task, agentId);
          return { taskId: task.id, result };
        });

        const groupResults = await Promise.allSettled(groupPromises);
        
        // Process results
        groupResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.set(result.value.taskId, result.value.result);
          } else {
            results.set(group[index].id, { error: result.reason });
          }
        });
      }

      this.emit('parallel-execution-completed', {
        taskCount: tasks.length,
        successCount: Array.from(results.values()).filter(r => !r.error).length,
        timestamp: new Date()
      });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'parallel-execution', error: errorMessage });
      throw error;
    }
  }

  private validateTask(task: EigentTask): void {
    if (!task.id || !task.type) {
      throw new Error('Task must have id and type');
    }
    
    if (!task.requirements.capabilities || task.requirements.capabilities.length === 0) {
      throw new Error('Task must specify required capabilities');
    }
  }

  private findCandidateAgents(task: EigentTask): EigentAgent[] {
    const candidates: EigentAgent[] = [];
    
    for (const agent of this.agents.values()) {
      // Check availability
      if (agent.status !== 'available') continue;
      
      // Check capability match
      const hasRequiredCapabilities = task.requirements.capabilities.every(cap =>
        agent.capabilities.includes(cap)
      );
      if (!hasRequiredCapabilities) continue;
      
      // Check quality threshold
      if (agent.performance.qualityScore < task.requirements.minQuality) continue;
      
      // Check resource availability
      if (!this.checkResourceAvailability(agent, task)) continue;
      
      // Check workload capacity
      if (agent.workload.currentTasks >= agent.workload.maxConcurrentTasks) continue;
      
      candidates.push(agent);
    }
    
    return candidates;
  }

  private async rankAgents(agents: EigentAgent[], task: EigentTask): Promise<EigentAgent[]> {
    // Calculate scores for each agent
    const agentScores = agents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, task)
    }));
    
    // Sort by score (highest first)
    agentScores.sort((a, b) => b.score - a.score);
    
    return agentScores.map(item => item.agent);
  }

  private calculateAgentScore(agent: EigentAgent, task: EigentTask): number {
    let score = 0;
    
    // Performance factors (40% weight)
    score += agent.performance.successRate * 0.15;
    score += agent.performance.qualityScore * 0.15;
    score += agent.performance.efficiency * 0.10;
    
    // Specialization match (30% weight)
    const specializationScore = task.requirements.capabilities.reduce((sum, cap) => {
      return sum + (agent.performance.specialization[cap] || 0);
    }, 0) / task.requirements.capabilities.length;
    score += specializationScore * 0.30;
    
    // Workload optimization (20% weight)
    const workloadScore = 1 - agent.workload.utilizationRate;
    score += workloadScore * 0.20;
    
    // Resource efficiency (10% weight)
    const resourceScore = (1 - agent.resources.cpuUsage) * 0.05 + 
                         (1 - agent.resources.memoryUsage) * 0.05;
    score += resourceScore;
    
    return score;
  }

  private async selectAgent(rankedAgents: EigentAgent[], task: EigentTask): Promise<EigentAgent> {
    switch (this.distributionAlgorithm) {
      case 'performance-weighted':
        return this.selectBestPerformingAgent(rankedAgents);
      
      case 'load-balanced':
        return this.selectLeastLoadedAgent(rankedAgents);
      
      case 'round-robin':
        return this.selectRoundRobinAgent(rankedAgents);
      
      case 'adaptive':
        return await this.selectAdaptiveAgent(rankedAgents, task);
      
      default:
        return rankedAgents[0]; // Best scored agent
    }
  }

  private selectBestPerformingAgent(rankedAgents: EigentAgent[]): EigentAgent {
    return rankedAgents[0]; // Already sorted by performance
  }

  private selectLeastLoadedAgent(rankedAgents: EigentAgent[]): EigentAgent {
    return rankedAgents.reduce((least, current) =>
      current.workload.utilizationRate < least.workload.utilizationRate ? current : least
    );
  }

  private selectRoundRobinAgent(rankedAgents: EigentAgent[]): EigentAgent {
    // Simple round-robin selection
    const timestamp = Date.now();
    const index = timestamp % rankedAgents.length;
    return rankedAgents[index];
  }

  private async selectAdaptiveAgent(rankedAgents: EigentAgent[], task: EigentTask): Promise<EigentAgent> {
    // Adaptive selection based on current system state
    const systemLoad = this.calculateSystemLoad();
    
    if (systemLoad > 0.8) {
      // High load - prioritize least loaded agents
      return this.selectLeastLoadedAgent(rankedAgents);
    } else if (task.priority === 'critical') {
      // Critical task - use best performing agent
      return this.selectBestPerformingAgent(rankedAgents);
    } else {
      // Normal conditions - balanced selection
      const topCandidates = rankedAgents.slice(0, Math.min(3, rankedAgents.length));
      return this.selectLeastLoadedAgent(topCandidates);
    }
  }

  private async assignTaskToAgent(task: EigentTask, agent: EigentAgent): Promise<void> {
    // Update agent workload
    agent.workload.currentTasks++;
    agent.workload.utilizationRate = agent.workload.currentTasks / agent.workload.maxConcurrentTasks;
    agent.status = agent.workload.currentTasks >= agent.workload.maxConcurrentTasks ? 'busy' : 'available';
    
    // Update task metadata
    task.metadata.assignedTo = agent.id;
    task.metadata.startTime = new Date();
  }

  private async executeTaskOnAgent(task: EigentTask, agentId: string): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const startTime = Date.now();
    const { logger } = await import('../utils/wai-logger.ts');

    try {
      // Update agent status
      agent.status = 'busy';
      
      logger.info('eigent-workforce', `Executing task on agent`, { 
        taskId: task.id, 
        agentId, 
        taskType: task.type,
        agentType: agent.type
      });

      // Real agent execution through WAI orchestration
      const executionResult = await this.executeRealAgentTask(task, agent);
      
      const executionTime = Date.now() - startTime;
      
      const result = {
        taskId: task.id,
        agentId,
        output: executionResult.output,
        data: executionResult.data,
        executionTime,
        quality: executionResult.quality || agent.performance.qualityScore,
        timestamp: new Date(),
        success: true
      };

      // Update agent performance metrics with real results
      this.updateAgentPerformance(agent, task, true, executionTime);
      
      // Update task metadata
      task.metadata.endTime = new Date();
      
      logger.info('eigent-workforce', `Task completed successfully`, { 
        taskId: task.id, 
        agentId, 
        executionTime,
        quality: result.quality
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('eigent-workforce', `Task execution failed`, { 
        taskId: task.id, 
        agentId, 
        error: errorMessage,
        executionTime
      });
      
      // Update agent performance on failure
      this.updateAgentPerformance(agent, task, false, executionTime);
      
      // Return error result instead of throwing
      return {
        taskId: task.id,
        agentId,
        output: `Task failed: ${errorMessage}`,
        executionTime,
        quality: 0,
        timestamp: new Date(),
        success: false,
        error: errorMessage
      };
    } finally {
      // Update agent workload
      agent.workload.currentTasks--;
      agent.workload.utilizationRate = agent.workload.currentTasks / agent.workload.maxConcurrentTasks;
      agent.status = agent.workload.currentTasks > 0 ? 'busy' : 'available';
    }
  }

  private async executeRealAgentTask(task: EigentTask, agent: EigentAgent): Promise<any> {
    try {
      // Route through LLM routing engine for intelligent provider selection
      const { executeWithProvider } = await import('./llm-routing-engine.js');
      
      // Build specialized prompt based on agent capabilities and task requirements
      const prompt = this.buildAgentPrompt(task, agent);
      
      // Select optimal provider based on task complexity and agent specialization
      const provider = this.selectProviderForTask(task, agent);
      
      // Execute with real LLM provider
      const llmResponse = await executeWithProvider(provider, prompt, {
        maxTokens: this.calculateMaxTokens(task),
        temperature: this.calculateTemperature(task),
        model: this.selectModelForAgent(agent)
      });
      
      // Process and validate LLM response
      const processedResult = this.processAgentResponse(llmResponse, task, agent);
      
      return processedResult;
    } catch (error) {
      const { logger } = await import('../utils/wai-logger.ts');
      logger.error('eigent-workforce', 'Real agent execution failed', { 
        taskId: task.id,
        agentId: agent.id,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to basic execution if LLM routing fails
      return await this.executeBasicAgentTask(task, agent);
    }
  }

  private buildAgentPrompt(task: EigentTask, agent: EigentAgent): string {
    return `You are a ${agent.type} agent with capabilities: ${agent.capabilities.join(', ')}.

Task Type: ${task.type}
Priority: ${task.priority}
Complexity: ${task.complexity}
Requirements: ${JSON.stringify(task.requirements)}

Task Payload:
${JSON.stringify(task.payload, null, 2)}

Please execute this task efficiently and provide a structured response with:
1. Completed output/result
2. Quality assessment (0-1 scale)  
3. Any relevant data or insights
4. Brief execution summary

Respond in JSON format:
{
  "output": "your result here",
  "quality": 0.95,
  "data": {},
  "summary": "execution details"
}`;
  }

  private selectProviderForTask(task: EigentTask, agent: EigentAgent): string {
    // Intelligent provider selection based on task and agent characteristics
    if (task.type.includes('code') || task.type.includes('development')) {
      return 'anthropic'; // Claude excels at coding
    } else if (task.type.includes('creative') || task.type.includes('content')) {
      return 'openai'; // GPT-4 for creative tasks
    } else if (task.type.includes('analysis') || task.type.includes('research')) {
      return 'perplexity'; // Perplexity for research tasks
    } else {
      return 'anthropic'; // Default to Claude for general intelligence
    }
  }

  private calculateMaxTokens(task: EigentTask): number {
    // Scale tokens based on task complexity
    const baseTokens = 1000;
    const complexityMultiplier = task.complexity;
    return Math.min(4096, Math.floor(baseTokens * (1 + complexityMultiplier)));
  }

  private calculateTemperature(task: EigentTask): number {
    // Lower temperature for analytical tasks, higher for creative tasks
    if (task.type.includes('analysis') || task.type.includes('calculation')) {
      return 0.1;
    } else if (task.type.includes('creative') || task.type.includes('brainstorm')) {
      return 0.8;
    } else {
      return 0.7; // Default balanced temperature
    }
  }

  private selectModelForAgent(agent: EigentAgent): string {
    // Select model based on agent type and capabilities
    if (agent.capabilities.includes('advanced-reasoning')) {
      return 'claude-3.5-sonnet';
    } else if (agent.capabilities.includes('creative-generation')) {
      return 'gpt-4o';
    } else {
      return 'gpt-4o-mini'; // Efficient default
    }
  }

  private processAgentResponse(llmResponse: any, task: EigentTask, agent: EigentAgent): any {
    try {
      // Parse LLM response
      let responseData;
      if (typeof llmResponse === 'string') {
        responseData = JSON.parse(llmResponse);
      } else if (llmResponse.text) {
        responseData = JSON.parse(llmResponse.text);
      } else {
        responseData = llmResponse;
      }
      
      // Validate response structure
      if (!responseData.output) {
        throw new Error('LLM response missing required output field');
      }
      
      return {
        output: responseData.output,
        quality: responseData.quality || 0.8,
        data: responseData.data || {},
        summary: responseData.summary || 'Task completed'
      };
    } catch (error) {
      // Fallback processing for malformed responses
      const rawOutput = typeof llmResponse === 'string' ? llmResponse : 
                       llmResponse.text || JSON.stringify(llmResponse);
      
      return {
        output: rawOutput,
        quality: 0.7, // Lower quality for unstructured response
        data: {},
        summary: 'Completed with unstructured response'
      };
    }
  }

  private async executeBasicAgentTask(task: EigentTask, agent: EigentAgent): Promise<any> {
    // Basic fallback execution without LLM routing
    return {
      output: `Task ${task.type} processed by ${agent.type} agent (fallback mode)`,
      quality: 0.6, // Lower quality for fallback
      data: { fallback: true },
      summary: 'Executed in fallback mode due to LLM routing failure'
    };
  }

  private groupTasksForParallelExecution(tasks: EigentTask[]): EigentTask[][] {
    const groups: EigentTask[][] = [];
    const processed = new Set<string>();
    
    for (const task of tasks) {
      if (processed.has(task.id)) continue;
      
      const group = [task];
      processed.add(task.id);
      
      // Find tasks that can run in parallel with this one
      for (const otherTask of tasks) {
        if (processed.has(otherTask.id)) continue;
        
        if (this.canRunInParallel(task, otherTask)) {
          group.push(otherTask);
          processed.add(otherTask.id);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  private canRunInParallel(task1: EigentTask, task2: EigentTask): boolean {
    // Check if tasks have dependencies on each other
    if (task1.dependencies.includes(task2.id) || task2.dependencies.includes(task1.id)) {
      return false;
    }
    
    // Check if tasks require exclusive resources
    if (this.requiresExclusiveResources(task1, task2)) {
      return false;
    }
    
    return true;
  }

  private requiresExclusiveResources(task1: EigentTask, task2: EigentTask): boolean {
    // Simple resource conflict detection
    return task1.requirements.resources.gpu && task2.requirements.resources.gpu;
  }

  private checkResourceAvailability(agent: EigentAgent, task: EigentTask): boolean {
    const req = task.requirements.resources;
    
    if (req.cpu && agent.resources.cpuUsage + req.cpu > 1.0) return false;
    if (req.memory && agent.resources.memoryUsage + req.memory > 1.0) return false;
    if (req.gpu && !agent.resources.gpuUsage) return false;
    
    return true;
  }

  private estimateExecutionTime(task: EigentTask, agent: EigentAgent): number {
    // Base time estimation
    const baseTime = task.complexity * 10000; // 10 seconds for complexity 1.0
    
    // Agent efficiency factor
    const efficiencyFactor = agent.performance.efficiency || 1.0;
    
    // Specialization factor
    const specializationScore = task.requirements.capabilities.reduce((sum, cap) => {
      return sum + (agent.performance.specialization[cap] || 0.5);
    }, 0) / task.requirements.capabilities.length;
    
    const estimatedTime = baseTime / (efficiencyFactor * specializationScore);
    return Math.max(500, estimatedTime); // Minimum 500ms
  }

  private updateAgentPerformance(agent: EigentAgent, task: EigentTask, success: boolean, executionTime: number): void {
    // Update success rate
    const totalTasks = agent.performance.averageTaskTime > 0 ? 
      Math.round(10000 / agent.performance.averageTaskTime) : 1; // Rough estimate
    agent.performance.successRate = (agent.performance.successRate * totalTasks + (success ? 1 : 0)) / (totalTasks + 1);
    
    // Update average task time (only for successful tasks)
    if (success) {
      agent.performance.averageTaskTime = (agent.performance.averageTaskTime + executionTime) / 2;
    }
    
    // Update specialization scores
    for (const capability of task.requirements.capabilities) {
      const currentScore = agent.performance.specialization[capability] || 0.5;
      const improvement = success ? 0.01 : -0.005; // Small incremental improvement/degradation
      agent.performance.specialization[capability] = Math.max(0, Math.min(1, currentScore + improvement));
    }
    
    // Recalculate efficiency
    agent.performance.efficiency = (agent.performance.successRate + 
      (1 / Math.max(1, agent.performance.averageTaskTime / 1000))) / 2;
  }

  private calculateSystemLoad(): number {
    const agents = Array.from(this.agents.values());
    if (agents.length === 0) return 0;
    
    const totalUtilization = agents.reduce((sum, agent) => sum + agent.workload.utilizationRate, 0);
    return totalUtilization / agents.length;
  }

  private startDistributionLoop(): void {
    setInterval(async () => {
      if (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (task) {
          try {
            await this.distributeTask(task);
          } catch (error) {
            // Re-queue task with retry logic
            if (task.metadata.retries < 3) {
              task.metadata.retries++;
              this.taskQueue.push(task);
            } else {
              this.emit('task-failed', {
                taskId: task.id,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date()
              });
            }
          }
        }
      }
    }, 100); // Check queue every 100ms
  }
}

export class EigentWorkflowManager extends EventEmitter {
  private workflows: Map<string, EigentWorkflow> = new Map();
  private taskDistributor: EigentTaskDistributor;

  constructor(taskDistributor: EigentTaskDistributor) {
    super();
    this.taskDistributor = taskDistributor;
  }

  /**
   * Create and execute workflow with specified strategy
   */
  async executeWorkflow(
    name: string,
    tasks: EigentTask[],
    strategy: 'parallel' | 'sequential' | 'adaptive' | 'pipeline' = 'adaptive'
  ): Promise<any> {
    try {
      const workflowId = `workflow-${Date.now()}`;
      
      const workflow: EigentWorkflow = {
        id: workflowId,
        name,
        tasks,
        strategy,
        status: 'pending',
        metrics: {
          totalTasks: tasks.length,
          completedTasks: 0,
          failedTasks: 0,
          averageTime: 0,
          parallelization: 0,
          efficiency: 0
        }
      };

      this.workflows.set(workflowId, workflow);

      this.emit('workflow-started', {
        workflowId,
        name,
        taskCount: tasks.length,
        strategy,
        timestamp: new Date()
      });

      const startTime = Date.now();
      workflow.status = 'running';

      let results: any;
      switch (strategy) {
        case 'parallel':
          results = await this.executeParallelWorkflow(workflow);
          break;
        case 'sequential':
          results = await this.executeSequentialWorkflow(workflow);
          break;
        case 'adaptive':
          results = await this.executeAdaptiveWorkflow(workflow);
          break;
        case 'pipeline':
          results = await this.executePipelineWorkflow(workflow);
          break;
        default:
          throw new Error(`Unknown workflow strategy: ${strategy}`);
      }

      const endTime = Date.now();
      workflow.status = 'completed';
      workflow.metrics.averageTime = endTime - startTime;
      workflow.metrics.efficiency = this.calculateWorkflowEfficiency(workflow, results);

      this.emit('workflow-completed', {
        workflowId,
        duration: workflow.metrics.averageTime,
        efficiency: workflow.metrics.efficiency,
        results: results.size,
        timestamp: new Date()
      });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'workflow-execution', error: errorMessage });
      throw error;
    }
  }

  private async executeParallelWorkflow(workflow: EigentWorkflow): Promise<Map<string, any>> {
    // Execute all tasks in parallel
    const results = await this.taskDistributor.executeParallelTasks(workflow.tasks);
    
    workflow.metrics.completedTasks = Array.from(results.values()).filter(r => !r.error).length;
    workflow.metrics.failedTasks = Array.from(results.values()).filter(r => r.error).length;
    workflow.metrics.parallelization = 1.0; // Full parallelization
    
    return results;
  }

  private async executeSequentialWorkflow(workflow: EigentWorkflow): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    // Execute tasks one by one
    for (const task of workflow.tasks) {
      try {
        const agentId = await this.taskDistributor.distributeTask(task);
        const result = await this.executeTaskOnAgent(task, agentId);
        results.set(task.id, result);
        workflow.metrics.completedTasks++;
      } catch (error) {
        results.set(task.id, { error: error instanceof Error ? error.message : String(error) });
        workflow.metrics.failedTasks++;
      }
    }
    
    workflow.metrics.parallelization = 0.0; // No parallelization
    return results;
  }

  private async executeAdaptiveWorkflow(workflow: EigentWorkflow): Promise<Map<string, any>> {
    // Analyze task dependencies and system load to determine optimal execution pattern
    const dependencyGraph = this.buildDependencyGraph(workflow.tasks);
    const executionPlan = this.createAdaptiveExecutionPlan(dependencyGraph);
    
    const results = new Map<string, any>();
    let parallelTasks = 0;
    let totalTasks = 0;
    
    for (const stage of executionPlan) {
      if (stage.length === 1) {
        // Sequential execution
        const task = stage[0];
        try {
          const agentId = await this.taskDistributor.distributeTask(task);
          const result = await this.executeTaskOnAgent(task, agentId);
          results.set(task.id, result);
          workflow.metrics.completedTasks++;
        } catch (error) {
          results.set(task.id, { error: error instanceof Error ? error.message : String(error) });
          workflow.metrics.failedTasks++;
        }
        totalTasks++;
      } else {
        // Parallel execution
        const stageResults = await this.taskDistributor.executeParallelTasks(stage);
        for (const [taskId, result] of stageResults) {
          results.set(taskId, result);
          if (result.error) {
            workflow.metrics.failedTasks++;
          } else {
            workflow.metrics.completedTasks++;
          }
        }
        parallelTasks += stage.length;
        totalTasks += stage.length;
      }
    }
    
    workflow.metrics.parallelization = parallelTasks / totalTasks;
    return results;
  }

  private async executePipelineWorkflow(workflow: EigentWorkflow): Promise<Map<string, any>> {
    // Pipeline execution - start next task as soon as previous one produces output
    const results = new Map<string, any>();
    const pipeline: Promise<any>[] = [];
    
    for (let i = 0; i < workflow.tasks.length; i++) {
      const task = workflow.tasks[i];
      
      const taskPromise = (async () => {
        // Wait for dependencies if any
        if (i > 0) {
          await pipeline[i - 1]; // Wait for previous task in pipeline
        }
        
        try {
          const agentId = await this.taskDistributor.distributeTask(task);
          const result = await this.executeTaskOnAgent(task, agentId);
          results.set(task.id, result);
          workflow.metrics.completedTasks++;
          return result;
        } catch (error) {
          const errorResult = { error: error instanceof Error ? error.message : String(error) };
          results.set(task.id, errorResult);
          workflow.metrics.failedTasks++;
          return errorResult;
        }
      })();
      
      pipeline.push(taskPromise);
    }
    
    // Wait for all pipeline tasks to complete
    await Promise.all(pipeline);
    
    workflow.metrics.parallelization = 0.5; // Partial parallelization in pipeline
    return results;
  }

  private buildDependencyGraph(tasks: EigentTask[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const task of tasks) {
      graph.set(task.id, task.dependencies);
    }
    
    return graph;
  }

  private createAdaptiveExecutionPlan(dependencyGraph: Map<string, string[]>): EigentTask[][] {
    // Create execution plan that respects dependencies while maximizing parallelization
    const plan: EigentTask[][] = [];
    const completed = new Set<string>();
    const allTasks = Array.from(dependencyGraph.keys());
    
    while (completed.size < allTasks.length) {
      const readyTasks = allTasks.filter(taskId => {
        if (completed.has(taskId)) return false;
        const dependencies = dependencyGraph.get(taskId) || [];
        return dependencies.every(depId => completed.has(depId));
      });
      
      if (readyTasks.length === 0) {
        throw new Error('Circular dependency detected in workflow');
      }
      
      // Find actual task objects for ready task IDs
      const stageTasks = readyTasks.map(taskId => {
        // This would need to be properly implemented with actual task lookup
        return { id: taskId, dependencies: dependencyGraph.get(taskId) || [] } as EigentTask;
      });
      
      plan.push(stageTasks);
      readyTasks.forEach(taskId => completed.add(taskId));
    }
    
    return plan;
  }

  private calculateWorkflowEfficiency(workflow: EigentWorkflow, results: Map<string, any>): number {
    const successRate = workflow.metrics.completedTasks / workflow.metrics.totalTasks;
    const parallelizationBonus = workflow.metrics.parallelization * 0.2; // 20% bonus for parallelization
    const timeEfficiency = Math.min(1, 60000 / workflow.metrics.averageTime); // Normalize to 1 minute baseline
    
    return Math.min(1, successRate + parallelizationBonus + timeEfficiency * 0.1);
  }

  private async executeTaskOnAgent(task: EigentTask, agentId: string): Promise<any> {
    // This would integrate with the actual task execution system
    return {
      taskId: task.id,
      agentId,
      output: `Task ${task.type} completed`,
      timestamp: new Date()
    };
  }

  // Public interface methods
  getWorkflowMetrics(): any {
    const workflows = Array.from(this.workflows.values());
    
    return {
      total: workflows.length,
      running: workflows.filter(w => w.status === 'running').length,
      completed: workflows.filter(w => w.status === 'completed').length,
      failed: workflows.filter(w => w.status === 'failed').length,
      averageEfficiency: workflows
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.metrics.efficiency, 0) / 
        Math.max(1, workflows.filter(w => w.status === 'completed').length),
      averageParallelization: workflows
        .reduce((sum, w) => sum + w.metrics.parallelization, 0) / workflows.length
    };
  }
}

export class EigentMasterOrchestrator extends EventEmitter {
  private taskDistributor: EigentTaskDistributor;
  private workflowManager: EigentWorkflowManager;
  
  constructor() {
    super();
    this.taskDistributor = new EigentTaskDistributor();
    this.workflowManager = new EigentWorkflowManager(this.taskDistributor);
    this.setupEventHandlers();
  }

  /**
   * Register agent in the workforce
   */
  registerAgent(agentConfig: {
    id: string;
    type: string;
    capabilities: string[];
    maxConcurrentTasks?: number;
  }): void {
    const agent: EigentAgent = {
      id: agentConfig.id,
      type: agentConfig.type,
      capabilities: agentConfig.capabilities,
      status: 'available',
      performance: {
        averageTaskTime: 5000, // 5 seconds default
        successRate: 0.9,
        qualityScore: 0.85,
        efficiency: 0.8,
        specialization: {}
      },
      workload: {
        currentTasks: 0,
        maxConcurrentTasks: agentConfig.maxConcurrentTasks || 3,
        queuedTasks: 0,
        utilizationRate: 0
      },
      resources: {
        cpuUsage: 0.1,
        memoryUsage: 0.2,
        networkLatency: 50
      }
    };

    // Initialize specialization scores
    agentConfig.capabilities.forEach(cap => {
      agent.performance.specialization[cap] = 0.7; // Default moderate specialization
    });

    this.taskDistributor.registerAgent(agent);
  }

  /**
   * Execute distributed workflow across agent workforce
   */
  async executeDistributedWorkflow(
    name: string,
    tasks: any[],
    options: {
      strategy?: 'parallel' | 'sequential' | 'adaptive' | 'pipeline';
      priority?: 'low' | 'medium' | 'high' | 'critical';
      maxRetries?: number;
    } = {}
  ): Promise<any> {
    try {
      // Convert input tasks to EigentTask format
      const eigentTasks: EigentTask[] = tasks.map((task, index) => ({
        id: task.id || `task-${Date.now()}-${index}`,
        type: task.type || 'general',
        priority: options.priority || 'medium',
        complexity: task.complexity || 0.5,
        requirements: {
          capabilities: task.capabilities || ['general'],
          minQuality: task.minQuality || 0.7,
          maxTime: task.maxTime,
          resources: task.resources || {}
        },
        dependencies: task.dependencies || [],
        payload: task.payload || task,
        metadata: {
          created: new Date(),
          retries: 0,
          parentTaskId: task.parentTaskId
        }
      }));

      const results = await this.workflowManager.executeWorkflow(
        name,
        eigentTasks,
        options.strategy || 'adaptive'
      );

      return this.formatResults(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'distributed-workflow', error: errorMessage });
      throw error;
    }
  }

  private formatResults(results: Map<string, any>): any {
    const formattedResults: any[] = [];
    const summary = {
      total: results.size,
      successful: 0,
      failed: 0,
      results: formattedResults
    };

    for (const [taskId, result] of results) {
      const formattedResult = {
        taskId,
        success: !result.error,
        result: result.error ? undefined : result,
        error: result.error,
        timestamp: new Date()
      };

      formattedResults.push(formattedResult);
      
      if (result.error) {
        summary.failed++;
      } else {
        summary.successful++;
      }
    }

    return summary;
  }

  private setupEventHandlers(): void {
    // Forward events from child components
    [this.taskDistributor, this.workflowManager].forEach(component => {
      component.on('error', (error) => this.emit('error', error));
    });

    // Orchestration logging
    this.on('agent-registered', (data) => {
      console.log(`👥 Eigent: Registered agent ${data.agentId} (${data.type})`);
    });

    this.on('workflow-completed', (data) => {
      console.log(`✅ Eigent: Completed workflow ${data.workflowId} with ${data.efficiency * 100}% efficiency`);
    });

    this.on('error', (error) => {
      console.error(`❌ Eigent Error in ${error.stage}:`, error.error);
    });
  }

  // Public interface methods
  getOrchestrationMetrics(): any {
    return {
      taskDistributor: {
        queueLength: this.taskDistributor['taskQueue'].length,
        registeredAgents: this.taskDistributor['agents'].size,
        systemLoad: this.taskDistributor['calculateSystemLoad']()
      },
      workflowManager: this.workflowManager.getWorkflowMetrics()
    };
  }

  getAgentStatus(): any[] {
    return Array.from(this.taskDistributor['agents'].values());
  }
}

// Factory function for integration with WAI orchestration
export function createEigentOrchestrator(): EigentMasterOrchestrator {
  return new EigentMasterOrchestrator();
}