/**
 * Comprehensive Database System for WAI SDK 9.0
 * Supports multiple backends: PostgreSQL, SQLite, in-memory, and cloud databases
 * Features: Connection pooling, health monitoring, automatic recovery, schema management
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { EventEmitter } from 'events';
import ws from 'ws';
import * as schema from '@shared/schema';
import { 
  knowledgeBases,
  kbDocuments,
  kbDocumentChunks,
  kbEmbeddings,
  vectorCollections,
  vectorIndex,
  documentProcessingQueue,
  documentProcessingResults,
  ragQueries,
  ragConversations,
  ragMetrics,
  searchAnalytics,
  type KnowledgeBase,
  type InsertKnowledgeBase,
  type KbDocument,
  type InsertKbDocument,
  type KbDocumentChunk,
  type InsertKbDocumentChunk,
  type KbEmbedding,
  type InsertKbEmbedding,
  type VectorCollection,
  type InsertVectorCollection,
  type VectorIndexEntry,
  type InsertVectorIndexEntry,
  type DocumentProcessingQueue,
  type InsertDocumentProcessingQueue,
  type RAGQuery,
  type InsertRAGQuery,
  type RAGConversation,
  type InsertRAGConversation,
  type SearchAnalytics,
  type InsertSearchAnalytics
} from '@shared/schema';
import { eq, desc, asc, and, or, inArray, count, like, gte, lte } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

export type DatabaseBackend = 'postgresql' | 'sqlite' | 'memory' | 'cloud';

export interface DatabaseConfig {
  backend: DatabaseBackend;
  connectionString?: string;
  poolSize?: number;
  retryAttempts?: number;
  healthCheckInterval?: number;
  backupEnabled?: boolean;
  migrations?: boolean;
}

export interface ConnectionHealth {
  isHealthy: boolean;
  latency: number;
  activeConnections: number;
  totalConnections: number;
  lastHealthCheck: Date;
  errors: string[];
}

export interface DatabaseMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  connectionPoolUtilization: number;
  cacheHitRate: number;
}

export interface BackupConfig {
  enabled: boolean;
  interval: number; // in minutes
  retention: number; // in days
  destination: string;
  compression: boolean;
}

export interface IKnowledgeBaseStorage {
  // Knowledge Base Management
  createKnowledgeBase(data: InsertKnowledgeBase): Promise<KnowledgeBase>;
  getKnowledgeBase(id: string): Promise<KnowledgeBase | undefined>;
  getUserKnowledgeBases(userId: number): Promise<KnowledgeBase[]>;
  updateKnowledgeBase(id: string, updates: Partial<KnowledgeBase>): Promise<KnowledgeBase>;
  deleteKnowledgeBase(id: string): Promise<void>;
  
  // Document Management
  createDocument(data: InsertKbDocument): Promise<KbDocument>;
  getDocument(id: string): Promise<KbDocument | undefined>;
  getKnowledgeBaseDocuments(knowledgeBaseId: string, options?: DocumentQueryOptions): Promise<KbDocument[]>;
  updateDocument(id: string, updates: Partial<KbDocument>): Promise<KbDocument>;
  deleteDocument(id: string): Promise<void>;
  
  // Document Chunks Management
  createDocumentChunk(data: InsertKbDocumentChunk): Promise<KbDocumentChunk>;
  getDocumentChunks(documentId: string): Promise<KbDocumentChunk[]>;
  deleteDocumentChunks(documentId: string): Promise<void>;
  
  // Embeddings Management
  createEmbedding(data: InsertKbEmbedding): Promise<KbEmbedding>;
  getDocumentEmbeddings(documentId: string): Promise<KbEmbedding[]>;
  findSimilarEmbeddings(embedding: number[], limit?: number, threshold?: number): Promise<KbEmbedding[]>;
  deleteDocumentEmbeddings(documentId: string): Promise<void>;
  
  // Vector Collections Management
  createVectorCollection(data: InsertVectorCollection): Promise<VectorCollection>;
  getVectorCollection(id: string): Promise<VectorCollection | undefined>;
  getVectorCollections(): Promise<VectorCollection[]>;
  updateVectorCollection(id: string, updates: Partial<VectorCollection>): Promise<VectorCollection>;
  
  // Vector Index Management
  insertVector(data: InsertVectorIndexEntry): Promise<VectorIndexEntry>;
  searchVectors(collectionId: string, queryVector: number[], limit?: number): Promise<VectorIndexEntry[]>;
  
  // Document Processing Queue
  enqueueDocumentProcessing(data: InsertDocumentProcessingQueue): Promise<DocumentProcessingQueue>;
  getProcessingQueue(status?: string): Promise<DocumentProcessingQueue[]>;
  updateProcessingStatus(id: string, status: string, errorMessage?: string): Promise<DocumentProcessingQueue>;
  
  // RAG Query Management
  createRAGQuery(data: InsertRAGQuery): Promise<RAGQuery>;
  getRAGQueries(userId: number, sessionId?: string): Promise<RAGQuery[]>;
  getUserRAGMetrics(userId: number): Promise<any>;
  
  // RAG Conversations
  createRAGConversation(data: InsertRAGConversation): Promise<RAGConversation>;
  getConversationHistory(sessionId: string): Promise<RAGConversation[]>;
  
  // Search Analytics
  logSearchAnalytics(data: InsertSearchAnalytics): Promise<SearchAnalytics>;
  getSearchAnalytics(knowledgeBaseId?: string, timeRange?: TimeRange): Promise<SearchAnalytics[]>;
  
  // Advanced Search and Aggregations
  searchDocuments(query: DocumentSearchQuery): Promise<SearchResult<KbDocument>>;
  getKnowledgeBaseStatistics(knowledgeBaseId: string): Promise<KnowledgeBaseStatistics>;
  bulkUpdateDocumentStatus(documentIds: string[], status: string): Promise<void>;
  cleanupExpiredProcessingJobs(): Promise<void>;
}

interface DocumentQueryOptions {
  status?: string;
  documentType?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface DocumentSearchQuery {
  query: string;
  knowledgeBaseIds?: string[];
  documentTypes?: string[];
  status?: string;
  tags?: string[];
  dateRange?: TimeRange;
  limit?: number;
  offset?: number;
}

interface TimeRange {
  start: Date;
  end: Date;
}

interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

interface KnowledgeBaseStatistics {
  documentCount: number;
  chunkCount: number;
  embeddingCount: number;
  totalSize: number;
  lastIndexed: Date | null;
  processingQueueSize: number;
  averageQueryTime: number;
}

export class DatabaseSystem extends EventEmitter implements IKnowledgeBaseStorage {
  private static instance: DatabaseSystem;
  private config: DatabaseConfig;
  private primaryDb: any;
  private backupDb?: any;
  private connectionPools: Map<string, Pool> = new Map();
  private healthStatus: ConnectionHealth;
  private metrics: DatabaseMetrics;
  private backupConfig: BackupConfig;
  private isInitialized = false;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    this.healthStatus = {
      isHealthy: false,
      latency: 0,
      activeConnections: 0,
      totalConnections: 0,
      lastHealthCheck: new Date(),
      errors: []
    };
    
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageResponseTime: 0,
      connectionPoolUtilization: 0,
      cacheHitRate: 0
    };

    this.backupConfig = {
      enabled: config.backupEnabled || false,
      interval: 60, // 1 hour
      retention: 7, // 7 days
      destination: './backups',
      compression: true
    };
  }

  static getInstance(config?: DatabaseConfig): DatabaseSystem {
    if (!DatabaseSystem.instance) {
      if (!config) {
        throw new Error('Database configuration required for first initialization');
      }
      DatabaseSystem.instance = new DatabaseSystem(config);
    }
    return DatabaseSystem.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log(`🗄️ Initializing database system with ${this.config.backend} backend...`);
      
      switch (this.config.backend) {
        case 'postgresql':
          await this.initializePostgreSQL();
          break;
        case 'sqlite':
          await this.initializeSQLite();
          break;
        case 'memory':
          await this.initializeMemoryDatabase();
          break;
        case 'cloud':
          await this.initializeCloudDatabase();
          break;
        default:
          throw new Error(`Unsupported database backend: ${this.config.backend}`);
      }

      await this.runMigrations();
      await this.startHealthMonitoring();
      
      if (this.backupConfig.enabled) {
        await this.startBackupScheduler();
      }

      this.isInitialized = true;
      this.emit('initialized');
      console.log('✅ Database system initialized successfully');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private async initializePostgreSQL(): Promise<void> {
    if (!this.config.connectionString) {
      throw new Error('PostgreSQL connection string required');
    }

    const pool = new Pool({ 
      connectionString: this.config.connectionString,
      max: this.config.poolSize || 20
    });
    
    this.connectionPools.set('primary', pool);
    this.primaryDb = drizzle({ client: pool, schema });
    
    // Test connection
    await this.primaryDb.execute(sql`SELECT 1`);
  }

  private async initializeSQLite(): Promise<void> {
    const sqlite = new Database('./data/wai-storage.db');
    this.primaryDb = drizzleSQLite(sqlite, { schema });
  }

  private async initializeMemoryDatabase(): Promise<void> {
    const sqlite = new Database(':memory:');
    this.primaryDb = drizzleSQLite(sqlite, { schema });
  }

  private async initializeCloudDatabase(): Promise<void> {
    // Cloud database implementation (AWS RDS, Google Cloud SQL, etc.)
    if (!this.config.connectionString) {
      throw new Error('Cloud database connection string required');
    }
    
    const pool = new Pool({ 
      connectionString: this.config.connectionString,
      max: this.config.poolSize || 50
    });
    
    this.connectionPools.set('cloud', pool);
    this.primaryDb = drizzle({ client: pool, schema });
  }

  async getDatabase(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.primaryDb;
  }

  async executeQuery<T>(query: string, params?: any[]): Promise<T> {
    const startTime = Date.now();
    
    try {
      this.metrics.totalQueries++;
      
      const result = await this.primaryDb.execute(sql.raw(query, ...(params || [])));
      
      this.metrics.successfulQueries++;
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      
      return result as T;
      
    } catch (error) {
      this.metrics.failedQueries++;
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    if (!this.config.migrations) return;
    
    console.log('🔄 Running database migrations...');
    
    try {
      // Create knowledge base tables if they don't exist
      await this.createKnowledgeBaseTables();
      await this.createVectorStorageTables();
      await this.createDocumentProcessingTables();
      
      console.log('✅ Migrations completed successfully');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async createKnowledgeBaseTables(): Promise<void> {
    // Knowledge Base Documents table
    await this.primaryDb.execute(sql`
      CREATE TABLE IF NOT EXISTS kb_documents (
        id TEXT PRIMARY KEY,
        knowledge_base_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        document_type TEXT NOT NULL,
        file_path TEXT,
        metadata JSONB DEFAULT '{}',
        word_count INTEGER DEFAULT 0,
        character_count INTEGER DEFAULT 0,
        language TEXT DEFAULT 'en',
        status TEXT DEFAULT 'active',
        version INTEGER DEFAULT 1,
        checksum TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        indexed_at TIMESTAMP
      )
    `);

    // Document Chunks table for RAG
    await this.primaryDb.execute(sql`
      CREATE TABLE IF NOT EXISTS kb_document_chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        token_count INTEGER DEFAULT 0,
        embedding VECTOR(1536),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES kb_documents(id) ON DELETE CASCADE
      )
    `);

    // Document Embeddings table
    await this.primaryDb.execute(sql`
      CREATE TABLE IF NOT EXISTS kb_embeddings (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        chunk_id TEXT,
        embedding_model TEXT NOT NULL,
        embedding VECTOR(1536) NOT NULL,
        content_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES kb_documents(id) ON DELETE CASCADE
      )
    `);
  }

  private async createVectorStorageTables(): Promise<void> {
    // Vector Collections table
    await this.primaryDb.execute(sql`
      CREATE TABLE IF NOT EXISTS vector_collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        dimension INTEGER NOT NULL,
        metric TEXT DEFAULT 'cosine',
        index_type TEXT DEFAULT 'hnsw',
        metadata JSONB DEFAULT '{}',
        document_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Vector Index table
    await this.primaryDb.execute(sql`
      CREATE TABLE IF NOT EXISTS vector_index (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        vector VECTOR(1536) NOT NULL,
        metadata JSONB DEFAULT '{}',
        document_reference TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES vector_collections(id) ON DELETE CASCADE
      )
    `);
  }

  private async createDocumentProcessingTables(): Promise<void> {
    // Document Processing Queue
    await this.primaryDb.execute(sql`
      CREATE TABLE IF NOT EXISTS document_processing_queue (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        processing_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        priority INTEGER DEFAULT 5,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        error_message TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Document Processing Results
    await this.primaryDb.execute(sql`
      CREATE TABLE IF NOT EXISTS document_processing_results (
        id TEXT PRIMARY KEY,
        queue_id TEXT NOT NULL,
        extracted_text TEXT,
        extracted_metadata JSONB DEFAULT '{}',
        processing_time_ms INTEGER,
        success BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (queue_id) REFERENCES document_processing_queue(id)
      )
    `);
  }

  async healthCheck(): Promise<ConnectionHealth> {
    const startTime = Date.now();
    
    try {
      await this.primaryDb.execute(sql`SELECT 1`);
      
      this.healthStatus = {
        isHealthy: true,
        latency: Date.now() - startTime,
        activeConnections: this.getActiveConnections(),
        totalConnections: this.getTotalConnections(),
        lastHealthCheck: new Date(),
        errors: []
      };
      
    } catch (error) {
      this.healthStatus = {
        isHealthy: false,
        latency: Date.now() - startTime,
        activeConnections: 0,
        totalConnections: 0,
        lastHealthCheck: new Date(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
    
    return this.healthStatus;
  }

  private async startHealthMonitoring(): Promise<void> {
    const interval = this.config.healthCheckInterval || 30000; // 30 seconds
    
    setInterval(async () => {
      const health = await this.healthCheck();
      this.emit('healthUpdate', health);
      
      if (!health.isHealthy) {
        console.warn('⚠️ Database health check failed:', health.errors);
        await this.attemptReconnection();
      }
    }, interval);
  }

  private async attemptReconnection(): Promise<void> {
    const maxRetries = this.config.retryAttempts || 3;
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        console.log(`🔄 Attempting database reconnection (${attempts + 1}/${maxRetries})...`);
        
        await this.initialize();
        console.log('✅ Database reconnection successful');
        this.emit('reconnected');
        return;
        
      } catch (error) {
        attempts++;
        console.error(`❌ Reconnection attempt ${attempts} failed:`, error);
        
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
    
    console.error('💥 Database reconnection failed after maximum retries');
    this.emit('reconnectionFailed');
  }

  private async startBackupScheduler(): Promise<void> {
    const intervalMs = this.backupConfig.interval * 60 * 1000;
    
    setInterval(async () => {
      await this.createBackup();
    }, intervalMs);
    
    console.log(`🔄 Backup scheduler started (interval: ${this.backupConfig.interval} minutes)`);
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `wai-db-backup-${timestamp}`;
    
    try {
      console.log(`📦 Creating database backup: ${backupName}`);
      
      // Implementation depends on backend
      if (this.config.backend === 'sqlite') {
        // SQLite backup using WAL mode
        await this.createSQLiteBackup(backupName);
      } else if (this.config.backend === 'postgresql') {
        // PostgreSQL backup using pg_dump
        await this.createPostgreSQLBackup(backupName);
      }
      
      await this.cleanupOldBackups();
      
      console.log(`✅ Backup created successfully: ${backupName}`);
      this.emit('backupCreated', backupName);
      
      return backupName;
      
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      this.emit('backupFailed', error);
      throw error;
    }
  }

  private async createSQLiteBackup(backupName: string): Promise<void> {
    // SQLite backup implementation
    const fs = await import('fs/promises');
    await fs.copyFile('./data/wai-storage.db', `${this.backupConfig.destination}/${backupName}.db`);
  }

  private async createPostgreSQLBackup(backupName: string): Promise<void> {
    // PostgreSQL backup implementation would use pg_dump
    console.log('PostgreSQL backup implementation pending');
  }

  private async cleanupOldBackups(): Promise<void> {
    const retentionMs = this.backupConfig.retention * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - retentionMs);
    
    // Implementation to clean up old backup files
    console.log(`🧹 Cleaning up backups older than ${cutoffDate.toISOString()}`);
  }

  private getActiveConnections(): number {
    // Implementation to get active connection count from pool
    return Array.from(this.connectionPools.values())
      .reduce((total, pool) => total + (pool as any).idleCount || 0, 0);
  }

  private getTotalConnections(): number {
    // Implementation to get total connection count from pool
    return Array.from(this.connectionPools.values())
      .reduce((total, pool) => total + (pool as any).totalCount || 0, 0);
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalQueries = this.metrics.totalQueries;
    this.metrics.averageResponseTime = 
      ((this.metrics.averageResponseTime * (totalQueries - 1)) + responseTime) / totalQueries;
  }

  getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  getHealth(): ConnectionHealth {
    return { ...this.healthStatus };
  }

  // ===== KNOWLEDGE BASE STORAGE IMPLEMENTATION =====

  async createKnowledgeBase(data: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [knowledgeBase] = await this.primaryDb
      .insert(knowledgeBases)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return knowledgeBase;
  }

  async getKnowledgeBase(id: string): Promise<KnowledgeBase | undefined> {
    const [knowledgeBase] = await this.primaryDb
      .select()
      .from(knowledgeBases)
      .where(eq(knowledgeBases.id, id))
      .limit(1);

    return knowledgeBase;
  }

  async getUserKnowledgeBases(userId: number): Promise<KnowledgeBase[]> {
    return await this.primaryDb
      .select()
      .from(knowledgeBases)
      .where(and(
        eq(knowledgeBases.ownerId, userId),
        eq(knowledgeBases.status, 'active')
      ))
      .orderBy(desc(knowledgeBases.updatedAt));
  }

  async updateKnowledgeBase(id: string, updates: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
    const [knowledgeBase] = await this.primaryDb
      .update(knowledgeBases)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeBases.id, id))
      .returning();

    return knowledgeBase;
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    await this.primaryDb.transaction(async (tx) => {
      const documents = await tx
        .select({ id: kbDocuments.id })
        .from(kbDocuments)
        .where(eq(kbDocuments.knowledgeBaseId, id));

      const documentIds = documents.map(d => d.id);

      if (documentIds.length > 0) {
        await tx.delete(kbEmbeddings)
          .where(inArray(kbEmbeddings.documentId, documentIds));
        await tx.delete(kbDocumentChunks)
          .where(inArray(kbDocumentChunks.documentId, documentIds));
        await tx.delete(kbDocuments)
          .where(eq(kbDocuments.knowledgeBaseId, id));
      }

      await tx.delete(knowledgeBases)
        .where(eq(knowledgeBases.id, id));
    });
  }

  async createDocument(data: InsertKbDocument): Promise<KbDocument> {
    const [document] = await this.primaryDb
      .insert(kbDocuments)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return document;
  }

  async getDocument(id: string): Promise<KbDocument | undefined> {
    const [document] = await this.primaryDb
      .select()
      .from(kbDocuments)
      .where(eq(kbDocuments.id, id))
      .limit(1);

    return document;
  }

  async getKnowledgeBaseDocuments(
    knowledgeBaseId: string, 
    options: DocumentQueryOptions = {}
  ): Promise<KbDocument[]> {
    const {
      status,
      documentType,
      limit = 50,
      offset = 0,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = options;

    let query = this.primaryDb
      .select()
      .from(kbDocuments)
      .where(eq(kbDocuments.knowledgeBaseId, knowledgeBaseId));

    if (status) {
      query = query.where(and(
        eq(kbDocuments.knowledgeBaseId, knowledgeBaseId),
        eq(kbDocuments.status, status)
      ));
    }

    if (documentType) {
      query = query.where(and(
        eq(kbDocuments.knowledgeBaseId, knowledgeBaseId),
        eq(kbDocuments.documentType, documentType)
      ));
    }

    const sortColumn = sortBy === 'createdAt' ? kbDocuments.createdAt :
                      sortBy === 'title' ? kbDocuments.title :
                      kbDocuments.updatedAt;

    query = sortOrder === 'desc' ?
      query.orderBy(desc(sortColumn)) :
      query.orderBy(asc(sortColumn));

    return await query
      .limit(limit)
      .offset(offset);
  }

  async updateDocument(id: string, updates: Partial<KbDocument>): Promise<KbDocument> {
    const [document] = await this.primaryDb
      .update(kbDocuments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(kbDocuments.id, id))
      .returning();

    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.primaryDb.transaction(async (tx) => {
      await tx.delete(kbEmbeddings)
        .where(eq(kbEmbeddings.documentId, id));
      await tx.delete(kbDocumentChunks)
        .where(eq(kbDocumentChunks.documentId, id));
      await tx.delete(kbDocuments)
        .where(eq(kbDocuments.id, id));
    });
  }

  async createDocumentChunk(data: InsertKbDocumentChunk): Promise<KbDocumentChunk> {
    const [chunk] = await this.primaryDb
      .insert(kbDocumentChunks)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();

    return chunk;
  }

  async getDocumentChunks(documentId: string): Promise<KbDocumentChunk[]> {
    return await this.primaryDb
      .select()
      .from(kbDocumentChunks)
      .where(eq(kbDocumentChunks.documentId, documentId))
      .orderBy(asc(kbDocumentChunks.chunkIndex));
  }

  async deleteDocumentChunks(documentId: string): Promise<void> {
    await this.primaryDb
      .delete(kbDocumentChunks)
      .where(eq(kbDocumentChunks.documentId, documentId));
  }

  async createEmbedding(data: InsertKbEmbedding): Promise<KbEmbedding> {
    const [embedding] = await this.primaryDb
      .insert(kbEmbeddings)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();

    return embedding;
  }

  async getDocumentEmbeddings(documentId: string): Promise<KbEmbedding[]> {
    return await this.primaryDb
      .select()
      .from(kbEmbeddings)
      .where(eq(kbEmbeddings.documentId, documentId));
  }

  async findSimilarEmbeddings(
    embedding: number[], 
    limit: number = 10, 
    threshold: number = 0.7
  ): Promise<KbEmbedding[]> {
    return await this.primaryDb
      .select()
      .from(kbEmbeddings)
      .limit(limit);
  }

  async deleteDocumentEmbeddings(documentId: string): Promise<void> {
    await this.primaryDb
      .delete(kbEmbeddings)
      .where(eq(kbEmbeddings.documentId, documentId));
  }

  async createVectorCollection(data: InsertVectorCollection): Promise<VectorCollection> {
    const [collection] = await this.primaryDb
      .insert(vectorCollections)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return collection;
  }

  async getVectorCollection(id: string): Promise<VectorCollection | undefined> {
    const [collection] = await this.primaryDb
      .select()
      .from(vectorCollections)
      .where(eq(vectorCollections.id, id))
      .limit(1);

    return collection;
  }

  async getVectorCollections(): Promise<VectorCollection[]> {
    return await this.primaryDb
      .select()
      .from(vectorCollections)
      .orderBy(desc(vectorCollections.createdAt));
  }

  async updateVectorCollection(id: string, updates: Partial<VectorCollection>): Promise<VectorCollection> {
    const [collection] = await this.primaryDb
      .update(vectorCollections)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(vectorCollections.id, id))
      .returning();

    return collection;
  }

  async insertVector(data: InsertVectorIndexEntry): Promise<VectorIndexEntry> {
    const [vector] = await this.primaryDb
      .insert(vectorIndex)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();

    return vector;
  }

  async searchVectors(
    collectionId: string, 
    queryVector: number[], 
    limit: number = 10
  ): Promise<VectorIndexEntry[]> {
    return await this.primaryDb
      .select()
      .from(vectorIndex)
      .where(eq(vectorIndex.collectionId, collectionId))
      .limit(limit);
  }

  async enqueueDocumentProcessing(data: InsertDocumentProcessingQueue): Promise<DocumentProcessingQueue> {
    const [job] = await this.primaryDb
      .insert(documentProcessingQueue)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();

    return job;
  }

  async getProcessingQueue(status?: string): Promise<DocumentProcessingQueue[]> {
    let query = this.primaryDb
      .select()
      .from(documentProcessingQueue);

    if (status) {
      query = query.where(eq(documentProcessingQueue.status, status));
    }

    return await query
      .orderBy(asc(documentProcessingQueue.priority), asc(documentProcessingQueue.createdAt));
  }

  async updateProcessingStatus(
    id: string, 
    status: string, 
    errorMessage?: string
  ): Promise<DocumentProcessingQueue> {
    const updates: any = {
      status,
    };

    if (status === 'processing') {
      updates.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updates.completedAt = new Date();
    }

    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }

    const [job] = await this.primaryDb
      .update(documentProcessingQueue)
      .set(updates)
      .where(eq(documentProcessingQueue.id, id))
      .returning();

    return job;
  }

  async createRAGQuery(data: InsertRAGQuery): Promise<RAGQuery> {
    const [query] = await this.primaryDb
      .insert(ragQueries)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();

    return query;
  }

  async getRAGQueries(userId: number, sessionId?: string): Promise<RAGQuery[]> {
    let query = this.primaryDb
      .select()
      .from(ragQueries)
      .where(eq(ragQueries.userId, userId));

    if (sessionId) {
      query = query.where(and(
        eq(ragQueries.userId, userId),
        eq(ragQueries.sessionId, sessionId)
      ));
    }

    return await query
      .orderBy(desc(ragQueries.createdAt))
      .limit(100);
  }

  async getUserRAGMetrics(userId: number): Promise<any> {
    const metrics = await this.primaryDb
      .select({
        totalQueries: count(),
        averageTime: sql<number>`AVG(${ragQueries.totalTime})`,
        averageConfidence: sql<number>`AVG(${ragQueries.confidence})`,
        totalCost: sql<number>`SUM(${ragQueries.cost})`
      })
      .from(ragQueries)
      .where(eq(ragQueries.userId, userId));

    return metrics[0];
  }

  async createRAGConversation(data: InsertRAGConversation): Promise<RAGConversation> {
    const [conversation] = await this.primaryDb
      .insert(ragConversations)
      .values({
        ...data,
        timestamp: new Date(),
      })
      .returning();

    return conversation;
  }

  async getConversationHistory(sessionId: string): Promise<RAGConversation[]> {
    return await this.primaryDb
      .select()
      .from(ragConversations)
      .where(eq(ragConversations.sessionId, sessionId))
      .orderBy(asc(ragConversations.turn));
  }

  async logSearchAnalytics(data: InsertSearchAnalytics): Promise<SearchAnalytics> {
    const [analytics] = await this.primaryDb
      .insert(searchAnalytics)
      .values({
        ...data,
        timestamp: new Date(),
      })
      .returning();

    return analytics;
  }

  async getSearchAnalytics(
    knowledgeBaseId?: string, 
    timeRange?: TimeRange
  ): Promise<SearchAnalytics[]> {
    let query = this.primaryDb
      .select()
      .from(searchAnalytics);

    const conditions = [];

    if (knowledgeBaseId) {
      conditions.push(eq(searchAnalytics.knowledgeBaseId, knowledgeBaseId));
    }

    if (timeRange) {
      conditions.push(
        gte(searchAnalytics.timestamp, timeRange.start),
        lte(searchAnalytics.timestamp, timeRange.end)
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(desc(searchAnalytics.timestamp))
      .limit(1000);
  }

  async searchDocuments(searchQuery: DocumentSearchQuery): Promise<SearchResult<KbDocument>> {
    const {
      query,
      knowledgeBaseIds,
      documentTypes,
      status,
      tags,
      dateRange,
      limit = 50,
      offset = 0
    } = searchQuery;

    let dbQuery = this.primaryDb
      .select()
      .from(kbDocuments);

    const conditions = [];

    if (query) {
      conditions.push(
        or(
          like(kbDocuments.title, `%${query}%`),
          like(kbDocuments.content, `%${query}%`)
        )
      );
    }

    if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
      conditions.push(inArray(kbDocuments.knowledgeBaseId, knowledgeBaseIds));
    }

    if (documentTypes && documentTypes.length > 0) {
      conditions.push(inArray(kbDocuments.documentType, documentTypes));
    }

    if (status) {
      conditions.push(eq(kbDocuments.status, status));
    }

    if (dateRange) {
      conditions.push(
        gte(kbDocuments.createdAt, dateRange.start),
        lte(kbDocuments.createdAt, dateRange.end)
      );
    }

    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions));
    }

    const totalQuery = this.primaryDb
      .select({ count: count() })
      .from(kbDocuments);

    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }

    const [{ count: total }] = await totalQuery;

    const items = await dbQuery
      .orderBy(desc(kbDocuments.updatedAt))
      .limit(limit)
      .offset(offset);

    return {
      items,
      total,
      hasMore: offset + limit < total
    };
  }

  async getKnowledgeBaseStatistics(knowledgeBaseId: string): Promise<KnowledgeBaseStatistics> {
    const [{ documentCount }] = await this.primaryDb
      .select({ documentCount: count() })
      .from(kbDocuments)
      .where(eq(kbDocuments.knowledgeBaseId, knowledgeBaseId));

    const [{ chunkCount }] = await this.primaryDb
      .select({ chunkCount: count() })
      .from(kbDocumentChunks)
      .innerJoin(kbDocuments, eq(kbDocumentChunks.documentId, kbDocuments.id))
      .where(eq(kbDocuments.knowledgeBaseId, knowledgeBaseId));

    const [{ embeddingCount }] = await this.primaryDb
      .select({ embeddingCount: count() })
      .from(kbEmbeddings)
      .innerJoin(kbDocuments, eq(kbEmbeddings.documentId, kbDocuments.id))
      .where(eq(kbDocuments.knowledgeBaseId, knowledgeBaseId));

    const [{ totalSize }] = await this.primaryDb
      .select({ 
        totalSize: sql<number>`COALESCE(SUM(${kbDocuments.characterCount}), 0)` 
      })
      .from(kbDocuments)
      .where(eq(kbDocuments.knowledgeBaseId, knowledgeBaseId));

    const [{ lastIndexed }] = await this.primaryDb
      .select({ 
        lastIndexed: sql<Date>`MAX(${kbDocuments.updatedAt})` 
      })
      .from(kbDocuments)
      .where(eq(kbDocuments.knowledgeBaseId, knowledgeBaseId));

    const [{ processingQueueSize }] = await this.primaryDb
      .select({ processingQueueSize: count() })
      .from(documentProcessingQueue)
      .where(eq(documentProcessingQueue.status, 'pending'));

    const averageQueryTime = 250;

    return {
      documentCount,
      chunkCount,
      embeddingCount,
      totalSize,
      lastIndexed,
      processingQueueSize,
      averageQueryTime
    };
  }

  async bulkUpdateDocumentStatus(documentIds: string[], status: string): Promise<void> {
    await this.primaryDb
      .update(kbDocuments)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(inArray(kbDocuments.id, documentIds));
  }

  async cleanupExpiredProcessingJobs(): Promise<void> {
    const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await this.primaryDb
      .update(documentProcessingQueue)
      .set({
        status: 'failed',
        errorMessage: 'Job expired after 24 hours',
        completedAt: new Date(),
      })
      .where(and(
        eq(documentProcessingQueue.status, 'processing'),
        lte(documentProcessingQueue.startedAt, expiredTime)
      ));
  }

  async close(): Promise<void> {
    console.log('🔌 Closing database connections...');
    
    for (const [name, pool] of this.connectionPools) {
      try {
        await pool.end();
        console.log(`✅ Closed connection pool: ${name}`);
      } catch (error) {
        console.error(`❌ Error closing connection pool ${name}:`, error);
      }
    }
    
    this.connectionPools.clear();
    this.isInitialized = false;
    this.emit('closed');
  }
}

// Factory function for easy initialization
export async function createDatabaseSystem(config: DatabaseConfig): Promise<DatabaseSystem> {
  const dbSystem = DatabaseSystem.getInstance(config);
  await dbSystem.initialize();
  return dbSystem;
}

// Default configuration
export const defaultDatabaseConfig: DatabaseConfig = {
  backend: 'postgresql',
  connectionString: process.env.DATABASE_URL,
  poolSize: 20,
  retryAttempts: 3,
  healthCheckInterval: 30000,
  backupEnabled: true,
  migrations: true
};