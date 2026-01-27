/**
 * Enhanced Storage Interface for WAI Knowledge Base System
 * Production-ready unified storage architecture with comprehensive CRUD operations
 */
import { EventEmitter } from 'events';
import { DatabaseSystem, type IKnowledgeBaseStorage } from '../services/database-system';
import { EmbeddingService, embeddingService } from '../services/embedding-service';
import { VectorSearchEngine, vectorSearchEngine } from '../services/vector-search-engine';
import type {
  KnowledgeBase,
  InsertKnowledgeBase,
  KbDocument,
  InsertKbDocument,
  KbDocumentChunk,
  InsertKbDocumentChunk,
  KbEmbedding,
  InsertKbEmbedding,
  VectorCollection,
  InsertVectorCollection,
  DocumentProcessingQueue,
  InsertDocumentProcessingQueue,
  RAGQuery,
  InsertRAGQuery,
  RAGConversation,
  InsertRAGConversation,
  SearchAnalytics,
  InsertSearchAnalytics,
  User,
  Project
} from '@shared/schema';

export interface EnhancedStorageConfig {
  database: {
    connectionString: string;
    poolSize: number;
    enableCaching: boolean;
    enableSharding: boolean;
  };
  search: {
    enabled: boolean;
    indexingBatchSize: number;
    searchThreshold: number;
  };
  embeddings: {
    provider: string;
    model: string;
    batchSize: number;
  };
  performance: {
    enableMetrics: boolean;
    enableProfiling: boolean;
    cacheSize: number;
  };
  tenancy: {
    enabled: boolean;
    isolationLevel: 'strict' | 'standard' | 'shared';
  };
}

export interface StorageMetrics {
  knowledgeBases: number;
  documents: number;
  chunks: number;
  embeddings: number;
  queries: number;
  searchRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
}

export interface TenantContext {
  userId: number;
  organizationId?: number;
  accessLevel: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: string[];
}

export interface DocumentIndexingOptions {
  generateEmbeddings: boolean;
  createChunks: boolean;
  extractMetadata: boolean;
  priority: 'low' | 'normal' | 'high';
  background: boolean;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  threshold?: number;
  includeChunks?: boolean;
  includeMetadata?: boolean;
  searchMode?: 'semantic' | 'keyword' | 'hybrid';
  facets?: string[];
  filters?: SearchFilter[];
}

export interface SearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in';
  value: any;
}

export interface EnhancedSearchResult {
  documents: KbDocument[];
  chunks: KbDocumentChunk[];
  total: number;
  facets?: Record<string, any>;
  searchStats: {
    processingTime: number;
    resultsFound: number;
    cacheUsed: boolean;
  };
}

export interface BatchOperationResult<T> {
  successful: T[];
  failed: Array<{
    item: any;
    error: string;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}

export interface BulkIndexingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  documentIds: string[];
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  errors: string[];
}

export class EnhancedStorage extends EventEmitter {
  private config: EnhancedStorageConfig;
  private database: IKnowledgeBaseStorage;
  private embeddingService: EmbeddingService;
  private searchEngine: VectorSearchEngine;
  private metrics: StorageMetrics;
  private cache: Map<string, any> = new Map();
  private indexingJobs: Map<string, BulkIndexingJob> = new Map();

  constructor(
    config: EnhancedStorageConfig,
    database?: IKnowledgeBaseStorage,
    embeddingServiceParam?: EmbeddingService,
    searchEngine?: VectorSearchEngine
  ) {
    super();
    this.config = config;
    this.database = database || new DatabaseSystem({
      backend: 'postgresql',
      connectionString: config.database.connectionString,
      poolSize: config.database.poolSize
    });
    this.embeddingService = embeddingServiceParam || embeddingService;
    this.searchEngine = searchEngine || vectorSearchEngine;

    this.metrics = {
      knowledgeBases: 0,
      documents: 0,
      chunks: 0,
      embeddings: 0,
      queries: 0,
      searchRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0
    };

    this.initializeMetricsCollection();
    this.startBackgroundTasks();
  }

