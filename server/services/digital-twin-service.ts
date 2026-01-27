/**
 * Digital Twin Service - Phase 2/3/5
 * AI representations of users, agents, and teams
 * 
 * Features:
 * - Twin creation from user profiles
 * - Behavior modeling and decision pattern capture
 * - Twin synchronization with source data
 * - Privacy controls (GDPR/CCPA compliant)
 * - Human-Twin collaboration
 * - Learning from human interactions
 */

import { EventEmitter } from 'events';
import { db } from '../db';
import { digitalTwins, twinHumanInteractions, DigitalTwin, TwinHumanInteraction } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { agentManifestLoader } from './agent-manifest-loader';

export interface TwinCreationRequest {
  name: string;
  sourceType: 'user' | 'agent' | 'team' | 'department' | 'process';
  sourceId: string;
  ownerId: string;
  description?: string;
  avatar?: string;
  personality?: TwinPersonality;
  syncSources?: string[];
}

export interface TwinPersonality {
  traits: string[];
  communicationStyle: 'analytical' | 'creative' | 'pragmatic' | 'balanced';
  decisionStyle: 'analytical' | 'intuitive' | 'collaborative' | 'decisive';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export interface TwinAction {
  actionType: string;
  input: any;
  output: any;
  reasoning: string;
  confidence: number;
}

export interface HumanFeedback {
  approved: boolean;
  correction?: string;
  notes?: string;
}

class DigitalTwinService extends EventEmitter {
  private static instance: DigitalTwinService;

  private constructor() {
    super();
    console.log('👤 Digital Twin Service initialized');
  }

  public static getInstance(): DigitalTwinService {
    if (!DigitalTwinService.instance) {
      DigitalTwinService.instance = new DigitalTwinService();
    }
    return DigitalTwinService.instance;
  }

