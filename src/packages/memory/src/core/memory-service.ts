/**
 * Memory Service - High-level interface for memory operations
 * Implements mem0-style API with WAI SDK enhancements
 */

import {
  MemoryConfig,
  MemoryStorage,
  MemoryEntry,
  MemorySearchResult,
  MemoryUpdate,
  MemoryStats,
  MemoryType,
  EmbeddingProvider,
  VectorStore,
} from './types';
import { OpenAIEmbeddingProvider } from './embedding-provider';
import { PgVectorStore, InMemoryVectorStore } from './vector-store';
import { PgMemoryStorage } from './memory-storage';
import { ExtractionPipeline } from './extraction-pipeline';

/**
 * Memory Service
 */
export class MemoryService {
  private storage: MemoryStorage;
  private cleanupInterval?: NodeJS.Timeout;
  private extractionPipeline: ExtractionPipeline;
  private enableExtraction: boolean;

  constructor(storage: MemoryStorage, config?: MemoryConfig) {
    this.storage = storage;
    this.extractionPipeline = new ExtractionPipeline();
    this.enableExtraction = config?.extraction?.enabled ?? true;

    // Setup auto-cleanup if enabled
    if (config?.storage?.enableAutoCleanup) {
      const intervalMs = config.storage.cleanupIntervalMs || 3600000; // 1 hour default
      this.cleanupInterval = setInterval(() => {
        this.cleanup().catch(console.error);
      }, intervalMs);
    }
  }

  /**
   * Add memory from messages (mem0-style API with two-phase extraction)
   */
  async add(
    messages: Array<{ role: string; content: string }> | string,
    options: {
      userId?: string;
      sessionId?: string;
      agentId?: string;
      type?: MemoryType;
      metadata?: Record<string, any>;
      tags?: string[];
      priority?: number;
      ttl?: number;
      useExtraction?: boolean; // Override global extraction setting
    } = {}
  ): Promise<MemoryEntry> {
    let content: string;
    let extractedMetadata = options.metadata || {};
    let extractedTags = options.tags || [];

    // Determine if extraction should be used
    const useExtraction = options.useExtraction ?? this.enableExtraction;

    if (typeof messages === 'string') {
      content = messages;
    } else if (useExtraction && messages.length > 0) {
      // Use two-phase extraction pipeline for message arrays
      const result = await this.extractionPipeline.process(messages);

      // Use compressed content (90% token reduction)
      content = result.compressed;

      // Enhance metadata with extraction results (including relationships for lossless storage)
      extractedMetadata = {
        ...extractedMetadata,
        extraction: {
          facts: result.full.facts.length,
          entities: result.full.entities,
          topics: result.full.topics,
          relationships: result.full.relationships, // Preserve raw relationship array
          sentiment: result.full.sentiment,
          compressionRatio: result.compressionRatio,
          originalLength: messages.map(m => m.content).join('\n').length,
          compressedLength: result.compressed.length,
        },
      };

      // Add extracted topics as tags
      extractedTags = [...new Set([...extractedTags, ...result.full.topics])];
    } else {
      // Fallback: simple concatenation (backward compatible)
      content = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    }

    return this.storage.add({
      type: options.type || 'user',
      content,
      userId: options.userId,
      sessionId: options.sessionId,
      agentId: options.agentId,
      metadata: extractedMetadata,
      tags: extractedTags,
      priority: options.priority,
      ttl: options.ttl,
    });
  }

  /**
   * Search memories (mem0-style API)
   */
  async search(
    query: string,
    options: {
      userId?: string;
      sessionId?: string;
      agentId?: string;
      type?: MemoryType;
      tags?: string[];
      limit?: number;
      minSimilarity?: number;
    } = {}
  ): Promise<MemorySearchResult[]> {
    return this.storage.search({
      query,
      userId: options.userId,
      sessionId: options.sessionId,
      agentId: options.agentId,
      type: options.type,
      tags: options.tags,
      limit: options.limit || 10,
      minSimilarity: options.minSimilarity || 0.5,
    });
  }

  /**
   * Get memory by ID
   */
  async get(id: string): Promise<MemoryEntry | null> {
    return this.storage.get(id);
  }

  /**
   * Get all memories with filters (mem0-style API)
   */
  async getAll(filters?: {
    userId?: string;
    sessionId?: string;
    agentId?: string;
    type?: MemoryType;
  }): Promise<MemoryEntry[]> {
    return this.storage.getAll(filters);
  }

  /**
   * Update memory (mem0-style API)
   */
  async update(id: string, updates: MemoryUpdate): Promise<MemoryEntry> {
    return this.storage.update(id, updates);
  }

  /**
   * Delete memory (mem0-style API)
   */
  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  /**
   * Cleanup expired memories
   */
  async cleanup(): Promise<number> {
    return this.storage.cleanup();
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<MemoryStats> {
    return this.storage.getStats();
  }

  /**
   * Close service and cleanup
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Create memory service from configuration
 */
export async function createMemoryService(config: MemoryConfig): Promise<MemoryService> {
  // Create embedding provider
  let embeddingProvider: EmbeddingProvider;
  if (config.embeddingProvider.type === 'openai') {
    const apiKey = config.embeddingProvider.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    embeddingProvider = new OpenAIEmbeddingProvider(
      apiKey,
      config.embeddingProvider.model || 'text-embedding-3-small'
    );
  } else {
    throw new Error(`Unsupported embedding provider: ${config.embeddingProvider.type}`);
  }

  // Create vector store
  let vectorStore: VectorStore;
  if (config.vectorStore.type === 'pgvector') {
    const connectionString = config.vectorStore.connectionString || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Database connection string is required for pgvector');
    }
    vectorStore = new PgVectorStore(
      connectionString,
      config.vectorStore.tableName || 'wai_memory_vectors',
      config.vectorStore.dimension || embeddingProvider.getDimension()
    );
  } else {
    vectorStore = new InMemoryVectorStore(
      config.vectorStore.dimension || embeddingProvider.getDimension()
    );
  }

  // Create storage
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Database connection string is required');
  }

  const storage = new PgMemoryStorage(
    connectionString,
    vectorStore,
    embeddingProvider,
    config.storage?.tableName || 'wai_memories'
  );

  await storage.initialize();

  return new MemoryService(storage, config);
}
