/**
 * Team Builder Service - Phase 2
 * Dynamic agent team creation and management
 * 
 * Features:
 * - Visual team composition
 * - Role-based team templates (Startup, Enterprise, Agency)
 * - Dynamic team scaling
 * - Team performance analytics
 * - Cross-team collaboration
 */

import { EventEmitter } from 'events';
import { db } from '../db';
import { agentTeams, agentTeamMembers, AgentTeam, AgentTeamMember } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { agentManifestLoader } from './agent-manifest-loader';

export interface TeamTemplate {
  id: string;
  name: string;
  description: string;
  type: 'startup' | 'enterprise' | 'agency' | 'department' | 'custom';
  sectorFocus: string;
  suggestedMembers: {
    role: 'lead' | 'specialist' | 'support';
    agentType: string;
    required: boolean;
  }[];
  coordinationPattern: string;
  decisionMode: string;
}

export interface TeamCreationRequest {
  name: string;
  description?: string;
  ownerId: string;
  templateId?: string;
  leadAgentId: string;
  memberAgentIds: string[];
  sectorFocus?: string;
  coordinationPattern?: string;
  decisionMode?: string;
  communicationProtocol?: string;
}

export interface TeamAnalytics {
  teamId: string;
  totalTasks: number;
  successfulTasks: number;
  averageResponseTime: number;
  memberContributions: Record<string, number>;
  collaborationScore: number;
  efficiencyScore: number;
}

class TeamBuilderService extends EventEmitter {
  private static instance: TeamBuilderService;
  private templates: Map<string, TeamTemplate> = new Map();

  private constructor() {
    super();
    this.initializeTemplates();
    console.log('🏗️ Team Builder Service initialized');
  }

  public static getInstance(): TeamBuilderService {
    if (!TeamBuilderService.instance) {
      TeamBuilderService.instance = new TeamBuilderService();
    }
    return TeamBuilderService.instance;
  }

  private initializeTemplates(): void {
    const templates: TeamTemplate[] = [
      {
        id: 'startup-mvp',
        name: 'Startup MVP Team',
        description: 'Lean team for rapid MVP development',
        type: 'startup',
        sectorFocus: 'technology',
        suggestedMembers: [
          { role: 'lead', agentType: 'cto-agent', required: true },
          { role: 'specialist', agentType: 'fullstack-developer', required: true },
          { role: 'specialist', agentType: 'ux-designer', required: true },
          { role: 'support', agentType: 'qa-engineer', required: false },
        ],
        coordinationPattern: 'collaborative',
        decisionMode: 'consensus',
      },
      {
        id: 'enterprise-development',
        name: 'Enterprise Development Team',
        description: 'Full-scale enterprise development team',
        type: 'enterprise',
        sectorFocus: 'technology',
        suggestedMembers: [
          { role: 'lead', agentType: 'cto-agent', required: true },
          { role: 'specialist', agentType: 'solution-architect', required: true },
          { role: 'specialist', agentType: 'backend-developer', required: true },
          { role: 'specialist', agentType: 'frontend-developer', required: true },
          { role: 'specialist', agentType: 'database-developer', required: true },
          { role: 'specialist', agentType: 'devops-engineer', required: true },
          { role: 'specialist', agentType: 'security-engineer', required: true },
          { role: 'support', agentType: 'qa-engineer', required: true },
          { role: 'support', agentType: 'technical-writer', required: false },
        ],
        coordinationPattern: 'hierarchical',
        decisionMode: 'lead-decides',
      },
      {
        id: 'marketing-agency',
        name: 'Marketing Agency Team',
        description: 'Full-service marketing team',
        type: 'agency',
        sectorFocus: 'marketing',
        suggestedMembers: [
          { role: 'lead', agentType: 'cmo-agent', required: true },
          { role: 'specialist', agentType: 'marketing-strategist', required: true },
          { role: 'specialist', agentType: 'content-writer', required: true },
          { role: 'specialist', agentType: 'seo-specialist', required: true },
          { role: 'specialist', agentType: 'social-media-specialist', required: true },
          { role: 'specialist', agentType: 'graphic-designer', required: false },
          { role: 'support', agentType: 'data-analyst', required: false },
        ],
        coordinationPattern: 'collaborative',
        decisionMode: 'consensus',
      },
      {
        id: 'finance-department',
        name: 'Finance Department',
        description: 'Complete financial operations team',
        type: 'department',
        sectorFocus: 'financial',
        suggestedMembers: [
          { role: 'lead', agentType: 'cfo-agent', required: true },
          { role: 'specialist', agentType: 'financial-analyst', required: true },
          { role: 'specialist', agentType: 'investment-analyst', required: false },
          { role: 'specialist', agentType: 'risk-analyst', required: true },
          { role: 'specialist', agentType: 'tax-specialist', required: false },
          { role: 'support', agentType: 'accounting-analyst', required: true },
        ],
        coordinationPattern: 'hierarchical',
        decisionMode: 'lead-decides',
      },
      {
        id: 'research-collective',
        name: 'Research Collective',
        description: 'Collaborative research and analysis team',
        type: 'custom',
        sectorFocus: 'research',
        suggestedMembers: [
          { role: 'lead', agentType: 'research-analyst', required: true },
          { role: 'specialist', agentType: 'data-scientist', required: true },
          { role: 'specialist', agentType: 'market-researcher', required: false },
          { role: 'specialist', agentType: 'competitive-intelligence', required: false },
        ],
        coordinationPattern: 'swarm',
        decisionMode: 'evidence-based',
      },
    ];

    templates.forEach(t => this.templates.set(t.id, t));
    console.log(`✅ Loaded ${templates.length} team templates`);
  }

