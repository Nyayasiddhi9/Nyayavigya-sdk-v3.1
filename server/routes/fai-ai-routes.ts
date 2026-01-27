/**
 * Fai.ai API Routes
 * 
 * Exposes Fai.ai content and video generation capabilities
 */

import { Router } from 'express';
import { faiAIService } from '../services/fai-ai-integration';

const router = Router();

router.get('/status', async (req, res) => {
  try {
    const status = await faiAIService.checkStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check Fai.ai status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/models', (req, res) => {
  try {
    const models = faiAIService.getAvailableModels();
    res.json({
      success: true,
      data: { models },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get models',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/capabilities', (req, res) => {
  try {
    const capabilities = faiAIService.getCapabilities();
    res.json({
      success: true,
      data: capabilities,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get capabilities',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/generate/video', async (req, res) => {
  try {
    const { prompt, duration, aspectRatio, quality, style, fps, seed } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: prompt',
      });
    }

    const result = await faiAIService.generateVideo({
      prompt,
      duration,
      aspectRatio,
      quality,
      style,
      fps,
      seed,
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate video',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/generate/image-to-video', async (req, res) => {
  try {
    const { imageUrl, prompt, duration, motionStrength, quality } = req.body;

    if (!imageUrl || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: imageUrl and prompt',
      });
    }

    const result = await faiAIService.imageToVideo({
      imageUrl,
      prompt,
      duration,
      motionStrength,
      quality,
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate image-to-video',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/generate/content', async (req, res) => {
  try {
    const { type, topic, length, tone, language, keywords } = req.body;

    if (!type || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type and topic',
      });
    }

    const result = await faiAIService.generateContent({
      type,
      topic,
      length,
      tone,
      language,
      keywords,
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate content',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/generations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await faiAIService.getGenerationStatus(id);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get generation status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
