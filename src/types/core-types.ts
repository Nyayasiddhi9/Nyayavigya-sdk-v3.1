/**
 * WAI SDK v9.0 - Core Type Definitions
 */

export interface WAIConfig {
  version: string;
  agents: AgentConfig;
  integrations: IntegrationConfig;
  quantum: QuantumConfig;
  llm: LLMConfig;
  security?: SecurityConfig;
  tasks?: TaskConfig;
  selfHealing?: SelfHealingConfig;
  features: string[];
}

export interface AgentConfig {
  total: number;
  tiers: {
    executive: number;
    development: number;
    creative: number;
    qa: number;
    devops: number;
    domainSpecialist: number;
  };
}

export interface IntegrationConfig {
  direct: number;
  mcp: number;
  total: number;
}

export interface QuantumConfig {
  enabled: boolean;
  providers: number;
  algorithms: string[];
}

export interface LLMConfig {
  providers: number;
  models: number;
  costOptimization: boolean;
}

export interface SecurityConfig {
  encryption?: boolean;
  audit?: boolean;
  compliance?: string[];
}

export interface TaskConfig {
  maxConcurrent?: number;
  timeoutMs?: number;
  retries?: number;
}

export interface SelfHealingConfig {
  enabled?: boolean;
  checkInterval?: number;
  maxAttempts?: number;
}

export interface WAIRequest {
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

export interface WAIResponse {
  success: boolean;
  data?: any;
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

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'initializing' | 'error' | 'stopped';
  uptime: number;
  requestCount: number;
  errorCount: number;
  lastError: Error | null;
  components?: Record<string, ComponentHealth>;
}

export interface ComponentHealth {
  healthy: boolean;
  status: string;
  lastCheck: number;
  errorCount?: number;
  metadata?: Record<string, any>;
}

export interface Capabilities {
  version: string;
  agents: AgentCapabilities;
  quantum: QuantumCapabilities;
  llm: LLMCapabilities;
  integrations: IntegrationCapabilities;
  security: SecurityCapabilities;
  features: string[];
}

export interface AgentCapabilities {
  total: number;
  tiers: Record<string, number>;
  specializations: string[];
}

export interface QuantumCapabilities {
  enabled: boolean;
  providers: string[];
  algorithms: string[];
  advantage: string;
}

export interface LLMCapabilities {
  providers: string[];
  models: number;
  features: string[];
}

export interface IntegrationCapabilities {
  direct: string[];
  mcp: number;
  categories: string[];
}

export interface SecurityCapabilities {
  features: string[];
  compliance: string[];
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  component: string;
  metadata?: Record<string, any>;
}