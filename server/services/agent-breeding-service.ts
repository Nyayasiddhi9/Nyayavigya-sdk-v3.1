/**
 * Agent Breeding Service - Phase 5
 * Autonomous agent creation through evolutionary breeding
 * 
 * Features:
 * - Capability crossover from parent agents
 * - Trait mutation and specialization
 * - Fitness evaluation and selection
 * - Human approval gates for new agents
 * - Agent evolution tracking
 */

import { EventEmitter } from 'events';
import { db } from '../db';
import { agentBreeding, AgentBreeding, agentCatalog } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { agentManifestLoader } from './agent-manifest-loader';

export interface BreedingRequest {
  parentAgentIds: string[];
  breedingStrategy: 'crossover' | 'specialization' | 'evolution' | 'fusion';
  targetSpecialization?: string;
  targetRomaLevel?: string;
  targetTier?: string;
  requiresApproval?: boolean;
}

export interface BreedingResult {
  breedingId: string;
  childAgent: {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    tools: string[];
    personality: Record<string, any>;
    tier: string;
    romaLevel: string;
  };
  inheritedFrom: Record<string, string[]>;
  mutations: string[];
  fitnessScore: number;
}

class AgentBreedingService extends EventEmitter {
  private static instance: AgentBreedingService;
  private mutationRate: number = 0.15;

  private constructor() {
    super();
    console.log('🧬 Agent Breeding Service initialized');
  }

  public static getInstance(): AgentBreedingService {
    if (!AgentBreedingService.instance) {
      AgentBreedingService.instance = new AgentBreedingService();
    }
    return AgentBreedingService.instance;
  }

  async initiateBreeding(request: BreedingRequest): Promise<AgentBreeding> {
    const breedingId = `breed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (request.parentAgentIds.length < 1) {
      throw new Error('At least one parent agent is required');
    }

    const parents = request.parentAgentIds
      .map(id => agentManifestLoader.getEnterpriseAgent(id))
      .filter(Boolean);

    if (parents.length === 0) {
      throw new Error('No valid parent agents found');
    }

    const breedingData = {
      breedingId,
      parentAgentIds: request.parentAgentIds,
      breedingStrategy: request.breedingStrategy,
      targetSpecialization: request.targetSpecialization,
      targetRomaLevel: request.targetRomaLevel || 'L2',
      targetTier: request.targetTier || 'development',
      requiresApproval: request.requiresApproval ?? true,
      status: 'pending',
    };

    const [breeding] = await db.insert(agentBreeding).values(breedingData).returning();

    this.emit('breeding-initiated', breeding);
    console.log(`✅ Initiated agent breeding: ${breedingId}`);

    return breeding;
  }

  async executeBreeding(breedingId: string): Promise<BreedingResult> {
    const [breeding] = await db.select()
      .from(agentBreeding)
      .where(eq(agentBreeding.breedingId, breedingId));

    if (!breeding) {
      throw new Error(`Breeding ${breedingId} not found`);
    }

    await db.update(agentBreeding)
      .set({ status: 'breeding' })
      .where(eq(agentBreeding.breedingId, breedingId));

    const parentIds = (breeding.parentAgentIds as string[]) || [];
    const parents = parentIds
      .map(id => agentManifestLoader.getEnterpriseAgent(id))
      .filter(Boolean);

    let childTraits: {
      capabilities: string[];
      tools: string[];
      personality: Record<string, any>;
    };

    const inheritedFrom: Record<string, string[]> = {};
    const mutations: string[] = [];

    switch (breeding.breedingStrategy) {
      case 'crossover':
        childTraits = this.crossover(parents, inheritedFrom);
        break;
      case 'specialization':
        childTraits = this.specialize(parents, breeding.targetSpecialization || '', inheritedFrom);
        break;
      case 'evolution':
        childTraits = this.evolve(parents, inheritedFrom, mutations);
        break;
      case 'fusion':
        childTraits = this.fuse(parents, inheritedFrom);
        break;
      default:
        childTraits = this.crossover(parents, inheritedFrom);
    }

    this.applyMutations(childTraits, mutations);

    const childAgentId = `bred-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const parentNames = parents.map(p => p!.name.split(' ')[0]).join('-');
    const childName = `${parentNames}-${breeding.targetSpecialization || 'Hybrid'}`;

    const childAgent = {
      id: childAgentId,
      name: childName,
      description: `Bred agent from ${parents.length} parent(s) using ${breeding.breedingStrategy} strategy`,
      capabilities: childTraits.capabilities,
      tools: childTraits.tools,
      personality: childTraits.personality,
      tier: breeding.targetTier || 'development',
      romaLevel: breeding.targetRomaLevel || 'L2',
    };

    const fitnessScore = this.evaluateFitness(childAgent, breeding.targetSpecialization);
    const diversityScore = this.calculateDiversity(childTraits.capabilities, parents);
    const capabilityScore = childTraits.capabilities.length / 20;

    await db.update(agentBreeding)
      .set({
        childAgentId,
        childName,
        childDescription: childAgent.description,
        inheritedCapabilities: childTraits.capabilities,
        inheritedTools: childTraits.tools,
        inheritedPersonality: childTraits.personality,
        mutations,
        fitnessScore,
        diversityScore,
        capabilityScore,
        status: breeding.requiresApproval ? 'evaluating' : 'active',
      })
      .where(eq(agentBreeding.breedingId, breedingId));

    const result: BreedingResult = {
      breedingId,
      childAgent,
      inheritedFrom,
      mutations,
      fitnessScore,
    };

    this.emit('breeding-completed', result);

    return result;
  }

