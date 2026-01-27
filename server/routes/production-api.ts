/**
 * Production API Routes
 * Complete CRUD operations with security, validation, and error handling
 */
import { Router } from 'express';
import { storage } from '../storage/database-storage';
import { deploymentService } from '../services/deployment-service';
import { githubService } from '../services/real-github-integration';
import { 
  requireAuth, 
  requireRole, 
  requirePermission,
  rateLimitMiddleware,
  strictRateLimitMiddleware,
  validateInput,
  auditLog
} from '../middleware/security';
import { z } from 'zod';

const router = Router();

// Apply security middleware to all routes
router.use(rateLimitMiddleware);
router.use(auditLog);

// ===== PROJECT MANAGEMENT ROUTES =====

// Create project schema
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  enhancedPrompt: z.string().min(10),
  techStack: z.array(z.string()).optional(),
  architecture: z.enum(['monolith', 'microservices', 'serverless']).optional(),
  targetPlatform: z.enum(['web', 'mobile', 'desktop']).optional(),
  isPublic: z.boolean().optional()
});

// Get user projects
router.get('/projects', requireAuth, async (req: any, res) => {
  try {
    const { status, limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const projects = await storage.getUserProjects(req.user.id, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    });

    const stats = await storage.getProjectStats(req.user.id);

    res.json({
      projects,
      stats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: stats.total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get specific project
router.get('/projects/:id', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has access to this project
    if (project.userId !== req.user.id && !project.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get project files and deployments
    const files = await storage.getProjectFiles(projectId);
    const deployments = await storage.getProjectDeployments(projectId);
    const agentExecutions = await storage.getProjectAgentExecutions(projectId);

    res.json({
      project,
      files,
      deployments,
      agentExecutions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/projects', 
  requireAuth, 
  requirePermission('project.create'),
  validateInput(createProjectSchema),
  async (req: any, res) => {
    try {
      const projectData = {
        ...req.body,
        userId: req.user.id,
        status: 'planning',
        progress: 0,
        phase: 'initialization'
      };

      const project = await storage.createProject(projectData);

      res.status(201).json(project);
    } catch (error) {
      console.error('Project creation error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// Update project
router.patch('/projects/:id', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedProject = await storage.updateProject(projectId, req.body);
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/projects/:id', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await storage.deleteProject(projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ===== PROJECT FILES ROUTES =====

// Upload project file
router.post('/projects/:id/files', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project || project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const file = await storage.addProjectFile(projectId, req.body);
    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get project files
router.get('/projects/:id/files', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== req.user.id && !project.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const files = await storage.getProjectFiles(projectId);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Update project file
router.patch('/projects/:projectId/files/:fileId', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const fileId = parseInt(req.params.fileId);
    
    const project = await storage.getProject(projectId);
    if (!project || project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedFile = await storage.updateProjectFile(fileId, req.body);
    res.json(updatedFile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Delete project file
router.delete('/projects/:projectId/files/:fileId', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const fileId = parseInt(req.params.fileId);
    
    const project = await storage.getProject(projectId);
    if (!project || project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await storage.deleteProjectFile(fileId);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ===== DEPLOYMENT ROUTES =====

// Deploy project
router.post('/projects/:id/deploy', 
  requireAuth, 
  strictRateLimitMiddleware,
  async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { platform, environment, region, customDomain, environmentVariables } = req.body;

      const deployment = await deploymentService.deployProject(projectId, req.user.id, {
        platform,
        environment,
        region,
        customDomain,
        environmentVariables
      });

      res.status(201).json(deployment);
    } catch (error) {
      console.error('Deployment error:', error);
      res.status(500).json({ error: 'Deployment failed' });
    }
  }
);

// Get project deployments
router.get('/projects/:id/deployments', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== req.user.id && !project.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deployments = await storage.getProjectDeployments(projectId);
    res.json(deployments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
});

// Create testing environment
router.post('/projects/:id/testing-environment', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project || project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { type } = req.body;
    const testingEnv = await deploymentService.createTestingEnvironment(projectId, type);

    res.status(201).json(testingEnv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create testing environment' });
  }
});

// Rollback deployment
router.post('/deployments/:id/rollback', 
  requireAuth, 
  strictRateLimitMiddleware,
  async (req: any, res) => {
    try {
      const deploymentId = parseInt(req.params.id);
      await deploymentService.rollbackDeployment(deploymentId);
      
      res.json({ message: 'Rollback initiated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Rollback failed' });
    }
  }
);

// ===== GITHUB INTEGRATION ROUTES =====

// Create GitHub repository
router.post('/projects/:id/github/repository', 
  requireAuth, 
  strictRateLimitMiddleware,
  async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { repoName, isPrivate = true } = req.body;
      const repo = await githubService.createRepository(req.user.id, projectId, repoName, isPrivate);

      res.status(201).json(repo);
    } catch (error) {
      console.error('GitHub repository creation error:', error);
      res.status(500).json({ error: error.message || 'Failed to create repository' });
    }
  }
);

// Sync project to GitHub
router.post('/projects/:id/github/sync', 
  requireAuth, 
  strictRateLimitMiddleware,
  async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await githubService.syncProjectToGitHub(projectId, req.user.id);
      res.json({ message: 'Project synced to GitHub successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message || 'Sync failed' });
    }
  }
);

// Clone repository to project
router.post('/projects/:id/github/clone', 
  requireAuth, 
  strictRateLimitMiddleware,
  async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { repoUrl } = req.body;
      await githubService.cloneRepositoryToProject(req.user.id, projectId, repoUrl);
      
      res.json({ message: 'Repository cloned successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message || 'Clone failed' });
    }
  }
);

// Create branch
router.post('/projects/:id/github/branches', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project || project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { branchName } = req.body;
    const branch = await githubService.createBranch(req.user.id, projectId, branchName);

    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create branch' });
  }
});

// Create pull request
router.post('/projects/:id/github/pull-requests', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project || project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, body, head, base = 'main' } = req.body;
    const pullRequest = await githubService.createPullRequest(
      req.user.id, 
      projectId, 
      title, 
      body, 
      head, 
      base
    );

    res.status(201).json(pullRequest);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create pull request' });
  }
});

// ===== DATABASE CONNECTION ROUTES =====

// Create database connection
router.post('/database-connections', requireAuth, async (req: any, res) => {
  try {
    const connectionData = {
      ...req.body,
      userId: req.user.id
    };

    const connection = await storage.createDatabaseConnection(connectionData);
    res.status(201).json(connection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create database connection' });
  }
});

// Get user database connections
router.get('/database-connections', requireAuth, async (req: any, res) => {
  try {
    const connections = await storage.getUserDatabaseConnections(req.user.id);
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch database connections' });
  }
});

// Test database connection
router.post('/database-connections/:id/test', requireAuth, async (req: any, res) => {
  try {
    const connectionId = parseInt(req.params.id);
    const isConnected = await storage.testDatabaseConnection(connectionId);
    
    res.json({ connected: isConnected });
  } catch (error) {
    res.status(500).json({ error: 'Connection test failed' });
  }
});

// ===== ANALYTICS ROUTES =====

// Get user analytics
router.get('/analytics/user', requireAuth, async (req: any, res) => {
  try {
    const analytics = await storage.getUserAnalytics(req.user.id);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get project analytics
router.get('/analytics/projects/:id', requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project || project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const agentExecutions = await storage.getProjectAgentExecutions(projectId);
    const deployments = await storage.getProjectDeployments(projectId);

    const analytics = {
      project,
      executionsCount: agentExecutions.length,
      deploymentsCount: deployments.length,
      totalCost: agentExecutions.reduce((sum, exec) => sum + (exec.cost || 0), 0),
      lastActivity: agentExecutions[0]?.createdAt || project.updatedAt
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project analytics' });
  }
});

// ===== WEBHOOKS =====

// GitHub webhook handler
router.post('/webhooks/github', async (req, res) => {
  try {
    const event = req.headers['x-github-event'] as string;
    const payload = req.body;

    await githubService.handleWebhookEvent(event, payload);
    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;