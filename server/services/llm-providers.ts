/**
 * LLM Providers - WAI SDK Compatibility Layer
 * 
 * Phase 2A Stage 0 - Deduplication Fix
 * Provides compatibility layer for legacy code expecting LLMProviders API
 * Routes all calls through OrchestrationFacade for proper WAI SDK integration
 * 
 * BEFORE: Returned mock data, no real LLM calls
 * AFTER: Routes through OrchestrationFacade with real LLM processing
 */

import { OrchestrationFacade } from '../orchestration/orchestration-facade';
import type { WorkflowExecutionOptions } from '../orchestration/orchestration-facade';

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  tokens: number;
  cost: number;
  processingTime: number;
}

export interface LLMRequest {
  prompt: string;
  type: 'text' | 'code' | 'analysis';
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export class LLMProviders {
  constructor() {
    console.log('✅ LLMProviders: Routing through WAI SDK OrchestrationFacade');
  }

  /**
   * Map request type to orchestration type
   */
  private mapRequestTypeToOrchestrationType(type: 'text' | 'code' | 'analysis'): 'creative' | 'analytical' | 'development' | 'hybrid' {
    switch (type) {
      case 'code':
        return 'development';
      case 'analysis':
        return 'analytical';
      case 'text':
      default:
        return 'hybrid';
    }
  }

  /**
   * Process request with OpenAI through OrchestrationFacade
   */
  async processWithOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      const facade = new OrchestrationFacade({
        enableStreaming: false,
        enableMonitoring: true,
        enableRetries: true,
      });

      const workflowParams = {
        prompt: request.prompt,
        provider: 'openai',
        model: request.model || 'gpt-4o',
        maxTokens: request.maxTokens || 4096,
        temperature: request.temperature,
      };

      const options: WorkflowExecutionOptions = {
        type: this.mapRequestTypeToOrchestrationType(request.type),
        priority: 'normal',
        parameters: workflowParams,
        costOptimization: true,
        preferredProviders: ['openai'],
      };

      const result = await facade.executeWorkflow('llm-request', workflowParams, options);

      const processingTime = Date.now() - startTime;
      
      return {
        content: result.result?.toString() || '',
        model: result.metadata?.model || 'gpt-4o',
        provider: 'openai',
        tokens: result.metadata?.tokensUsed || 0,
        cost: result.metadata?.cost || 0,
        processingTime,
      };
    } catch (error: any) {
      console.error('❌ LLM processing error:', error);
      throw new Error(`LLM processing failed: ${error.message}`);
    }
  }

  /**
   * Process request with Anthropic through OrchestrationFacade
   */
  async processWithAnthropic(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      const facade = new OrchestrationFacade({
        enableStreaming: false,
        enableMonitoring: true,
        enableRetries: true,
      });

      const workflowParams = {
        prompt: request.prompt,
        provider: 'anthropic',
        model: request.model || 'claude-sonnet-4-20250514',
        maxTokens: request.maxTokens || 4096,
        temperature: request.temperature,
      };

      const options: WorkflowExecutionOptions = {
        type: this.mapRequestTypeToOrchestrationType(request.type),
        priority: 'normal',
        parameters: workflowParams,
        costOptimization: true,
        preferredProviders: ['anthropic'],
      };

      const result = await facade.executeWorkflow('llm-request', workflowParams, options);

      const processingTime = Date.now() - startTime;
      
      return {
        content: result.result?.toString() || '',
        model: result.metadata?.model || 'claude-sonnet-4-20250514',
        provider: 'anthropic',
        tokens: result.metadata?.tokensUsed || 0,
        cost: result.metadata?.cost || 0,
        processingTime,
      };
    } catch (error: any) {
      console.error('❌ LLM processing error:', error);
      throw new Error(`LLM processing failed: ${error.message}`);
    }
  }

  /**
   * Process request with Google through OrchestrationFacade
   */
  async processWithGoogle(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      const facade = new OrchestrationFacade({
        enableStreaming: false,
        enableMonitoring: true,
        enableRetries: true,
      });

      const workflowParams = {
        prompt: request.prompt,
        provider: 'google',
        model: request.model || 'gemini-2.5-flash',
        maxTokens: request.maxTokens || 4096,
        temperature: request.temperature,
      };

      const options: WorkflowExecutionOptions = {
        type: this.mapRequestTypeToOrchestrationType(request.type),
        priority: 'normal',
        parameters: workflowParams,
        costOptimization: true,
        preferredProviders: ['google'],
      };

      const result = await facade.executeWorkflow('llm-request', workflowParams, options);

      const processingTime = Date.now() - startTime;
      
      return {
        content: result.result?.toString() || '',
        model: result.metadata?.model || 'gemini-2.5-flash',
        provider: 'google',
        tokens: result.metadata?.tokensUsed || 0,
        cost: result.metadata?.cost || 0,
        processingTime,
      };
    } catch (error: any) {
      console.error('❌ LLM processing error:', error);
      throw new Error(`LLM processing failed: ${error.message}`);
    }
  }

  /**
   * Generate response using auto-selected provider
   */
  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      const facade = new OrchestrationFacade({
        enableStreaming: false,
        enableMonitoring: true,
        enableRetries: true,
      });

      const workflowParams = {
        prompt: request.prompt,
        provider: 'auto',
        model: 'auto',
        maxTokens: request.maxTokens || 4096,
        temperature: request.temperature,
      };

      const options: WorkflowExecutionOptions = {
        type: this.mapRequestTypeToOrchestrationType(request.type),
        priority: 'normal',
        parameters: workflowParams,
        costOptimization: true,
      };

      const result = await facade.executeWorkflow('llm-request', workflowParams, options);

      const processingTime = Date.now() - startTime;
      
      return {
        content: result.result?.toString() || '',
        model: result.metadata?.model || 'auto',
        provider: result.metadata?.provider || 'auto',
        tokens: result.metadata?.tokensUsed || 0,
        cost: result.metadata?.cost || 0,
        processingTime,
      };
    } catch (error: any) {
      console.error('❌ LLM processing error:', error);
      throw new Error(`LLM processing failed: ${error.message}`);
    }
  }

  /**
   * Process request (auto-routing)
   */
  async processRequest(request: LLMRequest): Promise<LLMResponse> {
    return this.generateResponse(request);
  }

  // Health check methods
  async checkOpenAIHealth(): Promise<boolean> {
    try {
      await this.processWithOpenAI({
        prompt: 'ping',
        type: 'text',
        maxTokens: 10
      });
      return true;
    } catch {
      return false;
    }
  }

  async checkAnthropicHealth(): Promise<boolean> {
    try {
      await this.processWithAnthropic({
        prompt: 'ping',
        type: 'text',
        maxTokens: 10
      });
      return true;
    } catch {
      return false;
    }
  }

  async checkGoogleHealth(): Promise<boolean> {
    try {
      await this.processWithGoogle({
        prompt: 'ping',
        type: 'text',
        maxTokens: 10
      });
      return true;
    } catch {
      return false;
    }
  }

  // Utility methods for backward compatibility
  getAvailableModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'gemini-2.5-flash',
      'gemini-2.5-pro'
    ];
  }

  getProviderStatus(): Record<string, boolean> {
    return {
      openai: true,
      anthropic: true,
      google: true,
      auto: true
    };
  }
}

// Export singleton instance for backward compatibility
export const llmProviders = new LLMProviders();
