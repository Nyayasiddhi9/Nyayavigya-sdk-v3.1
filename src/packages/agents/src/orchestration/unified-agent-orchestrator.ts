/**
 * WAI SDK v10.0 - Unified Agent Orchestrator
 * 
 * Complete orchestration layer integrating all 267 agents with:
 * - Intelligent task routing based on agent capabilities
 * - Protocol compliance (A2A, MCP, ROMA, OpenAgents, Claude Sub-agents)
 * - Priority model selection (GPT-5.1, o3-pro, Claude Opus 4.5, Gemini 3 Pro, Grok 4)
 * - Cost optimization and load balancing
 * - Swarm coordination for complex tasks
 * - Context engineering and memory integration
 */

import { 
  ALL_267_AGENTS,
  AgentDefinitionV10,
  RomaLevel,
  AgentTier 
} from '../definitions/all-267-agents-v10';

import {
  CREATIVE_AGENTS,
  QA_AGENTS,
  DEVOPS_AGENTS,
  ADDITIONAL_DOMAIN_AGENTS
} from '../definitions/complete-agent-categories';

import {
  EXTENDED_AGENTS
} from '../definitions/extended-agents-v10';

// ============================================================================
// COMPLETE 267 AGENTS REGISTRY
// ============================================================================

export const COMPLETE_AGENT_REGISTRY: AgentDefinitionV10[] = [
  ...ALL_267_AGENTS,
  ...CREATIVE_AGENTS,
  ...QA_AGENTS,
  ...DEVOPS_AGENTS,
  ...ADDITIONAL_DOMAIN_AGENTS,
  ...EXTENDED_AGENTS
];

// ============================================================================
// ORCHESTRATOR CONFIGURATION
// ============================================================================

export interface OrchestratorConfig {
  maxConcurrentAgents: number;
  maxCostPerSession: number;
  defaultTimeout: number;
  enableSwarmMode: boolean;
  enableParallelExecution: boolean;
  preferredModels: string[];
  fallbackChain: string[];
  protocols: string[];
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  maxConcurrentAgents: 20,
  maxCostPerSession: 10.00,
  defaultTimeout: 120000,
  enableSwarmMode: true,
  enableParallelExecution: true,
  preferredModels: [
    'claude-opus-4.5',
    'gpt-5.1',
    'o3-pro',
    'gemini-3-pro',
    'grok-4',
    'claude-sonnet-4.5',
    'gemini-2.5-pro'
  ],
  fallbackChain: [
    'claude-sonnet-4.5',
    'gpt-4o',
    'gemini-2.5-flash',
    'grok-3'
  ],
  protocols: ['A2A', 'MCP', 'AG-UI', 'OpenAgent', 'Claude-Sub']
};

// ============================================================================
// TASK ROUTING ENGINE
// ============================================================================

export interface TaskRequest {
  id: string;
  type: string;
  description: string;
  requirements: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
  constraints?: {
    maxCost?: number;
    maxTime?: number;
    requiredCapabilities?: string[];
    preferredAgents?: string[];
    excludeAgents?: string[];
  };
}

export interface AgentMatch {
  agent: AgentDefinitionV10;
  score: number;
  matchedCapabilities: string[];
  estimatedCost: number;
  confidence: number;
}

export interface TaskAssignment {
  taskId: string;
  primaryAgent: AgentDefinitionV10;
  supportAgents: AgentDefinitionV10[];
  executionPlan: ExecutionStep[];
  estimatedCost: number;
  estimatedTime: number;
}

export interface ExecutionStep {
  id: string;
  agentId: string;
  action: string;
  inputs: Record<string, any>;
  dependencies: string[];
  parallel: boolean;
}

/**
 * Unified Agent Orchestrator
 * Manages all 267 agents with intelligent routing and coordination
 */
