/**
 * Wizards Ideation Lab Studio Service
 * Studio 1: Idea validation, market research, business model canvas generation
 * 
 * Part of 10 Studios - Converts ideas into validated business concepts
 */

import { wizardsStudioEngineService } from '../wizards-studio-engine';
import { wizardsOrchestrationService } from '../wizards-orchestration-service';
import { wizardsArtifactStoreService } from '../wizards-artifact-store';
import type {
  OrchestrationRequest,
  TaskStatus,
  Priority,
} from '@shared/wizards-incubator-types';

interface IdeaValidation {
  ideaDescription: string;
  viabilityScore: number;
  marketPotential: 'low' | 'medium' | 'high';
  strengths: string[];
  risks: string[];
  recommendations: string[];
  competitiveAdvantage: string;
  targetCustomers: string[];
  estimatedMarketSize: string;
  validatedAt: Date;
}

interface MarketResearch {
  marketDescription: string;
  marketSize: {
    tam: string;
    sam: string;
    som: string;
    currency: string;
  };
  growthRate: number;
  keyTrends: string[];
  customerSegments: string[];
  competitors: Array<{ name: string; description: string; marketShare?: number }>;
  marketDynamics: {
    drivers: string[];
    barriers: string[];
    opportunities: string[];
  };
  regulatoryEnvironment: string;
  sources: string[];
  conductedAt: Date;
}

interface BusinessModelCanvas {
  customerSegments: string[];
  valuePropositions: string[];
  channels: string[];
  customerRelationships: string[];
  revenueStreams: string[];
  keyResources: string[];
  keyActivities: string[];
  keyPartnerships: string[];
  costStructure: Array<{ category: string; amount: number }>;
  createdAt: Date;
  version: string;
}

export class WizardsIdeationLabService {
  private readonly studioId = 'ideation-lab';
  private readonly studioName = 'Ideation Lab';

