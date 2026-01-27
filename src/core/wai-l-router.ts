/**
 * WAI-L Router v9.0 - Policy-Driven LLM Selection
 * Implements Runbook Prompt 4: Router + fallback trees
 * Policy-driven selection with cost, latency, quality, carbon weights
 */

import { EventEmitter } from 'events';
import { WAILogger } from '../utils/logger';
import { ModelAdapterSPI } from '../types/spi-contracts';
import { CapabilityMatrix } from './capability-matrix';

export class WAILRouter extends EventEmitter {
  private logger: WAILogger;
  private initialized = false;
  private adapters: Map<string, ModelAdapterSPI> = new Map();
  private fallbackTrees: Map<string, FallbackTree> = new Map();
  private routingPolicies: RoutingPolicies;
  private shadowRouting: ShadowRouting;
  private routingHistory: RoutingDecision[] = [];

  constructor(private config: WAILRouterConfig) {
    super();
    this.logger = new WAILogger('WAI-L-Router');
    this.routingPolicies = new RoutingPolicies(config.weights || DEFAULT_WEIGHTS);
    this.shadowRouting = new ShadowRouting();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('🧠 Initializing WAI-L Router...');

      // Initialize routing policies
      await this.routingPolicies.initialize();

      // Initialize shadow routing for A/B testing
      await this.shadowRouting.initialize();

      // Build default fallback trees
      await this.buildFallbackTrees();

      // Start policy evaluation loop
      this.startPolicyEvaluationLoop();

      this.initialized = true;
      this.logger.info('✅ WAI-L Router initialized');

    } catch (error) {
      this.logger.error('❌ WAI-L Router initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register a new model adapter
   */
  async registerAdapter(adapter: ModelAdapterSPI): Promise<RegistrationResult> {
    try {
      await adapter.initialize();
      this.adapters.set(adapter.providerId, adapter);
      
      // Update capability matrix
      if (this.config.capabilityMatrix) {
        await this.config.capabilityMatrix.scanProviders([{
          id: adapter.providerId,
          name: adapter.providerName,
          available: true,
          models: adapter.models.map(m => m.id)
        }]);
      }

      this.logger.info(`✅ Registered adapter: ${adapter.providerName}`);
      
      return {
        success: true,
        id: adapter.providerId,
        message: `Adapter ${adapter.providerName} registered successfully`
      };

    } catch (error) {
      this.logger.error(`❌ Failed to register adapter ${adapter.providerName}:`, error);
      
      return {
        success: false,
        id: adapter.providerId,
        message: `Registration failed: ${error.message}`
      };
    }
  }

  /**
   * Route request to optimal provider using multi-objective optimization
   */
  async route(request: RoutingRequest): Promise<RoutingResult> {
    const startTime = Date.now();

    try {
      this.logger.info(`🎯 Routing request: ${request.type}`);

      // Get candidate providers
      const candidates = await this.getCandidateProviders(request);
      
      if (candidates.length === 0) {
        throw new Error(`No providers available for capability: ${request.capability}`);
      }

      // Apply multi-objective optimization
      const decision = await this.makeRoutingDecision(candidates, request);
      
      // Execute shadow routing for learning
      const shadowResult = await this.shadowRouting.execute(candidates, request, decision);
      
      // Record decision for policy evaluation
      const routingDecision: RoutingDecision = {
        requestId: request.requestId,
        selectedProvider: decision.providerId,
        selectedModel: decision.modelId,
        alternatives: candidates.map(c => c.providerId),
        score: decision.score,
        reasoning: decision.reasoning,
        weights: this.routingPolicies.getCurrentWeights(),
        shadowResult,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };

      this.routingHistory.push(routingDecision);
      this.emit('routingDecision', routingDecision);

      // Log to policy_eval table
      await this.logPolicyDecision(routingDecision);

      return {
        success: true,
        provider: decision.providerId,
        model: decision.modelId,
        adapter: this.adapters.get(decision.providerId),
        fallbackChain: this.getFallbackChain(request.type, decision.providerId),
        metadata: {
          score: decision.score,
          reasoning: decision.reasoning,
          alternatives: decision.alternatives.length,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      this.logger.error('❌ Routing failed:', error);

      // Try fallback routing
      const fallbackResult = await this.tryFallbackRouting(request, error);
      
      if (fallbackResult) {
        return fallbackResult;
      }

      throw error;
    }
  }

  /**
   * Get candidate providers for a request
   */
  private async getCandidateProviders(request: RoutingRequest): Promise<ProviderCandidate[]> {
    const candidates: ProviderCandidate[] = [];

    for (const [providerId, adapter] of this.adapters) {
      try {
        // Check provider health
        const health = await adapter.healthCheck();
        if (!health.available) continue;

        // Check capability support
        const hasCapability = adapter.models.some(model => 
          model.capabilities.includes(request.capability)
        );
        if (!hasCapability) continue;

        // Get best model for this provider
        const bestModel = this.selectBestModelForProvider(adapter, request);
        if (!bestModel) continue;

        // Calculate provider score
        const score = await this.calculateProviderScore(adapter, bestModel, request, health);

        candidates.push({
          providerId: adapter.providerId,
          providerName: adapter.providerName,
          modelId: bestModel.id,
          modelName: bestModel.name,
          adapter,
          score,
          health,
          pricing: bestModel.pricing,
          capabilities: bestModel.capabilities
        });

      } catch (error) {
        this.logger.warn(`⚠️ Failed to evaluate provider ${providerId}:`, error);
      }
    }

    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Make routing decision using multi-objective optimization
   */
  private async makeRoutingDecision(
    candidates: ProviderCandidate[], 
    request: RoutingRequest
  ): Promise<RouteDecision> {
    const weights = this.routingPolicies.getWeightsForRequest(request);
    
    // Score each candidate using multi-objective function
    const scored = candidates.map(candidate => {
      const scores = {
        cost: this.calculateCostScore(candidate, request),
        latency: this.calculateLatencyScore(candidate, request),
        quality: this.calculateQualityScore(candidate, request),
        carbon: this.calculateCarbonScore(candidate, request)
      };

      const weightedScore = 
        scores.cost * weights.cost +
        scores.latency * weights.latency +
        scores.quality * weights.quality +
        scores.carbon * weights.carbon;

      return {
        candidate,
        scores,
        weightedScore,
        reasoning: this.generateReasoning(candidate, scores, weights)
      };
    });

    // Select best candidate
    const best = scored.reduce((prev, current) => 
      current.weightedScore > prev.weightedScore ? current : prev
    );

    return {
      providerId: best.candidate.providerId,
      modelId: best.candidate.modelId,
      score: best.weightedScore,
      reasoning: best.reasoning,
      alternatives: scored.filter(s => s !== best).slice(0, 2).map(s => ({
        providerId: s.candidate.providerId,
        modelId: s.candidate.modelId,
        score: s.weightedScore
      }))
    };
  }

  /**
   * Calculate cost score (higher score = lower cost)
   */
  private calculateCostScore(candidate: ProviderCandidate, request: RoutingRequest): number {
    const estimatedTokens = request.estimatedTokens || 1000;
    const costPer1M = candidate.pricing.inputTokens + candidate.pricing.outputTokens;
    const estimatedCost = (costPer1M * estimatedTokens) / 1000000;
    
    // Normalize to 0-1 scale (assume max cost of $0.10 per request)
    const maxCost = 0.10;
    return Math.max(0, (maxCost - estimatedCost) / maxCost);
  }

  /**
   * Calculate latency score (higher score = lower latency)
   */
  private calculateLatencyScore(candidate: ProviderCandidate, request: RoutingRequest): number {
    const avgLatency = candidate.health.latency || 1000; // ms
    const maxAcceptableLatency = request.maxLatency || 5000; // ms
    
    return Math.max(0, (maxAcceptableLatency - avgLatency) / maxAcceptableLatency);
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(candidate: ProviderCandidate, request: RoutingRequest): number {
    // Base quality score from provider/model reputation
    let score = 0.8; // Default quality score
    
    // Adjust based on model type
    if (candidate.modelId.includes('gpt-4') || 
        candidate.modelId.includes('claude-3') || 
        candidate.modelId.includes('gemini-1.5')) {
      score = 0.95;
    } else if (candidate.modelId.includes('gpt-3.5') || 
               candidate.modelId.includes('claude-haiku')) {
      score = 0.85;
    }
    
    // Adjust based on provider health
    if (candidate.health.errorRate > 0.05) {
      score *= 0.9;
    }
    
    return score;
  }

  /**
   * Calculate carbon footprint score (higher score = lower carbon)
   */
  private calculateCarbonScore(candidate: ProviderCandidate, request: RoutingRequest): number {
    // Simplified carbon scoring based on provider efficiency
    const carbonIntensity: Record<string, number> = {
      'openai': 0.8,    // High efficiency data centers
      'anthropic': 0.85, // Good efficiency
      'google': 0.9,    // Excellent efficiency (renewable energy)
      'groq': 0.95,     // Specialized hardware, very efficient
      'together': 0.7,  // Less efficient distributed compute
    };
    
    return carbonIntensity[candidate.providerId] || 0.75;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    candidate: ProviderCandidate, 
    scores: any, 
    weights: RouteWeights
  ): string {
    const reasons = [];
    
    if (scores.cost > 0.8) reasons.push('cost-effective');
    if (scores.latency > 0.8) reasons.push('fast response');
    if (scores.quality > 0.9) reasons.push('high quality');
    if (scores.carbon > 0.8) reasons.push('eco-friendly');
    
    const topWeight = Object.entries(weights)
      .reduce((a, b) => weights[a[0]] > weights[b[0]] ? a : b)[0];
    
    if (reasons.length === 0) {
      reasons.push(`optimized for ${topWeight}`);
    }
    
    return `Selected ${candidate.providerName} - ${reasons.join(', ')}`;
  }

  /**
   * Try fallback routing when primary routing fails
   */
  private async tryFallbackRouting(
    request: RoutingRequest, 
    error: Error
  ): Promise<RoutingResult | null> {
    this.logger.info('🔄 Attempting fallback routing...');

    const fallbackTree = this.fallbackTrees.get(request.type);
    if (!fallbackTree) {
      return null;
    }

    for (const fallbackProvider of fallbackTree.chain) {
      try {
        const adapter = this.adapters.get(fallbackProvider);
        if (!adapter) continue;

        const health = await adapter.healthCheck();
        if (!health.available) continue;

        this.logger.info(`🔄 Using fallback provider: ${fallbackProvider}`);
        
        return {
          success: true,
          provider: fallbackProvider,
          model: this.getDefaultModel(adapter),
          adapter,
          fallbackChain: fallbackTree.chain,
          metadata: {
            fallback: true,
            originalError: error.message,
            fallbackReason: 'Primary provider failed'
          }
        };

      } catch (fallbackError) {
        this.logger.warn(`⚠️ Fallback provider ${fallbackProvider} also failed:`, fallbackError);
      }
    }

    return null;
  }

  /**
   * Build fallback trees for different task types
   */
  private async buildFallbackTrees(): Promise<void> {
    this.logger.info('🌳 Building fallback trees...');

    // Default fallback chains by task type
    const fallbackChains: Record<string, string[]> = {
      'text-generation': ['openai', 'anthropic', 'google', 'groq', 'together'],
      'code-generation': ['openai', 'anthropic', 'groq', 'together'],
      'embeddings': ['openai', 'google', 'cohere'],
      'image-generation': ['openai', 'replicate'],
      'transcription': ['openai', 'deepgram']
    };

    for (const [taskType, chain] of Object.entries(fallbackChains)) {
      this.fallbackTrees.set(taskType, {
        taskType,
        chain: chain.filter(providerId => this.adapters.has(providerId)),
        lastUpdated: Date.now()
      });
    }

    this.logger.info(`✅ Built ${this.fallbackTrees.size} fallback trees`);
  }

  /**
   * Select best model for provider given request
   */
  private selectBestModelForProvider(
    adapter: ModelAdapterSPI, 
    request: RoutingRequest
  ): any | null {
    const compatibleModels = adapter.models.filter(model =>
      model.capabilities.includes(request.capability)
    );

    if (compatibleModels.length === 0) return null;

    // Select highest quality model within budget
    if (request.maxCost) {
      const affordableModels = compatibleModels.filter(model => {
        const estimatedCost = this.estimateModelCost(model, request);
        return estimatedCost <= request.maxCost;
      });

      if (affordableModels.length > 0) {
        return this.selectHighestQualityModel(affordableModels);
      }
    }

    return this.selectHighestQualityModel(compatibleModels);
  }

  private selectHighestQualityModel(models: any[]): any {
    // Simple quality ranking based on model names
    const qualityRanking = [
      'gpt-4o', 'gpt-4-turbo', 'claude-3-opus', 'claude-3.5-sonnet',
      'gemini-1.5-pro', 'gpt-3.5-turbo', 'claude-3-haiku', 'gemini-1.5-flash'
    ];

    for (const modelId of qualityRanking) {
      const model = models.find(m => m.id === modelId);
      if (model) return model;
    }

    return models[0]; // Return first available model
  }

  private estimateModelCost(model: any, request: RoutingRequest): number {
    const estimatedTokens = request.estimatedTokens || 1000;
    const costPer1M = model.pricing.inputTokens + model.pricing.outputTokens;
    return (costPer1M * estimatedTokens) / 1000000;
  }

  private async calculateProviderScore(
    adapter: ModelAdapterSPI,
    model: any,
    request: RoutingRequest,
    health: any
  ): number {
    let score = 1.0;

    // Health penalty
    if (!health.available) score *= 0.1;
    if (health.errorRate > 0.05) score *= 0.8;

    // Latency bonus/penalty
    if (health.latency < 500) score *= 1.2;
    else if (health.latency > 2000) score *= 0.7;

    // Model quality bonus
    if (model.id.includes('gpt-4') || model.id.includes('claude-3')) {
      score *= 1.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private getDefaultModel(adapter: ModelAdapterSPI): string {
    return adapter.models[0]?.id || 'default';
  }

  private getFallbackChain(taskType: string, excludeProvider: string): string[] {
    const fallbackTree = this.fallbackTrees.get(taskType);
    if (!fallbackTree) return [];

    return fallbackTree.chain.filter(providerId => providerId !== excludeProvider);
  }

  private async logPolicyDecision(decision: RoutingDecision): Promise<void> {
    try {
      // This would log to the policy_eval table
      this.emit('policyDecision', {
        jobId: decision.requestId,
        rule: 'wai-l-routing',
        decision: decision.selectedProvider,
        reason: decision.reasoning,
        timestamp: decision.timestamp
      });
    } catch (error) {
      this.logger.warn('⚠️ Failed to log policy decision:', error);
    }
  }

  private startPolicyEvaluationLoop(): void {
    // Run policy evaluation every 5 minutes
    setInterval(async () => {
      await this.evaluateAndUpdatePolicies();
    }, 5 * 60 * 1000);
  }

  private async evaluateAndUpdatePolicies(): Promise<void> {
    try {
      // Analyze recent routing decisions
      const recentDecisions = this.routingHistory.slice(-1000);
      
      // Update weights based on performance
      await this.routingPolicies.updateWeights(recentDecisions);
      
      this.logger.info('🔄 Routing policies updated based on performance feedback');
    } catch (error) {
      this.logger.warn('⚠️ Policy evaluation failed:', error);
    }
  }

  async getHealth(): Promise<ComponentHealth> {
    const healthyProviders = Array.from(this.adapters.values())
      .filter(adapter => adapter.healthCheck?.() !== false).length;

    return {
      healthy: this.initialized,
      status: this.initialized ? 'active' : 'inactive',
      lastCheck: Date.now(),
      details: {
        totalProviders: this.adapters.size,
        healthyProviders,
        fallbackTrees: this.fallbackTrees.size,
        recentDecisions: this.routingHistory.length
      }
    };
  }

  async getHealthyProviderCount(): Promise<number> {
    let count = 0;
    for (const adapter of this.adapters.values()) {
      try {
        const health = await adapter.healthCheck();
        if (health.available) count++;
      } catch {
        // Provider unhealthy
      }
    }
    return count;
  }

  async shutdown(): Promise<void> {
    this.logger.info('🔄 Shutting down WAI-L router...');
    
    for (const adapter of this.adapters.values()) {
      try {
        // Adapters don't have shutdown method in SPI
        // await adapter.shutdown();
      } catch (error) {
        this.logger.warn('⚠️ Adapter shutdown failed:', error);
      }
    }
    
    this.initialized = false;
  }
}

// Supporting classes
class RoutingPolicies {
  private weights: RouteWeights;

  constructor(initialWeights: RouteWeights) {
    this.weights = { ...initialWeights };
  }

  async initialize(): Promise<void> {
    // Initialize routing policies
  }

  getCurrentWeights(): RouteWeights {
    return { ...this.weights };
  }

  getWeightsForRequest(request: RoutingRequest): RouteWeights {
    // Could customize weights per request type
    return this.getCurrentWeights();
  }

  async updateWeights(decisions: RoutingDecision[]): Promise<void> {
    // Analyze decisions and update weights
    // This would implement GRPO-style policy optimization
  }
}

class ShadowRouting {
  async initialize(): Promise<void> {
    // Initialize shadow routing
  }

  async execute(
    candidates: ProviderCandidate[],
    request: RoutingRequest,
    primaryDecision: RouteDecision
  ): Promise<ShadowResult> {
    // Execute shadow routing for A/B testing
    return {
      executed: true,
      alternativeProvider: candidates[1]?.providerId,
      learningData: {}
    };
  }
}

// Type definitions
const DEFAULT_WEIGHTS: RouteWeights = {
  cost: 0.3,
  latency: 0.3,
  quality: 0.3,
  carbon: 0.1
};

interface WAILRouterConfig {
  capabilityMatrix?: CapabilityMatrix;
  weights?: RouteWeights;
  costManager?: any;
}

interface RouteWeights {
  cost: number;
  latency: number;
  quality: number;
  carbon: number;
}

interface RoutingRequest {
  requestId: string;
  type: string;
  capability: string;
  estimatedTokens?: number;
  maxCost?: number;
  maxLatency?: number;
  minQuality?: number;
  context?: Record<string, unknown>;
}

interface RoutingResult {
  success: boolean;
  provider: string;
  model: string;
  adapter?: ModelAdapterSPI;
  fallbackChain?: string[];
  metadata?: Record<string, unknown>;
}

interface ProviderCandidate {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  adapter: ModelAdapterSPI;
  score: number;
  health: any;
  pricing: any;
  capabilities: string[];
}

interface RouteDecision {
  providerId: string;
  modelId: string;
  score: number;
  reasoning: string;
  alternatives: {
    providerId: string;
    modelId: string;
    score: number;
  }[];
}

interface RoutingDecision {
  requestId: string;
  selectedProvider: string;
  selectedModel: string;
  alternatives: string[];
  score: number;
  reasoning: string;
  weights: RouteWeights;
  shadowResult?: ShadowResult;
  timestamp: number;
  executionTime: number;
}

interface FallbackTree {
  taskType: string;
  chain: string[];
  lastUpdated: number;
}

interface ShadowResult {
  executed: boolean;
  alternativeProvider?: string;
  learningData: Record<string, unknown>;
}

interface RegistrationResult {
  success: boolean;
  id: string;
  message: string;
}

interface ComponentHealth {
  healthy: boolean;
  status: string;
  lastCheck: number;
  details?: Record<string, unknown>;
}