/**
 * On-Demand Agent Loader - Performance Optimization System
 * 
 * This service implements intelligent agent loading to reduce startup time
 * and memory consumption. Agents are loaded only when needed and unloaded
 * when idle to optimize resource usage.
 * 
 * Key Features:
 * - Lazy loading of agents based on user requests
 * - Intelligent memory management with automatic cleanup
 * - Performance monitoring and optimization
 * - Integration with WAI orchestration system
 */

import { EventEmitter } from 'events';
import { db } from '../db';
import { agentLoadingSystem, performanceMetrics } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface AgentConfig {
  agentId: string;
  agentType: string;
  loadingStrategy: 'startup' | 'on_demand' | 'lazy' | 'cached';
  memoryLimit: number; // MB
  cpuLimit: number; // percentage
  keepAliveTime: number; // seconds
  dependencies: string[];
  initializationFunction: () => Promise<any>;
  cleanupFunction?: () => Promise<void>;
}

export interface LoadedAgent {
  agentId: string;
  instance: any;
  loadedAt: Date;
  lastUsed: Date;
  memoryUsage: number;
  cpuUsage: number;
  sessionCount: number;
}

export interface ResourceUsage {
  totalMemory: number;
  totalCPU: number;
  agentCount: number;
  criticalAgents: string[];
  suggestions: string[];
}

export class OnDemandAgentLoader extends EventEmitter {
  private loadedAgents: Map<string, LoadedAgent> = new Map();
  private agentConfigs: Map<string, AgentConfig> = new Map();
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private performanceMonitorInterval: NodeJS.Timeout;
  private maxMemoryUsage = 2048; // MB - configurable limit
  private maxCpuUsage = 70; // percentage

  constructor() {
    super();
    this.initializeAgentConfigs();
    this.startCleanupMonitoring();
    this.startPerformanceMonitoring();
    console.log('🚀 On-Demand Agent Loader initialized');
  }

  /**
   * Register an agent configuration for on-demand loading
   */
  async registerAgent(config: AgentConfig): Promise<void> {
    this.agentConfigs.set(config.agentId, config);
    
    // Store in database for persistence
    await db.insert(agentLoadingSystem).values({
      agentId: config.agentId,
      agentType: config.agentType,
      loadingStrategy: config.loadingStrategy,
      keepAliveTime: config.keepAliveTime,
      dependencies: config.dependencies,
      resourceLimits: {
        memory: config.memoryLimit,
        cpu: config.cpuLimit
      }
    }).onConflictDoUpdate({
      target: agentLoadingSystem.agentId,
      set: {
        loadingStrategy: config.loadingStrategy,
        keepAliveTime: config.keepAliveTime,
        updatedAt: new Date()
      }
    });

    console.log(`📝 Registered agent: ${config.agentId} (${config.loadingStrategy})`);
  }

