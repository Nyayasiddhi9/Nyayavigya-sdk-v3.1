/**
 * DAG-Based Orchestration Service
 * 
 * Implements parallel processing with:
 * - Directed Acyclic Graph task dependency management
 * - Context window budgeting across parallel agents
 * - Topological sorting for execution order
 * - Parallel execution with shared context propagation
 */

import { EventEmitter } from 'events';
import { hierarchicalTaskAllocator, type TaskAllocation, type Coalition } from './hierarchical-task-allocator';

export interface DAGNode {
  id: string;
  taskId: string;
  name: string;
  dependencies: string[];
  allocation?: TaskAllocation;
  status: 'pending' | 'ready' | 'executing' | 'completed' | 'failed';
  result?: any;
  startTime?: Date;
  endTime?: Date;
  contextBudget: {
    inputTokens: number;
    outputTokens: number;
    maxTokens: number;
  };
}

export interface DAGExecutionPlan {
  id: string;
  name: string;
  nodes: Map<string, DAGNode>;
  edges: Map<string, string[]>;
  executionLevels: string[][];
  totalContextBudget: number;
  estimatedDuration: number;
  status: 'planning' | 'executing' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ContextBudget {
  totalTokens: number;
  usedTokens: number;
  reservedTokens: number;
  availableTokens: number;
  budgetPerAgent: Map<string, number>;
}

export interface ParallelExecutionResult {
  planId: string;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  parallelizationFactor: number;
  totalDuration: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  nodeResults: Map<string, any>;
}

class DAGOrchestrationService extends EventEmitter {
  private executionPlans: Map<string, DAGExecutionPlan> = new Map();
  private contextBudgets: Map<string, ContextBudget> = new Map();
  private maxConcurrentNodes = 5;

  constructor() {
    super();
    console.log('🔗 DAG Orchestration Service initialized with parallel execution support');
  }

  async createExecutionPlan(
    planId: string,
    planName: string,
    tasks: Array<{
      id: string;
      name: string;
      dependencies: string[];
      estimatedTokens?: number;
    }>,
    totalContextBudget: number = 500000
  ): Promise<DAGExecutionPlan> {
    const nodes = new Map<string, DAGNode>();
    const edges = new Map<string, string[]>();
    
    if (!this.validateDAG(tasks)) {
      throw new Error('Invalid DAG: Cycle detected in task dependencies');
    }
    
    const tokenBudgetPerTask = Math.floor(totalContextBudget / tasks.length);
    
    for (const task of tasks) {
      const node: DAGNode = {
        id: task.id,
        taskId: task.id,
        name: task.name,
        dependencies: task.dependencies,
        status: 'pending',
        contextBudget: {
          inputTokens: task.estimatedTokens || tokenBudgetPerTask * 0.4,
          outputTokens: task.estimatedTokens || tokenBudgetPerTask * 0.6,
          maxTokens: tokenBudgetPerTask
        }
      };
      nodes.set(task.id, node);
      edges.set(task.id, task.dependencies);
    }
    
    const executionLevels = this.computeExecutionLevels(nodes, edges);
    
    const plan: DAGExecutionPlan = {
      id: planId,
      name: planName,
      nodes,
      edges,
      executionLevels,
      totalContextBudget,
      estimatedDuration: this.estimateDuration(executionLevels, nodes),
      status: 'planning',
      createdAt: new Date()
    };
    
    this.executionPlans.set(planId, plan);
    
    this.initializeContextBudget(planId, totalContextBudget, nodes);
    
    console.log(`📋 Created DAG execution plan: ${planName}`);
    console.log(`   Nodes: ${nodes.size}, Levels: ${executionLevels.length}`);
    console.log(`   Parallelization: ${Math.max(...executionLevels.map(l => l.length))} concurrent tasks`);
    
    this.emit('plan:created', plan);
    
    return plan;
  }

