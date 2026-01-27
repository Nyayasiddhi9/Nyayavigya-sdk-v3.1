/**
 * Context Engineering Engine
 * Advanced prompt enhancement and context optimization for AI agents
 * - Dynamic context analysis and enrichment
 * - Multi-layered prompt engineering
 * - User-specific context adaptation
 * - Performance-driven optimization
 */

import { advancedCachingSystem } from './advanced-caching-system';
import { mem0Memory } from './mem0-memory';
import { intelligentAgentOrchestrator } from './intelligent-agent-orchestrator';

export interface ContextProfile {
  userId: string;
  domain: string;
  expertise: string[];
  preferences: {
    detail_level: 'brief' | 'moderate' | 'comprehensive';
    style: 'technical' | 'business' | 'casual' | 'academic';
    format: 'structured' | 'narrative' | 'bullet-points';
    examples: boolean;
  };
  history: ContextHistory[];
}

export interface ContextHistory {
  prompt: string;
  enhanced_prompt: string;
  performance_score: number;
  user_satisfaction: number;
  timestamp: Date;
  task_type: string;
}

export interface EnhancementRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  enhancement: (match: string, context: any) => string;
  priority: number;
  applicable_domains: string[];
  performance_impact: number;
}

export interface ContextEnrichment {
  original_prompt: string;
  enhanced_prompt: string;
  enrichment_score: number;
  applied_rules: string[];
  context_additions: {
    domain_knowledge: string[];
    best_practices: string[];
    examples: string[];
    constraints: string[];
  };
  estimated_improvement: number;
}

export class ContextEngineeringEngine {
  private enhancementRules: Map<string, EnhancementRule>;
  private contextProfiles: Map<string, ContextProfile>;
  private domainKnowledge: Map<string, any>;
  private performanceMetrics: Map<string, number>;

  constructor() {
    this.enhancementRules = new Map();
    this.contextProfiles = new Map();
    this.domainKnowledge = new Map();
    this.performanceMetrics = new Map();
    
    this.initializeEnhancementRules();
    this.initializeDomainKnowledge();
  }

