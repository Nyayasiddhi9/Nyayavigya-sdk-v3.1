/**
 * Third-Party Integrations API Routes
 * Handles Openmanus, ChatDollKit, EchoMimic, Unity 3D, MCP Server integrations
 */

import { Router } from 'express';
import { thirdPartyIntegrationsService } from '../services/third-party-integrations';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Integration Status
router.get('/status', async (req, res) => {
  try {
    const status = thirdPartyIntegrationsService.getIntegrationStatus();
    res.json({
      success: true,
      integrations: status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error'
    });
  }
});

// Openmanus - Video/Movie Creation
router.post('/openmanus/create-video', async (req, res) => {
  try {
    const { prompt, type, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await thirdPartyIntegrationsService.createVideo(prompt, type, options);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error'
    });
  }
});

// ChatDollKit - 3D Avatar Creation
router.post('/chatdollkit/create-avatar', async (req, res) => {
  try {
    const { config } = req.body;
    const result = await thirdPartyIntegrationsService.create3DAvatar(config);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error'
    });
  }
});

// EchoMimic - Voice Cloning
router.post('/echomimic/clone-voice', upload.single('audioSample'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio sample is required'
      });
    }

    const { targetLanguages } = req.body;
    const languages = targetLanguages ? JSON.parse(targetLanguages) : ['en'];
    
    const result = await thirdPartyIntegrationsService.cloneVoice(req.file.buffer, languages);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error'
    });
  }
});

// Unity 3D - Environment Creation
router.post('/unity3d/create-environment', async (req, res) => {
  try {
    const { config } = req.body;
    const result = await thirdPartyIntegrationsService.createUnityEnvironment(config);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error'
    });
  }
});

// MCP Server - Component Integration
router.post('/mcp-server/integrate', async (req, res) => {
  try {
    const result = await thirdPartyIntegrationsService.integrateMCPServer();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error'
    });
  }
});

// Multi-Modal Content Creation
router.post('/create-content', async (req, res) => {
  try {
    const { type, prompt, config } = req.body;
    let result;

    switch (type) {
      case 'video':
      case 'movie':
      case 'presentation':
        result = await thirdPartyIntegrationsService.createVideo(prompt, type, config);
        break;
      case '3d-avatar':
        result = await thirdPartyIntegrationsService.create3DAvatar(config);
        break;
      case 'unity-environment':
        result = await thirdPartyIntegrationsService.createUnityEnvironment(config);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported content type: ${type}`
        });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error'
    });
  }
});

export { router as thirdPartyIntegrationsRouter };