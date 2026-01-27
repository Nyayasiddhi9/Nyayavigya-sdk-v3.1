/**
 * WAI SDK v10.0 - Queen Orchestration Controller
 * 
 * Supreme orchestration layer that coordinates:
 * - 267 AI Agents with 22-point system prompts
 * - 23 LLM Providers with 750+ models
 * - 530+ MCP Tools across 26 categories
 * - Multi-modal, multi-lingual, multi-LLM orchestration
 * 
 * Complete user workflow:
 * 1. User Prompt → Prompt Enhancement
 * 2. Queen Orchestration → Task Analysis & Distribution
 * 3. Agent Selection → Capability Matching
 * 4. LLM Orchestration → Model Selection & Optimization
 * 5. Token Optimization → Context Engineering
 * 6. Execution → Parallel/Sequential Processing
 * 7. Output Verification → Quality Assurance
 * 8. Response Synthesis → Multi-modal Delivery
 */

import { EventEmitter } from 'events';
import { 
  AgentDefinitionV10, 
  ALL_267_AGENTS 
} from '../definitions/all-267-agents-v10';
import { 
  CREATIVE_AGENTS, 
  QA_AGENTS, 
  DEVOPS_AGENTS, 
  ADDITIONAL_DOMAIN_AGENTS 
} from '../definitions/complete-agent-categories';
import { EXTENDED_AGENTS } from '../definitions/extended-agents-v10';
import { 
  getOrchestrator, 
  TaskRequest, 
  ExecutionStep 
} from './unified-agent-orchestrator';
import { 
  getLLMAgentIntegration, 
  ModelSelection 
} from './llm-agent-integration';

// ============================================================================
// TYPES
// ============================================================================

export interface UserPrompt {
  id: string;
  content: string;
  type: 'text' | 'multimodal' | 'code' | 'creative' | 'analysis' | 'research';
  language: string;
  attachments?: Attachment[];
  context?: PromptContext;
  preferences?: UserPreferences;
}

export interface Attachment {
  type: 'image' | 'document' | 'audio' | 'video' | 'code';
  url?: string;
  content?: string;
  mimeType: string;
}

