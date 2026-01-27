/**
 * Multimodal AI API Routes
 * Unified endpoints for vision, speech, and document processing
 */

import express, { type Request, type Response } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import {
  getEnhancedMultimodalService,
  type VisionAnalysisRequest,
  type SpeechToTextRequest,
  type TextToSpeechRequest,
  type DocumentProcessingRequest
} from '../services/enhanced-multimodal-service';

const router = express.Router();

// Get singleton instance
const enhancedMultimodalService = getEnhancedMultimodalService();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/multimodal-uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  }
});

// ==================== Vision Analysis Routes ====================

/**
 * POST /api/multimodal/vision/analyze
 * Analyze an image with AI vision capabilities
 */
router.post('/vision/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { analysisType, prompt, language, options } = req.body;

    const request: VisionAnalysisRequest = {
      analysisType: analysisType || 'describe',
      prompt,
      language,
      options: typeof options === 'string' ? JSON.parse(options) : options
    };

    // Handle uploaded file or base64 data
    if (req.file) {
      request.imagePath = req.file.path;
    } else if (req.body.imageData) {
      request.imageData = req.body.imageData;
    } else if (req.body.imageUrl) {
      request.imageUrl = req.body.imageUrl;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Upload a file, provide imageData, or imageUrl.'
      });
    }

    const result = await enhancedMultimodalService.analyzeVision(request);

    // Cleanup uploaded file
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    // Cleanup on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Vision analysis failed'
    });
  }
});

/**
 * POST /api/multimodal/vision/ocr
 * Extract text from an image using OCR
 */
router.post('/vision/ocr', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const request: VisionAnalysisRequest = {
      analysisType: 'ocr',
      language: req.body.language
    };

    if (req.file) {
      request.imagePath = req.file.path;
    } else if (req.body.imageData) {
      request.imageData = req.body.imageData;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No image provided'
      });
    }

    const result = await enhancedMultimodalService.analyzeVision(request);

    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        text: result.result.text,
        metadata: result.metadata
      }
    });

  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'OCR failed'
    });
  }
});

// ==================== Speech-to-Text Routes ====================

/**
 * POST /api/multimodal/speech/transcribe
 * Transcribe audio to text using Whisper
 */
router.post('/speech/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { language, prompt, responseFormat, options } = req.body;

    const request: SpeechToTextRequest = {
      language,
      prompt,
      responseFormat: responseFormat || 'json',
      options: typeof options === 'string' ? JSON.parse(options) : options
    };

    if (req.file) {
      request.audioPath = req.file.path;
    } else if (req.body.audioData) {
      request.audioData = req.body.audioData;
    } else if (req.body.audioUrl) {
      request.audioUrl = req.body.audioUrl;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No audio provided. Upload a file, provide audioData, or audioUrl.'
      });
    }

    const result = await enhancedMultimodalService.transcribeAudio(request);

    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Transcription failed'
    });
  }
});

// ==================== Text-to-Speech Routes ====================

/**
 * POST /api/multimodal/speech/synthesize
 * Convert text to speech
 */
router.post('/speech/synthesize', async (req: Request, res: Response) => {
  try {
    const { text, voice, model, speed, responseFormat, provider, elevenLabsVoiceId, elevenLabsSettings } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const request: TextToSpeechRequest = {
      text,
      voice: voice || 'alloy',
      model: model || 'tts-1',
      speed: speed || 1.0,
      responseFormat: responseFormat || 'mp3',
      options: {
        elevenlabs: provider === 'elevenlabs',
        elevenLabsVoiceId,
        elevenLabsSettings
      }
    };

    const result = await enhancedMultimodalService.synthesizeSpeech(request);

    // Return audio data based on client preference
    if (req.query.format === 'binary') {
      res.set('Content-Type', `audio/${result.format}`);
      res.set('Content-Disposition', `attachment; filename="speech.${result.format}"`);
      res.send(result.audioBuffer);
    } else {
      res.json({
        success: true,
        data: {
          id: result.id,
          audioBase64: result.audioBase64,
          format: result.format,
          duration: result.duration,
          metadata: result.metadata
        }
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Speech synthesis failed'
    });
  }
});

/**
 * GET /api/multimodal/speech/voices
 * Get available TTS voices
 */
router.get('/speech/voices', (req: Request, res: Response) => {
  const openaiVoices = [
    { id: 'alloy', name: 'Alloy', provider: 'openai', description: 'Neutral and balanced' },
    { id: 'echo', name: 'Echo', provider: 'openai', description: 'Warm and conversational' },
    { id: 'fable', name: 'Fable', provider: 'openai', description: 'British accent, storytelling' },
    { id: 'onyx', name: 'Onyx', provider: 'openai', description: 'Deep and authoritative' },
    { id: 'nova', name: 'Nova', provider: 'openai', description: 'Warm and expressive female' },
    { id: 'shimmer', name: 'Shimmer', provider: 'openai', description: 'Clear and friendly female' }
  ];

  const elevenLabsVoices = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', provider: 'elevenlabs', description: 'Young American female' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', provider: 'elevenlabs', description: 'Deep American male' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', provider: 'elevenlabs', description: 'Warm female' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', provider: 'elevenlabs', description: 'Calm storyteller' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', provider: 'elevenlabs', description: 'Strong male' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', provider: 'elevenlabs', description: 'Young American male' }
  ];

  const capabilities = enhancedMultimodalService.getCapabilities();

  res.json({
    success: true,
    data: {
      openai: {
        available: capabilities.textToSpeech,
        voices: openaiVoices,
        models: ['tts-1', 'tts-1-hd']
      },
      elevenlabs: {
        available: capabilities.elevenLabs,
        voices: elevenLabsVoices,
        models: ['eleven_multilingual_v2', 'eleven_turbo_v2']
      }
    }
  });
});

