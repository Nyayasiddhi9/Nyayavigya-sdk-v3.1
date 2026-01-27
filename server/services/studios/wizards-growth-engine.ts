import { db } from "../../db";
import { wizardsStudioSessions, wizardsStudioTasks, wizardsArtifacts } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { InsertWizardsStudioTask, InsertWizardsArtifact } from "@shared/schema";
import { wizardsOrchestrationService } from "../wizards-orchestration-service";
import { wizardsStudioEngineService } from "../wizards-studio-engine";
import type { OrchestrationRequest, Priority } from "@shared/wizards-incubator-types";

export class WizardsGrowthEngineService {
  async generateMarketingStrategy(
    startupId: number,
    sessionId: number | null,
    targetAudience: string,
    options?: {
      budget?: string;
      channels?: string[];
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      'growth-engine',
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    console.log(`🚀 [Growth Engine Service] Generating marketing strategy`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'growth-engine',
      sessionId: activeSession.id,
      startupId,
      taskType: 'marketing_strategy',
      status: 'in_progress',
      inputs: { targetAudience, budget: options?.budget, channels: options?.channels },
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
        prompt: `Create comprehensive growth marketing strategy for target audience: ${targetAudience}
        
Budget: ${options?.budget || 'Not specified'}
Channels: ${options?.channels?.join(', ') || 'All channels'}`,
        strategyType: 'marketing',
        targetAudience,
        budget: options?.budget,
        channels: options?.channels,
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
      studioType: 'growth-engine',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract strategy
    const strategy = {
      targetAudience,
      channels: Array.isArray(orchestrationResult.outputs?.channels) ? orchestrationResult.outputs.channels : (options?.channels ?? ['Social Media', 'Content Marketing']),
      budget: orchestrationResult.outputs?.budget ?? options?.budget ?? 'Not specified',
      tactics: orchestrationResult.outputs?.tactics ?? orchestrationResult.result ?? 'Comprehensive marketing strategy',
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'growth-engine',
      artifactType: 'marketing_strategy',
      name: 'Marketing Strategy',
      content: strategy,
      metadata: {
        targetAudience,
        budget: options?.budget,
        channels: options?.channels,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Mark task as completed
    await db
      .update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: strategy,
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Growth Engine Service] Marketing strategy generated`, {
      taskId: task.id,
      artifactId: artifact.id,
    });

    return {
      strategy,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

  async generateSEOStrategy(
    startupId: number,
    sessionId: number | null,
    productDescription: string,
    options?: {
      targetKeywords?: string[];
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      'growth-engine',
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    console.log(`🚀 [Growth Engine Service] Generating SEO strategy`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'growth-engine',
      sessionId: activeSession.id,
      startupId,
      taskType: 'seo_strategy',
      status: 'in_progress',
      inputs: { productDescription, targetKeywords: options?.targetKeywords },
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
        prompt: `Create comprehensive SEO strategy for product: ${productDescription}
        
Target Keywords: ${options?.targetKeywords?.join(', ') || 'Not specified'}`,
        strategyType: 'seo',
        productDescription,
        targetKeywords: options?.targetKeywords,
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
      studioType: 'growth-engine',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract strategy
    const strategy = {
      productDescription,
      targetKeywords: options?.targetKeywords || [],
      onPageSEO: orchestrationResult.result || 'Comprehensive SEO strategy',
      technicalSEO: 'Technical optimization recommendations',
      contentStrategy: 'Content optimization plan',
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'growth-engine',
      artifactType: 'seo_strategy',
      name: 'SEO Strategy',
      content: strategy,
      metadata: {
        productDescription,
        targetKeywords: options?.targetKeywords,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Mark task as completed
    await db
      .update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: strategy,
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Growth Engine Service] SEO strategy generated`, {
      taskId: task.id,
      artifactId: artifact.id,
    });

    return {
      strategy,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

  async generateGrowthHacking(startupId: number, sessionId: number | null, startupContext: any, options?: { aguiSessionId?: string; deterministicMode?: boolean; clockSeed?: string }) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      'growth-engine',
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const task: InsertWizardsStudioTask = {
      sessionId: activeSession.id,
      workflowName: "Growth Hacking",
      title: "Generate Growth Hacking Tactics",
      description: "Identifying creative growth hacking opportunities and viral loops",
      status: "pending",
      priority: "high",
      estimatedMinutes: 40
    };

    const [createdTask] = await db.insert(wizardsStudioTasks).values(task).returning();

    try {
      await db.update(wizardsStudioTasks)
        .set({ status: "in_progress" })
        .where(eq(wizardsStudioTasks.id, createdTask.id));

      const orchestrationResult = await wizardsOrchestrationService.runOrchestration({
        agentType: "growth_hacker",
        taskDescription: `Design creative growth hacking tactics for: ${startupContext.name || "startup"}`,
        context: {
          startup: startupContext,
          workflow: "Growth Hacking",
          studio: "Growth Engine",
          studioType: "growth-engine",
          aguiSessionId: options?.aguiSessionId
        }
      });

      const artifact: InsertWizardsArtifact = {
        sessionId: activeSession.id,
        taskId: createdTask.id,
        type: "growth_tactics",
        title: "Growth Hacking Playbook",
        description: "Creative growth tactics, viral loops, and acquisition experiments",
        content: JSON.stringify(orchestrationResult),
        metadata: {
          generatedBy: "growth_hacker",
          tactics: ["referral_program", "viral_loops", "product_hunt", "community_building"],
          experiments: 15
        }
      };

      const [createdArtifact] = await db.insert(wizardsArtifacts).values(artifact).returning();

      await db.update(wizardsStudioTasks)
        .set({ 
          status: "completed",
          completedAt: new Date()
        })
        .where(eq(wizardsStudioTasks.id, createdTask.id));

      return {
        task: createdTask,
        artifact: createdArtifact,
        orchestrationResult,
        sessionId: activeSession.id
      };
    } catch (error) {
      await db.update(wizardsStudioTasks)
        .set({ status: "failed" })
        .where(eq(wizardsStudioTasks.id, createdTask.id));
      throw error;
    }
  }

  async generateContentMarketing(startupId: number, sessionId: number | null, startupContext: any, options?: { aguiSessionId?: string; deterministicMode?: boolean; clockSeed?: string }) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      'growth-engine',
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const task: InsertWizardsStudioTask = {
      sessionId: activeSession.id,
      workflowName: "Content Marketing",
      title: "Generate Content Marketing Strategy",
      description: "Creating comprehensive content marketing plan with topics, formats, and distribution channels",
      status: "pending",
      priority: "high",
      estimatedMinutes: 35
    };

    const [createdTask] = await db.insert(wizardsStudioTasks).values(task).returning();

    try {
      await db.update(wizardsStudioTasks)
        .set({ status: "in_progress" })
        .where(eq(wizardsStudioTasks.id, createdTask.id));

      const orchestrationResult = await wizardsOrchestrationService.runOrchestration({
        agentType: "content_strategist",
        taskDescription: `Create comprehensive content marketing strategy for: ${startupContext.name || "startup"}`,
        context: {
          startup: startupContext,
          workflow: "Content Marketing",
          studio: "Growth Engine",
          studioType: "growth-engine",
          aguiSessionId: options?.aguiSessionId
        }
      });

      const artifact: InsertWizardsArtifact = {
        sessionId: activeSession.id,
        taskId: createdTask.id,
        type: "content_strategy",
        title: "Content Marketing Strategy",
        description: "Comprehensive content marketing plan with topics, formats, and distribution strategy",
        content: JSON.stringify(orchestrationResult),
        metadata: {
          generatedBy: "content_strategist",
          formats: ["blog", "video", "podcast", "infographics", "case_studies"],
          channels: ["website", "social_media", "email", "youtube"]
        }
      };

      const [createdArtifact] = await db.insert(wizardsArtifacts).values(artifact).returning();

      await db.update(wizardsStudioTasks)
        .set({ 
          status: "completed",
          completedAt: new Date()
        })
        .where(eq(wizardsStudioTasks.id, createdTask.id));

      return {
        task: createdTask,
        artifact: createdArtifact,
        orchestrationResult,
        sessionId: activeSession.id
      };
    } catch (error) {
      await db.update(wizardsStudioTasks)
        .set({ status: "failed" })
        .where(eq(wizardsStudioTasks.id, createdTask.id));
      throw error;
    }
  }
}

export const wizardsGrowthEngineService = new WizardsGrowthEngineService();
