import { Router, Request, Response } from 'express';
import { ragService } from '../services/rag-service';
import { z } from 'zod';

const router = Router();

// ============================================================================
// RAG API ROUTES - Multimodal Retrieval Augmented Generation (Phase 6.2)
// ============================================================================

// Request schemas
const embedDocumentSchema = z.object({
  documentId: z.number().int().positive(),
});

const semanticSearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  assistantId: z.number().int().positive().optional(),
  documentId: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  minSimilarity: z.number().min(0).max(1).default(0.5),
  filters: z.object({
    documentType: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
  }).optional(),
});

const queryWithContextSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  assistantId: z.number().int().positive().optional(),
  documentId: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  includeContext: z.boolean().default(true),
});

// ==================== Embed Document Chunks ====================

/**
 * POST /api/rag/embed
 * Generate and store embeddings for all chunks of a document
 */
router.post('/embed', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { documentId } = embedDocumentSchema.parse(req.body);

    const embeddings = await ragService.embedDocumentChunks(documentId, userId);

    res.json({
      success: true,
      documentId,
      embeddingsCount: embeddings.length,
      embeddings: embeddings.map(e => ({
        id: e.id,
        chunkIndex: e.chunkIndex,
        dimensions: e.dimensions,
        model: e.model,
        provider: e.provider,
      })),
    });
  } catch (error) {
    console.error('Error embedding document:', error);
    const message = error instanceof Error ? error.message : 'Failed to embed document';
    res.status(500).json({ error: message });
  }
});

// ==================== Semantic Search ====================

/**
 * POST /api/rag/search
 * Perform semantic search across user's documents
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const searchRequest = semanticSearchSchema.parse(req.body);

    const results = await ragService.semanticSearch({
      ...searchRequest,
      userId,
    });

    res.json({
      success: true,
      query: searchRequest.query,
      results: results.map(r => ({
        id: r.id,
        text: r.text,
        similarity: r.similarity,
        documentId: r.documentId,
        documentType: r.documentType,
        sourceFileName: r.sourceFileName,
        chunkIndex: r.chunkIndex,
        metadata: r.metadata,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    const message = error instanceof Error ? error.message : 'Semantic search failed';
    res.status(500).json({ error: message });
  }
});

// ==================== Query with Context ====================

/**
 * POST /api/rag/query
 * Query with context assembly for AI assistant responses
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { query, assistantId, documentId, limit, includeContext } = queryWithContextSchema.parse(req.body);

    const result = await ragService.queryWithContext(query, userId, {
      assistantId,
      documentId,
      limit,
      includeContext,
    });

    res.json({
      success: true,
      query: result.query,
      enhancedPrompt: result.enhancedPrompt,
      context: {
        relevantChunks: result.context.relevantChunks.map(c => ({
          id: c.id,
          text: c.text,
          similarity: c.similarity,
          documentId: c.documentId,
          sourceFileName: c.sourceFileName,
          chunkIndex: c.chunkIndex,
        })),
        formattedContext: result.context.formattedContext,
        totalChunks: result.context.totalChunks,
        averageSimilarity: result.context.averageSimilarity,
        sources: result.context.sources,
      },
    });
  } catch (error) {
    console.error('Error querying with context:', error);
    const message = error instanceof Error ? error.message : 'Query failed';
    res.status(500).json({ error: message });
  }
});

// ==================== Get Document Embeddings ====================

/**
 * GET /api/rag/embeddings/:documentId
 * Get all embeddings for a specific document
 */
router.get('/embeddings/:documentId', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const documentId = parseInt(req.params.documentId);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const embeddings = await ragService.getDocumentEmbeddings(documentId, userId);

    res.json({
      success: true,
      documentId,
      embeddings: embeddings.map(e => ({
        id: e.id,
        text: e.text?.substring(0, 100) + '...', // Preview only
        chunkIndex: e.chunkIndex,
        dimensions: e.dimensions,
        model: e.model,
        provider: e.provider,
        wordCount: e.wordCount,
        createdAt: e.createdAt,
      })),
      count: embeddings.length,
    });
  } catch (error) {
    console.error('Error fetching embeddings:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch embeddings';
    res.status(500).json({ error: message });
  }
});

// ==================== Get User Embeddings ====================

/**
 * GET /api/rag/embeddings
 * Get recent embeddings for the current user
 */
router.get('/embeddings', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const embeddings = await ragService.getUserEmbeddings(userId, limit);

    res.json({
      success: true,
      embeddings: embeddings.map(e => ({
        id: e.id,
        documentId: e.documentId,
        text: e.text?.substring(0, 100) + '...', // Preview only
        chunkIndex: e.chunkIndex,
        dimensions: e.dimensions,
        model: e.model,
        provider: e.provider,
        documentType: e.documentType,
        sourceFileName: e.sourceFileName,
        createdAt: e.createdAt,
      })),
      count: embeddings.length,
    });
  } catch (error) {
    console.error('Error fetching user embeddings:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch embeddings';
    res.status(500).json({ error: message });
  }
});

// ==================== Delete Document Embeddings ====================

/**
 * DELETE /api/rag/embeddings/:documentId
 * Delete all embeddings for a specific document
 */
router.delete('/embeddings/:documentId', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const documentId = parseInt(req.params.documentId);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    await ragService.deleteDocumentEmbeddings(documentId, userId);

    res.json({
      success: true,
      message: 'Document embeddings deleted successfully',
      documentId,
    });
  } catch (error) {
    console.error('Error deleting embeddings:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete embeddings';
    res.status(500).json({ error: message });
  }
});

// ==================== Health Check ====================

/**
 * GET /api/rag/health
 * RAG system health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'healthy',
      service: 'RAG (Retrieval Augmented Generation)',
      features: {
        embedding: 'operational',
        semanticSearch: 'operational',
        contextAssembly: 'operational',
        vectorDatabase: 'pgvector',
      },
      providers: {
        embeddings: 'OpenAI text-embedding-3-small',
        vectorDB: 'PostgreSQL with pgvector',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
