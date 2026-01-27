/**
 * Advanced Caching System with Redis Integration
 * Multi-level caching for optimal performance at scale
 * - L1: In-memory cache (fastest access)
 * - L2: Redis cache (distributed)
 * - L3: Database cache (persistent)
 */

import { mem0Memory } from './mem0-memory';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size
  strategy: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
  compression: boolean; // Enable compression for large values
  replication: boolean; // Enable cache replication
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Size in bytes
  compressed: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  evictions: number;
  memoryUsage: number;
  averageAccessTime: number;
}

export class AdvancedCachingSystem {
  private l1Cache: Map<string, CacheEntry<any>>;
  private l2Cache: Map<string, CacheEntry<any>>; // Redis simulation
  private cacheConfig: Map<string, CacheConfig>;
  private metrics: CacheMetrics;
  private compressionEnabled: boolean;

  constructor() {
    this.l1Cache = new Map();
    this.l2Cache = new Map();
    this.cacheConfig = new Map();
    this.compressionEnabled = true;
    
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      evictions: 0,
      memoryUsage: 0,
      averageAccessTime: 0
    };

    this.initializeDefaultConfigs();
    this.startCleanupTasks();
  }

  private initializeDefaultConfigs() {
    // LLM Response Cache
    this.cacheConfig.set('llm_responses', {
      ttl: 3600, // 1 hour
      maxSize: 1000,
      strategy: 'lru',
      compression: true,
      replication: true
    });

    // Agent State Cache
    this.cacheConfig.set('agent_states', {
      ttl: 1800, // 30 minutes
      maxSize: 500,
      strategy: 'lru',
      compression: false,
      replication: true
    });

    // User Context Cache
    this.cacheConfig.set('user_contexts', {
      ttl: 7200, // 2 hours
      maxSize: 2000,
      strategy: 'lfu', // Least frequently used
      compression: true,
      replication: true
    });

    // API Response Cache
    this.cacheConfig.set('api_responses', {
      ttl: 600, // 10 minutes
      maxSize: 5000,
      strategy: 'fifo',
      compression: true,
      replication: false
    });

    // Task Results Cache
    this.cacheConfig.set('task_results', {
      ttl: 86400, // 24 hours
      maxSize: 1000,
      strategy: 'lru',
      compression: true,
      replication: true
    });

    // Context Engineering Cache
    this.cacheConfig.set('context_engineering', {
      ttl: 3600, // 1 hour
      maxSize: 200,
      strategy: 'lru',
      compression: true,
      replication: true
    });
  }

  /**
   * Get value from cache with multi-level lookup
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    const fullKey = `${namespace}:${key}`;

    try {
      // L1 Cache (fastest)
      let entry = this.l1Cache.get(fullKey);
      if (entry && this.isValidEntry(entry)) {
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.metrics.hits++;
        this.updateMetrics(startTime);
        return this.decompressValue(entry.value, entry.compressed);
      }

      // L2 Cache (Redis simulation)
      entry = this.l2Cache.get(fullKey);
      if (entry && this.isValidEntry(entry)) {
        // Promote to L1
        this.l1Cache.set(fullKey, entry);
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.metrics.hits++;
        this.updateMetrics(startTime);
        return this.decompressValue(entry.value, entry.compressed);
      }

      // L3 Cache (Mem0 integration)
      const memoryData = await mem0Memory.searchMemories(key, { namespace });
      if (memoryData && memoryData.length > 0) {
        const value = memoryData[0].memory;
        await this.set(namespace, key, value, { skipMem0: true });
        this.metrics.hits++;
        this.updateMetrics(startTime);
        return value;
      }

      this.metrics.misses++;
      this.updateMetrics(startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.misses++;
      this.updateMetrics(startTime);
      return null;
    }
  }

  /**
   * Set value in cache with intelligent placement
   */
  async set<T>(
    namespace: string, 
    key: string, 
    value: T, 
    options: { ttl?: number; skipMem0?: boolean } = {}
  ): Promise<void> {
    const fullKey = `${namespace}:${key}`;
    const config = this.cacheConfig.get(namespace) || this.cacheConfig.get('api_responses')!;
    const ttl = options.ttl || config.ttl;
    const compressed = config.compression && this.shouldCompress(value);
    const compressedValue = compressed ? this.compressValue(value) : value;

    const entry: CacheEntry<T> = {
      key: fullKey,
      value: compressedValue,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
      accessCount: 1,
      lastAccessed: Date.now(),
      size: this.calculateSize(value),
      compressed
    };

    // Always store in L1 (memory)
    this.l1Cache.set(fullKey, entry);
    this.enforceL1Limits(namespace);

    // Store in L2 (Redis) if replication enabled
    if (config.replication) {
      this.l2Cache.set(fullKey, { ...entry });
      this.enforceL2Limits(namespace);
    }

    // Store in L3 (Mem0) for persistence if not skipped
    if (!options.skipMem0) {
      try {
        await mem0Memory.storeMemory(`cache:${namespace}`, {
          key,
          value,
          timestamp: new Date().toISOString(),
          ttl,
          namespace
        });
      } catch (error) {
        console.error('Mem0 cache storage error:', error);
      }
    }

    this.updateMemoryUsage();
  }

  /**
   * Delete from all cache levels
   */
  async delete(namespace: string, key: string): Promise<void> {
    const fullKey = `${namespace}:${key}`;
    
    this.l1Cache.delete(fullKey);
    this.l2Cache.delete(fullKey);
    
    try {
      await mem0Memory.deleteMemory(`cache:${namespace}`, key);
    } catch (error) {
      console.error('Mem0 cache deletion error:', error);
    }

    this.updateMemoryUsage();
  }

  /**
   * Cache LLM responses with intelligent context compression
   */
  async cacheLLMResponse(
    prompt: string,
    response: any,
    llmProvider: string,
    userId?: string,
    contextData?: any
  ): Promise<void> {
    const cacheKey = this.generateLLMCacheKey(prompt, llmProvider, userId, contextData);
    
    const cacheData = {
      response,
      llmProvider,
      userId,
      contextHash: this.hashContext(contextData),
      timestamp: Date.now(),
      tokens: response.usage?.total_tokens || 0,
      cost: this.estimateCost(response.usage, llmProvider)
    };

    await this.set('llm_responses', cacheKey, cacheData, { ttl: 3600 });
  }

  /**
   * Get cached LLM response
   */
  async getCachedLLMResponse(
    prompt: string,
    llmProvider: string,
    userId?: string,
    contextData?: any
  ): Promise<any | null> {
    const cacheKey = this.generateLLMCacheKey(prompt, llmProvider, userId, contextData);
    const cached = await this.get('llm_responses', cacheKey);
    
    if (cached && this.isContextCompatible(cached.contextHash, this.hashContext(contextData))) {
      return cached.response;
    }
    
    return null;
  }

  /**
   * Cache agent state for persistence
   */
  async cacheAgentState(agentId: string, state: any, sessionId?: string): Promise<void> {
    const cacheKey = sessionId ? `${agentId}:${sessionId}` : agentId;
    await this.set('agent_states', cacheKey, {
      agentId,
      state,
      sessionId,
      lastUpdated: Date.now()
    }, { ttl: 1800 });
  }

  /**
   * Get cached agent state
   */
  async getCachedAgentState(agentId: string, sessionId?: string): Promise<any | null> {
    const cacheKey = sessionId ? `${agentId}:${sessionId}` : agentId;
    const cached = await this.get('agent_states', cacheKey);
    return cached?.state || null;
  }

  /**
   * Cache user context for personalization
   */
  async cacheUserContext(userId: string, context: any): Promise<void> {
    await this.set('user_contexts', userId, {
      userId,
      context,
      preferences: context.preferences,
      history: context.history,
      learningData: context.learningData,
      lastUpdated: Date.now()
    }, { ttl: 7200 });
  }

  /**
   * Get cached user context
   */
  async getCachedUserContext(userId: string): Promise<any | null> {
    const cached = await this.get('user_contexts', userId);
    return cached?.context || null;
  }

  /**
   * Cache context engineering results
   */
  async cacheContextEngineering(
    originalPrompt: string,
    enhancedPrompt: string,
    contextData: any,
    engineeringRules: string[]
  ): Promise<void> {
    const cacheKey = this.hashString(originalPrompt + JSON.stringify(contextData));
    
    await this.set('context_engineering', cacheKey, {
      originalPrompt,
      enhancedPrompt,
      contextData,
      engineeringRules,
      performance: {
        improvementScore: this.calculateImprovementScore(originalPrompt, enhancedPrompt),
        contextRelevance: this.calculateContextRelevance(contextData)
      },
      timestamp: Date.now()
    }, { ttl: 3600 });
  }

  /**
   * Get cached context engineering
   */
  async getCachedContextEngineering(
    originalPrompt: string,
    contextData: any
  ): Promise<any | null> {
    const cacheKey = this.hashString(originalPrompt + JSON.stringify(contextData));
    return await this.get('context_engineering', cacheKey);
  }

  /**
   * Batch cache operations for efficiency
   */
  async batchSet(operations: Array<{
    namespace: string;
    key: string;
    value: any;
    ttl?: number;
  }>): Promise<void> {
    const promises = operations.map(op => 
      this.set(op.namespace, op.key, op.value, { ttl: op.ttl })
    );
    await Promise.all(promises);
  }

  /**
   * Cache invalidation patterns
   */
  async invalidatePattern(namespace: string, pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    
    // L1 Cache
    for (const [key] of this.l1Cache) {
      if (key.startsWith(`${namespace}:`) && regex.test(key)) {
        this.l1Cache.delete(key);
      }
    }

    // L2 Cache
    for (const [key] of this.l2Cache) {
      if (key.startsWith(`${namespace}:`) && regex.test(key)) {
        this.l2Cache.delete(key);
      }
    }

    this.updateMemoryUsage();
  }

  /**
   * Get cache statistics and health metrics
   */
  getCacheMetrics(): CacheMetrics & {
    l1Size: number;
    l2Size: number;
    topNamespaces: Array<{ namespace: string; count: number }>;
    memoryDistribution: { [namespace: string]: number };
  } {
    const topNamespaces = this.getTopNamespaces();
    const memoryDistribution = this.getMemoryDistribution();

    return {
      ...this.metrics,
      l1Size: this.l1Cache.size,
      l2Size: this.l2Cache.size,
      topNamespaces,
      memoryDistribution
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(userId?: string): Promise<void> {
    try {
      // Warm up user context if provided
      if (userId) {
        const userMemories = await mem0Memory.searchMemories('', { 
          namespace: `cache:user_contexts`,
          limit: 1
        });
        
        if (userMemories.length > 0) {
          await this.set('user_contexts', userId, userMemories[0].memory, { skipMem0: true });
        }
      }

      // Warm up common LLM responses
      const commonPrompts = [
        'analyze this code',
        'explain this concept',
        'generate documentation',
        'create unit tests',
        'optimize performance'
      ];

      for (const prompt of commonPrompts) {
        const memories = await mem0Memory.searchMemories(prompt, { 
          namespace: 'cache:llm_responses',
          limit: 1
        });
        
        if (memories.length > 0) {
          const cacheKey = this.hashString(prompt);
          await this.set('llm_responses', cacheKey, memories[0].memory, { skipMem0: true });
        }
      }

      console.log('🔥 Cache warmed up successfully');
    } catch (error) {
      console.error('Cache warm-up error:', error);
    }
  }

  // Private helper methods
  private isValidEntry(entry: CacheEntry<any>): boolean {
    return (Date.now() - entry.timestamp) < entry.ttl;
  }

  private shouldCompress(value: any): boolean {
    const size = this.calculateSize(value);
    return size > 1024; // Compress if larger than 1KB
  }

  private compressValue(value: any): any {
    // Simple compression simulation - in production use zlib
    return {
      compressed: true,
      data: JSON.stringify(value)
    };
  }

  private decompressValue(value: any, isCompressed: boolean): any {
    if (isCompressed && value.compressed) {
      return JSON.parse(value.data);
    }
    return value;
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  private generateLLMCacheKey(
    prompt: string,
    llmProvider: string,
    userId?: string,
    contextData?: any
  ): string {
    const contextHash = contextData ? this.hashContext(contextData) : '';
    return this.hashString(`${prompt}:${llmProvider}:${userId || ''}:${contextHash}`);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private hashContext(contextData: any): string {
    if (!contextData) return '';
    return this.hashString(JSON.stringify(contextData));
  }

  private isContextCompatible(hash1: string, hash2: string): boolean {
    return hash1 === hash2;
  }

  private estimateCost(usage: any, llmProvider: string): number {
    if (!usage) return 0;
    
    const costPerToken: { [provider: string]: number } = {
      'claude-sonnet-4': 0.000003,
      'gpt-4o': 0.0000025,
      'kimi-k2': 0.0000008,
      'gemini-2.5-pro': 0.000002
    };

    return (usage.total_tokens || 0) * (costPerToken[llmProvider] || 0.000002);
  }

  private calculateImprovementScore(original: string, enhanced: string): number {
    const originalLength = original.length;
    const enhancedLength = enhanced.length;
    const improvement = (enhancedLength - originalLength) / originalLength;
    return Math.max(0, Math.min(100, improvement * 100));
  }

  private calculateContextRelevance(contextData: any): number {
    if (!contextData) return 0;
    const keys = Object.keys(contextData);
    return Math.min(100, keys.length * 10); // Simple relevance score
  }

  private enforceL1Limits(namespace: string): void {
    const config = this.cacheConfig.get(namespace);
    if (!config) return;

    if (this.l1Cache.size > config.maxSize) {
      this.evictEntries(this.l1Cache, config);
    }
  }

  private enforceL2Limits(namespace: string): void {
    const config = this.cacheConfig.get(namespace);
    if (!config) return;

    if (this.l2Cache.size > config.maxSize * 2) { // L2 can be larger
      this.evictEntries(this.l2Cache, config);
    }
  }

  private evictEntries(cache: Map<string, CacheEntry<any>>, config: CacheConfig): void {
    const entries = Array.from(cache.entries());
    
    entries.sort((a, b) => {
      switch (config.strategy) {
        case 'lru':
          return a[1].lastAccessed - b[1].lastAccessed;
        case 'lfu':
          return a[1].accessCount - b[1].accessCount;
        case 'fifo':
        default:
          return a[1].timestamp - b[1].timestamp;
      }
    });

    const toEvict = entries.slice(0, Math.floor(entries.length * 0.1)); // Evict 10%
    toEvict.forEach(([key]) => {
      cache.delete(key);
      this.metrics.evictions++;
    });
  }

  private updateMetrics(startTime: number): void {
    const accessTime = Date.now() - startTime;
    this.metrics.averageAccessTime = 
      (this.metrics.averageAccessTime * (this.metrics.totalRequests - 1) + accessTime) / 
      this.metrics.totalRequests;
    
    this.metrics.hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100;
  }

  private updateMemoryUsage(): void {
    let usage = 0;
    this.l1Cache.forEach(entry => usage += entry.size);
    this.l2Cache.forEach(entry => usage += entry.size);
    this.metrics.memoryUsage = usage;
  }

  private getTopNamespaces(): Array<{ namespace: string; count: number }> {
    const namespaces = new Map<string, number>();
    
    this.l1Cache.forEach((_, key) => {
      const namespace = key.split(':')[0];
      namespaces.set(namespace, (namespaces.get(namespace) || 0) + 1);
    });

    return Array.from(namespaces.entries())
      .map(([namespace, count]) => ({ namespace, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getMemoryDistribution(): { [namespace: string]: number } {
    const distribution: { [namespace: string]: number } = {};
    
    this.l1Cache.forEach((entry, key) => {
      const namespace = key.split(':')[0];
      distribution[namespace] = (distribution[namespace] || 0) + entry.size;
    });

    return distribution;
  }

  private startCleanupTasks(): void {
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);

    // Update metrics every minute
    setInterval(() => {
      this.updateMemoryUsage();
    }, 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    // L1 Cache cleanup
    for (const [key, entry] of this.l1Cache) {
      if (!this.isValidEntry(entry)) {
        this.l1Cache.delete(key);
      }
    }

    // L2 Cache cleanup
    for (const [key, entry] of this.l2Cache) {
      if (!this.isValidEntry(entry)) {
        this.l2Cache.delete(key);
      }
    }

    this.updateMemoryUsage();
  }
}

export const advancedCachingSystem = new AdvancedCachingSystem();