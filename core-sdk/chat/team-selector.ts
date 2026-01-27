/**
 * Team Selector
 * Agent team composition and selection with predefined templates
 */

import { EventEmitter } from 'events';

export interface AgentTeamMember {
  agentId: string;
  role: 'leader' | 'specialist' | 'validator' | 'support';
  priority: number;
  capabilities: string[];
  systemPromptOverride?: string;
}

export interface AgentTeam {
  id: string;
  name: string;
  description: string;
  category: 'startup' | 'enterprise' | 'research' | 'creative' | 'development' | 'custom';
  members: AgentTeamMember[];
  coordinationStrategy: 'sequential' | 'parallel' | 'hybrid' | 'hierarchical';
  fallbackTeam?: string;
  maxConcurrentAgents: number;
  qualityThreshold: number;
  metadata?: Record<string, unknown>;
}

export interface TeamSelectionCriteria {
  task?: string;
  category?: string;
  requiredCapabilities?: string[];
  teamSize?: 'small' | 'medium' | 'large';
  budget?: 'low' | 'medium' | 'high';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  quality?: 'standard' | 'high' | 'premium';
}

export interface TeamSelectionResult {
  team: AgentTeam;
  score: number;
  reason: string;
  estimatedCost: number;
  estimatedTime: number;
}

export const PREDEFINED_TEAMS: AgentTeam[] = [
  {
    id: 'startup-mvp',
    name: 'Startup MVP Team',
    description: 'Rapid MVP development with full-stack capabilities',
    category: 'startup',
    coordinationStrategy: 'hybrid',
    maxConcurrentAgents: 4,
    qualityThreshold: 0.75,
    members: [
      { agentId: 'project-manager', role: 'leader', priority: 1, capabilities: ['planning', 'coordination', 'timeline'] },
      { agentId: 'fullstack-developer', role: 'specialist', priority: 2, capabilities: ['frontend', 'backend', 'database'] },
      { agentId: 'ui-ux-designer', role: 'specialist', priority: 3, capabilities: ['design', 'prototyping', 'user-experience'] },
      { agentId: 'qa-tester', role: 'validator', priority: 4, capabilities: ['testing', 'quality-assurance', 'bug-detection'] }
    ]
  },
  {
    id: 'enterprise-solution',
    name: 'Enterprise Solution Team',
    description: 'Comprehensive enterprise-grade development with security and compliance',
    category: 'enterprise',
    coordinationStrategy: 'hierarchical',
    maxConcurrentAgents: 8,
    qualityThreshold: 0.9,
    members: [
      { agentId: 'chief-architect', role: 'leader', priority: 1, capabilities: ['architecture', 'strategy', 'compliance'] },
      { agentId: 'security-specialist', role: 'specialist', priority: 2, capabilities: ['security', 'encryption', 'audit'] },
      { agentId: 'senior-architect', role: 'specialist', priority: 3, capabilities: ['system-design', 'scalability', 'performance'] },
      { agentId: 'backend-specialist', role: 'specialist', priority: 4, capabilities: ['api', 'microservices', 'database'] },
      { agentId: 'frontend-specialist', role: 'specialist', priority: 5, capabilities: ['react', 'typescript', 'accessibility'] },
      { agentId: 'devops-engineer', role: 'specialist', priority: 6, capabilities: ['ci-cd', 'kubernetes', 'monitoring'] },
      { agentId: 'compliance-auditor', role: 'validator', priority: 7, capabilities: ['gdpr', 'hipaa', 'sox'] },
      { agentId: 'performance-tester', role: 'validator', priority: 8, capabilities: ['load-testing', 'optimization', 'benchmarking'] }
    ]
  },
  {
    id: 'research-team',
    name: 'Research & Analysis Team',
    description: 'Deep research and analysis with comprehensive documentation',
    category: 'research',
    coordinationStrategy: 'sequential',
    maxConcurrentAgents: 5,
    qualityThreshold: 0.85,
    members: [
      { agentId: 'research-director', role: 'leader', priority: 1, capabilities: ['methodology', 'synthesis', 'leadership'] },
      { agentId: 'market-researcher', role: 'specialist', priority: 2, capabilities: ['market-analysis', 'trends', 'competitive-analysis'] },
      { agentId: 'data-scientist', role: 'specialist', priority: 3, capabilities: ['data-analysis', 'machine-learning', 'visualization'] },
      { agentId: 'technical-writer', role: 'specialist', priority: 4, capabilities: ['documentation', 'reports', 'presentations'] },
      { agentId: 'fact-checker', role: 'validator', priority: 5, capabilities: ['verification', 'source-validation', 'accuracy'] }
    ]
  },
  {
    id: 'creative-studio',
    name: 'Creative Studio Team',
    description: 'Content creation and design with brand consistency',
    category: 'creative',
    coordinationStrategy: 'parallel',
    maxConcurrentAgents: 6,
    qualityThreshold: 0.8,
    members: [
      { agentId: 'creative-director', role: 'leader', priority: 1, capabilities: ['direction', 'brand', 'vision'] },
      { agentId: 'content-writer', role: 'specialist', priority: 2, capabilities: ['copywriting', 'blogging', 'storytelling'] },
      { agentId: 'graphic-designer', role: 'specialist', priority: 3, capabilities: ['design', 'illustration', 'branding'] },
      { agentId: 'video-producer', role: 'specialist', priority: 4, capabilities: ['video', 'animation', 'motion-graphics'] },
      { agentId: 'social-media-manager', role: 'specialist', priority: 5, capabilities: ['social', 'engagement', 'analytics'] },
      { agentId: 'brand-reviewer', role: 'validator', priority: 6, capabilities: ['consistency', 'guidelines', 'quality'] }
    ]
  },
  {
    id: 'full-development',
    name: 'Full Development Team',
    description: 'Complete software development lifecycle coverage',
    category: 'development',
    coordinationStrategy: 'hybrid',
    maxConcurrentAgents: 10,
    qualityThreshold: 0.85,
    members: [
      { agentId: 'tech-lead', role: 'leader', priority: 1, capabilities: ['leadership', 'architecture', 'mentoring'] },
      { agentId: 'product-manager', role: 'support', priority: 2, capabilities: ['requirements', 'prioritization', 'stakeholders'] },
      { agentId: 'senior-architect', role: 'specialist', priority: 3, capabilities: ['design', 'patterns', 'scalability'] },
      { agentId: 'frontend-developer', role: 'specialist', priority: 4, capabilities: ['react', 'css', 'typescript'] },
      { agentId: 'backend-developer', role: 'specialist', priority: 5, capabilities: ['node', 'python', 'java'] },
      { agentId: 'mobile-developer', role: 'specialist', priority: 6, capabilities: ['ios', 'android', 'flutter'] },
      { agentId: 'database-architect', role: 'specialist', priority: 7, capabilities: ['postgresql', 'mongodb', 'optimization'] },
      { agentId: 'devops-engineer', role: 'specialist', priority: 8, capabilities: ['docker', 'kubernetes', 'aws'] },
      { agentId: 'qa-lead', role: 'validator', priority: 9, capabilities: ['testing', 'automation', 'coverage'] },
      { agentId: 'security-tester', role: 'validator', priority: 10, capabilities: ['penetration', 'vulnerability', 'compliance'] }
    ]
  }
];

