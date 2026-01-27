/**
 * WAI SDK v2.0 - Runtime Agent Loader Service
 * 
 * This service ensures all 275 agents are:
 * - Loaded at application startup
 * - Available for runtime queries
 * - Properly indexed for fast lookup
 * - Support autonomous, swarm, team, and hierarchy operation modes
 * - Properly coordinated through A2A protocol
 * 
 * FEATURES:
 * - Singleton pattern for consistent access
 * - Lazy loading with eager initialization option
 * - Category and capability-based indexing
 * - Hierarchy-aware agent selection
 * - Multi-language support (23+ languages including 12+ Indian)
 */

import { 
  ALL_AGENTS, 
  CompleteAgentDefinition,
  getAgentById,
  getAgentsByTier,
  getAgentsByRomaLevel,
  getAgentsByCategory,
  getCollaborators,
  getManagedAgents,
  getReportingChain,
  AGENT_COUNTS as MAIN_COUNTS
} from './complete-agents-registry-v2';

import {
  ALL_DOMAIN_AGENTS,
  CREATIVE_AGENTS,
  QA_AGENTS,
  DEVOPS_AGENTS,
  AGENT_COUNTS as TIER_COUNTS
} from './domain-creative-qa-devops-agents';

import {
  ALL_SPECIALIZED_AGENTS,
  SPECIALIZED_AGENT_COUNTS
} from './specialized-agents-v2';

import {
  RomaLevel,
  AgentTier,
  OperationMode,
  ALL_LANGUAGES,
  SUPPORTED_LANGUAGES,
  AGENTIC_PROTOCOLS,
  OPERATION_MODES
} from './prompt-generator/generate-22-point-prompts';

// =============================================================================
// COMPLETE AGENT REGISTRY
// =============================================================================

const COMPLETE_AGENT_REGISTRY: CompleteAgentDefinition[] = [
  ...ALL_AGENTS,
  ...ALL_DOMAIN_AGENTS,
  ...CREATIVE_AGENTS,
  ...QA_AGENTS,
  ...DEVOPS_AGENTS,
  ...ALL_SPECIALIZED_AGENTS
];

// =============================================================================
// AGENT INDEXES
// =============================================================================

interface AgentIndexes {
  byId: Map<string, CompleteAgentDefinition>;
  byTier: Map<AgentTier, CompleteAgentDefinition[]>;
  byRomaLevel: Map<RomaLevel, CompleteAgentDefinition[]>;
  byCategory: Map<string, CompleteAgentDefinition[]>;
  byCapability: Map<string, CompleteAgentDefinition[]>;
  byOperationMode: Map<OperationMode, CompleteAgentDefinition[]>;
  bySecurityLevel: Map<string, CompleteAgentDefinition[]>;
}

// =============================================================================
// AGENT LOADER CLASS
// =============================================================================

export class AgentLoader {
  private static instance: AgentLoader;
  private agents: CompleteAgentDefinition[] = [];
  private indexes: AgentIndexes;
  private initialized: boolean = false;

  private constructor() {
    this.indexes = {
      byId: new Map(),
      byTier: new Map(),
      byRomaLevel: new Map(),
      byCategory: new Map(),
      byCapability: new Map(),
      byOperationMode: new Map(),
      bySecurityLevel: new Map()
    };
  }

  public static getInstance(): AgentLoader {
    if (!AgentLoader.instance) {
      AgentLoader.instance = new AgentLoader();
    }
    return AgentLoader.instance;
  }

  /**
   * Initialize the agent loader with all agents
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing WAI SDK Agent Loader...');
    const startTime = Date.now();

    // Load all agents
    this.agents = COMPLETE_AGENT_REGISTRY;

    // Build indexes
    this.buildIndexes();

    this.initialized = true;
    const duration = Date.now() - startTime;
    
    console.log(`✅ Agent Loader initialized in ${duration}ms`);
    console.log(`📊 Total Agents Loaded: ${this.agents.length}`);
    console.log(`   - Executive: ${this.indexes.byTier.get('executive')?.length || 0}`);
    console.log(`   - Development: ${this.indexes.byTier.get('development')?.length || 0}`);
    console.log(`   - Domain: ${this.indexes.byTier.get('domain')?.length || 0}`);
    console.log(`   - Creative: ${this.indexes.byTier.get('creative')?.length || 0}`);
    console.log(`   - QA: ${this.indexes.byTier.get('qa')?.length || 0}`);
    console.log(`   - DevOps: ${this.indexes.byTier.get('devops')?.length || 0}`);
  }

  private buildIndexes(): void {
    // Reset indexes
    this.indexes.byId.clear();
    this.indexes.byTier.clear();
    this.indexes.byRomaLevel.clear();
    this.indexes.byCategory.clear();
    this.indexes.byCapability.clear();
    this.indexes.byOperationMode.clear();
    this.indexes.bySecurityLevel.clear();

    for (const agent of this.agents) {
      // Index by ID
      this.indexes.byId.set(agent.id, agent);

      // Index by Tier
      if (!this.indexes.byTier.has(agent.tier)) {
        this.indexes.byTier.set(agent.tier, []);
      }
      this.indexes.byTier.get(agent.tier)!.push(agent);

      // Index by ROMA Level
      if (!this.indexes.byRomaLevel.has(agent.romaLevel)) {
        this.indexes.byRomaLevel.set(agent.romaLevel, []);
      }
      this.indexes.byRomaLevel.get(agent.romaLevel)!.push(agent);

      // Index by Category
      if (!this.indexes.byCategory.has(agent.category)) {
        this.indexes.byCategory.set(agent.category, []);
      }
      this.indexes.byCategory.get(agent.category)!.push(agent);

      // Index by Capability
      for (const capability of agent.capabilities) {
        if (!this.indexes.byCapability.has(capability)) {
          this.indexes.byCapability.set(capability, []);
        }
        this.indexes.byCapability.get(capability)!.push(agent);
      }

      // Index by Operation Mode
      for (const mode of agent.operationModes) {
        if (!this.indexes.byOperationMode.has(mode)) {
          this.indexes.byOperationMode.set(mode, []);
        }
        this.indexes.byOperationMode.get(mode)!.push(agent);
      }

      // Index by Security Level
      if (!this.indexes.bySecurityLevel.has(agent.securityLevel)) {
        this.indexes.bySecurityLevel.set(agent.securityLevel, []);
      }
      this.indexes.bySecurityLevel.get(agent.securityLevel)!.push(agent);
    }
  }

  // ==========================================================================
  // QUERY METHODS
  // ==========================================================================

  /**
   * Get all loaded agents
   */
  public getAllAgents(): CompleteAgentDefinition[] {
    return [...this.agents];
  }

