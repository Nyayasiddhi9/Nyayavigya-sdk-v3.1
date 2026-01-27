/**
 * WAI Agent-as-API System v9.0 - Production Implementation
 * Offers Agent-as-API functionality with pre-integrated scrapers, web search, 
 * memory, databases, RAG, and MCP capabilities
 * 
 * Features:
 * - REST and WebSocket API endpoints for all agents
 * - Pre-integrated web scraping and search capabilities
 * - Advanced memory management with RAG
 * - Database integration and MCP protocol support
 * - Real-time agent orchestration via API
 */

import { EventEmitter } from 'events';
import { WAIUnifiedOrchestratorV9 } from '../orchestration/wai-unified-orchestrator-v9';
import { RealLLMServiceV9 } from '../services/real-llm-service-v9';

// ================================================================================================
// INTERFACES AND TYPES
// ================================================================================================

export interface AgentAPIRequest {
  agentId: string;
  method: 'execute' | 'query' | 'stream' | 'batch';
  payload: {
    task: string;
    context?: Record<string, any>;
    parameters?: Record<string, any>;
    requirements?: {
      quality: 'standard' | 'professional' | 'expert';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      budget: 'minimal' | 'balanced' | 'premium';
      responseTime: 'fastest' | 'balanced' | 'economical';
    };
  };
  integrations?: {
    webSearch?: boolean;
    scraping?: boolean;
    memory?: boolean;
    database?: boolean;
    rag?: boolean;
    mcp?: boolean;
  };
  metadata: {
    requestId: string;
    userId: string;
    sessionId?: string;
    timestamp: Date;
  };
}

