import { Router } from 'express';
import { z, ZodError } from 'zod';
import { sdlcOrchestration } from '../services/sdlc-orchestration';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * SDLC 100% Automation API Routes
 * WAI SDK v1.0 as Single Source of Truth
 * All 8 Workflows: Discovery, Triage, Sprint, Quality, Package, Deploy, Monitor, Feedback
 */

// Validation schemas
const discoverySchema = z.object({
  founderId: z.string(),
  projectId: z.number(),
  ideaDescription: z.string().min(10),
  targetMarket: z.string().optional(),
  config: z.any().optional(),
});

const triageSchema = z.object({
  founderId: z.string(),
  projectId: z.number(),
  features: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })),
  businessGoals: z.string().optional(),
});

const sprintSchema = z.object({
  founderId: z.string(),
  projectId: z.number(),
  features: z.array(z.object({
    name: z.string(),
    description: z.string(),
    priority: z.string(),
  })),
  sprintNumber: z.number(),
  sprintDuration: z.number().optional(),
});

const qualitySchema = z.object({
  founderId: z.string(),
  projectId: z.number(),
  codeRepository: z.string(),
  branch: z.string().optional(),
});

const packageSchema = z.object({
  founderId: z.string(),
  projectId: z.number(),
  repository: z.string(),
  environment: z.enum(["development", "staging", "production"]),
});

const deploySchema = z.object({
  founderId: z.string(),
  projectId: z.number(),
  artifactUrl: z.string(),
  cloudProvider: z.enum(["aws", "gcp", "azure", "replit"]),
  environment: z.enum(["development", "staging", "production"]),
});

const monitorSchema = z.object({
  founderId: z.string(),
  projectId: z.number(),
  deploymentUrl: z.string(),
  monitoringDuration: z.number().optional(),
});

const feedbackSchema = z.object({
  founderId: z.string(),
  projectId: z.number(),
  metricsData: z.any(),
  timeRange: z.string().optional(),
});

// GET ENDPOINTS FOR DASHBOARD

