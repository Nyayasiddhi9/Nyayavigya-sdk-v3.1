/**
 * Wizards Ideation Lab API Routes
 * Studio 1: Idea validation, market research, business model canvas
 */

import express, { type Request, type Response } from 'express';
import { db } from '../db';
import { wizardsStartups, wizardsFounders, wizardsStudioSessions, wizardsStudioTasks, wizardsArtifacts } from '@shared/schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { WizardsIdeationLabService } from '../services/studios/wizards-ideation-lab';
import { wizardsStudioEngineService } from '../services/wizards-studio-engine';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { sharedAGUIService } from '../services/shared-agui-service';

const router = express.Router();
const ideationLab = new WizardsIdeationLabService();
const aguiService = sharedAGUIService; // Use shared singleton instance

/**
 * POST /api/wizards/studios/ideation-lab/sessions
 * Create or retrieve existing studio session for authenticated user's startup
 */
router.post('/sessions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!startupId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: startupId',
      });
    }

    // Verify startup belongs to current user
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(
        wizardsFounders,
        eq(wizardsStartups.founderId, wizardsFounders.id)
      )
      .where(
        and(
          eq(wizardsStartups.id, startupId),
          eq(wizardsFounders.userId, userId)
        )
      )
      .limit(1);

    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found or access denied',
      });
    }

    // Check for existing active or in-progress session (reuse if exists)
    const existingSessions = await db
      .select()
      .from(wizardsStudioSessions)
      .where(
        and(
          eq(wizardsStudioSessions.startupId, startupId),
          eq(wizardsStudioSessions.studioId, 'ideation-lab'),
          // Match actual persisted status values
          sql`${wizardsStudioSessions.status} IN ('active', 'in_progress')`
        )
      )
      .orderBy(desc(wizardsStudioSessions.createdAt))
      .limit(1);

    let session;
    if (existingSessions.length > 0) {
      session = existingSessions[0];
    } else {
      // Create new session (PHASE 2.2: Now passes userId for session manager integration)
      session = await wizardsStudioEngineService.startStudioSession(
        startupId,
        'ideation-lab',
        userId,
        {
          deterministicMode: false,
        }
      );
    }

    res.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('Session creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create session',
    });
  }
});

/**
 * GET /api/wizards/studios/ideation-lab/detail
 * Get studio details including tasks and artifacts for authenticated user
 */
router.get('/detail', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get user's startups
    const startups = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(
        wizardsFounders,
        eq(wizardsStartups.founderId, wizardsFounders.id)
      )
      .where(eq(wizardsFounders.userId, userId));

    if (startups.length === 0) {
      return res.json({
        success: true,
        tasks: [],
        artifacts: [],
        sessions: [],
      });
    }

    const startupIds = startups.map(s => s.wizards_startups.id);

    // Get all sessions for this studio and user's startups (use inArray for multiple IDs)
    const sessions = await db
      .select()
      .from(wizardsStudioSessions)
      .where(
        and(
          eq(wizardsStudioSessions.studioId, 'ideation-lab'),
          inArray(wizardsStudioSessions.startupId, startupIds)
        )
      )
      .orderBy(desc(wizardsStudioSessions.createdAt));

    const sessionIds = sessions.map(s => s.id);

    // Get tasks for these sessions (use inArray for multiple session IDs)
    const tasks = sessionIds.length > 0
      ? await db
          .select()
          .from(wizardsStudioTasks)
          .where(inArray(wizardsStudioTasks.sessionId, sessionIds))
          .orderBy(desc(wizardsStudioTasks.createdAt))
      : [];

    // Get artifacts for user's startups (use inArray for multiple startup IDs)
    const artifacts = startupIds.length > 0
      ? await db
          .select()
          .from(wizardsArtifacts)
          .where(
            and(
              eq(wizardsArtifacts.studioId, 'ideation-lab'),
              inArray(wizardsArtifacts.startupId, startupIds)
            )
          )
          .orderBy(desc(wizardsArtifacts.createdAt))
      : [];

    res.json({
      success: true,
      tasks,
      artifacts,
      sessions,
    });
  } catch (error: any) {
    console.error('Studio detail fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch studio details',
    });
  }
});

