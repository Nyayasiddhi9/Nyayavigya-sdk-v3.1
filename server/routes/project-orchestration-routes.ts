/**
 * Project Orchestration API Routes
 * RESTful endpoints for orchestration runs, metrics, and cost tracking
 */

import { Router } from 'express';
import { projectOrchestrationService } from '../services/project-orchestration-database-service';

// Create separate routers for different mount points
const orchestrationRouter = Router();
const projectRouter = Router();

// ============================================================================
// Orchestration Requests (Run Headers)
// ============================================================================

/**
 * List orchestration requests with filtering
 * GET /api/project-orchestration/requests
 */
orchestrationRouter.get('/requests', async (req, res) => {
  try {
    const {
      userId,
      projectId,
      status,
      requestType,
      limit = '50',
      offset = '0'
    } = req.query;

    const requests = await projectOrchestrationService.listOrchestrationRequests({
      userId: userId ? parseInt(userId as string) : undefined,
      projectId: projectId as string,
      status: status as string,
      requestType: requestType as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: requests,
      total: requests.length,
      filters: { userId, projectId, status, requestType }
    });
  } catch (error) {
    console.error('Error listing orchestration requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list orchestration requests'
    });
  }
});

/**
 * Create new orchestration request
 * POST /api/project-orchestration/requests
 */
orchestrationRouter.post('/requests', async (req, res) => {
  try {
    const {
      id,
      userId,
      projectId,
      sessionId,
      requestType,
      task,
      priority,
      orchestrationMode,
      agentEnforcement,
      selectedAgents,
      selectedProviders
    } = req.body;

    if (!id || !sessionId || !requestType || !task) {
      return res.status(400).json({
        success: false,
        error: 'id, sessionId, requestType, and task are required'
      });
    }

    const request = await projectOrchestrationService.createOrchestrationRequest({
      id,
      userId,
      projectId,
      sessionId,
      requestType,
      task,
      priority,
      orchestrationMode,
      agentEnforcement,
      selectedAgents,
      selectedProviders
    });

    res.json({
      success: true,
      data: request,
      message: 'Orchestration request created successfully'
    });
  } catch (error) {
    console.error('Error creating orchestration request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create orchestration request'
    });
  }
});

/**
 * Get orchestration request details
 * GET /api/project-orchestration/requests/:id
 */
orchestrationRouter.get('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const request = await projectOrchestrationService.getOrchestrationRequest(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Orchestration request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching orchestration request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orchestration request'
    });
  }
});

/**
 * Update orchestration request
 * PUT /api/project-orchestration/requests/:id
 */
orchestrationRouter.put('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await projectOrchestrationService.getOrchestrationRequest(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Orchestration request not found'
      });
    }

    const updated = await projectOrchestrationService.updateOrchestrationRequest(id, updates);

    res.json({
      success: true,
      data: updated,
      message: 'Orchestration request updated successfully'
    });
  } catch (error) {
    console.error('Error updating orchestration request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update orchestration request'
    });
  }
});

/**
 * Delete orchestration request
 * DELETE /api/project-orchestration/requests/:id
 */
orchestrationRouter.delete('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await projectOrchestrationService.getOrchestrationRequest(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Orchestration request not found'
      });
    }

    await projectOrchestrationService.deleteOrchestrationRequest(id);

    res.json({
      success: true,
      message: 'Orchestration request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting orchestration request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete orchestration request'
    });
  }
});

// ============================================================================
// Performance Metrics
// ============================================================================

/**
 * Record performance metric
 * POST /api/project-orchestration/requests/:id/metrics
 */
orchestrationRouter.post('/requests/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const { metricType, component, value, unit, metadata, userId } = req.body;

    if (!metricType || !component || !value || !unit) {
      return res.status(400).json({
        success: false,
        error: 'metricType, component, value, and unit are required'
      });
    }

    const metric = await projectOrchestrationService.recordMetric({
      metricType,
      component,
      value,
      unit,
      metadata,
      userId,
      requestId: id
    });

    res.json({
      success: true,
      data: metric,
      message: 'Metric recorded successfully'
    });
  } catch (error) {
    console.error('Error recording metric:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record metric'
    });
  }
});

/**
 * Get metrics summary
 * GET /api/project-orchestration/metrics/summary
 */
