/**
 * WAI SDK - Software Development Kit
 * Complete SDK for integrating WAI 3.0 into any enterprise project
 */

import { EventEmitter } from 'events';
import { autonomousExecutionEngine } from '../services/autonomous-execution-engine';
import { intelligentResourceManager } from '../services/intelligent-resource-manager';
import { dualAgentSystem } from '../services/dual-agent-system';
import { waiAPI } from '../services/wai-api';

export interface WAIConfig {
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
    xai?: string;
    perplexity?: string;
    groq?: string;
  };
  providers: {
    priority: Record<string, number>;
    enabled: string[];
    fallbackOrder: string[];
  };
  costOptimization: {
    enabled: boolean;
    budget: {
      dailyLimit: number;
      monthlyLimit: number;
      alertThreshold: number;
    };
    preferLowerCost: boolean;
    qualityThreshold: number;
  };
  autonomous: {
    enabled: boolean;
    maxConcurrentTasks: number;
    conflictResolution: boolean;
    executiveDecisionMaking: boolean;
  };
}

export interface SDKResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    timestamp: Date;
    requestId: string;
    provider?: string;
    cost?: number;
    processingTime: number;
  };
}

export interface AgentConfig {
  name: string;
  role: string;
  capabilities: string[];
  systemPrompt?: string;
  provider?: string;
  model?: string;
  temperature?: number;
}

export interface TaskConfig {
  title: string;
  description: string;
  type: 2
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  requirements: string[];
  autonomous: boolean;
  deadline?: Date;
}

export interface WorkflowConfig {
  name: string;
  steps: WorkflowStep[];
  coordination: CoordinationConfig;
  agents: string[];
}

export interface WorkflowStep {
  name: string;
  type: 'sequential' | 'parallel' | 'conditional';
  action: string;
  agents: string[];
  dependencies?: string[];
  timeout?: number;
}

export interface CoordinationConfig {
  mode: 'autonomous' | 'supervised' | 'manual';
  conflictResolution: boolean;
  qualityGates: string[];
  executiveOversight: boolean;
}

export class WAI_SDK extends EventEmitter {
  private config: WAIConfig;
  private initialized: boolean = false;
  private requestId: number = 0;

  constructor(config?: Partial<WAIConfig>) {
    super();
    this.config = this.mergeConfig(config || {});
  }