  /**
   * Get agent by ID
   */
  public getAgentById(id: string): CompleteAgentDefinition | undefined {
    return this.indexes.byId.get(id);
  }

  /**
   * Get agents by tier
   */
  public getAgentsByTier(tier: AgentTier): CompleteAgentDefinition[] {
    return this.indexes.byTier.get(tier) || [];
  }

  /**
   * Get agents by ROMA level
   */
  public getAgentsByRomaLevel(level: RomaLevel): CompleteAgentDefinition[] {
    return this.indexes.byRomaLevel.get(level) || [];
  }

  /**
   * Get agents by category
   */
  public getAgentsByCategory(category: string): CompleteAgentDefinition[] {
    return this.indexes.byCategory.get(category) || [];
  }

  /**
   * Get agents by capability
   */
  public getAgentsByCapability(capability: string): CompleteAgentDefinition[] {
    return this.indexes.byCapability.get(capability) || [];
  }

  /**
   * Get agents by operation mode
   */
  public getAgentsByOperationMode(mode: OperationMode): CompleteAgentDefinition[] {
    return this.indexes.byOperationMode.get(mode) || [];
  }

  /**
   * Get agents that can work autonomously
   */
  public getAutonomousAgents(): CompleteAgentDefinition[] {
    return this.getAgentsByOperationMode('autonomous');
  }

  /**
   * Get agents that can participate in swarm coordination
   */
  public getSwarmCapableAgents(): CompleteAgentDefinition[] {
    return this.getAgentsByOperationMode('swarm');
  }

  /**
   * Get agents that can work in teams
   */
  public getTeamCapableAgents(): CompleteAgentDefinition[] {
    return this.getAgentsByOperationMode('team');
  }

  /**
   * Get agents that work in hierarchy mode
   */
  public getHierarchyAgents(): CompleteAgentDefinition[] {
    return this.getAgentsByOperationMode('hierarchy');
  }

  // ==========================================================================
  // AGENT SELECTION METHODS
  // ==========================================================================

