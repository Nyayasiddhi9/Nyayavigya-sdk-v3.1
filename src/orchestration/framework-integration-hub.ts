/**
 * WAI SDK v9.0 - Framework Integration Hub
 * Central hub for BMAD 2.0, CAM 2.0, and GRPO 2.0 integration
 */

import { EventEmitter } from 'events';
import { bmadManager } from '../frameworks/bmad-integration-v2';
import { camManager } from '../frameworks/cam-integration-v2';
import { grpoManager } from '../frameworks/grpo-integration-v2';

export interface FrameworkHealthStatus {
  bmad: {
    status: 'healthy' | 'degraded' | 'down';
    activeDialogues: number;
    totalExchanges: number;
    avgConsensusRate: number;
    lastActivity: Date;
  };
  cam: {
    status: 'healthy' | 'degraded' | 'down';
    totalMemories: number;
    avgImportance: number;
    memoryTypes: Record<string, number>;
    lastMemoryStored: Date;
  };
  grpo: {
    status: 'healthy' | 'degraded' | 'down';
    activeGroups: number;
    convergedGroups: number;
    avgGroupPerformance: number;
    lastOptimization: Date;
  };
  overall: {
    status: 'healthy' | 'degraded' | 'down';
    integration: 'active' | 'partial' | 'inactive';
    lastUpdate: Date;
  };
}

