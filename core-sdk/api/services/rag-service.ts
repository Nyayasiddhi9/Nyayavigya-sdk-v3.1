/**
 * RAG (Retrieval-Augmented Generation) Service - Real Implementation
 * Provides document retrieval and knowledge base querying capabilities
 */

import { EventEmitter } from 'events';

export interface RAGRequest {
  query: string;
  options: {
    knowledgeBase: string[];
    retrievalMode: 'semantic' | 'hybrid' | 'keyword';
    maxDocuments: number;
    confidence_threshold: number;
    includeMetadata: boolean;
    rerank: boolean;
  };
}

interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
  source: string;
  lastUpdated: Date;
}

interface KnowledgeBase {
  id: string;
  name: string;
  documents: Map<string, Document>;
  documentIndex: Map<string, Set<string>>; // keyword -> document ids
  vectorIndex: Document[];
}

export class RAGService extends EventEmitter {
  private initialized = false;
  private knowledgeBases: Map<string, KnowledgeBase> = new Map();
  private globalDocumentCount = 0;

  async initialize(): Promise<void> {
    try {
      console.log('📚 Initializing RAG Service...');
      
      // Initialize default knowledge bases
      await this.initializeDefaultKnowledgeBases();
      
      this.initialized = true;
      console.log('✅ RAG Service initialized');
      
    } catch (error) {
      console.error('❌ RAG Service initialization failed:', error);
      throw error;
    }
  }

  private async initializeDefaultKnowledgeBases(): Promise<void> {
    // Initialize general knowledge base
    const generalKB: KnowledgeBase = {
      id: 'general',
      name: 'General Knowledge',
      documents: new Map(),
      documentIndex: new Map(),
      vectorIndex: []
    };
    
    // Add sample documents
    await this.addDocument(generalKB, {
      id: 'doc_programming_basics',
      content: `Programming is the process of creating instructions for computers to follow. 
      Key concepts include variables (data storage), functions (reusable code blocks), 
      loops (repetitive operations), and conditionals (decision-making logic).`,
      metadata: { category: 'programming', difficulty: 'beginner' },
      source: 'built-in',
      lastUpdated: new Date()
    });

    await this.addDocument(generalKB, {
      id: 'doc_ai_overview',
      content: `Artificial Intelligence (AI) is the simulation of human intelligence in machines. 
      It includes machine learning (algorithms that improve through experience), 
      natural language processing (understanding human language), and computer vision 
      (interpreting visual information).`,
      metadata: { category: 'ai', difficulty: 'intermediate' },
      source: 'built-in',
      lastUpdated: new Date()
    });

    this.knowledgeBases.set('general', generalKB);

    // Initialize technical knowledge base
    const technicalKB: KnowledgeBase = {
      id: 'technical',
      name: 'Technical Documentation',
      documents: new Map(),
      documentIndex: new Map(),
      vectorIndex: []
    };

    await this.addDocument(technicalKB, {
      id: 'doc_rest_apis',
      content: `REST (Representational State Transfer) APIs are architectural style for designing 
      networked applications. They use HTTP methods (GET, POST, PUT, DELETE) and follow stateless 
      principles. JSON is commonly used for data exchange.`,
      metadata: { category: 'web', type: 'api' },
      source: 'built-in',
      lastUpdated: new Date()
    });

    await this.addDocument(technicalKB, {
      id: 'doc_databases',
      content: `Databases store and organize data. SQL databases use structured tables with relationships, 
      while NoSQL databases offer flexible schema designs. Popular types include relational (PostgreSQL), 
      document (MongoDB), and key-value (Redis) databases.`,
      metadata: { category: 'database', type: 'storage' },
      source: 'built-in',
      lastUpdated: new Date()
    });

    this.knowledgeBases.set('technical', technicalKB);

    // Initialize business knowledge base
    const businessKB: KnowledgeBase = {
      id: 'business',
      name: 'Business Knowledge',
      documents: new Map(),
      documentIndex: new Map(),
      vectorIndex: []
    };

    await this.addDocument(businessKB, {
      id: 'doc_project_management',
      content: `Project management involves planning, executing, and controlling projects to achieve 
      specific goals within constraints. Key methodologies include Agile (iterative development), 
      Waterfall (sequential phases), and Scrum (sprint-based framework).`,
      metadata: { category: 'management', type: 'methodology' },
      source: 'built-in',
      lastUpdated: new Date()
    });

    this.knowledgeBases.set('business', businessKB);
  }

