import { Router } from "express";
import { db } from "../db";
import { wizardsFounders, wizardsStartups, wizardsStudioSessions } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { wizardsDeploymentStudioService } from "../services/studios/wizards-deployment-studio";
import { sharedAGUIService } from "../services/shared-agui-service";

const router = Router();

router.post("/cloud-provider-deploy", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.userId, req.user.id)
    });

    if (!founder) {
      return res.status(403).json({ error: "Founder profile not found" });
    }

    const { sessionId, startupId, provider, projectType, buildCommand, environment } = req.body;

    const session = await db.query.wizardsStudioSessions.findFirst({
      where: eq(wizardsStudioSessions.id, sessionId),
      with: {
        startup: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.startup.founderId !== founder.id) {
      return res.status(403).json({ error: "Unauthorized access to this session" });
    }

    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'deployment-studio-cloud-deploy',
      req.user.id
    );

    const result = await wizardsDeploymentStudioService.generateCloudProviderDeployment(
      sessionId,
      { provider, projectType, buildCommand, environment },
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error) {
    console.error("Cloud provider deployment error:", error);
    res.status(500).json({ error: "Failed to generate cloud deployment configuration" });
  }
});

router.post("/cicd-setup", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.userId, req.user.id)
    });

    if (!founder) {
      return res.status(403).json({ error: "Founder profile not found" });
    }

    const { sessionId, startupId, platform, triggers, testingStrategy, deploymentStages } = req.body;

    const session = await db.query.wizardsStudioSessions.findFirst({
      where: eq(wizardsStudioSessions.id, sessionId),
      with: {
        startup: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.startup.founderId !== founder.id) {
      return res.status(403).json({ error: "Unauthorized access to this session" });
    }

    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'deployment-studio-cicd',
      req.user.id
    );

    const result = await wizardsDeploymentStudioService.generateCICDSetup(
      sessionId,
      { platform, triggers, testingStrategy, deploymentStages },
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error) {
    console.error("CI/CD setup error:", error);
    res.status(500).json({ error: "Failed to generate CI/CD pipeline configuration" });
  }
});

router.post("/domain-configuration", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.userId, req.user.id)
    });

    if (!founder) {
      return res.status(403).json({ error: "Founder profile not found" });
    }

    const { sessionId, startupId, domainName, provider, sslSetup, dnsRecords } = req.body;

    const session = await db.query.wizardsStudioSessions.findFirst({
      where: eq(wizardsStudioSessions.id, sessionId),
      with: {
        startup: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.startup.founderId !== founder.id) {
      return res.status(403).json({ error: "Unauthorized access to this session" });
    }

    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'deployment-studio-domain',
      req.user.id
    );

    const result = await wizardsDeploymentStudioService.generateDomainConfiguration(
      sessionId,
      { domainName, provider, sslSetup, dnsRecords },
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error) {
    console.error("Domain configuration error:", error);
    res.status(500).json({ error: "Failed to generate domain configuration guide" });
  }
});

router.post("/monitoring-setup", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.userId, req.user.id)
    });

    if (!founder) {
      return res.status(403).json({ error: "Founder profile not found" });
    }

    const { sessionId, startupId, platform, metricsToTrack, alertingRules, dashboardRequirements } = req.body;

    const session = await db.query.wizardsStudioSessions.findFirst({
      where: eq(wizardsStudioSessions.id, sessionId),
      with: {
        startup: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.startup.founderId !== founder.id) {
      return res.status(403).json({ error: "Unauthorized access to this session" });
    }

    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'deployment-studio-monitoring',
      req.user.id
    );

    const result = await wizardsDeploymentStudioService.generateMonitoringSetup(
      sessionId,
      { platform, metricsToTrack, alertingRules, dashboardRequirements },
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error) {
    console.error("Monitoring setup error:", error);
    res.status(500).json({ error: "Failed to generate monitoring configuration" });
  }
});

export default router;
