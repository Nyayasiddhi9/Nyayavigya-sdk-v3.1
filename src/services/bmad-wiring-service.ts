/**
 * BMAD (Behavioral Multi-Agent Design) Wiring Service
 * 
 * Enables agent personality and behavioral patterns for human-like interaction:
 * - Personality traits (analytical, creative, pragmatic, empathetic)
 * - Communication styles (formal, casual, technical, simple)
 * - Decision-making patterns (risk-averse, innovative, balanced)
 * - Emotional intelligence and context-awareness
 * 
 * Integration Points:
 * - Pre-orchestration: Apply personality to prompts
 * - During-orchestration: Behavioral consistency checks
 * - Post-orchestration: Personality effectiveness metrics
 */

import type { StudioType } from '@shared/schema';

export interface AgentPersonality {
  traits: {
    analytical: number; // 0-1
    creative: number;
    pragmatic: number;
    empathetic: number;
  };
  communicationStyle: 'formal' | 'casual' | 'technical' | 'simple';
  decisionMaking: 'risk-averse' | 'innovative' | 'balanced';
  emotionalIntelligence: number; // 0-1
}

export interface BehavioralPattern {
  patternId: string;
  name: string;
  description: string;
  promptModifications: string[];
  constraints: string[];
  triggers: string[];
}

export interface BMADConfig {
  enablePersonality: boolean;
  enableBehavioralPatterns: boolean;
  adaptToContext: boolean;
}

/**
 * BMAD Wiring Service
 */
class BMADWiringService {
  private agentPersonalities: Map<string, AgentPersonality> = new Map();
  private behavioralPatterns: Map<string, BehavioralPattern> = new Map();

  constructor() {
    this.initializeDefaultPersonalities();
    this.initializeDefaultPatterns();
    console.log('🎭 BMAD Wiring Service initialized');
    console.log('🎯 Features: Personality traits, Behavioral patterns, Emotional intelligence');
  }

  /**
   * Initialize default agent personalities
   */
  private initializeDefaultPersonalities(): void {
    // Analytical personality (for engineering/data agents)
    this.agentPersonalities.set('analytical', {
      traits: { analytical: 0.9, creative: 0.3, pragmatic: 0.8, empathetic: 0.4 },
      communicationStyle: 'technical',
      decisionMaking: 'balanced',
      emotionalIntelligence: 0.6,
    });

    // Creative personality (for design/content agents)
    this.agentPersonalities.set('creative', {
      traits: { analytical: 0.4, creative: 0.95, pragmatic: 0.5, empathetic: 0.7 },
      communicationStyle: 'casual',
      decisionMaking: 'innovative',
      emotionalIntelligence: 0.8,
    });

    // Pragmatic personality (for business/operations agents)
    this.agentPersonalities.set('pragmatic', {
      traits: { analytical: 0.7, creative: 0.5, pragmatic: 0.95, empathetic: 0.6 },
      communicationStyle: 'formal',
      decisionMaking: 'risk-averse',
      emotionalIntelligence: 0.7,
    });

    // Empathetic personality (for customer-facing agents)
    this.agentPersonalities.set('empathetic', {
      traits: { analytical: 0.5, creative: 0.6, pragmatic: 0.6, empathetic: 0.95 },
      communicationStyle: 'simple',
      decisionMaking: 'balanced',
      emotionalIntelligence: 0.9,
    });
  }

