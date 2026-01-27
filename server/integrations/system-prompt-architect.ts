/**
 * System Prompt Architect Integration
 * 
 * Implements iterative system prompt creation based on global platform standards
 * and best practices from 25+ AI coding platforms for optimal agent performance.
 * 
 * Based on: https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools
 */

import { EventEmitter } from 'events';

export interface SystemPromptTemplate {
  id: string;
  name: string;
  category: 'development' | 'creative' | 'business' | 'coordination' | 'specialized';
  platform: string; // Original platform (e.g., 'cursor', 'replit', 'v0')
  version: string;
  prompt: {
    system: string;
    context: string;
    instructions: string[];
    constraints: string[];
    examples: Array<{
      input: string;
      output: string;
      reasoning: string;
    }>;
  };
  performance: {
    successRate: number;
    qualityScore: number;
    consistency: number;
    adaptability: number;
  };
  metadata: {
    created: Date;
    lastUpdated: Date;
    usage: number;
    feedback: number;
    source: string;
  };
}

export interface PromptOptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: Array<{
    type: 'clarity' | 'specificity' | 'context' | 'constraints' | 'examples';
    description: string;
    impact: number; // 0-1 scale
  }>;
  expectedImprovement: number;
  confidence: number;
}

export interface AgentPromptProfile {
  agentId: string;
  agentType: string;
  currentPrompt: SystemPromptTemplate;
  performance: {
    currentScore: number;
    trend: 'improving' | 'stable' | 'declining';
    lastOptimization: Date;
  };
  adaptations: Array<{
    date: Date;
    change: string;
    impact: number;
    reason: string;
  }>;
}