  async createTeam(request: TeamCreationRequest): Promise<AgentTeam> {
    const teamId = `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const leadAgent = agentManifestLoader.getEnterpriseAgent(request.leadAgentId);
    if (!leadAgent) {
      throw new Error(`Lead agent ${request.leadAgentId} not found`);
    }

    const template = request.templateId ? this.templates.get(request.templateId) : null;
    
    const teamData = {
      teamId,
      name: request.name,
      description: request.description || `Team led by ${leadAgent.name}`,
      ownerId: request.ownerId,
      teamType: template?.type || 'custom',
      sectorFocus: request.sectorFocus || template?.sectorFocus || 'general',
      leadAgentId: request.leadAgentId,
      memberAgentIds: request.memberAgentIds,
      coordinationPattern: request.coordinationPattern || template?.coordinationPattern || 'hierarchical',
      decisionMode: request.decisionMode || template?.decisionMode || 'lead-decides',
      communicationProtocol: request.communicationProtocol || 'a2a',
      status: 'active',
    };

    const [team] = await db.insert(agentTeams).values(teamData).returning();

    await this.addTeamMembers(teamId, request.leadAgentId, request.memberAgentIds);

    this.emit('team-created', team);
    console.log(`✅ Created team: ${team.name} (${teamId})`);
    
    return team;
  }

  private async addTeamMembers(teamId: string, leadAgentId: string, memberAgentIds: string[]): Promise<void> {
    const members = [
      { teamId, agentId: leadAgentId, role: 'lead', canDelegate: true, canVeto: true, decisionWeight: 1.5 },
      ...memberAgentIds.map(agentId => ({
        teamId,
        agentId,
        role: 'member',
        canDelegate: false,
        canVeto: false,
        decisionWeight: 1.0,
      })),
    ];

    for (const member of members) {
      await db.insert(agentTeamMembers).values(member).onConflictDoNothing();
    }
  }

  async getTeam(teamId: string): Promise<AgentTeam | null> {
    const [team] = await db.select().from(agentTeams).where(eq(agentTeams.teamId, teamId));
    return team || null;
  }

  async getTeamsByOwner(ownerId: string): Promise<AgentTeam[]> {
    return db.select().from(agentTeams).where(eq(agentTeams.ownerId, ownerId));
  }

  async getTeamMembers(teamId: string): Promise<AgentTeamMember[]> {
    return db.select().from(agentTeamMembers).where(eq(agentTeamMembers.teamId, teamId));
  }

  async addMemberToTeam(teamId: string, agentId: string, role: string = 'member'): Promise<AgentTeamMember> {
    const [member] = await db.insert(agentTeamMembers).values({
      teamId,
      agentId,
      role,
      canDelegate: role === 'specialist',
      canVeto: false,
      decisionWeight: role === 'specialist' ? 1.2 : 1.0,
    }).returning();

    const team = await this.getTeam(teamId);
    if (team) {
      const memberIds = (team.memberAgentIds as string[]) || [];
      memberIds.push(agentId);
      await db.update(agentTeams)
        .set({ memberAgentIds: memberIds, updatedAt: new Date() })
        .where(eq(agentTeams.teamId, teamId));
    }

    this.emit('member-added', { teamId, agentId, role });
    return member;
  }

  async removeMemberFromTeam(teamId: string, agentId: string): Promise<boolean> {
    await db.delete(agentTeamMembers)
      .where(and(eq(agentTeamMembers.teamId, teamId), eq(agentTeamMembers.agentId, agentId)));

    const team = await this.getTeam(teamId);
    if (team) {
      const memberIds = ((team.memberAgentIds as string[]) || []).filter(id => id !== agentId);
      await db.update(agentTeams)
        .set({ memberAgentIds: memberIds, updatedAt: new Date() })
        .where(eq(agentTeams.teamId, teamId));
    }

    this.emit('member-removed', { teamId, agentId });
    return true;
  }

  async updateTeamStatus(teamId: string, status: string): Promise<AgentTeam | null> {
    const [team] = await db.update(agentTeams)
      .set({ status, updatedAt: new Date() })
      .where(eq(agentTeams.teamId, teamId))
      .returning();
    
    this.emit('team-status-changed', { teamId, status });
    return team || null;
  }

  async getTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
    const team = await this.getTeam(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    return {
      teamId,
      totalTasks: team.totalTasksCompleted || 0,
      successfulTasks: Math.floor((team.totalTasksCompleted || 0) * (team.successRate || 0)),
      averageResponseTime: team.avgResponseTime || 0,
      memberContributions: {},
      collaborationScore: 0.85,
      efficiencyScore: 0.78,
    };
  }

  async delegateTaskToTeam(teamId: string, task: string, context?: Record<string, any>): Promise<{
    assignedAgent: string;
    reasoning: string;
  }> {
    const team = await this.getTeam(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    const members = await this.getTeamMembers(teamId);
    const taskLower = task.toLowerCase();

    let assignedAgent = team.leadAgentId;
    let reasoning = 'Assigned to team lead for coordination';

    for (const member of members) {
      const agent = agentManifestLoader.getEnterpriseAgent(member.agentId);
      if (agent?.capabilities?.some((cap: string) => taskLower.includes(cap.toLowerCase()))) {
        assignedAgent = member.agentId;
        reasoning = `Matched to ${agent.name} based on capability alignment`;
        break;
      }
    }

    this.emit('task-delegated', { teamId, task, assignedAgent });
    
    return { assignedAgent, reasoning };
  }

  getTemplates(): TeamTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(templateId: string): TeamTemplate | undefined {
    return this.templates.get(templateId);
  }

  async scaleTeam(teamId: string, targetSize: number): Promise<string[]> {
    const team = await this.getTeam(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    const currentMembers = (team.memberAgentIds as string[]) || [];
    const currentSize = currentMembers.length + 1;

    if (targetSize <= currentSize) {
      return currentMembers;
    }

    const sectorAgents = agentManifestLoader.getEnterpriseAgentsByVertical(team.sectorFocus || 'general');
    const availableAgents = sectorAgents.filter(a => !currentMembers.includes(a.id) && a.id !== team.leadAgentId);

    const newMembers: string[] = [];
    for (let i = 0; i < targetSize - currentSize && i < availableAgents.length; i++) {
      await this.addMemberToTeam(teamId, availableAgents[i].id, 'specialist');
      newMembers.push(availableAgents[i].id);
    }

    this.emit('team-scaled', { teamId, newSize: currentSize + newMembers.length });
    
    return [...currentMembers, ...newMembers];
  }
}

export const teamBuilderService = TeamBuilderService.getInstance();
