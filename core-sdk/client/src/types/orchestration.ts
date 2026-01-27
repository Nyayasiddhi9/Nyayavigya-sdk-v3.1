/**
 * Orchestration Types - Mapped from WAI-SDK-v9-Complete
 */

import { z } from 'zod';

export type OrchestrationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface OrchestrationRequest {
  id?: string;
  type: string;
  payload: any;
  maxCost?: number;
  maxLatency?: number;
  minQuality?: number;
  complexity?: 'low' | 'medium' | 'high';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface OrchestrationResponse {
  id: string;
  status: OrchestrationStatus;
  result?: any;
  error?: string;
  executionTime: number;
  qualityScore?: number;
  actualCost?: number;
  feedbackScore?: number;
  usedAgents?: string[];
  usedLLM?: string;
  optimizationEffectiveness?: number;
  metadata?: Record<string, any>;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'active' | 'deprecated';
  stages: PipelineStage[];
  metadata: {
    category: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
  configuration: {
    timeout: number;
    retries: number;
    parallel: boolean;
    fallback: boolean;
  };
}

export interface PipelineStage {
  id: string;
  name: string;
  type: 'agent' | 'llm' | 'custom' | 'condition' | 'parallel' | 'sequential';
  configuration: Record<string, any>;
  dependencies: string[];
  outputs: string[];
  errorHandling: {
    retry: boolean;
    maxRetries: number;
    fallback?: string;
  };
}

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: OrchestrationStatus;
  startTime: Date;
  endTime?: Date;
  stages: PipelineStageExecution[];
  result?: any;
  error?: string;
  metadata: {
    triggeredBy: string;
    totalCost: number;
    totalTime: number;
    qualityScore: number;
  };
}

export interface PipelineStageExecution {
  stageId: string;
  status: OrchestrationStatus;
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  metrics: {
    cost: number;
    time: number;
    qualityScore: number;
    agentUsed?: string;
    llmUsed?: string;
  };
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  providers: string[];
  parameters: CapabilityParameter[];
  examples: CapabilityExample[];
  metrics: {
    usage: number;
    successRate: number;
    averageLatency: number;
    averageCost: number;
  };
}

export interface CapabilityParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: any;
  validation?: any;
}

export interface CapabilityExample {
  title: string;
  description: string;
  input: any;
  output: any;
  metadata: {
    cost: number;
    time: number;
    provider: string;
  };
}

export interface OrchestrationAnalytics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  totalCost: number;
  averageCost: number;
  topCapabilities: Capability[];
  recentExecutions: OrchestrationResponse[];
  performanceTrends: {
    executions: number[];
    costs: number[];
    latency: number[];
    successRate: number[];
  };
}

// Zod schemas for validation
export const OrchestrationRequestSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  payload: z.any(),
  maxCost: z.number().optional(),
  maxLatency: z.number().optional(),
  minQuality: z.number().optional(),
  complexity: z.enum(['low', 'medium', 'high']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  metadata: z.record(z.any()).optional(),
});

export type OrchestrationRequestInput = z.infer<typeof OrchestrationRequestSchema>;