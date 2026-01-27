/**
 * RAG (Retrieval-Augmented Generation) System for WAI SDK 9.0
 * Comprehensive retrieval augmented generation with context assembly and optimization
 * Features: Query expansion, reranking, result filtering, hybrid search, real-time updates
 */

import { EventEmitter } from 'events';
import { KnowledgeBaseSystem, SearchRequest, SearchResult } from './knowledge-base-system';
import { VectorDatabase, EmbeddingRequest } from './vector-database';
import { DatabaseSystem } from './database-system';
import crypto from 'crypto';

export interface RAGRequest {
  query: string;
  knowledgeBaseIds?: string[];
  context?: RAGContext;
  options?: RAGOptions;
  userId: string;
  sessionId?: string;
}

export interface RAGContext {
  conversationHistory?: ConversationTurn[];
  userProfile?: UserProfile;
  taskContext?: string;
  domain?: string;
  language?: string;
  previousQueries?: string[];
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  preferences: Record<string, any>;
  expertise: string[];
  interests: string[];
  language: string;
  context: Record<string, any>;
}

export interface RAGOptions {
  maxSources?: number;
  contextWindow?: number;
  retrievalStrategy?: 'semantic' | 'keyword' | 'hybrid' | 'adaptive';
  rerankResults?: boolean;
  expandQuery?: boolean;
  filterSources?: boolean;
  includeMetadata?: boolean;
  citationStyle?: 'inline' | 'footnote' | 'bibliography' | 'none';
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json' | 'markdown' | 'structured';
  qualityThreshold?: number;
  diversityBoost?: boolean;
  temporalRelevance?: boolean;
}

export interface RAGResponse {
  query: string;
  response: string;
  sources: SourceCitation[];
  confidence: number;
  context: AssembledContext;
  metadata: RAGResponseMetadata;
  suggestions?: string[];
  relatedQueries?: string[];
  qualityScore: number;
}

export interface SourceCitation {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  documentType: string;
  knowledgeBaseId: string;
  url?: string;
  author?: string;
  publishedDate?: Date;
  accessedDate: Date;
  pageNumber?: number;
  section?: string;
  citationText: string;
}

export interface AssembledContext {
  retrievedChunks: ContextChunk[];
  totalTokens: number;
  coherenceScore: number;
  coverage: number;
  diversity: number;
  timespan: { earliest: Date; latest: Date };
  sources: string[];
  languages: string[];
}

export interface ContextChunk {
  id: string;
  content: string;
  source: string;
  relevanceScore: number;
  position: number;
  tokenCount: number;
  metadata: Record<string, any>;
}

export interface RAGResponseMetadata {
  retrievalTime: number;
  generationTime: number;
  totalTime: number;
  sourcesSearched: number;
  chunksRetrieved: number;
  chunksUsed: number;
  strategy: string;
  modelUsed: string;
  tokensUsed: number;
  cost?: number;
  cached?: boolean;
}

export interface QueryExpansion {
  originalQuery: string;
  expandedTerms: string[];
  synonyms: string[];
  relatedConcepts: string[];
  contextualTerms: string[];
  finalQuery: string;
  expansionStrategy: string;
}

export interface RetrievalMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  ndcg: number; // Normalized Discounted Cumulative Gain
  relevanceScores: number[];
  diversityScore: number;
  freshnessScore: number;
}

export class RAGSystem extends EventEmitter {
  private knowledgeBaseSystem: KnowledgeBaseSystem;
  private vectorDatabase: VectorDatabase;
  private databaseSystem: DatabaseSystem;
  private queryCache: Map<string, RAGResponse> = new Map();
  private conversationSessions: Map<string, ConversationTurn[]> = new Map();
  private isInitialized = false;

  // Configuration
  private readonly defaultOptions: Required<RAGOptions> = {
    maxSources: 10,
    contextWindow: 4000,
    retrievalStrategy: 'hybrid',
    rerankResults: true,
    expandQuery: true,
    filterSources: true,
    includeMetadata: true,
    citationStyle: 'inline',
    temperature: 0.7,
    maxTokens: 2000,
    responseFormat: 'text',
    qualityThreshold: 0.7,
    diversityBoost: true,
    temporalRelevance: true
  };

