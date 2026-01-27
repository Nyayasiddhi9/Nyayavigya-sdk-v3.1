/**
 * Wizards Competitor Analysis Routes
 * Full CRUD operations for competitor tracking and analysis
 */

import { Router, type Request, type Response } from 'express';
import { db } from '../db';
import {
  wizardsCompetitors,
  wizardsCompetitorFeatures,
  wizardsCompetitorPricing,
  wizardsCompetitorAnalysis,
  wizardsStartups,
  wizardsFounders,
  insertWizardsCompetitorSchema,
  insertWizardsCompetitorFeatureSchema,
  insertWizardsCompetitorPricingSchema,
  insertWizardsCompetitorAnalysisSchema,
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Helper function to validate and parse integer IDs
function parseIntId(id: string, fieldName: string = 'ID'): number | null {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

// Apply authentication to all routes
router.use(authenticateToken);

// ================================================================================================
// COMPETITORS - Main CRUD Operations
// ================================================================================================

/**
 * GET /api/wizards/competitors
 * List all competitors for a startup
 */
router.get('/competitors', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { startupId, sessionId, threatLevel } = req.query;

    if (!startupId) {
      return res.status(400).json({ success: false, error: 'startupId is required' });
    }

    const startupIdNum = parseIntId(startupId as string);
    if (startupIdNum === null) {
      return res.status(400).json({ success: false, error: 'Invalid startupId' });
    }

    // Verify startup ownership
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsFounders.userId, userId),
        eq(wizardsStartups.id, startupIdNum)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found or access denied' });
    }

    // Build query with optional filters
    const conditions = [eq(wizardsCompetitors.startupId, startupIdNum)];
    
    if (sessionId) {
      const sessionIdNum = parseIntId(sessionId as string);
      if (sessionIdNum !== null) {
        conditions.push(eq(wizardsCompetitors.sessionId, sessionIdNum));
      }
    }

    if (threatLevel) {
      conditions.push(eq(wizardsCompetitors.threatLevel, threatLevel as string));
    }

    const competitors = await db
      .select()
      .from(wizardsCompetitors)
      .where(and(...conditions))
      .orderBy(desc(wizardsCompetitors.competitiveScore));

    res.json({ success: true, data: competitors, total: competitors.length });
  } catch (error: any) {
    console.error('List competitors error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/wizards/competitors/:id
 * Get single competitor with features and pricing
 */
router.get('/competitors/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const competitorId = parseIntId(req.params.id);
    if (competitorId === null) {
      return res.status(400).json({ success: false, error: 'Invalid competitor ID' });
    }

    // Get competitor with startup ownership verification
    const [result] = await db
      .select()
      .from(wizardsCompetitors)
      .innerJoin(wizardsStartups, eq(wizardsCompetitors.startupId, wizardsStartups.id))
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsCompetitors.id, competitorId),
        eq(wizardsFounders.userId, userId)
      ))
      .limit(1);

    if (!result) {
      return res.status(404).json({ success: false, error: 'Competitor not found or access denied' });
    }

    const competitor = result.wizards_competitors;

    // Get features
    const features = await db
      .select()
      .from(wizardsCompetitorFeatures)
      .where(eq(wizardsCompetitorFeatures.competitorId, competitorId));

    // Get pricing
    const pricing = await db
      .select()
      .from(wizardsCompetitorPricing)
      .where(eq(wizardsCompetitorPricing.competitorId, competitorId));

    res.json({
      success: true,
      data: {
        ...competitor,
        features,
        pricing,
      },
    });
  } catch (error: any) {
    console.error('Get competitor error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/wizards/competitors
 * Create new competitor
 */
router.post('/competitors', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const validatedData = insertWizardsCompetitorSchema.parse(req.body);

    // Verify startup ownership
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsFounders.userId, userId),
        eq(wizardsStartups.id, validatedData.startupId)
      ))
      .limit(1);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found or access denied' });
    }

    const [competitor] = await db
      .insert(wizardsCompetitors)
      .values(validatedData)
      .returning();

    res.status(201).json({ success: true, data: competitor });
  } catch (error: any) {
    console.error('Create competitor error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/wizards/competitors/:id
 * Update competitor
 */
router.put('/competitors/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const competitorId = parseIntId(req.params.id);
    if (competitorId === null) {
      return res.status(400).json({ success: false, error: 'Invalid competitor ID' });
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(wizardsCompetitors)
      .innerJoin(wizardsStartups, eq(wizardsCompetitors.startupId, wizardsStartups.id))
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsCompetitors.id, competitorId),
        eq(wizardsFounders.userId, userId)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Competitor not found or access denied' });
    }

    const [updated] = await db
      .update(wizardsCompetitors)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(wizardsCompetitors.id, competitorId))
      .returning();

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update competitor error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/wizards/competitors/:id
 * Delete competitor (cascade deletes features and pricing)
 */
router.delete('/competitors/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const competitorId = parseIntId(req.params.id);
    if (competitorId === null) {
      return res.status(400).json({ success: false, error: 'Invalid competitor ID' });
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(wizardsCompetitors)
      .innerJoin(wizardsStartups, eq(wizardsCompetitors.startupId, wizardsStartups.id))
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsCompetitors.id, competitorId),
        eq(wizardsFounders.userId, userId)
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Competitor not found or access denied' });
    }

    await db
      .delete(wizardsCompetitors)
      .where(eq(wizardsCompetitors.id, competitorId));

    res.json({ success: true, message: 'Competitor deleted successfully' });
  } catch (error: any) {
    console.error('Delete competitor error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================================================================
// COMPETITOR FEATURES - CRUD Operations
// ================================================================================================

/**
 * POST /api/wizards/competitors/:id/features
 * Add feature to competitor
 */
router.post('/competitors/:id/features', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const competitorId = parseIntId(req.params.id);
    if (competitorId === null) {
      return res.status(400).json({ success: false, error: 'Invalid competitor ID' });
    }

    // Verify ownership
    const [competitor] = await db
      .select()
      .from(wizardsCompetitors)
      .innerJoin(wizardsStartups, eq(wizardsCompetitors.startupId, wizardsStartups.id))
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsCompetitors.id, competitorId),
        eq(wizardsFounders.userId, userId)
      ))
      .limit(1);

    if (!competitor) {
      return res.status(404).json({ success: false, error: 'Competitor not found or access denied' });
    }

    const validatedData = insertWizardsCompetitorFeatureSchema.parse({
      ...req.body,
      competitorId,
      startupId: competitor.wizards_competitors.startupId,
    });

    const [feature] = await db
      .insert(wizardsCompetitorFeatures)
      .values(validatedData)
      .returning();

    res.status(201).json({ success: true, data: feature });
  } catch (error: any) {
    console.error('Add feature error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/wizards/competitors/:id/features
 * Get all features for a competitor
 */
router.get('/competitors/:id/features', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const competitorId = parseIntId(req.params.id);
    if (competitorId === null) {
      return res.status(400).json({ success: false, error: 'Invalid competitor ID' });
    }

    // Verify ownership
    const [competitor] = await db
      .select()
      .from(wizardsCompetitors)
      .innerJoin(wizardsStartups, eq(wizardsCompetitors.startupId, wizardsStartups.id))
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsCompetitors.id, competitorId),
        eq(wizardsFounders.userId, userId)
      ))
      .limit(1);

    if (!competitor) {
      return res.status(404).json({ success: false, error: 'Competitor not found or access denied' });
    }

    const features = await db
      .select()
      .from(wizardsCompetitorFeatures)
      .where(eq(wizardsCompetitorFeatures.competitorId, competitorId));

    res.json({ success: true, data: features });
  } catch (error: any) {
    console.error('Get features error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================================================================
// COMPETITOR PRICING - CRUD Operations
// ================================================================================================

/**
 * POST /api/wizards/competitors/:id/pricing
 * Add pricing plan to competitor
 */
router.post('/competitors/:id/pricing', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const competitorId = parseIntId(req.params.id);
    if (competitorId === null) {
      return res.status(400).json({ success: false, error: 'Invalid competitor ID' });
    }

    // Verify ownership
    const [competitor] = await db
      .select()
      .from(wizardsCompetitors)
      .innerJoin(wizardsStartups, eq(wizardsCompetitors.startupId, wizardsStartups.id))
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(and(
        eq(wizardsCompetitors.id, competitorId),
        eq(wizardsFounders.userId, userId)
      ))
      .limit(1);

    if (!competitor) {
      return res.status(404).json({ success: false, error: 'Competitor not found or access denied' });
    }

    const validatedData = insertWizardsCompetitorPricingSchema.parse({
      ...req.body,
      competitorId,
      startupId: competitor.wizards_competitors.startupId,
    });

    const [pricing] = await db
      .insert(wizardsCompetitorPricing)
      .values(validatedData)
      .returning();

    res.status(201).json({ success: true, data: pricing });
  } catch (error: any) {
    console.error('Add pricing error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// ================================================================================================
// COMPETITOR ANALYSIS - AI-Powered Analysis
// ================================================================================================

/**
 * POST /api/wizards/competitors/analyze
 * Generate AI-powered competitor analysis
 */
router.post('/competitors/analyze', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { startupId, competitorIds, analysisType = 'comprehensive' } = req.body;

    if (!startupId || !competitorIds || competitorIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'startupId and competitorIds are required' 
      });
    }

    // Verify startup ownership
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
      return res.status(404).json({ success: false, error: 'Startup not found or access denied' });
    }

    // Get all competitors
    const competitors = await db
      .select()
      .from(wizardsCompetitors)
      .where(and(
        eq(wizardsCompetitors.startupId, startupId),
        sql`${wizardsCompetitors.id} = ANY(${competitorIds})`
      ));

    if (competitors.length === 0) {
      return res.status(404).json({ success: false, error: 'No competitors found' });
    }

    // Create analysis record
    const [analysis] = await db
      .insert(wizardsCompetitorAnalysis)
      .values({
        startupId,
        analysisType,
        competitorIds: JSON.stringify(competitorIds),
        status: 'draft',
        aiModel: 'gpt-4',
        overallCompetitiveScore: 0, // Will be updated by AI
        marketFitScore: 0,
        innovationScore: 0,
      })
      .returning();

    res.status(201).json({ 
      success: true, 
      data: analysis,
      message: 'Analysis created. AI processing will complete asynchronously.'
    });
  } catch (error: any) {
    console.error('Create analysis error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/wizards/competitors/analysis/:startupId
 * Get all analyses for a startup
 */
router.get('/competitors/analysis/:startupId', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const startupId = parseIntId(req.params.startupId);
    if (startupId === null) {
      return res.status(400).json({ success: false, error: 'Invalid startup ID' });
    }

    // Verify ownership
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
      return res.status(404).json({ success: false, error: 'Startup not found or access denied' });
    }

    const analyses = await db
      .select()
      .from(wizardsCompetitorAnalysis)
      .where(eq(wizardsCompetitorAnalysis.startupId, startupId))
      .orderBy(desc(wizardsCompetitorAnalysis.createdAt));

    res.json({ success: true, data: analyses });
  } catch (error: any) {
    console.error('Get analyses error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
