/**
 * Advanced LLM Routing Engine
 * 
 * Implements intelligent LLM routing algorithms for content types, cost optimization,
 * task complexity analysis, user preferences, and efficiency-based provider selection.
 */

import { EventEmitter } from 'events';

export interface LLMProvider {
  id: string;
  name: string;
  models: LLMModel[];
  pricing: {
    inputTokenCost: number;  // Cost per 1K input tokens
    outputTokenCost: number; // Cost per 1K output tokens
    imageTokenCost?: number; // Cost per image token
  };
  capabilities: {
    maxTokens: number;
    supportsImages: boolean;
    supportsAudio: boolean;
    supportsVideo: boolean;
    supportsFunctionCalling: boolean;
    supportsStreaming: boolean;
  };
  performance: {
    averageLatency: number;    // ms
    reliability: number;       // 0-1
    qualityScore: number;      // 0-1
    concurrencyLimit: number;
  };
  status: 'available' | 'degraded' | 'unavailable';
}

export interface LLMModel {
  id: string;
  name: string;
  providerId: string;
  contextWindow: number;
  strengths: string[];
  weaknesses: string[];
  specializations: {
    coding: number;      // 0-1 capability score
    creative: number;
    analytical: number;
    conversational: number;
    reasoning: number;
  };
  performance: {
    speed: number;       // tokens/second
    accuracy: number;    // 0-1
    consistency: number; // 0-1
  };
}

export interface RoutingRequest {
  id: string;
  agentId: string;
  taskType: 'development' | 'creative' | 'business' | 'coordination' | 'specialized';
  contentType: 'text' | 'code' | 'image' | 'audio' | 'multimodal';
  complexity: number;  // 0-1 scale
  priority: 'low' | 'medium' | 'high' | 'critical';
  constraints: {
    maxCost?: number;
    maxLatency?: number;
    minQuality?: number;
    requiredCapabilities?: string[];
  };
  context: {
    previousRequests?: RoutingRequest[];
    userPreferences?: UserPreferences;
    projectContext?: Record<string, any>;
  };
  estimatedTokens: {
    input: number;
    output: number;
  };
  metadata: {
    timestamp: Date;
    retryCount: number;
    fallbackUsed: boolean;
  };
}

export interface UserPreferences {
  preferredProviders: string[];
  avoidedProviders: string[];
  costSensitivity: 'low' | 'medium' | 'high';
  qualityPreference: 'speed' | 'quality' | 'balanced';
  specialRequirements: string[];
}

export interface RoutingResult {
  selectedProvider: string;
  selectedModel: string;
  routingScore: number;
  estimatedCost: number;
  estimatedLatency: number;
  expectedQuality: number;
  reasoning: string;
  alternatives: Array<{
    provider: string;
    model: string;
    score: number;
    reason: string;
  }>;
  fallbackChain: string[];
}

export class LLMProviderRegistry extends EventEmitter {
  private providers: Map<string, LLMProvider> = new Map();
  private performanceHistory: Map<string, any[]> = new Map();

  constructor() {
    super();
    this.initializeProviders();
    this.startPerformanceMonitoring();
  }

