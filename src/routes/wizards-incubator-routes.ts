/**
 * Wizards Incubator v3.1 API Routes
 * 
 * Endpoints for managing the 10 Wizards Studios with WAI SDK v3.1 features
 * 
 * @version 3.1.0
 * @date January 25, 2026
 */

import { Router, Request, Response } from 'express';
import { wizardsIncubatorUpgrade } from '../services/wizards-incubator-v31-upgrade';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  try {
    const stats = wizardsIncubatorUpgrade.getStats();
    res.json({
      success: true,
      service: 'Wizards Incubator v3.1',
      version: '3.1.0',
      status: 'healthy',
      stats,
      waiSdkVersion: '3.1.0',
      features: [
        'Graph Memory (Mem0g)',
        'Adaptive/Corrective/Self-RAG',
        'Maker-Checker Pattern',
        '8 Reasoning Strategies',
        'Enhanced Orchestration',
        'WizardSmith Observability'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/studios', (_req: Request, res: Response) => {
  try {
    const studios = wizardsIncubatorUpgrade.getAllStudioConfigs();
    res.json({
      success: true,
      count: studios.length,
      studios: studios.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        agents: s.agentsUsed.length,
        featuresEnabled: s.waiFeaturesEnabled.filter(f => f.enabled).length,
        ragType: s.ragConfiguration.type,
        memoryTypes: s.memoryConfiguration.memoryTypes,
        reasoningStrategies: s.reasoningStrategies,
        orchestrationPattern: s.orchestrationPattern
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/studios/:studioName', (req: Request, res: Response) => {
  try {
    const { studioName } = req.params;
    const decodedName = decodeURIComponent(studioName);
    const studio = wizardsIncubatorUpgrade.getStudioConfig(decodedName);

    if (!studio) {
      return res.status(404).json({
        success: false,
        error: `Studio not found: ${decodedName}`
      });
    }

    res.json({
      success: true,
      studio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/studios/:studioName/upgrade', async (req: Request, res: Response) => {
  try {
    const { studioName } = req.params;
    const decodedName = decodeURIComponent(studioName);
    
    const result = await wizardsIncubatorUpgrade.upgradeStudio(decodedName);

    res.json({
      success: true,
      result,
      message: `${decodedName} upgraded to WAI SDK v3.1`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/upgrade-all', async (_req: Request, res: Response) => {
  try {
    const results = await wizardsIncubatorUpgrade.upgradeAllStudios();

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      },
      message: `All ${results.length} studios upgraded to WAI SDK v3.1`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/feature-matrix', (_req: Request, res: Response) => {
  try {
    const matrix = wizardsIncubatorUpgrade.getFeatureMatrix();
    res.json({
      success: true,
      matrix
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = wizardsIncubatorUpgrade.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
