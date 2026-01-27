/**
 * Architect Workflow Builder API Routes
 * Handles organization design, deployment, and management
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

interface DepartmentConfig {
  id: string;
  moduleId: string;
  name: string;
  position: { x: number; y: number };
  agents: string[];
  romaLevel: number;
  isActive: boolean;
  workflows: string[];
}

interface OrganizationConfig {
  version: string;
  organization: {
    name: string;
    description: string;
  };
  corporateDNA: {
    tone: string;
    riskProfile: string;
    values: string[];
    ethicalGuidelines: string[];
    budgetConstraint: string;
    qualityPriority: string;
  };
  departments: DepartmentConfig[];
  connections: Array<{
    source: string;
    target: string;
    type: string;
  }>;
  generatedAt: string;
}

const deployedOrganizations: Map<string, OrganizationConfig> = new Map();

router.post('/deploy', async (req: Request, res: Response) => {
  try {
    const config: OrganizationConfig = req.body;
    
    if (!config.organization?.name || !config.departments?.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid organization configuration'
      });
    }

    const orgId = `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const totalAgents = config.departments.reduce((acc, dept) => acc + (dept.agents?.length || 0), 0);
    const activeWorkflows = config.departments
      .filter(d => d.isActive)
      .flatMap(d => d.workflows || []);

    const deploymentResult = {
      id: orgId,
      status: 'deployed',
      organizationName: config.organization.name,
      departmentCount: config.departments.length,
      totalAgents,
      activeWorkflows: activeWorkflows.length,
      corporateDNA: config.corporateDNA,
      deployedAt: new Date().toISOString(),
      healthCheck: {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
      }
    };

    deployedOrganizations.set(orgId, config);

    console.log(`🏢 Organization deployed: ${config.organization.name} with ${config.departments.length} departments`);

    res.json({
      success: true,
      data: deploymentResult
    });
  } catch (error: any) {
    console.error('Organization deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deploy organization'
    });
  }
});

router.get('/organizations', async (_req: Request, res: Response) => {
  try {
    const organizations = Array.from(deployedOrganizations.entries()).map(([id, config]) => ({
      id,
      name: config.organization.name,
      description: config.organization.description,
      departmentCount: config.departments.length,
      totalAgents: config.departments.reduce((acc, d) => acc + (d.agents?.length || 0), 0),
      deployedAt: config.generatedAt,
      status: 'active'
    }));

    res.json({
      success: true,
      data: organizations
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/organizations/:id', async (req: Request, res: Response) => {
  try {
    const config = deployedOrganizations.get(req.params.id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/department-modules', async (_req: Request, res: Response) => {
  const modules = [
    {
      id: 'finance',
      name: 'Finance Department',
      icon: 'DollarSign',
      color: '#22c55e',
      description: 'Financial operations, budgeting, and compliance',
      agentCount: 4,
      workflows: ['quote-to-cash', 'budget-approval', 'expense-management', 'financial-reporting']
    },
    {
      id: 'hr',
      name: 'HR Department',
      icon: 'Users',
      color: '#8b5cf6',
      description: 'Human resources, recruitment, and talent management',
      agentCount: 4,
      workflows: ['recruitment-pipeline', 'onboarding-workflow', 'performance-review', 'offboarding']
    },
    {
      id: 'engineering',
      name: 'Engineering Department',
      icon: 'Code',
      color: '#3b82f6',
      description: 'Software development and technical operations',
      agentCount: 5,
      workflows: ['sprint-planning', 'code-review', 'deployment', 'incident-response']
    },
    {
      id: 'marketing',
      name: 'Marketing Department',
      icon: 'Megaphone',
      color: '#f97316',
      description: 'Marketing strategy, content, and growth',
      agentCount: 4,
      workflows: ['campaign-launch', 'content-calendar', 'lead-nurturing', 'brand-monitoring']
    },
    {
      id: 'legal',
      name: 'Legal Department',
      icon: 'Scale',
      color: '#64748b',
      description: 'Legal compliance, contracts, and governance',
      agentCount: 3,
      workflows: ['contract-approval', 'compliance-audit', 'legal-review', 'dispute-resolution']
    },
    {
      id: 'operations',
      name: 'Operations Department',
      icon: 'Briefcase',
      color: '#06b6d4',
      description: 'Business operations and supply chain',
      agentCount: 3,
      workflows: ['inventory-management', 'vendor-management', 'quality-control', 'logistics']
    }
  ];

  res.json({
    success: true,
    data: modules
  });
});

router.get('/team-templates', async (_req: Request, res: Response) => {
  const templates = [
    { id: 'startup-mvp', name: 'Startup MVP', departments: ['engineering', 'marketing'], description: 'Lean team for rapid MVP development' },
    { id: 'enterprise', name: 'Enterprise', departments: ['finance', 'hr', 'engineering', 'marketing', 'legal', 'operations'], description: 'Full enterprise organization' },
    { id: 'agency', name: 'Agency', departments: ['marketing', 'engineering'], description: 'Marketing/Creative agency structure' },
    { id: 'healthcare-org', name: 'Healthcare Org', departments: ['healthcare', 'finance', 'hr', 'legal'], description: 'Healthcare organization with compliance' },
    { id: 'edtech', name: 'EdTech', departments: ['education', 'engineering', 'marketing'], description: 'Educational technology company' },
  ];

  res.json({
    success: true,
    data: templates
  });
});

export default router;