  /**
   * Initialize LLM providers with current capabilities and pricing
   */
  private initializeProviders(): void {
    const providers: LLMProvider[] = [
      {
        id: 'openai',
        name: 'OpenAI',
        models: [
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            providerId: 'openai',
            contextWindow: 128000,
            strengths: ['reasoning', 'coding', 'analysis'],
            weaknesses: ['very recent information'],
            specializations: {
              coding: 0.95,
              creative: 0.90,
              analytical: 0.95,
              conversational: 0.92,
              reasoning: 0.96
            },
            performance: {
              speed: 50,
              accuracy: 0.94,
              consistency: 0.92
            }
          },
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini',
            providerId: 'openai',
            contextWindow: 128000,
            strengths: ['speed', 'cost-efficiency', 'general tasks'],
            weaknesses: ['complex reasoning'],
            specializations: {
              coding: 0.85,
              creative: 0.82,
              analytical: 0.80,
              conversational: 0.88,
              reasoning: 0.75
            },
            performance: {
              speed: 120,
              accuracy: 0.85,
              consistency: 0.87
            }
          }
        ],
        pricing: {
          inputTokenCost: 0.005,   // $5 per 1M tokens
          outputTokenCost: 0.015   // $15 per 1M tokens
        },
        capabilities: {
          maxTokens: 16384,
          supportsImages: true,
          supportsAudio: false,
          supportsVideo: false,
          supportsFunctionCalling: true,
          supportsStreaming: true
        },
        performance: {
          averageLatency: 1200,
          reliability: 0.98,
          qualityScore: 0.94,
          concurrencyLimit: 100
        },
        status: 'available'
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        models: [
          {
            id: 'claude-3.5-sonnet',
            name: 'Claude 3.5 Sonnet',
            providerId: 'anthropic',
            contextWindow: 200000,
            strengths: ['reasoning', 'safety', 'analysis', 'coding'],
            weaknesses: ['image generation'],
            specializations: {
              coding: 0.93,
              creative: 0.88,
              analytical: 0.96,
              conversational: 0.95,
              reasoning: 0.97
            },
            performance: {
              speed: 45,
              accuracy: 0.96,
              consistency: 0.94
            }
          },
          {
            id: 'claude-3-haiku',
            name: 'Claude 3 Haiku',
            providerId: 'anthropic',
            contextWindow: 200000,
            strengths: ['speed', 'efficiency', 'safety'],
            weaknesses: ['complex reasoning'],
            specializations: {
              coding: 0.80,
              creative: 0.75,
              analytical: 0.78,
              conversational: 0.85,
              reasoning: 0.72
            },
            performance: {
              speed: 150,
              accuracy: 0.82,
              consistency: 0.85
            }
          }
        ],
        pricing: {
          inputTokenCost: 0.003,
          outputTokenCost: 0.015
        },
        capabilities: {
          maxTokens: 8192,
          supportsImages: true,
          supportsAudio: false,
          supportsVideo: false,
          supportsFunctionCalling: true,
          supportsStreaming: true
        },
        performance: {
          averageLatency: 1000,
          reliability: 0.99,
          qualityScore: 0.96,
          concurrencyLimit: 80
        },
        status: 'available'
      },
      {
        id: 'google',
        name: 'Google',
        models: [
          {
            id: 'gemini-1.5-pro',
            name: 'Gemini 1.5 Pro',
            providerId: 'google',
            contextWindow: 2000000,
            strengths: ['large context', 'multimodal', 'reasoning'],
            weaknesses: ['speed'],
            specializations: {
              coding: 0.88,
              creative: 0.85,
              analytical: 0.92,
              conversational: 0.87,
              reasoning: 0.90
            },
            performance: {
              speed: 35,
              accuracy: 0.91,
              consistency: 0.89
            }
          }
        ],
        pricing: {
          inputTokenCost: 0.00125,
          outputTokenCost: 0.005
        },
        capabilities: {
          maxTokens: 8192,
          supportsImages: true,
          supportsAudio: true,
          supportsVideo: true,
          supportsFunctionCalling: true,
          supportsStreaming: true
        },
        performance: {
          averageLatency: 1800,
          reliability: 0.95,
          qualityScore: 0.91,
          concurrencyLimit: 60
        },
        status: 'available'
      },
      {
        id: 'xai',
        name: 'xAI',
        models: [
          {
            id: 'grok-beta',
            name: 'Grok Beta',
            providerId: 'xai',
            contextWindow: 131072,
            strengths: ['real-time data', 'reasoning', 'humor'],
            weaknesses: ['consistency'],
            specializations: {
              coding: 0.82,
              creative: 0.90,
              analytical: 0.85,
              conversational: 0.92,
              reasoning: 0.88
            },
            performance: {
              speed: 60,
              accuracy: 0.86,
              consistency: 0.80
            }
          }
        ],
        pricing: {
          inputTokenCost: 0.005,
          outputTokenCost: 0.015
        },
        capabilities: {
          maxTokens: 8192,
          supportsImages: false,
          supportsAudio: false,
          supportsVideo: false,
          supportsFunctionCalling: false,
          supportsStreaming: true
        },
        performance: {
          averageLatency: 1400,
          reliability: 0.92,
          qualityScore: 0.86,
          concurrencyLimit: 40
        },
        status: 'available'
      },
      {
        id: 'groq',
        name: 'Groq',
        models: [
          {
            id: 'llama-3.1-70b',
            name: 'Llama 3.1 70B',
            providerId: 'groq',
            contextWindow: 131072,
            strengths: ['speed', 'cost-efficiency'],
            weaknesses: ['complex reasoning'],
            specializations: {
              coding: 0.78,
              creative: 0.75,
              analytical: 0.72,
              conversational: 0.80,
              reasoning: 0.70
            },
            performance: {
              speed: 300,
              accuracy: 0.80,
              consistency: 0.78
            }
          }
        ],
        pricing: {
          inputTokenCost: 0.0006,
          outputTokenCost: 0.0006
        },
        capabilities: {
          maxTokens: 8192,
          supportsImages: false,
          supportsAudio: false,
          supportsVideo: false,
          supportsFunctionCalling: true,
          supportsStreaming: true
        },
        performance: {
          averageLatency: 400,
          reliability: 0.94,
          qualityScore: 0.78,
          concurrencyLimit: 200
        },
        status: 'available'
      }
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  /**
   * Start performance monitoring for all providers
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateProviderPerformance();
    }, 60000); // Update every minute
  }

  private updateProviderPerformance(): void {
    for (const [providerId, provider] of this.providers) {
      // Simulate performance updates
      const performance = {
        timestamp: new Date(),
        latency: provider.performance.averageLatency + (Math.random() - 0.5) * 200,
        reliability: Math.max(0.7, provider.performance.reliability + (Math.random() - 0.5) * 0.02),
        qualityScore: Math.max(0.6, provider.performance.qualityScore + (Math.random() - 0.5) * 0.01)
      };

      if (!this.performanceHistory.has(providerId)) {
        this.performanceHistory.set(providerId, []);
      }

      const history = this.performanceHistory.get(providerId)!;
      history.push(performance);

      // Keep only last 100 entries
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      // Update provider performance
      provider.performance.averageLatency = performance.latency;
      provider.performance.reliability = performance.reliability;
      provider.performance.qualityScore = performance.qualityScore;
    }
  }

  // Public methods
  getProvider(id: string): LLMProvider | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.values()).filter(p => p.status === 'available');
  }

  getModel(providerId: string, modelId: string): LLMModel | undefined {
    const provider = this.providers.get(providerId);
    return provider?.models.find(m => m.id === modelId);
  }

  updateProviderStatus(providerId: string, status: 'available' | 'degraded' | 'unavailable'): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.status = status;
      this.emit('provider-status-changed', { providerId, status, timestamp: new Date() });
    }
  }
}

export class LLMRoutingEngine extends EventEmitter {
  private providerRegistry: LLMProviderRegistry;
  private routingHistory: Map<string, RoutingResult[]> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();

  constructor() {
    super();
    this.providerRegistry = new LLMProviderRegistry();
    this.setupEventHandlers();
  }

  /**
   * Intelligent routing algorithm to select optimal LLM provider and model
   */
  async routeRequest(request: RoutingRequest): Promise<RoutingResult> {
    try {
      this.emit('routing-started', {
        requestId: request.id,
        agentId: request.agentId,
        taskType: request.taskType,
        timestamp: new Date()
      });

      // Get available providers
      const availableProviders = this.providerRegistry.getAvailableProviders();
      if (availableProviders.length === 0) {
        throw new Error('No available LLM providers');
      }

      // Score all available models
      const scoredOptions = await this.scoreAllOptions(request, availableProviders);
      
      // Select best option
      const bestOption = this.selectBestOption(scoredOptions, request);
      
      // Generate fallback chain
      const fallbackChain = this.generateFallbackChain(scoredOptions, bestOption);
      
      // Create routing result
      const result: RoutingResult = {
        selectedProvider: bestOption.providerId,
        selectedModel: bestOption.modelId,
        routingScore: bestOption.score,
        estimatedCost: bestOption.estimatedCost,
        estimatedLatency: bestOption.estimatedLatency,
        expectedQuality: bestOption.expectedQuality,
        reasoning: bestOption.reasoning,
        alternatives: scoredOptions.slice(1, 4).map(option => ({
          provider: option.providerId,
          model: option.modelId,
          score: option.score,
          reason: `${option.reasoning.split('.')[0]}.`
        })),
        fallbackChain
      };

      // Store routing history
      this.storeRoutingHistory(request.agentId, result);

      this.emit('routing-completed', {
        requestId: request.id,
        selectedProvider: result.selectedProvider,
        selectedModel: result.selectedModel,
        score: result.routingScore,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'routing', error: errorMessage, requestId: request.id });
      throw error;
    }
  }

