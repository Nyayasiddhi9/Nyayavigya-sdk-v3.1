import { apiRequest } from '@/lib/queryClient';

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
}

export interface ToolCall {
  tool: string;
  params: Record<string, any>;
  result?: string;
}

export interface OrchestrationRequest {
  prompt: string;
  userId?: string;
  sessionId?: string;
  enabledTools?: string[];
  modelPreference?: string;
  multiModal?: {
    images?: string[];
    voice?: string;
    files?: string[];
  };
}

export interface OrchestrationResponse {
  response: string;
  toolsUsed: ToolCall[];
  modelUsed: string;
  tokensUsed: number;
  executionTime: number;
}

/**
 * Send a chat message to WAI SDK orchestration
 */
export async function sendChatMessage(
  request: OrchestrationRequest
): Promise<OrchestrationResponse> {
  const response = await apiRequest<OrchestrationResponse>(
    '/api/orchestration/chat',
    {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
}

/**
 * Get available tools from MCP server
 */
export async function getAvailableTools(): Promise<any[]> {
  const response = await apiRequest<any>('/api/tools/list', {
    method: 'GET',
  });
  return response.tools || [];
}

/**
 * Execute code in sandboxed environment
 */
export async function executeCode(code: string, language: string = 'javascript'): Promise<{
  output: string;
  error?: string;
}> {
  const response = await apiRequest<any>('/api/tools/execute-code', {
    method: 'POST',
    body: JSON.stringify({ code, language }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}

/**
 * Save workflow definition
 */
export async function saveWorkflow(workflow: any): Promise<{ id: string }> {
  const response = await apiRequest<any>('/api/workflows/save', {
    method: 'POST',
    body: JSON.stringify(workflow),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}

/**
 * Execute workflow
 */
export async function executeWorkflow(workflowId: string, inputs: any): Promise<any> {
  const response = await apiRequest<any>(`/api/workflows/execute/${workflowId}`, {
    method: 'POST',
    body: JSON.stringify({ inputs }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}

/**
 * Get user's API key configuration
 */
export async function getApiKeyConfig(): Promise<Record<string, boolean>> {
  const response = await apiRequest<any>('/api/settings/api-keys', {
    method: 'GET',
  });
  return response.configured || {};
}

/**
 * Save user's API key configuration
 */
export async function saveApiKeyConfig(keys: Record<string, string>): Promise<void> {
  await apiRequest('/api/settings/api-keys', {
    method: 'POST',
    body: JSON.stringify({ keys }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Conduct deep research with WAI SDK
 */
export async function conductDeepResearch(params: {
  query: string;
  userId: string;
  sessionId: string;
}): Promise<{
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }>;
  modelUsed: string;
  tokensUsed: number;
  executionTime: number;
}> {
  const response = await apiRequest<any>('/api/research/deep', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}

/**
 * Generate contextual follow-up suggestions with WAI SDK
 */
export async function generateFollowUpSuggestions(params: {
  conversationHistory: Array<{ role: string; content: string }>;
  lastMessage: string;
}): Promise<{
  suggestions: string[];
  modelUsed: string;
  executionTime: number;
}> {
  const response = await apiRequest<any>('/api/chat/followups', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
}
