/**
 * Agent Hierarchy Coordinator
 * Queen orchestrator → Tier leaders → Specialist agents flow with visual hierarchy support
 */

import { EventEmitter } from 'events';

export type AgentTier = 'queen' | 'executive' | 'manager' | 'specialist' | 'worker';
export type CoordinationMode = 'hierarchical' | 'flat' | 'dynamic' | 'hybrid';
export type CommunicationProtocol = 'a2a' | 'mcp' | 'ag-ui' | 'direct';

export interface HierarchyAgent {
  id: string;
  name: string;
  tier: AgentTier;
  parentId?: string;
  capabilities: string[];
  romaLevel: 'L1' | 'L2' | 'L3' | 'L4';
  status: 'idle' | 'busy' | 'waiting' | 'error' | 'offline';
  currentTask?: string;
  subordinates: string[];
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
  currentLoad: number;
  lastActive: Date;
}

export interface HierarchyNode {
  agent: HierarchyAgent;
  children: HierarchyNode[];
  depth: number;
  path: string[];
}

export interface TaskDelegation {
  id: string;
  task: string;
  fromAgent: string;
  toAgent: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'failed' | 'escalated';
  createdAt: Date;
  deadline?: Date;
  result?: unknown;
  feedback?: string;
}

export interface EscalationRule {
  id: string;
  condition: string;
  fromTier: AgentTier;
  toTier: AgentTier;
  action: 'escalate' | 'delegate' | 'parallelize' | 'abort';
  priority: number;
}

export interface CoordinationRequest {
  id: string;
  task: string;
  requirements: string[];
  complexity: number;
  deadline?: Date;
  preferredAgents?: string[];
  excludedAgents?: string[];
  coordinationMode?: CoordinationMode;
  communicationProtocol?: CommunicationProtocol;
}

export interface CoordinationResult {
  requestId: string;
  status: 'success' | 'partial' | 'failed';
  assignedAgents: string[];
  delegations: TaskDelegation[];
  timeline: { agent: string; action: string; timestamp: Date }[];
  metrics: {
    totalTime: number;
    agentsInvolved: number;
    escalations: number;
    successRate: number;
  };
}

const TIER_HIERARCHY: Record<AgentTier, number> = {
  'queen': 0,
  'executive': 1,
  'manager': 2,
  'specialist': 3,
  'worker': 4
};