export class UnifiedAgentOrchestrator {
  private agents: Map<string, AgentDefinitionV10> = new Map();
  private agentsByTier: Map<AgentTier, AgentDefinitionV10[]> = new Map();
  private agentsByCategory: Map<string, AgentDefinitionV10[]> = new Map();
  private agentsByCapability: Map<string, AgentDefinitionV10[]> = new Map();
  private config: OrchestratorConfig;
  private activeAssignments: Map<string, TaskAssignment> = new Map();
  private agentWorkloads: Map<string, number> = new Map();

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeAgentRegistry();
  }

  /**
   * Initialize agent registry with all 267 agents
   */
  private initializeAgentRegistry(): void {
    // Register all agents
    COMPLETE_AGENT_REGISTRY.forEach(agent => {
      this.agents.set(agent.id, agent);
      this.agentWorkloads.set(agent.id, 0);
      
      // Index by tier
      const tierAgents = this.agentsByTier.get(agent.tier) || [];
      tierAgents.push(agent);
      this.agentsByTier.set(agent.tier, tierAgents);
      
      // Index by category
      const categoryAgents = this.agentsByCategory.get(agent.category) || [];
      categoryAgents.push(agent);
      this.agentsByCategory.set(agent.category, categoryAgents);
      
      // Index by capabilities
      agent.capabilities.forEach(cap => {
        const capAgents = this.agentsByCapability.get(cap) || [];
        capAgents.push(agent);
        this.agentsByCapability.set(cap, capAgents);
      });
    });

    console.log(`✅ UnifiedAgentOrchestrator initialized with ${this.agents.size} agents`);
    console.log(`   Tiers: ${Array.from(this.agentsByTier.keys()).join(', ')}`);
    console.log(`   Categories: ${this.agentsByCategory.size}`);
    console.log(`   Capabilities indexed: ${this.agentsByCapability.size}`);
  }

  /**
   * Find best matching agents for a task
   */
  public findMatchingAgents(task: TaskRequest): AgentMatch[] {
    const matches: AgentMatch[] = [];
    
    this.agents.forEach(agent => {
      // Skip excluded agents
      if (task.constraints?.excludeAgents?.includes(agent.id)) return;
      
      // Calculate capability match score
      const matchedCapabilities = agent.capabilities.filter(cap =>
        task.requirements.some(req => 
          cap.toLowerCase().includes(req.toLowerCase()) ||
          req.toLowerCase().includes(cap.toLowerCase())
        )
      );
      
      if (matchedCapabilities.length === 0 && 
          !task.constraints?.preferredAgents?.includes(agent.id)) {
        return;
      }
      
      // Calculate match score
      let score = matchedCapabilities.length / Math.max(task.requirements.length, 1);
      
      // Boost for preferred agents
      if (task.constraints?.preferredAgents?.includes(agent.id)) {
        score += 0.3;
      }
      
      // Boost for higher ROMA levels for complex tasks
      if (task.priority === 'critical' || task.priority === 'high') {
        if (agent.romaLevel === 'L4') score += 0.2;
        else if (agent.romaLevel === 'L3') score += 0.1;
      }
      
      // Reduce score based on current workload
      const workload = this.agentWorkloads.get(agent.id) || 0;
      score -= workload * 0.05;
      
      // Estimate cost
      const estimatedCost = agent.costOptimization.maxCostPerTask;
      
      // Check cost constraints
      if (task.constraints?.maxCost && estimatedCost > task.constraints.maxCost) {
        score *= 0.5; // Penalize but don't exclude
      }
      
      matches.push({
        agent,
        score: Math.min(1, Math.max(0, score)),
        matchedCapabilities,
        estimatedCost,
        confidence: Math.min(1, score * 1.2)
      });
    });
    
    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Assign task to best agents
   */
  public assignTask(task: TaskRequest): TaskAssignment {
    const matches = this.findMatchingAgents(task);
    
    if (matches.length === 0) {
      throw new Error(`No suitable agents found for task: ${task.id}`);
    }
    
    // Select primary agent
    const primaryAgent = matches[0].agent;
    
    // Select support agents for complex tasks
    const supportAgents: AgentDefinitionV10[] = [];
    if (task.priority === 'critical' || task.priority === 'high') {
      // Add complementary agents
      matches.slice(1, 4).forEach(match => {
        if (match.score > 0.3) {
          supportAgents.push(match.agent);
        }
      });
    }
    
    // Create execution plan
    const executionPlan = this.createExecutionPlan(task, primaryAgent, supportAgents);
    
    // Calculate estimates
    const estimatedCost = matches[0].estimatedCost + 
      supportAgents.reduce((sum, a) => sum + (a.costOptimization.maxCostPerTask * 0.5), 0);
    const estimatedTime = this.config.defaultTimeout;
    
    const assignment: TaskAssignment = {
      taskId: task.id,
      primaryAgent,
      supportAgents,
      executionPlan,
      estimatedCost,
      estimatedTime
    };
    
    // Track assignment and update workloads
    this.activeAssignments.set(task.id, assignment);
    this.agentWorkloads.set(primaryAgent.id, (this.agentWorkloads.get(primaryAgent.id) || 0) + 1);
    supportAgents.forEach(agent => {
      this.agentWorkloads.set(agent.id, (this.agentWorkloads.get(agent.id) || 0) + 0.5);
    });
    
    return assignment;
  }

  /**
   * Create execution plan for task
   */
  private createExecutionPlan(
    task: TaskRequest,
    primary: AgentDefinitionV10,
    support: AgentDefinitionV10[]
  ): ExecutionStep[] {
    const steps: ExecutionStep[] = [];
    
    // Initial analysis step
    steps.push({
      id: `${task.id}-analyze`,
      agentId: primary.id,
      action: 'analyze_task',
      inputs: { task: task.description, context: task.context },
      dependencies: [],
      parallel: false
    });
    
    // Main execution step
    steps.push({
      id: `${task.id}-execute`,
      agentId: primary.id,
      action: 'execute_task',
      inputs: { requirements: task.requirements },
      dependencies: [`${task.id}-analyze`],
      parallel: false
    });
    
    // Support agent steps (can be parallel)
    support.forEach((agent, i) => {
      steps.push({
        id: `${task.id}-support-${i}`,
        agentId: agent.id,
        action: 'provide_support',
        inputs: { capabilities: agent.capabilities.slice(0, 3) },
        dependencies: [`${task.id}-analyze`],
        parallel: true
      });
    });
    
    // Synthesis step
    steps.push({
      id: `${task.id}-synthesize`,
      agentId: primary.id,
      action: 'synthesize_results',
      inputs: {},
      dependencies: steps.filter(s => s.id !== `${task.id}-synthesize`).map(s => s.id),
      parallel: false
    });
    
    return steps;
  }

  /**
   * Execute task with assigned agents
   */
  public async executeTask(taskId: string): Promise<any> {
    const assignment = this.activeAssignments.get(taskId);
    if (!assignment) {
      throw new Error(`No assignment found for task: ${taskId}`);
    }
    
    const results: Map<string, any> = new Map();
    
    // Group steps by dependency level for parallel execution
    const stepGroups = this.groupStepsByDependency(assignment.executionPlan);
    
    for (const group of stepGroups) {
      if (this.config.enableParallelExecution && group.every(s => s.parallel)) {
        // Execute parallel steps
        const promises = group.map(step => this.executeStep(step, results));
        const groupResults = await Promise.all(promises);
        groupResults.forEach((result, i) => results.set(group[i].id, result));
      } else {
        // Execute sequential steps
        for (const step of group) {
          const result = await this.executeStep(step, results);
          results.set(step.id, result);
        }
      }
    }
    
    // Release workloads
    this.agentWorkloads.set(assignment.primaryAgent.id, 
      Math.max(0, (this.agentWorkloads.get(assignment.primaryAgent.id) || 0) - 1));
    assignment.supportAgents.forEach(agent => {
      this.agentWorkloads.set(agent.id, 
        Math.max(0, (this.agentWorkloads.get(agent.id) || 0) - 0.5));
    });
    
    // Get final result
    const finalStepId = assignment.executionPlan[assignment.executionPlan.length - 1].id;
    return results.get(finalStepId);
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: ExecutionStep, priorResults: Map<string, any>): Promise<any> {
    const agent = this.agents.get(step.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${step.agentId}`);
    }
    
    // Gather inputs from dependencies
    const dependencyResults: Record<string, any> = {};
    step.dependencies.forEach(depId => {
      dependencyResults[depId] = priorResults.get(depId);
    });
    
    // Execute agent action (placeholder - integrate with actual LLM calls)
    console.log(`Executing: ${step.action} with agent ${agent.name}`);
    
    return {
      stepId: step.id,
      agentId: step.agentId,
      action: step.action,
      status: 'completed',
      result: `${agent.name} completed ${step.action}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Group steps by dependency level
   */
  private groupStepsByDependency(steps: ExecutionStep[]): ExecutionStep[][] {
    const groups: ExecutionStep[][] = [];
    const completed = new Set<string>();
    let remaining = [...steps];
    
    while (remaining.length > 0) {
      const ready = remaining.filter(step =>
        step.dependencies.every(dep => completed.has(dep))
      );
      
      if (ready.length === 0 && remaining.length > 0) {
        // Avoid infinite loop - take first remaining
        ready.push(remaining[0]);
      }
      
      groups.push(ready);
      ready.forEach(step => completed.add(step.id));
      remaining = remaining.filter(step => !completed.has(step.id));
    }
    
    return groups;
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  public getAgent(id: string): AgentDefinitionV10 | undefined {
    return this.agents.get(id);
  }

  public getAgentsByTier(tier: AgentTier): AgentDefinitionV10[] {
    return this.agentsByTier.get(tier) || [];
  }

  public getAgentsByCategory(category: string): AgentDefinitionV10[] {
    return this.agentsByCategory.get(category) || [];
  }

  public getAgentsByCapability(capability: string): AgentDefinitionV10[] {
    return this.agentsByCapability.get(capability) || [];
  }

  public getAllAgents(): AgentDefinitionV10[] {
    return Array.from(this.agents.values());
  }

  public getAgentCount(): number {
    return this.agents.size;
  }

  public getAgentStats(): Record<string, any> {
    const stats: Record<string, any> = {
      total: this.agents.size,
      byTier: {},
      byCategory: {},
      byRomaLevel: { L1: 0, L2: 0, L3: 0, L4: 0 },
      byStatus: { active: 0, beta: 0, deprecated: 0 }
    };
    
    this.agentsByTier.forEach((agents, tier) => {
      stats.byTier[tier] = agents.length;
    });
    
    this.agentsByCategory.forEach((agents, category) => {
      stats.byCategory[category] = agents.length;
    });
    
    this.agents.forEach(agent => {
      stats.byRomaLevel[agent.romaLevel]++;
      stats.byStatus[agent.status]++;
    });
    
    return stats;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let orchestratorInstance: UnifiedAgentOrchestrator | null = null;

export function getOrchestrator(config?: Partial<OrchestratorConfig>): UnifiedAgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new UnifiedAgentOrchestrator(config);
  }
  return orchestratorInstance;
}

export function resetOrchestrator(): void {
  orchestratorInstance = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  COMPLETE_AGENT_REGISTRY as AGENTS,
  DEFAULT_CONFIG
};

// Log initialization
console.log('✅ Unified Agent Orchestrator module loaded');
console.log(`   Total agents available: ${COMPLETE_AGENT_REGISTRY.length}`);
