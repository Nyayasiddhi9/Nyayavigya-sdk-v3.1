import { Router, Request, Response } from 'express';
import { MultiLanguageSandbox, codeExecutionRequestSchema } from '../services/multi-language-sandbox';
import { z } from 'zod';

const router = Router();
const sandbox = new MultiLanguageSandbox();

/**
 * Execute code
 * POST /api/sandbox/execute
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const request = codeExecutionRequestSchema.parse(req.body);
    const result = await sandbox.executeCode(request);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid request', details: error.errors });
    } else {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
});

/**
 * Check language availability
 * GET /api/sandbox/languages
 */
router.get('/languages', async (req: Request, res: Response) => {
  try {
    const availability = await sandbox.checkLanguageAvailability();
    res.json({ success: true, languages: availability });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
