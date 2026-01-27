
/**
 * WAI Orchestration Middleware
 * Ensures all API calls utilize the enhanced WAI orchestration with intelligent LLM selection
 */

import { Request, Response, NextFunction } from 'express';
import { enhancedWAIOrchestration } from '../services/enhanced-wai-orchestration-v4';

interface WAIMiddlewareConfig {
  enableAutoRouting: boolean;
  componentMapping: Record<string, string>;
  defaultUserPreferences: any;
}

export class WAIOrchestrationMiddleware {
  private config: WAIMiddlewareConfig;

  constructor(config: Partial<WAIMiddlewareConfig> = {}) {
    this.config = {
      enableAutoRouting: true,
      componentMapping: {
        '/api/software-development': 'software-dev',
        '/api/ai-assistant': 'ai-assistant',
        '/api/content-creation': 'content-creation',
        '/api/game-builder': 'game-builder',
        '/api/enterprise': 'enterprise',
        '/api/analytics': 'analytics',
        '/api/deployment': 'deployment'
      },
      defaultUserPreferences: {
        qualityPriority: 'high',
        costPriority: 'medium',
        speedPriority: 'medium'
      },
      ...config
    };
  }

  // Middleware function to intercept and enhance API calls
  enhanceWithWAI = async (req: Request, res: Response, next: NextFunction) => {
    // Skip if not enabled or if it's already a WAI endpoint
    if (!this.config.enableAutoRouting || req.path.includes('/enhanced-wai/') || req.path.includes('/wai/')) {
      return next();
    }

    // Check if this endpoint should be routed through WAI
    const component = this.getComponentFromPath(req.path);
    if (!component) {
      return next();
    }

    try {
      // Extract action from the request
      const action = this.extractActionFromRequest(req);
      
      // Only intercept POST requests with meaningful payloads
      if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
        console.log(`🎯 WAI Middleware: Routing ${req.path} through enhanced orchestration`);
        
        // Create WAI request
        const waiRequest = {
          type: this.mapComponentToWAIType(component),
          task: `${component}: ${action}`,
          prompt: this.extractPromptFromBody(req.body),
          context: {
            originalPath: req.path,
            method: req.method,
            component,
            action,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          },
          userPreferences: req.body.userPreferences || this.config.defaultUserPreferences,
          metadata: {
            interceptedBy: 'WAI-Middleware',
            originalEndpoint: req.path,
            timestamp: new Date().toISOString()
          }
        };

        // Process through WAI orchestration
        const waiResponse = await enhancedWAIOrchestration.processRequest(waiRequest);

        // Enhance the response with WAI metadata
        const enhancedResponse = {
          success: waiResponse.success,
          data: waiResponse.data,
          wai: {
            orchestrated: true,
            primaryLLM: waiResponse.metadata.primaryLLM,
            agentsUsed: waiResponse.metadata.agentsInvolved,
            redundancyLevel: waiResponse.metadata.redundancyLevel,
            confidence: waiResponse.metadata.confidence,
            processingTime: waiResponse.metadata.processingTime,
            reasoning: waiResponse.reasoning
          },
          metadata: waiResponse.metadata
        };

        // Use standard response (envelope handled by prototype patch)
        return res.status(200).json(enhancedResponse);
      }

      // For GET requests or requests without body, just add WAI context
      req.waiContext = {
        component,
        enhanced: true,
        timestamp: new Date().toISOString()
      };

      next();

    } catch (error) {
      console.error('WAI Middleware error:', error);
      // Fall back to original endpoint on error
      next();
    }
  };

  private getComponentFromPath(path: string): string | null {
    for (const [pathPattern, component] of Object.entries(this.config.componentMapping)) {
      if (path.startsWith(pathPattern)) {
        return component;
      }
    }
    return null;
  }

  private extractActionFromRequest(req: Request): string {
    const pathSegments = req.path.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Common action patterns
    if (req.method === 'POST') {
      if (lastSegment === 'create') return 'create';
      if (lastSegment === 'generate') return 'generate';
      if (lastSegment === 'analyze') return 'analyze';
      if (lastSegment === 'optimize') return 'optimize';
      if (lastSegment === 'deploy') return 'deploy';
      if (lastSegment === 'enhance') return 'enhance';
    }
    
    return req.body?.action || lastSegment || 'process';
  }

  private extractPromptFromBody(body: any): string {
    // Try common prompt field names
    if (body.prompt) return body.prompt;
    if (body.description) return body.description;
    if (body.content) return body.content;
    if (body.message) return body.message;
    if (body.text) return body.text;
    if (body.query) return body.query;
    
    // If no obvious prompt, stringify relevant parts
    const relevantKeys = ['name', 'title', 'requirements', 'specs', 'config'];
    const relevantData = relevantKeys
      .filter(key => body[key])
      .map(key => `${key}: ${body[key]}`)
      .join(', ');
    
    return relevantData || JSON.stringify(body).substring(0, 500);
  }

  private mapComponentToWAIType(component: string): any {
    const mapping = {
      'software-dev': 'development',
      'ai-assistant': 'enterprise',
      'content-creation': 'creative',
      'game-builder': 'creative',
      'enterprise': 'enterprise',
      'analytics': 'analysis',
      'deployment': 'development'
    };
    
    return mapping[component] || 'development';
  }
}

// Export configured middleware instance
export const waiOrchestrationMiddleware = new WAIOrchestrationMiddleware({
  enableAutoRouting: true,
  defaultUserPreferences: {
    qualityPriority: 'high',
    costPriority: 'medium',
    speedPriority: 'medium'
  }
});

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      waiContext?: {
        component: string;
        enhanced: boolean;
        timestamp: string;
      };
    }
  }
}