  private crossover(parents: any[], inheritedFrom: Record<string, string[]>): {
    capabilities: string[];
    tools: string[];
    personality: Record<string, any>;
  } {
    const capabilities: string[] = [];
    const tools: string[] = [];

    parents.forEach((parent, idx) => {
      const parentCaps = parent.capabilities || [];
      const selectedCaps = parentCaps.slice(0, Math.ceil(parentCaps.length / 2));
      selectedCaps.forEach((cap: string) => {
        if (!capabilities.includes(cap)) {
          capabilities.push(cap);
          inheritedFrom[cap] = inheritedFrom[cap] || [];
          inheritedFrom[cap].push(parent.id);
        }
      });

      const parentTools = parent.tools || [];
      const selectedTools = parentTools.slice(0, Math.ceil(parentTools.length / 2));
      selectedTools.forEach((tool: string) => {
        if (!tools.includes(tool)) tools.push(tool);
      });
    });

    const personality = this.blendPersonalities(parents);

    return { capabilities, tools, personality };
  }

  private specialize(
    parents: any[], 
    specialization: string,
    inheritedFrom: Record<string, string[]>
  ): {
    capabilities: string[];
    tools: string[];
    personality: Record<string, any>;
  } {
    const capabilities: string[] = [];
    const tools: string[] = [];

    parents.forEach(parent => {
      const parentCaps = (parent.capabilities || []) as string[];
      parentCaps
        .filter((cap: string) => 
          cap.toLowerCase().includes(specialization.toLowerCase()) ||
          specialization.toLowerCase().includes(cap.toLowerCase())
        )
        .forEach((cap: string) => {
          if (!capabilities.includes(cap)) {
            capabilities.push(cap);
            inheritedFrom[cap] = [parent.id];
          }
        });
    });

    const specializationCaps = [
      `${specialization}-analysis`,
      `${specialization}-strategy`,
      `${specialization}-optimization`,
    ];
    capabilities.push(...specializationCaps);

    const personality = {
      traits: ['specialized', 'focused', 'expert'],
      communicationStyle: 'technical',
      decisionStyle: 'analytical',
      riskTolerance: 'moderate',
    };

    return { capabilities, tools, personality };
  }

  private evolve(
    parents: any[],
    inheritedFrom: Record<string, string[]>,
    mutations: string[]
  ): {
    capabilities: string[];
    tools: string[];
    personality: Record<string, any>;
  } {
    const base = this.crossover(parents, inheritedFrom);

    const mutationTypes = ['enhance', 'combine', 'generalize'];
    const mutation = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];

    switch (mutation) {
      case 'enhance':
        const enhancedCap = base.capabilities[0] + '-advanced';
        base.capabilities.push(enhancedCap);
        mutations.push(`Enhanced: ${enhancedCap}`);
        break;
      case 'combine':
        if (base.capabilities.length >= 2) {
          const combinedCap = `${base.capabilities[0]}-${base.capabilities[1]}`;
          base.capabilities.push(combinedCap);
          mutations.push(`Combined: ${combinedCap}`);
        }
        break;
      case 'generalize':
        base.capabilities.push('cross-domain-analysis');
        mutations.push('Added cross-domain analysis capability');
        break;
    }