// Get all workflows
router.get('/workflows', authenticateToken, async (req, res) => {
  try {
    const { db } = await import('../db/index');
    const { sdlcWorkflows } = await import('../../shared/sdlc-schema');
    const { desc } = await import('drizzle-orm');
    
    const workflows = await db.select().from(sdlcWorkflows).orderBy(desc(sdlcWorkflows.createdAt));
    res.json({ success: true, data: workflows });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all executions (optionally filtered by workflowId)
router.get('/executions', authenticateToken, async (req, res) => {
  try {
    const { db } = await import('../db/index');
    const { sdlcWorkflowExecutions } = await import('../../shared/sdlc-schema');
    const { desc, eq } = await import('drizzle-orm');
    
    const { workflowId } = req.query;
    
    let executions;
    if (workflowId) {
      executions = await db.select()
        .from(sdlcWorkflowExecutions)
        .where(eq(sdlcWorkflowExecutions.workflowId, workflowId as string))
        .orderBy(desc(sdlcWorkflowExecutions.startedAt));
    } else {
      executions = await db.select()
        .from(sdlcWorkflowExecutions)
        .orderBy(desc(sdlcWorkflowExecutions.startedAt));
    }
    
    res.json({ success: true, data: executions });
  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Unified execute endpoint for dashboard (provides defaults for demo/testing)
router.post('/workflows/:type/execute', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { founderId, projectId, projectContext } = req.body;
    
    if (!founderId || !projectId) {
      return res.status(400).json({
        success: false,
        error: 'founderId and projectId are required',
      });
    }

    let result;
    const baseParams = { founderId, projectId };

    switch (type) {
      case 'discovery':
        result = await sdlcOrchestration.executeDiscoveryWorkflow({
          ...baseParams,
          ideaDescription: projectContext?.description || 'Demo project for SDLC automation',
          targetMarket: projectContext?.targetMarket || 'General',
        });
        break;
      case 'triage':
        result = await sdlcOrchestration.executeTriageWorkflow({
          ...baseParams,
          features: projectContext?.features || [{ name: 'Demo Feature', description: 'Feature description' }],
          businessGoals: projectContext?.businessGoals || 'Demonstrate SDLC automation',
        });
        break;
      case 'sprint':
        result = await sdlcOrchestration.executeSprintWorkflow({
          ...baseParams,
          features: projectContext?.features || [{ name: 'Demo Feature', description: 'Feature description', priority: 'high' }],
          sprintNumber: projectContext?.sprintNumber || 1,
        });
        break;
      case 'quality':
        result = await sdlcOrchestration.executeQualityWorkflow({
          ...baseParams,
          codeRepository: projectContext?.repository || 'https://github.com/demo/repo',
          branch: projectContext?.branch || 'main',
        });
        break;
      case 'package':
        result = await sdlcOrchestration.executePackageWorkflow({
          ...baseParams,
          repository: projectContext?.repository || 'https://github.com/demo/repo',
          environment: projectContext?.environment || 'development',
        });
        break;
      case 'deploy':
        result = await sdlcOrchestration.executeDeployWorkflow({
          ...baseParams,
          artifactUrl: projectContext?.artifactUrl || 'https://example.com/artifact.zip',
          cloudProvider: projectContext?.cloudProvider || 'replit',
          environment: projectContext?.environment || 'development',
        });
        break;
      case 'monitor':
        result = await sdlcOrchestration.executeMonitorWorkflow({
          ...baseParams,
          deploymentUrl: projectContext?.deploymentUrl || 'https://example.replit.app',
        });
        break;
      case 'feedback':
        result = await sdlcOrchestration.executeFeedbackWorkflow({
          ...baseParams,
          metricsData: projectContext?.metricsData || { users: 100, performance: 'good' },
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown workflow type: ${type}`,
        });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error(`Execute ${req.params.type} workflow error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 1. DISCOVERY WORKFLOW
router.post('/workflows/discovery', authenticateToken, async (req, res) => {
  try {
    const validationResult = discoverySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }
    const result = await sdlcOrchestration.executeDiscoveryWorkflow(validationResult.data);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Discovery workflow error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 2. TRIAGE WORKFLOW
router.post('/workflows/triage', authenticateToken, async (req, res) => {
  try {
    const validationResult = triageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }
    const result = await sdlcOrchestration.executeTriageWorkflow(validationResult.data);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Triage workflow error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 3. SPRINT WORKFLOW
router.post('/workflows/sprint', authenticateToken, async (req, res) => {
  try {
    const validationResult = sprintSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }
    const result = await sdlcOrchestration.executeSprintWorkflow(validationResult.data);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Sprint workflow error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 4. QUALITY WORKFLOW
router.post('/workflows/quality', authenticateToken, async (req, res) => {
  try {
    const validationResult = qualitySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }
    const result = await sdlcOrchestration.executeQualityWorkflow(validationResult.data);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Quality workflow error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 5. PACKAGE WORKFLOW
router.post('/workflows/package', authenticateToken, async (req, res) => {
  try {
    const validationResult = packageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }
    const result = await sdlcOrchestration.executePackageWorkflow(validationResult.data);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Package workflow error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 6. DEPLOY WORKFLOW
router.post('/workflows/deploy', authenticateToken, async (req, res) => {
  try {
    const validationResult = deploySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }
    const result = await sdlcOrchestration.executeDeployWorkflow(validationResult.data);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Deploy workflow error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 7. MONITOR WORKFLOW
router.post('/workflows/monitor', authenticateToken, async (req, res) => {
  try {
    const validationResult = monitorSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }
    const result = await sdlcOrchestration.executeMonitorWorkflow(validationResult.data);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Monitor workflow error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 8. FEEDBACK WORKFLOW
router.post('/workflows/feedback', authenticateToken, async (req, res) => {
  try {
    const validationResult = feedbackSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }
    const result = await sdlcOrchestration.executeFeedbackWorkflow(validationResult.data);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Feedback workflow error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Query endpoints
router.get('/workflows/:workflowId', async (req, res) => {
  try {
    const workflow = await sdlcOrchestration.getWorkflow(req.params.workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    res.json({ success: true, data: workflow });
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/workflows/:workflowId/stages', async (req, res) => {
  try {
    const stages = await sdlcOrchestration.getWorkflowStages(req.params.workflowId);
    res.json({ success: true, data: stages });
  } catch (error) {
    console.error('Get stages error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/workflows/:workflowId/tasks', async (req, res) => {
  try {
    const tasks = await sdlcOrchestration.getWorkflowTasks(req.params.workflowId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/workflows/:workflowId/artifacts', async (req, res) => {
  try {
    const artifacts = await sdlcOrchestration.getWorkflowArtifacts(req.params.workflowId);
    res.json({ success: true, data: artifacts });
  } catch (error) {
    console.error('Get artifacts error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/projects/:projectId/workflows', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID' });
    }
    const workflows = await sdlcOrchestration.getWorkflowsByProject(projectId);
    res.json({ success: true, data: workflows });
  } catch (error) {
    console.error('Get project workflows error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'SDLC Orchestration',
    version: '1.0.0',
    waiSdk: 'v1.0',
    workflows: [
      'discovery',
      'triage',
      'sprint',
      'quality',
      'package',
      'deploy',
      'monitor',
      'feedback',
    ],
  });
});

export default router;
