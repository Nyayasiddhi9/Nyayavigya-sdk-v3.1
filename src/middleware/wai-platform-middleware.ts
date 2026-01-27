/**
 * WAI Platform Middleware
 * Automatic request routing and orchestration for all platforms
 * Provides unified AI intelligence across the entire application
 */

import { Request, Response, NextFunction } from 'express';
import { unifiedWAIOrchestration } from '../services/unified-wai-orchestration';

export interface WAIMiddlewareConfig {
  enableAutoRouting: boolean;
  enableCostTracking: boolean;
  enableQualityMonitoring: boolean;
  enableAnalytics: boolean;
  defaultPlatform?: string;
  bypassRoutes?: string[];
}

export interface WAIRequest extends Request {
  wai?: {
    platformId: string;
    taskType: 'development' | 'creative' | 'business' | 'research' | 'support' | 'specialized';
    priority: 'low' | 'medium' | 'high' | 'critical';
    enhancedMode: boolean;
    budget: 'cost-effective' | 'balanced' | 'quality' | 'premium';
    userContext: Record<string, any>;
  };
}

/**
 * WAI Platform Middleware Class
 * Handles automatic orchestration routing for all platforms
 */
export class WAIPlatformMiddleware {
  private config: WAIMiddlewareConfig;

  constructor(config: Partial<WAIMiddlewareConfig> = {}) {
    this.config = {
      enableAutoRouting: true,
      enableCostTracking: true,
      enableQualityMonitoring: true,
      enableAnalytics: true,
      defaultPlatform: 'software-development',
      bypassRoutes: ['/api/health', '/api/auth', '/api/static', '/api/industry-templates', '/models', '/images', '/fonts', '/assets', '/public', '/favicon.ico', '/vite.svg'],
      ...config
    };
  }

  /**
   * Main middleware function for WAI orchestration
   */
  orchestrationMiddleware() {
    return async (req: WAIRequest, res: Response, next: NextFunction) => {
      try {
        // Skip bypass routes
        if (this.shouldBypass(req.path)) {
          return next();
        }

        // Detect platform and task type from request
        const platformInfo = this.detectPlatformFromRequest(req);
        
        // Add WAI context to request
        req.wai = {
          platformId: platformInfo.platformId,
          taskType: platformInfo.taskType,
          priority: this.detectPriority(req),
          enhancedMode: this.shouldUseEnhancedMode(req),
          budget: this.detectBudget(req),
          userContext: this.extractUserContext(req)
        };

        // Add WAI helpers to response
        // Temporarily disabled WAI helpers to prevent res.json conflicts
        // this.addWAIHelpers(req, res);

        console.log(`🧠 WAI Middleware: ${req.method} ${req.path} → Platform: ${req.wai.platformId}, Type: ${req.wai.taskType}`);

        next();

      } catch (error) {
        console.error('WAI Middleware Error:', error);
        next(); // Continue without WAI enhancement on error
      }
    };
  }

  /**
   * Analytics middleware for tracking WAI usage
   */
  analyticsMiddleware() {
    return (req: WAIRequest, res: Response, next: NextFunction) => {
      if (!this.config.enableAnalytics || this.shouldBypass(req.path)) {
        return next();
      }

      const startTime = Date.now();

      // Track analytics without overriding res.json (envelope handled at prototype level)
      const originalEnd = res.end.bind(res);
      res.end = function(...args: any[]) {
        const executionTime = Date.now() - startTime;
        
        // Log analytics data
        if (req.wai) {
          console.log(`📊 WAI Analytics: ${req.wai.platformId} - ${executionTime}ms, Status: ${res.statusCode}`);
        }

        return originalEnd(...args);
      };

      next();
    };
  }

  /**
   * Central JSON envelope helper - adds success/version fields while preserving existing data
   */
  private addWAIEnvelope(req: WAIRequest, body: any): any {
    // Skip envelope for bypass routes and non-API paths
    if (!req.path.startsWith('/api/') || this.shouldBypass(req.path)) {
      return body;
    }

    // Skip if body already has WAI envelope structure
    if (body && typeof body === 'object' && body.success !== undefined && body.version !== undefined) {
      return body;
    }

    // Add WAI envelope while preserving original data
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return {
        success: true,
        version: '1.0.0',
        ...body
      };
    }

