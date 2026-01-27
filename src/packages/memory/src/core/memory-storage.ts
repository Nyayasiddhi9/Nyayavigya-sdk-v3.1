/**
 * Memory Storage - PostgreSQL-backed storage for memories
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  MemoryStorage,
  MemoryEntry,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryUpdate,
  MemoryStats,
  MemoryType,
  VectorStore,
  EmbeddingProvider,
} from './types';

/**
 * PostgreSQL Memory Storage
 */
export class PgMemoryStorage implements MemoryStorage {
  private pool: Pool;
  private tableName: string;
  private vectorStore: VectorStore;
  private embeddingProvider: EmbeddingProvider;
  private initialized: boolean = false;

  constructor(
    connectionString: string,
    vectorStore: VectorStore,
    embeddingProvider: EmbeddingProvider,
    tableName: string = 'wai_memories'
  ) {
    this.pool = new Pool({ connectionString });
    this.vectorStore = vectorStore;
    this.embeddingProvider = embeddingProvider;
    this.tableName = tableName;
  }

  /**
   * Initialize storage (create tables)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id VARCHAR(255) PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          user_id VARCHAR(255),
          session_id VARCHAR(255),
          agent_id VARCHAR(255),
          metadata JSONB,
          tags TEXT[],
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          access_count INTEGER DEFAULT 0,
          last_accessed_at TIMESTAMP,
          priority INTEGER DEFAULT 50,
          ttl INTEGER
        )
      `);

      // Create indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_type_idx ON ${this.tableName}(type);
        CREATE INDEX IF NOT EXISTS ${this.tableName}_user_id_idx ON ${this.tableName}(user_id);
        CREATE INDEX IF NOT EXISTS ${this.tableName}_session_id_idx ON ${this.tableName}(session_id);
        CREATE INDEX IF NOT EXISTS ${this.tableName}_agent_id_idx ON ${this.tableName}(agent_id);
        CREATE INDEX IF NOT EXISTS ${this.tableName}_tags_idx ON ${this.tableName} USING GIN(tags);
        CREATE INDEX IF NOT EXISTS ${this.tableName}_created_at_idx ON ${this.tableName}(created_at DESC);
      `);

      // Initialize vector store
      await this.vectorStore.initialize();

      this.initialized = true;
    } catch (error: any) {
      throw new Error(`Failed to initialize memory storage: ${error.message}`);
    }
  }

  /**
   * Add new memory
   */
  async add(
    memory: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>
  ): Promise<MemoryEntry> {
    if (!this.initialized) await this.initialize();

    const id = uuidv4();
    const now = new Date().toISOString();

    try {
      // Generate embedding
      const embedding = await this.embeddingProvider.generateEmbedding(memory.content);

      // Store in database
      const result = await this.pool.query(
        `INSERT INTO ${this.tableName} 
         (id, type, content, user_id, session_id, agent_id, metadata, tags, created_at, updated_at, access_count, priority, ttl)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $12)
         RETURNING *`,
        [
          id,
          memory.type,
          memory.content,
          memory.userId || null,
          memory.sessionId || null,
          memory.agentId || null,
          memory.metadata ? JSON.stringify(memory.metadata) : null,
          memory.tags || null,
          now,
          now,
          memory.priority || 50,
          memory.ttl || null,
        ]
      );

      // Store embedding in vector store
      await this.vectorStore.store(id, embedding, {
        type: memory.type,
        userId: memory.userId,
        sessionId: memory.sessionId,
        agentId: memory.agentId,
      });

      return this.rowToMemoryEntry(result.rows[0], embedding);
    } catch (error: any) {
      throw new Error(`Failed to add memory: ${error.message}`);
    }
  }

