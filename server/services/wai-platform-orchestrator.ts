/**
 * WAI Platform Orchestrator - Compatibility Layer
 * 
 * @deprecated This is a compatibility wrapper. New code should use waiComprehensiveOrchestrationBackbone directly.
 * This wrapper provides a simplified interface for existing services while delegating to the comprehensive system.
 * 
 * @version 2.0.0 (Compatibility Layer)
 */

import { EventEmitter } from 'events';
import { waiComprehensiveOrchestrationBackbone } from './wai-comprehensive-orchestration-backbone-v7';

export interface PlatformRequest {
  platform: 'code-studio' | 'ai-assistant-builder' | 'content-studio' | 'game-builder' | 'business-studio';
  operation: string;
  task: string;
  context?: Record<string, any>;
  userId?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  requiredCapabilities?: string[];
  budget?: 'cost-effective' | 'balanced' | 'quality' | 'premium';
}

export interface PlatformResponse {
  success: boolean;
  result: any;
  metadata: {
    platform: string;
    operation: string;
    executionTime: number;
    tokensUsed: number;
    cost: number;
    qualityScore: number;
    componentsUsed: string[];
  };
  error?: string;
}

class WAIPlatformOrchestrator extends EventEmitter {
  private static instance: WAIPlatformOrchestrator;

  static getInstance(): WAIPlatformOrchestrator {
    if (!WAIPlatformOrchestrator.instance) {
      WAIPlatformOrchestrator.instance = new WAIPlatformOrchestrator();
    }
    return WAIPlatformOrchestrator.instance;
  }

  /**
   * Primary method for all platform operations
   * ALL platforms must use this method - no direct LLM calls
   */
  async executePlatformOperation(request: PlatformRequest): Promise<PlatformResponse> {
    const startTime = Date.now();

    try {
      // Log platform operation
      console.log(`🎯 WAI Platform Orchestrator: ${request.platform} -> ${request.operation}`);

      // Route to WAI SDK with platform-specific optimization
      const waiRequest = {
        type: this.mapPlatformToType(request.platform),
        task: `[${request.platform.toUpperCase()}] ${request.operation}: ${request.task}`,
        context: {
          ...request.context,
          platform: request.platform,
          operation: request.operation
        },
        priority: request.priority || 'medium',
        userPlan: 'pro' as 'pro',
        budget: request.budget || 'balanced',
        requiredComponents: this.getPlatformRequiredComponents(request.platform),
        userId: request.userId
      };

      const result = await waiComprehensiveOrchestrationBackbone.processRequest(waiRequest);

      const response: PlatformResponse = {
        success: result.success,
        result: result.result,
        metadata: {
          platform: request.platform,
          operation: request.operation,
          executionTime: Date.now() - startTime,
          tokensUsed: result.performanceMetrics?.tokensUsed || 0,
          cost: result.performanceMetrics?.cost || 0,
          qualityScore: result.performanceMetrics?.qualityScore || 0,
          componentsUsed: result.componentsUsed || []
        },
        error: result.error
      };

      // Emit platform-specific events
      this.emit(`${request.platform}:${request.operation}`, response);
      this.emit('platform:operation', response);

      return response;

    } catch (error) {
      const errorResponse: PlatformResponse = {
        success: false,
        result: null,
        metadata: {
          platform: request.platform,
          operation: request.operation,
          executionTime: Date.now() - startTime,
          tokensUsed: 0,
          cost: 0,
          qualityScore: 0,
          componentsUsed: []
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      console.error(`❌ Platform operation failed:`, errorResponse);
      return errorResponse;
    }
  }

  private mapPlatformToType(platform: string): 'development' | 'creative' | 'analysis' | 'enterprise' | 'research' {
    switch (platform) {
      case 'code-studio':
        return 'development';
      case 'ai-assistant-builder':
        return 'enterprise';
      case 'content-studio':
        return 'creative';
      case 'game-builder':
        return 'creative';
      case 'business-studio':
        return 'enterprise';
      default:
        return 'analysis';
    }
  }

  private getPlatformRequiredComponents(platform: string): string[] {
    switch (platform) {
      case 'code-studio':
        return ['code-generation', 'project-planning', 'testing', 'deployment'];
      case 'ai-assistant-builder':
        return ['conversation', 'rag', 'voice', '3d-avatar', 'multimodal'];
      case 'content-studio':
        return ['content-generation', 'seo', 'brand-voice', 'multimedia'];
      case 'game-builder':
        return ['game-mechanics', 'asset-generation', 'physics', 'monetization'];
      case 'business-studio':
        return ['process-automation', 'analytics', 'compliance', 'integration'];
      default:
        return [];
    }
  }

  // Platform-specific convenience methods

  async codeStudio(operation: string, task: string, context?: any): Promise<PlatformResponse> {
    return this.executePlatformOperation({
      platform: 'code-studio',
      operation,
      task,
      context,
      budget: 'balanced'
    });
  }

  async aiAssistantBuilder(operation: string, task: string, context?: any): Promise<PlatformResponse> {
    return this.executePlatformOperation({
      platform: 'ai-assistant-builder',
      operation,
      task,
      context,
      budget: 'quality'
    });
  }

  async contentStudio(operation: string, task: string, context?: any): Promise<PlatformResponse> {
    return this.executePlatformOperation({
      platform: 'content-studio',
      operation,
      task,
      context,
      budget: 'balanced'
    });
  }

  async gameBuilder(operation: string, task: string, context?: any): Promise<PlatformResponse> {
    return this.executePlatformOperation({
      platform: 'game-builder',
      operation,
      task,
      context,
      budget: 'quality'
    });
  }

  async businessStudio(operation: string, task: string, context?: any): Promise<PlatformResponse> {
    return this.executePlatformOperation({
      platform: 'business-studio',
      operation,
      task,
      context,
      budget: 'premium'
    });
  }

  // Analytics and monitoring
  async getPlatformMetrics(platform?: string, timeRange: 'hour' | 'day' | 'week' = 'hour') {
    try {
      const metrics = await waiComprehensiveOrchestrationBackbone.getMetrics(timeRange);
      
      if (platform) {
        // Filter metrics for specific platform
        return {
          ...metrics,
          platformSpecific: platform,
          filtered: true
        };
      }
      
      return metrics;
    } catch (error) {
      console.error('Failed to get platform metrics:', error);
      return { error: 'Metrics unavailable' };
    }
  }

  async getSystemHealth() {
    try {
      return await waiComprehensiveOrchestrationBackbone.getSystemHealth();
    } catch (error) {
      console.error('Failed to get system health:', error);
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const waiPlatformOrchestrator = WAIPlatformOrchestrator.getInstance();
export default waiPlatformOrchestrator;