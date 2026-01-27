/**
 * Verbalized Sampling Service
 * WAI SDK v2.0 - January 18, 2026
 * 
 * Implements Verbalized Sampling for 2-3x diversity improvement in creative tasks.
 * Based on arXiv research: training-free prompting strategy that boosts LLM diversity.
 * 
 * How it works:
 * 1. Request multiple responses with explicit probabilities
 * 2. Sample from low-probability tails (<tau threshold)
 * 3. Achieve 2-3x diversity improvement while maintaining quality
 */

import { EventEmitter } from 'events';

export interface VerbalizedSamplingConfig {
  k: number;                    // Number of responses to generate (default: 5)
  tau: number;                  // Probability threshold (default: 0.10)
  temperature: number;          // Model temperature (default: 0.9)
  model?: string;               // LLM model to use
  seed?: number;                // Random seed for reproducibility
}

export interface VerbalizedResponse {
  text: string;
  probability: number;
  index: number;
  metadata?: Record<string, any>;
}

export interface VerbalizedSamplingResult {
  selectedResponse: VerbalizedResponse;
  allResponses: VerbalizedResponse[];
  config: VerbalizedSamplingConfig;
  diversityScore: number;
  executionTime: number;
}

// Tier-based default configurations
export const VS_CONFIG_BY_TIER: Record<string, VerbalizedSamplingConfig> = {
  creative: { k: 5, tau: 0.05, temperature: 0.95 },    // Maximum diversity
  research: { k: 5, tau: 0.10, temperature: 0.85 },    // Balanced
  development: { k: 3, tau: 0.15, temperature: 0.7 },  // Moderate
  qa: { k: 3, tau: 0.20, temperature: 0.5 },           // Conservative
  executive: { k: 3, tau: 0.25, temperature: 0.6 },    // Most focused
  domain: { k: 4, tau: 0.15, temperature: 0.75 },      // Domain-specific
  devops: { k: 3, tau: 0.20, temperature: 0.6 }        // Operational
};

// Verbalized Sampling prompt template
export const VERBALIZED_SAMPLING_PROMPT = `
<instructions>
Generate {k} responses to the user query, each within a separate <response> tag.
Each <response> must include:
- A <text> element containing the response content
- A <probability> element with a numeric value between 0 and 1

Please sample at random from the tails of the distribution, such that the 
probability of each response is less than {tau}.

Focus on diversity: each response should explore a different angle, approach, 
or perspective while maintaining quality and relevance.
</instructions>

User query: {query}
`;

export class VerbalizedSamplingService extends EventEmitter {
  private static instance: VerbalizedSamplingService;
  private isEnabled: boolean = true;
  private totalRequests: number = 0;
  private diversityImprovements: number[] = [];

  private constructor() {
    super();
    console.log('🎲 VerbalizedSamplingService initialized');
  }

  public static getInstance(): VerbalizedSamplingService {
    if (!VerbalizedSamplingService.instance) {
      VerbalizedSamplingService.instance = new VerbalizedSamplingService();
    }
    return VerbalizedSamplingService.instance;
  }

  /**
   * Generate diverse responses using verbalized sampling
   */
  public async generateDiverse(
    query: string,
    config?: Partial<VerbalizedSamplingConfig>,
    tier?: string
  ): Promise<VerbalizedSamplingResult> {
    const startTime = Date.now();
    this.totalRequests++;

    // Merge with tier defaults
    const tierConfig = tier ? VS_CONFIG_BY_TIER[tier] : VS_CONFIG_BY_TIER.development;
    const finalConfig: VerbalizedSamplingConfig = {
      k: config?.k ?? tierConfig.k,
      tau: config?.tau ?? tierConfig.tau,
      temperature: config?.temperature ?? tierConfig.temperature,
      model: config?.model,
      seed: config?.seed
    };

    console.log(`🎲 Verbalized Sampling: k=${finalConfig.k}, tau=${finalConfig.tau}, temp=${finalConfig.temperature}`);

    // Build the sampling prompt
    const prompt = this.buildPrompt(query, finalConfig);

    // Generate responses (simulated - in production, call actual LLM)
    const responses = await this.generateResponses(query, finalConfig);

    // Calculate diversity score
    const diversityScore = this.calculateDiversity(responses);
    this.diversityImprovements.push(diversityScore);

    // Sample from responses using weighted selection
    const selectedResponse = this.weightedSample(responses, finalConfig.seed);

    const executionTime = Date.now() - startTime;

    const result: VerbalizedSamplingResult = {
      selectedResponse,
      allResponses: responses,
      config: finalConfig,
      diversityScore,
      executionTime
    };

    this.emit('sampling_complete', result);
    console.log(`   ✅ Selected response ${selectedResponse.index} with probability ${selectedResponse.probability.toFixed(4)}`);
    console.log(`   📊 Diversity score: ${diversityScore.toFixed(2)}`);

    return result;
  }

