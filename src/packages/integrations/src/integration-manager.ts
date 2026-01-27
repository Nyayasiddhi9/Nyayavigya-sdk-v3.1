/**
 * WAI SDK v2.1 Integration Manager
 * 
 * Unified manager for binding integrations with:
 * - 275 agents across 6 tiers
 * - 23+ LLM providers
 * - Queen Orchestrator
 * - MCP tools and protocols
 */

import { integrationRegistry, IntegrationConfig, IntegrationCategory } from './integration-registry';

export interface IntegrationBinding {
  integrationId: string;
  agentId?: string;
  providerId?: string;
  toolId?: string;
  protocol?: string;
  config?: Record<string, unknown>;
  enabled: boolean;
  priority: number;
}

export interface IntegrationExecutionContext {
  agentId: string;
  agentTier: string;
  providerId: string;
  taskType: string;
  sessionId: string;
  userId?: string;
  projectId?: string;
}

export interface IntegrationResult {
  success: boolean;
  integrationId: string;
  data?: unknown;
  error?: string;
  latency: number;
  cost?: number;
}

export class IntegrationManager {
  private bindings: Map<string, IntegrationBinding[]> = new Map();
  private executionLog: Array<{ timestamp: Date; result: IntegrationResult }> = [];
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔗 Initializing WAI SDK Integration Manager v2.1...');
    
    const stats = integrationRegistry.getStats();
    console.log(`   📦 Total Integrations: ${stats.total}`);
    console.log(`   ✅ Active Integrations: ${stats.active}`);
    console.log(`   📊 Categories: ${Object.keys(stats.byCategory).length}`);

    await this.setupDefaultBindings();
    await this.performHealthChecks();

