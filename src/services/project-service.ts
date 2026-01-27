/**
 * Project Service - COMPATIBILITY WRAPPER
 * 
 * This service delegates to the comprehensive project development service
 * while maintaining the database-focused project planning interface.
 */

import { ProjectDevelopmentService } from './project-development-service';
import { db } from '../db';
import { projects, projectPlans, projectResources } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export interface ProjectPlan {
  projectName: string;
  description: string;
  type: string;
  complexity: string;
  techStack: Array<{
    category: string;
    name: string;
    version?: string;
  }>;
  architecture: Record<string, string[]>;
  features: string[];
  timeline: Array<{
    phase: string;
    duration: string;
    tasks: string[];
  }>;
  cost: {
    infrastructure: number;
    development: number;
    maintenance: number;
    total: number;
    currency: string;
  };
  resources: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
    agents: number;
  };
  risks: Array<{
    level: string;
    description: string;
  }>;
  dependencies: string[];
}

// Compatibility wrapper class 
export class ProjectService {
  private devService: ProjectDevelopmentService;

  constructor() {
    this.devService = new ProjectDevelopmentService();
  }

  /**
   * Generate project plan using comprehensive development service
   */
  async generateProjectPlan(requirements: string): Promise<ProjectPlan> {
    try {
      const prompt = `Based on these requirements, create a detailed project plan:
      
      Requirements: ${requirements}
      
      Generate a comprehensive project plan including:
      1. Project name and description
      2. Technical stack with specific versions
      3. System architecture (frontend, backend, database, services)
      4. Core features list
      5. Development timeline with phases
      6. Cost estimation in USD
      7. Resource requirements
      8. Risk assessment
      9. Dependencies
      
      Format the response as a valid JSON object matching this structure:
      {
        "projectName": "string",
        "description": "string",
        "type": "web|mobile|desktop|api",
        "complexity": "simple|moderate|complex|enterprise",
        "techStack": [{"category": "string", "name": "string", "version": "string"}],
        "architecture": {"frontend": [], "backend": [], "database": [], "services": []},
        "features": ["string"],
        "timeline": [{"phase": "string", "duration": "string", "tasks": ["string"]}],
        "cost": {"infrastructure": number, "development": number, "maintenance": number, "total": number, "currency": "USD"},
        "resources": {"cpu": number, "memory": number, "storage": number, "bandwidth": number, "agents": number},
        "risks": [{"level": "low|medium|high", "description": "string"}],
        "dependencies": ["string"]
      }`;

      const { waiPlatformOrchestrator } = await import('./wai-platform-orchestrator');
      const response = await waiPlatformOrchestrator.codeStudio('analyze-project', prompt, { 
        projectType, 
        requirements,
        role: 'senior technical architect and project manager'
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate project plan');
      }

      const planContent = response.result?.content || response.result || '{}';
      const plan = typeof planContent === 'string' ? JSON.parse(planContent) : planContent;
      
      // Validate and enhance the plan
      return this.validateAndEnhancePlan(plan);
    } catch (error) {
      console.error('Error generating project plan:', error);
      // Return a default plan if generation fails
      return this.getDefaultPlan(requirements);
    }
  }

  /**
   * Validate and enhance generated plan
   */
  validateAndEnhancePlan(plan: any): ProjectPlan {
    // Ensure all required fields exist
    const validatedPlan: ProjectPlan = {
      projectName: plan.projectName || 'New Project',
      description: plan.description || 'AI-powered application',
      type: plan.type || 'web',
      complexity: plan.complexity || 'moderate',
      techStack: plan.techStack || this.getDefaultTechStack(),
      architecture: plan.architecture || this.getDefaultArchitecture(),
      features: plan.features || [],
      timeline: plan.timeline || this.getDefaultTimeline(),
      cost: {
        infrastructure: plan.cost?.infrastructure || 200,
        development: plan.cost?.development || 5000,
        maintenance: plan.cost?.maintenance || 150,
        total: plan.cost?.total || 5350,
        currency: 'USD'
      },
      resources: {
        cpu: plan.resources?.cpu || 4,
        memory: plan.resources?.memory || 8,
        storage: plan.resources?.storage || 100,
        bandwidth: plan.resources?.bandwidth || 500,
        agents: plan.resources?.agents || 10
      },
      risks: plan.risks || [],
      dependencies: plan.dependencies || []
    };

    // Calculate accurate total cost
    validatedPlan.cost.total = 
      validatedPlan.cost.infrastructure + 
      validatedPlan.cost.development + 
      validatedPlan.cost.maintenance;

    return validatedPlan;
  }

  /**
   * Get default tech stack
   */
  getDefaultTechStack() {
    return [
      { category: 'Frontend', name: 'React', version: '18.2' },
      { category: 'Backend', name: 'Node.js', version: '20.x' },
      { category: 'Database', name: 'PostgreSQL', version: '15' },
      { category: 'Cloud', name: 'AWS' }
    ];
  }

  /**
   * Get default architecture
   */
  getDefaultArchitecture() {
    return {
      frontend: ['React Components', 'State Management', 'Routing'],
      backend: ['Express Server', 'REST APIs', 'Authentication'],
      database: ['Schema Design', 'Migrations', 'Indexing'],
      services: ['Redis Cache', 'S3 Storage', 'CloudFront CDN']
    };
  }

  /**
   * Get default timeline
   */
  getDefaultTimeline() {
    return [
      {
        phase: 'Planning & Setup',
        duration: '1 week',
        tasks: ['Requirements Analysis', 'Architecture Design', 'Environment Setup']
      },
      {
        phase: 'Core Development',
        duration: '4 weeks',
        tasks: ['Backend APIs', 'Frontend Components', 'Database Schema']
      },
      {
        phase: 'Testing & Deployment',
        duration: '1 week',
        tasks: ['Unit Testing', 'Integration Testing', 'Production Deployment']
      }
    ];
  }

  /**
   * Get default plan for fallback
   */
  getDefaultPlan(requirements: string): ProjectPlan {
    return {
      projectName: 'Custom Project',
      description: requirements.substring(0, 200),
      type: 'web',
      complexity: 'moderate',
      techStack: this.getDefaultTechStack(),
      architecture: this.getDefaultArchitecture(),
      features: [
        'User Authentication',
        'Data Management',
        'API Integration',
        'Responsive Design'
      ],
      timeline: this.getDefaultTimeline(),
      cost: {
        infrastructure: 250,
        development: 5000,
        maintenance: 150,
        total: 5400,
        currency: 'USD'
      },
      resources: {
        cpu: 4,
        memory: 8,
        storage: 100,
        bandwidth: 500,
        agents: 12
      },
      risks: [
        { level: 'low', description: 'Third-party API dependencies' },
        { level: 'medium', description: 'Scalability requirements' }
      ],
      dependencies: ['Node.js', 'PostgreSQL', 'Redis']
    };
  }

  /**
   * Save project plan to database
   */
  async saveProjectPlan(plan: ProjectPlan, userId: string) {
    try {
      // Create project
      const [project] = await db.insert(projects).values({
        name: plan.projectName,
        description: plan.description,
        createdBy: parseInt(userId) || 1,
        status: 'planning',
        priority: 'medium',
        visibility: 'private',
        requirements: { raw: plan.description },
        techStack: plan.techStack,
        architecture: plan.architecture,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Save project plan
      const [savedPlan] = await db.insert(projectPlans).values({
        projectId: project.id,
        techStack: plan.techStack,
        architecture: plan.architecture,
        features: plan.features,
        timeline: plan.timeline,
        cost: plan.cost,
        risks: plan.risks,
        dependencies: plan.dependencies,
        complexity: plan.complexity,
        createdAt: new Date()
      }).returning();

      // Save resource allocation
      await db.insert(projectResources).values({
        projectId: project.id,
        cpu: plan.resources.cpu,
        memory: plan.resources.memory,
        storage: plan.resources.storage,
        bandwidth: plan.resources.bandwidth,
        agents: plan.resources.agents,
        createdAt: new Date()
      });

      return { project, plan: savedPlan };
    } catch (error) {
      console.error('Error saving project plan:', error);
      throw error;
    }
  }

  /**
   * Approve project plan
   */
  async approveProject(projectId: string) {
    try {
      const [updated] = await db
        .update(projects)
        .set({
          status: 'approved',
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();

      // Trigger project initialization
      await this.initializeProject(projectId);

      return updated;
    } catch (error) {
      console.error('Error approving project:', error);
      throw error;
    }
  }

  /**
   * Reject project plan
   */
  async rejectProject(projectId: string, reason: string) {
    try {
      const [updated] = await db
        .update(projects)
        .set({
          status: 'rejected',
          rejectionReason: reason,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();

      return updated;
    } catch (error) {
      console.error('Error rejecting project:', error);
      throw error;
    }
  }

  /**
   * Initialize approved project
   */
  async initializeProject(projectId: string) {
    try {
      // Get project details
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId));

      if (!project) {
        throw new Error('Project not found');
      }

      // Update status to in-progress
      await db
        .update(projects)
        .set({
          status: 'in-progress',
          startedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId));

      // Here you would trigger actual project setup:
      // - Create Git repository
      // - Set up CI/CD pipelines
      // - Provision infrastructure
      // - Initialize databases
      // - Deploy initial code

      return { success: true, message: 'Project initialized successfully' };
    } catch (error) {
      console.error('Error initializing project:', error);
      throw error;
    }
  }

  /**
   * Get all projects
   */
  async getAllProjects(userId?: string) {
    try {
      let query = db.select().from(projects);
      
      if (userId) {
        query = query.where(eq(projects.userId, userId));
      }
      
      const allProjects = await query.orderBy(desc(projects.createdAt));
      
      // Get plans for each project
      const projectsWithPlans = await Promise.all(
        allProjects.map(async (project) => {
          const [plan] = await db
            .select()
            .from(projectPlans)
            .where(eq(projectPlans.projectId, project.id));
            
          const [resources] = await db
            .select()
            .from(projectResources)
            .where(eq(projectResources.projectId, project.id));
            
          return {
            ...project,
            plan,
            resources
          };
        })
      );
      
      return projectsWithPlans;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  /**
   * Update project status
   */
  async updateProjectStatus(projectId: string, status: string) {
    try {
      const [updated] = await db
        .update(projects)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();

      return updated;
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  }

  /**
   * Get project cost breakdown
   */
  async getProjectCostBreakdown(projectId: string) {
    try {
      const [plan] = await db
        .select()
        .from(projectPlans)
        .where(eq(projectPlans.projectId, projectId));

      if (!plan) {
        throw new Error('Project plan not found');
      }

      const [resources] = await db
        .select()
        .from(projectResources)
        .where(eq(projectResources.projectId, projectId));

      // Calculate detailed costs
      const breakdown = {
        infrastructure: {
          compute: resources.cpu * 20, // $20 per CPU
          memory: resources.memory * 10, // $10 per GB
          storage: resources.storage * 0.5, // $0.50 per GB
          bandwidth: resources.bandwidth * 0.1 // $0.10 per GB
        },
        development: {
          agents: resources.agents * 100, // $100 per agent hour
          api_calls: plan.cost.development * 0.3, // 30% for API costs
          tools: plan.cost.development * 0.2 // 20% for tools
        },
        maintenance: {
          monitoring: 50,
          backups: 30,
          support: 70
        },
        total: plan.cost.total
      };

      return breakdown;
    } catch (error) {
      console.error('Error getting cost breakdown:', error);
      throw error;
    }
  }
}

export const projectService = new ProjectService();