/**
 * POST /api/wizards/ideation-lab/validate-idea
 * Run AI-powered idea validation
 */
router.post('/validate-idea', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startupId, sessionId, ideaDescription, industry, targetMarket } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!startupId || !ideaDescription) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: startupId, ideaDescription',
      });
    }

    // Verify startup belongs to current user
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(
        wizardsFounders,
        eq(wizardsStartups.founderId, wizardsFounders.id)
      )
      .where(
        and(
          eq(wizardsStartups.id, startupId),
          eq(wizardsFounders.userId, userId)
        )
      )
      .limit(1);

    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found or access denied',
      });
    }

    // Create AG-UI session with sessionId (null is ok, will be updated)
    const aguiSession = aguiService.createSession(
      startupId,
      sessionId || null,
      'ideation-lab-validate-idea',
      userId
    );

    const result = await ideationLab.validateIdea(
      startupId,
      sessionId,
      ideaDescription,
      {
        industry,
        targetMarket,
        deterministicMode: false,
        aguiSessionId: aguiSession.id,
      }
    );

    // ✅ Back-patch AG-UI session with auto-created sessionId
    if (!sessionId && result.sessionId) {
      aguiService.updateSessionId(aguiSession.id, result.sessionId);
    }

    res.json({
      success: true,
      validation: result.validation,
      sessionId: result.sessionId,
      taskId: result.taskId,
      artifactId: result.artifactId,
      creditsUsed: result.validation.viabilityScore || 0, // Mock credits for now
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Idea validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate idea',
    });
  }
});

/**
 * POST /api/wizards/ideation-lab/market-research
 * Conduct AI-powered market research
 */
router.post('/market-research', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startupId, sessionId, marketDescription, industry, geography } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!startupId || !sessionId || !marketDescription) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: startupId, sessionId, marketDescription',
      });
    }

    // Verify startup belongs to current user
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(
        wizardsFounders,
        eq(wizardsStartups.founderId, wizardsFounders.id)
      )
      .where(
        and(
          eq(wizardsStartups.id, startupId),
          eq(wizardsFounders.userId, userId)
        )
      )
      .limit(1);

    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found or access denied',
      });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = aguiService.createSession(
      startupId,
      sessionId,
      'ideation-lab-market-research',
      userId
    );

    const result = await ideationLab.conductMarketResearch(
      startupId,
      sessionId,
      marketDescription,
      {
        industry,
        geography,
        deterministicMode: false,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      research: result.research,
      taskId: result.taskId,
      artifactId: result.artifactId,
      creditsUsed: 150, // Mock credits
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Market research error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to conduct market research',
    });
  }
});

/**
 * POST /api/wizards/ideation-lab/business-model-canvas
 * Generate business model canvas with AI
 */
router.post('/business-model-canvas', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startupId, sessionId, ideaDescription, valueProposition } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!startupId || !sessionId || !ideaDescription) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: startupId, sessionId, ideaDescription',
      });
    }

    // Verify startup belongs to current user
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(
        wizardsFounders,
        eq(wizardsStartups.founderId, wizardsFounders.id)
      )
      .where(
        and(
          eq(wizardsStartups.id, startupId),
          eq(wizardsFounders.userId, userId)
        )
      )
      .limit(1);

    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found or access denied',
      });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = aguiService.createSession(
      startupId,
      sessionId,
      'ideation-lab-business-model-canvas',
      userId
    );

    const result = await ideationLab.generateBusinessModelCanvas(
      startupId,
      sessionId,
      ideaDescription,
      {
        valueProposition,
        deterministicMode: false,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      canvas: result.canvas,
      taskId: result.taskId,
      artifactId: result.artifactId,
      creditsUsed: 120, // Mock credits
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Business model canvas error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate business model canvas',
    });
  }
});

export default router;