export class TeamSelector extends EventEmitter {
  private static instance: TeamSelector;
  private customTeams: Map<string, AgentTeam> = new Map();
  private activeTeams: Map<string, { team: AgentTeam; sessionId: string; startTime: Date }> = new Map();

  private constructor() {
    super();
    console.log('👥 TeamSelector initialized with', PREDEFINED_TEAMS.length, 'predefined teams');
  }

  public static getInstance(): TeamSelector {
    if (!TeamSelector.instance) {
      TeamSelector.instance = new TeamSelector();
    }
    return TeamSelector.instance;
  }

  public getAllTeams(): AgentTeam[] {
    return [...PREDEFINED_TEAMS, ...Array.from(this.customTeams.values())];
  }

  public getTeamById(teamId: string): AgentTeam | undefined {
    const predefined = PREDEFINED_TEAMS.find(t => t.id === teamId);
    if (predefined) return predefined;
    return this.customTeams.get(teamId);
  }

  public getTeamsByCategory(category: AgentTeam['category']): AgentTeam[] {
    return this.getAllTeams().filter(t => t.category === category);
  }

  public async selectTeam(criteria: TeamSelectionCriteria): Promise<TeamSelectionResult[]> {
    const results: TeamSelectionResult[] = [];
    const taskLower = (criteria.task || '').toLowerCase();

    for (const team of this.getAllTeams()) {
      let score = 0;
      const reasons: string[] = [];

      if (criteria.category && team.category === criteria.category) {
        score += 0.3;
        reasons.push(`Category match: ${team.category}`);
      }

      if (criteria.requiredCapabilities) {
        const allCapabilities = team.members.flatMap(m => m.capabilities);
        const matches = criteria.requiredCapabilities.filter(c => 
          allCapabilities.some(cap => cap.toLowerCase().includes(c.toLowerCase()))
        );
        if (matches.length > 0) {
          score += (matches.length / criteria.requiredCapabilities.length) * 0.3;
          reasons.push(`Capabilities: ${matches.join(', ')}`);
        }
      }

      if (criteria.teamSize) {
        const memberCount = team.members.length;
        const sizeMatch = 
          (criteria.teamSize === 'small' && memberCount <= 4) ||
          (criteria.teamSize === 'medium' && memberCount > 4 && memberCount <= 7) ||
          (criteria.teamSize === 'large' && memberCount > 7);
        if (sizeMatch) {
          score += 0.15;
          reasons.push(`Team size: ${criteria.teamSize}`);
        }
      }

      if (criteria.quality) {
        const qualityMatch = 
          (criteria.quality === 'standard' && team.qualityThreshold >= 0.7) ||
          (criteria.quality === 'high' && team.qualityThreshold >= 0.8) ||
          (criteria.quality === 'premium' && team.qualityThreshold >= 0.9);
        if (qualityMatch) {
          score += 0.15;
          reasons.push(`Quality threshold: ${team.qualityThreshold}`);
        }
      }

      const taskKeywords = taskLower.split(' ');
      const teamKeywords = team.name.toLowerCase() + ' ' + team.description.toLowerCase();
      const keywordMatches = taskKeywords.filter(kw => teamKeywords.includes(kw)).length;
      if (keywordMatches > 0) {
        score += Math.min(keywordMatches * 0.05, 0.2);
        reasons.push(`Task relevance`);
      }

      if (score > 0 || criteria.task === undefined) {
        const baseCost = team.members.length * 0.5;
        const estimatedCost = criteria.budget === 'low' ? baseCost * 0.7 :
                             criteria.budget === 'high' ? baseCost * 1.3 : baseCost;
        
        const baseTime = team.coordinationStrategy === 'parallel' ? 10 : 
                        team.coordinationStrategy === 'sequential' ? 30 : 20;

        results.push({
          team,
          score: score || 0.1,
          reason: reasons.join('; ') || 'General match',
          estimatedCost,
          estimatedTime: baseTime
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    this.emit('team-selected', { criteria, results: results.slice(0, 3) });
    
    return results;
  }

  public async selectBestTeam(task: string): Promise<TeamSelectionResult> {
    const results = await this.selectTeam({ task });
    return results[0];
  }

  public createCustomTeam(team: Omit<AgentTeam, 'category'> & { category?: AgentTeam['category'] }): AgentTeam {
    const customTeam: AgentTeam = {
      ...team,
      category: team.category || 'custom'
    };
    this.customTeams.set(customTeam.id, customTeam);
    this.emit('team-created', customTeam);
    return customTeam;
  }

  public updateCustomTeam(teamId: string, updates: Partial<AgentTeam>): AgentTeam | undefined {
    const existing = this.customTeams.get(teamId);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.customTeams.set(teamId, updated);
    this.emit('team-updated', updated);
    return updated;
  }

  public deleteCustomTeam(teamId: string): boolean {
    const deleted = this.customTeams.delete(teamId);
    if (deleted) {
      this.emit('team-deleted', teamId);
    }
    return deleted;
  }

  public activateTeam(team: AgentTeam, sessionId: string): void {
    this.activeTeams.set(sessionId, {
      team,
      sessionId,
      startTime: new Date()
    });
    this.emit('team-activated', { team, sessionId });
  }

  public deactivateTeam(sessionId: string): void {
    const activeTeam = this.activeTeams.get(sessionId);
    if (activeTeam) {
      this.activeTeams.delete(sessionId);
      this.emit('team-deactivated', { team: activeTeam.team, sessionId });
    }
  }

  public getActiveTeam(sessionId: string): AgentTeam | undefined {
    return this.activeTeams.get(sessionId)?.team;
  }

  public getActiveTeams(): { team: AgentTeam; sessionId: string; startTime: Date }[] {
    return Array.from(this.activeTeams.values());
  }
}

export const teamSelector = TeamSelector.getInstance();