export class FrameworkIntegrationHub extends EventEmitter {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.initializeFrameworks();
  }

  private async initializeFrameworks(): Promise<void> {
    try {
      console.log('🔗 Initializing Framework Integration Hub...');

      // Wire up event listeners between frameworks
      this.setupFrameworkCommunication();

      // Start health monitoring
      this.startHealthMonitoring();

      // Set up periodic optimization
      this.startCrossFrameworkOptimization();

      this.isInitialized = true;
      
      console.log('✅ Framework Integration Hub initialized successfully');
      this.emit('hub-initialized');
    } catch (error) {
      console.error('❌ Framework Integration Hub initialization failed:', error);
      this.emit('hub-error', error);
    }
  }

  private setupFrameworkCommunication(): void {
    // BMAD → CAM integration (store dialogue memories)
    bmadManager.on('exchange-added', async (event) => {
      const { dialogueId, exchangeId, exchange } = event;
      
      await camManager.storeMemory(
        exchange.speakerId,
        dialogueId,
        `${exchange.messageType}: ${exchange.content}`,
        'episodic',
        {
          source: 'bmad-dialogue',
          importance: exchange.impact,
          tags: ['dialogue', exchange.messageType, 'bmad']
        },
        {
          dialogueId,
          exchangeId,
          confidence: exchange.confidence,
          addressee: exchange.addresseeId
        }
      );
    });

    // BMAD → GRPO integration (update agent performance based on dialogue)
    bmadManager.on('dialogue-completed', async (event) => {
      const { dialogue } = event;
      
      // If dialogue participants are GRPO agents, update their collaboration scores
      for (const participant of dialogue.participants) {
        const grpoAgent = grpoManager.getAgent(participant.id);
        if (grpoAgent) {
          grpoAgent.performance.collaboration = Math.min(1, 
            grpoAgent.performance.collaboration + (dialogue.outcomes.consensus ? 0.1 : -0.05)
          );
        }
      }
    });

    // CAM → GRPO integration (use memories for agent policy adaptation)
    camManager.on('insights-generated', async (event) => {
      const { insights, agentId } = event;
      
      if (agentId) {
        const grpoAgent = grpoManager.getAgent(agentId);
        if (grpoAgent) {
          // Adjust exploration based on insight patterns
          const patternInsights = insights.filter(i => i.type === 'pattern');
          if (patternInsights.length > 0) {
            grpoAgent.policy.explorationRate = Math.max(0.01, 
              grpoAgent.policy.explorationRate * 0.9
            );
          }
        }
      }
    });

    // GRPO → BMAD integration (use group performance for dialogue coordination)
    grpoManager.on('group-converged', async (event) => {
      const { groupId, convergenceScore } = event;
      const group = grpoManager.getGroup(groupId);
      
      if (group && convergenceScore > 0.9) {
        // Create a BMAD dialogue to share successful patterns
        await bmadManager.createDialogue(
          'Pattern Sharing',
          'Share successful optimization patterns',
          group.agents.map(agent => ({
            role: 'responder' as const,
            persona: {
              name: agent.name,
              expertise: agent.capabilities,
              communicationStyle: 'technical' as const,
              perspective: 'optimization-focused'
            },
            goals: ['Share successful patterns', 'Learn from others'],
            constraints: ['Stay focused on optimization']
          }))
        );
      }
    });

    // GRPO → CAM integration (store optimization experiences)
    grpoManager.on('episode-completed', async (event) => {
      const { episode } = event;
      
      for (const experience of episode.experiences) {
        await camManager.storeMemory(
          experience.agentId,
          episode.groupId,
          `Action: ${experience.action}, Reward: ${experience.reward.toFixed(3)}`,
          'procedural',
          {
            source: 'grpo-training',
            importance: experience.reward,
            tags: ['grpo', 'training', experience.action]
          },
          {
            episodeId: episode.id,
            groupPerformance: experience.groupPerformance,
            relativeRank: experience.relativeRank
          }
        );
      }
    });

    // CAM → BMAD integration (use memories to inform dialogue context)
    camManager.on('memory-stored', async (event) => {
      const { memory } = event;
      
      // If memory is high importance, potentially start a BMAD dialogue
      if (memory.metadata.importance > 0.8 && memory.type === 'episodic') {
        // Check if there are other agents with related memories
        const relatedMemories = await camManager.retrieveMemories({
          agentId: memory.agentId,
          entities: memory.content.entities,
          importance: { min: 0.7, max: 1.0 },
          limit: 3
        });

        if (relatedMemories.length > 1) {
          // Consider starting a dialogue about this topic
          this.emit('dialogue-suggestion', {
            topic: memory.content.entities.join(', '),
            participants: [memory.agentId],
            context: memory
          });
        }
      }
    });

    console.log('🔗 Framework communication channels established');
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds

    // Initial health check
    this.performHealthCheck();
  }

  private async performHealthCheck(): Promise<FrameworkHealthStatus> {
    const now = new Date();

    // BMAD Health
    const bmadDialogues = bmadManager.getAllDialogues();
    const activeDialogues = bmadDialogues.filter(d => d.status === 'active').length;
    const totalExchanges = bmadDialogues.reduce((sum, d) => 
      sum + d.phases.reduce((pSum, p) => pSum + p.exchanges.length, 0), 0
    );
    const consensusDialogues = bmadDialogues.filter(d => d.outcomes?.consensus).length;
    const avgConsensusRate = bmadDialogues.length > 0 ? consensusDialogues / bmadDialogues.length : 0;

    // CAM Health
    const camStats = camManager.getMemoryStats();
    
    // GRPO Health
    const grpoStats = grpoManager.getGRPOStats();

    const healthStatus: FrameworkHealthStatus = {
      bmad: {
        status: activeDialogues > 0 || bmadDialogues.length > 0 ? 'healthy' : 'degraded',
        activeDialogues,
        totalExchanges,
        avgConsensusRate,
        lastActivity: bmadDialogues.length > 0 
          ? new Date(Math.max(...bmadDialogues.map(d => d.startTime.getTime())))
          : new Date(0)
      },
      cam: {
        status: camStats.totalMemories > 0 ? 'healthy' : 'degraded',
        totalMemories: camStats.totalMemories,
        avgImportance: camStats.avgImportance,
        memoryTypes: camStats.memoriesByType,
        lastMemoryStored: new Date()
      },
      grpo: {
        status: grpoStats.totalGroups > 0 ? 'healthy' : 'degraded',
        activeGroups: grpoStats.activeGroups,
        convergedGroups: grpoStats.convergedGroups,
        avgGroupPerformance: grpoStats.avgGroupPerformance,
        lastOptimization: new Date()
      },
      overall: {
        status: 'healthy',
        integration: 'active',
        lastUpdate: now
      }
    };

    // Determine overall health
    const frameworkStatuses = [healthStatus.bmad.status, healthStatus.cam.status, healthStatus.grpo.status];
    const healthyCount = frameworkStatuses.filter(s => s === 'healthy').length;
    
    if (healthyCount === 3) {
      healthStatus.overall.status = 'healthy';
    } else if (healthyCount >= 1) {
      healthStatus.overall.status = 'degraded';
    } else {
      healthStatus.overall.status = 'down';
    }

    this.emit('health-check', healthStatus);
    return healthStatus;
  }

  private startCrossFrameworkOptimization(): void {
    // Run cross-framework optimization every 5 minutes
    setInterval(() => {
      this.performCrossFrameworkOptimization();
    }, 5 * 60 * 1000);
  }

  private async performCrossFrameworkOptimization(): Promise<void> {
    try {
      // Consolidate memories across all frameworks
      await camManager.consolidateMemories();

      // Optimize GRPO groups based on CAM insights
      const allGroups = grpoManager.getAllGroups();
      for (const group of allGroups) {
        const insights = await camManager.generateInsights(group.coordinator);
        
        // Adjust group strategy based on insights
        if (insights.some(i => i.type === 'pattern' && i.confidence > 0.8)) {
          group.optimization.strategy = 'collaborative';
        } else if (insights.some(i => i.type === 'anomaly')) {
          group.optimization.strategy = 'adaptive';
        }
      }

      console.log('🔄 Cross-framework optimization completed');
      this.emit('optimization-completed');
    } catch (error) {
      console.error('❌ Cross-framework optimization failed:', error);
      this.emit('optimization-error', error);
    }
  }

  // Public API methods
  async getFrameworkHealth(): Promise<FrameworkHealthStatus> {
    return this.performHealthCheck();
  }

  async createIntegratedSession(
    objective: string,
    participants: string[],
    sessionType: 'dialogue' | 'training' | 'hybrid' = 'hybrid'
  ): Promise<{
    dialogueId?: string;
    groupId?: string;
    sessionId?: string;
  }> {
    const results: any = {};

    try {
      if (sessionType === 'dialogue' || sessionType === 'hybrid') {
        // Create BMAD dialogue
        const dialogueId = await bmadManager.createDialogue(
          objective,
          objective,
          participants.map(id => ({
            role: 'responder' as const,
            persona: {
              name: id,
              expertise: ['general'],
              communicationStyle: 'formal' as const,
              perspective: 'collaborative'
            }
          }))
        );
        results.dialogueId = dialogueId;
      }

      if (sessionType === 'training' || sessionType === 'hybrid') {
        // Create GRPO group
        const groupId = await grpoManager.createGroup(
          `Integrated Session: ${objective}`,
          objective,
          participants.map(id => ({
            name: id,
            type: 'secondary' as const,
            capabilities: ['general']
          }))
        );
        results.groupId = groupId;

        // Start training session
        const sessionId = await grpoManager.startTrainingSession(groupId, objective);
        results.sessionId = sessionId;
      }

      this.emit('integrated-session-created', { objective, participants, results });
      return results;
    } catch (error) {
      console.error('❌ Integrated session creation failed:', error);
      throw error;
    }
  }

  getBMADManager() { return bmadManager; }
  getCAMManager() { return camManager; }
  getGRPOManager() { return grpoManager; }

  isReady(): boolean {
    return this.isInitialized;
  }

  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    await Promise.all([
      camManager.cleanup(),
      grpoManager.cleanup()
    ]);

    console.log('🧹 Framework Integration Hub cleaned up');
  }
}

// Export singleton instance
export const frameworkHub = new FrameworkIntegrationHub();