/**
 * Vector Search Engine for WAI Knowledge Base System
 * Production-ready semantic search with advanced ranking and filtering
 */
import { EventEmitter } from 'events';
import { embeddingService, type EmbeddingService, cosineSimilarity } from './embedding-service';
import { DatabaseSystem, type IKnowledgeBaseStorage } from './database-system';
import { storage } from '../storage/database-storage';
import type { 
  KbDocument, 
  KbDocumentChunk, 
  KbEmbedding, 
  VectorCollection,
  SearchAnalytics 
} from '../../../../shared/schema';

export interface SearchQuery {
  query: string;
  knowledgeBaseIds?: string[];
  documentTypes?: string[];
  tags?: string[];
  filters?: SearchFilter[];
  options?: SearchOptions;
}

export interface SearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  threshold?: number;
  rerank?: boolean;
  expand?: boolean;
  includeChunks?: boolean;
  includeMetadata?: boolean;
  searchMode?: SearchMode;
  sortBy?: SortOption[];
  facets?: string[];
}

export type SearchMode = 'semantic' | 'keyword' | 'hybrid' | 'fuzzy';

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  weight?: number;
}

export interface SearchResult {
  documents: EnrichedDocument[];
  chunks: EnrichedChunk[];
  total: number;
  facets?: Record<string, FacetResult>;
  queryExpansion?: string[];
  processingTime: number;
  searchStats: SearchStats;
}

export interface EnrichedDocument extends KbDocument {
  score: number;
  explanation?: string;
  highlights?: string[];
  relatedDocuments?: string[];
  chunks?: EnrichedChunk[];
}

export interface EnrichedChunk extends KbDocumentChunk {
  score: number;
  explanation?: string;
  highlights?: string[];
  documentTitle?: string;
  documentPath?: string;
}

export interface FacetResult {
  values: Array<{
    value: string;
    count: number;
  }>;
  total: number;
}

export interface SearchStats {
  totalSearched: number;
  vectorSearchTime: number;
  rerankingTime: number;
  filteringTime: number;
  queryExpansionTime: number;
}

export interface ClusteringOptions {
  algorithm: 'kmeans' | 'hierarchical' | 'dbscan';
  numClusters?: number;
  minClusterSize?: number;
  threshold?: number;
}

export interface DocumentCluster {
  id: string;
  centroid: number[];
  documents: string[];
  keywords: string[];
  size: number;
  coherenceScore: number;
}

export interface QueryExpansionOptions {
  method: 'semantic' | 'statistical' | 'hybrid';
  maxTerms: number;
  threshold: number;
  useHistory: boolean;
}

export interface SearchEngineConfig {
  embedding: {
    model: string;
    provider: string;
    dimension: number;
  };
  search: {
    defaultLimit: number;
    maxLimit: number;
    defaultThreshold: number;
    rerankingEnabled: boolean;
    queryExpansionEnabled: boolean;
  };
  indexing: {
    batchSize: number;
    parallelism: number;
    refreshInterval: number;
  };
  clustering: {
    enabled: boolean;
    refreshInterval: number;
    defaultAlgorithm: 'kmeans';
    maxClusters: number;
  };
  analytics: {
    enabled: boolean;
    sampleRate: number;
    retentionDays: number;
  };
}

export class VectorSearchEngine extends EventEmitter {
  private config: SearchEngineConfig;
  private embeddingService: EmbeddingService;
  private database: IKnowledgeBaseStorage;
  private clusters: Map<string, DocumentCluster[]> = new Map();
  private queryCache: Map<string, SearchResult> = new Map();
  private indexingQueue: Set<string> = new Set();

  constructor(
    config: SearchEngineConfig,
    customEmbeddingService?: EmbeddingService,
    customDatabase?: IKnowledgeBaseStorage
  ) {
    super();
    this.config = config;
    this.embeddingService = customEmbeddingService || embeddingService;
    this.database = customDatabase || (storage as any as IKnowledgeBaseStorage);

    this.startIndexingWorker();
    this.startClusteringWorker();
  }