    // For non-object responses (strings, arrays, etc.), wrap them
    return {
      success: true,
      version: '1.0.0',
      data: body
    };
  }

  /**
   * Error handling middleware for WAI-related errors
   */
  errorMiddleware() {
    return (error: any, req: WAIRequest, res: Response, next: NextFunction) => {
      if (error.message?.includes('WAI') || error.message?.includes('orchestration')) {
        console.error('🚨 WAI Orchestration Error:', {
          platform: req.wai?.platformId,
          taskType: req.wai?.taskType,
          error: error.message,
          path: req.path
        });

        return res.status(500).json({
          error: 'AI Orchestration Error',
          message: 'The AI system encountered an issue. Please try again.',
          platform: req.wai?.platformId,
          fallback: 'Basic functionality available'
        });
      }

      next(error);
    };
  }

  // Helper methods

  private shouldBypass(path: string): boolean {
    return this.config.bypassRoutes?.some(route => path.startsWith(route)) || false;
  }

  private detectPlatformFromRequest(req: Request): { platformId: string; taskType: any } {
    const path = req.path.toLowerCase();
    
    // Platform detection based on route patterns
    if (path.includes('/software-development') || path.includes('/code') || path.includes('/development')) {
      return { platformId: 'software-development', taskType: 'development' };
    }
    
    if (path.includes('/ai-assistant') || path.includes('/assistant') || path.includes('/chat')) {
      return { platformId: 'ai-assistant-builder', taskType: 'specialized' };
    }
    
    if (path.includes('/content') || path.includes('/aura') || path.includes('/studio')) {
      return { platformId: 'content-studio', taskType: 'creative' };
    }
    
    if (path.includes('/game') || path.includes('/gaming')) {
      return { platformId: 'game-builder', taskType: 'creative' };
    }
    
    if (path.includes('/enterprise') || path.includes('/business') || path.includes('/design')) {
      return { platformId: 'enterprise-solutions', taskType: 'business' };
    }

    // Default platform
    return { 
      platformId: this.config.defaultPlatform || 'software-development', 
      taskType: 'development' 
    };
  }

  private detectPriority(req: Request): 'low' | 'medium' | 'high' | 'critical' {
    const headers = req.headers;
    const body = req.body;

    // Check for explicit priority
    if (headers['x-priority']) {
      return headers['x-priority'] as any;
    }

    if (body?.priority) {
      return body.priority;
    }

    // Infer priority from request characteristics
    if (req.method === 'POST' && req.path.includes('/generate')) {
      return 'high'; // Generation tasks are high priority
    }

    if (req.path.includes('/urgent') || req.path.includes('/critical')) {
      return 'critical';
    }

    return 'medium'; // Default priority
  }

  private shouldUseEnhancedMode(req: Request): boolean {
    const headers = req.headers;
    const body = req.body;

    // Check for explicit enhanced mode
    if (headers['x-enhanced-mode'] === 'true') return true;
    if (body?.enhancedMode === true) return true;

    // Auto-enable enhanced mode for complex tasks
    if (req.path.includes('/advanced') || req.path.includes('/professional')) {
      return true;
    }

    // Enable for POST requests with large payloads
    if (req.method === 'POST' && JSON.stringify(body).length > 1000) {
      return true;
    }

    return false; // Default to standard mode
  }

  private detectBudget(req: Request): 'cost-effective' | 'balanced' | 'quality' | 'premium' {
    const headers = req.headers;
    const body = req.body;

    // Check for explicit budget
    if (headers['x-budget']) {
      return headers['x-budget'] as any;
    }

    if (body?.budget) {
      return body.budget;
    }

    // Infer budget from user plan or request type
    if (headers['x-user-plan'] === 'enterprise') return 'premium';
    if (headers['x-user-plan'] === 'pro') return 'quality';
    if (headers['x-user-plan'] === 'free') return 'cost-effective';

    return 'balanced'; // Default budget
  }

  private extractUserContext(req: Request): Record<string, any> {
    const context: Record<string, any> = {
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };

    // Add user information if available
    if ((req as any).user) {
      context.user = (req as any).user;
    }

    // Add session information
    if ((req as any).session) {
      context.sessionId = (req as any).session.id;
    }

    // Add relevant headers
    if (req.headers['x-project-id']) {
      context.projectId = req.headers['x-project-id'];
    }

    return context;
  }

  private addWAIHelpers(req: WAIRequest, res: Response): void {
    // Add helper methods to response object
    (res as any).processWithWAI = async (task: string, options: any = {}) => {
      if (!req.wai) {
        throw new Error('WAI context not available');
      }

      try {
        const result = await unifiedWAIOrchestrationService.processTask(
          req.wai.platformId,
          task,
          {
            taskType: req.wai.taskType,
            priority: req.wai.priority,
            enhancedMode: req.wai.enhancedMode,
            budgetOverride: options.budget || req.wai.budget,
            userContext: { ...req.wai.userContext, ...options.context },
            domainKnowledge: options.domainKnowledge,
            ...options
          }
        );

        return result;
      } catch (error) {
        console.error('WAI Processing Error:', error);
        throw error;
      }
    };

    // Add platform-specific helpers
    (res as any).processCodeTask = async (task: string, options: any = {}) => {
      return unifiedWAIOrchestrationService.processCodeTask(task, {
        ...options,
        userContext: req.wai?.userContext
      });
    };

    (res as any).processContentTask = async (task: string, options: any = {}) => {
      return unifiedWAIOrchestrationService.processContentTask(task, {
        ...options,
        userContext: req.wai?.userContext
      });
    };

    (res as any).processAssistantTask = async (task: string, options: any = {}) => {
      return unifiedWAIOrchestrationService.processAssistantTask(task, {
        ...options,
        userContext: req.wai?.userContext
      });
    };

    // Add analytics helper
    (res as any).getWAIAnalytics = async () => {
      if (!req.wai) return null;
      return unifiedWAIOrchestrationService.getPlatformAnalytics(req.wai.platformId);
    };
  }
}

// Export middleware instances
export const waiPlatformMiddleware = new WAIPlatformMiddleware();

// Export individual middleware functions
export const waiOrchestrationMiddleware = waiPlatformMiddleware.orchestrationMiddleware();
export const waiAnalyticsMiddleware = waiPlatformMiddleware.analyticsMiddleware();
export const waiErrorMiddleware = waiPlatformMiddleware.errorMiddleware();

// Export combined middleware stack
export const waiMiddlewareStack = [
  waiOrchestrationMiddleware,
  waiAnalyticsMiddleware
];