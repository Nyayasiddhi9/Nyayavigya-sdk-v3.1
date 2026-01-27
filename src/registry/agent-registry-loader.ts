/**
 * WAI SDK v9.0 - Agent Registry Loader
 * Production-ready agent registry initialization and management
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export interface Agent {
  id: string;
  name: string;
  category: string;
  level: string;
  tier: string;
  description: string;
  romaAlignment: {
    role: string;
    capabilities: string[];
    complexity: string;
  };
  inputs: {
    required: string[];
    optional?: string[];
  };
  outputs: {
    primary: string;
    secondary?: string[];
  };
  skills: string[];
  policies: {
    costBudget: string;
    qualityLevel: string;
    autonomy: string;
    escalation: string;
  };
  routingHints: {
    priority: string;
    latencyRequirement: string;
    costOptimization: boolean;
  };
  readiness: string;
  apiEndpoint: string;
  healthCheck: string;
}

export interface AgentManifest {
  metadata: {
    name: string;
    version: string;
    description: string;
    totalAgents: number;
    lastUpdated: string;
    conformanceVersion?: string;
    romaAlignment?: boolean;
    productionReady?: boolean;
  };
  categories: Record<string, any>;
  agents: Agent[] | Record<string, Agent[]>;
  conformanceStandards?: any;
  frameworkIntegrations?: any;
}

export class AgentRegistryLoader extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private agentsByCategory: Map<string, Agent[]> = new Map();
  private manifestPath: string;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor(manifestPath?: string) {
    super();
    this.manifestPath = manifestPath || path.join(process.cwd(), 'packages/agents/manifest/ultimate.json');
  }

  /**
   * Load and initialize all agents from manifest
   */
  async loadAgents(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadAgentsInternal();
    return this.loadPromise;
  }

  private async _loadAgentsInternal(): Promise<void> {
    try {
      console.log('🤖 Loading WAI Agent Registry v9.0...');
      
      // Check if manifest exists
      if (!fs.existsSync(this.manifestPath)) {
        throw new Error(`Agent manifest not found at: ${this.manifestPath}`);
      }

      // Load and parse manifest
      const manifestContent = fs.readFileSync(this.manifestPath, 'utf-8');
      const manifest: AgentManifest = JSON.parse(manifestContent);

      console.log(`📋 Manifest loaded: ${manifest.metadata?.name || 'Unknown'}`);
      console.log(`📊 Total agents: ${manifest.metadata?.totalAgents || 0}`);

      // Clear existing data
      this.agents.clear();
      this.agentsByCategory.clear();

      // Load agents based on manifest structure
      let agentList: Agent[] = [];
      
      if (Array.isArray(manifest.agents)) {
        agentList = manifest.agents;
      } else if (typeof manifest.agents === 'object') {
        // Flatten agents from categories
        for (const [category, categoryAgents] of Object.entries(manifest.agents)) {
          if (Array.isArray(categoryAgents)) {
            agentList.push(...categoryAgents.map(agent => ({
              ...agent,
              category: agent.category || category
            })));
          }
        }
      }

      // Process and register each agent
      for (const agent of agentList) {
        await this.registerAgent(agent);
      }

      // Validate conformance if standards are defined
      if (manifest.conformanceStandards) {
        await this.validateConformance(manifest.conformanceStandards);
      }

      this.isLoaded = true;
      
      console.log(`✅ Agent registry loaded successfully: ${this.agents.size} agents`);
      console.log(`📁 Categories: ${this.agentsByCategory.size}`);
      
      this.emit('registry-loaded', {
        totalAgents: this.agents.size,
        categories: this.agentsByCategory.size,
        manifest: manifest.metadata
      });

    } catch (error) {
      console.error('❌ Failed to load agent registry:', error);
      this.emit('registry-error', error);
      throw error;
    }
  }

  /**
   * Register a single agent
   */
  private async registerAgent(agent: Agent): Promise<void> {
    // Validate required fields
    this.validateAgentStructure(agent);

    // Register in main registry
    this.agents.set(agent.id, agent);

    // Register in category registry
    if (!this.agentsByCategory.has(agent.category)) {
      this.agentsByCategory.set(agent.category, []);
    }
    this.agentsByCategory.get(agent.category)!.push(agent);

    // Emit agent registered event
    this.emit('agent-registered', agent);
  }

  /**
   * Validate agent structure
   */
  private validateAgentStructure(agent: Agent): void {
    const requiredFields = [
      'id', 'name', 'category', 'description', 'skills', 
      'readiness', 'apiEndpoint', 'healthCheck'
    ];

    for (const field of requiredFields) {
      if (!agent[field as keyof Agent]) {
        throw new Error(`Agent ${agent.id} missing required field: ${field}`);
      }
    }

    // Validate skills array
    if (!Array.isArray(agent.skills) || agent.skills.length < 3) {
      throw new Error(`Agent ${agent.id} must have at least 3 skills`);
    }

    // Validate readiness level
    if (!['experimental', 'beta', 'production'].includes(agent.readiness)) {
      throw new Error(`Agent ${agent.id} has invalid readiness level: ${agent.readiness}`);
    }

    // Validate API endpoint format
    if (!agent.apiEndpoint.startsWith('/api/')) {
      throw new Error(`Agent ${agent.id} has invalid API endpoint format`);
    }
  }

  /**
   * Validate conformance standards
   */
  private async validateConformance(standards: any): Promise<void> {
    console.log('🔍 Validating conformance standards...');
    
    let conformanceErrors: string[] = [];

    // Check ROMA alignment if required
    if (standards.romaAlignmentRequired) {
      for (const [id, agent] of this.agents) {
        if (!agent.romaAlignment) {
          conformanceErrors.push(`Agent ${id} missing ROMA alignment`);
        }
      }
    }

    // Check minimum agent count
    if (standards.minimumAgents && this.agents.size < standards.minimumAgents) {
      conformanceErrors.push(`Insufficient agents: ${this.agents.size} < ${standards.minimumAgents}`);
    }

    if (conformanceErrors.length > 0) {
      console.warn('⚠️ Conformance validation warnings:', conformanceErrors);
      this.emit('conformance-warnings', conformanceErrors);
    } else {
      console.log('✅ All conformance standards met');
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /**
   * Get agents by category
   */
  getAgentsByCategory(category: string): Agent[] {
    return this.agentsByCategory.get(category) || [];
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by skill
   */
  getAgentsBySkill(skill: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    );
  }

  /**
   * Get agents by readiness level
   */
  getAgentsByReadiness(readiness: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.readiness === readiness
    );
  }

  /**
   * Find best agents for a task
   */
  findAgentsForTask(
    task: string, 
    options: {
      category?: string;
      maxResults?: number;
      readinessLevel?: string;
      complexityLevel?: string;
    } = {}
  ): Agent[] {
    const {
      category,
      maxResults = 10,
      readinessLevel = 'production',
      complexityLevel
    } = options;

    let candidates = Array.from(this.agents.values());

    // Filter by readiness
    candidates = candidates.filter(agent => agent.readiness === readinessLevel);

    // Filter by category if specified
    if (category) {
      candidates = candidates.filter(agent => agent.category === category);
    }

    // Filter by complexity level if specified
    if (complexityLevel && candidates[0]?.romaAlignment?.complexity) {
      candidates = candidates.filter(agent => 
        agent.romaAlignment?.complexity === complexityLevel
      );
    }

    // Score agents based on task relevance
    const scoredAgents = candidates.map(agent => ({
      agent,
      score: this.calculateTaskRelevanceScore(agent, task)
    }));

    // Sort by score and return top results
    return scoredAgents
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.agent);
  }

  /**
   * Calculate task relevance score
   */
  private calculateTaskRelevanceScore(agent: Agent, task: string): number {
    let score = 0;
    const taskLower = task.toLowerCase();

    // Score based on name relevance
    if (agent.name.toLowerCase().includes(taskLower)) score += 20;

    // Score based on description relevance
    if (agent.description.toLowerCase().includes(taskLower)) score += 15;

    // Score based on skills relevance
    agent.skills.forEach(skill => {
      if (skill.toLowerCase().includes(taskLower)) score += 10;
      // Partial matches for skills
      const skillWords = skill.toLowerCase().split('-');
      const taskWords = taskLower.split(/\s+/);
      for (const skillWord of skillWords) {
        for (const taskWord of taskWords) {
          if (skillWord.includes(taskWord) || taskWord.includes(skillWord)) {
            score += 5;
          }
        }
      }
    });

    // Score based on category relevance
    if (agent.category.toLowerCase().includes(taskLower)) score += 8;

    return score;
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    totalAgents: number;
    categoryCounts: Record<string, number>;
    readinessCounts: Record<string, number>;
    tierCounts: Record<string, number>;
    averageSkillsPerAgent: number;
  } {
    const agents = Array.from(this.agents.values());
    
    const categoryCounts: Record<string, number> = {};
    const readinessCounts: Record<string, number> = {};
    const tierCounts: Record<string, number> = {};
    let totalSkills = 0;

    agents.forEach(agent => {
      // Count categories
      categoryCounts[agent.category] = (categoryCounts[agent.category] || 0) + 1;
      
      // Count readiness levels
      readinessCounts[agent.readiness] = (readinessCounts[agent.readiness] || 0) + 1;
      
      // Count tiers
      if (agent.tier) {
        tierCounts[agent.tier] = (tierCounts[agent.tier] || 0) + 1;
      }
      
      // Count skills
      totalSkills += agent.skills.length;
    });

    return {
      totalAgents: agents.length,
      categoryCounts,
      readinessCounts,
      tierCounts,
      averageSkillsPerAgent: totalSkills / agents.length
    };
  }

  /**
   * Check if registry is loaded
   */
  isRegistryLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Reload the registry
   */
  async reloadRegistry(): Promise<void> {
    this.isLoaded = false;
    this.loadPromise = null;
    await this.loadAgents();
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistryLoader();