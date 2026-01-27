import express from 'express';
import { wizardsLaunchCommandService } from '../services/studios/wizards-launch-command';
import { authenticateToken } from '../middleware/auth';
import { db } from '../db';
import { wizardsStartups, wizardsStudioSessions, wizardsFounders } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { sharedAGUIService } from '../services/shared-agui-service';

const router = express.Router();

// Multi-layer authorization helper
async function validateStartupAndSession(userId: string, startupId: number, sessionId: number) {
  // First, get the founder by userId
  const founder = await db.query.wizardsFounders.findFirst({
    where: eq(wizardsFounders.userId, userId),
  });

  if (!founder) {
    return { valid: false, message: 'Founder profile not found' };
  }

  // Then verify startup belongs to this founder
  const startup = await db.query.wizardsStartups.findFirst({
    where: and(
      eq(wizardsStartups.id, startupId),
      eq(wizardsStartups.founderId, founder.id)
    ),
  });

  if (!startup) {
    return { valid: false, message: 'Startup not found or unauthorized' };
  }

  const session = await db.query.wizardsStudioSessions.findFirst({
    where: and(
      eq(wizardsStudioSessions.id, sessionId),
      eq(wizardsStudioSessions.startupId, startupId)
    ),
  });

  if (!session) {
    return { valid: false, message: 'Session not found or does not belong to this startup' };
  }

  return { valid: true };
}

/**
 * Generate deployment strategy
 */
router.post('/generate-deployment-strategy', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { startupId, sessionId, appType, scalingNeeds, budgetConstraints, complianceRequirements } = req.body;

    if (!startupId || !sessionId || !appType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Multi-layer authorization
    const validation = await validateStartupAndSession(userId, startupId, sessionId);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.message });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'launch-command-deployment-strategy',
      userId
    );

    const result = await wizardsLaunchCommandService.generateDeploymentStrategy(
      {
        startupId,
        sessionId,
        appType,
        scalingNeeds: scalingNeeds || '',
        budgetConstraints: budgetConstraints || '',
        complianceRequirements: complianceRequirements || '',
      },
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error) {
    console.error('Error generating deployment strategy:', error);
    res.status(500).json({ error: 'Failed to generate deployment strategy' });
  }
});

/**
 * Generate DevOps setup
 */
router.post('/generate-devops-setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { startupId, sessionId, teamSize, releaseFrequency, techStack, qualityStandards } = req.body;

    if (!startupId || !sessionId || !teamSize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Multi-layer authorization
    const validation = await validateStartupAndSession(userId, startupId, sessionId);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.message });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'launch-command-devops-setup',
      userId
    );

    const result = await wizardsLaunchCommandService.generateDevOpsSetup(
      {
        startupId,
        sessionId,
        teamSize,
        releaseFrequency: releaseFrequency || '',
        techStack: techStack || '',
        qualityStandards: qualityStandards || '',
      },
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error) {
    console.error('Error generating DevOps setup:', error);
    res.status(500).json({ error: 'Failed to generate DevOps setup' });
  }
});

/**
 * Generate infrastructure as code
 */
router.post('/generate-infrastructure-code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { startupId, sessionId, cloudProvider, resourceNeeds, securityRequirements, backupStrategy } = req.body;

    if (!startupId || !sessionId || !cloudProvider) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Multi-layer authorization
    const validation = await validateStartupAndSession(userId, startupId, sessionId);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.message });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'launch-command-infrastructure-code',
      userId
    );

    const result = await wizardsLaunchCommandService.generateInfrastructureCode(
      {
        startupId,
        sessionId,
        cloudProvider,
        resourceNeeds: resourceNeeds || '',
        securityRequirements: securityRequirements || '',
        backupStrategy: backupStrategy || '',
      },
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error) {
    console.error('Error generating infrastructure code:', error);
    res.status(500).json({ error: 'Failed to generate infrastructure code' });
  }
});

/**
 * Generate monitoring & observability setup
 */
router.post('/generate-monitoring-setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { startupId, sessionId, systemScale, alertingNeeds, complianceLevel, retentionPolicy } = req.body;

    if (!startupId || !sessionId || !systemScale) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Multi-layer authorization
    const validation = await validateStartupAndSession(userId, startupId, sessionId);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.message });
    }

    // Create AG-UI session for real-time streaming
    const aguiSession = sharedAGUIService.createSession(
      startupId,
      sessionId,
      'launch-command-monitoring-setup',
      userId
    );

    const result = await wizardsLaunchCommandService.generateMonitoringSetup(
      {
        startupId,
        sessionId,
        systemScale,
        alertingNeeds: alertingNeeds || '',
        complianceLevel: complianceLevel || '',
        retentionPolicy: retentionPolicy || '',
      },
      { aguiSessionId: aguiSession.id }
    );

    res.json({
      ...result,
      aguiSessionId: aguiSession.id,
      streamUrl: `/api/agui/stream/${aguiSession.id}`,
    });
  } catch (error) {
    console.error('Error generating monitoring setup:', error);
    res.status(500).json({ error: 'Failed to generate monitoring setup' });
  }
});

export default router;