  private initializeEnhancementRules() {
    const rules: EnhancementRule[] = [
      // Software Development Rules
      {
        id: 'code_context',
        name: 'Code Context Enhancement',
        description: 'Adds technical context for coding tasks',
        pattern: /\b(code|function|class|method|algorithm|bug|debug|optimize)\b/i,
        enhancement: (match, context) => 
          `For this ${match.toLowerCase()} task, consider: ${context.tech_stack || 'the current technology stack'}, performance implications, maintainability, testing requirements, and best practices. `,
        priority: 9,
        applicable_domains: ['software_development', 'web_development', 'mobile_development'],
        performance_impact: 0.85
      },
      {
        id: 'architecture_context',
        name: 'Architecture Context',
        description: 'Adds system design considerations',
        pattern: /\b(architecture|design|system|scalability|performance|database)\b/i,
        enhancement: (match, context) =>
          `For this ${match.toLowerCase()} consideration, analyze: scalability requirements, performance bottlenecks, security implications, maintainability, cost optimization, and integration patterns. Include specific recommendations based on current scale: ${context.scale || 'medium scale'}. `,
        priority: 8,
        applicable_domains: ['software_development', 'enterprise', 'cloud'],
        performance_impact: 0.90
      },
      // Business Context Rules
      {
        id: 'business_strategy',
        name: 'Business Strategy Context',
        description: 'Adds strategic business considerations',
        pattern: /\b(strategy|business|market|revenue|growth|competition)\b/i,
        enhancement: (match, context) =>
          `For this ${match.toLowerCase()} analysis, consider: market dynamics, competitive positioning, ROI implications, stakeholder impact, risk assessment, and implementation timeline. Target audience: ${context.target_audience || 'general business audience'}. `,
        priority: 7,
        applicable_domains: ['business', 'marketing', 'strategy'],
        performance_impact: 0.75
      },
      // Creative Content Rules
      {
        id: 'creative_enhancement',
        name: 'Creative Content Enhancement',
        description: 'Enhances creative and content generation tasks',
        pattern: /\b(create|generate|write|design|content|story|article)\b/i,
        enhancement: (match, context) =>
          `For this ${match.toLowerCase()} task, incorporate: target audience persona, brand voice (${context.brand_voice || 'professional'}), emotional tone, call-to-action elements, SEO considerations, and engagement metrics. Style: ${context.content_style || 'engaging and informative'}. `,
        priority: 6,
        applicable_domains: ['content_creation', 'marketing', 'creative'],
        performance_impact: 0.80
      },
      // Research Enhancement Rules
      {
        id: 'research_methodology',
        name: 'Research Methodology',
        description: 'Adds research rigor and methodology',
        pattern: /\b(research|analyze|study|investigate|examine|data)\b/i,
        enhancement: (match, context) =>
          `For this ${match.toLowerCase()} task, apply: systematic methodology, credible source verification, bias consideration, data triangulation, statistical significance, and evidence-based conclusions. Research depth: ${context.research_depth || 'comprehensive'}. `,
        priority: 8,
        applicable_domains: ['research', 'analytics', 'academic'],
        performance_impact: 0.88
      },
      // User Personalization Rules
      {
        id: 'expertise_adaptation',
        name: 'Expertise Level Adaptation',
        description: 'Adapts content to user expertise level',
        pattern: /.*/,
        enhancement: (match, context) => {
          const level = context.expertise_level || 'intermediate';
          const adaptations = {
            beginner: 'Provide foundational concepts, step-by-step explanations, common pitfalls to avoid, and practical examples. ',
            intermediate: 'Include technical details, best practices, alternative approaches, and performance considerations. ',
            expert: 'Focus on advanced techniques, edge cases, optimization strategies, and cutting-edge developments. '
          };
          return adaptations[level] || adaptations.intermediate;
        },
        priority: 5,
        applicable_domains: ['all'],
        performance_impact: 0.70
      },
      // Multi-modal Enhancement
      {
        id: 'multimodal_context',
        name: 'Multi-modal Context',
        description: 'Adds context for multi-modal tasks',
        pattern: /\b(image|video|audio|visual|media|multimedia)\b/i,
        enhancement: (match, context) =>
          `For this ${match.toLowerCase()} task, consider: accessibility requirements, format optimization, compression vs quality trade-offs, cross-platform compatibility, and user experience implications. Target format: ${context.target_format || 'web-optimized'}. `,
        priority: 7,
        applicable_domains: ['multimedia', 'design', 'content_creation'],
        performance_impact: 0.82
      }
    ];

    rules.forEach(rule => this.enhancementRules.set(rule.id, rule));
  }

  private initializeDomainKnowledge() {
    this.domainKnowledge.set('software_development', {
      best_practices: [
        'Follow SOLID principles',
        'Implement comprehensive testing',
        'Use version control effectively',
        'Write self-documenting code',
        'Consider security implications',
        'Optimize for maintainability'
      ],
      common_patterns: [
        'MVC architecture',
        'Repository pattern',
        'Factory pattern',
        'Observer pattern',
        'Dependency injection'
      ],
      performance_considerations: [
        'Algorithm complexity',
        'Memory usage',
        'Database query optimization',
        'Caching strategies',
        'Async/await patterns'
      ]
    });

    this.domainKnowledge.set('business', {
      frameworks: [
        'SWOT analysis',
        'Porter\'s Five Forces',
        'Business Model Canvas',
        'OKRs methodology',
        'Lean startup principles'
      ],
      metrics: [
        'ROI calculation',
        'Customer acquisition cost',
        'Lifetime value',
        'Conversion rates',
        'Market penetration'
      ]
    });

    this.domainKnowledge.set('content_creation', {
      principles: [
        'Know your audience',
        'Clear value proposition',
        'Compelling headlines',
        'Strong call-to-action',
        'SEO optimization',
        'Engagement metrics'
      ],
      formats: [
        'Blog posts',
        'Social media content',
        'Email campaigns',
        'Video scripts',
        'Presentations'
      ]
    });
  }

