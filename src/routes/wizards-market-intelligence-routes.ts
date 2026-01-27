/**
 * Wizards Market Intelligence Studio Routes
 * Studio 2: Competitor analysis, customer personas, GTM strategy
 */

import { Router, type Request, type Response } from 'express';
import { wizardsMarketIntelligenceService } from '../services/studios/wizards-market-intelligence';
import { db } from '../db';
import { wizardsFounders, wizardsStartups, wizardsStudioSessions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';
import { sharedAGUIService } from '../services/shared-agui-service';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * POST /api/wizards/market-intelligence/analyze-competitors
 * Analyze competitors in the market
 */
router.post('/analyze-competitors', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, industry, competitors, targetMarket } = req.body;

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
      'market-intelligence-competitors',
      userId
    );

    const result = await wizardsMarketIntelligenceService.analyzeCompetitors(
      startupId,
      sessionId,
      industry,
      { 
        competitors, 
        targetMarket,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      analysis: result.analysis,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Competitor analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/market-intelligence/create-personas
 * Create customer personas
 */
router.post('/create-personas', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, targetMarket, numberOfPersonas, focusAreas } = req.body;

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
      'market-intelligence-personas',
      userId
    );

    const result = await wizardsMarketIntelligenceService.createCustomerPersonas(
      startupId,
      sessionId,
      targetMarket,
      { 
        numberOfPersonas, 
        focusAreas,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      personas: result.personas,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Persona creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/market-intelligence/generate-gtm
 * Generate Go-To-Market strategy
 */
router.post('/generate-gtm', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, productDescription, targetMarket, budget, launchTimeframe } = req.body;

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
      'market-intelligence-gtm',
      userId
    );

    const result = await wizardsMarketIntelligenceService.generateGTMStrategy(
      startupId,
      sessionId,
      productDescription,
      { 
        targetMarket, 
        budget, 
        launchTimeframe,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      strategy: result.strategy,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('GTM strategy generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/market-intelligence/analyze-trends
 * Analyze market trends
 */
router.post('/analyze-trends', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { startupId, sessionId, industry, timeframe, regions, trendCategories } = req.body;

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
      'market-intelligence-trends',
      userId
    );

    const result = await wizardsMarketIntelligenceService.analyzeMarketTrends(
      startupId,
      sessionId,
      industry,
      { 
        timeframe, 
        regions, 
        trendCategories,
        aguiSessionId: aguiSession.id,
      }
    );

    res.json({
      success: true,
      trends: result.trends,
      taskId: result.taskId,
      artifactId: result.artifactId,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error('Market trends analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/market-intelligence/detail
 * Get Market Intelligence studio details for a startup
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
