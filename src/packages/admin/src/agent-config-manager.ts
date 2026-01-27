/**
 * Agent Configuration Manager
 * Full configuration management for all 267 agents
 */

import { EventEmitter } from 'events';
import { allUnifiedAgents, UnifiedAgentConfig } from '../../agents/src/definitions/unified-267-agents-registry';

export interface AgentConfiguration {
  id: string;
  name: string;
  enabled: boolean;
  tier: string;
  romaLevel: string;
  model: string;
  modelSelectionMode: 'auto' | 'defined' | 'selected';
  group: string;
  systemPrompt: string;
  capabilities: string[];
  tools: string[];
  protocols: string[];
  operationMode: string;
  languages: string[];
  guardRails: {
    parlantCompliance: boolean;
    securityLevel: string;
    piiProtection: boolean;
  };
  version: number;
  lastModified: Date;
}

export interface ConfigurationDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export class AgentConfigManager extends EventEmitter {
  private static instance: AgentConfigManager;
  private configurations: Map<string, AgentConfiguration> = new Map();
  private configHistory: Map<string, AgentConfiguration[]> = new Map();

  private constructor() {
    super();
    this.loadFromUnifiedRegistry();
    console.log('⚙️ AgentConfigManager initialized with 267 agents');
  }

  private loadFromUnifiedRegistry(): void {
    for (const agent of allUnifiedAgents) {
      const config: AgentConfiguration = {
        id: agent.id,
        name: agent.name,
        enabled: agent.status === 'active',
        tier: agent.tier,
        romaLevel: agent.romaLevel,
        model: agent.model,
        modelSelectionMode: agent.model === 'auto' ? 'auto' : 'defined',
        group: agent.group || 'default',
        systemPrompt: agent.systemPrompt,
        capabilities: agent.capabilities,
        tools: agent.tools,
        protocols: agent.protocols,
        operationMode: agent.operationMode,
        languages: agent.supportedLanguages,
        guardRails: agent.guardRails,
        version: 1,
        lastModified: new Date()
      };
      this.configurations.set(agent.id, config);
    }
  }

  public static getInstance(): AgentConfigManager {
    if (!AgentConfigManager.instance) {
      AgentConfigManager.instance = new AgentConfigManager();
    }
    return AgentConfigManager.instance;
  }

  public async getConfiguration(agentId: string): Promise<AgentConfiguration | null> {
    return this.configurations.get(agentId) || null;
  }

  public async getAllConfigurations(): Promise<AgentConfiguration[]> {
    return Array.from(this.configurations.values());
  }

  public async updateConfiguration(
    agentId: string, 
    updates: Partial<AgentConfiguration>
  ): Promise<AgentConfiguration | null> {
    let config = this.configurations.get(agentId);
    
    if (!config) {
      config = this.createDefaultConfiguration(agentId);
    }

    const history = this.configHistory.get(agentId) || [];
    history.push({ ...config });
    this.configHistory.set(agentId, history.slice(-10));

    const updatedConfig: AgentConfiguration = {
      ...config,
      ...updates,
      version: config.version + 1,
      lastModified: new Date()
    };

    this.configurations.set(agentId, updatedConfig);
    this.emit('configuration-updated', { agentId, config: updatedConfig });
    
    return updatedConfig;
  }

  public async bulkUpdateConfigurations(
    updates: Array<{ agentId: string; config: Partial<AgentConfiguration> }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const { agentId, config } of updates) {
      try {
        await this.updateConfiguration(agentId, config);
        success++;
      } catch (error) {
        failed++;
        errors.push(`${agentId}: ${error}`);
      }
    }

    this.emit('bulk-update-completed', { success, failed });
    
    return { success, failed, errors };
  }

  public async getConfigurationHistory(agentId: string): Promise<AgentConfiguration[]> {
    return this.configHistory.get(agentId) || [];
  }

  public async getConfigurationDiff(
    agentId: string, 
    version1: number, 
    version2: number
  ): Promise<ConfigurationDiff[]> {
    const history = this.configHistory.get(agentId) || [];
    const config1 = history.find(c => c.version === version1);
    const config2 = history.find(c => c.version === version2);

    if (!config1 || !config2) return [];

    const diffs: ConfigurationDiff[] = [];
    const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);

    for (const key of allKeys) {
      const val1 = (config1 as Record<string, unknown>)[key];
      const val2 = (config2 as Record<string, unknown>)[key];
      
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        diffs.push({ field: key, oldValue: val1, newValue: val2 });
      }
    }

    return diffs;
  }

  public async exportConfigurations(): Promise<string> {
    const configs = Array.from(this.configurations.values());
    return JSON.stringify(configs, null, 2);
  }

  public async importConfigurations(json: string): Promise<{ imported: number; errors: string[] }> {
    try {
      const configs = JSON.parse(json) as AgentConfiguration[];
      let imported = 0;
      const errors: string[] = [];

      for (const config of configs) {
        try {
          this.configurations.set(config.id, config);
          imported++;
        } catch (error) {
          errors.push(`${config.id}: ${error}`);
        }
      }

      this.emit('configurations-imported', { imported, errors });
      
      return { imported, errors };
    } catch (error) {
      return { imported: 0, errors: [`Parse error: ${error}`] };
    }
  }

  public async validateConfiguration(config: Partial<AgentConfiguration>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.id) errors.push('Agent ID is required');
    if (!config.name) errors.push('Agent name is required');
    if (!config.tier) errors.push('Agent tier is required');
    if (!config.romaLevel) errors.push('ROMA level is required');
    
    if (config.capabilities && config.capabilities.length === 0) {
      warnings.push('Agent has no capabilities defined');
    }
    
    if (config.systemPrompt && config.systemPrompt.length < 50) {
      warnings.push('System prompt is very short');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private createDefaultConfiguration(agentId: string): AgentConfiguration {
    return {
      id: agentId,
      name: agentId,
      enabled: false,
      tier: 'development',
      romaLevel: 'L3',
      model: 'auto',
      modelSelectionMode: 'auto',
      group: 'default',
      systemPrompt: '',
      capabilities: [],
      tools: [],
      protocols: ['A2A', 'MCP'],
      operationMode: 'autonomous',
      languages: ['en'],
      guardRails: {
        parlantCompliance: true,
        securityLevel: 'medium',
        piiProtection: false
      },
      version: 1,
      lastModified: new Date()
    };
  }

  public async getConfigurationsByTier(tier: string): Promise<AgentConfiguration[]> {
    return Array.from(this.configurations.values()).filter(c => c.tier === tier);
  }

  public async getConfigurationsByGroup(group: string): Promise<AgentConfiguration[]> {
    return Array.from(this.configurations.values()).filter(c => c.group === group);
  }

  public async getEnabledConfigurations(): Promise<AgentConfiguration[]> {
    return Array.from(this.configurations.values()).filter(c => c.enabled);
  }

  public getStats(): {
    total: number;
    enabled: number;
    byTier: Record<string, number>;
    byRomaLevel: Record<string, number>;
  } {
    const configs = Array.from(this.configurations.values());
    
    const byTier: Record<string, number> = {};
    const byRomaLevel: Record<string, number> = {};
    
    for (const config of configs) {
      byTier[config.tier] = (byTier[config.tier] || 0) + 1;
      byRomaLevel[config.romaLevel] = (byRomaLevel[config.romaLevel] || 0) + 1;
    }

    return {
      total: configs.length,
      enabled: configs.filter(c => c.enabled).length,
      byTier,
      byRomaLevel
    };
  }
}

export const agentConfigManager = AgentConfigManager.getInstance();
export default AgentConfigManager;