orchestrationRouter.get('/metrics/summary', async (req, res) => {
  try {
    const { component, metricType, userId, requestId, limit } = req.query;

    const aggregates = await projectOrchestrationService.getMetricAggregates({
      component: component as string,
      metricType: metricType as string,
      userId: userId ? parseInt(userId as string) : undefined
    });

    const recentMetrics = await projectOrchestrationService.getMetrics({
      component: component as string,
      metricType: metricType as string,
      userId: userId ? parseInt(userId as string) : undefined,
      requestId: requestId as string,
      limit: limit ? parseInt(limit as string) : 100
    });

    res.json({
      success: true,
      data: {
        aggregates,
        recentMetrics,
        total: recentMetrics.length
      }
    });
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics summary'
    });
  }
});

// ============================================================================
// Workflow Executions
// ============================================================================

/**
 * Create workflow execution
 * POST /api/project-orchestration/workflows
 */
orchestrationRouter.post('/workflows', async (req, res) => {
  try {
    const {
      executionId,
      patternId,
      userId,
      organizationId,
      sessionId,
      inputData,
      config,
      customParameters
    } = req.body;

    if (!executionId || !patternId || !inputData) {
      return res.status(400).json({
        success: false,
        error: 'executionId, patternId, and inputData are required'
      });
    }

    const execution = await projectOrchestrationService.createWorkflowExecution({
      executionId,
      patternId,
      userId,
      organizationId,
      sessionId,
      inputData,
      config,
      customParameters
    });

    res.json({
      success: true,
      data: execution,
      message: 'Workflow execution created successfully'
    });
  } catch (error) {
    console.error('Error creating workflow execution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow execution'
    });
  }
});

/**
 * Get workflow execution details
 * GET /api/project-orchestration/workflows/:executionId
 */
orchestrationRouter.get('/workflows/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = await projectOrchestrationService.getWorkflowExecution(executionId);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Workflow execution not found'
      });
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error('Error fetching workflow execution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow execution'
    });
  }
});

/**
 * Update workflow execution
 * PUT /api/project-orchestration/workflows/:executionId
 */
orchestrationRouter.put('/workflows/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const updates = req.body;

    const existing = await projectOrchestrationService.getWorkflowExecution(executionId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Workflow execution not found'
      });
    }

    const updated = await projectOrchestrationService.updateWorkflowExecution(executionId, updates);

    res.json({
      success: true,
      data: updated,
      message: 'Workflow execution updated successfully'
    });
  } catch (error) {
    console.error('Error updating workflow execution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow execution'
    });
  }
});

/**
 * List workflow executions
 * GET /api/project-orchestration/workflows
 */
orchestrationRouter.get('/workflows', async (req, res) => {
  try {
    const {
      userId,
      patternId,
      status,
      sessionId,
      limit = '50',
      offset = '0'
    } = req.query;

    const executions = await projectOrchestrationService.listWorkflowExecutions({
      userId: userId ? parseInt(userId as string) : undefined,
      patternId: patternId as string,
      status: status as string,
      sessionId: sessionId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: executions,
      total: executions.length
    });
  } catch (error) {
    console.error('Error listing workflow executions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list workflow executions'
    });
  }
});

// ============================================================================
// Project Costs
// ============================================================================

/**
 * Get project info and orchestration costs
 * GET /api/projects/:id/costs
 */
projectRouter.get('/:id/costs', async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);

    const projectInfo = await projectOrchestrationService.getProjectInfo(projectId);

    if (!projectInfo) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get orchestration costs summary (costs are tracked in orchestration requests)
    const orchestrationCosts = await projectOrchestrationService.getProjectOrchestrationCosts(id);

    res.json({
      success: true,
      data: {
        ...projectInfo,
        orchestrationCosts: orchestrationCosts
      }
    });
  } catch (error) {
    console.error('Error fetching project costs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project costs'
    });
  }
});

/**
 * Update project progress
 * PUT /api/projects/:id/progress
 */
projectRouter.put('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);
    const { progress, actualHours, status } = req.body;

    const updated = await projectOrchestrationService.updateProjectProgress(projectId, {
      progress,
      actualHours,
      status
    });

    res.json({
      success: true,
      data: updated,
      message: 'Project progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating project progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project progress'
    });
  }
});

// Export individual routers
export { orchestrationRouter, projectRouter };

// Default export: combined router that includes both orchestration and project routes
const combinedRouter = Router();
combinedRouter.use('/project-orchestration', orchestrationRouter);
combinedRouter.use('/projects', projectRouter);

export default combinedRouter;