// ==================== Document Processing Routes ====================

/**
 * POST /api/multimodal/document/process
 * Process a document with various operations
 */
router.post('/document/process', upload.single('document'), async (req: Request, res: Response) => {
  try {
    const { documentType, operations, options } = req.body;

    const request: DocumentProcessingRequest = {
      documentType: documentType || 'text',
      operations: typeof operations === 'string' ? JSON.parse(operations) : operations || ['extract_text'],
      options: typeof options === 'string' ? JSON.parse(options) : options
    };

    if (req.file) {
      request.documentPath = req.file.path;
    } else if (req.body.documentData) {
      request.documentData = req.body.documentData;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No document provided'
      });
    }

    const result = await enhancedMultimodalService.processDocument(request);

    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Document processing failed'
    });
  }
});

/**
 * POST /api/multimodal/document/summarize
 * Summarize a document
 */
router.post('/document/summarize', upload.single('document'), async (req: Request, res: Response) => {
  try {
    const { summaryLength } = req.body;

    const request: DocumentProcessingRequest = {
      documentType: 'text',
      operations: ['summarize'],
      options: {
        summaryLength: summaryLength || 'brief'
      }
    };

    if (req.file) {
      request.documentPath = req.file.path;
    } else if (req.body.documentData) {
      request.documentData = req.body.documentData;
    } else if (req.body.text) {
      request.documentData = Buffer.from(req.body.text).toString('base64');
    } else {
      return res.status(400).json({
        success: false,
        error: 'No document or text provided'
      });
    }

    const result = await enhancedMultimodalService.processDocument(request);

    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        summary: result.results.summary,
        metadata: result.metadata
      }
    });

  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Summarization failed'
    });
  }
});

/**
 * POST /api/multimodal/document/translate
 * Translate a document
 */
router.post('/document/translate', async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const request: DocumentProcessingRequest = {
      documentData: Buffer.from(text).toString('base64'),
      documentType: 'text',
      operations: ['translate'],
      options: {
        language: sourceLanguage || 'en',
        targetLanguage: targetLanguage || 'es'
      }
    };

    const result = await enhancedMultimodalService.processDocument(request);

    res.json({
      success: true,
      data: {
        translation: result.results.translation,
        sourceLanguage: sourceLanguage || 'en',
        targetLanguage: targetLanguage || 'es',
        metadata: result.metadata
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed'
    });
  }
});

/**
 * POST /api/multimodal/document/qa
 * Answer questions about a document
 */
router.post('/document/qa', upload.single('document'), async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    const request: DocumentProcessingRequest = {
      documentType: 'text',
      operations: ['qa'],
      options: { question }
    };

    if (req.file) {
      request.documentPath = req.file.path;
    } else if (req.body.documentData) {
      request.documentData = req.body.documentData;
    } else if (req.body.text) {
      request.documentData = Buffer.from(req.body.text).toString('base64');
    } else {
      return res.status(400).json({
        success: false,
        error: 'No document or text provided'
      });
    }

    const result = await enhancedMultimodalService.processDocument(request);

    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        question,
        answer: result.results.answer,
        metadata: result.metadata
      }
    });

  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Q&A failed'
    });
  }
});

// ==================== Multimodal Chat Routes ====================

/**
 * POST /api/multimodal/chat
 * Multimodal conversation with text and images
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, model, maxTokens, temperature } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    const result = await enhancedMultimodalService.chat({
      messages,
      model,
      maxTokens,
      temperature
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat failed'
    });
  }
});

// ==================== Status & Capabilities ====================

/**
 * GET /api/multimodal/capabilities
 * Get available multimodal capabilities
 */
router.get('/capabilities', (req: Request, res: Response) => {
  const capabilities = enhancedMultimodalService.getCapabilities();
  const stats = enhancedMultimodalService.getStats();

  res.json({
    success: true,
    data: {
      capabilities,
      stats,
      features: {
        vision: {
          enabled: capabilities.vision,
          analysisTypes: ['describe', 'ocr', 'objects', 'faces', 'scene', 'custom'],
          models: ['gpt-4o', 'gpt-4o-mini']
        },
        speechToText: {
          enabled: capabilities.speechToText,
          models: ['whisper-1'],
          formats: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
        },
        textToSpeech: {
          enabled: capabilities.textToSpeech,
          providers: {
            openai: capabilities.textToSpeech,
            elevenlabs: capabilities.elevenLabs
          },
          formats: ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']
        },
        documentProcessing: {
          enabled: capabilities.documentProcessing,
          operations: ['extract_text', 'summarize', 'translate', 'analyze', 'qa'],
          supportedTypes: ['text', 'pdf', 'image', 'office']
        }
      }
    }
  });
});

/**
 * GET /api/multimodal/health
 * Health check for multimodal services
 */
router.get('/health', (req: Request, res: Response) => {
  const capabilities = enhancedMultimodalService.getCapabilities();

  res.json({
    success: true,
    data: {
      status: 'healthy',
      services: {
        vision: capabilities.vision ? 'operational' : 'unavailable',
        speechToText: capabilities.speechToText ? 'operational' : 'unavailable',
        textToSpeech: capabilities.textToSpeech ? 'operational' : 'unavailable',
        documentProcessing: capabilities.documentProcessing ? 'operational' : 'unavailable',
        elevenLabs: capabilities.elevenLabs ? 'operational' : 'unavailable'
      },
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
