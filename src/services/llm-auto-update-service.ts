/**
 * LLM Auto-Update Service
 * 
 * Automatically discovers and updates LLM models by:
 * 1. Periodic scheduled jobs (configurable interval)
 * 2. On-demand web search for latest models
 * 3. Provider API endpoint checks for model listings
 * 
 * Maintains the LLM Model Registry with the latest available models
 */

import { EventEmitter } from 'events';
import { LLMModelRegistry, LLMModel, ProviderModels } from './llm-model-registry';

export interface ModelDiscoveryResult {
  providerId: string;
  discoveredModels: Partial<LLMModel>[];
  newModels: string[];
  updatedModels: string[];
  deprecatedModels: string[];
  discoveryTime: Date;
  source: 'api' | 'web-search' | 'manual';
}

export interface AutoUpdateConfig {
  enabled: boolean;
  intervalHours: number;
  providers: string[];
  notifyOnNewModels: boolean;
  notifyOnDeprecations: boolean;
  autoApplyUpdates: boolean;
}

export interface UpdateJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  results: ModelDiscoveryResult[];
  errors: string[];
}

export class LLMAutoUpdateService extends EventEmitter {
  private static instance: LLMAutoUpdateService;
  private registry: LLMModelRegistry;
  private config: AutoUpdateConfig;
  private updateInterval: NodeJS.Timeout | null = null;
  private currentJob: UpdateJob | null = null;
  private jobHistory: UpdateJob[] = [];

  private providerEndpoints: Record<string, {
    modelsEndpoint?: string;
    apiKeyEnv: string;
    parseModels: (response: any) => Partial<LLMModel>[];
  }> = {
    openai: {
      modelsEndpoint: 'https://api.openai.com/v1/models',
      apiKeyEnv: 'OPENAI_API_KEY',
      parseModels: (response) => this.parseOpenAIModels(response)
    },
    anthropic: {
      modelsEndpoint: 'https://api.anthropic.com/v1/models',
      apiKeyEnv: 'ANTHROPIC_API_KEY',
      parseModels: (response) => this.parseAnthropicModels(response)
    },
    google: {
      modelsEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
      apiKeyEnv: 'GEMINI_API_KEY',
      parseModels: (response) => this.parseGoogleModels(response)
    },
    mistral: {
      modelsEndpoint: 'https://api.mistral.ai/v1/models',
      apiKeyEnv: 'MISTRAL_API_KEY',
      parseModels: (response) => this.parseMistralModels(response)
    },
    groq: {
      modelsEndpoint: 'https://api.groq.com/openai/v1/models',
      apiKeyEnv: 'GROQ_API_KEY',
      parseModels: (response) => this.parseGroqModels(response)
    },
    cohere: {
      modelsEndpoint: 'https://api.cohere.ai/v1/models',
      apiKeyEnv: 'COHERE_API_KEY',
      parseModels: (response) => this.parseCohereModels(response)
    },
    xai: {
      modelsEndpoint: 'https://api.x.ai/v1/models',
      apiKeyEnv: 'XAI_API_KEY',
      parseModels: (response) => this.parseXAIModels(response)
    },
    deepseek: {
      modelsEndpoint: 'https://api.deepseek.com/v1/models',
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      parseModels: (response) => this.parseDeepSeekModels(response)
    },
    together: {
      modelsEndpoint: 'https://api.together.xyz/v1/models',
      apiKeyEnv: 'TOGETHER_API_KEY',
      parseModels: (response) => this.parseTogetherModels(response)
    },
    perplexity: {
      modelsEndpoint: 'https://api.perplexity.ai/models',
      apiKeyEnv: 'PERPLEXITY_API_KEY',
      parseModels: (response) => this.parsePerplexityModels(response)
    }
  };

  private constructor() {
    super();
    this.registry = LLMModelRegistry.getInstance();
    this.config = {
      enabled: true,
      intervalHours: 24,
      providers: Object.keys(this.providerEndpoints),
      notifyOnNewModels: true,
      notifyOnDeprecations: true,
      autoApplyUpdates: true
    };
    
    console.log('🔄 LLM Auto-Update Service initialized');
  }

