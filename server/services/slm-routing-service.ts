/**
 * SLM Routing Service - Small Language Model Routing for Cost Optimization
 * WAI SDK v2.0 - January 18, 2026
 * 
 * Routes L1/L2 ROMA level tasks to Small Language Models (SLMs)
 * for 40-60% cost reduction while maintaining quality.
 * 
 * Supported SLMs:
 * - Mistral 7B Instruct v0.3
 * - Llama 3 8B Instruct
 * - Phi-3 Mini 128K
 * - Gemma 2 9B
 */

import { EventEmitter } from 'events';

export interface SLMModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  inputCost: number;   // per 1M tokens
  outputCost: number;  // per 1M tokens
  capabilities: string[];
  suitableFor: string[];
  qualityScore: number; // 0-1
  speedScore: number;   // 0-1
}

export interface RoutingDecision {
  useSLM: boolean;
  selectedModel: SLMModel | null;
  fallbackModel: string;
  romaLevel: 'L1' | 'L2' | 'L3' | 'L4';
  estimatedCost: number;
  estimatedSavings: string;
  reason: string;
}

export interface RoutingRequest {
  prompt: string;
  romaLevel?: 'L1' | 'L2' | 'L3' | 'L4';
  taskType?: string;
  complexity?: 'simple' | 'moderate' | 'complex' | 'very_complex';
  requiresVision?: boolean;
  requiresTools?: boolean;
  preferQuality?: boolean;
}

// Small Language Model Registry
export const SLM_MODELS: SLMModel[] = [
  {
    id: 'mistral-7b-instruct-v0.3',
    name: 'Mistral 7B Instruct v0.3',
    provider: 'mistral',
    contextWindow: 32768,
    inputCost: 0.04,
    outputCost: 0.12,
    capabilities: ['text-generation', 'code-generation', 'reasoning', 'function-calling'],
    suitableFor: ['L1', 'L2', 'general', 'coding', 'simple-reasoning'],
    qualityScore: 0.82,
    speedScore: 0.95
  },
  {
    id: 'llama-3-8b-instruct',
    name: 'Llama 3 8B Instruct',
    provider: 'meta',
    contextWindow: 8192,
    inputCost: 0.05,
    outputCost: 0.10,
    capabilities: ['text-generation', 'code-generation', 'reasoning'],
    suitableFor: ['L1', 'L2', 'general', 'creative', 'chat'],
    qualityScore: 0.80,
    speedScore: 0.92
  },
  {
    id: 'phi-3-mini-128k',
    name: 'Phi-3 Mini 128K',
    provider: 'microsoft',
    contextWindow: 128000,
    inputCost: 0.06,
    outputCost: 0.18,
    capabilities: ['text-generation', 'code-generation', 'reasoning', 'long-context'],
    suitableFor: ['L1', 'L2', 'coding', 'document-analysis', 'summarization'],
    qualityScore: 0.78,
    speedScore: 0.88
  },
  {
    id: 'gemma-2-9b-it',
    name: 'Gemma 2 9B Instruct',
    provider: 'google',
    contextWindow: 8192,
    inputCost: 0.04,
    outputCost: 0.12,
    capabilities: ['text-generation', 'code-generation', 'reasoning'],
    suitableFor: ['L1', 'L2', 'general', 'creative', 'coding'],
    qualityScore: 0.81,
    speedScore: 0.90
  }
];

// Full LLM models for comparison
const FULL_LLM_COSTS = {
  'claude-4.5-opus': { input: 15.0, output: 75.0 },
  'gpt-5.2-pro': { input: 10.0, output: 30.0 },
  'gemini-3-ultra': { input: 12.5, output: 50.0 }
};

export class SLMRoutingService extends EventEmitter {
  private static instance: SLMRoutingService;
  private isEnabled: boolean = true;
  private routingStats = {
    totalRequests: 0,
    slmRouted: 0,
    llmRouted: 0,
    estimatedSavings: 0
  };

  private constructor() {
    super();
    console.log('🚀 SLMRoutingService initialized');
    console.log(`   SLMs available: ${SLM_MODELS.length}`);
  }

  public static getInstance(): SLMRoutingService {
    if (!SLMRoutingService.instance) {
      SLMRoutingService.instance = new SLMRoutingService();
    }
    return SLMRoutingService.instance;
  }

