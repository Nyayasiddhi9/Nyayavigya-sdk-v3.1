/**
 * Embedding Service for WAI Knowledge Base System
 * Production-ready text embedding generation with multiple provider support
 */
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';

export interface EmbeddingRequest {
  text: string;
  model?: string;
  provider?: EmbeddingProvider;
  metadata?: Record<string, any>;
  maxTokens?: number;
  chunkSize?: number;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  provider: EmbeddingProvider;
  tokenCount: number;
  cost?: number;
  processingTime: number;
  metadata?: Record<string, any>;
}

export interface BatchEmbeddingRequest {
  texts: string[];
  model?: string;
  provider?: EmbeddingProvider;
  metadata?: Record<string, any>;
  maxTokens?: number;
  batchSize?: number;
}

export interface BatchEmbeddingResponse {
  embeddings: EmbeddingResponse[];
  totalCost: number;
  totalProcessingTime: number;
  successCount: number;
  errorCount: number;
  errors: EmbeddingError[];
}

export interface EmbeddingError {
  text: string;
  error: string;
  index: number;
}

export type EmbeddingProvider = 'openai' | 'anthropic' | 'google' | 'huggingface' | 'cohere' | 'local';

export interface EmbeddingProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model: string;
  dimension: number;
  maxTokens: number;
  costPerToken: number;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface EmbeddingServiceConfig {
  providers: Record<EmbeddingProvider, EmbeddingProviderConfig>;
  defaultProvider: EmbeddingProvider;
  defaultModel: string;
  caching: {
    enabled: boolean;
    ttl: number; // in seconds
    maxSize: number;
  };
  rateLimiting: {
    enabled: boolean;
    maxConcurrent: number;
    requestDelay: number;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
  };
}

export interface EmbeddingMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  averageProcessingTime: number;
  totalTokensProcessed: number;
  providerUsage: Record<EmbeddingProvider, number>;
  modelUsage: Record<string, number>;
  cacheHitRate: number;
}

export interface EmbeddingCache {
  get(key: string): Promise<number[] | null>;
  set(key: string, embedding: number[], ttl: number): Promise<void>;
  clear(): Promise<void>;
  size(): Promise<number>;
}

class MemoryEmbeddingCache implements EmbeddingCache {
  private cache = new Map<string, { embedding: number[]; expires: number }>();
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  async get(key: string): Promise<number[] | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.embedding;
  }

  async set(key: string, embedding: number[], ttl: number): Promise<void> {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries (simple LRU)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      embedding,
      expires: Date.now() + (ttl * 1000)
    });
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async size(): Promise<number> {
    return this.cache.size;
  }
}

export class EmbeddingService extends EventEmitter {
  private config: EmbeddingServiceConfig;
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private googleClient?: GoogleGenerativeAI;
  private cache: EmbeddingCache;
  private metrics: EmbeddingMetrics;
  private rateLimiters: Map<EmbeddingProvider, { lastRequest: number; requestCount: number }>;

  constructor(config: EmbeddingServiceConfig) {
    super();
    this.config = config;
    this.cache = new MemoryEmbeddingCache(config.caching.maxSize);
    this.rateLimiters = new Map();

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalCost: 0,
      averageProcessingTime: 0,
      totalTokensProcessed: 0,
      providerUsage: {},
      modelUsage: {},
      cacheHitRate: 0
    };

