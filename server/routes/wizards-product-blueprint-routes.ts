/**
 * Wizards Product Blueprint Studio Routes
 * Studio 3: Feature roadmap, user stories, technical specs
 */

import { Router, type Request, type Response } from 'express';
import { wizardsProductBlueprintService } from '../services/studios/wizards-product-blueprint';
import { db } from '../db';
import { wizardsFounders, wizardsStartups, wizardsStudioSessions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';
import { sharedAGUIService } from '../services/shared-agui-service';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * POST /api/wizards/product-blueprint/generate-roadmap
 * Generate feature roadmap
 */
router.post('/generate-roadmap', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, productVision, targetUsers, timeframe, constraints } = req.body;

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
      'product-blueprint-roadmap',
      userId
    );

    const result = await wizardsProductBlueprintService.generateFeatureRoadmap(
      startupId,
      sessionId,
      productVision,
      { 
        targetUsers, 
        timeframe, 
        constraints,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      roadmap: result.roadmap,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/product-blueprint/generate-user-stories
 * Generate user stories
 */
router.post('/generate-user-stories', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, featureDescription, userType, requirements } = req.body;

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
      'product-blueprint-user-stories',
      userId
    );

    const result = await wizardsProductBlueprintService.generateUserStories(
      startupId,
      sessionId,
      featureDescription,
      { 
        userType, 
        requirements,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      stories: result.stories,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('User stories generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/product-blueprint/generate-specs
 * Generate technical specifications
 */
router.post('/generate-specs', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, productDescription, technicalConstraints, scalabilityNeeds } = req.body;

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
      'product-blueprint-specs',
      userId
    );

    const result = await wizardsProductBlueprintService.generateTechnicalSpecs(
      startupId,
      sessionId,
      productDescription,
      { 
        technicalConstraints, 
        scalabilityNeeds,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      specs: result.specs,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Technical specs generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/product-blueprint/generate-prd
 * Generate Product Requirements Document
 */
router.post('/generate-prd', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, productConcept, targetMarket, businessGoals } = req.body;

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
      'product-blueprint-prd',
      userId
    );

    const result = await wizardsProductBlueprintService.generatePRD(
      startupId,
      sessionId,
      productConcept,
      { 
        targetMarket, 
        businessGoals,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      prd: result.prd,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('PRD generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/product-blueprint/detail
 * Get Product Blueprint studio details for a startup
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
