import { db } from '../db';
import {
  documentParsing,
  documentPages,
  documentExtractedContent,
  documentProcessingJobs,
  type InsertDocumentParsing,
  type InsertDocumentPage,
  type InsertDocumentExtractedContent,
  type InsertDocumentProcessingJob,
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export class DocumentParsingService {
  
  // ==================== PDF Parsing ====================
  
  async parsePDF(filePath: string, userId: string, originalFilename: string, assistantId?: number): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Read PDF file
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse PDF
      const pdfData = await pdfParse(dataBuffer);
      
      // Get file stats
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      
      // Create document record
      const [document] = await db.insert(documentParsing).values({
        userId,
        assistantId,
        fileName,
        originalFileName: originalFilename,
        filePath,
        fileSize: stats.size,
        mimeType: 'application/pdf',
        documentType: 'pdf',
        status: 'processing',
        processingStartedAt: new Date(),
        pageCount: pdfData.numpages,
        extractedText: pdfData.text,
        wordCount: pdfData.text.split(/\s+/).length,
        characterCount: pdfData.text.length,
        textExtractionMethod: 'native',
        title: pdfData.info?.Title || originalFilename,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
        keywords: pdfData.info?.Keywords ? [pdfData.info.Keywords] : [],
        metadata: pdfData.info || {},
      }).returning();
      
      // Create document_pages entries (one page with full text for now - can be enhanced later)
      await db.insert(documentPages).values({
        documentId: document.id,
        pageNumber: 1,
        text: pdfData.text,
        rawText: pdfData.text,
      });
      
      const processingDuration = Date.now() - startTime;
      
      // Update with completion status
      await db.update(documentParsing)
        .set({
          status: 'completed',
          processingCompletedAt: new Date(),
          processingDuration,
        })
        .where(eq(documentParsing.id, document.id));
      
      return {
        ...document,
        originalFileName: originalFilename,
        status: 'completed',
        processingDuration,
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw error;
    }
  }
  
  // ==================== Image OCR (Tesseract) ====================
  
  async parseImage(filePath: string, userId: string, originalFilename: string, assistantId?: number): Promise<any> {
    const startTime = Date.now();
    
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();
      
      // Determine MIME type
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
      };
      
      const mimeType = mimeTypes[ext] || 'image/jpeg';
      
      // Create document record - keep status as 'processing' until OCR job completes
      const [document] = await db.insert(documentParsing).values({
        userId,
        assistantId,
        fileName,
        originalFileName: originalFilename,
        filePath,
        fileSize: stats.size,
        mimeType,
        documentType: 'image',
        status: 'processing',
        processingStartedAt: new Date(),
        pageCount: 1,
        ocrEnabled: true,
        ocrProvider: 'tesseract',
        textExtractionMethod: 'ocr',
        hasImages: true,
        imageCount: 1,
      }).returning();
      
      // OCR will be done asynchronously - create a job for it
      await db.insert(documentProcessingJobs).values({
        documentId: document.id,
        userId,
        jobType: 'ocr',
        status: 'pending',
        totalSteps: 1,
        settings: {
          provider: 'tesseract',
          languages: ['eng'],
        },
      });
      
      // Keep status as 'processing' - OCR job will update to 'completed' when done
      return {
        ...document,
        originalFileName: originalFilename,
        status: 'processing',
        message: 'OCR job queued - document will be updated when processing completes',
      };
    } catch (error) {
      console.error('Image parsing error:', error);
      throw error;
    }
  }
  
  // ==================== Text Document Parsing ====================
  
  async parseTextDocument(filePath: string, userId: string, originalFilename: string, assistantId?: number): Promise<any> {
    const startTime = Date.now();
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      
      const [document] = await db.insert(documentParsing).values({
        userId,
        assistantId,
        fileName,
        originalFileName: originalFilename,
        filePath,
        fileSize: stats.size,
        mimeType: 'text/plain',
        documentType: 'txt',
        status: 'processing',
        processingStartedAt: new Date(),
        pageCount: 1,
        extractedText: content,
        wordCount: content.split(/\s+/).length,
        characterCount: content.length,
        textExtractionMethod: 'native',
      }).returning();
      
      const processingDuration = Date.now() - startTime;
      
      await db.update(documentParsing)
        .set({
          status: 'completed',
          processingCompletedAt: new Date(),
          processingDuration,
        })
        .where(eq(documentParsing.id, document.id));
      
      return {
        ...document,
        status: 'completed',
        processingDuration,
      };
    } catch (error) {
      console.error('Text parsing error:', error);
      throw error;
    }
  }
  
  // ==================== Office Document Parsing (Placeholder) ====================
  
  async parseOfficeDocument(filePath: string, userId: string, originalFilename: string, assistantId?: number, docType: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      
      const mimeTypes: Record<string, string> = {
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };
      
      const [document] = await db.insert(documentParsing).values({
        userId,
        assistantId,
        fileName,
        originalFileName: originalFilename,
        filePath,
        fileSize: stats.size,
        mimeType: mimeTypes[docType] || 'application/octet-stream',
        documentType: docType,
        status: 'processing',
        processingStartedAt: new Date(),
      }).returning();
      
      // Create processing job for office document
      await db.insert(documentProcessingJobs).values({
        documentId: document.id,
        userId,
        jobType: 'parse',
        status: 'pending',
        totalSteps: 1,
        settings: {
          documentType: docType,
        },
      });
      
      // Keep status as 'processing' - job worker will update to 'completed' when done
      return {
        ...document,
        originalFileName: originalFilename,
        status: 'processing',
        message: `${docType.toUpperCase()} parsing job queued - document will be updated when processing completes`,
      };
    } catch (error) {
      console.error('Office document parsing error:', error);
      throw error;
    }
  }
  
  // ==================== Unified Parse Method ====================
  
  async parseDocument(filePath: string, userId: string, originalFilename: string, assistantId?: number): Promise<any> {
    const ext = path.extname(filePath).toLowerCase();
    
    // Route to appropriate parser based on file type
    if (ext === '.pdf') {
      return this.parsePDF(filePath, userId, originalFilename, assistantId);
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
      return this.parseImage(filePath, userId, originalFilename, assistantId);
    } else if (ext === '.txt' || ext === '.md') {
      return this.parseTextDocument(filePath, userId, originalFilename, assistantId);
    } else if (ext === '.docx') {
      return this.parseOfficeDocument(filePath, userId, originalFilename, assistantId, 'docx');
    } else if (ext === '.xlsx') {
      return this.parseOfficeDocument(filePath, userId, originalFilename, assistantId, 'xlsx');
    } else if (ext === '.pptx') {
      return this.parseOfficeDocument(filePath, userId, originalFilename, assistantId, 'pptx');
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }
  
  // ==================== Document Chunking for RAG ====================
  
  async chunkDocument(documentId: number, chunkSize: number = 1000, overlap: number = 200): Promise<any[]> {
    // Validate chunking parameters to prevent infinite loops
    if (chunkSize <= 0) {
      throw new Error('chunkSize must be greater than 0');
    }
    if (overlap < 0) {
      throw new Error('overlap must be non-negative');
    }
    if (overlap >= chunkSize) {
      // Clamp overlap to be less than chunkSize
      overlap = Math.floor(chunkSize * 0.5); // Set to 50% of chunkSize as safe default
    }
    
    // Get document
    const document = await db.query.documentParsing.findFirst({
      where: eq(documentParsing.id, documentId),
    });
    
    if (!document || !document.extractedText) {
      throw new Error('Document not found or has no text');
    }
    
    const text = document.extractedText;
    const chunks: string[] = [];
    
    // Safe chunking algorithm with guards against infinite loops
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.substring(start, end));
      
      // Guard against negative or non-advancing start values
      const nextStart = Math.max(start + 1, end - overlap); // Ensure we always advance at least 1 position
      if (nextStart <= start) break; // Safety check to prevent infinite loop
      
      start = nextStart;
      if (start >= text.length) break;
    }
    
    // Save chunks to database
    const chunkRecords = chunks.map((chunk, index) => ({
      documentId,
      contentIndex: index,
      text: chunk,
      contentType: 'text' as const,
      startPosition: index * (chunkSize - overlap),
      endPosition: Math.min((index + 1) * chunkSize - (index > 0 ? overlap : 0), text.length),
      wordCount: chunk.split(/\s+/).length,
      characterCount: chunk.length,
    }));
    
    // Insert chunks into document_extracted_content table
    await db.insert(documentExtractedContent).values(chunkRecords);
    
    // Update document with chunk info
    await db.update(documentParsing)
      .set({
        chunked: true,
        chunkCount: chunks.length,
      })
      .where(eq(documentParsing.id, documentId));
    
    return chunkRecords;
  }
  
  // ==================== Query Methods ====================
  
  async getDocument(documentId: number) {
    return db.query.documentParsing.findFirst({
      where: eq(documentParsing.id, documentId),
    });
  }
  
  async getUserDocuments(userId: string, limit: number = 50) {
    return db.query.documentParsing.findMany({
      where: eq(documentParsing.userId, userId),
      orderBy: [desc(documentParsing.createdAt)],
      limit,
    });
  }
  
  async getDocumentPages(documentId: number) {
    return db.query.documentPages.findMany({
      where: eq(documentPages.documentId, documentId),
      orderBy: [documentPages.pageNumber],
    });
  }
  
  async getExtractedContent(documentId: number) {
    return db.query.documentExtractedContent.findMany({
      where: eq(documentExtractedContent.documentId, documentId),
      orderBy: [documentExtractedContent.contentIndex],
    });
  }
  
  async getProcessingJobs(documentId: number) {
    return db.query.documentProcessingJobs.findMany({
      where: eq(documentProcessingJobs.documentId, documentId),
      orderBy: [desc(documentProcessingJobs.createdAt)],
    });
  }
  
  // ==================== Delete Methods ====================
  
  async deleteDocument(documentId: number, userId: string) {
    // Verify ownership
    const document = await db.query.documentParsing.findFirst({
      where: and(
        eq(documentParsing.id, documentId),
        eq(documentParsing.userId, userId)
      ),
    });
    
    if (!document) {
      throw new Error('Document not found or unauthorized');
    }
    
    // Delete file from filesystem
    try {
      await fs.unlink(document.filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
    
    // Delete from database (cascade will handle related records)
    await db.delete(documentParsing)
      .where(eq(documentParsing.id, documentId));
    
    return { success: true };
  }
}

export const documentParsingService = new DocumentParsingService();