  /**
   * Score all available model options for the request
   */
  private async scoreAllOptions(request: RoutingRequest, providers: LLMProvider[]): Promise<any[]> {
    const options: any[] = [];

    for (const provider of providers) {
      for (const model of provider.models) {
        const score = await this.calculateModelScore(model, provider, request);
        const estimatedCost = this.calculateEstimatedCost(model, provider, request);
        const estimatedLatency = this.calculateEstimatedLatency(model, provider, request);
        const expectedQuality = this.calculateExpectedQuality(model, provider, request);
        const reasoning = this.generateScoreReasoning(model, provider, request, score);

        options.push({
          providerId: provider.id,
          modelId: model.id,
          score,
          estimatedCost,
          estimatedLatency,
          expectedQuality,
          reasoning,
          model,
          provider
        });
      }
    }

    // Sort by score (highest first)
    options.sort((a, b) => b.score - a.score);
    return options;
  }

  /**
   * Calculate comprehensive score for model-provider combination
   */
  private async calculateModelScore(model: LLMModel, provider: LLMProvider, request: RoutingRequest): Promise<number> {
    let score = 0;

    // Task specialization match (40% weight)
    const specializationScore = this.getSpecializationScore(model, request.taskType);
    score += specializationScore * 0.40;

    // Quality and performance (25% weight)
    const qualityScore = (model.performance.accuracy + model.performance.consistency + provider.performance.qualityScore) / 3;
    score += qualityScore * 0.25;

    // Cost efficiency (15% weight)
    const costScore = this.calculateCostScore(model, provider, request);
    score += costScore * 0.15;

    // Latency and speed (10% weight)
    const speedScore = Math.min(1, model.performance.speed / 100); // Normalize to 0-1
    score += speedScore * 0.10;

    // Reliability (5% weight)
    score += provider.performance.reliability * 0.05;

    // User preferences (5% weight)
    const preferenceScore = this.calculatePreferenceScore(provider, request);
    score += preferenceScore * 0.05;

    return Math.min(1, score);
  }