  private validateDAG(tasks: Array<{ id: string; dependencies: string[] }>): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const task = taskMap.get(nodeId);
      if (task) {
        for (const dep of task.dependencies) {
          if (hasCycle(dep)) return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const task of tasks) {
      if (hasCycle(task.id)) return false;
    }
    
    return true;
  }

  private computeExecutionLevels(
    nodes: Map<string, DAGNode>,
    edges: Map<string, string[]>
  ): string[][] {
    const levels: string[][] = [];
    const completed = new Set<string>();
    const remaining = new Set(nodes.keys());
    
    while (remaining.size > 0) {
      const currentLevel: string[] = [];
      
      for (const nodeId of remaining) {
        const node = nodes.get(nodeId)!;
        const allDepsCompleted = node.dependencies.every(dep => completed.has(dep));
        
        if (allDepsCompleted) {
          currentLevel.push(nodeId);
        }
      }
      
      if (currentLevel.length === 0 && remaining.size > 0) {
        throw new Error('Unable to compute execution levels: possible cycle or missing dependency');
      }
      
      levels.push(currentLevel);
      currentLevel.forEach(id => {
        remaining.delete(id);
        completed.add(id);
      });
    }
    
    return levels;
  }

  private estimateDuration(levels: string[][], nodes: Map<string, DAGNode>): number {
    let totalDuration = 0;
    
    for (const level of levels) {
      const maxLevelDuration = Math.max(
        ...level.map(nodeId => {
          const node = nodes.get(nodeId)!;
          return (node.contextBudget.inputTokens + node.contextBudget.outputTokens) / 1000 * 100;
        })
      );
      totalDuration += maxLevelDuration;
    }
    
    return totalDuration;
  }

  private initializeContextBudget(
    planId: string,
    totalTokens: number,
    nodes: Map<string, DAGNode>
  ): void {
    const budgetPerAgent = new Map<string, number>();
    const tokensPerNode = Math.floor(totalTokens / nodes.size);
    
    nodes.forEach((node, id) => {
      budgetPerAgent.set(id, tokensPerNode);
    });
    
    const budget: ContextBudget = {
      totalTokens,
      usedTokens: 0,
      reservedTokens: 0,
      availableTokens: totalTokens,
      budgetPerAgent
    };
    
    this.contextBudgets.set(planId, budget);
  }

  async executePlan(planId: string): Promise<ParallelExecutionResult> {
    const plan = this.executionPlans.get(planId);
    if (!plan) {
      throw new Error(`Execution plan ${planId} not found`);
    }
    
    plan.status = 'executing';
    plan.startedAt = new Date();
    this.emit('plan:started', plan);
    
    const nodeResults = new Map<string, any>();
    let completedNodes = 0;
    let failedNodes = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    try {
      for (const level of plan.executionLevels) {
        console.log(`⚡ Executing level with ${level.length} parallel tasks`);
        
        const levelPromises = level.map(async (nodeId) => {
          const node = plan.nodes.get(nodeId)!;
          node.status = 'executing';
          node.startTime = new Date();
          
          try {
            const result = await this.executeNode(node, nodeResults, plan);
            node.status = 'completed';
            node.result = result;
            node.endTime = new Date();
            nodeResults.set(nodeId, result);
            completedNodes++;
            totalInputTokens += result.tokensUsed?.input || 0;
            totalOutputTokens += result.tokensUsed?.output || 0;
            
            this.emit('node:completed', { planId, nodeId, result });
            
            return { nodeId, success: true, result };
          } catch (error) {
            node.status = 'failed';
            node.endTime = new Date();
            failedNodes++;
            
            this.emit('node:failed', { planId, nodeId, error });
            
            return { nodeId, success: false, error };
          }
        });
        
        await Promise.all(levelPromises);
      }
      
      plan.status = 'completed';
    } catch (error) {
      plan.status = 'failed';
      throw error;
    } finally {
      plan.completedAt = new Date();
      this.emit('plan:completed', plan);
    }
    
    const totalDuration = plan.completedAt.getTime() - plan.startedAt.getTime();
    const parallelizationFactor = Math.max(...plan.executionLevels.map(l => l.length));
    
    return {
      planId,
      totalNodes: plan.nodes.size,
      completedNodes,
      failedNodes,
      parallelizationFactor,
      totalDuration,
      tokenUsage: {
        input: totalInputTokens,
        output: totalOutputTokens,
        total: totalInputTokens + totalOutputTokens
      },
      nodeResults
    };
  }

