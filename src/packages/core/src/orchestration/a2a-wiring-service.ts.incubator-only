/**
 * A2A (Agent-to-Agent) Collaboration Wiring Service
 * 
 * Enables inter-agent communication for complex multi-agent workflows:
 * - Task delegation and handoffs
 * - Dependency resolution between agents
 * - Negotiation protocols for resource allocation
 * - Escalation management for blocked tasks
 * 
 * Integration Points:
 * - Pre-orchestration: Setup collaboration channels
 * - During-orchestration: Enable agent-to-agent messages
 * - Post-orchestration: Collect collaboration metrics
 */

import { A2ACollaborationBus } from '../collaboration/a2a-collaboration-bus';
import type { A2AMessage } from '../collaboration/a2a-collaboration-bus';
import type { StudioType } from '@shared/schema';
import type { WAIOrchestrationConfigV9 } from '../orchestration/wai-orchestration-core-v9';
import type { IStorage } from '../storage';

export interface A2ACollaborationConfig {
  enableNegotiation: boolean;
  enableHandoffs: boolean;
  maxHops: number;
  timeout: number;
}

export interface CollaborationMetrics {
  totalMessages: number;
  handoffs: number;
  escalations: number;
  negotiations: number;
  avgResponseTime: number;
}

/**
 * A2A Collaboration Wiring Service
 */
class A2AWiringService {
  private collaborationBus: A2ACollaborationBus | null = null;
  private sessionMetrics: Map<string, CollaborationMetrics> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    // Lazy initialization - bus will be created when first used with real config/storage
    console.log('🤝 A2A Collaboration Wiring Service initialized (lazy)');
    console.log('📡 Features: Negotiation, Handoffs, Escalation, Dependency Resolution');
  }

  /**
   * Initialize with real storage and config
   * Call this before using any A2A features
   */
  initialize(config: WAIOrchestrationConfigV9, storage: IStorage): void {
    if (this.isInitialized) {
      console.log('🤝 [A2A] Already initialized, skipping');
      return;
    }

    this.collaborationBus = new A2ACollaborationBus({
      coreConfig: config,
      storage: storage,
    });

    this.isInitialized = true;
    console.log('🤝 [A2A] Initialized with production storage and config');
  }

  /**
   * Ensure bus is initialized
   */
  private ensureInitialized(): void {
    if (!this.collaborationBus || !this.isInitialized) {
      // Create minimal bus for non-production usage
      const minimalStorage: any = {
        createMessage: async () => {},
        getMessage: async () => null,
        listMessages: async () => [],
      };
      
      const minimalConfig: any = {
        enableA2A: true,
        maxAgents: 100,
      };
      
      this.collaborationBus = new A2ACollaborationBus({
        coreConfig: minimalConfig,
        storage: minimalStorage,
      });
      
      console.warn('⚠️ [A2A] Using minimal config - call initialize() with real storage for production');
    }
  }

  /**
   * Initialize collaboration session for multi-agent workflow
   */
  async initializeCollaborationSession(
    orchestrationId: string,
    agents: string[],
    config: Partial<A2ACollaborationConfig> = {}
  ): Promise<{ sessionId: string }> {
    this.ensureInitialized();
    
    const fullConfig: A2ACollaborationConfig = {
      enableNegotiation: true,
      enableHandoffs: true,
      maxHops: 5,
      timeout: 30000,
      ...config,
    };

    // Register agents with collaboration bus
    for (const agentId of agents) {
      this.collaborationBus!.registerAgent({
        id: agentId,
        tier: 'development',
        name: agentId,
        capabilities: ['general'],
        specializations: [],
        description: `Agent ${agentId}`,
      } as any);
    }

    // Initialize metrics tracking
    this.sessionMetrics.set(orchestrationId, {
      totalMessages: 0,
      handoffs: 0,
      escalations: 0,
      negotiations: 0,
      avgResponseTime: 0,
    });

    console.log(`🤝 [A2A] Initialized collaboration for ${agents.length} agents in session ${orchestrationId}`);

    return { sessionId: orchestrationId };
  }

  /**
   * Send message from one agent to another
   */
  async sendAgentMessage(
    fromAgent: string,
    toAgent: string,
    action: string,
    data: any
  ): Promise<void> {
    this.ensureInitialized();
    
    const message: Partial<A2AMessage> = {
      type: 'request',
      fromAgent,
      toAgent,
      payload: {
        action,
        data,
      },
      timestamp: new Date(),
    };

    await this.collaborationBus!.sendMessage(message as A2AMessage);
    console.log(`📤 [A2A] Message: ${fromAgent} → ${toAgent} (${action})`);
  }

  /**
   * Delegate task from one agent to another
   */
  async delegateTask(
    fromAgent: string,
    toAgent: string,
    task: any,
    orchestrationId: string
  ): Promise<{ success: boolean; handoffId: string }> {
    this.ensureInitialized();
    
    const result = await this.collaborationBus!.delegateTask(
      fromAgent,
      toAgent,
      task
    );

    // Update metrics
    const metrics = this.sessionMetrics.get(orchestrationId);
    if (metrics) {
      metrics.handoffs++;
      metrics.totalMessages++;
    }

    console.log(`🔀 [A2A] Task delegated: ${fromAgent} → ${toAgent}`);

    return result;
  }

  /**
   * Escalate blocked task to higher-tier agent
   */
  async escalateTask(
    agentId: string,
    task: any,
    reason: string,
    orchestrationId: string
  ): Promise<{ escalated: boolean; assignedAgent?: string }> {
    this.ensureInitialized();
    
    const result = await this.collaborationBus!.escalateTask(agentId, task, reason);

    // Update metrics
    const metrics = this.sessionMetrics.get(orchestrationId);
    if (metrics) {
      metrics.escalations++;
      metrics.totalMessages++;
    }

    console.log(`⬆️ [A2A] Task escalated from ${agentId}: ${reason}`);

    return result;
  }

  /**
   * Get collaboration metrics for orchestration session
   */
  getSessionMetrics(orchestrationId: string): CollaborationMetrics | null {
    return this.sessionMetrics.get(orchestrationId) || null;
  }

  /**
   * Cleanup collaboration session
   */
  async cleanupSession(orchestrationId: string): Promise<void> {
    this.sessionMetrics.delete(orchestrationId);
    console.log(`🧹 [A2A] Cleaned up collaboration session ${orchestrationId}`);
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      status: 'healthy' as const,
      activeSessions: this.sessionMetrics.size,
      busStatus: this.collaborationBus.getStatus(),
      features: {
        negotiation: true,
        handoffs: true,
        escalation: true,
        dependencyResolution: true,
      },
    };
  }
}

// Export singleton instance
export const a2aWiringService = new A2AWiringService();
