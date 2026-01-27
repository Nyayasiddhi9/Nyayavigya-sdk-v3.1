/**
 * System Types - Mapped from WAI-SDK-v9-Complete
 */

import { z } from 'zod';

export type SystemStatus = 'healthy' | 'degraded' | 'unhealthy' | 'initializing' | 'error' | 'stopped';

export interface SystemHealth {
  status: SystemStatus;
  uptime: number;
  requestCount: number;
  errorCount: number;
  lastError: Error | null;
  components: Record<string, ComponentHealth>;
  timestamp: Date;
}

export interface ComponentHealth {
  healthy: boolean;
  status: string;
  lastCheck: number;
  errorCount?: number;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  performance: {
    uptime: number;
    averageResponseTime: number;
    networkLatency: number;
    totalRequests: number;
    successRate: number;
    errorRate: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkUsage: number;
  };
  agents: {
    total: number;
    active: number;
    byTier: Record<string, number>;
    averageResponseTime: number;
  };
  llm: {
    providers: number;
    models: number;
    totalRequests: number;
    totalCost: number;
    averageLatency: number;
  };
  orchestration: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  };
  timestamp: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    department?: string;
    team?: string;
    preferences: UserPreferences;
  };
}

export type UserRole = 'admin' | 'manager' | 'developer' | 'viewer';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    inApp: boolean;
    webhook: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
}

export interface PolicyConfig {
  id: string;
  name: string;
  description: string;
  type: 'cost' | 'latency' | 'quality' | 'security' | 'compliance';
  rules: PolicyRule[];
  scope: 'global' | 'agent' | 'llm' | 'pipeline';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: string;
  parameters: Record<string, any>;
  priority: number;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  configuration: Record<string, any>;
  lastSync: Date;
  metrics: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageLatency: number;
  };
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId: string;
  metadata?: Record<string, any>;
}

// Zod schemas for validation
export const SystemHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy', 'initializing', 'error', 'stopped']),
  uptime: z.number(),
  requestCount: z.number(),
  errorCount: z.number(),
  lastError: z.any().nullable(),
  components: z.record(z.object({
    healthy: z.boolean(),
    status: z.string(),
    lastCheck: z.number(),
    errorCount: z.number().optional(),
    metadata: z.record(z.any()).optional(),
  })),
  timestamp: z.date(),
});

export type SystemHealthInput = z.infer<typeof SystemHealthSchema>;