  /**
   * Build the verbalized sampling prompt
   */
  private buildPrompt(query: string, config: VerbalizedSamplingConfig): string {
    return VERBALIZED_SAMPLING_PROMPT
      .replace('{k}', String(config.k))
      .replace('{tau}', String(config.tau))
      .replace('{query}', query);
  }

  /**
   * Generate k diverse responses
   * In production, this calls the LLM with the verbalized sampling prompt
   */
  private async generateResponses(
    query: string, 
    config: VerbalizedSamplingConfig
  ): Promise<VerbalizedResponse[]> {
    const responses: VerbalizedResponse[] = [];

    // Simulate response generation with varying approaches
    const approaches = [
      'analytical',
      'creative',
      'practical',
      'theoretical',
      'comparative'
    ];

    for (let i = 0; i < config.k; i++) {
      // Generate probability from tail distribution (< tau)
      const probability = Math.random() * config.tau;
      
      const response: VerbalizedResponse = {
        text: `[${approaches[i % approaches.length]} approach] Response ${i + 1} for: ${query.substring(0, 50)}...`,
        probability,
        index: i,
        metadata: {
          approach: approaches[i % approaches.length],
          temperature: config.temperature,
          timestamp: new Date().toISOString()
        }
      };

      responses.push(response);
    }

    return responses;
  }

  /**
   * Weighted sampling from responses based on probabilities
   */
  public weightedSample(
    responses: VerbalizedResponse[], 
    seed?: number
  ): VerbalizedResponse {
    if (responses.length === 0) {
      throw new Error('No responses to sample from');
    }

    if (responses.length === 1) {
      return responses[0];
    }

    // Normalize probabilities
    const totalProb = responses.reduce((sum, r) => sum + r.probability, 0);
    const normalized = responses.map(r => ({
      ...r,
      normalizedProb: r.probability / totalProb
    }));

    // Random weighted selection
    const random = seed !== undefined 
      ? this.seededRandom(seed) 
      : Math.random();
    
    let cumulative = 0;
    for (const response of normalized) {
      cumulative += response.normalizedProb;
      if (random <= cumulative) {
        return response;
      }
    }

    // Fallback to last response
    return responses[responses.length - 1];
  }

  /**
   * Calculate diversity score (0-1) based on response variation
   */
  private calculateDiversity(responses: VerbalizedResponse[]): number {
    if (responses.length <= 1) return 0;

    // Simple diversity metric based on probability distribution variance
    const probs = responses.map(r => r.probability);
    const mean = probs.reduce((a, b) => a + b, 0) / probs.length;
    const variance = probs.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / probs.length;
    
    // Higher variance = more diversity
    // Normalize to 0-1 range (assuming max variance of 0.1 for tau < 0.1)
    return Math.min(variance / 0.1, 1);
  }

  /**
   * Seeded random number generator for reproducibility
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Get configuration for a specific tier
   */
  public getConfigForTier(tier: string): VerbalizedSamplingConfig {
    return VS_CONFIG_BY_TIER[tier] || VS_CONFIG_BY_TIER.development;
  }

  /**
   * Enable/disable verbalized sampling
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.emit('status_changed', { enabled });
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    enabled: boolean;
    totalRequests: number;
    averageDiversity: number;
  } {
    const averageDiversity = this.diversityImprovements.length > 0
      ? this.diversityImprovements.reduce((a, b) => a + b, 0) / this.diversityImprovements.length
      : 0;

    return {
      enabled: this.isEnabled,
      totalRequests: this.totalRequests,
      averageDiversity
    };
  }
}

export const verbalizedSamplingService = VerbalizedSamplingService.getInstance();
