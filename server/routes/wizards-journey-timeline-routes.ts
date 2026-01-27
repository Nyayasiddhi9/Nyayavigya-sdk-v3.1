/**
 * Wizards Journey Timeline API Routes
 * Visual progress tracking for 14-day MVP journey
 */

import express, { type Request, type Response } from 'express';
import { db } from '../db';
import { wizardsStudioSessions, wizardsStartups, wizardsFounders } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { WIZARDS_STUDIOS } from '@shared/wizards-incubator-types';
import { journeyTrackerService } from '../services/journey-tracker-service';

const router = express.Router();

/**
 * GET /api/wizards/journey/timeline/:startupId
 * Get visual timeline data for startup's 14-day journey
 */
router.get('/timeline/:startupId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const startupId = parseInt(req.params.startupId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Verify startup belongs to current user
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
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

    // Get all studio sessions for this startup
    const sessions = await db
      .select()
      .from(wizardsStudioSessions)
      .where(eq(wizardsStudioSessions.startupId, startupId));

    // Calculate studio progress
    const studioProgress = WIZARDS_STUDIOS.map(studio => {
      const session = sessions.find(s => s.studioId === studio.id);
      
      if (!session) {
        return {
          studioId: studio.id,
          status: 'not_started' as const,
          creditsUsed: 0,
        };
      }

      return {
        studioId: studio.id,
        status: session.status === 'completed' 
          ? 'completed' as const
          : session.status === 'in_progress' 
            ? 'in_progress' as const 
            : 'not_started' as const,
        completedAt: session.completedAt,
        creditsUsed: session.creditsConsumed || 0,
        qualityScore: session.qualityScore || undefined,
      };
    });

    // Calculate overall metrics
    const completedStudios = studioProgress.filter(s => s.status === 'completed').length;
    const inProgressStudios = studioProgress.filter(s => s.status === 'in_progress').length;
    const totalStudios = WIZARDS_STUDIOS.length;
    const overallProgress = Math.round((completedStudios / totalStudios) * 100);

    // Determine current day and phase
    const completedDays = WIZARDS_STUDIOS
      .filter(s => studioProgress.find(p => p.studioId === s.id)?.status === 'completed')
      .reduce((sum, s) => sum + s.estimatedDays, 0);

    const currentDay = Math.min(completedDays + 1, 14);
    
    // Determine current phase based on completed studios
    let currentPhase = 'Discovery';
    if (completedStudios >= 7) currentPhase = 'Launch';
    else if (completedStudios >= 5) currentPhase = 'Development';
    else if (completedStudios >= 3) currentPhase = 'Design';
    else if (completedStudios >= 2) currentPhase = 'Planning';

    const journeyData = {
      currentDay,
      totalDays: 14,
      currentPhase,
      studioProgress,
      overallProgress,
      metrics: {
        completedStudios,
        inProgressStudios,
        totalStudios,
        totalCreditsUsed: studioProgress.reduce((sum, s) => sum + s.creditsUsed, 0),
      },
    };

    res.json({
      success: true,
      journey: journeyData,
    });
  } catch (error: any) {
    console.error('Journey timeline fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch journey timeline',
    });
  }
});

/**
 * GET /api/wizards/journey/milestones/:startupId
 * Get key milestones and achievements for startup
 */
router.get('/milestones/:startupId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const startupId = parseInt(req.params.startupId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get completed sessions with quality scores
    const completedSessions = await db
      .select()
      .from(wizardsStudioSessions)
      .where(
        and(
          eq(wizardsStudioSessions.startupId, startupId),
          eq(wizardsStudioSessions.status, 'completed')
        )
      );

    const milestones = completedSessions.map(session => {
      const studio = WIZARDS_STUDIOS.find(s => s.id === session.studioId);
      return {
        id: session.id,
        title: `${studio?.icon} ${studio?.name} Completed`,
        description: `Finished with ${session.qualityScore || 0}% quality score`,
        completedAt: session.completedAt,
        creditsUsed: session.creditsConsumed || 0,
        studioId: session.studioId,
      };
    });

    res.json({
      success: true,
      milestones,
    });
  } catch (error: any) {
    console.error('Milestones fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch milestones',
    });
  }
});

/**
 * GET /api/wizards/journey/progress/:startupId
 * Get structured progress data from journey_milestones and journey_progress tables
 */
router.get('/progress/:startupId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const startupId = parseInt(req.params.startupId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Verify startup belongs to current user
    const [startup] = await db
      .select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
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

    const progressData = await journeyTrackerService.getStartupProgress(startupId, userId);
    const statistics = await journeyTrackerService.getJourneyStatistics(startupId);

    res.json({
      success: true,
      data: {
        ...progressData,
        statistics,
      },
    });
  } catch (error: any) {
    console.error('Journey progress fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch journey progress',
    });
  }
});

/**
 * POST /api/wizards/journey/initialize
 * Initialize journey progress for a new startup
 */
router.post('/initialize', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!startupId || isNaN(parseInt(startupId))) {
      return res.status(400).json({
        success: false,
        error: 'Valid startup ID is required',
      });
    }

    await journeyTrackerService.initializeJourneyProgress(parseInt(startupId), userId);

    res.json({
      success: true,
      message: 'Journey progress initialized',
    });
  } catch (error: any) {
    console.error('Journey initialization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize journey',
    });
  }
});

/**
 * PATCH /api/wizards/journey/milestone/:studioId
 * Update milestone progress for a studio
 */
router.patch('/milestone/:studioId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const studioId = req.params.studioId;
    const userId = req.user?.id;
    const { startupId, status, qualityScore, timeSpent, artifacts } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!startupId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Startup ID and status are required',
      });
    }

    const updated = await journeyTrackerService.updateMilestoneProgress(
      userId,
      parseInt(startupId),
      studioId,
      status,
      { qualityScore, timeSpent, artifacts }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found',
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Milestone update error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update milestone',
    });
  }
});

export default router;
