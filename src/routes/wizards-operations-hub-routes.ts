import { Router } from 'express';
import { wizardsOperationsHubService } from '../services/studios/wizards-operations-hub';
import { db } from '../db';
import { wizardsFounders, wizardsStartups, wizardsStudioSessions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sharedAGUIService } from '../services/shared-agui-service';

const router = Router();

async function validateSessionAccess(userId: number, sessionId: number) {
  const founder = await db.query.wizardsFounders.findFirst({
    where: eq(wizardsFounders.userId, userId),
  });

  if (!founder) {
    throw new Error('Founder not found');
  }

  const session = await db.query.wizardsStudioSessions.findFirst({
    where: eq(wizardsStudioSessions.id, sessionId),
    with: {
      startup: true,
    },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.startup.founderId !== founder.id) {
    throw new Error('Unauthorized access to session');
  }

  return { founder, session };
}

router.post("/sessions/:sessionId/workflows/performance-analytics", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionId = parseInt(req.params.sessionId);
    const { startupContext } = req.body;

    const { session } = await validateSessionAccess(req.user.id, sessionId);

    const aguiSession = sharedAGUIService.createSession(
      session.startupId,
      sessionId,
      'operations-hub-performance-analytics',
      req.user.id
    );

    const result = await wizardsOperationsHubService.generatePerformanceAnalytics(
      sessionId,
      startupContext,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error("Performance analytics generation error:", error);
    
    if (error.message?.includes("not found") || error.message?.includes("Unauthorized")) {
      return res.status(error.message.includes("not found") ? 404 : 403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || "Failed to generate performance analytics" });
  }
});

router.post("/sessions/:sessionId/workflows/process-optimization", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionId = parseInt(req.params.sessionId);
    const { startupContext } = req.body;

    const { session } = await validateSessionAccess(req.user.id, sessionId);

    const aguiSession = sharedAGUIService.createSession(
      session.startupId,
      sessionId,
      'operations-hub-process-optimization',
      req.user.id
    );

    const result = await wizardsOperationsHubService.generateProcessOptimization(
      sessionId,
      startupContext,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error("Process optimization error:", error);
    
    if (error.message?.includes("not found") || error.message?.includes("Unauthorized")) {
      return res.status(error.message.includes("not found") ? 404 : 403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || "Failed to generate process optimization" });
  }
});

router.post("/sessions/:sessionId/workflows/continuous-improvement", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionId = parseInt(req.params.sessionId);
    const { startupContext } = req.body;

    const { session } = await validateSessionAccess(req.user.id, sessionId);

    const aguiSession = sharedAGUIService.createSession(
      session.startupId,
      sessionId,
      'operations-hub-continuous-improvement',
      req.user.id
    );

    const result = await wizardsOperationsHubService.generateContinuousImprovement(
      sessionId,
      startupContext,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error("Continuous improvement error:", error);
    
    if (error.message?.includes("not found") || error.message?.includes("Unauthorized")) {
      return res.status(error.message.includes("not found") ? 404 : 403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || "Failed to generate continuous improvement plan" });
  }
});

router.post("/sessions/:sessionId/workflows/resource-allocation", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionId = parseInt(req.params.sessionId);
    const { startupContext } = req.body;

    const { session } = await validateSessionAccess(req.user.id, sessionId);

    const aguiSession = sharedAGUIService.createSession(
      session.startupId,
      sessionId,
      'operations-hub-resource-allocation',
      req.user.id
    );

    const result = await wizardsOperationsHubService.generateResourceAllocation(
      sessionId,
      startupContext,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error: any) {
    console.error("Resource allocation error:", error);
    
    if (error.message?.includes("not found") || error.message?.includes("Unauthorized")) {
      return res.status(error.message.includes("not found") ? 404 : 403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || "Failed to generate resource allocation plan" });
  }
});

export default router;