  /**
   * Find the best agent for a task based on capabilities
   */
  public findBestAgentForTask(
    requiredCapabilities: string[],
    preferredTier?: AgentTier,
    minRomaLevel?: RomaLevel
  ): CompleteAgentDefinition | undefined {
    // Score agents based on capability match
    const scored: Array<{ agent: CompleteAgentDefinition; score: number }> = [];

    for (const agent of this.agents) {
      // Check tier preference
      if (preferredTier && agent.tier !== preferredTier) {
        continue;
      }

      // Check minimum ROMA level
      if (minRomaLevel) {
        const levelOrder = ['L1', 'L2', 'L3', 'L4'];
        if (levelOrder.indexOf(agent.romaLevel) < levelOrder.indexOf(minRomaLevel)) {
          continue;
        }
      }

      // Calculate capability match score
      const matchCount = requiredCapabilities.filter(cap => 
        agent.capabilities.includes(cap)
      ).length;

      if (matchCount > 0) {
        const score = matchCount / requiredCapabilities.length;
        scored.push({ agent, score });
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored[0]?.agent;
  }

  /**
   * Find agents that can handle a specific domain
   */
  public findAgentsForDomain(domain: string): CompleteAgentDefinition[] {
    const matchingAgents: CompleteAgentDefinition[] = [];
    
    for (const agent of this.agents) {
      if (
        agent.category.toLowerCase().includes(domain.toLowerCase()) ||
        agent.group.toLowerCase().includes(domain.toLowerCase()) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(domain.toLowerCase()))
      ) {
        matchingAgents.push(agent);
      }
    }

    return matchingAgents;
  }

  /**
   * Build a team of agents for a complex task
   */
  public buildTeamForTask(
    taskDescription: string,
    requiredCapabilities: string[],
    maxTeamSize: number = 5
  ): CompleteAgentDefinition[] {
    const team: CompleteAgentDefinition[] = [];
    const usedCapabilities = new Set<string>();

    // First, find a lead agent (preferably L3 or L4)
    const leadAgent = this.findBestAgentForTask(requiredCapabilities, undefined, 'L3');
    if (leadAgent) {
      team.push(leadAgent);
      leadAgent.capabilities.forEach(cap => usedCapabilities.add(cap));
    }

    // Fill remaining slots with specialists
    for (const capability of requiredCapabilities) {
      if (team.length >= maxTeamSize) break;
      if (usedCapabilities.has(capability)) continue;

      const specialists = this.getAgentsByCapability(capability);
      for (const specialist of specialists) {
        if (!team.includes(specialist)) {
          team.push(specialist);
          specialist.capabilities.forEach(cap => usedCapabilities.add(cap));
          break;
        }
      }
    }

    return team;
  }

  // ==========================================================================
  // HIERARCHY METHODS
  // ==========================================================================

  /**
   * Get the reporting chain for an agent
   */
  public getReportingChain(agentId: string): CompleteAgentDefinition[] {
    const chain: CompleteAgentDefinition[] = [];
    let current = this.getAgentById(agentId);

    while (current && current.reportsTo.length > 0) {
      const supervisor = this.getAgentById(current.reportsTo[0]);
      if (supervisor) {
        chain.push(supervisor);
        current = supervisor;
      } else {
        break;
      }
    }

    return chain;
  }

  /**
   * Get all agents managed by a given agent
   */
  public getManagedAgents(agentId: string): CompleteAgentDefinition[] {
    const agent = this.getAgentById(agentId);
    if (!agent) return [];

    return agent.manages
      .map(id => this.getAgentById(id))
      .filter((a): a is CompleteAgentDefinition => a !== undefined);
  }

  /**
   * Get collaborating agents
   */
  public getCollaborators(agentId: string): CompleteAgentDefinition[] {
    const agent = this.getAgentById(agentId);
    if (!agent) return [];

    return agent.collaboratesWith
      .map(id => this.getAgentById(id))
      .filter((a): a is CompleteAgentDefinition => a !== undefined);
  }

  // ==========================================================================
  // LANGUAGE SUPPORT
  // ==========================================================================

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): string[] {
    return ALL_LANGUAGES;
  }

  /**
   * Get agents that support a specific language
   */
  public getAgentsSupportingLanguage(languageCode: string): CompleteAgentDefinition[] {
    return this.agents.filter(agent => 
      agent.supportedLanguages.includes(languageCode)
    );
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Get agent statistics
   */
  public getStatistics(): {
    total: number;
    byTier: Record<string, number>;
    byRomaLevel: Record<string, number>;
    byOperationMode: Record<string, number>;
    bySecurityLevel: Record<string, number>;
    categoriesCount: number;
    capabilitiesCount: number;
  } {
    return {
      total: this.agents.length,
      byTier: Object.fromEntries(
        Array.from(this.indexes.byTier.entries()).map(([k, v]) => [k, v.length])
      ),
      byRomaLevel: Object.fromEntries(
        Array.from(this.indexes.byRomaLevel.entries()).map(([k, v]) => [k, v.length])
      ),
      byOperationMode: Object.fromEntries(
        Array.from(this.indexes.byOperationMode.entries()).map(([k, v]) => [k, v.length])
      ),
      bySecurityLevel: Object.fromEntries(
        Array.from(this.indexes.bySecurityLevel.entries()).map(([k, v]) => [k, v.length])
      ),
      categoriesCount: this.indexes.byCategory.size,
      capabilitiesCount: this.indexes.byCapability.size
    };
  }

  /**
   * Check if loader is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Get the singleton agent loader instance
 */
export function getAgentLoader(): AgentLoader {
  return AgentLoader.getInstance();
}

/**
 * Initialize and get all agents
 */
export async function loadAllAgents(): Promise<CompleteAgentDefinition[]> {
  const loader = getAgentLoader();
  await loader.initialize();
  return loader.getAllAgents();
}

/**
 * Quick access to find agent by ID
 */
export function findAgentById(id: string): CompleteAgentDefinition | undefined {
  const loader = getAgentLoader();
  return loader.getAgentById(id);
}

/**
 * Quick access to find agents by capability
 */
export function findAgentsByCapability(capability: string): CompleteAgentDefinition[] {
  const loader = getAgentLoader();
  return loader.getAgentsByCapability(capability);
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Initialize on import (can be awaited if needed)
const initPromise = getAgentLoader().initialize();

export { initPromise as agentLoaderReady };

// Export constants
export { 
  ALL_LANGUAGES, 
  SUPPORTED_LANGUAGES, 
  AGENTIC_PROTOCOLS, 
  OPERATION_MODES,
  COMPLETE_AGENT_REGISTRY
};
