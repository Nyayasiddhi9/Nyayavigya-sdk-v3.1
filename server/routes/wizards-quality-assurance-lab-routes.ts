import express from 'express';
import { wizardsQualityAssuranceLabService } from '../services/studios/wizards-quality-assurance-lab';
import { authenticateToken } from '../middleware/auth';
import { db } from '../db';
import { wizardsStartups, wizardsStudioSessions, wizardsFounders } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { sharedAGUIService } from '../services/shared-agui-service';

const router = express.Router();

// Multi-layer authorization helper
async function validateStartupAndSession(userId: string, startupId: number, sessionId: number) {
  // First, get the founder by userId
  const founder = await db.query.wizardsFounders.findFirst({
    where: eq(wizardsFounders.userId, userId),
  });

  if (!founder) {
    return { valid: false, message: 'Founder profile not found' };
  }

  // Then verify startup belongs to this founder
  const startup = await db.query.wizardsStartups.findFirst({
    where: and(
      eq(wizardsStartups.id, startupId),
      eq(wizardsStartups.founderId, founder.id)
    ),
  });

  if (!startup) {
    return { valid: false, message: 'Startup not found or unauthorized' };
  }

  const session = await db.query.wizardsStudioSessions.findFirst({
    where: and(
      eq(wizardsStudioSessions.id, sessionId),
      eq(wizardsStudioSessions.startupId, startupId)
    ),
  });

  if (!session) {
    return { valid: false, message: 'Session not found or does not belong to this startup' };
  }

  return { valid: true };
}

/**
 * Generate test cases
 */
router.post('/generate-test-cases', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { startupId, sessionId, ...params } = req.body;

    if (!startupId || !sessionId) {
      return res.status(400).json({ message: 'startupId and sessionId are required' });
    }

    const validation = await validateStartupAndSession(userId, startupId, sessionId);
    if (!validation.valid) {
      return res.status(403).json({ message: validation.message });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'quality-assurance-lab-test-cases',
      userId
    );

    const result = await wizardsQualityAssuranceLabService.generateTestCases(
      startupId,
      sessionId,
      params,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('❌ [QA Lab Routes] Generate test cases error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate test cases' });
  }
});

/**
 * Generate QA strategy
 */
router.post('/generate-qa-strategy', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { startupId, sessionId, ...params } = req.body;

    if (!startupId || !sessionId) {
      return res.status(400).json({ message: 'startupId and sessionId are required' });
    }

    const validation = await validateStartupAndSession(userId, startupId, sessionId);
    if (!validation.valid) {
      return res.status(403).json({ message: validation.message });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'quality-assurance-lab-qa-strategy',
      userId
    );

    const result = await wizardsQualityAssuranceLabService.generateQAStrategy(
      startupId,
      sessionId,
      params,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('❌ [QA Lab Routes] Generate QA strategy error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate QA strategy' });
  }
});

/**
 * Generate automation setup
 */
router.post('/generate-automation-setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { startupId, sessionId, ...params } = req.body;

    if (!startupId || !sessionId) {
      return res.status(400).json({ message: 'startupId and sessionId are required' });
    }

    const validation = await validateStartupAndSession(userId, startupId, sessionId);
    if (!validation.valid) {
      return res.status(403).json({ message: validation.message });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'quality-assurance-lab-automation-setup',
      userId
    );

    const result = await wizardsQualityAssuranceLabService.generateAutomationSetup(
      startupId,
      sessionId,
      params,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('❌ [QA Lab Routes] Generate automation setup error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate automation setup' });
  }
});

/**
 * Generate complete QA suite
 */
router.post('/generate-complete-qa-suite', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { startupId, sessionId, ...params } = req.body;

    if (!startupId || !sessionId) {
      return res.status(400).json({ message: 'startupId and sessionId are required' });
    }

    const validation = await validateStartupAndSession(userId, startupId, sessionId);
    if (!validation.valid) {
      return res.status(403).json({ message: validation.message });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'quality-assurance-lab-complete-suite',
      userId
    );

    const result = await wizardsQualityAssuranceLabService.generateCompleteQASuite(
      startupId,
      sessionId,
      params,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('❌ [QA Lab Routes] Generate complete QA suite error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate complete QA suite' });
  }
});

export default router;
