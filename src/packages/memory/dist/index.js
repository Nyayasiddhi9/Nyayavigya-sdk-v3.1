import OpenAI from 'openai';
import { Pool } from 'pg';
import { v4 } from 'uuid';

var OpenAIEmbeddingProvider = class {
  client;
  model;
  dimension;
  constructor(apiKey, model = "text-embedding-3-small") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.dimension = 1536;
  }
  /**
   * Generate embedding for text
   */
  async generateEmbedding(text) {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: "float"
      });
      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }
  /**
   * Get embedding dimension
   */
  getDimension() {
    return this.dimension;
  }
  /**
   * Get model name
   */
  getModel() {
    return this.model;
  }
};
var MockEmbeddingProvider = class {
  dimension;
  constructor(dimension = 1536) {
    this.dimension = dimension;
  }
  async generateEmbedding(text) {
    const hash = this.simpleHash(text);
    const embedding = [];
    for (let i = 0; i < this.dimension; i++) {
      const seed = (hash + i) * 2654435761;
      embedding.push((Math.sin(seed) + 1) / 2);
    }
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / magnitude);
  }
  getDimension() {
    return this.dimension;
  }
  getModel() {
    return "mock-embedding";
  }
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
};
var PgVectorStore = class {
  pool;
  tableName;
  dimension;
  initialized = false;
  constructor(connectionString, tableName = "wai_memory_vectors", dimension = 1536) {
    this.pool = new Pool({ connectionString });
    this.tableName = tableName;
    this.dimension = dimension;
  }
  /**
   * Initialize vector store (create table, enable pgvector)
   */
  async initialize() {
    if (this.initialized) return;
    try {
      await this.pool.query("CREATE EXTENSION IF NOT EXISTS vector");
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id VARCHAR(255) PRIMARY KEY,
          embedding vector(${this.dimension}),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_embedding_idx
        ON ${this.tableName}
        USING hnsw (embedding vector_cosine_ops)
      `);
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize vector store: ${error.message}`);
    }
  }
  /**
   * Store embedding
   */
  async store(id, embedding, metadata) {
    if (!this.initialized) await this.initialize();
    try {
      await this.pool.query(
        `INSERT INTO ${this.tableName} (id, embedding, metadata)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE
         SET embedding = $2, metadata = $3`,
        [id, JSON.stringify(embedding), metadata ? JSON.stringify(metadata) : null]
      );
    } catch (error) {
      throw new Error(`Failed to store embedding: ${error.message}`);
    }
  }
  /**
   * Search similar embeddings using cosine similarity
   */
  async search(queryEmbedding, limit = 10, filters) {
    if (!this.initialized) await this.initialize();
    try {
      let query = `
        SELECT 
          id,
          1 - (embedding <=> $1::vector) as similarity,
          metadata
        FROM ${this.tableName}
      `;
      const params = [JSON.stringify(queryEmbedding)];
      if (filters && Object.keys(filters).length > 0) {
        const conditions = Object.keys(filters).map((key, idx) => {
          params.push(filters[key]);
          return `metadata->>'${key}' = $${idx + 2}`;
        });
        query += ` WHERE ${conditions.join(" AND ")}`;
      }
      query += ` ORDER BY similarity DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      const result = await this.pool.query(query, params);
      return result.rows.map((row) => ({
        id: row.id,
        similarity: parseFloat(row.similarity),
        metadata: row.metadata || void 0
      }));
    } catch (error) {
      throw new Error(`Failed to search embeddings: ${error.message}`);
    }
  }
  /**
   * Delete embedding
   */
  async delete(id) {
    if (!this.initialized) await this.initialize();
    try {
      await this.pool.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
    } catch (error) {
      throw new Error(`Failed to delete embedding: ${error.message}`);
    }
  }
  /**
   * Get statistics
   */
  async getStats() {
    if (!this.initialized) await this.initialize();
    try {
      const result = await this.pool.query(`SELECT COUNT(*) as count FROM ${this.tableName}`);
      return {
        count: parseInt(result.rows[0].count),
        dimension: this.dimension
      };
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
  /**
   * Close connection pool
   */
  async close() {
    await this.pool.end();
  }
};
var InMemoryVectorStore = class {
  vectors = /* @__PURE__ */ new Map();
  dimension;
  constructor(dimension = 1536) {
    this.dimension = dimension;
  }
  async initialize() {
  }
  async store(id, embedding, metadata) {
    this.vectors.set(id, { embedding, metadata });
  }
  async search(queryEmbedding, limit = 10, filters) {
    const results = [];
    for (const [id, { embedding, metadata }] of this.vectors.entries()) {
      if (filters && metadata) {
        let match = true;
        for (const [key, value] of Object.entries(filters)) {
          if (metadata[key] !== value) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      results.push({ id, similarity, metadata });
    }
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }
  async delete(id) {
    this.vectors.delete(id);
  }
  async getStats() {
    return {
      count: this.vectors.size,
      dimension: this.dimension
    };
  }
  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same dimension");
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
};
var PgMemoryStorage = class {
  pool;
  tableName;
  vectorStore;
  embeddingProvider;
  initialized = false;
  constructor(connectionString, vectorStore, embeddingProvider, tableName = "wai_memories") {
    this.pool = new Pool({ connectionString });
    this.vectorStore = vectorStore;
    this.embeddingProvider = embeddingProvider;
    this.tableName = tableName;
  }
  /**
   * Initialize storage (create tables)
   */
  async initialize() {
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
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_type_idx ON ${this.tableName}(type);
        CREATE INDEX IF NOT EXISTS ${this.tableName}_user_id_idx ON ${this.tableName}(user_id);
        CREATE INDEX IF NOT EXISTS ${this.tableName}_session_id_idx ON ${this.tableName}(session_id);
        CREATE INDEX IF NOT EXISTS ${this.tableName}_agent_id_idx ON ${this.tableName}(agent_id);
        CREATE INDEX IF NOT EXISTS ${this.tableName}_tags_idx ON ${this.tableName} USING GIN(tags);
        CREATE INDEX IF NOT EXISTS ${this.tableName}_created_at_idx ON ${this.tableName}(created_at DESC);
      `);
      await this.vectorStore.initialize();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize memory storage: ${error.message}`);
    }
  }
  /**
   * Add new memory
   */
  async add(memory) {
    if (!this.initialized) await this.initialize();
    const id = v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      const embedding = await this.embeddingProvider.generateEmbedding(memory.content);
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
          memory.ttl || null
        ]
      );
      await this.vectorStore.store(id, embedding, {
        type: memory.type,
        userId: memory.userId,
        sessionId: memory.sessionId,
        agentId: memory.agentId
      });
      return this.rowToMemoryEntry(result.rows[0], embedding);
    } catch (error) {
      throw new Error(`Failed to add memory: ${error.message}`);
    }
  }
  /**
   * Get memory by ID
   */
  async get(id) {
    if (!this.initialized) await this.initialize();
    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return null;
      }
      await this.pool.query(
        `UPDATE ${this.tableName}
         SET access_count = access_count + 1, last_accessed_at = $1
         WHERE id = $2`,
        [(/* @__PURE__ */ new Date()).toISOString(), id]
      );
      return this.rowToMemoryEntry(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to get memory: ${error.message}`);
    }
  }
  /**
   * Update memory
   */
  async update(id, updates) {
    if (!this.initialized) await this.initialize();
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const setClauses = ["updated_at = $1"];
      const values = [now];
      let paramIndex = 2;
      if (updates.content !== void 0) {
        setClauses.push(`content = $${paramIndex++}`);
        values.push(updates.content);
        const embedding = await this.embeddingProvider.generateEmbedding(updates.content);
        await this.vectorStore.store(id, embedding);
      }
      if (updates.metadata !== void 0) {
        setClauses.push(`metadata = $${paramIndex++}`);
        values.push(JSON.stringify(updates.metadata));
      }
      if (updates.tags !== void 0) {
        setClauses.push(`tags = $${paramIndex++}`);
        values.push(updates.tags);
      }
      if (updates.priority !== void 0) {
        setClauses.push(`priority = $${paramIndex++}`);
        values.push(updates.priority);
      }
      if (updates.ttl !== void 0) {
        setClauses.push(`ttl = $${paramIndex++}`);
        values.push(updates.ttl);
      }
      values.push(id);
      const result = await this.pool.query(
        `UPDATE ${this.tableName}
         SET ${setClauses.join(", ")}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );
      if (result.rows.length === 0) {
        throw new Error(`Memory not found: ${id}`);
      }
      return this.rowToMemoryEntry(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update memory: ${error.message}`);
    }
  }
  /**
   * Delete memory
   */
  async delete(id) {
    if (!this.initialized) await this.initialize();
    try {
      const result = await this.pool.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      await this.vectorStore.delete(id);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete memory: ${error.message}`);
    }
  }
  /**
   * Search memories using semantic search
   */
  async search(query) {
    if (!this.initialized) await this.initialize();
    try {
      const queryEmbedding = await this.embeddingProvider.generateEmbedding(query.query);
      const vectorFilters = {};
      if (query.type) vectorFilters.type = query.type;
      if (query.userId) vectorFilters.userId = query.userId;
      if (query.sessionId) vectorFilters.sessionId = query.sessionId;
      if (query.agentId) vectorFilters.agentId = query.agentId;
      const vectorResults = await this.vectorStore.search(
        queryEmbedding,
        query.limit || 10,
        vectorFilters
      );
      const memories = [];
      for (const vectorResult of vectorResults) {
        if (query.minSimilarity && vectorResult.similarity < query.minSimilarity) {
          continue;
        }
        const memory = await this.get(vectorResult.id);
        if (!memory) continue;
        if (query.tags && query.tags.length > 0) {
          const hasAllTags = query.tags.every((tag) => memory.tags?.includes(tag));
          if (!hasAllTags) continue;
        }
        const daysSinceCreation = (Date.now() - new Date(memory.createdAt).getTime()) / (1e3 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 1 - daysSinceCreation / 365);
        const priorityScore = (memory.priority || 50) / 100;
        const relevance = vectorResult.similarity * 0.6 + priorityScore * 0.2 + recencyScore * 0.2;
        memories.push({
          memory,
          similarity: vectorResult.similarity,
          relevance
        });
      }
      return memories.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      throw new Error(`Failed to search memories: ${error.message}`);
    }
  }
  /**
   * Get all memories with filters
   */
  async getAll(filters) {
    if (!this.initialized) await this.initialize();
    try {
      let query = `SELECT * FROM ${this.tableName}`;
      const conditions = [];
      const values = [];
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
        query += ` WHERE ${conditions.join(" AND ")}`;
      }
      query += ` ORDER BY created_at DESC`;
      const result = await this.pool.query(query, values);
      return result.rows.map((row) => this.rowToMemoryEntry(row));
    } catch (error) {
      throw new Error(`Failed to get all memories: ${error.message}`);
    }
  }
  /**
   * Cleanup expired memories (TTL)
   */
  async cleanup() {
    if (!this.initialized) await this.initialize();
    try {
      const result = await this.pool.query(
        `DELETE FROM ${this.tableName}
         WHERE ttl IS NOT NULL
         AND EXTRACT(EPOCH FROM (NOW() - created_at)) > ttl
         RETURNING id`
      );
      for (const row of result.rows) {
        await this.vectorStore.delete(row.id);
      }
      return result.rowCount || 0;
    } catch (error) {
      throw new Error(`Failed to cleanup memories: ${error.message}`);
    }
  }
  /**
   * Get statistics
   */
  async getStats() {
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
      const memoryByType = {
        user: 0,
        session: 0,
        agent: 0,
        entity: 0
      };
      for (const row of typeResult.rows) {
        memoryByType[row.type] = parseInt(row.count);
      }
      return {
        totalMemories: parseInt(totalResult.rows[0].total),
        memoryByType,
        totalEmbeddings: vectorStats.count,
        averageAccessCount: parseFloat(accessResult.rows[0].avg_access) || 0,
        oldestMemory: timestampResult.rows[0].oldest?.toISOString(),
        newestMemory: timestampResult.rows[0].newest?.toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
  /**
   * Convert database row to MemoryEntry
   */
  rowToMemoryEntry(row, embedding) {
    return {
      id: row.id,
      type: row.type,
      content: row.content,
      embedding,
      userId: row.user_id || void 0,
      sessionId: row.session_id || void 0,
      agentId: row.agent_id || void 0,
      metadata: row.metadata || void 0,
      tags: row.tags || void 0,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      accessCount: row.access_count,
      lastAccessedAt: row.last_accessed_at?.toISOString(),
      priority: row.priority,
      ttl: row.ttl
    };
  }
  /**
   * Close connection pool
   */
  async close() {
    await this.pool.end();
  }
};

// src/core/memory-service.ts
var MemoryService = class {
  storage;
  cleanupInterval;
  constructor(storage, config) {
    this.storage = storage;
    if (config?.storage?.enableAutoCleanup) {
      const intervalMs = config.storage.cleanupIntervalMs || 36e5;
      this.cleanupInterval = setInterval(() => {
        this.cleanup().catch(console.error);
      }, intervalMs);
    }
  }
  /**
   * Add memory from messages (mem0-style API)
   */
  async add(messages, options = {}) {
    let content;
    if (typeof messages === "string") {
      content = messages;
    } else {
      content = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    }
    return this.storage.add({
      type: options.type || "user",
      content,
      userId: options.userId,
      sessionId: options.sessionId,
      agentId: options.agentId,
      metadata: options.metadata,
      tags: options.tags,
      priority: options.priority,
      ttl: options.ttl
    });
  }
  /**
   * Search memories (mem0-style API)
   */
  async search(query, options = {}) {
    return this.storage.search({
      query,
      userId: options.userId,
      sessionId: options.sessionId,
      agentId: options.agentId,
      type: options.type,
      tags: options.tags,
      limit: options.limit || 10,
      minSimilarity: options.minSimilarity || 0.5
    });
  }
  /**
   * Get memory by ID
   */
  async get(id) {
    return this.storage.get(id);
  }
  /**
   * Get all memories with filters (mem0-style API)
   */
  async getAll(filters) {
    return this.storage.getAll(filters);
  }
  /**
   * Update memory (mem0-style API)
   */
  async update(id, updates) {
    return this.storage.update(id, updates);
  }
  /**
   * Delete memory (mem0-style API)
   */
  async delete(id) {
    return this.storage.delete(id);
  }
  /**
   * Cleanup expired memories
   */
  async cleanup() {
    return this.storage.cleanup();
  }
  /**
   * Get statistics
   */
  async getStats() {
    return this.storage.getStats();
  }
  /**
   * Close service and cleanup
   */
  async close() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
};
async function createMemoryService(config) {
  let embeddingProvider;
  if (config.embeddingProvider.type === "openai") {
    const apiKey = config.embeddingProvider.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }
    embeddingProvider = new OpenAIEmbeddingProvider(
      apiKey,
      config.embeddingProvider.model || "text-embedding-3-small"
    );
  } else {
    throw new Error(`Unsupported embedding provider: ${config.embeddingProvider.type}`);
  }
  let vectorStore;
  if (config.vectorStore.type === "pgvector") {
    const connectionString2 = config.vectorStore.connectionString || process.env.DATABASE_URL;
    if (!connectionString2) {
      throw new Error("Database connection string is required for pgvector");
    }
    vectorStore = new PgVectorStore(
      connectionString2,
      config.vectorStore.tableName || "wai_memory_vectors",
      config.vectorStore.dimension || embeddingProvider.getDimension()
    );
  } else {
    vectorStore = new InMemoryVectorStore(
      config.vectorStore.dimension || embeddingProvider.getDimension()
    );
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Database connection string is required");
  }
  const storage = new PgMemoryStorage(
    connectionString,
    vectorStore,
    embeddingProvider,
    config.storage?.tableName || "wai_memories"
  );
  await storage.initialize();
  return new MemoryService(storage, config);
}

// src/cam/cam-monitoring-service.ts
var CAM_VERSION = "1.0.0";

// src/index.ts
var WAI_MEMORY_VERSION = "1.0.0";

export { CAM_VERSION, InMemoryVectorStore, MemoryService, MockEmbeddingProvider, OpenAIEmbeddingProvider, PgMemoryStorage, PgVectorStore, WAI_MEMORY_VERSION, createMemoryService };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map