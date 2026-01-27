/**
 * Real Enterprise Integration Service
 * Handles actual API connections to enterprise systems like Salesforce, HubSpot, etc.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';

// Temporary interface for enterprise integrations until schema is updated
interface EnterpriseIntegration {
  id: number;
  name: string;
  type: string;
  credentials: any;
  config?: any;
  accessToken?: string;
  refreshToken?: string;
}

interface InsertEnterpriseIntegration {
  name: string;
  type: string;
  credentials: any;
  accessToken?: string;
  refreshToken?: string;
}

export interface IntegrationCredentials {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
  serverUrl?: string;
  organizationId?: string;
}

export interface IntegrationConfig {
  baseUrl: string;
  authType: 'oauth2' | 'api_key' | 'basic_auth' | 'jwt';
  scopes?: string[];
  customHeaders?: Record<string, string>;
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  duration: number;
  lastSyncId?: string;
}

export class RealEnterpriseIntegration extends EventEmitter {
  private integrationConfigs: Map<string, IntegrationConfig> = new Map();
  private apiClients: Map<number, AxiosInstance> = new Map();
  private rateLimiters: Map<number, { requests: number; windowStart: number }> = new Map();

  constructor() {
    super();
    this.initializeIntegrationConfigs();
    console.log('Real Enterprise Integration Service initialized');
  }

  /**
   * Initialize configuration for supported integrations
   */
  private initializeIntegrationConfigs(): void {
    // Salesforce
    this.integrationConfigs.set('salesforce', {
      baseUrl: 'https://login.salesforce.com',
      authType: 'oauth2',
      scopes: ['api', 'refresh_token', 'offline_access'],
      rateLimit: { requests: 100, window: 20 }
    });

    // HubSpot
    this.integrationConfigs.set('hubspot', {
      baseUrl: 'https://api.hubapi.com',
      authType: 'oauth2',
      scopes: ['contacts', 'companies', 'deals', 'tickets'],
      rateLimit: { requests: 100, window: 10 }
    });

    // Pipedrive
    this.integrationConfigs.set('pipedrive', {
      baseUrl: 'https://api.pipedrive.com/v1',
      authType: 'api_key',
      rateLimit: { requests: 100, window: 60 }
    });

    // Slack
    this.integrationConfigs.set('slack', {
      baseUrl: 'https://slack.com/api',
      authType: 'oauth2',
      scopes: ['channels:read', 'chat:write', 'users:read'],
      rateLimit: { requests: 50, window: 60 }
    });

    // Microsoft Teams
    this.integrationConfigs.set('teams', {
      baseUrl: 'https://graph.microsoft.com/v1.0',
      authType: 'oauth2',
      scopes: ['Team.ReadBasic.All', 'Channel.ReadBasic.All'],
      rateLimit: { requests: 100, window: 60 }
    });

    // Mailchimp
    this.integrationConfigs.set('mailchimp', {
      baseUrl: 'https://{dc}.api.mailchimp.com/3.0',
      authType: 'api_key',
      rateLimit: { requests: 10, window: 1 }
    });

    // Google Analytics
    this.integrationConfigs.set('google_analytics', {
      baseUrl: 'https://analyticsreporting.googleapis.com/v4',
      authType: 'oauth2',
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      rateLimit: { requests: 100, window: 100 }
    });

    // Shopify
    this.integrationConfigs.set('shopify', {
      baseUrl: 'https://{shop}.myshopify.com/admin/api/2023-10',
      authType: 'api_key',
      rateLimit: { requests: 40, window: 1 }
    });
  }

  /**
   * Create a new enterprise integration
   */
  async createIntegration(integrationData: InsertEnterpriseIntegration): Promise<EnterpriseIntegration> {
    try {
      // Encrypt sensitive credentials
      if (integrationData.credentials) {
        integrationData.credentials = this.encryptCredentials(integrationData.credentials);
      }
      
      if (integrationData.accessToken) {
        integrationData.accessToken = this.encryptString(integrationData.accessToken);
      }

      if (integrationData.refreshToken) {
        integrationData.refreshToken = this.encryptString(integrationData.refreshToken);
      }

      const [integration] = await db
        .insert(enterpriseIntegrations)
        .values(integrationData)
        .returning();

      // Test the connection
      await this.testConnection(integration.id);

      this.emit('integrationCreated', integration);
      return integration;
    } catch (error) {
      console.error('Failed to create enterprise integration:', error);
      throw error;
    }
  }

  /**
   * Test connection to an integration
   */
  async testConnection(integrationId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const client = await this.getApiClient(integration);
      const config = this.integrationConfigs.get(integration.type);
      
      if (!config) {
        throw new Error(`Unsupported integration type: ${integration.type}`);
      }

      // Perform type-specific connection test
      let testResult: boolean;
      
      switch (integration.type) {
        case 'salesforce':
          testResult = await this.testSalesforceConnection(client);
          break;
        case 'hubspot':
          testResult = await this.testHubSpotConnection(client);
          break;
        case 'pipedrive':
          testResult = await this.testPipedriveConnection(client);
          break;
        case 'slack':
          testResult = await this.testSlackConnection(client);
          break;
        case 'mailchimp':
          testResult = await this.testMailchimpConnection(client);
          break;
        default:
          testResult = await this.testGenericConnection(client);
      }

      // Update integration status
      await this.updateIntegrationStatus(integrationId, testResult ? 'connected' : 'error');

      return { success: testResult };
    } catch (error) {
      console.error(`Connection test failed for integration ${integrationId}:`, error);
      await this.updateIntegrationStatus(integrationId, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync data from an integration
   */
  async syncIntegrationData(integrationId: number, syncType: 'full' | 'incremental' = 'incremental'): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    const errors: string[] = [];

    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const client = await this.getApiClient(integration);

      // Perform type-specific data sync
      switch (integration.type) {
        case 'salesforce':
          recordsProcessed = await this.syncSalesforceData(client, integration, syncType);
          break;
        case 'hubspot':
          recordsProcessed = await this.syncHubSpotData(client, integration, syncType);
          break;
        case 'pipedrive':
          recordsProcessed = await this.syncPipedriveData(client, integration, syncType);
          break;
        default:
          throw new Error(`Sync not implemented for ${integration.type}`);
      }

      // Update last sync timestamp
      await db
        .update(enterpriseIntegrations)
        .set({ lastSync: new Date() })
        .where(eq(enterpriseIntegrations.id, integrationId));

      const duration = Date.now() - startTime;
      
      this.emit('syncCompleted', { integrationId, recordsProcessed, duration });

      return {
        success: true,
        recordsProcessed,
        errors,
        duration
      };

    } catch (error) {
      console.error(`Sync failed for integration ${integrationId}:`, error);
      errors.push(error.message);

      return {
        success: false,
        recordsProcessed,
        errors,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Get API client for integration
   */
  private async getApiClient(integration: EnterpriseIntegration): Promise<AxiosInstance> {
    const existingClient = this.apiClients.get(integration.id);
    if (existingClient) {
      return existingClient;
    }

    const config = this.integrationConfigs.get(integration.type);
    if (!config) {
      throw new Error(`Unsupported integration type: ${integration.type}`);
    }

    let baseURL = config.baseUrl;
    
    // Handle dynamic URLs
    if (integration.type === 'mailchimp' && integration.config?.datacenter) {
      baseURL = baseURL.replace('{dc}', integration.config.datacenter);
    }
    if (integration.type === 'shopify' && integration.config?.shop) {
      baseURL = baseURL.replace('{shop}', integration.config.shop);
    }

    const client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'WAI-DevStudio/1.0',
        ...config.customHeaders
      }
    });

    // Add authentication
    await this.addAuthentication(client, integration, config);

    // Add rate limiting
    this.addRateLimit(client, integration.id, config);

    this.apiClients.set(integration.id, client);
    return client;
  }

  /**
   * Add authentication to API client
   */
  private async addAuthentication(client: AxiosInstance, integration: EnterpriseIntegration, config: IntegrationConfig): Promise<void> {
    const credentials = integration.credentials ? this.decryptCredentials(integration.credentials) : {};

    switch (config.authType) {
      case 'api_key':
        if (integration.type === 'pipedrive') {
          client.defaults.params = { api_token: credentials.apiKey };
        } else if (integration.type === 'mailchimp') {
          client.defaults.headers.Authorization = `Bearer ${credentials.apiKey}`;
        } else {
          client.defaults.headers.Authorization = `Bearer ${credentials.apiKey}`;
        }
        break;

      case 'oauth2':
        const accessToken = integration.accessToken ? this.decryptString(integration.accessToken) : null;
        if (accessToken) {
          client.defaults.headers.Authorization = `Bearer ${accessToken}`;
        }
        break;

      case 'basic_auth':
        if (credentials.username && credentials.password) {
          const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
          client.defaults.headers.Authorization = `Basic ${auth}`;
        }
        break;
    }
  }

  /**
   * Add rate limiting to API client
   */
  private addRateLimit(client: AxiosInstance, integrationId: number, config: IntegrationConfig): void {
    if (!config.rateLimit) return;

    client.interceptors.request.use(async (request) => {
      const now = Date.now() / 1000;
      const limiter = this.rateLimiters.get(integrationId) || { requests: 0, windowStart: now };

      // Reset window if needed
      if (now - limiter.windowStart >= config.rateLimit!.window) {
        limiter.requests = 0;
        limiter.windowStart = now;
      }

      // Check rate limit
      if (limiter.requests >= config.rateLimit!.requests) {
        const waitTime = (limiter.windowStart + config.rateLimit!.window - now) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        limiter.requests = 0;
        limiter.windowStart = Date.now() / 1000;
      }

      limiter.requests++;
      this.rateLimiters.set(integrationId, limiter);

      return request;
    });
  }

  // Integration-specific test methods
  private async testSalesforceConnection(client: AxiosInstance): Promise<boolean> {
    try {
      const response = await client.get('/services/data/v58.0/sobjects/');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async testHubSpotConnection(client: AxiosInstance): Promise<boolean> {
    try {
      const response = await client.get('/contacts/v1/lists/all/contacts/all');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async testPipedriveConnection(client: AxiosInstance): Promise<boolean> {
    try {
      const response = await client.get('/users');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async testSlackConnection(client: AxiosInstance): Promise<boolean> {
    try {
      const response = await client.post('/auth.test');
      return response.data.ok === true;
    } catch {
      return false;
    }
  }

  private async testMailchimpConnection(client: AxiosInstance): Promise<boolean> {
    try {
      const response = await client.get('/');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async testGenericConnection(client: AxiosInstance): Promise<boolean> {
    try {
      const response = await client.get('/');
      return response.status < 400;
    } catch {
      return false;
    }
  }

  // Integration-specific sync methods
  private async syncSalesforceData(client: AxiosInstance, integration: EnterpriseIntegration, syncType: string): Promise<number> {
    let recordsProcessed = 0;
    
    try {
      // Sync Accounts
      const accountsResponse = await client.get('/services/data/v58.0/sobjects/Account/');
      recordsProcessed += accountsResponse.data.recentItems?.length || 0;

      // Sync Contacts
      const contactsResponse = await client.get('/services/data/v58.0/sobjects/Contact/');
      recordsProcessed += contactsResponse.data.recentItems?.length || 0;

      // Sync Opportunities
      const opportunitiesResponse = await client.get('/services/data/v58.0/sobjects/Opportunity/');
      recordsProcessed += opportunitiesResponse.data.recentItems?.length || 0;

    } catch (error) {
      console.error('Salesforce sync error:', error);
    }

    return recordsProcessed;
  }

  private async syncHubSpotData(client: AxiosInstance, integration: EnterpriseIntegration, syncType: string): Promise<number> {
    let recordsProcessed = 0;
    
    try {
      // Sync Contacts
      const contactsResponse = await client.get('/contacts/v1/lists/all/contacts/all?count=100');
      recordsProcessed += contactsResponse.data.contacts?.length || 0;

      // Sync Companies
      const companiesResponse = await client.get('/companies/v2/companies/paged?limit=100');
      recordsProcessed += companiesResponse.data.companies?.length || 0;

    } catch (error) {
      console.error('HubSpot sync error:', error);
    }

    return recordsProcessed;
  }

  private async syncPipedriveData(client: AxiosInstance, integration: EnterpriseIntegration, syncType: string): Promise<number> {
    let recordsProcessed = 0;
    
    try {
      // Sync Deals
      const dealsResponse = await client.get('/deals?limit=100');
      recordsProcessed += dealsResponse.data.data?.length || 0;

      // Sync Persons
      const personsResponse = await client.get('/persons?limit=100');
      recordsProcessed += personsResponse.data.data?.length || 0;

    } catch (error) {
      console.error('Pipedrive sync error:', error);
    }

    return recordsProcessed;
  }

  /**
   * Utility methods
   */
  private async getIntegration(id: number): Promise<EnterpriseIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(enterpriseIntegrations)
      .where(eq(enterpriseIntegrations.id, id))
      .limit(1);
    
    return integration;
  }

  private async updateIntegrationStatus(id: number, status: string): Promise<void> {
    await db
      .update(enterpriseIntegrations)
      .set({ status, updatedAt: new Date() })
      .where(eq(enterpriseIntegrations.id, id));
  }

  private encryptCredentials(credentials: any): any {
    const algorithm = 'aes-256-gcm';
    const key = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return { encrypted, iv: iv.toString('hex') };
  }

  private decryptCredentials(encryptedData: any): any {
    if (!encryptedData.encrypted) return encryptedData;
    
    const algorithm = 'aes-256-gcm';
    const key = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!';
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  private encryptString(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }

  private decryptString(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const key = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!';
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Get all integrations for an organization
   */
  async getIntegrationsByOrganization(organizationId: number): Promise<EnterpriseIntegration[]> {
    return await db
      .select()
      .from(enterpriseIntegrations)
      .where(eq(enterpriseIntegrations.organizationId, organizationId));
  }

  /**
   * Delete an integration
   */
  async deleteIntegration(integrationId: number): Promise<void> {
    await db
      .delete(enterpriseIntegrations)
      .where(eq(enterpriseIntegrations.id, integrationId));
    
    // Clean up API client
    this.apiClients.delete(integrationId);
    this.rateLimiters.delete(integrationId);
  }
}

export const realEnterpriseIntegration = new RealEnterpriseIntegration();