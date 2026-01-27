/**
 * Wizards Founder Graph Service
 * Layer 2: Manages founder profiles, startup metadata, and relationship mapping
 * 
 * Part of Wizards Incubator Platform infrastructure
 * Provides comprehensive relationship graph for founders, investors, mentors, and team members
 */

import { db } from '../db';
import {
  wizardsStartups,
  wizardsFounders,
  wizardsInvestors,
  wizardsInvestorMatches,
  wizardsInvestorConnections,
  wizardsMentors,
  wizardsMentorMatches,
} from '@shared/schema';
import { eq, inArray, and, or, desc, sql } from 'drizzle-orm';

type WizardsStartup = typeof wizardsStartups.$inferSelect;
type WizardsFounder = typeof wizardsFounders.$inferSelect;
type WizardsInvestor = typeof wizardsInvestors.$inferSelect;
type WizardsMentor = typeof wizardsMentors.$inferSelect;

export type RelationshipType = 'cofounder' | 'advisor' | 'mentor' | 'investor' | 'partner' | 'team_member' | 'connection';

export interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: number;
  sourceType: 'founder' | 'startup' | 'investor' | 'mentor';
  targetId: number;
  targetType: 'founder' | 'startup' | 'investor' | 'mentor';
  strength: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  linkedinUrl?: string;
  equity?: number;
  joinedAt: Date;
}

export interface NetworkNode {
  id: number;
  type: 'founder' | 'startup' | 'investor' | 'mentor';
  name: string;
  connections: number[];
  attributes: Record<string, any>;
}

export interface RelationshipGraph {
  nodes: NetworkNode[];
  edges: Relationship[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    density: number;
    avgConnections: number;
  };
}

export class WizardsFounderGraphService {
  async createFounder(data: {
    userId: number;
    founderType?: 'solo' | 'co-founder';
    industryExperience?: string;
    technicalBackground?: boolean;
    startupStage?: 'idea' | 'validation' | 'mvp' | 'launched' | 'scaling';
  }): Promise<WizardsFounder> {
    const [founder] = await db
      .insert(wizardsFounders)
      .values({
        userId: data.userId,
        founderType: data.founderType || 'solo',
        industryExperience: data.industryExperience,
        technicalBackground: data.technicalBackground || false,
        startupStage: data.startupStage || 'idea',
      })
      .returning();

    return founder;
  }

