/**
 * Knowledge Base API Routes for WAI SDK 9.0
 * RESTful API endpoints for all knowledge base operations
 * Features: Document management, search, RAG queries, analytics, monitoring
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { DatabaseSystem } from '../services/database-system';
import { DocumentProcessor } from '../services/document-processor';
import { VectorDatabase } from '../services/vector-database';
import { KnowledgeBaseSystem } from '../services/knowledge-base-system';
import { RAGSystem } from '../services/rag-system';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['personal', 'team', 'organization', 'public']).default('personal'),
  settings: z.object({
    enableVersioning: z.boolean().default(true),
    enableAutoIndexing: z.boolean().default(true),
    maxDocuments: z.number().min(1).max(100000).default(10000),
    allowedFileTypes: z.array(z.string()).default(['pdf', 'docx', 'txt', 'md', 'html'])
  }).optional()
});

const searchSchema = z.object({
  query: z.string().min(1),
  knowledgeBaseIds: z.array(z.string()).optional(),
  filters: z.object({
    documentTypes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }).optional(),
    language: z.string().optional(),
    minRelevanceScore: z.number().min(0).max(1).optional()
  }).optional(),
  options: z.object({
    maxResults: z.number().min(1).max(100).default(20),
    includeContent: z.boolean().default(true),
    enableSemanticSearch: z.boolean().default(true),
    enableHybridSearch: z.boolean().default(true)
  }).optional()
});

const ragQuerySchema = z.object({
  query: z.string().min(1),
  knowledgeBaseIds: z.array(z.string()).optional(),
  context: z.object({
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      timestamp: z.string().datetime()
    })).optional(),
    taskContext: z.string().optional(),
    domain: z.string().optional(),
    language: z.string().optional()
  }).optional(),
  options: z.object({
    maxSources: z.number().min(1).max(20).default(10),
    contextWindow: z.number().min(500).max(8000).default(4000),
    retrievalStrategy: z.enum(['semantic', 'keyword', 'hybrid', 'adaptive']).default('hybrid'),
    responseFormat: z.enum(['text', 'json', 'markdown', 'structured']).default('text'),
    citationStyle: z.enum(['inline', 'footnote', 'bibliography', 'none']).default('inline'),
    temperature: z.number().min(0).max(2).default(0.7)
  }).optional(),
  sessionId: z.string().optional()
});

// Configure multer for file uploads
const upload = multer({
  dest: './uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['pdf', 'docx', 'txt', 'md', 'html', 'json', 'csv'];
    const fileExtension = path.extname(file.originalname).substring(1).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExtension} not allowed`));
    }
  }
});

// Middleware for error handling
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware for authentication (placeholder)
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In production, implement proper JWT authentication
  const userId = req.headers['x-user-id'] as string || 'default-user';
  req.body.userId = userId;
  req.query.userId = userId;
  next();
};

// Service instances (initialized in main app)
let databaseSystem: DatabaseSystem;
let documentProcessor: DocumentProcessor;
let vectorDatabase: VectorDatabase;
let knowledgeBaseSystem: KnowledgeBaseSystem;
let ragSystem: RAGSystem;

// Initialize services
export async function initializeKnowledgeBaseAPI(services: {
  databaseSystem: DatabaseSystem;
  documentProcessor: DocumentProcessor;
  vectorDatabase: VectorDatabase;
  knowledgeBaseSystem: KnowledgeBaseSystem;
  ragSystem: RAGSystem;
}) {
  databaseSystem = services.databaseSystem;
  documentProcessor = services.documentProcessor;
  vectorDatabase = services.vectorDatabase;
  knowledgeBaseSystem = services.knowledgeBaseSystem;
  ragSystem = services.ragSystem;
}

// Health check endpoint
router.get('/health', asyncHandler(async (req: express.Request, res: express.Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await databaseSystem.getHealth(),
      knowledgeBase: knowledgeBaseSystem ? 'available' : 'unavailable',
      vectorDatabase: vectorDatabase ? 'available' : 'unavailable',
      rag: ragSystem ? 'available' : 'unavailable'
    }
  };

  res.json(health);
}));

// Knowledge Base Management

// Create knowledge base
router.post('/knowledge-bases', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const validatedData = createKnowledgeBaseSchema.parse(req.body);
  
  const knowledgeBase = await knowledgeBaseSystem.createKnowledgeBase(validatedData.name, {
    description: validatedData.description,
    ownerId: req.body.userId,
    type: validatedData.type,
    settings: validatedData.settings
  });

  res.status(201).json({
    success: true,
    data: knowledgeBase,
    message: 'Knowledge base created successfully'
  });
}));

// List knowledge bases
router.get('/knowledge-bases', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const collections = await vectorDatabase.getCollections();
  
  res.json({
    success: true,
    data: collections,
    total: collections.length
  });
}));

// Get knowledge base details
router.get('/knowledge-bases/:id', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  
  const stats = await vectorDatabase.getCollectionStats(id);
  const collections = await vectorDatabase.getCollections();
  const collection = collections.find(c => c.id === id);
  
  if (!collection) {
    return res.status(404).json({
      success: false,
      message: 'Knowledge base not found'
    });
  }

  res.json({
    success: true,
    data: {
      ...collection,
      statistics: stats
    }
  });
}));

// Delete knowledge base
router.delete('/knowledge-bases/:id', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  
  await vectorDatabase.deleteCollection(id);
  
  res.json({
    success: true,
    message: 'Knowledge base deleted successfully'
  });
}));

// Document Management

// Upload documents
router.post('/knowledge-bases/:id/documents', authenticate, upload.array('files'), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id: knowledgeBaseId } = req.params;
  const files = req.files as Express.Multer.File[];
  const { tags, autoIndex = true } = req.body;
  
  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const results = [];
  
  for (const file of files) {
    try {
      const document = await knowledgeBaseSystem.addDocument(
        knowledgeBaseId,
        {
          path: file.path,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        },
        {
          userId: req.body.userId,
          tags: tags ? JSON.parse(tags) : [],
          autoIndex: autoIndex === 'true'
        }
      );

      results.push({
        success: true,
        document: {
          id: document.id,
          title: document.title,
          status: document.status,
          documentType: document.documentType
        }
      });

      // Clean up uploaded file
      await fs.unlink(file.path).catch(console.warn);
      
    } catch (error) {
      results.push({
        success: false,
        filename: file.originalname,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
      
      // Clean up uploaded file on error
      await fs.unlink(file.path).catch(console.warn);
    }
  }

  res.status(201).json({
    success: true,
    data: results,
    message: `Processed ${files.length} files`
  });
}));

// List documents in knowledge base
router.get('/knowledge-bases/:id/documents', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { page = 1, limit = 20, status, type } = req.query;
  
  const db = await databaseSystem.getDatabase();
  
  let query = 'SELECT * FROM kb_documents WHERE knowledge_base_id = ?';
  const params = [id];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status as string);
  }
  
  if (type) {
    query += ' AND document_type = ?';
    params.push(type as string);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  
  const documents = await db.execute(query, params);
  
  res.json({
    success: true,
    data: documents,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: documents.length
    }
  });
}));

// Get document details
router.get('/documents/:id', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  
  const db = await databaseSystem.getDatabase();
  const documents = await db.execute('SELECT * FROM kb_documents WHERE id = ?', [id]);
  
  if (documents.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  const document = documents[0];
  
  // Get document chunks
  const chunks = await db.execute('SELECT * FROM kb_document_chunks WHERE document_id = ? ORDER BY chunk_index', [id]);
  
  res.json({
    success: true,
    data: {
      ...document,
      chunks: chunks.length,
      metadata: JSON.parse(document.metadata || '{}')
    }
  });
}));

// Delete document
router.delete('/documents/:id', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  
  const db = await databaseSystem.getDatabase();
  
  // Get document info
  const documents = await db.execute('SELECT * FROM kb_documents WHERE id = ?', [id]);
  if (documents.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  const document = documents[0];
  
  // Delete embeddings from vector database
  const embeddings = await db.execute('SELECT id FROM kb_embeddings WHERE document_id = ?', [id]);
  const embeddingIds = embeddings.map((e: any) => e.id);
  
  if (embeddingIds.length > 0) {
    await vectorDatabase.deleteVectors(document.knowledge_base_id, embeddingIds);
  }
  
  // Delete from database
  await db.execute('DELETE FROM kb_documents WHERE id = ?', [id]);
  
  res.json({
    success: true,
    message: 'Document deleted successfully'
  });
}));

// Search and Retrieval

// Search documents
router.post('/search', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const validatedData = searchSchema.parse(req.body);
  
  const searchRequest = {
    ...validatedData,
    userId: req.body.userId
  };

  const searchResponse = await knowledgeBaseSystem.search(searchRequest);
  
  res.json({
    success: true,
    data: searchResponse
  });
}));

// RAG query endpoint
router.post('/query', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const validatedData = ragQuerySchema.parse(req.body);
  
  const ragRequest = {
    ...validatedData,
    userId: req.body.userId
  };

  const ragResponse = await ragSystem.query(ragRequest);
  
  res.json({
    success: true,
    data: ragResponse
  });
}));

// Get conversation history
router.get('/conversations/:sessionId', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { sessionId } = req.params;
  
  const history = await ragSystem.getConversationHistory(sessionId);
  
  res.json({
    success: true,
    data: history
  });
}));

// Clear conversation history
router.delete('/conversations/:sessionId', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { sessionId } = req.params;
  
  await ragSystem.clearConversationHistory(sessionId);
  
  res.json({
    success: true,
    message: 'Conversation history cleared'
  });
}));

// Vector Database Operations

// Create vector collection
router.post('/vector-collections', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { name, dimension = 1536, metric = 'cosine' } = req.body;
  
  const collection = await vectorDatabase.createCollection(name, {
    dimension,
    metric
  });
  
  res.status(201).json({
    success: true,
    data: collection
  });
}));

// List vector collections
router.get('/vector-collections', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const collections = await vectorDatabase.getCollections();
  
  res.json({
    success: true,
    data: collections
  });
}));

// Get collection statistics
router.get('/vector-collections/:id/stats', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  
  const stats = await vectorDatabase.getCollectionStats(id);
  
  res.json({
    success: true,
    data: stats
  });
}));

// Search vectors
router.post('/vector-collections/:id/search', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { text, topK = 10, includeMetadata = true } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Text query required'
    });
  }

  // Generate embedding for query
  const embeddingResponse = await vectorDatabase.generateEmbedding({
    text,
    model: 'openai-ada-002'
  });

  // Search vectors
  const results = await vectorDatabase.searchVectors(id, {
    vector: embeddingResponse.embedding,
    topK,
    includeMetadata
  });
  
  res.json({
    success: true,
    data: {
      query: text,
      results,
      embedding: {
        model: embeddingResponse.model,
        dimensions: embeddingResponse.dimensions,
        processingTime: embeddingResponse.processingTime
      }
    }
  });
}));

// Analytics and Monitoring

// Get system metrics
router.get('/metrics', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const dbMetrics = databaseSystem.getMetrics();
  const ragMetrics = await ragSystem.getMetrics();
  
  const systemMetrics = {
    database: dbMetrics,
    rag: ragMetrics,
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: systemMetrics
  });
}));

// Get database health
router.get('/metrics/database', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const health = await databaseSystem.healthCheck();
  
  res.json({
    success: true,
    data: health
  });
}));

// Get processing queue status
router.get('/metrics/processing', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const queueStatus = documentProcessor.getQueueStatus();
  
  res.json({
    success: true,
    data: queueStatus
  });
}));

// Bulk Operations

// Bulk upload documents
router.post('/knowledge-bases/:id/documents/bulk', authenticate, upload.array('files', 50), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id: knowledgeBaseId } = req.params;
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  // Add files to processing queue
  const queuedJobs = [];
  
  for (const file of files) {
    const processingRequest = {
      id: crypto.randomUUID(),
      filePath: file.path,
      fileName: file.originalname,
      fileType: path.extname(file.originalname).substring(1).toLowerCase() as any,
      options: {
        extractMetadata: true,
        generateChunks: true,
        chunkSize: 1000,
        chunkOverlap: 200
      }
    };

    await documentProcessor.addToQueue(processingRequest);
    queuedJobs.push({
      id: processingRequest.id,
      filename: file.originalname,
      status: 'queued'
    });
  }

  res.status(202).json({
    success: true,
    data: queuedJobs,
    message: `Queued ${files.length} files for processing`
  });
}));

// Reindex knowledge base
router.post('/knowledge-bases/:id/reindex', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  
  await vectorDatabase.reindex(id);
  
  res.json({
    success: true,
    message: 'Reindexing initiated'
  });
}));

// Error handling middleware
router.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors
    });
  }

  if (error.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }

  if (error.message.includes('unauthorized') || error.message.includes('permission')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default router;