export class SystemPromptAnalyzer extends EventEmitter {
  private promptDatabase: Map<string, SystemPromptTemplate> = new Map();
  private platformPatterns: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializePlatformPatterns();
    this.loadKnownPromptTemplates();
  }

  /**
   * Initialize patterns from major AI coding platforms
   */
  private initializePlatformPatterns(): void {
    const patterns = {
      'replit': {
        structure: 'role-based with clear constraints',
        keyElements: ['autonomous agent', 'tool usage', 'step-by-step reasoning'],
        style: 'directive and specific',
        constraints: ['safety', 'user preferences', 'efficiency'],
        examples: true,
        specialties: ['code generation', 'debugging', 'deployment']
      },
      'cursor': {
        structure: 'context-aware with file integration',
        keyElements: ['codebase understanding', 'incremental changes', 'user intent'],
        style: 'collaborative and adaptive',
        constraints: ['existing code style', 'minimal changes', 'backwards compatibility'],
        examples: true,
        specialties: ['code editing', 'refactoring', 'context preservation']
      },
      'v0': {
        structure: 'component-focused with design principles',
        keyElements: ['UI/UX best practices', 'accessibility', 'modern frameworks'],
        style: 'design-oriented and systematic',
        constraints: ['responsive design', 'performance', 'user experience'],
        examples: true,
        specialties: ['UI generation', 'component design', 'styling']
      },
      'devin': {
        structure: 'autonomous with planning capabilities',
        keyElements: ['multi-step planning', 'tool coordination', 'problem decomposition'],
        style: 'systematic and thorough',
        constraints: ['resource limits', 'time constraints', 'quality standards'],
        examples: true,
        specialties: ['project management', 'full-stack development', 'debugging']
      },
      'claude-code': {
        structure: 'conversational with deep reasoning',
        keyElements: ['understanding context', 'explaining reasoning', 'safety considerations'],
        style: 'thoughtful and explanatory',
        constraints: ['ethical guidelines', 'accuracy', 'helpfulness'],
        examples: true,
        specialties: ['code analysis', 'explanation', 'problem solving']
      }
    };

    Object.entries(patterns).forEach(([platform, pattern]) => {
      this.platformPatterns.set(platform, pattern);
    });
  }

  /**
   * Load known prompt templates from successful platforms
   */
  private loadKnownPromptTemplates(): void {
    const templates: SystemPromptTemplate[] = [
      {
        id: 'replit-agent-enhanced',
        name: 'Replit Agent Enhanced for Multi-Agent Coordination',
        category: 'development',
        platform: 'replit',
        version: '2.0',
        prompt: {
          system: `You are a senior software development agent within a multi-agent orchestration system. You work collaboratively with other specialized agents to deliver comprehensive solutions.

Your role: Execute development tasks with precision while coordinating with other agents for optimal results.

Core capabilities:
- Full-stack development across all major technologies
- Database design and optimization
- API development and integration
- Testing and quality assurance
- Deployment and DevOps

Coordination protocol:
- Communicate clearly with other agents about dependencies
- Provide detailed status updates and results
- Request assistance when tasks require specialized expertise
- Maintain consistency with overall project architecture`,
          context: `Multi-agent environment with specialized agents for different aspects of development. Focus on your specific expertise while being aware of the broader project context.`,
          instructions: [
            'Analyze requirements thoroughly before starting implementation',
            'Use best practices and industry standards for all code',
            'Provide clear documentation and comments',
            'Coordinate with other agents for integrated solutions',
            'Test thoroughly and ensure quality before completion',
            'Communicate any blockers or dependencies immediately'
          ],
          constraints: [
            'Follow established coding standards and conventions',
            'Ensure security best practices in all implementations',
            'Maintain backward compatibility unless explicitly instructed otherwise',
            'Respect resource limitations and time constraints',
            'Coordinate changes that affect other agents or systems'
          ],
          examples: [
            {
              input: 'Create a REST API for user management with authentication',
              output: 'I\'ll coordinate with the security agent for authentication patterns and database agent for schema design. Implementing Express.js API with JWT authentication, password hashing, and role-based access control...',
              reasoning: 'Demonstrates coordination with other agents while taking ownership of the implementation'
            }
          ]
        },
        performance: {
          successRate: 0.94,
          qualityScore: 0.91,
          consistency: 0.88,
          adaptability: 0.85
        },
        metadata: {
          created: new Date('2024-01-15'),
          lastUpdated: new Date(),
          usage: 1250,
          feedback: 4.7,
          source: 'replit-agent-enhanced'
        }
      },
      {
        id: 'cursor-context-aware',
        name: 'Cursor Context-Aware Code Editor',
        category: 'development',
        platform: 'cursor',
        version: '1.5',
        prompt: {
          system: `You are an intelligent code editing agent that understands context and makes precise, minimal changes to existing codebases.

Your approach:
- Understand the existing codebase structure and patterns
- Make minimal, targeted changes that fit the existing style
- Preserve existing functionality unless explicitly asked to change it
- Suggest improvements while respecting the current architecture

Key principles:
- Context preservation: Maintain existing patterns and conventions
- Incremental improvement: Make changes that build on existing code
- Style consistency: Match the established coding style
- Minimal disruption: Avoid unnecessary refactoring`,
          context: `You have access to the full codebase context and understand the relationships between files and components.`,
          instructions: [
            'Analyze the existing code structure before making changes',
            'Preserve existing patterns and naming conventions',
            'Make targeted changes that integrate seamlessly',
            'Suggest improvements that align with current architecture',
            'Explain the reasoning behind your changes',
            'Consider the impact on other parts of the codebase'
          ],
          constraints: [
            'Maintain existing code style and patterns',
            'Avoid breaking changes unless specifically requested',
            'Preserve existing functionality and behavior',
            'Keep changes minimal and focused',
            'Respect existing architecture decisions'
          ],
          examples: [
            {
              input: 'Add error handling to this API endpoint',
              output: 'Adding try-catch block following the existing error handling pattern in this codebase. Using the established error response format and logging structure...',
              reasoning: 'Shows understanding of existing patterns and consistent application'
            }
          ]
        },
        performance: {
          successRate: 0.89,
          qualityScore: 0.93,
          consistency: 0.95,
          adaptability: 0.82
        },
        metadata: {
          created: new Date('2024-02-10'),
          lastUpdated: new Date(),
          usage: 890,
          feedback: 4.6,
          source: 'cursor-context-aware'
        }
      }
    ];

    templates.forEach(template => {
      this.promptDatabase.set(template.id, template);
    });
  }

  /**
   * Analyze prompt effectiveness and suggest improvements
   */
  async analyzePrompt(prompt: string, agentType: string, context: any = {}): Promise<PromptOptimizationResult> {
    try {
      this.emit('analysis-started', {
        promptLength: prompt.length,
        agentType,
        timestamp: new Date()
      });

      const analysis = await this.performPromptAnalysis(prompt, agentType, context);
      const optimizedPrompt = await this.generateOptimizedPrompt(prompt, analysis);
      const improvements = await this.identifyImprovements(prompt, optimizedPrompt);

      const result: PromptOptimizationResult = {
        originalPrompt: prompt,
        optimizedPrompt,
        improvements,
        expectedImprovement: this.calculateExpectedImprovement(improvements),
        confidence: this.calculateConfidence(analysis, improvements)
      };

      this.emit('analysis-completed', {
        improvements: improvements.length,
        expectedImprovement: result.expectedImprovement,
        confidence: result.confidence,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'prompt-analysis', error: errorMessage });
      throw error;
    }
  }

  /**
   * Generate platform-specific system prompt
   */
  async generateSystemPrompt(
    agentType: string,
    requirements: {
      capabilities: string[];
      context: string;
      constraints: string[];
      style?: 'directive' | 'collaborative' | 'explanatory' | 'systematic';
      platform?: string;
    }
  ): Promise<SystemPromptTemplate> {
    try {
      const platformPattern = this.platformPatterns.get(requirements.platform || 'replit');
      const baseTemplate = this.findBestTemplate(agentType, requirements);
      
      const generatedPrompt = await this.synthesizePrompt(
        agentType,
        requirements,
        platformPattern,
        baseTemplate
      );

      const template: SystemPromptTemplate = {
        id: `generated-${agentType}-${Date.now()}`,
        name: `Generated ${agentType} System Prompt`,
        category: this.categorizeAgent(agentType),
        platform: requirements.platform || 'wai-orchestration',
        version: '1.0',
        prompt: generatedPrompt,
        performance: {
          successRate: 0.85, // Initial estimate
          qualityScore: 0.80,
          consistency: 0.82,
          adaptability: 0.85
        },
        metadata: {
          created: new Date(),
          lastUpdated: new Date(),
          usage: 0,
          feedback: 0,
          source: 'generated'
        }
      };

      this.promptDatabase.set(template.id, template);

      this.emit('prompt-generated', {
        templateId: template.id,
        agentType,
        platform: requirements.platform,
        timestamp: new Date()
      });

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'prompt-generation', error: errorMessage });
      throw error;
    }
  }

  private async performPromptAnalysis(prompt: string, agentType: string, context: any): Promise<any> {
    const analysis = {
      clarity: this.assessClarity(prompt),
      specificity: this.assessSpecificity(prompt),
      contextRichness: this.assessContextRichness(prompt),
      constraintDefinition: this.assessConstraints(prompt),
      exampleQuality: this.assessExamples(prompt),
      platformAlignment: this.assessPlatformAlignment(prompt, agentType)
    };

    return analysis;
  }

  private async generateOptimizedPrompt(originalPrompt: string, analysis: any): Promise<string> {
    // Generate an improved version of the prompt based on analysis
    let optimizedPrompt = originalPrompt;

    // Improve clarity
    if (analysis.clarity < 0.7) {
      optimizedPrompt = this.improveClarity(optimizedPrompt);
    }

    // Enhance specificity
    if (analysis.specificity < 0.8) {
      optimizedPrompt = this.enhanceSpecificity(optimizedPrompt);
    }

    // Add context if lacking
    if (analysis.contextRichness < 0.6) {
      optimizedPrompt = this.addContext(optimizedPrompt);
    }

    // Strengthen constraints
    if (analysis.constraintDefinition < 0.7) {
      optimizedPrompt = this.strengthenConstraints(optimizedPrompt);
    }

    return optimizedPrompt;
  }

  private async identifyImprovements(original: string, optimized: string): Promise<any[]> {
    const improvements = [];

    // Compare and identify specific improvements
    if (optimized.length > original.length * 1.1) {
      improvements.push({
        type: 'context',
        description: 'Added contextual information for better understanding',
        impact: 0.15
      });
    }

    if (optimized.includes('constraints:') && !original.includes('constraints:')) {
      improvements.push({
        type: 'constraints',
        description: 'Added explicit constraints section',
        impact: 0.12
      });
    }

    if (optimized.includes('example:') && !original.includes('example:')) {
      improvements.push({
        type: 'examples',
        description: 'Added concrete examples for clarity',
        impact: 0.18
      });
    }

    return improvements;
  }

  private findBestTemplate(agentType: string, requirements: any): SystemPromptTemplate | undefined {
    const templates = Array.from(this.promptDatabase.values());
    
    // Score templates based on relevance
    const scoredTemplates = templates.map(template => {
      let score = 0;
      
      // Category match
      const expectedCategory = this.categorizeAgent(agentType);
      if (template.category === expectedCategory) score += 0.4;
      
      // Capability overlap
      const capabilityOverlap = requirements.capabilities.filter((cap: string) =>
        template.prompt.system.toLowerCase().includes(cap.toLowerCase())
      ).length / requirements.capabilities.length;
      score += capabilityOverlap * 0.3;
      
      // Performance score
      score += template.performance.successRate * 0.2;
      score += template.performance.qualityScore * 0.1;
      
      return { template, score };
    });

    // Return best matching template
    scoredTemplates.sort((a, b) => b.score - a.score);
    return scoredTemplates[0]?.template;
  }

  private async synthesizePrompt(
    agentType: string,
    requirements: any,
    platformPattern: any,
    baseTemplate?: SystemPromptTemplate
  ): Promise<any> {
    const systemPrompt = this.buildSystemSection(agentType, requirements, platformPattern);
    const contextPrompt = this.buildContextSection(requirements, platformPattern);
    const instructions = this.buildInstructions(requirements, platformPattern, baseTemplate);
    const constraints = this.buildConstraints(requirements, platformPattern);
    const examples = this.buildExamples(agentType, requirements, baseTemplate);

    return {
      system: systemPrompt,
      context: contextPrompt,
      instructions,
      constraints,
      examples
    };
  }

  private buildSystemSection(agentType: string, requirements: any, platformPattern: any): string {
    const roleDescription = this.generateRoleDescription(agentType);
    const capabilities = requirements.capabilities.join(', ');
    const style = platformPattern?.style || 'systematic and thorough';

    return `You are a ${roleDescription} operating within the WAI orchestration system. Your approach is ${style}.

Core expertise: ${capabilities}

Your role within the multi-agent ecosystem:
- Execute specialized tasks with high quality and efficiency
- Coordinate with other agents for integrated solutions  
- Communicate clearly about progress, dependencies, and results
- Adapt to changing requirements while maintaining consistency

Operating principles:
- Quality over speed, but strive for both
- Clear communication and transparency
- Continuous learning and improvement
- Collaborative problem-solving`;
  }

  private buildContextSection(requirements: any, platformPattern: any): string {
    return `Context: ${requirements.context}

You operate in a sophisticated multi-agent environment where:
- Multiple specialized agents work together on complex projects
- Each agent has unique capabilities and responsibilities  
- Coordination and communication are essential for success
- Quality and consistency are paramount across all outputs

Your interactions should reflect understanding of this collaborative environment.`;
  }

  private buildInstructions(requirements: any, platformPattern: any, baseTemplate?: SystemPromptTemplate): string[] {
    const baseInstructions = [
      'Understand the full context and requirements before proceeding',
      'Apply best practices and industry standards consistently',
      'Communicate clearly with other agents about dependencies and progress',
      'Ensure all outputs meet or exceed quality expectations',
      'Document your reasoning and approach for transparency',
      'Adapt to feedback and changing requirements gracefully'
    ];

    // Add platform-specific instructions
    if (platformPattern?.keyElements) {
      platformPattern.keyElements.forEach((element: string) => {
        baseInstructions.push(`Incorporate ${element} in your approach`);
      });
    }

    // Add template-specific instructions if available
    if (baseTemplate?.prompt.instructions) {
      baseInstructions.push(...baseTemplate.prompt.instructions.slice(0, 3));
    }

    return baseInstructions;
  }

  private buildConstraints(requirements: any, platformPattern: any): string[] {
    const baseConstraints = [
      'Maintain high quality standards in all outputs',
      'Respect system resources and time limitations',
      'Follow security best practices and guidelines',
      'Ensure compatibility with other agents and systems',
      'Preserve existing functionality unless explicitly asked to change'
    ];

    // Add user-specified constraints
    baseConstraints.push(...requirements.constraints);

    // Add platform-specific constraints
    if (platformPattern?.constraints) {
      baseConstraints.push(...platformPattern.constraints);
    }

    return baseConstraints;
  }

  private buildExamples(agentType: string, requirements: any, baseTemplate?: SystemPromptTemplate): any[] {
    const examples = [];

    // Add basic example for the agent type
    examples.push({
      input: `Execute a ${agentType} task with the following requirements: ${requirements.capabilities.slice(0, 2).join(', ')}`,
      output: `I'll analyze the requirements and coordinate with relevant agents as needed. Proceeding with ${agentType} implementation using best practices...`,
      reasoning: 'Demonstrates proper analysis, coordination awareness, and systematic approach'
    });

    // Add template examples if available
    if (baseTemplate?.prompt.examples) {
      examples.push(...baseTemplate.prompt.examples.slice(0, 2));
    }

    return examples;
  }

  // Assessment methods
  private assessClarity(prompt: string): number {
    // Simple clarity assessment based on prompt characteristics
    let score = 0.5;
    
    if (prompt.includes('You are')) score += 0.1;
    if (prompt.includes('Your role')) score += 0.1;
    if (prompt.length > 200) score += 0.1;
    if (prompt.includes('example') || prompt.includes('Example')) score += 0.1;
    if (prompt.split('\n').length > 5) score += 0.1;
    
    return Math.min(1, score);
  }

  private assessSpecificity(prompt: string): number {
    let score = 0.4;
    
    const specificWords = ['specific', 'exactly', 'must', 'should', 'will', 'always', 'never'];
    const specificCount = specificWords.filter(word => 
      prompt.toLowerCase().includes(word)
    ).length;
    
    score += Math.min(0.6, specificCount * 0.1);
    return score;
  }

  private assessContextRichness(prompt: string): number {
    let score = 0.3;
    
    if (prompt.includes('context') || prompt.includes('Context')) score += 0.2;
    if (prompt.includes('environment')) score += 0.1;
    if (prompt.includes('background')) score += 0.1;
    if (prompt.includes('system') || prompt.includes('System')) score += 0.1;
    if (prompt.length > 500) score += 0.2;
    
    return Math.min(1, score);
  }

  private assessConstraints(prompt: string): number {
    let score = 0.2;
    
    if (prompt.includes('constraint') || prompt.includes('Constraint')) score += 0.3;
    if (prompt.includes('must not') || prompt.includes('cannot')) score += 0.2;
    if (prompt.includes('limit') || prompt.includes('restriction')) score += 0.2;
    if (prompt.includes('guidelines')) score += 0.1;
    
    return Math.min(1, score);
  }

  private assessExamples(prompt: string): number {
    let score = 0.1;
    
    if (prompt.includes('example') || prompt.includes('Example')) score += 0.3;
    if (prompt.includes('input:') && prompt.includes('output:')) score += 0.4;
    if (prompt.includes('like this') || prompt.includes('such as')) score += 0.2;
    
    return Math.min(1, score);
  }

  private assessPlatformAlignment(prompt: string, agentType: string): number {
    // Assess how well the prompt aligns with platform best practices
    return 0.7; // Placeholder
  }

  // Improvement methods
  private improveClarity(prompt: string): string {
    if (!prompt.includes('You are')) {
      prompt = `You are a specialized AI agent. ${prompt}`;
    }
    
    if (!prompt.includes('Your role')) {
      prompt += '\n\nYour role: Execute tasks with precision and communicate clearly about your progress and results.';
    }
    
    return prompt;
  }

  private enhanceSpecificity(prompt: string): string {
    return prompt + '\n\nSpecific requirements:\n- Provide detailed explanations for your decisions\n- Follow established patterns and conventions\n- Ensure all outputs meet quality standards';
  }

  private addContext(prompt: string): string {
    return prompt + '\n\nContext: You operate within a multi-agent system where coordination and communication with other specialized agents is essential for success.';
  }

  private strengthenConstraints(prompt: string): string {
    return prompt + '\n\nConstraints:\n- Maintain high quality in all outputs\n- Respect system resources and limitations\n- Follow security and safety guidelines\n- Coordinate with other agents when dependencies exist';
  }

  private calculateExpectedImprovement(improvements: any[]): number {
    return improvements.reduce((sum, improvement) => sum + improvement.impact, 0);
  }

  private calculateConfidence(analysis: any, improvements: any[]): number {
    const baseConfidence = 0.7;
    const analysisScore = (analysis.clarity + analysis.specificity + analysis.contextRichness) / 3;
    const improvementScore = improvements.length > 0 ? 0.1 : 0;
    
    return Math.min(1, baseConfidence + analysisScore * 0.2 + improvementScore);
  }

  private categorizeAgent(agentType: string): 'development' | 'creative' | 'business' | 'coordination' | 'specialized' {
    const categories = {
      development: ['developer', 'programmer', 'coder', 'engineer', 'architect', 'devops'],
      creative: ['designer', 'content', 'writer', 'creative', 'video', 'audio'],
      business: ['analyst', 'manager', 'strategist', 'consultant', 'sales', 'marketing'],
      coordination: ['coordinator', 'orchestrator', 'manager', 'supervisor'],
      specialized: ['security', 'qa', 'tester', 'specialist', 'expert']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => agentType.toLowerCase().includes(keyword))) {
        return category as any;
      }
    }

    return 'specialized';
  }

  private generateRoleDescription(agentType: string): string {
    const descriptions = {
      developer: 'senior software development specialist',
      designer: 'creative design expert',
      analyst: 'business intelligence analyst',
      coordinator: 'multi-agent coordination specialist',
      security: 'cybersecurity expert',
      qa: 'quality assurance specialist'
    };

    for (const [type, description] of Object.entries(descriptions)) {
      if (agentType.toLowerCase().includes(type)) {
        return description;
      }
    }

    return `specialized ${agentType} expert`;
  }

  // Public interface methods
  getPromptTemplates(): SystemPromptTemplate[] {
    return Array.from(this.promptDatabase.values());
  }

  getTemplate(id: string): SystemPromptTemplate | undefined {
    return this.promptDatabase.get(id);
  }

  getPlatformPatterns(): any[] {
    return Array.from(this.platformPatterns.entries()).map(([platform, pattern]) => ({
      platform,
      ...pattern
    }));
  }
}