const DEFAULT_AGENTS: HierarchyAgent[] = [
  {
    id: 'queen-orchestrator',
    name: 'Queen Orchestrator',
    tier: 'queen',
    capabilities: ['orchestration', 'strategy', 'resource-allocation', 'conflict-resolution'],
    romaLevel: 'L4',
    status: 'idle',
    subordinates: ['cto-agent', 'cfo-agent', 'cmo-agent', 'coo-agent'],
    metrics: { tasksCompleted: 0, successRate: 1, averageResponseTime: 100, currentLoad: 0, lastActive: new Date() }
  },
  {
    id: 'cto-agent',
    name: 'CTO Agent',
    tier: 'executive',
    parentId: 'queen-orchestrator',
    capabilities: ['technology-strategy', 'architecture', 'technical-leadership'],
    romaLevel: 'L4',
    status: 'idle',
    subordinates: ['dev-lead', 'infra-lead', 'security-lead'],
    metrics: { tasksCompleted: 0, successRate: 0.95, averageResponseTime: 150, currentLoad: 0, lastActive: new Date() }
  },
  {
    id: 'cfo-agent',
    name: 'CFO Agent',
    tier: 'executive',
    parentId: 'queen-orchestrator',
    capabilities: ['financial-strategy', 'budgeting', 'cost-optimization'],
    romaLevel: 'L4',
    status: 'idle',
    subordinates: ['finance-analyst', 'budget-manager'],
    metrics: { tasksCompleted: 0, successRate: 0.98, averageResponseTime: 120, currentLoad: 0, lastActive: new Date() }
  },
  {
    id: 'cmo-agent',
    name: 'CMO Agent',
    tier: 'executive',
    parentId: 'queen-orchestrator',
    capabilities: ['marketing-strategy', 'brand-management', 'growth'],
    romaLevel: 'L4',
    status: 'idle',
    subordinates: ['content-lead', 'social-lead', 'seo-lead'],
    metrics: { tasksCompleted: 0, successRate: 0.92, averageResponseTime: 140, currentLoad: 0, lastActive: new Date() }
  },
  {
    id: 'dev-lead',
    name: 'Development Lead',
    tier: 'manager',
    parentId: 'cto-agent',
    capabilities: ['code-review', 'technical-guidance', 'team-coordination'],
    romaLevel: 'L3',
    status: 'idle',
    subordinates: ['fullstack-dev', 'frontend-dev', 'backend-dev'],
    metrics: { tasksCompleted: 0, successRate: 0.9, averageResponseTime: 200, currentLoad: 0, lastActive: new Date() }
  },
  {
    id: 'fullstack-dev',
    name: 'Full-Stack Developer',
    tier: 'specialist',
    parentId: 'dev-lead',
    capabilities: ['frontend', 'backend', 'database', 'api'],
    romaLevel: 'L2',
    status: 'idle',
    subordinates: [],
    metrics: { tasksCompleted: 0, successRate: 0.88, averageResponseTime: 300, currentLoad: 0, lastActive: new Date() }
  },
  {
    id: 'frontend-dev',
    name: 'Frontend Developer',
    tier: 'specialist',
    parentId: 'dev-lead',
    capabilities: ['react', 'css', 'typescript', 'ui-components'],
    romaLevel: 'L2',
    status: 'idle',
    subordinates: [],
    metrics: { tasksCompleted: 0, successRate: 0.9, averageResponseTime: 250, currentLoad: 0, lastActive: new Date() }
  },
  {
    id: 'backend-dev',
    name: 'Backend Developer',
    tier: 'specialist',
    parentId: 'dev-lead',
    capabilities: ['node', 'python', 'api', 'database', 'microservices'],
    romaLevel: 'L2',
    status: 'idle',
    subordinates: [],
    metrics: { tasksCompleted: 0, successRate: 0.89, averageResponseTime: 280, currentLoad: 0, lastActive: new Date() }
  },
  {
    id: 'content-lead',
    name: 'Content Lead',
    tier: 'manager',
    parentId: 'cmo-agent',
    capabilities: ['content-strategy', 'editorial', 'brand-voice'],
    romaLevel: 'L3',
    status: 'idle',
    subordinates: ['content-writer', 'graphic-designer'],
    metrics: { tasksCompleted: 0, successRate: 0.91, averageResponseTime: 180, currentLoad: 0, lastActive: new Date() }
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    tier: 'specialist',
    parentId: 'content-lead',
    capabilities: ['copywriting', 'blogging', 'seo-content', 'storytelling'],
    romaLevel: 'L2',
    status: 'idle',
    subordinates: [],
    metrics: { tasksCompleted: 0, successRate: 0.87, averageResponseTime: 320, currentLoad: 0, lastActive: new Date() }
  }
];

const DEFAULT_ESCALATION_RULES: EscalationRule[] = [
  { id: 'worker-to-specialist', condition: 'complexity > 0.5', fromTier: 'worker', toTier: 'specialist', action: 'escalate', priority: 1 },
  { id: 'specialist-to-manager', condition: 'complexity > 0.7 || blockers > 2', fromTier: 'specialist', toTier: 'manager', action: 'escalate', priority: 2 },
  { id: 'manager-to-executive', condition: 'complexity > 0.85 || strategic', fromTier: 'manager', toTier: 'executive', action: 'escalate', priority: 3 },
  { id: 'executive-to-queen', condition: 'complexity > 0.95 || cross-functional', fromTier: 'executive', toTier: 'queen', action: 'escalate', priority: 4 },
  { id: 'parallel-workers', condition: 'parallelizable && workers.available > 2', fromTier: 'manager', toTier: 'worker', action: 'parallelize', priority: 1 }
];

export class AgentHierarchyCoordinator extends EventEmitter {
  private static instance: AgentHierarchyCoordinator;
  private agents: Map<string, HierarchyAgent> = new Map();
  private escalationRules: Map<string, EscalationRule> = new Map();
  private activeDelegations: Map<string, TaskDelegation> = new Map();
  private coordinationHistory: CoordinationResult[] = [];

  private constructor() {
    super();
    this.initializeAgents();
    this.initializeEscalationRules();
    console.log('👑 AgentHierarchyCoordinator initialized with', this.agents.size, 'agents');
  }

  public static getInstance(): AgentHierarchyCoordinator {
    if (!AgentHierarchyCoordinator.instance) {
      AgentHierarchyCoordinator.instance = new AgentHierarchyCoordinator();
    }
    return AgentHierarchyCoordinator.instance;
  }

