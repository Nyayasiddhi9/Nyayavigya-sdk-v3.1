import express, { type Request, type Response } from 'express';
import { analyticsService, type EventType } from '../services/analytics-service';
import { authenticateToken, requireAdmin, type AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const trackEventSchema = z.object({
  eventType: z.enum([
    'user_signup',
    'onboarding_started',
    'onboarding_completed',
    'studio_launched',
    'artifact_generated',
    'milestone_completed',
    'credit_purchased',
    'journey_completed',
    'error_encountered',
    'session_started',
    'session_ended',
  ]),
  properties: z.record(z.any()).optional(),
  startupId: z.number().optional(),
});

/**
 * POST /api/analytics/track
 * Track a user event
 */
router.post('/track', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const validation = trackEventSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
    }

    const { eventType, properties, startupId } = validation.data;

    const event = await analyticsService.trackEvent(
      userId,
      eventType as EventType,
      properties,
      startupId
    );

    res.json({
      success: true,
      event,
    });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track event',
    });
  }
});

/**
 * GET /api/analytics/events
 * Get user's analytics events
 */
router.get('/events', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const eventType = req.query.eventType as EventType | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const events = await analyticsService.getUserEvents(userId, eventType, startDate, endDate);

    res.json({
      success: true,
      events,
    });
  } catch (error: any) {
    console.error('Analytics events fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch events',
    });
  }
});

/**
 * GET /api/analytics/metrics
 * Get platform-wide analytics metrics (admin only)
 */
router.get('/metrics', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const metrics = await analyticsService.getMetrics(startDate, endDate);

    res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('Analytics metrics fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch metrics',
    });
  }
});

/**
 * GET /api/analytics/timeline
 * Get event timeline data (admin only)
 */
router.get('/timeline', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const eventType = req.query.eventType as EventType | undefined;
    const days = req.query.days ? parseInt(req.query.days as string) : 7;

    const timeline = await analyticsService.getEventTimeline(eventType, undefined, days);

    res.json({
      success: true,
      timeline,
    });
  } catch (error: any) {
    console.error('Analytics timeline fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch timeline',
    });
  }
});

export default router;