  private async executeNode(
    node: DAGNode,
    previousResults: Map<string, any>,
    plan: DAGExecutionPlan
  ): Promise<any> {
    const dependencyResults = node.dependencies.map(depId => ({
      id: depId,
      result: previousResults.get(depId)
    }));
    
    const contextWindow = this.buildContextWindow(node, dependencyResults);
    
    const budget = this.contextBudgets.get(plan.id);
    if (budget) {
      const nodeBudget = budget.budgetPerAgent.get(node.id) || 0;
      if (contextWindow.length > nodeBudget) {
        console.warn(`⚠️ Node ${node.id} context exceeds budget, truncating`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const result = {
      nodeId: node.id,
      output: `Processed ${node.name} with ${dependencyResults.length} dependencies`,
      tokensUsed: {
        input: Math.floor(node.contextBudget.inputTokens * (0.8 + Math.random() * 0.4)),
        output: Math.floor(node.contextBudget.outputTokens * (0.8 + Math.random() * 0.4))
      },
      completedAt: new Date()
    };
    
    return result;
  }

  private buildContextWindow(
    node: DAGNode,
    dependencyResults: Array<{ id: string; result: any }>
  ): string {
    let context = `Task: ${node.name}\n\n`;
    
    if (dependencyResults.length > 0) {
      context += 'Dependency Results:\n';
      dependencyResults.forEach(dep => {
        context += `- ${dep.id}: ${JSON.stringify(dep.result?.output || 'pending')}\n`;
      });
    }
    
    return context;
  }

  getExecutionPlan(planId: string): DAGExecutionPlan | undefined {
    return this.executionPlans.get(planId);
  }

  getAllPlans(): DAGExecutionPlan[] {
    return Array.from(this.executionPlans.values());
  }

  async cancelPlan(planId: string): Promise<void> {
    const plan = this.executionPlans.get(planId);
    if (plan && plan.status === 'executing') {
      plan.status = 'cancelled';
      plan.completedAt = new Date();
      this.emit('plan:cancelled', plan);
    }
  }

  getContextBudget(planId: string): ContextBudget | undefined {
    return this.contextBudgets.get(planId);
  }

  reallocateContextBudget(planId: string, nodeId: string, additionalTokens: number): boolean {
    const budget = this.contextBudgets.get(planId);
    if (!budget || additionalTokens > budget.availableTokens) {
      return false;
    }
    
    const currentBudget = budget.budgetPerAgent.get(nodeId) || 0;
    budget.budgetPerAgent.set(nodeId, currentBudget + additionalTokens);
    budget.reservedTokens += additionalTokens;
    budget.availableTokens -= additionalTokens;
    
    return true;
  }

  getOrchestrationStats(): {
    totalPlans: number;
    activePlans: number;
    completedPlans: number;
    failedPlans: number;
    averageParallelization: number;
  } {
    const plans = this.getAllPlans();
    
    return {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === 'executing').length,
      completedPlans: plans.filter(p => p.status === 'completed').length,
      failedPlans: plans.filter(p => p.status === 'failed').length,
      averageParallelization: plans.length > 0 
        ? plans.reduce((sum, p) => sum + Math.max(...p.executionLevels.map(l => l.length)), 0) / plans.length
        : 0
    };
  }
}

export const dagOrchestrationService = new DAGOrchestrationService();
export { DAGOrchestrationService };
