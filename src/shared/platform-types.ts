/**
 * Platform Types for WAI DevStudio Specialized Platforms
 */

export interface PlatformCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'development' | 'gaming' | 'creative' | 'conversation' | 'business';
  status: 'ready' | 'testing' | 'development';
  url: string;
  features: string[];
  targetUsers: string[];
  screenshots: string[];
  demoUrl: string;
  launchAction: 'embedded' | 'new-tab' | 'modal';
}

export interface PlatformAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'maintenance';
  platform: string[];
}

export interface PlatformTool {
  id: string;
  name: string;
  description: string;
  category: string;
  platform: string[];
  apiEndpoint: string;
  parameters: Record<string, string>;
}

export interface PlatformMetrics {
  platform: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  usage: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
  };
  agents: {
    mostUsed: string[];
    performance: Record<string, number>;
  };
  costs: {
    total: number;
    breakdown: Record<string, number>;
  };
}

export interface AgentExecutionResponse {
  id: string;
  agentId: string;
  response: string;
  metadata: {
    tokensUsed: number;
    processingTime: number;
    model: string;
  };
  timestamp: Date;
}