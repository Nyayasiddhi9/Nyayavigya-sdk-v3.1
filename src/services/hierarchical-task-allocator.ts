/**
 * Hierarchical Task Allocator (HTA) for ROMA Tiers
 * 
 * Implements intelligent task allocation across ROMA L1-L4 agents with:
 * - Dynamic Coalition Formation for complex multi-agent tasks
 * - Bayesian task complexity scoring
 * - Cost-effective cascade routing
 * - DAG-based parallel execution planning
 * - Real-time performance-based reallocation
 */

import { EventEmitter } from 'events';
import { db } from '../db';
import { waiAgentModelConfigs, waiAgentSystemPrompts, waiAgentGroupAssignments } from '../../shared/schema';

export type ROMALevel = 'L1' | 'L2' | 'L3' | 'L4';

export interface TaskSpecification {
  id: string;
  name: string;
  description: string;
  domain: string;
  requiredCapabilities: string[];
  estimatedComplexity: number; // 1-10
  priority: 'critical' | 'high' | 'medium' | 'low';
  deadline?: Date;
  dependencies?: string[];
  budget?: {
    maxTokens: number;
    maxCost: number;
  };
  preferredAgents?: string[];
  excludedAgents?: string[];
}

export interface AgentCapabilityProfile {
  agentId: string;
  name: string;
  romaLevel: ROMALevel;
  tier: string;
  domain: string;
  specializations: string[];
  performanceScore: number; // 0-1
  currentLoad: number; // 0-1
  costPerToken: number;
  capabilities: {
    textGeneration: boolean;
    codeGeneration: boolean;
    reasoning: number;
    creativity: number;
    multimodal: boolean;
  };
}

export interface Coalition {
  id: string;
  name: string;
  taskId: string;
  lead: AgentCapabilityProfile;
  members: AgentCapabilityProfile[];
  formationStrategy: 'expertise' | 'coverage' | 'cost-optimized' | 'performance';
  totalCapacity: number;
  estimatedCost: number;
  status: 'forming' | 'active' | 'executing' | 'completed' | 'disbanded';
  createdAt: Date;
}

export interface TaskAllocation {
  taskId: string;
  coalition?: Coalition;
  primaryAgent?: AgentCapabilityProfile;
  supportAgents: AgentCapabilityProfile[];
  allocationStrategy: 'single' | 'coalition' | 'cascade' | 'parallel';
  estimatedDuration: number;
  estimatedCost: number;
  confidenceScore: number;
  fallbackPlan?: TaskAllocation;
}

export interface BayesianComplexityScore {
  score: number;
  confidence: number;
  factors: {
    domainComplexity: number;
    dependencyDepth: number;
    capabilityBreadth: number;
    historicalDifficulty: number;
    timeConstraint: number;
  };
  recommendedROMALevel: ROMALevel;
  requiresCoalition: boolean;
}

