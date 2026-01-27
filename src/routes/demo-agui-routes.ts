/**
 * Demo AG-UI Orchestration Routes
 * 
 * Purpose: API endpoints for testing AG-UI streaming with realistic agent execution
 * Studios can use these routes to validate AG-UI integration before WAI core instrumentation
 */

import express, { type Request, type Response } from 'express';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { aguiWAIIntegrationService } from '../services/agui-wai-integration-service';
import {
  executeDemoAgentWithStreaming,
  executeDemoMultiAgentWithStreaming,
  executeDemoAgentWithApproval,
  type DemoAgentTask
} from '../services/demo-agui-orchestration';
import { z } from 'zod';

const router = express.Router();

// ================================================================================================
// DEMO ORCHESTRATION ENDPOINTS
// ================================================================================================

/**
 * POST /api/demo-agui/execute-agent
 * Execute a single demo agent with AG-UI streaming
 */
router.post('/execute-agent', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number(),
      agentId: z.string(),
      task: z.string(),
      context: z.record(z.any()).optional(),
      complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
    });

    const data = schema.parse(req.body);
    
    // Create AG-UI session
    const session = aguiWAIIntegrationService.createSession(
      data.startupId,
      undefined,
      'demo-studio',
      req.user?.id
    );
    
    // Return sessionId immediately
    res.json({
      success: true,
      sessionId: session.id,
      message: 'Demo agent execution started - connect to SSE stream at /api/agui/stream/' + session.id,
      streamUrl: `/api/agui/stream/${session.id}`
    });
    
    // Execute demo agent asynchronously (events emit while client is streaming)
    setImmediate(async () => {
      try {
        await executeDemoAgentWithStreaming(session.id, {
          agentId: data.agentId,
          task: data.task,
          context: data.context,
          complexity: data.complexity || 'moderate'
        });
      } catch (error) {
        console.error('Demo agent execution error:', error);
      }
    });
    
  } catch (error) {
    console.error('Demo agent execution error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/demo-agui/execute-multi-agent
 * Execute multiple demo agents in parallel with AG-UI streaming
 */
router.post('/execute-multi-agent', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number(),
      tasks: z.array(z.object({
        agentId: z.string(),
        task: z.string(),
        context: z.record(z.any()).optional(),
        complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
      }))
    });

    const data = schema.parse(req.body);
    
    // Create AG-UI session
    const session = aguiWAIIntegrationService.createSession(
      data.startupId,
      undefined,
      'demo-multi-agent',
      req.user?.id
    );
    
    // Return sessionId immediately
    res.json({
      success: true,
      sessionId: session.id,
      agentCount: data.tasks.length,
      message: 'Demo multi-agent execution started - connect to SSE stream at /api/agui/stream/' + session.id,
      streamUrl: `/api/agui/stream/${session.id}`
    });
    
    // Execute demo multi-agent asynchronously
    setImmediate(async () => {
      try {
        await executeDemoMultiAgentWithStreaming(session.id, data.tasks);
      } catch (error) {
        console.error('Demo multi-agent execution error:', error);
      }
    });
    
  } catch (error) {
    console.error('Demo multi-agent execution error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/demo-agui/execute-with-approval
 * Execute demo agent with human-in-the-loop approval
 */
router.post('/execute-with-approval', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      startupId: z.number(),
      agentId: z.string(),
      task: z.string(),
      context: z.record(z.any()).optional(),
      complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
    });

    const data = schema.parse(req.body);
    
    // Create AG-UI session
    const session = aguiWAIIntegrationService.createSession(
      data.startupId,
      undefined,
      'demo-approval',
      req.user?.id
    );
    
    // Return sessionId immediately
    res.json({
      success: true,
      sessionId: session.id,
      message: 'Demo agent execution with approval started - connect to SSE stream and respond to interrupt',
      streamUrl: `/api/agui/stream/${session.id}`,
      approvalRequired: true
    });
    
    // Execute demo agent with approval workflow asynchronously
    setImmediate(async () => {
      try {
        await executeDemoAgentWithApproval(session.id, {
          agentId: data.agentId,
          task: data.task,
          context: data.context,
          complexity: data.complexity || 'moderate'
        });
      } catch (error) {
        console.error('Demo agent with approval execution error:', error);
      }
    });
    
  } catch (error) {
    console.error('Demo agent with approval execution error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/demo-agui/examples
 * Get example demo tasks for testing
 */
router.get('/examples', authenticateToken, (req: AuthRequest, res: Response) => {
  const examples = {
    singleAgent: {
      agentId: 'engineering-forge-architect',
      task: 'Design a RESTful API for a social media platform with user authentication, posts, and comments',
      context: {
        tech_stack: ['Node.js', 'PostgreSQL', 'Express'],
        requirements: ['JWT authentication', 'Rate limiting', 'Input validation']
      },
      complexity: 'moderate' as const
    },
    complexAgent: {
      agentId: 'market-intelligence-analyst',
      task: 'Analyze competitor landscape for a fintech startup in the payments space',
      context: {
        industry: 'fintech',
        vertical: 'payments',
        competitors: ['Stripe', 'Square', 'PayPal']
      },
      complexity: 'complex' as const
    },
    multiAgent: {
      tasks: [
        {
          agentId: 'ideation-lab-creative',
          task: 'Generate 3 innovative startup ideas in the healthcare AI space',
          complexity: 'simple' as const
        },
        {
          agentId: 'product-blueprint-designer',
          task: 'Create a product requirements document for a telemedicine app',
          complexity: 'moderate' as const
        },
        {
          agentId: 'growth-engine-marketer',
          task: 'Design a go-to-market strategy for a SaaS product targeting SMBs',
          complexity: 'moderate' as const
        }
      ]
    },
    withApproval: {
      agentId: 'deployment-specialist',
      task: 'Deploy application to production with zero-downtime migration',
      context: {
        environment: 'production',
        critical: true,
        requiresApproval: true
      },
      complexity: 'complex' as const
    }
  };
  
  res.json({
    success: true,
    examples,
    message: 'Use these examples to test AG-UI streaming'
  });
});

export default router;
