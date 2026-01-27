/**
 * Agent Collaboration Network Wiring Service
 * 
 * Enables advanced multi-agent coordination and knowledge sharing:
 * - Agent capability discovery and matching
 * - Knowledge transfer between agents
 * - Collaborative problem-solving
 * - Team formation for complex tasks
 * 
 * Integration Points:
 * - Pre-orchestration: Form optimal agent teams
 * - During-orchestration: Enable knowledge sharing
 * - Post-orchestration: Update agent collaboration graph
 */

import type { StudioType } from '@shared/schema';

export interface AgentProfile {
  id: string;
  capabilities: string[];
  specializations: string[];
  performance: number; // 0-1
  collaborationScore: number; // 0-1
  successfulCollaborations: number;
}

export interface TeamComposition {
  teamId: string;
  agents: AgentProfile[];
  synergyScore: number; // 0-1, higher = better team fit
  capabilities: string[];
  estimatedPerformance: number;
}

export interface KnowledgeTransfer {
  fromAgent: string;
  toAgent: string;
  knowledge: string;
  transferredAt: Date;
  effectiveness: number; // 0-1
}

export interface CollaborationMetrics {
  totalCollaborations: number;
  successfulCollaborations: number;
  knowledgeTransfers: number;
  avgTeamSynergyScore: number;
}

/**
 * Agent Collaboration Network Wiring Service
 */
class AgentCollaborationNetworkWiringService {
  private agentProfiles: Map<string, AgentProfile> = new Map();
  private collaborationHistory: Array<{ teamId: string; success: boolean; agents: string[] }> = [];
  private knowledgeGraph: Map<string, KnowledgeTransfer[]> = new Map();
  private metrics: CollaborationMetrics = {
    totalCollaborations: 0,
    successfulCollaborations: 0,
    knowledgeTransfers: 0,
    avgTeamSynergyScore: 0,
  };

  constructor() {
    console.log('🤝 Agent Collaboration Network Wiring Service initialized');
    console.log('🎯 Features: Capability discovery, Knowledge transfer, Team formation, Collaborative problem-solving');
  }

  /**
   * Register agent in collaboration network
   */
  registerAgent(agent: Partial<AgentProfile> & { id: string }): void {
    const profile: AgentProfile = {
      capabilities: [],
      specializations: [],
      performance: 0.8,
      collaborationScore: 0.8,
      successfulCollaborations: 0,
      ...agent,
    };

    this.agentProfiles.set(agent.id, profile);
    console.log(`🤝 [Network] Registered agent ${agent.id} with ${profile.capabilities.length} capabilities`);
  }

  /**
   * Form optimal team for task
   */
  formTeam(
    requiredCapabilities: string[],
    teamSize: number = 3
  ): TeamComposition {
    const candidateAgents: Array<{ agent: AgentProfile; match: number }> = [];

    // Score each agent based on capability match
    for (const agent of this.agentProfiles.values()) {
      const matchedCapabilities = requiredCapabilities.filter(cap =>
        agent.capabilities.includes(cap) || agent.specializations.includes(cap)
      );

      const matchScore = matchedCapabilities.length / requiredCapabilities.length;
      const overallScore = (matchScore * 0.6) + (agent.performance * 0.3) + (agent.collaborationScore * 0.1);

      candidateAgents.push({ agent, match: overallScore });
    }

    // Sort by match score and select top N
    candidateAgents.sort((a, b) => b.match - a.match);
    const selectedAgents = candidateAgents.slice(0, teamSize).map(c => c.agent);

    // Calculate team synergy
    const avgPerformance = selectedAgents.reduce((sum, a) => sum + a.performance, 0) / selectedAgents.length;
    const avgCollaborationScore = selectedAgents.reduce((sum, a) => sum + a.collaborationScore, 0) / selectedAgents.length;
    const synergyScore = (avgPerformance * 0.6) + (avgCollaborationScore * 0.4);

    // Collect all team capabilities
    const allCapabilities = new Set<string>();
    selectedAgents.forEach(agent => {
      agent.capabilities.forEach(cap => allCapabilities.add(cap));
      agent.specializations.forEach(spec => allCapabilities.add(spec));
    });

    const team: TeamComposition = {
      teamId: `team-${Date.now()}`,
      agents: selectedAgents,
      synergyScore,
      capabilities: Array.from(allCapabilities),
      estimatedPerformance: avgPerformance,
    };

    console.log(`🤝 [Team Formation] Created team of ${selectedAgents.length} agents - Synergy: ${(synergyScore * 100).toFixed(0)}%`);
    console.log(`  Agents: ${selectedAgents.map(a => a.id).join(', ')}`);

    return team;
  }

