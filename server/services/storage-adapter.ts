import { createWriteStream, createReadStream, promises as fs } from 'fs';
import { join, dirname } from 'path';
import crypto from 'crypto';

/**
 * Storage Adapter Interface
 * Unified interface for local and cloud storage providers
 */
export interface IStorageAdapter {
  upload(file: Buffer, path: string, options?: UploadOptions): Promise<UploadResult>;
  uploadChunk(uploadId: string, chunkIndex: number, chunk: Buffer): Promise<ChunkResult>;
  finalizeUpload(uploadId: string, options?: { fileName?: string; startupId?: string }): Promise<string>;
  download(path: string): Promise<Buffer>;
  downloadStream(path: string): NodeJS.ReadableStream;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
  getMetadata(path: string): Promise<FileMetadata>;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  makePublic?: boolean;
  encryption?: boolean;
}

export interface UploadResult {
  path: string;
  url: string;
  size: number;
  checksum: string;
  metadata?: Record<string, any>;
}

export interface ChunkResult {
  uploadId: string;
  chunkIndex: number;
  checksum: string;
  uploaded: boolean;
}

export interface FileMetadata {
  path: string;
  size: number;
  contentType: string;
  lastModified: Date;
  checksum?: string;
}

/**
 * Local File System Storage Adapter
 * For development and local deployments
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private baseDir: string;
  private chunksDir: string;
  private publicUrl: string;

  constructor(config: { baseDir: string; publicUrl?: string }) {
    this.baseDir = config.baseDir;
    this.chunksDir = join(this.baseDir, '.chunks');
    this.publicUrl = config.publicUrl || '/uploads';
  }

  async upload(file: Buffer, path: string, options?: UploadOptions): Promise<UploadResult> {
    const fullPath = join(this.baseDir, path);
    const dir = dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file);

    // Calculate checksum
    const checksum = crypto.createHash('sha256').update(file).digest('hex');

    // Get file stats
    const stats = await fs.stat(fullPath);

    return {
      path,
      url: `${this.publicUrl}/${path}`,
      size: stats.size,
      checksum,
      metadata: options?.metadata,
    };
  }

  async uploadChunk(uploadId: string, chunkIndex: number, chunk: Buffer): Promise<ChunkResult> {
    const chunkDir = join(this.chunksDir, uploadId);
    await fs.mkdir(chunkDir, { recursive: true });

    const chunkPath = join(chunkDir, `chunk_${chunkIndex}`);
    await fs.writeFile(chunkPath, chunk);

    const checksum = crypto.createHash('md5').update(chunk).digest('hex');

    return {
      uploadId,
      chunkIndex,
      checksum,
      uploaded: true,
    };
  }

  async finalizeUpload(uploadId: string, options?: { fileName?: string; startupId?: string }): Promise<string> {
    const chunkDir = join(this.chunksDir, uploadId);
    const files = await fs.readdir(chunkDir);
    
    // Sort chunks by index
    files.sort((a, b) => {
      const indexA = parseInt(a.split('_')[1]);
      const indexB = parseInt(b.split('_')[1]);
      return indexA - indexB;
    });

    // Construct final path with proper structure: startupId/uploadId/fileName
    let finalRelativePath = uploadId;
    if (options?.startupId && options?.fileName) {
      finalRelativePath = join(options.startupId, uploadId, options.fileName);
    } else if (options?.fileName) {
      finalRelativePath = join(uploadId, options.fileName);
    }

    const finalPath = join(this.baseDir, finalRelativePath);
    const dir = dirname(finalPath);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Combine chunks
    const writeStream = createWriteStream(finalPath);

    for (const file of files) {
      const chunkPath = join(chunkDir, file);
      const chunk = await fs.readFile(chunkPath);
      writeStream.write(chunk);
    }

    writeStream.end();

    // Clean up chunks
    await fs.rm(chunkDir, { recursive: true });

    return `${this.publicUrl}/${finalRelativePath}`;
  }

  async download(path: string): Promise<Buffer> {
    const fullPath = join(this.baseDir, path);
    return await fs.readFile(fullPath);
  }

  downloadStream(path: string): NodeJS.ReadableStream {
    const fullPath = join(this.baseDir, path);
    return createReadStream(fullPath);
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.baseDir, path);
    await fs.unlink(fullPath);
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = join(this.baseDir, path);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    // For local storage, just return the public URL (no signing needed)
    return `${this.publicUrl}/${path}`;
  }

  async getMetadata(path: string): Promise<FileMetadata> {
    const fullPath = join(this.baseDir, path);
    const stats = await fs.stat(fullPath);
    
    // Try to determine content type from extension
    const ext = path.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'json': 'application/json',
      'zip': 'application/zip',
    };

    return {
      path,
      size: stats.size,
      contentType: contentTypeMap[ext || ''] || 'application/octet-stream',
      lastModified: stats.mtime,
    };
  }
}

/**
 * S3-Compatible Storage Adapter
 * Works with AWS S3, Cloudflare R2, MinIO, etc.
 */
export class S3StorageAdapter implements IStorageAdapter {
  private config: any;
  private s3Client: any;

  constructor(config: {
    endpoint?: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  }) {
    this.config = config;
    // S3 client initialization would go here
    // For now, this is a stub for future implementation
  }

  async upload(file: Buffer, path: string, options?: UploadOptions): Promise<UploadResult> {
    throw new Error('S3 adapter not yet implemented. Use LocalStorageAdapter for now.');
  }

  async uploadChunk(uploadId: string, chunkIndex: number, chunk: Buffer): Promise<ChunkResult> {
    throw new Error('S3 adapter not yet implemented. Use LocalStorageAdapter for now.');
  }

  async finalizeUpload(uploadId: string, options?: { fileName?: string; startupId?: string }): Promise<string> {
    throw new Error('S3 adapter not yet implemented. Use LocalStorageAdapter for now.');
  }

  async download(path: string): Promise<Buffer> {
    throw new Error('S3 adapter not yet implemented. Use LocalStorageAdapter for now.');
  }

  downloadStream(path: string): NodeJS.ReadableStream {
    throw new Error('S3 adapter not yet implemented. Use LocalStorageAdapter for now.');
  }

  async delete(path: string): Promise<void> {
    throw new Error('S3 adapter not yet implemented. Use LocalStorageAdapter for now.');
  }

  async exists(path: string): Promise<boolean> {
    throw new Error('S3 adapter not yet implemented. Use LocalStorageAdapter for now.');
  }

  async getSignedUrl(path: string, expiresIn?: number): Promise<string> {
    throw new Error('S3 adapter not yet implemented. Use LocalStorageAdapter for now.');
  }

  async getMetadata(path: string): Promise<FileMetadata> {
    throw new Error('S3 adapter not yet implemented. Use LocalStorageAdapter for now.');
  }
}

/**
 * Storage Adapter Factory
 * Creates appropriate storage adapter based on configuration
 */
export class StorageAdapterFactory {
  static create(provider: string, config: any): IStorageAdapter {
    switch (provider) {
      case 'local':
        return new LocalStorageAdapter(config);
      case 's3':
      case 'cloudflare-r2':
      case 'minio':
        return new S3StorageAdapter(config);
      default:
        throw new Error(`Unknown storage provider: ${provider}`);
    }
  }
}

// Default storage adapter instance
const defaultConfig = {
  baseDir: join(process.cwd(), 'uploads'),
  publicUrl: '/uploads',
};

export const defaultStorageAdapter = new LocalStorageAdapter(defaultConfig);
