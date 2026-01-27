/**
 * API Gateway
 * Client management, API key generation, rate limiting, documentation
 */

import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';

export interface APIClient {
  id: string;
  name: string;
  apiKey: string;
  secretHash: string;
  permissions: string[];
  rateLimit: { rpm: number; tpm: number };
  ipWhitelist: string[];
  quotas: { daily: number; monthly: number };
  usage: { daily: number; monthly: number };
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date | null;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  category: string;
  rateLimit: number;
  requiresAuth: boolean;
  permissions: string[];
}

export class APIGateway extends EventEmitter {
  private static instance: APIGateway;
  private clients: Map<string, APIClient> = new Map();
  private endpoints: APIEndpoint[] = [];

  private constructor() {
    super();
    this.initializeEndpoints();
    console.log('🌐 APIGateway initialized');
  }

  public static getInstance(): APIGateway {
    if (!APIGateway.instance) {
      APIGateway.instance = new APIGateway();
    }
    return APIGateway.instance;
  }

  private initializeEndpoints(): void {
    this.endpoints = [
      { path: '/api/v9/agents', method: 'GET', description: 'List all agents', category: 'agents', rateLimit: 100, requiresAuth: true, permissions: ['agents:read'] },
      { path: '/api/v9/agents/:id', method: 'GET', description: 'Get agent details', category: 'agents', rateLimit: 100, requiresAuth: true, permissions: ['agents:read'] },
      { path: '/api/v9/agents/:id/execute', method: 'POST', description: 'Execute agent task', category: 'agents', rateLimit: 50, requiresAuth: true, permissions: ['agents:execute'] },
      { path: '/api/v9/orchestrate', method: 'POST', description: 'Multi-agent orchestration', category: 'orchestration', rateLimit: 30, requiresAuth: true, permissions: ['orchestration:execute'] },
      { path: '/api/v9/providers', method: 'GET', description: 'List LLM providers', category: 'providers', rateLimit: 100, requiresAuth: true, permissions: ['providers:read'] },
      { path: '/api/v9/providers/:id/health', method: 'GET', description: 'Check provider health', category: 'providers', rateLimit: 60, requiresAuth: true, permissions: ['providers:read'] },
      { path: '/api/v9/tools', method: 'GET', description: 'List MCP tools', category: 'tools', rateLimit: 100, requiresAuth: true, permissions: ['tools:read'] },
      { path: '/api/v9/tools/:id/execute', method: 'POST', description: 'Execute MCP tool', category: 'tools', rateLimit: 50, requiresAuth: true, permissions: ['tools:execute'] },
      { path: '/api/v9/memory/store', method: 'POST', description: 'Store memory', category: 'memory', rateLimit: 100, requiresAuth: true, permissions: ['memory:write'] },
      { path: '/api/v9/memory/recall', method: 'POST', description: 'Recall memory', category: 'memory', rateLimit: 100, requiresAuth: true, permissions: ['memory:read'] },
      { path: '/api/v9/chat', method: 'POST', description: 'Universal chat', category: 'chat', rateLimit: 60, requiresAuth: true, permissions: ['chat:execute'] },
      { path: '/api/v9/chat/stream', method: 'POST', description: 'Streaming chat', category: 'chat', rateLimit: 60, requiresAuth: true, permissions: ['chat:execute'] },
      { path: '/api/v9/admin/stats', method: 'GET', description: 'Admin statistics', category: 'admin', rateLimit: 30, requiresAuth: true, permissions: ['admin:read'] },
      { path: '/api/v9/admin/health', method: 'GET', description: 'System health', category: 'admin', rateLimit: 60, requiresAuth: true, permissions: ['admin:read'] }
    ];
  }

  public async createClient(name: string, permissions: string[] = []): Promise<APIClient> {
    const id = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const apiKey = `wai_${randomBytes(32).toString('hex')}`;
    const secretHash = randomBytes(32).toString('hex');

    const client: APIClient = {
      id,
      name,
      apiKey,
      secretHash,
      permissions: permissions.length > 0 ? permissions : ['agents:read', 'agents:execute', 'chat:execute'],
      rateLimit: { rpm: 100, tpm: 100000 },
      ipWhitelist: [],
      quotas: { daily: 10000, monthly: 300000 },
      usage: { daily: 0, monthly: 0 },
      isActive: true,
      createdAt: new Date(),
      lastUsed: null
    };

    this.clients.set(id, client);
    this.emit('client-created', { id, name });
    
    return client;
  }