    this.initializeProviders();
    this.startMetricsCollection();
  }

  private initializeProviders(): void {
    const providers = this.config.providers;

    // Initialize OpenAI
    if (providers.openai?.apiKey) {
      this.openaiClient = new OpenAI({
        apiKey: providers.openai.apiKey,
        baseURL: providers.openai.baseURL,
        dangerouslyAllowBrowser: true
      });
    }

    // Initialize Anthropic
    if (providers.anthropic?.apiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: providers.anthropic.apiKey
      });
    }

    // Initialize Google AI
    if (providers.google?.apiKey) {
      this.googleClient = new GoogleGenerativeAI(providers.google.apiKey);
    }

    console.log('🧠 Embedding service initialized with providers:', Object.keys(providers));
  }

  private startMetricsCollection(): void {
    if (!this.config.monitoring.enabled) return;

    setInterval(() => {
      this.emit('metrics', this.metrics);
    }, this.config.monitoring.metricsInterval);
  }

  private async checkRateLimit(provider: EmbeddingProvider): Promise<void> {
    if (!this.config.rateLimiting.enabled) return;

    const now = Date.now();
    const rateLimiter = this.rateLimiters.get(provider) || { lastRequest: 0, requestCount: 0 };
    const providerConfig = this.config.providers[provider];

    if (!providerConfig) return;

    // Reset count every minute
    if (now - rateLimiter.lastRequest > 60000) {
      rateLimiter.requestCount = 0;
    }

    // Check if we're hitting rate limits
    if (rateLimiter.requestCount >= providerConfig.rateLimit.requestsPerMinute) {
      const waitTime = 60000 - (now - rateLimiter.lastRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      rateLimiter.requestCount = 0;
    }

    rateLimiter.lastRequest = now;
    rateLimiter.requestCount++;
    this.rateLimiters.set(provider, rateLimiter);

    // Add delay between requests
    if (this.config.rateLimiting.requestDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.rateLimiting.requestDelay));
    }
  }

  private generateCacheKey(text: string, model: string, provider: EmbeddingProvider): string {
    // Simple hash for cache key
    const content = `${provider}:${model}:${text}`;
    return Buffer.from(content).toString('base64').slice(0, 50);
  }

  private async getCachedEmbedding(
    text: string, 
    model: string, 
    provider: EmbeddingProvider
  ): Promise<number[] | null> {
    if (!this.config.caching.enabled) return null;
    
    const cacheKey = this.generateCacheKey(text, model, provider);
    return await this.cache.get(cacheKey);
  }

  private async cacheEmbedding(
    text: string, 
    model: string, 
    provider: EmbeddingProvider, 
    embedding: number[]
  ): Promise<void> {
    if (!this.config.caching.enabled) return;
    
    const cacheKey = this.generateCacheKey(text, model, provider);
    await this.cache.set(cacheKey, embedding, this.config.caching.ttl);
  }

  private async generateOpenAIEmbedding(
    text: string, 
    model: string
  ): Promise<{ embedding: number[]; tokenCount: number; cost: number }> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openaiClient.embeddings.create({
      model,
      input: text,
      encoding_format: 'float'
    });

    const embedding = response.data[0].embedding;
    const tokenCount = response.usage.total_tokens;
    const providerConfig = this.config.providers.openai;
    const cost = tokenCount * providerConfig.costPerToken;

    return { embedding, tokenCount, cost };
  }

  private async generateGoogleEmbedding(
    text: string, 
    model: string
  ): Promise<{ embedding: number[]; tokenCount: number; cost: number }> {
    if (!this.googleClient) {
      throw new Error('Google AI client not initialized');
    }

    const embeddingModel = this.googleClient.getGenerativeModel({ model });
    const result = await embeddingModel.embedContent(text);
    
    const embedding = result.embedding.values || [];
    const tokenCount = text.split(' ').length; // Rough estimation
    const providerConfig = this.config.providers.google;
    const cost = tokenCount * providerConfig.costPerToken;

    return { embedding, tokenCount, cost };
  }

  private async generateAnthropicEmbedding(
    text: string, 
    model: string
  ): Promise<{ embedding: number[]; tokenCount: number; cost: number }> {
    // Anthropic doesn't have a direct embedding API, this is a placeholder
    // In practice, you might use a different approach or provider
    throw new Error('Anthropic embedding not yet implemented');
  }

  private async generateLocalEmbedding(
    text: string, 
    model: string
  ): Promise<{ embedding: number[]; tokenCount: number; cost: number }> {
    // Placeholder for local embedding models (e.g., using transformers.js)
    // This would require implementing a local embedding model
    throw new Error('Local embedding not yet implemented');
  }

  private updateMetrics(
    provider: EmbeddingProvider,
    model: string,
    processingTime: number,
    tokenCount: number,
    cost: number,
    success: boolean,
    cacheHit: boolean
  ): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    this.metrics.totalCost += cost;
    this.metrics.totalTokensProcessed += tokenCount;
    
    // Update average processing time
    this.metrics.averageProcessingTime = 
      ((this.metrics.averageProcessingTime * (this.metrics.totalRequests - 1)) + processingTime) / 
      this.metrics.totalRequests;

    // Update provider usage
    this.metrics.providerUsage[provider] = (this.metrics.providerUsage[provider] || 0) + 1;
    
    // Update model usage
    this.metrics.modelUsage[model] = (this.metrics.modelUsage[model] || 0) + 1;

    // Update cache hit rate
    if (cacheHit) {
      const totalCacheableRequests = this.metrics.totalRequests;
      this.metrics.cacheHitRate = 
        ((this.metrics.cacheHitRate * (totalCacheableRequests - 1)) + 1) / totalCacheableRequests;
    }
  }

  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = Date.now();
    const provider = request.provider || this.config.defaultProvider;
    const model = request.model || this.config.defaultModel;
    
    let cacheHit = false;
    let embedding: number[];
    let tokenCount: number;
    let cost: number;

    try {
      // Check cache first
      const cachedEmbedding = await this.getCachedEmbedding(request.text, model, provider);
      if (cachedEmbedding) {
        embedding = cachedEmbedding;
        tokenCount = request.text.split(' ').length; // Estimation
        cost = 0; // No cost for cached results
        cacheHit = true;
      } else {
        // Check rate limits
        await this.checkRateLimit(provider);

        // Generate embedding based on provider
        switch (provider) {
          case 'openai':
            ({ embedding, tokenCount, cost } = await this.generateOpenAIEmbedding(request.text, model));
            break;
          case 'google':
            ({ embedding, tokenCount, cost } = await this.generateGoogleEmbedding(request.text, model));
            break;
          case 'anthropic':
            ({ embedding, tokenCount, cost } = await this.generateAnthropicEmbedding(request.text, model));
            break;
          case 'local':
            ({ embedding, tokenCount, cost } = await this.generateLocalEmbedding(request.text, model));
            break;
          default:
            throw new Error(`Unsupported embedding provider: ${provider}`);
        }

        // Cache the result
        await this.cacheEmbedding(request.text, model, provider, embedding);
      }

      const processingTime = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(provider, model, processingTime, tokenCount, cost, true, cacheHit);

      return {
        embedding,
        model,
        provider,
        tokenCount,
        cost,
        processingTime,
        metadata: request.metadata
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(provider, model, processingTime, 0, 0, false, false);
      
      console.error(`Embedding generation failed for provider ${provider}:`, error);
      throw error;
    }
  }

  async generateBatchEmbeddings(request: BatchEmbeddingRequest): Promise<BatchEmbeddingResponse> {
    const startTime = Date.now();
    const batchSize = request.batchSize || 10;
    const embeddings: EmbeddingResponse[] = [];
    const errors: EmbeddingError[] = [];
    
    let totalCost = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < request.texts.length; i += batchSize) {
      const batch = request.texts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (text, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const embeddingRequest: EmbeddingRequest = {
            text,
            model: request.model,
            provider: request.provider,
            metadata: { ...request.metadata, originalIndex: globalIndex },
            maxTokens: request.maxTokens
          };

          const response = await this.generateEmbedding(embeddingRequest);
          embeddings[globalIndex] = response;
          totalCost += response.cost || 0;
          successCount++;
          
        } catch (error) {
          errors.push({
            text,
            error: error instanceof Error ? error.message : 'Unknown error',
            index: globalIndex
          });
          errorCount++;
        }
      });

      await Promise.all(batchPromises);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < request.texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    return {
      embeddings: embeddings.filter(Boolean), // Remove undefined entries
      totalCost,
      totalProcessingTime,
      successCount,
      errorCount,
      errors
    };
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  async getCacheSize(): Promise<number> {
    return await this.cache.size();
  }

  getMetrics(): EmbeddingMetrics {
    return { ...this.metrics };
  }

  async healthCheck(): Promise<{ status: string; providers: Record<string, boolean> }> {
    const providerStatus: Record<string, boolean> = {};

    // Test each provider with a simple embedding
    const testText = "Hello, world!";

    for (const [providerName, config] of Object.entries(this.config.providers)) {
      try {
        const response = await this.generateEmbedding({
          text: testText,
          provider: providerName as EmbeddingProvider,
          model: config.model
        });
        providerStatus[providerName] = response.embedding.length > 0;
      } catch (error) {
        providerStatus[providerName] = false;
      }
    }

    const allHealthy = Object.values(providerStatus).every(status => status);
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      providers: providerStatus
    };
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down embedding service...');
    await this.clearCache();
    this.removeAllListeners();
  }
}

