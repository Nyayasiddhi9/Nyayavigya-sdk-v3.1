/**
 * Memory Service - Real Implementation
 * Provides persistent memory storage and retrieval with vector similarity search
 */

import { EventEmitter } from 'events';

export interface MemoryRequest {
  operation: 'store' | 'retrieve' | 'search' | 'update' | 'delete';
  data?: {
    content: any;
    metadata: Record<string, any>;
    tags: string[];
    priority: number;
  };
  query?: {
    text: string;
    filters: Record<string, any>;
    limit: number;
    similarity_threshold: number;
  };
  memoryId?: string;
}

interface MemoryEntry {
  id: string;
  content: any;
  metadata: Record<string, any>;
  tags: string[];
  priority: number;
  embedding?: number[];
  timestamp: Date;
  lastAccessed: Date;
  accessCount: number;
}

export class MemoryService extends EventEmitter {
  private initialized = false;
  private memories: Map<string, MemoryEntry> = new Map();
  private memoryIndex: Map<string, Set<string>> = new Map(); // tag -> memory ids
  private vectorIndex: MemoryEntry[] = []; // For vector search

  async initialize(): Promise<void> {
    try {
      console.log('🧠 Initializing Memory Service...');
      
      // Load persistent memories if available
      await this.loadPersistedMemories();
      
      // Start periodic cleanup
      this.startCleanupTimer();
      
      this.initialized = true;
      console.log('✅ Memory Service initialized');
      
    } catch (error) {
      console.error('❌ Memory Service initialization failed:', error);
      throw error;
    }
  }