  public async getClient(id: string): Promise<APIClient | null> {
    return this.clients.get(id) || null;
  }

  public async getClientByApiKey(apiKey: string): Promise<APIClient | null> {
    return Array.from(this.clients.values()).find(c => c.apiKey === apiKey) || null;
  }

  public async getAllClients(): Promise<APIClient[]> {
    return Array.from(this.clients.values());
  }

  public async updateClient(id: string, updates: Partial<APIClient>): Promise<APIClient | null> {
    const client = this.clients.get(id);
    if (!client) return null;

    Object.assign(client, updates);
    this.emit('client-updated', { id, updates });
    
    return client;
  }

  public async revokeClient(id: string): Promise<boolean> {
    const client = this.clients.get(id);
    if (!client) return false;

    client.isActive = false;
    this.emit('client-revoked', id);
    
    return true;
  }

  public async regenerateApiKey(id: string): Promise<string | null> {
    const client = this.clients.get(id);
    if (!client) return null;

    const newApiKey = `wai_${randomBytes(32).toString('hex')}`;
    client.apiKey = newApiKey;
    
    this.emit('api-key-regenerated', id);
    
    return newApiKey;
  }

  public async validateRequest(apiKey: string, path: string, method: string): Promise<{
    valid: boolean;
    client?: APIClient;
    error?: string;
  }> {
    const client = await this.getClientByApiKey(apiKey);
    
    if (!client) {
      return { valid: false, error: 'Invalid API key' };
    }
    
    if (!client.isActive) {
      return { valid: false, error: 'Client is revoked' };
    }

    const endpoint = this.endpoints.find(e => 
      this.matchPath(path, e.path) && e.method === method
    );

    if (endpoint && endpoint.requiresAuth) {
      const hasPermission = endpoint.permissions.some(p => client.permissions.includes(p));
      if (!hasPermission) {
        return { valid: false, client, error: 'Insufficient permissions' };
      }
    }

    if (client.usage.daily >= client.quotas.daily) {
      return { valid: false, client, error: 'Daily quota exceeded' };
    }

    client.lastUsed = new Date();
    client.usage.daily++;
    client.usage.monthly++;

    return { valid: true, client };
  }

  private matchPath(requestPath: string, templatePath: string): boolean {
    const requestParts = requestPath.split('/');
    const templateParts = templatePath.split('/');

    if (requestParts.length !== templateParts.length) return false;

    return templateParts.every((part, i) => 
      part.startsWith(':') || part === requestParts[i]
    );
  }

  public async resetDailyUsage(): Promise<void> {
    for (const client of this.clients.values()) {
      client.usage.daily = 0;
    }
    this.emit('daily-usage-reset');
  }

  public async resetMonthlyUsage(): Promise<void> {
    for (const client of this.clients.values()) {
      client.usage.monthly = 0;
    }
    this.emit('monthly-usage-reset');
  }

  public getEndpoints(): APIEndpoint[] {
    return [...this.endpoints];
  }

  public getEndpointsByCategory(category: string): APIEndpoint[] {
    return this.endpoints.filter(e => e.category === category);
  }

  public generateOpenAPISpec(): object {
    return {
      openapi: '3.0.0',
      info: {
        title: 'WAI SDK API',
        version: '1.0.0',
        description: 'WAI SDK v1.0 REST API'
      },
      paths: this.endpoints.reduce((acc, endpoint) => {
        const path = endpoint.path.replace(/:(\w+)/g, '{$1}');
        if (!acc[path]) acc[path] = {};
        acc[path][endpoint.method.toLowerCase()] = {
          summary: endpoint.description,
          tags: [endpoint.category],
          security: endpoint.requiresAuth ? [{ ApiKeyAuth: [] }] : [],
          responses: {
            '200': { description: 'Success' },
            '401': { description: 'Unauthorized' },
            '429': { description: 'Rate limit exceeded' }
          }
        };
        return acc;
      }, {} as Record<string, unknown>),
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        }
      }
    };
  }

  public getStats(): {
    totalClients: number;
    activeClients: number;
    totalEndpoints: number;
    categories: string[];
  } {
    const clients = Array.from(this.clients.values());
    const categories = [...new Set(this.endpoints.map(e => e.category))];

    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.isActive).length,
      totalEndpoints: this.endpoints.length,
      categories
    };
  }
}

export const apiGateway = APIGateway.getInstance();
export default APIGateway;
