import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { waiComprehensiveOrchestrationBackbone as waiOrchestrator } from '../services/wai-comprehensive-orchestration-backbone-v7';
import { insertProjectSchema } from '@shared/schema';
import { authenticateToken } from '../auth';

const router = Router();

// ============================================================================
// SOFTWARE DEVELOPMENT PROJECT MANAGEMENT
// ============================================================================

// Get all software development projects
router.get('/projects', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const projects = await storage.getProjectsByUser(user.id);
    
    // Filter for software development projects
    const softwareProjects = projects.filter(p => {
      const tags = Array.isArray(p.tags) ? p.tags : [];
      return tags.includes('software-development') || 
             p.templateId === 1; // software-development template ID
    });
    
    res.json({ 
      success: true, 
      data: softwareProjects,
      count: softwareProjects.length
    });
  } catch (error) {
    console.error('Error fetching software projects:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch projects' 
    });
  }
});

// Create new software development project
router.post('/projects', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validatedData = insertProjectSchema.parse({
      ...req.body,
      tags: [...(req.body.tags || []), 'software-development']
    });
    
    // Initialize WAI orchestration for software development
    const agents = await waiOrchestrator.initializeProjectAgents(0, {
      projectType: req.body.projectType || 'fullstack',
      complexity: req.body.complexity || 'moderate',
      llmProviders: ['kimi-k2', 'openai', 'claude']
    });
    
    const projectData = {
      ...validatedData,
      status: 'planning' as const,
      createdBy: user.id
    };
    
    const project = await storage.createProject(projectData);
    
    res.json({ 
      success: true, 
      data: project,
      agents: agents.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error',
        details: error.errors 
      });
    }
    console.error('Error creating software project:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create project' 
    });
  }
});

// Generate project from Figma design
router.post('/projects/figma-analysis', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { figmaUrl, projectName, projectDescription } = req.body;
    
    if (!figmaUrl) {
      return res.status(400).json({
        success: false,
        error: 'Figma URL is required'
      });
    }
    
    // Use WAI orchestration for Figma analysis
    const analysis = await waiOrchestrator.orchestrateTask({
      type: 'design',
      task: `Analyze Figma design and generate software project structure`,
      context: {
        figmaUrl,
        projectName,
        projectDescription,
        analysisType: 'design-to-code'
      },
      priority: 'high',
      userPlan: 'enterprise',
      budget: 'quality',
      requiredComponents: ['design-analysis', 'code-generation', 'tech-stack-recommendation'],
      metadata: { platform: 'software-development' }
    });
    
    res.json({
      success: true,
      data: {
        figmaAnalysis: analysis.result,
        suggestedTechStack: analysis.result?.techStack || {},
        projectStructure: analysis.result?.structure || {},
        estimatedDuration: analysis.result?.estimatedDuration || '2-4 weeks'
      }
    });
  } catch (error) {
    console.error('Error analyzing Figma design:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Figma analysis failed'
    });
  }
});

// Tech stack recommendation
router.post('/tech-stack/recommend', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectDescription, projectType, requirements } = req.body;
    
    const recommendation = await waiOrchestrator.orchestrateTask({
      type: 'analysis',
      task: 'Recommend optimal technology stack for software project',
      context: {
        projectDescription,
        projectType,
        requirements,
        considerFactors: ['scalability', 'performance', 'maintainability', 'team-expertise']
      },
      priority: 'medium',
      userPlan: 'enterprise',
      budget: 'balanced',
      requiredComponents: ['tech-analysis', 'recommendation-engine'],
      metadata: { platform: 'software-development' }
    });
    
    res.json({
      success: true,
      data: {
        recommended: recommendation.result?.techStack || {},
        reasoning: recommendation.result?.reasoning || [],
        alternatives: recommendation.result?.alternatives || [],
        implementation: recommendation.result?.implementation || {}
      }
    });
  } catch (error) {
    console.error('Error generating tech stack recommendation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tech stack recommendation failed'
    });
  }
});

// ============================================================================
// CODE GENERATION & AI DEVELOPMENT
// ============================================================================

// Generate code from requirements
router.post('/code/generate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId, requirements, techStack, fileType } = req.body;
    
    const codeGeneration = await waiOrchestrator.orchestrateTask({
      type: 'development',
      task: 'Generate high-quality production code',
      context: {
        projectId,
        requirements,
        techStack,
        fileType,
        codeStandards: 'enterprise',
        includeTests: true,
        includeDocumentation: true
      },
      priority: 'high',
      userPlan: 'enterprise',
      budget: 'quality',
      requiredComponents: ['code-generation', 'testing', 'documentation'],
      metadata: { 
        platform: 'software-development',
        projectId: String(projectId)
      }
    });
    
    res.json({
      success: true,
      data: {
        generatedCode: codeGeneration.result?.code || '',
        tests: codeGeneration.result?.tests || '',
        documentation: codeGeneration.result?.documentation || '',
        structure: codeGeneration.result?.structure || {},
        qualityScore: codeGeneration.result?.qualityScore || 0
      }
    });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Code generation failed'
    });
  }
});