  private initializeMetricsCollection(): void {
    if (!this.config.performance.enableMetrics) return;

    setInterval(async () => {
      await this.updateMetrics();
      this.emit('metrics', this.metrics);
    }, 60000); // Update every minute
  }

  private startBackgroundTasks(): void {
    // Background indexing processor
    setInterval(async () => {
      await this.processIndexingJobs();
    }, 30000); // Every 30 seconds

    // Cache cleanup
    setInterval(() => {
      this.cleanupCache();
    }, 300000); // Every 5 minutes
  }

  // ===== KNOWLEDGE BASE OPERATIONS =====

  async createKnowledgeBase(
    data: InsertKnowledgeBase,
    context: TenantContext
  ): Promise<KnowledgeBase> {
    this.validateTenantAccess(context, 'create');
    
    const enhancedData = {
      ...data,
      ownerId: context.userId,
      organizationId: context.organizationId,
      permissions: this.getDefaultPermissions(context)
    };

    const knowledgeBase = await this.database.createKnowledgeBase(enhancedData);
    
    this.emit('knowledgeBaseCreated', { knowledgeBase, context });
    await this.updateMetrics();
    
    return knowledgeBase;
  }

  async getKnowledgeBase(
    id: string,
    context: TenantContext
  ): Promise<KnowledgeBase | undefined> {
    const cacheKey = `kb:${id}:${context.userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const knowledgeBase = await this.database.getKnowledgeBase(id);
    
    if (knowledgeBase) {
      this.validateTenantAccess(context, 'read', knowledgeBase);
      this.setCache(cacheKey, knowledgeBase);
    }
    
    return knowledgeBase;
  }

  async getUserKnowledgeBases(context: TenantContext): Promise<KnowledgeBase[]> {
    const cacheKey = `user_kbs:${context.userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const knowledgeBases = await this.database.getUserKnowledgeBases(context.userId);
    
    this.setCache(cacheKey, knowledgeBases);
    return knowledgeBases;
  }

  async updateKnowledgeBase(
    id: string,
    updates: Partial<KnowledgeBase>,
    context: TenantContext
  ): Promise<KnowledgeBase> {
    const existing = await this.getKnowledgeBase(id, context);
    if (!existing) throw new Error('Knowledge base not found');
    
    this.validateTenantAccess(context, 'update', existing);

    const updated = await this.database.updateKnowledgeBase(id, {
      ...updates,
      updatedAt: new Date()
    });

    this.invalidateCache(`kb:${id}:${context.userId}`);
    this.invalidateCache(`user_kbs:${context.userId}`);
    
    this.emit('knowledgeBaseUpdated', { knowledgeBase: updated, context });
    
    return updated;
  }

  async deleteKnowledgeBase(id: string, context: TenantContext): Promise<void> {
    const existing = await this.getKnowledgeBase(id, context);
    if (!existing) throw new Error('Knowledge base not found');
    
    this.validateTenantAccess(context, 'delete', existing);

    await this.database.deleteKnowledgeBase(id);

    this.invalidateCache(`kb:${id}:${context.userId}`);
    this.invalidateCache(`user_kbs:${context.userId}`);
    
    this.emit('knowledgeBaseDeleted', { knowledgeBaseId: id, context });
    await this.updateMetrics();
  }

  // ===== DOCUMENT OPERATIONS =====

  async createDocument(
    data: InsertKbDocument,
    context: TenantContext,
    options: DocumentIndexingOptions = {
      generateEmbeddings: true,
      createChunks: true,
      extractMetadata: true,
      priority: 'normal',
      background: true
    }
  ): Promise<KbDocument> {
    // Validate access to knowledge base
    const kb = await this.getKnowledgeBase(data.knowledgeBaseId, context);
    if (!kb) throw new Error('Knowledge base not found');

    const enhancedData = {
      ...data,
      createdBy: String(context.userId),
      status: 'processing'
    };

    const document = await this.database.createDocument(enhancedData);

    // Queue for background processing if enabled
    if (options.background) {
      await this.queueDocumentProcessing(document.id, options);
    } else {
      await this.processDocumentSync(document, options);
    }

    this.emit('documentCreated', { document, context, options });
    await this.updateMetrics();

    return document;
  }

  async getDocument(
    id: string,
    context: TenantContext
  ): Promise<KbDocument | undefined> {
    const document = await this.database.getDocument(id);
    
    if (document) {
      const kb = await this.getKnowledgeBase(document.knowledgeBaseId, context);
      if (!kb) return undefined; // User doesn't have access
    }
    
    return document;
  }

  async getKnowledgeBaseDocuments(
    knowledgeBaseId: string,
    context: TenantContext,
    options: {
      status?: string;
      documentType?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<KbDocument[]> {
    // Validate access
    const kb = await this.getKnowledgeBase(knowledgeBaseId, context);
    if (!kb) throw new Error('Knowledge base not found');

    return await this.database.getKnowledgeBaseDocuments(knowledgeBaseId, options);
  }

  async updateDocument(
    id: string,
    updates: Partial<KbDocument>,
    context: TenantContext,
    reindex: boolean = true
  ): Promise<KbDocument> {
    const existing = await this.getDocument(id, context);
    if (!existing) throw new Error('Document not found');

    const updated = await this.database.updateDocument(id, {
      ...updates,
      updatedAt: new Date()
    });

    // Re-index if content changed
    if (reindex && (updates.content || updates.title)) {
      await this.queueDocumentProcessing(id, {
        generateEmbeddings: true,
        createChunks: true,
        extractMetadata: false,
        priority: 'normal',
        background: true
      });
    }

    this.emit('documentUpdated', { document: updated, context });
    
    return updated;
  }

  async deleteDocument(id: string, context: TenantContext): Promise<void> {
    const existing = await this.getDocument(id, context);
    if (!existing) throw new Error('Document not found');

    await this.database.deleteDocument(id);

    this.emit('documentDeleted', { documentId: id, context });
    await this.updateMetrics();
  }

  async bulkCreateDocuments(
    documents: InsertKbDocument[],
    context: TenantContext,
    options: DocumentIndexingOptions = {
      generateEmbeddings: true,
      createChunks: true,
      extractMetadata: true,
      priority: 'normal',
      background: true
    }
  ): Promise<BatchOperationResult<KbDocument>> {
    const result: BatchOperationResult<KbDocument> = {
      successful: [],
      failed: [],
      total: documents.length,
      successCount: 0,
      failureCount: 0
    };

    // Batch process documents
    const batchSize = this.config.embeddings.batchSize;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (docData) => {
          try {
            const document = await this.createDocument(docData, context, options);
            result.successful.push(document);
            result.successCount++;
          } catch (error) {
            result.failed.push({
              item: docData,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            result.failureCount++;
          }
        })
      );
    }

    this.emit('bulkDocumentsCreated', { result, context });
    
    return result;
  }

  // ===== SEARCH OPERATIONS =====

  async search(
    query: string,
    knowledgeBaseIds: string[],
    context: TenantContext,
    options: SearchOptions = {}
  ): Promise<EnhancedSearchResult> {
    const startTime = Date.now();
    
    // Validate access to knowledge bases
    for (const kbId of knowledgeBaseIds) {
      const kb = await this.getKnowledgeBase(kbId, context);
      if (!kb) throw new Error(`Access denied to knowledge base: ${kbId}`);
    }

    const searchResult = await this.searchEngine.search({
      query,
      knowledgeBaseIds,
      options
    }, context.userId);

    const processingTime = Date.now() - startTime;

    // Log search analytics
    await this.logSearchAnalytics({
      userId: String(context.userId),
      knowledgeBaseId: knowledgeBaseIds[0],
      query,
      resultCount: searchResult.documents.length,
      searchTime: processingTime,
      searchMethod: options.searchMode || 'semantic'
    });

    this.metrics.searchRequests++;
    this.metrics.averageResponseTime = 
      ((this.metrics.averageResponseTime * (this.metrics.searchRequests - 1)) + processingTime) / 
      this.metrics.searchRequests;

    return {
      documents: searchResult.documents,
      chunks: searchResult.chunks,
      total: searchResult.total,
      facets: searchResult.facets,
      searchStats: {
        processingTime,
        resultsFound: searchResult.documents.length,
        cacheUsed: false // TODO: Implement search caching
      }
    };
  }

  async semanticSearch(
    query: string,
    knowledgeBaseIds: string[],
    context: TenantContext,
    options: SearchOptions = {}
  ): Promise<EnhancedSearchResult> {
    return await this.search(query, knowledgeBaseIds, context, {
      ...options,
      searchMode: 'semantic'
    });
  }

  async keywordSearch(
    query: string,
    knowledgeBaseIds: string[],
    context: TenantContext,
    options: SearchOptions = {}
  ): Promise<EnhancedSearchResult> {
    return await this.search(query, knowledgeBaseIds, context, {
      ...options,
      searchMode: 'keyword'
    });
  }

  async hybridSearch(
    query: string,
    knowledgeBaseIds: string[],
    context: TenantContext,
    options: SearchOptions = {}
  ): Promise<EnhancedSearchResult> {
    return await this.search(query, knowledgeBaseIds, context, {
      ...options,
      searchMode: 'hybrid'
    });
  }

  // ===== RAG OPERATIONS =====

  async createRAGQuery(
    data: InsertRAGQuery,
    context: TenantContext
  ): Promise<RAGQuery> {
    const enhancedData = {
      ...data,
      userId: String(context.userId)
    };

    const ragQuery = await this.database.createRAGQuery(enhancedData);
    
    this.metrics.queries++;
    return ragQuery;
  }

  async getRAGQueries(
    context: TenantContext,
    sessionId?: string
  ): Promise<RAGQuery[]> {
    return await this.database.getRAGQueries(context.userId, sessionId);
  }

  async createRAGConversation(
    data: InsertRAGConversation,
    context: TenantContext
  ): Promise<RAGConversation> {
    const enhancedData = {
      ...data,
      userId: String(context.userId)
    };

    return await this.database.createRAGConversation(enhancedData);
  }

  async getConversationHistory(
    sessionId: string,
    context: TenantContext
  ): Promise<RAGConversation[]> {
    return await this.database.getConversationHistory(sessionId);
  }

  // ===== ANALYTICS OPERATIONS =====

  async logSearchAnalytics(data: InsertSearchAnalytics): Promise<SearchAnalytics> {
    return await this.database.logSearchAnalytics(data);
  }

  async getKnowledgeBaseStatistics(
    knowledgeBaseId: string,
    context: TenantContext
  ): Promise<any> {
    const kb = await this.getKnowledgeBase(knowledgeBaseId, context);
    if (!kb) throw new Error('Knowledge base not found');

    return await this.database.getKnowledgeBaseStatistics(knowledgeBaseId);
  }

  async getUserAnalytics(context: TenantContext): Promise<any> {
    const ragMetrics = await this.database.getUserRAGMetrics(context.userId);
    const kbStats = await this.getUserKnowledgeBases(context);
    
    return {
      ragMetrics,
      knowledgeBasesCount: kbStats.length,
      totalDocuments: this.metrics.documents,
      totalQueries: this.metrics.queries,
      averageResponseTime: this.metrics.averageResponseTime
    };
  }

  // ===== INDEXING OPERATIONS =====

  async queueDocumentProcessing(
    documentId: string,
    options: DocumentIndexingOptions
  ): Promise<void> {
    await this.database.enqueueDocumentProcessing({
      filePath: documentId,
      processingType: 'full_index',
      priority: options.priority === 'high' ? 1 : options.priority === 'low' ? 9 : 5,
      metadata: options
    });

    if (this.config.search.enabled) {
      await this.searchEngine.queueDocumentForIndexing(documentId);
    }
  }

  async processDocumentSync(
    document: KbDocument,
    options: DocumentIndexingOptions
  ): Promise<void> {
    try {
      if (options.createChunks) {
        await this.createDocumentChunks(document);
      }

      if (options.generateEmbeddings) {
        await this.generateDocumentEmbeddings(document);
      }

      // Update document status
      await this.database.updateDocument(document.id, {
        status: 'active'
      });

    } catch (error) {
      await this.database.updateDocument(document.id, {
        status: 'failed'
      });
      throw error;
    }
  }

  private async createDocumentChunks(document: KbDocument): Promise<void> {
    if (!document.content) return;

    const chunkSize = 500; // tokens
    const overlap = 50; // tokens
    const words = document.content.split(' ');
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      chunks.push(chunk);
    }

    // Create chunks in database
    for (let i = 0; i < chunks.length; i++) {
      await this.database.createDocumentChunk({
        documentId: document.id,
        chunkIndex: i,
        content: chunks[i],
        tokenCount: chunks[i].split(' ').length,
        metadata: {}
      });
    }
  }

  private async generateDocumentEmbeddings(document: KbDocument): Promise<void> {
    if (!document.content) return;

    const embeddingResponse = await this.embeddingService.generateEmbedding({
      text: document.content,
      provider: this.config.embeddings.provider as any,
      model: this.config.embeddings.model
    });

    await this.database.createEmbedding({
      documentId: document.id,
      embeddingModel: embeddingResponse.model,
      embedding: embeddingResponse.embedding,
      contentHash: this.generateContentHash(document.content)
    });
  }

  async startBulkIndexing(
    documentIds: string[],
    options: DocumentIndexingOptions
  ): Promise<string> {
    const jobId = this.generateJobId();
    const job: BulkIndexingJob = {
      id: jobId,
      status: 'pending',
      documentIds,
      progress: 0,
      errors: []
    };

    this.indexingJobs.set(jobId, job);

    // Process in background
    this.processBulkIndexingJob(jobId, options).catch(error => {
      console.error(`❌ Bulk indexing job ${jobId} failed:`, error);
    });

    return jobId;
  }

  async getBulkIndexingStatus(jobId: string): Promise<BulkIndexingJob | undefined> {
    return this.indexingJobs.get(jobId);
  }

  private async processBulkIndexingJob(
    jobId: string,
    options: DocumentIndexingOptions
  ): Promise<void> {
    const job = this.indexingJobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.startedAt = new Date();

    const batchSize = this.config.search.indexingBatchSize;
    let processed = 0;

    for (let i = 0; i < job.documentIds.length; i += batchSize) {
      const batch = job.documentIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (documentId) => {
          try {
            const document = await this.database.getDocument(documentId);
            if (document) {
              await this.processDocumentSync(document, options);
            }
            processed++;
          } catch (error) {
            job.errors.push(`Error processing ${documentId}: ${error}`);
          }
        })
      );

      job.progress = (processed / job.documentIds.length) * 100;
    }