  private getSpecializationScore(model: LLMModel, taskType: string): number {
    const taskMapping = {
      'development': model.specializations.coding,
      'creative': model.specializations.creative,
      'business': model.specializations.analytical,
      'coordination': model.specializations.conversational,
      'specialized': model.specializations.reasoning
    };

    return taskMapping[taskType as keyof typeof taskMapping] || model.specializations.reasoning;
  }

  private calculateCostScore(model: LLMModel, provider: LLMProvider, request: RoutingRequest): number {
    const estimatedCost = this.calculateEstimatedCost(model, provider, request);
    const maxAcceptableCost = request.constraints.maxCost || 1.0; // $1 default
    
    if (estimatedCost > maxAcceptableCost) {
      return 0;
    }

    // Higher score for lower cost (inverse relationship)
    return Math.max(0, 1 - (estimatedCost / maxAcceptableCost));
  }

  private calculateEstimatedCost(model: LLMModel, provider: LLMProvider, request: RoutingRequest): number {
    const inputCost = (request.estimatedTokens.input / 1000) * provider.pricing.inputTokenCost;
    const outputCost = (request.estimatedTokens.output / 1000) * provider.pricing.outputTokenCost;
    return inputCost + outputCost;
  }

  private calculateEstimatedLatency(model: LLMModel, provider: LLMProvider, request: RoutingRequest): number {
    const baseLatency = provider.performance.averageLatency;
    const tokenLatency = request.estimatedTokens.output / model.performance.speed * 1000; // Convert to ms
    return baseLatency + tokenLatency;
  }

