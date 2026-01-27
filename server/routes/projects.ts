/**
 * Project Routes
 * Real API endpoints for project management
 */

import { Router } from 'express';
import { projectService } from '../services/project-service';

const router = Router();

// Generate project plan
router.post('/api/projects/generate-plan', async (req, res) => {
  try {
    const { requirements } = req.body;
    const plan = await projectService.generateProjectPlan(requirements);
    res.json(plan);
  } catch (error) {
    console.error('Error generating project plan:', error);
    res.status(500).json({ error: 'Failed to generate project plan' });
  }
});

// Save project plan
router.post('/api/projects/save-plan', async (req, res) => {
  try {
    const { plan, userId } = req.body;
    const result = await projectService.saveProjectPlan(plan, userId || '1');
    res.json(result);
  } catch (error) {
    console.error('Error saving project plan:', error);
    res.status(500).json({ error: 'Failed to save project plan' });
  }
});

// Get all projects
router.get('/api/projects', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const projects = await projectService.getAllProjects(userId);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Approve project
router.post('/api/projects/:id/approve', async (req, res) => {
  try {
    const project = await projectService.approveProject(req.params.id);
    res.json(project);
  } catch (error) {
    console.error('Error approving project:', error);
    res.status(500).json({ error: 'Failed to approve project' });
  }
});

// Reject project
router.post('/api/projects/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const project = await projectService.rejectProject(req.params.id, reason);
    res.json(project);
  } catch (error) {
    console.error('Error rejecting project:', error);
    res.status(500).json({ error: 'Failed to reject project' });
  }
});

// Update project status
router.put('/api/projects/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const project = await projectService.updateProjectStatus(req.params.id, status);
    res.json(project);
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

// Get project cost breakdown
router.get('/api/projects/:id/cost-breakdown', async (req, res) => {
  try {
    const breakdown = await projectService.getProjectCostBreakdown(req.params.id);
    res.json(breakdown);
  } catch (error) {
    console.error('Error fetching cost breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch cost breakdown' });
  }
});

// Initialize project
router.post('/api/projects/:id/initialize', async (req, res) => {
  try {
    const result = await projectService.initializeProject(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error initializing project:', error);
    res.status(500).json({ error: 'Failed to initialize project' });
  }
});

export default router;