  /**
   * Load an agent on-demand with dependency resolution
   */
  async loadAgent(agentId: string): Promise<any> {
    try {
      // Check if already loaded
      if (this.loadedAgents.has(agentId)) {
        const agent = this.loadedAgents.get(agentId)!;
        agent.lastUsed = new Date();
        agent.sessionCount++;
        return agent.instance;
      }

      // Check if currently loading
      if (this.loadingQueue.has(agentId)) {
        return await this.loadingQueue.get(agentId);
      }

      // Get agent configuration
      const config = this.agentConfigs.get(agentId);
      if (!config) {
        throw new Error(`Agent configuration not found: ${agentId}`);
      }

      // Check resource limits before loading
      await this.checkResourceLimits(config);

      // Start loading process
      const loadingPromise = this.performAgentLoading(config);
      this.loadingQueue.set(agentId, loadingPromise);

      try {
        const instance = await loadingPromise;
        this.loadingQueue.delete(agentId);

        // Store loaded agent
        const loadedAgent: LoadedAgent = {
          agentId,
          instance,
          loadedAt: new Date(),
          lastUsed: new Date(),
          memoryUsage: await this.calculateMemoryUsage(agentId),
          cpuUsage: 0,
          sessionCount: 1
        };

        this.loadedAgents.set(agentId, loadedAgent);

        // Update database
        await this.updateAgentStatus(agentId, true);

        console.log(`✅ Agent loaded: ${agentId}`);
        this.emit('agentLoaded', { agentId, memoryUsage: loadedAgent.memoryUsage });

        return instance;

      } catch (error) {
        this.loadingQueue.delete(agentId);
        throw error;
      }

    } catch (error) {
      console.error(`❌ Failed to load agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Unload an agent to free resources
   */
  async unloadAgent(agentId: string): Promise<void> {
    try {
      const loadedAgent = this.loadedAgents.get(agentId);
      if (!loadedAgent) {
        return;
      }

      const config = this.agentConfigs.get(agentId);
      if (config?.cleanupFunction) {
        await config.cleanupFunction();
      }

      this.loadedAgents.delete(agentId);
      await this.updateAgentStatus(agentId, false);

      console.log(`🗑️ Agent unloaded: ${agentId}`);
      this.emit('agentUnloaded', { agentId, memoryFreed: loadedAgent.memoryUsage });

    } catch (error) {
      console.error(`❌ Failed to unload agent ${agentId}:`, error);
    }
  }

  /**
   * Get agent instance (load if not already loaded)
   */
  async getAgent(agentId: string): Promise<any> {
    return await this.loadAgent(agentId);
  }

  /**
   * Get current resource usage statistics
   */
  async getResourceUsage(): Promise<ResourceUsage> {
    const agents = Array.from(this.loadedAgents.values());
    const totalMemory = agents.reduce((sum, agent) => sum + agent.memoryUsage, 0);
    const totalCPU = agents.reduce((sum, agent) => sum + agent.cpuUsage, 0);
    
    const criticalAgents = agents
      .filter(agent => agent.memoryUsage > 200 || agent.cpuUsage > 15)
      .map(agent => agent.agentId);

    const suggestions = [];
    if (totalMemory > this.maxMemoryUsage * 0.8) {
      suggestions.push('Consider unloading inactive agents to reduce memory usage');
    }
    if (totalCPU > this.maxCpuUsage * 0.8) {
      suggestions.push('High CPU usage detected - review agent efficiency');
    }
    if (agents.length > 20) {
      suggestions.push('Many agents loaded - implement more aggressive cleanup');
    }

    return {
      totalMemory,
      totalCPU,
      agentCount: agents.length,
      criticalAgents,
      suggestions
    };
  }

  /**
   * Force cleanup of inactive agents
   */
  async forceCleanup(): Promise<void> {
    const now = new Date();
    const agentsToUnload: string[] = [];

    for (const [agentId, agent] of this.loadedAgents) {
      const config = this.agentConfigs.get(agentId);
      if (!config) continue;

      const idleTime = now.getTime() - agent.lastUsed.getTime();
      if (idleTime > config.keepAliveTime * 1000) {
        agentsToUnload.push(agentId);
      }
    }

    console.log(`🧹 Force cleanup: unloading ${agentsToUnload.length} idle agents`);
    
    for (const agentId of agentsToUnload) {
      await this.unloadAgent(agentId);
    }
  }

  /**
   * Initialize default agent configurations
   */
  private initializeAgentConfigs(): void {
    // Development agents - load on demand
    this.registerAgent({
      agentId: 'fullstack-developer',
      agentType: 'development',
      loadingStrategy: 'on_demand',
      memoryLimit: 150,
      cpuLimit: 10,
      keepAliveTime: 600, // 10 minutes
      dependencies: ['llm-router', 'code-analyzer'],
      initializationFunction: async () => {
        const { FullstackDeveloper } = await import('../agents/fullstack-developer-implementation');
        return new FullstackDeveloper();
      }
    });

    // Creative agents - lazy load
    this.registerAgent({
      agentId: 'content-creator',
      agentType: 'creative',
      loadingStrategy: 'lazy',
      memoryLimit: 100,
      cpuLimit: 8,
      keepAliveTime: 300, // 5 minutes
      dependencies: ['media-processor'],
      initializationFunction: async () => {
        const { ContentCreationService } = await import('./content-generation');
        return new ContentCreationService();
      }
    });

    // Enterprise agents - cached
    this.registerAgent({
      agentId: 'enterprise-orchestrator',
      agentType: 'enterprise',
      loadingStrategy: 'cached',
      memoryLimit: 200,
      cpuLimit: 12,
      keepAliveTime: 1800, // 30 minutes
      dependencies: ['security-manager', 'compliance-checker'],
      initializationFunction: async () => {
        const { EnterpriseOrchestrator } = await import('./devsphere-enterprise-agents');
        return new EnterpriseOrchestrator();
      }
    });

    // Core agents - startup (minimal set)
    this.registerAgent({
      agentId: 'wai-orchestrator',
      agentType: 'core',
      loadingStrategy: 'startup',
      memoryLimit: 300,
      cpuLimit: 15,
      keepAliveTime: 3600, // 1 hour
      dependencies: [],
      initializationFunction: async () => {
        const { unifiedWAIOrchestration } = await import('./unified-wai-orchestration-complete');
        return unifiedWAIOrchestration;
      }
    });
  }

  /**
   * Perform actual agent loading with dependency resolution
   */
  private async performAgentLoading(config: AgentConfig): Promise<any> {
    const startTime = Date.now();

    // Load dependencies first
    for (const depId of config.dependencies) {
      if (!this.loadedAgents.has(depId)) {
        await this.loadAgent(depId);
      }
    }

    // Initialize the agent
    const instance = await config.initializationFunction();
    
    const initTime = Date.now() - startTime;
    
    // Record performance metrics
    await db.insert(performanceMetrics).values({
      metricType: 'initialization_time',
      component: 'agent',
      componentId: config.agentId,
      value: initTime,
      unit: 'milliseconds',
      tags: { agentType: config.agentType }
    });

    return instance;
  }

  /**
   * Check if we have enough resources to load the agent
   */
  private async checkResourceLimits(config: AgentConfig): Promise<void> {
    const currentUsage = await this.getResourceUsage();
    
    if (currentUsage.totalMemory + config.memoryLimit > this.maxMemoryUsage) {
      // Try to free some memory by unloading idle agents
      await this.forceCleanup();
      
      const newUsage = await this.getResourceUsage();
      if (newUsage.totalMemory + config.memoryLimit > this.maxMemoryUsage) {
        throw new Error(`Insufficient memory to load agent ${config.agentId}`);
      }
    }
  }

  /**
   * Calculate memory usage for an agent (simplified)
   */
  private async calculateMemoryUsage(agentId: string): Promise<number> {
    // This would ideally use process.memoryUsage() or similar
    // For now, return estimated usage based on agent type
    const config = this.agentConfigs.get(agentId);
    return config?.memoryLimit || 50;
  }

  /**
   * Update agent status in database
   */
  private async updateAgentStatus(agentId: string, isLoaded: boolean): Promise<void> {
    await db.update(agentLoadingSystem)
      .set({
        isLoaded,
        loadCount: isLoaded ? 
          db.select({ count: agentLoadingSystem.loadCount }).from(agentLoadingSystem).where(eq(agentLoadingSystem.agentId, agentId)).then(r => (r[0]?.count || 0) + 1) :
          undefined,
        unloadCount: !isLoaded ?
          db.select({ count: agentLoadingSystem.unloadCount }).from(agentLoadingSystem).where(eq(agentLoadingSystem.agentId, agentId)).then(r => (r[0]?.count || 0) + 1) :
          undefined,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(agentLoadingSystem.agentId, agentId));
  }

  /**
   * Start cleanup monitoring
   */
  private startCleanupMonitoring(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        const usage = await this.getResourceUsage();
        
        // Aggressive cleanup if memory usage is high
        if (usage.totalMemory > this.maxMemoryUsage * 0.8) {
          await this.forceCleanup();
        }
        
        // Regular cleanup of idle agents
        const now = new Date();
        for (const [agentId, agent] of this.loadedAgents) {
          const config = this.agentConfigs.get(agentId);
          if (!config) continue;

          const idleTime = now.getTime() - agent.lastUsed.getTime();
          if (idleTime > config.keepAliveTime * 1000) {
            await this.unloadAgent(agentId);
          }
        }
        
      } catch (error) {
        console.error('❌ Cleanup monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start performance monitoring
   * 
   * NOTE: Database persistence disabled until schema sync completes.
   * The performanceMetrics table exists in schema.ts but needs `npm run db:push --force`
   * to sync with the production database (currently timing out due to 219 tables).
   * 
   * For now, we emit events for real-time monitoring without DB persistence.
   */
  private startPerformanceMonitoring(): void {
    this.performanceMonitorInterval = setInterval(async () => {
      try {
        const usage = await this.getResourceUsage();
        
        // Emit performance update for real-time monitoring
        this.emit('performanceUpdate', usage);
        
        // TODO: Re-enable DB persistence after running `npm run db:push --force`
        // when schema sync timeout issue is resolved
        /*
        await db.insert(performanceMetrics).values([
          {
            metricType: 'memory',
            component: 'agent_system',
            componentId: 'total',
            value: String(usage.totalMemory),
            unit: 'MB',
            threshold: String(this.maxMemoryUsage * 0.8),
            criticalThreshold: String(this.maxMemoryUsage)
          },
          {
            metricType: 'cpu',
            component: 'agent_system',
            componentId: 'total',
            value: String(usage.totalCPU),
            unit: 'percentage',
            threshold: String(this.maxCpuUsage * 0.8),
            criticalThreshold: String(this.maxCpuUsage)
          },
          {
            metricType: 'agent_count',
            component: 'agent_system',
            componentId: 'loaded',
            value: String(usage.agentCount),
            unit: 'count',
            threshold: "15",
            criticalThreshold: "25"
          }
        ]);
        */
        
      } catch (error) {
        console.error('❌ Performance monitoring error:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.performanceMonitorInterval) {
      clearInterval(this.performanceMonitorInterval);
    }

    // Unload all agents
    const agentIds = Array.from(this.loadedAgents.keys());
    for (const agentId of agentIds) {
      await this.unloadAgent(agentId);
    }
  }
}

// Global instance
export const onDemandAgentLoader = new OnDemandAgentLoader();