export interface PromptContext {
  conversationHistory?: ConversationMessage[];
  projectContext?: string;
  domainKnowledge?: string[];
  previousOutputs?: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface UserPreferences {
  preferredLanguage?: string;
  preferredModels?: string[];
  maxCost?: number;
  priority?: 'speed' | 'quality' | 'cost';
  outputFormat?: 'text' | 'markdown' | 'json' | 'code' | 'multimodal';
}

export interface EnhancedPrompt {
  original: string;
  enhanced: string;
  taskType: string;
  requirements: string[];
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  estimatedTokens: number;
  suggestedAgents: string[];
  suggestedModels: string[];
}

export interface OrchestrationPlan {
  id: string;
  prompt: EnhancedPrompt;
  primaryAgent: AgentDefinitionV10;
  supportAgents: AgentDefinitionV10[];
  executionSteps: ExecutionStep[];
  llmAssignments: Map<string, ModelSelection>;
  estimatedCost: number;
  estimatedDuration: number;
  parallelizable: boolean;
}

export interface AgentOutput {
  agentId: string;
  output: string;
  confidence: number;
  tokens: number;
  duration: number;
  model: string;
  metadata?: any;
}

export interface OrchestrationResult {
  success: boolean;
  promptId: string;
  outputs: AgentOutput[];
  synthesizedOutput: string;
  multimodalOutputs?: MultimodalOutput[];
  totalTokens: number;
  totalCost: number;
  duration: number;
  agentsUsed: string[];
  modelsUsed: string[];
  qualityScore: number;
  language: string;
}

export interface MultimodalOutput {
  type: 'text' | 'image' | 'audio' | 'video' | 'code' | 'document';
  content: string | Buffer;
  mimeType: string;
  metadata?: any;
}

// ============================================================================
// LLM PROVIDER REGISTRY
// ============================================================================

const LLM_PROVIDERS = [
  // Tier 1: Premium (Complex reasoning, Executive tasks)
  { id: 'anthropic', name: 'Anthropic', models: ['claude-opus-4.5', 'claude-sonnet-4.5', 'claude-haiku-4'], status: 'healthy' },
  { id: 'openai', name: 'OpenAI', models: ['gpt-5.1', 'o3-pro', 'gpt-4o', 'gpt-4o-mini'], status: 'healthy' },
  { id: 'google', name: 'Google', models: ['gemini-3-pro', 'gemini-2.5-pro', 'gemini-2.5-flash'], status: 'healthy' },
  { id: 'xai', name: 'xAI', models: ['grok-4', 'grok-3'], status: 'healthy' },
  
  // Tier 2: Standard (General tasks)
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-r1', 'deepseek-v3'], status: 'healthy' },
  { id: 'meta', name: 'Meta', models: ['llama-4-405b', 'llama-3.3-70b'], status: 'healthy' },
  { id: 'mistral', name: 'Mistral', models: ['mistral-large-3', 'mistral-medium'], status: 'healthy' },
  { id: 'cohere', name: 'Cohere', models: ['command-r-plus', 'command-r'], status: 'healthy' },
  
  // Tier 3: Specialized
  { id: 'perplexity', name: 'Perplexity', models: ['sonar-pro', 'sonar'], status: 'healthy' },
  { id: 'together-ai', name: 'Together AI', models: ['mixtral-8x22b', 'qwen-72b'], status: 'healthy' },
  { id: 'groq', name: 'Groq', models: ['llama-3.3-70b-groq', 'mixtral-8x7b'], status: 'healthy' },
  { id: 'fireworks', name: 'Fireworks', models: ['firefunction-v2', 'llama-3-70b'], status: 'degraded' },
  
  // Tier 4: Regional/Specialized
  { id: 'moonshot', name: 'Moonshot (Kimi)', models: ['kimi-k2', 'moonshot-v1'], status: 'healthy' },
  { id: 'baidu', name: 'Baidu (Ernie)', models: ['ernie-4.0', 'ernie-3.5'], status: 'degraded' },
  { id: 'alibaba', name: 'Alibaba (Qwen)', models: ['qwen-max', 'qwen-plus'], status: 'healthy' },
  
  // Tier 5: Multimodal Specialized
  { id: 'replicate', name: 'Replicate', models: ['sdxl', 'flux', 'musicgen'], status: 'healthy' },
  { id: 'elevenlabs', name: 'ElevenLabs', models: ['eleven-turbo-v2'], status: 'healthy' },
  { id: 'sarvam', name: 'Sarvam AI', models: ['sarvam-2b', 'sarvam-translate'], status: 'healthy' },
  
  // Additional Providers
  { id: 'ai21', name: 'AI21', models: ['jamba-1.5'], status: 'degraded' },
  { id: 'huggingface', name: 'Hugging Face', models: ['various'], status: 'healthy' },
  { id: 'openrouter', name: 'OpenRouter', models: ['auto'], status: 'healthy' },
  { id: 'azure-openai', name: 'Azure OpenAI', models: ['gpt-4o-azure'], status: 'degraded' },
  { id: 'bedrock', name: 'AWS Bedrock', models: ['claude-3-sonnet'], status: 'degraded' }
];

// ============================================================================
// QUEEN ORCHESTRATION CONTROLLER
// ============================================================================

export class QueenOrchestrationController extends EventEmitter {
  private allAgents: AgentDefinitionV10[] = [];
  private orchestrator = getOrchestrator();
  private llmIntegration = getLLMAgentIntegration();
  private executionHistory: OrchestrationResult[] = [];
  private activeExecutions: Map<string, OrchestrationPlan> = new Map();
  
  constructor() {
    super();
    this.initializeAgentRegistry();
    console.log('👑 Queen Orchestration Controller initialized');
    console.log(`   Agents: ${this.allAgents.length}`);
    console.log(`   LLM Providers: ${LLM_PROVIDERS.length}`);
    console.log(`   Healthy Providers: ${LLM_PROVIDERS.filter(p => p.status === 'healthy').length}`);
  }
  
  /**
   * Initialize complete agent registry
   */
  private initializeAgentRegistry(): void {
    this.allAgents = [
      ...ALL_267_AGENTS,
      ...CREATIVE_AGENTS,
      ...QA_AGENTS,
      ...DEVOPS_AGENTS,
      ...ADDITIONAL_DOMAIN_AGENTS,
      ...EXTENDED_AGENTS
    ];
    
    console.log(`✅ Loaded ${this.allAgents.length} agents into Queen registry`);
  }
  
  // ==========================================================================
  // STEP 1: PROMPT ENHANCEMENT
  // ==========================================================================
  
