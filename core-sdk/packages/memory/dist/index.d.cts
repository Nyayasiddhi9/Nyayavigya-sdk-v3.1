/**
 * WAI Memory System - Core Types
 * Based on mem0 architecture with enhancements for WAI SDK
 */
/**
 * Memory Types - Following mem0 classification
 */
type MemoryType = 'user' | 'session' | 'agent' | 'entity';
/**
 * Memory Entry - Core data structure
 */
interface MemoryEntry {
    id: string;
    type: MemoryType;
    content: string;
    embedding?: number[];
    userId?: string;
    sessionId?: string;
    agentId?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    accessCount: number;
    lastAccessedAt?: string;
    priority?: number;
    ttl?: number;
}
/**
 * Memory Search Query
 */
interface MemorySearchQuery {
    query: string;
    type?: MemoryType;
    userId?: string;
    sessionId?: string;
    agentId?: string;
    tags?: string[];
    limit?: number;
    minSimilarity?: number;
    filters?: Record<string, any>;
}
/**
 * Memory Search Result
 */
interface MemorySearchResult {
    memory: MemoryEntry;
    similarity: number;
    relevance: number;
}
/**
 * Memory Update Operation
 */
interface MemoryUpdate {
    content?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    priority?: number;
    ttl?: number;
}
/**
 * Memory Statistics
 */
interface MemoryStats {
    totalMemories: number;
    memoryByType: Record<MemoryType, number>;
    totalEmbeddings: number;
    averageAccessCount: number;
    oldestMemory?: string;
    newestMemory?: string;
}
/**
 * Embedding Provider Interface
 */
interface EmbeddingProvider {
    generateEmbedding(text: string): Promise<number[]>;
    getDimension(): number;
    getModel(): string;
}
/**
 * Vector Store Interface
 */
interface VectorStore {
    initialize(): Promise<void>;
    store(id: string, embedding: number[], metadata?: Record<string, any>): Promise<void>;
    search(queryEmbedding: number[], limit: number, filters?: Record<string, any>): Promise<Array<{
        id: string;
        similarity: number;
        metadata?: Record<string, any>;
    }>>;
    delete(id: string): Promise<void>;
    getStats(): Promise<{
        count: number;
        dimension: number;
    }>;
}
/**
 * Memory Storage Interface
 */
interface MemoryStorage {
    add(memory: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>): Promise<MemoryEntry>;
    get(id: string): Promise<MemoryEntry | null>;
    update(id: string, updates: MemoryUpdate): Promise<MemoryEntry>;
    delete(id: string): Promise<boolean>;
    search(query: MemorySearchQuery): Promise<MemorySearchResult[]>;
    getAll(filters?: {
        type?: MemoryType;
        userId?: string;
        sessionId?: string;
        agentId?: string;
    }): Promise<MemoryEntry[]>;
    cleanup(): Promise<number>;
    getStats(): Promise<MemoryStats>;
}
/**
 * Memory Configuration
 */
