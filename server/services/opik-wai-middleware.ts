// Opik-WAI Integration Middleware - Automatic monitoring for all agent interactions
// Integrates Opik monitoring seamlessly with existing WAI orchestration

import { opikIntegration } from './opik-integration';

interface OpikMiddlewareConfig {
  enableTracing: boolean;
  enableEvaluation: boolean;
  enableABTesting: boolean;
  sampleRate: number; // 0-1, percentage of requests to monitor
}

class OpikWAIMiddleware {
  private config: OpikMiddlewareConfig;
  private activeTraces: Map<string, string> = new Map(); // requestId -> traceId

  constructor(config: Partial<OpikMiddlewareConfig> = {}) {
    this.config = {
      enableTracing: true,
      enableEvaluation: true,
      enableABTesting: false,
      sampleRate: 1.0,
      ...config
    };

    console.log('🔗 Opik-WAI Middleware initialized with automatic monitoring');
  }

  // Express middleware for automatic trace creation
  createTraceMiddleware() {
    return async (req: any, res: any, next: any) => {
      // Sample requests based on configuration
      if (Math.random() > this.config.sampleRate) {
        return next();
      }

      // Extract agent and LLM information from request
      const agentName = this.extractAgentName(req);
      const llmProvider = this.extractLLMProvider(req);
      const model = this.extractModel(req);
      const input = this.extractInput(req);

      if (agentName && llmProvider && model && input && this.config.enableTracing) {
        try {
          const traceId = await opikIntegration.startTrace(agentName, llmProvider, model, input);
          const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          this.activeTraces.set(requestId, traceId);
          req.opikTraceId = traceId;
          req.requestId = requestId;

          // Hook into response to capture output
          const originalSend = res.send;
          res.send = (body: any) => {
            this.handleResponse(requestId, body);
            return originalSend.call(res, body);
          };

          console.log(`🔍 Opik trace started: ${traceId} for agent ${agentName}`);
        } catch (error) {
          console.error('Failed to start Opik trace:', error);
        }
      }

      next();
    };
  }

  // Automatic response capture and trace completion
  private async handleResponse(requestId: string, responseBody: any): Promise<void> {
    const traceId = this.activeTraces.get(requestId);
    if (!traceId) return;

    try {
      const output = this.extractOutput(responseBody);
      const metrics = this.calculateMetrics(responseBody);

      await opikIntegration.endTrace(traceId, output, metrics);
      this.activeTraces.delete(requestId);
      
      console.log(`✅ Opik trace completed: ${traceId}`);
    } catch (error) {
      console.error('Failed to complete Opik trace:', error);
    }
  }

  // Agent coordination monitoring for multi-agent workflows
  async monitorAgentCoordination(workflow: any): Promise<void> {
    if (!this.config.enableTracing) return;

    try {
      const coordinationTrace = await opikIntegration.startTrace(
        'agent-coordinator',
        'wai-orchestrator',
        'multi-agent-v1',
        JSON.stringify(workflow.input)
      );

      // Track individual agent interactions within the workflow
      const agentTraces: string[] = [];
      
      for (const step of workflow.steps) {
        const stepTrace = await opikIntegration.startTrace(
          step.agent,
          step.llmProvider,
          step.model,
          step.input
        );
        agentTraces.push(stepTrace);
      }

      // Complete all traces when workflow finishes
      workflow.onComplete = async (result: any) => {
        for (let i = 0; i < agentTraces.length; i++) {
          const step = workflow.steps[i];
          await opikIntegration.endTrace(agentTraces[i], step.output, step.metrics);
        }

        await opikIntegration.endTrace(coordinationTrace, JSON.stringify(result), {
          latency: workflow.totalTime,
          cost: workflow.totalCost,
          accuracy: workflow.successRate,
          hallucination_rate: 0,
          response_quality: workflow.qualityScore,
          token_usage: {
            input_tokens: workflow.totalInputTokens,
            output_tokens: workflow.totalOutputTokens,
            total_cost: workflow.totalCost
          }
        });
      };

    } catch (error) {
      console.error('Failed to monitor agent coordination:', error);
    }
  }

  // A/B Testing integration for agents
  async shouldUseAgentB(agentA: string, agentB: string): Promise<boolean> {
    if (!this.config.enableABTesting) return false;

    // Simple A/B testing logic - in production this would be more sophisticated
    return Math.random() < 0.5;
  }

  // Performance insights for WAI orchestration
  async getOrchestrationInsights(): Promise<any> {
    const dashboardData = await opikIntegration.getDashboardData();
    const performanceInsights = await opikIntegration.getPerformanceInsights();
    
    return {
      wai_orchestration_performance: {
        total_agent_interactions: dashboardData.real_time_performance.requests_per_minute * 60,
        average_response_time: dashboardData.real_time_performance.average_latency,
        cost_per_hour: dashboardData.real_time_performance.cost_per_hour,
        success_rate: dashboardData.real_time_performance.success_rate
      },
      agent_efficiency: dashboardData.agent_performance.map((agent: any) => ({
        agent_name: agent.agent_name,
        efficiency_score: (agent.success_rate * 0.4) + ((1 - agent.average_latency / 5000) * 0.3) + (agent.quality_score * 0.3),
        cost_efficiency: agent.cost_efficiency,
        recommended_optimizations: this.getAgentOptimizations(agent)
      })),
      llm_provider_optimization: dashboardData.llm_provider_stats,
      recommendations: performanceInsights.optimization_opportunities
    };
  }

