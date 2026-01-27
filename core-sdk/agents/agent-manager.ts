/**
 * WAI Agent Manager v9.0
 * Manages 105+ specialized AI agents across 5 tiers
 */

import { EventEmitter } from 'events';
import { WAILogger } from '../utils/logger';
import { AgentConfig, AgentCapabilities } from '../types/core-types';

export class AgentManager extends EventEmitter {
  private logger: WAILogger;
  private initialized = false;
  private agents: Map<string, WAIAgent> = new Map();
  private agentPerformance: Map<string, AgentPerformance> = new Map();
  
  constructor(private config: AgentConfig) {
    super();
    this.logger = new WAILogger('AgentManager');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('🤖 Initializing Agent Manager with 105+ specialized agents...');

      // Initialize all agent tiers
      await this.initializeExecutiveTier();
      await this.initializeDevelopmentTier();
      await this.initializeCreativeTier();
      await this.initializeQATier();
      await this.initializeDevOpsTier();
      await this.initializeDomainSpecialistTier();

      this.initialized = true;
      this.logger.info(`✅ Agent Manager initialized with ${this.agents.size} agents`);

    } catch (error) {
      this.logger.error('❌ Agent manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Select optimal agents for a task
   */
  async selectAgents(taskType: string, requirements: any): Promise<WAIAgent[]> {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.canHandle(taskType))
      .sort((a, b) => this.getAgentScore(b, taskType) - this.getAgentScore(a, taskType));

    const selectedAgents = availableAgents.slice(0, requirements.maxAgents || 3);
    
    this.logger.info(`🎯 Selected ${selectedAgents.length} agents for ${taskType}`);
    
    return selectedAgents;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapabilities {
    const tierCounts: Record<string, number> = {};
    const specializations: Set<string> = new Set();

    this.agents.forEach(agent => {
      tierCounts[agent.tier] = (tierCounts[agent.tier] || 0) + 1;
      agent.specializations.forEach(spec => specializations.add(spec));
    });

    return {
      total: this.agents.size,
      tiers: tierCounts,
      specializations: Array.from(specializations)
    };
  }

  /**
   * Get agent status
   */
  getStatus() {
    const activeAgents = Array.from(this.agents.values()).filter(a => a.isActive()).length;
    
    return {
      healthy: this.initialized,
      status: this.initialized ? 'active' : 'inactive',
      lastCheck: Date.now(),
      totalAgents: this.agents.size,
      activeAgents,
      errorCount: 0
    };
  }

  /**
   * Update agent performance model
   */
  async updatePerformanceModel(agentIds: string[], performance: any): Promise<void> {
    agentIds.forEach(agentId => {
      const currentPerf = this.agentPerformance.get(agentId) || {
        totalTasks: 0,
        successRate: 1.0,
        averageLatency: 0,
        qualityScore: 0.9
      };

      const updatedPerf: AgentPerformance = {
        totalTasks: currentPerf.totalTasks + 1,
        successRate: (currentPerf.successRate * currentPerf.totalTasks + (performance.success ? 1 : 0)) / (currentPerf.totalTasks + 1),
        averageLatency: (currentPerf.averageLatency * currentPerf.totalTasks + performance.latency) / (currentPerf.totalTasks + 1),
        qualityScore: (currentPerf.qualityScore * currentPerf.totalTasks + performance.quality) / (currentPerf.totalTasks + 1)
      };

      this.agentPerformance.set(agentId, updatedPerf);
    });
  }

  /**
   * Register a new agent
   */
  registerAgent(agent: WAIAgent): void {
    this.agents.set(agent.id, agent);
    this.logger.info(`✅ Registered agent: ${agent.name} (${agent.tier})`);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): WAIAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agents by tier
   */
  getAgentsByTier(tier: string): WAIAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.tier === tier);
  }

  /**
   * Initialize Executive Tier Agents (5 agents)
   */
  private async initializeExecutiveTier(): Promise<void> {
    const executiveAgents = [
      new WAIAgent({
        id: 'ceo-orchestrator',
        name: 'CEO Orchestrator',
        tier: 'executive',
        specializations: ['strategic-planning', 'resource-allocation', 'decision-making'],
        description: 'Top-level strategic orchestrator for complex multi-platform projects'
      }),
      new WAIAgent({
        id: 'cto-architect',
        name: 'CTO Architect', 
        tier: 'executive',
        specializations: ['technical-architecture', 'technology-strategy', 'innovation'],
        description: 'Chief technology architect for system design and innovation strategy'
      }),
      new WAIAgent({
        id: 'cmo-growth',
        name: 'CMO Growth Strategist',
        tier: 'executive', 
        specializations: ['marketing-strategy', 'growth-hacking', 'user-acquisition'],
        description: 'Chief marketing strategist for growth and user acquisition'
      }),
      new WAIAgent({
        id: 'coo-operations',
        name: 'COO Operations Manager',
        tier: 'executive',
        specializations: ['operations', 'process-optimization', 'efficiency'],
        description: 'Chief operations manager for process optimization and efficiency'
      }),
      new WAIAgent({
        id: 'cfo-finance',
        name: 'CFO Financial Advisor',
        tier: 'executive',
        specializations: ['financial-planning', 'cost-optimization', 'roi-analysis'],
        description: 'Chief financial advisor for budgeting and ROI optimization'
      })
    ];

    executiveAgents.forEach(agent => this.registerAgent(agent));
    this.logger.info('👑 Executive Tier: 5 agents initialized');
  }