// Default configuration
export const defaultEmbeddingConfig: EmbeddingServiceConfig = {
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
      dimension: 1536,
      maxTokens: 8192,
      costPerToken: 0.00002,
      rateLimit: {
        requestsPerMinute: 3000,
        tokensPerMinute: 1000000
      }
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY,
      model: 'embedding-001',
      dimension: 768,
      maxTokens: 2048,
      costPerToken: 0.00001,
      rateLimit: {
        requestsPerMinute: 1500,
        tokensPerMinute: 300000
      }
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-haiku',
      dimension: 1024,
      maxTokens: 4096,
      costPerToken: 0.00003,
      rateLimit: {
        requestsPerMinute: 1000,
        tokensPerMinute: 200000
      }
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      dimension: 384,
      maxTokens: 512,
      costPerToken: 0,
      rateLimit: {
        requestsPerMinute: 1000,
        tokensPerMinute: 100000
      }
    },
    cohere: {
      apiKey: process.env.COHERE_API_KEY,
      model: 'embed-english-v3.0',
      dimension: 1024,
      maxTokens: 512,
      costPerToken: 0.0001,
      rateLimit: {
        requestsPerMinute: 1000,
        tokensPerMinute: 100000
      }
    },
    local: {
      model: 'all-MiniLM-L6-v2',
      dimension: 384,
      maxTokens: 512,
      costPerToken: 0,
      rateLimit: {
        requestsPerMinute: 10000,
        tokensPerMinute: 1000000
      }
    }
  },
  defaultProvider: 'openai',
  defaultModel: 'text-embedding-3-small',
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 10000
  },
  rateLimiting: {
    enabled: true,
    maxConcurrent: 10,
    requestDelay: 50
  },
  monitoring: {
    enabled: true,
    metricsInterval: 60000 // 1 minute
  }
};

// Utility functions
export function chunkText(text: string, maxTokens: number = 500): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokenCount = 0;

  for (const word of words) {
    const wordTokenCount = Math.ceil(word.length / 4); // Rough estimation
    
    if (currentTokenCount + wordTokenCount > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentTokenCount = wordTokenCount;
    } else {
      currentChunk.push(word);
      currentTokenCount += wordTokenCount;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

// Export singleton instance
export const embeddingService = new EmbeddingService(defaultEmbeddingConfig);