  // Extract agent information from requests
  private extractAgentName(req: any): string | null {
    // Extract from URL path
    if (req.path.includes('/agents/')) {
      const match = req.path.match(/\/agents\/([^\/]+)/);
      return match ? match[1] : null;
    }

    // Extract from body
    if (req.body?.agent) return req.body.agent;
    if (req.body?.agentName) return req.body.agentName;

    // Extract from headers
    if (req.headers['x-agent-name']) return req.headers['x-agent-name'];

    // Default agent names based on endpoints
    if (req.path.includes('/ai-assistant-builder')) return 'ai-assistant-builder';
    if (req.path.includes('/content-creation')) return 'content-creator';
    if (req.path.includes('/code-generation')) return 'code-generator';
    if (req.path.includes('/kimi-k2')) return 'kimi-k2-agent';

    return null;
  }

  private extractLLMProvider(req: any): string | null {
    if (req.body?.llmProvider) return req.body.llmProvider;
    if (req.body?.provider) return req.body.provider;
    if (req.headers['x-llm-provider']) return req.headers['x-llm-provider'];

    // Default providers based on endpoints
    if (req.path.includes('/kimi-k2')) return 'kimi';
    if (req.path.includes('/claude')) return 'anthropic';
    if (req.path.includes('/gpt') || req.path.includes('/openai')) return 'openai';
    if (req.path.includes('/gemini')) return 'google';

    return 'wai-orchestrator'; // Default to WAI orchestrator
  }

  private extractModel(req: any): string | null {
    if (req.body?.model) return req.body.model;
    if (req.headers['x-llm-model']) return req.headers['x-llm-model'];

    // Default models based on providers
    const provider = this.extractLLMProvider(req);
    const modelDefaults: Record<string, string> = {
      'kimi': 'kimi-k2-instruct',
      'anthropic': 'claude-sonnet-4-20250514',
      'openai': 'gpt-4o',
      'google': 'gemini-2.5-pro',
      'wai-orchestrator': 'multi-llm-v1'
    };

    return provider ? modelDefaults[provider] || 'unknown' : 'unknown';
  }

  private extractInput(req: any): string | null {
    if (req.body?.prompt) return req.body.prompt;
    if (req.body?.input) return req.body.input;
    if (req.body?.message) return req.body.message;
    if (req.body?.query) return req.body.query;

    // For GET requests, use query parameters
    if (req.method === 'GET' && req.query?.q) return req.query.q as string;

    return JSON.stringify(req.body) || req.path;
  }

  private extractOutput(responseBody: any): string {
    if (typeof responseBody === 'string') return responseBody;
    
    if (responseBody?.result) return JSON.stringify(responseBody.result);
    if (responseBody?.output) return JSON.stringify(responseBody.output);
    if (responseBody?.response) return JSON.stringify(responseBody.response);
    if (responseBody?.data) return JSON.stringify(responseBody.data);

    return JSON.stringify(responseBody);
  }

  private calculateMetrics(responseBody: any): any {
    const baseMetrics = {
      latency: 0, // Will be calculated by Opik
      cost: 0.01, // Default cost estimate
      accuracy: 0.85, // Default accuracy
      hallucination_rate: 0.1, // Default hallucination rate
      response_quality: 0.8, // Default quality score
      token_usage: {
        input_tokens: 100,
        output_tokens: 200,
        total_cost: 0.01
      }
    };

    // Extract real metrics if available in response
    if (responseBody?.metrics) {
      return { ...baseMetrics, ...responseBody.metrics };
    }

    // Estimate based on response size
    const outputSize = JSON.stringify(responseBody).length;
    const estimatedTokens = Math.ceil(outputSize / 4); // Rough token estimation

    return {
      ...baseMetrics,
      token_usage: {
        input_tokens: 100,
        output_tokens: estimatedTokens,
        total_cost: estimatedTokens * 0.00005 // Rough cost estimation
      }
    };
  }

  private getAgentOptimizations(agent: any): string[] {
    const optimizations: string[] = [];

    if (agent.success_rate < 0.9) {
      optimizations.push('Improve error handling and input validation');
    }

    if (agent.average_latency > 3000) {
      optimizations.push('Consider using faster LLM provider or optimizing prompts');
    }

    if (agent.cost_efficiency < 0.5) {
      optimizations.push('Switch to more cost-effective LLM provider for this use case');
    }

    if (agent.quality_score < 0.8) {
      optimizations.push('Enhance system prompts and add quality validation');
    }

    return optimizations.length > 0 ? optimizations : ['Agent performing optimally'];
  }

  // Update configuration
  updateConfig(newConfig: Partial<OpikMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Opik middleware configuration updated:', this.config);
  }

  // Get current metrics for dashboard
  async getCurrentMetrics(): Promise<any> {
    return {
      active_traces: this.activeTraces.size,
      sample_rate: this.config.sampleRate,
      features_enabled: {
        tracing: this.config.enableTracing,
        evaluation: this.config.enableEvaluation,
        ab_testing: this.config.enableABTesting
      }
    };
  }
}

// Export singleton instance
export const opikWAIMiddleware = new OpikWAIMiddleware();
export { OpikWAIMiddleware };