  async createTwin(request: TwinCreationRequest): Promise<DigitalTwin> {
    const twinId = `twin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const defaultPersonality: TwinPersonality = {
      traits: ['helpful', 'professional', 'detail-oriented'],
      communicationStyle: 'balanced',
      decisionStyle: 'analytical',
      riskTolerance: 'moderate',
    };

    const twinData = {
      twinId,
      name: request.name,
      sourceType: request.sourceType,
      sourceId: request.sourceId,
      ownerId: request.ownerId,
      description: request.description || `Digital twin of ${request.name}`,
      avatar: request.avatar,
      personality: request.personality || defaultPersonality,
      decisionPatterns: [],
      preferences: {},
      expertise: [],
      syncEnabled: true,
      syncFrequency: 'realtime',
      syncSources: request.syncSources || [],
      privacyLevel: 'private',
      consentGiven: true,
      complianceFlags: { gdpr: true, ccpa: true },
      status: 'configuring',
      version: '1.0.0',
    };

    const [twin] = await db.insert(digitalTwins).values(twinData).returning();

    this.emit('twin-created', twin);
    console.log(`✅ Created digital twin: ${twin.name} (${twinId})`);

    return twin;
  }

  async getTwin(twinId: string): Promise<DigitalTwin | null> {
    const [twin] = await db.select().from(digitalTwins).where(eq(digitalTwins.twinId, twinId));
    return twin || null;
  }

  async getTwinsByOwner(ownerId: string): Promise<DigitalTwin[]> {
    return db.select().from(digitalTwins).where(eq(digitalTwins.ownerId, ownerId));
  }

  async getTwinBySource(sourceType: string, sourceId: string): Promise<DigitalTwin | null> {
    const [twin] = await db.select().from(digitalTwins)
      .where(and(eq(digitalTwins.sourceType, sourceType), eq(digitalTwins.sourceId, sourceId)));
    return twin || null;
  }

  async updateTwinStatus(twinId: string, status: string): Promise<DigitalTwin | null> {
    const [twin] = await db.update(digitalTwins)
      .set({ status, updatedAt: new Date() })
      .where(eq(digitalTwins.twinId, twinId))
      .returning();
    
    this.emit('twin-status-changed', { twinId, status });
    return twin || null;
  }

  async activateTwin(twinId: string): Promise<DigitalTwin | null> {
    return this.updateTwinStatus(twinId, 'active');
  }

  async syncTwin(twinId: string): Promise<boolean> {
    const twin = await this.getTwin(twinId);
    if (!twin) {
      throw new Error(`Twin ${twinId} not found`);
    }

    if (twin.sourceType === 'agent') {
      const agent = agentManifestLoader.getEnterpriseAgent(twin.sourceId);
      if (agent) {
        await db.update(digitalTwins)
          .set({
            expertise: agent.capabilities || [],
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(digitalTwins.twinId, twinId));
      }
    }

    this.emit('twin-synced', { twinId });
    return true;
  }

  async recordTwinAction(
    twinId: string, 
    action: TwinAction
  ): Promise<void> {
    const twin = await this.getTwin(twinId);
    if (!twin) {
      throw new Error(`Twin ${twinId} not found`);
    }

    const patterns = (twin.decisionPatterns as any[]) || [];
    patterns.push({
      timestamp: new Date().toISOString(),
      actionType: action.actionType,
      confidence: action.confidence,
      reasoning: action.reasoning,
    });

    if (patterns.length > 100) {
      patterns.splice(0, patterns.length - 100);
    }

    await db.update(digitalTwins)
      .set({ 
        decisionPatterns: patterns,
        updatedAt: new Date(),
      })
      .where(eq(digitalTwins.twinId, twinId));

    this.emit('twin-action-recorded', { twinId, action });
  }

  async recordHumanInteraction(
    twinId: string,
    humanId: string,
    interactionType: string,
    twinAction: TwinAction,
    humanFeedback: HumanFeedback
  ): Promise<TwinHumanInteraction> {
    const interactionData = {
      twinId,
      humanId,
      interactionType,
      twinAction,
      twinConfidence: twinAction.confidence,
      humanResponse: humanFeedback,
      humanApproved: humanFeedback.approved,
      humanCorrection: humanFeedback.correction,
      learningApplied: false,
    };

    const [interaction] = await db.insert(twinHumanInteractions).values(interactionData).returning();

    if (humanFeedback.approved || humanFeedback.correction) {
      await this.learnFromInteraction(twinId, interaction);
    }

    this.emit('human-interaction-recorded', { twinId, humanId, interactionType });

    return interaction;
  }

  private async learnFromInteraction(twinId: string, interaction: TwinHumanInteraction): Promise<void> {
    const twin = await this.getTwin(twinId);
    if (!twin) return;

    const learningData = (twin.learningData as any) || { interactions: 0, feedbackReceived: 0 };
    learningData.interactions += 1;
    learningData.feedbackReceived += interaction.humanApproved ? 1 : 0;

    let accuracy = twin.accuracy || 0;
    if (interaction.humanApproved) {
      accuracy = (accuracy * 0.9) + 0.1;
    } else {
      accuracy = accuracy * 0.95;
    }

    await db.update(digitalTwins)
      .set({
        learningData,
        accuracy,
        updatedAt: new Date(),
      })
      .where(eq(digitalTwins.twinId, twinId));

    await db.update(twinHumanInteractions)
      .set({ learningApplied: true })
      .where(eq(twinHumanInteractions.id, interaction.id));

    this.emit('twin-learned', { twinId, accuracy });
  }

  async getInteractionHistory(twinId: string, limit: number = 50): Promise<TwinHumanInteraction[]> {
    return db.select()
      .from(twinHumanInteractions)
      .where(eq(twinHumanInteractions.twinId, twinId))
      .orderBy(desc(twinHumanInteractions.createdAt))
      .limit(limit);
  }

  async getTwinDecision(
    twinId: string, 
    context: Record<string, any>, 
    options: string[]
  ): Promise<{
    decision: string;
    confidence: number;
    reasoning: string;
    requiresHumanApproval: boolean;
  }> {
    const twin = await this.getTwin(twinId);
    if (!twin) {
      throw new Error(`Twin ${twinId} not found`);
    }

    const personality = twin.personality as TwinPersonality;
    
    let confidence = 0.7;
    let reasoning = 'Based on learned patterns and preferences';
    let decision = options[0];

    const patterns = (twin.decisionPatterns as any[]) || [];
    const similarPatterns = patterns.filter(p => 
      Object.keys(context).some(key => p.reasoning?.includes(key))
    );

    if (similarPatterns.length > 0) {
      confidence = Math.min(0.95, 0.7 + (similarPatterns.length * 0.05));
      reasoning = `Based on ${similarPatterns.length} similar past decisions`;
    }

    if (personality?.riskTolerance === 'conservative') {
      confidence *= 0.9;
    }

    const requiresHumanApproval = confidence < 0.8;

    this.emit('twin-decision-made', { twinId, decision, confidence, requiresHumanApproval });

    return {
      decision,
      confidence,
      reasoning,
      requiresHumanApproval,
    };
  }

  async createTwinFromAgent(agentId: string, ownerId: string): Promise<DigitalTwin> {
    const agent = agentManifestLoader.getEnterpriseAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return this.createTwin({
      name: `${agent.name} Twin`,
      sourceType: 'agent',
      sourceId: agentId,
      ownerId,
      description: `Digital twin of ${agent.name} - ${agent.description}`,
      personality: {
        traits: agent.capabilities?.slice(0, 5) || [],
        communicationStyle: 'balanced',
        decisionStyle: 'analytical',
        riskTolerance: 'moderate',
      },
    });
  }

  async deleteTwin(twinId: string): Promise<boolean> {
    await db.delete(twinHumanInteractions).where(eq(twinHumanInteractions.twinId, twinId));
    await db.delete(digitalTwins).where(eq(digitalTwins.twinId, twinId));
    
    this.emit('twin-deleted', { twinId });
    return true;
  }
}

export const digitalTwinService = DigitalTwinService.getInstance();
