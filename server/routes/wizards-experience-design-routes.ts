import express, { Request, Response } from 'express';
import { db } from '../db';
import { wizardsStudioSessions, wizardsStartups } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { wizardsExperienceDesignService } from '../services/studios/wizards-experience-design';
import { sharedAGUIService } from '../services/shared-agui-service';

const router = express.Router();

// Helper function to validate and parse integer IDs
function parseIntId(id: string, fieldName: string = 'ID'): number | null {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

/**
 * POST /api/wizards/experience-design/generate-uiux
 * Generate UI/UX design
 */
router.post('/generate-uiux', authenticateToken, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { startupId, sessionId, productDescription, targetAudience, designPreferences, brandGuidelines } = req.body;

    if (!startupId || !sessionId) {
      return res.status(400).json({ success: false, error: 'startupId and sessionId are required' });
    }

    const parsedStartupId = parseIntId(String(startupId), 'startupId');
    const parsedSessionId = parseIntId(String(sessionId), 'sessionId');

    if (!parsedStartupId || !parsedSessionId) {
      return res.status(400).json({ success: false, error: 'Invalid startupId or sessionId' });
    }

    // Verify startup ownership
    const [startup] = await db.select()
      .from(wizardsStartups)
      .where(and(
        eq(wizardsStartups.id, parsedStartupId),
        eq(wizardsStartups.founderId, userId)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found or access denied' });
    }

    // Verify session belongs to this startup
    const [session] = await db.select()
      .from(wizardsStudioSessions)
      .where(and(
        eq(wizardsStudioSessions.id, parsedSessionId),
        eq(wizardsStudioSessions.startupId, parsedStartupId)
      ))
      .limit(1);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or invalid' });
    }

    console.log(`📥 [Experience Design] POST /generate-uiux`, { 
      userId, 
      startupId: parsedStartupId, 
      sessionId: parsedSessionId 
    });

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      parsedStartupId,
      parsedSessionId,
      'experience-design-uiux',
      userId
    );

    const result = await wizardsExperienceDesignService.generateUIUXDesign(
      parsedStartupId,
      parsedSessionId,
      { productDescription, targetAudience, designPreferences, brandGuidelines },
      { aguiSessionId: aguiSession.id }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ [Experience Design] UI/UX design generated`, { 
      startupId: parsedStartupId, 
      taskId: result.task.id, 
      duration: `${duration}ms` 
    });

    res.json({
      success: true,
      task: result.task,
      artifact: result.artifact,
      message: 'UI/UX design generated successfully',
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Experience Design] UI/UX generation failed`, { 
      error: error.message, 
      duration: `${duration}ms` 
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/wizards/experience-design/generate-prototype
 * Generate interactive prototype
 */
router.post('/generate-prototype', authenticateToken, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { startupId, sessionId, featureName, userFlow, interactionDetails } = req.body;

    if (!startupId || !sessionId) {
      return res.status(400).json({ success: false, error: 'startupId and sessionId are required' });
    }

    const parsedStartupId = parseIntId(String(startupId), 'startupId');
    const parsedSessionId = parseIntId(String(sessionId), 'sessionId');

    if (!parsedStartupId || !parsedSessionId) {
      return res.status(400).json({ success: false, error: 'Invalid startupId or sessionId' });
    }

    // Verify startup ownership
    const [startup] = await db.select()
      .from(wizardsStartups)
      .where(and(
        eq(wizardsStartups.id, parsedStartupId),
        eq(wizardsStartups.founderId, userId)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found or access denied' });
    }

    // Verify session belongs to this startup
    const [session] = await db.select()
      .from(wizardsStudioSessions)
      .where(and(
        eq(wizardsStudioSessions.id, parsedSessionId),
        eq(wizardsStudioSessions.startupId, parsedStartupId)
      ))
      .limit(1);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or invalid' });
    }

    console.log(`📥 [Experience Design] POST /generate-prototype`, { 
      userId, 
      startupId: parsedStartupId, 
      sessionId: parsedSessionId 
    });

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      parsedStartupId,
      parsedSessionId,
      'experience-design-prototype',
      userId
    );

    const result = await wizardsExperienceDesignService.generatePrototype(
      parsedStartupId,
      parsedSessionId,
      { featureName, userFlow, interactionDetails },
      { aguiSessionId: aguiSession.id }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ [Experience Design] Prototype generated`, { 
      startupId: parsedStartupId, 
      taskId: result.task.id, 
      duration: `${duration}ms` 
    });

    res.json({
      success: true,
      task: result.task,
      artifact: result.artifact,
      message: 'Interactive prototype generated successfully',
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Experience Design] Prototype generation failed`, { 
      error: error.message, 
      duration: `${duration}ms` 
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/wizards/experience-design/generate-design-system
 * Generate design system
 */
router.post('/generate-design-system', authenticateToken, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { startupId, sessionId, brandName, colorPreferences, typography, componentNeeds } = req.body;

    if (!startupId || !sessionId) {
      return res.status(400).json({ success: false, error: 'startupId and sessionId are required' });
    }

    const parsedStartupId = parseIntId(String(startupId), 'startupId');
    const parsedSessionId = parseIntId(String(sessionId), 'sessionId');

    if (!parsedStartupId || !parsedSessionId) {
      return res.status(400).json({ success: false, error: 'Invalid startupId or sessionId' });
    }

    // Verify startup ownership
    const [startup] = await db.select()
      .from(wizardsStartups)
      .where(and(
        eq(wizardsStartups.id, parsedStartupId),
        eq(wizardsStartups.founderId, userId)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found or access denied' });
    }

    // Verify session belongs to this startup
    const [session] = await db.select()
      .from(wizardsStudioSessions)
      .where(and(
        eq(wizardsStudioSessions.id, parsedSessionId),
        eq(wizardsStudioSessions.startupId, parsedStartupId)
      ))
      .limit(1);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or invalid' });
    }

    console.log(`📥 [Experience Design] POST /generate-design-system`, { 
      userId, 
      startupId: parsedStartupId, 
      sessionId: parsedSessionId 
    });

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      parsedStartupId,
      parsedSessionId,
      'experience-design-system',
      userId
    );

    const result = await wizardsExperienceDesignService.generateDesignSystem(
      parsedStartupId,
      parsedSessionId,
      { brandName, colorPreferences, typography, componentNeeds },
      { aguiSessionId: aguiSession.id }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ [Experience Design] Design system generated`, { 
      startupId: parsedStartupId, 
      taskId: result.task.id, 
      duration: `${duration}ms` 
    });

    res.json({
      success: true,
      task: result.task,
      artifact: result.artifact,
      message: 'Design system generated successfully',
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Experience Design] Design system generation failed`, { 
      error: error.message, 
      duration: `${duration}ms` 
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/wizards/experience-design/generate-accessibility-audit
 * Generate accessibility audit
 */
router.post('/generate-accessibility-audit', authenticateToken, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { startupId, sessionId, productName, targetWCAGLevel, userGroups, designUrl } = req.body;

    if (!startupId || !sessionId) {
      return res.status(400).json({ success: false, error: 'startupId and sessionId are required' });
    }

    const parsedStartupId = parseIntId(String(startupId), 'startupId');
    const parsedSessionId = parseIntId(String(sessionId), 'sessionId');

    if (!parsedStartupId || !parsedSessionId) {
      return res.status(400).json({ success: false, error: 'Invalid startupId or sessionId' });
    }

    // Verify startup ownership
    const [startup] = await db.select()
      .from(wizardsStartups)
      .where(and(
        eq(wizardsStartups.id, parsedStartupId),
        eq(wizardsStartups.founderId, userId)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found or access denied' });
    }

    // Verify session belongs to this startup
    const [session] = await db.select()
      .from(wizardsStudioSessions)
      .where(and(
        eq(wizardsStudioSessions.id, parsedSessionId),
        eq(wizardsStudioSessions.startupId, parsedStartupId)
      ))
      .limit(1);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or invalid' });
    }

    console.log(`📥 [Experience Design] POST /generate-accessibility-audit`, { 
      userId, 
      startupId: parsedStartupId, 
      sessionId: parsedSessionId 
    });

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      parsedStartupId,
      parsedSessionId,
      'experience-design-accessibility',
      userId
    );

    const result = await wizardsExperienceDesignService.generateAccessibilityAudit(
      parsedStartupId,
      parsedSessionId,
      { productName, targetWCAGLevel, userGroups, designUrl },
      { aguiSessionId: aguiSession.id }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ [Experience Design] Accessibility audit generated`, { 
      startupId: parsedStartupId, 
      taskId: result.task.id, 
      duration: `${duration}ms` 
    });

    res.json({
      success: true,
      task: result.task,
      artifact: result.artifact,
      message: 'Accessibility audit generated successfully',
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Experience Design] Accessibility audit generation failed`, { 
      error: error.message, 
      duration: `${duration}ms` 
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
