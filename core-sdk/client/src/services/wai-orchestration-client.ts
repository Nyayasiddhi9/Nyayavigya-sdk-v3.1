/**
 * WAI Orchestration Client
 * Frontend integration for unified AI orchestration across all platforms
 */

interface WAIOrchestrationRequest {
  task: string;
  platformId?: string;
  taskType?: 'development' | 'creative' | 'business' | 'research' | 'support' | 'specialized';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  enhancedMode?: boolean;
  budget?: 'cost-effective' | 'balanced' | 'quality' | 'premium';
  userContext?: Record<string, any>;
  domainKnowledge?: string[];
}

interface WAIOrchestrationResponse {
  success: boolean;
  result: string;
  agentUsed: {
    id: string;
    name: string;
    role: string;
    expertise: string[];
  };
  llmUsed: string;
  executionTime: number;
  confidence: number;
  qualityScore: number;
  cost: number;
  reasoning: string;
  platformAnalytics: {
    costUsed: number;
    qualityScore: number;
    executionTime: number;
    agentUsed: string;
  };
  enhancedFeatures?: {
    contextEngineering?: any;
    systemPrompts?: any;
    notebookAnalysis?: any;
    automationRules?: any;
    designVariations?: any;
    integrationStats: Record<string, boolean>;
  };
}

interface PlatformAnalytics {
  platformId: string;
  totalRequests: number;
  successRate: number;
  averageCost: number;
  averageQuality: number;
  averageExecutionTime: number;
  topAgents: Array<{ agentId: string; usage: number }>;
  costTrend: Array<{ date: string; cost: number }>;
  qualityTrend: Array<{ date: string; quality: number }>;
}

export class WAIOrchestrationClient {
  private baseUrl: string;
  private platformId: string;

  constructor(baseUrl: string = '/api', platformId: string = 'software-development') {
    this.baseUrl = baseUrl;
    this.platformId = platformId;
  }

  /**
   * Process AI task with unified orchestration
   */
  async processTask(request: WAIOrchestrationRequest): Promise<WAIOrchestrationResponse> {
    const response = await fetch(`${this.baseUrl}/wai/orchestration/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-ID': request.platformId || this.platformId,
        'X-Enhanced-Mode': request.enhancedMode ? 'true' : 'false',
        'X-Priority': request.priority || 'medium',
        'X-Budget': request.budget || 'balanced'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`WAI Orchestration failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Platform-specific processing methods
   */

  // Software Development
  async processCodeTask(task: string, options: Partial<WAIOrchestrationRequest> = {}) {
    return this.processTask({
      task,
      platformId: 'software-development',
      taskType: 'development',
      enhancedMode: true,
      ...options
    });
  }

  // AI Assistant Builder
  async processAssistantTask(task: string, options: Partial<WAIOrchestrationRequest> = {}) {
    return this.processTask({
      task,
      platformId: 'ai-assistant-builder',
      taskType: 'specialized',
      enhancedMode: true,
      ...options
    });
  }

  // Content Studio
  async processContentTask(task: string, options: Partial<WAIOrchestrationRequest> = {}) {
    return this.processTask({
      task,
      platformId: 'content-studio',
      taskType: 'creative',
      enhancedMode: true,
      ...options
    });
  }

  // Game Builder
  async processGameTask(task: string, options: Partial<WAIOrchestrationRequest> = {}) {
    return this.processTask({
      task,
      platformId: 'game-builder',
      taskType: 'creative',
      enhancedMode: true,
      ...options
    });
  }

  // Enterprise Solutions
  async processEnterpriseTask(task: string, options: Partial<WAIOrchestrationRequest> = {}) {
    return this.processTask({
      task,
      platformId: 'enterprise-solutions',
      taskType: 'business',
      enhancedMode: true,
      ...options
    });
  }

  /**
   * Analytics and monitoring methods
   */

  async getPlatformAnalytics(platformId?: string): Promise<PlatformAnalytics> {
    const response = await fetch(`${this.baseUrl}/wai/analytics/${platformId || this.platformId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
  }

  async getAllPlatformAnalytics(): Promise<Record<string, PlatformAnalytics>> {
    const response = await fetch(`${this.baseUrl}/wai/analytics`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch all analytics: ${response.statusText}`);
    }

    return response.json();
  }

  async getSystemStatus() {
    const response = await fetch(`${this.baseUrl}/wai/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch system status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Agent and provider management
   */

  async getAvailableAgents(category?: string) {
    const url = category 
      ? `${this.baseUrl}/wai/agents?category=${category}`
      : `${this.baseUrl}/wai/agents`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.statusText}`);
    }

    return response.json();
  }

  async getLLMProviders() {
    const response = await fetch(`${this.baseUrl}/wai/providers`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch LLM providers: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Enhanced orchestration features
   */

  async createDesignCanvas(name: string, options?: any) {
    const response = await fetch(`${this.baseUrl}/wai/design/canvas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, options })
    });

    if (!response.ok) {
      throw new Error(`Failed to create design canvas: ${response.statusText}`);
    }

    return response.json();
  }

  async generateDesign(canvasId: string, prompt: string, options?: any) {
    const response = await fetch(`${this.baseUrl}/wai/design/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasId, prompt, options })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate design: ${response.statusText}`);
    }

    return response.json();
  }

  async createNotebookSession(name: string, aiProvider = 'anthropic', options?: any) {
    const response = await fetch(`${this.baseUrl}/wai/notebook/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, aiProvider, options })
    });

    if (!response.ok) {
      throw new Error(`Failed to create notebook session: ${response.statusText}`);
    }

    return response.json();
  }

  async createAutomationRule(description: string, options?: any) {
    const response = await fetch(`${this.baseUrl}/wai/automation/rule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, options })
    });

    if (!response.ok) {
      throw new Error(`Failed to create automation rule: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cost optimization and budget management
   */

  async setCostBudget(budget: 'cost-effective' | 'balanced' | 'quality' | 'premium') {
    const response = await fetch(`${this.baseUrl}/wai/config/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget })
    });

    if (!response.ok) {
      throw new Error(`Failed to set budget: ${response.statusText}`);
    }

    return response.json();
  }

  async getCostAnalytics(timeRange = '24h') {
    const response = await fetch(`${this.baseUrl}/wai/analytics/cost?range=${timeRange}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cost analytics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Real-time features
   */

  createWebSocketConnection() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/wai/ws`;
    return new WebSocket(wsUrl);
  }

  subscribeToAnalytics(callback: (data: any) => void) {
    const ws = this.createWebSocketConnection();
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'analytics') {
        callback(data.payload);
      }
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ 
        type: 'subscribe', 
        channel: 'analytics',
        platformId: this.platformId
      }));
    };

    return ws;
  }

  subscribeToAgentStatus(callback: (data: any) => void) {
    const ws = this.createWebSocketConnection();
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'agent-status') {
        callback(data.payload);
      }
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ 
        type: 'subscribe', 
        channel: 'agent-status',
        platformId: this.platformId
      }));
    };

    return ws;
  }
}

// Export singleton instances for each platform
export const softwareDevelopmentWAI = new WAIOrchestrationClient('/api', 'software-development');
export const aiAssistantBuilderWAI = new WAIOrchestrationClient('/api', 'ai-assistant-builder');
export const contentStudioWAI = new WAIOrchestrationClient('/api', 'content-studio');
export const gameBuilderWAI = new WAIOrchestrationClient('/api', 'game-builder');
export const enterpriseSolutionsWAI = new WAIOrchestrationClient('/api', 'enterprise-solutions');

// Export default client
export const waiOrchestrationClient = new WAIOrchestrationClient();