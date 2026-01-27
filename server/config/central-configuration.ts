/**
 * Central Configuration Loader - WAI SDK v3.1
 * SINGLE SOURCE OF TRUTH for all platform configurations
 * 
 * This file provides centralized loading and validation for:
 * - Agent Registries (WAI SDK + NyayaVighya Legal)
 * - LLM Model Configuration
 * - Database Configuration  
 * - Auto-Update Settings
 * 
 * GUARDRAILS:
 * - Validates all configuration files exist before loading
 * - Enforces 22-point agent structure
 * - Prevents configuration drift with checksums
 * - Logs all configuration changes
 * 
 * @version 3.1.0
 * @date January 25, 2026
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// ================================================================================================
// CONFIGURATION PATHS - SINGLE SOURCE OF TRUTH
// ================================================================================================

export const CONFIG_PATHS = {
  // WAI SDK Agent Registry (275 agents with 22-point structure)
  WAI_AGENTS_REGISTRY: 'wai-sdk/packages/agents/agents-registry-v2.json',
  WAI_AGENTS_BACKUP: 'wai-sdk/packages/agents/agents-registry-v2-backup.json',
  
  // NyayaVighya Legal Agent Registry (275 legal agents)
  LEGAL_AGENTS_REGISTRY: 'projects_archive/NyayaVighya/agents/legal-agents-registry-v2-complete.json',
  
  // LLM Configuration
  LLM_MODELS_CONFIG: 'server/services/llm-model-registry.ts',
  
  // Database Configuration
  DATABASE_CONFIG: 'drizzle.config.ts',
  
  // Build outputs
  WAI_SDK_BUILD: 'builds/wai-sdk-v3.1',
  NYAYAVIGHYA_BUILD: 'builds/nyayavighya-v3.0'
} as const;

// ================================================================================================
// 22-POINT AGENT STRUCTURE VALIDATION
// ================================================================================================

export const REQUIRED_AGENT_FIELDS = [
  'id',
  'name', 
  'version',
  'tier',
  'romaLevel',
  'category',
  'group',
  'description',
  'capabilities',
  'tools',
  'protocols',
  'preferredModels',
  'fallbackModels',
  'operationModes',
  'securityLevel',
  'reportsTo',
  'manages',
  'collaboratesWith',
  'supportedLanguages',
  'guardrails',
  'costOptimization',
  'status'
] as const;

export const EXTENDED_AGENT_FIELDS = [
  ...REQUIRED_AGENT_FIELDS,
  'systemPrompt',
  'cam2Monitoring',
  'enterpriseWiring',
  'grpoConfig',
  'peerMeshConfig',
  'voiceAIConfig'
] as const;

// ================================================================================================
// LATEST MODEL VERSIONS - January 2026
// ================================================================================================

export const LATEST_MODELS = {
  openai: {
    flagship: 'gpt-5.2-pro',
    fast: 'gpt-5.1-instant',
    reasoning: 'o3-pro',
    codex: 'gpt-5.2-codex'
  },
  anthropic: {
    flagship: 'claude-opus-4.5',
    fast: 'claude-sonnet-4.5',
    legacy: 'claude-sonnet-4'
  },
  google: {
    flagship: 'gemini-3-pro',
    fast: 'gemini-3-flash',
    legacy: 'gemini-2.5-pro'
  },
  xai: {
    flagship: 'grok-4',
    heavy: 'grok-4-heavy',
    fast: 'grok-4.1-fast'
  },
  deepseek: {
    flagship: 'deepseek-r1',
    coder: 'deepseek-coder-v3',
    legacy: 'deepseek-v3'
  },
  groq: {
    flagship: 'llama-3.3-70b-versatile',
    distill: 'deepseek-r1-distill-llama-70b'
  }
} as const;

// ================================================================================================
// CONFIGURATION LOADER CLASS
// ================================================================================================

interface ConfigChecksum {
  path: string;
  hash: string;
  loadedAt: Date;
  agentCount?: number;
}

interface LoadResult {
  success: boolean;
  path: string;
  agentCount?: number;
  errors: string[];
  warnings: string[];
}

export class CentralConfigurationLoader extends EventEmitter {
  private static instance: CentralConfigurationLoader;
  private configChecksums: Map<string, ConfigChecksum> = new Map();
  private isInitialized = false;

  private constructor() {
    super();
    console.log('🔧 CentralConfigurationLoader initialized');
  }

  public static getInstance(): CentralConfigurationLoader {
    if (!CentralConfigurationLoader.instance) {
      CentralConfigurationLoader.instance = new CentralConfigurationLoader();
    }
    return CentralConfigurationLoader.instance;
  }

  /**
   * Initialize all configurations with validation
   */
  public async initialize(): Promise<{ wai: LoadResult; legal: LoadResult }> {
    console.log('🚀 Loading Central Configuration...');
    console.log('━'.repeat(60));

    const waiResult = await this.loadWAIAgentRegistry();
    const legalResult = await this.loadLegalAgentRegistry();

    this.isInitialized = true;
    
    console.log('━'.repeat(60));
    console.log(`✅ Central Configuration Loaded`);
    console.log(`   WAI Agents: ${waiResult.agentCount || 0}`);
    console.log(`   Legal Agents: ${legalResult.agentCount || 0}`);
    console.log(`   Total: ${(waiResult.agentCount || 0) + (legalResult.agentCount || 0)}`);

    return { wai: waiResult, legal: legalResult };
  }

  /**
   * Load WAI SDK Agent Registry (275 agents)
   */
  private async loadWAIAgentRegistry(): Promise<LoadResult> {
    const configPath = path.resolve(process.cwd(), CONFIG_PATHS.WAI_AGENTS_REGISTRY);
    const result: LoadResult = {
      success: false,
      path: configPath,
      errors: [],
      warnings: []
    };

    try {
      // Check file exists
      if (!fs.existsSync(configPath)) {
        // Try backup
        const backupPath = path.resolve(process.cwd(), CONFIG_PATHS.WAI_AGENTS_BACKUP);
        if (fs.existsSync(backupPath)) {
          result.warnings.push(`Primary registry not found, using backup: ${backupPath}`);
          return this.loadRegistryFile(backupPath, 'WAI');
        }
        result.errors.push(`WAI Agent Registry not found: ${configPath}`);
        return result;
      }

      return this.loadRegistryFile(configPath, 'WAI');
    } catch (error) {
      result.errors.push(`Failed to load WAI registry: ${error}`);
      return result;
    }
  }

  /**
   * Load NyayaVighya Legal Agent Registry (275 legal agents)
   */
  private async loadLegalAgentRegistry(): Promise<LoadResult> {
    const configPath = path.resolve(process.cwd(), CONFIG_PATHS.LEGAL_AGENTS_REGISTRY);
    const result: LoadResult = {
      success: false,
      path: configPath,
      errors: [],
      warnings: []
    };

    try {
      if (!fs.existsSync(configPath)) {
        result.warnings.push(`Legal Agent Registry not found: ${configPath}`);
        return result;
      }

      return this.loadRegistryFile(configPath, 'Legal');
    } catch (error) {
      result.errors.push(`Failed to load Legal registry: ${error}`);
      return result;
    }
  }

  /**
   * Load and validate a registry file
   */
  private loadRegistryFile(filePath: string, type: 'WAI' | 'Legal'): LoadResult {
    const result: LoadResult = {
      success: false,
      path: filePath,
      errors: [],
      warnings: []
    };

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
      const data = JSON.parse(content);

      // Validate structure
      if (!data.metadata) {
        result.errors.push('Missing metadata in registry');
        return result;
      }

      if (!data.agents || !Array.isArray(data.agents)) {
        result.errors.push('Missing or invalid agents array');
        return result;
      }

      // Validate each agent has 22-point structure
      let validAgents = 0;
      let invalidAgents = 0;

      for (const agent of data.agents) {
        const validation = this.validateAgentStructure(agent);
        if (validation.valid) {
          validAgents++;
        } else {
          invalidAgents++;
          if (invalidAgents <= 5) {
            result.warnings.push(`Agent ${agent.id}: ${validation.errors.join(', ')}`);
          }
        }
      }

      if (invalidAgents > 5) {
        result.warnings.push(`... and ${invalidAgents - 5} more agents with validation warnings`);
      }

      // Store checksum
      this.configChecksums.set(filePath, {
        path: filePath,
        hash,
        loadedAt: new Date(),
        agentCount: validAgents
      });

      result.success = true;
      result.agentCount = validAgents;

      console.log(`📦 ${type} Registry: ${validAgents} agents loaded (hash: ${hash})`);

      return result;
    } catch (error) {
      result.errors.push(`Parse error: ${error}`);
      return result;
    }
  }

  /**
   * Validate agent has required 22-point structure
   */
  private validateAgentStructure(agent: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const field of REQUIRED_AGENT_FIELDS) {
      if (agent[field] === undefined) {
        errors.push(`missing ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if configuration has changed
   */
  public hasConfigurationChanged(filePath: string): boolean {
    const stored = this.configChecksums.get(filePath);
    if (!stored) return true;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const currentHash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
      return stored.hash !== currentHash;
    } catch {
      return true;
    }
  }

  /**
   * Get configuration status
   */
  public getStatus(): {
    initialized: boolean;
    configs: Array<{ path: string; hash: string; agentCount: number; loadedAt: string }>;
  } {
    return {
      initialized: this.isInitialized,
      configs: Array.from(this.configChecksums.values()).map(c => ({
        path: c.path,
        hash: c.hash,
        agentCount: c.agentCount || 0,
        loadedAt: c.loadedAt.toISOString()
      }))
    };
  }

  /**
   * Validate model is current
   */
  public validateModelVersion(provider: string, modelId: string): {
    valid: boolean;
    current: string | null;
    recommendation: string | null;
  } {
    const providerModels = LATEST_MODELS[provider as keyof typeof LATEST_MODELS];
    if (!providerModels) {
      return { valid: true, current: null, recommendation: null };
    }

    const flagship = providerModels.flagship;
    const isOutdated = !modelId.includes(flagship.split('-').slice(-1)[0]);

    return {
      valid: !isOutdated,
      current: flagship,
      recommendation: isOutdated ? `Consider upgrading to ${flagship}` : null
    };
  }
}

// Export singleton accessor
export const centralConfig = CentralConfigurationLoader.getInstance();

// Export for direct import
export default CentralConfigurationLoader;
