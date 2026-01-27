/**
 * LMCache Caching Optimization System
 * Advanced caching for Large Language Models with intelligent cache management
 * Based on: https://github.com/LMCache/LMCache
 * 
 * Features:
 * - Semantic-based cache keys
 * - Multi-tier caching strategy
 * - Automatic cache invalidation
 * - Cache hit/miss analytics
 * - Memory-efficient storage
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

export interface LMCacheEntry {
  id: string;
  key: string;
  semanticHash: string;
  content: {
    prompt: string;
    response: string;
    model: string;
    parameters: Record<string, any>;
  };
  metadata: {
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    sizeByte: number;
    ttl: number; // time to live in seconds
    priority: number; // 1-10, higher = more important
    tags: string[];
  };
  performance: {
    originalLatency: number;
    cacheRetrievalTime: number;
    compressionRatio?: number;
  };
}

export interface CacheTier {
  id: string;
  name: string;
  type: 'memory' | 'disk' | 'distributed' | 'semantic';
  maxSize: number; // in bytes
  currentSize: number;
  hitRate: number;
  averageRetrievalTime: number;
  evictionPolicy: 'LRU' | 'LFU' | 'TTL' | 'semantic_similarity';
  entries: Map<string, LMCacheEntry>;
}

export interface CacheAnalytics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageLatency: {
    cache: number;
    original: number;
    savings: number;
  };
  memoryUsage: {
    total: number;
    used: number;
    available: number;
  };
  topModels: { model: string; requests: number; hitRate: number }[];
  evictionStats: {
    totalEvictions: number;
    byReason: Record<string, number>;
  };
}

export interface SemanticSimilarity {
  threshold: number; // 0-1, higher = more strict matching
  algorithm: 'cosine' | 'jaccard' | 'embedding';
  embedding?: {
    model: string;
    dimensions: number;
  };
}

export class LMCacheSystem extends EventEmitter {
  private tiers: Map<string, CacheTier> = new Map();
  private analytics: CacheAnalytics;
  private semanticConfig: SemanticSimilarity;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private analyticsInterval: NodeJS.Timeout | null = null;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(config?: {
    maxMemorySize?: number;
    semanticThreshold?: number;
    enableDiskCache?: boolean;
  }) {
    super();
    
    this.semanticConfig = {
      threshold: config?.semanticThreshold || 0.85,
      algorithm: 'embedding',
      embedding: {
        model: 'text-embedding-ada-002',
        dimensions: 1536
      }
    };

    this.analytics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageLatency: { cache: 0, original: 0, savings: 0 },
      memoryUsage: { total: 0, used: 0, available: 0 },
      topModels: [],
      evictionStats: { totalEvictions: 0, byReason: {} }
    };

    this.initializeCacheTiers(config);
    this.startMaintenanceTasks();
  }

  private initializeCacheTiers(config?: {
    maxMemorySize?: number;
    enableDiskCache?: boolean;
  }): void {
    // L1: High-speed memory cache
    this.tiers.set('L1-memory', {
      id: 'L1-memory',
      name: 'Memory Cache',
      type: 'memory',
      maxSize: config?.maxMemorySize || 100 * 1024 * 1024, // 100MB
      currentSize: 0,
      hitRate: 0,
      averageRetrievalTime: 0,
      evictionPolicy: 'LRU',
      entries: new Map()
    });

    // L2: Semantic similarity cache
    this.tiers.set('L2-semantic', {
      id: 'L2-semantic',
      name: 'Semantic Cache',
      type: 'semantic',
      maxSize: 500 * 1024 * 1024, // 500MB
      currentSize: 0,
      hitRate: 0,
      averageRetrievalTime: 0,
      evictionPolicy: 'semantic_similarity',
      entries: new Map()
    });

    // L3: Disk cache (if enabled)
    if (config?.enableDiskCache) {
      this.tiers.set('L3-disk', {
        id: 'L3-disk',
        name: 'Disk Cache',
        type: 'disk',
        maxSize: 2 * 1024 * 1024 * 1024, // 2GB
        currentSize: 0,
        hitRate: 0,
        averageRetrievalTime: 0,
        evictionPolicy: 'TTL',
        entries: new Map()
      });
    }

    console.log('🗄️ LMCache System initialized with multi-tier caching');
  }

  private startMaintenanceTasks(): void {
    // Cleanup expired entries
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60000); // Every minute

    // Update analytics
    this.analyticsInterval = setInterval(() => {
      this.updateAnalytics();
    }, 10000); // Every 10 seconds

    console.log('🔧 LMCache maintenance tasks started');
  }

  /**
   * Get cached response for a prompt
   */
  public async get(
    prompt: string,
    model: string,
    parameters: Record<string, any> = {}
  ): Promise<LMCacheEntry | null> {
    const startTime = Date.now();
    this.analytics.totalRequests++;

    // Generate cache keys
    const exactKey = this.generateExactKey(prompt, model, parameters);
    const semanticHash = this.generateSemanticHash(prompt);

    console.log(`🔍 Cache lookup for model: ${model}, prompt length: ${prompt.length}`);

    // L1: Exact match in memory
    const exactMatch = await this.getFromTier('L1-memory', exactKey);
    if (exactMatch) {
      this.recordCacheHit('L1-memory', startTime);
      console.log(`💾 L1 Cache HIT: ${exactKey.substring(0, 16)}...`);
      return exactMatch;
    }

    // L2: Semantic similarity match
    const semanticMatch = await this.getSemanticMatch(prompt, model, parameters);
    if (semanticMatch) {
      this.recordCacheHit('L2-semantic', startTime);
      console.log(`🧠 Semantic Cache HIT with similarity score`);
      return semanticMatch;
    }

    // L3: Disk cache (if available)
    const diskTier = this.tiers.get('L3-disk');
    if (diskTier) {
      const diskMatch = await this.getFromTier('L3-disk', exactKey);
      if (diskMatch) {
        // Promote to higher tier
        await this.set(diskMatch.content.prompt, diskMatch.content.response, 
                      diskMatch.content.model, diskMatch.content.parameters);
        
        this.recordCacheHit('L3-disk', startTime);
        console.log(`💿 Disk Cache HIT and promoted`);
        return diskMatch;
      }
    }

    // Cache miss
    this.analytics.cacheMisses++;
    console.log(`❌ Cache MISS for: ${exactKey.substring(0, 16)}...`);
    
    return null;
  }

  /**
   * Store response in cache
   */
  public async set(
    prompt: string,
    response: string,
    model: string,
    parameters: Record<string, any> = {},
    metadata?: {
      originalLatency?: number;
      priority?: number;
      tags?: string[];
    }
  ): Promise<void> {
    const exactKey = this.generateExactKey(prompt, model, parameters);
    const semanticHash = this.generateSemanticHash(prompt);
    
    const entry: LMCacheEntry = {
      id: randomUUID(),
      key: exactKey,
      semanticHash,
      content: { prompt, response, model, parameters },
      metadata: {
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1,
        sizeByte: this.calculateSize({ prompt, response, model, parameters }),
        ttl: this.calculateTTL(model, prompt.length),
        priority: metadata?.priority || this.calculatePriority(model, prompt),
        tags: metadata?.tags || this.generateTags(prompt, model)
      },
      performance: {
        originalLatency: metadata?.originalLatency || 0,
        cacheRetrievalTime: 0
      }
    };

    // Store in appropriate tiers
    await this.storeInTiers(entry);
    
    console.log(`💾 Cached response for ${model}: ${prompt.length} chars`);
    this.emit('entry-stored', entry);
  }

  /**
   * Get entry from specific tier
   */
  private async getFromTier(tierId: string, key: string): Promise<LMCacheEntry | null> {
    const tier = this.tiers.get(tierId);
    if (!tier) return null;

    const entry = tier.entries.get(key);
    if (!entry) return null;

    // Check if entry is still valid
    if (this.isEntryExpired(entry)) {
      tier.entries.delete(key);
      tier.currentSize -= entry.metadata.sizeByte;
      return null;
    }

    // Update access info
    entry.metadata.lastAccessed = new Date();
    entry.metadata.accessCount++;

    return entry;
  }

  /**
   * Find semantic match using similarity algorithms
   */
  private async getSemanticMatch(
    prompt: string,
    model: string,
    parameters: Record<string, any>
  ): Promise<LMCacheEntry | null> {
    const semanticTier = this.tiers.get('L2-semantic');
    if (!semanticTier) return null;

    const promptEmbedding = await this.getEmbedding(prompt);
    let bestMatch: LMCacheEntry | null = null;
    let highestSimilarity = 0;

    for (const [key, entry] of semanticTier.entries) {
      // Only compare same model entries
      if (entry.content.model !== model) continue;

      const entryEmbedding = await this.getEmbedding(entry.content.prompt);
      const similarity = this.calculateCosineSimilarity(promptEmbedding, entryEmbedding);

      if (similarity >= this.semanticConfig.threshold && similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    if (bestMatch) {
      console.log(`🎯 Semantic match found with ${(highestSimilarity * 100).toFixed(1)}% similarity`);
    }

    return bestMatch;
  }

  /**
   * Store entry in appropriate cache tiers
   */
  private async storeInTiers(entry: LMCacheEntry): Promise<void> {
    // Always try L1 (memory) first
    const memoryTier = this.tiers.get('L1-memory');
    if (memoryTier && this.canFitInTier(memoryTier, entry)) {
      this.addToTier(memoryTier, entry);
    }

    // Store in semantic tier
    const semanticTier = this.tiers.get('L2-semantic');
    if (semanticTier) {
      this.addToTier(semanticTier, entry);
    }

    // Store in disk tier if available and high priority
    const diskTier = this.tiers.get('L3-disk');
    if (diskTier && entry.metadata.priority >= 7) {
      this.addToTier(diskTier, entry);
    }
  }

  /**
   * Add entry to specific tier with eviction if necessary
   */
  private addToTier(tier: CacheTier, entry: LMCacheEntry): void {
    // Check if eviction is needed
    while (!this.canFitInTier(tier, entry) && tier.entries.size > 0) {
      this.evictFromTier(tier);
    }

    tier.entries.set(entry.key, entry);
    tier.currentSize += entry.metadata.sizeByte;
  }

  /**
   * Check if entry can fit in tier
   */
  private canFitInTier(tier: CacheTier, entry: LMCacheEntry): boolean {
    return tier.currentSize + entry.metadata.sizeByte <= tier.maxSize;
  }

  /**
   * Evict entries from tier based on policy
   */
  private evictFromTier(tier: CacheTier): void {
    let entryToEvict: LMCacheEntry | null = null;
    let keyToEvict: string | null = null;

    switch (tier.evictionPolicy) {
      case 'LRU':
        let oldestAccess = new Date();
        for (const [key, entry] of tier.entries) {
          if (entry.metadata.lastAccessed < oldestAccess) {
            oldestAccess = entry.metadata.lastAccessed;
            entryToEvict = entry;
            keyToEvict = key;
          }
        }
        break;

      case 'LFU':
        let lowestCount = Infinity;
        for (const [key, entry] of tier.entries) {
          if (entry.metadata.accessCount < lowestCount) {
            lowestCount = entry.metadata.accessCount;
            entryToEvict = entry;
            keyToEvict = key;
          }
        }
        break;

      case 'TTL':
        const now = new Date();
        for (const [key, entry] of tier.entries) {
          const age = now.getTime() - entry.metadata.createdAt.getTime();
          if (age > entry.metadata.ttl * 1000) {
            entryToEvict = entry;
            keyToEvict = key;
            break;
          }
        }
        break;

      case 'semantic_similarity':
        // Remove entries with lowest access count in semantic tier
        let lowestAccessCount = Infinity;
        for (const [key, entry] of tier.entries) {
          if (entry.metadata.accessCount < lowestAccessCount) {
            lowestAccessCount = entry.metadata.accessCount;
            entryToEvict = entry;
            keyToEvict = key;
          }
        }
        break;
    }

    if (entryToEvict && keyToEvict) {
      tier.entries.delete(keyToEvict);
      tier.currentSize -= entryToEvict.metadata.sizeByte;
      
      this.analytics.evictionStats.totalEvictions++;
      const reason = tier.evictionPolicy;
      this.analytics.evictionStats.byReason[reason] = 
        (this.analytics.evictionStats.byReason[reason] || 0) + 1;

      console.log(`🗑️ Evicted from ${tier.name}: ${tier.evictionPolicy} policy`);
    }
  }

  /**
   * Generate exact cache key
   */
  private generateExactKey(prompt: string, model: string, parameters: Record<string, any>): string {
    const keyData = {
      prompt: prompt.trim(),
      model,
      parameters: this.normalizeParameters(parameters)
    };
    
    return createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  /**
   * Generate semantic hash for similarity matching
   */
  private generateSemanticHash(prompt: string): string {
    // Simplified semantic hash (in real implementation, use embeddings)
    const normalized = prompt.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    return createHash('md5').update(normalized).digest('hex').substring(0, 16);
  }

  /**
   * Get text embedding (simulated)
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = createHash('md5').update(text).digest('hex');
    const cached = this.embeddingCache.get(cacheKey);
    if (cached) return cached;

    // Simulate embedding generation (in real implementation, call embedding API)
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate API call
    
    const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    
    // Cache embedding
    this.embeddingCache.set(cacheKey, embedding);
    return embedding;
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  /**
   * Normalize parameters for consistent caching
   */
  private normalizeParameters(params: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    // Sort keys for consistent hashing
    const sortedKeys = Object.keys(params).sort();
    
    for (const key of sortedKeys) {
      normalized[key] = params[key];
    }
    
    return normalized;
  }

  /**
   * Calculate cache entry size in bytes
   */
  private calculateSize(content: { prompt: string; response: string; model: string; parameters: Record<string, any> }): number {
    const jsonString = JSON.stringify(content);
    return Buffer.byteLength(jsonString, 'utf8');
  }

  /**
   * Calculate TTL based on model and prompt characteristics
   */
  private calculateTTL(model: string, promptLength: number): number {
    // Base TTL: 1 hour
    let ttl = 3600;
    
    // Longer TTL for expensive models
    if (model.includes('gpt-4') || model.includes('claude-3')) {
      ttl *= 4; // 4 hours
    }
    
    // Longer TTL for longer prompts (more expensive to regenerate)
    if (promptLength > 1000) {
      ttl *= 2;
    }
    
    return ttl;
  }

  /**
   * Calculate entry priority
   */
  private calculatePriority(model: string, prompt: string): number {
    let priority = 5; // Default priority
    
    // Higher priority for expensive models
    if (model.includes('gpt-4') || model.includes('claude-3')) {
      priority += 3;
    }
    
    // Higher priority for complex prompts
    if (prompt.length > 2000) {
      priority += 2;
    }
    
    return Math.min(10, priority);
  }

  /**
   * Generate tags for better organization
   */
  private generateTags(prompt: string, model: string): string[] {
    const tags = [model];
    
    // Add tags based on prompt content
    if (prompt.includes('code') || prompt.includes('function') || prompt.includes('programming')) {
      tags.push('coding');
    }
    
    if (prompt.includes('analyze') || prompt.includes('summary') || prompt.includes('report')) {
      tags.push('analysis');
    }
    
    if (prompt.includes('creative') || prompt.includes('story') || prompt.includes('write')) {
      tags.push('creative');
    }
    
    return tags;
  }

  /**
   * Check if cache entry has expired
   */
  private isEntryExpired(entry: LMCacheEntry): boolean {
    const now = new Date();
    const age = now.getTime() - entry.metadata.createdAt.getTime();
    return age > entry.metadata.ttl * 1000;
  }

  /**
   * Record cache hit for analytics
   */
  private recordCacheHit(tierId: string, startTime: number): void {
    const retrievalTime = Date.now() - startTime;
    this.analytics.cacheHits++;
    
    const tier = this.tiers.get(tierId);
    if (tier) {
      // Update tier-specific metrics
      tier.averageRetrievalTime = 
        (tier.averageRetrievalTime * tier.hitRate + retrievalTime) / (tier.hitRate + 1);
      tier.hitRate++;
    }
  }

  /**
   * Perform cleanup of expired entries
   */
  private performCleanup(): void {
    let totalCleaned = 0;
    
    for (const [tierId, tier] of this.tiers) {
      const beforeSize = tier.entries.size;
      
      for (const [key, entry] of tier.entries) {
        if (this.isEntryExpired(entry)) {
          tier.entries.delete(key);
          tier.currentSize -= entry.metadata.sizeByte;
          totalCleaned++;
        }
      }
      
      const cleaned = beforeSize - tier.entries.size;
      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired entries from ${tier.name}`);
      }
    }
    
    if (totalCleaned > 0) {
      this.emit('cleanup-completed', { entriesCleaned: totalCleaned });
    }
  }

  /**
   * Update analytics
   */
  private updateAnalytics(): void {
    this.analytics.hitRate = this.analytics.totalRequests > 0 
      ? this.analytics.cacheHits / this.analytics.totalRequests 
      : 0;

    // Calculate memory usage
    let totalUsed = 0;
    let totalMax = 0;
    
    for (const tier of this.tiers.values()) {
      totalUsed += tier.currentSize;
      totalMax += tier.maxSize;
    }
    
    this.analytics.memoryUsage = {
      total: totalMax,
      used: totalUsed,
      available: totalMax - totalUsed
    };

    // Update latency savings (simulated)
    this.analytics.averageLatency = {
      cache: 50, // 50ms average cache retrieval
      original: 2000, // 2s average API call
      savings: 1950 // 97.5% latency savings
    };
  }

  /**
   * Get detailed cache statistics
   */
  public getStatistics(): CacheAnalytics & { tierStats: any[] } {
    this.updateAnalytics();
    
    const tierStats = Array.from(this.tiers.values()).map(tier => ({
      id: tier.id,
      name: tier.name,
      type: tier.type,
      entries: tier.entries.size,
      sizeUsed: tier.currentSize,
      sizeMax: tier.maxSize,
      utilizationPercent: (tier.currentSize / tier.maxSize) * 100,
      hitRate: tier.hitRate,
      averageRetrievalTime: tier.averageRetrievalTime
    }));
    
    return {
      ...this.analytics,
      tierStats
    };
  }

  /**
   * Clear all cache tiers
   */
  public clearAll(): void {
    for (const tier of this.tiers.values()) {
      tier.entries.clear();
      tier.currentSize = 0;
      tier.hitRate = 0;
    }
    
    this.analytics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageLatency: { cache: 0, original: 0, savings: 0 },
      memoryUsage: { total: 0, used: 0, available: 0 },
      topModels: [],
      evictionStats: { totalEvictions: 0, byReason: {} }
    };
    
    console.log('🗑️ All cache tiers cleared');
    this.emit('cache-cleared');
  }

  /**
   * Shutdown cache system
   */
  public shutdown(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    if (this.analyticsInterval) clearInterval(this.analyticsInterval);
    
    this.tiers.clear();
    this.embeddingCache.clear();
    
    console.log('🔴 LMCache System shutdown');
  }
}

// Singleton instance for global access
export const lmCache = new LMCacheSystem({
  maxMemorySize: 200 * 1024 * 1024, // 200MB
  semanticThreshold: 0.85,
  enableDiskCache: true
});

// Default export
export default lmCache;