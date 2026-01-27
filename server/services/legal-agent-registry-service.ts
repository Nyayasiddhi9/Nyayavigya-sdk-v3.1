/**
 * Legal Agent Registry Service - NyayaVighya v3.0
 * SINGLE SOURCE OF TRUTH for All 275 Legal Agents
 * 
 * Loads legal agents from:
 * projects_archive/NyayaVighya/agents/legal-agents-registry-v2-complete.json
 * 
 * Features:
 * - 275 specialized legal agents across 29 practice areas
 * - 4 jurisdictions: India, UAE, Singapore, Saudi Arabia
 * - 22-point agent structure with legal-specific extensions
 * - ROMA L1-L4 compliance
 * - Parlant protocol support
 * 
 * @version 3.0.0
 * @date January 25, 2026
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ================================================================================================
// LEGAL AGENT TYPE DEFINITIONS
// ================================================================================================

export interface LegalAgentGuardrails {
  parlantCompliant: boolean;
  barCouncilCompliant: boolean;
  clientConfidentiality: boolean;
  antiHallucination: boolean;
  requiresCitation: boolean;
  jurisdictionBound: boolean;
}

export interface LegalAgent {
  id: string;
  name: string;
  version: string;
  tier: 'executive' | 'senior' | 'specialist' | 'associate';
  romaLevel: 'L1' | 'L2' | 'L3' | 'L4';
  practiceArea: string;
  practiceAreaId: number;
  jurisdiction: string[];
  description: string;
  capabilities: string[];
  tools: string[];
  protocols: string[];
  preferredModels: string[];
  fallbackModels: string[];
  operationMode: string;
  securityLevel: string;
  reportsTo: string[];
  manages: string[];
  collaboratesWith: string[];
  supportedLanguages: string[];
  guardrails: LegalAgentGuardrails;
  costOptimization: {
    maxCostPerTask: number;
    preferCheaperModels: boolean;
  };
  status: 'active' | 'ready' | 'idle';
  legalCodes?: string[];
  caseCategories?: string[];
  systemPrompt?: string;
}

export interface LegalRegistryMetadata {
  version: string;
  name: string;
  description: string;
  totalAgents: number;
  practiceAreas: number;
  generatedAt: string;
  jurisdictions: string[];
  supportedLanguages: number;
  romaCompliant: boolean;
  parlantCompliant: boolean;
}

export interface LegalRegistryJSON {
  metadata: LegalRegistryMetadata;
  tierSummary: Record<string, number>;
  practiceAreaSummary: Array<{ id: number; name: string; agentCount: number }>;
  agents: LegalAgent[];
}

// ================================================================================================
// LEGAL AGENT REGISTRY SERVICE
// ================================================================================================

export class LegalAgentRegistryService extends EventEmitter {
  private static instance: LegalAgentRegistryService;
  private agents: Map<string, LegalAgent> = new Map();
  private metadata: LegalRegistryMetadata | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private readonly jsonFilePath: string;

  private constructor() {
    super();
    this.jsonFilePath = path.resolve(
      process.cwd(), 
      'projects_archive/NyayaVighya/agents/legal-agents-registry-v2-complete.json'
    );
    console.log('⚖️ LegalAgentRegistryService instance created');
    console.log(`   📂 Source: ${this.jsonFilePath}`);
  }

  public static getInstance(): LegalAgentRegistryService {
    if (!LegalAgentRegistryService.instance) {
      LegalAgentRegistryService.instance = new LegalAgentRegistryService();
    }
    return LegalAgentRegistryService.instance;
  }

  /**
   * Initialize the legal agent registry
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('⚖️ Initializing LegalAgentRegistryService...');
      const startTime = Date.now();

      await this.loadAgentsFromJSON();

      const loadTime = Date.now() - startTime;
      this.isInitialized = true;

      console.log(`✅ LegalAgentRegistryService initialized`);
      console.log(`   📊 Legal Agents Loaded: ${this.agents.size}`);
      console.log(`   ⏱️  Load Time: ${loadTime}ms`);
      console.log(`   📋 Practice Areas: ${this.metadata?.practiceAreas}`);
      console.log(`   🌍 Jurisdictions: ${this.metadata?.jurisdictions.join(', ')}`);

      this.emit('initialized', {
        totalAgents: this.agents.size,
        loadTime,
        metadata: this.metadata
      });
    } catch (error) {
      console.error('❌ Failed to initialize LegalAgentRegistryService:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Load all legal agents from JSON
   */
  private async loadAgentsFromJSON(): Promise<void> {
    console.log('📦 Loading legal agents from JSON...');

    try {
      if (!fs.existsSync(this.jsonFilePath)) {
        console.warn(`⚠️ Legal agents registry not found: ${this.jsonFilePath}`);
        console.warn('   Legal chat features will be limited');
        return;
      }

      const fileContent = fs.readFileSync(this.jsonFilePath, 'utf-8');
      const registryData: LegalRegistryJSON = JSON.parse(fileContent);

      this.metadata = registryData.metadata;
      console.log(`   📋 Registry: ${this.metadata.name} v${this.metadata.version}`);

      let loadedCount = 0;
      for (const agentData of registryData.agents) {
        try {
          const agent = this.normalizeAgent(agentData);
          this.agents.set(agent.id, agent);
          loadedCount++;
        } catch (error) {
          console.warn(`⚠️ Skipping invalid legal agent: ${agentData.id}`);
        }
      }

      console.log(`✅ Loaded ${loadedCount} legal agents`);

    } catch (error) {
      console.error('❌ Error loading legal agents:', error);
      throw error;
    }
  }

  /**
   * Normalize agent data
   */
  private normalizeAgent(agentData: any): LegalAgent {
    return {
      id: agentData.id,
      name: agentData.name || agentData.id,
      version: agentData.version || '1.0.0',
      tier: agentData.tier || 'associate',
      romaLevel: agentData.romaLevel || 'L2',
      practiceArea: agentData.practiceArea || 'General',
      practiceAreaId: agentData.practiceAreaId || 0,
      jurisdiction: agentData.jurisdiction || ['India'],
      description: agentData.description || '',
      capabilities: agentData.capabilities || [],
      tools: agentData.tools || [],
      protocols: agentData.protocols || ['A2A', 'MCP', 'ROMA'],
      preferredModels: agentData.preferredModels || ['claude-opus-4.5', 'gpt-5.1'],
      fallbackModels: agentData.fallbackModels || ['claude-sonnet-4.5', 'gpt-4o'],
      operationMode: agentData.operationMode || 'supervised',
      securityLevel: agentData.securityLevel || 'high',
      reportsTo: agentData.reportsTo || [],
      manages: agentData.manages || [],
      collaboratesWith: agentData.collaboratesWith || [],
      supportedLanguages: agentData.supportedLanguages || ['en', 'hi'],
      guardrails: {
        parlantCompliant: true,
        barCouncilCompliant: true,
        clientConfidentiality: true,
        antiHallucination: true,
        requiresCitation: true,
        jurisdictionBound: true,
        ...agentData.guardrails
      },
      costOptimization: agentData.costOptimization || {
        maxCostPerTask: 0.5,
        preferCheaperModels: true
      },
      status: agentData.status || 'active',
      legalCodes: agentData.legalCodes,
      caseCategories: agentData.caseCategories,
      systemPrompt: agentData.systemPrompt
    };
  }

  // ================================================================================================
  // PUBLIC API
  // ================================================================================================

  public getAgent(id: string): LegalAgent | undefined {
    return this.agents.get(id);
  }

  public getAllAgents(): LegalAgent[] {
    return Array.from(this.agents.values());
  }

  public getAgentsByPracticeArea(practiceArea: string): LegalAgent[] {
    return this.getAllAgents().filter(a => 
      a.practiceArea.toLowerCase() === practiceArea.toLowerCase()
    );
  }

  public getAgentsByJurisdiction(jurisdiction: string): LegalAgent[] {
    return this.getAllAgents().filter(a => 
      a.jurisdiction.includes(jurisdiction)
    );
  }

  public getAgentsByTier(tier: string): LegalAgent[] {
    return this.getAllAgents().filter(a => a.tier === tier);
  }

  public getStats(): {
    totalAgents: number;
    byTier: Record<string, number>;
    byPracticeArea: Record<string, number>;
    byJurisdiction: Record<string, number>;
  } {
    const agents = this.getAllAgents();
    
    const byTier: Record<string, number> = {};
    const byPracticeArea: Record<string, number> = {};
    const byJurisdiction: Record<string, number> = {};

    for (const agent of agents) {
      byTier[agent.tier] = (byTier[agent.tier] || 0) + 1;
      byPracticeArea[agent.practiceArea] = (byPracticeArea[agent.practiceArea] || 0) + 1;
      for (const j of agent.jurisdiction) {
        byJurisdiction[j] = (byJurisdiction[j] || 0) + 1;
      }
    }

    return {
      totalAgents: agents.length,
      byTier,
      byPracticeArea,
      byJurisdiction
    };
  }

  public isInitializedState(): boolean {
    return this.isInitialized;
  }

  public getMetadata(): LegalRegistryMetadata | null {
    return this.metadata;
  }
}

// Export singleton
export const legalAgentRegistry = LegalAgentRegistryService.getInstance();
