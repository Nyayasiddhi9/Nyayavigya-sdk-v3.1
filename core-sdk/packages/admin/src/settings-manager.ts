/**
 * Settings Manager
 * Platform settings and feature flags management
 */

import { EventEmitter } from 'events';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
  dependencies?: string[];
}

export interface PlatformSetting {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description: string;
  isSecret: boolean;
  lastModified: Date;
}

export class SettingsManager extends EventEmitter {
  private static instance: SettingsManager;
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private settings: Map<string, PlatformSetting> = new Map();

  private constructor() {
    super();
    this.initializeDefaults();
    console.log('⚙️ SettingsManager initialized');
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private initializeDefaults(): void {
    const defaultFlags: FeatureFlag[] = [
      { id: 'enable-grpo', name: 'GRPO Continuous Learning', description: 'Enable reinforcement learning for agents', enabled: true, category: 'learning' },
      { id: 'enable-sian', name: 'Self-Improving Agent Network', description: 'Enable neural evolution for agents', enabled: true, category: 'learning' },
      { id: 'enable-evoagentx', name: 'EvoAgentX Integration', description: 'Enable Python EvoAgentX bridge', enabled: true, category: 'learning' },
      { id: 'enable-multimodal', name: 'Multimodal Pipelines', description: 'Enable voice, video, music, image generation', enabled: true, category: 'features' },
      { id: 'enable-memory', name: 'mem0 Memory System', description: 'Enable persistent memory with pgvector', enabled: true, category: 'memory' },
      { id: 'enable-mcp', name: 'MCP Protocol', description: 'Enable Model Context Protocol', enabled: true, category: 'protocols' },
      { id: 'enable-a2a', name: 'A2A Collaboration', description: 'Enable agent-to-agent communication', enabled: true, category: 'protocols' },
      { id: 'enable-agui', name: 'AG-UI Streaming', description: 'Enable real-time agent-UI interaction', enabled: true, category: 'protocols' },
      { id: 'enable-roma', name: 'ROMA Autonomy', description: 'Enable ROMA L1-L4 autonomy levels', enabled: true, category: 'protocols' },
      { id: 'enable-parlant', name: 'Parlant Standards', description: 'Enable Parlant prompt engineering', enabled: true, category: 'protocols' },
      { id: 'enable-bmad', name: 'BMAD Methodology', description: 'Enable BMAD agent coordination', enabled: true, category: 'protocols' },
      { id: 'enable-quantum-security', name: 'Quantum Security', description: 'Enable quantum-resistant security', enabled: true, category: 'security' },
      { id: 'enable-cam', name: 'CAM 2.0 Monitoring', description: 'Enable advanced monitoring', enabled: true, category: 'monitoring' },
      { id: 'enable-translation', name: '23 Language Support', description: 'Enable multi-language translation', enabled: true, category: 'i18n' },
      { id: 'enable-indic', name: 'Indic Languages', description: 'Enable 22 Indic language support', enabled: true, category: 'i18n' },
      { id: 'enable-rag', name: 'RAG Pipeline', description: 'Enable retrieval-augmented generation', enabled: true, category: 'memory' },
      { id: 'enable-vector-search', name: 'Vector Search', description: 'Enable pgvector similarity search', enabled: true, category: 'memory' },
      { id: 'enable-cost-optimization', name: 'Cost Optimization', description: 'Enable LLM cost optimization', enabled: true, category: 'features' },
      { id: 'enable-rate-limiting', name: 'Rate Limiting', description: 'Enable API rate limiting', enabled: true, category: 'security' },
      { id: 'enable-audit-logging', name: 'Audit Logging', description: 'Enable comprehensive audit logs', enabled: true, category: 'security' },
      { id: 'enable-analytics', name: 'Analytics Dashboard', description: 'Enable usage analytics', enabled: true, category: 'monitoring' }
    ];

    for (const flag of defaultFlags) {
      this.featureFlags.set(flag.id, flag);
    }

    const defaultSettings: PlatformSetting[] = [
      { key: 'max_concurrent_agents', value: 10, type: 'number', category: 'performance', description: 'Maximum concurrent agent executions', isSecret: false, lastModified: new Date() },
      { key: 'default_model', value: 'claude-3-sonnet', type: 'string', category: 'llm', description: 'Default LLM model', isSecret: false, lastModified: new Date() },
      { key: 'memory_retention_days', value: 30, type: 'number', category: 'memory', description: 'Days to retain memory', isSecret: false, lastModified: new Date() },
      { key: 'rate_limit_rpm', value: 100, type: 'number', category: 'security', description: 'Requests per minute limit', isSecret: false, lastModified: new Date() },
      { key: 'enable_debug_mode', value: false, type: 'boolean', category: 'development', description: 'Enable debug logging', isSecret: false, lastModified: new Date() },
      { key: 'default_language', value: 'en', type: 'string', category: 'i18n', description: 'Default language code', isSecret: false, lastModified: new Date() },
      { key: 'session_timeout_minutes', value: 60, type: 'number', category: 'security', description: 'Session timeout in minutes', isSecret: false, lastModified: new Date() }
    ];

    for (const setting of defaultSettings) {
      this.settings.set(setting.key, setting);
    }
  }

  public async getFeatureFlag(id: string): Promise<FeatureFlag | null> {
    return this.featureFlags.get(id) || null;
  }

  public async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.featureFlags.values());
  }

  public async isFeatureEnabled(id: string): Promise<boolean> {
    const flag = this.featureFlags.get(id);
    return flag?.enabled ?? false;
  }

  public async setFeatureFlag(id: string, enabled: boolean): Promise<boolean> {
    const flag = this.featureFlags.get(id);
    if (!flag) return false;

    flag.enabled = enabled;
    this.emit('feature-flag-updated', { id, enabled });
    
    return true;
  }

  public async getSetting(key: string): Promise<PlatformSetting | null> {
    return this.settings.get(key) || null;
  }

  public async getSettingValue<T>(key: string): Promise<T | null> {
    const setting = this.settings.get(key);
    return setting ? (setting.value as T) : null;
  }

  public async getAllSettings(): Promise<PlatformSetting[]> {
    return Array.from(this.settings.values());
  }

  public async setSetting(key: string, value: unknown): Promise<boolean> {
    const setting = this.settings.get(key);
    if (!setting) return false;

    setting.value = value;
    setting.lastModified = new Date();
    
    this.emit('setting-updated', { key, value });
    
    return true;
  }

  public async getSettingsByCategory(category: string): Promise<PlatformSetting[]> {
    return Array.from(this.settings.values()).filter(s => s.category === category);
  }

  public async getFlagsByCategory(category: string): Promise<FeatureFlag[]> {
    return Array.from(this.featureFlags.values()).filter(f => f.category === category);
  }

  public async exportSettings(): Promise<string> {
    const data = {
      featureFlags: Array.from(this.featureFlags.values()),
      settings: Array.from(this.settings.values()).filter(s => !s.isSecret)
    };
    return JSON.stringify(data, null, 2);
  }

  public async importSettings(json: string): Promise<{ imported: number; errors: string[] }> {
    try {
      const data = JSON.parse(json);
      let imported = 0;
      const errors: string[] = [];

      if (data.featureFlags) {
        for (const flag of data.featureFlags) {
          this.featureFlags.set(flag.id, flag);
          imported++;
        }
      }

      if (data.settings) {
        for (const setting of data.settings) {
          if (!setting.isSecret) {
            this.settings.set(setting.key, setting);
            imported++;
          }
        }
      }

      this.emit('settings-imported', { imported });
      
      return { imported, errors };
    } catch (error) {
      return { imported: 0, errors: [`Parse error: ${error}`] };
    }
  }

  public getStats(): {
    totalFlags: number;
    enabledFlags: number;
    totalSettings: number;
    categories: string[];
  } {
    const flags = Array.from(this.featureFlags.values());
    const settings = Array.from(this.settings.values());
    const categories = [...new Set([
      ...flags.map(f => f.category),
      ...settings.map(s => s.category)
    ])];

    return {
      totalFlags: flags.length,
      enabledFlags: flags.filter(f => f.enabled).length,
      totalSettings: settings.length,
      categories
    };
  }
}

export const settingsManager = SettingsManager.getInstance();
export default SettingsManager;
