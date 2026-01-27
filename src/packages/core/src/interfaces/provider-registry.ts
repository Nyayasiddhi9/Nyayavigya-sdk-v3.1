/**
 * Provider Registry Interface
 * Provides abstraction for LLM provider management
 * Foundation for 23+ provider ecosystem
 */

import { z } from 'zod';

export interface ProviderCapabilities {
  /** Text generation */
  textGeneration?: boolean;
  /** Vision (image understanding) */
  vision?: boolean;
  /** Function calling */
  functionCalling?: boolean;
  /** Streaming */
  streaming?: boolean;
  /** JSON mode */
  jsonMode?: boolean;
  /** Multi-turn conversation */
  conversation?: boolean;
  /** Max context window (tokens) */
  maxContextTokens?: number;
  /** Max output tokens */
  maxOutputTokens?: number;
  /** Supported modalities */
  modalities?: ('text' | 'image' | 'audio' | 'video')[];
}

export interface ProviderModel {
  /** Model ID */
  id: string;
  /** Display name */
  name: string;
  /** Model description */
  description?: string;
  /** Provider ID */
  providerId: string;
  /** Capabilities */
  capabilities: ProviderCapabilities;
  /** Pricing */
  pricing?: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
    currency: string;
  };
  /** Context window */
  contextWindow: number;
  /** Max output tokens */
  maxOutputTokens?: number;
  /** Deprecated */
  deprecated?: boolean;
}

export interface Provider {
  /** Provider ID */
  id: string;
  /** Provider name */
  name: string;
  /** Provider description */
  description?: string;
  /** Available models */
  models: ProviderModel[];
  /** Base URL */
  baseUrl?: string;
  /** Authentication type */
  authType?: 'api-key' | 'oauth' | 'none';
  /** Required credentials */
  requiredCredentials?: string[];
  /** Health check endpoint */
  healthCheckUrl?: string;
}

export interface ProviderRequest {
  /** Model ID */
  model: string;
  /** Prompt/messages */
  prompt: string | Message[];
  /** Temperature (0-2) */
  temperature?: number;
  /** Max tokens */
  maxTokens?: number;
  /** Top P */
  topP?: number;
  /** Stop sequences */
  stop?: string[];
  /** Stream response */
  stream?: boolean;
  /** System prompt */
  systemPrompt?: string;
  /** Tools/functions */
  tools?: Tool[];
  /** JSON mode */
  jsonMode?: boolean;
  /** Seed for deterministic output */
  seed?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
}

export interface ProviderResponse {
  /** Generated text */
  text: string;
  /** Finish reason */
  finishReason?: 'stop' | 'length' | 'tool-call' | 'content-filter';
  /** Token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Tool calls */
  toolCalls?: ToolCall[];
  /** Model used */
  model: string;
  /** Provider ID */
  providerId: string;
  /** Execution time (ms) */
  executionTime: number;
  /** Cost estimate */
  cost?: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ProviderHealth {
  /** Provider ID */
  providerId: string;
  /** Health status */
  status: 'healthy' | 'degraded' | 'down';
  /** Response time (ms) */
  responseTime?: number;
  /** Last checked */
  lastChecked: Date;
  /** Error message */
  error?: string;
}

export interface IProviderRegistry {
  /**
   * Register a new provider
   * @param provider - Provider definition
   */
  registerProvider(provider: Provider): void;

  /**
   * Get a provider by ID
   * @param id - Provider ID
   * @returns Provider or undefined
   */
  getProvider(id: string): Provider | undefined;

  /**
   * List all providers
   * @returns Array of providers
   */
  listProviders(): Provider[];

  /**
   * Get a model by ID
   * @param modelId - Model ID
   * @returns Model and provider or undefined
   */
  getModel(modelId: string): { model: ProviderModel; provider: Provider } | undefined;

  /**
   * List all models
   * @param filters - Optional filters
   * @returns Array of models
   */
  listModels(filters?: {
    providerId?: string;
    capabilities?: Partial<ProviderCapabilities>;
    maxCost?: number;
  }): ProviderModel[];

  /**
   * Execute a request
   * @param request - Provider request
   * @param credentials - API keys/credentials
   * @returns Provider response
   */
  execute(
    request: ProviderRequest,
    credentials: Record<string, string>
  ): Promise<ProviderResponse>;

  /**
   * Check provider health
   * @param providerId - Provider ID
   * @returns Health status
   */
  checkHealth(providerId: string): Promise<ProviderHealth>;

  /**
   * Get provider statistics
   * @param providerId - Provider ID
   * @returns Usage statistics
   */
  getStats(providerId: string): Promise<ProviderStats>;
}

export interface ProviderStats {
  /** Provider ID */
  providerId: string;
  /** Total requests */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Average response time (ms) */
  avgResponseTime: number;
  /** Total tokens */
  totalTokens: number;
  /** Total cost */
  totalCost: number;
  /** Last 24h requests */
  last24hRequests: number;
}

/**
 * In-Memory Provider Registry (default implementation)
 */
export class MemoryProviderRegistry implements IProviderRegistry {
  private providers = new Map<string, Provider>();
  private stats = new Map<string, ProviderStats>();

  registerProvider(provider: Provider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider with ID "${provider.id}" already registered`);
    }
    this.providers.set(provider.id, provider);
    
    this.stats.set(provider.id, {
      providerId: provider.id,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      totalTokens: 0,
      totalCost: 0,
      last24hRequests: 0,
    });
  }

  getProvider(id: string): Provider | undefined {
    return this.providers.get(id);
  }

  listProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  getModel(modelId: string): { model: ProviderModel; provider: Provider } | undefined {
    for (const provider of this.providers.values()) {
      const model = provider.models.find(m => m.id === modelId);
      if (model) {
        return { model, provider };
      }
    }
    return undefined;
  }

  listModels(filters?: {
    providerId?: string;
    capabilities?: Partial<ProviderCapabilities>;
    maxCost?: number;
  }): ProviderModel[] {
    let models: ProviderModel[] = [];

    for (const provider of this.providers.values()) {
      if (filters?.providerId && provider.id !== filters.providerId) {
        continue;
      }
      models.push(...provider.models);
    }

    if (filters?.capabilities) {
      models = models.filter(model => {
        return Object.entries(filters.capabilities!).every(([key, value]) => {
          const capability = model.capabilities[key as keyof ProviderCapabilities];
          return capability === value;
        });
      });
    }

    if (filters?.maxCost !== undefined) {
      models = models.filter(model => {
        if (!model.pricing) return true;
        return model.pricing.output <= filters.maxCost!;
      });
    }

    return models;
  }

  async execute(
    request: ProviderRequest,
    credentials: Record<string, string>
  ): Promise<ProviderResponse> {
    const modelInfo = this.getModel(request.model);
    
    if (!modelInfo) {
      throw new Error(`Model not found: ${request.model}`);
    }

    // This is a placeholder - actual execution happens in provider adapters
    throw new Error('Execute must be implemented by provider adapters');
  }

  async checkHealth(providerId: string): Promise<ProviderHealth> {
    const provider = this.getProvider(providerId);
    
    if (!provider) {
      return {
        providerId,
        status: 'down',
        lastChecked: new Date(),
        error: 'Provider not found',
      };
    }

    // Placeholder - actual health check implementation
    return {
      providerId,
      status: 'healthy',
      responseTime: 100,
      lastChecked: new Date(),
    };
  }

  async getStats(providerId: string): Promise<ProviderStats> {
    const stats = this.stats.get(providerId);
    
    if (!stats) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    return stats;
  }
}
