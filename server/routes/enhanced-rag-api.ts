import express, { type Request, type Response } from "express";
import { enhancedRAGSystem, type SemanticSearchRequest } from "../services/enhanced-rag-knowledge-system";
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Configure multer for document uploads
const upload = multer({
  dest: '/tmp/rag-uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain', 'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'audio/mpeg', 'audio/wav', 'video/mp4', 'video/avi'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported: PDF, DOC, DOCX, TXT, Images, Audio, Video.'));
    }
  }
});

/**
 * POST /api/rag/knowledge-bases
 * Create a new knowledge base
 */
router.post('/knowledge-bases', async (req: Request, res: Response) => {
  try {
    const { name, type = 'multimodal', description, tags } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Knowledge base name is required'
      });
    }

    const id = await enhancedRAGSystem.createKnowledgeBase(name, type, { description, tags });

    res.json({
      success: true,
      data: {
        id,
        name,
        type,
        description,
        tags
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create knowledge base'
    });
  }
});

/**
 * GET /api/rag/knowledge-bases
 * List all knowledge bases
 */
router.get('/knowledge-bases', async (req: Request, res: Response) => {
  try {
    const knowledgeBases = enhancedRAGSystem.listKnowledgeBases();

    res.json({
      success: true,
      data: knowledgeBases
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list knowledge bases'
    });
  }
});

/**
 * GET /api/rag/knowledge-bases/:id
 * Get specific knowledge base details
 */
router.get('/knowledge-bases/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const knowledgeBase = enhancedRAGSystem.getKnowledgeBase(id);

    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge base not found'
      });
    }

    res.json({
      success: true,
      data: knowledgeBase
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get knowledge base'
    });
  }
});

/**
 * POST /api/rag/knowledge-bases/:id/documents
 * Add document to knowledge base
 */
router.post('/knowledge-bases/:id/documents', upload.single('document'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, author, tags, language } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file provided'
      });
    }

    const metadata = {
      title: title || req.file.originalname,
      author,
      tags: tags ? (typeof tags === 'string' ? tags.split(',') : tags) : [],
      language: language || 'en'
    };

    const result = await enhancedRAGSystem.addDocument(id, req.file.path, metadata);

    // Clean up uploaded file
    await fs.unlink(req.file.path).catch(() => {});

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add document'
    });
  }
});

/**
 * POST /api/rag/search
 * Perform semantic search across knowledge bases
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const searchRequest: SemanticSearchRequest = req.body;

    if (!searchRequest.query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const results = await enhancedRAGSystem.semanticSearch(searchRequest);

    res.json({
      success: true,
      data: {
        query: searchRequest.query,
        results,
        total: results.length,
        searchTime: Date.now()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    });
  }
});

/**
 * POST /api/rag/batch-documents
 * Add multiple documents to knowledge base
 */
router.post('/knowledge-bases/:id/batch-documents', upload.array('documents', 10), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No document files provided'
      });
    }

    const results = [];

    for (const file of files) {
      try {
        const metadata = {
          title: file.originalname,
          tags: [],
          language: 'en'
        };

        const result = await enhancedRAGSystem.addDocument(id, file.path, metadata);
        results.push(result);

        // Clean up file
        await fs.unlink(file.path).catch(() => {});

      } catch (error) {
        results.push({
          success: false,
          documentId: '',
          chunks: 0,
          embeddings: 0,
          entities: 0,
          relations: 0,
          processingTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Clean up file on error
        await fs.unlink(file.path).catch(() => {});
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: successCount > 0,
      data: {
        results,
        total: files.length,
        successful: successCount,
        failed: files.length - successCount
      }
    });

  } catch (error) {
    // Clean up all uploaded files on error
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      await Promise.all(files.map(file => 
        fs.unlink(file.path).catch(() => {})
      ));
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch document processing failed'
    });
  }
});

/**
 * GET /api/rag/knowledge-graph
 * Get knowledge graph data
 */
