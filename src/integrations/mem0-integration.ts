/**
 * Mem0 Vector Memory Integration
 * 
 * Implements Mem0's advanced vector memory system for persistent agent memory,
 * intelligent knowledge graph creation, and context-aware memory retrieval.
 * 
 * Based on: https://github.com/mem0ai/mem0
 */

import { EventEmitter } from 'events';

export interface Mem0Memory {
  id: string;
  content: string;
  vectorEmbedding: number[];
  metadata: {
    userId?: string;
    agentId: string;
    sessionId?: string;
    timestamp: Date;
    memoryType: 'episodic' | 'semantic' | 'procedural' | 'working';
    importance: number; // 0-1 scale
    accessCount: number;
    lastAccessed: Date;
    tags: string[];
    confidence: number;
  };
  relationships: {
    relatedMemories: string[];
    causedBy?: string;
    triggers?: string[];
    similarity?: number;
  };
}

export interface Mem0KnowledgeGraph {
  id: string;
  name: string;
  entities: Map<string, Mem0Entity>;
  relationships: Map<string, Mem0Relationship>;
  clusters: Map<string, Mem0Cluster>;
  metadata: {
    created: Date;
    lastUpdated: Date;
    memoryCount: number;
    entityCount: number;
    relationshipCount: number;
  };
}

export interface Mem0Entity {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  memoryIds: string[];
  importance: number;
  lastUpdated: Date;
}

export interface Mem0Relationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: string;
  strength: number;
  properties: Record<string, any>;
  memoryIds: string[];
}

export interface Mem0Cluster {
  id: string;
  name: string;
  entityIds: string[];
  centroid: number[];
  coherence: number;
  memoryIds: string[];
}

export interface Mem0Query {
  id: string;
  text: string;
  embedding: number[];
  filters: {
    userId?: string;
    agentId?: string;
    sessionId?: string;
    memoryTypes?: string[];
    timeRange?: {
      start: Date;
      end: Date;
    };
    importance?: {
      min: number;
      max: number;
    };
    tags?: string[];
  };
  similarityThreshold: number;
  maxResults: number;
}

export interface Mem0SearchResult {
  memory: Mem0Memory;
  similarity: number;
  relevanceScore: number;
  contextMatch: number;
  explanation: string;
}

export class Mem0VectorStore extends EventEmitter {
  private memories: Map<string, Mem0Memory> = new Map();
  private vectorDimensions: number = 1536; // OpenAI ada-002 dimensions
  private indexedVectors: Array<{ id: string; vector: number[] }> = [];

  constructor(options: { dimensions?: number } = {}) {
    super();
    this.vectorDimensions = options.dimensions || 1536;
  }

