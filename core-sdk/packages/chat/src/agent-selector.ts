/**
 * Agent Selector
 * Intelligent agent selection for chat requests
 */

import { EventEmitter } from 'events';
import { allUnifiedAgents, getAgentsByTier, getAgentsByCategory } from '../../agents/src/definitions/unified-267-agents-registry';

export interface AgentMatch {
  agentId: string;
  score: number;
  reason: string;
  capabilities: string[];
}

export interface SelectionCriteria {
  task?: string;
  category?: string;
  requiredCapabilities?: string[];
  preferredTier?: string;
  language?: string;
  urgency?: 'low' | 'medium' | 'high';
}

export class AgentSelector extends EventEmitter {
  private static instance: AgentSelector;
  private capabilityKeywords: Map<string, string[]> = new Map();

  private constructor() {
    super();
    this.initializeKeywords();
    console.log('🎯 AgentSelector initialized');
  }

  public static getInstance(): AgentSelector {
    if (!AgentSelector.instance) {
      AgentSelector.instance = new AgentSelector();
    }
    return AgentSelector.instance;
  }

  private initializeKeywords(): void {
    this.capabilityKeywords.set('frontend', ['react', 'vue', 'angular', 'css', 'html', 'ui', 'frontend', 'component', 'styling']);
    this.capabilityKeywords.set('backend', ['api', 'server', 'database', 'backend', 'node', 'python', 'java', 'authentication']);
    this.capabilityKeywords.set('fullstack', ['full-stack', 'fullstack', 'web app', 'application', 'build', 'create']);
    this.capabilityKeywords.set('devops', ['deploy', 'docker', 'kubernetes', 'ci/cd', 'infrastructure', 'monitoring']);
    this.capabilityKeywords.set('data', ['data', 'analytics', 'machine learning', 'ml', 'ai', 'analysis', 'visualization']);
    this.capabilityKeywords.set('content', ['content', 'write', 'blog', 'article', 'copy', 'documentation']);
    this.capabilityKeywords.set('design', ['design', 'ux', 'ui', 'wireframe', 'prototype', 'figma']);
    this.capabilityKeywords.set('security', ['security', 'vulnerability', 'audit', 'penetration', 'encryption']);
    this.capabilityKeywords.set('testing', ['test', 'qa', 'quality', 'automation', 'selenium', 'playwright']);
    this.capabilityKeywords.set('mobile', ['mobile', 'ios', 'android', 'react native', 'flutter', 'app']);
  }

  public async selectAgent(criteria: SelectionCriteria): Promise<AgentMatch[]> {
    const matches: AgentMatch[] = [];
    const taskLower = (criteria.task || '').toLowerCase();

    for (const agent of allUnifiedAgents) {
      let score = 0;
      const reasons: string[] = [];

      if (criteria.preferredTier && agent.tier === criteria.preferredTier) {
        score += 0.3;
        reasons.push(`Tier match: ${agent.tier}`);
      }

      if (criteria.requiredCapabilities) {
        const capMatches = criteria.requiredCapabilities.filter(c => agent.capabilities.includes(c));
        if (capMatches.length > 0) {
          score += capMatches.length * 0.2;
          reasons.push(`Capability matches: ${capMatches.join(', ')}`);
        }
      }

      if (criteria.language && agent.supportedLanguages.includes(criteria.language)) {
        score += 0.1;
        reasons.push(`Language: ${criteria.language}`);
      }

      for (const [category, keywords] of this.capabilityKeywords.entries()) {
        const matchCount = keywords.filter(kw => taskLower.includes(kw)).length;
        if (matchCount > 0 && agent.capabilities.some(c => keywords.includes(c.toLowerCase()))) {
          score += matchCount * 0.15;
          reasons.push(`Task keyword match: ${category}`);
        }
      }

      const capabilityMatch = agent.capabilities.filter(c => taskLower.includes(c.toLowerCase())).length;
      if (capabilityMatch > 0) {
        score += capabilityMatch * 0.1;
        reasons.push(`Direct capability match`);
      }

      if (score > 0) {
        matches.push({
          agentId: agent.id,
          score,
          reason: reasons.join('; ') || 'General match',
          capabilities: agent.capabilities
        });
      }
    }

    if (matches.length === 0) {
      const defaultAgent = allUnifiedAgents.find(a => a.id === 'fullstack-developer') || allUnifiedAgents[0];
      matches.push({
        agentId: defaultAgent.id,
        score: 0.5,
        reason: 'Default selection for general tasks',
        capabilities: defaultAgent.capabilities
      });
    }

    matches.sort((a, b) => b.score - a.score);

    this.emit('agent-selected', { criteria, matches: matches.slice(0, 5) });
    
    return matches.slice(0, 5);
  }

  public async selectBestAgent(task: string): Promise<AgentMatch> {
    const matches = await this.selectAgent({ task });
    return matches[0];
  }

  public async selectAgentsByGroup(groupId: string): Promise<string[]> {
    const tierMapping: Record<string, string> = {
      development: 'development',
      creative: 'creative',
      executive: 'executive',
      qa: 'qa',
      devops: 'devops',
      research: 'domain',
      content: 'creative',
      social: 'creative'
    };

    const tier = tierMapping[groupId];
    if (tier) {
      const agents = getAgentsByTier(tier as any);
      return agents.slice(0, 10).map(a => a.id);
    }

    return allUnifiedAgents.filter(a => a.group === groupId).map(a => a.id);
  }

  public async getAgentCapabilities(agentId: string): Promise<string[]> {
    const agent = allUnifiedAgents.find(a => a.id === agentId);
    return agent?.capabilities || [];
  }
}

export const agentSelector = AgentSelector.getInstance();
export default AgentSelector;