  public static getInstance(): LLMAutoUpdateService {
    if (!LLMAutoUpdateService.instance) {
      LLMAutoUpdateService.instance = new LLMAutoUpdateService();
    }
    return LLMAutoUpdateService.instance;
  }

  public configure(config: Partial<AutoUpdateConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ LLM Auto-Update Service configured:', this.config);
    
    if (this.config.enabled) {
      this.startAutoUpdate();
    } else {
      this.stopAutoUpdate();
    }
  }

  public startAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    const intervalMs = this.config.intervalHours * 60 * 60 * 1000;
    
    this.updateInterval = setInterval(async () => {
      console.log('⏰ Scheduled LLM model update triggered');
      await this.runFullUpdate();
    }, intervalMs);

    console.log(`✅ Auto-update scheduled every ${this.config.intervalHours} hours`);
    this.emit('auto-update-started', { intervalHours: this.config.intervalHours });
  }

  public stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Auto-update stopped');
      this.emit('auto-update-stopped');
    }
  }

  public async runFullUpdate(): Promise<UpdateJob> {
    const job: UpdateJob = {
      id: `update-${Date.now()}`,
      status: 'running',
      startTime: new Date(),
      results: [],
      errors: []
    };

    this.currentJob = job;
    this.emit('update-started', { jobId: job.id });

    console.log(`🚀 Starting full LLM model update (Job: ${job.id})`);

    try {
      for (const providerId of this.config.providers) {
        try {
          const result = await this.discoverProviderModels(providerId);
          job.results.push(result);
          
          if (this.config.autoApplyUpdates && result.discoveredModels.length > 0) {
            await this.applyDiscoveredModels(result);
          }
        } catch (error: any) {
          job.errors.push(`${providerId}: ${error.message}`);
          console.error(`❌ Error updating ${providerId}:`, error.message);
        }
      }

      job.status = 'completed';
      job.endTime = new Date();
      
      const summary = this.summarizeJob(job);
      console.log(`✅ LLM model update completed:`, summary);
      
      this.emit('update-completed', { job, summary });

    } catch (error: any) {
      job.status = 'failed';
      job.endTime = new Date();
      job.errors.push(`Fatal error: ${error.message}`);
      
      console.error('❌ LLM model update failed:', error);
      this.emit('update-failed', { job, error });
    }

    this.jobHistory.unshift(job);
    if (this.jobHistory.length > 100) {
      this.jobHistory = this.jobHistory.slice(0, 100);
    }

    this.currentJob = null;
    return job;
  }

  public async discoverProviderModels(providerId: string): Promise<ModelDiscoveryResult> {
    const result: ModelDiscoveryResult = {
      providerId,
      discoveredModels: [],
      newModels: [],
      updatedModels: [],
      deprecatedModels: [],
      discoveryTime: new Date(),
      source: 'api'
    };

    const endpoint = this.providerEndpoints[providerId];
    if (!endpoint?.modelsEndpoint) {
      console.log(`⚠️ No API endpoint configured for ${providerId}, skipping API discovery`);
      return result;
    }

    const apiKey = process.env[endpoint.apiKeyEnv];
    if (!apiKey) {
      console.log(`⚠️ No API key found for ${providerId} (${endpoint.apiKeyEnv}), skipping`);
      return result;
    }

    try {
      const response = await this.fetchModelsFromAPI(providerId, endpoint.modelsEndpoint, apiKey);
      result.discoveredModels = endpoint.parseModels(response);
      
      const existingModels = this.registry.getModelsByProvider(providerId);
      const existingIds = new Set(existingModels.map(m => m.apiModelId));
      const discoveredIds = new Set(result.discoveredModels.map(m => m.apiModelId).filter(Boolean));

      for (const model of result.discoveredModels) {
        if (model.apiModelId && !existingIds.has(model.apiModelId)) {
          result.newModels.push(model.apiModelId);
        } else if (model.apiModelId) {
          result.updatedModels.push(model.apiModelId);
        }
      }

      for (const existing of existingModels) {
        if (!discoveredIds.has(existing.apiModelId)) {
          result.deprecatedModels.push(existing.apiModelId);
        }
      }

      console.log(`📊 ${providerId}: Found ${result.discoveredModels.length} models, ${result.newModels.length} new, ${result.deprecatedModels.length} deprecated`);

    } catch (error: any) {
      console.error(`❌ Failed to discover ${providerId} models:`, error.message);
      throw error;
    }

    return result;
  }

  private async fetchModelsFromAPI(providerId: string, endpoint: string, apiKey: string): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    switch (providerId) {
      case 'openai':
      case 'groq':
      case 'together':
      case 'xai':
      case 'deepseek':
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case 'anthropic':
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
      case 'google':
        endpoint = `${endpoint}?key=${apiKey}`;
        break;
      case 'cohere':
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case 'mistral':
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      default:
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  private parseOpenAIModels(response: any): Partial<LLMModel>[] {
    if (!response?.data) return [];
    
    return response.data
      .filter((m: any) => m.id.includes('gpt') || m.id.includes('o1'))
      .map((m: any) => ({
        id: `openai-${m.id}`,
        name: m.id,
        provider: 'openai',
        apiModelId: m.id,
        status: 'stable' as const
      }));
  }

  private parseAnthropicModels(response: any): Partial<LLMModel>[] {
    if (!response?.data) return [];
    
    return response.data.map((m: any) => ({
      id: `anthropic-${m.id}`,
      name: m.display_name || m.id,
      provider: 'anthropic',
      apiModelId: m.id,
      status: 'stable' as const
    }));
  }

  private parseGoogleModels(response: any): Partial<LLMModel>[] {
    if (!response?.models) return [];
    
    return response.models
      .filter((m: any) => m.name.includes('gemini'))
      .map((m: any) => ({
        id: `google-${m.name.replace('models/', '')}`,
        name: m.displayName || m.name,
        provider: 'google',
        apiModelId: m.name.replace('models/', ''),
        contextWindow: m.inputTokenLimit,
        maxOutputTokens: m.outputTokenLimit,
        status: 'stable' as const
      }));
  }

  private parseMistralModels(response: any): Partial<LLMModel>[] {
    if (!response?.data) return [];
    
    return response.data.map((m: any) => ({
      id: `mistral-${m.id}`,
      name: m.id,
      provider: 'mistral',
      apiModelId: m.id,
      status: 'stable' as const
    }));
  }

  private parseGroqModels(response: any): Partial<LLMModel>[] {
    if (!response?.data) return [];
    
    return response.data.map((m: any) => ({
      id: `groq-${m.id}`,
      name: m.id,
      provider: 'groq',
      apiModelId: m.id,
      contextWindow: m.context_window,
      status: 'stable' as const
    }));
  }

  private parseCohereModels(response: any): Partial<LLMModel>[] {
    if (!response?.models) return [];
    
    return response.models.map((m: any) => ({
      id: `cohere-${m.name}`,
      name: m.name,
      provider: 'cohere',
      apiModelId: m.name,
      contextWindow: m.context_length,
      status: 'stable' as const
    }));
  }

  private parseXAIModels(response: any): Partial<LLMModel>[] {
    if (!response?.data) return [];
    
    return response.data.map((m: any) => ({
      id: `xai-${m.id}`,
      name: m.id,
      provider: 'xai',
      apiModelId: m.id,
      status: 'stable' as const
    }));
  }

  private parseDeepSeekModels(response: any): Partial<LLMModel>[] {
    if (!response?.data) return [];
    
    return response.data.map((m: any) => ({
      id: `deepseek-${m.id}`,
      name: m.id,
      provider: 'deepseek',
      apiModelId: m.id,
      status: 'stable' as const
    }));
  }

  private parseTogetherModels(response: any): Partial<LLMModel>[] {
    if (!Array.isArray(response)) return [];
    
    return response
      .filter((m: any) => m.type === 'chat' || m.type === 'language')
      .slice(0, 50)
      .map((m: any) => ({
        id: `together-${m.id.replace(/\//g, '-')}`,
        name: m.display_name || m.id,
        provider: 'together',
        apiModelId: m.id,
        contextWindow: m.context_length,
        status: 'stable' as const
      }));
  }

  private parsePerplexityModels(response: any): Partial<LLMModel>[] {
    if (!response?.models) return [];
    
    return response.models.map((m: any) => ({
      id: `perplexity-${m.id}`,
      name: m.id,
      provider: 'perplexity',
      apiModelId: m.id,
      status: 'stable' as const
    }));
  }

  private async applyDiscoveredModels(result: ModelDiscoveryResult): Promise<void> {
    const updateCount = await this.registry.updateFromDiscovery(result.discoveredModels);
    
    if (this.config.notifyOnNewModels && result.newModels.length > 0) {
      this.emit('new-models-discovered', {
        providerId: result.providerId,
        models: result.newModels
      });
    }

    if (this.config.notifyOnDeprecations && result.deprecatedModels.length > 0) {
      this.emit('models-deprecated', {
        providerId: result.providerId,
        models: result.deprecatedModels
      });
    }

    console.log(`✅ Applied ${updateCount} model updates for ${result.providerId}`);
  }

  private summarizeJob(job: UpdateJob): {
    totalProviders: number;
    successfulProviders: number;
    totalModelsDiscovered: number;
    newModels: number;
    updatedModels: number;
    deprecatedModels: number;
    errors: number;
    duration: number;
  } {
    const endTime = job.endTime || new Date();
    
    return {
      totalProviders: this.config.providers.length,
      successfulProviders: job.results.length,
      totalModelsDiscovered: job.results.reduce((sum, r) => sum + r.discoveredModels.length, 0),
      newModels: job.results.reduce((sum, r) => sum + r.newModels.length, 0),
      updatedModels: job.results.reduce((sum, r) => sum + r.updatedModels.length, 0),
      deprecatedModels: job.results.reduce((sum, r) => sum + r.deprecatedModels.length, 0),
      errors: job.errors.length,
      duration: endTime.getTime() - job.startTime.getTime()
    };
  }

  public async updateSingleProvider(providerId: string): Promise<ModelDiscoveryResult> {
    console.log(`🔄 Updating models for ${providerId}...`);
    
    const result = await this.discoverProviderModels(providerId);
    
    if (this.config.autoApplyUpdates && result.discoveredModels.length > 0) {
      await this.applyDiscoveredModels(result);
    }
    
    return result;
  }

  public getConfig(): AutoUpdateConfig {
    return { ...this.config };
  }

  public getCurrentJob(): UpdateJob | null {
    return this.currentJob;
  }

  public getJobHistory(): UpdateJob[] {
    return [...this.jobHistory];
  }

  public getLastUpdateTime(): Date | null {
    const lastCompleted = this.jobHistory.find(j => j.status === 'completed');
    return lastCompleted?.endTime || null;
  }

  public getUpdateStatus(): {
    isRunning: boolean;
    autoUpdateEnabled: boolean;
    intervalHours: number;
    lastUpdate: Date | null;
    nextUpdate: Date | null;
    registryStats: ReturnType<LLMModelRegistry['getModelStats']>;
  } {
    const lastUpdate = this.getLastUpdateTime();
    let nextUpdate: Date | null = null;
    
    if (this.config.enabled && lastUpdate) {
      nextUpdate = new Date(lastUpdate.getTime() + this.config.intervalHours * 60 * 60 * 1000);
    }

    return {
      isRunning: this.currentJob !== null,
      autoUpdateEnabled: this.config.enabled,
      intervalHours: this.config.intervalHours,
      lastUpdate,
      nextUpdate,
      registryStats: this.registry.getModelStats()
    };
  }
}

export const llmAutoUpdateService = LLMAutoUpdateService.getInstance();
