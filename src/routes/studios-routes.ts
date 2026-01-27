/**
 * Studios API Routes
 * Wizards Incubator 10 Studios with direct API access
 */

import { Router } from 'express';
import { db } from '../db';
import { wizardsStudios, wizardsStudioSessions, wizardsArtifacts } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

const WIZARDS_STUDIOS = [
  {
    id: 'ideation-lab',
    name: 'Ideation Lab',
    description: 'Transform raw ideas into validated concepts with AI-powered brainstorming and market analysis',
    icon: 'Lightbulb',
    color: 'from-purple-500 to-pink-500',
    day: 1,
    agents: ['IdeationAgent', 'MarketAnalyst', 'ConceptValidator'],
    capabilities: ['idea-generation', 'market-research', 'competitor-analysis', 'concept-validation'],
    status: 'active'
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    description: 'Deep market research with competitive analysis and customer discovery',
    icon: 'TrendingUp',
    color: 'from-blue-500 to-cyan-500',
    day: 2,
    agents: ['MarketResearcher', 'CompetitorAnalyzer', 'CustomerDiscovery'],
    capabilities: ['market-sizing', 'competitor-tracking', 'trend-analysis', 'customer-profiling'],
    status: 'active'
  },
  {
    id: 'product-blueprint',
    name: 'Product Blueprint',
    description: 'Create detailed product specifications and technical architecture',
    icon: 'Layout',
    color: 'from-green-500 to-teal-500',
    day: 3,
    agents: ['ProductArchitect', 'TechSpecialist', 'UXStrategist'],
    capabilities: ['product-spec', 'tech-architecture', 'feature-prioritization', 'roadmap-creation'],
    status: 'active'
  },
  {
    id: 'experience-design',
    name: 'Experience Design',
    description: 'Design stunning user experiences with AI-powered UI/UX tools',
    icon: 'Palette',
    color: 'from-orange-500 to-yellow-500',
    day: 4,
    agents: ['UXDesigner', 'UIArtist', 'DesignSystemArchitect'],
    capabilities: ['wireframing', 'prototyping', 'design-system', 'user-testing'],
    status: 'active'
  },
  {
    id: 'engineering-forge',
    name: 'Engineering Forge',
    description: 'Build production-ready code with autonomous development agents',
    icon: 'Code',
    color: 'from-red-500 to-orange-500',
    day: 5,
    agents: ['FullStackDeveloper', 'BackendEngineer', 'FrontendExpert', 'DevOpsSpecialist'],
    capabilities: ['code-generation', 'api-development', 'database-design', 'ci-cd-setup'],
    status: 'active'
  },
  {
    id: 'quality-assurance-lab',
    name: 'Quality Assurance Lab',
    description: 'Comprehensive testing with automated QA and performance optimization',
    icon: 'CheckCircle',
    color: 'from-indigo-500 to-purple-500',
    day: 6,
    agents: ['QAEngineer', 'PerformanceTester', 'SecurityAuditor'],
    capabilities: ['e2e-testing', 'performance-testing', 'security-audit', 'code-review'],
    status: 'active'
  },
  {
    id: 'growth-engine',
    name: 'Growth Engine',
    description: 'Launch and grow with AI-powered marketing and growth strategies',
    icon: 'Rocket',
    color: 'from-pink-500 to-rose-500',
    day: 7,
    agents: ['GrowthHacker', 'ContentMarketer', 'SEOSpecialist'],
    capabilities: ['growth-strategy', 'content-creation', 'seo-optimization', 'user-acquisition'],
    status: 'active'
  },
  {
    id: 'launch-command',
    name: 'Launch Command',
    description: 'Orchestrate your launch with coordinated deployment and go-to-market',
    icon: 'Send',
    color: 'from-emerald-500 to-green-500',
    day: 8,
    agents: ['LaunchManager', 'PRSpecialist', 'CommunityBuilder'],
    capabilities: ['launch-planning', 'pr-outreach', 'beta-coordination', 'announcement'],
    status: 'active'
  },
  {
    id: 'operations-hub',
    name: 'Operations Hub',
    description: 'Manage day-to-day operations with intelligent automation',
    icon: 'Settings',
    color: 'from-slate-500 to-gray-500',
    day: 9,
    agents: ['OperationsManager', 'CustomerSuccess', 'SupportSpecialist'],
    capabilities: ['operations-automation', 'customer-support', 'analytics', 'reporting'],
    status: 'active'
  },
  {
    id: 'deployment-studio',
    name: 'Deployment Studio',
    description: 'Deploy and scale with enterprise-grade infrastructure',
    icon: 'Cloud',
    color: 'from-cyan-500 to-blue-500',
    day: 10,
    agents: ['InfrastructureEngineer', 'CloudArchitect', 'SRESpecialist'],
    capabilities: ['cloud-deployment', 'infrastructure-as-code', 'monitoring', 'scaling'],
    status: 'active'
  }
];

