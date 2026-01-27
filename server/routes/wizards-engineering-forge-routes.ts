/**
 * Wizards Engineering Forge Studio Routes
 * Studio 5: Full-stack code generation
 */

import { Router, type Request, type Response } from 'express';
import { wizardsEngineeringForgeService } from '../services/studios/wizards-engineering-forge';
import { db } from '../db';
import { wizardsFounders, wizardsStartups, wizardsStudioSessions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';
import { sharedAGUIService } from '../services/shared-agui-service';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * POST /api/wizards/engineering-forge/generate-frontend
 * Generate frontend code
 */
router.post('/generate-frontend', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, specification, techStack } = req.body;

    // Validate startup ownership
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsFounders.userId, userId),
        eq(wizardsStartups.id, startupId)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found or access denied',
      });
    }

    // Validate session ownership
    const [session] = await db
      .select()
      .from(wizardsStudioSessions)
      .where(and(
        eq(wizardsStudioSessions.id, sessionId),
        eq(wizardsStudioSessions.startupId, startupId)
      ))
      .limit(1);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or does not belong to this startup',
      });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'engineering-forge-frontend',
      userId
    );

    const result = await wizardsEngineeringForgeService.generateFrontendCode(
      startupId,
      sessionId,
      specification,
      { 
        techStack,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      code: result.code,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Frontend generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/engineering-forge/generate-backend
 * Generate backend code
 */
router.post('/generate-backend', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, specification, techStack } = req.body;

    // Validate startup ownership
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsFounders.userId, userId),
        eq(wizardsStartups.id, startupId)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found or access denied',
      });
    }

    // Validate session ownership
    const [session] = await db
      .select()
      .from(wizardsStudioSessions)
      .where(and(
        eq(wizardsStudioSessions.id, sessionId),
        eq(wizardsStudioSessions.startupId, startupId)
      ))
      .limit(1);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or does not belong to this startup',
      });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'engineering-forge-backend',
      userId
    );

    const result = await wizardsEngineeringForgeService.generateBackendCode(
      startupId,
      sessionId,
      specification,
      { 
        techStack,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      code: result.code,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Backend generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/engineering-forge/generate-database
 * Generate database schema code
 */
router.post('/generate-database', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, schema, databaseType, orm } = req.body;

    // Validate startup ownership
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsFounders.userId, userId),
        eq(wizardsStartups.id, startupId)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found or access denied',
      });
    }

    // Validate session ownership
    const [session] = await db
      .select()
      .from(wizardsStudioSessions)
      .where(and(
        eq(wizardsStudioSessions.id, sessionId),
        eq(wizardsStudioSessions.startupId, startupId)
      ))
      .limit(1);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or does not belong to this startup',
      });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'engineering-forge-database',
      userId
    );

    const result = await wizardsEngineeringForgeService.generateDatabaseCode(
      startupId,
      sessionId,
      schema,
      { 
        databaseType, 
        orm,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      code: result.code,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Database generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/engineering-forge/generate-fullstack
 * Generate complete full-stack application
 */
router.post('/generate-fullstack', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, projectName, specification, techStack } = req.body;

    // Validate startup ownership
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsFounders.userId, userId),
        eq(wizardsStartups.id, startupId)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found or access denied',
      });
    }

    // Validate session ownership
    const [session] = await db
      .select()
      .from(wizardsStudioSessions)
      .where(and(
        eq(wizardsStudioSessions.id, sessionId),
        eq(wizardsStudioSessions.startupId, startupId)
      ))
      .limit(1);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or does not belong to this startup',
      });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'engineering-forge-fullstack',
      userId
    );

    const result = await wizardsEngineeringForgeService.generateFullStackApp(
      startupId,
      sessionId,
      projectName,
      specification,
      { 
        techStack,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      application: result.application,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Full-stack generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/engineering-forge/detail
 * Get Engineering Forge studio details for a startup
 */
router.get('/detail', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const startupId = parseInt(req.query.startupId as string);

    // Validate startup ownership with specific ID
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsFounders.userId, userId),
        eq(wizardsStartups.id, startupId)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found or access denied',
      });
    }

    // Return empty arrays for tasks/artifacts (will be populated by studio engine queries)
    res.json({
      success: true,
      tasks: [],
      artifacts: [],
    });
  } catch (error: any) {
    console.error('Detail fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