// Code review and optimization
router.post('/code/review', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code, language, reviewType } = req.body;
    
    const review = await waiOrchestrator.orchestrateTask({
      type: 'analysis',
      task: 'Comprehensive code review and optimization suggestions',
      context: {
        code,
        language,
        reviewType: reviewType || 'comprehensive',
        standards: ['security', 'performance', 'maintainability', 'best-practices']
      },
      priority: 'medium',
      userPlan: 'enterprise',
      budget: 'balanced',
      requiredComponents: ['code-analysis', 'security-scan', 'performance-analysis'],
      metadata: { platform: 'software-development' }
    });
    
    res.json({
      success: true,
      data: {
        review: review.result?.review || {},
        suggestions: review.result?.suggestions || [],
        securityIssues: review.result?.securityIssues || [],
        performanceIssues: review.result?.performanceIssues || [],
        qualityScore: review.result?.qualityScore || 0
      }
    });
  } catch (error) {
    console.error('Error reviewing code:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Code review failed'
    });
  }
});

// ============================================================================
// PROJECT DEPLOYMENT & DEVOPS
// ============================================================================

// Deploy project
router.post('/projects/:id/deploy', authenticateToken, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const { environment, platform, configuration } = req.body;
    
    const deployment = await waiOrchestrator.orchestrateTask({
      type: 'enterprise',
      task: `Deploy software project to ${platform}`,
      context: {
        projectId,
        environment: environment || 'production',
        platform: platform || 'vercel',
        configuration: configuration || {},
        includeMonitoring: true,
        setupCI: true
      },
      priority: 'high',
      userPlan: 'enterprise',
      budget: 'quality',
      requiredComponents: ['deployment-orchestration', 'monitoring', 'ci-cd'],
      metadata: { 
        platform: 'software-development',
        projectId: String(projectId)
      }
    });
    
    res.json({
      success: true,
      data: {
        deploymentId: deployment.id,
        status: 'deploying',
        url: deployment.result?.url || '',
        monitoring: deployment.result?.monitoring || {},
        ci: deployment.result?.ci || {}
      }
    });
  } catch (error) {
    console.error('Error deploying project:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    });
  }
});

// Get deployment status
router.get('/projects/:id/deployments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const deployments = await storage.getDeploymentsByProject(projectId);
    
    res.json({
      success: true,
      data: deployments
    });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deployments'
    });
  }
});

// ============================================================================
// SDLC WORKFLOW MANAGEMENT
// ============================================================================

// Get available SDLC workflows
router.get('/sdlc-workflows', async (req: Request, res: Response) => {
  try {
    const workflows = [
      {
        id: 'agile_standard',
        name: 'Agile Standard',
        description: 'Standard Agile development with 2-week sprints',
        phases: ['Planning', 'Development', 'Testing', 'Review', 'Deployment'],
        duration: '2-4 weeks per sprint',
        suitable: ['Web Applications', 'Mobile Apps', 'SaaS Products']
      },
      {
        id: 'lean_startup',
        name: 'Lean Startup',
        description: 'MVP-focused development with rapid iterations',
        phases: ['Build', 'Measure', 'Learn', 'Iterate'],
        duration: '1-2 weeks per cycle',
        suitable: ['Startups', 'Prototypes', 'Market Validation']
      },
      {
        id: 'enterprise_waterfall',
        name: 'Enterprise Waterfall',
        description: 'Structured approach for large enterprise projects',
        phases: ['Requirements', 'Design', 'Implementation', 'Testing', 'Deployment'],
        duration: '3-6 months',
        suitable: ['Enterprise Systems', 'Complex Integrations', 'Regulated Industries']
      },
      {
        id: 'devops_continuous',
        name: 'DevOps Continuous',
        description: 'Continuous integration and deployment focused',
        phases: ['Code', 'Build', 'Test', 'Deploy', 'Monitor'],
        duration: 'Continuous',
        suitable: ['Microservices', 'Cloud Native', 'High Availability Systems']
      }
    ];
    
    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Error fetching SDLC workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflows'
    });
  }
});

// ============================================================================
// ANALYTICS & MONITORING
// ============================================================================

// Get project analytics
router.get('/projects/:id/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    
    const analytics = await waiOrchestrator.orchestrateTask({
      type: 'analysis',
      task: 'Generate comprehensive project analytics',
      context: {
        projectId,
        metrics: ['development-velocity', 'code-quality', 'team-productivity', 'deployment-frequency'],
        timeRange: req.query.timeRange || '30d'
      },
      priority: 'low',
      userPlan: 'enterprise',
      budget: 'cost-effective',
      requiredComponents: ['analytics-engine'],
      metadata: { 
        platform: 'software-development',
        projectId: String(projectId)
      }
    });
    
    res.json({
      success: true,
      data: analytics.result || {}
    });
  } catch (error) {
    console.error('Error fetching project analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    });
  }
});

export { router as softwareDevelopmentRouter };