  private initializeAgents(): void {
    for (const agent of DEFAULT_AGENTS) {
      this.agents.set(agent.id, { ...agent });
    }
  }

  private initializeEscalationRules(): void {
    for (const rule of DEFAULT_ESCALATION_RULES) {
      this.escalationRules.set(rule.id, rule);
    }
  }

  public async coordinate(request: CoordinationRequest): Promise<CoordinationResult> {
    const startTime = Date.now();
    const timeline: { agent: string; action: string; timestamp: Date }[] = [];
    const delegations: TaskDelegation[] = [];

    this.emit('coordination-started', { requestId: request.id, task: request.task });

    const queen = this.agents.get('queen-orchestrator')!;
    timeline.push({ agent: queen.id, action: 'received-request', timestamp: new Date() });

    const bestAgents = await this.selectAgentsForTask(request);
    timeline.push({ agent: queen.id, action: 'agents-selected', timestamp: new Date() });

    for (const agentId of bestAgents) {
      const agent = this.agents.get(agentId);
      if (agent) {
        const delegation = await this.delegateTask(queen.id, agentId, request);
        delegations.push(delegation);
        timeline.push({ agent: agentId, action: 'task-delegated', timestamp: new Date() });
      }
    }

    const result: CoordinationResult = {
      requestId: request.id,
      status: 'success',
      assignedAgents: bestAgents,
      delegations,
      timeline,
      metrics: {
        totalTime: Date.now() - startTime,
        agentsInvolved: bestAgents.length,
        escalations: 0,
        successRate: 1
      }
    };

    this.coordinationHistory.push(result);
    this.emit('coordination-completed', result);

    return result;
  }

