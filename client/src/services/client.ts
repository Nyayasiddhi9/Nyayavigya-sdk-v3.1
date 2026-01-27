/**
 * tRPC Client for WAI-SDK-v9-Complete Integration
 */

import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './types';
import { getAPIConfig, validateAPIEndpoint } from './config';

// React Query integration for components
export const trpc = createTRPCReact<AppRouter>();

// Direct client for server-side operations
export const createTRPCClient = (customBaseUrl?: string) => {
  const config = getAPIConfig();
  const baseUrl = customBaseUrl || config.baseUrl;
  
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        headers() {
          return {
            'Content-Type': 'application/json',
          };
        },
      }),
    ],
  });
};

// WAI SDK API Client - Environment-aware REST integration
export class WAISDKClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private healthChecked: boolean = false;

  constructor(customBaseUrl?: string, apiKey?: string) {
    const config = getAPIConfig();
    this.baseUrl = customBaseUrl || config.baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
    };
  }

  async ensureHealthy(): Promise<void> {
    if (this.healthChecked) return;
    
    const isHealthy = await validateAPIEndpoint(this.baseUrl);
    if (!isHealthy) {
      throw new Error(`WAI-SDK backend not reachable at ${this.baseUrl}`);
    }
    
    this.healthChecked = true;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    await this.ensureHealthy();
    
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const response = await fetch(url, {
      headers: this.headers,
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json();
  }

  // Agent Management
  async getAgents() {
    return this.request('/v9/agents');
  }

  async getAgent(agentId: string) {
    return this.request(`/v9/agents/${agentId}`);
  }

  async searchAgents(query: Record<string, any>) {
    const params = new URLSearchParams(query).toString();
    return this.request(`/v9/agents/search?${params}`);
  }

  async executeAgent(agentId: string, task: any) {
    return this.request(`/v9/agents/${agentId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ task }),
    });
  }

  async toggleAgent(agentId: string, enabled: boolean) {
    return this.request(`/v9/agents/${agentId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  // LLM Provider Management
  async getLLMProviders() {
    return this.request('/v9/llm/providers');
  }

  async getLLMProvider(providerId: string) {
    return this.request(`/v9/llm/providers/${providerId}`);
  }

  async toggleLLMProvider(providerId: string, enabled: boolean) {
    return this.request(`/v9/llm/providers/${providerId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  async updateLLMProviderLimits(providerId: string, limits: { dailyLimit?: number; monthlyLimit?: number }) {
    return this.request(`/v9/llm/providers/${providerId}/limits`, {
      method: 'PUT',
      body: JSON.stringify(limits),
    });
  }

  async getLLMModels() {
    return this.request('/v9/llm/models');
  }

  async getLLMUsageAnalytics() {
    return this.request('/v9/llm/usage/analytics');
  }

  // Orchestration
  async executeOrchestration(request: any) {
    return this.request('/v9/orchestration/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getOrchestrationStatus(id: string) {
    return this.request(`/v9/orchestration/status/${id}`);
  }

  async getOrchestrationHistory() {
    return this.request('/v9/orchestration/history');
  }

  // System Health & Metrics
  async getSystemHealth() {
    const response = await this.request<{success: boolean; data: any}>('/health/v9');
    return response.data;
  }

  async getSystemStatus() {
    const response = await this.request<{success: boolean; data: any}>('/health/v9');
    return {
      status: response.data.systemHealth || 'unknown',
      uptime: response.data.uptime || 0,
      activeAgents: response.data.activeAgents || 0,
      llmProviders: response.data.llmProviders || 0,
    };
  }

  async getSystemMetrics() {
    const response = await this.request<{success: boolean; data: any}>('/health/v9');
    return {
      performance: {
        averageResponseTime: response.data.responseTime || 0,
        totalRequests: response.data.requestCount || 0,
        successRate: (response.data.successRate || 0) / 100,
      },
      resources: {
        cpuUsage: response.data.cpuUsage?.current || 0,
        memoryUsage: response.data.memoryUsage?.percentage || 0,
        networkUsage: response.data.networkLatency || 0,
      },
      orchestration: {
        totalExecutions: response.data.requestCount || 0,
        successfulExecutions: Math.floor((response.data.requestCount || 0) * ((response.data.successRate || 0) / 100)),
        activeAgents: response.data.activeAgents || 0,
        llmProviders: response.data.llmProviders || 0,
      },
    };
  }

  async getCapabilities() {
    return this.request('/v9/capabilities');
  }

  // Core WAI SDK v9 endpoints
  async coreOrchestrate(request: any) {
    return this.request('/v9/core/orchestrate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async coreHealth() {
    return this.request('/v9/core/health');
  }

  async coreMetrics() {
    return this.request('/v9/core/metrics');
  }

  async coreCapabilities() {
    return this.request('/v9/core/capabilities');
  }

  async coreVersion() {
    return this.request('/v9/core/version');
  }

  // Enterprise Features
  async getEnterpriseAnalytics() {
    return this.request('/v9/enterprise/analytics');
  }

  async deployEnterprise(config: any) {
    return this.request('/v9/enterprise/deploy', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getComplianceStatus() {
    return this.request('/v9/enterprise/compliance');
  }

  // Integrations
  async getAvailableIntegrations() {
    return this.request('/v9/integrations/available');
  }

  async enableIntegration(name: string, config: any) {
    return this.request(`/v9/integrations/${name}/enable`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getIntegrationsStatus() {
    return this.request('/v9/integrations/status');
  }
}

// Default client instance with environment-aware configuration
export const waiSDKClient = new WAISDKClient();