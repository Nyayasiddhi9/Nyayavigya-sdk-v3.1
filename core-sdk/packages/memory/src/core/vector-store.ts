/**
 * Vector Store - pgvector integration for semantic search
 */

import { Pool } from 'pg';
import { VectorStore } from './types';

/**
 * PostgreSQL + pgvector Vector Store
 */
export class PgVectorStore implements VectorStore {
  private pool: Pool;
  private tableName: string;
  private dimension: number;
  private initialized: boolean = false;

  constructor(connectionString: string, tableName: string = 'wai_memory_vectors', dimension: number = 1536) {
    this.pool = new Pool({ connectionString });
    this.tableName = tableName;
    this.dimension = dimension;
  }

  /**
   * Initialize vector store (create table, enable pgvector)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Enable pgvector extension
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Create table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id VARCHAR(255) PRIMARY KEY,
          embedding vector(${this.dimension}),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create index for similarity search (HNSW for fast approximate search)
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_embedding_idx
        ON ${this.tableName}
        USING hnsw (embedding vector_cosine_ops)
      `);

      this.initialized = true;
    } catch (error: any) {
      throw new Error(`Failed to initialize vector store: ${error.message}`);
    }
  }

  /**
   * Store embedding
   */
  async store(id: string, embedding: number[], metadata?: Record<string, any>): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      // Convert embedding to pgvector format: '[0.1,0.2,0.3]'
      const vectorString = `[${embedding.join(',')}]`;
      
      await this.pool.query(
        `INSERT INTO ${this.tableName} (id, embedding, metadata)
         VALUES ($1, $2::vector, $3)
         ON CONFLICT (id) DO UPDATE
         SET embedding = $2::vector, metadata = $3`,
        [id, vectorString, metadata ? JSON.stringify(metadata) : null]
      );
    } catch (error: any) {
      throw new Error(`Failed to store embedding: ${error.message}`);
    }
  }

  /**
   * Search similar embeddings using cosine similarity
   */
  async search(
    queryEmbedding: number[],
    limit: number = 10,
    filters?: Record<string, any>
  ): Promise<Array<{ id: string; similarity: number; metadata?: Record<string, any> }>> {
    if (!this.initialized) await this.initialize();

    try {
      let query = `
        SELECT 
          id,
          1 - (embedding <=> $1::vector) as similarity,
          metadata
        FROM ${this.tableName}
      `;

      // Convert embedding to pgvector format: '[0.1,0.2,0.3]'
      const vectorString = `[${queryEmbedding.join(',')}]`;
      const params: any[] = [vectorString];

      // Add metadata filters
      if (filters && Object.keys(filters).length > 0) {
        const conditions = Object.keys(filters).map((key, idx) => {
          params.push(filters[key]);
          return `metadata->>'${key}' = $${idx + 2}`;
        });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY similarity DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await this.pool.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        similarity: parseFloat(row.similarity),
        metadata: row.metadata || undefined,
      }));
    } catch (error: any) {
      throw new Error(`Failed to search embeddings: ${error.message}`);
    }
  }

  /**
   * Delete embedding
   */
  async delete(id: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await this.pool.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
    } catch (error: any) {
      throw new Error(`Failed to delete embedding: ${error.message}`);
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{ count: number; dimension: number }> {
    if (!this.initialized) await this.initialize();

    try {
      const result = await this.pool.query(`SELECT COUNT(*) as count FROM ${this.tableName}`);
      return {
        count: parseInt(result.rows[0].count),
        dimension: this.dimension,
      };
    } catch (error: any) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * In-Memory Vector Store (for testing)
 */
export class InMemoryVectorStore implements VectorStore {
  private vectors: Map<string, { embedding: number[]; metadata?: Record<string, any> }> = new Map();
  private dimension: number;

  constructor(dimension: number = 1536) {
    this.dimension = dimension;
  }

  async initialize(): Promise<void> {
    // No-op for in-memory
  }

  async store(id: string, embedding: number[], metadata?: Record<string, any>): Promise<void> {
    this.vectors.set(id, { embedding, metadata });
  }

  async search(
    queryEmbedding: number[],
    limit: number = 10,
    filters?: Record<string, any>
  ): Promise<Array<{ id: string; similarity: number; metadata?: Record<string, any> }>> {
    const results: Array<{ id: string; similarity: number; metadata?: Record<string, any> }> = [];

    for (const [id, { embedding, metadata }] of this.vectors.entries()) {
      // Apply filters
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

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  async delete(id: string): Promise<void> {
    this.vectors.delete(id);
  }

  async getStats(): Promise<{ count: number; dimension: number }> {
    return {
      count: this.vectors.size,
      dimension: this.dimension,
    };
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
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
}