  private calculateExpectedQuality(model: LLMModel, provider: LLMProvider, request: RoutingRequest): number {
    const specializationMatch = this.getSpecializationScore(model, request.taskType);
    const modelQuality = (model.performance.accuracy + model.performance.consistency) / 2;
    const providerQuality = provider.performance.qualityScore;
    
    return (specializationMatch * 0.5 + modelQuality * 0.3 + providerQuality * 0.2);
  }

  private calculatePreferenceScore(provider: LLMProvider, request: RoutingRequest): number {
    const userPrefs = request.context.userPreferences;
    if (!userPrefs) return 0.5; // Neutral if no preferences

    if (userPrefs.preferredProviders.includes(provider.id)) return 1.0;
    if (userPrefs.avoidedProviders.includes(provider.id)) return 0.0;
    
    return 0.5; // Neutral
  }

  private generateScoreReasoning(model: LLMModel, provider: LLMProvider, request: RoutingRequest, score: number): string {
    const strengths = model.strengths.slice(0, 2).join(' and ');
    const specialization = this.getSpecializationScore(model, request.taskType);
    const cost = this.calculateEstimatedCost(model, provider, request);
    
    return `Selected for ${strengths} with ${(specialization * 100).toFixed(0)}% task specialization match. ` +
           `Estimated cost: $${cost.toFixed(4)}, latency: ${this.calculateEstimatedLatency(model, provider, request).toFixed(0)}ms. ` +
           `Overall score: ${(score * 100).toFixed(1)}%.`;
  }

  private selectBestOption(scoredOptions: any[], request: RoutingRequest): any {
    // Apply additional constraints
    const constrainedOptions = scoredOptions.filter(option => {
      // Check cost constraint
      if (request.constraints.maxCost && option.estimatedCost > request.constraints.maxCost) {
        return false;
      }

      // Check latency constraint
      if (request.constraints.maxLatency && option.estimatedLatency > request.constraints.maxLatency) {
        return false;
      }

      // Check quality constraint
      if (request.constraints.minQuality && option.expectedQuality < request.constraints.minQuality) {
        return false;
      }

      // Check required capabilities
      if (request.constraints.requiredCapabilities) {
        for (const capability of request.constraints.requiredCapabilities) {
          if (!this.providerSupportsCapability(option.provider, capability)) {
            return false;
          }
        }
      }

      return true;
    });

    if (constrainedOptions.length === 0) {
      throw new Error('No providers meet the specified constraints');
    }

    return constrainedOptions[0]; // Highest scored option that meets constraints
  }