router.get('/knowledge-graph', async (req: Request, res: Response) => {
  try {
    const knowledgeGraph = enhancedRAGSystem.getKnowledgeGraph();

    res.json({
      success: true,
      data: knowledgeGraph
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get knowledge graph'
    });
  }
});

/**
 * GET /api/rag/stats
 * Get RAG system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = enhancedRAGSystem.getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats'
    });
  }
});

/**
 * GET /api/rag/capabilities
 * Get RAG system capabilities
 */
router.get('/capabilities', async (req: Request, res: Response) => {
  try {
    const capabilities = {
      multiModalSupport: {
        text: ['txt', 'pdf', 'doc', 'docx'],
        images: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        audio: ['mp3', 'wav'],
        video: ['mp4', 'avi']
      },
      searchFeatures: {
        semanticSearch: true,
        vectorSearch: true,
        contextualReranking: true,
        knowledgeGraph: true,
        realTimeUpdates: true
      },
      processing: {
        ocrExtraction: true,
        audioTranscription: true,
        videoAnalysis: true,
        entityExtraction: true,
        relationshipMapping: true
      },
      limits: {
        maxFileSize: '50MB',
        maxDocumentsPerKB: 10000,
        maxKnowledgeBases: 100,
        batchUploadLimit: 10
      },
      performance: {
        searchResponseTime: '<200ms',
        documentProcessingTime: '<30s',
        cacheSupport: true,
        realTimeIndexing: true
      }
    };

    res.json({
      success: true,
      data: capabilities
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get capabilities'
    });
  }
});

/**
 * GET /api/rag/docs
 * API documentation
 */
router.get('/docs', async (req: Request, res: Response) => {
  try {
    const documentation = {
      title: 'Enhanced RAG & Knowledge Systems API Documentation',
      version: '2.0.0',
      baseUrl: '/api/rag',
      description: 'Advanced multi-modal RAG system with knowledge graph integration',
      endpoints: [
        {
          method: 'POST',
          path: '/knowledge-bases',
          description: 'Create a new knowledge base',
          parameters: {
            name: 'string (required) - Knowledge base name',
            type: 'string - Type: text|multimodal|dynamic',
            description: 'string - Optional description',
            tags: 'array - Optional tags'
          }
        },
        {
          method: 'GET',
          path: '/knowledge-bases',
          description: 'List all knowledge bases',
          parameters: 'None'
        },
        {
          method: 'POST',
          path: '/knowledge-bases/:id/documents',
          description: 'Add document to knowledge base',
          parameters: {
            document: 'File upload (required)',
            title: 'string - Document title',
            author: 'string - Document author',
            tags: 'string/array - Document tags',
            language: 'string - Document language'
          }
        },
        {
          method: 'POST',
          path: '/search',
          description: 'Perform semantic search',
          parameters: {
            query: 'string (required) - Search query',
            knowledgeBaseId: 'string - Specific KB to search',
            filters: 'object - Search filters',
            options: 'object - Search options'
          }
        },
        {
          method: 'GET',
          path: '/knowledge-graph',
          description: 'Get knowledge graph data',
          parameters: 'None'
        },
        {
          method: 'GET',
          path: '/stats',
          description: 'Get system statistics',
          parameters: 'None'
        }
      ],
      examples: {
        createKnowledgeBase: {
          name: 'Product Documentation',
          type: 'multimodal',
          description: 'Knowledge base for product manuals and guides',
          tags: ['documentation', 'products', 'support']
        },
        search: {
          query: 'How to install the software?',
          knowledgeBaseId: 'kb-123',
          filters: {
            documentTypes: ['pdf', 'text'],
            tags: ['installation', 'setup'],
            language: 'en'
          },
          options: {
            maxResults: 10,
            threshold: 0.7,
            includeMetadata: true,
            contextualReranking: true
          }
        }
      }
    };

    res.json({
      success: true,
      data: documentation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get documentation'
    });
  }
});

export default router;