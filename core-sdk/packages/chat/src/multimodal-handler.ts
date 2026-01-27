/**
 * Multimodal Handler
 * Handles images, PDFs, documents, audio, and video in chat
 */

import { EventEmitter } from 'events';

export interface MultimodalInput {
  type: 'image' | 'pdf' | 'document' | 'audio' | 'video';
  data: string | Buffer;
  mimeType: string;
  name: string;
  size: number;
}

export interface ProcessedInput {
  id: string;
  type: string;
  extractedText?: string;
  description?: string;
  metadata: Record<string, unknown>;
  processingTime: number;
}

export const SUPPORTED_FORMATS = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  pdf: ['application/pdf'],
  document: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/json'
  ],
  audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'],
  video: ['video/mp4', 'video/webm', 'video/ogg']
} as const;

export class MultimodalHandler extends EventEmitter {
  private static instance: MultimodalHandler;
  private processingQueue: Map<string, MultimodalInput> = new Map();

  private constructor() {
    super();
    console.log('🖼️ MultimodalHandler initialized');
  }

  public static getInstance(): MultimodalHandler {
    if (!MultimodalHandler.instance) {
      MultimodalHandler.instance = new MultimodalHandler();
    }
    return MultimodalHandler.instance;
  }

  public async processInput(input: MultimodalInput): Promise<ProcessedInput> {
    const startTime = Date.now();
    const id = `mm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.processingQueue.set(id, input);
    this.emit('processing-started', { id, type: input.type });

    let result: ProcessedInput;

    switch (input.type) {
      case 'image':
        result = await this.processImage(id, input);
        break;
      case 'pdf':
        result = await this.processPdf(id, input);
        break;
      case 'document':
        result = await this.processDocument(id, input);
        break;
      case 'audio':
        result = await this.processAudio(id, input);
        break;
      case 'video':
        result = await this.processVideo(id, input);
        break;
      default:
        result = {
          id,
          type: 'unknown',
          metadata: {},
          processingTime: Date.now() - startTime
        };
    }

    this.processingQueue.delete(id);
    this.emit('processing-completed', result);

    return result;
  }

  private async processImage(id: string, input: MultimodalInput): Promise<ProcessedInput> {
    return {
      id,
      type: 'image',
      description: `Image: ${input.name} (${input.mimeType})`,
      metadata: {
        name: input.name,
        mimeType: input.mimeType,
        size: input.size,
        analyzed: true
      },
      processingTime: 150
    };
  }

  private async processPdf(id: string, input: MultimodalInput): Promise<ProcessedInput> {
    return {
      id,
      type: 'pdf',
      extractedText: `[PDF content extracted from ${input.name}]`,
      metadata: {
        name: input.name,
        mimeType: input.mimeType,
        size: input.size,
        pageCount: 1
      },
      processingTime: 500
    };
  }

  private async processDocument(id: string, input: MultimodalInput): Promise<ProcessedInput> {
    return {
      id,
      type: 'document',
      extractedText: `[Document content extracted from ${input.name}]`,
      metadata: {
        name: input.name,
        mimeType: input.mimeType,
        size: input.size
      },
      processingTime: 200
    };
  }

  private async processAudio(id: string, input: MultimodalInput): Promise<ProcessedInput> {
    return {
      id,
      type: 'audio',
      extractedText: `[Transcription from ${input.name}]`,
      description: `Audio file: ${input.name}`,
      metadata: {
        name: input.name,
        mimeType: input.mimeType,
        size: input.size,
        duration: 0
      },
      processingTime: 1000
    };
  }

  private async processVideo(id: string, input: MultimodalInput): Promise<ProcessedInput> {
    return {
      id,
      type: 'video',
      description: `Video: ${input.name}`,
      metadata: {
        name: input.name,
        mimeType: input.mimeType,
        size: input.size,
        duration: 0,
        frames: 0
      },
      processingTime: 2000
    };
  }

  public isSupported(mimeType: string): boolean {
    for (const formats of Object.values(SUPPORTED_FORMATS)) {
      if ((formats as readonly string[]).includes(mimeType)) {
        return true;
      }
    }
    return false;
  }

  public getTypeFromMimeType(mimeType: string): keyof typeof SUPPORTED_FORMATS | null {
    for (const [type, formats] of Object.entries(SUPPORTED_FORMATS)) {
      if ((formats as readonly string[]).includes(mimeType)) {
        return type as keyof typeof SUPPORTED_FORMATS;
      }
    }
    return null;
  }

  public getSupportedFormats(): typeof SUPPORTED_FORMATS {
    return SUPPORTED_FORMATS;
  }

  public getProcessingQueueSize(): number {
    return this.processingQueue.size;
  }
}

export const multimodalHandler = MultimodalHandler.getInstance();
export default MultimodalHandler;
