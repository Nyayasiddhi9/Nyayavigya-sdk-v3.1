import { db } from "../../db";
import { wizardsStudioTasks, wizardsArtifacts } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { wizardsOrchestrationService } from "../wizards-orchestration-service";
import { wizardsStudioEngineService } from "../wizards-studio-engine";
import type { OrchestrationRequest, Priority } from "@shared/wizards-incubator-types";

export class WizardsDeploymentStudioService {
  async generateCloudDeployment(
    startupId: number,
    sessionId: number | null,
    options?: {
      provider?: string;
      services?: string[];
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    const session = sessionId ? await wizardsStudioEngineService.getSession(sessionId) : null;
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(startupId, 'deployment-studio', { deterministicMode: options?.deterministicMode, clockSeed: options?.clockSeed });
    
    console.log(`🚀 [Deployment Studio Service] Generating cloud deployment`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'deployment-studio',
      sessionId: activeSession.id,
      startupId,
      taskType: 'cloud_deployment',
      status: 'in_progress',
      inputs: { provider: options?.provider, services: options?.services },
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'deployment',
      workflow: 'sequential',
      inputs: {
        prompt: `Generate cloud deployment configuration for provider: ${options?.provider || 'AWS'}
        
Services: ${options?.services?.join(', ') || 'Standard services'}`,
        deploymentType: 'cloud',
        provider: options?.provider,
        services: options?.services,
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
      studioType: 'deployment-studio',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract deployment config
    const deployment = {
      provider: orchestrationResult.outputs?.provider ?? options?.provider ?? 'AWS',
      services: Array.isArray(orchestrationResult.outputs?.services) ? orchestrationResult.outputs.services : (options?.services ?? []),
      configuration: orchestrationResult.outputs?.configuration ?? orchestrationResult.result ?? 'Cloud deployment configuration',
      infrastructure: orchestrationResult.outputs?.infrastructure ?? 'Infrastructure as Code templates',
      securitySettings: orchestrationResult.outputs?.securitySettings ?? 'Security best practices applied',
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'deployment-studio',
      artifactType: 'cloud_deployment',
      name: 'Cloud Deployment Configuration',
      content: deployment,
      metadata: {
        provider: options?.provider,
        services: options?.services,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Mark task as completed
    await db
      .update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: deployment,
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Deployment Studio Service] Cloud deployment generated`, {
      taskId: task.id,
      artifactId: artifact.id,
    });

    return {
      deployment,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

  async generateCICDPipeline(
    startupId: number,
    sessionId: number | null,
    options?: {
      provider?: string;
      stages?: string[];
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    const session = sessionId ? await wizardsStudioEngineService.getSession(sessionId) : null;
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(startupId, 'deployment-studio', { deterministicMode: options?.deterministicMode, clockSeed: options?.clockSeed });
    
    console.log(`🚀 [Deployment Studio Service] Generating CI/CD pipeline`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'deployment-studio',
      sessionId: activeSession.id,
      startupId,
      taskType: 'cicd_pipeline',
      status: 'in_progress',
      inputs: { provider: options?.provider, stages: options?.stages },
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'deployment',
      workflow: 'sequential',
      inputs: {
        prompt: `Generate CI/CD pipeline configuration for provider: ${options?.provider || 'GitHub Actions'}
        
Stages: ${options?.stages?.join(', ') || 'Build, Test, Deploy'}`,
        pipelineType: 'cicd',
        provider: options?.provider,
        stages: options?.stages,
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
      studioType: 'deployment-studio',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract pipeline config
    const pipeline = {
      provider: options?.provider || 'GitHub Actions',
      stages: options?.stages || ['Build', 'Test', 'Deploy'],
      configuration: orchestrationResult.result || 'CI/CD pipeline configuration',
      automatedTesting: 'Automated testing enabled',
      deploymentStrategy: 'Blue-green deployment',
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'deployment-studio',
      artifactType: 'cicd_pipeline',
      name: 'CI/CD Pipeline Configuration',
      content: pipeline,
      metadata: {
        provider: options?.provider,
        stages: options?.stages,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Mark task as completed
    await db
      .update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: pipeline,
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Deployment Studio Service] CI/CD pipeline generated`, {
      taskId: task.id,
      artifactId: artifact.id,
    });

    return {
      pipeline,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

  async generateDomainConfiguration(
    startupId: number,
    sessionId: number | null,
    startupContext: {
      domainName?: string;
      provider?: string;
      sslSetup?: string;
      dnsRecords?: string;
    },
    options?: {
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    const session = sessionId ? await wizardsStudioEngineService.getSession(sessionId) : null;
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(startupId, 'deployment-studio', { deterministicMode: options?.deterministicMode, clockSeed: options?.clockSeed });
    
    console.log(`🚀 [Deployment Studio Service] Generating domain configuration`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'deployment-studio',
      sessionId: activeSession.id,
      startupId,
      taskType: 'domain_configuration',
      status: 'in_progress',
      inputs: startupContext,
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'deployment',
      workflow: 'sequential',
      inputs: {
        prompt: `Configure custom domain with SSL certificates and DNS settings
        
Domain Name: ${startupContext.domainName || 'yourstartup.com'}
Provider: ${startupContext.provider || 'Cloudflare'}
SSL Setup: ${startupContext.sslSetup || "Auto SSL with Let's Encrypt"}
DNS Records: ${startupContext.dnsRecords || 'A, CNAME, MX records'}`,
        configurationType: 'domain',
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
      studioType: 'deployment-studio',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract configuration
    const configuration = {
      domainName: startupContext.domainName || 'yourstartup.com',
      provider: startupContext.provider || 'Cloudflare',
      sslSetup: startupContext.sslSetup || "Auto SSL with Let's Encrypt",
      dnsRecords: startupContext.dnsRecords || 'A, CNAME, MX records',
      guide: orchestrationResult.result || 'Domain configuration guide',
      steps: ['DNS setup', 'SSL certificate installation', 'Domain verification'],
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'deployment-studio',
      artifactType: 'domain_configuration',
      name: 'Domain Configuration Guide',
      content: configuration,
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
        outputs: configuration,
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Deployment Studio Service] Domain configuration generated`, {
      taskId: task.id,
      artifactId: artifact.id,
    });

    return {
      configuration,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }

  async generateMonitoringSetup(
    startupId: number,
    sessionId: number | null,
    startupContext: {
      platform?: string;
      metricsToTrack?: string;
      alertingRules?: string;
      dashboardRequirements?: string;
    },
    options?: {
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    const session = sessionId ? await wizardsStudioEngineService.getSession(sessionId) : null;
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(startupId, 'deployment-studio', { deterministicMode: options?.deterministicMode, clockSeed: options?.clockSeed });
    
    console.log(`🚀 [Deployment Studio Service] Generating monitoring setup`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'deployment-studio',
      sessionId: activeSession.id,
      startupId,
      taskType: 'monitoring_setup',
      status: 'in_progress',
      inputs: startupContext,
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'deployment',
      workflow: 'sequential',
      inputs: {
        prompt: `Configure production monitoring, logging, and alerting infrastructure
        
Platform: ${startupContext.platform || 'Datadog / New Relic / Prometheus'}
Metrics to Track: ${startupContext.metricsToTrack || 'Response time, Error rate, CPU/Memory, Custom business metrics'}
Alerting Rules: ${startupContext.alertingRules || 'Error spike alerts, Performance degradation, Availability monitoring'}
Dashboard Requirements: ${startupContext.dashboardRequirements || 'Real-time metrics dashboard, Performance analytics, Error tracking'}`,
        setupType: 'monitoring',
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
      studioType: 'deployment-studio',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract monitoring setup
    const monitoring = {
      platform: startupContext.platform || 'Datadog / New Relic / Prometheus',
      metricsToTrack: startupContext.metricsToTrack || 'Response time, Error rate, CPU/Memory, Custom business metrics',
      alertingRules: startupContext.alertingRules || 'Error spike alerts, Performance degradation, Availability monitoring',
      dashboardRequirements: startupContext.dashboardRequirements || 'Real-time metrics dashboard, Performance analytics, Error tracking',
      configuration: orchestrationResult.result || 'Production monitoring setup',
      integrations: ['Application monitoring', 'Infrastructure monitoring', 'Log aggregation'],
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'deployment-studio',
      artifactType: 'monitoring_setup',
      name: 'Production Monitoring Setup',
      content: monitoring,
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
        outputs: monitoring,
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [Deployment Studio Service] Monitoring setup generated`, {
      taskId: task.id,
      artifactId: artifact.id,
    });

    return {
      monitoring,
      taskId: task.id,
      artifactId: artifact.id,
      sessionId: activeSession.id,
    };
  }
}

export const wizardsDeploymentStudioService = new WizardsDeploymentStudioService();
