import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { duplicateDetectionGuardrail, isAllowedPath } from '../middleware/duplicate-detection-guardrail';

const router = Router();

const scanRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many scan requests, please try again later' }
});

router.get('/scan', scanRateLimiter, async (req: Request, res: Response) => {
  try {
    const basePath = 'wai-sdk';
    const report = await duplicateDetectionGuardrail.scanForDuplicates(basePath);
    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/enforce', async (req: Request, res: Response) => {
  try {
    const result = await duplicateDetectionGuardrail.enforceNoDuplicates();
    res.json({
      success: true,
      passed: result.passed,
      violations: result.violations,
      message: result.passed 
        ? 'No critical duplicates detected' 
        : `${result.violations.length} duplicate violations found`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/canonical', (req: Request, res: Response) => {
  res.json({
    success: true,
    canonicalLocations: duplicateDetectionGuardrail.CANONICAL_LOCATIONS,
    criticalPatterns: duplicateDetectionGuardrail.CRITICAL_PATTERNS
  });
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const enforcement = await duplicateDetectionGuardrail.enforceNoDuplicates();
    res.json({
      success: true,
      guardrailStatus: enforcement.passed ? 'healthy' : 'violations_detected',
      violationCount: enforcement.violations.length,
      lastCheck: new Date().toISOString(),
      canonicalFiles: Object.keys(duplicateDetectionGuardrail.CANONICAL_LOCATIONS).length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      guardrailStatus: 'error',
      error: error.message
    });
  }
});

export default router;
