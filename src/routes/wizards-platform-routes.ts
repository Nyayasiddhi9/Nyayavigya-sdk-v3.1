/**
 * Wizards Incubator Platform Routes
 * Complete API endpoints for 10 studios and founder workflows
 */

import express, { type Request, type Response } from 'express';
import { db } from '../db';
import { 
  wizardsFounders,
  wizardsStartups,
  wizardsStudios,
  wizardsStudioSessions,
  wizardsStudioTasks,
  wizardsStudioDeliverables,
  wizardsArtifacts,
  wizardsJourneyTimeline,
  wizardsOrchestrationJobs,
  wizardsCohorts,
  wizardsApplications,
  wizardsApplicationReviews,
  wizardsInvestors,
  wizardsInvestorMatches,
  wizardsInvestorConnections,
  insertWizardsFounderSchema,
  insertWizardsStartupSchema,
  insertWizardsCohortSchema,
  insertWizardsApplicationSchema,
  insertWizardsApplicationReviewSchema,
  insertWizardsInvestorSchema,
  insertWizardsInvestorMatchSchema,
  insertWizardsInvestorConnectionSchema,
  updateWizardsCohortSchema,
  updateWizardsApplicationSchema,
  type InsertWizardsFounder,
  type InsertWizardsStartup,
  type InsertWizardsStudioSession,
  type InsertWizardsCohort,
  type InsertWizardsApplication,
  type InsertWizardsApplicationReview,
  type InsertWizardsInvestor,
  type InsertWizardsInvestorMatch,
  type InsertWizardsInvestorConnection,
} from '@shared/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { wizardsOrchestrationService } from '../services/wizards-orchestration-service';
import { workflowSchedulerService } from '../services/workflow-scheduler-service';
import { WizardsArtifactStoreService } from '../services/wizards-artifact-store';
import { authenticateToken, requireAdmin, type AuthRequest } from '../middleware/auth';
import { validateBody, validateNumericId, requireQueryParams } from '../middleware/validation';
import { 
  sendValidationError, 
  sendDependencyError, 
  sendNotFoundError, 
  sendServerError,
  sendSuccess,
  sendCreated,
  sendAuthError 
} from '../utils/error-responses';
import { studioSessionManager } from '../services/wizards-studio-session-manager';
import { FEATURE_FLAGS } from '../config/feature-flags';

const wizardsArtifactStoreService = new WizardsArtifactStoreService();
import { z } from 'zod';
import wizardsIdeationLabRoutes from './wizards-ideation-lab-routes';
import wizardsEngineeringForgeRoutes from './wizards-engineering-forge-routes';
import wizardsMarketIntelligenceRoutes from './wizards-market-intelligence-routes';
import wizardsProductBlueprintRoutes from './wizards-product-blueprint-routes';
import wizardsExperienceDesignRoutes from './wizards-experience-design-routes';
import wizardsQualityAssuranceLabRoutes from './wizards-quality-assurance-lab-routes';
import wizardsLaunchCommandRoutes from './wizards-launch-command-routes';
import wizardsGrowthEngineRoutes from './wizards-growth-engine-routes';
import wizardsOperationsHubRoutes from './wizards-operations-hub-routes';
import wizardsDeploymentStudioRoutes from './wizards-deployment-studio-routes';
import wizardsCompetitorRoutes from './wizards-competitor-routes';

const router = express.Router();