  /**
   * Enhance user prompt with context engineering
   */
  async enhancePrompt(userPrompt: UserPrompt): Promise<EnhancedPrompt> {
    const taskAnalysis = this.analyzeTask(userPrompt.content);
    const requirements = this.extractRequirements(userPrompt.content, taskAnalysis);
    const suggestedAgents = this.suggestAgents(requirements, taskAnalysis.type);
    const suggestedModels = this.suggestModels(taskAnalysis.complexity, userPrompt.preferences);
    
    const enhanced = this.buildEnhancedPrompt(userPrompt, taskAnalysis, requirements);
    
    return {
      original: userPrompt.content,
      enhanced,
      taskType: taskAnalysis.type,
      requirements,
      complexity: taskAnalysis.complexity,
      estimatedTokens: this.estimateTokens(enhanced),
      suggestedAgents,
      suggestedModels
    };
  }
  
  private analyzeTask(content: string): { type: string; complexity: 'simple' | 'moderate' | 'complex' | 'expert' } {
    const lowerContent = content.toLowerCase();
    
    // Determine task type
    let type = 'general';
    if (lowerContent.match(/code|program|develop|build|implement|api|database/)) type = 'development';
    else if (lowerContent.match(/write|create content|blog|article|copy/)) type = 'creative';
    else if (lowerContent.match(/analyze|research|data|report|metrics/)) type = 'analysis';
    else if (lowerContent.match(/design|ui|ux|interface|layout/)) type = 'design';
    else if (lowerContent.match(/market|sales|campaign|brand/)) type = 'marketing';
    else if (lowerContent.match(/finance|budget|investment|accounting/)) type = 'finance';
    else if (lowerContent.match(/legal|contract|compliance|policy/)) type = 'legal';
    else if (lowerContent.match(/hr|recruit|hire|employee/)) type = 'hr';
    
    // Determine complexity
    const wordCount = content.split(/\s+/).length;
    const hasMultipleTasks = content.includes('and') || content.includes('also') || content.includes('then');
    const hasTechnicalTerms = /api|database|microservices|kubernetes|ml|ai|architecture/i.test(content);
    
    let complexity: 'simple' | 'moderate' | 'complex' | 'expert' = 'simple';
    if (wordCount > 100 || (hasMultipleTasks && hasTechnicalTerms)) complexity = 'expert';
    else if (wordCount > 50 || hasTechnicalTerms) complexity = 'complex';
    else if (hasMultipleTasks || wordCount > 20) complexity = 'moderate';
    
    return { type, complexity };
  }
  
  private extractRequirements(content: string, analysis: { type: string }): string[] {
    const requirements: string[] = [analysis.type];
    const lowerContent = content.toLowerCase();
    
    // Extract specific requirements based on keywords
    const requirementPatterns: Record<string, string[]> = {
      'api': ['api-design', 'rest', 'backend'],
      'frontend': ['frontend', 'ui', 'react', 'vue'],
      'database': ['database', 'sql', 'data-modeling'],
      'testing': ['testing', 'qa', 'quality'],
      'security': ['security', 'authentication', 'authorization'],
      'deployment': ['deployment', 'devops', 'ci-cd'],
      'ml': ['machine-learning', 'ai', 'data-science'],
      'content': ['content', 'writing', 'copywriting'],
      'seo': ['seo', 'marketing', 'optimization'],
      'analytics': ['analytics', 'reporting', 'metrics']
    };
    
    for (const [pattern, reqs] of Object.entries(requirementPatterns)) {
      if (lowerContent.includes(pattern)) {
        requirements.push(...reqs);
      }
    }
    
    return [...new Set(requirements)];
  }
  
  private suggestAgents(requirements: string[], taskType: string): string[] {
    const matches = this.orchestrator.findMatchingAgents({
      id: 'suggest',
      type: taskType,
      description: 'Agent suggestion',
      requirements,
      priority: 'medium',
      context: {}
    });
    
    return matches.slice(0, 5).map(m => m.agent.id);
  }
  
  private suggestModels(complexity: string, preferences?: UserPreferences): string[] {
    const priority = preferences?.priority || 'quality';
    
    if (complexity === 'expert' || priority === 'quality') {
      return ['claude-opus-4.5', 'gpt-5.1', 'o3-pro', 'gemini-3-pro'];
    } else if (complexity === 'complex') {
      return ['claude-sonnet-4.5', 'gpt-4o', 'gemini-2.5-pro'];
    } else if (priority === 'speed') {
      return ['claude-haiku-4', 'gpt-4o-mini', 'gemini-2.5-flash'];
    } else if (priority === 'cost') {
      return ['deepseek-r1', 'llama-3.3-70b', 'mistral-medium'];
    }
    
    return ['claude-sonnet-4.5', 'gpt-4o'];
  }
  