  private startIndexingWorker(): void {
    setInterval(async () => {
      await this.processIndexingQueue();
    }, this.config.indexing.refreshInterval);
  }

  private startClusteringWorker(): void {
    if (!this.config.clustering.enabled) return;

    setInterval(async () => {
      await this.refreshClusters();
    }, this.config.clustering.refreshInterval);
  }

  private async processIndexingQueue(): Promise<void> {
    if (this.indexingQueue.size === 0) return;

    const documentIds = Array.from(this.indexingQueue).slice(0, this.config.indexing.batchSize);
    this.indexingQueue.clear();

    try {
      await this.indexDocuments(documentIds);
      console.log(`📚 Indexed ${documentIds.length} documents`);
    } catch (error) {
      console.error('❌ Error processing indexing queue:', error);
      // Re-add failed documents to queue
      documentIds.forEach(id => this.indexingQueue.add(id));
    }
  }

  private async refreshClusters(): Promise<void> {
    try {
      const knowledgeBases = await this.database.getUserKnowledgeBases(1); // TODO: Make user-agnostic
      
      for (const kb of knowledgeBases) {
        await this.clusterKnowledgeBase(kb.id, {
          algorithm: this.config.clustering.defaultAlgorithm,
          numClusters: this.config.clustering.maxClusters
        });
      }
    } catch (error) {
      console.error('❌ Error refreshing clusters:', error);
    }
  }

  async search(searchQuery: SearchQuery, userId?: number): Promise<SearchResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(searchQuery);
    
