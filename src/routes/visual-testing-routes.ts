import { Router, Request, Response } from 'express';
import { VisualTestingService, visualTestConfigSchema, testGenerationRequestSchema } from '../services/visual-testing-service';
import { z } from 'zod';

const router = Router();
const visualTestingService = new VisualTestingService();

/**
 * Run visual regression test
 * POST /api/visual-testing/run
 */
router.post('/run', async (req: Request, res: Response) => {
  try {
    const config = visualTestConfigSchema.parse(req.body);
    const result = await visualTestingService.runVisualTest(config);
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * Generate test code using WAI SDK
 * POST /api/visual-testing/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const request = testGenerationRequestSchema.parse(req.body);
    const result = await visualTestingService.generateTest(request);
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * List all baselines
 * GET /api/visual-testing/baselines
 */
router.get('/baselines', async (req: Request, res: Response) => {
  try {
    const result = await visualTestingService.listBaselines();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Delete a baseline
 * DELETE /api/visual-testing/baselines/:filename
 */
router.delete('/baselines/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    if (!filename || !filename.endsWith('.png')) {
      res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
      return;
    }

    const result = await visualTestingService.deleteBaseline(filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