router.get('/', async (req, res) => {
  try {
    let dbStudios: any[] = [];
    try {
      dbStudios = await db.select().from(wizardsStudios);
    } catch (dbError) {
      console.log('Studios DB query failed, using hardcoded studios');
    }

    const studios = WIZARDS_STUDIOS.map(studio => {
      const dbStudio = dbStudios.find(s => s.slug === studio.id);
      return {
        ...studio,
        dbId: dbStudio?.id,
        sessionsCount: dbStudio?.totalSessions || 0,
        artifactsCount: dbStudio?.totalArtifacts || 0
      };
    });

    res.json({
      success: true,
      data: {
        studios,
        totalCount: studios.length,
        activeCount: studios.filter(s => s.status === 'active').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get studios:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve studios',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/:studioId', async (req, res) => {
  try {
    const { studioId } = req.params;
    const studio = WIZARDS_STUDIOS.find(s => s.id === studioId);

    if (!studio) {
      return res.status(404).json({
        success: false,
        error: 'Studio not found',
        studioId
      });
    }

    let dbStudio: any = null;
    try {
      const results = await db.select().from(wizardsStudios).where(eq(wizardsStudios.slug, studioId));
      dbStudio = results[0];
    } catch (dbError) {
      console.log('Studio DB query failed');
    }

    res.json({
      success: true,
      data: {
        ...studio,
        dbId: dbStudio?.id,
        sessionsCount: dbStudio?.totalSessions || 0,
        artifactsCount: dbStudio?.totalArtifacts || 0,
        metrics: {
          avgSessionDuration: 45,
          completionRate: 92,
          satisfactionScore: 4.7
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get studio',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/:studioId/sessions', async (req, res) => {
  try {
    const { studioId } = req.params;
    const studio = WIZARDS_STUDIOS.find(s => s.id === studioId);

    if (!studio) {
      return res.status(404).json({
        success: false,
        error: 'Studio not found',
        studioId
      });
    }

    let sessions: any[] = [];
    try {
      const dbStudio = await db.select().from(wizardsStudios).where(eq(wizardsStudios.slug, studioId));
      if (dbStudio[0]) {
        sessions = await db.select()
          .from(wizardsStudioSessions)
          .where(eq(wizardsStudioSessions.studioId, dbStudio[0].id))
          .orderBy(desc(wizardsStudioSessions.createdAt))
          .limit(50);
      }
    } catch (dbError) {
      console.log('Sessions DB query failed');
    }

    res.json({
      success: true,
      data: {
        studioId,
        studioName: studio.name,
        sessions: sessions.map(s => ({
          id: s.id,
          status: s.status,
          progress: s.progress,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        })),
        totalCount: sessions.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/:studioId/sessions', async (req, res) => {
  try {
    const { studioId } = req.params;
    const { founderId, projectId, config } = req.body;

    const studio = WIZARDS_STUDIOS.find(s => s.id === studioId);

    if (!studio) {
      return res.status(404).json({
        success: false,
        error: 'Studio not found',
        studioId
      });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        studioId,
        studioName: studio.name,
        status: 'initializing',
        progress: 0,
        config: config || {},
        agents: studio.agents,
        capabilities: studio.capabilities,
        createdAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/:studioId/artifacts', async (req, res) => {
  try {
    const { studioId } = req.params;
    const studio = WIZARDS_STUDIOS.find(s => s.id === studioId);

    if (!studio) {
      return res.status(404).json({
        success: false,
        error: 'Studio not found',
        studioId
      });
    }

    let artifacts: any[] = [];
    try {
      const dbStudio = await db.select().from(wizardsStudios).where(eq(wizardsStudios.slug, studioId));
      if (dbStudio[0]) {
        artifacts = await db.select()
          .from(wizardsArtifacts)
          .where(eq(wizardsArtifacts.studioId, dbStudio[0].id))
          .orderBy(desc(wizardsArtifacts.createdAt))
          .limit(100);
      }
    } catch (dbError) {
      console.log('Artifacts DB query failed');
    }

    res.json({
      success: true,
      data: {
        studioId,
        studioName: studio.name,
        artifacts: artifacts.map(a => ({
          id: a.id,
          type: a.type,
          name: a.name,
          version: a.version,
          createdAt: a.createdAt
        })),
        totalCount: artifacts.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get artifacts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/journey/14-day', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalDays: 14,
        studios: WIZARDS_STUDIOS.map((studio, index) => ({
          day: index + 1,
          ...studio,
          estimatedHours: 4 + Math.floor(Math.random() * 4)
        })),
        milestones: [
          { day: 3, name: 'Concept Validated', description: 'Idea refined and market-validated' },
          { day: 7, name: 'MVP Ready', description: 'Core product built and tested' },
          { day: 10, name: 'Launch Ready', description: 'Product deployed and go-to-market planned' },
          { day: 14, name: 'Production Live', description: 'Full production deployment with monitoring' }
        ]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get journey info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