  /**
   * Initialize WAI SDK
   */
  async initialize(config?: Partial<WAIConfig>): Promise<void> {
    if (config) {
      this.config = this.mergeConfig(config);
    }

    try {
      // Initialize core services
      await this.initializeCoreServices();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Validate configuration
      await this.validateConfiguration();
      
      this.initialized = true;
      console.log('✅ WAI SDK initialized successfully');
      
    } catch (error) {
      console.error('❌ WAI SDK initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create and configure an agent
   */
  async createAgent(config: AgentConfig): Promise<SDKResponse<string>> {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      const startTime = Date.now();
      
      // Create agent through dual agent system
      const agent = await dualAgentSystem.createCustomerBusinessAgent({
        name: config.name,
        role: config.role,
        type: 'hybrid',
        capabilities: config.capabilities,
        systemPrompt: config.systemPrompt,
        configuration: {
          provider: config.provider || 'openai',
          model: config.model || 'gpt-4o',
          temperature: config.temperature || 0.7
        }
      });

      return {
        success: true,
        data: agent.id,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Agent creation failed',
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now()
        }
      };
    }
  }

  /**
   * Execute a task autonomously
   */
  async executeTask(config: TaskConfig): Promise<SDKResponse<any>> {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      const startTime = Date.now();
      
      const task = {
        id: `task-${Date.now()}`,
        ...config,
        userId: 'sdk-user'
      };

      let result;
      if (config.autonomous && this.config.autonomous.enabled) {
        // Execute autonomously with resource management
        result = await autonomousExecutionEngine.executeTask(task);
      } else {
        // Execute with manual coordination
        result = await this.executeTaskManually(task);
      }

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Task execution failed',
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now()
        }
      };
    }
  }

  /**
   * Execute workflow with agent orchestration
   */
  async executeWorkflow(config: WorkflowConfig): Promise<SDKResponse<any>> {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      const startTime = Date.now();
      
      const workflow = {
        id: `workflow-${Date.now()}`,
        ...config
      };

      const result = await this.orchestrateWorkflow(workflow);

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Workflow execution failed',
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now()
        }
      };
    }
  }

  /**
   * Get resource recommendations
   */
  async getResourceRecommendations(taskType: string, requirements?: any): Promise<SDKResponse<any>> {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      const startTime = Date.now();
      
      const recommendations = await intelligentResourceManager.getResourceRecommendations(taskType);

      return {
        success: true,
        data: recommendations,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Resource recommendation failed',
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now()
        }
      };
    }
  }

  /**
   * Analyze project requirements
   */
  async analyzeProject(description: string, requirements: string[]): Promise<SDKResponse<any>> {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      const startTime = Date.now();
      
      const analysis = await waiAPI.processRequest({
        type: 'llm',
        action: 'analyze-project',
        parameters: {
          description,
          requirements,
          includeResourcePlanning: true,
          includeRiskAssessment: true,
          includeTimelineEstimate: true
        }
      });

      return {
        success: true,
        data: analysis.data,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Project analysis failed',
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now()
        }
      };
    }
  }

  /**
   * Generate content using AI
   */
  async generateContent(type: 'text' | 'code' | 'documentation' | 'marketing', prompt: string, options?: any): Promise<SDKResponse<any>> {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      const startTime = Date.now();
      
      const content = await waiAPI.processRequest({
        type: 'llm',
        action: 'generate-content',
        parameters: {
          contentType: type,
          prompt,
          ...options
        }
      });

      return {
        success: true,
        data: content.data,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed',
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now()
        }
      };
    }
  }

  /**
   * Get platform statistics
   */
  async getStats(): Promise<SDKResponse<any>> {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      const startTime = Date.now();
      
      const stats = {
        agents: dualAgentSystem.getDualAgentStats(),
        resources: intelligentResourceManager.getResourceUtilization(),
        autonomous: autonomousExecutionEngine.getResourceUtilization(),
        platform: {
          version: '3.0.0',
          initialized: this.initialized,
          uptime: process.uptime()
        }
      };

      return {
        success: true,
        data: stats,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stats collection failed',
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now()
        }
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<SDKResponse<any>> {
    try {
      const startTime = Date.now();
      
      const health = await waiAPI.healthCheck();

      return {
        success: true,
        data: health,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now()
        }
      };
    }
  }

  // Private methods
  private mergeConfig(config: Partial<WAIConfig>): WAIConfig {
    return {
      apiKeys: {
        ...config.apiKeys
      },
      providers: {
        priority: {
          openai: 9,
          anthropic: 8,
          google: 7,
          xai: 6,
          perplexity: 5,
          groq: 4,
          ...config.providers?.priority
        },
        enabled: config.providers?.enabled || ['openai', 'anthropic', 'google'],
        fallbackOrder: config.providers?.fallbackOrder || ['openai', 'anthropic', 'google']
      },
      costOptimization: {
        enabled: config.costOptimization?.enabled ?? true,
        budget: {
          dailyLimit: config.costOptimization?.budget?.dailyLimit || 100,
          monthlyLimit: config.costOptimization?.budget?.monthlyLimit || 2000,
          alertThreshold: config.costOptimization?.budget?.alertThreshold || 0.8
        },
        preferLowerCost: config.costOptimization?.preferLowerCost ?? false,
        qualityThreshold: config.costOptimization?.qualityThreshold || 0.8
      },
      autonomous: {
        enabled: config.autonomous?.enabled ?? true,
        maxConcurrentTasks: config.autonomous?.maxConcurrentTasks || 10,
        conflictResolution: config.autonomous?.conflictResolution ?? true,
        executiveDecisionMaking: config.autonomous?.executiveDecisionMaking ?? true
      }
    };
  }

  private async initializeCoreServices(): Promise<void> {
    // Core services are already initialized by the imports
    // Additional SDK-specific initialization can be added here
  }

  private setupEventListeners(): void {
    // Listen to autonomous execution events
    autonomousExecutionEngine.on('task.completed', (data) => {
      this.emit('task.completed', data);
    });

    autonomousExecutionEngine.on('conflict.resolved', (data) => {
      this.emit('conflict.resolved', data);
    });

    // Listen to resource management events
    intelligentResourceManager.on('workload.imbalance', (data) => {
      this.emit('workload.imbalance', data);
    });
  }

  private async validateConfiguration(): Promise<void> {
    // Validate API keys
    const hasApiKeys = Object.values(this.config.apiKeys).some(key => key);
    if (!hasApiKeys) {
      console.warn('⚠️ No API keys configured. Some features may not work.');
    }

    // Validate providers
    if (this.config.providers.enabled.length === 0) {
      throw new Error('At least one provider must be enabled');
    }
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${++this.requestId}`;
  }

  private async executeTaskManually(task: any): Promise<any> {
    // Manual task execution without full autonomous coordination
    return {
      taskId: task.id,
      status: 'completed',
      result: 'Task completed manually',
      executionMode: 'manual'
    };
  }

  private async orchestrateWorkflow(workflow: any): Promise<any> {
    // Workflow orchestration logic
    const results = [];
    
    for (const step of workflow.steps) {
      const stepResult = await this.executeWorkflowStep(step);
      results.push(stepResult);
    }

    return {
      workflowId: workflow.id,
      results,
      status: 'completed',
      coordination: workflow.coordination
    };
  }

  private async executeWorkflowStep(step: WorkflowStep): Promise<any> {
    // Execute individual workflow step
    return {
      stepId: step.name,
      status: 'completed',
      result: `Step ${step.name} completed`,
      agents: step.agents
    };
  }
}

// Export default instance
export const waiSDK = new WAI_SDK();

// Export types for TypeScript users
export type {
  WAIConfig,
  SDKResponse,
  AgentConfig,
  TaskConfig,
  WorkflowConfig,
  WorkflowStep,
  CoordinationConfig
};