import { db } from '../db';
import { documentEmbeddings, documentExtractedContent, documentParsing } from '@shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { embeddingService } from './embedding-service';
import crypto from 'crypto';

/**
 * RAG Service - Multimodal Retrieval Augmented Generation (Phase 6.2)
 * Integrates document parsing with vector embeddings for semantic search
 */

export interface SemanticSearchRequest {
  query: string;
  userId: string;
  assistantId?: number;
  documentId?: number;
  limit?: number;
  minSimilarity?: number;
  filters?: {
    documentType?: string;
    tags?: string[];
    dateRange?: { start: Date; end: Date };
  };
}

export interface SemanticSearchResult {
  id: number;
  text: string;
  similarity: number;
  documentId: number;
  documentType?: string;
  sourceFileName?: string;
  chunkIndex?: number;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface ContextAssembly {
  relevantChunks: SemanticSearchResult[];
  formattedContext: string;
  totalChunks: number;
  averageSimilarity: number;
  sources: Array<{
    documentId: number;
    fileName: string;
    chunkCount: number;
  }>;
}

export class RAGService {
  // ==================== Create Text Hash for Deduplication ====================

  private createTextHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
  }

  // ==================== Embed Document Chunks ====================

  async embedDocumentChunks(documentId: number, userId: string): Promise<any[]> {
    // Get document info first to verify ownership
    const document = await db.query.documentParsing.findFirst({
      where: eq(documentParsing.id, documentId),
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Verify ownership
    if (document.userId !== userId) {
      throw new Error('Unauthorized: Document does not belong to user');
    }

    // Get all chunks for this document
    const chunks = await db.query.documentExtractedContent.findMany({
      where: eq(documentExtractedContent.documentId, documentId),
    });

    if (chunks.length === 0) {
      throw new Error('No chunks found for document');
    }

    // Filter valid chunks and track mapping
    const validChunks = chunks
      .map((chunk, originalIndex) => ({
        chunk,
        originalIndex,
        text: chunk.text || '',
      }))
      .filter(item => item.text.trim().length > 0);
    
    if (validChunks.length === 0) {
      throw new Error('No valid text found in chunks');
    }

    // Extract texts for batch embedding
    const texts = validChunks.map(item => item.text);

    // Generate embeddings using the existing embedding service
    const embeddingResponses = await embeddingService.generateBatchEmbeddings({
      texts,
      provider: 'openai',
      model: 'text-embedding-3-small',
    });

    // Store all embeddings with proper index alignment
    const stored = await Promise.all(
      validChunks.map(async ({ chunk, text }, validIndex) => {
        const textHash = this.createTextHash(text);

        // Check if already exists
        const existing = await db.query.documentEmbeddings.findFirst({
          where: and(
            eq(documentEmbeddings.documentId, documentId),
            eq(documentEmbeddings.textHash, textHash)
          ),
        });

        if (existing) {
          return existing;
        }

        const embeddingResponse = embeddingResponses.embeddings[validIndex];
        if (!embeddingResponse) {
          console.warn(`No embedding generated for chunk ${chunk.id} (valid index ${validIndex})`);
          return null;
        }

        // Store new embedding
        const [stored] = await db.insert(documentEmbeddings).values({
          documentId,
          chunkId: chunk.id,
          userId,
          assistantId: document.assistantId || undefined,
          text,
          textHash,
          embedding: embeddingResponse.embedding,
          model: embeddingResponse.model,
          provider: embeddingResponse.provider,
          dimensions: embeddingResponse.embedding.length,
          chunkIndex: chunk.contentIndex,
          startPosition: chunk.startPosition,
          endPosition: chunk.endPosition,
          wordCount: chunk.wordCount,
          characterCount: chunk.characterCount,
          documentType: document.documentType || undefined,
          sourceFileName: document.originalFileName || undefined,
          metadata: chunk.metadata || {},
          tags: [],
        }).returning();

        return stored;
      })
    );

    return stored.filter(Boolean);
  }

  // ==================== Semantic Search ====================

  async semanticSearch(request: SemanticSearchRequest): Promise<SemanticSearchResult[]> {
    // Generate embedding for query
    const queryEmbeddingResponse = await embeddingService.generateEmbedding({
      text: request.query,
      provider: 'openai',
      model: 'text-embedding-3-small',
    });

    const queryEmbedding = queryEmbeddingResponse.embedding;
    const limit = request.limit || 10;
    const minSimilarity = request.minSimilarity || 0.5;

    // Build WHERE clause
    let whereClause = eq(documentEmbeddings.userId, request.userId);

    if (request.assistantId) {
      whereClause = and(whereClause, eq(documentEmbeddings.assistantId, request.assistantId));
    }

    if (request.documentId) {
      whereClause = and(whereClause, eq(documentEmbeddings.documentId, request.documentId));
    }

    if (request.filters?.documentType) {
      whereClause = and(whereClause, eq(documentEmbeddings.documentType, request.filters.documentType));
    }

    // Perform cosine similarity search using pgvector
    const results = await db.execute<SemanticSearchResult>(sql`
      SELECT 
        id,
        text,
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity,
        document_id as "documentId",
        document_type as "documentType",
        source_file_name as "sourceFileName",
        chunk_index as "chunkIndex",
        metadata
      FROM document_embeddings
      WHERE user_id = ${request.userId}
        ${request.assistantId ? sql`AND assistant_id = ${request.assistantId}` : sql``}
        ${request.documentId ? sql`AND document_id = ${request.documentId}` : sql``}
        ${request.filters?.documentType ? sql`AND document_type = ${request.filters.documentType}` : sql``}
        AND (1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector)) >= ${minSimilarity}
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `);

    return results.rows as SemanticSearchResult[];
  }

  // ==================== Context Assembly for AI Prompts ====================

  async assembleContext(request: SemanticSearchRequest): Promise<ContextAssembly> {
    const relevantChunks = await this.semanticSearch(request);

    if (relevantChunks.length === 0) {
      return {
        relevantChunks: [],
        formattedContext: '',
        totalChunks: 0,
        averageSimilarity: 0,
        sources: [],
      };
    }

    // Calculate average similarity
    const totalSimilarity = relevantChunks.reduce((sum, chunk) => sum + chunk.similarity, 0);
    const averageSimilarity = totalSimilarity / relevantChunks.length;

    // Group by source document
    const sourceMap = new Map<number, { fileName: string; chunks: SemanticSearchResult[] }>();
    
    for (const chunk of relevantChunks) {
      if (!sourceMap.has(chunk.documentId)) {
        sourceMap.set(chunk.documentId, {
          fileName: chunk.sourceFileName || `Document ${chunk.documentId}`,
          chunks: [],
        });
      }
      sourceMap.get(chunk.documentId)!.chunks.push(chunk);
    }

    // Format context for AI prompt
    const contextParts: string[] = [];
    const sources: Array<{ documentId: number; fileName: string; chunkCount: number }> = [];

    for (const [documentId, { fileName, chunks }] of sourceMap.entries()) {
      contextParts.push(`\n[Source: ${fileName}]`);
      
      chunks.forEach((chunk, index) => {
        contextParts.push(`\n${index + 1}. ${chunk.text}`);
      });

      sources.push({
        documentId,
        fileName,
        chunkCount: chunks.length,
      });
    }

    const formattedContext = contextParts.join('\n');

    return {
      relevantChunks,
      formattedContext,
      totalChunks: relevantChunks.length,
      averageSimilarity,
      sources,
    };
  }

  // ==================== Query with Context ====================

  async queryWithContext(
    query: string,
    userId: string,
    options?: {
      assistantId?: number;
      documentId?: number;
      limit?: number;
      includeContext?: boolean;
    }
  ): Promise<{
    query: string;
    context: ContextAssembly;
    enhancedPrompt: string;
  }> {
    const context = await this.assembleContext({
      query,
      userId,
      assistantId: options?.assistantId,
      documentId: options?.documentId,
      limit: options?.limit,
    });

    // Create enhanced prompt with context
    const enhancedPrompt = options?.includeContext !== false && context.formattedContext
      ? `Context from relevant documents:\n${context.formattedContext}\n\nUser Question: ${query}\n\nPlease answer based on the provided context. If the context doesn't contain relevant information, say so.`
      : query;

    return {
      query,
      context,
      enhancedPrompt,
    };
  }

  // ==================== Get Embeddings ====================

  async getDocumentEmbeddings(documentId: number, userId: string) {
    // Verify document ownership
    const document = await db.query.documentParsing.findFirst({
      where: eq(documentParsing.id, documentId),
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.userId !== userId) {
      throw new Error('Unauthorized: Document does not belong to user');
    }

    return db.query.documentEmbeddings.findMany({
      where: eq(documentEmbeddings.documentId, documentId),
    });
  }

  async getUserEmbeddings(userId: string, limit: number = 100) {
    return db.query.documentEmbeddings.findMany({
      where: eq(documentEmbeddings.userId, userId),
      limit,
      orderBy: [desc(documentEmbeddings.createdAt)],
    });
  }

  // ==================== Delete Embeddings ====================

  async deleteDocumentEmbeddings(documentId: number, userId: string) {
    // Verify document ownership
    const document = await db.query.documentParsing.findFirst({
      where: eq(documentParsing.id, documentId),
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.userId !== userId) {
      throw new Error('Unauthorized: Document does not belong to user');
    }

    await db.delete(documentEmbeddings)
      .where(eq(documentEmbeddings.documentId, documentId));
  }

  async deleteUserEmbeddings(userId: string) {
    await db.delete(documentEmbeddings)
      .where(eq(documentEmbeddings.userId, userId));
  }
}

export const ragService = new RAGService();