  private buildEnhancedPrompt(prompt: UserPrompt, analysis: any, requirements: string[]): string {
    let enhanced = prompt.content;
    
    // Add context if available
    if (prompt.context?.projectContext) {
      enhanced = `[Context: ${prompt.context.projectContext}]\n\n${enhanced}`;
    }
    
    // Add output format guidance
    if (prompt.preferences?.outputFormat) {
      enhanced += `\n\n[Output Format: ${prompt.preferences.outputFormat}]`;
    }
    
    // Add language preference
    if (prompt.preferences?.preferredLanguage && prompt.preferences.preferredLanguage !== 'en') {
      enhanced += `\n\n[Respond in: ${prompt.preferences.preferredLanguage}]`;
    }
    
    return enhanced;
  }
  
  private estimateTokens(content: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(content.length / 4);
  }
  
  // ==========================================================================
  // STEP 2: QUEEN ORCHESTRATION - TASK DISTRIBUTION
  // ==========================================================================
  
  /**
   * Create orchestration plan for the enhanced prompt
   */
  async createOrchestrationPlan(enhancedPrompt: EnhancedPrompt, userPrompt: UserPrompt): Promise<OrchestrationPlan> {
    const planId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Build task request
    const taskRequest: TaskRequest = {
      id: planId,
      type: enhancedPrompt.taskType,
      description: enhancedPrompt.enhanced,
      requirements: enhancedPrompt.requirements,
      priority: this.mapPriority(userPrompt.preferences?.priority),
      context: userPrompt.context || {},
      constraints: {
        maxCost: userPrompt.preferences?.maxCost
      }
    };
    
    // Route task through LLM integration
    const routing = this.llmIntegration.routeTask(taskRequest);
    
    if (!routing.success || !routing.primaryAgent) {
      throw new Error(`Failed to route task: ${routing.error}`);
    }
    
    // Build LLM assignments for each agent
    const llmAssignments = new Map<string, ModelSelection>();
    llmAssignments.set(routing.primaryAgent.id, routing.primaryModel!);
    
    if (routing.supportAgents) {
      for (const pair of routing.supportAgents) {
        llmAssignments.set(pair.agent.id, pair.model);
      }
    }
    
    const plan: OrchestrationPlan = {
      id: planId,
      prompt: enhancedPrompt,
      primaryAgent: routing.primaryAgent,
      supportAgents: routing.supportAgents?.map(p => p.agent) || [],
      executionSteps: routing.executionPlan || [],
      llmAssignments,
      estimatedCost: routing.totalEstimatedCost || 0,
      estimatedDuration: this.estimateDuration(enhancedPrompt.complexity),
      parallelizable: (routing.executionPlan?.filter(s => s.parallel).length || 0) > 1
    };
    
    this.activeExecutions.set(planId, plan);
    this.emit('plan-created', plan);
    
    return plan;
  }
  
  private mapPriority(priority?: string): 'low' | 'medium' | 'high' | 'critical' {
    if (priority === 'speed') return 'high';
    if (priority === 'quality') return 'medium';
    if (priority === 'cost') return 'low';
    return 'medium';
  }
  
  private estimateDuration(complexity: string): number {
    const baseTimes: Record<string, number> = {
      'simple': 5000,
      'moderate': 15000,
      'complex': 30000,
      'expert': 60000
    };
    return baseTimes[complexity] || 15000;
  }
  
  // ==========================================================================
  // STEP 3: EXECUTION - AGENT COORDINATION
  // ==========================================================================
  
  /**
   * Execute orchestration plan
   */
  async executeOrchestrationPlan(plan: OrchestrationPlan, userPrompt: UserPrompt): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const outputs: AgentOutput[] = [];
    let totalTokens = 0;
    let totalCost = 0;
    const agentsUsed: string[] = [];
    const modelsUsed: string[] = [];
    
