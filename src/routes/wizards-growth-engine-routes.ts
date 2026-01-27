import { Router } from "express";
import { wizardsGrowthEngineService } from "../services/studios/wizards-growth-engine";
import { db } from "../db";
import { wizardsFounders, wizardsStartups, wizardsStudioSessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sharedAGUIService } from '../services/shared-agui-service';

const router = Router();

async function validateSessionAccess(userId: number, sessionId: number) {
  const founder = await db.query.wizardsFounders.findFirst({
    where: eq(wizardsFounders.userId, userId)
  });

  if (!founder) {
    throw new Error("Founder profile not found");
  }

  const session = await db.query.wizardsStudioSessions.findFirst({
    where: eq(wizardsStudioSessions.id, sessionId),
    with: {
      startup: true
    }
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.startup.founderId !== founder.id) {
    throw new Error("Unauthorized access to session");
  }

  return { founder, session };
}

router.post("/sessions/:sessionId/workflows/marketing-strategy", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionId = parseInt(req.params.sessionId);
    const { startupContext } = req.body;

    const { session } = await validateSessionAccess(req.user.id, sessionId);

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      session.startup.id,
      sessionId,
      'growth-engine-marketing',
      req.user.id
    );

    const result = await wizardsGrowthEngineService.generateMarketingStrategy(
      sessionId,
      startupContext,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`
    });
  } catch (error: any) {
    console.error("Marketing strategy generation error:", error);
    
    // Return proper status codes for auth/validation errors
    if (error.message?.includes("not found") || error.message?.includes("Unauthorized")) {
      return res.status(error.message.includes("not found") ? 404 : 403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || "Failed to generate marketing strategy" });
  }
});

router.post("/sessions/:sessionId/workflows/seo-optimization", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionId = parseInt(req.params.sessionId);
    const { startupContext } = req.body;

    const { session } = await validateSessionAccess(req.user.id, sessionId);

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      session.startup.id,
      sessionId,
      'growth-engine-seo',
      req.user.id
    );

    const result = await wizardsGrowthEngineService.generateSEOOptimization(
      sessionId,
      startupContext,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`
    });
  } catch (error: any) {
    console.error("SEO optimization error:", error);
    
    // Return proper status codes for auth/validation errors
    if (error.message?.includes("not found") || error.message?.includes("Unauthorized")) {
      return res.status(error.message.includes("not found") ? 404 : 403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || "Failed to generate SEO plan" });
  }
});

router.post("/sessions/:sessionId/workflows/growth-hacking", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionId = parseInt(req.params.sessionId);
    const { startupContext } = req.body;

    const { session } = await validateSessionAccess(req.user.id, sessionId);

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      session.startup.id,
      sessionId,
      'growth-engine-hacking',
      req.user.id
    );

    const result = await wizardsGrowthEngineService.generateGrowthHacking(
      sessionId,
      startupContext,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`
    });
  } catch (error: any) {
    console.error("Growth hacking error:", error);
    
    // Return proper status codes for auth/validation errors
    if (error.message?.includes("not found") || error.message?.includes("Unauthorized")) {
      return res.status(error.message.includes("not found") ? 404 : 403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || "Failed to generate growth tactics" });
  }
});

router.post("/sessions/:sessionId/workflows/content-marketing", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionId = parseInt(req.params.sessionId);
    const { startupContext } = req.body;

    const { session } = await validateSessionAccess(req.user.id, sessionId);

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      session.startup.id,
      sessionId,
      'growth-engine-content',
      req.user.id
    );

    const result = await wizardsGrowthEngineService.generateContentMarketing(
      sessionId,
      startupContext,
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`
    });
  } catch (error: any) {
    console.error("Content marketing generation error:", error);
    
    // Return proper status codes for auth/validation errors
    if (error.message?.includes("not found") || error.message?.includes("Unauthorized")) {
      return res.status(error.message.includes("not found") ? 404 : 403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || "Failed to generate content marketing strategy" });
  }
});

export default router;
