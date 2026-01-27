/**
 * Persistent Agents API Routes
 * RESTful endpoints for managing persistent agent sessions and communication
 */

import { Router } from 'express';
import { persistentAgentManager, type PersistentAgentConfig } from '../services/persistent-agent-manager';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['orchestrator', 'project-manager', 'engineer', 'specialist']),
  hierarchy: z.object({
    level: z.enum(['executive', 'senior', 'specialist', 'junior']),
    reportsTo: z.string().optional(),
    manages: z.array(z.string()).optional()
  }),
  capabilities: z.array(z.string()),
  persistence: z.object({
    sessionTimeout: z.number().min(1),
    maxIdleTime: z.number().min(1),
    autoSchedule: z.boolean(),
    checkInInterval: z.number().min(1)
  }),
  context: z.object({
    projectId: z.number().optional(),
    currentTask: z.string().optional(),
    longTermMemory: z.any().optional(),
    workingDirectory: z.string().optional()
  }).optional()
});

const sendMessageSchema = z.object({
  toAgentId: z.string(),
  message: z.string().min(1),
  type: z.enum(['task-assignment', 'status-update', 'coordination', 'report']).optional()
});

const scheduleTaskSchema = z.object({
  intervalMinutes: z.number().min(1),
  note: z.string().min(1),
  recurring: z.boolean().optional()
});

/**
 * Create a new persistent agent
 */
router.post('/agents', async (req, res) => {
  try {
    const agentData = createAgentSchema.parse(req.body);
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const config: PersistentAgentConfig = {
      id: agentId,
      ...agentData
    };

    const sessionId = await persistentAgentManager.createPersistentAgent(config);

    res.status(201).json({
      success: true,
      data: {
        agentId,
        sessionId,
        message: 'Persistent agent created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating persistent agent:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create persistent agent'
    });
  }
});

/**
 * Get system status and all agents
 */
router.get('/status', async (req, res) => {
  try {
    const status = persistentAgentManager.getSystemStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    });
  }
});

/**
 * Send message to agent (inter-agent communication)
 */
router.post('/agents/:agentId/message', async (req, res) => {
  try {
    const { agentId } = req.params;
    const messageData = sendMessageSchema.parse(req.body);
    
    await persistentAgentManager.sendMessageToAgent(
      'api-client', // Sender ID for API requests
      agentId,
      messageData.message,
      messageData.type || 'coordination'
    );

    res.json({
      success: true,
      message: 'Message sent to agent successfully'
    });
  } catch (error) {
    console.error('Error sending message to agent:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to send message to agent'
    });
  }
});

/**
 * Get pending messages for an agent
 */
router.get('/agents/:agentId/messages', async (req, res) => {
  try {
    const { agentId } = req.params;
    const messages = persistentAgentManager.getPendingMessages(agentId);
    
    res.json({
      success: true,
      data: {
        agentId,
        messageCount: messages.length,
        messages
      }
    });
  } catch (error) {
    console.error('Error getting agent messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent messages'
    });
  }
});

/**
 * Clear agent's message queue
 */
router.delete('/agents/:agentId/messages', async (req, res) => {
  try {
    const { agentId } = req.params;
    persistentAgentManager.clearAgentMessages(agentId);
    
    res.json({
      success: true,
      message: 'Agent messages cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing agent messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear agent messages'
    });
  }
});

/**
 * Schedule a check-in for an agent
 */
router.post('/agents/:agentId/schedule', async (req, res) => {
  try {
    const { agentId } = req.params;
    const scheduleData = scheduleTaskSchema.parse(req.body);
    
    const taskId = await persistentAgentManager.scheduleAgentCheckIn(
      agentId,
      scheduleData.intervalMinutes,
      scheduleData.note,
      scheduleData.recurring || false
    );

    res.json({
      success: true,
      data: {
        taskId,
        agentId,
        scheduledFor: new Date(Date.now() + scheduleData.intervalMinutes * 60 * 1000),
        message: 'Agent check-in scheduled successfully'
      }
    });
  } catch (error) {
    console.error('Error scheduling agent check-in:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to schedule agent check-in'
    });
  }
});

/**
 * Create project manager and engineer hierarchy (Tmux-Orchestrator style)
 */
router.post('/projects/:projectId/hierarchy', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { projectName, requirements } = req.body;

    // Create Project Manager
    const pmConfig: PersistentAgentConfig = {
      id: `pm_project_${projectId}`,
      name: `${projectName} Project Manager`,
      role: 'project-manager',
      hierarchy: {
        level: 'senior',
        reportsTo: 'wai-orchestrator',
        manages: [`engineer_project_${projectId}`]
      },
      capabilities: [
        'project-coordination',
        'task-assignment',
        'progress-tracking',
        'quality-assurance',
        'team-communication'
      ],
      persistence: {
        sessionTimeout: 240, // 4 hours
        maxIdleTime: 30, // 30 minutes
        autoSchedule: true,
        checkInInterval: 30 // 30 minutes
      },
      context: {
        projectId: parseInt(projectId),
        longTermMemory: {
          projectRequirements: requirements,
          assignedEngineers: [],
          completedTasks: [],
          currentPhase: 'planning'
        }
      }
    };

    // Create Engineer
    const engineerConfig: PersistentAgentConfig = {
      id: `engineer_project_${projectId}`,
      name: `${projectName} Engineer`,
      role: 'engineer',
      hierarchy: {
        level: 'specialist',
        reportsTo: `pm_project_${projectId}`
      },
      capabilities: [
        'code-development',
        'testing-implementation',
        'documentation',
        'debugging',
        'optimization'
      ],
      persistence: {
        sessionTimeout: 180, // 3 hours
        maxIdleTime: 20, // 20 minutes
        autoSchedule: true,
        checkInInterval: 20 // 20 minutes
      },
      context: {
        projectId: parseInt(projectId),
        longTermMemory: {
          assignedTasks: [],
          completedFeatures: [],
          currentWorkingDirectory: `/projects/${projectId}`
        }
      }
    };

    // Create both agents
    const pmSessionId = await persistentAgentManager.createPersistentAgent(pmConfig);
    const engineerSessionId = await persistentAgentManager.createPersistentAgent(engineerConfig);

    // Send initial briefing to Project Manager
    await persistentAgentManager.sendMessageToAgent(
      'wai-orchestrator',
      pmConfig.id,
      `You are the Project Manager for "${projectName}". Your engineer is ${engineerConfig.id}. Project requirements: ${requirements}. Begin by analyzing requirements and creating an initial task breakdown.`,
      'task-assignment'
    );

    res.status(201).json({
      success: true,
      data: {
        projectManager: {
          agentId: pmConfig.id,
          sessionId: pmSessionId
        },
        engineer: {
          agentId: engineerConfig.id,
          sessionId: engineerSessionId
        },
        message: 'Project hierarchy created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating project hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project hierarchy'
    });
  }
});

/**
 * WebSocket endpoints for real-time agent monitoring
 */
router.get('/ws-info', (req, res) => {
  res.json({
    success: true,
    data: {
      websocketEndpoint: '/ws/persistent-agents',
      events: [
        'agent_created',
        'message_sent',
        'scheduled_task_executed',
        'session_idle'
      ]
    }
  });
});

export default router;