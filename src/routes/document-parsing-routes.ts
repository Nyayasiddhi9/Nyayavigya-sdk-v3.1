import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import { documentParsingService } from '../services/document-parsing-service';
import fs from 'fs/promises';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, images, text, DOCX, XLSX, PPTX'));
    }
  }
});

// Upload and parse document
router.post('/documents/upload', upload.single('document'), async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const assistantId = req.body.assistantId ? parseInt(req.body.assistantId) : undefined;
    
    // Parse the document with original filename
    const result = await documentParsingService.parseDocument(
      req.file.path,
      userId,
      req.file.originalname, // Pass original filename
      assistantId
    );
    
    res.json({
      success: true,
      document: result,
      message: 'Document uploaded and parsed successfully',
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      error: 'Failed to upload and parse document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get user's documents
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const documents = await documentParsingService.getUserDocuments(userId, limit);
    
    res.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get single document
router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const documentId = parseInt(req.params.id);
    const document = await documentParsingService.getDocument(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (document.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Get document pages
router.get('/documents/:id/pages', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const documentId = parseInt(req.params.id);
    
    // Verify ownership
    const document = await documentParsingService.getDocument(documentId);
    if (!document || document.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const pages = await documentParsingService.getDocumentPages(documentId);
    
    res.json({
      success: true,
      pages,
      count: pages.length,
    });
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// Get extracted content
router.get('/documents/:id/content', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const documentId = parseInt(req.params.id);
    
    // Verify ownership
    const document = await documentParsingService.getDocument(documentId);
    if (!document || document.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const content = await documentParsingService.getExtractedContent(documentId);
    
    res.json({
      success: true,
      content,
      count: content.length,
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Chunk document for RAG
router.post('/documents/:id/chunk', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const documentId = parseInt(req.params.id);
    
    // Verify ownership
    const document = await documentParsingService.getDocument(documentId);
    if (!document || document.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const chunkSize = req.body.chunkSize || 1000;
    const overlap = req.body.overlap || 200;
    
    const chunks = await documentParsingService.chunkDocument(documentId, chunkSize, overlap);
    
    res.json({
      success: true,
      chunks,
      count: chunks.length,
    });
  } catch (error) {
    console.error('Chunk document error:', error);
    res.status(500).json({
      error: 'Failed to chunk document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get processing jobs
router.get('/documents/:id/jobs', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const documentId = parseInt(req.params.id);
    
    // Verify ownership
    const document = await documentParsingService.getDocument(documentId);
    if (!document || document.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const jobs = await documentParsingService.getProcessingJobs(documentId);
    
    res.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Delete document
router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const documentId = parseInt(req.params.id);
    
    const result = await documentParsingService.deleteDocument(documentId, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