  /**
   * Main context engineering method
   */
  async enhanceContext(
    originalPrompt: string,
    userId: string,
    taskContext: any = {},
    options: {
      aggressive_enhancement?: boolean;
      preserve_original?: boolean;
      target_domain?: string;
    } = {}
  ): Promise<ContextEnrichment> {
    // Check cache first
    const cached = await advancedCachingSystem.getCachedContextEngineering(
      originalPrompt,
      taskContext
    );
    
    if (cached && !options.aggressive_enhancement) {
      return cached;
    }

    // Get or create user context profile
    const contextProfile = await this.getContextProfile(userId);
    
    // Analyze prompt and detect domain
    const promptAnalysis = await this.analyzePrompt(originalPrompt, taskContext);
    
    // Apply enhancement rules
    const enhancement = await this.applyEnhancementRules(
      originalPrompt,
      promptAnalysis,
      contextProfile,
      taskContext,
      options
    );

    // Add domain-specific knowledge
    const enrichedEnhancement = await this.enrichWithDomainKnowledge(
      enhancement,
      promptAnalysis.detected_domains,
      contextProfile
    );

    // Calculate improvement metrics
    const enrichmentResult: ContextEnrichment = {
      original_prompt: originalPrompt,
      enhanced_prompt: enrichedEnhancement.enhanced_prompt,
      enrichment_score: enrichedEnhancement.score,
      applied_rules: enrichedEnhancement.applied_rules,
      context_additions: enrichedEnhancement.context_additions,
      estimated_improvement: this.calculateEstimatedImprovement(
        originalPrompt,
        enrichedEnhancement.enhanced_prompt,
        promptAnalysis
      )
    };

    // Cache the result
    await advancedCachingSystem.cacheContextEngineering(
      originalPrompt,
      enrichmentResult.enhanced_prompt,
      taskContext,
      enrichmentResult.applied_rules
    );

    // Update user context profile
    await this.updateContextProfile(userId, {
      prompt: originalPrompt,
      enhanced_prompt: enrichmentResult.enhanced_prompt,
      performance_score: enrichmentResult.enrichment_score,
      user_satisfaction: 0, // To be updated later
      timestamp: new Date(),
      task_type: promptAnalysis.task_type
    });

    return enrichmentResult;
  }