  async query(request: RAGRequest): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('RAG Service not initialized');
    }

    try {
      const results: any[] = [];
      
      // Query each specified knowledge base
      for (const kbId of request.options.knowledgeBase) {
        const kb = this.knowledgeBases.get(kbId);
        if (!kb) {
          console.warn(`⚠️ Knowledge base not found: ${kbId}`);
          continue;
        }

        const kbResults = await this.queryKnowledgeBase(kb, request);
        results.push(...kbResults);
      }

      // Sort by relevance score
      results.sort((a, b) => b.relevance - a.relevance);

      // Apply confidence threshold
      const filteredResults = results.filter(r => r.relevance >= request.options.confidence_threshold);

      // Rerank if requested
      const finalResults = request.options.rerank 
        ? await this.rerankResults(filteredResults, request.query)
        : filteredResults;

      // Limit results
      const limitedResults = finalResults.slice(0, request.options.maxDocuments);

      console.log(`📚 RAG query "${request.query}" returned ${limitedResults.length} results`);
      this.emit('query-completed', { query: request.query, results: limitedResults.length });

      return limitedResults;

    } catch (error) {
      console.error('❌ RAG query failed:', error);
      throw error;
    }
  }

  private async queryKnowledgeBase(kb: KnowledgeBase, request: RAGRequest): Promise<any[]> {
    const results: Array<{ document: Document; relevance: number }> = [];

    switch (request.options.retrievalMode) {
      case 'semantic':
        results.push(...await this.semanticSearch(kb, request.query));
        break;
      case 'keyword':
        results.push(...await this.keywordSearch(kb, request.query));
        break;
      case 'hybrid':
        const semanticResults = await this.semanticSearch(kb, request.query);
        const keywordResults = await this.keywordSearch(kb, request.query);
        
        // Combine and deduplicate
        const combinedResults = new Map<string, { document: Document; relevance: number }>();
        
        for (const result of semanticResults) {
          combinedResults.set(result.document.id, result);
        }
        
        for (const result of keywordResults) {
          const existing = combinedResults.get(result.document.id);
          if (existing) {
            // Average the relevance scores
            existing.relevance = (existing.relevance + result.relevance) / 2;
          } else {
            combinedResults.set(result.document.id, result);
          }
        }
        
        results.push(...Array.from(combinedResults.values()));
        break;
    }

    // Convert to RAG result format
    return results.map(r => ({
      document: r.document.content,
      metadata: request.options.includeMetadata ? {
        ...r.document.metadata,
        source: r.document.source,
        id: r.document.id,
        lastUpdated: r.document.lastUpdated,
        knowledgeBase: kb.name
      } : undefined,
      relevance: r.relevance
    }));
  }

  private async semanticSearch(kb: KnowledgeBase, query: string): Promise<Array<{ document: Document; relevance: number }>> {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);
    
    const results: Array<{ document: Document; relevance: number }> = [];
    
    for (const doc of kb.vectorIndex) {
      if (!doc.embedding) continue;
      
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      if (similarity > 0.1) { // Basic threshold
        results.push({ document: doc, relevance: similarity });
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  private async keywordSearch(kb: KnowledgeBase, query: string): Promise<Array<{ document: Document; relevance: number }>> {
    const keywords = this.extractKeywords(query);
    const results: Array<{ document: Document; relevance: number }> = [];
    const docScores = new Map<string, number>();

    // Score documents based on keyword matches
    for (const keyword of keywords) {
      const docIds = kb.documentIndex.get(keyword.toLowerCase());
      if (docIds) {
        for (const docId of docIds) {
          const currentScore = docScores.get(docId) || 0;
          docScores.set(docId, currentScore + 1);
        }
      }
    }

    // Convert scores to results
    for (const [docId, score] of docScores) {
      const doc = kb.documents.get(docId);
      if (doc) {
        // Normalize score by number of keywords and document length
        const normalizedScore = score / (keywords.length * Math.log(doc.content.length + 1));
        results.push({ document: doc, relevance: normalizedScore });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  private async rerankResults(results: any[], query: string): Promise<any[]> {
    // Simple reranking based on exact phrase matches
    const queryLower = query.toLowerCase();
    
    return results.map(result => {
      const contentLower = result.document.toLowerCase();
      let bonus = 0;
      
      // Bonus for exact query match
      if (contentLower.includes(queryLower)) {
        bonus += 0.2;
      }
      
      // Bonus for title/metadata matches
      if (result.metadata) {
        const metadataStr = JSON.stringify(result.metadata).toLowerCase();
        if (metadataStr.includes(queryLower)) {
          bonus += 0.1;
        }
      }
      
      return {
        ...result,
        relevance: Math.min(1.0, result.relevance + bonus)
      };
    }).sort((a, b) => b.relevance - a.relevance);
  }

  private async addDocument(kb: KnowledgeBase, doc: Document): Promise<void> {
    // Generate embedding
    doc.embedding = await this.generateEmbedding(doc.content);
    
    // Add to document store
    kb.documents.set(doc.id, doc);
    kb.vectorIndex.push(doc);
    
    // Update keyword index
    const keywords = this.extractKeywords(doc.content);
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      if (!kb.documentIndex.has(normalizedKeyword)) {
        kb.documentIndex.set(normalizedKeyword, new Set());
      }
      kb.documentIndex.get(normalizedKeyword)!.add(doc.id);
    }
    
    this.globalDocumentCount++;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simplified embedding generation (in production, would use a proper model)
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const embedding = new Array(384).fill(0);
    
    for (const word of words) {
      const hash = this.simpleHash(word);
      for (let i = 0; i < 384; i++) {
        embedding[i] += Math.sin(hash + i * 0.1) * 0.1;
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

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (in production, would use NLP)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter((word, index, array) => array.indexOf(word) === index); // Remove duplicates
  }

  // Public API methods
  public async addDocumentToKB(kbId: string, document: Omit<Document, 'id' | 'lastUpdated'>): Promise<string> {
    const kb = this.knowledgeBases.get(kbId);
    if (!kb) {
      throw new Error(`Knowledge base not found: ${kbId}`);
    }

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullDocument: Document = {
      ...document,
      id: docId,
      lastUpdated: new Date()
    };

    await this.addDocument(kb, fullDocument);
    console.log(`📚 Added document ${docId} to knowledge base ${kbId}`);
    
    return docId;
  }

  public createKnowledgeBase(id: string, name: string): void {
    if (this.knowledgeBases.has(id)) {
      throw new Error(`Knowledge base already exists: ${id}`);
    }

    const kb: KnowledgeBase = {
      id,
      name,
      documents: new Map(),
      documentIndex: new Map(),
      vectorIndex: []
    };

    this.knowledgeBases.set(id, kb);
    console.log(`📚 Created knowledge base: ${name} (${id})`);
  }

  public getKnowledgeBaseStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [id, kb] of this.knowledgeBases) {
      stats[id] = {
        name: kb.name,
        documentCount: kb.documents.size,
        keywordIndexSize: kb.documentIndex.size,
        averageDocumentLength: this.calculateAverageDocumentLength(kb)
      };
    }

    stats.global = {
      totalKnowledgeBases: this.knowledgeBases.size,
      totalDocuments: this.globalDocumentCount
    };

    return stats;
  }

  private calculateAverageDocumentLength(kb: KnowledgeBase): number {
    if (kb.documents.size === 0) return 0;
    
    const totalLength = Array.from(kb.documents.values())
      .reduce((sum, doc) => sum + doc.content.length, 0);
    
    return Math.round(totalLength / kb.documents.size);
  }

  async shutdown(): Promise<void> {
    console.log('📚 RAG Service shutting down...');
    
    for (const kb of this.knowledgeBases.values()) {
      kb.documents.clear();
      kb.documentIndex.clear();
      kb.vectorIndex.length = 0;
    }
    
    this.knowledgeBases.clear();
    this.removeAllListeners();
    this.initialized = false;
  }
}