  /**
   * Route a request to either SLM or full LLM based on task characteristics
   */
  public route(request: RoutingRequest): RoutingDecision {
    this.routingStats.totalRequests++;

    // Determine if SLM is appropriate
    const analysis = this.analyzeRequest(request);
    
    if (!analysis.canUseSLM) {
      this.routingStats.llmRouted++;
      return {
        useSLM: false,
        selectedModel: null,
        fallbackModel: 'claude-4.5-opus',
        romaLevel: request.romaLevel || 'L3',
        estimatedCost: 0.05,
        estimatedSavings: '0%',
        reason: analysis.reason
      };
    }

    // Select best SLM for the task
    const selectedSLM = this.selectBestSLM(request);
    
    // Calculate savings
    const slmCost = selectedSLM.inputCost / 1000 * 1 + selectedSLM.outputCost / 1000 * 0.5;
    const llmCost = FULL_LLM_COSTS['claude-4.5-opus'].input / 1000 * 1 + 
                   FULL_LLM_COSTS['claude-4.5-opus'].output / 1000 * 0.5;
    const savings = ((llmCost - slmCost) / llmCost * 100).toFixed(0);

    this.routingStats.slmRouted++;
    this.routingStats.estimatedSavings += llmCost - slmCost;

    return {
      useSLM: true,
      selectedModel: selectedSLM,
      fallbackModel: 'mistral-medium',
      romaLevel: request.romaLevel || 'L2',
      estimatedCost: slmCost,
      estimatedSavings: `${savings}%`,
      reason: `L1/L2 task routed to ${selectedSLM.name} for cost optimization`
    };
  }

  private analyzeRequest(request: RoutingRequest): { canUseSLM: boolean; reason: string } {
    // L3/L4 tasks require full LLM
    if (request.romaLevel === 'L3' || request.romaLevel === 'L4') {
      return { canUseSLM: false, reason: 'L3/L4 tasks require full LLM capabilities' };
    }

    // Complex tasks require full LLM
    if (request.complexity === 'very_complex') {
      return { canUseSLM: false, reason: 'Very complex tasks need advanced reasoning' };
    }

    // Vision tasks require multimodal LLM
    if (request.requiresVision) {
      return { canUseSLM: false, reason: 'Vision tasks require multimodal model' };
    }

    // Quality preference overrides cost optimization
    if (request.preferQuality) {
      return { canUseSLM: false, reason: 'Quality preference selected - using full LLM' };
    }

    // L1/L2 and simple/moderate tasks can use SLM
    return { canUseSLM: true, reason: 'Task suitable for SLM routing' };
  }

  private selectBestSLM(request: RoutingRequest): SLMModel {
    // Score each SLM based on task fit
    const scored = SLM_MODELS.map(model => {
      let score = 0;

      // Quality score contribution
      score += model.qualityScore * 30;

      // Speed score contribution (more important for L1 tasks)
      score += model.speedScore * (request.romaLevel === 'L1' ? 40 : 20);

      // Cost efficiency (lower cost = higher score)
      const avgCost = (model.inputCost + model.outputCost) / 2;
      score += (1 - avgCost / 0.2) * 20;

      // Context window bonus for long prompts
      if (request.prompt && request.prompt.length > 10000) {
        score += model.contextWindow > 32000 ? 10 : 0;
      }

      // Task type matching
      if (request.taskType && model.suitableFor.includes(request.taskType)) {
        score += 15;
      }

      return { model, score };
    });

    // Sort by score and return best
    scored.sort((a, b) => b.score - a.score);
    return scored[0].model;
  }

  /**
   * Get all available SLM models
   */
  public getAvailableModels(): SLMModel[] {
    return SLM_MODELS;
  }

  /**
   * Get routing statistics
   */
  public getStats() {
    const slmPercentage = this.routingStats.totalRequests > 0
      ? (this.routingStats.slmRouted / this.routingStats.totalRequests * 100).toFixed(1)
      : 0;

    return {
      ...this.routingStats,
      slmPercentage: `${slmPercentage}%`,
      enabled: this.isEnabled
    };
  }

  /**
   * Enable/disable SLM routing
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.emit('status_changed', { enabled });
  }
}

export const slmRoutingService = SLMRoutingService.getInstance();