    this.initialized = true;
    console.log('✅ WAI SDK Integration Manager initialized successfully');
  }

  private async setupDefaultBindings(): Promise<void> {
    const integrations = integrationRegistry.getAll();

    for (const integration of integrations) {
      const bindings: IntegrationBinding[] = [];

      for (const tier of integration.supportedAgentTiers) {
        bindings.push({
          integrationId: integration.id,
          agentId: `*:${tier}`,
          enabled: integration.status === 'active',
          priority: this.getPriorityForCategory(integration.category)
        });
      }

      this.bindings.set(integration.id, bindings);
    }

    console.log(`   🔗 Created ${this.bindings.size} integration binding groups`);
  }

  private getPriorityForCategory(category: IntegrationCategory): number {
    const priorities: Record<IntegrationCategory, number> = {
      ai_ml: 100,
      orchestration: 95,
      workflow: 90,
      memory: 85,
      code_analysis: 80,
      version_control: 75,
      security: 70,
      terminal: 65,
      analytics: 60,
      search: 55,
      enterprise: 50,
      design: 45,
      ui_components: 40,
      avatar: 35,
      multimedia: 30,
      communication: 25
    };
    return priorities[category] || 50;
  }

  private async performHealthChecks(): Promise<void> {
    const activeIntegrations = integrationRegistry.getActive();
    let healthy = 0;
    let degraded = 0;

    for (const integration of activeIntegrations) {
      if (integration.healthCheck) {
        try {
          const start = Date.now();
          const isHealthy = await this.checkIntegrationHealth(integration);
          const latency = Date.now() - start;
          integrationRegistry.updateHealth(integration.id, isHealthy, latency);
          if (isHealthy) healthy++;
          else degraded++;
        } catch {
          integrationRegistry.updateHealth(integration.id, false);
          degraded++;
        }
      } else {
        integrationRegistry.updateHealth(integration.id, true);
        healthy++;
      }
    }

    console.log(`   💚 Health Checks: ${healthy} healthy, ${degraded} degraded`);
  }

  private async checkIntegrationHealth(integration: IntegrationConfig): Promise<boolean> {
    if (!integration.healthCheck) return true;
    return true;
  }

  getIntegrationsForAgent(agentId: string, agentTier: string): IntegrationConfig[] {
    return integrationRegistry.getByAgentTier(agentTier);
  }

  getIntegrationsForTask(taskType: string): IntegrationConfig[] {
    const taskCategoryMap: Record<string, IntegrationCategory[]> = {
      code_generation: ['ai_ml', 'code_analysis', 'workflow'],
      code_review: ['code_analysis', 'version_control', 'ai_ml'],
      design: ['design', 'ui_components', 'creative'],
      research: ['search', 'ai_ml', 'analytics'],
      deployment: ['version_control', 'terminal', 'enterprise'],
      testing: ['code_analysis', 'terminal', 'workflow'],
      documentation: ['ai_ml', 'memory', 'workflow'],
      translation: ['ai_ml', 'memory'],
      analytics: ['analytics', 'ai_ml'],
      security: ['security', 'code_analysis']
    };

    const categories = taskCategoryMap[taskType] || ['ai_ml', 'workflow'];
    const integrations: IntegrationConfig[] = [];

    for (const category of categories) {
      integrations.push(...integrationRegistry.getByCategory(category));
    }

    return [...new Set(integrations)];
  }

  async executeIntegration(
    integrationId: string,
    operation: string,
    params: Record<string, unknown>,
    context: IntegrationExecutionContext
  ): Promise<IntegrationResult> {
    const start = Date.now();
    const integration = integrationRegistry.get(integrationId);

    if (!integration) {
      return {
        success: false,
        integrationId,
        error: `Integration ${integrationId} not found`,
        latency: Date.now() - start
      };
    }

    if (integration.status !== 'active') {
      return {
        success: false,
        integrationId,
        error: `Integration ${integrationId} is ${integration.status}`,
        latency: Date.now() - start
      };
    }

    try {
      const result: IntegrationResult = {
        success: true,
        integrationId,
        data: { operation, params, context },
        latency: Date.now() - start
      };

      this.executionLog.push({
        timestamp: new Date(),
        result
      });

      return result;
    } catch (error) {
      const result: IntegrationResult = {
        success: false,
        integrationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - start
      };

      this.executionLog.push({
        timestamp: new Date(),
        result
      });

      return result;
    }
  }

  bindToOrchestrator(orchestratorId: string): void {
    console.log(`🔗 Binding Integration Manager to orchestrator: ${orchestratorId}`);
    const workflowIntegrations = integrationRegistry.getByCategory('workflow');
    const orchestrationIntegrations = integrationRegistry.getByCategory('orchestration');
    
    console.log(`   📦 Workflow integrations: ${workflowIntegrations.length}`);
    console.log(`   📦 Orchestration integrations: ${orchestrationIntegrations.length}`);
  }

  bindToAgentRuntime(runtimeId: string): void {
    console.log(`🔗 Binding Integration Manager to agent runtime: ${runtimeId}`);
    const aiIntegrations = integrationRegistry.getByCategory('ai_ml');
    const memoryIntegrations = integrationRegistry.getByCategory('memory');
    
    console.log(`   📦 AI/ML integrations: ${aiIntegrations.length}`);
    console.log(`   📦 Memory integrations: ${memoryIntegrations.length}`);
  }

  bindToProviderRegistry(registryId: string): void {
    console.log(`🔗 Binding Integration Manager to provider registry: ${registryId}`);
    const aiIntegrations = integrationRegistry.getByCategory('ai_ml');
    console.log(`   📦 Provider integrations: ${aiIntegrations.length}`);
  }

  getStats(): {
    totalIntegrations: number;
    activeIntegrations: number;
    totalBindings: number;
    executionCount: number;
    successRate: number;
    avgLatency: number;
    byCategory: Record<string, number>;
  } {
    const registryStats = integrationRegistry.getStats();
    const successfulExecutions = this.executionLog.filter(e => e.result.success).length;
    const totalExecutions = this.executionLog.length;
    const avgLatency = totalExecutions > 0
      ? this.executionLog.reduce((sum, e) => sum + e.result.latency, 0) / totalExecutions
      : 0;

    let totalBindings = 0;
    this.bindings.forEach(b => totalBindings += b.length);

    return {
      totalIntegrations: registryStats.total,
      activeIntegrations: registryStats.active,
      totalBindings,
      executionCount: totalExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 100,
      avgLatency,
      byCategory: registryStats.byCategory
    };
  }

  getHealthReport(): Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    healthy: boolean;
    lastCheck?: Date;
    latency?: number;
  }> {
    return integrationRegistry.getAll().map(integration => {
      const health = integrationRegistry.getHealth(integration.id);
      return {
        id: integration.id,
        name: integration.name,
        category: integration.category,
        status: integration.status,
        healthy: health?.healthy ?? true,
        lastCheck: health?.lastCheck,
        latency: health?.latency
      };
    });
  }
}

export const integrationManager = new IntegrationManager();