  private providerSupportsCapability(provider: LLMProvider, capability: string): boolean {
    const capabilityMap: Record<string, boolean> = {
      'images': provider.capabilities.supportsImages,
      'audio': provider.capabilities.supportsAudio,
      'video': provider.capabilities.supportsVideo,
      'function-calling': provider.capabilities.supportsFunctionCalling,
      'streaming': provider.capabilities.supportsStreaming
    };

    return capabilityMap[capability] !== false;
  }

  private generateFallbackChain(scoredOptions: any[], selectedOption: any): string[] {
    return scoredOptions
      .filter(option => option !== selectedOption)
      .slice(0, 3)
      .map(option => `${option.providerId}/${option.modelId}`);
  }

  private storeRoutingHistory(agentId: string, result: RoutingResult): void {
    if (!this.routingHistory.has(agentId)) {
      this.routingHistory.set(agentId, []);
    }

    const history = this.routingHistory.get(agentId)!;
    history.push(result);

    // Keep only last 50 routing decisions per agent
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  private setupEventHandlers(): void {
    // Forward events from provider registry
    this.providerRegistry.on('provider-status-changed', (data) => this.emit('provider-status-changed', data));

    // Routing logging
    this.on('routing-completed', (data) => {
      console.log(`🎯 LLMRouter: Routed ${data.requestId} to ${data.selectedProvider}/${data.selectedModel} (score: ${data.score.toFixed(2)})`);
    });

    this.on('error', (error) => {
      console.error(`❌ LLMRouter Error in ${error.stage}:`, error.error);
    });
  }

  // Public interface methods
  setUserPreferences(agentId: string, preferences: UserPreferences): void {
    this.userPreferences.set(agentId, preferences);
  }

  getUserPreferences(agentId: string): UserPreferences | undefined {
    return this.userPreferences.get(agentId);
  }

  getRoutingHistory(agentId: string): RoutingResult[] {
    return this.routingHistory.get(agentId) || [];
  }

  getProviderRegistry(): LLMProviderRegistry {
    return this.providerRegistry;
  }

  getRoutingMetrics(): any {
    const allHistory = Array.from(this.routingHistory.values()).flat();
    const providers = this.providerRegistry.getAllProviders();

    return {
      totalRoutingDecisions: allHistory.length,
      averageScore: allHistory.reduce((sum, r) => sum + r.routingScore, 0) / allHistory.length,
      averageCost: allHistory.reduce((sum, r) => sum + r.estimatedCost, 0) / allHistory.length,
      averageLatency: allHistory.reduce((sum, r) => sum + r.estimatedLatency, 0) / allHistory.length,
      averageQuality: allHistory.reduce((sum, r) => sum + r.expectedQuality, 0) / allHistory.length,
      providerUsage: this.getProviderUsageStats(allHistory),
      modelUsage: this.getModelUsageStats(allHistory),
      providers: {
        total: providers.length,
        available: providers.filter(p => p.status === 'available').length,
        degraded: providers.filter(p => p.status === 'degraded').length,
        unavailable: providers.filter(p => p.status === 'unavailable').length
      }
    };
  }

  private getProviderUsageStats(history: RoutingResult[]): Record<string, number> {
    const usage: Record<string, number> = {};
    for (const result of history) {
      usage[result.selectedProvider] = (usage[result.selectedProvider] || 0) + 1;
    }
    return usage;
  }

  private getModelUsageStats(history: RoutingResult[]): Record<string, number> {
    const usage: Record<string, number> = {};
    for (const result of history) {
      const key = `${result.selectedProvider}/${result.selectedModel}`;
      usage[key] = (usage[key] || 0) + 1;
    }
    return usage;
  }

  // Execute request with selected provider
  async executeWithProvider(provider: string, prompt: string, options: any = {}): Promise<any> {
    try {
      const { logger } = await import('../utils/wai-logger.ts');
      
      // Get provider configuration
      const providerConfig = this.providerRegistry.getProvider(provider);
      if (!providerConfig) {
        throw new Error(`Provider ${provider} not found`);
      }

      logger.info('llm-routing', `Executing with provider ${provider}`, { 
        provider, 
        promptLength: prompt.length,
        options 
      });

      // Route to appropriate provider implementation
      switch (provider) {
        case 'anthropic':
          return await this.executeWithAnthropic(providerConfig, prompt, options);
        case 'openai':
          return await this.executeWithOpenAI(providerConfig, prompt, options);
        case 'google':
          return await this.executeWithGoogle(providerConfig, prompt, options);
        case 'perplexity':
          return await this.executeWithPerplexity(providerConfig, prompt, options);
        default:
          return await this.executeWithFallback(prompt, options);
      }
    } catch (error) {
      const { logger } = await import('../utils/wai-logger.ts');
      logger.error('llm-routing', 'Provider execution failed', { 
        provider, 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      // Attempt fallback execution
      return await this.executeWithFallback(prompt, options);
    }
  }

  private async executeWithAnthropic(config: any, prompt: string, options: any): Promise<any> {
    try {
      // Import Anthropic service dynamically
      const anthropicService = await import('../services/anthropic-service.js');
      return await anthropicService.default.generateResponse({
        model: options.model || 'claude-3.5-sonnet',
        prompt,
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      });
    } catch (error) {
      throw new Error(`Anthropic execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeWithOpenAI(config: any, prompt: string, options: any): Promise<any> {
    try {
      // Import OpenAI service dynamically
      const openaiService = await import('../services/openai-service.js');
      return await openaiService.default.generateResponse({
        model: options.model || 'gpt-4o',
        prompt,
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      });
    } catch (error) {
      throw new Error(`OpenAI execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeWithGoogle(config: any, prompt: string, options: any): Promise<any> {
    try {
      // Import Google Gemini service dynamically
      const geminiService = await import('../services/gemini-service.js');
      return await geminiService.default.generateResponse({
        model: options.model || 'gemini-1.5-pro',
        prompt,
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      });
    } catch (error) {
      throw new Error(`Google execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeWithPerplexity(config: any, prompt: string, options: any): Promise<any> {
    try {
      // Import Perplexity service dynamically
      const perplexityService = await import('../services/perplexity-service.js');
      return await perplexityService.default.generateResponse({
        model: options.model || 'llama-3.1-sonar-large-128k-online',
        prompt,
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      });
    } catch (error) {
      throw new Error(`Perplexity execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeWithFallback(prompt: string, options: any): Promise<any> {
    try {
      const { logger } = await import('../utils/wai-logger.ts');
      logger.warn('llm-routing', 'Using fallback execution', { promptLength: prompt.length });
      
      // Try providers in order of preference
      const fallbackProviders = ['anthropic', 'openai', 'google'];
      
      for (const provider of fallbackProviders) {
        try {
          const config = this.providerRegistry.getProvider(provider);
          if (config && config.status === 'available') {
            return await this.executeWithProvider(provider, prompt, options);
          }
        } catch (error) {
          logger.warn('llm-routing', `Fallback provider ${provider} failed`, { error });
          continue;
        }
      }
      
      // Final fallback - return structured error response
      return {
        text: "I apologize, but I'm currently unable to process your request due to service limitations. Please try again in a moment.",
        error: 'All providers unavailable',
        fallback: true
      };
    } catch (error) {
      const { logger } = await import('../utils/wai-logger.ts');
      logger.error('llm-routing', 'Fallback execution failed', { error });
      throw error;
    }
  }
}

// Factory function for integration with WAI orchestration  
export function createLLMRoutingEngine(): LLMRoutingEngine {
  return new LLMRoutingEngine();
}

// Export function for other integrations to use
export async function executeWithProvider(provider: string, prompt: string, options: any = {}): Promise<any> {
  const engine = createLLMRoutingEngine();
  return await engine.executeWithProvider(provider, prompt, options);
}