  async process(request: MemoryRequest): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('Memory Service not initialized');
    }

    switch (request.operation) {
      case 'store':
        return [await this.storeMemory(request.data!)];
      case 'retrieve':
        return [await this.retrieveMemory(request.memoryId!)];
      case 'search':
        return await this.searchMemories(request.query!);
      case 'update':
        return [await this.updateMemory(request.memoryId!, request.data!)];
      case 'delete':
        return [await this.deleteMemory(request.memoryId!)];
      default:
        throw new Error(`Unknown operation: ${request.operation}`);
    }
  }

  private async storeMemory(data: MemoryRequest['data']): Promise<MemoryEntry> {
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate embedding for semantic search
    const embedding = await this.generateEmbedding(this.extractTextContent(data!.content));
    
    const memory: MemoryEntry = {
      id: memoryId,
      content: data!.content,
      metadata: data!.metadata,
      tags: data!.tags,
      priority: data!.priority,
      embedding,
      timestamp: new Date(),
      lastAccessed: new Date(),
      accessCount: 0
    };

    // Store memory
    this.memories.set(memoryId, memory);
    
    // Update indexes
    this.updateTagIndex(memoryId, data!.tags);
    this.vectorIndex.push(memory);
    
    // Persist if needed
    await this.persistMemory(memory);
    
    console.log(`🧠 Stored memory: ${memoryId}`);
    this.emit('memory-stored', memory);
    
    return memory;
  }

  private async retrieveMemory(memoryId: string): Promise<MemoryEntry | null> {
    const memory = this.memories.get(memoryId);
    
    if (!memory) {
      return null;
    }

    // Update access stats
    memory.lastAccessed = new Date();
    memory.accessCount++;
    
    console.log(`🧠 Retrieved memory: ${memoryId}`);
    this.emit('memory-accessed', memory);
    
    return memory;
  }

  private async searchMemories(query: MemoryRequest['query']): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    const searchEmbedding = await this.generateEmbedding(query!.text);
    
    // Vector similarity search
    const similarities: Array<{ memory: MemoryEntry; score: number }> = [];
    
    for (const memory of this.vectorIndex) {
      if (!memory.embedding) continue;
      
      const similarity = this.cosineSimilarity(searchEmbedding, memory.embedding);
      
      if (similarity >= query!.similarity_threshold) {
        // Apply filters
        if (this.matchesFilters(memory, query!.filters)) {
          similarities.push({ memory, score: similarity });
        }
      }
    }
    
    // Sort by similarity and priority
    similarities.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) < 0.01) {
        // If scores are very close, prioritize by priority
        return b.memory.priority - a.memory.priority;
      }
      return scoreDiff;
    });
    
    // Return top results
    const topResults = similarities.slice(0, query!.limit).map(s => s.memory);
    
    // Update access stats for retrieved memories
    for (const memory of topResults) {
      memory.lastAccessed = new Date();
      memory.accessCount++;
    }
    
    console.log(`🧠 Found ${topResults.length} memories for query: "${query!.text}"`);
    this.emit('memory-searched', { query: query!.text, results: topResults.length });
    
    return topResults;
  }

  private async updateMemory(memoryId: string, data: MemoryRequest['data']): Promise<MemoryEntry> {
    const memory = this.memories.get(memoryId);
    
    if (!memory) {
      throw new Error(`Memory not found: ${memoryId}`);
    }

    // Update fields
    if (data!.content !== undefined) {
      memory.content = data!.content;
      // Regenerate embedding for new content
      memory.embedding = await this.generateEmbedding(this.extractTextContent(data!.content));
    }
    
    if (data!.metadata) {
      memory.metadata = { ...memory.metadata, ...data!.metadata };
    }
    
    if (data!.tags) {
      // Update tag index
      this.removeFromTagIndex(memoryId, memory.tags);
      memory.tags = data!.tags;
      this.updateTagIndex(memoryId, data!.tags);
    }
    
    if (data!.priority !== undefined) {
      memory.priority = data!.priority;
    }

    // Update vector index
    const vectorIndex = this.vectorIndex.findIndex(m => m.id === memoryId);
    if (vectorIndex !== -1) {
      this.vectorIndex[vectorIndex] = memory;
    }

    await this.persistMemory(memory);
    
    console.log(`🧠 Updated memory: ${memoryId}`);
    this.emit('memory-updated', memory);
    
    return memory;
  }

  private async deleteMemory(memoryId: string): Promise<boolean> {
    const memory = this.memories.get(memoryId);
    
    if (!memory) {
      return false;
    }

    // Remove from all indexes
    this.memories.delete(memoryId);
    this.removeFromTagIndex(memoryId, memory.tags);
    
    const vectorIndex = this.vectorIndex.findIndex(m => m.id === memoryId);
    if (vectorIndex !== -1) {
      this.vectorIndex.splice(vectorIndex, 1);
    }

    await this.unpersistMemory(memoryId);
    
    console.log(`🧠 Deleted memory: ${memoryId}`);
    this.emit('memory-deleted', { id: memoryId });
    
    return true;
  }

  // Real embedding generation (simplified)
  private async generateEmbedding(text: string): Promise<number[]> {
    // In a real implementation, this would use a proper embedding model
    // For now, we'll create a simple hash-based embedding
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const embedding = new Array(384).fill(0); // 384-dimensional embedding
    
    for (const word of words) {
      const hash = this.simpleHash(word);
      for (let i = 0; i < 384; i++) {
        embedding[i] += Math.sin(hash + i) * 0.1;
      }
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA * normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private extractTextContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    } else if (typeof content === 'object') {
      return JSON.stringify(content);
    } else {
      return String(content);
    }
  }

  private matchesFilters(memory: MemoryEntry, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'tags') {
        const requiredTags = Array.isArray(value) ? value : [value];
        const hasAllTags = requiredTags.every(tag => memory.tags.includes(tag));
        if (!hasAllTags) return false;
      } else if (key === 'minPriority') {
        if (memory.priority < value) return false;
      } else if (key === 'maxAge') {
        const ageMs = Date.now() - memory.timestamp.getTime();
        if (ageMs > value) return false;
      } else if (memory.metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private updateTagIndex(memoryId: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.memoryIndex.has(tag)) {
        this.memoryIndex.set(tag, new Set());
      }
      this.memoryIndex.get(tag)!.add(memoryId);
    }
  }

  private removeFromTagIndex(memoryId: string, tags: string[]): void {
    for (const tag of tags) {
      const tagSet = this.memoryIndex.get(tag);
      if (tagSet) {
        tagSet.delete(memoryId);
        if (tagSet.size === 0) {
          this.memoryIndex.delete(tag);
        }
      }
    }
  }

  private async loadPersistedMemories(): Promise<void> {
    try {
      if (process.env.DATABASE_URL) {
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        
        // Create memories table if it doesn't exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS wai_memories (
            id VARCHAR(255) PRIMARY KEY,
            content TEXT NOT NULL,
            tags TEXT[],
            priority INTEGER DEFAULT 5,
            embedding FLOAT[],
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            last_accessed TIMESTAMPTZ DEFAULT NOW(),
            access_count INTEGER DEFAULT 0,
            metadata JSONB
          )
        `);
        
        // Load existing memories
        const result = await pool.query('SELECT * FROM wai_memories');
        
        for (const row of result.rows) {
          const memory: MemoryEntry = {
            id: row.id,
            content: row.content,
            tags: row.tags || [],
            priority: row.priority,
            embedding: row.embedding ? Array.from(row.embedding) : undefined,
            timestamp: new Date(row.timestamp),
            lastAccessed: new Date(row.last_accessed),
            accessCount: row.access_count,
            metadata: row.metadata || {}
          };
          
          this.memories.set(memory.id, memory);
          this.updateTagIndex(memory.id, memory.tags);
        }
        
        pool.end();
        console.log(`🧠 Loaded ${result.rows.length} persisted memories from database`);
      } else {
        console.log('🧠 No database connection available, starting with empty memory store');
      }
    } catch (error) {
      console.error('Failed to load persisted memories:', error);
    }
  }

  private async persistMemory(memory: MemoryEntry): Promise<void> {
    try {
      if (process.env.DATABASE_URL) {
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        
        await pool.query(`
          INSERT INTO wai_memories (id, content, tags, priority, embedding, timestamp, last_accessed, access_count, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            tags = EXCLUDED.tags,
            priority = EXCLUDED.priority,
            embedding = EXCLUDED.embedding,
            last_accessed = EXCLUDED.last_accessed,
            access_count = EXCLUDED.access_count,
            metadata = EXCLUDED.metadata
        `, [
          memory.id,
          memory.content,
          memory.tags,
          memory.priority,
          memory.embedding || null,
          memory.timestamp,
          memory.lastAccessed,
          memory.accessCount,
          memory.metadata
        ]);
        
        pool.end();
      }
    } catch (error) {
      console.error('Failed to persist memory:', error);
    }
  }

  private async unpersistMemory(memoryId: string): Promise<void> {
    try {
      if (process.env.DATABASE_URL) {
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        
        await pool.query('DELETE FROM wai_memories WHERE id = $1', [memoryId]);
        
        pool.end();
      }
    } catch (error) {
      console.error('Failed to unpersist memory:', error);
    }
  }

  private startCleanupTimer(): void {
    // Clean up old, low-priority memories every hour
    setInterval(() => {
      this.cleanupOldMemories();
    }, 3600000); // 1 hour
  }

  private cleanupOldMemories(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    let cleaned = 0;
    
    for (const [memoryId, memory] of this.memories) {
      // Remove low-priority memories older than a week that haven't been accessed recently
      if (memory.priority < 3 && 
          memory.timestamp.getTime() < oneWeekAgo && 
          memory.lastAccessed.getTime() < oneWeekAgo &&
          memory.accessCount < 5) {
        
        this.deleteMemory(memoryId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old memories`);
    }
  }

  // Public API methods
  public getMemoryStats(): {
    totalMemories: number;
    totalTags: number;
    vectorIndexSize: number;
    averageAccessCount: number;
  } {
    const memories = Array.from(this.memories.values());
    
    return {
      totalMemories: memories.length,
      totalTags: this.memoryIndex.size,
      vectorIndexSize: this.vectorIndex.length,
      averageAccessCount: memories.length > 0 
        ? memories.reduce((sum, m) => sum + m.accessCount, 0) / memories.length 
        : 0
    };
  }

  public async getMemoriesByTag(tag: string): Promise<MemoryEntry[]> {
    const memoryIds = this.memoryIndex.get(tag);
    if (!memoryIds) return [];
    
    return Array.from(memoryIds).map(id => this.memories.get(id)).filter(Boolean) as MemoryEntry[];
  }

  async shutdown(): Promise<void> {
    console.log('🧠 Memory Service shutting down...');
    
    // Persist all memories before shutdown
    const persistPromises = Array.from(this.memories.values()).map(memory => 
      this.persistMemory(memory)
    );
    await Promise.all(persistPromises);
    
    this.memories.clear();
    this.memoryIndex.clear();
    this.vectorIndex.length = 0;
    this.removeAllListeners();
    this.initialized = false;
  }
}