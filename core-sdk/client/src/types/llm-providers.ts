/**
 * LLM Provider Types - Mapped from WAI-SDK-v9-Complete
 */

import { z } from 'zod';

export type ProviderStatus = 'healthy' | 'degraded' | 'offline' | 'maintenance';

export interface LLMProvider {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  status: ProviderStatus;
  models: LLMModel[];
  capabilities: ProviderCapabilities;
  costTracking: CostTracking;
  usageStats: UsageStats;
  priority: number;
  lastHealthCheck: Date;
  configuration: ProviderConfiguration;
}

export interface LLMModel {
  id: string;
  name: string;
  providerId: string;
  displayName: string;
  description: string;
  capabilities: ModelCapabilities;
  pricing: ModelPricing;
  limits: ModelLimits;
  contextWindow: number;
  maxTokens: number;
  status: 'available' | 'unavailable' | 'deprecated';
  metadata: {
    version: string;
    category: string;
    tags: string[];
    regions: string[];
  };
}

export interface ProviderCapabilities {
  chat: boolean;
  completion: boolean;
  embedding: boolean;
  imageGeneration: boolean;
  audioGeneration: boolean;
  videoGeneration: boolean;
  codeGeneration: boolean;
  multimodal: boolean;
  streaming: boolean;
  functionCalling: boolean;
}

export interface ModelCapabilities {
  coding: number; // 0-100 score
  creative: number;
  analytical: number;
  multimodal: number;
  reasoning: number;
  languages: number;
  specialized: string[];
}

export interface ModelPricing {
  inputCostPer1K: number;
  outputCostPer1K: number;
  currency: string;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  billingModel: 'token' | 'request' | 'subscription';
}

export interface ModelLimits {
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay: number;
  tokensPerDay: number;
  concurrentRequests: number;
}

export interface CostTracking {
  totalSpent: number;
  dailySpent: number;
  monthlySpent: number;
  dailyLimit: number;
  monthlyLimit: number;
  currency: string;
  lastUpdated: Date;
}

export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  lastUsed: Date;
  peakUsageTime: Date;
}

export interface ProviderConfiguration {
  apiKey?: string;
  baseUrl?: string;
  region?: string;
  version?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  fallback?: {
    enabled: boolean;
    providers: string[];
  };
}

export interface LLMRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  functions?: any[];
  metadata?: Record<string, any>;
}

export interface LLMResponse {
  id: string;
  model: string;
  provider: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata: {
    latency: number;
    processingTime: number;
    timestamp: Date;
    requestId: string;
  };
}

export interface LLMAnalytics {
  totalProviders: number;
  activeProviders: number;
  totalModels: number;
  totalRequests: number;
  totalCost: number;
  averageLatency: number;
  successRate: number;
  topProvidersByUsage: LLMProvider[];
  topModelsByUsage: LLMModel[];
  costBreakdown: {
    byProvider: Record<string, number>;
    byModel: Record<string, number>;
    byTimeframe: Record<string, number>;
  };
  usageTrends: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
}

// Zod schemas for validation
export const LLMProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  enabled: z.boolean(),
  status: z.enum(['healthy', 'degraded', 'offline', 'maintenance']),
  models: z.array(z.any()),
  capabilities: z.record(z.boolean()),
  costTracking: z.object({
    totalSpent: z.number(),
    dailySpent: z.number(),
    monthlySpent: z.number(),
    dailyLimit: z.number(),
    monthlyLimit: z.number(),
    currency: z.string(),
    lastUpdated: z.date(),
  }),
  usageStats: z.object({
    totalRequests: z.number(),
    successfulRequests: z.number(),
    failedRequests: z.number(),
    totalTokens: z.number(),
    averageResponseTime: z.number(),
    lastUsed: z.date(),
    peakUsageTime: z.date(),
  }),
  priority: z.number(),
  lastHealthCheck: z.date(),
  configuration: z.record(z.any()),
});

export type LLMProviderInput = z.infer<typeof LLMProviderSchema>;