interface MemoryConfig {
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

/**
 * Embedding Provider - OpenAI text-embedding-3-small
 * Generates vector embeddings for semantic search
 */

/**
 * OpenAI Embedding Provider
 * Uses text-embedding-3-small (1536 dimensions, fast, cost-effective)
 */
declare class OpenAIEmbeddingProvider implements EmbeddingProvider {
    private client;
    private model;
    private dimension;
    constructor(apiKey: string, model?: string);
    /**
     * Generate embedding for text
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Get embedding dimension
     */
    getDimension(): number;
    /**
     * Get model name
     */
    getModel(): string;
}
/**
 * In-Memory Embedding Provider (for testing)
 * Generates random embeddings - NOT for production
 */
declare class MockEmbeddingProvider implements EmbeddingProvider {
    private dimension;
    constructor(dimension?: number);
    generateEmbedding(text: string): Promise<number[]>;
    getDimension(): number;
    getModel(): string;
    private simpleHash;
}

/**
 * Vector Store - pgvector integration for semantic search
 */

/**
 * PostgreSQL + pgvector Vector Store
 */
declare class PgVectorStore implements VectorStore {
    private pool;
    private tableName;
    private dimension;
    private initialized;
    constructor(connectionString: string, tableName?: string, dimension?: number);
    /**
     * Initialize vector store (create table, enable pgvector)
     */
    initialize(): Promise<void>;
    /**
     * Store embedding
     */
    store(id: string, embedding: number[], metadata?: Record<string, any>): Promise<void>;
    /**
     * Search similar embeddings using cosine similarity
     */
    search(queryEmbedding: number[], limit?: number, filters?: Record<string, any>): Promise<Array<{
        id: string;
        similarity: number;
        metadata?: Record<string, any>;
    }>>;
    /**
     * Delete embedding
     */
    delete(id: string): Promise<void>;
    /**
     * Get statistics
     */
    getStats(): Promise<{
        count: number;
        dimension: number;
    }>;
    /**
     * Close connection pool
     */
    close(): Promise<void>;
}
/**
 * In-Memory Vector Store (for testing)
 */
declare class InMemoryVectorStore implements VectorStore {
    private vectors;
    private dimension;
    constructor(dimension?: number);
    initialize(): Promise<void>;
    store(id: string, embedding: number[], metadata?: Record<string, any>): Promise<void>;
    search(queryEmbedding: number[], limit?: number, filters?: Record<string, any>): Promise<Array<{
        id: string;
        similarity: number;
        metadata?: Record<string, any>;
    }>>;
    delete(id: string): Promise<void>;
    getStats(): Promise<{
        count: number;
        dimension: number;
    }>;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
}

/**
 * Memory Storage - PostgreSQL-backed storage for memories
 */

/**
 * PostgreSQL Memory Storage
 */
declare class PgMemoryStorage implements MemoryStorage {
    private pool;
    private tableName;
    private vectorStore;
    private embeddingProvider;
    private initialized;
    constructor(connectionString: string, vectorStore: VectorStore, embeddingProvider: EmbeddingProvider, tableName?: string);
    /**
     * Initialize storage (create tables)
     */
    initialize(): Promise<void>;
    /**
     * Add new memory
     */
    add(memory: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>): Promise<MemoryEntry>;
    /**
     * Get memory by ID
     */
    get(id: string): Promise<MemoryEntry | null>;
    /**
     * Update memory
     */
    update(id: string, updates: MemoryUpdate): Promise<MemoryEntry>;
    /**
     * Delete memory
     */
    delete(id: string): Promise<boolean>;
    /**
     * Search memories using semantic search
     */
    search(query: MemorySearchQuery): Promise<MemorySearchResult[]>;
    /**
     * Get all memories with filters
     */
    getAll(filters?: {
        type?: MemoryType;
        userId?: string;
        sessionId?: string;
        agentId?: string;
    }): Promise<MemoryEntry[]>;
    /**
     * Cleanup expired memories (TTL)
     */
    cleanup(): Promise<number>;
    /**
     * Get statistics
     */
    getStats(): Promise<MemoryStats>;
    /**
     * Convert database row to MemoryEntry
     */
    private rowToMemoryEntry;
    /**
     * Close connection pool
     */
    close(): Promise<void>;
}

/**
 * Memory Service - High-level interface for memory operations
 * Implements mem0-style API with WAI SDK enhancements
 */

/**
 * Memory Service
 */
declare class MemoryService {
    private storage;
    private cleanupInterval?;
    constructor(storage: MemoryStorage, config?: MemoryConfig);
    /**
     * Add memory from messages (mem0-style API)
     */
    add(messages: Array<{
        role: string;
        content: string;
    }> | string, options?: {
        userId?: string;
        sessionId?: string;
        agentId?: string;
        type?: MemoryType;
        metadata?: Record<string, any>;
        tags?: string[];
        priority?: number;
        ttl?: number;
    }): Promise<MemoryEntry>;
    /**
     * Search memories (mem0-style API)
     */
    search(query: string, options?: {
        userId?: string;
        sessionId?: string;
        agentId?: string;
        type?: MemoryType;
        tags?: string[];
        limit?: number;
        minSimilarity?: number;
    }): Promise<MemorySearchResult[]>;
    /**
     * Get memory by ID
     */
    get(id: string): Promise<MemoryEntry | null>;
    /**
     * Get all memories with filters (mem0-style API)
     */
    getAll(filters?: {
        userId?: string;
        sessionId?: string;
        agentId?: string;
        type?: MemoryType;
    }): Promise<MemoryEntry[]>;
    /**
     * Update memory (mem0-style API)
     */
    update(id: string, updates: MemoryUpdate): Promise<MemoryEntry>;
    /**
     * Delete memory (mem0-style API)
     */
    delete(id: string): Promise<boolean>;
    /**
     * Cleanup expired memories
     */
    cleanup(): Promise<number>;
    /**
     * Get statistics
     */
    getStats(): Promise<MemoryStats>;
    /**
     * Close service and cleanup
     */
    close(): Promise<void>;
}
/**
 * Create memory service from configuration
 */
declare function createMemoryService(config: MemoryConfig): Promise<MemoryService>;

declare const CAM_VERSION = "1.0.0";

/**
 * WAI SDK Memory Package
 * mem0-style memory with pgvector and OpenAI embeddings
 */

declare const WAI_MEMORY_VERSION = "1.0.0";

export { CAM_VERSION, type EmbeddingProvider, InMemoryVectorStore, type MemoryConfig, type MemoryEntry, type MemorySearchQuery, type MemorySearchResult, MemoryService, type MemoryStats, type MemoryStorage, type MemoryType, type MemoryUpdate, MockEmbeddingProvider, OpenAIEmbeddingProvider, PgMemoryStorage, PgVectorStore, type VectorStore, WAI_MEMORY_VERSION, createMemoryService };
