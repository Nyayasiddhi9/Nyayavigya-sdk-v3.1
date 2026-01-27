/**
 * Continuous Learning Service
 * Real-time learning and adaptation for agents
 */

import { EventEmitter } from 'events';

export interface LearningEvent {
  id: string;
  agentId: string;
  eventType: 'success' | 'failure' | 'feedback' | 'correction';
  context: Record<string, unknown>;
  outcome: Record<string, unknown>;
  learningSignal: number;
  timestamp: Date;
}

export interface LearningState {
  agentId: string;
  totalEvents: number;
  successRate: number;
  learningProgress: number;
  lastUpdate: Date;
}

export class ContinuousLearningService extends EventEmitter {
  private static instance: ContinuousLearningService;
  private events: LearningEvent[] = [];
  private agentStates: Map<string, LearningState> = new Map();
  private isActive: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    console.log('📚 ContinuousLearningService initialized');
  }

  public static getInstance(): ContinuousLearningService {
    if (!ContinuousLearningService.instance) {
      ContinuousLearningService.instance = new ContinuousLearningService();
    }
    return ContinuousLearningService.instance;
  }

  public async start(pollIntervalMs: number = 10000): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    this.pollInterval = setInterval(() => this.pollAndLearn(), pollIntervalMs);
    
    console.log('🚀 Continuous Learning Service started');
    this.emit('service-started');
  }

  public async stop(): Promise<void> {
    this.isActive = false;
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    console.log('⏹️ Continuous Learning Service stopped');
    this.emit('service-stopped');
  }

  private async pollAndLearn(): Promise<void> {
    const recentEvents = this.events.filter(
      e => Date.now() - e.timestamp.getTime() < 60000
    );

    for (const event of recentEvents) {
      await this.processLearningEvent(event);
    }

    this.emit('poll-completed', { eventsProcessed: recentEvents.length });
  }

  private async processLearningEvent(event: LearningEvent): Promise<void> {
    let state = this.agentStates.get(event.agentId);
    
    if (!state) {
      state = {
        agentId: event.agentId,
        totalEvents: 0,
        successRate: 0.5,
        learningProgress: 0,
        lastUpdate: new Date()
      };
      this.agentStates.set(event.agentId, state);
    }

    state.totalEvents++;
    
    if (event.eventType === 'success') {
      state.successRate = state.successRate * 0.95 + 0.05;
    } else if (event.eventType === 'failure') {
      state.successRate = state.successRate * 0.95;
    }
    
    state.learningProgress = Math.min(100, state.learningProgress + event.learningSignal * 10);
    state.lastUpdate = new Date();

    this.emit('agent-state-updated', state);
  }

  public async recordEvent(event: Omit<LearningEvent, 'id' | 'timestamp'>): Promise<LearningEvent> {
    const fullEvent: LearningEvent = {
      ...event,
      id: `learn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.events.push(fullEvent);
    
    if (this.events.length > 10000) {
      this.events = this.events.slice(-5000);
    }

    this.emit('event-recorded', fullEvent);
    
    return fullEvent;
  }

  public async recordSuccess(agentId: string, context: Record<string, unknown>): Promise<LearningEvent> {
    return this.recordEvent({
      agentId,
      eventType: 'success',
      context,
      outcome: { success: true },
      learningSignal: 1.0
    });
  }

  public async recordFailure(agentId: string, context: Record<string, unknown>, error?: string): Promise<LearningEvent> {
    return this.recordEvent({
      agentId,
      eventType: 'failure',
      context,
      outcome: { success: false, error },
      learningSignal: -0.5
    });
  }

  public async recordFeedback(
    agentId: string, 
    context: Record<string, unknown>, 
    rating: number
  ): Promise<LearningEvent> {
    return this.recordEvent({
      agentId,
      eventType: 'feedback',
      context,
      outcome: { rating },
      learningSignal: (rating - 0.5) * 2
    });
  }

  public getAgentState(agentId: string): LearningState | undefined {
    return this.agentStates.get(agentId);
  }

  public getAllAgentStates(): LearningState[] {
    return Array.from(this.agentStates.values());
  }

  public getRecentEvents(limit: number = 100): LearningEvent[] {
    return this.events.slice(-limit);
  }

  public getStats(): {
    isActive: boolean;
    totalEvents: number;
    totalAgents: number;
    averageSuccessRate: number;
  } {
    const states = Array.from(this.agentStates.values());
    
    return {
      isActive: this.isActive,
      totalEvents: this.events.length,
      totalAgents: this.agentStates.size,
      averageSuccessRate: states.length > 0
        ? states.reduce((sum, s) => sum + s.successRate, 0) / states.length
        : 0
    };
  }
}

export const continuousLearning = ContinuousLearningService.getInstance();
export default ContinuousLearningService;