  /**
   * Transfer knowledge between agents
   */
  async transferKnowledge(
    fromAgent: string,
    toAgent: string,
    knowledge: string
  ): Promise<{ success: boolean; effectiveness: number }> {
    const sender = this.agentProfiles.get(fromAgent);
    const receiver = this.agentProfiles.get(toAgent);

    if (!sender || !receiver) {
      return { success: false, effectiveness: 0 };
    }

    // Calculate transfer effectiveness based on agent compatibility
    const effectiveness = (sender.collaborationScore + receiver.collaborationScore) / 2;

    const transfer: KnowledgeTransfer = {
      fromAgent,
      toAgent,
      knowledge,
      transferredAt: new Date(),
      effectiveness,
    };

    // Store in knowledge graph
    if (!this.knowledgeGraph.has(toAgent)) {
      this.knowledgeGraph.set(toAgent, []);
    }
    this.knowledgeGraph.get(toAgent)!.push(transfer);

    this.metrics.knowledgeTransfers++;

    console.log(`🤝 [Knowledge Transfer] ${fromAgent} → ${toAgent} (Effectiveness: ${(effectiveness * 100).toFixed(0)}%)`);

    return { success: true, effectiveness };
  }

  /**
   * Record collaboration outcome
   */
  recordCollaboration(
    teamId: string,
    agents: string[],
    success: boolean,
    performanceMetrics: Record<string, number>
  ): void {
    this.collaborationHistory.push({ teamId, success, agents });
    this.metrics.totalCollaborations++;

    if (success) {
      this.metrics.successfulCollaborations++;

      // Update agent profiles
      agents.forEach(agentId => {
        const profile = this.agentProfiles.get(agentId);
        if (profile) {
          profile.successfulCollaborations++;
          
          // Update performance based on metrics
          if (performanceMetrics[agentId]) {
            profile.performance = (profile.performance * 0.7) + (performanceMetrics[agentId] * 0.3);
          }

          // Boost collaboration score for successful teamwork
          profile.collaborationScore = Math.min(1.0, profile.collaborationScore * 1.05);
        }
      });
    }

    console.log(`🤝 [Collaboration] Team ${teamId} - ${success ? 'SUCCESS' : 'FAILED'} - ${agents.length} agents`);
  }

  /**
   * Find agents with specific capability
   */
  findAgentsByCapability(capability: string): AgentProfile[] {
    const matches: AgentProfile[] = [];

    for (const agent of this.agentProfiles.values()) {
      if (agent.capabilities.includes(capability) || agent.specializations.includes(capability)) {
        matches.push(agent);
      }
    }

    return matches.sort((a, b) => b.performance - a.performance);
  }

  /**
   * Get agent's knowledge base
   */
  getAgentKnowledge(agentId: string): KnowledgeTransfer[] {
    return this.knowledgeGraph.get(agentId) || [];
  }

  /**
   * Get collaboration metrics
   */
  getCollaborationMetrics(): CollaborationMetrics {
    // Calculate average synergy score from recent collaborations
    const recentCollabs = this.collaborationHistory.slice(-10);
    // Placeholder calculation
    this.metrics.avgTeamSynergyScore = recentCollabs.filter(c => c.success).length / (recentCollabs.length || 1);

    return { ...this.metrics };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const successRate = this.metrics.totalCollaborations > 0
      ? this.metrics.successfulCollaborations / this.metrics.totalCollaborations
      : 0;

    return {
      status: successRate > 0.7 ? 'healthy' as const : 'degraded' as const,
      totalAgents: this.agentProfiles.size,
      collaborationSuccessRate: successRate,
      knowledgeTransfers: this.metrics.knowledgeTransfers,
      features: {
        capabilityDiscovery: true,
        knowledgeTransfer: true,
        teamFormation: true,
        collaborativeSolving: true,
      },
    };
  }
}

// Export singleton instance
export const agentCollaborationNetworkWiringService = new AgentCollaborationNetworkWiringService();