// Helper function to validate and parse integer IDs
function parseIntId(id: string, fieldName: string = 'ID'): number | null {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

// ============================================================================
// FOUNDER MANAGEMENT
// ============================================================================

/**
 * POST /api/wizards/founders
 * Register new founder
 * 
 * PHASE 2.3: Updated to use validation middleware and standardized error responses
 */
router.post('/founders',
  validateBody(insertWizardsFounderSchema),
  async (req: Request, res: Response) => {
    try {
      const [founder] = await db.insert(wizardsFounders).values(req.body).returning();

      return sendCreated(res, { founder });
    } catch (error: any) {
      return sendServerError(res, error);
    }
  }
);

/**
 * GET /api/wizards/founders
 * List all founders with optional filters
 * 
 * PHASE 2.3: Updated to use standardized error responses
 */
router.get('/founders', async (req: Request, res: Response) => {
  try {
    const { startupStage, subscriptionTier } = req.query;
    
    let query = db.select().from(wizardsFounders);
    
    // Apply filters if provided
    const conditions = [];
    if (startupStage) {
      conditions.push(eq(wizardsFounders.startupStage, startupStage as string));
    }
    if (subscriptionTier) {
      conditions.push(eq(wizardsFounders.subscriptionTier, subscriptionTier as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const founders = await query.orderBy(desc(wizardsFounders.createdAt));
    
    return sendSuccess(res, {
      founders,
      total: founders.length,
    });
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/founders/:id
 * Get founder profile
 * 
 * PHASE 2.3: Updated to use standardized error responses and validation middleware
 */
router.get('/founders/:id',
  validateNumericId('id'),
  async (req: Request, res: Response) => {
    try {
      const founderId = (req as any).validatedId;
      
      const [founder] = await db
        .select()
        .from(wizardsFounders)
        .where(eq(wizardsFounders.id, founderId))
        .limit(1);

      if (!founder) {
        return sendNotFoundError(res, 'Founder');
      }

      return sendSuccess(res, { founder });
    } catch (error: any) {
      return sendServerError(res, error);
    }
  }
);

/**
 * GET /api/wizards/founders/me/dashboard
 * Get authenticated founder's dashboard with all startups
 * 
 * PHASE 2.3: Updated to use standardized error responses
 */
router.get('/founders/me/dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return sendAuthError(res);
    }

    // Get founder profile
    const [founder] = await db
      .select()
      .from(wizardsFounders)
      .where(eq(wizardsFounders.userId, userId))
      .limit(1);

    if (!founder) {
      return sendNotFoundError(res, 'Founder profile');
    }

    // Get all startups for this founder
    const startups = await db
      .select()
      .from(wizardsStartups)
      .where(eq(wizardsStartups.founderId, founder.id))
      .orderBy(desc(wizardsStartups.createdAt));

    // Get dashboard data for each startup
    const startupsWithDashboard = await Promise.all(
      startups.map(async (startup) => {
        const sessions = await db
          .select()
          .from(wizardsStudioSessions)
          .where(eq(wizardsStudioSessions.startupId, startup.id));

        const timeline = await db
          .select()
          .from(wizardsJourneyTimeline)
          .where(eq(wizardsJourneyTimeline.startupId, startup.id))
          .orderBy(wizardsJourneyTimeline.createdAt);

        return {
          ...startup,
          sessions: {
            total: sessions.length,
            active: sessions.filter(s => s.status === 'in_progress').length,
            completed: sessions.filter(s => s.status === 'completed').length,
          },
          timeline,
        };
      })
    );

    return sendSuccess(res, {
      founder,
      startups: startupsWithDashboard,
    });
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/credits/usage
 * Get comprehensive credit usage data for authenticated founder
 * 
 * PHASE 2.3: Updated to use standardized error responses
 */
router.get('/credits/usage', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return sendAuthError(res);
    }

    // Get founder profile
    const [founder] = await db
      .select()
      .from(wizardsFounders)
      .where(eq(wizardsFounders.userId, userId))
      .limit(1);

    if (!founder) {
      return sendNotFoundError(res, 'Founder profile');
    }

    // Get all startups for this founder
    const startups = await db
      .select()
      .from(wizardsStartups)
      .where(eq(wizardsStartups.founderId, founder.id));

    // Calculate total credits
    const totalAllocated = startups.reduce((sum, s) => sum + (s.creditsAllocated || 0), 0);
    const totalUsed = startups.reduce((sum, s) => sum + (s.creditsUsed || 0), 0);
    const creditsBalance = totalAllocated - totalUsed;

    // Get detailed usage per startup with sessions
    const startupsWithUsage = await Promise.all(
      startups.map(async (startup) => {
        const sessions = await db
          .select({
            id: wizardsStudioSessions.id,
            studioId: wizardsStudioSessions.studioId,
            creditsConsumed: wizardsStudioSessions.creditsConsumed,
            createdAt: wizardsStudioSessions.createdAt,
          })
          .from(wizardsStudioSessions)
          .where(eq(wizardsStudioSessions.startupId, startup.id))
          .orderBy(desc(wizardsStudioSessions.createdAt));

        // Map studio IDs to names
        const STUDIO_NAMES: Record<string, string> = {
          'ideation-lab': 'Ideation Lab',
          'engineering-forge': 'Engineering Forge',
          'market-intelligence': 'Market Intelligence',
          'product-blueprint': 'Product Blueprint',
          'experience-design': 'Experience Design',
          'quality-assurance-lab': 'Quality Assurance Lab',
          'growth-studio': 'Growth Engine',
          'launch-control': 'Launch Command',
          'operations-cockpit': 'Operations Hub',
          'compliance-shield': 'Deployment Studio',
        };

        return {
          id: startup.id,
          name: startup.name,
          creditsAllocated: startup.creditsAllocated || 0,
          creditsUsed: startup.creditsUsed || 0,
          sessions: sessions.map(s => ({
            id: s.id,
            studioId: s.studioId,
            studioName: STUDIO_NAMES[s.studioId] || s.studioId,
            creditsUsed: s.creditsConsumed || 0,
            createdAt: s.createdAt,
          })),
        };
      })
    );

    // Calculate usage by studio across all startups
    const usageByStudio: Record<string, number> = {};
    startupsWithUsage.forEach(startup => {
      startup.sessions.forEach(session => {
        if (!usageByStudio[session.studioId]) {
          usageByStudio[session.studioId] = 0;
        }
        usageByStudio[session.studioId] += session.creditsUsed;
      });
    });

    // Calculate usage by day (placeholder - would need timestamps)
    const usageByDay: Record<string, number> = {};

    return sendSuccess(res, {
      founder: {
        creditsBalance,
        totalAllocated,
        totalUsed,
      },
      startups: startupsWithUsage,
      usage: {
        byStudio: usageByStudio,
        byDay: usageByDay,
      },
    });
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

// ============================================================================
// STARTUP MANAGEMENT
// ============================================================================

/**
 * POST /api/wizards/startups
 * Create new startup for founder
 * 
 * PHASE 2.3: Updated to use validation middleware and standardized error responses
 */
router.post('/startups',
  authenticateToken,
  validateBody(insertWizardsStartupSchema.omit({ founderId: true, currentPhase: true, progress: true, creditsAllocated: true, creditsUsed: true })),
  async (req: AuthRequest, res: Response) => {
    try {
      // Get founder ID from authenticated user
      const userId = req.user?.id;
      if (!userId) {
        return sendAuthError(res);
      }

      // Find founder by userId
      const [founder] = await db.select().from(wizardsFounders).where(eq(wizardsFounders.userId, userId)).limit(1);
      if (!founder) {
        return sendNotFoundError(res, 'Founder profile');
      }

      const [startup] = await db.insert(wizardsStartups).values({
        ...req.body,
        founderId: founder.id,
        currentPhase: 'ideation',
        progress: 0,
        creditsAllocated: 1000,
        creditsUsed: 0,
      }).returning();

      // Create journey timeline entry
      await db.insert(wizardsJourneyTimeline).values({
        startupId: startup.id,
        eventType: 'milestone',
        eventName: 'Startup Created',
        eventDescription: `${startup.name} was created and ready to begin the 14-day journey`,
        studioName: 'ideation_lab',
        dayNumber: 1,
      });

      return sendCreated(res, { startup });
    } catch (error: any) {
      return sendServerError(res, error);
    }
  }
);

/**
 * GET /api/wizards/startups
 * List all startups with optional filters
 * 
 * PHASE 2.3: Updated to use standardized error responses
 */
router.get('/startups', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendAuthError(res);
    }

    // Get founder by userId
    const [founder] = await db.select().from(wizardsFounders).where(eq(wizardsFounders.userId, userId)).limit(1);
    if (!founder) {
      return sendNotFoundError(res, 'Founder profile');
    }

    const { status, currentPhase } = req.query;
    
    let query = db.select().from(wizardsStartups);
    
    // Apply filters - always filter by founder
    const conditions = [eq(wizardsStartups.founderId, founder.id)];
    
    if (status) {
      conditions.push(eq(wizardsStartups.status, status as string));
    }
    if (currentPhase) {
      conditions.push(eq(wizardsStartups.currentPhase, currentPhase as string));
    }
    
    query = query.where(and(...conditions)) as any;
    
    const startups = await query.orderBy(desc(wizardsStartups.createdAt));
    
    return sendSuccess(res, {
      startups,
      total: startups.length,
    });
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/startups/:id
 * Get startup details
 * 
 * PHASE 2.3: Updated to use standardized error responses and validation middleware
 */
router.get('/startups/:id',
  authenticateToken,
  validateNumericId('id'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendAuthError(res);
      }

      // Get founder by userId
      const [founder] = await db.select().from(wizardsFounders).where(eq(wizardsFounders.userId, userId)).limit(1);
      if (!founder) {
        return sendNotFoundError(res, 'Founder profile');
      }

      const startupId = (req as any).validatedId;
      
      const [startup] = await db
        .select()
        .from(wizardsStartups)
        .where(and(
          eq(wizardsStartups.id, startupId),
          eq(wizardsStartups.founderId, founder.id)
        ))
        .limit(1);

      if (!startup) {
        return sendNotFoundError(res, 'Startup');
      }

      // Get journey timeline
      const timeline = await db
        .select()
        .from(wizardsJourneyTimeline)
        .where(eq(wizardsJourneyTimeline.startupId, startupId))
        .orderBy(wizardsJourneyTimeline.createdAt);

      return sendSuccess(res, {
        startup: {
          ...startup,
          timeline,
        },
      });
    } catch (error: any) {
      return sendServerError(res, error);
    }
  }
);

/**
 * GET /api/wizards/startups/:id/dashboard
 * Get startup dashboard with all stats and progress
 * 
 * PHASE 2.3: Updated to use validation middleware and standardized error responses
 */
router.get('/startups/:id/dashboard',
  authenticateToken,
  validateNumericId('id'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendAuthError(res);
      }

      // Get founder by userId
      const [founder] = await db.select().from(wizardsFounders).where(eq(wizardsFounders.userId, userId)).limit(1);
      if (!founder) {
        return sendNotFoundError(res, 'Founder profile');
      }

      const startupId = (req as any).validatedId;
      
      // Get startup - verify ownership
      const [startup] = await db
        .select()
        .from(wizardsStartups)
        .where(and(
          eq(wizardsStartups.id, startupId),
          eq(wizardsStartups.founderId, founder.id)
        ))
        .limit(1);

      if (!startup) {
        return sendNotFoundError(res, 'Startup');
      }

    // Get all studio sessions
    const sessions = await db
      .select()
      .from(wizardsStudioSessions)
      .where(eq(wizardsStudioSessions.startupId, startupId))
      .orderBy(desc(wizardsStudioSessions.startedAt));

    // Get all artifacts
    const artifacts = await db
      .select()
      .from(wizardsArtifacts)
      .where(eq(wizardsArtifacts.startupId, startupId))
      .orderBy(desc(wizardsArtifacts.version));

    // Get orchestration stats
    const orchestrationStats = await wizardsOrchestrationService.getStartupOrchestrationStats(startupId);

    // Get journey timeline
    const timeline = await db
      .select()
      .from(wizardsJourneyTimeline)
      .where(eq(wizardsJourneyTimeline.startupId, startupId))
      .orderBy(wizardsJourneyTimeline.createdAt);

      return sendSuccess(res, {
        startup,
        sessions: {
          total: sessions.length,
          active: sessions.filter(s => s.status === 'in_progress').length,
          completed: sessions.filter(s => s.status === 'completed').length,
        },
        artifacts: {
          total: artifacts.length,
          byType: artifacts.reduce((acc, a) => {
            acc[a.artifactType] = (acc[a.artifactType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
        orchestration: orchestrationStats,
        timeline,
        progress: {
          overall: startup.progress,
          phase: startup.currentPhase,
          creditsUsed: startup.creditsUsed,
          creditsRemaining: (startup.creditsAllocated || 0) - (startup.creditsUsed || 0),
        },
      });
    } catch (error: any) {
      return sendServerError(res, error);
    }
  }
);

// ============================================================================
// STUDIO WORKFLOWS
// ============================================================================

/**
 * GET /api/wizards/studios
 * Get all available studios
 */
router.get('/studios', async (req: Request, res: Response) => {
  try {
    const studios = await db
      .select()
      .from(wizardsStudios)
      .where(eq(wizardsStudios.isActive, true))
      .orderBy(wizardsStudios.sequence);

    res.json({
      success: true,
      studios,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/studios/:studioId/detail
 * Get studio details with sessions, tasks, and deliverables
 * 
 * PHASE 2.3: Updated to use standardized error responses
 */
router.get('/studios/:studioId/detail', async (req: Request, res: Response) => {
  try {
    const { studioId } = req.params;

    // Get studio info
    const [studio] = await db
      .select()
      .from(wizardsStudios)
      .where(and(
        eq(wizardsStudios.studioId, studioId),
        eq(wizardsStudios.isActive, true)
      ))
      .limit(1);

    if (!studio) {
      return sendNotFoundError(res, 'Studio');
    }

    // Get all sessions for this studio
    const sessions = await db
      .select()
      .from(wizardsStudioSessions)
      .where(eq(wizardsStudioSessions.studioId, studioId))
      .orderBy(desc(wizardsStudioSessions.startedAt));

    // Get all tasks for sessions
    const sessionIds = sessions.map(s => s.id);
    const tasks = sessionIds.length > 0 ? await db
      .select()
      .from(wizardsStudioTasks)
      .where(sql`${wizardsStudioTasks.sessionId} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(wizardsStudioTasks.createdAt)) : [];

    // Get all deliverables for sessions
    const deliverables = sessionIds.length > 0 ? await db
      .select()
      .from(wizardsStudioDeliverables)
      .where(sql`${wizardsStudioDeliverables.sessionId} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(wizardsStudioDeliverables.createdAt)) : [];

    return sendSuccess(res, {
      studio,
      sessions,
      tasks,
      deliverables,
    });
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/studios/:studioId/readiness
 * Check if studio is ready for execution (dependency check)
 * 
 * PHASE 2.3 IMPLEMENTATION:
 * - Check readiness without creating session
 * - Returns missing dependencies and suggested next steps
 * - Enables frontend to show dependency blocker UI
 * - Uses validation middleware for query params
 * - Uses standardized error responses
 */
router.get('/studios/:studioId/readiness',
  authenticateToken,
  requireQueryParams('startupId'),
  validateNumericId('startupId'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { studioId } = req.params;
      const startupId = (req as any).validatedStartupId;

      // Check readiness
      const readiness = await studioSessionManager.isStudioReady(
        startupId,
        studioId
      );

      return sendSuccess(res, readiness);
    } catch (error: any) {
      console.error('Readiness check error:', error);
      return sendServerError(res, error);
    }
  }
);

/**
 * POST /api/wizards/studios/:studioId/sessions
 * Get or create studio session with dependency enforcement (feature-flagged)
 * 
 * PHASE 2.1 IMPLEMENTATION:
 * - Added authenticateToken middleware for security
 * - Extract userId from JWT (req.user.id)
 * - Feature flag UNIFIED_SESSION_MANAGEMENT enables new session manager
 * - Dependency checking when flag ON
 * - Fallback to old behavior when flag OFF (rollback safety)
 */
router.post('/studios/:studioId/sessions', 
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { studioId } = req.params;
      const { startupId } = req.body;
      const userId = req.user!.id;

      // Get studio info
      const [studio] = await db
        .select()
        .from(wizardsStudios)
        .where(and(
          eq(wizardsStudios.studioId, studioId),
          eq(wizardsStudios.isActive, true)
        ))
        .limit(1);

      if (!studio) {
        return sendNotFoundError(res, 'Studio');
      }

      // Check for existing active session for this startup+studio
      const [existingSession] = await db
        .select()
        .from(wizardsStudioSessions)
        .where(and(
          eq(wizardsStudioSessions.startupId, startupId),
          eq(wizardsStudioSessions.studioId, studioId),
          or(
            eq(wizardsStudioSessions.status, 'in_progress'),
            eq(wizardsStudioSessions.status, 'pending')
          )
        ))
        .limit(1);

      // Return existing session if found
      if (existingSession) {
        return sendSuccess(res, {
          session: existingSession,
          studio,
          existing: true,
        });
      }

      // FEATURE FLAG: Unified session management with dependency enforcement
      if (FEATURE_FLAGS.UNIFIED_SESSION_MANAGEMENT) {
        // NEW SYSTEM: Use session manager with validation
        
        // Check readiness BEFORE creating session
        const readiness = await studioSessionManager.isStudioReady(
          startupId,
          studioId
        );

        if (!readiness.ready) {
          return sendDependencyError(
            res,
            readiness.message,
            readiness.missingDependencies
          );
        }

        // Create session with full context (dependency artifacts, parent sessions, userId)
        const context = await studioSessionManager.createSessionWithContext(
          startupId,
          studioId,
          userId,
          { propagateContext: true }
        );

        // Retrieve created session from DB
        const [session] = await db
          .select()
          .from(wizardsStudioSessions)
          .where(eq(wizardsStudioSessions.id, context.sessionId!))
          .limit(1);

        return sendCreated(res, {
          session,
          studio,
          existing: false,
          context: {
            parentSessions: context.parentSessions || [],
            inheritedArtifacts: context.inheritedArtifacts?.length || 0,
            dependencies: context.metadata?.parentStudioIds || [],
          },
        });
      } else {
        // OLD SYSTEM: Direct DB insert (fallback for rollback)
        const [session] = await db.insert(wizardsStudioSessions).values({
          startupId,
          studioId,
          status: 'in_progress',
          progress: 0,
          startedAt: new Date(),
        }).returning();

        return sendCreated(res, {
          session,
          studio,
          existing: false,
        });
      }
    } catch (error: any) {
      console.error('Session creation error:', error);
      return sendServerError(res, error);
    }
  }
);

/**
 * GET /api/wizards/sessions/:sessionId
 * Get session details
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    const [session] = await db
      .select()
      .from(wizardsStudioSessions)
      .where(eq(wizardsStudioSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Get tasks for this session
    const tasks = await db
      .select()
      .from(wizardsStudioTasks)
      .where(eq(wizardsStudioTasks.sessionId, sessionId))
      .orderBy(wizardsStudioTasks.createdAt);

    // Get orchestration jobs
    const jobs = await db
      .select()
      .from(wizardsOrchestrationJobs)
      .where(eq(wizardsOrchestrationJobs.sessionId, sessionId))
      .orderBy(desc(wizardsOrchestrationJobs.startedAt));

    res.json({
      success: true,
      session: {
        ...session,
        tasks,
        orchestrationJobs: jobs,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// STUDIO SESSION MANAGER - Context Propagation & Artifact Handoff
// ============================================================================

import { studioSessionManager } from '../services/wizards-studio-session-manager';

/**
 * POST /api/wizards/sessions/create-with-context
 * Create a new studio session with automatic context propagation from previous studios
 */
router.post('/sessions/create-with-context', async (req: Request, res: Response) => {
  try {
    const { startupId, studioId, userId, propagateContext = true } = req.body;

    if (!startupId || !studioId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: startupId, studioId, userId',
      });
    }

    const context = await studioSessionManager.createSessionWithContext(
      startupId,
      studioId,
      userId,
      { propagateContext }
    );

    res.json({
      success: true,
      context,
      message: `Session created for ${studioId} with ${context.inheritedArtifacts?.length || 0} inherited artifacts`,
    });
  } catch (error: any) {
    // Dependency enforcement errors should return 409 Conflict
    if (error.message.includes('Cannot start') || error.message.includes('Missing dependencies')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        type: 'DEPENDENCY_NOT_MET',
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/sessions/:sessionId/context
 * Get full session context including inherited artifacts and parent sessions
 */
router.get('/sessions/:sessionId/context', async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID',
      });
    }

    const context = await studioSessionManager.getSessionContext(sessionId);

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Session context not found',
      });
    }

    res.json({
      success: true,
      context,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/studios/:studioId/readiness/:startupId
 * Check if a studio is ready to start (all dependencies completed)
 */
router.get('/studios/:studioId/readiness/:startupId', async (req: Request, res: Response) => {
  try {
    const { studioId, startupId } = req.params;
    const startupIdNum = parseInt(startupId);

    if (isNaN(startupIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startup ID',
      });
    }

    const readiness = await studioSessionManager.isStudioReady(startupIdNum, studioId);

    res.json({
      success: true,
      ...readiness,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/studios/:studioId/required-artifacts/:startupId
 * Get required artifacts for a studio from previous studios
 */
router.get('/studios/:studioId/required-artifacts/:startupId', async (req: Request, res: Response) => {
  try {
    const { studioId, startupId } = req.params;
    const startupIdNum = parseInt(startupId);

    if (isNaN(startupIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startup ID',
      });
    }

    const artifacts = await studioSessionManager.getRequiredArtifacts(startupIdNum, studioId);

    res.json({
      success: true,
      studioId,
      startupId: startupIdNum,
      artifacts,
      count: artifacts.length,
      dependencies: studioSessionManager.getStudioDependencies(studioId),
      requirements: studioSessionManager.getArtifactRequirements(studioId),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/sessions/:sessionId/handoff
 * Handoff session to the next studio in the workflow
 */
router.post('/sessions/:sessionId/handoff', async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const { aguiSessionId } = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID',
      });
    }

    // Get session to find startup and studio
    const [session] = await db
      .select()
      .from(wizardsStudioSessions)
      .where(eq(wizardsStudioSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    const handoffResult = await studioSessionManager.handoffToNextStudio(
      session.startupId,
      session.studioId,
      sessionId,
      { aguiSessionId }
    );

    res.json({
      success: handoffResult.success,
      ...handoffResult,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/startups/:startupId/suggested-studios
 * Get suggested next studios based on completed work
 */
router.get('/startups/:startupId/suggested-studios', async (req: Request, res: Response) => {
  try {
    const startupId = parseInt(req.params.startupId);

    if (isNaN(startupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startup ID',
      });
    }

    const suggestions = await studioSessionManager.getSuggestedNextStudios(startupId);

    res.json({
      success: true,
      startupId,
      suggestions,
      count: suggestions.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/jobs/:id
 * Get orchestration job status (with ownership verification)
 */
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID',
      });
    }

    // Get job with startup and founder to verify ownership
    const jobWithOwnership = await db.select({
      job: wizardsOrchestrationJobs,
      founderUserId: wizardsFounders.userId,
    })
      .from(wizardsOrchestrationJobs)
      .leftJoin(wizardsStartups, eq(wizardsOrchestrationJobs.startupId, wizardsStartups.id))
      .leftJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(eq(wizardsOrchestrationJobs.id, jobId))
      .limit(1);

    if (jobWithOwnership.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const { job, founderUserId } = jobWithOwnership[0];

    // Authorization check: verify job belongs to authenticated user's startup
    if (userId && founderUserId && userId !== founderUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Job belongs to another user',
      });
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        orchestrationId: job.orchestrationId,
        status: job.status,
        progress: job.progress,
        outputs: job.outputs,
        creditsUsed: job.creditsUsed,
        tokensUsed: job.tokensUsed,
        cost: job.cost,
        errorMessage: job.errorMessage,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        duration: job.duration,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job',
    });
  }
});

/**
 * PATCH /api/wizards/jobs/:id/cancel
 * Cancel an orchestration job (with ownership verification)
 */
router.patch('/jobs/:id/cancel', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID',
      });
    }

    // Get job with startup and founder to verify ownership
    const jobWithOwnership = await db.select({
      job: wizardsOrchestrationJobs,
      founderUserId: wizardsFounders.userId,
    })
      .from(wizardsOrchestrationJobs)
      .leftJoin(wizardsStartups, eq(wizardsOrchestrationJobs.startupId, wizardsStartups.id))
      .leftJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(eq(wizardsOrchestrationJobs.id, jobId))
      .limit(1);

    if (jobWithOwnership.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const { job, founderUserId } = jobWithOwnership[0];

    // Authorization check: verify job belongs to authenticated user's startup
    if (userId && founderUserId && userId !== founderUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Job belongs to another user',
      });
    }

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel job with status: ${job.status}`,
      });
    }

    // Conditional update: only cancel if still queued or running (prevent overwriting completed/failed)
    const updateResult = await db.update(wizardsOrchestrationJobs)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason || 'Cancelled by user',
        completedAt: new Date(), // Set completedAt for 7-day cleanup eligibility
        updatedAt: new Date(),
      })
      .where(and(
        eq(wizardsOrchestrationJobs.id, jobId),
        or(
          eq(wizardsOrchestrationJobs.status, 'queued'),
          eq(wizardsOrchestrationJobs.status, 'running')
        )
      ))
      .returning();

    // If update affected 0 rows, job was completed/failed between check and update
    if (updateResult.length === 0) {
      const [finalJob] = await db.select()
        .from(wizardsOrchestrationJobs)
        .where(eq(wizardsOrchestrationJobs.id, jobId))
        .limit(1);
      
      return res.status(409).json({
        success: false,
        error: `Job already finished with status: ${finalJob?.status || 'unknown'}`,
        jobStatus: finalJob?.status,
      });
    }

    res.json({
      success: true,
      message: 'Job cancelled successfully',
      jobId,
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel job',
    });
  }
});

/**
 * POST /api/wizards/sessions/:sessionId/execute
 * Execute studio session with AI orchestration (creates queued job)
 */
router.post('/sessions/:sessionId/execute', async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const { task, agents, workflow, priority } = req.body;

    // Validation schema
    const executeSchema = z.object({
      task: z.string().min(1, 'Task description required'),
      agents: z.array(z.string()).optional(),
      workflow: z.enum(['sequential', 'parallel', 'hierarchical']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    });

    const validated = executeSchema.parse(req.body);

    // Get session
    const [session] = await db
      .select()
      .from(wizardsStudioSessions)
      .where(eq(wizardsStudioSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Create queued orchestration job (worker will execute asynchronously)
    const orchestrationId = `orch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const [job] = await db.insert(wizardsOrchestrationJobs).values({
      startupId: session.startupId,
      sessionId: sessionId,
      taskId: undefined,
      orchestrationId,
      jobType: 'generation',
      workflow: validated.workflow === 'hierarchical' ? 'bmad' : (validated.workflow || 'sequential'),
      agents: validated.agents || [],
      inputs: {
        task: validated.task,
      },
      priority: validated.priority || 'medium',
      status: 'queued',
      progress: 0,
      availableAt: new Date(),
      maxRetries: 3,
      retryCount: 0,
      backoffMultiplier: 2,
    }).returning();

    // Update session status to in_progress
    await db.update(wizardsStudioSessions)
      .set({
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(wizardsStudioSessions.id, sessionId));

    res.json({
      success: true,
      message: 'Job queued for execution',
      job: {
        id: job.id,
        orchestrationId: job.orchestrationId,
        status: job.status,
        createdAt: job.createdAt,
      },
      session: {
        id: session.id,
        status: 'in_progress',
        progress: session.progress || 0,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// ARTIFACTS
// ============================================================================

/**
 * GET /api/wizards/startups/:startupId/artifacts
 * Get all artifacts for a startup
 */
router.get('/startups/:startupId/artifacts', async (req: Request, res: Response) => {
  try {
    const startupId = parseInt(req.params.startupId);
    const { type, tag } = req.query;

    let query = db
      .select()
      .from(wizardsArtifacts)
      .where(eq(wizardsArtifacts.startupId, startupId));

    const artifacts = await query.orderBy(desc(wizardsArtifacts.version));

    // Filter by type if specified
    let filteredArtifacts = artifacts;
    if (type) {
      filteredArtifacts = filteredArtifacts.filter(a => a.artifactType === type);
    }

    // Filter by tag if specified
    if (tag) {
      filteredArtifacts = filteredArtifacts.filter(a => 
        a.tags && a.tags.includes(tag as string)
      );
    }

    res.json({
      success: true,
      artifacts: filteredArtifacts,
      total: filteredArtifacts.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/artifacts/search
 * Search artifacts by name, description, or tags
 */
router.get('/artifacts/search', async (req: Request, res: Response) => {
  try {
    const startupId = parseInt(req.query.startupId as string);
    const searchTerm = req.query.searchTerm as string;

    if (isNaN(startupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startupId parameter',
      });
    }

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'searchTerm parameter is required',
      });
    }

    const artifacts = await wizardsArtifactStoreService.searchArtifacts(
      startupId,
      searchTerm
    );

    res.json({
      success: true,
      artifacts,
      total: artifacts.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/artifacts/:artifactId
 * Get specific artifact
 */
router.get('/artifacts/:artifactId', async (req: Request, res: Response) => {
  try {
    const artifactId = parseInt(req.params.artifactId);
    
    const [artifact] = await db
      .select()
      .from(wizardsArtifacts)
      .where(eq(wizardsArtifacts.id, artifactId))
      .limit(1);

    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: 'Artifact not found',
      });
    }

    res.json({
      success: true,
      artifact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// HEALTH & STATUS
// ============================================================================

/**
 * GET /api/wizards/health
 * Platform health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await wizardsOrchestrationService.getSystemHealth();

    res.json({
      success: true,
      platform: 'Wizards Incubator v10.0',
      status: health.status,
      orchestration: health.waiCore,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/agents
 * Get all available agents from WAI SDK v1.0
 */
router.get('/agents', async (req: Request, res: Response) => {
  try {
    const agents = await wizardsOrchestrationService.getAvailableAgents();

    res.json({
      success: true,
      total: agents.length,
      agents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/providers
 * Get all available LLM providers from WAI SDK v1.0
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const providers = await wizardsOrchestrationService.getAvailableProviders();

    res.json({
      success: true,
      total: providers.length,
      providers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// SPECIALIZED WAI SDK v1.0 FEATURES
// ============================================================================

/**
 * POST /api/wizards/openmanus/code
 * OpenManus: Autonomous code generation
 */
router.post('/openmanus/code', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number(),
      sessionId: z.string(),
      taskDescription: z.string().min(1),
      codeType: z.enum(['frontend', 'backend', 'fullstack', 'api', 'database']),
      framework: z.string().optional(),
      requirements: z.array(z.string()).optional(),
    });

    const validated = schema.parse(req.body);
    const result = await wizardsOrchestrationService.executeOpenManus(validated);

    res.json({
      success: result.status === 'success',
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/openlovable/website
 * OpenLovable: Website builder
 */
router.post('/openlovable/website', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number(),
      sessionId: z.string(),
      websiteDescription: z.string().min(1),
      websiteType: z.enum(['landing', 'saas', 'ecommerce', 'blog', 'portfolio']),
      features: z.array(z.string()).optional(),
      designPreferences: z.any().optional(),
    });

    const validated = schema.parse(req.body);
    const result = await wizardsOrchestrationService.executeOpenLovable(validated);

    res.json({
      success: result.status === 'success',
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/avatar/interact
 * ChatDollKit: 3D Avatar with voice interaction
 */
router.post('/avatar/interact', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number(),
      sessionId: z.string(),
      message: z.string().min(1),
      avatarPersonality: z.enum(['professional', 'friendly', 'energetic']).optional(),
      voiceEnabled: z.boolean().optional(),
      language: z.string().optional(),
    });

    const validated = schema.parse(req.body);
    const result = await wizardsOrchestrationService.executeAvatarInteraction(validated);

    res.json({
      success: result.status === 'success',
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/sarvam/india
 * Sarvam AI: India-specific features (multilingual, local insights)
 */
router.post('/sarvam/india', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number(),
      sessionId: z.string(),
      task: z.string().min(1),
      language: z.enum(['hindi', 'tamil', 'telugu', 'bengali', 'marathi', 'english']).optional(),
      feature: z.enum(['translation', 'market_research', 'content_generation', 'voice_synthesis']),
    });

    const validated = schema.parse(req.body);
    const result = await wizardsOrchestrationService.executeSarvamAI(validated);

    res.json({
      success: result.status === 'success',
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/content/generate
 * Content Generation & Research
 */
router.post('/content/generate', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number(),
      sessionId: z.string(),
      contentType: z.enum(['blog', 'marketing', 'documentation', 'pitch', 'research']),
      topic: z.string().min(1),
      requirements: z.any().optional(),
    });

    const validated = schema.parse(req.body);
    const result = await wizardsOrchestrationService.executeContentGeneration(validated);

    res.json({
      success: result.status === 'success',
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/journey/complete
 * Execute complete 14-day founder journey (Ideation → Deployment)
 */
router.post('/journey/complete', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number(),
      founderName: z.string().min(1),
      ideaDescription: z.string().min(10),
      targetMarket: z.string().optional(),
    });

    const validated = schema.parse(req.body);
    const result = await wizardsOrchestrationService.executeFounderJourney(validated);

    res.json({
      success: result.success,
      journey: result.journey,
      timeline: result.timeline,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/studios/:studioType/agents
 * Get intelligent agent selection for a specific studio
 */
router.get('/studios/:studioType/agents', async (req: Request, res: Response) => {
  try {
    const studioType = req.params.studioType as any;
    const agents = wizardsOrchestrationService.getAgentsForStudio(studioType);

    res.json({
      success: true,
      studioType,
      totalAgents: agents.length,
      agents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// WEEK 2-3: APPLICATION & COHORT MANAGEMENT
// ============================================================================

/**
 * POST /api/wizards/cohorts
 * Create new cohort (Admin only)
 */
router.post('/cohorts', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const validated = insertWizardsCohortSchema.parse(req.body);
    
    const [cohort] = await db
      .insert(wizardsCohorts)
      .values(validated)
      .returning();

    res.json({
      success: true,
      cohort,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/cohorts
 * Get all cohorts with filters (Public)
 */
router.get('/cohorts', async (req: Request, res: Response) => {
  try {
    const { status, upcoming } = req.query;
    
    let query = db.select().from(wizardsCohorts);
    
    if (status) {
      query = query.where(eq(wizardsCohorts.status, status as string)) as any;
    }
    
    const cohorts = await query.orderBy(desc(wizardsCohorts.startDate));

    res.json({
      success: true,
      cohorts,
      total: cohorts.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/cohorts/:id
 * Get cohort details with applications
 */
router.get('/cohorts/:id', async (req: Request, res: Response) => {
  try {
    const cohortId = parseInt(req.params.id);
    
    const [cohort] = await db
      .select()
      .from(wizardsCohorts)
      .where(eq(wizardsCohorts.id, cohortId))
      .limit(1);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        error: 'Cohort not found',
      });
    }

    // Get applications for this cohort
    const applications = await db
      .select({
        application: wizardsApplications,
        founder: wizardsFounders,
      })
      .from(wizardsApplications)
      .leftJoin(wizardsFounders, eq(wizardsApplications.userId, wizardsFounders.userId))
      .where(eq(wizardsApplications.cohortId, cohortId))
      .orderBy(desc(wizardsApplications.createdAt));

    res.json({
      success: true,
      cohort: {
        ...cohort,
        applications,
        totalApplications: applications.length,
        acceptedCount: applications.filter(a => a.application.status === 'accepted').length,
        pendingCount: applications.filter(a => a.application.status === 'submitted').length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/wizards/cohorts/:id
 * Update cohort (Admin only)
 */
router.patch('/cohorts/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const cohortId = parseInt(req.params.id);
    
    // Validate using partial schema for PATCH
    const validated = updateWizardsCohortSchema.parse(req.body);
    
    const [updated] = await db
      .update(wizardsCohorts)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(wizardsCohorts.id, cohortId))
      .returning();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Cohort not found',
      });
    }

    res.json({
      success: true,
      cohort: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/applications
 * Submit new application (Authenticated founders)
 */
router.post('/applications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = insertWizardsApplicationSchema.parse({
      ...req.body,
      status: 'draft',
      score: 0,
    });
    
    const [application] = await db
      .insert(wizardsApplications)
      .values([validated])
      .returning();

    res.json({
      success: true,
      application,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/applications/:id
 * Get application details with reviews
 */
router.get('/applications/:id', async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);
    
    const [application] = await db
      .select({
        application: wizardsApplications,
        founder: wizardsFounders,
        cohort: wizardsCohorts,
      })
      .from(wizardsApplications)
      .leftJoin(wizardsFounders, eq(wizardsApplications.userId, wizardsFounders.userId))
      .leftJoin(wizardsCohorts, eq(wizardsApplications.cohortId, wizardsCohorts.id))
      .where(eq(wizardsApplications.id, applicationId))
      .limit(1);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }

    // Get reviews
    const reviews = await db
      .select()
      .from(wizardsApplicationReviews)
      .where(eq(wizardsApplicationReviews.applicationId, applicationId))
      .orderBy(desc(wizardsApplicationReviews.createdAt));

    res.json({
      success: true,
      application: {
        ...application.application,
        founder: application.founder,
        cohort: application.cohort,
        reviews,
        averageScore: reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reviews.length 
          : 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/wizards/applications/:id
 * Update application (Founders can update their own; Admins can update any)
 */
router.patch('/applications/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);
    
    // Validate using partial schema for PATCH
    const validated = updateWizardsApplicationSchema.parse(req.body);
    
    const [updated] = await db
      .update(wizardsApplications)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(wizardsApplications.id, applicationId))
      .returning();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }

    res.json({
      success: true,
      application: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/applications/:id/reviews
 * Add review to application (Admin/Reviewer only)
 */
router.post('/applications/:id/reviews', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);
    
    const validated = insertWizardsApplicationReviewSchema.parse({
      ...req.body,
      applicationId,
      reviewerId: parseInt((req as AuthRequest).user!.id),
    });
    
    const [review] = await db
      .insert(wizardsApplicationReviews)
      .values(validated)
      .returning();

    // Update application average score
    const allReviews = await db
      .select()
      .from(wizardsApplicationReviews)
      .where(eq(wizardsApplicationReviews.applicationId, applicationId));
    
    const averageScore = allReviews.reduce((sum, r) => sum + (r.overallScore || 0), 0) / allReviews.length;
    
    await db
      .update(wizardsApplications)
      .set({ score: Math.round(averageScore) })
      .where(eq(wizardsApplications.id, applicationId));

    res.json({
      success: true,
      review,
      averageScore,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/founders/:founderId/applications
 * Get all applications for a founder
 */
router.get('/founders/:founderId/applications', async (req: Request, res: Response) => {
  try {
    const founderId = parseInt(req.params.founderId);
    
    const applications = await db
      .select({
        application: wizardsApplications,
        cohort: wizardsCohorts,
      })
      .from(wizardsApplications)
      .leftJoin(wizardsCohorts, eq(wizardsApplications.cohortId, wizardsCohorts.id))
      .leftJoin(wizardsFounders, eq(wizardsApplications.userId, wizardsFounders.userId))
      .where(eq(wizardsFounders.id, founderId))
      .orderBy(desc(wizardsApplications.createdAt));

    res.json({
      success: true,
      applications,
      total: applications.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// FOUNDER GRAPH API - RELATIONSHIP MAPPING
// ============================================================================

import { wizardsFounderGraphService } from '../services/wizards-founder-graph';

/**
 * GET /api/wizards/founders/:founderId/network
 * Get founder's network connections
 */
router.get('/founders/:founderId/network', async (req: Request, res: Response) => {
  try {
    const founderId = parseIntId(req.params.founderId);
    if (founderId === null) {
      return sendValidationError(res, 'founderId');
    }

    const connections = await wizardsFounderGraphService.getNetworkConnections(founderId);

    return sendSuccess(res, {
      connections,
      total: connections.length,
    });
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * POST /api/wizards/founders/:founderId/network/connect
 * Add a network connection between founders
 * Requires: authenticated user must own the founderId or be admin
 */
router.post('/founders/:founderId/network/connect', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const founderId = parseIntId(req.params.founderId);
    const { targetFounderId } = req.body;

    if (founderId === null) {
      return sendValidationError(res, 'founderId');
    }
    if (!targetFounderId || typeof targetFounderId !== 'number') {
      return sendValidationError(res, 'targetFounderId');
    }

    const currentUserId = parseIntId(req.user!.id);
    const founder = await wizardsFounderGraphService.getFounderById(founderId);
    
    if (!founder) {
      return sendNotFoundError(res, 'Founder');
    }
    
    if (founder.userId !== currentUserId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'unauthorized',
        message: 'You can only manage your own network connections',
      });
    }

    const success = await wizardsFounderGraphService.addNetworkConnection(founderId, targetFounderId);

    if (success) {
      return sendSuccess(res, { connected: true });
    }
    return sendNotFoundError(res, 'Target Founder');
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * DELETE /api/wizards/founders/:founderId/network/:targetFounderId
 * Remove a network connection between founders
 * Requires: authenticated user must own the founderId or be admin
 */
router.delete('/founders/:founderId/network/:targetFounderId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const founderId = parseIntId(req.params.founderId);
    const targetFounderId = parseIntId(req.params.targetFounderId);

    if (founderId === null || targetFounderId === null) {
      return sendValidationError(res, 'founderId or targetFounderId');
    }

    const currentUserId = parseIntId(req.user!.id);
    const founder = await wizardsFounderGraphService.getFounderById(founderId);
    
    if (!founder) {
      return sendNotFoundError(res, 'Founder');
    }
    
    if (founder.userId !== currentUserId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'unauthorized',
        message: 'You can only manage your own network connections',
      });
    }

    const success = await wizardsFounderGraphService.removeNetworkConnection(founderId, targetFounderId);

    if (success) {
      return sendSuccess(res, { disconnected: true });
    }
    return sendNotFoundError(res, 'Target Founder');
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/founders/:founderId/graph
 * Get founder's relationship graph (network + startups)
 */
router.get('/founders/:founderId/graph', async (req: Request, res: Response) => {
  try {
    const founderId = parseIntId(req.params.founderId);
    if (founderId === null) {
      return sendValidationError(res, 'founderId');
    }

    const graph = await wizardsFounderGraphService.getFounderNetworkGraph(founderId);

    return sendSuccess(res, graph);
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/founders/:founderId/stats
 * Get founder's relationship statistics
 */
router.get('/founders/:founderId/stats', async (req: Request, res: Response) => {
  try {
    const founderId = parseIntId(req.params.founderId);
    if (founderId === null) {
      return sendValidationError(res, 'founderId');
    }

    const stats = await wizardsFounderGraphService.getRelationshipStats(founderId);

    return sendSuccess(res, stats);
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/founders/:founderId/path/:targetFounderId
 * Find connection path between two founders
 */
router.get('/founders/:founderId/path/:targetFounderId', async (req: Request, res: Response) => {
  try {
    const founderId = parseIntId(req.params.founderId);
    const targetFounderId = parseIntId(req.params.targetFounderId);
    const maxDepth = parseInt(req.query.maxDepth as string) || 3;

    if (founderId === null || targetFounderId === null) {
      return sendValidationError(res, 'founderId or targetFounderId');
    }

    const path = await wizardsFounderGraphService.findConnectionPath(founderId, targetFounderId, maxDepth);

    return sendSuccess(res, {
      path,
      pathLength: path.length,
      connected: path.length > 0,
    });
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/founders/:founderId/mutual/:otherFounderId
 * Get mutual connections between two founders
 */
router.get('/founders/:founderId/mutual/:otherFounderId', async (req: Request, res: Response) => {
  try {
    const founderId = parseIntId(req.params.founderId);
    const otherFounderId = parseIntId(req.params.otherFounderId);

    if (founderId === null || otherFounderId === null) {
      return sendValidationError(res, 'founderId or otherFounderId');
    }

    const mutualConnections = await wizardsFounderGraphService.getMutualConnections(founderId, otherFounderId);

    return sendSuccess(res, {
      mutualConnections,
      total: mutualConnections.length,
    });
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/startups/:startupId/graph
 * Get startup's relationship graph (founder, investors, mentors)
 */
router.get('/startups/:startupId/graph', async (req: Request, res: Response) => {
  try {
    const startupId = parseIntId(req.params.startupId);
    if (startupId === null) {
      return sendValidationError(res, 'startupId');
    }

    const graph = await wizardsFounderGraphService.getStartupRelationshipGraph(startupId);

    return sendSuccess(res, graph);
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/startups/:startupId/investors
 * Get investor relationships for a startup
 */
router.get('/startups/:startupId/investors', async (req: Request, res: Response) => {
  try {
    const startupId = parseIntId(req.params.startupId);
    if (startupId === null) {
      return sendValidationError(res, 'startupId');
    }

    const relationships = await wizardsFounderGraphService.getInvestorRelationships(startupId);

    return sendSuccess(res, relationships);
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

/**
 * GET /api/wizards/startups/:startupId/mentors
 * Get mentor relationships for a startup
 */
router.get('/startups/:startupId/mentors', async (req: Request, res: Response) => {
  try {
    const startupId = parseIntId(req.params.startupId);
    if (startupId === null) {
      return sendValidationError(res, 'startupId');
    }

    const relationships = await wizardsFounderGraphService.getMentorRelationships(startupId);

    return sendSuccess(res, relationships);
  } catch (error: any) {
    return sendServerError(res, error);
  }
});

// ============================================================================
// INVESTOR MATCHING PLATFORM (Week 4-8)
// ============================================================================

/**
 * GET /api/wizards/investors
 * List all investors with optional filtering
 */
router.get('/investors', async (req: Request, res: Response) => {
  try {
    const { investorType, verified, acceptingPitches } = req.query;
    
    let query = db.select().from(wizardsInvestors);
    
    const conditions = [];
    if (investorType) {
      conditions.push(eq(wizardsInvestors.investorType, investorType as string));
    }
    if (verified !== undefined) {
      conditions.push(eq(wizardsInvestors.verified, verified === 'true'));
    }
    if (acceptingPitches !== undefined) {
      conditions.push(eq(wizardsInvestors.isAcceptingPitches, acceptingPitches === 'true'));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const investors = await query.orderBy(desc(wizardsInvestors.dealCount));

    res.json({
      success: true,
      investors,
      total: investors.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/investors/:id
 * Get single investor profile
 */
router.get('/investors/:id', async (req: Request, res: Response) => {
  try {
    const investorId = parseIntId(req.params.id);
    if (investorId === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid investor ID',
      });
    }
    
    const [investor] = await db
      .select()
      .from(wizardsInvestors)
      .where(eq(wizardsInvestors.id, investorId))
      .limit(1);

    if (!investor) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found',
      });
    }

    res.json({
      success: true,
      investor,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/investors
 * Create investor profile
 */
router.post('/investors', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = parseIntId((req as AuthRequest).user!.id);
    if (userId === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }
    
    const validated = insertWizardsInvestorSchema.parse({
      ...req.body,
      userId,
    });

    const [investor] = await db
      .insert(wizardsInvestors)
      .values(validated)
      .returning();

    res.json({
      success: true,
      investor,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/wizards/investors/:id
 * Update investor profile
 */
router.put('/investors/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const investorId = parseIntId(req.params.id);
    if (investorId === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid investor ID',
      });
    }
    
    // Verify ownership
    const [existing] = await db
      .select()
      .from(wizardsInvestors)
      .where(eq(wizardsInvestors.id, investorId))
      .limit(1);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found',
      });
    }
    
    const currentUserId = parseIntId((req as AuthRequest).user!.id);
    if (existing.userId !== currentUserId && (req as AuthRequest).user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this investor profile',
      });
    }
    
    const [updated] = await db
      .update(wizardsInvestors)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(wizardsInvestors.id, investorId))
      .returning();

    res.json({
      success: true,
      investor: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/startups/:startupId/investor-matches
 * Get matched investors for a startup
 */
router.get('/startups/:startupId/investor-matches', authenticateToken, async (req: Request, res: Response) => {
  try {
    const startupId = parseIntId(req.params.startupId);
    if (startupId === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startup ID',
      });
    }
    const { minScore, status } = req.query;
    
    let query = db
      .select({
        match: wizardsInvestorMatches,
        investor: wizardsInvestors,
      })
      .from(wizardsInvestorMatches)
      .leftJoin(wizardsInvestors, eq(wizardsInvestorMatches.investorId, wizardsInvestors.id))
      .where(eq(wizardsInvestorMatches.startupId, startupId));
    
    const matches = await query.orderBy(desc(wizardsInvestorMatches.matchScore));
    
    // Filter by minScore and status if provided
    let filteredMatches = matches;
    if (minScore) {
      const minScoreNum = parseInt(minScore as string);
      filteredMatches = filteredMatches.filter(m => m.match.matchScore >= minScoreNum);
    }
    if (status) {
      filteredMatches = filteredMatches.filter(m => m.match.status === status);
    }

    res.json({
      success: true,
      matches: filteredMatches,
      total: filteredMatches.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/investor-matches
 * Create new investor match (AI-generated or manual)
 */
router.post('/investor-matches', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = insertWizardsInvestorMatchSchema.parse(req.body);

    const [match] = await db
      .insert(wizardsInvestorMatches)
      .values(validated)
      .returning();

    res.json({
      success: true,
      match,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/wizards/investor-matches/:id
 * Update investor match status
 */
router.put('/investor-matches/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const matchId = parseIntId(req.params.id);
    if (matchId === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid match ID',
      });
    }
    const { status, aiGeneratedInsights } = req.body;
    
    const [updated] = await db
      .update(wizardsInvestorMatches)
      .set({ 
        status, 
        aiGeneratedInsights,
        updatedAt: new Date() 
      })
      .where(eq(wizardsInvestorMatches.id, matchId))
      .returning();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
      });
    }

    res.json({
      success: true,
      match: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/startups/:startupId/investor-connections
 * Get all connection requests for a startup
 */
router.get('/startups/:startupId/investor-connections', authenticateToken, async (req: Request, res: Response) => {
  try {
    const startupId = parseIntId(req.params.startupId);
    if (startupId === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startup ID',
      });
    }
    const { status } = req.query;
    
    let query = db
      .select({
        connection: wizardsInvestorConnections,
        investor: wizardsInvestors,
      })
      .from(wizardsInvestorConnections)
      .leftJoin(wizardsInvestors, eq(wizardsInvestorConnections.investorId, wizardsInvestors.id))
      .where(eq(wizardsInvestorConnections.startupId, startupId));
    
    const connections = await query.orderBy(desc(wizardsInvestorConnections.createdAt));
    
    // Filter by status if provided
    let filteredConnections = connections;
    if (status) {
      filteredConnections = filteredConnections.filter(c => c.connection.status === status);
    }

    res.json({
      success: true,
      connections: filteredConnections,
      total: filteredConnections.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/investor-connections
 * Create connection request to investor
 */
router.post('/investor-connections', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validated = insertWizardsInvestorConnectionSchema.parse(req.body);

    const [connection] = await db
      .insert(wizardsInvestorConnections)
      .values(validated)
      .returning();

    res.json({
      success: true,
      connection,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/wizards/investor-connections/:id
 * Update connection request status
 */
router.put('/investor-connections/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const connectionId = parseIntId(req.params.id);
    if (connectionId === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid connection ID',
      });
    }
    const updateData = req.body;
    
    const [updated] = await db
      .update(wizardsInvestorConnections)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(wizardsInvestorConnections.id, connectionId))
      .returning();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found',
      });
    }

    res.json({
      success: true,
      connection: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/investors/:investorId/connections
 * Get all connection requests for an investor
 */
router.get('/investors/:investorId/connections', authenticateToken, async (req: Request, res: Response) => {
  try {
    const investorId = parseIntId(req.params.investorId);
    if (investorId === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid investor ID',
      });
    }
    const { status } = req.query;
    
    let query = db
      .select({
        connection: wizardsInvestorConnections,
        startup: wizardsStartups,
      })
      .from(wizardsInvestorConnections)
      .leftJoin(wizardsStartups, eq(wizardsInvestorConnections.startupId, wizardsStartups.id))
      .where(eq(wizardsInvestorConnections.investorId, investorId));
    
    const connections = await query.orderBy(desc(wizardsInvestorConnections.createdAt));
    
    // Filter by status if provided
    let filteredConnections = connections;
    if (status) {
      filteredConnections = filteredConnections.filter(c => c.connection.status === status);
    }

    res.json({
      success: true,
      connections: filteredConnections,
      total: filteredConnections.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// 14-DAY WORKFLOW ORCHESTRATION
// ============================================================================

import { wizards14DayWorkflowService } from '../services/wizards-14-day-workflow';

/**
 * POST /api/wizards/workflow/initialize
 * Initialize 14-day workflow for a startup (setup only, doesn't start execution)
 */
router.post('/workflow/initialize', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number().int().positive(),
      founderId: z.number().int().positive(),
      ideaDescription: z.string().min(10),
      industry: z.string().optional(),
      targetMarket: z.string().optional(),
    });

    const validated = schema.parse(req.body);

    const result = await wizards14DayWorkflowService.initializeWorkflow(
      validated.startupId,
      validated.founderId,
      validated.ideaDescription,
      {
        industry: validated.industry,
        targetMarket: validated.targetMarket,
      }
    );

    res.json({
      ...result,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/workflow/start
 * Start async 14-day workflow execution for a startup
 */
router.post('/workflow/start', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number().int().positive(),
      founderId: z.number().int().positive(),
      ideaDescription: z.string().min(10),
      industry: z.string().optional(),
      targetMarket: z.string().optional(),
      autoExecute: z.boolean().optional().default(false),
    });

    const validated = schema.parse(req.body);

    const result = await wizards14DayWorkflowService.startWorkflowExecution(
      validated.startupId,
      validated.founderId,
      validated.ideaDescription,
      {
        industry: validated.industry,
        targetMarket: validated.targetMarket,
        autoExecute: validated.autoExecute,
      }
    );

    res.json({
      ...result,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/workflow/execute-phase
 * Execute a specific workflow phase
 */
router.post('/workflow/execute-phase', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number().int().positive(),
      sessionId: z.number().int().positive(),
      phaseDay: z.number().int().min(1).max(14),
      inputs: z.record(z.any()).optional(),
    });

    const validated = schema.parse(req.body);

    const result = await wizards14DayWorkflowService.executePhase(
      validated.startupId,
      validated.sessionId,
      validated.phaseDay,
      validated.inputs || {}
    );

    res.json({
      ...result,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/workflow/execute-complete
 * Execute complete 14-day workflow (automated)
 */
router.post('/workflow/execute-complete', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number().int().positive(),
      founderId: z.number().int().positive(),
      ideaDescription: z.string().min(10),
      industry: z.string().optional(),
      targetMarket: z.string().optional(),
    });

    const validated = schema.parse(req.body);

    const result = await wizards14DayWorkflowService.executeCompleteWorkflow(
      validated.startupId,
      validated.founderId,
      validated.ideaDescription,
      {
        industry: validated.industry,
        targetMarket: validated.targetMarket,
      }
    );

    res.json({
      ...result,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/workflow/:startupId/progress
 * Get workflow progress for a startup
 */
router.get('/workflow/:startupId/progress', async (req: Request, res: Response) => {
  try {
    const startupId = parseIntId(req.params.startupId);
    if (startupId === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startup ID',
      });
    }

    const progress = await wizards14DayWorkflowService.getWorkflowProgress(startupId);

    res.json({
      success: true,
      progress,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/wizards/workflow/template
 * Get 14-day workflow template
 */
router.get('/workflow/template', async (req: Request, res: Response) => {
  try {
    const template = wizards14DayWorkflowService.getWorkflowTemplate();

    res.json({
      success: true,
      template,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// WORKFLOW SCHEDULER CONTROL
// ============================================================================

/**
 * POST /api/wizards/workflow/pause
 * Pause workflow for a startup
 */
router.post('/workflow/pause', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const schema = z.object({
      startupId: z.number().int().positive(),
    });

    const validated = schema.parse(req.body);
    console.log(`📥 [API] POST /api/wizards/workflow/pause`, { startupId: validated.startupId });

    await workflowSchedulerService.pauseWorkflow(validated.startupId);

    const duration = Date.now() - startTime;
    console.log(`✅ [API] Workflow paused successfully`, { startupId: validated.startupId, duration: `${duration}ms` });

    res.json({
      success: true,
      message: `Workflow paused for startup ${validated.startupId}`,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [API] Pause workflow failed`, { error: error.message, duration: `${duration}ms` });
    
    const status = error.name === 'ZodError' ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/workflow/resume
 * Resume workflow for a startup
 */
router.post('/workflow/resume', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const schema = z.object({
      startupId: z.number().int().positive(),
    });

    const validated = schema.parse(req.body);
    console.log(`📥 [API] POST /api/wizards/workflow/resume`, { startupId: validated.startupId });

    await workflowSchedulerService.resumeWorkflow(validated.startupId);

    const duration = Date.now() - startTime;
    console.log(`✅ [API] Workflow resumed successfully`, { startupId: validated.startupId, duration: `${duration}ms` });

    res.json({
      success: true,
      message: `Workflow resumed for startup ${validated.startupId}`,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [API] Resume workflow failed`, { error: error.message, duration: `${duration}ms` });
    
    const status = error.name === 'ZodError' ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/wizards/workflow/trigger-progression
 * Manually trigger phase progression for a startup
 */
router.post('/workflow/trigger-progression', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const schema = z.object({
      startupId: z.number().int().positive(),
    });

    const validated = schema.parse(req.body);
    console.log(`📥 [API] POST /api/wizards/workflow/trigger-progression`, { startupId: validated.startupId });

    await workflowSchedulerService.triggerPhaseProgression(validated.startupId);

    const duration = Date.now() - startTime;
    console.log(`✅ [API] Phase progression triggered successfully`, { startupId: validated.startupId, duration: `${duration}ms` });

    res.json({
      success: true,
      message: `Phase progression triggered for startup ${validated.startupId}`,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [API] Trigger progression failed`, { error: error.message, duration: `${duration}ms` });
    
    const status = error.name === 'ZodError' ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// STUDIO-SPECIFIC ROUTES
// ============================================================================

// Mount Studio routes (direct paths for workflow endpoints)
router.use('/ideation-lab', wizardsIdeationLabRoutes);
router.use('/engineering-forge', wizardsEngineeringForgeRoutes);
router.use('/market-intelligence', wizardsMarketIntelligenceRoutes);
router.use('/product-blueprint', wizardsProductBlueprintRoutes);
router.use('/experience-design', wizardsExperienceDesignRoutes);
router.use('/quality-assurance-lab', wizardsQualityAssuranceLabRoutes);
router.use('/launch-command', wizardsLaunchCommandRoutes);
router.use('/growth-engine', wizardsGrowthEngineRoutes);
router.use('/operations-hub', wizardsOperationsHubRoutes);
router.use('/deployment-studio', wizardsDeploymentStudioRoutes);

// Mount Studio routes under /studios prefix (for session management and detail endpoints)
router.use('/studios/ideation-lab', wizardsIdeationLabRoutes);
router.use('/studios/engineering-forge', wizardsEngineeringForgeRoutes);
router.use('/studios/market-intelligence', wizardsMarketIntelligenceRoutes);
router.use('/studios/product-blueprint', wizardsProductBlueprintRoutes);
router.use('/studios/experience-design', wizardsExperienceDesignRoutes);
router.use('/studios/quality-assurance-lab', wizardsQualityAssuranceLabRoutes);
router.use('/studios/launch-command', wizardsLaunchCommandRoutes);
router.use('/studios/growth-engine', wizardsGrowthEngineRoutes);
router.use('/studios/operations-hub', wizardsOperationsHubRoutes);
router.use('/studios/deployment-studio', wizardsDeploymentStudioRoutes);

// Mount Competitor Analysis routes
router.use('/', wizardsCompetitorRoutes);

// Mount Journey Timeline routes
import wizardsJourneyTimelineRoutes from './wizards-journey-timeline-routes';
router.use('/journey', wizardsJourneyTimelineRoutes);

// ============================================================================
// CAM 2.0 MONITORING DASHBOARD - Real-Time Agent Metrics
// ============================================================================

/**
 * GET /api/wizards/cam/dashboard/:startupId
 * Get real-time CAM 2.0 monitoring dashboard data
 */
router.get('/cam/dashboard/:startupId', async (req: Request, res: Response) => {
  try {
    const startupId = parseInt(req.params.startupId);
    
    if (isNaN(startupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startup ID',
      });
    }
    
    // Get orchestration jobs for this startup
    const jobs = await db
      .select()
      .from(wizardsOrchestrationJobs)
      .where(eq(wizardsOrchestrationJobs.startupId, startupId))
      .orderBy(desc(wizardsOrchestrationJobs.createdAt))
      .limit(100);
    
    // Calculate metrics
    const totalExecutions = jobs.length;
    const successfulJobs = jobs.filter(j => j.status === 'completed');
    const failedJobs = jobs.filter(j => j.status === 'failed');
    const avgSuccessRate = totalExecutions > 0 ? successfulJobs.length / totalExecutions : 0;
    
    // Calculate costs - use cost column from schema
    const totalCost = jobs.reduce((sum, job) => sum + (parseFloat(job.cost?.toString() || '0')), 0);
    const llmCosts = totalCost * 0.9;
    const storageCosts = totalCost * 0.05;
    const computeCosts = totalCost * 0.05;
    
    // Determine cost trend (last 10 vs previous 10)
    const recentCost = jobs.slice(0, 10).reduce((sum, job) => sum + (parseFloat(job.cost?.toString() || '0')), 0);
    const previousCost = jobs.slice(10, 20).reduce((sum, job) => sum + (parseFloat(job.cost?.toString() || '0')), 0);
    const costTrend = recentCost < previousCost ? 'down' : recentCost > previousCost ? 'up' : 'stable';
    
    // Get unique agents used
    const agentsMap = new Map<string, { 
      successCount: number; 
      totalCount: number; 
      totalLatency: number;
      qualityScores: number[];
    }>();
    
    jobs.forEach(job => {
      // Use agents array from schema, not outputs
      const agents = job.agents || [];
      const latency = job.completedAt && job.startedAt 
        ? job.completedAt.getTime() - job.startedAt.getTime() 
        : (job.duration || 0);
      
      // Try to get quality from outputs JSON, fallback to default
      const outputs = job.outputs as any;
      const quality = outputs?.qualityScore || 0.85;
      
      agents.forEach((agent: string) => {
        if (!agentsMap.has(agent)) {
          agentsMap.set(agent, { successCount: 0, totalCount: 0, totalLatency: 0, qualityScores: [] });
        }
        const stats = agentsMap.get(agent)!;
        stats.totalCount++;
        if (job.status === 'completed') stats.successCount++;
        stats.totalLatency += latency;
        stats.qualityScores.push(quality);
      });
    });
    
    const agents = Array.from(agentsMap.entries()).map(([agentId, stats]) => ({
      agentId,
      successRate: stats.totalCount > 0 ? stats.successCount / stats.totalCount : 0,
      avgLatency: stats.totalCount > 0 ? Math.round(stats.totalLatency / stats.totalCount) : 0,
      totalExecutions: stats.totalCount,
      uptime: 0.99, // Placeholder
      workload: stats.totalCount,
      qualityScore: stats.qualityScores.length > 0 
        ? stats.qualityScores.reduce((a, b) => a + b, 0) / stats.qualityScores.length 
        : 0.85,
      status: stats.successCount / stats.totalCount >= 0.9 ? 'healthy' as const : 
              stats.successCount / stats.totalCount >= 0.7 ? 'degraded' as const : 
              'unhealthy' as const,
    })).sort((a, b) => b.totalExecutions - a.totalExecutions);
    
    // Calculate quality metrics from outputs JSON
    const allQualityScores = jobs.map(j => {
      const outputs = j.outputs as any;
      return outputs?.qualityScore || 0.85;
    }).filter(q => q > 0);
    const avgQuality = allQualityScores.length > 0 
      ? allQualityScores.reduce((a, b) => a + b, 0) / allQualityScores.length 
      : 0.85;
    
    // Recent executions - use schema columns
    const recentExecutions = jobs.slice(0, 10).map(job => ({
      orchestrationId: job.orchestrationId,
      workflow: job.workflow,
      duration: job.duration || (job.completedAt && job.startedAt 
        ? job.completedAt.getTime() - job.startedAt.getTime() 
        : 0),
      cost: parseFloat(job.cost?.toString() || '0'),
      status: job.status === 'completed' ? 'success' as const : 'failed' as const,
      timestamp: job.createdAt.toISOString(),
    }));
    
    res.json({
      overview: {
        totalAgents: agents.length,
        activeWorkflows: jobs.filter(j => j.status === 'running').length,
        totalExecutions,
        avgSuccessRate,
      },
      agents,
      costs: {
        totalCost,
        llmCosts,
        storageCosts,
        computeCosts,
        costTrend,
        recommendations: [
          'Use free models (KIMI K2, DeepSeek) for non-critical tasks',
          'Enable semantic caching to reduce redundant API calls',
          'Optimize context length to reduce token usage',
        ],
      },
      quality: {
        avgQuality,
        accuracy: avgQuality * 0.95,
        reliability: avgSuccessRate,
        consistency: avgQuality * 0.92,
      },
      recentExecutions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// ORCHESTRATION FEEDBACK - GRPO Continuous Learning
// ============================================================================

/**
 * POST /api/wizards/orchestration/:orchestrationId/feedback
 * Submit feedback for GRPO continuous learning system
 */
router.post('/orchestration/:orchestrationId/feedback', async (req: Request, res: Response) => {
  try {
    const { orchestrationId } = req.params;
    
    const feedbackSchema = z.object({
      quality: z.number().min(1).max(5),
      helpfulness: z.number().min(1).max(5),
      accuracy: z.number().min(1).max(5),
      relevance: z.number().min(1).max(5),
      comments: z.string().optional(),
    });
    
    const feedback = feedbackSchema.parse(req.body);
    
    const result = await wizardsOrchestrationService.submitOrchestrationFeedback(
      orchestrationId,
      feedback
    );
    
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
