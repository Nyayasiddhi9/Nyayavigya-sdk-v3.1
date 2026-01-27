/**
 * WizFlow Code Studio API Routes
 * 
 * Zenflow-style AI Code Orchestration endpoints for WAI SDK v3.1
 * 
 * Endpoints:
 * - Project Management: CRUD operations for projects
 * - Specifications: Create and verify technical specs
 * - Code Generation: AI-powered code generation with multi-model verification
 * - Testing: Automated test generation and execution
 * - Deployment: One-click cloud deployment
 * 
 * @version 1.0.0
 * @date January 25, 2026
 */

import { Router, Request, Response } from 'express';
import { 
  wizFlowCodeStudio,
  type ProjectType,
  type TechStack,
  type DeploymentConfig
} from '../services/wizflow-code-studio';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  try {
    const stats = wizFlowCodeStudio.getStats();
    res.json({
      success: true,
      service: 'WizFlow Code Studio',
      version: '1.0.0',
      status: 'healthy',
      stats,
      features: [
        'Spec-Driven Development (SDD)',
        'Multi-Agent Verification',
        'Parallel Execution',
        'Cross-Model Code Review',
        'Automated Testing',
        'One-Click Cloud Deployment'
      ],
      models: ['claude-opus-4.5', 'gpt-5.2-pro', 'gemini-3-pro', 'grok-4', 'deepseek-r2']
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/projects', (_req: Request, res: Response) => {
  try {
    const projects = wizFlowCodeStudio.getAllProjects();
    res.json({
      success: true,
      count: projects.length,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        specs: p.specifications.length,
        artifacts: p.codebase.length,
        coverage: p.testSuite.coverage.overall,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/projects', async (req: Request, res: Response) => {
  try {
    const { name, description, type, techStack, owner } = req.body;

    if (!name || !description || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description, type'
      });
    }

    const project = await wizFlowCodeStudio.createProject({
      name,
      description,
      type: type as ProjectType,
      techStack: techStack || getDefaultTechStack(type),
      owner: owner || 'anonymous'
    });

    res.status(201).json({
      success: true,
      project,
      message: `Project "${name}" created successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/projects/:projectId', (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = wizFlowCodeStudio.getProject(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/projects/:projectId/specs', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { title, type, priority, description, acceptanceCriteria } = req.body;

    if (!title || !type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, type, description'
      });
    }

    const spec = await wizFlowCodeStudio.createSpecification(projectId, {
      title,
      type,
      priority: priority || 'medium',
      description,
      acceptanceCriteria: acceptanceCriteria || []
    });

    res.status(201).json({
      success: true,
      specification: spec,
      message: `Specification "${title}" created. Ready for verification.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/projects/:projectId/specs/:specId/verify', async (req: Request, res: Response) => {
  try {
    const { projectId, specId } = req.params;
    const { config } = req.body;

    const results = await wizFlowCodeStudio.verifySpecification(projectId, specId, config);

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const allApproved = results.every(r => r.approved);

    res.json({
      success: true,
      verificationResults: results,
      summary: {
        totalModels: results.length,
        averageScore: avgScore,
        approved: allApproved,
        modelsUsed: results.map(r => r.verifierModel)
      },
      message: allApproved 
        ? 'Specification approved by all models. Ready for code generation.'
        : `Specification needs revision. Average score: ${(avgScore * 100).toFixed(1)}%`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/projects/:projectId/specs/:specId/generate', async (req: Request, res: Response) => {
  try {
    const { projectId, specId } = req.params;
    const { config } = req.body;

    const artifacts = await wizFlowCodeStudio.generateCode(projectId, specId, config);

    res.json({
      success: true,
      artifacts: artifacts.map(a => ({
        id: a.id,
        path: a.path,
        language: a.language,
        type: a.type,
        generatedBy: a.generatedBy,
        verifiedBy: a.verifiedBy,
        lines: a.content.split('\n').length
      })),
      summary: {
        totalFiles: artifacts.length,
        sourceFiles: artifacts.filter(a => a.type === 'source').length,
        testFiles: artifacts.filter(a => a.type === 'test').length,
        modelsUsed: Array.from(new Set(artifacts.flatMap(a => [a.generatedBy, ...a.verifiedBy])))
      },
      message: `Generated ${artifacts.length} code artifacts with cross-model verification`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/projects/:projectId/artifacts/:artifactId', (req: Request, res: Response) => {
  try {
    const { projectId, artifactId } = req.params;
    const project = wizFlowCodeStudio.getProject(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const artifact = project.codebase.find(a => a.id === artifactId);
    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: 'Artifact not found'
      });
    }

    res.json({
      success: true,
      artifact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/projects/:projectId/test', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const result = await wizFlowCodeStudio.runTests(projectId);

    res.json({
      success: true,
      testResult: result,
      message: `Tests complete: ${result.passed}/${result.total} passed (${result.coverage.overall.toFixed(1)}% coverage)`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/projects/:projectId/deploy', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const config: DeploymentConfig = {
      provider: req.body.provider || 'vercel',
      environment: req.body.environment || 'production',
      region: req.body.region,
      scaling: req.body.scaling,
      secrets: req.body.secrets || [],
      healthCheck: req.body.healthCheck,
      domains: req.body.domains
    };

    const result = await wizFlowCodeStudio.deployProject(projectId, config);

    res.json({
      success: true,
      deployment: result,
      message: result.success 
        ? `Successfully deployed to ${result.url}`
        : 'Deployment failed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = wizFlowCodeStudio.getStats();
    res.json({
      success: true,
      stats,
      capabilities: {
        projectTypes: ['web-app', 'mobile-app', 'api-service', 'microservices', 'cli-tool', 'library', 'full-stack', 'data-pipeline', 'ml-model', 'enterprise-saas'],
        cloudProviders: ['aws', 'gcp', 'azure', 'vercel', 'netlify', 'railway', 'fly-io'],
        aiModels: ['claude-opus-4.5', 'gpt-5.2-pro', 'gemini-3-pro', 'grok-4', 'deepseek-r2'],
        workflowStages: ['ideation', 'specification', 'development', 'testing', 'review', 'deployment', 'production', 'maintenance']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/workflow/sdd', async (req: Request, res: Response) => {
  try {
    const { projectName, description, type, requirements } = req.body;

    if (!projectName || !description || !requirements) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectName, description, requirements'
      });
    }

    const project = await wizFlowCodeStudio.createProject({
      name: projectName,
      description,
      type: type || 'full-stack',
      techStack: getDefaultTechStack(type || 'full-stack'),
      owner: 'sdd-workflow'
    });

    const specs = [];
    for (const req of requirements) {
      const spec = await wizFlowCodeStudio.createSpecification(project.id, {
        title: req.title || req,
        type: 'feature',
        priority: 'high',
        description: typeof req === 'string' ? req : req.description,
        acceptanceCriteria: typeof req === 'object' && req.criteria ? req.criteria : []
      });
      specs.push(spec);
    }

    for (const spec of specs) {
      await wizFlowCodeStudio.verifySpecification(project.id, spec.id);
    }

    const allArtifacts = [];
    const updatedProject = wizFlowCodeStudio.getProject(project.id);
    for (const spec of updatedProject?.specifications || []) {
      if (spec.status === 'approved') {
        const artifacts = await wizFlowCodeStudio.generateCode(project.id, spec.id);
        allArtifacts.push(...artifacts);
      }
    }

    const testResult = await wizFlowCodeStudio.runTests(project.id);

    const finalProject = wizFlowCodeStudio.getProject(project.id);

    res.json({
      success: true,
      workflow: 'Spec-Driven Development',
      project: {
        id: finalProject?.id,
        name: finalProject?.name,
        status: finalProject?.status
      },
      results: {
        specifications: specs.length,
        artifacts: allArtifacts.length,
        tests: testResult
      },
      nextStep: 'Deploy to production using POST /api/wizflow/projects/{id}/deploy',
      message: `SDD workflow complete: ${specs.length} specs, ${allArtifacts.length} artifacts, ${testResult.passed}/${testResult.total} tests passed`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

function getDefaultTechStack(projectType: string): TechStack {
  const stacks: Record<string, TechStack> = {
    'web-app': {
      frontend: {
        framework: 'React',
        language: 'TypeScript',
        stateManagement: 'TanStack Query',
        styling: 'Tailwind CSS',
        bundler: 'Vite'
      },
      backend: {
        framework: 'Express',
        language: 'TypeScript',
        orm: 'Drizzle',
        authentication: 'JWT'
      },
      database: {
        type: 'PostgreSQL',
        provider: 'Neon'
      },
      testing: {
        unit: 'Vitest',
        integration: 'Vitest',
        e2e: 'Playwright'
      }
    },
    'full-stack': {
      frontend: {
        framework: 'React',
        language: 'TypeScript',
        stateManagement: 'TanStack Query',
        styling: 'Tailwind CSS',
        bundler: 'Vite'
      },
      backend: {
        framework: 'Express',
        language: 'TypeScript',
        orm: 'Drizzle',
        authentication: 'JWT'
      },
      database: {
        type: 'PostgreSQL',
        provider: 'Neon'
      },
      infrastructure: {
        cloud: 'Vercel',
        ci_cd: 'GitHub Actions'
      },
      testing: {
        unit: 'Vitest',
        integration: 'Vitest',
        e2e: 'Playwright'
      }
    },
    'api-service': {
      backend: {
        framework: 'Express',
        language: 'TypeScript',
        orm: 'Drizzle',
        authentication: 'JWT'
      },
      database: {
        type: 'PostgreSQL',
        provider: 'Neon'
      },
      testing: {
        unit: 'Vitest',
        integration: 'Supertest'
      }
    },
    'mobile-app': {
      frontend: {
        framework: 'React Native',
        language: 'TypeScript',
        stateManagement: 'Zustand'
      },
      backend: {
        framework: 'Express',
        language: 'TypeScript',
        orm: 'Drizzle'
      },
      database: {
        type: 'PostgreSQL'
      }
    }
  };

  return stacks[projectType] || stacks['full-stack'];
}

export default router;