    job.status = job.errors.length === 0 ? 'completed' : 'failed';
    job.completedAt = new Date();
  }

  private async processIndexingJobs(): Promise<void> {
    const pendingJobs = Array.from(this.indexingJobs.values())
      .filter(job => job.status === 'pending')
      .slice(0, 3); // Process max 3 jobs concurrently

    await Promise.all(
      pendingJobs.map(job => 
        this.processBulkIndexingJob(job.id, {
          generateEmbeddings: true,
          createChunks: true,
          extractMetadata: true,
          priority: 'normal',
          background: true
        })
      )
    );
  }

  // ===== LEGACY STORAGE COMPATIBILITY =====
  // Note: Legacy storage methods removed - use database directly if needed

  // ===== UTILITY METHODS =====

  private validateTenantAccess(
    context: TenantContext,
    action: string,
    resource?: any
  ): void {
    if (!this.config.tenancy.enabled) return;

    // Implement tenant isolation logic based on configuration
    switch (this.config.tenancy.isolationLevel) {
      case 'strict':
        // Strict isolation - users can only access their own resources
        if (resource && resource.ownerId !== context.userId) {
          throw new Error('Access denied: insufficient permissions');
        }
        break;
      case 'standard':
        // Standard isolation - organization-level sharing
        if (resource && resource.ownerId !== context.userId && 
            resource.organizationId !== context.organizationId) {
          throw new Error('Access denied: insufficient permissions');
        }
        break;
      case 'shared':
        // Shared isolation - permission-based access
        break;
    }
  }

  private getDefaultPermissions(context: TenantContext): Record<string, any> {
    return {
      read: [context.userId],
      write: [context.userId],
      admin: [context.userId],
      organizationAccess: context.organizationId ? true : false
    };
  }

  private getFromCache(key: string): any {
    if (!this.config.performance.enableProfiling) return null;
    return this.cache.get(key);
  }

  private setCache(key: string, value: any): void {
    if (!this.config.performance.enableProfiling) return;
    
    if (this.cache.size >= this.config.performance.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, value);
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  private cleanupCache(): void {
    // Simple cache cleanup - remove oldest entries
    if (this.cache.size > this.config.performance.cacheSize * 0.8) {
      const keysToDelete = Array.from(this.cache.keys()).slice(0, Math.floor(this.cache.size * 0.2));
      keysToDelete.forEach(key => this.cache.delete(key));
    }
  }

  private async updateMetrics(): Promise<void> {
    try {
      // This would typically query the database for current counts
      // Simplified implementation for now
      this.metrics.knowledgeBases = (await this.database.getUserKnowledgeBases(1)).length;
    } catch (error) {
      console.error('❌ Error updating metrics:', error);
    }
  }

  private generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getMetrics(): StorageMetrics {
    return { ...this.metrics };
  }

  async healthCheck(): Promise<{ status: string; components: Record<string, boolean> }> {
    const components: Record<string, boolean> = {};

    try {
      // Test database connectivity
      await this.database.getKnowledgeBase('test');
      components.database = true;
    } catch {
      components.database = false;
    }

    try {
      // Test embedding service
      await this.embeddingService.healthCheck();
      components.embeddings = true;
    } catch {
      components.embeddings = false;
    }

    components.search = this.config.search.enabled;
    components.cache = this.config.performance.enableProfiling;

    const allHealthy = Object.values(components).every(status => status);

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      components
    };
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down enhanced storage...');
    this.cache.clear();
    this.indexingJobs.clear();
    this.removeAllListeners();
  }
}

// Default configuration
export const defaultEnhancedStorageConfig: EnhancedStorageConfig = {
  database: {
    connectionString: process.env.DATABASE_URL || '',
    poolSize: 20,
    enableCaching: true,
    enableSharding: false
  },
  search: {
    enabled: true,
    indexingBatchSize: 10,
    searchThreshold: 0.7
  },
  embeddings: {
    provider: 'openai',
    model: 'text-embedding-3-small',
    batchSize: 5
  },
  performance: {
    enableMetrics: true,
    enableProfiling: true,
    cacheSize: 1000
  },
  tenancy: {
    enabled: true,
    isolationLevel: 'standard'
  }
};

// Export singleton instance
export const enhancedStorage = new EnhancedStorage(defaultEnhancedStorageConfig);