import express, { type Request, type Response } from "express";
import { computerVisionAPI, type CVAnalysisRequest } from "../services/computer-vision-api";
import multer from 'multer';
import fs from 'fs/promises';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  dest: '/tmp/cv-uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  }
});

/**
 * POST /api/cv/analyze
 * Analyze uploaded image with computer vision
 */
router.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { analysisTypes, options } = req.body;
    
    if (!req.file && !req.body.imageData) {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Upload a file or provide base64 imageData.'
      });
    }

    // Parse analysis types (sent as JSON string from form)
    let parsedAnalysisTypes;
    try {
      parsedAnalysisTypes = typeof analysisTypes === 'string' 
        ? JSON.parse(analysisTypes) 
        : analysisTypes || {};
    } catch (error) {
      parsedAnalysisTypes = {
        objectDetection: true,
        sceneAnalysis: true
      };
    }

    // Parse options
    let parsedOptions;
    try {
      parsedOptions = typeof options === 'string' 
        ? JSON.parse(options) 
        : options || {};
    } catch (error) {
      parsedOptions = {};
    }

    const request: CVAnalysisRequest = {
      analysisTypes: parsedAnalysisTypes,
      options: parsedOptions
    };

    // Use uploaded file or base64 data
    if (req.file) {
      request.imagePath = req.file.path;
    } else if (req.body.imageData) {
      request.imageData = req.body.imageData;
    }

    const result = await computerVisionAPI.analyzeImage(request);

    // Clean up uploaded file
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {}); // Ignore cleanup errors
    }

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
      error: error instanceof Error ? error.message : 'Computer vision analysis failed'
    });
  }
});

/**
 * POST /api/cv/analyze-base64
 * Analyze base64 encoded image
 */
router.post('/analyze-base64', async (req: Request, res: Response) => {
  try {
    const { imageData, analysisTypes, options } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'imageData is required'
      });
    }

    const request: CVAnalysisRequest = {
      imageData,
      analysisTypes: analysisTypes || {
        objectDetection: true,
        textExtraction: true,
        sceneAnalysis: true
      },
      options: options || {}
    };

    const result = await computerVisionAPI.analyzeImage(request);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Computer vision analysis failed'
    });
  }
});

/**
 * POST /api/cv/batch-analyze
 * Analyze multiple images in batch
 */
router.post('/batch-analyze', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const { analysisTypes, options } = req.body;
    
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided'
      });
    }

    const files = req.files as Express.Multer.File[];
    
    // Parse analysis types and options
    const parsedAnalysisTypes = typeof analysisTypes === 'string' 
      ? JSON.parse(analysisTypes) 
      : analysisTypes || { objectDetection: true, sceneAnalysis: true };
      
    const parsedOptions = typeof options === 'string' 
      ? JSON.parse(options) 
      : options || {};

    // Create requests for all files
    const requests: CVAnalysisRequest[] = files.map(file => ({
      imagePath: file.path,
      analysisTypes: parsedAnalysisTypes,
      options: parsedOptions
    }));

    const results = await computerVisionAPI.batchAnalyze(requests);

    // Clean up uploaded files
    await Promise.all(files.map(file => 
      fs.unlink(file.path).catch(() => {})
    ));

    res.json({
      success: true,
      data: results,
      total: results.length
    });

  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      await Promise.all((req.files as Express.Multer.File[]).map(file => 
        fs.unlink(file.path).catch(() => {})
      ));
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch analysis failed'
    });
  }
});

/**
 * GET /api/cv/capabilities
 * Get available analysis capabilities
 */
router.get('/capabilities', async (req: Request, res: Response) => {
  try {
    const capabilities = {
      analysisTypes: {
        objectDetection: {
          description: 'Detect and classify objects in images',
          features: ['Multi-object detection', 'Category classification', 'Confidence scoring']
        },
        faceDetection: {
          description: 'Detect faces and analyze attributes',
          features: ['Face detection', 'Age estimation', 'Gender detection', 'Emotion analysis']
        },
        textExtraction: {
          description: 'Extract text from images using OCR',
          features: ['Multi-language support', 'Text blocks', 'Confidence scoring']
        },
        sceneAnalysis: {
          description: 'Understand image content and context',
          features: ['Scene description', 'Content categorization', 'Moderation']
        },
        brandDetection: {
          description: 'Identify brand logos and products',
          features: ['Logo detection', 'Brand recognition', 'Product identification']
        },
        emotionAnalysis: {
          description: 'Analyze emotions in facial expressions',
          features: ['Emotion classification', 'Confidence scoring', 'Multiple faces']
        },
        qualityAssessment: {
          description: 'Assess image quality metrics',
          features: ['Sharpness', 'Brightness', 'Contrast', 'Overall quality']
        }
      },
      supportedFormats: ['JPEG', 'PNG', 'WebP', 'GIF'],
      maxFileSize: '10MB',
      maxBatchSize: 10,
      averageProcessingTime: '200-500ms'
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
 * GET /api/cv/stats
 * Get computer vision API statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = computerVisionAPI.getStats();
    
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
 * GET /api/cv/docs
 * API documentation
 */
router.get('/docs', async (req: Request, res: Response) => {
  try {
    const documentation = {
      title: 'Computer Vision API Documentation',
      version: '1.0.0',
      baseUrl: '/api/cv',
      endpoints: [
        {
          method: 'POST',
          path: '/analyze',
          description: 'Analyze single image via file upload',
          parameters: {
            image: 'File upload (required)',
            analysisTypes: 'JSON object specifying analysis types',
            options: 'JSON object with analysis options'
          },
          response: 'CVAnalysisResult object'
        },
        {
          method: 'POST',
          path: '/analyze-base64',
          description: 'Analyze base64 encoded image',
          parameters: {
            imageData: 'Base64 encoded image (required)',
            analysisTypes: 'Object specifying analysis types',
            options: 'Object with analysis options'
          },
          response: 'CVAnalysisResult object'
        },
        {
          method: 'POST',
          path: '/batch-analyze',
          description: 'Analyze multiple images in batch',
          parameters: {
            images: 'Array of file uploads (max 10)',
            analysisTypes: 'JSON object specifying analysis types',
            options: 'JSON object with analysis options'
          },
          response: 'Array of CVAnalysisResult objects'
        },
        {
          method: 'GET',
          path: '/capabilities',
          description: 'Get available analysis capabilities',
          parameters: 'None',
          response: 'Capabilities object'
        },
        {
          method: 'GET',
          path: '/stats',
          description: 'Get API usage statistics',
          parameters: 'None',
          response: 'Statistics object'
        }
      ],
      examples: {
        analysisTypes: {
          objectDetection: true,
          faceDetection: true,
          textExtraction: true,
          sceneAnalysis: true,
          brandDetection: false,
          emotionAnalysis: false,
          qualityAssessment: true
        },
        options: {
          confidence: 0.8,
          language: 'eng',
          includeCoordinates: true,
          generateTags: true,
          customPrompt: 'Focus on detecting vehicles and signs'
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