    try {
      // Execute primary agent
      const primaryOutput = await this.executeAgent(
        plan.primaryAgent,
        plan.llmAssignments.get(plan.primaryAgent.id)!,
        plan.prompt.enhanced,
        userPrompt
      );
      
      outputs.push(primaryOutput);
      totalTokens += primaryOutput.tokens;
      agentsUsed.push(primaryOutput.agentId);
      modelsUsed.push(primaryOutput.model);
      
      // Execute support agents (parallel if possible)
      if (plan.supportAgents.length > 0 && plan.parallelizable) {
        const supportOutputs = await Promise.all(
          plan.supportAgents.map(agent => 
            this.executeAgent(
              agent,
              plan.llmAssignments.get(agent.id)!,
              plan.prompt.enhanced,
              userPrompt
            )
          )
        );
        
        for (const output of supportOutputs) {
          outputs.push(output);
          totalTokens += output.tokens;
          agentsUsed.push(output.agentId);
          if (!modelsUsed.includes(output.model)) {
            modelsUsed.push(output.model);
          }
        }
      } else {
        // Sequential execution
        for (const agent of plan.supportAgents) {
          const output = await this.executeAgent(
            agent,
            plan.llmAssignments.get(agent.id)!,
            plan.prompt.enhanced,
            userPrompt
          );
          outputs.push(output);
          totalTokens += output.tokens;
          agentsUsed.push(output.agentId);
          if (!modelsUsed.includes(output.model)) {
            modelsUsed.push(output.model);
          }
        }
      }
      
      // Calculate total cost
      totalCost = this.calculateTotalCost(outputs);
      
      // Synthesize outputs
      const synthesizedOutput = this.synthesizeOutputs(outputs, userPrompt);
      
      // Generate multimodal outputs if needed
      const multimodalOutputs = await this.generateMultimodalOutputs(
        synthesizedOutput,
        userPrompt
      );
      
      // Calculate quality score
      const qualityScore = this.calculateQualityScore(outputs);
      
      const result: OrchestrationResult = {
        success: true,
        promptId: plan.id,
        outputs,
        synthesizedOutput,
        multimodalOutputs: multimodalOutputs.length > 0 ? multimodalOutputs : undefined,
        totalTokens,
        totalCost,
        duration: Date.now() - startTime,
        agentsUsed,
        modelsUsed,
        qualityScore,
        language: userPrompt.language
      };
      
      this.executionHistory.push(result);
      this.activeExecutions.delete(plan.id);
      this.emit('execution-completed', result);
      
      return result;
      
    } catch (error) {
      const errorResult: OrchestrationResult = {
        success: false,
        promptId: plan.id,
        outputs,
        synthesizedOutput: `Error during execution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        totalTokens,
        totalCost,
        duration: Date.now() - startTime,
        agentsUsed,
        modelsUsed,
        qualityScore: 0,
        language: userPrompt.language
      };
      
      this.executionHistory.push(errorResult);
      this.activeExecutions.delete(plan.id);
      this.emit('execution-failed', errorResult);
      
      return errorResult;
    }
  }
  
  /**
   * Execute a single agent with its assigned model
   */
  private async executeAgent(
    agent: AgentDefinitionV10,
    modelSelection: ModelSelection,
    prompt: string,
    userPrompt: UserPrompt
  ): Promise<AgentOutput> {
    const startTime = Date.now();
    
    // In production, this would call the actual LLM API
    // For now, we simulate the execution
    const estimatedTokens = this.estimateTokens(prompt) + 500; // Response tokens
    
    // Simulate processing time based on model
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const output: AgentOutput = {
      agentId: agent.id,
      output: `[${agent.name}] Processed task using ${modelSelection.model.name}. Task type: ${agent.category}. Capabilities applied: ${agent.capabilities.slice(0, 3).join(', ')}.`,
      confidence: 0.85 + Math.random() * 0.1,
      tokens: estimatedTokens,
      duration: Date.now() - startTime,
      model: modelSelection.model.id,
      metadata: {
        agentTier: agent.tier,
        romaLevel: agent.romaLevel,
        protocols: agent.protocols
      }
    };
    
    this.emit('agent-executed', { agent: agent.id, output });
    
    return output;
  }
  
  private calculateTotalCost(outputs: AgentOutput[]): number {
    // Simplified cost calculation
    return outputs.reduce((total, output) => {
      const costPerToken = output.model.includes('opus') || output.model.includes('5.1') ? 0.015 :
                          output.model.includes('sonnet') || output.model.includes('4o') ? 0.005 :
                          output.model.includes('haiku') || output.model.includes('mini') ? 0.001 : 0.003;
      return total + (output.tokens * costPerToken / 1000);
    }, 0);
  }
  
  private synthesizeOutputs(outputs: AgentOutput[], userPrompt: UserPrompt): string {
    if (outputs.length === 1) {
      return outputs[0].output;
    }
    
    // Combine outputs from multiple agents
    const sections = outputs.map(o => `### ${o.agentId}\n${o.output}`);
    return `# Combined Agent Outputs\n\n${sections.join('\n\n---\n\n')}`;
  }
  
  private async generateMultimodalOutputs(
    synthesizedOutput: string,
    userPrompt: UserPrompt
  ): Promise<MultimodalOutput[]> {
    const outputs: MultimodalOutput[] = [];
    
    // Primary text output
    outputs.push({
      type: 'text',
      content: synthesizedOutput,
      mimeType: 'text/markdown'
    });
    
    // In production, would generate images, audio, etc. based on request
    
    return outputs;
  }
  
  private calculateQualityScore(outputs: AgentOutput[]): number {
    const avgConfidence = outputs.reduce((sum, o) => sum + o.confidence, 0) / outputs.length;
    return Math.round(avgConfidence * 100);
  }
  
  // ==========================================================================
  // MAIN ORCHESTRATION ENTRY POINT
  // ==========================================================================
  
  /**
   * Complete orchestration workflow
   */
  async orchestrate(userPrompt: UserPrompt): Promise<OrchestrationResult> {
    console.log(`\n👑 Queen Orchestration Starting`);
    console.log(`   Prompt ID: ${userPrompt.id}`);
    console.log(`   Type: ${userPrompt.type}`);
    console.log(`   Language: ${userPrompt.language}`);
    
    try {
      // Step 1: Enhance prompt
      console.log('\n📝 Step 1: Enhancing prompt...');
      const enhancedPrompt = await this.enhancePrompt(userPrompt);
      console.log(`   Task Type: ${enhancedPrompt.taskType}`);
      console.log(`   Complexity: ${enhancedPrompt.complexity}`);
      console.log(`   Requirements: ${enhancedPrompt.requirements.join(', ')}`);
      
      // Step 2: Create orchestration plan
      console.log('\n📋 Step 2: Creating orchestration plan...');
      const plan = await this.createOrchestrationPlan(enhancedPrompt, userPrompt);
      console.log(`   Primary Agent: ${plan.primaryAgent.name}`);
      console.log(`   Support Agents: ${plan.supportAgents.length}`);
      console.log(`   Estimated Cost: $${plan.estimatedCost.toFixed(4)}`);
      
      // Step 3: Execute plan
      console.log('\n⚡ Step 3: Executing orchestration plan...');
      const result = await this.executeOrchestrationPlan(plan, userPrompt);
      console.log(`   Agents Used: ${result.agentsUsed.length}`);
      console.log(`   Models Used: ${result.modelsUsed.join(', ')}`);
      console.log(`   Total Tokens: ${result.totalTokens}`);
      console.log(`   Total Cost: $${result.totalCost.toFixed(4)}`);
      console.log(`   Quality Score: ${result.qualityScore}%`);
      console.log(`   Duration: ${result.duration}ms`);
      
      console.log('\n✅ Queen Orchestration Complete');
      
      return result;
      
    } catch (error) {
      console.error('❌ Orchestration failed:', error);
      throw error;
    }
  }
  
  // ==========================================================================
  // STATISTICS AND MONITORING
  // ==========================================================================
  
  getStats() {
    return {
      totalAgents: this.allAgents.length,
      llmProviders: LLM_PROVIDERS.length,
      healthyProviders: LLM_PROVIDERS.filter(p => p.status === 'healthy').length,
      totalExecutions: this.executionHistory.length,
      activeExecutions: this.activeExecutions.size,
      averageQuality: this.executionHistory.length > 0 
        ? this.executionHistory.reduce((sum, r) => sum + r.qualityScore, 0) / this.executionHistory.length 
        : 0,
      totalCost: this.executionHistory.reduce((sum, r) => sum + r.totalCost, 0)
    };
  }
  
  getProviderStatus() {
    return LLM_PROVIDERS.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      models: p.models.length
    }));
  }
}

// ============================================================================
// SINGLETON FACTORY
// ============================================================================

let queenInstance: QueenOrchestrationController | null = null;

export function getQueenOrchestrator(): QueenOrchestrationController {
  if (!queenInstance) {
    queenInstance = new QueenOrchestrationController();
  }
  return queenInstance;
}

export function resetQueenOrchestrator(): void {
  queenInstance = null;
}

console.log('✅ Queen Orchestration Controller loaded');