export class SystemPromptOptimizer extends EventEmitter {
  private analyzer: SystemPromptAnalyzer;
  private agentProfiles: Map<string, AgentPromptProfile> = new Map();

  constructor() {
    super();
    this.analyzer = new SystemPromptAnalyzer();
    this.setupEventHandlers();
  }

  /**
   * Optimize system prompt for specific agent
   */
  async optimizeAgentPrompt(
    agentId: string,
    agentType: string,
    currentPrompt: string,
    performanceData: any = {}
  ): Promise<PromptOptimizationResult> {
    try {
      const optimization = await this.analyzer.analyzePrompt(currentPrompt, agentType, performanceData);
      
      // Update agent profile
      this.updateAgentProfile(agentId, agentType, currentPrompt, optimization, performanceData);
      
      this.emit('prompt-optimized', {
        agentId,
        agentType,
        expectedImprovement: optimization.expectedImprovement,
        confidence: optimization.confidence,
        timestamp: new Date()
      });

      return optimization;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'prompt-optimization', error: errorMessage, agentId });
      throw error;
    }
  }

  /**
   * Generate optimized system prompt for new agent
   */
  async generateAgentPrompt(
    agentId: string,
    agentType: string,
    requirements: {
      capabilities: string[];
      context: string;
      constraints: string[];
      platform?: string;
      style?: 'directive' | 'collaborative' | 'explanatory' | 'systematic';
    }
  ): Promise<SystemPromptTemplate> {
    try {
      const template = await this.analyzer.generateSystemPrompt(agentType, requirements);
      
      // Create agent profile
      const profile: AgentPromptProfile = {
        agentId,
        agentType,
        currentPrompt: template,
        performance: {
          currentScore: 0.8, // Initial estimate
          trend: 'stable',
          lastOptimization: new Date()
        },
        adaptations: []
      };

      this.agentProfiles.set(agentId, profile);

      this.emit('prompt-generated', {
        agentId,
        templateId: template.id,
        agentType,
        timestamp: new Date()
      });

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { stage: 'prompt-generation', error: errorMessage, agentId });
      throw error;
    }
  }

  private updateAgentProfile(
    agentId: string,
    agentType: string,
    currentPrompt: string,
    optimization: PromptOptimizationResult,
    performanceData: any
  ): void {
    let profile = this.agentProfiles.get(agentId);
    
    if (!profile) {
      // Create new profile
      profile = {
        agentId,
        agentType,
        currentPrompt: {
          id: `current-${agentId}`,
          name: `Current prompt for ${agentId}`,
          category: this.analyzer['categorizeAgent'](agentType),
          platform: 'wai-orchestration',
          version: '1.0',
          prompt: {
            system: currentPrompt,
            context: '',
            instructions: [],
            constraints: [],
            examples: []
          },
          performance: {
            successRate: performanceData.successRate || 0.8,
            qualityScore: performanceData.qualityScore || 0.8,
            consistency: performanceData.consistency || 0.8,
            adaptability: performanceData.adaptability || 0.8
          },
          metadata: {
            created: new Date(),
            lastUpdated: new Date(),
            usage: performanceData.usage || 0,
            feedback: performanceData.feedback || 0,
            source: 'current'
          }
        },
        performance: {
          currentScore: performanceData.currentScore || 0.8,
          trend: 'stable',
          lastOptimization: new Date()
        },
        adaptations: []
      };
    }

    // Add optimization as adaptation
    profile.adaptations.push({
      date: new Date(),
      change: `Optimized prompt with ${optimization.improvements.length} improvements`,
      impact: optimization.expectedImprovement,
      reason: 'Performance optimization based on analysis'
    });

    // Update performance trend
    const previousScore = profile.performance.currentScore;
    const newScore = previousScore + optimization.expectedImprovement;
    profile.performance.currentScore = Math.min(1, newScore);
    
    if (newScore > previousScore) {
      profile.performance.trend = 'improving';
    } else if (newScore < previousScore) {
      profile.performance.trend = 'declining';
    } else {
      profile.performance.trend = 'stable';
    }

    profile.performance.lastOptimization = new Date();

    this.agentProfiles.set(agentId, profile);
  }

  private setupEventHandlers(): void {
    // Forward events from analyzer
    this.analyzer.on('error', (error) => this.emit('error', error));

    // Optimization logging with WAI logger
    this.on('prompt-optimized', async (data) => {
      const { logger } = await import('../utils/wai-logger.ts');
      logger.info('system-prompt-architect', 'Prompt optimized successfully', {
        agentId: data.agentId,
        expectedImprovement: data.expectedImprovement,
        improvementPercent: Math.round(data.expectedImprovement * 100)
      });
    });

    this.on('prompt-generated', async (data) => {
      const { logger } = await import('../utils/wai-logger.ts');
      logger.info('system-prompt-architect', 'New prompt generated', {
        agentId: data.agentId,
        agentType: data.agentType,
        templateId: data.templateId
      });
    });

    this.on('error', async (error) => {
      const { logger } = await import('../utils/wai-logger.ts');
      logger.error('system-prompt-architect', `Prompt architect error in ${error.stage}`, {
        error: error.error,
        stage: error.stage,
        agentId: error.agentId
      });
    });
  }

  // Public interface methods
  getAgentProfile(agentId: string): AgentPromptProfile | undefined {
    return this.agentProfiles.get(agentId);
  }

  getAllProfiles(): AgentPromptProfile[] {
    return Array.from(this.agentProfiles.values());
  }

  getOptimizationMetrics(): any {
    const profiles = Array.from(this.agentProfiles.values());
    
    return {
      totalAgents: profiles.length,
      averageScore: profiles.reduce((sum, p) => sum + p.performance.currentScore, 0) / profiles.length,
      improvingAgents: profiles.filter(p => p.performance.trend === 'improving').length,
      stableAgents: profiles.filter(p => p.performance.trend === 'stable').length,
      decliningAgents: profiles.filter(p => p.performance.trend === 'declining').length,
      totalOptimizations: profiles.reduce((sum, p) => sum + p.adaptations.length, 0)
    };
  }

  getAnalyzer(): SystemPromptAnalyzer {
    return this.analyzer;
  }
}

// Factory function for integration with WAI orchestration
export function createSystemPromptArchitect(): SystemPromptOptimizer {
  return new SystemPromptOptimizer();
}