/**
 * Agent Types - Mapped from WAI-SDK-v9-Complete
 */

import { z } from 'zod';

export type AgentTier = 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain';

export type AgentStatus = 'active' | 'inactive' | 'error' | 'maintenance';

export interface Agent {
  id: string;
  name: string;
  description: string;
  tier: AgentTier;
  status: AgentStatus;
  version: string;
  capabilities: string[];
  metadata: {
    tags: string[];
    category: string;
    romLevel: 'L1' | 'L2' | 'L3' | 'L4';
    lastUsed: Date;
    totalExecutions: number;
    successRate: number;
    avgResponseTime: number;
  };
  configuration: Record<string, any>;
  healthStatus: {
    healthy: boolean;
    lastCheck: Date;
    issues: string[];
  };
}

export interface AgentInstance {
  id: string;
  agentId: string;
  status: 'running' | 'stopped' | 'error';
  config: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  metrics: {
    executionTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface AgentExecution {
  id: string;
  agentId: string;
  instanceId: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  metadata: Record<string, any>;
}

export interface AgentAnalytics {
  totalAgents: number;
  activeAgents: number;
  agentsByTier: Record<AgentTier, number>;
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
  topPerformingAgents: Agent[];
  recentExecutions: AgentExecution[];
}

// Zod schemas for validation
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tier: z.enum(['executive', 'development', 'creative', 'qa', 'devops', 'domain']),
  status: z.enum(['active', 'inactive', 'error', 'maintenance']),
  version: z.string(),
  capabilities: z.array(z.string()),
  metadata: z.object({
    tags: z.array(z.string()),
    category: z.string(),
    romLevel: z.enum(['L1', 'L2', 'L3', 'L4']),
    lastUsed: z.date(),
    totalExecutions: z.number(),
    successRate: z.number(),
    avgResponseTime: z.number(),
  }),
  configuration: z.record(z.any()),
  healthStatus: z.object({
    healthy: z.boolean(),
    lastCheck: z.date(),
    issues: z.array(z.string()),
  }),
});

export type AgentInput = z.infer<typeof AgentSchema>;