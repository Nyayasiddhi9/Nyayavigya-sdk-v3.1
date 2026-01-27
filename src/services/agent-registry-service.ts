/**
 * Agent Registry Service - SINGLE SOURCE OF TRUTH for All 275 Agents
 * WAI SDK v2.0 - January 16, 2026
 * 
 * CRITICAL FIX (January 17, 2026):
 * - Loads ALL 275 agents from wai-sdk/packages/agents/agents-registry-v2.json
 * - Legacy path all-267-agents.json is deprecated
 * - JSON file is the SINGLE SOURCE OF TRUTH
 * - Each agent has complete 22-point structure per Parlant standards
 * - Supports A2A, MCP, AG-UI, ROMA L1-L4, Parlant, BMAD protocols
 * 
 * Agent Tier Distribution:
 * - Executive: 25 agents (L4)
 * - Development: 71 agents (L2-L3)
 * - Domain: 127 agents (L2-L3)
 * - Creative: 20 agents (L2)
 * - QA: 15 agents (L2)
 * - DevOps: 17 agents (L2-L3)
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ================================================================================================
// TYPE DEFINITIONS (22-Point Agent Structure)
// ================================================================================================

export interface AgentGuardrails {
  parlantCompliant: boolean;
  antiHallucination: boolean;
  piiProtection: boolean;
  requiresCitation: boolean;
}

export interface AgentCostOptimization {
  maxCostPerTask: number;
  preferCheaperModels: boolean;
}

export interface Agent {
  id: string;
  name: string;
  version: string;
  tier: 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain';
  romaLevel: 'L1' | 'L2' | 'L3' | 'L4';
  category: string;
  group: string;
  description: string;
  capabilities: string[];
  tools: string[];
  protocols: string[];
  preferredModels: string[];
  fallbackModels: string[];
  operationMode: 'autonomous' | 'supervised' | 'standalone' | 'group';
  securityLevel: 'critical' | 'high' | 'medium' | 'low';
  reportsTo: string[];
  manages: string[];
  collaboratesWith: string[];
  supportedLanguages: string[];
  guardrails: AgentGuardrails;
  costOptimization: AgentCostOptimization;
  status: 'active' | 'ready' | 'idle' | 'executing' | 'failed';
  // Runtime stats
  lastExecutionTime?: number;
  totalExecutions?: number;
  successRate?: number;
  systemPrompt?: string;
  model?: string;
}

export interface AgentRegistryMetadata {
  version: string;
  generatedAt: string;
  totalAgents: number;
  description: string;
  protocols: string[];
  llmProviders: number;
  models: number;
  mcpTools: number;
}

export interface AgentRegistryJSON {
  metadata: AgentRegistryMetadata;
  tiers: Record<string, number>;
  agents: Agent[];
}

export interface AgentStats {
  totalAgents: number;
  byTier: Record<string, number>;
  byRomaLevel: Record<string, number>;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  protocols: string[];
  version: string;
}

// ================================================================================================
// AGENT REGISTRY SERVICE
// ================================================================================================

export class AgentRegistryService extends EventEmitter {
  private static instance: AgentRegistryService;
  private agents: Map<string, Agent> = new Map();
  private metadata: AgentRegistryMetadata | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private jsonFilePath: string;

  private constructor() {
    super();
    // WAI SDK v2.0 - Use agents-registry-v2.json as SINGLE SOURCE OF TRUTH for all 275 agents
    this.jsonFilePath = path.resolve(process.cwd(), 'wai-sdk/packages/agents/agents-registry-v2.json');
    console.log('🤖 AgentRegistryService instance created (WAI SDK v2.0)');
    console.log(`   📂 Source: ${this.jsonFilePath}`);
  }

  public static getInstance(): AgentRegistryService {
    if (!AgentRegistryService.instance) {
      AgentRegistryService.instance = new AgentRegistryService();
    }
    return AgentRegistryService.instance;
  }

  /**
   * Initialize the agent registry by loading all 275 agents from JSON
   * This is called once at server startup
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ AgentRegistryService already initialized');
      return;
    }

    if (this.initializationPromise) {
      console.log('⏳ AgentRegistryService initialization in progress, waiting...');
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing AgentRegistryService - Loading all 275 agents from JSON...');
      const startTime = Date.now();

      // Load agents from JSON file (SINGLE SOURCE OF TRUTH)
      await this.loadAgentsFromJSON();

      const loadTime = Date.now() - startTime;
      this.isInitialized = true;

      console.log(`✅ AgentRegistryService initialized successfully`);
      console.log(`   📊 Total Agents Loaded: ${this.agents.size}`);
      console.log(`   ⏱️  Load Time: ${loadTime}ms`);
      console.log(`   📈 Tier Breakdown: ${this.getLoadBreakdown()}`);
      console.log(`   🔗 Protocols: ${this.metadata?.protocols.join(', ')}`);

      this.emit('initialized', { 
        totalAgents: this.agents.size, 
        loadTime,
        metadata: this.metadata 
      });
    } catch (error) {
      console.error('❌ Failed to initialize AgentRegistryService:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Load all 275 agents from the JSON file
   * This is the SINGLE SOURCE OF TRUTH for all agents
   */
  private async loadAgentsFromJSON(): Promise<void> {
    console.log('📦 Loading agents from JSON file (SINGLE SOURCE OF TRUTH)...');
    
    try {
      // Check if file exists
      if (!fs.existsSync(this.jsonFilePath)) {
        throw new Error(`Agent registry JSON file not found: ${this.jsonFilePath}`);
      }

      // Read and parse JSON file
      const fileContent = fs.readFileSync(this.jsonFilePath, 'utf-8');
      const registryData: AgentRegistryJSON = JSON.parse(fileContent);

      // Store metadata
      this.metadata = registryData.metadata;
      console.log(`   📋 Registry Version: ${this.metadata.version}`);
      console.log(`   📅 Generated: ${this.metadata.generatedAt}`);
      console.log(`   📝 Description: ${this.metadata.description}`);

      // Validate expected tier counts
      const expectedTiers = registryData.tiers;
      console.log(`   📊 Expected Tiers: ${JSON.stringify(expectedTiers)}`);

      // Load all agents
      let loadedCount = 0;
      let skippedCount = 0;

      for (const agentData of registryData.agents) {
        try {
          // Validate agent has required 22-point structure
          const agent = this.validateAndNormalizeAgent(agentData);
          this.agents.set(agent.id, agent);
          loadedCount++;
        } catch (validationError) {
          console.warn(`⚠️ Skipping invalid agent: ${agentData.id} - ${validationError}`);
          skippedCount++;
        }
      }

      console.log(`✅ Loaded ${loadedCount} agents from JSON file`);
      if (skippedCount > 0) {
        console.warn(`⚠️ Skipped ${skippedCount} invalid agents`);
      }

      // Verify tier counts match
      this.verifyTierCounts(expectedTiers);

    } catch (error) {
      console.error('❌ Error loading agents from JSON:', error);
      throw error;
    }
  }

  /**
   * Validate and normalize an agent to ensure 22-point structure
   */
  private validateAndNormalizeAgent(agentData: any): Agent {
    // Required fields validation
    if (!agentData.id || typeof agentData.id !== 'string') {
      throw new Error('Agent missing required field: id');
    }
    if (!agentData.name || typeof agentData.name !== 'string') {
      throw new Error('Agent missing required field: name');
    }

    // Normalize tier
    const tier = this.normalizeTier(agentData.tier);
    
    // Normalize ROMA level
    const romaLevel = this.normalizeRomaLevel(agentData.romaLevel);

    // Build normalized agent with all 22 points
    const agent: Agent = {
      // Identity (3 points)
      id: agentData.id,
      name: agentData.name,
      version: agentData.version || '10.0.0',
      
      // Classification (4 points)
      tier,
      romaLevel,
      category: agentData.category || tier,
      group: agentData.group || agentData.category || tier,
      
      // Description (1 point)
      description: agentData.description || `${agentData.name} agent`,
      
      // Capabilities (3 points)
      capabilities: Array.isArray(agentData.capabilities) ? agentData.capabilities : [],
      tools: Array.isArray(agentData.tools) ? agentData.tools : [],
      protocols: Array.isArray(agentData.protocols) ? agentData.protocols : ['A2A', 'MCP'],
      
      // Model preferences (2 points)
      preferredModels: Array.isArray(agentData.preferredModels) ? agentData.preferredModels : ['claude-sonnet-4'],
      fallbackModels: Array.isArray(agentData.fallbackModels) ? agentData.fallbackModels : ['gpt-4o'],
      
      // Operation (2 points)
      operationMode: agentData.operationMode || 'autonomous',
      securityLevel: agentData.securityLevel || 'medium',
      
      // Hierarchy (3 points)
      reportsTo: Array.isArray(agentData.reportsTo) ? agentData.reportsTo : [],
      manages: Array.isArray(agentData.manages) ? agentData.manages : [],
      collaboratesWith: Array.isArray(agentData.collaboratesWith) ? agentData.collaboratesWith : [],
      
      // Languages (1 point)
      supportedLanguages: Array.isArray(agentData.supportedLanguages) ? agentData.supportedLanguages : ['en'],
      
      // Guardrails (1 point - object)
      guardrails: {
        parlantCompliant: agentData.guardrails?.parlantCompliant ?? true,
        antiHallucination: agentData.guardrails?.antiHallucination ?? true,
        piiProtection: agentData.guardrails?.piiProtection ?? true,
        requiresCitation: agentData.guardrails?.requiresCitation ?? false
      },
      
      // Cost optimization (1 point - object)
      costOptimization: {
        maxCostPerTask: agentData.costOptimization?.maxCostPerTask ?? 1.0,
        preferCheaperModels: agentData.costOptimization?.preferCheaperModels ?? true
      },
      
      // Status (1 point)
      status: agentData.status || 'active',
      
      // Runtime stats (not from JSON, initialized)
      totalExecutions: 0,
      successRate: 1.0,
      
      // Legacy compatibility
      model: agentData.preferredModels?.[0] || 'claude-sonnet-4',
      systemPrompt: agentData.systemPrompt || this.generateSystemPrompt(agentData)
    };

    return agent;
  }

  /**
   * Generate a system prompt for agents that don't have one
   */
  private generateSystemPrompt(agentData: any): string {
    const capabilities = Array.isArray(agentData.capabilities) 
      ? agentData.capabilities.join(', ') 
      : 'general assistance';
    
    return `You are ${agentData.name}, a specialized AI agent in the ${agentData.category || agentData.tier} domain. 
Your core capabilities include: ${capabilities}.
You operate at ROMA autonomy level ${agentData.romaLevel || 'L2'}.
Always follow Parlant communication standards and provide accurate, helpful responses.
If you're unsure about something, acknowledge uncertainty rather than hallucinating.`;
  }

  /**
   * Verify tier counts match expected values from JSON metadata
   */
  private verifyTierCounts(expectedTiers: Record<string, number>): void {
    const actualCounts: Record<string, number> = {};
    
    for (const agent of this.agents.values()) {
      actualCounts[agent.tier] = (actualCounts[agent.tier] || 0) + 1;
    }

    let mismatchFound = false;
    for (const [tier, expected] of Object.entries(expectedTiers)) {
      const actual = actualCounts[tier] || 0;
      if (actual !== expected) {
        console.warn(`⚠️ Tier mismatch: ${tier} - Expected: ${expected}, Actual: ${actual}`);
        mismatchFound = true;
      }
    }

    if (!mismatchFound) {
      console.log('✅ All tier counts verified correctly');
    }
  }

  /**
   * Normalize tier string to valid Agent tier
   */
  private normalizeTier(tier: any): 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain' {
    const tierMap: Record<string, 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain'> = {
      'executive': 'executive',
      'exec': 'executive',
      'leadership': 'executive',
      'c-suite': 'executive',
      'development': 'development',
      'dev': 'development',
      'engineering': 'development',
      'creative': 'creative',
      'design': 'creative',
      'content': 'creative',
      'qa': 'qa',
      'quality': 'qa',
      'testing': 'qa',
      'devops': 'devops',
      'ops': 'devops',
      'infrastructure': 'devops',
      'domain': 'domain',
      'specialist': 'domain',
      'expert': 'domain'
    };

    const normalizedTier = String(tier || '').toLowerCase();
    return tierMap[normalizedTier] || 'domain';
  }

  /**
   * Normalize ROMA level string to valid Agent ROMA level
   */
  private normalizeRomaLevel(romaLevel: any): 'L1' | 'L2' | 'L3' | 'L4' {
    const romaMap: Record<string, 'L1' | 'L2' | 'L3' | 'L4'> = {
      'L1': 'L1', 'L2': 'L2', 'L3': 'L3', 'L4': 'L4',
      'l1': 'L1', 'l2': 'L2', 'l3': 'L3', 'l4': 'L4',
      '1': 'L1', '2': 'L2', '3': 'L3', '4': 'L4'
    };

    const normalized = String(romaLevel || '').toUpperCase();
    return romaMap[normalized] || 'L2';
  }

  // ================================================================================================
  // PUBLIC API METHODS
  // ================================================================================================

  public isReady(): boolean {
    return this.isInitialized;
  }

  public async waitForReady(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  public getAllAgentsMap(): Map<string, Agent> {
    return new Map(this.agents);
  }

  public getAgentsByTier(tier: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.tier === tier);
  }

  public getAgentsByRomaLevel(romaLevel: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.romaLevel === romaLevel);
  }

  public getAgentsByCategory(category: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.category.toLowerCase() === category.toLowerCase()
    );
  }

  public getAgentsByCapability(capability: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.capabilities.some(cap => cap.toLowerCase().includes(capability.toLowerCase()))
    );
  }

  public getAgentsByProtocol(protocol: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.protocols.some(p => p.toLowerCase() === protocol.toLowerCase())
    );
  }

  public getTotalAgents(): number {
    return this.agents.size;
  }

  public getMetadata(): AgentRegistryMetadata | null {
    return this.metadata;
  }

  public getStats(): AgentStats {
    const agents = Array.from(this.agents.values());
    
    const byTier = agents.reduce((acc, agent) => {
      acc[agent.tier] = (acc[agent.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byRomaLevel = agents.reduce((acc, agent) => {
      acc[agent.romaLevel] = (acc[agent.romaLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = agents.reduce((acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = agents.reduce((acc, agent) => {
      acc[agent.category] = (acc[agent.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAgents: agents.length,
      byTier,
      byRomaLevel,
      byStatus,
      byCategory,
      protocols: this.metadata?.protocols || ['A2A', 'MCP', 'ROMA', 'Parlant', 'AG-UI'],
      version: this.metadata?.version || '10.0.0'
    };
  }

  /**
   * Find best agent for a given task based on capabilities
   */
  public findBestAgentForTask(taskType: string, requiredCapabilities: string[] = []): Agent | undefined {
    const candidates = Array.from(this.agents.values())
      .filter(agent => agent.status === 'active')
      .filter(agent => {
        if (requiredCapabilities.length === 0) return true;
        return requiredCapabilities.some(cap => 
          agent.capabilities.some(agentCap => 
            agentCap.toLowerCase().includes(cap.toLowerCase())
          )
        );
      })
      .sort((a, b) => {
        // Prefer higher ROMA levels for complex tasks
        const romaOrder = { 'L4': 4, 'L3': 3, 'L2': 2, 'L1': 1 };
        return romaOrder[b.romaLevel] - romaOrder[a.romaLevel];
      });

    return candidates[0];
  }

  /**
   * Find agents for multi-agent collaboration
   */
  public findAgentsForCollaboration(taskTypes: string[], maxAgents: number = 5): Agent[] {
    const selectedAgents: Agent[] = [];
    const usedCategories = new Set<string>();

    for (const taskType of taskTypes) {
      if (selectedAgents.length >= maxAgents) break;

      const agent = Array.from(this.agents.values())
        .filter(a => a.status === 'active')
        .filter(a => !usedCategories.has(a.category))
        .filter(a => 
          a.capabilities.some(cap => cap.toLowerCase().includes(taskType.toLowerCase())) ||
          a.category.toLowerCase().includes(taskType.toLowerCase())
        )
        .sort((a, b) => {
          const romaOrder = { 'L4': 4, 'L3': 3, 'L2': 2, 'L1': 1 };
          return romaOrder[b.romaLevel] - romaOrder[a.romaLevel];
        })[0];

      if (agent) {
        selectedAgents.push(agent);
        usedCategories.add(agent.category);
      }
    }

    return selectedAgents;
  }

  private getLoadBreakdown(): string {
    const stats = this.getStats();
    return `Executive: ${stats.byTier['executive'] || 0}, Dev: ${stats.byTier['development'] || 0}, Domain: ${stats.byTier['domain'] || 0}, Creative: ${stats.byTier['creative'] || 0}, QA: ${stats.byTier['qa'] || 0}, DevOps: ${stats.byTier['devops'] || 0}`;
  }
}

// Export singleton instance
export const agentRegistry = AgentRegistryService.getInstance();