  async getFounderByUserId(userId: number): Promise<WizardsFounder | undefined> {
    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.userId, userId),
    });
    return founder;
  }

  async updateFounder(
    founderId: number,
    updates: Partial<{
      founderType: string;
      industryExperience: string;
      technicalBackground: boolean;
      startupStage: string;
      currentStudio: string;
      journeyProgress: number;
    }>
  ): Promise<WizardsFounder> {
    const [updated] = await db
      .update(wizardsFounders)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(wizardsFounders.id, founderId))
      .returning();

    return updated;
  }

  async createStartup(data: {
    founderId: number;
    name: string;
    tagline?: string;
    description?: string;
    industry: string;
    problemStatement?: string;
    solutionDescription?: string;
    targetMarket?: string;
    businessModel?: string;
    stage?: 'ideation' | 'validation' | 'development' | 'launch' | 'growth';
  }): Promise<WizardsStartup> {
    const [startup] = await db
      .insert(wizardsStartups)
      .values({
        founderId: data.founderId,
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        industry: data.industry,
        problemStatement: data.problemStatement,
        solutionDescription: data.solutionDescription,
        targetMarket: data.targetMarket,
        businessModel: data.businessModel,
        stage: data.stage || 'ideation',
      })
      .returning();

    return startup;
  }

  async getStartupById(startupId: number): Promise<WizardsStartup | undefined> {
    const startup = await db.query.wizardsStartups.findFirst({
      where: eq(wizardsStartups.id, startupId),
    });
    return startup;
  }

  async getStartupsByFounder(founderId: number): Promise<WizardsStartup[]> {
    const startups = await db
      .select()
      .from(wizardsStartups)
      .where(eq(wizardsStartups.founderId, founderId));
    return startups;
  }

  async updateStartup(
    startupId: number,
    updates: Partial<{
      name: string;
      tagline: string;
      description: string;
      industry: string;
      problemStatement: string;
      solutionDescription: string;
      targetMarket: string;
      businessModel: string;
      stage: string;
      currentDay: number;
      status: string;
    }>
  ): Promise<WizardsStartup> {
    const [updated] = await db
      .update(wizardsStartups)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(wizardsStartups.id, startupId))
      .returning();

    return updated;
  }

  async getFounderProfile(userId: number): Promise<{
    founder: WizardsFounder | undefined;
    startups: WizardsStartup[];
    stats: {
      startupCount: number;
      journeyProgress: number;
      completedStudios: number;
      currentStage: string;
    };
  }> {
    const founder = await this.getFounderByUserId(userId);
    
    if (!founder) {
      return {
        founder: undefined,
        startups: [],
        stats: {
          startupCount: 0,
          journeyProgress: 0,
          completedStudios: 0,
          currentStage: 'not_started',
        },
      };
    }

    const startups = await this.getStartupsByFounder(founder.id);

    return {
      founder,
      startups,
      stats: {
        startupCount: startups.length,
        journeyProgress: founder.journeyProgress || 0,
        completedStudios: (founder.completedStudios as string[]).length,
        currentStage: founder.startupStage,
      },
    };
  }

  async addNetworkConnection(founderId: number, targetFounderId: number): Promise<boolean> {
    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.id, founderId),
    });
    
    if (!founder) return false;

    const currentConnections = (founder.networkConnections as number[]) || [];
    if (currentConnections.includes(targetFounderId)) {
      return true;
    }

    await db
      .update(wizardsFounders)
      .set({
        networkConnections: [...currentConnections, targetFounderId],
        updatedAt: new Date(),
      })
      .where(eq(wizardsFounders.id, founderId));

    const targetFounder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.id, targetFounderId),
    });
    
    if (targetFounder) {
      const targetConnections = (targetFounder.networkConnections as number[]) || [];
      if (!targetConnections.includes(founderId)) {
        await db
          .update(wizardsFounders)
          .set({
            networkConnections: [...targetConnections, founderId],
            updatedAt: new Date(),
          })
          .where(eq(wizardsFounders.id, targetFounderId));
      }
    }

    return true;
  }

  async removeNetworkConnection(founderId: number, targetFounderId: number): Promise<boolean> {
    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.id, founderId),
    });
    
    if (!founder) return false;

    const currentConnections = (founder.networkConnections as number[]) || [];
    const updatedConnections = currentConnections.filter(id => id !== targetFounderId);

    await db
      .update(wizardsFounders)
      .set({
        networkConnections: updatedConnections,
        updatedAt: new Date(),
      })
      .where(eq(wizardsFounders.id, founderId));

    const targetFounder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.id, targetFounderId),
    });
    
    if (targetFounder) {
      const targetConnections = (targetFounder.networkConnections as number[]) || [];
      const targetUpdated = targetConnections.filter(id => id !== founderId);
      await db
        .update(wizardsFounders)
        .set({
          networkConnections: targetUpdated,
          updatedAt: new Date(),
        })
        .where(eq(wizardsFounders.id, targetFounderId));
    }

    return true;
  }

  async getNetworkConnections(founderId: number): Promise<WizardsFounder[]> {
    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.id, founderId),
    });
    
    if (!founder) return [];

    const connectionIds = (founder.networkConnections as number[]) || [];
    if (connectionIds.length === 0) return [];

    const connections = await db
      .select()
      .from(wizardsFounders)
      .where(inArray(wizardsFounders.id, connectionIds));

    return connections;
  }

  async getInvestorRelationships(startupId: number): Promise<{
    matches: any[];
    connections: any[];
  }> {
    const matches = await db
      .select({
        match: wizardsInvestorMatches,
        investor: wizardsInvestors,
      })
      .from(wizardsInvestorMatches)
      .innerJoin(wizardsInvestors, eq(wizardsInvestorMatches.investorId, wizardsInvestors.id))
      .where(eq(wizardsInvestorMatches.startupId, startupId));

    const connections = await db
      .select({
        connection: wizardsInvestorConnections,
        investor: wizardsInvestors,
      })
      .from(wizardsInvestorConnections)
      .innerJoin(wizardsInvestors, eq(wizardsInvestorConnections.investorId, wizardsInvestors.id))
      .where(eq(wizardsInvestorConnections.startupId, startupId));

    return { matches, connections };
  }

  async getMentorRelationships(startupId: number): Promise<{
    matches: any[];
  }> {
    const matches = await db
      .select({
        match: wizardsMentorMatches,
        mentor: wizardsMentors,
      })
      .from(wizardsMentorMatches)
      .innerJoin(wizardsMentors, eq(wizardsMentorMatches.mentorId, wizardsMentors.id))
      .where(eq(wizardsMentorMatches.startupId, startupId));

    return { matches };
  }

  async getStartupRelationshipGraph(startupId: number): Promise<RelationshipGraph> {
    const startup = await this.getStartupById(startupId);
    if (!startup) {
      return {
        nodes: [],
        edges: [],
        metrics: { totalNodes: 0, totalEdges: 0, density: 0, avgConnections: 0 },
      };
    }

    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.id, startup.founderId),
    });

    const nodes: NetworkNode[] = [];
    const edges: Relationship[] = [];

    nodes.push({
      id: startupId,
      type: 'startup',
      name: startup.name,
      connections: [],
      attributes: { industry: startup.industry, stage: startup.currentPhase },
    });

    if (founder) {
      nodes.push({
        id: founder.id,
        type: 'founder',
        name: founder.name,
        connections: (founder.networkConnections as number[]) || [],
        attributes: { founderType: founder.founderType, stage: founder.startupStage },
      });

      edges.push({
        id: `founder-startup-${founder.id}-${startupId}`,
        type: 'cofounder',
        sourceId: founder.id,
        sourceType: 'founder',
        targetId: startupId,
        targetType: 'startup',
        strength: 1.0,
        createdAt: founder.createdAt || new Date(),
      });
    }

    const { matches: investorMatches } = await this.getInvestorRelationships(startupId);
    for (const { investor, match } of investorMatches) {
      if (!nodes.find(n => n.id === investor.id && n.type === 'investor')) {
        nodes.push({
          id: investor.id,
          type: 'investor',
          name: investor.name,
          connections: [],
          attributes: { investorType: investor.investorType, focusAreas: investor.focusAreas },
        });
      }

      edges.push({
        id: `investor-startup-${investor.id}-${startupId}`,
        type: 'investor',
        sourceId: investor.id,
        sourceType: 'investor',
        targetId: startupId,
        targetType: 'startup',
        strength: match.matchScore ? match.matchScore / 100 : 0.5,
        metadata: { status: match.status, matchScore: match.matchScore },
        createdAt: match.createdAt || new Date(),
      });
    }

    const { matches: mentorMatches } = await this.getMentorRelationships(startupId);
    for (const { mentor, match } of mentorMatches) {
      if (!nodes.find(n => n.id === mentor.id && n.type === 'mentor')) {
        nodes.push({
          id: mentor.id,
          type: 'mentor',
          name: mentor.name,
          connections: [],
          attributes: { expertise: mentor.expertise, availability: mentor.availability },
        });
      }

      edges.push({
        id: `mentor-startup-${mentor.id}-${startupId}`,
        type: 'mentor',
        sourceId: mentor.id,
        sourceType: 'mentor',
        targetId: startupId,
        targetType: 'startup',
        strength: 0.7,
        metadata: { status: match.status, goals: match.goals },
        createdAt: match.createdAt || new Date(),
      });
    }

    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const density = totalNodes > 1 ? (2 * totalEdges) / (totalNodes * (totalNodes - 1)) : 0;
    const avgConnections = totalNodes > 0 ? totalEdges / totalNodes : 0;

    return {
      nodes,
      edges,
      metrics: {
        totalNodes,
        totalEdges,
        density,
        avgConnections,
      },
    };
  }

  async getFounderNetworkGraph(founderId: number): Promise<RelationshipGraph> {
    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.id, founderId),
    });

    if (!founder) {
      return {
        nodes: [],
        edges: [],
        metrics: { totalNodes: 0, totalEdges: 0, density: 0, avgConnections: 0 },
      };
    }

    const nodes: NetworkNode[] = [];
    const edges: Relationship[] = [];

    nodes.push({
      id: founder.id,
      type: 'founder',
      name: founder.name,
      connections: (founder.networkConnections as number[]) || [],
      attributes: { founderType: founder.founderType, stage: founder.startupStage },
    });

    const connections = await this.getNetworkConnections(founderId);
    for (const connection of connections) {
      nodes.push({
        id: connection.id,
        type: 'founder',
        name: connection.name,
        connections: (connection.networkConnections as number[]) || [],
        attributes: { founderType: connection.founderType, stage: connection.startupStage },
      });

      edges.push({
        id: `connection-${founderId}-${connection.id}`,
        type: 'connection',
        sourceId: founderId,
        sourceType: 'founder',
        targetId: connection.id,
        targetType: 'founder',
        strength: 0.5,
        createdAt: connection.createdAt || new Date(),
      });
    }

    const startups = await this.getStartupsByFounder(founderId);
    for (const startup of startups) {
      nodes.push({
        id: startup.id,
        type: 'startup',
        name: startup.name,
        connections: [],
        attributes: { industry: startup.industry, stage: startup.currentPhase },
      });

      edges.push({
        id: `founder-startup-${founderId}-${startup.id}`,
        type: 'cofounder',
        sourceId: founderId,
        sourceType: 'founder',
        targetId: startup.id,
        targetType: 'startup',
        strength: 1.0,
        createdAt: startup.createdAt || new Date(),
      });
    }

    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const density = totalNodes > 1 ? (2 * totalEdges) / (totalNodes * (totalNodes - 1)) : 0;
    const avgConnections = totalNodes > 0 ? totalEdges / totalNodes : 0;

    return {
      nodes,
      edges,
      metrics: {
        totalNodes,
        totalEdges,
        density,
        avgConnections,
      },
    };
  }

  async findConnectionPath(
    sourceFounderId: number,
    targetFounderId: number,
    maxDepth: number = 3
  ): Promise<number[]> {
    const visited = new Set<number>();
    const queue: { founderId: number; path: number[] }[] = [
      { founderId: sourceFounderId, path: [sourceFounderId] },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.founderId === targetFounderId) {
        return current.path;
      }

      if (current.path.length > maxDepth) {
        continue;
      }

      if (visited.has(current.founderId)) {
        continue;
      }
      visited.add(current.founderId);

      const connections = await this.getNetworkConnections(current.founderId);
      for (const connection of connections) {
        if (!visited.has(connection.id)) {
          queue.push({
            founderId: connection.id,
            path: [...current.path, connection.id],
          });
        }
      }
    }

    return [];
  }

  async getMutualConnections(founderId1: number, founderId2: number): Promise<WizardsFounder[]> {
    const connections1 = await this.getNetworkConnections(founderId1);
    const connections2 = await this.getNetworkConnections(founderId2);

    const ids1 = new Set(connections1.map(c => c.id));
    const mutual = connections2.filter(c => ids1.has(c.id));

    return mutual;
  }

  async getFounderById(founderId: number): Promise<WizardsFounder | undefined> {
    const founder = await db.query.wizardsFounders.findFirst({
      where: eq(wizardsFounders.id, founderId),
    });
    return founder;
  }

  async getRelationshipStats(founderId: number): Promise<{
    totalConnections: number;
    totalStartups: number;
    totalInvestorRelationships: number;
    totalMentorRelationships: number;
    networkReach: number;
  }> {
    const connections = await this.getNetworkConnections(founderId);
    const startups = await this.getStartupsByFounder(founderId);
    
    let totalInvestorRelationships = 0;
    let totalMentorRelationships = 0;
    
    for (const startup of startups) {
      const { matches: investorMatches } = await this.getInvestorRelationships(startup.id);
      const { matches: mentorMatches } = await this.getMentorRelationships(startup.id);
      totalInvestorRelationships += investorMatches.length;
      totalMentorRelationships += mentorMatches.length;
    }

    let networkReach = connections.length;
    for (const connection of connections) {
      const secondDegree = await this.getNetworkConnections(connection.id);
      networkReach += secondDegree.length;
    }

    return {
      totalConnections: connections.length,
      totalStartups: startups.length,
      totalInvestorRelationships,
      totalMentorRelationships,
      networkReach,
    };
  }
}

export const wizardsFounderGraphService = new WizardsFounderGraphService();
