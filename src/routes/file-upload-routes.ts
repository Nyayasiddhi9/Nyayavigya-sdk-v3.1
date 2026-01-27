import { Router, Request, Response } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { wizardsFileUploads, wizardsFileUploadChunks, wizardsArtifacts } from '../../shared/schema';
import { defaultStorageAdapter } from '../services/storage-adapter';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Configure multer for memory storage (chunked uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per chunk
  },
});

/**
 * POST /api/files/upload/initiate
 * Initialize a chunked file upload
 */
router.post('/upload/initiate', async (req: Request, res: Response) => {
  try {
    const { fileName, fileSize, mimeType, startupId, sessionId } = req.body;
    const userId = (req as any).user?.id;

    if (!fileName || !fileSize || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fileName, fileSize, mimeType',
      });
    }

    const uploadId = nanoid(21);
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(fileSize / chunkSize);

    const [fileUpload] = await db.insert(wizardsFileUploads)
      .values({
        uploadId,
        startupId: startupId || null,
        userId: userId || null,
        fileName,
        fileSize,
        mimeType,
        chunkSize,
        totalChunks,
        status: 'pending',
        storageProvider: 'local',
        sessionId: sessionId || null,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour expiry
      })
      .returning();

    res.json({
      success: true,
      upload: {
        uploadId,
        fileName,
        fileSize,
        chunkSize,
        totalChunks,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Error initiating upload:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate upload',
    });
  }
});

/**
 * POST /api/files/upload/chunk
 * Upload a single chunk
 */
router.post('/upload/chunk', upload.single('chunk'), async (req: Request, res: Response) => {
  try {
    const { uploadId, chunkIndex } = req.body;
    const chunkFile = req.file;

    if (!uploadId || chunkIndex === undefined || !chunkFile) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: uploadId, chunkIndex, chunk file',
      });
    }

    const chunkIndexNum = parseInt(chunkIndex);

    // Verify upload exists
    const [fileUpload] = await db.select()
      .from(wizardsFileUploads)
      .where(eq(wizardsFileUploads.uploadId, uploadId))
      .limit(1);

    if (!fileUpload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found',
      });
    }

    if (fileUpload.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Upload already completed',
      });
    }

    // Upload chunk to storage
    const chunkResult = await defaultStorageAdapter.uploadChunk(
      uploadId,
      chunkIndexNum,
      chunkFile.buffer
    );

    // Record chunk in database
    const [chunk] = await db.insert(wizardsFileUploadChunks)
      .values({
        uploadId,
        chunkIndex: chunkIndexNum,
        chunkSize: chunkFile.size,
        checksum: chunkResult.checksum,
        status: 'uploaded',
        uploadedAt: new Date(),
      })
      .returning();

    // Update upload progress
    const uploadedChunks = fileUpload.uploadedChunks + 1;
    await db.update(wizardsFileUploads)
      .set({
        uploadedChunks,
        status: uploadedChunks === fileUpload.totalChunks ? 'uploading' : 'uploading',
        updatedAt: new Date(),
      })
      .where(eq(wizardsFileUploads.uploadId, uploadId));

    res.json({
      success: true,
      chunk: {
        uploadId,
        chunkIndex: chunkIndexNum,
        checksum: chunkResult.checksum,
        uploaded: true,
      },
      progress: {
        uploadedChunks,
        totalChunks: fileUpload.totalChunks,
        percentage: Math.round((uploadedChunks / fileUpload.totalChunks) * 100),
      },
    });
  } catch (error) {
    console.error('Error uploading chunk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload chunk',
    });
  }
});

/**
 * POST /api/files/upload/finalize
 * Finalize the upload by combining chunks
 */
router.post('/upload/finalize', async (req: Request, res: Response) => {
  try {
    const { uploadId, artifactType, category } = req.body;

    if (!uploadId) {
      return res.status(400).json({
        success: false,
        error: 'Missing uploadId',
      });
    }

    // Get upload details
    const [fileUpload] = await db.select()
      .from(wizardsFileUploads)
      .where(eq(wizardsFileUploads.uploadId, uploadId))
      .limit(1);

    if (!fileUpload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found',
      });
    }

    if (fileUpload.uploadedChunks !== fileUpload.totalChunks) {
      return res.status(400).json({
        success: false,
        error: `Incomplete upload: ${fileUpload.uploadedChunks}/${fileUpload.totalChunks} chunks uploaded`,
      });
    }

    // Finalize storage with proper path structure
    const finalUrl = await defaultStorageAdapter.finalizeUpload(uploadId, {
      fileName: fileUpload.fileName,
      startupId: fileUpload.startupId || undefined,
    });

    // Update upload record
    await db.update(wizardsFileUploads)
      .set({
        status: 'completed',
        storageUrl: finalUrl,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(wizardsFileUploads.uploadId, uploadId));

    // Create artifact if requested
    let artifact = null;
    if (artifactType && category && fileUpload.startupId) {
      [artifact] = await db.insert(wizardsArtifacts)
        .values({
          startupId: fileUpload.startupId,
          artifactType,
          category,
          name: fileUpload.fileName,
          fileUrl: finalUrl,
          fileSize: fileUpload.fileSize,
          mimeType: fileUpload.mimeType,
          sessionId: fileUpload.sessionId,
        })
        .returning();

      // Link artifact to upload
      await db.update(wizardsFileUploads)
        .set({
          artifactId: artifact.id,
          updatedAt: new Date(),
        })
        .where(eq(wizardsFileUploads.uploadId, uploadId));
    }

    res.json({
      success: true,
      upload: {
        uploadId: fileUpload.uploadId,
        fileName: fileUpload.fileName,
        fileSize: fileUpload.fileSize,
        url: finalUrl,
        status: 'completed',
      },
      artifact: artifact ? {
        id: artifact.id,
        type: artifact.artifactType,
        category: artifact.category,
        url: artifact.fileUrl,
      } : null,
    });
  } catch (error) {
    console.error('Error finalizing upload:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to finalize upload',
    });
  }
});

/**
 * GET /api/files/upload/:uploadId/status
 * Get upload status and progress
 */
router.get('/upload/:uploadId/status', async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;

    const [fileUpload] = await db.select()
      .from(wizardsFileUploads)
      .where(eq(wizardsFileUploads.uploadId, uploadId))
      .limit(1);

    if (!fileUpload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found',
      });
    }

    res.json({
      success: true,
      upload: {
        uploadId: fileUpload.uploadId,
        fileName: fileUpload.fileName,
        fileSize: fileUpload.fileSize,
        status: fileUpload.status,
        uploadedChunks: fileUpload.uploadedChunks,
        totalChunks: fileUpload.totalChunks,
        percentage: Math.round((fileUpload.uploadedChunks / fileUpload.totalChunks) * 100),
        url: fileUpload.storageUrl,
      },
    });
  } catch (error) {
    console.error('Error getting upload status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upload status',
    });
  }
});

/**
 * DELETE /api/files/upload/:uploadId/cancel
 * Cancel an ongoing upload
 */
router.delete('/upload/:uploadId/cancel', async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;

    await db.update(wizardsFileUploads)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(and(
        eq(wizardsFileUploads.uploadId, uploadId),
        eq(wizardsFileUploads.status, 'uploading')
      ));

    res.json({
      success: true,
      message: 'Upload cancelled',
    });
  } catch (error) {
    console.error('Error cancelling upload:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel upload',
    });
  }
});

export default router;