  async validateIdea(
    startupId: number,
    sessionId: number | null,
    ideaDescription: string,
    options?: {
      industry?: string;
      targetMarket?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
      aguiSessionId?: string;
    }
  ): Promise<{
    validation: IdeaValidation;
    taskId: number;
    artifactId: number;
    sessionId: number;
  }> {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      this.studioId,
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const task = await wizardsStudioEngineService.createTask(
      activeSession.id,
      {
        taskType: 'idea-validation',
        taskName: 'Validate Startup Idea',
        taskDescription: `Analyze viability and market potential for: ${ideaDescription.substring(0, 100)}...`,
        priority: 'high' as Priority,
        assignedAgents: [],
        inputs: {
          ideaDescription,
          industry: options?.industry,
          targetMarket: options?.targetMarket,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'in-progress' as TaskStatus,
        metadata: { statusMessage: 'Analyzing idea viability...' },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'analysis',
      workflow: 'sequential',
      inputs: {
        task: `Analyze this startup idea and provide detailed validation: ${ideaDescription}`,
        prompt: `Analyze this startup idea and provide detailed validation:

Idea: ${ideaDescription}
Industry: ${options?.industry || 'Not specified'}
Target Market: ${options?.targetMarket || 'Not specified'}`,
        analysisDepth: 'comprehensive',
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 300,
        maxCredits: 100,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'ideation_lab',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    if (orchestrationResult.status !== 'success') {
      await wizardsStudioEngineService.updateTaskStatus(
        task.id,
        {
          status: 'failed' as TaskStatus,
          errorMessage: orchestrationResult.errorMessage || 'Orchestration failed',
          metadata: { statusMessage: 'Idea validation failed' },
        },
        {
          deterministicMode: options?.deterministicMode,
          clockSeed: options?.clockSeed,
        }
      );
      throw new Error(`Idea validation failed: ${orchestrationResult.errorMessage || 'Unknown error'}`);
    }

    const validation: IdeaValidation = {
      ideaDescription,
      viabilityScore: orchestrationResult.outputs?.viabilityScore ?? orchestrationResult.qualityScore ?? 0,
      marketPotential: orchestrationResult.outputs?.marketPotential ?? 'medium',
      strengths: Array.isArray(orchestrationResult.outputs?.strengths) ? orchestrationResult.outputs.strengths : [],
      risks: Array.isArray(orchestrationResult.outputs?.risks) ? orchestrationResult.outputs.risks : [],
      recommendations: Array.isArray(orchestrationResult.outputs?.recommendations) ? orchestrationResult.outputs.recommendations : [],
      competitiveAdvantage: orchestrationResult.outputs?.competitiveAdvantage ?? 'Not analyzed',
      targetCustomers: Array.isArray(orchestrationResult.outputs?.targetCustomers) ? orchestrationResult.outputs.targetCustomers : (options?.targetMarket ? [options.targetMarket] : []),
      estimatedMarketSize: orchestrationResult.outputs?.estimatedMarketSize ?? 'Unknown',
      validatedAt: new Date(),
    };

    const artifact = await wizardsArtifactStoreService.createArtifact({
      startupId,
      artifactType: 'document',
      category: 'business-plan',
      name: 'Idea Validation Report',
      description: `Validation analysis for: ${ideaDescription.substring(0, 50)}...`,
      content: JSON.stringify(validation, null, 2),
      studioId: this.studioId,
      sessionId: activeSession.id,
      tags: ['validation', 'ideation', 'market-research'],
      metadata: {
        viabilityScore: validation.viabilityScore,
        marketPotential: validation.marketPotential,
      },
    }, {
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
    });

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'completed' as TaskStatus,
        outputs: validation,
        creditsUsed: orchestrationResult.creditsConsumed,
        metadata: {
          statusMessage: 'Idea validation completed',
          agentsInvolved: orchestrationResult.agentsUsed,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    return {
      validation,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

  async conductMarketResearch(
    startupId: number,
    sessionId: number | null,
    marketDescription: string,
    options?: {
      industry?: string;
      geography?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
      aguiSessionId?: string;
    }
  ): Promise<{
    research: MarketResearch;
    taskId: number;
    artifactId: number;
    sessionId: number;
  }> {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      this.studioId,
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const task = await wizardsStudioEngineService.createTask(
      activeSession.id,
      {
        taskType: 'market-research',
        taskName: 'Market Research Analysis',
        taskDescription: `Comprehensive market analysis for: ${marketDescription.substring(0, 100)}...`,
        priority: 'high' as Priority,
        assignedAgents: [],
        inputs: {
          marketDescription,
          industry: options?.industry,
          geography: options?.geography,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'in-progress' as TaskStatus,
        metadata: { statusMessage: 'Conducting market research...' },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'analysis',
      workflow: 'sequential',
      inputs: {
        prompt: `Conduct comprehensive market research:

Market: ${marketDescription}
Industry: ${options?.industry || 'Not specified'}
Geography: ${options?.geography || 'Global'}`,
        researchDepth: 'comprehensive',
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 600,
        maxCredits: 200,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'ideation_lab',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    if (orchestrationResult.status !== 'success') {
      await wizardsStudioEngineService.updateTaskStatus(
        task.id,
        {
          status: 'failed' as TaskStatus,
          errorMessage: orchestrationResult.errorMessage || 'Orchestration failed',
          metadata: { statusMessage: 'Market research failed' },
        },
        {
          deterministicMode: options?.deterministicMode,
          clockSeed: options?.clockSeed,
        }
      );
      throw new Error(`Market research failed: ${orchestrationResult.errorMessage || 'Unknown error'}`);
    }

    const research: MarketResearch = {
      marketDescription,
      marketSize: {
        tam: orchestrationResult.outputs?.marketSize?.tam ?? 'Unknown',
        sam: orchestrationResult.outputs?.marketSize?.sam ?? 'Unknown',
        som: orchestrationResult.outputs?.marketSize?.som ?? 'Unknown',
        currency: orchestrationResult.outputs?.marketSize?.currency ?? 'USD',
      },
      growthRate: orchestrationResult.outputs?.growthRate ?? 0,
      keyTrends: Array.isArray(orchestrationResult.outputs?.keyTrends) ? orchestrationResult.outputs.keyTrends : [],
      customerSegments: Array.isArray(orchestrationResult.outputs?.customerSegments) ? orchestrationResult.outputs.customerSegments : [],
      competitors: Array.isArray(orchestrationResult.outputs?.competitors) ? orchestrationResult.outputs.competitors : [],
      marketDynamics: {
        drivers: Array.isArray(orchestrationResult.outputs?.marketDynamics?.drivers) ? orchestrationResult.outputs.marketDynamics.drivers : [],
        barriers: Array.isArray(orchestrationResult.outputs?.marketDynamics?.barriers) ? orchestrationResult.outputs.marketDynamics.barriers : [],
        opportunities: Array.isArray(orchestrationResult.outputs?.marketDynamics?.opportunities) ? orchestrationResult.outputs.marketDynamics.opportunities : [],
      },
      regulatoryEnvironment: orchestrationResult.outputs?.regulatoryEnvironment ?? 'Not analyzed',
      sources: Array.isArray(orchestrationResult.outputs?.sources) ? orchestrationResult.outputs.sources : [],
      conductedAt: new Date(),
    };

    const artifact = await wizardsArtifactStoreService.createArtifact({
      startupId,
      artifactType: 'document',
      category: 'business-plan',
      name: 'Market Research Report',
      description: `Market analysis for: ${marketDescription.substring(0, 50)}...`,
      content: JSON.stringify(research, null, 2),
      studioId: this.studioId,
      sessionId: activeSession.id,
      tags: ['market-research', 'competitive-analysis', 'ideation'],
      metadata: {
        tam: research.marketSize.tam,
        growthRate: research.growthRate,
        competitorCount: research.competitors.length,
      },
    }, {
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
    });

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'completed' as TaskStatus,
        outputs: research,
        creditsUsed: orchestrationResult.creditsConsumed,
        metadata: {
          statusMessage: 'Market research completed',
          agentsInvolved: orchestrationResult.agentsUsed,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    return {
      research,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

  async generateBusinessModelCanvas(
    startupId: number,
    sessionId: number | null,
    businessIdea: string,
    options?: {
      customerSegments?: string[];
      valueProposition?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
      aguiSessionId?: string;
    }
  ): Promise<{
    canvas: BusinessModelCanvas;
    taskId: number;
    artifactId: number;
    sessionId: number;
  }> {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      this.studioId,
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const task = await wizardsStudioEngineService.createTask(
      activeSession.id,
      {
        taskType: 'business-model-design',
        taskName: 'Generate Business Model Canvas',
        taskDescription: `Create BMC for: ${businessIdea.substring(0, 100)}...`,
        priority: 'high' as Priority,
        assignedAgents: [],
        inputs: {
          businessIdea,
          customerSegments: options?.customerSegments,
          valueProposition: options?.valueProposition,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'in-progress' as TaskStatus,
        metadata: { statusMessage: 'Generating Business Model Canvas...' },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'generation',
      workflow: 'sequential',
      inputs: {
        prompt: `Generate a comprehensive Business Model Canvas:

Business Idea: ${businessIdea}
${options?.customerSegments ? `Target Customers: ${options.customerSegments.join(', ')}` : ''}
${options?.valueProposition ? `Value Proposition: ${options.valueProposition}` : ''}`,
        designType: 'business-model',
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 450,
        maxCredits: 150,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'ideation_lab',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    if (orchestrationResult.status !== 'success') {
      await wizardsStudioEngineService.updateTaskStatus(
        task.id,
        {
          status: 'failed' as TaskStatus,
          errorMessage: orchestrationResult.errorMessage || 'Orchestration failed',
          metadata: { statusMessage: 'Business Model Canvas generation failed' },
        },
        {
          deterministicMode: options?.deterministicMode,
          clockSeed: options?.clockSeed,
        }
      );
      throw new Error(`Business Model Canvas generation failed: ${orchestrationResult.errorMessage || 'Unknown error'}`);
    }

    const canvas: BusinessModelCanvas = {
      customerSegments: Array.isArray(orchestrationResult.outputs?.customerSegments) ? orchestrationResult.outputs.customerSegments : (options?.customerSegments || []),
      valuePropositions: Array.isArray(orchestrationResult.outputs?.valuePropositions) ? orchestrationResult.outputs.valuePropositions : (options?.valueProposition ? [options.valueProposition] : []),
      channels: Array.isArray(orchestrationResult.outputs?.channels) ? orchestrationResult.outputs.channels : [],
      customerRelationships: Array.isArray(orchestrationResult.outputs?.customerRelationships) ? orchestrationResult.outputs.customerRelationships : [],
      revenueStreams: Array.isArray(orchestrationResult.outputs?.revenueStreams) ? orchestrationResult.outputs.revenueStreams : [],
      keyResources: Array.isArray(orchestrationResult.outputs?.keyResources) ? orchestrationResult.outputs.keyResources : [],
      keyActivities: Array.isArray(orchestrationResult.outputs?.keyActivities) ? orchestrationResult.outputs.keyActivities : [],
      keyPartnerships: Array.isArray(orchestrationResult.outputs?.keyPartnerships) ? orchestrationResult.outputs.keyPartnerships : [],
      costStructure: Array.isArray(orchestrationResult.outputs?.costStructure) ? orchestrationResult.outputs.costStructure : [],
      createdAt: new Date(),
      version: '1.0',
    };

    const artifact = await wizardsArtifactStoreService.createArtifact({
      startupId,
      artifactType: 'document',
      category: 'business-plan',
      name: 'Business Model Canvas',
      description: `BMC for: ${businessIdea.substring(0, 50)}...`,
      content: JSON.stringify(canvas, null, 2),
      version: 1,
      studioId: this.studioId,
      sessionId: activeSession.id,
      tags: ['bmc', 'business-model', 'strategy', 'ideation'],
      metadata: {
        customerSegmentCount: canvas.customerSegments.length,
        revenueStreamCount: canvas.revenueStreams.length,
      },
    }, {
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
    });

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'completed' as TaskStatus,
        outputs: canvas,
        creditsUsed: orchestrationResult.creditsConsumed,
        metadata: {
          statusMessage: 'Business Model Canvas generated',
          agentsInvolved: orchestrationResult.agentsUsed,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    return {
      canvas,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

}

export const wizardsIdeationLabService = new WizardsIdeationLabService();
