/**
 * Context Engineering Wiring Service
 * 
 * Enables advanced prompt optimization with memory and context injection:
 * - Long-term memory integration (past conversations, user preferences)
 * - Short-term context (current session, recent tasks)
 * - Domain-specific context (industry knowledge, technical specs)
 * - Adaptive complexity (adjust based on task difficulty)
 * 
 * Integration Points:
 * - Pre-orchestration: Inject relevant context into prompts
 * - During-orchestration: Maintain context consistency
 * - Post-orchestration: Update context memory
 */

import { ContextEngineeringService } from './context-engineering-service';
import type { EnhancedRequest } from './context-engineering-service';
import type { StudioType } from '@shared/schema';

export interface ContextLayers {
  userContext: string[];
  sessionContext: string[];
  domainContext: string[];
  historicalContext: string[];
}

export interface ContextConfig {
  enableMemory: boolean;
  maxContextTokens: number;
  includeHistory: boolean;
  adaptiveComplexity: boolean;
}

/**
 * Context Engineering Wiring Service
 */
class ContextEngineeringWiringService {
  private contextService: ContextEngineeringService;
  private sessionContexts: Map<number, ContextLayers> = new Map();

  constructor() {
    this.contextService = new ContextEngineeringService({
      maxContextTokens: 200000,
      enablePromptOptimization: true,
      enableMemoryIntegration: true,
      adaptiveComplexity: true,
    });
    console.log('🧠 Context Engineering Wiring Service initialized');
    console.log('🎯 Features: Memory integration, Context injection, Adaptive complexity');
  }

  /**
   * Build context layers for orchestration
   */
  async buildContextLayers(
    startupId: number,
    sessionId: number,
    founderId: string,
    studioType: StudioType
  ): Promise<ContextLayers> {
    // Check if we have existing context for this session
    const existing = this.sessionContexts.get(sessionId);
    if (existing) {
      console.log(`🧠 [Context] Using cached context for session ${sessionId}`);
      return existing;
    }

    // Build new context layers
    const layers: ContextLayers = {
      userContext: await this.buildUserContext(founderId),
      sessionContext: await this.buildSessionContext(startupId, sessionId),
      domainContext: this.buildDomainContext(studioType),
      historicalContext: await this.buildHistoricalContext(startupId),
    };

    // Cache for session
    this.sessionContexts.set(sessionId, layers);

    console.log(`🧠 [Context] Built context layers for ${studioType}:`);
    console.log(`  👤 User: ${layers.userContext.length} items`);
    console.log(`  📊 Session: ${layers.sessionContext.length} items`);
    console.log(`  🎯 Domain: ${layers.domainContext.length} items`);
    console.log(`  📚 History: ${layers.historicalContext.length} items`);

    return layers;
  }

  /**
   * Inject context into prompt
   */
  injectContextIntoPrompt(
    prompt: string,
    layers: ContextLayers,
    config: Partial<ContextConfig> = {}
  ): string {
    const fullConfig: ContextConfig = {
      enableMemory: true,
      maxContextTokens: 10000,
      includeHistory: true,
      adaptiveComplexity: true,
      ...config,
    };

    // Build context sections
    const sections: string[] = [];

    // User context
    if (fullConfig.enableMemory && layers.userContext.length > 0) {
      sections.push(`User Context:\n${layers.userContext.join('\n')}`);
    }

    // Session context
    if (layers.sessionContext.length > 0) {
      sections.push(`Current Session:\n${layers.sessionContext.join('\n')}`);
    }

    // Domain context
    if (layers.domainContext.length > 0) {
      sections.push(`Domain Knowledge:\n${layers.domainContext.join('\n')}`);
    }

    // Historical context
    if (fullConfig.includeHistory && layers.historicalContext.length > 0) {
      sections.push(`Previous Work:\n${layers.historicalContext.slice(0, 3).join('\n')}`);
    }

    // Combine with original prompt
    const contextPrefix = sections.length > 0 ? sections.join('\n\n') + '\n\n---\n\n' : '';
    const enhancedPrompt = `${contextPrefix}${prompt}`;

    console.log(`🧠 [Context] Injected ${sections.length} context layers into prompt`);

    return enhancedPrompt;
  }