  /**
   * Analyze prompt to detect intent, domain, and complexity
   */
  private async analyzePrompt(prompt: string, context: any) {
    const words = prompt.toLowerCase().split(/\s+/);
    const domains = [];
    const intents = [];
    let complexity = 'medium';

    // Domain detection
    const domainKeywords = {
      software_development: ['code', 'function', 'class', 'algorithm', 'debug', 'api', 'database'],
      business: ['strategy', 'market', 'revenue', 'growth', 'competition', 'roi'],
      content_creation: ['write', 'create', 'content', 'article', 'blog', 'copy'],
      research: ['research', 'analyze', 'study', 'data', 'investigate', 'examine'],
      design: ['design', 'ui', 'ux', 'interface', 'visual', 'layout'],
      multimedia: ['image', 'video', 'audio', 'media', 'animation']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const matches = keywords.filter(keyword => words.includes(keyword)).length;
      if (matches > 0) {
        domains.push({ domain, confidence: matches / keywords.length });
      }
    }

    // Intent detection
    const intentPatterns = {
      create: /\b(create|generate|build|make|develop)\b/i,
      analyze: /\b(analyze|examine|evaluate|assess|review)\b/i,
      explain: /\b(explain|describe|clarify|define|elaborate)\b/i,
      optimize: /\b(optimize|improve|enhance|refactor|streamline)\b/i,
      troubleshoot: /\b(debug|fix|solve|resolve|troubleshoot)\b/i
    };

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(prompt)) {
        intents.push(intent);
      }
    }

    // Complexity estimation
    if (prompt.length > 500 || context.requirements?.length > 5) {
      complexity = 'high';
    } else if (prompt.length < 100 && intents.length === 1) {
      complexity = 'low';
    }

    return {
      detected_domains: domains.sort((a, b) => b.confidence - a.confidence),
      detected_intents: intents,
      complexity,
      task_type: intents[0] || 'general',
      word_count: words.length,
      technical_terms: this.countTechnicalTerms(words)
    };
  }

  /**
   * Apply enhancement rules based on analysis
   */
  private async applyEnhancementRules(
    originalPrompt: string,
    analysis: any,
    profile: ContextProfile,
    taskContext: any,
    options: any
  ) {
    let enhancedPrompt = originalPrompt;
    const appliedRules: string[] = [];
    const contextAdditions = {
      domain_knowledge: [],
      best_practices: [],
      examples: [],
      constraints: []
    };
    let totalScore = 0;

    // Sort rules by priority and applicability
    const applicableRules = Array.from(this.enhancementRules.values())
      .filter(rule => 
        rule.applicable_domains.includes('all') ||
        analysis.detected_domains.some(d => rule.applicable_domains.includes(d.domain))
      )
      .sort((a, b) => b.priority - a.priority);

    for (const rule of applicableRules) {
      if (rule.pattern.test(originalPrompt) || rule.id === 'expertise_adaptation') {
        const enhancement = rule.enhancement(originalPrompt, {
          ...taskContext,
          ...profile.preferences,
          expertise_level: this.determineExpertiseLevel(profile),
          scale: taskContext.scale || 'medium',
          target_audience: profile.domain,
          brand_voice: profile.preferences.style
        });

        if (enhancement && enhancement.trim()) {
          enhancedPrompt = enhancement + enhancedPrompt;
          appliedRules.push(rule.id);
          totalScore += rule.performance_impact;

          // Categorize enhancements
          if (rule.id.includes('best_practices') || rule.name.includes('best')) {
            contextAdditions.best_practices.push(rule.name);
          } else if (rule.id.includes('knowledge') || rule.name.includes('Context')) {
            contextAdditions.domain_knowledge.push(rule.name);
          }
        }
      }
    }

    // Add role-specific context
    const roleContext = this.generateRoleContext(analysis, profile);
    if (roleContext) {
      enhancedPrompt = roleContext + '\n\n' + enhancedPrompt;
      contextAdditions.constraints.push('Role-specific context');
    }

    // Add output format specifications
    const formatContext = this.generateFormatContext(profile.preferences);
    if (formatContext) {
      enhancedPrompt += '\n\n' + formatContext;
      contextAdditions.constraints.push('Output format specification');
    }

    return {
      enhanced_prompt: enhancedPrompt,
      applied_rules: appliedRules,
      context_additions: contextAdditions,
      score: totalScore / applicableRules.length
    };
  }

  /**
   * Enrich with domain-specific knowledge
   */
  private async enrichWithDomainKnowledge(
    enhancement: any,
    detectedDomains: any[],
    profile: ContextProfile
  ) {
    let enrichedPrompt = enhancement.enhanced_prompt;

    for (const domainInfo of detectedDomains.slice(0, 2)) { // Top 2 domains
      const knowledge = this.domainKnowledge.get(domainInfo.domain);
      if (knowledge) {
        // Add best practices
        if (knowledge.best_practices && profile.preferences.detail_level !== 'brief') {
          const practices = knowledge.best_practices.slice(0, 3).join(', ');
          enrichedPrompt += `\n\nKey ${domainInfo.domain} best practices to consider: ${practices}.`;
          enhancement.context_additions.best_practices.push(...knowledge.best_practices.slice(0, 3));
        }

        // Add relevant frameworks or patterns
        if (knowledge.frameworks && profile.preferences.style === 'technical') {
          const frameworks = knowledge.frameworks.slice(0, 2).join(', ');
          enrichedPrompt += `\n\nRelevant frameworks: ${frameworks}.`;
          enhancement.context_additions.domain_knowledge.push(...knowledge.frameworks.slice(0, 2));
        }

        // Add performance considerations for technical domains
        if (knowledge.performance_considerations && domainInfo.domain === 'software_development') {
          const considerations = knowledge.performance_considerations.slice(0, 2).join(', ');
          enrichedPrompt += `\n\nPerformance considerations: ${considerations}.`;
          enhancement.context_additions.constraints.push(...knowledge.performance_considerations.slice(0, 2));
        }
      }
    }

    return {
      ...enhancement,
      enhanced_prompt: enrichedPrompt,
      score: enhancement.score * (1 + (detectedDomains.length * 0.1)) // Boost score for domain knowledge
    };
  }

  /**
   * Generate role-specific context
   */
  private generateRoleContext(analysis: any, profile: ContextProfile): string {
    const primaryDomain = analysis.detected_domains[0]?.domain;
    const intent = analysis.detected_intents[0];

    const roleContexts = {
      software_development: {
        create: "You are a senior software architect with expertise in scalable system design. ",
        analyze: "You are a code review specialist with deep knowledge of best practices and security. ",
        optimize: "You are a performance optimization expert with experience in high-traffic systems. "
      },
      business: {
        create: "You are a strategic business consultant with expertise in market analysis and growth strategies. ",
        analyze: "You are a business analyst with deep experience in data-driven decision making. ",
        optimize: "You are an operational excellence consultant focused on process improvement. "
      },
      content_creation: {
        create: "You are a professional content strategist with expertise in audience engagement and SEO. ",
        analyze: "You are a content performance analyst with experience in metrics and optimization. ",
        optimize: "You are a conversion optimization specialist focused on engagement and results. "
      }
    };

    return roleContexts[primaryDomain]?.[intent] || 
           `You are an expert in ${primaryDomain || 'the relevant field'} with a focus on delivering high-quality, actionable insights. `;
  }

  /**
   * Generate output format context
   */
  private generateFormatContext(preferences: any): string {
    const formats = {
      structured: "Please provide your response in a well-structured format with clear headings, bullet points, and numbered steps where appropriate.",
      narrative: "Please provide your response in a narrative format with smooth transitions and storytelling elements.",
      'bullet-points': "Please organize your response using bullet points and concise statements for easy scanning."
    };

    let formatContext = formats[preferences.format] || formats.structured;

    if (preferences.examples) {
      formatContext += " Include specific examples and practical applications where relevant.";
    }

    if (preferences.detail_level === 'comprehensive') {
      formatContext += " Provide comprehensive details and thorough explanations.";
    } else if (preferences.detail_level === 'brief') {
      formatContext += " Keep the response concise and focused on key points.";
    }

    return formatContext;
  }

  /**
   * Get or create user context profile
   */
  private async getContextProfile(userId: string): Promise<ContextProfile> {
    if (this.contextProfiles.has(userId)) {
      return this.contextProfiles.get(userId)!;
    }

    // Try to get from cache or memory
    const cached = await advancedCachingSystem.getCachedUserContext(userId);
    if (cached) {
      this.contextProfiles.set(userId, cached);
      return cached;
    }

    // Create new profile
    const profile: ContextProfile = {
      userId,
      domain: 'general',
      expertise: [],
      preferences: {
        detail_level: 'moderate',
        style: 'technical',
        format: 'structured',
        examples: true
      },
      history: []
    };

    this.contextProfiles.set(userId, profile);
    await advancedCachingSystem.cacheUserContext(userId, profile);

    return profile;
  }

  /**
   * Update context profile with new history
   */
  private async updateContextProfile(userId: string, historyEntry: ContextHistory) {
    const profile = await this.getContextProfile(userId);
    profile.history.push(historyEntry);

    // Keep only last 50 entries
    if (profile.history.length > 50) {
      profile.history = profile.history.slice(-50);
    }

    // Update expertise based on history
    this.updateExpertiseFromHistory(profile);

    // Cache updated profile
    await advancedCachingSystem.cacheUserContext(userId, profile);

    // Store in mem0 for persistence
    await mem0Memory.storeMemory(userId, {
      type: 'context_profile_update',
      profile,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Helper methods
   */
  private determineExpertiseLevel(profile: ContextProfile): string {
    const historyLength = profile.history.length;
    const avgPerformance = profile.history.reduce((sum, h) => sum + h.performance_score, 0) / historyLength || 0;

    if (historyLength > 20 && avgPerformance > 8) return 'expert';
    if (historyLength > 10 && avgPerformance > 6) return 'intermediate';
    return 'beginner';
  }

  private countTechnicalTerms(words: string[]): number {
    const technicalTerms = [
      'api', 'database', 'algorithm', 'framework', 'architecture', 'optimization',
      'scalability', 'performance', 'security', 'authentication', 'deployment'
    ];
    return words.filter(word => technicalTerms.includes(word.toLowerCase())).length;
  }

  private calculateEstimatedImprovement(original: string, enhanced: string, analysis: any): number {
    const lengthImprovement = (enhanced.length - original.length) / original.length;
    const complexityBonus = analysis.complexity === 'high' ? 0.2 : analysis.complexity === 'low' ? 0.1 : 0.15;
    const domainBonus = analysis.detected_domains.length * 0.1;
    
    return Math.min(100, Math.max(0, (lengthImprovement + complexityBonus + domainBonus) * 100));
  }

  private updateExpertiseFromHistory(profile: ContextProfile) {
    const recentHistory = profile.history.slice(-10);
    const domainCounts = new Map<string, number>();
    
    recentHistory.forEach(entry => {
      domainCounts.set(entry.task_type, (domainCounts.get(entry.task_type) || 0) + 1);
    });

    profile.expertise = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([domain]) => domain);
  }

  /**
   * Performance feedback for learning
   */
  async updatePerformanceFeedback(
    userId: string,
    originalPrompt: string,
    userSatisfaction: number
  ) {
    const profile = await this.getContextProfile(userId);
    const historyEntry = profile.history.find(h => h.prompt === originalPrompt);
    
    if (historyEntry) {
      historyEntry.user_satisfaction = userSatisfaction;
      await this.updateContextProfile(userId, historyEntry);
    }
  }

  /**
   * Get analytics and performance metrics
   */
  getAnalytics() {
    const totalProfiles = this.contextProfiles.size;
    const totalEnhancements = Array.from(this.contextProfiles.values())
      .reduce((sum, profile) => sum + profile.history.length, 0);
    
    const avgImprovement = Array.from(this.contextProfiles.values())
      .flatMap(profile => profile.history)
      .reduce((sum, entry) => sum + entry.performance_score, 0) / totalEnhancements || 0;

    const ruleUsage = {};
    this.enhancementRules.forEach((rule, id) => {
      ruleUsage[id] = this.performanceMetrics.get(id) || 0;
    });

    return {
      totalProfiles,
      totalEnhancements,
      averageImprovement: avgImprovement.toFixed(2),
      ruleUsage,
      topDomains: this.getTopDomains(),
      improvementTrend: this.getImprovementTrend()
    };
  }

  private getTopDomains(): Array<{ domain: string; count: number }> {
    const domainCounts = new Map<string, number>();
    
    this.contextProfiles.forEach(profile => {
      profile.expertise.forEach(domain => {
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      });
    });

    return Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getImprovementTrend(): number[] {
    const recentHistory = Array.from(this.contextProfiles.values())
      .flatMap(profile => profile.history)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-30); // Last 30 enhancements

    return recentHistory.map(entry => entry.performance_score);
  }
}

export const contextEngineeringEngine = new ContextEngineeringEngine();