/**
 * WAI Memory System - Core Types
 * Based on mem0 architecture with enhancements for WAI SDK
 */

/**
 * Memory Types - Following mem0 classification
 */
export type MemoryType = 'user' | 'session' | 'agent' | 'entity';

/**
 * Memory Entry - Core data structure
 */
export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  userId?: string;
  sessionId?: string;
  agentId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  accessCount: number;
  lastAccessedAt?: string; // ISO 8601
  priority?: number; // 0-100, for filtering
  ttl?: number; // Time to live in seconds
}

/**
 * Memory Search Query
 */
export interface MemorySearchQuery {
  query: string;
  type?: MemoryType;
  userId?: string;
  sessionId?: string;
  agentId?: string;
  tags?: string[];
  limit?: number;
  minSimilarity?: number; // 0-1 threshold for vector search
  filters?: Record<string, any>;
}

/**
 * Memory Search Result
 */
export interface MemorySearchResult {
  memory: MemoryEntry;
  similarity: number; // 0-1 cosine similarity score
  relevance: number; // 0-1 combined score (similarity + priority + recency)
}

/**
 * Memory Update Operation
 */
export interface MemoryUpdate {
  content?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  priority?: number;
  ttl?: number;
}

/**
 * Memory Statistics
 */
export interface MemoryStats {
  totalMemories: number;
  memoryByType: Record<MemoryType, number>;
  totalEmbeddings: number;
  averageAccessCount: number;
  oldestMemory?: string; // ISO timestamp
  newestMemory?: string; // ISO timestamp
}

/**
 * Embedding Provider Interface
 */
export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  getDimension(): number;
  getModel(): string;
}

/**
 * Vector Store Interface
 */
export interface VectorStore {
  initialize(): Promise<void>;
  store(id: string, embedding: number[], metadata?: Record<string, any>): Promise<void>;
  search(queryEmbedding: number[], limit: number, filters?: Record<string, any>): Promise<Array<{
    id: string;
    similarity: number;
    metadata?: Record<string, any>;
  }>>;
  delete(id: string): Promise<void>;
  getStats(): Promise<{ count: number; dimension: number }>;
}

/**
 * Memory Storage Interface
 */
export interface MemoryStorage {
  // Core CRUD operations
  add(memory: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>): Promise<MemoryEntry>;
  get(id: string): Promise<MemoryEntry | null>;
  update(id: string, updates: MemoryUpdate): Promise<MemoryEntry>;
  delete(id: string): Promise<boolean>;
  
  // Query operations
  search(query: MemorySearchQuery): Promise<MemorySearchResult[]>;
  getAll(filters?: { type?: MemoryType; userId?: string; sessionId?: string; agentId?: string }): Promise<MemoryEntry[]>;
  
  // Maintenance operations
  cleanup(): Promise<number>; // Remove expired memories (TTL)
  getStats(): Promise<MemoryStats>;
}

/**
 * Extraction Configuration
 */
export interface ExtractionConfig {
  enabled?: boolean; // Enable two-phase extraction pipeline (default: true)
}

/**
 * Memory Configuration
 */
export interface MemoryConfig {
  extraction?: ExtractionConfig;
  embeddingProvider: {
    type: 'openai' | 'custom';
    apiKey?: string;
    model?: string;
    dimension?: number;
  };
  vectorStore: {
    type: 'pgvector' | 'memory';
    connectionString?: string;
    tableName?: string;
    dimension?: number;
  };
  storage: {
    tableName?: string;
    enableAutoCleanup?: boolean;
    cleanupIntervalMs?: number;
  };
  search: {
    defaultLimit?: number;
    minSimilarity?: number;
    enableReranking?: boolean;
  };
}