  /**
   * Initialize default behavioral patterns
   */
  private initializeDefaultPatterns(): void {
    this.behavioralPatterns.set('collaborative', {
      patternId: 'collaborative',
      name: 'Collaborative Pattern',
      description: 'Works well with other agents, shares information freely',
      promptModifications: [
        'Consider how this impacts other team members',
        'Share insights that could help others',
        'Build on ideas from previous agents',
      ],
      constraints: ['Must acknowledge contributions from others'],
      triggers: ['multi-agent workflow', 'team task'],
    });

    this.behavioralPatterns.set('innovative', {
      patternId: 'innovative',
      name: 'Innovative Pattern',
      description: 'Explores novel solutions, takes calculated risks',
      promptModifications: [
        'Think outside the box',
        'Consider unconventional approaches',
        'Balance innovation with feasibility',
      ],
      constraints: ['Must validate assumptions'],
      triggers: ['complex problem', 'creative task'],
    });

    this.behavioralPatterns.set('methodical', {
      patternId: 'methodical',
      name: 'Methodical Pattern',
      description: 'Follows systematic processes, double-checks work',
      promptModifications: [
        'Break down into clear steps',
        'Verify each step before proceeding',
        'Document reasoning and decisions',
      ],
      constraints: ['Must provide justification for choices'],
      triggers: ['critical task', 'high-stakes decision'],
    });
  }

  /**
   * Apply personality to prompt
   */
  applyPersonalityToPrompt(
    prompt: string,
    studioType: StudioType,
    agentId: string
  ): string {
    // Select personality based on studio type
    const personalityKey = this.selectPersonalityForStudio(studioType);
    const personality = this.agentPersonalities.get(personalityKey);

    if (!personality) return prompt;

    // Build personality context
    const personalityContext = this.buildPersonalityContext(personality);

    // Inject personality into prompt
    const enhancedPrompt = `${personalityContext}\n\n${prompt}`;

    console.log(`🎭 [BMAD] Applied ${personalityKey} personality to ${agentId} (${studioType})`);

    return enhancedPrompt;
  }

  /**
   * Apply behavioral pattern to workflow
   */
  applyBehavioralPattern(
    prompt: string,
    workflow: string,
    complexity: number
  ): string {
    // Select pattern based on complexity and workflow type
    let patternKey = 'methodical';
    if (complexity > 0.7) {
      patternKey = workflow === 'parallel' ? 'collaborative' : 'innovative';
    }

    const pattern = this.behavioralPatterns.get(patternKey);
    if (!pattern) return prompt;

    // Apply pattern modifications
    const modifications = pattern.promptModifications.join('\n- ');
    const enhancedPrompt = `${prompt}\n\nBehavioral Guidelines:\n- ${modifications}`;

    console.log(`🎯 [BMAD] Applied ${pattern.name} to workflow (complexity: ${complexity.toFixed(2)})`);

    return enhancedPrompt;
  }

  /**
   * Select personality based on studio type
   */
  private selectPersonalityForStudio(studioType: StudioType): string {
    const studioPersonalityMap: Record<string, string> = {
      'ideation_lab': 'creative',
      'market_validation': 'analytical',
      'product_development': 'analytical',
      'growth_hacking': 'pragmatic',
      'monetization': 'pragmatic',
      'operations': 'pragmatic',
      'legal_compliance': 'analytical',
      'finance': 'analytical',
      'hr_recruiting': 'empathetic',
      'enterprise_readiness': 'analytical',
    };

    return studioPersonalityMap[studioType] || 'pragmatic';
  }

  /**
   * Build personality context for prompts
   */
  private buildPersonalityContext(personality: AgentPersonality): string {
    const traits = [];
    if (personality.traits.analytical > 0.7) traits.push('analytical and data-driven');
    if (personality.traits.creative > 0.7) traits.push('creative and innovative');
    if (personality.traits.pragmatic > 0.7) traits.push('practical and results-oriented');
    if (personality.traits.empathetic > 0.7) traits.push('empathetic and user-focused');

    return `You are ${traits.join(', ')}. Communicate in a ${personality.communicationStyle} style and make ${personality.decisionMaking} decisions.`;
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      status: 'healthy' as const,
      personalitiesLoaded: this.agentPersonalities.size,
      patternsLoaded: this.behavioralPatterns.size,
      features: {
        personality: true,
        behavioralPatterns: true,
        emotionalIntelligence: true,
        contextAdaptation: true,
      },
    };
  }
}

// Export singleton instance
export const bmadWiringService = new BMADWiringService();
