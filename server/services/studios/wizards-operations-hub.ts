import { db } from "../../db";
import { wizardsStudioTasks, wizardsArtifacts } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { wizardsOrchestrationService } from "../wizards-orchestration-service";
import { wizardsStudioEngineService } from "../wizards-studio-engine";
import type { OrchestrationRequest, Priority } from "@shared/wizards-incubator-types";

export class WizardsOperationsHubService {
  async generateAnalyticsDashboard(
    startupId: number,
    sessionId: number | null,
    metrics: string[],
    options?: {
      analyticsTools?: string;
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    const session = sessionId ? await wizardsStudioEngineService.getSession(sessionId) : null;
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(startupId, 'operations-hub', { deterministicMode: options?.deterministicMode, clockSeed: options?.clockSeed });
    
    console.log(`📊 [Operations Hub Service] Generating analytics dashboard`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'operations-hub',
      sessionId: activeSession.id,
      startupId,
      taskType: 'analytics_dashboard',
      status: 'in_progress',
      inputs: { metrics, analyticsTools: options?.analyticsTools },
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'generation',
      workflow: 'sequential',
      inputs: {
        prompt: `Generate analytics dashboard for metrics: ${metrics.join(', ')}
        
Analytics Tools: ${options?.analyticsTools || 'Not specified'}`,
        dashboardType: 'analytics',
        metrics,
        analyticsTools: options?.analyticsTools,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 600,
        maxCredits: 300,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'operations-hub',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract dashboard
    const dashboard = {
      metrics: Array.isArray(orchestrationResult.outputs?.metrics) ? orchestrationResult.outputs.metrics : metrics,
      analyticsTools: orchestrationResult.outputs?.analyticsTools ?? options?.analyticsTools ?? 'Not specified',
      insights: orchestrationResult.outputs?.insights ?? orchestrationResult.result ?? 'Analytics dashboard with key metrics',
      visualizations: Array.isArray(orchestrationResult.outputs?.visualizations) ? orchestrationResult.outputs.visualizations : metrics.map(m => ({ metric: m, chart: 'Line Chart' })),
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'operations-hub',
      artifactType: 'analytics_dashboard',
      name: 'Analytics Dashboard',
      content: dashboard,
      metadata: {
        metrics,
        analyticsTools: options?.analyticsTools,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Mark task as completed
    await db
      .update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: dashboard,
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Operations Hub Service] Analytics dashboard generated`, {
      taskId: task.id,
      artifactId: artifact.id,
    });

    return {
      dashboard,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

  async optimizeProcesses(
    startupId: number,
    sessionId: number | null,
    processDescription: string,
    options?: {
      focus?: string;
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    const session = sessionId ? await wizardsStudioEngineService.getSession(sessionId) : null;
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(startupId, 'operations-hub', { deterministicMode: options?.deterministicMode, clockSeed: options?.clockSeed });
    
    console.log(`📊 [Operations Hub Service] Optimizing processes`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'operations-hub',
      sessionId: activeSession.id,
      startupId,
      taskType: 'process_optimization',
      status: 'in_progress',
      inputs: { processDescription, focus: options?.focus },
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'optimization',
      workflow: 'sequential',
      inputs: {
        prompt: `Optimize processes: ${processDescription}
        
Focus Area: ${options?.focus || 'General optimization'}`,
        optimizationType: 'process',
        processDescription,
        focus: options?.focus,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 600,
        maxCredits: 300,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'operations-hub',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract optimization
    const optimization = {
      processDescription,
      focus: options?.focus || 'General optimization',
      recommendations: orchestrationResult.result || 'Process optimization recommendations',
      automationOpportunities: ['Workflow automation', 'Data integration'],
      expectedImpact: 'Improved efficiency and reduced costs',
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'operations-hub',
      artifactType: 'process_optimization',
      name: 'Process Optimization',
      content: optimization,
      metadata: {
        processDescription,
        focus: options?.focus,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Mark task as completed
    await db
      .update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: optimization,
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Operations Hub Service] Process optimization completed`, {
      taskId: task.id,
      artifactId: artifact.id,
    });

    return {
      optimization,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

  async generateContinuousImprovement(
    startupId: number,
    sessionId: number | null,
    startupContext: {
      feedbackData?: string;
      improvementAreas?: string;
      successMetrics?: string;
      iterationCycle?: string;
    },
    options?: {
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    const session = sessionId ? await wizardsStudioEngineService.getSession(sessionId) : null;
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(startupId, 'operations-hub', { deterministicMode: options?.deterministicMode, clockSeed: options?.clockSeed });
    
    console.log(`📊 [Operations Hub Service] Generating continuous improvement framework`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'operations-hub',
      sessionId: activeSession.id,
      startupId,
      taskType: 'continuous_improvement',
      status: 'in_progress',
      inputs: startupContext,
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'generation',
      workflow: 'sequential',
      inputs: {
        prompt: `Design continuous improvement framework with feedback loops and iterative enhancements
        
Feedback Data: ${startupContext.feedbackData || 'User and stakeholder feedback'}
Improvement Areas: ${startupContext.improvementAreas || 'Product quality, user experience, operations'}
Success Metrics: ${startupContext.successMetrics || 'Customer satisfaction, efficiency, quality'}
Iteration Cycle: ${startupContext.iterationCycle || 'Bi-weekly sprints'}`,
        frameworkType: 'continuous_improvement',
        ...startupContext,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 600,
        maxCredits: 300,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'operations-hub',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract framework
    const framework = {
      feedbackData: startupContext.feedbackData || 'User and stakeholder feedback',
      improvementAreas: startupContext.improvementAreas || 'Product quality, user experience, operations',
      successMetrics: startupContext.successMetrics || 'Customer satisfaction, efficiency, quality',
      iterationCycle: startupContext.iterationCycle || 'Bi-weekly sprints',
      recommendations: orchestrationResult.result || 'Continuous improvement framework with action plans',
      actionPlans: ['Implement feedback collection', 'Track improvement metrics', 'Regular review cycles'],
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'operations-hub',
      artifactType: 'continuous_improvement',
      name: 'Continuous Improvement Framework',
      content: framework,
      metadata: {
        ...startupContext,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Mark task as completed
    await db
      .update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: framework,
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Operations Hub Service] Continuous improvement framework generated`, {
      taskId: task.id,
      artifactId: artifact.id,
    });

    return {
      framework,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

  async generateResourceAllocation(
    startupId: number,
    sessionId: number | null,
    startupContext: {
      availableResources?: string;
      demandForecasts?: string;
      priorities?: string;
      constraints?: string;
    },
    options?: {
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    const session = sessionId ? await wizardsStudioEngineService.getSession(sessionId) : null;
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(startupId, 'operations-hub', { deterministicMode: options?.deterministicMode, clockSeed: options?.clockSeed });
    
    console.log(`📊 [Operations Hub Service] Generating resource allocation plan`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'operations-hub',
      sessionId: activeSession.id,
      startupId,
      taskType: 'resource_allocation',
      status: 'in_progress',
      inputs: startupContext,
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'optimization',
      workflow: 'sequential',
      inputs: {
        prompt: `Optimize resource allocation and capacity planning for maximum operational efficiency
        
Available Resources: ${startupContext.availableResources || 'Team, budget, infrastructure'}
Demand Forecasts: ${startupContext.demandForecasts || 'Historical data and projections'}
Priorities: ${startupContext.priorities || 'Critical projects and initiatives'}
Constraints: ${startupContext.constraints || 'Budget limits, team capacity'}`,
        planType: 'resource_allocation',
        ...startupContext,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 600,
        maxCredits: 300,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'operations-hub',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract plan
    const plan = {
      availableResources: startupContext.availableResources || 'Team, budget, infrastructure',
      demandForecasts: startupContext.demandForecasts || 'Historical data and projections',
      priorities: startupContext.priorities || 'Critical projects and initiatives',
      constraints: startupContext.constraints || 'Budget limits, team capacity',
      recommendations: orchestrationResult.result || 'Resource allocation plan with capacity forecasts',
      allocationStrategy: 'Priority-based resource distribution with capacity optimization',
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'operations-hub',
      artifactType: 'resource_allocation',
      name: 'Resource Allocation Plan',
      content: plan,
      metadata: {
        ...startupContext,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Mark task as completed
    await db
      .update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: plan,
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Operations Hub Service] Resource allocation plan generated`, {
      taskId: task.id,
      artifactId: artifact.id,
    });

    return {
      plan,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }
}

export const wizardsOperationsHubService = new WizardsOperationsHubService();
