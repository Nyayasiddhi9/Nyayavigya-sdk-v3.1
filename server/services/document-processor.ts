/**
 * Document Processor Service for WAI SDK 9.0
 * Handles ingestion and processing of PDF, DOCX, TXT, MD, HTML, code files
 * Features: Metadata extraction, text chunking, preprocessing, optimization
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSystem } from './database-system';
import pdfParse from 'pdf-parse';
import { JSDOM } from 'jsdom';

export interface DocumentProcessingRequest {
  id: string;
  filePath: string;
  fileName: string;
  fileType: DocumentType;
  options?: DocumentProcessingOptions;
  metadata?: Record<string, any>;
}

export interface DocumentProcessingOptions {
  extractMetadata?: boolean;
  generateChunks?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
  preserveFormatting?: boolean;
  extractImages?: boolean;
  ocrEnabled?: boolean;
  languageDetection?: boolean;
  contentOptimization?: boolean;
}

export type DocumentType = 'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'json' | 'csv' | 'code' | 'rtf' | 'xml';

export interface ProcessedDocument {
  id: string;
  originalFileName: string;
  documentType: DocumentType;
  content: string;
  chunks: DocumentChunk[];
  metadata: DocumentMetadata;
  statistics: DocumentStatistics;
  processingTime: number;
  status: 'success' | 'failed' | 'partial';
  errors?: string[];
}

export interface DocumentChunk {
  id: string;
  index: number;
  content: string;
  tokens: number;
  characters: number;
  startPosition: number;
  endPosition: number;
  metadata: Record<string, any>;
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  fileType: DocumentType;
  mimeType: string;
  encoding: string;
  language: string;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount?: number;
  wordCount: number;
  characterCount: number;
  extractedImages?: string[];
  tags: string[];
  customMetadata: Record<string, any>;
}

export interface DocumentStatistics {
  totalCharacters: number;
  totalWords: number;
  totalSentences: number;
  totalParagraphs: number;
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
  readabilityScore: number;
  complexityScore: number;
  languageConfidence: number;
}

export class DocumentProcessor extends EventEmitter {
  private databaseSystem: DatabaseSystem;
  private processingQueue: Map<string, DocumentProcessingRequest> = new Map();
  private isProcessing = false;
  private concurrentLimit = 5;
  private activeProcessing = 0;

  private readonly defaultOptions: DocumentProcessingOptions = {
    extractMetadata: true,
    generateChunks: true,
    chunkSize: 1000,
    chunkOverlap: 200,
    preserveFormatting: false,
    extractImages: false,
    ocrEnabled: false,
    languageDetection: true,
    contentOptimization: true
  };

  constructor(databaseSystem: DatabaseSystem) {
    super();
    this.databaseSystem = databaseSystem;
  }

  async initialize(): Promise<void> {
    console.log('📄 Initializing Document Processor...');
    
    // Start processing queue
    this.startProcessingQueue();
    
    console.log('✅ Document Processor initialized');
  }

  async processDocument(request: DocumentProcessingRequest): Promise<ProcessedDocument> {
    const startTime = Date.now();
    console.log(`📝 Processing document: ${request.fileName}`);

    try {
      // Validate file
      await this.validateFile(request.filePath);
      
      // Extract content based on file type
      const content = await this.extractContent(request);
      
      // Extract metadata
      const metadata = await this.extractMetadata(request, content);
      
      // Generate chunks if requested
      const chunks = request.options?.generateChunks 
        ? await this.generateChunks(content, request.options)
        : [];
      
      // Calculate statistics
      const statistics = await this.calculateStatistics(content);
      
      // Create processed document
      const processedDocument: ProcessedDocument = {
        id: request.id,
        originalFileName: request.fileName,
        documentType: request.fileType,
        content,
        chunks,
        metadata,
        statistics,
        processingTime: Date.now() - startTime,
        status: 'success'
      };

      // Store in database
      await this.storeProcessedDocument(processedDocument);
      
      this.emit('documentProcessed', processedDocument);
      console.log(`✅ Document processed successfully: ${request.fileName} (${processedDocument.processingTime}ms)`);
      
      return processedDocument;
      
    } catch (error) {
      console.error(`❌ Document processing failed for ${request.fileName}:`, error);
      
      const failedDocument: ProcessedDocument = {
        id: request.id,
        originalFileName: request.fileName,
        documentType: request.fileType,
        content: '',
        chunks: [],
        metadata: this.createEmptyMetadata(request),
        statistics: this.createEmptyStatistics(),
        processingTime: Date.now() - startTime,
        status: 'failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
      
      this.emit('documentProcessingFailed', failedDocument);
      return failedDocument;
    }
  }

  private async validateFile(filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }
      
      // Check file size (limit to 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (stats.size > maxSize) {
        throw new Error(`File size exceeds maximum limit of ${maxSize} bytes`);
      }
      
    } catch (error) {
      throw new Error(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractContent(request: DocumentProcessingRequest): Promise<string> {
    const { filePath, fileType } = request;
    
    switch (fileType) {
      case 'pdf':
        return await this.extractPDFContent(filePath);
      case 'txt':
      case 'md':
        return await this.extractTextContent(filePath);
      case 'html':
        return await this.extractHTMLContent(filePath);
      case 'json':
        return await this.extractJSONContent(filePath);
      case 'csv':
        return await this.extractCSVContent(filePath);
      case 'code':
        return await this.extractCodeContent(filePath);
      case 'docx':
        return await this.extractDOCXContent(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async extractPDFContent(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextContent(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractHTMLContent(filePath: string): Promise<string> {
    try {
      const htmlContent = await fs.readFile(filePath, 'utf-8');
      const dom = new JSDOM(htmlContent);
      
      // Remove script and style elements
      const scripts = dom.window.document.querySelectorAll('script, style');
      scripts.forEach((el: Element) => el.remove());
      
      return dom.window.document.body?.textContent || dom.window.document.textContent || '';
    } catch (error) {
      throw new Error(`HTML extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractJSONContent(filePath: string): Promise<string> {
    try {
      const jsonContent = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(jsonContent);
      
      // Convert JSON to readable text format
      return this.jsonToText(parsed);
    } catch (error) {
      throw new Error(`JSON extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractCSVContent(filePath: string): Promise<string> {
    try {
      const csvContent = await fs.readFile(filePath, 'utf-8');
      
      // Convert CSV to readable text format
      const lines = csvContent.split('\n');
      const headers = lines[0]?.split(',') || [];
      
      let textContent = `Headers: ${headers.join(' | ')}\n\n`;
      
      for (let i = 1; i < Math.min(lines.length, 1000); i++) {
        const values = lines[i]?.split(',') || [];
        if (values.length > 0) {
          textContent += `Row ${i}: ${values.join(' | ')}\n`;
        }
      }
      
      return textContent;
    } catch (error) {
      throw new Error(`CSV extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractCodeContent(filePath: string): Promise<string> {
    try {
      const codeContent = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath);
      
      // Add metadata about the code file
      let processedContent = `Code file: ${path.basename(filePath)}\n`;
      processedContent += `Language: ${this.getLanguageFromExtension(ext)}\n`;
      processedContent += `Lines: ${codeContent.split('\n').length}\n\n`;
      processedContent += codeContent;
      
      return processedContent;
    } catch (error) {
      throw new Error(`Code extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractDOCXContent(filePath: string): Promise<string> {
    try {
      // For now, treat as binary and extract what we can
      // In production, would use libraries like 'mammoth' or 'docx'
      const buffer = await fs.readFile(filePath);
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private jsonToText(obj: any, depth = 0): string {
    const indent = '  '.repeat(depth);
    let text = '';
    
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        text += `${indent}Array with ${obj.length} items:\n`;
        obj.forEach((item, index) => {
          text += `${indent}  [${index}] ${this.jsonToText(item, depth + 2)}\n`;
        });
      } else {
        for (const [key, value] of Object.entries(obj)) {
          text += `${indent}${key}: ${this.jsonToText(value, depth + 1)}\n`;
        }
      }
    } else {
      text += String(obj);
    }
    
    return text;
  }

  private getLanguageFromExtension(ext: string): string {
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.kt': 'Kotlin',
      '.swift': 'Swift',
      '.scala': 'Scala',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.ps1': 'PowerShell'
    };
    
    return languageMap[ext.toLowerCase()] || 'Unknown';
  }

  private async extractMetadata(request: DocumentProcessingRequest, content: string): Promise<DocumentMetadata> {
    const stats = await fs.stat(request.filePath);
    
    const metadata: DocumentMetadata = {
      fileName: request.fileName,
      fileSize: stats.size,
      fileType: request.fileType,
      mimeType: this.getMimeType(request.fileType),
      encoding: 'utf-8',
      language: await this.detectLanguage(content),
      wordCount: this.countWords(content),
      characterCount: content.length,
      tags: this.extractTags(content),
      customMetadata: request.metadata || {}
    };
    
    return metadata;
  }

  private getMimeType(fileType: DocumentType): string {
    const mimeTypes: Record<DocumentType, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'html': 'text/html',
      'json': 'application/json',
      'csv': 'text/csv',
      'code': 'text/plain',
      'rtf': 'application/rtf',
      'xml': 'application/xml'
    };
    
    return mimeTypes[fileType] || 'application/octet-stream';
  }

  private async detectLanguage(content: string): Promise<string> {
    // Simple language detection based on common words
    // In production, would use proper language detection libraries
    
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'];
    const words = content.toLowerCase().split(/\s+/).slice(0, 100);
    
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    const englishRatio = englishCount / Math.min(words.length, 100);
    
    return englishRatio > 0.1 ? 'en' : 'unknown';
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private extractTags(content: string): string[] {
    // Extract potential tags from content
    const tags: string[] = [];
    
    // Extract hashtags
    const hashtags = content.match(/#[\w]+/g);
    if (hashtags) {
      tags.push(...hashtags.map(tag => tag.substring(1).toLowerCase()));
    }
    
    // Extract common technical terms
    const technicalTerms = ['api', 'database', 'function', 'class', 'method', 'variable'];
    const contentLower = content.toLowerCase();
    
    technicalTerms.forEach(term => {
      if (contentLower.includes(term)) {
        tags.push(term);
      }
    });
    
    return Array.from(new Set(tags)); // Remove duplicates
  }

  private async generateChunks(content: string, options?: DocumentProcessingOptions): Promise<DocumentChunk[]> {
    const chunkSize = options?.chunkSize || this.defaultOptions.chunkSize!;
    const chunkOverlap = options?.chunkOverlap || this.defaultOptions.chunkOverlap!;
    
    const chunks: DocumentChunk[] = [];
    const words = content.split(/\s+/);
    
    let startIndex = 0;
    let chunkIndex = 0;
    
    while (startIndex < words.length) {
      const endIndex = Math.min(startIndex + chunkSize, words.length);
      const chunkWords = words.slice(startIndex, endIndex);
      const chunkContent = chunkWords.join(' ');
      
      const chunk: DocumentChunk = {
        id: crypto.randomUUID(),
        index: chunkIndex,
        content: chunkContent,
        tokens: this.estimateTokenCount(chunkContent),
        characters: chunkContent.length,
        startPosition: startIndex,
        endPosition: endIndex - 1,
        metadata: {
          wordCount: chunkWords.length,
          hasImages: false,
          hasCode: this.detectCodeInChunk(chunkContent)
        }
      };
      
      chunks.push(chunk);
      
      // Move start index with overlap
      startIndex = endIndex - chunkOverlap;
      chunkIndex++;
      
      // Prevent infinite loop
      if (startIndex >= endIndex) {
        break;
      }
    }
    
    return chunks;
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 0.75 words
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount * 0.75);
  }

  private detectCodeInChunk(content: string): boolean {
    const codeIndicators = [
      'function', 'class', 'import', 'export', 'const', 'let', 'var',
      '{', '}', '=>', '()', '[]', 'if', 'else', 'for', 'while'
    ];
    
    return codeIndicators.some(indicator => content.includes(indicator));
  }

  private async calculateStatistics(content: string): Promise<DocumentStatistics> {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return {
      totalCharacters: content.length,
      totalWords: words.length,
      totalSentences: sentences.length,
      totalParagraphs: paragraphs.length,
      averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      averageSentencesPerParagraph: paragraphs.length > 0 ? sentences.length / paragraphs.length : 0,
      readabilityScore: this.calculateReadabilityScore(words, sentences),
      complexityScore: this.calculateComplexityScore(content),
      languageConfidence: 0.95 // Placeholder
    };
  }

  private calculateReadabilityScore(words: string[], sentences: string[]): number {
    // Simplified Flesch Reading Ease score
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
    
    return Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)));
  }

  private calculateComplexityScore(content: string): number {
    // Simple complexity score based on various factors
    let score = 0;
    
    // Technical terms
    const technicalTerms = ['algorithm', 'implementation', 'optimization', 'architecture'];
    technicalTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) score += 10;
    });
    
    // Code presence
    if (this.detectCodeInChunk(content)) score += 20;
    
    // Long sentences
    const sentences = content.split(/[.!?]+/);
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 20).length;
    score += longSentences * 5;
    
    return Math.min(100, score);
  }

  private countSyllables(word: string): number {
    // Simple syllable counting
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    return Math.max(1, count);
  }

  private async storeProcessedDocument(document: ProcessedDocument): Promise<void> {
    const db = await this.databaseSystem.getDatabase();
    
    // Store main document
    await db.execute(`
      INSERT INTO kb_documents (
        id, title, content, document_type, metadata, 
        word_count, character_count, language, status, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      document.id,
      document.metadata.fileName,
      document.content,
      document.documentType,
      JSON.stringify(document.metadata),
      document.metadata.wordCount,
      document.metadata.characterCount,
      document.metadata.language,
      document.status,
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    
    // Store chunks
    for (const chunk of document.chunks) {
      await db.execute(`
        INSERT INTO kb_document_chunks (
          id, document_id, chunk_index, content, 
          token_count, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        chunk.id,
        document.id,
        chunk.index,
        chunk.content,
        chunk.tokens,
        JSON.stringify(chunk.metadata),
        new Date().toISOString()
      ]);
    }
  }

  private createEmptyMetadata(request: DocumentProcessingRequest): DocumentMetadata {
    return {
      fileName: request.fileName,
      fileSize: 0,
      fileType: request.fileType,
      mimeType: this.getMimeType(request.fileType),
      encoding: 'utf-8',
      language: 'unknown',
      wordCount: 0,
      characterCount: 0,
      tags: [],
      customMetadata: {}
    };
  }

  private createEmptyStatistics(): DocumentStatistics {
    return {
      totalCharacters: 0,
      totalWords: 0,
      totalSentences: 0,
      totalParagraphs: 0,
      averageWordsPerSentence: 0,
      averageSentencesPerParagraph: 0,
      readabilityScore: 0,
      complexityScore: 0,
      languageConfidence: 0
    };
  }

  private startProcessingQueue(): void {
    setInterval(async () => {
      if (this.activeProcessing < this.concurrentLimit && this.processingQueue.size > 0) {
        const entry = this.processingQueue.entries().next().value;
        if (entry) {
          const [id, request] = entry;
          this.processingQueue.delete(id);
        
        this.activeProcessing++;
        
          try {
            await this.processDocument(request);
          } catch (error) {
            console.error('Queue processing error:', error);
          } finally {
            this.activeProcessing--;
          }
        }
      }
    }, 1000);
  }

  async addToQueue(request: DocumentProcessingRequest): Promise<void> {
    this.processingQueue.set(request.id, request);
    console.log(`📋 Added document to processing queue: ${request.fileName} (Queue size: ${this.processingQueue.size})`);
  }

  getQueueStatus(): { pending: number; processing: number } {
    return {
      pending: this.processingQueue.size,
      processing: this.activeProcessing
    };
  }
}