    return base;
  }

  private fuse(parents: any[], inheritedFrom: Record<string, string[]>): {
    capabilities: string[];
    tools: string[];
    personality: Record<string, any>;
  } {
    const capabilities: string[] = [];
    const tools: string[] = [];

    parents.forEach(parent => {
      (parent.capabilities || []).forEach((cap: string) => {
        if (!capabilities.includes(cap)) {
          capabilities.push(cap);
          inheritedFrom[cap] = inheritedFrom[cap] || [];
          inheritedFrom[cap].push(parent.id);
        }
      });

      (parent.tools || []).forEach((tool: string) => {
        if (!tools.includes(tool)) tools.push(tool);
      });
    });

    const personality = this.blendPersonalities(parents);
    personality.traits = [...new Set([
      ...personality.traits,
      'versatile',
      'multi-disciplinary',
    ])];

    return { capabilities, tools, personality };
  }

  private blendPersonalities(parents: any[]): Record<string, any> {
    const traits: string[] = [];
    parents.forEach(parent => {
      const parentTraits = parent.personality?.traits || [];
      traits.push(...parentTraits);
    });

    return {
      traits: [...new Set(traits)].slice(0, 5),
      communicationStyle: 'balanced',
      decisionStyle: 'analytical',
      riskTolerance: 'moderate',
    };
  }

  private applyMutations(traits: { capabilities: string[]; tools: string[]; personality: Record<string, any> }, mutations: string[]): void {
    if (Math.random() < this.mutationRate) {
      const newCap = 'adaptive-learning';
      if (!traits.capabilities.includes(newCap)) {
        traits.capabilities.push(newCap);
        mutations.push(`Spontaneous mutation: ${newCap}`);
      }
    }

    if (Math.random() < this.mutationRate / 2) {
      traits.personality.traits = traits.personality.traits || [];
      traits.personality.traits.push('innovative');
      mutations.push('Personality mutation: innovative trait added');
    }
  }

  private evaluateFitness(childAgent: any, targetSpecialization?: string | null): number {
    let score = 0;

    score += Math.min(childAgent.capabilities.length * 0.05, 0.4);

    if (targetSpecialization) {
      const matchingCaps = childAgent.capabilities.filter((cap: string) =>
        cap.toLowerCase().includes(targetSpecialization.toLowerCase())
      );
      score += matchingCaps.length * 0.1;
    }

    score += Object.keys(childAgent.personality).length * 0.05;

    return Math.min(score, 1);
  }

  private calculateDiversity(capabilities: string[], parents: any[]): number {
    const parentCaps = new Set<string>();
    parents.forEach(p => {
      (p?.capabilities || []).forEach((c: string) => parentCaps.add(c));
    });

    const uniqueToChild = capabilities.filter(c => !parentCaps.has(c));
    return uniqueToChild.length / Math.max(capabilities.length, 1);
  }

  async approveBreeding(breedingId: string, approverId: string): Promise<AgentBreeding> {
    const [breeding] = await db.update(agentBreeding)
      .set({
        status: 'active',
        approvedBy: approverId,
        approvedAt: new Date(),
        completedAt: new Date(),
      })
      .where(eq(agentBreeding.breedingId, breedingId))
      .returning();

    this.emit('breeding-approved', breeding);
    return breeding;
  }

  async rejectBreeding(breedingId: string, reason: string): Promise<AgentBreeding> {
    const [breeding] = await db.update(agentBreeding)
      .set({
        status: 'failed',
        failureReason: reason,
        completedAt: new Date(),
      })
      .where(eq(agentBreeding.breedingId, breedingId))
      .returning();

    this.emit('breeding-rejected', breeding);
    return breeding;
  }

  async getBreeding(breedingId: string): Promise<AgentBreeding | null> {
    const [breeding] = await db.select()
      .from(agentBreeding)
      .where(eq(agentBreeding.breedingId, breedingId));
    return breeding || null;
  }

  async getBreedingHistory(limit: number = 20): Promise<AgentBreeding[]> {
    return db.select()
      .from(agentBreeding)
      .orderBy(desc(agentBreeding.createdAt))
      .limit(limit);
  }

  async getPendingApprovals(): Promise<AgentBreeding[]> {
    return db.select()
      .from(agentBreeding)
      .where(eq(agentBreeding.status, 'evaluating'));
  }
}

export const agentBreedingService = AgentBreedingService.getInstance();