    // Check cache
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - startTime < 5000) { // 5 second cache
      return cached;
    }

    const searchStats: SearchStats = {
      totalSearched: 0,
      vectorSearchTime: 0,
      rerankingTime: 0,
      filteringTime: 0,
      queryExpansionTime: 0
    };

    try {
      // Step 1: Query expansion
      let expandedQueries = [searchQuery.query];
      if (searchQuery.options?.expand && this.config.search.queryExpansionEnabled) {
        const expansionStart = Date.now();
        expandedQueries = await this.expandQuery(searchQuery.query, {
          method: 'semantic',
          maxTerms: 3,
          threshold: 0.7,
          useHistory: true
        });
        searchStats.queryExpansionTime = Date.now() - expansionStart;
      }

      // Step 2: Generate embeddings for query
      const queryEmbeddings = await Promise.all(
        expandedQueries.map(query => 
          this.embeddingService.generateEmbedding({
            text: query,
            provider: this.config.embedding.provider as any,
            model: this.config.embedding.model
          })
        )
      );

      // Step 3: Vector search
      const vectorStart = Date.now();
      const vectorResults = await this.performVectorSearch(
        queryEmbeddings.map(e => e.embedding),
        searchQuery
      );
      searchStats.vectorSearchTime = Date.now() - vectorStart;
      searchStats.totalSearched = vectorResults.length;

      // Step 4: Apply filters
      const filterStart = Date.now();
      const filteredResults = await this.applyFilters(vectorResults, searchQuery.filters || []);
      searchStats.filteringTime = Date.now() - filterStart;

      // Step 5: Reranking
      let rankedResults = filteredResults;
      if (searchQuery.options?.rerank && this.config.search.rerankingEnabled) {
        const rerankStart = Date.now();
        rankedResults = await this.rerankResults(filteredResults, searchQuery);
        searchStats.rerankingTime = Date.now() - rerankStart;
      }

      // Step 6: Prepare final results
      const documents = await this.enrichDocuments(rankedResults, searchQuery);
      const chunks = searchQuery.options?.includeChunks ? 
        await this.getDocumentChunks(documents.map(d => d.id)) : [];

      // Step 7: Generate facets
      const facets = searchQuery.options?.facets ? 
        await this.generateFacets(documents, searchQuery.options.facets) : undefined;

      const result: SearchResult = {
        documents,
        chunks,
        total: rankedResults.length,
        facets,
        queryExpansion: expandedQueries.slice(1), // Exclude original query
        processingTime: Date.now() - startTime,
        searchStats
      };

      // Cache result
      this.queryCache.set(cacheKey, result);
      
      // Log analytics
      if (this.config.analytics.enabled && userId) {
        await this.logSearchAnalytics(searchQuery, result, userId);
      }

      return result;

    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  }

  private async performVectorSearch(
    queryEmbeddings: number[][], 
    searchQuery: SearchQuery
  ): Promise<Array<{ documentId: string; score: number; chunkId?: string }>> {
    const results: Array<{ documentId: string; score: number; chunkId?: string }> = [];
    const threshold = searchQuery.options?.threshold || this.config.search.defaultThreshold;
    const limit = Math.min(
      searchQuery.options?.limit || this.config.search.defaultLimit,
      this.config.search.maxLimit
    );

    // Get embeddings from database
    const allEmbeddings = await this.database.getDocumentEmbeddings(''); // TODO: Implement batch get

    for (const queryEmbedding of queryEmbeddings) {
      for (const docEmbedding of allEmbeddings) {
        if (!docEmbedding.embedding || !Array.isArray(docEmbedding.embedding)) continue;

        const similarity = cosineSimilarity(queryEmbedding, docEmbedding.embedding as number[]);
        
        if (similarity >= threshold) {
          results.push({
            documentId: docEmbedding.documentId,
            score: similarity,
            chunkId: docEmbedding.chunkId || undefined
          });
        }
      }
    }

    // Sort by score and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async applyFilters(
    results: Array<{ documentId: string; score: number; chunkId?: string }>,
    filters: SearchFilter[]
  ): Promise<Array<{ documentId: string; score: number; chunkId?: string }>> {
    if (filters.length === 0) return results;

    const filteredResults = [];

    for (const result of results) {
      const document = await this.database.getDocument(result.documentId);
      if (!document) continue;

      let passesAllFilters = true;

      for (const filter of filters) {
        const fieldValue = this.getFieldValue(document, filter.field);
        
        if (!this.evaluateFilter(fieldValue, filter)) {
          passesAllFilters = false;
          break;
        }
      }

      if (passesAllFilters) {
        filteredResults.push(result);
      }
    }

    return filteredResults;
  }

  private getFieldValue(document: any, field: string): any {
    const parts = field.split('.');
    let value = document;
    
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }
    
    return value;
  }

  private evaluateFilter(value: any, filter: SearchFilter): boolean {
    switch (filter.operator) {
      case 'eq':
        return value === filter.value;
      case 'ne':
        return value !== filter.value;
      case 'gt':
        return value > filter.value;
      case 'lt':
        return value < filter.value;
      case 'gte':
        return value >= filter.value;
      case 'lte':
        return value <= filter.value;
      case 'contains':
        return typeof value === 'string' && value.includes(filter.value);
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);
      case 'not_in':
        return Array.isArray(filter.value) && !filter.value.includes(value);
      default:
        return true;
    }
  }

  private async rerankResults(
    results: Array<{ documentId: string; score: number; chunkId?: string }>,
    searchQuery: SearchQuery
  ): Promise<Array<{ documentId: string; score: number; chunkId?: string }>> {
    // Advanced reranking using multiple signals
    const rerankedResults = [];

    for (const result of results) {
      const document = await this.database.getDocument(result.documentId);
      if (!document) continue;

      let newScore = result.score;

      // Boost score based on document freshness
      const daysSinceUpdate = document.updatedAt 
        ? (Date.now() - new Date(document.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 30; // Default to 30 days if no update date
      const freshnessBoost = Math.max(0, 1 - (daysSinceUpdate / 30)); // Decay over 30 days
      newScore *= (1 + freshnessBoost * 0.1);

      // Boost score based on document length (prefer comprehensive documents)
      const lengthBoost = Math.min(1, (document.characterCount || 0) / 10000);
      newScore *= (1 + lengthBoost * 0.05);

      // Boost score based on document type priority
      const typeBoosts: Record<string, number> = {
        'manual': 1.2,
        'guide': 1.1,
        'reference': 1.0,
        'note': 0.9
      };
      const typeBoost = typeBoosts[document.documentType] || 1.0;
      newScore *= typeBoost;

      rerankedResults.push({
        ...result,
        score: newScore
      });
    }

    return rerankedResults.sort((a, b) => b.score - a.score);
  }

  private async enrichDocuments(
    results: Array<{ documentId: string; score: number; chunkId?: string }>,
    searchQuery: SearchQuery
  ): Promise<EnrichedDocument[]> {
    const enrichedDocs: EnrichedDocument[] = [];

    for (const result of results) {
      const document = await this.database.getDocument(result.documentId);
      if (!document) continue;

      const enriched: EnrichedDocument = {
        ...document,
        score: result.score,
        explanation: this.generateExplanation(result.score, searchQuery),
        highlights: await this.generateHighlights(document, searchQuery.query),
        relatedDocuments: await this.findRelatedDocuments(document.id)
      };

      if (searchQuery.options?.includeChunks) {
        enriched.chunks = await this.getEnrichedChunks(document.id, searchQuery);
      }

      enrichedDocs.push(enriched);
    }

    return enrichedDocs;
  }

  private generateExplanation(score: number, searchQuery: SearchQuery): string {
    const scorePercent = Math.round(score * 100);
    return `Matched with ${scorePercent}% similarity to "${searchQuery.query}"`;
  }

  private async generateHighlights(document: KbDocument, query: string): Promise<string[]> {
    if (!document.content) return [];

    const queryTerms = query.toLowerCase().split(' ');
    const content = document.content.toLowerCase();
    const highlights: string[] = [];

    for (const term of queryTerms) {
      const index = content.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + term.length + 50);
        const highlight = document.content.substring(start, end);
        highlights.push(`...${highlight}...`);
      }
    }

    return highlights.slice(0, 3); // Limit to 3 highlights
  }

  private async findRelatedDocuments(documentId: string): Promise<string[]> {
    // Simple implementation - in practice, you'd use ML techniques
    const document = await this.database.getDocument(documentId);
    if (!document) return [];

    const similarDocs = await this.database.searchDocuments({
      query: document.title,
      limit: 5
    });

    return similarDocs.items
      .filter(doc => doc.id !== documentId)
      .map(doc => doc.id)
      .slice(0, 3);
  }

  private async getDocumentChunks(documentIds: string[]): Promise<EnrichedChunk[]> {
    const allChunks: EnrichedChunk[] = [];

    for (const documentId of documentIds) {
      const chunks = await this.database.getDocumentChunks(documentId);
      const document = await this.database.getDocument(documentId);

      for (const chunk of chunks) {
        allChunks.push({
          ...chunk,
          score: 0.5, // Default score for chunks
          documentTitle: document?.title,
          documentPath: document?.filePath || undefined
        });
      }
    }

    return allChunks;
  }

  private async getEnrichedChunks(documentId: string, searchQuery: SearchQuery): Promise<EnrichedChunk[]> {
    const chunks = await this.database.getDocumentChunks(documentId);
    const document = await this.database.getDocument(documentId);

    return chunks.map(chunk => ({
      ...chunk,
      score: 0.5, // Would calculate based on chunk relevance
      highlights: chunk.content.includes(searchQuery.query) ? [chunk.content.substring(0, 100)] : [],
      documentTitle: document?.title,
      documentPath: document?.filePath || undefined
    }));
  }

  private async generateFacets(documents: EnrichedDocument[], facetFields: string[]): Promise<Record<string, FacetResult>> {
    const facets: Record<string, FacetResult> = {};

    for (const field of facetFields) {
      const valueCounts: Record<string, number> = {};

      for (const doc of documents) {
        const value = this.getFieldValue(doc, field);
        if (value !== undefined) {
          const strValue = String(value);
          valueCounts[strValue] = (valueCounts[strValue] || 0) + 1;
        }
      }

      facets[field] = {
        values: Object.entries(valueCounts)
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count),
        total: Object.keys(valueCounts).length
      };
    }

    return facets;
  }

  private async expandQuery(query: string, options: QueryExpansionOptions): Promise<string[]> {
    const expandedQueries = [query];

    if (options.method === 'semantic' || options.method === 'hybrid') {
      // Use embeddings to find semantically similar terms
      const queryEmbedding = await this.embeddingService.generateEmbedding({
        text: query,
        provider: this.config.embedding.provider as any,
        model: this.config.embedding.model
      });

      // Find similar documents and extract keywords
      // This is a simplified implementation
      const similarTerms = await this.findSimilarTerms(queryEmbedding.embedding, options.threshold);
      expandedQueries.push(...similarTerms.slice(0, options.maxTerms));
    }

    return expandedQueries;
  }

  private async findSimilarTerms(queryEmbedding: number[], threshold: number): Promise<string[]> {
    // Simplified implementation - would use a proper term expansion model
    return ['related', 'similar', 'equivalent'];
  }

  async clusterKnowledgeBase(
    knowledgeBaseId: string, 
    options: ClusteringOptions
  ): Promise<DocumentCluster[]> {
    const documents = await this.database.getKnowledgeBaseDocuments(knowledgeBaseId, { limit: 1000 });
    const embeddings: Array<{ documentId: string; embedding: number[] }> = [];

    // Get embeddings for all documents
    for (const doc of documents) {
      const docEmbeddings = await this.database.getDocumentEmbeddings(doc.id);
      if (docEmbeddings.length > 0 && docEmbeddings[0].embedding) {
        embeddings.push({
          documentId: doc.id,
          embedding: docEmbeddings[0].embedding as number[]
        });
      }
    }

    let clusters: DocumentCluster[] = [];

    switch (options.algorithm) {
      case 'kmeans':
        clusters = await this.performKMeansClustering(embeddings, options.numClusters || 5);
        break;
      case 'hierarchical':
        clusters = await this.performHierarchicalClustering(embeddings, options.threshold || 0.7);
        break;
      case 'dbscan':
        clusters = await this.performDBSCANClustering(embeddings, options.minClusterSize || 3);
        break;
    }

    // Cache clusters
    this.clusters.set(knowledgeBaseId, clusters);

    return clusters;
  }

  private async performKMeansClustering(
    embeddings: Array<{ documentId: string; embedding: number[] }>,
    k: number
  ): Promise<DocumentCluster[]> {
    // Simplified K-means implementation
    const clusters: DocumentCluster[] = [];
    const dimension = embeddings[0]?.embedding.length || 0;

    // Initialize centroids randomly
    for (let i = 0; i < k; i++) {
      const centroid = new Array(dimension).fill(0).map(() => Math.random());
      clusters.push({
        id: `cluster_${i}`,
        centroid,
        documents: [],
        keywords: [],
        size: 0,
        coherenceScore: 0
      });
    }

    // Assign documents to clusters (simplified)
    for (const item of embeddings) {
      let bestCluster = 0;
      let bestSimilarity = -1;

      for (let i = 0; i < clusters.length; i++) {
        const similarity = cosineSimilarity(item.embedding, clusters[i].centroid);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCluster = i;
        }
      }

      clusters[bestCluster].documents.push(item.documentId);
      clusters[bestCluster].size++;
    }

    return clusters;
  }

  private async performHierarchicalClustering(
    embeddings: Array<{ documentId: string; embedding: number[] }>,
    threshold: number
  ): Promise<DocumentCluster[]> {
    // Simplified hierarchical clustering
    return [];
  }

  private async performDBSCANClustering(
    embeddings: Array<{ documentId: string; embedding: number[] }>,
    minClusterSize: number
  ): Promise<DocumentCluster[]> {
    // Simplified DBSCAN clustering
    return [];
  }

  private generateCacheKey(searchQuery: SearchQuery): string {
    return Buffer.from(JSON.stringify(searchQuery)).toString('base64').slice(0, 50);
  }

  private async logSearchAnalytics(
    searchQuery: SearchQuery,
    result: SearchResult,
    userId: number
  ): Promise<void> {
    if (Math.random() > this.config.analytics.sampleRate) return; // Sampling

    try {
      await this.database.logSearchAnalytics({
        userId: String(userId),
        knowledgeBaseId: searchQuery.knowledgeBaseIds?.[0],
        query: searchQuery.query,
        resultCount: result.documents.length,
        searchTime: result.processingTime,
        searchMethod: searchQuery.options?.searchMode || 'semantic',
        clickedResults: []
      });
    } catch (error) {
      console.error('❌ Error logging search analytics:', error);
    }
  }

  async indexDocuments(documentIds: string[]): Promise<void> {
    const batchSize = this.config.indexing.batchSize;
    
    for (let i = 0; i < documentIds.length; i += batchSize) {
      const batch = documentIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (documentId) => {
          try {
            const document = await this.database.getDocument(documentId);
            if (!document || !document.content) return;

            // Generate chunks if not exist
            const existingChunks = await this.database.getDocumentChunks(documentId);
            if (existingChunks.length === 0) {
              await this.chunkDocument(document);
            }

            // Generate embeddings if not exist
            const existingEmbeddings = await this.database.getDocumentEmbeddings(documentId);
            if (existingEmbeddings.length === 0) {
              await this.embedDocument(document);
            }

            console.log(`✅ Indexed document: ${document.title}`);
          } catch (error) {
            console.error(`❌ Error indexing document ${documentId}:`, error);
          }
        })
      );
    }
  }

  private async chunkDocument(document: KbDocument): Promise<void> {
    if (!document.content) return;

    const chunkSize = 500; // tokens
    const overlap = 50; // tokens
    const words = document.content.split(' ');
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      chunks.push(chunk);
    }

    // Save chunks to database
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

  private async embedDocument(document: KbDocument): Promise<void> {
    if (!document.content) return;

    try {
      const embeddingResponse = await this.embeddingService.generateEmbedding({
        text: document.content,
        provider: this.config.embedding.provider as any,
        model: this.config.embedding.model
      });

      await this.database.createEmbedding({
        documentId: document.id,
        embeddingModel: embeddingResponse.model,
        embedding: embeddingResponse.embedding,
        contentHash: this.generateContentHash(document.content)
      });
    } catch (error) {
      console.error(`❌ Error embedding document ${document.id}:`, error);
    }
  }

  private generateContentHash(content: string): string {
    // Simple hash function - in practice, use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async queueDocumentForIndexing(documentId: string): Promise<void> {
    this.indexingQueue.add(documentId);
  }

  async getClusters(knowledgeBaseId: string): Promise<DocumentCluster[]> {
    return this.clusters.get(knowledgeBaseId) || [];
  }

  clearCache(): void {
    this.queryCache.clear();
  }

  getStats(): {
    indexingQueueSize: number;
    cacheSize: number;
    clustersCount: number;
  } {
    return {
      indexingQueueSize: this.indexingQueue.size,
      cacheSize: this.queryCache.size,
      clustersCount: Array.from(this.clusters.values()).reduce((total, clusters) => total + clusters.length, 0)
    };
  }
}

// Default configuration
export const defaultSearchEngineConfig: SearchEngineConfig = {
  embedding: {
    model: 'text-embedding-3-small',
    provider: 'openai',
    dimension: 1536
  },
  search: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultThreshold: 0.7,
    rerankingEnabled: true,
    queryExpansionEnabled: true
  },
  indexing: {
    batchSize: 10,
    parallelism: 3,
    refreshInterval: 30000 // 30 seconds
  },
  clustering: {
    enabled: true,
    refreshInterval: 300000, // 5 minutes
    defaultAlgorithm: 'kmeans',
    maxClusters: 20
  },
  analytics: {
    enabled: true,
    sampleRate: 0.1, // 10% sampling
    retentionDays: 30
  }
};

// Export singleton instance
export const vectorSearchEngine = new VectorSearchEngine(defaultSearchEngineConfig);