export interface AgentAPIResponse {
  requestId: string;
  agentId: string;
  status: 'success' | 'error' | 'processing' | 'timeout';
  result?: {
    content: any;
    metadata: {
      agent: string;
      model: string;
      provider: string;
      processingTime: number;
      cost: number;
      qualityScore: number;
      confidence: number;
    };
    integrations?: {
      webSearch?: any[];
      scrapedData?: any[];
      memoryContext?: any[];
      databaseResults?: any[];
      ragResults?: any[];
      mcpResults?: any[];
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  streaming?: {
    isComplete: boolean;
    chunk: any;
    progress: number;
  };
  timestamp: Date;
}

export interface WebScrapingRequest {
  urls: string[];
  options: {
    extractText: boolean;
    extractLinks: boolean;
    extractImages: boolean;
    extractMetadata: boolean;
    followRedirects: boolean;
    timeout: number;
    userAgent?: string;
  };
}

export interface WebSearchRequest {
  query: string;
  options: {
    numResults: number;
    source: 'google' | 'bing' | 'duckduckgo' | 'perplexity' | 'all';
    searchType: 'web' | 'images' | 'news' | 'academic' | 'realtime';
    filters?: {
      language?: string;
      region?: string;
      timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year';
    };
  };
}

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

export interface MCPRequest {
  protocol: 'read' | 'write' | 'tool' | 'resource';
  target: string;
  operation: string;
  parameters: Record<string, any>;
}

// ================================================================================================
// AGENT-AS-API SYSTEM - PRODUCTION CLASS
// ================================================================================================

export class AgentAsAPISystem extends EventEmitter {
  public readonly version = '9.0.0';
  
  // Core Components
  private orchestrator: WAIUnifiedOrchestratorV9;
  private llmService: RealLLMServiceV9;
  
  // API Management
  private activeRequests: Map<string, AgentAPIRequest> = new Map();
  private streamingConnections: Map<string, any> = new Map();
  private rateLimits: Map<string, any> = new Map();
  
  // Integrated Services
  private webSearchService: WebSearchService;
  private scrapingService: WebScrapingService;
  private memoryService: MemoryService;
  private ragService: RAGService;
  private mcpService: MCPService;
  
  // Performance Tracking
  private apiMetrics: Map<string, any> = new Map();
  private agentPerformance: Map<string, any> = new Map();

  constructor(orchestrator: WAIUnifiedOrchestratorV9, llmService: RealLLMServiceV9) {
    super();
    
    this.orchestrator = orchestrator;
    this.llmService = llmService;
    
    // Initialize integrated services
    this.webSearchService = new WebSearchService();
    this.scrapingService = new WebScrapingService();
    this.memoryService = new MemoryService();
    this.ragService = new RAGService();
    this.mcpService = new MCPService();
    
    console.log('🌐 Agent-as-API System v9.0 initializing...');
    this.initializeServices();
  }

  // ================================================================================================
  // INITIALIZATION
  // ================================================================================================

  private async initializeServices(): Promise<void> {
    try {
      console.log('🔄 Initializing integrated services...');
      
      // Initialize all integrated services
      await Promise.all([
        this.webSearchService.initialize(),
        this.scrapingService.initialize(),
        this.memoryService.initialize(),
        this.ragService.initialize(),
        this.mcpService.initialize()
      ]);
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      console.log('✅ Agent-as-API System v9.0 initialized successfully');
      this.emit('system-ready', {
        version: this.version,
        services: ['web-search', 'scraping', 'memory', 'rag', 'mcp'],
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Agent-as-API System initialization failed:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    // Orchestrator events
    this.orchestrator.on('request-completed', (data) => {
      this.handleOrchestrationComplete(data);
    });
    
    this.orchestrator.on('request-failed', (data) => {
      this.handleOrchestrationFailed(data);
    });
    
    // LLM Service events
    this.llmService.on('request.completed', (data) => {
      this.updateAPIMetrics('llm-request', data);
    });
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 30000); // Every 30 seconds
  }

  // ================================================================================================
  // CORE API METHODS
  // ================================================================================================

  /**
   * Execute agent task via API
   */
  public async executeAgent(request: AgentAPIRequest): Promise<AgentAPIResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      this.validateAPIRequest(request);
      
      // Check rate limits
      await this.checkRateLimit(request.metadata.userId);
      
      // Store active request
      this.activeRequests.set(request.metadata.requestId, request);
      
      // Prepare integrations
      const integrationResults = await this.prepareIntegrations(request);
      
      // Execute agent via orchestrator
      const orchestrationRequest = this.buildOrchestrationRequest(request, integrationResults);
      const orchestrationResult = await this.orchestrator.execute(orchestrationRequest);
      
      // Process response
      const response = this.buildAPIResponse(request, orchestrationResult, integrationResults, startTime);
      
      // Clean up
      this.activeRequests.delete(request.metadata.requestId);
      
      // Update metrics
      this.updateAPIMetrics('agent-execution', {
        agentId: request.agentId,
        duration: Date.now() - startTime,
        success: true
      });
      
      return response;
      
    } catch (error) {
      // Clean up
      this.activeRequests.delete(request.metadata.requestId);
      
      // Update metrics
      this.updateAPIMetrics('agent-execution', {
        agentId: request.agentId,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        requestId: request.metadata.requestId,
        agentId: request.agentId,
        status: 'error',
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Stream agent responses in real-time
   */
  public async streamAgent(request: AgentAPIRequest, onChunk: (chunk: any) => void): Promise<void> {
    try {
      // Setup streaming connection
      const streamId = `stream_${request.metadata.requestId}`;
      this.streamingConnections.set(streamId, {
        request,
        onChunk,
        startTime: Date.now(),
        progress: 0
      });

      // Execute with streaming
      const orchestrationRequest = this.buildOrchestrationRequest(request, {});
      
      // Simulate streaming by chunking the response
      const result = await this.orchestrator.execute(orchestrationRequest);
      
      if (result.status === 'success' && result.result) {
        const content = String(result.result);
        const chunks = this.chunkContent(content, 100); // 100 char chunks
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = {
            content: chunks[i],
            progress: (i + 1) / chunks.length,
            isComplete: i === chunks.length - 1
          };
          
          onChunk({
            requestId: request.metadata.requestId,
            agentId: request.agentId,
            status: 'processing',
            streaming: chunk,
            timestamp: new Date()
          });
          
          // Small delay between chunks
          await this.delay(50);
        }
      }
      
      // Clean up
      this.streamingConnections.delete(streamId);
      
    } catch (error) {
      console.error('❌ Streaming failed:', error);
      onChunk({
        requestId: request.metadata.requestId,
        agentId: request.agentId,
        status: 'error',
        error: {
          code: 'STREAMING_ERROR',
          message: error instanceof Error ? error.message : 'Streaming failed'
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Execute batch of agent requests
   */
  public async executeBatch(requests: AgentAPIRequest[]): Promise<AgentAPIResponse[]> {
    const results: AgentAPIResponse[] = [];
    const maxConcurrent = 5; // Limit concurrent executions
    
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      const batchResults = await Promise.allSettled(
        batch.map(request => this.executeAgent(request))
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            requestId: 'unknown',
            agentId: 'unknown',
            status: 'error',
            error: {
              code: 'BATCH_ERROR',
              message: result.reason instanceof Error ? result.reason.message : 'Batch execution failed'
            },
            timestamp: new Date()
          });
        }
      }
    }
    
    return results;
  }

  // ================================================================================================
  // INTEGRATION SERVICES
  // ================================================================================================

  private async prepareIntegrations(request: AgentAPIRequest): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    if (!request.integrations) return results;
    
    try {
      // Web Search
      if (request.integrations.webSearch) {
        results.webSearch = await this.performWebSearch(request);
      }
      
      // Web Scraping
      if (request.integrations.scraping) {
        results.scraping = await this.performScraping(request);
      }
      
      // Memory Retrieval
      if (request.integrations.memory) {
        results.memory = await this.retrieveMemory(request);
      }
      
      // RAG Query
      if (request.integrations.rag) {
        results.rag = await this.performRAGQuery(request);
      }
      
      // MCP Operations
      if (request.integrations.mcp) {
        results.mcp = await this.performMCPOperation(request);
      }
      
    } catch (error) {
      console.error('❌ Integration preparation failed:', error);
    }
    
    return results;
  }

  private async performWebSearch(request: AgentAPIRequest): Promise<any[]> {
    const searchQuery = this.extractSearchQuery(request.payload.task);
    
    const searchRequest: WebSearchRequest = {
      query: searchQuery,
      options: {
        numResults: 10,
        source: 'all',
        searchType: 'web',
        filters: {
          timeframe: 'week'
        }
      }
    };
    
    return await this.webSearchService.search(searchRequest);
  }

  private async performScraping(request: AgentAPIRequest): Promise<any[]> {
    const urls = this.extractURLs(request.payload.context);
    
    if (urls.length === 0) return [];
    
    const scrapingRequest: WebScrapingRequest = {
      urls,
      options: {
        extractText: true,
        extractLinks: true,
        extractImages: false,
        extractMetadata: true,
        followRedirects: true,
        timeout: 30000
      }
    };
    
    return await this.scrapingService.scrape(scrapingRequest);
  }

  private async retrieveMemory(request: AgentAPIRequest): Promise<any[]> {
    const memoryRequest: MemoryRequest = {
      operation: 'search',
      query: {
        text: request.payload.task,
        filters: {
          userId: request.metadata.userId,
          sessionId: request.metadata.sessionId
        },
        limit: 10,
        similarity_threshold: 0.7
      }
    };
    
    return await this.memoryService.process(memoryRequest);
  }

  private async performRAGQuery(request: AgentAPIRequest): Promise<any[]> {
    const ragRequest: RAGRequest = {
      query: request.payload.task,
      options: {
        knowledgeBase: ['general', 'technical', 'business'],
        retrievalMode: 'hybrid',
        maxDocuments: 5,
        confidence_threshold: 0.6,
        includeMetadata: true,
        rerank: true
      }
    };
    
    return await this.ragService.query(ragRequest);
  }

  private async performMCPOperation(request: AgentAPIRequest): Promise<any[]> {
    const mcpRequest: MCPRequest = {
      protocol: 'read',
      target: 'system',
      operation: 'get_context',
      parameters: {
        task: request.payload.task,
        agentId: request.agentId
      }
    };
    
    return await this.mcpService.execute(mcpRequest);
  }

  // ================================================================================================
  // UTILITY METHODS
  // ================================================================================================

  private validateAPIRequest(request: AgentAPIRequest): void {
    if (!request.agentId) {
      throw new Error('Agent ID is required');
    }
    
    if (!request.payload || !request.payload.task) {
      throw new Error('Task payload is required');
    }
    
    if (!request.metadata || !request.metadata.requestId) {
      throw new Error('Request ID is required');
    }
    
    if (!request.metadata.userId) {
      throw new Error('User ID is required');
    }
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const limit = this.rateLimits.get(userId);
    
    if (limit && limit.requests >= limit.maxRequests) {
      const resetTime = limit.resetTime - Date.now();
      if (resetTime > 0) {
        throw new Error(`Rate limit exceeded. Resets in ${Math.ceil(resetTime / 1000)} seconds`);
      } else {
        // Reset the limit
        this.rateLimits.set(userId, {
          requests: 0,
          maxRequests: 1000,
          resetTime: Date.now() + 3600000 // 1 hour
        });
      }
    } else if (!limit) {
      this.rateLimits.set(userId, {
        requests: 0,
        maxRequests: 1000,
        resetTime: Date.now() + 3600000
      });
    }
    
    // Increment request count
    const currentLimit = this.rateLimits.get(userId)!;
    currentLimit.requests++;
  }

  private buildOrchestrationRequest(apiRequest: AgentAPIRequest, integrationResults: Record<string, any>): any {
    return {
      id: apiRequest.metadata.requestId,
      type: 'agent-execution',
      userId: apiRequest.metadata.userId,
      sessionId: apiRequest.metadata.sessionId,
      priority: apiRequest.payload.requirements?.priority || 'medium',
      requirements: {
        intelligence: apiRequest.payload.requirements?.quality === 'expert' ? 'expert' : 'professional',
        complexity: 'medium',
        domain: 'general',
        costBudget: apiRequest.payload.requirements?.budget || 'balanced',
        responseTime: apiRequest.payload.requirements?.responseTime || 'balanced',
        qualityLevel: apiRequest.payload.requirements?.quality || 'professional'
      },
      payload: {
        agentId: apiRequest.agentId,
        task: apiRequest.payload.task,
        context: {
          ...apiRequest.payload.context,
          integrations: integrationResults
        },
        parameters: apiRequest.payload.parameters
      },
      metadata: {
        timestamp: new Date(),
        correlationId: apiRequest.metadata.requestId,
        clientInfo: { source: 'agent-api' }
      }
    };
  }

  private buildAPIResponse(
    request: AgentAPIRequest,
    orchestrationResult: any,
    integrationResults: Record<string, any>,
    startTime: number
  ): AgentAPIResponse {
    if (orchestrationResult.status === 'success') {
      return {
        requestId: request.metadata.requestId,
        agentId: request.agentId,
        status: 'success',
        result: {
          content: orchestrationResult.result,
          metadata: {
            agent: request.agentId,
            model: orchestrationResult.metadata?.model || 'unknown',
            provider: orchestrationResult.metadata?.provider || 'unknown',
            processingTime: Date.now() - startTime,
            cost: orchestrationResult.metadata?.cost || 0,
            qualityScore: orchestrationResult.metadata?.qualityScore || 0,
            confidence: orchestrationResult.metadata?.confidence || 0
          },
          integrations: integrationResults
        },
        timestamp: new Date()
      };
    } else {
      return {
        requestId: request.metadata.requestId,
        agentId: request.agentId,
        status: 'error',
        error: {
          code: 'ORCHESTRATION_ERROR',
          message: orchestrationResult.errors?.[0] || 'Orchestration failed',
          details: orchestrationResult
        },
        timestamp: new Date()
      };
    }
  }

  private extractSearchQuery(task: string): string {
    // Extract meaningful search query from task
    return task.length > 100 ? task.substring(0, 100) + '...' : task;
  }

  private extractURLs(context: any): string[] {
    const urls: string[] = [];
    
    if (context && typeof context === 'object') {
      const contextStr = JSON.stringify(context);
      const urlRegex = /https?:\/\/[^\s"'<>]+/g;
      const matches = contextStr.match(urlRegex);
      
      if (matches) {
        urls.push(...matches);
      }
    }
    
    return urls;
  }

  private chunkContent(content: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }
    
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateAPIMetrics(type: string, data: any): void {
    const key = `${type}_${new Date().toISOString().slice(0, 13)}`; // Hour granularity
    
    if (!this.apiMetrics.has(key)) {
      this.apiMetrics.set(key, {
        requests: 0,
        successes: 0,
        failures: 0,
        totalDuration: 0,
        averageDuration: 0
      });
    }
    
    const metrics = this.apiMetrics.get(key)!;
    metrics.requests++;
    
    if (data.success) {
      metrics.successes++;
    } else {
      metrics.failures++;
    }
    
    if (data.duration) {
      metrics.totalDuration += data.duration;
      metrics.averageDuration = metrics.totalDuration / metrics.requests;
    }
  }

  private updatePerformanceMetrics(): void {
    // Update performance metrics for monitoring
    const activeRequestCount = this.activeRequests.size;
    const streamingConnectionCount = this.streamingConnections.size;
    
    this.emit('performance-update', {
      activeRequests: activeRequestCount,
      streamingConnections: streamingConnectionCount,
      rateLimitedUsers: this.rateLimits.size,
      timestamp: new Date()
    });
  }

  private handleOrchestrationComplete(data: any): void {
    // Handle orchestration completion for API requests
    this.emit('api-request-completed', data);
  }

  private handleOrchestrationFailed(data: any): void {
    // Handle orchestration failure for API requests
    this.emit('api-request-failed', data);
  }

  // ================================================================================================
  // PUBLIC API METHODS
  // ================================================================================================

  public getActiveRequests(): AgentAPIRequest[] {
    return Array.from(this.activeRequests.values());
  }

  public getStreamingConnections(): number {
    return this.streamingConnections.size;
  }

  public getAPIMetrics(): Record<string, any> {
    return Object.fromEntries(this.apiMetrics);
  }

  public getAvailableAgents(): string[] {
    const agents = this.orchestrator.getAgents();
    return Array.from(agents.keys());
  }

  public updateRateLimit(userId: string, maxRequests: number): void {
    this.rateLimits.set(userId, {
      requests: 0,
      maxRequests,
      resetTime: Date.now() + 3600000
    });
  }

  public async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Agent-as-API System...');
    
    // Shutdown all services
    await Promise.all([
      this.webSearchService.shutdown(),
      this.scrapingService.shutdown(),
      this.memoryService.shutdown(),
      this.ragService.shutdown(),
      this.mcpService.shutdown()
    ]);
    
    this.removeAllListeners();
    console.log('✅ Agent-as-API System shutdown complete');
  }
}

// Import real service implementations
import { WebSearchService } from './services/web-search-service';
import { WebScrapingService } from './services/web-scraping-service';
import { MemoryService } from './services/memory-service';
import { RAGService } from './services/rag-service';
import { MCPService } from './services/mcp-service';

export default AgentAsAPISystem;