  /**
   * Get memory by ID
   */
  async get(id: string): Promise<MemoryEntry | null> {
    if (!this.initialized) await this.initialize();

    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Update access tracking
      await this.pool.query(
        `UPDATE ${this.tableName}
         SET access_count = access_count + 1, last_accessed_at = $1
         WHERE id = $2`,
        [new Date().toISOString(), id]
      );

      return this.rowToMemoryEntry(result.rows[0]);
    } catch (error: any) {
      throw new Error(`Failed to get memory: ${error.message}`);
    }
  }

  /**
   * Update memory
   */
  async update(id: string, updates: MemoryUpdate): Promise<MemoryEntry> {
    if (!this.initialized) await this.initialize();

    try {
      const now = new Date().toISOString();
      const setClauses: string[] = ['updated_at = $1'];
      const values: any[] = [now];
      let paramIndex = 2;

      if (updates.content !== undefined) {
        setClauses.push(`content = $${paramIndex++}`);
        values.push(updates.content);

        // Regenerate embedding if content changed
        const embedding = await this.embeddingProvider.generateEmbedding(updates.content);
        await this.vectorStore.store(id, embedding);
      }

      if (updates.metadata !== undefined) {
        setClauses.push(`metadata = $${paramIndex++}`);
        values.push(JSON.stringify(updates.metadata));
      }

      if (updates.tags !== undefined) {
        setClauses.push(`tags = $${paramIndex++}`);
        values.push(updates.tags);
      }

      if (updates.priority !== undefined) {
        setClauses.push(`priority = $${paramIndex++}`);
        values.push(updates.priority);
      }

      if (updates.ttl !== undefined) {
        setClauses.push(`ttl = $${paramIndex++}`);
        values.push(updates.ttl);
      }

      values.push(id);

      const result = await this.pool.query(
        `UPDATE ${this.tableName}
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error(`Memory not found: ${id}`);
      }

      return this.rowToMemoryEntry(result.rows[0]);
    } catch (error: any) {
      throw new Error(`Failed to update memory: ${error.message}`);
    }
  }

  /**
   * Delete memory
   */
  async delete(id: string): Promise<boolean> {
    if (!this.initialized) await this.initialize();

    try {
      const result = await this.pool.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      await this.vectorStore.delete(id);

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error: any) {
      throw new Error(`Failed to delete memory: ${error.message}`);
    }
  }

  /**
   * Search memories using semantic search
   */
  async search(query: MemorySearchQuery): Promise<MemorySearchResult[]> {
    if (!this.initialized) await this.initialize();

    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingProvider.generateEmbedding(query.query);

      // Build filters for vector search
      const vectorFilters: Record<string, any> = {};
      if (query.type) vectorFilters.type = query.type;
      if (query.userId) vectorFilters.userId = query.userId;
      if (query.sessionId) vectorFilters.sessionId = query.sessionId;
      if (query.agentId) vectorFilters.agentId = query.agentId;

      // Search vector store
      const vectorResults = await this.vectorStore.search(
        queryEmbedding,
        query.limit || 10,
        vectorFilters
      );

      // Fetch full memory entries
      const memories: MemorySearchResult[] = [];

      for (const vectorResult of vectorResults) {
        if (query.minSimilarity && vectorResult.similarity < query.minSimilarity) {
          continue;
        }

        const memory = await this.get(vectorResult.id);
        if (!memory) continue;

        // Apply tag filters
        if (query.tags && query.tags.length > 0) {
          const hasAllTags = query.tags.every(tag => memory.tags?.includes(tag));
          if (!hasAllTags) continue;
        }

        // Calculate relevance score (similarity + priority + recency)
        const daysSinceCreation = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 1 - (daysSinceCreation / 365)); // Decay over 1 year
        const priorityScore = (memory.priority || 50) / 100;
        const relevance = vectorResult.similarity * 0.6 + priorityScore * 0.2 + recencyScore * 0.2;

        memories.push({
          memory,
          similarity: vectorResult.similarity,
          relevance,
        });
      }

      // Sort by relevance
      return memories.sort((a, b) => b.relevance - a.relevance);
    } catch (error: any) {
      throw new Error(`Failed to search memories: ${error.message}`);
    }
  }

  /**
   * Get all memories with filters
   */
  async getAll(filters?: {
    type?: MemoryType;
    userId?: string;
    sessionId?: string;
    agentId?: string;
  }): Promise<MemoryEntry[]> {
    if (!this.initialized) await this.initialize();

    try {
      let query = `SELECT * FROM ${this.tableName}`;
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (filters?.type) {
        conditions.push(`type = $${paramIndex++}`);
        values.push(filters.type);
      }

      if (filters?.userId) {
        conditions.push(`user_id = $${paramIndex++}`);
        values.push(filters.userId);
      }

      if (filters?.sessionId) {
        conditions.push(`session_id = $${paramIndex++}`);
        values.push(filters.sessionId);
      }

      if (filters?.agentId) {
        conditions.push(`agent_id = $${paramIndex++}`);
        values.push(filters.agentId);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY created_at DESC`;

      const result = await this.pool.query(query, values);

      return result.rows.map(row => this.rowToMemoryEntry(row));
    } catch (error: any) {
      throw new Error(`Failed to get all memories: ${error.message}`);
    }
  }

  /**
   * Cleanup expired memories (TTL)
   */
  async cleanup(): Promise<number> {
    if (!this.initialized) await this.initialize();

    try {
      const result = await this.pool.query(
        `DELETE FROM ${this.tableName}
         WHERE ttl IS NOT NULL
         AND EXTRACT(EPOCH FROM (NOW() - created_at)) > ttl
         RETURNING id`
      );

      // Delete from vector store
      for (const row of result.rows) {
        await this.vectorStore.delete(row.id);
      }

      return result.rowCount || 0;
    } catch (error: any) {
      throw new Error(`Failed to cleanup memories: ${error.message}`);
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<MemoryStats> {
    if (!this.initialized) await this.initialize();

    try {
      const totalResult = await this.pool.query(
        `SELECT COUNT(*) as total FROM ${this.tableName}`
      );

      const typeResult = await this.pool.query(
        `SELECT type, COUNT(*) as count FROM ${this.tableName} GROUP BY type`
      );

      const accessResult = await this.pool.query(
        `SELECT AVG(access_count) as avg_access FROM ${this.tableName}`
      );

      const timestampResult = await this.pool.query(
        `SELECT MIN(created_at) as oldest, MAX(created_at) as newest FROM ${this.tableName}`
      );

      const vectorStats = await this.vectorStore.getStats();

      const memoryByType: Record<MemoryType, number> = {
        user: 0,
        session: 0,
        agent: 0,
        entity: 0,
      };

      for (const row of typeResult.rows) {
        memoryByType[row.type as MemoryType] = parseInt(row.count);
      }

      return {
        totalMemories: parseInt(totalResult.rows[0].total),
        memoryByType,
        totalEmbeddings: vectorStats.count,
        averageAccessCount: parseFloat(accessResult.rows[0].avg_access) || 0,
        oldestMemory: timestampResult.rows[0].oldest?.toISOString(),
        newestMemory: timestampResult.rows[0].newest?.toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  /**
   * Convert database row to MemoryEntry
   */
  private rowToMemoryEntry(row: any, embedding?: number[]): MemoryEntry {
    return {
      id: row.id,
      type: row.type,
      content: row.content,
      embedding,
      userId: row.user_id || undefined,
      sessionId: row.session_id || undefined,
      agentId: row.agent_id || undefined,
      metadata: row.metadata || undefined,
      tags: row.tags || undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      accessCount: row.access_count,
      lastAccessedAt: row.last_accessed_at?.toISOString(),
      priority: row.priority,
      ttl: row.ttl,
    };
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
