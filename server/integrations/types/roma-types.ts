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

/**
 * ROMA Autonomy Levels (Replit Orchestration Maturity Architecture)
 * 
 * L1: Guided Execution - Task-level assistance with explicit instructions
 * L2: Autonomous Execution - Feature-level autonomy with minimal guidance
 * L3: Strategic Self-Direction - Complex multi-step workflows with strategic planning
 * L4: Adaptive Innovation - Self-improving systems with continuous learning
 */
export type RomaAutonomyLevel = 'L1' | 'L2' | 'L3' | 'L4';

export interface RomaAutonomyCapabilities {
  level: RomaAutonomyLevel;
  canPlan: boolean;              // Can create multi-step execution plans
  canAdapt: boolean;             // Can adjust strategies based on outcomes
  canLearn: boolean;             // Can improve from experience
  canInnovate: boolean;          // Can discover new approaches
  requiresApproval: boolean;     // Needs human approval for decisions
  complexityLimit: number;       // Maximum task complexity (1-10 scale)
}

export interface RomaL3Strategy {
  goal: string;
  approach: string;
  contingencyPlans: string[];
  resourceRequirements: Record<string, any>;
  expectedOutcomes: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
  };
}

export interface RomaL4Innovation {
  problemAnalysis: string;
  novelApproaches: string[];
  experimentalStrategies: Array<{
    name: string;
    hypothesis: string;
    expectedBenefit: string;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  learningObjectives: string[];
  improvementMetrics: Record<string, number>;
}