  /**
   * Store memory with vector embedding
   */
  async storeMemory(
    content: string,
    agentId: string,
    metadata: Partial<Mem0Memory['metadata']> = {}
  ): Promise<string> {
    try {
      const memoryId = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate vector embedding
      const embedding = await this.generateEmbedding(content);
      
      const memory: Mem0Memory = {
        id: memoryId,
        content,
        vectorEmbedding: embedding,
        metadata: {
          agentId,
          timestamp: new Date(),
          memoryType: metadata.memoryType || 'episodic',
          importance: metadata.importance || 0.5,
          accessCount: 0,
          lastAccessed: new Date(),
          tags: metadata.tags || [],
          confidence: metadata.confidence || 0.8,
          userId: metadata.userId,
          sessionId: metadata.sessionId
        },
        relationships: {
          relatedMemories: [],
          triggers: [],
          similarity: 0
        }
      };

      // Store memory
      this.memories.set(memoryId, memory);
      this.indexedVectors.push({ id: memoryId, vector: embedding });

      // Find and establish relationships
      await this.establishRelationships(memory);

      this.emit('memory-stored', {
        memoryId,
        agentId,
        memoryType: memory.metadata.memoryType,
        importance: memory.metadata.importance,
        timestamp: new Date()
      });

      return memoryId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'memory-storage', error: errorMessage, agentId });
      throw error;
    }
  }

  /**
   * Search memories using vector similarity
   */
  async searchMemories(query: Mem0Query): Promise<Mem0SearchResult[]> {
    try {
      this.emit('search-started', {
        queryId: query.id,
        similarityThreshold: query.similarityThreshold,
        maxResults: query.maxResults,
        timestamp: new Date()
      });

      // Filter memories based on criteria
      const candidateMemories = this.filterMemories(query);
      
      // Calculate similarity scores
      const scoredResults = await this.calculateSimilarities(query, candidateMemories);
      
      // Rank and filter by threshold
      const filteredResults = scoredResults
        .filter(result => result.similarity >= query.similarityThreshold)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, query.maxResults);

      // Update access patterns
      filteredResults.forEach(result => {
        result.memory.metadata.accessCount++;
        result.memory.metadata.lastAccessed = new Date();
      });

      this.emit('search-completed', {
        queryId: query.id,
        resultsFound: filteredResults.length,
        averageSimilarity: filteredResults.reduce((sum, r) => sum + r.similarity, 0) / filteredResults.length,
        timestamp: new Date()
      });

      return filteredResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'memory-search', error: errorMessage, queryId: query.id });
      throw error;
    }
  }

  /**
   * Update memory content and refresh relationships
   */
  async updateMemory(memoryId: string, updates: Partial<Mem0Memory>): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    // Update content and re-embed if necessary
    if (updates.content && updates.content !== memory.content) {
      const newEmbedding = await this.generateEmbedding(updates.content);
      memory.vectorEmbedding = newEmbedding;
      
      // Update indexed vectors
      const vectorIndex = this.indexedVectors.findIndex(v => v.id === memoryId);
      if (vectorIndex !== -1) {
        this.indexedVectors[vectorIndex].vector = newEmbedding;
      }
    }

    // Apply updates
    Object.assign(memory, updates);
    memory.metadata.lastAccessed = new Date();

    // Re-establish relationships if content changed
    if (updates.content) {
      await this.establishRelationships(memory);
    }

    this.emit('memory-updated', {
      memoryId,
      updates: Object.keys(updates),
      timestamp: new Date()
    });
  }

  /**
   * Delete memory and clean up relationships
   */
  async deleteMemory(memoryId: string): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    // Remove from storage
    this.memories.delete(memoryId);
    
    // Remove from vector index
    const vectorIndex = this.indexedVectors.findIndex(v => v.id === memoryId);
    if (vectorIndex !== -1) {
      this.indexedVectors.splice(vectorIndex, 1);
    }

    // Clean up relationships
    await this.cleanupRelationships(memoryId);

    this.emit('memory-deleted', {
      memoryId,
      timestamp: new Date()
    });
  }

  /**
   * Generate vector embedding for text content using real OpenAI API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const { logger } = await import('../utils/wai-logger.ts');
      
      // Use OpenAI embeddings API for real vector generation
      const openaiService = await import('../services/openai-service.js');
      
      const embeddingResponse = await openaiService.default.createEmbedding({
        input: text,
        model: 'text-embedding-ada-002'
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      logger.info('mem0-integration', 'Generated real embedding', { 
        textLength: text.length,
        embeddingDimensions: embedding.length
      });
      
      return embedding;
    } catch (error) {
      const { logger } = await import('../utils/wai-logger.ts');
      logger.warn('mem0-integration', 'OpenAI embedding failed, using fallback', { 
        error: error instanceof Error ? error.message : String(error),
        textLength: text.length
      });
      
      // Fallback to sentence-based embedding for resilience
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Fallback embedding generation using text characteristics
   */
  private generateFallbackEmbedding(text: string): number[] {
    // More sophisticated fallback than random - use text characteristics
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;
    const uniqueWords = new Set(words).size;
    const diversity = uniqueWords / wordCount;
    
    // Create base characteristics vector
    const characteristics = [
      wordCount / 1000,           // Normalized word count
      avgWordLength / 10,         // Normalized average word length  
      diversity,                  // Lexical diversity
      text.length / 5000,         // Normalized text length
      (text.match(/[.!?]/g) || []).length / wordCount, // Sentence density
      (text.match(/[A-Z]/g) || []).length / text.length, // Capitalization ratio
    ];
    
    // Expand to full dimensions using deterministic patterns
    const embedding = new Array(this.vectorDimensions);
    const prime = 31; // Prime number for hash distribution
    
    for (let i = 0; i < this.vectorDimensions; i++) {
      const charIndex = i % characteristics.length;
      const seed = characteristics[charIndex] * prime * (i + 1);
      
      // Use text hash to create consistent but varied values
      let hash = 0;
      for (let j = 0; j < text.length; j++) {
        hash = ((hash << 5) - hash + text.charCodeAt(j) + i) & 0xffffffff;
      }
      
      embedding[i] = (Math.sin(seed + hash) + characteristics[charIndex % characteristics.length]) / 2;
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      magnitude1 += vector1[i] * vector1[i];
      magnitude2 += vector2[i] * vector2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Filter memories based on query criteria
   */
  private filterMemories(query: Mem0Query): Mem0Memory[] {
    return Array.from(this.memories.values()).filter(memory => {
      // Filter by agent ID
      if (query.filters.agentId && memory.metadata.agentId !== query.filters.agentId) {
        return false;
      }

      // Filter by user ID
      if (query.filters.userId && memory.metadata.userId !== query.filters.userId) {
        return false;
      }

      // Filter by session ID
      if (query.filters.sessionId && memory.metadata.sessionId !== query.filters.sessionId) {
        return false;
      }

      // Filter by memory types
      if (query.filters.memoryTypes && !query.filters.memoryTypes.includes(memory.metadata.memoryType)) {
        return false;
      }

      // Filter by time range
      if (query.filters.timeRange) {
        const memoryTime = memory.metadata.timestamp;
        if (memoryTime < query.filters.timeRange.start || memoryTime > query.filters.timeRange.end) {
          return false;
        }
      }

      // Filter by importance
      if (query.filters.importance) {
        const importance = memory.metadata.importance;
        if (importance < query.filters.importance.min || importance > query.filters.importance.max) {
          return false;
        }
      }

      // Filter by tags
      if (query.filters.tags && query.filters.tags.length > 0) {
        const hasMatchingTag = query.filters.tags.some(tag => 
          memory.metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Calculate similarities and relevance scores
   */
  private async calculateSimilarities(query: Mem0Query, memories: Mem0Memory[]): Promise<Mem0SearchResult[]> {
    const results: Mem0SearchResult[] = [];

    for (const memory of memories) {
      const similarity = this.calculateCosineSimilarity(query.embedding, memory.vectorEmbedding);
      const contextMatch = this.calculateContextMatch(query, memory);
      const relevanceScore = this.calculateRelevanceScore(similarity, contextMatch, memory);
      const explanation = this.generateResultExplanation(similarity, contextMatch, memory);

      results.push({
        memory,
        similarity,
        relevanceScore,
        contextMatch,
        explanation
      });
    }

    return results;
  }

  /**
   * Calculate context match score
   */
  private calculateContextMatch(query: Mem0Query, memory: Mem0Memory): number {
    let contextScore = 0;

    // Same agent bonus
    if (query.filters.agentId === memory.metadata.agentId) {
      contextScore += 0.2;
    }

    // Same session bonus
    if (query.filters.sessionId === memory.metadata.sessionId) {
      contextScore += 0.3;
    }

    // Recent memory bonus
    const hoursSinceCreated = (Date.now() - memory.metadata.timestamp.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated < 24) {
      contextScore += 0.2 * (1 - hoursSinceCreated / 24);
    }

    // Importance bonus
    contextScore += memory.metadata.importance * 0.3;

    return Math.min(1, contextScore);
  }

  /**
   * Calculate overall relevance score
   */
  private calculateRelevanceScore(similarity: number, contextMatch: number, memory: Mem0Memory): number {
    // Weighted combination of factors
    const similarityWeight = 0.6;
    const contextWeight = 0.3;
    const importanceWeight = 0.1;

    return (similarity * similarityWeight) + 
           (contextMatch * contextWeight) + 
           (memory.metadata.importance * importanceWeight);
  }

  /**
   * Generate explanation for search result
   */
  private generateResultExplanation(similarity: number, contextMatch: number, memory: Mem0Memory): string {
    const similarityPercent = (similarity * 100).toFixed(1);
    const contextPercent = (contextMatch * 100).toFixed(1);
    
    return `Found with ${similarityPercent}% content similarity and ${contextPercent}% context match. ` +
           `Memory importance: ${(memory.metadata.importance * 100).toFixed(0)}%, ` +
           `accessed ${memory.metadata.accessCount} times.`;
  }

  /**
   * Establish relationships between memories
   */
  private async establishRelationships(memory: Mem0Memory): Promise<void> {
    const relatedMemories: string[] = [];
    const similarityThreshold = 0.7;

    // Find similar memories
    for (const [otherId, otherMemory] of this.memories) {
      if (otherId === memory.id) continue;

      const similarity = this.calculateCosineSimilarity(memory.vectorEmbedding, otherMemory.vectorEmbedding);
      
      if (similarity >= similarityThreshold) {
        relatedMemories.push(otherId);
        
        // Add bidirectional relationship
        if (!otherMemory.relationships.relatedMemories.includes(memory.id)) {
          otherMemory.relationships.relatedMemories.push(memory.id);
        }
      }
    }

    memory.relationships.relatedMemories = relatedMemories;
  }

  /**
   * Clean up relationships when memory is deleted
   */
  private async cleanupRelationships(deletedMemoryId: string): Promise<void> {
    for (const memory of this.memories.values()) {
      // Remove from related memories
      const relatedIndex = memory.relationships.relatedMemories.indexOf(deletedMemoryId);
      if (relatedIndex !== -1) {
        memory.relationships.relatedMemories.splice(relatedIndex, 1);
      }

      // Remove from triggers
      if (memory.relationships.triggers) {
        const triggerIndex = memory.relationships.triggers.indexOf(deletedMemoryId);
        if (triggerIndex !== -1) {
          memory.relationships.triggers.splice(triggerIndex, 1);
        }
      }

      // Remove causedBy reference
      if (memory.relationships.causedBy === deletedMemoryId) {
        memory.relationships.causedBy = undefined;
      }
    }
  }

  // Public interface methods
  getMemory(id: string): Mem0Memory | undefined {
    return this.memories.get(id);
  }

  getAllMemories(): Mem0Memory[] {
    return Array.from(this.memories.values());
  }

  getMemoriesByAgent(agentId: string): Mem0Memory[] {
    return Array.from(this.memories.values()).filter(m => m.metadata.agentId === agentId);
  }

  getMemoriesByType(memoryType: string): Mem0Memory[] {
    return Array.from(this.memories.values()).filter(m => m.metadata.memoryType === memoryType);
  }

  getVectorStoreMetrics(): any {
    const memories = Array.from(this.memories.values());
    
    return {
      totalMemories: memories.length,
      memoryTypes: {
        episodic: memories.filter(m => m.metadata.memoryType === 'episodic').length,
        semantic: memories.filter(m => m.metadata.memoryType === 'semantic').length,
        procedural: memories.filter(m => m.metadata.memoryType === 'procedural').length,
        working: memories.filter(m => m.metadata.memoryType === 'working').length
      },
      averageImportance: memories.reduce((sum, m) => sum + m.metadata.importance, 0) / memories.length,
      averageAccessCount: memories.reduce((sum, m) => sum + m.metadata.accessCount, 0) / memories.length,
      vectorDimensions: this.vectorDimensions,
      indexSize: this.indexedVectors.length,
      relationshipCount: memories.reduce((sum, m) => sum + m.relationships.relatedMemories.length, 0)
    };
  }
}

export class Mem0KnowledgeGraphBuilder extends EventEmitter {
  private knowledgeGraphs: Map<string, Mem0KnowledgeGraph> = new Map();
  private vectorStore: Mem0VectorStore;

  constructor(vectorStore: Mem0VectorStore) {
    super();
    this.vectorStore = vectorStore;
  }

  /**
   * Build knowledge graph from memories
   */
  async buildKnowledgeGraph(
    name: string,
    memoryIds: string[],
    options: {
      entityExtractionThreshold?: number;
      relationshipThreshold?: number;
      clusteringEnabled?: boolean;
    } = {}
  ): Promise<Mem0KnowledgeGraph> {
    try {
      const graphId = `kg-${Date.now()}`;
      
      this.emit('graph-building-started', {
        graphId,
        name,
        memoryCount: memoryIds.length,
        timestamp: new Date()
      });

      // Extract entities from memories
      const entities = await this.extractEntities(memoryIds, options.entityExtractionThreshold || 0.7);
      
      // Build relationships
      const relationships = await this.buildRelationships(entities, options.relationshipThreshold || 0.6);
      
      // Create clusters if enabled
      const clusters = options.clusteringEnabled 
        ? await this.createClusters(entities, memoryIds)
        : new Map<string, Mem0Cluster>();

      const knowledgeGraph: Mem0KnowledgeGraph = {
        id: graphId,
        name,
        entities,
        relationships,
        clusters,
        metadata: {
          created: new Date(),
          lastUpdated: new Date(),
          memoryCount: memoryIds.length,
          entityCount: entities.size,
          relationshipCount: relationships.size
        }
      };

      this.knowledgeGraphs.set(graphId, knowledgeGraph);

      this.emit('graph-building-completed', {
        graphId,
        entityCount: entities.size,
        relationshipCount: relationships.size,
        clusterCount: clusters.size,
        timestamp: new Date()
      });

      return knowledgeGraph;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'knowledge-graph-building', error: errorMessage });
      throw error;
    }
  }

  /**
   * Extract entities from memory content
   */
  private async extractEntities(memoryIds: string[], threshold: number): Promise<Map<string, Mem0Entity>> {
    const entities = new Map<string, Mem0Entity>();
    const entityCandidates = new Map<string, any>();

    // Simple entity extraction (would use NLP in production)
    for (const memoryId of memoryIds) {
      const memory = this.vectorStore.getMemory(memoryId);
      if (!memory) continue;

      const extractedEntities = this.extractEntitiesFromText(memory.content);
      
      for (const entity of extractedEntities) {
        const key = entity.name.toLowerCase();
        
        if (!entityCandidates.has(key)) {
          entityCandidates.set(key, {
            name: entity.name,
            type: entity.type,
            mentions: 0,
            memories: [],
            properties: {}
          });
        }
        
        const candidate = entityCandidates.get(key)!;
        candidate.mentions++;
        candidate.memories.push(memoryId);
        Object.assign(candidate.properties, entity.properties);
      }
    }

    // Filter entities by threshold
    for (const [key, candidate] of entityCandidates) {
      const importance = candidate.mentions / memoryIds.length;
      
      if (importance >= threshold) {
        const entityId = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        entities.set(entityId, {
          id: entityId,
          name: candidate.name,
          type: candidate.type,
          properties: candidate.properties,
          memoryIds: candidate.memories,
          importance,
          lastUpdated: new Date()
        });
      }
    }

    return entities;
  }

  /**
   * Extract entities from text content using enhanced NLP patterns
   */
  private extractEntitiesFromText(text: string): Array<{ name: string; type: string; properties: Record<string, any> }> {
    const entities: Array<{ name: string; type: string; properties: Record<string, any> }> = [];
    
    // Enhanced pattern-based extraction with more sophisticated patterns
    const patterns = [
      // People names
      { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g, type: 'PERSON' },
      { regex: /\b(?:Mr|Mrs|Ms|Dr|Prof|CEO|CTO|VP)\.?\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/g, type: 'PERSON' },
      
      // Organizations
      { regex: /\b[A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)*(?:\s(?:Corp|Inc|LLC|Ltd|Co|Company|Corporation|Industries|Systems|Technologies|Solutions|Group|Holdings))\b/g, type: 'ORGANIZATION' },
      { regex: /\b(?:Microsoft|Google|Apple|Amazon|Facebook|Meta|OpenAI|Anthropic|Tesla|Netflix|Spotify|GitHub|LinkedIn|Twitter|X|Instagram|YouTube|TikTok|Uber|Airbnb|PayPal|Stripe|Shopify|Zoom|Slack|Discord|Reddit|Wikipedia|Mozilla|Adobe|Oracle|IBM|Intel|NVIDIA|AMD|Samsung|Sony|Nintendo|Boeing|NASA|SpaceX)\b/g, type: 'ORGANIZATION' },
      
      // Locations
      { regex: /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s(?:City|Street|Avenue|Road|Boulevard|Lane|Drive|Court|Place|Way|Plaza|Square|Park|Beach|Mountain|Valley|River|Lake|Ocean|Bay|Island|Airport|University|Hospital|Mall|Center|Building|Tower|Bridge)\b/g, type: 'LOCATION' },
      
      // Dates and times
      { regex: /\b\d{4}-\d{2}-\d{2}\b/g, type: 'DATE' },
      { regex: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s\d{1,2},?\s\d{4}\b/g, type: 'DATE' },
      { regex: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, type: 'DATE' },
      { regex: /\b\d{1,2}:\d{2}(?::\d{2})?\s?(?:AM|PM|am|pm)?\b/g, type: 'TIME' },
      
      // Money and numbers
      { regex: /\$\d+(?:,\d{3})*(?:\.\d{2})?\b/g, type: 'MONEY' },
      { regex: /\b\d+(?:,\d{3})*(?:\.\d+)?\s?(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|dollars?|euros?|pounds?|yen)\b/g, type: 'MONEY' },
      
      // Technology terms
      { regex: /\b(?:API|SDK|HTTP|HTTPS|REST|GraphQL|JSON|XML|HTML|CSS|JavaScript|TypeScript|Python|Java|C\+\+|React|Vue|Angular|Node\.js|MongoDB|PostgreSQL|MySQL|Redis|AWS|Azure|GCP|Docker|Kubernetes|Git|GitHub|GitLab|CI\/CD|DevOps|ML|AI|GPU|CPU|RAM|SSD|HDD|URL|URI|IP|DNS|SSL|TLS|OAuth|JWT|CORS|CRUD|ORM|MVC|SPA|PWA|SEO|CMS|ERP|CRM|SaaS|PaaS|IaaS|IoT|VR|AR|5G|WiFi|Bluetooth|USB|HDMI)\b/g, type: 'TECHNOLOGY' },
      
      // Email addresses
      { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'EMAIL' },
      
      // URLs
      { regex: /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)/g, type: 'URL' },
      
      // Phone numbers
      { regex: /\b(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, type: 'PHONE' }
    ];

    // Process each pattern
    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);
      if (matches) {
        for (const match of matches) {
          const cleanMatch = match.trim();
          
          // Extract additional properties based on entity type
          const properties: Record<string, any> = {};
          
          if (pattern.type === 'PERSON') {
            const nameParts = cleanMatch.split(/\s+/);
            properties.firstName = nameParts[0];
            properties.lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
            properties.fullName = cleanMatch;
          } else if (pattern.type === 'DATE') {
            properties.rawDate = cleanMatch;
            properties.parsed = this.parseDate(cleanMatch);
          } else if (pattern.type === 'MONEY') {
            properties.rawAmount = cleanMatch;
            properties.numericValue = this.parseMoney(cleanMatch);
          } else if (pattern.type === 'EMAIL') {
            const [username, domain] = cleanMatch.split('@');
            properties.username = username;
            properties.domain = domain;
          } else if (pattern.type === 'URL') {
            properties.protocol = cleanMatch.startsWith('https') ? 'https' : 'http';
            properties.domain = this.extractDomain(cleanMatch);
          }
          
          entities.push({
            name: cleanMatch,
            type: pattern.type,
            properties
          });
        }
      }
    }

    // Remove duplicates and return
    const uniqueEntities = entities.filter((entity, index, self) => 
      index === self.findIndex(e => e.name === entity.name && e.type === entity.type)
    );

    return uniqueEntities;
  }

  /**
   * Parse date string to standardized format
   */
  private parseDate(dateStr: string): Date | null {
    try {
      return new Date(dateStr);
    } catch {
      return null;
    }
  }

  /**
   * Extract numeric value from money string
   */
  private parseMoney(moneyStr: string): number | null {
    try {
      const numericStr = moneyStr.replace(/[^0-9.]/g, '');
      return parseFloat(numericStr);
    } catch {
      return null;
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Build relationships between entities
   */
  private async buildRelationships(entities: Map<string, Mem0Entity>, threshold: number): Promise<Map<string, Mem0Relationship>> {
    const relationships = new Map<string, Mem0Relationship>();

    const entityArray = Array.from(entities.values());
    
    for (let i = 0; i < entityArray.length; i++) {
      for (let j = i + 1; j < entityArray.length; j++) {
        const entity1 = entityArray[i];
        const entity2 = entityArray[j];
        
        // Calculate relationship strength based on co-occurrence in memories
        const commonMemories = entity1.memoryIds.filter(id => entity2.memoryIds.includes(id));
        const strength = commonMemories.length / Math.min(entity1.memoryIds.length, entity2.memoryIds.length);
        
        if (strength >= threshold) {
          const relationshipId = `rel-${entity1.id}-${entity2.id}`;
          
          relationships.set(relationshipId, {
            id: relationshipId,
            sourceEntityId: entity1.id,
            targetEntityId: entity2.id,
            type: this.inferRelationshipType(entity1, entity2),
            strength,
            properties: {},
            memoryIds: commonMemories
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Infer relationship type between entities
   */
  private inferRelationshipType(entity1: Mem0Entity, entity2: Mem0Entity): string {
    // Simple type-based relationship inference
    if (entity1.type === 'PERSON' && entity2.type === 'ORGANIZATION') {
      return 'WORKS_FOR';
    }
    
    if (entity1.type === 'PERSON' && entity2.type === 'PERSON') {
      return 'KNOWS';
    }
    
    if (entity1.type === 'ORGANIZATION' && entity2.type === 'LOCATION') {
      return 'LOCATED_IN';
    }
    
    return 'RELATED_TO';
  }

  /**
   * Create entity clusters
   */
  private async createClusters(entities: Map<string, Mem0Entity>, memoryIds: string[]): Promise<Map<string, Mem0Cluster>> {
    const clusters = new Map<string, Mem0Cluster>();
    
    // Simple clustering by entity type
    const typeGroups = new Map<string, Mem0Entity[]>();
    
    for (const entity of entities.values()) {
      if (!typeGroups.has(entity.type)) {
        typeGroups.set(entity.type, []);
      }
      typeGroups.get(entity.type)!.push(entity);
    }

    for (const [type, entityGroup] of typeGroups) {
      if (entityGroup.length >= 2) {
        const clusterId = `cluster-${type.toLowerCase()}-${Date.now()}`;
        
        clusters.set(clusterId, {
          id: clusterId,
          name: `${type} Cluster`,
          entityIds: entityGroup.map(e => e.id),
          centroid: this.calculateClusterCentroid(entityGroup),
          coherence: this.calculateClusterCoherence(entityGroup),
          memoryIds: [...new Set(entityGroup.flatMap(e => e.memoryIds))]
        });
      }
    }

    return clusters;
  }

  /**
   * Calculate cluster centroid
   */
  private calculateClusterCentroid(entities: Mem0Entity[]): number[] {
    // Simplified centroid calculation
    return new Array(10).fill(0).map(() => Math.random());
  }

  /**
   * Calculate cluster coherence
   */
  private calculateClusterCoherence(entities: Mem0Entity[]): number {
    // Simplified coherence calculation based on shared memories
    const totalSharedMemories = entities.reduce((sum, entity) => {
      return sum + entities.filter(other => 
        other !== entity && entity.memoryIds.some(id => other.memoryIds.includes(id))
      ).length;
    }, 0);
    
    const maxPossibleConnections = entities.length * (entities.length - 1);
    return maxPossibleConnections > 0 ? totalSharedMemories / maxPossibleConnections : 0;
  }

  // Public interface methods
  getKnowledgeGraph(id: string): Mem0KnowledgeGraph | undefined {
    return this.knowledgeGraphs.get(id);
  }

  getAllKnowledgeGraphs(): Mem0KnowledgeGraph[] {
    return Array.from(this.knowledgeGraphs.values());
  }

  getKnowledgeGraphMetrics(): any {
    const graphs = Array.from(this.knowledgeGraphs.values());
    
    return {
      totalGraphs: graphs.length,
      totalEntities: graphs.reduce((sum, g) => sum + g.entities.size, 0),
      totalRelationships: graphs.reduce((sum, g) => sum + g.relationships.size, 0),
      totalClusters: graphs.reduce((sum, g) => sum + g.clusters.size, 0),
      averageEntityCount: graphs.reduce((sum, g) => sum + g.entities.size, 0) / graphs.length,
      averageRelationshipCount: graphs.reduce((sum, g) => sum + g.relationships.size, 0) / graphs.length
    };
  }
}

export class Mem0Master extends EventEmitter {
  private vectorStore: Mem0VectorStore;
  private knowledgeGraphBuilder: Mem0KnowledgeGraphBuilder;
  private agentMemories: Map<string, string[]> = new Map(); // agentId -> memoryIds

  constructor(options: { vectorDimensions?: number } = {}) {
    super();
    this.vectorStore = new Mem0VectorStore({ dimensions: options.vectorDimensions });
    this.knowledgeGraphBuilder = new Mem0KnowledgeGraphBuilder(this.vectorStore);
    this.setupEventHandlers();
  }

  /**
   * Store memory for agent with automatic knowledge graph updates
   */
  async storeAgentMemory(
    agentId: string,
    content: string,
    metadata: {
      userId?: string;
      sessionId?: string;
      memoryType?: 'episodic' | 'semantic' | 'procedural' | 'working';
      importance?: number;
      tags?: string[];
    } = {}
  ): Promise<string> {
    try {
      const memoryId = await this.vectorStore.storeMemory(content, agentId, metadata);
      
      // Track agent memories
      if (!this.agentMemories.has(agentId)) {
        this.agentMemories.set(agentId, []);
      }
      this.agentMemories.get(agentId)!.push(memoryId);

      this.emit('agent-memory-stored', {
        agentId,
        memoryId,
        memoryType: metadata.memoryType || 'episodic',
        timestamp: new Date()
      });

      return memoryId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'agent-memory-storage', error: errorMessage, agentId });
      throw error;
    }
  }

  /**
   * Query agent memories with context-aware search
   */
  async queryAgentMemories(
    agentId: string,
    query: string,
    options: {
      maxResults?: number;
      similarityThreshold?: number;
      memoryTypes?: string[];
      includeCrossAgentMemories?: boolean;
      timeRange?: { start: Date; end: Date };
    } = {}
  ): Promise<Mem0SearchResult[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      const mem0Query: Mem0Query = {
        id: `query-${Date.now()}`,
        text: query,
        embedding: queryEmbedding,
        filters: {
          agentId: options.includeCrossAgentMemories ? undefined : agentId,
          memoryTypes: options.memoryTypes,
          timeRange: options.timeRange
        },
        similarityThreshold: options.similarityThreshold || 0.7,
        maxResults: options.maxResults || 10
      };

      const results = await this.vectorStore.searchMemories(mem0Query);

      this.emit('agent-memory-queried', {
        agentId,
        query,
        resultsCount: results.length,
        averageSimilarity: results.reduce((sum, r) => sum + r.similarity, 0) / results.length,
        timestamp: new Date()
      });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'agent-memory-query', error: errorMessage, agentId });
      throw error;
    }
  }

  /**
   * Build knowledge graph for agent
   */
  async buildAgentKnowledgeGraph(
    agentId: string,
    options: {
      includeRelatedAgents?: boolean;
      entityExtractionThreshold?: number;
      relationshipThreshold?: number;
    } = {}
  ): Promise<Mem0KnowledgeGraph> {
    try {
      let memoryIds = this.agentMemories.get(agentId) || [];
      
      // Include related agent memories if requested
      if (options.includeRelatedAgents) {
        const relatedMemoryIds = await this.findRelatedAgentMemories(agentId);
        memoryIds = [...memoryIds, ...relatedMemoryIds];
      }

      const knowledgeGraph = await this.knowledgeGraphBuilder.buildKnowledgeGraph(
        `Agent ${agentId} Knowledge Graph`,
        memoryIds,
        {
          entityExtractionThreshold: options.entityExtractionThreshold,
          relationshipThreshold: options.relationshipThreshold,
          clusteringEnabled: true
        }
      );

      this.emit('agent-knowledge-graph-built', {
        agentId,
        graphId: knowledgeGraph.id,
        entityCount: knowledgeGraph.entities.size,
        relationshipCount: knowledgeGraph.relationships.size,
        timestamp: new Date()
      });

      return knowledgeGraph;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'agent-knowledge-graph', error: errorMessage, agentId });
      throw error;
    }
  }

  /**
   * Get memory insights for agent
   */
  getAgentMemoryInsights(agentId: string): any {
    const memories = this.vectorStore.getMemoriesByAgent(agentId);
    
    if (memories.length === 0) {
      return {
        totalMemories: 0,
        insights: 'No memories stored for this agent'
      };
    }

    const memoryTypes = memories.reduce((acc, memory) => {
      acc[memory.metadata.memoryType] = (acc[memory.metadata.memoryType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageImportance = memories.reduce((sum, m) => sum + m.metadata.importance, 0) / memories.length;
    const totalAccessCount = memories.reduce((sum, m) => sum + m.metadata.accessCount, 0);
    const mostAccessedMemory = memories.reduce((max, m) => m.metadata.accessCount > max.metadata.accessCount ? m : max);
    
    return {
      totalMemories: memories.length,
      memoryTypes,
      averageImportance,
      totalAccessCount,
      mostAccessedMemory: {
        id: mostAccessedMemory.id,
        content: mostAccessedMemory.content.substring(0, 100) + '...',
        accessCount: mostAccessedMemory.metadata.accessCount
      },
      oldestMemory: memories.reduce((oldest, m) => m.metadata.timestamp < oldest.metadata.timestamp ? m : oldest).metadata.timestamp,
      newestMemory: memories.reduce((newest, m) => m.metadata.timestamp > newest.metadata.timestamp ? m : newest).metadata.timestamp,
      topTags: this.getTopTags(memories)
    };
  }

  private async generateQueryEmbedding(query: string): Promise<number[]> {
    // Use the same embedding generation as the vector store
    return await this.vectorStore['generateEmbedding'](query);
  }

  private async findRelatedAgentMemories(agentId: string): Promise<string[]> {
    // Find memories from other agents that might be related
    const allMemories = this.vectorStore.getAllMemories();
    const agentMemories = allMemories.filter(m => m.metadata.agentId === agentId);
    const otherMemories = allMemories.filter(m => m.metadata.agentId !== agentId);
    
    const relatedMemoryIds: string[] = [];
    
    // Simple relatedness check based on shared users or sessions
    for (const agentMemory of agentMemories) {
      for (const otherMemory of otherMemories) {
        if (
          (agentMemory.metadata.userId && agentMemory.metadata.userId === otherMemory.metadata.userId) ||
          (agentMemory.metadata.sessionId && agentMemory.metadata.sessionId === otherMemory.metadata.sessionId)
        ) {
          relatedMemoryIds.push(otherMemory.id);
        }
      }
    }
    
    return [...new Set(relatedMemoryIds)]; // Remove duplicates
  }

  private getTopTags(memories: Mem0Memory[]): Array<{ tag: string; count: number }> {
    const tagCounts: Record<string, number> = {};
    
    for (const memory of memories) {
      for (const tag of memory.metadata.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private setupEventHandlers(): void {
    // Forward events from child components
    [this.vectorStore, this.knowledgeGraphBuilder].forEach(component => {
      component.on('error', (error) => this.emit('error', error));
    });

    // Memory system logging
    this.on('agent-memory-stored', (data) => {
      console.log(`🧠 Mem0: Stored ${data.memoryType} memory ${data.memoryId} for agent ${data.agentId}`);
    });

    this.on('agent-memory-queried', (data) => {
      console.log(`🔍 Mem0: Found ${data.resultsCount} memories for agent ${data.agentId} (avg similarity: ${data.averageSimilarity.toFixed(2)})`);
    });

    this.on('agent-knowledge-graph-built', (data) => {
      console.log(`📊 Mem0: Built knowledge graph ${data.graphId} for agent ${data.agentId} (${data.entityCount} entities, ${data.relationshipCount} relationships)`);
    });

    this.on('error', (error) => {
      console.error(`❌ Mem0 Error in ${error.stage}:`, error.error);
    });
  }

  // Public interface methods
  getVectorStore(): Mem0VectorStore {
    return this.vectorStore;
  }

  getKnowledgeGraphBuilder(): Mem0KnowledgeGraphBuilder {
    return this.knowledgeGraphBuilder;
  }

  getMem0Metrics(): any {
    const vectorMetrics = this.vectorStore.getVectorStoreMetrics();
    const kgMetrics = this.knowledgeGraphBuilder.getKnowledgeGraphMetrics();
    
    return {
      vectorStore: vectorMetrics,
      knowledgeGraphs: kgMetrics,
      agentMemories: {
        agentsWithMemories: this.agentMemories.size,
        totalMemoryMappings: Array.from(this.agentMemories.values()).reduce((sum, ids) => sum + ids.length, 0),
        averageMemoriesPerAgent: Array.from(this.agentMemories.values()).reduce((sum, ids) => sum + ids.length, 0) / this.agentMemories.size
      }
    };
  }

  // Agent memory management
  getAgentMemoryIds(agentId: string): string[] {
    return this.agentMemories.get(agentId) || [];
  }

  getAllAgentsWithMemories(): string[] {
    return Array.from(this.agentMemories.keys());
  }
}

// Factory function for integration with WAI orchestration
export function createMem0Integration(options?: { dimensions?: number }): Mem0Master {
  return new Mem0Master({ vectorDimensions: options?.dimensions });
}