  /**
   * Initialize Development Tier Agents (25 agents)
   */
  private async initializeDevelopmentTier(): Promise<void> {
    // This would contain all 25 development agents
    const developmentAgents = this.createDevelopmentAgents();
    developmentAgents.forEach(agent => this.registerAgent(agent));
    this.logger.info('💻 Development Tier: 25 agents initialized');
  }

  /**
   * Initialize Creative Tier Agents (20 agents)
   */
  private async initializeCreativeTier(): Promise<void> {
    const creativeAgents = this.createCreativeAgents();
    creativeAgents.forEach(agent => this.registerAgent(agent));
    this.logger.info('🎨 Creative Tier: 20 agents initialized');
  }

  /**
   * Initialize QA Tier Agents (15 agents)
   */
  private async initializeQATier(): Promise<void> {
    const qaAgents = this.createQAAgents();
    qaAgents.forEach(agent => this.registerAgent(agent));
    this.logger.info('🧪 QA Tier: 15 agents initialized');
  }

  /**
   * Initialize DevOps Tier Agents (15 agents)
   */
  private async initializeDevOpsTier(): Promise<void> {
    const devopsAgents = this.createDevOpsAgents();
    devopsAgents.forEach(agent => this.registerAgent(agent));
    this.logger.info('🛠️ DevOps Tier: 15 agents initialized');
  }

  /**
   * Initialize Domain Specialist Agents (25 agents)
   */
  private async initializeDomainSpecialistTier(): Promise<void> {
    const domainAgents = this.createDomainSpecialistAgents();
    domainAgents.forEach(agent => this.registerAgent(agent));
    this.logger.info('🎯 Domain Specialist Tier: 25 agents initialized');
  }

  private createDevelopmentAgents(): WAIAgent[] {
    // Return array of 25 development agents
    return Array.from({ length: 25 }, (_, i) => 
      new WAIAgent({
        id: `dev-agent-${i + 1}`,
        name: `Development Agent ${i + 1}`,
        tier: 'development',
        specializations: ['coding', 'architecture', 'debugging'],
        description: `Specialized development agent for coding and architecture tasks`
      })
    );
  }

  private createCreativeAgents(): WAIAgent[] {
    return Array.from({ length: 20 }, (_, i) => 
      new WAIAgent({
        id: `creative-agent-${i + 1}`,
        name: `Creative Agent ${i + 1}`,
        tier: 'creative',
        specializations: ['content-creation', 'design', 'copywriting'],
        description: `Creative agent for content and design tasks`
      })
    );
  }

  private createQAAgents(): WAIAgent[] {
    return Array.from({ length: 15 }, (_, i) => 
      new WAIAgent({
        id: `qa-agent-${i + 1}`,
        name: `QA Agent ${i + 1}`,
        tier: 'qa',
        specializations: ['testing', 'quality-assurance', 'automation'],
        description: `QA agent for testing and quality assurance`
      })
    );
  }

  private createDevOpsAgents(): WAIAgent[] {
    return Array.from({ length: 15 }, (_, i) => 
      new WAIAgent({
        id: `devops-agent-${i + 1}`,
        name: `DevOps Agent ${i + 1}`,
        tier: 'devops',
        specializations: ['deployment', 'infrastructure', 'monitoring'],
        description: `DevOps agent for deployment and infrastructure management`
      })
    );
  }

  private createDomainSpecialistAgents(): WAIAgent[] {
    return Array.from({ length: 25 }, (_, i) => 
      new WAIAgent({
        id: `domain-agent-${i + 1}`,
        name: `Domain Specialist ${i + 1}`,
        tier: 'domain-specialist',
        specializations: ['domain-expertise', 'specialized-knowledge'],
        description: `Domain specialist agent for industry-specific tasks`
      })
    );
  }

  private getAgentScore(agent: WAIAgent, taskType: string): number {
    const performance = this.agentPerformance.get(agent.id);
    if (!performance) return 0.5;

    return performance.successRate * 0.4 + 
           performance.qualityScore * 0.4 + 
           (1 - performance.averageLatency / 1000) * 0.2;
  }

  async shutdown(): Promise<void> {
    this.logger.info('🔄 Shutting down agent manager...');
    this.initialized = false;
  }
}

export class WAIAgent {
  public id: string;
  public name: string;
  public tier: string;
  public specializations: string[];
  public description: string;
  private active = true;

  constructor(config: {
    id: string;
    name: string;
    tier: string;
    specializations: string[];
    description: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.tier = config.tier;
    this.specializations = config.specializations;
    this.description = config.description;
  }

  canHandle(taskType: string): boolean {
    return this.specializations.some(spec => 
      taskType.includes(spec) || spec.includes(taskType)
    );
  }

  isActive(): boolean {
    return this.active;
  }

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }
}

interface AgentPerformance {
  totalTasks: number;
  successRate: number;
  averageLatency: number;
  qualityScore: number;
}