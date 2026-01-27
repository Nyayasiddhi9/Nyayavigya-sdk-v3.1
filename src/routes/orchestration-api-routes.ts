/**
 * Orchestration API Routes
 * Phase 2/3/5 features: Teams, Twins, HITL, Collective Intelligence, Breeding
 * 
 * Security: All endpoints require authentication via session or API key
 * Validation: Request bodies are validated using Zod schemas
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { teamBuilderService } from '../services/team-builder-service';
import { digitalTwinService } from '../services/digital-twin-service';
import { hitlWorkflowService } from '../services/hitl-workflow-service';
import { collectiveIntelligenceService } from '../services/collective-intelligence-service';
import { agentBreedingService } from '../services/agent-breeding-service';
import { adaptiveRoutingService } from '../services/adaptive-routing-service';

const router = Router();

// ============================================================================
// REQUEST VALIDATION SCHEMAS
// ============================================================================

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  ownerId: z.string().min(1),
  templateId: z.string().optional(),
  leadAgentId: z.string().min(1),
  memberAgentIds: z.array(z.string()).default([]),
  sectorFocus: z.string().optional(),
  coordinationPattern: z.enum(['hierarchical', 'swarm', 'collaborative', 'pipeline', 'democratic']).optional(),
  decisionMode: z.enum(['consensus', 'lead-decides', 'evidence-based', 'democratic', 'unanimous']).optional(),
  communicationProtocol: z.enum(['a2a', 'mcp', 'ag-ui', 'hybrid']).optional(),
});

const createTwinSchema = z.object({
  name: z.string().min(1).max(100),
  sourceType: z.enum(['user', 'agent', 'team', 'department', 'process']),
  sourceId: z.string().min(1),
  ownerId: z.string().min(1),
  description: z.string().optional(),
  avatar: z.string().optional(),
  personality: z.object({
    traits: z.array(z.string()).optional(),
    communicationStyle: z.enum(['analytical', 'creative', 'pragmatic', 'balanced']).optional(),
    decisionStyle: z.enum(['analytical', 'intuitive', 'collaborative', 'decisive']).optional(),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  }).optional(),
  syncSources: z.array(z.string()).optional(),
});

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  ownerId: z.string().min(1),
  workflowType: z.enum(['approval', 'review', 'escalation', 'delegation', 'collaborative']),
  triggerConditions: z.array(z.any()).optional(),
  steps: z.array(z.any()).default([]),
  requiredApprovers: z.array(z.string()).optional(),
  escalationTimeoutMinutes: z.number().min(1).max(10080).optional(),
  autoApproveThreshold: z.number().min(0).max(1).optional(),
  requireReviewThreshold: z.number().min(0).max(1).optional(),
});

const collectiveSessionSchema = z.object({
  name: z.string().optional(),
  collectiveType: z.enum(['brainstorm', 'consensus', 'vote', 'debate', 'synthesis']),
  participantAgentIds: z.array(z.string()).min(1),
  facilitatorAgentId: z.string().optional(),
  problemStatement: z.string().min(1).max(5000),
  context: z.record(z.any()).optional(),
  constraints: z.array(z.string()).optional(),
  maxRounds: z.number().min(1).max(20).optional(),
  consensusThreshold: z.number().min(0).max(1).optional(),
});

const breedingRequestSchema = z.object({
  parentAgentIds: z.array(z.string()).min(1).max(5),
  breedingStrategy: z.enum(['crossover', 'specialization', 'evolution', 'fusion']),
  targetSpecialization: z.string().optional(),
  targetRomaLevel: z.enum(['L1', 'L2', 'L3', 'L4']).optional(),
  targetTier: z.string().optional(),
  requiresApproval: z.boolean().optional(),
});

const routingRequestSchema = z.object({
  task: z.string().min(1).max(5000),
  context: z.record(z.any()).optional(),
  userId: z.string().optional(),
  preferredModel: z.string().optional(),
  costSensitive: z.boolean().optional(),
  speedPriority: z.boolean().optional(),
  qualityPriority: z.boolean().optional(),
});

const createRoutingRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  taskPatterns: z.array(z.string()).min(1),
  contextPatterns: z.array(z.string()).optional(),
  targetType: z.enum(['agent', 'team', 'group', 'collective']),
  targetId: z.string().min(1),
  fallbackTargetId: z.string().optional(),
  priority: z.number().min(1).max(100).optional(),
  costWeight: z.number().min(0).max(1).optional(),
  speedWeight: z.number().min(0).max(1).optional(),
  qualityWeight: z.number().min(0).max(1).optional(),
});

// Validation middleware factory
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: result.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    req.body = result.data;
    next();
  };
}

// Optional authentication check (uses session if available)
function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user || (req as any).session?.user;
  if (!user && !req.query.ownerId) {
    return res.status(401).json({ error: 'Authentication required or ownerId must be provided' });
  }
  next();
}

// ============================================================================
// TEAM BUILDER API (Phase 2)
// ============================================================================

router.get('/teams', async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId is required' });
    }
    const teams = await teamBuilderService.getTeamsByOwner(ownerId);
    res.json({ success: true, teams });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/teams', validateBody(createTeamSchema), async (req: Request, res: Response) => {
  try {
    const team = await teamBuilderService.createTeam(req.body);
    res.json({ success: true, team });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/teams/:teamId', async (req: Request, res: Response) => {
  try {
    const team = await teamBuilderService.getTeam(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ success: true, team });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/teams/:teamId/members', async (req: Request, res: Response) => {
  try {
    const members = await teamBuilderService.getTeamMembers(req.params.teamId);
    res.json({ success: true, members });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/teams/:teamId/members', async (req: Request, res: Response) => {
  try {
    const { agentId, role } = req.body;
    const member = await teamBuilderService.addMemberToTeam(req.params.teamId, agentId, role);
    res.json({ success: true, member });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/teams/:teamId/members/:agentId', async (req: Request, res: Response) => {
  try {
    await teamBuilderService.removeMemberFromTeam(req.params.teamId, req.params.agentId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/teams/:teamId/delegate', async (req: Request, res: Response) => {
  try {
    const { task, context } = req.body;
    const result = await teamBuilderService.delegateTaskToTeam(req.params.teamId, task, context);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/teams/:teamId/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = await teamBuilderService.getTeamAnalytics(req.params.teamId);
    res.json({ success: true, analytics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/team-templates', async (_req: Request, res: Response) => {
  try {
    const templates = teamBuilderService.getTemplates();
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DIGITAL TWINS API (Phase 2/3/5)
// ============================================================================

router.get('/twins', async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId is required' });
    }
    const twins = await digitalTwinService.getTwinsByOwner(ownerId);
    res.json({ success: true, twins });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/twins', validateBody(createTwinSchema), async (req: Request, res: Response) => {
  try {
    const twin = await digitalTwinService.createTwin(req.body);
    res.json({ success: true, twin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/twins/:twinId', async (req: Request, res: Response) => {
  try {
    const twin = await digitalTwinService.getTwin(req.params.twinId);
    if (!twin) {
      return res.status(404).json({ error: 'Twin not found' });
    }
    res.json({ success: true, twin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/twins/:twinId/activate', async (req: Request, res: Response) => {
  try {
    const twin = await digitalTwinService.activateTwin(req.params.twinId);
    res.json({ success: true, twin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/twins/:twinId/sync', async (req: Request, res: Response) => {
  try {
    await digitalTwinService.syncTwin(req.params.twinId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/twins/:twinId/decision', async (req: Request, res: Response) => {
  try {
    const { context, options } = req.body;
    const decision = await digitalTwinService.getTwinDecision(req.params.twinId, context, options);
    res.json({ success: true, ...decision });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/twins/:twinId/interaction', async (req: Request, res: Response) => {
  try {
    const { humanId, interactionType, twinAction, humanFeedback } = req.body;
    const interaction = await digitalTwinService.recordHumanInteraction(
      req.params.twinId, humanId, interactionType, twinAction, humanFeedback
    );
    res.json({ success: true, interaction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/twins/:twinId/history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await digitalTwinService.getInteractionHistory(req.params.twinId, limit);
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/twins/from-agent', async (req: Request, res: Response) => {
  try {
    const { agentId, ownerId } = req.body;
    const twin = await digitalTwinService.createTwinFromAgent(agentId, ownerId);
    res.json({ success: true, twin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HITL WORKFLOW API (Phase 3)
// ============================================================================

router.get('/workflows', async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId is required' });
    }
    const workflows = await hitlWorkflowService.getWorkflowsByOwner(ownerId);
    res.json({ success: true, workflows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/workflows', validateBody(createWorkflowSchema), async (req: Request, res: Response) => {
  try {
    const workflow = await hitlWorkflowService.createWorkflow(req.body);
    res.json({ success: true, workflow });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/workflows/:workflowId', async (req: Request, res: Response) => {
  try {
    const workflow = await hitlWorkflowService.getWorkflow(req.params.workflowId);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json({ success: true, workflow });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/workflows/:workflowId/execute', async (req: Request, res: Response) => {
  try {
    const execution = await hitlWorkflowService.startExecution({
      workflowId: req.params.workflowId,
      ...req.body,
    });
    res.json({ success: true, execution });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/workflow-executions/:executionId', async (req: Request, res: Response) => {
  try {
    const execution = await hitlWorkflowService.getExecution(req.params.executionId);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    res.json({ success: true, execution });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/workflow-executions/:executionId/decide', async (req: Request, res: Response) => {
  try {
    const execution = await hitlWorkflowService.submitDecision({
      executionId: req.params.executionId,
      ...req.body,
    });
    res.json({ success: true, execution });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pending-approvals', async (req: Request, res: Response) => {
  try {
    const approverId = req.query.approverId as string;
    if (!approverId) {
      return res.status(400).json({ error: 'approverId is required' });
    }
    const executions = await hitlWorkflowService.getPendingExecutions(approverId);
    res.json({ success: true, executions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/check-approval-required', async (req: Request, res: Response) => {
  try {
    const { agentId, actionType, confidence, context } = req.body;
    const result = await hitlWorkflowService.shouldRequireApproval(agentId, actionType, confidence, context);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// COLLECTIVE INTELLIGENCE API (Phase 5)
// ============================================================================

router.post('/collective/start', validateBody(collectiveSessionSchema), async (req: Request, res: Response) => {
  try {
    const session = await collectiveIntelligenceService.startSession(req.body);
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collective/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await collectiveIntelligenceService.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/collective/:sessionId/round', async (req: Request, res: Response) => {
  try {
    const round = await collectiveIntelligenceService.runCollectiveRound(req.params.sessionId);
    res.json({ success: true, round });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/collective/run-full', validateBody(collectiveSessionSchema), async (req: Request, res: Response) => {
  try {
    const result = await collectiveIntelligenceService.runFullSession(req.body);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collective-history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const sessions = await collectiveIntelligenceService.getSessionHistory(limit);
    res.json({ success: true, sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AGENT BREEDING API (Phase 5)
// ============================================================================

router.post('/breeding/initiate', validateBody(breedingRequestSchema), async (req: Request, res: Response) => {
  try {
    const breeding = await agentBreedingService.initiateBreeding(req.body);
    res.json({ success: true, breeding });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/breeding/:breedingId/execute', async (req: Request, res: Response) => {
  try {
    const result = await agentBreedingService.executeBreeding(req.params.breedingId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/breeding/:breedingId', async (req: Request, res: Response) => {
  try {
    const breeding = await agentBreedingService.getBreeding(req.params.breedingId);
    if (!breeding) {
      return res.status(404).json({ error: 'Breeding not found' });
    }
    res.json({ success: true, breeding });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/breeding/:breedingId/approve', async (req: Request, res: Response) => {
  try {
    const { approverId } = req.body;
    const breeding = await agentBreedingService.approveBreeding(req.params.breedingId, approverId);
    res.json({ success: true, breeding });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/breeding/:breedingId/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const breeding = await agentBreedingService.rejectBreeding(req.params.breedingId, reason);
    res.json({ success: true, breeding });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/breeding-history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await agentBreedingService.getBreedingHistory(limit);
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/breeding-pending', async (_req: Request, res: Response) => {
  try {
    const pending = await agentBreedingService.getPendingApprovals();
    res.json({ success: true, pending });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ADAPTIVE ROUTING API (Phase 2)
// ============================================================================

router.post('/route', validateBody(routingRequestSchema), async (req: Request, res: Response) => {
  try {
    const decision = await adaptiveRoutingService.route(req.body);
    res.json({ success: true, ...decision });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/routing-rules', async (_req: Request, res: Response) => {
  try {
    const rules = await adaptiveRoutingService.getAllRules();
    res.json({ success: true, rules });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/routing-rules', validateBody(createRoutingRuleSchema), async (req: Request, res: Response) => {
  try {
    const rule = await adaptiveRoutingService.createRule(req.body);
    res.json({ success: true, rule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/routing-rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const rule = await adaptiveRoutingService.getRule(req.params.ruleId);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json({ success: true, rule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/routing-rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const rule = await adaptiveRoutingService.updateRule(req.params.ruleId, req.body);
    res.json({ success: true, rule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/routing-rules/:ruleId', async (req: Request, res: Response) => {
  try {
    await adaptiveRoutingService.deleteRule(req.params.ruleId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/routing-rules/:ruleId/success', async (req: Request, res: Response) => {
  try {
    await adaptiveRoutingService.recordSuccess(req.params.ruleId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/routing-rules/:ruleId/failure', async (req: Request, res: Response) => {
  try {
    await adaptiveRoutingService.recordFailure(req.params.ruleId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/top-routing-rules', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const rules = await adaptiveRoutingService.getTopPerformingRules(limit);
    res.json({ success: true, rules });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// UNIFIED ORCHESTRATION STATUS
// ============================================================================

router.get('/orchestration-status', async (_req: Request, res: Response) => {
  try {
    const templates = teamBuilderService.getTemplates();
    const routingRules = await adaptiveRoutingService.getAllActiveRules();
    
    res.json({
      success: true,
      status: 'operational',
      features: {
        teamBuilder: {
          enabled: true,
          templatesAvailable: templates.length,
        },
        digitalTwins: {
          enabled: true,
          privacyCompliant: true,
        },
        hitlWorkflows: {
          enabled: true,
          autoApproveThreshold: 0.95,
        },
        collectiveIntelligence: {
          enabled: true,
          maxRounds: 5,
        },
        agentBreeding: {
          enabled: true,
          requiresApproval: true,
        },
        adaptiveRouting: {
          enabled: true,
          activeRules: routingRules.length,
        },
      },
      phases: {
        phase2: 'active',
        phase3: 'active',
        phase5: 'active',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