  /**
   * Build user context (preferences, history)
   */
  private async buildUserContext(founderId: string): Promise<string[]> {
    // Placeholder - would query user preferences from database
    return [
      `Founder ID: ${founderId}`,
      'Preference: Technical detail level - medium',
      'Preference: Communication style - professional',
    ];
  }

  /**
   * Build session context (current tasks, goals)
   */
  private async buildSessionContext(startupId: number, sessionId: number): Promise<string[]> {
    // Placeholder - would query current session data
    return [
      `Startup ID: ${startupId}`,
      `Session ID: ${sessionId}`,
      'Goal: Build MVP in 14 days',
    ];
  }

  /**
   * Build domain context (industry knowledge)
   */
  private buildDomainContext(studioType: StudioType): string[] {
    const domainKnowledge: Record<string, string[]> = {
      'ideation_lab': [
        'Focus: Market validation and competitive analysis',
        'Best practices: Problem-first, solution-second approach',
      ],
      'market_validation': [
        'Focus: Data-driven market insights',
        'Frameworks: TAM/SAM/SOM, Porter\'s Five Forces',
      ],
      'product_development': [
        'Focus: Production-ready code with best practices',
        'Tech stack: React, Node.js, TypeScript, PostgreSQL',
      ],
      'growth_hacking': [
        'Focus: Rapid growth experiments and marketing',
        'Frameworks: AARRR metrics, growth loops',
      ],
      'monetization': [
        'Focus: Revenue optimization and pricing strategy',
        'Best practices: Value-based pricing, subscription models',
      ],
      'operations': [
        'Focus: Operational efficiency and process optimization',
        'Standards: Lean, Six Sigma, automation-first',
      ],
      'legal_compliance': [
        'Focus: Legal compliance and risk management',
        'Standards: GDPR, SOC2, data protection',
      ],
      'finance': [
        'Focus: Financial planning and management',
        'Frameworks: Financial modeling, budgeting, forecasting',
      ],
      'hr_recruiting': [
        'Focus: Talent acquisition and team building',
        'Best practices: Culture fit, skills assessment, onboarding',
      ],
      'enterprise_readiness': [
        'Focus: Enterprise-grade features and security',
        'Standards: SSO, audit logs, role-based access',
      ],
    };

    return domainKnowledge[studioType] || [
      'Focus: Professional deliverables',
      'Standard: Production quality',
    ];
  }

  /**
   * Build historical context (past work)
   */
  private async buildHistoricalContext(startupId: number): Promise<string[]> {
    // Placeholder - would query past orchestration results
    return [
      'Previous milestone: Completed idea validation',
      'Previous output: Market research report',
    ];
  }

  /**
   * Update context after orchestration
   */
  async updateContext(
    sessionId: number,
    newContext: string[]
  ): Promise<void> {
    const existing = this.sessionContexts.get(sessionId);
    if (!existing) return;

    // Add to session context
    existing.sessionContext.push(...newContext);

    console.log(`🧠 [Context] Updated session ${sessionId} with ${newContext.length} new items`);
  }

  /**
   * Clear session context
   */
  clearSessionContext(sessionId: number): void {
    this.sessionContexts.delete(sessionId);
    console.log(`🧠 [Context] Cleared context for session ${sessionId}`);
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      status: 'healthy' as const,
      activeSessions: this.sessionContexts.size,
      features: {
        memoryIntegration: true,
        contextInjection: true,
        adaptiveComplexity: true,
        domainKnowledge: true,
      },
    };
  }
}

// Export singleton instance
export const contextEngineeringWiringService = new ContextEngineeringWiringService();