  // Query expansion patterns
  private readonly expansionPatterns = {
    technical: ['implementation', 'architecture', 'design', 'specification'],
    business: ['strategy', 'process', 'workflow', 'procedure'],
    analytical: ['analysis', 'evaluation', 'assessment', 'comparison'],
    educational: ['tutorial', 'guide', 'example', 'demonstration']
  };

  constructor(
    knowledgeBaseSystem: KnowledgeBaseSystem,
    vectorDatabase: VectorDatabase,
    databaseSystem: DatabaseSystem
  ) {
    super();
    this.knowledgeBaseSystem = knowledgeBaseSystem;
    this.vectorDatabase = vectorDatabase;
    this.databaseSystem = databaseSystem;
  }

  async initialize(): Promise<void> {
    console.log('🔗 Initializing RAG System...');

    try {
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize conversation tracking
      this.startConversationCleanup();
      
      // Initialize metrics collection
      this.startMetricsCollection();
      
      this.isInitialized = true;
      this.emit('initialized');
      console.log('✅ RAG System initialized successfully');

    } catch (error) {
      console.error('❌ RAG System initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async query(request: RAGRequest): Promise<RAGResponse> {
    const startTime = Date.now();
    console.log(`🤔 Processing RAG query: "${request.query}"`);

    try {
      // Validate request
      this.validateRequest(request);

      // Merge options with defaults
      const options = { ...this.defaultOptions, ...request.options };

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResponse = this.queryCache.get(cacheKey);
      if (cachedResponse && !this.shouldBypassCache(request)) {
        console.log('📋 Using cached RAG response');
        this.updateConversationHistory(request, cachedResponse);
        return { ...cachedResponse, metadata: { ...cachedResponse.metadata, cached: true } };
      }

      // Step 1: Query Expansion
      const expandedQuery = options.expandQuery 
        ? await this.expandQuery(request.query, request.context)
        : { originalQuery: request.query, finalQuery: request.query } as QueryExpansion;

      // Step 2: Retrieval
      const retrievalResults = await this.performRetrieval(
        expandedQuery.finalQuery,
        request.knowledgeBaseIds,
        request.userId,
        options
      );

      // Step 3: Reranking (if enabled)
      const rerankedResults = options.rerankResults 
        ? await this.rerankResults(retrievalResults, request.query, request.context)
        : retrievalResults;

      // Step 4: Context Assembly
      const assembledContext = await this.assembleContext(
        rerankedResults,
        options.contextWindow,
        request.context
      );

      // Step 5: Generate Response
      const response = await this.generateResponse(
        request.query,
        assembledContext,
        request.context,
        options
      );

      // Step 6: Create Citations
      const citations = this.createCitations(
        rerankedResults.slice(0, options.maxSources),
        options.citationStyle
      );

      // Step 7: Calculate Quality Metrics
      const qualityScore = await this.calculateQualityScore(
        request.query,
        response,
        assembledContext,
        citations
      );

      // Step 8: Generate Suggestions
      const suggestions = await this.generateSuggestions(
        request.query,
        assembledContext,
        request.context
      );

      const totalTime = Date.now() - startTime;

      const ragResponse: RAGResponse = {
        query: request.query,
        response,
        sources: citations,
        confidence: this.calculateConfidence(rerankedResults, assembledContext),
        context: assembledContext,
        metadata: {
          retrievalTime: retrievalResults.length > 0 ? 100 : 0, // Placeholder
          generationTime: totalTime - 100,
          totalTime,
          sourcesSearched: request.knowledgeBaseIds?.length || 1,
          chunksRetrieved: retrievalResults.length,
          chunksUsed: assembledContext.retrievedChunks.length,
          strategy: options.retrievalStrategy,
          modelUsed: 'gpt-4-turbo',
          tokensUsed: this.estimateTokenUsage(request.query, response),
          cached: false
        },
        suggestions,
        relatedQueries: await this.generateRelatedQueries(request.query, assembledContext),
        qualityScore
      };

      // Cache response
      this.queryCache.set(cacheKey, ragResponse);

      // Update conversation history
      this.updateConversationHistory(request, ragResponse);

      // Log metrics
      await this.logMetrics(request, ragResponse);

      console.log(`✅ RAG query completed: ${totalTime}ms, quality: ${qualityScore.toFixed(2)}`);
      this.emit('queryCompleted', { request, response: ragResponse });

      return ragResponse;

    } catch (error) {
      console.error('❌ RAG query failed:', error);
      this.emit('queryFailed', { request, error });
      throw error;
    }
  }

  private async expandQuery(query: string, context?: RAGContext): Promise<QueryExpansion> {
    console.log('🔍 Expanding query for better retrieval...');

    const originalQuery = query.toLowerCase();
    const expandedTerms: string[] = [];
    const synonyms: string[] = [];
    const relatedConcepts: string[] = [];
    const contextualTerms: string[] = [];

    // Extract domain-specific terms
    for (const [domain, terms] of Object.entries(this.expansionPatterns)) {
      if (originalQuery.includes(domain) || (context?.domain === domain)) {
        expandedTerms.push(...terms);
      }
    }

    // Add conversation context terms
    if (context?.conversationHistory) {
      const recentMessages = context.conversationHistory.slice(-3);
      for (const message of recentMessages) {
        const words = message.content.toLowerCase().split(/\s+/);
        const keywords = words.filter(word => 
          word.length > 3 && 
          !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)
        );
        contextualTerms.push(...keywords.slice(0, 3));
      }
    }

    // Add user profile terms
    if (context?.userProfile) {
      relatedConcepts.push(...context.userProfile.expertise);
      relatedConcepts.push(...context.userProfile.interests);
    }

    // Simple synonym expansion (in production, would use WordNet or similar)
    const synonymMap: Record<string, string[]> = {
      'implement': ['create', 'build', 'develop', 'construct'],
      'analyze': ['examine', 'study', 'evaluate', 'assess'],
      'optimize': ['improve', 'enhance', 'refine', 'tune'],
      'design': ['architect', 'plan', 'structure', 'layout']
    };

    for (const [word, wordSynonyms] of Object.entries(synonymMap)) {
      if (originalQuery.includes(word)) {
        synonyms.push(...wordSynonyms);
      }
    }

    // Build final query
    const allTerms = [
      query,
      ...expandedTerms.slice(0, 3),
      ...synonyms.slice(0, 2),
      ...relatedConcepts.slice(0, 2),
      ...contextualTerms.slice(0, 2)
    ];

    const finalQuery = allTerms.join(' ');

    return {
      originalQuery: query,
      expandedTerms,
      synonyms,
      relatedConcepts,
      contextualTerms,
      finalQuery,
      expansionStrategy: 'contextual-semantic'
    };
  }

  private async performRetrieval(
    query: string,
    knowledgeBaseIds: string[] | undefined,
    userId: string,
    options: Required<RAGOptions>
  ): Promise<SearchResult[]> {
    console.log(`📚 Performing ${options.retrievalStrategy} retrieval...`);

    const searchRequest: SearchRequest = {
      query,
      knowledgeBaseId: knowledgeBaseIds?.[0],
      userId,
      options: {
        maxResults: options.maxSources * 2, // Retrieve more for reranking
        enableSemanticSearch: ['semantic', 'hybrid', 'adaptive'].includes(options.retrievalStrategy),
        enableHybridSearch: options.retrievalStrategy === 'hybrid',
        rerank: false, // We'll handle reranking separately
        includeContent: true,
        includeMetadata: options.includeMetadata
      },
      filters: {
        minRelevanceScore: options.qualityThreshold
      }
    };

    const searchResponse = await this.knowledgeBaseSystem.search(searchRequest);
    return searchResponse.results;
  }

  private async rerankResults(
    results: SearchResult[],
    originalQuery: string,
    context?: RAGContext
  ): Promise<SearchResult[]> {
    console.log('🔄 Reranking retrieval results...');

    // Advanced reranking using multiple signals
    const rerankedResults = results.map(result => {
      let adjustedScore = result.relevanceScore;

      // Boost recent documents
      const docAge = this.getDocumentAge(result.document.createdAt);
      if (docAge < 30) { // Less than 30 days
        adjustedScore *= 1.2;
      } else if (docAge > 365) { // More than 1 year
        adjustedScore *= 0.8;
      }

      // Boost based on document type preferences
      if (context?.userProfile?.preferences?.documentTypes) {
        const preferredTypes = context.userProfile.preferences.documentTypes;
        if (preferredTypes.includes(result.document.documentType)) {
          adjustedScore *= 1.15;
        }
      }

      // Boost based on language preference
      if (context?.language && result.document.metadata?.language === context.language) {
        adjustedScore *= 1.1;
      }

      // Boost high-authority sources
      if (result.document.metadata?.author || result.document.metadata?.source) {
        adjustedScore *= 1.05;
      }

      // Penalize very short or very long documents
      const wordCount = result.document.metadata?.wordCount || 0;
      if (wordCount < 50) {
        adjustedScore *= 0.7;
      } else if (wordCount > 10000) {
        adjustedScore *= 0.9;
      }

      return {
        ...result,
        relevanceScore: adjustedScore
      };
    });

    // Sort by adjusted relevance score
    rerankedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply diversity boost if enabled
    // This ensures we don't have too many results from the same source
    const diversifiedResults = this.applyDiversityBoost(rerankedResults);

    return diversifiedResults;
  }

  private applyDiversityBoost(results: SearchResult[]): SearchResult[] {
    const maxPerSource = 2; // Maximum results per knowledge base
    const sourceCount: Record<string, number> = {};
    const diversifiedResults: SearchResult[] = [];

    for (const result of results) {
      const sourceId = result.document.knowledgeBaseId;
      const currentCount = sourceCount[sourceId] || 0;

      if (currentCount < maxPerSource) {
        diversifiedResults.push(result);
        sourceCount[sourceId] = currentCount + 1;
      }
    }

    return diversifiedResults;
  }

  private async assembleContext(
    results: SearchResult[],
    contextWindow: number,
    ragContext?: RAGContext
  ): Promise<AssembledContext> {
    console.log('🧩 Assembling context from retrieved chunks...');

    const chunks: ContextChunk[] = [];
    let totalTokens = 0;
    const sources = new Set<string>();
    const languages = new Set<string>();
    let earliestDate = new Date();
    let latestDate = new Date(0);

    // Reserve tokens for the response
    const reservedTokens = 1000;
    const availableTokens = contextWindow - reservedTokens;

    for (let i = 0; i < results.length && totalTokens < availableTokens; i++) {
      const result = results[i];
      const chunks_parts = result.matchedChunks || [result.document.content];

      for (const chunkContent of chunks_parts) {
        const tokenCount = this.estimateTokenCount(chunkContent);
        
        if (totalTokens + tokenCount <= availableTokens) {
          const chunk: ContextChunk = {
            id: crypto.randomUUID(),
            content: chunkContent,
            source: result.document.title,
            relevanceScore: result.relevanceScore,
            position: chunks.length,
            tokenCount,
            metadata: {
              documentId: result.document.id,
              documentType: result.document.documentType,
              knowledgeBaseId: result.document.knowledgeBaseId,
              matchType: result.matchType
            }
          };

          chunks.push(chunk);
          totalTokens += tokenCount;
          sources.add(result.document.knowledgeBaseId);
          
          if (result.document.metadata?.language) {
            languages.add(result.document.metadata.language);
          }

          // Track temporal span
          if (result.document.createdAt < earliestDate) {
            earliestDate = result.document.createdAt;
          }
          if (result.document.updatedAt > latestDate) {
            latestDate = result.document.updatedAt;
          }
        } else {
          break;
        }
      }
    }

    // Calculate context quality metrics
    const coherenceScore = this.calculateCoherenceScore(chunks);
    const coverage = this.calculateCoverage(chunks, ragContext?.query || '');
    const diversity = sources.size / Math.max(1, chunks.length);

    return {
      retrievedChunks: chunks,
      totalTokens,
      coherenceScore,
      coverage,
      diversity,
      timespan: { earliest: earliestDate, latest: latestDate },
      sources: Array.from(sources),
      languages: Array.from(languages)
    };
  }

  private async generateResponse(
    query: string,
    context: AssembledContext,
    ragContext?: RAGContext,
    options?: Required<RAGOptions>
  ): Promise<string> {
    console.log('✨ Generating RAG response...');

    // Build prompt with context
    const systemPrompt = this.buildSystemPrompt(options?.responseFormat || 'text');
    const contextPrompt = this.buildContextPrompt(context);
    const userPrompt = this.buildUserPrompt(query, ragContext);

    const fullPrompt = `${systemPrompt}\n\n${contextPrompt}\n\n${userPrompt}`;

    try {
      // In production, would call LLM API (OpenAI, Anthropic, etc.)
      const response = await this.callLLMAPI(fullPrompt, options);
      
      return response;
      
    } catch (error) {
      console.error('LLM API call failed:', error);
      
      // Fallback: Generate basic response from context
      return this.generateFallbackResponse(query, context);
    }
  }

  private buildSystemPrompt(responseFormat: string): string {
    const basePrompt = `You are a helpful AI assistant that provides accurate, well-sourced responses based on the given context. Always cite your sources and indicate when information is not available in the provided context.`;

    switch (responseFormat) {
      case 'json':
        return `${basePrompt} Respond in valid JSON format with 'answer' and 'sources' fields.`;
      case 'markdown':
        return `${basePrompt} Format your response in Markdown with proper headings and citations.`;
      case 'structured':
        return `${basePrompt} Structure your response with clear sections: Summary, Details, Sources, and Recommendations.`;
      default:
        return basePrompt;
    }
  }

  private buildContextPrompt(context: AssembledContext): string {
    let prompt = "## Context\n\n";
    
    context.retrievedChunks.forEach((chunk, index) => {
      prompt += `### Source ${index + 1}: ${chunk.source}\n`;
      prompt += `${chunk.content}\n\n`;
    });

    prompt += `## Context Metadata\n`;
    prompt += `- Total sources: ${context.sources.length}\n`;
    prompt += `- Time range: ${context.timespan.earliest.toDateString()} to ${context.timespan.latest.toDateString()}\n`;
    prompt += `- Languages: ${context.languages.join(', ')}\n`;
    prompt += `- Coherence score: ${context.coherenceScore.toFixed(2)}\n`;

    return prompt;
  }

  private buildUserPrompt(query: string, ragContext?: RAGContext): string {
    let prompt = `## Question\n${query}\n\n`;

    if (ragContext?.conversationHistory && ragContext.conversationHistory.length > 0) {
      prompt += "## Conversation Context\n";
      const recentHistory = ragContext.conversationHistory.slice(-3);
      recentHistory.forEach(turn => {
        prompt += `**${turn.role}**: ${turn.content}\n`;
      });
      prompt += "\n";
    }

    if (ragContext?.taskContext) {
      prompt += `## Task Context\n${ragContext.taskContext}\n\n`;
    }

    prompt += "Please provide a comprehensive answer based on the provided context. Include relevant citations and indicate if any information is missing or uncertain.";

    return prompt;
  }

  private async callLLMAPI(prompt: string, options?: Required<RAGOptions>): Promise<string> {
    // Mock LLM response for development
    // In production, would call actual LLM API
    
    const responses = [
      "Based on the provided context, I can help answer your question. The information from the retrieved sources indicates several key points that are relevant to your inquiry.",
      "According to the documentation and sources provided, there are multiple approaches to consider for your question.",
      "The context provides comprehensive information that directly addresses your query. Let me break down the key findings from the retrieved sources."
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return responses[Math.floor(Math.random() * responses.length)] + " [This is a mock response - in production, this would be generated by an actual LLM]";
  }

  private generateFallbackResponse(query: string, context: AssembledContext): string {
    let response = `Based on the available information from ${context.sources.length} sources, here's what I found:\n\n`;

    // Extract key information from chunks
    const keyPoints = context.retrievedChunks.slice(0, 3).map((chunk, index) => {
      const excerpt = chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : '');
      return `${index + 1}. From "${chunk.source}": ${excerpt}`;
    }).join('\n\n');

    response += keyPoints;
    response += `\n\nThis response is based on ${context.retrievedChunks.length} relevant chunks from your knowledge base. For more detailed information, please refer to the original sources.`;

    return response;
  }

  private createCitations(results: SearchResult[], style: string): SourceCitation[] {
    return results.map((result, index) => {
      const citation: SourceCitation = {
        id: result.document.id,
        title: result.document.title,
        content: result.highlightedContent || result.document.content.substring(0, 200),
        relevanceScore: result.relevanceScore,
        documentType: result.document.documentType,
        knowledgeBaseId: result.document.knowledgeBaseId,
        author: result.document.metadata?.author,
        publishedDate: result.document.createdAt,
        accessedDate: new Date(),
        citationText: this.formatCitation(result, index + 1, style)
      };

      return citation;
    });
  }

  private formatCitation(result: SearchResult, index: number, style: string): string {
    const doc = result.document;
    const author = doc.metadata?.author || 'Unknown';
    const title = doc.title;
    const date = doc.createdAt.toDateString();

    switch (style) {
      case 'inline':
        return `[${index}]`;
      case 'footnote':
        return `${index}. ${author}. "${title}". ${date}.`;
      case 'bibliography':
        return `${author} (${doc.createdAt.getFullYear()}). ${title}. Retrieved ${new Date().toDateString()}.`;
      default:
        return `Source ${index}: ${title}`;
    }
  }

  // Helper methods
  private validateRequest(request: RAGRequest): void {
    if (!request.query || request.query.trim().length === 0) {
      throw new Error('Query is required');
    }
    if (!request.userId) {
      throw new Error('User ID is required');
    }
  }

  private generateCacheKey(request: RAGRequest): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify({
        query: request.query,
        knowledgeBaseIds: request.knowledgeBaseIds,
        userId: request.userId,
        options: request.options
      }))
      .digest('hex');
  }

  private shouldBypassCache(request: RAGRequest): boolean {
    // Bypass cache for real-time queries or specific user preferences
    return request.options?.temporalRelevance === true || 
           request.context?.userProfile?.preferences?.bypassCache === true;
  }

  private estimateTokenCount(text: string): number {
    return Math.ceil(text.split(/\s+/).length * 0.75);
  }

  private estimateTokenUsage(query: string, response: string): number {
    return this.estimateTokenCount(query) + this.estimateTokenCount(response);
  }

  private getDocumentAge(createdAt: Date): number {
    return Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateCoherenceScore(chunks: ContextChunk[]): number {
    // Simple coherence calculation based on topic overlap
    if (chunks.length <= 1) return 1.0;

    let coherenceSum = 0;
    let comparisons = 0;

    for (let i = 0; i < chunks.length - 1; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        const similarity = this.calculateTextSimilarity(chunks[i].content, chunks[j].content);
        coherenceSum += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? coherenceSum / comparisons : 0;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private calculateCoverage(chunks: ContextChunk[], query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const chunkText = chunks.map(c => c.content.toLowerCase()).join(' ');
    
    const coveredTerms = queryTerms.filter(term => chunkText.includes(term));
    return coveredTerms.length / queryTerms.length;
  }

  private calculateConfidence(results: SearchResult[], context: AssembledContext): number {
    if (results.length === 0) return 0;

    const avgRelevance = results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length;
    const coherenceBonus = context.coherenceScore * 0.2;
    const coverageBonus = context.coverage * 0.3;

    return Math.min(1.0, avgRelevance + coherenceBonus + coverageBonus);
  }

  private async calculateQualityScore(
    query: string,
    response: string,
    context: AssembledContext,
    citations: SourceCitation[]
  ): Promise<number> {
    // Multi-factor quality assessment
    let score = 0;

    // Response completeness (0-0.3)
    const responseLength = response.length;
    const completenessScore = Math.min(0.3, responseLength / 1000 * 0.3);
    score += completenessScore;

    // Source quality (0-0.25)
    const avgSourceRelevance = citations.reduce((sum, c) => sum + c.relevanceScore, 0) / Math.max(1, citations.length);
    score += avgSourceRelevance * 0.25;

    // Context coherence (0-0.2)
    score += context.coherenceScore * 0.2;

    // Coverage (0-0.15)
    score += context.coverage * 0.15;

    // Citation quality (0-0.1)
    const citationScore = citations.length > 0 ? Math.min(0.1, citations.length / 5 * 0.1) : 0;
    score += citationScore;

    return Math.min(1.0, score);
  }

  private async generateSuggestions(
    query: string,
    context: AssembledContext,
    ragContext?: RAGContext
  ): Promise<string[]> {
    // Generate follow-up suggestions based on context
    const suggestions: string[] = [];

    // Topic-based suggestions
    const topics = this.extractTopics(context.retrievedChunks);
    topics.slice(0, 2).forEach(topic => {
      suggestions.push(`Tell me more about ${topic}`);
    });

    // Related questions
    suggestions.push(`How does this relate to ${ragContext?.domain || 'the broader context'}?`);
    suggestions.push('Can you provide specific examples?');
    suggestions.push('What are the key takeaways?');

    return suggestions.slice(0, 3);
  }

  private extractTopics(chunks: ContextChunk[]): string[] {
    // Simple topic extraction (in production, would use NLP)
    const allText = chunks.map(c => c.content).join(' ');
    const words = allText.toLowerCase().match(/\b\w{4,}\b/g) || [];
    
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    return Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private async generateRelatedQueries(query: string, context: AssembledContext): Promise<string[]> {
    const relatedQueries: string[] = [];
    
    // Simple related query generation
    const topics = this.extractTopics(context.retrievedChunks);
    topics.slice(0, 3).forEach(topic => {
      relatedQueries.push(`What is ${topic}?`);
      relatedQueries.push(`How to implement ${topic}?`);
    });

    return relatedQueries.slice(0, 5);
  }

  private updateConversationHistory(request: RAGRequest, response: RAGResponse): void {
    if (!request.sessionId) return;

    const sessionHistory = this.conversationSessions.get(request.sessionId) || [];
    
    sessionHistory.push({
      role: 'user',
      content: request.query,
      timestamp: new Date()
    });

    sessionHistory.push({
      role: 'assistant',
      content: response.response,
      timestamp: new Date(),
      metadata: { confidence: response.confidence, sources: response.sources.length }
    });

    // Keep only last 20 turns
    const trimmedHistory = sessionHistory.slice(-20);
    this.conversationSessions.set(request.sessionId, trimmedHistory);
  }

  private setupEventListeners(): void {
    this.knowledgeBaseSystem.on('documentAdded', () => {
      // Clear cache when documents are added
      this.queryCache.clear();
    });

    this.knowledgeBaseSystem.on('documentIndexed', () => {
      this.emit('indexUpdated');
    });
  }

  private startConversationCleanup(): void {
    // Clean up old conversation sessions
    setInterval(() => {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      
      for (const [sessionId, history] of this.conversationSessions) {
        const lastActivity = history[history.length - 1]?.timestamp.getTime() || 0;
        if (lastActivity < cutoffTime) {
          this.conversationSessions.delete(sessionId);
        }
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  private startMetricsCollection(): void {
    // Collect and store metrics for analysis
    setInterval(async () => {
      await this.collectMetrics();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async collectMetrics(): Promise<void> {
    const metrics = {
      activeQueries: this.queryCache.size,
      activeSessions: this.conversationSessions.size,
      timestamp: new Date()
    };

    // Store metrics in database
    try {
      const db = await this.databaseSystem.getDatabase();
      await db.execute(`
        INSERT INTO rag_metrics (
          active_queries, active_sessions, timestamp
        ) VALUES (?, ?, ?)
      `, [metrics.activeQueries, metrics.activeSessions, metrics.timestamp.toISOString()]);
    } catch (error) {
      console.warn('Failed to store RAG metrics:', error);
    }
  }

  private async logMetrics(request: RAGRequest, response: RAGResponse): Promise<void> {
    // Log detailed metrics for analysis
    const metrics = {
      queryId: crypto.randomUUID(),
      userId: request.userId,
      query: request.query,
      retrievalTime: response.metadata.retrievalTime,
      generationTime: response.metadata.generationTime,
      totalTime: response.metadata.totalTime,
      sourcesUsed: response.sources.length,
      qualityScore: response.qualityScore,
      confidence: response.confidence,
      strategy: response.metadata.strategy,
      timestamp: new Date()
    };

    this.emit('metricsLogged', metrics);
  }

  async getConversationHistory(sessionId: string): Promise<ConversationTurn[]> {
    return this.conversationSessions.get(sessionId) || [];
  }

  async clearConversationHistory(sessionId: string): Promise<void> {
    this.conversationSessions.delete(sessionId);
  }

  async getMetrics(): Promise<any> {
    return {
      cacheSize: this.queryCache.size,
      activeSessions: this.conversationSessions.size,
      totalQueries: 0, // Would track this in production
      averageResponseTime: 0, // Would calculate from logs
      qualityScore: 0 // Would calculate from user feedback
    };
  }

  async close(): Promise<void> {
    console.log('🔌 Closing RAG System...');
    
    this.queryCache.clear();
    this.conversationSessions.clear();
    this.isInitialized = false;
    
    this.emit('closed');
  }
}

// Factory function
export async function createRAGSystem(
  knowledgeBaseSystem: KnowledgeBaseSystem,
  vectorDatabase: VectorDatabase,
  databaseSystem: DatabaseSystem
): Promise<RAGSystem> {
  const ragSystem = new RAGSystem(knowledgeBaseSystem, vectorDatabase, databaseSystem);
  await ragSystem.initialize();
  return ragSystem;
}