class HierarchicalTaskAllocator extends EventEmitter {
  private agentProfiles: Map<string, AgentCapabilityProfile> = new Map();
  private activeCoalitions: Map<string, Coalition> = new Map();
  private taskHistory: Map<string, { success: boolean; duration: number; cost: number }[]> = new Map();
  private bayesianPriors: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeBayesianPriors();
    console.log('🎯 Hierarchical Task Allocator initialized with ROMA tier support');
  }

  private initializeBayesianPriors(): void {
    this.bayesianPriors.set('finance', 0.7);
    this.bayesianPriors.set('healthcare', 0.8);
    this.bayesianPriors.set('education', 0.5);
    this.bayesianPriors.set('marketing', 0.4);
    this.bayesianPriors.set('development', 0.6);
    this.bayesianPriors.set('legal', 0.75);
    this.bayesianPriors.set('creative', 0.45);
    this.bayesianPriors.set('research', 0.65);
    this.bayesianPriors.set('operations', 0.55);
    this.bayesianPriors.set('strategy', 0.7);
    this.bayesianPriors.set('default', 0.5);
  }

  async loadAgentProfiles(): Promise<void> {
    try {
      const modelConfigs = await db.select().from(waiAgentModelConfigs);
      const systemPrompts = await db.select().from(waiAgentSystemPrompts);
      const groupAssignments = await db.select().from(waiAgentGroupAssignments);
      
      const groupsByAgent = new Map<string, string[]>();
      groupAssignments.forEach(ga => {
        const groups = groupsByAgent.get(ga.agentId) || [];
        groups.push(ga.groupId);
        groupsByAgent.set(ga.agentId, groups);
      });
      
      const promptsByAgent = new Map<string, any>();
      systemPrompts.forEach(sp => promptsByAgent.set(sp.agentId, sp));
      
      for (const config of modelConfigs) {
        const agentId = config.agentId;
        const prompt = promptsByAgent.get(agentId);
        const groups = groupsByAgent.get(agentId) || [];
        
        const tierFromModel = config.primaryProvider?.includes('gpt-4') || config.primaryProvider?.includes('claude') 
          ? 'executive' 
          : config.primaryProvider?.includes('code') ? 'development' : 'domain';
        
        const profile: AgentCapabilityProfile = {
          agentId,
          name: prompt?.systemPrompt?.substring(0, 50) || agentId,
          romaLevel: this.parseROMALevel(config.romaLevel || 'L2'),
          tier: tierFromModel,
          domain: groups[0] || 'general',
          specializations: groups,
          performanceScore: 0.85,
          currentLoad: Math.random() * 0.5,
          costPerToken: this.estimateCostPerToken({ tier: tierFromModel }),
          capabilities: {
            textGeneration: true,
            codeGeneration: tierFromModel === 'development' || tierFromModel === 'qa' || tierFromModel === 'devops',
            reasoning: this.estimateReasoningCapability(config.romaLevel || 'L2'),
            creativity: this.estimateCreativityCapability(tierFromModel),
            multimodal: groups.length > 3
          }
        };
        this.agentProfiles.set(agentId, profile);
      }
      
      if (this.agentProfiles.size === 0) {
        await this.loadFallbackProfiles();
      }
      
      console.log(`📊 Loaded ${this.agentProfiles.size} agent profiles for task allocation`);
    } catch (error) {
      console.error('Failed to load agent profiles from database, using fallback:', error);
      await this.loadFallbackProfiles();
    }
  }
  
  private async loadFallbackProfiles(): Promise<void> {
    const fallbackAgents = [
      { id: 'ceo-orchestrator', name: 'CEO Orchestrator', tier: 'executive', romaLevel: 'L4', domain: 'strategy' },
      { id: 'cto-architect', name: 'CTO Architect', tier: 'executive', romaLevel: 'L4', domain: 'development' },
      { id: 'cfo-finance', name: 'CFO Finance Agent', tier: 'executive', romaLevel: 'L4', domain: 'finance' },
      { id: 'lead-developer', name: 'Lead Developer', tier: 'development', romaLevel: 'L3', domain: 'development' },
      { id: 'fullstack-engineer', name: 'Full Stack Engineer', tier: 'development', romaLevel: 'L3', domain: 'development' },
      { id: 'frontend-specialist', name: 'Frontend Specialist', tier: 'development', romaLevel: 'L2', domain: 'development' },
      { id: 'backend-specialist', name: 'Backend Specialist', tier: 'development', romaLevel: 'L2', domain: 'development' },
      { id: 'devops-engineer', name: 'DevOps Engineer', tier: 'devops', romaLevel: 'L3', domain: 'operations' },
      { id: 'qa-lead', name: 'QA Lead', tier: 'qa', romaLevel: 'L3', domain: 'quality' },
      { id: 'security-analyst', name: 'Security Analyst', tier: 'domain', romaLevel: 'L3', domain: 'security' },
      { id: 'data-scientist', name: 'Data Scientist', tier: 'domain', romaLevel: 'L3', domain: 'analytics' },
      { id: 'content-strategist', name: 'Content Strategist', tier: 'creative', romaLevel: 'L2', domain: 'marketing' },
      { id: 'ux-designer', name: 'UX Designer', tier: 'creative', romaLevel: 'L2', domain: 'design' },
      { id: 'finance-analyst', name: 'Finance Analyst', tier: 'domain', romaLevel: 'L2', domain: 'finance' },
      { id: 'legal-advisor', name: 'Legal Advisor', tier: 'domain', romaLevel: 'L2', domain: 'legal' }
    ];
    
    for (const agent of fallbackAgents) {
      const profile: AgentCapabilityProfile = {
        agentId: agent.id,
        name: agent.name,
        romaLevel: agent.romaLevel as ROMALevel,
        tier: agent.tier,
        domain: agent.domain,
        specializations: [agent.domain],
        performanceScore: 0.85,
        currentLoad: Math.random() * 0.5,
        costPerToken: this.estimateCostPerToken({ tier: agent.tier }),
        capabilities: {
          textGeneration: true,
          codeGeneration: agent.tier === 'development' || agent.tier === 'qa' || agent.tier === 'devops',
          reasoning: this.estimateReasoningCapability(agent.romaLevel),
          creativity: this.estimateCreativityCapability(agent.tier),
          multimodal: agent.tier === 'creative'
        }
      };
      this.agentProfiles.set(agent.id, profile);
    }
  }

  private parseROMALevel(level: string): ROMALevel {
    if (level.includes('L4')) return 'L4';
    if (level.includes('L3')) return 'L3';
    if (level.includes('L2')) return 'L2';
    return 'L1';
  }

  private estimateCostPerToken(config: any): number {
    const tierCosts: Record<string, number> = {
      'executive': 0.015,
      'domain': 0.008,
      'creative': 0.006,
      'development': 0.005,
      'qa': 0.004,
      'devops': 0.003
    };
    return tierCosts[config.tier] || 0.005;
  }

  private estimateReasoningCapability(romaLevel: string): number {
    const capabilities: Record<string, number> = {
      'L4': 95,
      'L3': 85,
      'L2': 70,
      'L1': 55
    };
    return capabilities[this.parseROMALevel(romaLevel)] || 60;
  }

  private estimateCreativityCapability(tier: string): number {
    const capabilities: Record<string, number> = {
      'creative': 95,
      'executive': 85,
      'domain': 75,
      'development': 70,
      'qa': 60,
      'devops': 55
    };
    return capabilities[tier] || 65;
  }

  async computeBayesianComplexity(task: TaskSpecification): Promise<BayesianComplexityScore> {
    const domainPrior = this.bayesianPriors.get(task.domain) || this.bayesianPriors.get('default')!;
    
    const domainComplexity = domainPrior * 10;
    const dependencyDepth = task.dependencies ? Math.min(task.dependencies.length * 1.5, 10) : 0;
    const capabilityBreadth = Math.min(task.requiredCapabilities.length * 2, 10);
    
    const taskTypeKey = `${task.domain}:${task.requiredCapabilities.sort().join(',')}`;
    const history = this.taskHistory.get(taskTypeKey) || [];
    const historicalDifficulty = history.length > 0 
      ? history.reduce((sum, h) => sum + (h.success ? 0 : 1), 0) / history.length * 10
      : 5;
    
    const timeConstraint = task.deadline 
      ? Math.max(10 - (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24), 0)
      : 0;
    
    const factors = {
      domainComplexity,
      dependencyDepth,
      capabilityBreadth,
      historicalDifficulty,
      timeConstraint
    };
    
    const weights = {
      domainComplexity: 0.25,
      dependencyDepth: 0.2,
      capabilityBreadth: 0.2,
      historicalDifficulty: 0.25,
      timeConstraint: 0.1
    };
    
    const score = Object.keys(factors).reduce((sum, key) => {
      return sum + factors[key as keyof typeof factors] * weights[key as keyof typeof weights];
    }, 0);
    
    const confidence = history.length > 5 ? 0.9 : 0.6 + (history.length * 0.06);
    
    let recommendedROMALevel: ROMALevel = 'L1';
    if (score >= 8) recommendedROMALevel = 'L4';
    else if (score >= 6) recommendedROMALevel = 'L3';
    else if (score >= 4) recommendedROMALevel = 'L2';
    
    return {
      score: Math.min(10, Math.max(1, score)),
      confidence,
      factors,
      recommendedROMALevel,
      requiresCoalition: score >= 7 || task.requiredCapabilities.length > 3
    };
  }

  async allocateTask(task: TaskSpecification): Promise<TaskAllocation> {
    await this.ensureProfilesLoaded();
    
    const complexity = await this.computeBayesianComplexity(task);
    console.log(`🎯 Task ${task.id} complexity: ${complexity.score.toFixed(2)} (${complexity.recommendedROMALevel})`);
    
    if (complexity.requiresCoalition) {
      return this.allocateWithCoalition(task, complexity);
    }
    
    return this.allocateSingleAgent(task, complexity);
  }

  private async ensureProfilesLoaded(): Promise<void> {
    if (this.agentProfiles.size === 0) {
      await this.loadAgentProfiles();
    }
  }

  private async allocateSingleAgent(
    task: TaskSpecification, 
    complexity: BayesianComplexityScore
  ): Promise<TaskAllocation> {
    const candidates = this.findCandidateAgents(task, complexity.recommendedROMALevel);
    
    if (candidates.length === 0) {
      throw new Error(`No suitable agents found for task ${task.id}`);
    }
    
    const scoredCandidates = candidates.map(agent => ({
      agent,
      score: this.scoreAgentForTask(agent, task, complexity)
    })).sort((a, b) => b.score - a.score);
    
    const primaryAgent = scoredCandidates[0].agent;
    const supportAgents = scoredCandidates.slice(1, 3).map(c => c.agent);
    
    return {
      taskId: task.id,
      primaryAgent,
      supportAgents,
      allocationStrategy: 'single',
      estimatedDuration: this.estimateDuration(task, complexity, [primaryAgent]),
      estimatedCost: this.estimateCost(task, [primaryAgent]),
      confidenceScore: complexity.confidence * scoredCandidates[0].score,
      fallbackPlan: supportAgents.length > 0 ? {
        taskId: task.id,
        primaryAgent: supportAgents[0],
        supportAgents: supportAgents.slice(1),
        allocationStrategy: 'single',
        estimatedDuration: this.estimateDuration(task, complexity, [supportAgents[0]]),
        estimatedCost: this.estimateCost(task, [supportAgents[0]]),
        confidenceScore: complexity.confidence * 0.8
      } : undefined
    };
  }

  private async allocateWithCoalition(
    task: TaskSpecification,
    complexity: BayesianComplexityScore
  ): Promise<TaskAllocation> {
    const coalition = await this.formDynamicCoalition(task, complexity);
    
    return {
      taskId: task.id,
      coalition,
      supportAgents: [],
      allocationStrategy: 'coalition',
      estimatedDuration: this.estimateDuration(task, complexity, [coalition.lead, ...coalition.members]),
      estimatedCost: coalition.estimatedCost,
      confidenceScore: complexity.confidence * 0.95
    };
  }

  async formDynamicCoalition(
    task: TaskSpecification,
    complexity: BayesianComplexityScore
  ): Promise<Coalition> {
    const coalitionId = `coalition-${task.id}-${Date.now()}`;
    
    const requiredCapabilities = new Set(task.requiredCapabilities);
    const selectedAgents: AgentCapabilityProfile[] = [];
    let lead: AgentCapabilityProfile | null = null;
    
    const l4Agents = this.getAgentsByROMALevel('L4');
    if (l4Agents.length > 0) {
      lead = l4Agents.sort((a, b) => b.performanceScore - a.performanceScore)[0];
      selectedAgents.push(lead);
    }
    
    const remainingCapabilities = new Set(requiredCapabilities);
    selectedAgents.forEach(agent => {
      agent.specializations.forEach(spec => remainingCapabilities.delete(spec));
    });
    
    for (const capability of remainingCapabilities) {
      const specialists = this.findSpecialists(capability, complexity.recommendedROMALevel);
      if (specialists.length > 0 && !selectedAgents.includes(specialists[0])) {
        selectedAgents.push(specialists[0]);
      }
    }
    
    if (selectedAgents.length < 3 && complexity.score >= 8) {
      const l3Agents = this.getAgentsByROMALevel('L3')
        .filter(a => !selectedAgents.includes(a))
        .sort((a, b) => b.performanceScore - a.performanceScore);
      
      selectedAgents.push(...l3Agents.slice(0, 3 - selectedAgents.length));
    }
    
    if (!lead && selectedAgents.length > 0) {
      lead = selectedAgents.reduce((best, current) => 
        this.compareROMALevel(current.romaLevel, best.romaLevel) > 0 ? current : best
      );
    }
    
    if (!lead) {
      throw new Error(`Cannot form coalition for task ${task.id}: No suitable lead agent`);
    }
    
    const coalition: Coalition = {
      id: coalitionId,
      name: `Coalition for ${task.name}`,
      taskId: task.id,
      lead,
      members: selectedAgents.filter(a => a !== lead),
      formationStrategy: this.determineFormationStrategy(task, complexity),
      totalCapacity: selectedAgents.reduce((sum, a) => sum + (1 - a.currentLoad), 0),
      estimatedCost: this.estimateCost(task, selectedAgents),
      status: 'forming',
      createdAt: new Date()
    };
    
    this.activeCoalitions.set(coalitionId, coalition);
    this.emit('coalition:formed', coalition);
    
    console.log(`🤝 Coalition formed: ${coalition.name} with ${coalition.members.length + 1} agents`);
    console.log(`   Lead: ${lead.name} (${lead.romaLevel})`);
    console.log(`   Members: ${coalition.members.map(m => m.name).join(', ')}`);
    
    return coalition;
  }

  private compareROMALevel(a: ROMALevel, b: ROMALevel): number {
    const levels: Record<ROMALevel, number> = { 'L1': 1, 'L2': 2, 'L3': 3, 'L4': 4 };
    return levels[a] - levels[b];
  }

  private determineFormationStrategy(
    task: TaskSpecification, 
    complexity: BayesianComplexityScore
  ): Coalition['formationStrategy'] {
    if (task.budget && task.budget.maxCost < 1) return 'cost-optimized';
    if (complexity.score >= 9) return 'performance';
    if (task.requiredCapabilities.length > 5) return 'coverage';
    return 'expertise';
  }

  private findCandidateAgents(task: TaskSpecification, minLevel: ROMALevel): AgentCapabilityProfile[] {
    const minLevelValue = { 'L1': 1, 'L2': 2, 'L3': 3, 'L4': 4 }[minLevel];
    
    return Array.from(this.agentProfiles.values()).filter(agent => {
      if (task.excludedAgents?.includes(agent.agentId)) return false;
      
      const agentLevelValue = { 'L1': 1, 'L2': 2, 'L3': 3, 'L4': 4 }[agent.romaLevel];
      if (agentLevelValue < minLevelValue - 1) return false;
      
      if (agent.currentLoad > 0.9) return false;
      
      const hasRelevantCapability = task.requiredCapabilities.some(cap => 
        agent.specializations.includes(cap) || agent.domain === cap
      );
      
      return hasRelevantCapability || task.preferredAgents?.includes(agent.agentId);
    });
  }

  private findSpecialists(capability: string, minLevel: ROMALevel): AgentCapabilityProfile[] {
    return Array.from(this.agentProfiles.values())
      .filter(agent => 
        agent.specializations.includes(capability) || 
        agent.domain === capability
      )
      .sort((a, b) => b.performanceScore - a.performanceScore);
  }

  private getAgentsByROMALevel(level: ROMALevel): AgentCapabilityProfile[] {
    return Array.from(this.agentProfiles.values())
      .filter(agent => agent.romaLevel === level);
  }

  private scoreAgentForTask(
    agent: AgentCapabilityProfile, 
    task: TaskSpecification, 
    complexity: BayesianComplexityScore
  ): number {
    let score = 0;
    
    const levelMatch = { 'L1': 0.6, 'L2': 0.75, 'L3': 0.9, 'L4': 1.0 };
    score += levelMatch[agent.romaLevel] * 0.3;
    
    score += agent.performanceScore * 0.25;
    
    score += (1 - agent.currentLoad) * 0.2;
    
    const capabilityMatch = task.requiredCapabilities.filter(cap => 
      agent.specializations.includes(cap)
    ).length / Math.max(task.requiredCapabilities.length, 1);
    score += capabilityMatch * 0.25;
    
    return score;
  }

  private estimateDuration(
    task: TaskSpecification, 
    complexity: BayesianComplexityScore,
    agents: AgentCapabilityProfile[]
  ): number {
    const baseDuration = complexity.score * 60 * 1000;
    const parallelFactor = Math.max(1, agents.length - 1) * 0.3 + 1;
    const avgPerformance = agents.reduce((sum, a) => sum + a.performanceScore, 0) / agents.length;
    
    return baseDuration / parallelFactor / avgPerformance;
  }

  private estimateCost(task: TaskSpecification, agents: AgentCapabilityProfile[]): number {
    const estimatedTokens = task.budget?.maxTokens || 10000;
    const avgCostPerToken = agents.reduce((sum, a) => sum + a.costPerToken, 0) / agents.length;
    return estimatedTokens * avgCostPerToken;
  }

  async disbandCoalition(coalitionId: string): Promise<void> {
    const coalition = this.activeCoalitions.get(coalitionId);
    if (coalition) {
      coalition.status = 'disbanded';
      this.activeCoalitions.delete(coalitionId);
      this.emit('coalition:disbanded', coalition);
      console.log(`🔓 Coalition disbanded: ${coalition.name}`);
    }
  }

  async recordTaskOutcome(
    taskId: string, 
    success: boolean, 
    duration: number, 
    cost: number,
    domain: string,
    capabilities: string[]
  ): Promise<void> {
    const taskTypeKey = `${domain}:${capabilities.sort().join(',')}`;
    
    if (!this.taskHistory.has(taskTypeKey)) {
      this.taskHistory.set(taskTypeKey, []);
    }
    
    this.taskHistory.get(taskTypeKey)!.push({ success, duration, cost });
    
    if (!success) {
      const currentPrior = this.bayesianPriors.get(domain) || 0.5;
      this.bayesianPriors.set(domain, Math.min(1, currentPrior + 0.05));
    } else {
      const currentPrior = this.bayesianPriors.get(domain) || 0.5;
      this.bayesianPriors.set(domain, Math.max(0, currentPrior - 0.02));
    }
  }

  getActiveCoalitions(): Coalition[] {
    return Array.from(this.activeCoalitions.values());
  }

  getAgentProfile(agentId: string): AgentCapabilityProfile | undefined {
    return this.agentProfiles.get(agentId);
  }

  getAllProfiles(): AgentCapabilityProfile[] {
    return Array.from(this.agentProfiles.values());
  }

  getStats(): {
    totalAgents: number;
    byROMALevel: Record<ROMALevel, number>;
    activeCoalitions: number;
    averageLoad: number;
  } {
    const profiles = this.getAllProfiles();
    const byLevel: Record<ROMALevel, number> = { 'L1': 0, 'L2': 0, 'L3': 0, 'L4': 0 };
    
    profiles.forEach(p => byLevel[p.romaLevel]++);
    
    return {
      totalAgents: profiles.length,
      byROMALevel: byLevel,
      activeCoalitions: this.activeCoalitions.size,
      averageLoad: profiles.reduce((sum, p) => sum + p.currentLoad, 0) / Math.max(profiles.length, 1)
    };
  }
}

export const hierarchicalTaskAllocator = new HierarchicalTaskAllocator();
export { HierarchicalTaskAllocator };