  private async selectAgentsForTask(request: CoordinationRequest): Promise<string[]> {
    const candidates: { agentId: string; score: number }[] = [];

    for (const [agentId, agent] of Array.from(this.agents.entries())) {
      if (request.excludedAgents?.includes(agentId)) continue;
      if (agent.status !== 'idle' && agent.metrics.currentLoad > 0.8) continue;

      let score = 0;

      const capabilityMatch = request.requirements.filter(req =>
        agent.capabilities.some(cap => cap.toLowerCase().includes(req.toLowerCase()))
      ).length;
      score += capabilityMatch * 0.3;

      if (request.preferredAgents?.includes(agentId)) {
        score += 0.3;
      }

      score += agent.metrics.successRate * 0.2;

      score += (1 - agent.metrics.currentLoad) * 0.1;

      const tierScore = (4 - TIER_HIERARCHY[agent.tier]) / 4;
      if (request.complexity > 0.7) {
        score += tierScore * 0.1;
      }

      if (score > 0) {
        candidates.push({ agentId, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    const numAgents = Math.max(1, Math.min(5, Math.ceil(request.complexity * 3)));
    return candidates.slice(0, numAgents).map(c => c.agentId);
  }

  private async delegateTask(fromAgent: string, toAgent: string, request: CoordinationRequest): Promise<TaskDelegation> {
    const delegation: TaskDelegation = {
      id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      task: request.task,
      fromAgent,
      toAgent,
      priority: request.complexity > 0.8 ? 'critical' : request.complexity > 0.5 ? 'high' : 'medium',
      status: 'accepted',
      createdAt: new Date(),
      deadline: request.deadline
    };

    this.activeDelegations.set(delegation.id, delegation);
    
    const agent = this.agents.get(toAgent);
    if (agent) {
      agent.status = 'busy';
      agent.currentTask = request.task;
      agent.metrics.currentLoad = Math.min(1, agent.metrics.currentLoad + 0.2);
    }

    this.emit('task-delegated', delegation);

    return delegation;
  }

  public async escalate(delegationId: string, reason: string): Promise<TaskDelegation | undefined> {
    const delegation = this.activeDelegations.get(delegationId);
    if (!delegation) return undefined;

    const currentAgent = this.agents.get(delegation.toAgent);
    if (!currentAgent || !currentAgent.parentId) return undefined;

    const parentAgent = this.agents.get(currentAgent.parentId);
    if (!parentAgent) return undefined;

    const newDelegation: TaskDelegation = {
      ...delegation,
      id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromAgent: delegation.toAgent,
      toAgent: parentAgent.id,
      status: 'pending',
      createdAt: new Date(),
      feedback: `Escalated from ${currentAgent.name}: ${reason}`
    };

    delegation.status = 'escalated';
    this.activeDelegations.set(newDelegation.id, newDelegation);

    currentAgent.status = 'idle';
    currentAgent.metrics.currentLoad = Math.max(0, currentAgent.metrics.currentLoad - 0.2);

    this.emit('task-escalated', { original: delegation, escalated: newDelegation });

    return newDelegation;
  }

  public completeTask(delegationId: string, result: unknown): void {
    const delegation = this.activeDelegations.get(delegationId);
    if (!delegation) return;

    delegation.status = 'completed';
    delegation.result = result;

    const agent = this.agents.get(delegation.toAgent);
    if (agent) {
      agent.status = 'idle';
      agent.currentTask = undefined;
      agent.metrics.tasksCompleted++;
      agent.metrics.currentLoad = Math.max(0, agent.metrics.currentLoad - 0.2);
      agent.metrics.lastActive = new Date();
    }

    this.emit('task-completed', delegation);
  }

  public failTask(delegationId: string, reason: string): void {
    const delegation = this.activeDelegations.get(delegationId);
    if (!delegation) return;

    delegation.status = 'failed';
    delegation.feedback = reason;

    const agent = this.agents.get(delegation.toAgent);
    if (agent) {
      agent.status = 'idle';
      agent.currentTask = undefined;
      agent.metrics.successRate = (agent.metrics.successRate * agent.metrics.tasksCompleted) / (agent.metrics.tasksCompleted + 1);
      agent.metrics.currentLoad = Math.max(0, agent.metrics.currentLoad - 0.2);
    }

    this.emit('task-failed', delegation);
  }

  public getHierarchyTree(): HierarchyNode {
    const queen = this.agents.get('queen-orchestrator')!;
    return this.buildHierarchyNode(queen, 0, ['queen-orchestrator']);
  }

  private buildHierarchyNode(agent: HierarchyAgent, depth: number, path: string[]): HierarchyNode {
    const children: HierarchyNode[] = [];

    for (const subordinateId of agent.subordinates) {
      const subordinate = this.agents.get(subordinateId);
      if (subordinate) {
        children.push(this.buildHierarchyNode(subordinate, depth + 1, [...path, subordinateId]));
      }
    }

    return { agent, children, depth, path };
  }

  public getAgent(agentId: string): HierarchyAgent | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): HierarchyAgent[] {
    return Array.from(this.agents.values());
  }

  public getAgentsByTier(tier: AgentTier): HierarchyAgent[] {
    return Array.from(this.agents.values()).filter(a => a.tier === tier);
  }

  public getSubordinates(agentId: string): HierarchyAgent[] {
    const agent = this.agents.get(agentId);
    if (!agent) return [];
    return agent.subordinates.map(id => this.agents.get(id)).filter((a): a is HierarchyAgent => !!a);
  }

  public getSuperior(agentId: string): HierarchyAgent | undefined {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.parentId) return undefined;
    return this.agents.get(agent.parentId);
  }

  public getActiveDelegations(): TaskDelegation[] {
    return Array.from(this.activeDelegations.values()).filter(d => 
      d.status === 'pending' || d.status === 'accepted' || d.status === 'in_progress'
    );
  }

  public getCoordinationHistory(): CoordinationResult[] {
    return [...this.coordinationHistory];
  }

  public registerAgent(agent: HierarchyAgent): void {
    this.agents.set(agent.id, agent);
    
    if (agent.parentId) {
      const parent = this.agents.get(agent.parentId);
      if (parent && !parent.subordinates.includes(agent.id)) {
        parent.subordinates.push(agent.id);
      }
    }

    this.emit('agent-registered', agent);
  }

  public updateAgentStatus(agentId: string, status: HierarchyAgent['status']): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      this.emit('agent-status-changed', { agentId, status });
    }
  }

  public getVisualizationData(): { nodes: unknown[]; edges: unknown[] } {
    const nodes: unknown[] = [];
    const edges: unknown[] = [];

    for (const [id, agent] of Array.from(this.agents.entries())) {
      nodes.push({
        id,
        label: agent.name,
        tier: agent.tier,
        status: agent.status,
        romaLevel: agent.romaLevel,
        load: agent.metrics.currentLoad
      });

      if (agent.parentId) {
        edges.push({
          source: agent.parentId,
          target: id,
          type: 'hierarchy'
        });
      }
    }

    return { nodes, edges };
  }
}

export const agentHierarchyCoordinator = AgentHierarchyCoordinator.getInstance();
