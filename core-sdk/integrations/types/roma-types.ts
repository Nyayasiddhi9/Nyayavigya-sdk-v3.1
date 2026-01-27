/**
 * Type definitions for ROMA Meta-Agent Framework integration
 */

export interface RomaConfiguration {
  maxDepth: number;
  maxParallel: number;
  timeoutMs: number;
  retryAttempts: number;
  enableParallelization: boolean;
  costOptimization: boolean;
  qualityThreshold: number;
}

export interface RomaAgent {
  id: string;
  type: string;
  capabilities: string[];
  availability: boolean;
  performance: {
    successRate: number;
    averageQuality: number;
    averageSpeed: number;
  };
}

export interface RomaContext {
  projectId?: string;
  userId?: string;
  sessionId?: string;
  preferences?: Record<string, any>;
  constraints?: {
    timeLimit?: number;
    budgetLimit?: number;
    qualityMinimum?: number;
  };
  resources?: {
    agents: RomaAgent[];
    tools: string[];
    data: Record<string, any>;
  };
}

export interface RomaTaskMetrics {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  cost?: number;
  quality?: number;
  agentsUsed?: string[];
  resourcesConsumed?: Record<string, number>;
}

export interface RomaDecompositionStrategy {
  type: 'parallel' | 'sequential' | 'hybrid';
  maxSubtasks: number;
  dependencyAnalysis: boolean;
  resourceOptimization: boolean;
}

export interface RomaExecutionPlan {
  tasks: Array<{
    id: string;
    task: string;
    dependencies: string[];
    estimatedDuration: number;
    requiredResources: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  executionOrder: string[][];
  criticalPath: string[];
  estimatedTotalDuration: number;
  resourceAllocation: Record<string, string[]>;
}

export interface RomaQualityMetrics {
  accuracy: number;
  completeness: number;
  consistency: number;
  usability: number;
  performance: number;
  overall: number;
}