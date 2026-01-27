/**
 * LLM Models API Routes
 * 
 * Provides API access to the LLM Model Registry and Auto-Update Service
 */

import { Router, Request, Response } from 'express';
import { llmModelRegistry } from '../services/llm-model-registry';
import { llmAutoUpdateService } from '../services/llm-auto-update-service';

const router = Router();

router.get('/providers', (req: Request, res: Response) => {
  try {
    const providers = llmModelRegistry.getAllProviders();
    res.json({
      success: true,
      count: providers.length,
      providers: providers.map(p => ({
        id: p.providerId,
        name: p.providerName,
        status: p.status,
        modelCount: p.models.length,
        lastUpdated: p.lastUpdated
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/providers/:providerId', (req: Request, res: Response) => {
  try {
    const provider = llmModelRegistry.getProvider(req.params.providerId);
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    res.json({ success: true, provider });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/providers/:providerId/models', (req: Request, res: Response) => {
  try {
    const models = llmModelRegistry.getModelsByProvider(req.params.providerId);
    res.json({
      success: true,
      count: models.length,
      models
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/models', (req: Request, res: Response) => {
  try {
    const { capability, specialty, status } = req.query;
    let models = llmModelRegistry.getAllModels();

    if (capability && typeof capability === 'string') {
      models = models.filter(m => m.capabilities.includes(capability as any));
    }
    if (specialty && typeof specialty === 'string') {
      models = models.filter(m => m.specialties.includes(specialty as any));
    }
    if (status && typeof status === 'string') {
      models = models.filter(m => m.status === status);
    }

    res.json({
      success: true,
      count: models.length,
      models
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/models/:modelId', (req: Request, res: Response) => {
  try {
    const model = llmModelRegistry.getModel(req.params.modelId);
    if (!model) {
      return res.status(404).json({ success: false, error: 'Model not found' });
    }
    res.json({ success: true, model });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/models/select/best', (req: Request, res: Response) => {
  try {
    const { task, priority, contextNeeded, providers } = req.query;
    
    const model = llmModelRegistry.selectBestModel({
      task: (task as any) || 'general',
      priority: (priority as any) || 'quality',
      contextNeeded: contextNeeded ? parseInt(contextNeeded as string) : undefined,
      providers: providers ? (providers as string).split(',') : undefined
    });

    if (!model) {
      return res.status(404).json({ success: false, error: 'No suitable model found' });
    }

    res.json({ success: true, model });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/categories/reasoning', (req: Request, res: Response) => {
  try {
    const models = llmModelRegistry.getReasoningModels();
    res.json({ success: true, count: models.length, models });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/categories/coding', (req: Request, res: Response) => {
  try {
    const models = llmModelRegistry.getCodingModels();
    res.json({ success: true, count: models.length, models });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/categories/agents', (req: Request, res: Response) => {
  try {
    const models = llmModelRegistry.getAgentModels();
    res.json({ success: true, count: models.length, models });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = llmModelRegistry.getModelStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/auto-update/status', (req: Request, res: Response) => {
  try {
    const status = llmAutoUpdateService.getUpdateStatus();
    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/auto-update/config', (req: Request, res: Response) => {
  try {
    const config = llmAutoUpdateService.getConfig();
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/auto-update/config', (req: Request, res: Response) => {
  try {
    llmAutoUpdateService.configure(req.body);
    const config = llmAutoUpdateService.getConfig();
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/auto-update/run', async (req: Request, res: Response) => {
  try {
    const job = await llmAutoUpdateService.runFullUpdate();
    res.json({ success: true, job });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/auto-update/run/:providerId', async (req: Request, res: Response) => {
  try {
    const result = await llmAutoUpdateService.updateSingleProvider(req.params.providerId);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/auto-update/history', (req: Request, res: Response) => {
  try {
    const history = llmAutoUpdateService.getJobHistory();
    res.json({ success: true, count: history.length, history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/auto-update/start', (req: Request, res: Response) => {
  try {
    llmAutoUpdateService.startAutoUpdate();
    res.json({ success: true, message: 'Auto-update started' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/auto-update/stop', (req: Request, res: Response) => {
  try {
    llmAutoUpdateService.stopAutoUpdate();
    res.json({ success: true, message: 'Auto-update stopped' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
